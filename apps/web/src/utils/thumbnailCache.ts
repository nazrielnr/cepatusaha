/**
 * Thumbnail cache utility for storing and retrieving preview thumbnails
 * Uses localStorage for persistent caching across sessions
 */

const CACHE_PREFIX = 'thumbnail_'
const CACHE_VERSION = 'v1'
const MAX_CACHE_SIZE_MB = 10 // Maximum cache size in MB
const MAX_CACHE_AGE_DAYS = 7 // Maximum age of cached thumbnails

interface CachedThumbnail {
  data: string // Base64 encoded image
  timestamp: number
  sessionId: string
  version: string
}

/**
 * Get cache key for a session
 */
function getCacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${sessionId}`
}

/**
 * Get cached thumbnail for a session
 * Returns null if not found or expired
 */
export function getCachedThumbnail(sessionId: string): string | null {
  try {
    const key = getCacheKey(sessionId)
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsed: CachedThumbnail = JSON.parse(cached)

    // Check version
    if (parsed.version !== CACHE_VERSION) {
      localStorage.removeItem(key)
      return null
    }

    // Check age
    const ageInDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24)
    if (ageInDays > MAX_CACHE_AGE_DAYS) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch (error) {
    console.error('[ThumbnailCache] Error reading cache:', error)
    return null
  }
}

/**
 * Set cached thumbnail for a session
 * Automatically manages cache size
 */
export function setCachedThumbnail(sessionId: string, thumbnail: string): void {
  try {
    const key = getCacheKey(sessionId)
    const cached: CachedThumbnail = {
      data: thumbnail,
      timestamp: Date.now(),
      sessionId,
      version: CACHE_VERSION,
    }

    // Check if adding this would exceed cache size
    const dataSize = new Blob([JSON.stringify(cached)]).size / (1024 * 1024) // Size in MB

    if (dataSize > MAX_CACHE_SIZE_MB) {
      console.warn('[ThumbnailCache] Thumbnail too large to cache:', sessionId, dataSize.toFixed(2), 'MB')
      return
    }

    // Check total cache size and clean if needed
    const totalSize = getTotalCacheSize()
    if (totalSize + dataSize > MAX_CACHE_SIZE_MB) {
      cleanOldestEntries(dataSize)
    }

    localStorage.setItem(key, JSON.stringify(cached))
  } catch (error) {
    console.error('[ThumbnailCache] Error writing cache:', error)

    // If quota exceeded, try to clean cache and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearThumbnailCache()

      try {
        const key = getCacheKey(sessionId)
        const cached: CachedThumbnail = {
          data: thumbnail,
          timestamp: Date.now(),
          sessionId,
          version: CACHE_VERSION,
        }
        localStorage.setItem(key, JSON.stringify(cached))
      } catch (retryError) {
        console.error('[ThumbnailCache] Failed to cache after cleanup:', retryError)
      }
    }
  }
}

/**
 * Remove cached thumbnail for a session
 */
export function removeCachedThumbnail(sessionId: string): void {
  try {
    localStorage.removeItem(getCacheKey(sessionId))
  } catch (error) {
    console.error('[ThumbnailCache] Error removing cache:', error)
  }
}

/**
 * Clear all cached thumbnails
 */
export function clearThumbnailCache(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('[ThumbnailCache] Error clearing cache:', error)
  }
}

/**
 * Get total size of cached thumbnails in MB
 */
function getTotalCacheSize(): number {
  try {
    const totalSize = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .reduce((total, key) => {
        const value = localStorage.getItem(key)
        return total + (value ? new Blob([value]).size : 0)
      }, 0)

    return totalSize / (1024 * 1024) // Convert to MB
  } catch (error) {
    console.error('[ThumbnailCache] Error calculating cache size:', error)
    return 0
  }
}

/**
 * Clean oldest cache entries to make room for new data
 */
function cleanOldestEntries(requiredSpaceMB: number): void {
  try {
    const entries = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .flatMap(key => {
        const value = localStorage.getItem(key)
        if (!value) return []
        try {
          const parsed: CachedThumbnail = JSON.parse(value)
          return [{ key, timestamp: parsed.timestamp, size: new Blob([value]).size / (1024 * 1024) }]
        } catch {
          localStorage.removeItem(key)
          return []
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp)

    let freedSpace = 0
    for (const entry of entries) {
      if (freedSpace >= requiredSpaceMB) break
      localStorage.removeItem(entry.key)
      freedSpace += entry.size
    }
  } catch (error) {
    console.error('[ThumbnailCache] Error cleaning cache:', error)
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  count: number
  totalSizeMB: number
  oldestTimestamp: number | null
  newestTimestamp: number | null
} {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX))
    let totalSize = 0
    let oldestTimestamp: number | null = null
    let newestTimestamp: number | null = null

    keys.forEach(key => {
      const value = localStorage.getItem(key)
      if (!value) return
      try {
        const parsed: CachedThumbnail = JSON.parse(value)
        totalSize += new Blob([value]).size

        if (oldestTimestamp === null || parsed.timestamp < oldestTimestamp) oldestTimestamp = parsed.timestamp
        if (newestTimestamp === null || parsed.timestamp > newestTimestamp) newestTimestamp = parsed.timestamp
      } catch {
        // Invalid entry, skip
      }
    })

    return {
      count: keys.length,
      totalSizeMB: totalSize / (1024 * 1024),
      oldestTimestamp,
      newestTimestamp,
    }
  } catch (error) {
    console.error('[ThumbnailCache] Error getting cache stats:', error)
    return {
      count: 0,
      totalSizeMB: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    }
  }
}
