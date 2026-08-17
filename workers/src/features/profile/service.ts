import type { Bindings } from '../../bindings'
import { createSql } from '../../db'

export async function getOrCreateProfile(env: Bindings, clerkUserId: string) {
  const sql = createSql(env)
  const rows = await sql`select * from users where clerk_user_id = ${clerkUserId} limit 1`
  if (rows[0]) return rows[0]
  const email = `user-${clerkUserId.slice(0, 8)}@clerk.temp`
  const created = await sql`
    insert into users (clerk_user_id, email, name)
    values (${clerkUserId}, ${email}, '')
    returning *
  `
  return created[0]
}

export async function updateProfileRow(env: Bindings, clerkUserId: string, body: Record<string, unknown>) {
  const current = await getOrCreateProfile(env, clerkUserId)
  const email = body.email ?? current.email
  const name = body.name ?? current.name ?? ''
  const rows = await createSql(env)`
    update users
    set email = ${email}, name = ${name}, updated_at = now()
    where clerk_user_id = ${clerkUserId}
    returning *
  `
  return rows[0]
}
