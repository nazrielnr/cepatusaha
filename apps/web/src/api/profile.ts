import type { Profile } from '../types/profile'
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

export async function getProfile(token?: string): Promise<Profile> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/profile'),
    {
      method: 'GET',
      headers: buildFunctionHeaders(sessionToken, false),
    }
  )
  return handleAPIResponse<Profile>(response)
}

export async function updateProfile(profile: Profile, token?: string): Promise<Profile> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/profile'),
    {
      method: 'PUT',
      headers: buildFunctionHeaders(sessionToken),
      body: JSON.stringify(profile),
    }
  )
  return handleAPIResponse<Profile>(response)
}
