import type { AuthResult, HonoContext } from '../../shared/types'
import { getSessionDbUserId } from './service'
import { handleGenerateSessionTitle } from './title.service'

/**
 * Endpoint handler to generate a session title.
 * POST /api/sessions/generate-title
 *
 * Body:
 * {
 *   sessionId?: string;
 *   stage: 'initial' | 'completion';
 *   prompt?: string;
 *   files?: Array<{ file_path: string; content?: string }>;
 * }
 */
export async function generateTitleHandler(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  if (!auth?.userId) {
    return c.json({ status: 'error', error: 'Unauthorized' }, 401)
  }

  const dbUserId = await getSessionDbUserId(c.env, auth.userId)
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : undefined
  const stage = body.stage === 'completion' ? 'completion' : 'initial'
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : undefined
  const files = Array.isArray(body.files) ? (body.files as Array<{ file_path: string; content?: string }>) : undefined

  const result = await handleGenerateSessionTitle(c.env, dbUserId, {
    sessionId,
    stage,
    prompt,
    files,
  })

  return c.json(result)
}
