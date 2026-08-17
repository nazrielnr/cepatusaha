-- Migration: Add Function Calling Tables and Functions
-- This migration adds tables and PostgreSQL functions needed for function calling features
-- Requirements: 3.1-3.4, 6.1, 6.2, 8.2-8.4, 10.1-10.7, 11.1-11.6, 12.1-12.3, 15.1-15.14, 16.1-16.14, 17.1-17.12

-- ============================================================================
-- FILE_VERSIONS TABLE
-- Stores version history for files to support undo/redo and conflict detection
-- ============================================================================
create table if not exists file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  version_number integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  created_by varchar(20) not null check (created_by in ('user', 'ai')),
  checkpoint_id uuid,
  content_hash text not null,
  constraint unique_file_version unique (file_id, version_number)
);

create index if not exists idx_file_versions_file_id on file_versions(file_id);
create index if not exists idx_file_versions_checkpoint_id on file_versions(checkpoint_id);
create index if not exists idx_file_versions_created_at on file_versions(created_at desc);


drop policy if exists "Users can view versions of files from their own projects" on file_versions;

drop policy if exists "Service role can insert file versions" on file_versions;

-- ============================================================================
-- CHECKPOINTS TABLE
-- Stores project state snapshots for undo/redo functionality
-- ============================================================================
create table if not exists checkpoints (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  files_snapshot jsonb not null,
  preview_url text,
  thumbnail text,
  checkpoint_number integer not null,
  constraint unique_checkpoint_number unique (session_id, checkpoint_number)
);

create index if not exists idx_checkpoints_session_id on checkpoints(session_id);
create index if not exists idx_checkpoints_project_id on checkpoints(project_id);
create index if not exists idx_checkpoints_created_at on checkpoints(created_at desc);
create index if not exists idx_checkpoints_checkpoint_number on checkpoints(session_id, checkpoint_number);


drop policy if exists "Users can view checkpoints from their own sessions" on checkpoints;

drop policy if exists "Service role can insert checkpoints" on checkpoints;

-- Add foreign key constraint to file_versions after checkpoints table is created
alter table file_versions 
  add constraint fk_file_versions_checkpoint 
  foreign key (checkpoint_id) references checkpoints(id) on delete set null;

-- ============================================================================
-- FUNCTION_EXECUTION_LOGS TABLE
-- Tracks all function call executions for debugging and analytics
-- ============================================================================
create table if not exists function_execution_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  function_name varchar(100) not null,
  parameters jsonb not null,
  result jsonb,
  status varchar(20) not null check (status in ('success', 'error')),
  error_message text,
  executed_at timestamptz not null default now(),
  execution_time_ms integer
);

create index if not exists idx_function_execution_logs_session_id on function_execution_logs(session_id);
create index if not exists idx_function_execution_logs_project_id on function_execution_logs(project_id);
create index if not exists idx_function_execution_logs_function_name on function_execution_logs(function_name);
create index if not exists idx_function_execution_logs_status on function_execution_logs(status);
create index if not exists idx_function_execution_logs_executed_at on function_execution_logs(executed_at desc);




-- ============================================================================
-- UPDATE CHAT_MESSAGES TABLE
-- Add columns for storing tool calls and results
-- ============================================================================
alter table chat_messages add column if not exists tool_calls jsonb;
alter table chat_messages add column if not exists tool_results jsonb;

-- Add GIN index for efficient JSONB querying
create index if not exists idx_chat_messages_tool_calls on chat_messages using gin (tool_calls);
create index if not exists idx_chat_messages_tool_results on chat_messages using gin (tool_results);

