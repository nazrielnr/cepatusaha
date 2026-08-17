import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const provider = readFileSync(new URL('../src/features/models/providers/openai-compatible.ts', import.meta.url), 'utf8')

assert.match(provider, /resetStreamTimeout\(\);[\s\S]*reader\.read\(\)/)
assert.match(provider, /reader\.releaseLock\(\)/)
assert.match(provider, /finally \{\r?\n\s*if \(timeoutId !== undefined\) clearTimeout\(timeoutId\);\r?\n\s*\}/)
