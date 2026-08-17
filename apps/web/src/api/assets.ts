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

export async function uploadChatImage(file: File, token: string) {
  return upload(file, token, '/api/images/upload')
}
