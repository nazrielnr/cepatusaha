import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const ttl = readFileSync(new URL('../src/shared/ttl-cache.ts', import.meta.url), 'utf8')
const skills = readFileSync(new URL('../src/features/skills/service.ts', import.meta.url), 'utf8')
const designs = readFileSync(new URL('../src/features/designs/service.ts', import.meta.url), 'utf8')
const stream = readFileSync(new URL('../src/features/chat/stream.ts', import.meta.url), 'utf8')

assert.match(ttl, /store\.set\(key, \{ expires: now \+ ttlMs, value \}\)/)
assert.match(ttl, /store\.delete\(key\)/)
assert.match(skills, /cached\(skillRefsCache, 'all', SKILLS_TTL_MS/)
assert.match(skills, /cached\(skillSummariesCache, 'active', SKILLS_TTL_MS/)
assert.match(designs, /cached\(designsCache, 'all', DESIGNS_TTL_MS/)
assert.match(stream, /'Cache-Control': 'no-cache'/)
assert.doesNotMatch(stream, /caches\.default|cache\.put|cache\(/)
