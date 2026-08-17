import { useState, useEffect, useCallback } from 'react'

interface UseAdminDataOptions {
  cacheTTL?: number
  pollInterval?: number
}

interface UseAdminDataReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Custom hook for fetching admin data with caching and error handling
 * 
 * @param fetchFn - Function that fetches the data
 * @param options - Configuration options
 * @returns Object with data, loading, error states and refresh function
 */
export function useAdminData<T>(
  fetchFn: () => Promise<T>,
  options: UseAdminDataOptions = {}
): UseAdminDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState(0)
  
  const cacheTTL = options.cacheTTL || 5 * 60 * 1000 // 5 minutes default
  
  const fetchData = useCallback(async (force = false) => {
    const now = Date.now()
    
    // Use cached data if available and not expired
    if (!force && data && now - lastFetch < cacheTTL) {
      return
    }
    
    try {
      setLoading(true)
      const result = await fetchFn()
      setData(result)
      setError(null)
      setLastFetch(now)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('useAdminData error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchFn, data, lastFetch, cacheTTL])
  
  useEffect(() => {
    fetchData()
    
    // Set up polling if interval is specified
    if (options.pollInterval) {
      const interval = setInterval(() => fetchData(true), options.pollInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, options.pollInterval])
  
  const refresh = useCallback(() => fetchData(true), [fetchData])
  
  return { data, loading, error, refresh }
}
