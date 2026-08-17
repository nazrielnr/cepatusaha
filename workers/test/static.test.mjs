import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const bindings = readFileSync(new URL('../src/bindings.ts', import.meta.url), 'utf8')
const db = readFileSync(new URL('../src/db.ts', import.meta.url), 'utf8')
const realtime = readFileSync(new URL('../src/features/realtime/room.ts', import.meta.url), 'utf8')
const ai = readFileSync(new URL('../src/features/models/ai-factory.ts', import.meta.url), 'utf8')
const cors = readFileSync(new URL('../src/middleware/cors.ts', import.meta.url), 'utf8')
const migrations = Array.from(await import('node:fs').then(fs => fs.readdirSync(new URL('../../db/migrations/', import.meta.url))))

for (const key of ['DATABASE_URL', 'CLERK_SECRET_KEY', 'AI_BASE_URL', 'AI_API_KEY', 'AI_DEFAULT_MODEL']) {
  assert.match(bindings, new RegExp(`${key}: string`))
}
assert.match(bindings, /ASSETS_BUCKET: R2Bucket/)
assert.match(bindings, /REALTIME_ROOM: DurableObjectNamespace/)
assert.match(realtime, /class RealtimeRoom/)
assert.match(db, /@neondatabase\/serverless/)
assert.ok(!existsSync(new URL('../src/env.ts', import.meta.url)))
assert.ok(!existsSync(new URL('../src/lib/constants.ts', import.meta.url)))
assert.ok(!existsSync(new URL('../src/lib/db.ts', import.meta.url)))
assert.ok(!existsSync(new URL('../src/lib/file-manager.ts', import.meta.url)))
assert.ok(!existsSync(new URL('../src/handlers/debug-auth.ts', import.meta.url)))
assert.ok(!existsSync(new URL('../vitest.config.ts', import.meta.url)))
assert.ok(!/Access-Control-Allow-Origin', origin/.test(cors))
assert.match(ai, /OpenAICompatibleProvider/)
assert.ok(!ai.includes('Gemini'))
assert.ok(!migrations.some((file) => /vertex|search_in_files|get_file_tree/i.test(file)))
