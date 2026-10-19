import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
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
  onRenameSession?: (sessionId: string, newTitle: string) => Promise<void> | void
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
  onRenameSession,
  onRefreshSessions,
  workspaceProps,
  onPageError,
}: AppRoutesProps) {
  const location = useLocation()
  const navigate = useNavigate()
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
              onCreateSession={async (message: string, modelId?: string, planMode?: boolean, images?: File[]) => {
                try {
                  const serializedImages = images?.length
                    ? await Promise.all(
                        images.map(async (file) => ({
                          name: file.name,
                          type: file.type,
                          dataUrl: await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onload = () => resolve(reader.result as string)
                            reader.onerror = () => reject(reader.error)
                            reader.readAsDataURL(file)
                          }),
                        }))
                      )
                    : undefined

                  if (message || serializedImages?.length) {
                    sessionStorage.setItem(
                      'pendingInitialSubmit',
                      JSON.stringify({ message, modelId, planMode, images: serializedImages })
                    )
                  }
                } catch (err) {
                  console.error('[AppRoutes] Failed to persist pending prompt before auth redirect:', err)
                }

                navigate('/auth')
              }}
              onSelectSession={() => {
                navigate('/auth')
              }}
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
                    onRenameSession={onRenameSession}
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
