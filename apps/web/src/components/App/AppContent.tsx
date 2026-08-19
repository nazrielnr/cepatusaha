import { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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
 * Creating a session from the landing page navigates with a full page reload,
 * so the initial prompt must survive the reload. sessionStorage lives in the
 * same tab, so it does; in-memory refs do not.
 */
const PENDING_SUBMIT_KEY = 'pendingInitialSubmit'

interface PendingSubmit {
  message: string
  modelId?: string
  planMode?: boolean
  images?: File[]
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function persistPendingSubmit(pending: PendingSubmit) {
  const images = pending.images?.length
    ? await Promise.all(
        pending.images.map(async (file) => ({
          name: file.name,
          type: file.type,
          dataUrl: await fileToDataUrl(file),
        })),
      )
    : undefined
  sessionStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify({ message: pending.message, modelId: pending.modelId, planMode: pending.planMode, images }))
}

async function readPendingSubmit(): Promise<PendingSubmit | null> {
  try {
    const raw = sessionStorage.getItem(PENDING_SUBMIT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // NOTE: intentionally do NOT consume the key here. It is only removed once
    // the submitted prompt actually landed in the chat (see pendingInitial)
    // so a failed/stalled submit can retry instead of silently losing it.
    const images = Array.isArray(parsed.images)
      ? await Promise.all(
          parsed.images.map(async (img: { name: string; type: string; dataUrl: string }) =>
            new File([await (await fetch(img.dataUrl)).blob()], img.name, { type: img.type }),
          ),
        )
      : undefined
    return { message: parsed.message, modelId: parsed.modelId, planMode: parsed.planMode, images }
  } catch {
    sessionStorage.removeItem(PENDING_SUBMIT_KEY)
    return null
  }
}

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
    // Push (not replace) so "home" stays in history and back returns home
    window.location.href = `/projects/${sessionId}`
  }, [])

  const chatMessagesRef = useRef<ChatMessage[]>([])
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

  // Initial prompt typed on the landing page, carried across the full page
  // reload that happens when the session is created.
  const [pendingInitial, setPendingInitial] = useState<PendingSubmit | null>(null)

  // Read the persisted prompt once the session becomes available (no consume).
  useEffect(() => {
    if (!appState.currentSession || pendingInitial) return
    void readPendingSubmit().then(setPendingInitial)
  }, [appState.currentSession, pendingInitial])

  // Submit the pending prompt as soon as the chat is ready. Re-arms whenever
  // the chat is still empty so a stall/race can't silently swallow the prompt.
  // Once the user message lands (messages non-empty) the pending is consumed.
  useEffect(() => {
    if (!pendingInitial || !appState.activeSessionId) return

    if (chatState.messages.length > 0) {
      sessionStorage.removeItem(PENDING_SUBMIT_KEY)
      setPendingInitial(null)
      return
    }

    const timer = setTimeout(() => {
      void handleUserSubmit(pendingInitial.message, 'chat', pendingInitial.modelId, pendingInitial.planMode, pendingInitial.images || [])
    }, 150)
    return () => clearTimeout(timer)
  }, [pendingInitial, appState.activeSessionId, chatState.messages, handleUserSubmit])

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
        window.location.replace(intendedRoute)
      }
    }
  }, [isLoaded, isSignedIn, location.pathname])

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
    // Clicking an existing session: never replay a stale landing-page prompt
    sessionStorage.removeItem(PENDING_SUBMIT_KEY)
    // Full page reload so the workspace mounts fresh (same as opening the URL directly)
    window.location.href = `/projects/${sessionId}`
  }, [])

  const handleRefreshSessions = appState.refreshSessions

  return (
    <>
      <AppRoutes
        sessions={appState.sessions}
        isSessionLoading={appState.isSessionLoading}
        onCreateSession={async (message: string, modelId?: string, planMode?: boolean, images?: File[]) => {
          // Persist before navigating: the reload that follows wipes in-memory refs.
          // Never block session creation if storage fails (private mode, quota).
          try {
            await persistPendingSubmit({ message, modelId, planMode, images })
          } catch (error) {
            console.error('[AppContent] Failed to persist pending submit:', error)
          }
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
