import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then(m => ({ default: m.UsersPage })))
const ChatsPage = lazy(() => import('@/pages/ChatsPage').then(m => ({ default: m.ChatsPage })))
const ModelsPage = lazy(() => import('@/pages/ModelsPage').then(m => ({ default: m.ModelsPage })))
const TokensPage = lazy(() => import('@/pages/TokensPage').then(m => ({ default: m.TokensPage })))
const StoragePage = lazy(() => import('@/pages/StoragePage').then(m => ({ default: m.StoragePage })))
const PublicationsPage = lazy(() => import('@/pages/PublicationsPage').then(m => ({ default: m.PublicationsPage })))
const SystemHealthPage = lazy(() => import('@/pages/SystemHealthPage').then(m => ({ default: m.SystemHealthPage })))
const FunctionsPage = lazy(() => import('@/pages/FunctionsPage').then(m => ({ default: m.FunctionsPage })))
const UserAnalyticsPage = lazy(() => import('@/pages/UserAnalyticsPage').then(m => ({ default: m.UserAnalyticsPage })))
const UserDetailPage = lazy(() => import('@/pages/UserDetailPage').then(m => ({ default: m.UserDetailPage })))
const UserSessionsPage = lazy(() => import('@/pages/UserSessionsPage').then(m => ({ default: m.UserSessionsPage })))
const SessionDetailPage = lazy(() => import('@/pages/SessionDetailPage').then(m => ({ default: m.SessionDetailPage })))
const DependenciesPage = lazy(() => import('@/pages/DependenciesPage').then(m => ({ default: m.DependenciesPage })))
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route
          path="/sign-in"
          element={
            <div className="flex min-h-screen items-center justify-center">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/*"
          element={
            <>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
              <SignedIn>
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Suspense fallback={
                      <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-muted-foreground">Loading...</div>
                      </div>
                    }>
                      <Routes>
                        <Route index element={<DashboardPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="chats" element={<ChatsPage />} />
                        <Route path="chats/users/:userId" element={<UserSessionsPage />} />
                        <Route path="chats/sessions/:sessionId" element={<SessionDetailPage />} />
                        <Route path="models" element={<ModelsPage />} />
                        <Route path="tokens" element={<TokensPage />} />
                        <Route path="storage" element={<StoragePage />} />
                        <Route path="publications" element={<PublicationsPage />} />
                        <Route path="health" element={<SystemHealthPage />} />
                        <Route path="functions" element={<FunctionsPage />} />
                        <Route path="analytics" element={<UserAnalyticsPage />} />
                        <Route path="analytics/users/:userId" element={<UserDetailPage />} />
                        <Route path="dependencies" element={<DependenciesPage />} />
                        <Route path="audit-logs" element={<AuditLogsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                      </Routes>
                    </Suspense>
                  </AdminLayout>
                </ProtectedAdminRoute>
              </SignedIn>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
