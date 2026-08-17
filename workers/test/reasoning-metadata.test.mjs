import assert from 'node:assert/strict'
import { normalizeReasoningMetadata } from '../src/features/chat/reasoning-metadata.js'

assert.deepEqual(normalizeReasoningMetadata({ thinking_content: 'x', thinking_done: true, thinking_duration_ms: 7 }), {
  reasoning_content: 'x',
  reasoning_done: true,
  reasoning_duration_ms: 7,
})

assert.deepEqual(normalizeReasoningMetadata({ reasoning_content: 'new', thinking_content: 'old' }), {
  reasoning_content: 'new',
})
