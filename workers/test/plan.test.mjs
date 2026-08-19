import assert from 'node:assert/strict'
import {
  PLAN_DEFAULTS, PRICING, getPlanLimits, isPro, monthKey,
  computeCost, parseEnvInt,
} from '../src/features/plan/pricing.js'

// Defaults keep the anti-boncos math sane.
assert.equal(PLAN_DEFAULTS.free.monthlyTokens, 200_000)
assert.equal(PLAN_DEFAULTS.pro.monthlyTokens, 2_000_000)
assert.ok(PLAN_DEFAULTS.pro.maxIterations > PLAN_DEFAULTS.free.maxIterations)

// Env overrides work and garbage input falls back to defaults.
const limits = getPlanLimits({ PLAN_FREE_MONTHLY_TOKENS: '50000', PLAN_FREE_MAX_ITERATIONS: 'abc' })
assert.equal(limits.free.monthlyTokens, 50_000)
assert.equal(limits.free.maxIterations, PLAN_DEFAULTS.free.maxIterations)
assert.equal(parseEnvInt(undefined, 7), 7)
assert.equal(parseEnvInt('-3', 7), 7)

// Monthly period key rolls over deterministically (UTC month boundary).
assert.equal(monthKey(new Date('2026-08-19T23:59:59Z')), '2026-08')
assert.notEqual(monthKey(new Date('2026-09-01T00:00:00Z')), '2026-08')

// isPro gates correctly.
assert.equal(isPro('pro'), true)
assert.equal(isPro('free'), false)
assert.equal(isPro('enterprise'), false)

// Cost model matches MiniMax promo pricing (~Rp 17 for a ~20K-token run).
const cost = computeCost(15_000, 5_000) // 15K in + 5K out
assert.ok(Math.abs(cost - (0.015 * PRICING.inputPerM + 0.005 * PRICING.outputPerM)) < 1e-9)
assert.ok(cost > 0.0005 && cost < 0.002)

console.log('plan.test: all assertions passed')
