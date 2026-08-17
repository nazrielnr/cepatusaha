import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { getSessionDbUserId } from '../sessions/service'

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || crypto.randomUUID()
}

export async function listPublicationsForClerkUser(env: Bindings, clerkUserId: string) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  return await createSql(env)`
    select p.*
    from publications p
    join projects pr on pr.id = p.project_id
    where pr.user_id = ${userId}
    order by p.published_at desc
  `
}

export async function publishSiteForClerkUser(env: Bindings, clerkUserId: string, body: Record<string, unknown>) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  const sql = createSql(env)
  const profile = record(body.profile)
  const sessionId = str(body.sessionId) ?? null
  const business = str(profile.businessName) || str(profile.business_name) || 'site'
  const slug = slugify(str(body.existingSlug) || str(body.customDomainName) || business)
  const publicUrl = `/published/${slug}`
  const projectRows = sessionId
    ? await sql`select project_id from sessions where id = ${sessionId} and user_id = ${userId} limit 1`
    : []
  let projectId = projectRows[0]?.project_id ?? null
  if (!projectId) {
    const rows = await sql`
      insert into projects (user_id, title, description)
      values (${userId}, ${business}, ${str(profile.description) || null})
      returning id
    `
    projectId = rows[0].id
  }

  const metadata = JSON.stringify({
    profile: body.profile ?? null,
    generatedCopy: body.generatedCopy ?? null,
    layoutBlueprint: body.layoutBlueprint ?? null,
    html: body.html ?? null,
    sessionId,
    slug,
  })
  const rows = await sql`
    insert into publications (project_id, published_url, metadata)
    values (${projectId}, ${publicUrl}, ${metadata}::jsonb)
    returning id, published_url, published_at, metadata
  `
  const row = rows[0]
  return { success: true, publicUrl, fallbackUrl: publicUrl, publishedAt: row.published_at, slug, layoutBlueprint: body.layoutBlueprint ?? null }
}

export async function deletePublicationForClerkUser(env: Bindings, clerkUserId: string, publicationId: string) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  await createSql(env)`
    delete from publications p
    using projects pr
    where p.project_id = pr.id and pr.user_id = ${userId} and p.id = ${publicationId}
  `
}

function record(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
function str(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined }
