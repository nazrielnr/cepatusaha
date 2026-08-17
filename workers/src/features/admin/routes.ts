import type { HonoContext } from '../../shared/types'

const ok = (data: Record<string, unknown> = {}) => ({ status: 'success', success: true, ...data })
const notImplemented = (c: HonoContext) => c.json({ status: 'error', success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Admin endpoint not implemented' } }, 501)

export async function adminModels(c: HonoContext) {
  if (c.req.method === 'GET') return c.json(ok({ models: [{ id: c.env.AI_DEFAULT_MODEL, provider: 'openai_compatible', displayName: c.env.AI_DEFAULT_MODEL }] }))
  return notImplemented(c)
}

export async function adminModelHealth(c: HonoContext) {
  const healthy = Boolean(c.env.AI_BASE_URL && c.env.AI_API_KEY && c.env.AI_DEFAULT_MODEL)
  return c.json(ok({ healthy, providers: { openai_compatible: healthy } }), healthy ? 200 : 503)
}

export async function adminNotImplemented(c: HonoContext) {
  return notImplemented(c)
}
