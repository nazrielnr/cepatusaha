import type { AuthResult, HonoContext } from '../../shared/types'
import { getUserAnalytics } from './service'

export async function getAnalytics(c: HonoContext) {
  const auth = c.get('auth') as AuthResult
  return c.json({ status: 'success', analytics: await getUserAnalytics(c.env, auth.userId) })
}
