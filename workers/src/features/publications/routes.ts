import type { HonoContext } from '../../shared/types'
import { deletePublicationForClerkUser, listPublicationsForClerkUser, publishSiteForClerkUser, getPublishedPageForSlug } from './service'

function authUserId(c: HonoContext) {
  const userId = c.get('auth')?.userId
  if (!userId) throw new Error('UNAUTHORIZED')
  return userId
}

export async function listPublications(c: HonoContext) {
  const publications = await listPublicationsForClerkUser(c.env, authUserId(c))
  return c.json({ status: 'success', publications })
}

export async function publishSite(c: HonoContext) {
  const result = await publishSiteForClerkUser(c.env, authUserId(c), await c.req.json())
  return c.json(result)
}

export async function deletePublication(c: HonoContext) {
  const id = c.req.query('id')
  if (!id) return c.json({ status: 'error', error: { code: 'INVALID_REQUEST', message: 'id is required' } }, 400)
  await deletePublicationForClerkUser(c.env, authUserId(c), id)
  return c.json({ success: true, message: 'Publication deleted' })
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
  const MIME_TYPES: Record<string, string> = {
    html: 'text/html; charset=utf-8',
    htm: 'text/html; charset=utf-8',
    css: 'text/css; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    ico: 'image/x-icon',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    txt: 'text/plain; charset=utf-8',
    md: 'text/markdown; charset=utf-8',
    xml: 'application/xml',
  }
  return MIME_TYPES[ext] || 'text/plain; charset=utf-8'
}

// Direct worker publication hosting is completely disabled. Websites are deployed directly to Vercel.
export async function getPublishedPage(c: HonoContext) {
  return c.json({ error: 'Direct worker publication hosting is disabled. Websites are deployed directly to Vercel.' }, 404)
}
