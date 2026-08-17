import type { AuthResult, HonoContext } from '../../shared/types'
import { ValidationError } from '../../shared/errors'
import { createSql } from '../../db'
import { getSessionDbUserId } from '../sessions/service'

export async function stopChatStream(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const { sessionId, runId } = await c.req.json() as { sessionId?: string; runId?: string }
  if (!sessionId || !runId) throw new ValidationError('sessionId and runId are required')
  await markChatRunStopped(c.env, sessionId, await getSessionDbUserId(c.env, auth.userId), runId)
  return c.json({ status: 'success' })
}

export async function markChatRunStopped(env: HonoContext['env'], sessionId: string, userId: string, runId: string) {
  await createSql(env)`
    update sessions
    set metadata = coalesce(metadata, '{}'::jsonb) || ${JSON.stringify({ stopped_chat_run_id: runId })}::jsonb,
        updated_at = ${new Date().toISOString()}
    where id = ${sessionId} and user_id = ${userId}
  `
}

export async function isChatRunStopped(env: HonoContext['env'], sessionId: string, runId?: string): Promise<boolean> {
  if (!sessionId || !runId) return false
  const rows = await createSql(env)`select metadata->>'stopped_chat_run_id' as run_id from sessions where id = ${sessionId} limit 1`
  return rows[0]?.run_id === runId
}
