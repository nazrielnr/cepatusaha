import type { Bindings } from '../../bindings'
import { createSql } from '../../db'

export async function isSuperAdmin(env: Bindings, clerkUserId: string): Promise<boolean> {
  const rows = await createSql(env)`select id from super_admin_roles where clerk_user_id = ${clerkUserId} limit 1`
  return rows.length > 0
}
