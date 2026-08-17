import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const keys = [
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'AI_BASE_URL',
  'AI_API_KEY',
  'AI_DEFAULT_MODEL',
  'AI_VISION_MODEL',
  'AI_IMAGE_MODE',
]
const source = 'workers/.dev.vars'
const target = 'workers/.production.secrets'
const config = 'workers/wrangler.toml'

const values = Object.fromEntries(
  readFileSync(source, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
    .filter(([key]) => keys.includes(key)),
)

const missing = keys.filter((key) => !values[key])
if (missing.length) throw new Error(`Missing production secret(s) in ${source}: ${missing.join(', ')}`)

writeFileSync(target, keys.map((key) => `${key}=${values[key]}`).join('\n'))
try {
  const result = spawnSync('npx', ['--yes', 'wrangler@4.123.0', '--config', config, 'secret', 'bulk', target, '--env', 'production'], { stdio: 'inherit', shell: true })
  if (result.status !== 0) process.exit(result.status ?? 1)
} finally {
  unlinkSync(target)
}
