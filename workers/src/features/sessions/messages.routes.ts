import type { AuthResult, HonoContext } from '../../shared/types'
import { ValidationError } from '../../shared/errors'
import { assertSessionOwner, deleteCheckpointMessages, listMessages, upsertMessages } from './message-service'

function notFound(c: HonoContext) {
  return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'Session not found' } }, 404)
}

export async function getSessionMessages(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const sessionId = c.req.query('session_id') || c.req.query('sessionId')
  if (!sessionId) throw new ValidationError('session_id is required')
  try {
    await assertSessionOwner(c.env, auth.userId, sessionId)
  } catch {
    return notFound(c)
  }
  const limit = parseInt(c.req.query('limit') || '100', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)
  return c.json({ status: 'success', messages: await listMessages(c.env, sessionId, limit, offset), session_id: sessionId })
}

export async function postSessionMessages(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const body = await c.req.json()
  const sessionId = body.sessionId || body.session_id
  if (!sessionId) throw new ValidationError('session_id is required')
  if (!Array.isArray(body.messages)) throw new ValidationError('messages array is required')
  try {
    await assertSessionOwner(c.env, auth.userId, sessionId)
  } catch {
    return notFound(c)
  }
  return c.json({ status: 'success', messages: await upsertMessages(c.env, sessionId, body.messages) })
}

export async function deleteCheckpointIndicators(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const sessionId = c.req.query('session_id') || c.req.query('sessionId')
  if (!sessionId) throw new ValidationError('session_id is required')
  try {
    await assertSessionOwner(c.env, auth.userId, sessionId)
  } catch {
    return notFound(c)
  }
  await deleteCheckpointMessages(c.env, sessionId)
  return c.json({ status: 'success', message: 'Checkpoint indicators deleted' })
}
