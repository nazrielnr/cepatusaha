// Plan limits & cost model. Plain JS so `node test/plan.test.mjs` can import it directly.
// All limits are overridable via env so you can tune without redeploying schema.
// Pricing basis: MiniMax M2.7-highspeed promo ($0.03/1M input, $0.12/1M output, 90% off).
// One build run (multi-iteration loop) ≈ 20–60K tokens ≈ $0.002–0.006 (Rp 30–100).

export const PLAN_DEFAULTS = {
  free: { monthlyTokens: 200_000, maxIterations: 10, reqPerMinute: 10 },
  pro: { monthlyTokens: 2_000_000, maxIterations: 30, reqPerMinute: 60 },
}

export const PRICING = { inputPerM: 0.03, outputPerM: 0.12 }

export function parseEnvInt(value, fallback) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export function getPlanLimits(env = {}) {
  const p = (name, fallback) => parseEnvInt(env[name], fallback)
  return {
    free: {
      monthlyTokens: p('PLAN_FREE_MONTHLY_TOKENS', PLAN_DEFAULTS.free.monthlyTokens),
      maxIterations: p('PLAN_FREE_MAX_ITERATIONS', PLAN_DEFAULTS.free.maxIterations),
      reqPerMinute: p('PLAN_FREE_REQ_PER_MINUTE', PLAN_DEFAULTS.free.reqPerMinute),
    },
    pro: {
      monthlyTokens: p('PLAN_PRO_MONTHLY_TOKENS', PLAN_DEFAULTS.pro.monthlyTokens),
      maxIterations: p('PLAN_PRO_MAX_ITERATIONS', PLAN_DEFAULTS.pro.maxIterations),
      reqPerMinute: p('PLAN_PRO_REQ_PER_MINUTE', PLAN_DEFAULTS.pro.reqPerMinute),
    },
  }
}

export function isPro(plan) {
  return plan === 'pro'
}
// UTC month key so the lazy reset is deterministic across servers/times.
export function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// Blended cost estimate for a token mix (used for usage logs & admin cost column).
export function computeCost(promptTokens, completionTokens, pricing = PRICING) {
  return (promptTokens / 1_000_000) * pricing.inputPerM + (completionTokens / 1_000_000) * pricing.outputPerM
}
