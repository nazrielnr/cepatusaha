import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const tools = readFileSync(new URL('../src/features/chat/conversation-tools.ts', import.meta.url), 'utf8')
const handler = readFileSync(new URL('../src/features/files/tool-handler.ts', import.meta.url), 'utf8')
const prompt = readFileSync(new URL('../src/features/planning/prompt-builder.ts', import.meta.url), 'utf8')

assert.match(tools, /_suspected_path/)
assert.match(handler, /Do not retry \$\{toolName\}/)
assert.match(handler, /read_file\(path:/)
assert.match(handler, /edit_file mode=/)
assert.match(prompt, /do not retry write_file\/create_file/i)
