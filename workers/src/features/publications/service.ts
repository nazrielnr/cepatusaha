import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { ValidationError } from '../../shared/errors'
import { getSessionDbUserId } from '../sessions/service'
import { deleteVercelProject, deployToVercel, resolveProjectDomain, type VercelDeployment } from './vercel'

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

// In-memory locks to prevent race conditions during concurrent deploys for the same workspace/project or domain
const inFlightPublishes = new Map<string, Promise<any>>()

export async function publishSiteForClerkUser(env: Bindings, clerkUserId: string, body: Record<string, unknown>) {
  const userId = await getSessionDbUserId(env, clerkUserId)
  const sessionId = str(body.sessionId) ?? null
  const slug = slugify(str(body.slug) || 'site')
  const sql = createSql(env)

  // 1. Resolve project_id and ensure workspace linking
  let projectId = str(body.projectId) ?? null
  if (!projectId && sessionId) {
    const projectRows = await sql`select project_id from sessions where id = ${sessionId} and user_id = ${userId} limit 1`
    projectId = projectRows[0]?.project_id ?? null
  }
  if (!projectId) {
    const rows = await sql`
      insert into projects (user_id, title, description)
      values (${userId}, ${slug}, null)
      returning id
    `
    projectId = rows[0].id
    if (sessionId) {
      await sql`update sessions set project_id = ${projectId} where id = ${sessionId} and user_id = ${userId}`
    }
  }

  // 2. Race condition guards: Dual locking on project and domain slug
  const projectLockKey = `project:${projectId}`
  const slugLockKey = `slug:${slug.toLowerCase()}`

  if (inFlightPublishes.has(slugLockKey)) {
    throw new ValidationError(`Penerbitan domain "${slug}" sedang diproses. Harap tunggu beberapa saat.`)
  }

  if (inFlightPublishes.has(projectLockKey)) {
    return await inFlightPublishes.get(projectLockKey)!
  }

  const publishPromise = (async () => {
    const pages = publishablePages(body.pages)
    if (!pages.length) throw new ValidationError('pages wajib diisi (minimal satu halaman HTML)')
    const contentHash = await sha1Hex(JSON.stringify(pages))

    if (!env.VERCEL_TOKEN) {
      throw new ValidationError('VERCEL_TOKEN tidak dikonfigurasi. Direct worker hosting dinonaktifkan.')
    }

    // 3. Cross-Project Isolation Check:
    // Strictly verify that the requested slug/domain is NOT already owned by ANOTHER project.
    // This prevents a new project from overwriting an older project's deployment.
    const conflictingRows = await sql`
      select p.id,
             p.project_id,
             p.published_url,
             p.metadata->>'slug' as slug,
             pr.title as project_title,
             pr.user_id as owner_id
      from publications p
      join projects pr on pr.id = p.project_id
      where (
        lower(p.metadata->>'slug') = lower(${slug})
        or lower(p.metadata->>'vercelProjectName') = lower(${slug})
        or lower(p.published_url) = lower(${`https://${slug}.vercel.app`})
      )
      and p.project_id != ${projectId}
      limit 1
    `

    if (conflictingRows.length > 0) {
      const conflict = conflictingRows[0]
      const isSameUser = conflict.owner_id === userId
      const projName = conflict.project_title || 'proyek lain'
      const msg = isSameUser
        ? `Nama domain "${slug}" sudah digunakan oleh proyek "${projName}". Setiap proyek harus menggunakan nama domain yang berbeda.`
        : `Nama domain "${slug}" sudah digunakan oleh proyek lain. Silakan pilih nama domain yang berbeda.`
      throw new ValidationError(msg)
    }

    // 4. Resolve existing publication for THIS project
    const existingRows = await sql`
      select p.id,
             p.published_url,
             p.published_at,
             p.metadata->>'vercelUrl' as vercel_url,
             p.metadata->>'vercelDomain' as vercel_domain,
             p.metadata->>'vercelDeploymentId' as vercel_deployment_id,
             p.metadata->>'vercelProjectId' as vercel_project_id,
             p.metadata->>'vercelProjectName' as vercel_project_name,
             p.metadata->>'contentHash' as content_hash,
             p.metadata->>'slug' as slug
      from publications p
      where p.project_id = ${projectId}
      order by p.published_at desc
      limit 1
    `
    const existing = existingRows[0]

    // Use established Vercel project name or slug
    const vercelProjectName = existing?.vercel_project_name || slug

    // 5. Deploy latest files to Vercel (target: production updates the project)
    const vercel = await deployToVercel(env, vercelProjectName, pages, {
      existingProjectId: existing?.vercel_project_id || null,
      slug,
    })

    const metadata = JSON.stringify({
      pages,
      sessionId,
      slug,
      vercelUrl: vercel.domainUrl,
      vercelDomain: vercel.domainUrl,
      vercelDeploymentId: vercel.deploymentId,
      vercelDeploymentUrl: vercel.deploymentUrl,
      vercelProjectId: vercel.projectId,
      vercelProjectName: vercel.projectName,
      deploymentStatus: 'vercel_success',
      deploymentError: null,
      contentHash,
    })

    let publishedAt: string

    if (existing?.id) {
      // UPDATE KE DB JIKA PROJECT SUDAH PERNAH DEPLOY: Update existing publication record in DB
      const updateRows = await sql`
        update publications
        set published_url = ${vercel.domainUrl},
            published_at = now(),
            metadata = ${metadata}::jsonb
        where id = ${existing.id}
        returning id, published_url, published_at, metadata
      `
      publishedAt = updateRows[0]?.published_at ? String(updateRows[0].published_at) : new Date().toISOString()
    } else {
      // Insert new publication record in DB
      const insertRows = await sql`
        insert into publications (project_id, published_url, metadata)
        values (${projectId}, ${vercel.domainUrl}, ${metadata}::jsonb)
        returning id, published_url, published_at, metadata
      `
      publishedAt = insertRows[0]?.published_at ? String(insertRows[0].published_at) : new Date().toISOString()
    }

    // Persist deployment state to session metadata in DB
    if (sessionId) {
      await sql`
        update sessions
        set metadata = jsonb_set(
          coalesce(metadata, '{}'::jsonb),
          '{deployment}',
          ${JSON.stringify({
            deployed: true,
            domainUrl: vercel.domainUrl,
            slug,
            deploymentId: vercel.deploymentId,
            updatedAt: new Date().toISOString(),
          })}::jsonb
        )
        where id = ${sessionId}
      `
    }

    return {
      success: true,
      publicUrl: vercel.domainUrl,
      vercelUrl: vercel.domainUrl,
      domainUrl: vercel.domainUrl,
      publishedAt,
      slug,
      deploymentId: vercel.deploymentId ?? null,
      deploymentStatus: 'vercel_success' as const,
      reused: Boolean(existing?.id),
    }
  })()

  inFlightPublishes.set(projectLockKey, publishPromise)
  inFlightPublishes.set(slugLockKey, publishPromise)
  try {
    return await publishPromise
  } finally {
    inFlightPublishes.delete(projectLockKey)
    inFlightPublishes.delete(slugLockKey)
  }
}

export async function deletePublicationForClerkUser(env: Bindings, clerkUserId: string, publicationId: string) {
  const sql = createSql(env)
  const userId = await getSessionDbUserId(env, clerkUserId)

  // Clean up remote Vercel project if possible
  const rows = await sql`
    select p.id, p.metadata->>'vercelProjectId' as vercel_project_id
    from publications p
    join projects pr on pr.id = p.project_id
    where pr.user_id = ${userId} and p.id = ${publicationId}
    limit 1
  `
  const pub = rows[0]
  if (pub?.vercel_project_id && env.VERCEL_TOKEN) {
    try {
      await deleteVercelProject(env, pub.vercel_project_id)
    } catch (err) {
      console.warn('[Publications] Failed to delete project on Vercel:', err)
    }
  }

  await sql`
    delete from publications p
    using projects pr
    where p.project_id = pr.id and pr.user_id = ${userId} and p.id = ${publicationId}
  `
}

// Direct worker publication hosting is disabled. Websites are served directly from Vercel.
export async function getPublishedPageForSlug(_env: Bindings, _slug: string, _rawPath: string): Promise<{ content: string; path: string } | null> {
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

/**
 * Normalizes asset references in HTML/CSS files so that if any HTML/CSS
 * refers to an absolute asset URL (/api/assets/object/...), it is rewritten
 * to the relative path of that asset in the deployment.
 */
function normalizeAssetReferences(pages: PublishedPage[]): PublishedPage[] {
  const assetMap = new Map<string, string>()
  for (const p of pages) {
    if (typeof p.content === 'string' && (p.content.startsWith('http://') || p.content.startsWith('https://') || p.content.startsWith('/api/assets/object/'))) {
      const targetRelPath = p.path.replace(/^\/+/, '')
      assetMap.set(p.content, targetRelPath)
      try {
        const url = new URL(p.content)
        assetMap.set(url.pathname, targetRelPath)
      } catch {}
    }
  }

  if (assetMap.size === 0) return pages

  return pages.map((page) => {
    if (!/\.(html?|css|js|jsx|ts|tsx)$/i.test(page.path) && page.path !== 'index.html') {
      return page
    }

    let updatedContent = page.content
    for (const [assetUrl, relPath] of assetMap.entries()) {
      if (updatedContent.includes(assetUrl)) {
        updatedContent = updatedContent.split(assetUrl).join(relPath)
      }
    }
    return { ...page, content: updatedContent }
  })
}

// Normalize generated files for deployment: paths arrive like 'src/index.html'
// or '/src/about.html'; the site root must be 'index.html' for Vercel/any host
// to serve it, so strip leading slashes and the generator's 'src/' prefix.
// Also drop the preview-only nav interceptor; internal links stay relative so
// multi-page navigation works on the deployed host.
function publishablePages(pages: unknown): PublishedPage[] {
  const result: PublishedPage[] = []

  for (const entry of (Array.isArray(pages) ? pages : [])) {
    const page = entry as PublishedPage
    if (typeof page?.path !== 'string' || typeof page?.content !== 'string') continue
    let cleanPath = page.path.replace(/^\/+/, '').replace(/^(\.\/)?src\//, '')
    // Exclude .gitkeep placeholders and internal artifacts
    if (cleanPath.endsWith('.gitkeep') || cleanPath.startsWith('.artifacts/')) continue
    // Exclude package.json: having package.json with a build script causes Vercel to treat
    // static deployments as Node.js apps and wipes out unbuilt static files
    if (cleanPath === 'package.json') continue

    // Flatten public/ files to root (e.g. public/robots.txt -> robots.txt)
    // A directory named 'public' causes Vercel to treat it as the webroot, 404ing index.html
    if (cleanPath.startsWith('public/')) {
      cleanPath = cleanPath.replace(/^public\//, '')
    }

    result.push({
      path: cleanPath,
      content: page.content.replace(/<script data-preview-nav="true">[\s\S]*?<\/script>/, ''),
    })
  }

  return normalizeAssetReferences(result)
}

function rewriteLinksForWorkers(slug: string, pages: PublishedPage[]): PublishedPage[] {
  const known = new Set(pages.map((p) => p.path))
  return pages.map(({ path, content }) => {
    if (!/\.(html?|css|js)$/i.test(path) && path !== 'index.html') return { path, content }

    let rewritten = content.replace(/(href\s*=\s*)(["'])(.*?)\2/gi, (m, attr: string, q: string, href: string) => {
      const resolved = resolvePagePath(path, href)
      return resolved && known.has(resolved) ? `${attr}${q}/published/${slug}/${resolved}${q}` : m
    })
    rewritten = rewritten.replace(/(src\s*=\s*)(["'])(.*?)\2/gi, (m, attr: string, q: string, src: string) => {
      const resolved = resolvePagePath(path, src)
      return resolved && known.has(resolved) ? `${attr}${q}/published/${slug}/${resolved}${q}` : m
    })
    return { path, content: rewritten }
  })
}
