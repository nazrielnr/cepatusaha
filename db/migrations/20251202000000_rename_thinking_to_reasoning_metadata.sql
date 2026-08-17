-- Move legacy thinking metadata to reasoning metadata. content already stays separate.
UPDATE chat_messages
SET metadata = metadata || jsonb_strip_nulls(jsonb_build_object(
  'reasoning_content', COALESCE(metadata->>'reasoning_content', metadata->>'thinking_content', metadata->>'thinking'),
  'reasoning_done', COALESCE(metadata->'reasoning_done', metadata->'thinking_done'),
  'reasoning_duration_ms', COALESCE(metadata->'reasoning_duration_ms', metadata->'thinking_duration_ms'),
  'reasoning_start_ms', COALESCE(metadata->'reasoning_start_ms', metadata->'thinking_start_ms')
))
WHERE metadata ?| array['thinking_content', 'thinking', 'thinking_done', 'thinking_duration_ms', 'thinking_start_ms'];

UPDATE chat_messages
SET metadata = metadata - 'thinking' - 'thinking_content' - 'thinking_done' - 'thinking_duration_ms' - 'thinking_start_ms'
WHERE metadata ?| array['thinking', 'thinking_content', 'thinking_done', 'thinking_duration_ms', 'thinking_start_ms'];
