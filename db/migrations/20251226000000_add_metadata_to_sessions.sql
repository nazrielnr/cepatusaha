-- Add missing columns to sessions table to match application requirements
-- This fixes the "Could not find the 'metadata' column of 'sessions'" and 
-- "Could not find the 'title' column of 'sessions'" errors

-- Add title column for session naming
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS title varchar(255) NOT NULL DEFAULT 'New Session';

-- Add metadata column to store session state information
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add updated_at column for tracking session updates
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Optional: GIN index for metadata queries to improve performance
CREATE INDEX IF NOT EXISTS idx_sessions_metadata_gin
  ON sessions USING GIN (metadata);

-- Add index for updated_at for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at
  ON sessions(updated_at DESC);

-- Add index for title for search functionality
CREATE INDEX IF NOT EXISTS idx_sessions_title
  ON sessions(title);

-- Update trigger to automatically set updated_at on session updates
CREATE OR REPLACE FUNCTION update_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

-- Drop existing trigger if it exists before creating new one
DROP TRIGGER IF EXISTS sessions_updated_at_trigger ON sessions;

CREATE TRIGGER sessions_updated_at_trigger
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_sessions_updated_at();

-- Add comments explaining the column usage
COMMENT ON COLUMN sessions.title IS 'User-friendly name for the session';
COMMENT ON COLUMN sessions.metadata IS 'JSON metadata storing session state: status, conversation_step, profile_draft, layout_blueprint, mode_history, last_preview, last_generated_copy';
COMMENT ON COLUMN sessions.updated_at IS 'Timestamp of last session update';
