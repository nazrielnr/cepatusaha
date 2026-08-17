import { useEffect, useRef, useState, useCallback } from 'react'

interface UsePollingOptions {
  interval: number
  enabled?: boolean
}

interface UsePollingReturn {
  isPolling: boolean
  pause: () => void
  resume: () => void
}

/**
 * Custom hook for polling data at regular intervals
 * 
 * @param callback - Function to call on each poll
 * @param options - Configuration options
 * @returns Object with polling state and control functions
 */
export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
): UsePollingReturn {
  const [isPolling, setIsPolling] = useState(options.enabled !== false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  const pause = useCallback(() => {
    setIsPolling(false)
  }, [])
  
  const resume = useCallback(() => {
    setIsPolling(true)
  }, [])
  
  useEffect(() => {
    if (!isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    
    // Execute callback immediately on start
    const executeCallback = async () => {
      try {
        await callbackRef.current()
      } catch (error) {
        console.error('Polling callback error:', error)
      }
    }
    
    executeCallback()
    
    // Set up interval
    intervalRef.current = setInterval(executeCallback, options.interval)
    
    // Cleanup on unmount or when polling stops
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPolling, options.interval])
  
  return { isPolling, pause, resume }
}
