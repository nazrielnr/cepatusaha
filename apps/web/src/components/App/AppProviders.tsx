import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { setTokenRefreshCallback } from '@/api'
import { setTokenRefreshCallback as setChatTokenRefresh } from '@/api/chat'

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * AppProviders component
 *
 * Responsibility: Setup authentication and global state providers
 * - Configures token refresh callbacks for API clients
 * - Wraps children with ThemeProvider
 */
export function AppProviders({ children }: AppProvidersProps) {
  const { getToken } = useAuth()

  // Setup token refresh for static chat API
  useEffect(() => {
    if (getToken) {
      setChatTokenRefresh(getToken)
    }
  }, [getToken])

  // Register token refresh callback for API client
  useEffect(() => {
    if (getToken) {
      setTokenRefreshCallback(async () => {
                const token = await getToken()
        if (!token) {
          throw new Error('Failed to refresh token')
        }
        return token
      })
    }
  }, [getToken])

  return <ThemeProvider>{children}</ThemeProvider>
}
