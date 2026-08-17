import { useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'

interface ProtectedAdminRouteProps {
  children: ReactNode
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoaded } = useUser()

  // Debug logging
  console.log('[ProtectedAdminRoute] isLoaded:', isLoaded)
  console.log('[ProtectedAdminRoute] user:', user)
  console.log('[ProtectedAdminRoute] publicMetadata:', user?.publicMetadata)
  console.log('[ProtectedAdminRoute] super_admin:', user?.publicMetadata?.super_admin)

  // Wait for user data to load
  if (!isLoaded) {
    console.log('[ProtectedAdminRoute] Waiting for user to load...')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has super_admin role in Clerk metadata
  const isSuperAdmin = user?.publicMetadata?.super_admin === true
  console.log('[ProtectedAdminRoute] isSuperAdmin:', isSuperAdmin)

  if (!isSuperAdmin) {
    console.log('[ProtectedAdminRoute] Access denied - not a super admin')
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access the admin dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Super administrator privileges are required.
          </p>
        </div>
      </div>
    )
  }

  console.log('[ProtectedAdminRoute] Access granted - rendering children')
  return <>{children}</>
}
