import { apiUrl, readError } from './client'

async function upload(file: File, token: string, path: string) {
  const form = new FormData()
  form.append('file', file)

  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json() as { url?: string; publicUrl?: string; key?: string; filename?: string; size?: number; contentType?: string }
  const url = data.url ?? data.publicUrl
  if (!url) throw new Error('Upload response missing URL')
  return { url, key: data.key, name: data.filename || file.name, size: data.size || file.size, type: data.contentType || file.type }
}

export async function uploadProductImage(_userId: string, file: File, token: string) {
  return (await upload(file, token, '/api/assets/upload')).url
}

// Cloudflare Workers free tier only has 10ms CPU per invocation; the worker
// base64-inlines chat images for the vision model, so chat uploads must stay
// small. Downscale to <=1568px (vision-model friendly) and ~<=400KB client-side
// before uploading. GIF/SVG pass through untouched (canvas would kill animation
// / vector data).
const CHAT_IMAGE_MAX_EDGE = 1568
const CHAT_IMAGE_TARGET_BYTES = 400 * 1024

export async function downscaleImageForChat(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (file.size <= CHAT_IMAGE_TARGET_BYTES) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, CHAT_IMAGE_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale >= 1 && file.size <= CHAT_IMAGE_TARGET_BYTES * 2) {
      bitmap.close()
      return file
    }
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const toFile = (blob: Blob | null, type: string, ext: string): File | null =>
      blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type }) : null

    // PNG keeps transparency (screenshots with text); JPEG is much smaller for photos.
    const keepPng = file.type === 'image/png' && (file.size <= CHAT_IMAGE_TARGET_BYTES * 2 || /screenshot|capture|chart|ui/i.test(file.name))
    const pngBlob = keepPng ? await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png')) : null
    if (pngBlob && pngBlob.size <= CHAT_IMAGE_TARGET_BYTES * 2) {
      const f = toFile(pngBlob, 'image/png', '.png')
      if (f) return f
    }
    const jpegBlob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85))
    const jpeg = toFile(jpegBlob, 'image/jpeg', '.jpg')
    if (jpeg) return jpeg
    return file
  } catch {
    return file
  }
}

export async function uploadChatImage(file: File, token: string) {
  const prepared = await downscaleImageForChat(file)
  return upload(prepared, token, '/api/images/upload')
}
