import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const vars = readFileSync('workers/.dev.vars', 'utf8')
const tokenMatch = vars.match(/VERCEL_TOKEN=([^\r\n]+)/)
const token = process.env.VERCEL_TOKEN || (tokenMatch ? tokenMatch[1].trim() : '')

if (!token) {
  console.error('VERCEL_TOKEN not found in environment or workers/.dev.vars')
  process.exit(1)
}

const env = { ...process.env, VERCEL_TOKEN: token }
const result = spawnSync('npx', ['vercel', '--prod', '--yes', '--token', token], {
  stdio: 'inherit',
  shell: true,
  env,
})

process.exit(result.status ?? 0)
