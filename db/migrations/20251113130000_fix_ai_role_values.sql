-- Migration: Fix AI role values in chat_messages
-- This migration updates any messages with role='assistant' to role='ai'
-- to match the expected database schema

-- Update existing messages with role='assistant' to role='ai'
UPDATE chat_messages
SET role = 'ai'
WHERE role = 'assistant';

-- Verify the constraint allows only valid roles
-- (This should already exist from the original schema, but we verify it here)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chat_messages_role_check'
  ) THEN
    ALTER TABLE chat_messages 
    ADD CONSTRAINT chat_messages_role_check 
    CHECK (role IN ('user', 'ai', 'tool'));
  END IF;
END $$;
