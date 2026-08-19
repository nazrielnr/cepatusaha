import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { computeCost, getPlanLimits, isPro, monthKey } from './pricing'

export type PlanName = 'free' | 'pro'

export interface PlanState {
  plan: PlanName
  periodKey: string
  monthUsedTokens: number
  monthLimitTokens: number
  monthRemainingTokens: number
  maxIterations: number
  reqPerMinute: number
  exhausted: boolean
}

interface UsageCharge {
  promptTokens: number
  completionTokens: number
  sessionId?: string
  runId?: string
  model?: string
}

// Lazy monthly reset: if the stored period start is not in the current UTC month,
// zero the counter and move the window to now. Runs in a single atomic UPDATE so
// concurrent runs cannot double-accumulate across a rollover.
export async function getPlanState(env: Bindings, clerkUserId: string): Promise<PlanState> {
  const sql = createSql(env)
  const now = new Date()
  const periodKey = monthKey(now)

  const rows = await sql`
    select plan, coalesce(tokens_used_month, 0) as tokens_used, plan_period_start
    from users where clerk_user_id = ${clerkUserId} limit 1
  `
  let user = rows[0]
  if (!user) {
    const email = `user-${clerkUserId.slice(0, 8)}@clerk.temp`
    const created = await sql`
      insert into users (clerk_user_id, email, name, plan, tokens_used_month, plan_period_start)
      values (${clerkUserId}, ${email}, '', 'free', 0, ${now})
      returning plan, coalesce(tokens_used_month, 0) as tokens_used, plan_period_start
    `
    user = created[0]
  }

  const needsReset = !user.plan_period_start || monthKey(new Date(user.plan_period_start)) !== periodKey
  let monthUsedTokens = Number(user.tokens_used ?? user.tokens_used_month ?? 0)
  if (needsReset) {
    await sql`
      update users
      set tokens_used_month = 0, plan_period_start = ${now}
      where clerk_user_id = ${clerkUserId}
    `
    monthUsedTokens = 0
  }

  const plan: PlanName = isPro(user.plan) ? 'pro' : 'free'
  const limits = getPlanLimits(env)[plan]
  const monthRemainingTokens = Math.max(0, limits.monthlyTokens - monthUsedTokens)

  return {
    plan,
    periodKey,
    monthUsedTokens,
    monthLimitTokens: limits.monthlyTokens,
    monthRemainingTokens,
    maxIterations: limits.maxIterations,
    reqPerMinute: limits.reqPerMinute,
    exhausted: monthRemainingTokens <= 0,
  }
}

export async function chargeTokenUsage(env: Bindings, clerkUserId: string, charge: UsageCharge): Promise<number | undefined> {
  const total = (charge.promptTokens || 0) + (charge.completionTokens || 0)
  if (total <= 0) return undefined
  const sql = createSql(env)

  // Atomic: reset window if rolled over, then increment. The WHERE guard is intentionally
  // omitted so a stale pre-checked user still lands (overshoot bounded by one iteration).
  const rows = await sql`
    update users
    set tokens_used_month =
          case when plan_period_start < date_trunc('month', now()) then 0 else tokens_used_month end
          + ${total},
        plan_period_start = now()
    where clerk_user_id = ${clerkUserId}
    returning tokens_used_month, plan
  `

  await sql`
    insert into token_usage_logs (user_id, session_id, run_id, model, prompt_tokens, completion_tokens, total_tokens, cost_usd, stopped_by_quota)
    select id, ${charge.sessionId ?? null}, ${charge.runId ?? null}, ${charge.model ?? null},
           ${charge.promptTokens || 0}, ${charge.completionTokens || 0}, ${total},
           ${computeCost(charge.promptTokens || 0, charge.completionTokens || 0)},
           false
    from users where clerk_user_id = ${clerkUserId}
  `

  const row = rows[0]
  if (!row) return undefined
  const plan: PlanName = isPro(row.plan) ? 'pro' : 'free'
  const limit = getPlanLimits(env)[plan].monthlyTokens
  return Math.max(0, limit - Number(row.tokens_used_month))
}
