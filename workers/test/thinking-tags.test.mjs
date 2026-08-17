import assert from 'node:assert/strict'
import { createThinkingTagParser } from '../src/features/models/providers/thinking-tags.js'

const parse = (chunks) => {
  const parser = createThinkingTagParser()
  return chunks.flatMap((chunk) => parser.feed(chunk)).concat(parser.flush())
}

assert.deepEqual(parse(['<th', 'ink>Good, ', 'lanjut', 'annya</th', 'ink>OK']), [
  { type: 'thinking', content: 'Good, ' },
  { type: 'thinking', content: 'lanjut' },
  { type: 'thinking', content: 'annya' },
  { type: 'text', content: 'OK' },
])

assert.deepEqual(parse(['A<think>B</think>C']), [
  { type: 'text', content: 'A' },
  { type: 'thinking', content: 'B' },
  { type: 'text', content: 'C' },
])
