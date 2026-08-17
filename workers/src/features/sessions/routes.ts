import type { AuthResult } from '../../shared/types'
import type { HonoContext } from '../../shared/types'
import { ValidationError } from '../../shared/errors'
import {
  createSessionForUser,
  deleteSessionForUser,
  getMessagesForSession,
  getSessionDbUserId,
  getSessionForUser,
  listSessionsForUser,
  updateSessionForUser,
} from './service'

/** List all sessions for authenticated user. */
export async function listSessions(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const dbUserId = await getSessionDbUserId(c.env, auth.userId)
  const id = c.req.query('id')
  const includeMessages = c.req.query('includeMessages') === 'true'

  if (id) {
    const session = await getSessionForUser(c.env, id, dbUserId)
    const messages = includeMessages ? await getMessagesForSession(c.env, id) : undefined
    return c.json({ status: 'success', session, messages })
  }

  const sessions = await listSessionsForUser(c.env, dbUserId)
  return c.json({ status: 'success', sessions })
}

/** Create a new session. */
export async function createSession(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const dbUserId = await getSessionDbUserId(c.env, auth.userId)
  const session = await createSessionForUser(c.env, dbUserId, await c.req.json())
  return c.json({ status: 'success', session }, 201)
}

/** Update an existing session. */
export async function updateSession(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const dbUserId = await getSessionDbUserId(c.env, auth.userId)
  const body = await c.req.json()
  const targetId = body.id || body.session_id
  if (!targetId) throw new ValidationError('id is required')

  const session = await updateSessionForUser(c.env, dbUserId, targetId, body)
  return c.json({ status: 'success', session })
}

/** Delete a session and its messages. */
export async function deleteSession(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const dbUserId = await getSessionDbUserId(c.env, auth.userId)
  const body = await c.req.json()
  const targetId = body.id || body.session_id
  if (!targetId) throw new ValidationError('id is required')

  await deleteSessionForUser(c.env, dbUserId, targetId)
  return c.json({ status: 'success', message: 'Session deleted successfully' })
}
