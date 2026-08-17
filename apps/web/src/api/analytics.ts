import type { AnalyticsSummary } from '@/types/analytics'
import { handleAPIResponse } from '../utils/error-handler'
import { fetchWithTokenRetry } from './auth'
import { apiPathUrl } from '@/lib/apiClient'

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

export async function fetchAnalytics(token?: string): Promise<AnalyticsSummary> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/get-analytics'),
    {
      method: 'GET',
      headers: buildFunctionHeaders(sessionToken, false),
    }
  )
  const payload = await handleAPIResponse<{ analytics: AnalyticsSummary }>(response)
  return payload.analytics
}
