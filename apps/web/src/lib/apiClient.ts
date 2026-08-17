import { API_BASE_URL, API_PATH } from './env'
import { APIError } from '@/utils/error-handler'
import { fetchWithTokenRetry } from '@/api/auth'

export function joinApiUrl(path: string, base = API_BASE_URL): string {
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function apiUrl(path: string): string {
  return joinApiUrl(path)
}

export function apiPathUrl(path: string): string {
  return joinApiUrl(`${API_PATH.replace(/\/$/, '')}/${path.replace(/^\//, '')}`)
}

export function requireToken(token?: string): string {
  if (!token) throw new Error('Authentication required')
  return token
}

export function jsonHeaders(token?: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function readError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  if (!text) return response.statusText || 'Request failed'
  try {
    const json = JSON.parse(text)
    return json?.error?.message || json?.error || json?.message || text
  } catch {
    return text
  }
}

export function apiBaseCandidates(pathPrefix = API_PATH): string[] {
  const path = pathPrefix.trim()
  const withPath = path ? joinApiUrl(path) : API_BASE_URL
  const fallback = path ? API_BASE_URL : joinApiUrl('/api')
  return [withPath, fallback].filter((v, i, arr) => v && arr.indexOf(v) === i)
}

export async function fetchWithBaseFallback(path: string, options: RequestInit, bases = apiBaseCandidates()): Promise<Response> {
  let lastError: unknown = null
  for (const base of bases) {
    try {
      return await fetchWithTokenRetry(joinApiUrl(path, base), options)
    } catch (error) {
      lastError = error
      if (!(error instanceof APIError) || error.statusCode !== 404) throw error
    }
  }
  if (lastError) throw lastError
  throw new APIError('Failed to reach API', 'API_UNREACHABLE')
}
