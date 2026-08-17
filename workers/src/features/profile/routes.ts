import type { AuthResult, HonoContext } from '../../shared/types'
import { getOrCreateProfile, updateProfileRow } from './service'

export async function getProfile(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const profile = await getOrCreateProfile(c.env, auth.userId)
  return c.json({ status: 'success', profile })
}

export async function updateProfile(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  const profile = await updateProfileRow(c.env, auth.userId, await c.req.json())
  return c.json({ status: 'success', profile })
}
