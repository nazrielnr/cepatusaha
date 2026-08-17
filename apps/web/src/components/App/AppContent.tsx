import { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { usePreventBodyPadding } from '@/hooks/usePreventBodyPadding'
import { useAppState } from '@/hooks/useAppState'
import { useChatState } from '@/hooks/useChatState'
import { usePreviewState } from '@/hooks/usePreviewState'
import { AppRoutes } from './AppRoutes'
import { PublishDomainDialog } from '@/components/publish/PublishDomainDialog'
import { updateSession } from '@/api/sessions'
import { getProjectFiles } from '@/api/files'
import type { ChatMessage } from '@/types/chat'
import { AppOverlays } from './AppOverlays'
import { deriveProjectTitle } from './appContentUtils'
import { useAppWorkspaceProps } from './useAppWorkspaceProps'
import { useHtmlUpdate } from './useHtmlUpdate'

/**
 * AppContent component
 *
 * Responsibility: Main application logic and state orchestration
 * - Uses custom hooks for state management (useAppState, useChatState, usePreviewState)
 * - Handles user interactions and callbacks
 * - Passes state down to routes via AppRoutes
 */
export function AppContent() {
  // Prevent Radix UI from adding padding to body
  usePreventBodyPadding()

  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Simple token getter - let Clerk handle caching and refresh
  const requireToken = useCallback(async () => {
    const token = await getToken()

    if (!token) {
      console.error('[AppContent] No token received from Clerk!')
      throw new Error('Sesi tidak valid. Silakan masuk kembali.')
    }

    return token
  }, [getToken])

  // Use custom hooks for state management
  const appState = useAppState({ requireToken, enabled: Boolean(isSignedIn) })
  const previewState = usePreviewState()

  // Handle session creation and navigation
  const handleSessionCreated = useCallback((sessionId: string) => {
    navigate(`/projects/${sessionId}`, { replace: true })
  }, [navigate])

  const chatMessagesRef = useRef<ChatMessage[]>([])
  const pendingInitialSubmitRef = useRef<{ message: string; modelId?: string; planMode?: boolean; images?: File[] } | null>(null)
  const lastHydratedSessionIdRef = useRef<string | null>(null)
  const lastPreviewSessionIdRef = useRef<string | null>(null)
  const autoTitledSessionsRef = useRef<Set<string>>(new Set()) // Track sessions that already got auto-titled

  // Auto-update session title once per session when it's still default
  const handleAutoTitle = useCallback(async (files: any[], sessionIdOverride?: string) => {
    const sessionId = sessionIdOverride || appState.activeSessionId || appState.currentSession?.id || ''

    // Skip if already auto-titled this session
    if (autoTitledSessionsRef.current.has(sessionId)) {
      return
    }

    const currentTitle = appState.currentSession?.title || ''
    const isDefaultTitle = !currentTitle || ['proyek baru', 'new project', 'new session'].includes(currentTitle.toLowerCase())
    if (!sessionId || !isDefaultTitle) {
      return
    }

    const suggestion = deriveProjectTitle(files, chatMessagesRef.current)
    if (!suggestion) {
      return
    }

    // Mark as titled BEFORE async operation to prevent race conditions
    autoTitledSessionsRef.current.add(sessionId)

    try {
      appState.updateSessionTitle(sessionId, suggestion)
      const token = await requireToken()
      await updateSession(sessionId, { title: suggestion }, token)
    } catch (error) {
      // Remove from set if failed so it can retry
      autoTitledSessionsRef.current.delete(sessionId)
      console.error('[AppContent] Failed to auto-update session title:', error)
    }
  }, [appState, requireToken])

  const handlePreviewRefresh = useCallback((files: any[], sessionIdFromHook?: string) => {
    previewState.updatePreviewFromFiles(files)
    void handleAutoTitle(files, sessionIdFromHook)
  }, [previewState, handleAutoTitle])

  const chatState = useChatState({
    requireToken,
    currentSessionId: appState.activeSessionId ?? undefined,
    onSessionCreate: appState.createSession,
    onSessionCreated: handleSessionCreated,
    onPreviewRefresh: handlePreviewRefresh,
    projectId: appState.currentSession?.project_id,
  })

  const { resetPreviewState } = previewState
  const { setMessages, handleUserSubmit } = chatState

  // Reset preview state when switching to a new session (or no session)
  useEffect(() => {
    const sessionId = appState.activeSessionId || null
    const isNewSession = sessionId && sessionId !== lastPreviewSessionIdRef.current

    if (!sessionId || isNewSession) {
      resetPreviewState?.()
      lastPreviewSessionIdRef.current = sessionId
    }
  }, [appState.activeSessionId, resetPreviewState])

  // Sync messages from current session to chat state, and keep ref updated
  useEffect(() => {
    const session = appState.currentSession
    if (!session) return

    const sessionMessages = session.messages || []
    const sessionId = session.id
    const isNewSession = sessionId !== lastHydratedSessionIdRef.current

    // Only hydrate when switching sessions
    // Don't sync based on message count to avoid infinite loops
    if (!isNewSession) return


    setMessages(sessionMessages)
    chatMessagesRef.current = sessionMessages
    lastHydratedSessionIdRef.current = sessionId

    // Check for initial message from landing page
    const pending = pendingInitialSubmitRef.current
    if (pending && sessionMessages.length === 0) {
      pendingInitialSubmitRef.current = null
      setTimeout(() => {
        handleUserSubmit(pending.message, 'chat', pending.modelId, pending.planMode, pending.images || [])
      }, 100)
    }
  }, [appState.currentSession, setMessages, handleUserSubmit])

  // Keep ref in sync when messages change
  useEffect(() => {
    chatMessagesRef.current = chatState.messages
  }, [chatState.messages])

  // When selecting an existing session, hydrate preview/files from project
  useEffect(() => {
    const projectId = appState.currentSession?.project_id
    const sessionId = appState.currentSession?.id
    if (!projectId || !sessionId) return

    const hydrate = async () => {
      try {
        const token = await requireToken()
        const files = await getProjectFiles(projectId, token)
        handlePreviewRefresh(files, sessionId)
      } catch (error) {
        console.error('[AppContent] Failed to hydrate preview for session:', sessionId, error)
      }
    }

    void hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState.currentSession?.id, appState.currentSession?.project_id])

  // UI state
  const [activeOverlay, setActiveOverlay] = useState<'history' | 'analytics' | 'assets' | null>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)

  // Handle post-login redirect to intended route
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const intendedRoute = sessionStorage.getItem('intendedRoute')
      if (intendedRoute && intendedRoute !== '/' && location.pathname === '/') {
        sessionStorage.removeItem('intendedRoute')
        navigate(intendedRoute, { replace: true })
      }
    }
  }, [isLoaded, isSignedIn, location.pathname, navigate])

  // Error reporting callback for error boundaries
  const handlePageError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      console.error('[AppContent] Page error caught:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        location: location.pathname,
        userId: user?.id,
      })

      // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
    },
    [location.pathname, user?.id]
  )

  const handleHtmlUpdate = useHtmlUpdate({ appState, previewState, getToken })

  // Handle publish request
  const handlePublishRequest = useCallback(() => {
    // First time publishing, show domain name dialog
    setShowPublishDialog(true)
  }, [])

  const workspaceProps = useAppWorkspaceProps({
    appState,
    chatState,
    previewState,
    userId: user?.id,
    requireToken,
    handlePublishRequest,
    handleHtmlUpdate,
  })

  const handleSelectSession = useCallback(async (sessionId: string) => {
    navigate(`/projects/${sessionId}`)
  }, [navigate])

  const handleRefreshSessions = appState.refreshSessions

  return (
    <>
      <AppRoutes
        sessions={appState.sessions}
        isSessionLoading={appState.isSessionLoading}
        onCreateSession={async (message: string, modelId?: string, planMode?: boolean, images?: File[]) => {
          pendingInitialSubmitRef.current = { message, modelId, planMode, images }
          const session = await appState.createSession()
          handleSessionCreated(session.id)
        }}
        onSelectSession={handleSelectSession}
        onDeleteSession={appState.handleDeleteSession}
        onRefreshSessions={handleRefreshSessions}
        workspaceProps={workspaceProps}
        onPageError={handlePageError}
      />

      <AppOverlays activeOverlay={activeOverlay} setActiveOverlay={setActiveOverlay} appState={appState} userId={user?.id} getToken={getToken} />

      {/* Publish Domain Dialog */}
      <PublishDomainDialog
        isOpen={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
        onConfirm={appState.handlePublishWithDomain}
        isPublishing={appState.isPublishing}
        businessName={appState.profileDraft.businessName}
      />
    </>
  )
}
