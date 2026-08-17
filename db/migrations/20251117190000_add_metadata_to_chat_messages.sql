-- Add metadata to chat_messages to persist tool calls and execution results per message
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Optional: GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin
  ON chat_messages USING GIN (metadata);
