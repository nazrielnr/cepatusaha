import type { HonoContext } from '../../shared/types'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])

type UploadFile = File & { arrayBuffer(): Promise<ArrayBuffer> }

function asUploadFile(value: unknown): UploadFile | null {
  if (!value || typeof value !== 'object' || !('arrayBuffer' in value)) return null
  return value as UploadFile
}

export async function uploadAsset(c: HonoContext) {
  return handleUpload(c, false)
}

export async function uploadImage(c: HonoContext) {
  return handleUpload(c, true)
}

export async function getAsset(c: HonoContext) {
  const key = c.req.path.split('/api/assets/object/')[1]
  if (!key) return c.json({ status: 'error', error: { code: 'INVALID_REQUEST', message: 'asset key is required' } }, 400)
  const object = await c.env.ASSETS_BUCKET.get(decodeURIComponent(key))
  if (!object) return c.json({ status: 'error', error: { code: 'NOT_FOUND', message: 'Asset not found' } }, 404)
  return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } })
}

async function handleUpload(c: HonoContext, imageOnly: boolean) {
  const auth = c.get('auth')
  if (!auth?.userId) return c.json({ status: 'error', error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)

  const form = await c.req.formData()
  const file = asUploadFile(form.get('file'))
  if (!file) return c.json({ status: 'error', error: { code: 'INVALID_FILE', message: 'file is required' } }, 400)
  if (file.size > MAX_UPLOAD_BYTES) return c.json({ status: 'error', error: { code: 'FILE_TOO_LARGE', message: 'Max upload size is 10MB' } }, 413)
  if (imageOnly && file.type && !IMAGE_TYPES.has(file.type)) return c.json({ status: 'error', error: { code: 'INVALID_IMAGE', message: 'Unsupported image type' } }, 400)

  const key = `${auth.userId}/${crypto.randomUUID()}-${safeName(file.name)}`
  await c.env.ASSETS_BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } })
  const base = (c.env.ASSETS_PUBLIC_URL || new URL(c.req.url).origin).replace(/\/$/, '')
  const url = c.env.ASSETS_PUBLIC_URL ? `${base}/${key}` : `${base}/api/assets/object/${key}`

  return c.json({ status: 'success', url, publicUrl: url, key, filename: file.name, size: file.size, contentType: file.type })
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'asset'
}
