/**
 * Publication Cache Module
 *
 * Implements a simple TTL-based cache for publication data to reduce
 * redundant API calls. Cache expires after 30 seconds and can be
 * explicitly invalidated on create/delete operations.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import type { PublicationRecord } from '@/types/publication'

interface PublicationCacheEntry {
  data: PublicationRecord[]
  timestamp: number
  expiresAt: number
}

const CACHE_TTL = 30000 // 30 seconds

class PublicationCache {
  private cache: PublicationCacheEntry | null = null

  /**
   * Get cached publication data if valid
   * Returns null if cache is empty or expired
   *
   * Requirement 4.2: Return cached data within TTL
   */
  get(): PublicationRecord[] | null {
    if (!this.cache) {
      return null
    }

    if (!this.isValid()) {
      this.cache = null
      return null
    }

    return this.cache.data
  }

  /**
   * Store publication data in cache with TTL
   *
   * Requirement 4.1: Cache with 30-second TTL
   */
  set(data: PublicationRecord[]): void {
    const now = Date.now()
    this.cache = {
      data,
      timestamp: now,
      expiresAt: now + CACHE_TTL
    }
  }

  /**
   * Explicitly invalidate the cache
   * Used after create/delete operations
   *
   * Requirement 4.4: Explicit invalidation on create/delete
   */
  invalidate(): void {
    this.cache = null
  }

  /**
   * Check if cached data is still valid
   *
   * Requirement 4.3: Fetch fresh data after expiry
   */
  isValid(): boolean {
    if (!this.cache) {
      return false
    }

    return Date.now() < this.cache.expiresAt
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { hasCache: boolean; age: number | null; ttlRemaining: number | null } {
    if (!this.cache) {
      return { hasCache: false, age: null, ttlRemaining: null }
    }

    const now = Date.now()
    return {
      hasCache: true,
      age: now - this.cache.timestamp,
      ttlRemaining: Math.max(0, this.cache.expiresAt - now)
    }
  }
}

// Export singleton instance
export const publicationCache = new PublicationCache()
