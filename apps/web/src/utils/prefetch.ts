/**
 * Route prefetching utilities for optimizing navigation performance
 * Prefetches session data and workspace components on hover
 */

import { apiPathUrl } from '@/lib/apiClient'

// Track prefetched sessions to avoid duplicate requests
const prefetchedSessions = new Set<string>()

// Track prefetch timers to debounce hover events
const prefetchTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Prefetch delay in milliseconds (wait for user to hover for this long)
const PREFETCH_DELAY = 300

/**
 * Prefetch session data from API
 * @param sessionId - Session ID to prefetch
 * @param getToken - Function to get auth token
 */
export async function prefetchSessionData(
  sessionId: string,
  getToken: () => Promise<string>
): Promise<void> {
  // Skip if already prefetched
  if (prefetchedSessions.has(sessionId)) return

  try {
    const token = await getToken()

    // Prefetch session messages
    const messagesUrl = apiPathUrl(`/session-messages?sessionId=${sessionId}`)
    const messagesResponse = await fetch(messagesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (messagesResponse.ok) {
      // Parse response to populate browser cache
      await messagesResponse.json()
    }

    // Mark as prefetched
    prefetchedSessions.add(sessionId)
  } catch (error) {
    console.error('[Prefetch] Failed to prefetch session data:', error)
  }
}

/**
 * Prefetch workspace component bundle
 * Uses React.lazy to trigger dynamic import
 */
export function prefetchWorkspaceComponent(): void {
  try {
    // Trigger dynamic import to load workspace bundle
    // The import will be cached by the browser
    import('@/pages/WorkspacePage').catch((error) => {
      console.error('[Prefetch] Failed to prefetch workspace component:', error)
    })
  } catch (error) {
    console.error('[Prefetch] Failed to prefetch workspace component:', error)
  }
}

/**
 * Handle hover event on project card
 * Debounces prefetch to avoid unnecessary requests
 * @param sessionId - Session ID to prefetch
 * @param getToken - Function to get auth token
 */
export function handleProjectCardHover(
  sessionId: string,
  getToken: () => Promise<string>
): void {
  // Clear existing timer for this session
  const existingTimer = prefetchTimers.get(sessionId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // Set new timer
  const timer = setTimeout(() => {
    // Prefetch session data
    prefetchSessionData(sessionId, getToken)

    // Prefetch workspace component (only once)
    if (!prefetchedSessions.has('__workspace_component__')) {
      prefetchWorkspaceComponent()
      prefetchedSessions.add('__workspace_component__')
    }

    // Clean up timer
    prefetchTimers.delete(sessionId)
  }, PREFETCH_DELAY)

  prefetchTimers.set(sessionId, timer)
}

/**
 * Cancel prefetch for a session
 * Called when user stops hovering before delay expires
 * @param sessionId - Session ID to cancel prefetch for
 */
export function cancelPrefetch(sessionId: string): void {
  const timer = prefetchTimers.get(sessionId)
  if (timer) {
    clearTimeout(timer)
    prefetchTimers.delete(sessionId)
  }
}

/**
 * Clear all prefetch data
 * Useful for testing or when user signs out
 */
export function clearPrefetchCache(): void {
  prefetchedSessions.clear()
  prefetchTimers.forEach(timer => clearTimeout(timer))
  prefetchTimers.clear()
}

/**
 * Get prefetch statistics
 */
export function getPrefetchStats(): {
  prefetchedCount: number
  pendingCount: number
} {
  return {
    prefetchedCount: prefetchedSessions.size,
    pendingCount: prefetchTimers.size,
  }
}
