/** @param {unknown} metadata */
export function normalizeReasoningMetadata(metadata = {}) {
  const m = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? { ...metadata } : {};
  const reasoning = typeof m.reasoning_content === 'string' ? m.reasoning_content : typeof m.thinking_content === 'string' ? m.thinking_content : typeof m.thinking === 'string' ? m.thinking : undefined;
  if (reasoning) m.reasoning_content = reasoning;
  if (m.reasoning_done === undefined && typeof m.thinking_done === 'boolean') m.reasoning_done = m.thinking_done;
  if (m.reasoning_duration_ms === undefined && typeof m.thinking_duration_ms === 'number') m.reasoning_duration_ms = m.thinking_duration_ms;
  if (m.reasoning_start_ms === undefined && typeof m.thinking_start_ms === 'number') m.reasoning_start_ms = m.thinking_start_ms;
  delete m.thinking;
  delete m.thinking_content;
  delete m.thinking_done;
  delete m.thinking_duration_ms;
  delete m.thinking_start_ms;
  return m;
}
