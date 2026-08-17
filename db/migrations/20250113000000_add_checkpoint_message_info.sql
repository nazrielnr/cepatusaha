-- Migration: Add message info to checkpoints
-- Date: 2025-01-13
-- Purpose: Store message_id and user_message_content for checkpoint UI

-- Add columns to checkpoints table
ALTER TABLE checkpoints 
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES chat_messages(id),
ADD COLUMN IF NOT EXISTS user_message_content TEXT;

-- Create index for faster message lookup
CREATE INDEX IF NOT EXISTS idx_checkpoints_message_id ON checkpoints(message_id);

-- Update create_checkpoint function to accept message info
CREATE OR REPLACE FUNCTION create_checkpoint(
  p_session_id uuid,
  p_project_id uuid,
  p_preview_url text DEFAULT NULL,
  p_message_id uuid DEFAULT NULL,
  p_user_message_content text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkpoint_number integer;
  v_files_snapshot jsonb;
  v_checkpoint_id uuid;
BEGIN
  -- Get next checkpoint number for this session
  SELECT COALESCE(MAX(checkpoint_number), 0) + 1 INTO v_checkpoint_number
  FROM checkpoints
  WHERE session_id = p_session_id;
  
  -- Create snapshot of all project files
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'file_path', file_path,
      'file_type', file_type,
      'content', content,
      'updated_at', updated_at
    )
  ) INTO v_files_snapshot
  FROM files
  WHERE project_id = p_project_id;
  
  -- Insert checkpoint with message info
  INSERT INTO checkpoints (
    session_id,
    project_id,
    checkpoint_number,
    files_snapshot,
    preview_url,
    message_id,
    user_message_content
  ) VALUES (
    p_session_id,
    p_project_id,
    v_checkpoint_number,
    COALESCE(v_files_snapshot, '[]'::jsonb),
    p_preview_url,
    p_message_id,
    p_user_message_content
  )
  RETURNING id INTO v_checkpoint_id;
  
  -- Clean up old checkpoints (keep last 20)
  DELETE FROM checkpoints
  WHERE session_id = p_session_id
    AND checkpoint_number <= v_checkpoint_number - 20;
  
  RETURN jsonb_build_object(
    'success', true,
    'checkpoint_id', v_checkpoint_id,
    'checkpoint_number', v_checkpoint_number,
    'files_count', jsonb_array_length(COALESCE(v_files_snapshot, '[]'::jsonb))
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Update restore_checkpoint to return message info
CREATE OR REPLACE FUNCTION restore_checkpoint(
  p_checkpoint_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_checkpoint record;
  v_file jsonb;
  v_restored_count integer := 0;
BEGIN
  -- Get checkpoint and verify user access
  SELECT c.* INTO v_checkpoint
  FROM checkpoints c
  JOIN sessions s ON c.session_id = s.id
  WHERE c.id = p_checkpoint_id AND s.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Checkpoint not found or access denied'
    );
  END IF;
  
  -- Delete current project files
  DELETE FROM files WHERE project_id = v_checkpoint.project_id;
  
  -- Restore files from snapshot
  FOR v_file IN SELECT * FROM jsonb_array_elements(v_checkpoint.files_snapshot)
  LOOP
    INSERT INTO files (
      project_id,
      session_id,
      file_path,
      file_type,
      content,
      updated_at
    ) VALUES (
      v_checkpoint.project_id,
      v_checkpoint.session_id,
      v_file->>'file_path',
      v_file->>'file_type',
      v_file->>'content',
      (v_file->>'updated_at')::timestamptz
    );
    
    v_restored_count := v_restored_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Checkpoint restored successfully',
    'files_restored', v_restored_count,
    'checkpoint_number', v_checkpoint.checkpoint_number,
    'message_id', v_checkpoint.message_id,
    'user_message_content', v_checkpoint.user_message_content
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_checkpoint(uuid, uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_checkpoint(uuid, uuid) TO authenticated;

-- Add comment
COMMENT ON COLUMN checkpoints.message_id IS 'Reference to the user message that triggered this checkpoint';
COMMENT ON COLUMN checkpoints.user_message_content IS 'Content of the user message for display in UI';
