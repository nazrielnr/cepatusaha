import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const builder = readFileSync(new URL('../src/features/planning/prompt-builder.ts', import.meta.url), 'utf8')
const planning = readFileSync(new URL('../src/features/planning/prompts/planning.json', import.meta.url), 'utf8')
const loop = readFileSync(new URL('../src/features/chat/conversation-loop.ts', import.meta.url), 'utf8')
const state = readFileSync(new URL('../src/features/planning/state.ts', import.meta.url), 'utf8')

assert.doesNotMatch(builder, /prompts\/system\.json/)
assert.doesNotMatch(builder, /create_file|replace_code|check_workspace|search_in_files|style\.css|script\.js/)
assert.doesNotMatch(planning, /create_file|check_workspace|\.planning\/planning-docs\.md/)
assert.doesNotMatch(loop, /For new files output fenced file blocks, not tool calls/)
assert.match(state, /TOOL_SCHEMAS/)
assert.ok(builder.length < 6000)
