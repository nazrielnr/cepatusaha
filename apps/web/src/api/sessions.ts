import type { SessionData, SessionSummary } from '../types/session'
import { handleAPIResponse } from '../utils/error-handler'
import { apiPathUrl } from '@/lib/apiClient'
import { fetchWithTokenRetry } from './auth'
import { withRequestDeduplication, generateRequestKey } from './request-cache'
import type { MessagePayload, SessionPayload, SessionUpsertPayload } from './sessionTypes'
import { mapSessionFromBackend, mapSessionSummary, mapSessionToBackend } from './sessionMappers'

export { mapSessionFromBackend, mapSessionToBackend } from './sessionMappers'

function ensureToken(token?: string): string {
  if (!token) {
    throw new Error('Autentikasi diperlukan untuk mengakses sumber daya.')
  }
  return token
}

// Standard headers for Vercel API with Clerk authentication
function buildFunctionHeaders(token: string, includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

export async function fetchSessions(token?: string): Promise<SessionSummary[]> {
  const sessionToken = ensureToken(token)
  const url = apiPathUrl('/sessions')
  const cacheKey = generateRequestKey(url, 'GET')

  return withRequestDeduplication(cacheKey, async () => {
    const response = await fetchWithTokenRetry(
      url,
      {
        method: 'GET',
        headers: buildFunctionHeaders(sessionToken, false),
      }
    )
    const payload = await handleAPIResponse<{ sessions: SessionPayload[] }>(response)
    return (payload.sessions ?? []).map(mapSessionSummary)
  })
}

export async function fetchSessionDetail(sessionId: string, token?: string): Promise<SessionData> {
  const sessionToken = ensureToken(token)
  const url = apiPathUrl(`/sessions?id=${encodeURIComponent(sessionId)}&includeMessages=true`)
  const cacheKey = generateRequestKey(url, 'GET')

  return withRequestDeduplication(cacheKey, async () => {
    const response = await fetchWithTokenRetry(
      url,
      {
        method: 'GET',
        headers: buildFunctionHeaders(sessionToken, false),
      }
    )
    const payload = await handleAPIResponse<{ session: SessionPayload; messages?: MessagePayload[] }>(response)
    if (!payload.session) {
      throw new Error('Sesi tidak ditemukan.')
    }
    // Requirement 8.3: Use mapSessionFromBackend for consistent data mapping
    return mapSessionFromBackend(payload.session, payload.messages ?? [])
  })
}

export async function createSession(payload: SessionUpsertPayload = {}, token?: string): Promise<SessionData> {
  const sessionToken = ensureToken(token)
  const url = apiPathUrl('/sessions')
  // Requirement 8.3: Use mapSessionToBackend for consistent data mapping
  const body = mapSessionToBackend(payload)
  const cacheKey = generateRequestKey(url, 'POST', body)

  return withRequestDeduplication(cacheKey, async () => {
    const response = await fetchWithTokenRetry(
      url,
      {
        method: 'POST',
        headers: buildFunctionHeaders(sessionToken),
        body: JSON.stringify(body),
      }
    )
    const data = await handleAPIResponse<{ session: SessionPayload }>(response)
    if (!data.session) {
      throw new Error('Gagal membuat sesi.')
    }
    // Requirement 8.3: Use mapSessionFromBackend for consistent data mapping
    return mapSessionFromBackend(data.session, [])
  })
}

export async function updateSession(sessionId: string, payload: SessionUpsertPayload, token?: string): Promise<SessionData> {
  const sessionToken = ensureToken(token)
  const url = apiPathUrl('/sessions')
  // Requirement 8.3: Use mapSessionToBackend for consistent data mapping
  const body = { id: sessionId, ...mapSessionToBackend(payload) }
  const cacheKey = generateRequestKey(url, 'PUT', body)

  return withRequestDeduplication(cacheKey, async () => {
    const response = await fetchWithTokenRetry(
      url,
      {
        method: 'PUT',
        headers: buildFunctionHeaders(sessionToken),
        body: JSON.stringify(body),
      }
    )
    const data = await handleAPIResponse<{ session: SessionPayload }>(response)
    if (!data.session) {
      throw new Error('Gagal memperbarui sesi.')
    }
    // Requirement 8.3: Use mapSessionFromBackend for consistent data mapping
    return mapSessionFromBackend(data.session, [])
  })
}

export async function deleteSession(sessionId: string, token?: string): Promise<void> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/sessions'),
    {
      method: 'DELETE',
      headers: buildFunctionHeaders(sessionToken),
      body: JSON.stringify({ id: sessionId }),
    }
  )
  await handleAPIResponse<{ success: boolean }>(response)
}
