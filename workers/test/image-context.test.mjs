import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/features/chat/image-context.ts', import.meta.url), 'utf8')
assert.match(src, /IMAGE_CONTEXT/)
assert.match(src, /image_url/)
assert.match(src, /Analyze image/)
assert.match(src, /analyzeImageTool/)
