import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { getSessionDbUserId } from '../sessions/service'

export async function getUserAnalytics(env: Bindings, clerkUserId: string) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  const rows = await createSql(env)`
    select
      (select count(*)::int from sessions where user_id = ${userId}) as total_sessions,
      (select count(*)::int from chat_messages m join sessions s on s.id = m.session_id where s.user_id = ${userId}) as total_messages,
      (select count(*)::int from publications p join projects pr on pr.id = p.project_id where pr.user_id = ${userId}) as total_publications
  `
  return rows[0] ?? { total_sessions: 0, total_messages: 0, total_publications: 0 }
}
