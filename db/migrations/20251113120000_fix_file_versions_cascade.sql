-- Migration: Fix file_versions Foreign Key Constraint
-- This migration fixes the ON DELETE CASCADE issue that causes backups to be deleted
-- when files are deleted, which defeats the purpose of the backup system.
--
-- Issue: file_versions.file_id has ON DELETE CASCADE, so when a file is deleted,
-- all its version history is also deleted.
--
-- Solution: Change to ON DELETE SET NULL so version history is preserved even
-- after the original file is deleted.

-- Step 1: Make file_id nullable (so it can be set to NULL when file is deleted)
alter table file_versions 
  alter column file_id drop not null;

-- Step 2: Drop existing foreign key constraint
alter table file_versions 
  drop constraint if exists file_versions_file_id_fkey;

-- Step 3: Add new foreign key constraint with ON DELETE SET NULL
alter table file_versions 
  add constraint file_versions_file_id_fkey 
  foreign key (file_id) references files(id) on delete set null;

-- Step 4: Add performance indexes
create index if not exists idx_files_content_gin 
  on files using gin(to_tsvector('english', content));

create index if not exists idx_checkpoints_session_number 
  on checkpoints(session_id, checkpoint_number desc);

-- Step 5: Add index for file_versions queries when file_id is null (orphaned backups)
create index if not exists idx_file_versions_orphaned 
  on file_versions(created_at desc) where file_id is null;

-- Step 6: Update delete_file_with_backup function with better validation
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
  v_backup_id uuid;
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
  )
  returning id into v_backup_id;
  
  -- Validate backup was created
  if v_backup_id is null then
    return jsonb_build_object(
      'success', false,
      'error', 'Failed to create backup before deletion'
    );
  end if;
  
  -- Delete the file (backup will remain with file_id = NULL)
  delete from files where id = p_file_id;
  
  -- Return success with backup details
  return jsonb_build_object(
    'success', true,
    'message', 'File deleted successfully with backup preserved',
    'backup_id', v_backup_id,
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

-- Step 7: Add function to cleanup old orphaned backups (optional maintenance)
create or replace function cleanup_orphaned_backups(
  p_days_old integer default 30
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_deleted_count integer;
begin
  -- Delete orphaned backups older than specified days
  delete from file_versions
  where file_id is null
    and created_at < now() - (p_days_old || ' days')::interval;
  
  get diagnostics v_deleted_count = row_count;
  
  return jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'message', format('Deleted %s orphaned backups older than %s days', v_deleted_count, p_days_old)
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'error', sqlerrm
    );
end;
$$;

-- Grant execute permissions
grant execute on function cleanup_orphaned_backups(integer) to authenticated;

-- Add comment explaining the change
comment on constraint file_versions_file_id_fkey on file_versions is 
  'ON DELETE SET NULL preserves version history even after file deletion';

