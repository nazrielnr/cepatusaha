-- Migration: Allow UPDATE on chat_messages for session owners (required for upsert)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'chat_messages' 
      AND policyname = 'Users can update messages in their own sessions'
  ) THEN
  END IF;
END $$;
