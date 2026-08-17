/**
 * Request Deduplication Cache
 *
 * Prevents duplicate simultaneous requests by caching pending promises.
 * Automatically cleans up cache entries when promises resolve or reject.
 */

interface RequestCacheEntry {
  promise: Promise<any>
  timestamp: number
}

class RequestCache {
  private cache: Map<string, RequestCacheEntry> = new Map()

  /**
   * Get a cached promise by key
   */
  get(key: string): Promise<any> | null {
    const entry = this.cache.get(key)
    return entry ? entry.promise : null
  }

  /**
   * Store a promise in the cache
   */
  set(key: string, promise: Promise<any>): void {
    this.cache.set(key, {
      promise,
      timestamp: Date.now()
    })
  }

  /**
   * Remove a promise from the cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cached promises
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get the number of cached requests
   */
  size(): number {
    return this.cache.size
  }
}

// Singleton instance
const requestCache = new RequestCache()

/**
 * Generate a cache key from request parameters
 * Uses URL, method, and body hash to create unique identifier
 */
export function generateRequestKey(
  url: string,
  method: string,
  body?: any
): string {
  const bodyHash = body ? hashObject(body) : ''
  return `${method}:${url}:${bodyHash}`
}

/**
 * Simple hash function for objects
 * Creates a consistent hash from object properties
 */
function hashObject(obj: any): string {
  if (!obj) return ''

  try {
    const str = JSON.stringify(obj)
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return hash.toString(36)
  } catch (err) {
    console.warn('Failed to hash object:', err)
    return ''
  }
}

/**
 * Wrapper function that deduplicates requests
 *
 * If an identical request is already in progress, returns the existing promise.
 * Otherwise, executes the request function and caches the promise.
 * Automatically cleans up cache on resolution or rejection.
 *
 * @param key - Unique cache key for the request
 * @param requestFn - Function that returns a promise for the actual request
 * @returns Promise that resolves with the request result
 *
 * @example
 * ```typescript
 * const key = generateRequestKey('/api/sessions', 'GET')
 * const result = await withRequestDeduplication(key, () => fetch('/api/sessions'))
 * ```
 */
export async function withRequestDeduplication<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if request is already in progress
  const cached = requestCache.get(key)
  if (cached) {
    return cached as Promise<T>
  }

  // Execute the request and cache the promise
  const promise = requestFn()
  requestCache.set(key, promise)

  // Automatic cleanup on resolution or rejection
  promise
    .then(() => {
      requestCache.delete(key)
    })
    .catch(() => {
      requestCache.delete(key)
    })

  return promise
}

/**
 * Clear all cached requests
 * Useful when authentication state changes or on logout
 */
export function clearRequestCache(): void {
  requestCache.clear()
}

/**
 * Get the current cache size (for debugging/monitoring)
 */
export function getRequestCacheSize(): number {
  return requestCache.size()
}

// Export the cache instance for testing purposes
export { requestCache }
