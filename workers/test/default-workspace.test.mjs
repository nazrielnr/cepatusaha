import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/features/files/default-workspace.ts', import.meta.url), 'utf8')
assert(src.includes("path: 'index.html'"))
assert(src.includes("path: 'css/main.css'"))
assert(src.includes("path: 'js/main.js'"))
assert(src.includes("path: '.env.example'"))
assert(src.includes('dist/ is build output'))
console.log('default workspace source checks passed')
