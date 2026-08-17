import { APIError } from '../utils/error-handler'

// Global token refresh callback - set by App.tsx on mount
let globalTokenRefreshCallback: (() => Promise<string>) | null = null

/**
 * Set global token refresh callback
 * This should be called once from App.tsx with Clerk's getToken function
 */
export function setTokenRefreshCallback(callback: () => Promise<string>) {
  globalTokenRefreshCallback = callback
}

/**
 * Get fresh token using global callback
 */
async function refreshToken(): Promise<string> {
  if (!globalTokenRefreshCallback) {
    throw new Error('Token refresh callback not set. Call setTokenRefreshCallback first.')
  }
  return await globalTokenRefreshCallback()
}

/**
 * Fetch with automatic retry on 401 errors
 * If we get 401, it means token expired - throw specific error so caller can refresh token
 */
async function fetchWithAuth(
  url: string,
  options: RequestInit,
  retryCount = 0
): Promise<Response> {
  const response = await fetch(url, options)

  // If 401 and this is first attempt, throw auth error so caller can refresh token
  if (response.status === 401 && retryCount === 0) {
    throw new APIError(
      'Token expired. Please refresh.',
      'TOKEN_EXPIRED',
      401
    )
  }

  return response
}

/**
 * Wrapper that handles token refresh automatically
 * Retries once with fresh token if first attempt fails with 401
 */
export async function fetchWithTokenRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  try {
    // First attempt
    return await fetchWithAuth(url, options, 0)
  } catch (error) {
    // If token expired, get fresh token and retry
    if (error instanceof APIError && error.code === 'TOKEN_EXPIRED') {

      try {
        // Get fresh token using global callback
        const freshToken = await refreshToken()

        // Update Authorization header
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${freshToken}`)

        // Retry with fresh token
        const retryResponse = await fetchWithAuth(
          url,
          { ...options, headers },
          1 // Mark as retry
        )

        return retryResponse
      } catch (refreshError) {
        console.error('[API Client] Token refresh failed:', refreshError)
        // Throw original auth error
        throw error
      }
    }

    // Re-throw other errors
    throw error
  }
}
