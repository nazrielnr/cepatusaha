import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const logger = readFileSync(new URL('../src/shared/logger.ts', import.meta.url), 'utf8')
assert.match(logger, /export function debugLog/)
assert.match(logger, /export function warnLog/)
assert.match(logger, /export function errorLog/)
assert.match(logger, /level === 'debug' && env\?\.NODE_ENV !== 'development'/)
