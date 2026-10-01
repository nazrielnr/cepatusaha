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

// Public serving of published sites. Latest publication wins for a given slug.
export async function getPublishedPage(c: HonoContext) {
  const slug = c.req.param('slug')
  // /published/toko/about.html -> page path 'about.html'; /published/toko/sub/x.html -> 'sub/x.html'
  const rawPath = c.req.path.replace(new RegExp(`^/published/${slug}/?`), '')
  const page = await getPublishedPageForSlug(c.env, slug, rawPath)
  if (!page) return c.text('Not found', 404)
  return c.html(page)
}
