import type { HonoContext } from '../../shared/types'
import { errorLog } from '../../shared/logger'
import { createSql } from '../../db'
import { getPlanState } from './service'

export async function getPlan(c: HonoContext) {
  const auth = c.get('auth')
  const plan = await getPlanState(c.env, auth.userId)
  return c.json({ status: 'success', plan })
}

// Admin: token usage overview (last N days, daily totals) + per-user/per-session detail.
export async function adminTokenOverview(c: HonoContext) {
  try {
    const sql = createSql(c.env)
    const days = Math.min(Math.max(parseInt(c.req.query('days') || '30', 10) || 30, 1), 90)
    const daily = await sql`
      select to_char(date_trunc('day', created_at at time zone 'UTC'), 'YYYY-MM-DD') as date,
             sum(total_tokens) as tokens, sum(cost_usd) as cost,
             count(distinct user_id) as active_users
      from token_usage_logs
      where created_at > now() - make_interval(days => ${days})
      group by 1 order by 1
    `
    const totals = await sql`
      select coalesce(sum(total_tokens), 0) as tokens, coalesce(sum(cost_usd), 0) as cost,
             count(distinct user_id) as users, count(*) as runs
      from token_usage_logs
      where created_at > now() - make_interval(days => ${days})
    `
    return c.json({ status: 'success', data: { days, daily, totals: totals[0] } })
  } catch (error) {
    errorLog(undefined, 'adminTokenOverview error:', error)
    return c.json({ status: 'error', error: { code: 'INTERNAL', message: 'Gagal memuat data token' } }, 500)
  }
}

async function userByIdOrLogs(sql: ReturnType<typeof createSql>, userId: string) {
  return sql`
    select l.*, u.email, u.name, u.plan
    from token_usage_logs l join users u on u.id = l.user_id
    where u.id = ${userId}
    order by l.created_at desc limit 200
  `
}

export async function adminTokenByUser(c: HonoContext) {
  try {
    const sql = createSql(c.env)
    const logs = await userByIdOrLogs(sql, c.req.param('userId'))
    return c.json({ status: 'success', data: logs })
  } catch (error) {
    errorLog(undefined, 'adminTokenByUser error:', error)
    return c.json({ status: 'error', error: { code: 'INTERNAL', message: 'Gagal memuat data token' } }, 500)
  }
}

export async function adminTokenBySession(c: HonoContext) {
  try {
    const sql = createSql(c.env)
    const logs = await sql`
      select l.*, u.email, u.name, u.plan
      from token_usage_logs l join users u on u.id = l.user_id
      where l.session_id = ${c.req.param('sessionId')}
      order by l.created_at desc limit 200
    `
    return c.json({ status: 'success', data: logs })
  } catch (error) {
    errorLog(undefined, 'adminTokenBySession error:', error)
    return c.json({ status: 'error', error: { code: 'INTERNAL', message: 'Gagal memuat data token' } }, 500)
  }
}
