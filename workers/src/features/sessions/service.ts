import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { ensureDefaultWorkspace } from '../files/default-workspace'
export async function getSessionDbUserId(env: Bindings, clerkUserId: string): Promise<string> {
  const sql = createSql(env)
  const existing = await sql`select id from users where clerk_user_id = ${clerkUserId} limit 1`
  if (existing[0]) return existing[0].id
  const email = `user-${clerkUserId.slice(0, 8)}@clerk.temp`
  const created = await sql`insert into users (clerk_user_id, email, name) values (${clerkUserId}, ${email}, '') returning id`
  return created[0].id
}

export function flattenSession<T extends Record<string, unknown>>(session: T | null): T | null {
  return session ? { ...session, ...(session.metadata || {}) } : null
}

function metadataFrom(body: Record<string, unknown>, current: Record<string, unknown> = {}) {
  const metadata = { ...current, ...(body.metadata || {}) }
  const pairs: Array<[string, string, unknown]> = [
    ['status', 'status', 'active'],
    ['conversationStep', 'conversation_step', 'idle'],
    ['profileDraft', 'profile_draft', {}],
    ['layoutBlueprint', 'layout_blueprint', null],
    ['modeHistory', 'mode_history', []],
    ['lastPreview', 'last_preview', null],
    ['lastGeneratedCopy', 'last_generated_copy', null],
  ]
  for (const [src, dst, fallback] of pairs) {
    if (body[src] !== undefined) metadata[dst] = body[src]
    else if (!(dst in metadata)) metadata[dst] = fallback
  }
  return metadata
}

export async function listSessionsForUser(env: Bindings, userId: string) {
  const rows = await createSql(env)`
    select * from sessions
    where user_id = ${userId}
    order by started_at desc
  `
  return rows.map((row) => flattenSession(row))
}

export async function getSessionForUser(env: Bindings, sessionId: string, userId: string) {
  const rows = await createSql(env)`
    select * from sessions
    where id = ${sessionId} and user_id = ${userId}
    limit 1
  `
  return flattenSession(rows[0] ?? null)
}

export async function getMessagesForSession(env: Bindings, sessionId: string) {
  return await createSql(env)`
    select * from chat_messages
    where session_id = ${sessionId}
    order by timestamp asc
  `
}

export async function createSessionForUser(env: Bindings, userId: string, body: Record<string, unknown>) {
  const now = new Date().toISOString()
  const metadata = JSON.stringify(metadataFrom(body))
  const rows = await createSql(env)`
    insert into sessions (user_id, project_id, title, metadata, preview_thumbnail, started_at, updated_at)
    values (${userId}, ${body.project_id || null}, ${body.title || 'New Session'}, ${metadata}::jsonb, ${body.previewThumbnail || null}, ${now}, ${now})
    returning *
  `
  return rows[0]
}

export async function updateSessionForUser(env: Bindings, userId: string, sessionId: string, body: Record<string, unknown>) {
  const current = await getSessionForUser(env, sessionId, userId) as Record<string, unknown> | null
  const metadata = JSON.stringify(metadataFrom(body, record(current?.metadata)))
  const now = new Date().toISOString()
  const rows = await createSql(env)`
    update sessions
    set title = coalesce(${body.title ?? null}, title),
        preview_thumbnail = coalesce(${body.previewThumbnail ?? null}, preview_thumbnail),
        metadata = ${metadata}::jsonb,
        updated_at = ${now}
    where id = ${sessionId} and user_id = ${userId}
    returning *
  `
  return rows[0] ?? null
}

export async function deleteSessionForUser(env: Bindings, userId: string, sessionId: string) {
  const sql = createSql(env)
  await sql`delete from chat_messages where session_id = ${sessionId}`
  await sql`delete from sessions where id = ${sessionId} and user_id = ${userId}`
}

export async function sessionExistsForUser(env: Bindings, sessionId: string, userId: string): Promise<boolean> {
  return Boolean(await getSessionForUser(env, sessionId, userId))
}

export async function getSessionProjectId(env: Bindings, sessionId: string): Promise<string | null> {
  const rows = await createSql(env)`select project_id from sessions where id = ${sessionId} limit 1`
  return rows[0]?.project_id ?? null
}

export async function createProjectForUser(env: Bindings, userId: string, sessionId?: string): Promise<string> {
  const sql = createSql(env)
  const rows = await sql`
    insert into projects (user_id, title, description)
    values (${userId}, 'New Project', 'Auto-created project')
    returning id
  `
  const projectId = rows[0].id
  await ensureDefaultWorkspace(env, projectId)
  if (sessionId) await sql`update sessions set project_id = ${projectId} where id = ${sessionId}`
  return projectId
}

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
