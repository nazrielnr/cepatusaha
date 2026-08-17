-- Migration: Add preview_thumbnail column to sessions table
-- This migration adds support for storing preview thumbnails for project cards
-- Requirements: 3.2

-- Add preview_thumbnail column to sessions table
-- Using TEXT type to store base64-encoded image data
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS preview_thumbnail TEXT;

-- Add index for faster queries when filtering by thumbnail existence
CREATE INDEX IF NOT EXISTS idx_sessions_preview_thumbnail 
ON sessions(preview_thumbnail) 
WHERE preview_thumbnail IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN sessions.preview_thumbnail IS 'Base64-encoded JPEG thumbnail of the project preview (400x300px)';