-- ============================================================================
-- POSTGRESQL FUNCTION: delete_file_with_backup
-- Deletes a file after creating a backup in file_versions
-- ============================================================================
create or replace function delete_file_with_backup(
  p_file_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_file record;
  v_version_number integer;
  v_result jsonb;
begin
  -- Get the file and verify user access
  select f.* into v_file
  from files f
  join projects p on f.project_id = p.id
  where f.id = p_file_id and p.user_id = p_user_id;
  
  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'File not found or access denied'
    );
  end if;
  
  -- Get next version number
  select coalesce(max(version_number), 0) + 1 into v_version_number
  from file_versions
  where file_id = p_file_id;
  
  -- Create backup in file_versions
  insert into file_versions (
    file_id,
    version_number,
    content,
    created_by,
    content_hash
  ) values (
    p_file_id,
    v_version_number,
    v_file.content,
    'user',
    md5(v_file.content)
  );
  
  -- Delete the file
  delete from files where id = p_file_id;
  
  -- Return success with backup details
  return jsonb_build_object(
    'success', true,
    'message', 'File deleted successfully',
    'backup_version', v_version_number,
    'file_path', v_file.file_path
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- ============================================================================
-- POSTGRESQL FUNCTION: create_checkpoint
-- Creates a snapshot of all project files for undo/redo
-- ============================================================================
create or replace function create_checkpoint(
  p_session_id uuid,
  p_project_id uuid,
  p_preview_url text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_checkpoint_number integer;
  v_files_snapshot jsonb;
  v_checkpoint_id uuid;
begin
  -- Get next checkpoint number for this session
  select coalesce(max(checkpoint_number), 0) + 1 into v_checkpoint_number
  from checkpoints
  where session_id = p_session_id;
  
  -- Create snapshot of all project files
  select jsonb_agg(
    jsonb_build_object(
      'id', id,
      'file_path', file_path,
      'file_type', file_type,
      'content', content,
      'updated_at', updated_at
    )
  ) into v_files_snapshot
  from files
  where project_id = p_project_id;
  
  -- Insert checkpoint
  insert into checkpoints (
    session_id,
    project_id,
    checkpoint_number,
    files_snapshot,
    preview_url
  ) values (
    p_session_id,
    p_project_id,
    v_checkpoint_number,
    coalesce(v_files_snapshot, '[]'::jsonb),
    p_preview_url
  )
  returning id into v_checkpoint_id;
  
  -- Clean up old checkpoints (keep last 20)
  delete from checkpoints
  where session_id = p_session_id
    and checkpoint_number <= v_checkpoint_number - 20;
  
  return jsonb_build_object(
    'success', true,
    'checkpoint_id', v_checkpoint_id,
    'checkpoint_number', v_checkpoint_number,
    'files_count', jsonb_array_length(coalesce(v_files_snapshot, '[]'::jsonb))
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- ============================================================================
-- POSTGRESQL FUNCTION: restore_checkpoint
-- Restores project files from a checkpoint snapshot
-- ============================================================================
create or replace function restore_checkpoint(
  p_checkpoint_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_checkpoint record;
  v_file jsonb;
  v_restored_count integer := 0;
begin
  -- Get checkpoint and verify user access
  select c.* into v_checkpoint
  from checkpoints c
  join sessions s on c.session_id = s.id
  where c.id = p_checkpoint_id and s.user_id = p_user_id;
  
  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Checkpoint not found or access denied'
    );
  end if;
  
  -- Delete current project files
  delete from files where project_id = v_checkpoint.project_id;
  
  -- Restore files from snapshot
  for v_file in select * from jsonb_array_elements(v_checkpoint.files_snapshot)
  loop
    insert into files (
      project_id,
      session_id,
      file_path,
      file_type,
      content,
      updated_at
    ) values (
      v_checkpoint.project_id,
      v_checkpoint.session_id,
      v_file->>'file_path',
      v_file->>'file_type',
      v_file->>'content',
      (v_file->>'updated_at')::timestamptz
    );
    
    v_restored_count := v_restored_count + 1;
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'message', 'Checkpoint restored successfully',
    'files_restored', v_restored_count,
    'checkpoint_number', v_checkpoint.checkpoint_number
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- ============================================================================
-- POSTGRESQL FUNCTION: calculate_code_diff
-- Calculates line-by-line diff between old and new content
-- ============================================================================
create or replace function calculate_code_diff(
  p_old_content text,
  p_new_content text
)
returns jsonb
language plpgsql
as $$
declare
  v_old_lines text[];
  v_new_lines text[];
  v_old_line_count integer;
  v_new_line_count integer;
  v_lines_added integer := 0;
  v_lines_deleted integer := 0;
  v_lines_modified integer := 0;
  v_diff jsonb := '[]'::jsonb;
  v_i integer;
  v_max_lines integer;
begin
  -- Split content into lines
  v_old_lines := string_to_array(p_old_content, E'\n');
  v_new_lines := string_to_array(p_new_content, E'\n');
  
  v_old_line_count := array_length(v_old_lines, 1);
  v_new_line_count := array_length(v_new_lines, 1);
  
  -- Simple line-by-line comparison
  v_max_lines := greatest(
    coalesce(v_old_line_count, 0),
    coalesce(v_new_line_count, 0)
  );
  
  for v_i in 1..v_max_lines loop
    if v_i <= coalesce(v_old_line_count, 0) and v_i <= coalesce(v_new_line_count, 0) then
      -- Both lines exist
      if v_old_lines[v_i] != v_new_lines[v_i] then
        v_lines_modified := v_lines_modified + 1;
        v_diff := v_diff || jsonb_build_object(
          'type', 'modified',
          'line_number', v_i,
          'old_content', v_old_lines[v_i],
          'new_content', v_new_lines[v_i]
        );
      end if;
    elsif v_i <= coalesce(v_new_line_count, 0) then
      -- New line added
      v_lines_added := v_lines_added + 1;
      v_diff := v_diff || jsonb_build_object(
        'type', 'added',
        'line_number', v_i,
        'content', v_new_lines[v_i]
      );
    else
      -- Old line deleted
      v_lines_deleted := v_lines_deleted + 1;
      v_diff := v_diff || jsonb_build_object(
        'type', 'deleted',
        'line_number', v_i,
        'content', v_old_lines[v_i]
      );
    end if;
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'diff', v_diff,
    'statistics', jsonb_build_object(
      'lines_added', v_lines_added,
      'lines_deleted', v_lines_deleted,
      'lines_modified', v_lines_modified,
      'total_changes', v_lines_added + v_lines_deleted + v_lines_modified
    )
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- Grant execute permissions on functions to authenticated users
-- ============================================================================
grant execute on function delete_file_with_backup(uuid, uuid) to authenticated;
grant execute on function create_checkpoint(uuid, uuid, text) to authenticated;
grant execute on function restore_checkpoint(uuid, uuid) to authenticated;
grant execute on function calculate_code_diff(text, text) to authenticated;
