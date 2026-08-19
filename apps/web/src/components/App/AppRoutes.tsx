import { Routes, Route, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import { LandingPage } from '@/pages/LandingPage'
import { AuthPage } from '@/pages/AuthPage'
import WorkspacePage from '@/pages/WorkspacePage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageErrorFallback } from '@/components/PageErrorFallback'
import type { SessionSummary } from '@/types/session'

interface AppRoutesProps {
  // Landing page props
  sessions: SessionSummary[]
  isSessionLoading: boolean
  onCreateSession: (message: string, modelId?: string, planMode?: boolean, images?: File[]) => Promise<void>
  onSelectSession: (sessionId: string) => Promise<void>
  onDeleteSession: (sessionId: string) => Promise<void>
  onRefreshSessions?: () => Promise<void>

  // Workspace page props
  workspaceProps: any // Will be properly typed in WorkspacePage component

  // Error handling
  onPageError: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * AppRoutes component
 *
 * Responsibility: Define all application routes with elegant transitions
 * - Landing page route (signed out and signed in)
 * - Workspace route (protected)
 * - Error boundaries for each route
 * - Smooth fade transitions between routes
 */
export function AppRoutes({
  sessions,
  isSessionLoading,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onRefreshSessions,
  workspaceProps,
  onPageError,
}: AppRoutesProps) {
  const location = useLocation()
  // Halaman yang berdiri sendiri (tanpa navbar/landing di belakangnya)
  const isStandalone = location.pathname === '/auth' || location.pathname === '/sso-callback'

  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
      </Routes>
      <div>
        <SignedOut>
          {!isStandalone && (
            <LandingPage
              sessions={[]}
              isSessionLoading={false}
              onCreateSession={async () => {
                // Will trigger sign-in flow
              }}
              onSelectSession={() => {}}
              onDeleteSession={() => {}}
            />
          )}
        </SignedOut>

        <SignedIn>
          <Routes>
            {/* Landing Page Route */}
            <Route
              path="/"
              element={
                <ErrorBoundary
                  fallback={<PageErrorFallback pageName="landing page" />}
                  onError={onPageError}
                >
                  <LandingPage
                    sessions={sessions.map((s) => ({
                      id: s.id,
                      title: s.title,
                      updatedAt: s.updatedAt,
                      previewThumbnail: s.previewThumbnail,
                    }))}
                    isSessionLoading={isSessionLoading}
                    onCreateSession={onCreateSession}
                    onSelectSession={onSelectSession}
                    onDeleteSession={onDeleteSession}
                    onRefreshSessions={onRefreshSessions}
                  />
                </ErrorBoundary>
              }
            />

            {/* Workspace Route - Protected */}
            <Route
              path="/projects/:sessionId"
              element={
                <ErrorBoundary
                  fallback={<PageErrorFallback pageName="workspace" />}
                  onError={onPageError}
                >
                  <ProtectedRoute>
                    <WorkspacePage {...workspaceProps} />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
          </Routes>
        </SignedIn>
      </div>
    </>
  )
}
