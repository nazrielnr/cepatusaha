import assert from 'node:assert/strict'

function parse(lines) {
  const out = []
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue
    const event = JSON.parse(line.slice(6))
    if (event.type === 'text_chunk' && event.content) out.push(event.accumulated)
  }
  return out
}

assert.deepEqual(parse([
  'data: {"type":"text_chunk","content":"","accumulated":""}',
  'data: {"type":"text_chunk","content":" paragraf","accumulated":"paragraf"}',
  'data: {"type":"done"}',
]), ['paragraf'])
