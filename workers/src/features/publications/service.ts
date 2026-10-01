import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { ValidationError } from '../../shared/errors'
import { getSessionDbUserId } from '../sessions/service'
import { deployToVercel } from './vercel'

export type PublishedPage = { path: string; content: string }

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
  const sessionId = str(body.sessionId) ?? null
  const slug = slugify(str(body.slug) || 'site')
  const publicUrl = `/published/${slug}`
  const pages = publishablePages(body.pages)
  if (!pages.length) throw new ValidationError('pages wajib diisi (minimal satu halaman HTML)')
  const contentHash = await sha1Hex(JSON.stringify(pages))
  // Same content as the last publish of this slug: reuse the existing Vercel
  // deployment (same id/url) instead of creating a new one.
  const existingRows = await sql`
    select p.metadata->>'vercelUrl' as vercel_url,
           p.metadata->>'vercelDeploymentId' as vercel_deployment_id,
           p.metadata->>'content_hash' as content_hash,
           p.published_at
    from publications p
    join projects pr on pr.id = p.project_id
    where pr.user_id = ${userId} and p.published_url = ${publicUrl}
    order by p.published_at desc
    limit 1
  `
  const existing = existingRows[0]
  if (existing?.content_hash === contentHash && existing.vercel_url) {
    return { success: true, publicUrl: existing.vercel_url, publishedAt: existing.published_at, slug, deploymentId: existing.vercel_deployment_id ?? null, reused: true }
  }
  // Deploy to Vercel first: no publication row (and no orphan project) if deploy fails.
  // Vercel reuses the same deployment (same id/url) when files are unchanged.
  const vercel = await deployToVercel(env, slug, pages)
  // Fallback copy for /published/<slug> serving on this worker: links point at
  // the worker paths because there is no directory rewrite here.
  const fallbackPages = rewriteLinksForWorkers(slug, pages)
  const projectRows = sessionId
    ? await sql`select project_id from sessions where id = ${sessionId} and user_id = ${userId} limit 1`
    : []
  let projectId = projectRows[0]?.project_id ?? null
  if (!projectId) {
    const rows = await sql`
      insert into projects (user_id, title, description)
      values (${userId}, ${slug}, null)
      returning id
    `
    projectId = rows[0].id
  }

  const metadata = JSON.stringify({
    pages: fallbackPages,
    sessionId,
    slug,
    vercelUrl: vercel.url,
    vercelDeploymentId: vercel.deploymentId,
    contentHash,
  })
  const rows = await sql`
    insert into publications (project_id, published_url, metadata)
    values (${projectId}, ${publicUrl}, ${metadata}::jsonb)
    returning id, published_url, published_at, metadata
  `
  const row = rows[0]
  return { success: true, publicUrl: vercel.url, publishedAt: row.published_at, slug, deploymentId: vercel.deploymentId }
}

export async function deletePublicationForClerkUser(env: Bindings, clerkUserId: string, publicationId: string) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  await createSql(env)`
    delete from publications p
    using projects pr
    where p.project_id = pr.id and pr.user_id = ${userId} and p.id = ${publicationId}
  `
}

// Resolve a published page. Pages are stored in metadata.pages as {path, content}.
// rawPath '' or 'index.html' serves the index page; unknown paths fall back to
// index only when they have no .html extension (SPA-style routes), else 404 via caller.
export async function getPublishedPageForSlug(env: Bindings, slug: string, rawPath: string): Promise<string | null> {
  const rows = await createSql(env)`
    select metadata
    from publications
    where published_url = ${`/published/${slug}`}
    order by published_at desc
    limit 1
  `
  const meta = rows[0]?.metadata as { html?: string | null; pages?: PublishedPage[] | null } | undefined
  if (!meta) return null
  const pages = meta.pages?.length ? meta.pages : meta.html ? [{ path: 'index.html', content: meta.html }] : []
  if (!pages.length) return null
  const wanted = (rawPath || 'index.html').replace(/^\/+/, '')
  const byPath = new Map<string, string>()
  let indexContent: string | undefined
  for (const p of pages) {
    if (typeof p.content !== 'string') continue
    const key = p.path.replace(/^\/+/, '')
    byPath.set(key, p.content)
    // The preview treats any path ending in index.html (e.g. src/index.html) as the entry page
    if (indexContent === undefined && key.endsWith('index.html')) indexContent = p.content
  }
  if (byPath.has(wanted)) return byPath.get(wanted) ?? null
  if (indexContent !== undefined) return indexContent
  return null
}

function str(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined }

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function resolvePagePath(currentPath: string, target: string): string {
  let t = target.split('?')[0].split('#')[0].trim()
  if (!t || t.startsWith('#') || /^(https?:)?\/\//i.test(t) || /^[a-z]+:/i.test(t)) return ''
  t = t.startsWith('/') ? t.slice(1) : `${currentPath.includes('/') ? currentPath.slice(0, currentPath.lastIndexOf('/') + 1) : ''}${t}`
  const parts: string[] = []
  for (const part of t.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

// Normalize generated files for deployment: paths arrive like 'src/index.html'
// or '/src/about.html'; the site root must be 'index.html' for Vercel/any host
// to serve it, so strip leading slashes and the generator's 'src/' prefix.
// Also drop the preview-only nav interceptor; internal links stay relative so
// multi-page navigation works on the deployed host.
function publishablePages(pages: unknown): PublishedPage[] {
  return (Array.isArray(pages) ? pages : []).flatMap((entry: unknown): PublishedPage[] => {
    const page = entry as PublishedPage
    if (typeof page?.path !== 'string' || typeof page?.content !== 'string') return []
    return [{
      path: page.path.replace(/^\/+/, '').replace(/^(\.\/)?src\//, ''),
      content: page.content.replace(/<script data-preview-nav="true">[\s\S]*?<\/script>/, ''),
    }]
  })
}

function rewriteLinksForWorkers(slug: string, pages: PublishedPage[]): PublishedPage[] {
  const known = new Set(pages.map((p) => p.path))
  return pages.map(({ path, content }) => ({
    path,
    content: content.replace(/(href\s*=\s*)(["'])(.*?)\2/gi, (m, attr: string, q: string, href: string) => {
      const resolved = resolvePagePath(path, href)
      return resolved && known.has(resolved) ? `${attr}${q}/published/${slug}/${resolved}${q}` : m
    }),
  }))
}
