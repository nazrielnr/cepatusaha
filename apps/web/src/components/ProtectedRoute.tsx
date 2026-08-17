/**
 * ProtectedRoute Component
 *
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to landing page and preserves intended route.
 */

import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  // Redirect to landing if not signed in, preserving intended route
  if (!isSignedIn) {
    // Store the intended route in session storage for post-login redirect
    sessionStorage.setItem('intendedRoute', location.pathname)

    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
