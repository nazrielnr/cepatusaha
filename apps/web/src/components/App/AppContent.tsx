import { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { usePreventBodyPadding } from '@/hooks/usePreventBodyPadding'
import { useAppState } from '@/hooks/useAppState'
import { useChatState } from '@/hooks/useChatState'
import { usePreviewState } from '@/hooks/usePreviewState'
import { AppRoutes } from './AppRoutes'
import { PublishDomainDialog } from '@/components/publish/PublishDomainDialog'
import { getProjectFiles } from '@/api/files'
import type { ChatMessage } from '@/types/chat'
import { AppOverlays } from './AppOverlays'
import { publishSite } from '@/api/publications'
import type { PublishResponse } from '@/types/publication'
import { useAppWorkspaceProps } from './useAppWorkspaceProps'
import { useHtmlUpdate } from './useHtmlUpdate'
import { getProjectAssetFiles, resolveAssetUrlsInHtml, resolveAssetUrlsInCss } from '@/utils/virtualAssetResolver'

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

function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): File {
  const parts = dataUrl.split(',')
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || mimeType || 'image/png'
  const bstr = atob(parts[1] || '')
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
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
  try {
    sessionStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify({ message: pending.message, modelId: pending.modelId, planMode: pending.planMode, images }))
  } catch (e) {
    console.warn('[AppContent] sessionStorage quota exceeded for pending images:', e)
  }
}

async function readPendingSubmit(): Promise<PendingSubmit | null> {
  try {
    const raw = sessionStorage.getItem(PENDING_SUBMIT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const images = Array.isArray(parsed.images)
      ? parsed.images.map((img: { name: string; type: string; dataUrl: string }) =>
          dataUrlToFile(img.dataUrl, img.name, img.type),
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
  const handlePreviewRefresh = useCallback((files: any[], _sessionId?: string) => {
    previewState.updatePreviewFromFiles(files)
  }, [previewState])

  const chatState = useChatState({
    requireToken,
    currentSessionId: appState.activeSessionId ?? undefined,
    onSessionCreate: appState.createSession,
    onSessionCreated: handleSessionCreated,
    onPreviewRefresh: handlePreviewRefresh,
    projectId: appState.currentSession?.project_id,
    onSessionTitleUpdate: appState.updateSessionTitle,
  })

  const { resetPreviewState } = previewState
  const { setMessages, handleUserSubmit } = chatState

  // Initial prompt typed on the landing page, carried across the full page
  // reload that happens when the session is created.
  const [pendingInitial, setPendingInitial] = useState<PendingSubmit | null>(null)
  const pendingSubmittedRef = useRef(false)

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

    if (chatState.messages.length > 0 && pendingSubmittedRef.current) {
      sessionStorage.removeItem(PENDING_SUBMIT_KEY)
      setPendingInitial(null)
      pendingSubmittedRef.current = false
      return
    }

    if (pendingSubmittedRef.current) return

    const timer = setTimeout(() => {
      pendingSubmittedRef.current = true
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
    // Refresh history so latest publications are loaded
    void appState.refreshHistory()
    setShowPublishDialog(true)
  }, [appState])

  const handlePublishWithDomain = useCallback(async (domainName: string): Promise<PublishResponse> => {
    // Ship every generated file (html/css/js) so the deployed site is complete;
    // the worker normalizes paths (strips src/) and deploys to Vercel.
    const rawPages = previewState.projectFiles.length
      ? previewState.projectFiles
          .filter((f: { file_path?: string; content?: unknown }) => typeof f.file_path === 'string' && typeof f.content === 'string')
          .map((f: { file_path: string; content: string }) => ({ path: f.file_path, content: f.content }))
      : previewState.pageBlobMappings.length
        ? previewState.pageBlobMappings.map(({ path, content }) => ({ path, content }))
        : previewState.previewHtml
          ? [{ path: 'index.html', content: previewState.previewHtml }]
          : []
    const pages = rawPages
    if (!pages.length) throw new Error('Belum ada file untuk dipublish.')
    appState.setIsPublishing(true)
    try {
      const token = await requireToken()
      const result = await publishSite(
        {
          sessionId: appState.currentSession?.id ?? null,
          projectId: appState.currentSession?.project_id ?? null,
          slug: domainName,
          pages,
        },
        token,
      )
      if (!result.success) throw new Error('Publish gagal. Silakan coba lagi.')
      void appState.refreshHistory()
      return result
    } finally {
      appState.setIsPublishing(false)
    }
  }, [appState, previewState.projectFiles, previewState.previewHtml, previewState.pageBlobMappings, requireToken])

  const handleManualRefresh = useCallback(async () => {
    const projectId = appState.currentSession?.project_id
    const sessionId = appState.currentSession?.id
    if (!projectId || !sessionId) return
    try {
      const token = await requireToken()
      const files = await getProjectFiles(projectId, token)
      handlePreviewRefresh(files, sessionId)
    } catch (error) {
      console.error('[AppContent] Failed to manually refresh preview:', error)
    }
  }, [appState.currentSession?.project_id, appState.currentSession?.id, requireToken, handlePreviewRefresh])

  const workspaceProps = useAppWorkspaceProps({
    appState,
    chatState,
    previewState,
    userId: user?.id,
    requireToken,
    handlePublishRequest,
    handleHtmlUpdate,
    handleManualRefresh,
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
          // The initial title is generated by useChatState when the pending prompt is submitted
          // (after the reload); firing it here too would double the AI call.
          handleSessionCreated(session.id)
        }}
        onSelectSession={handleSelectSession}
        onDeleteSession={appState.handleDeleteSession}
        onRenameSession={appState.renameSession}
        onRefreshSessions={handleRefreshSessions}
        workspaceProps={workspaceProps}
        onPageError={handlePageError}
      />

      <AppOverlays activeOverlay={activeOverlay} setActiveOverlay={setActiveOverlay} appState={appState} userId={user?.id} getToken={getToken} />

      {/* Publish Domain Dialog */}
      {(() => {
        const currentProjectId = appState.currentSession?.project_id
        const currentSessionId = appState.currentSession?.id
        const existingPublication = (appState.publications && (
          appState.publications.find((p) => currentProjectId && p.projectId === currentProjectId) ||
          appState.publications.find((p) => currentSessionId && p.sessionId === currentSessionId)
        )) ?? (appState.currentSession?.deployment?.deployed ? {
          publicUrl: appState.currentSession.deployment.domainUrl,
          slug: appState.currentSession.deployment.slug,
        } : null)

        const usedSlugs = (appState.publications || [])
          .filter((p) => p.slug && (!currentProjectId || p.projectId !== currentProjectId))
          .map((p) => p.slug!.toLowerCase())

        return (
          <PublishDomainDialog
            isOpen={showPublishDialog}
            onClose={() => setShowPublishDialog(false)}
            onConfirm={handlePublishWithDomain}
            isPublishing={appState.isPublishing}
            businessName={appState.currentSession?.title || appState.profileDraft.businessName || ''}
            initialSlug={existingPublication?.slug || appState.publications?.find((p) => p.sessionId === appState.currentSession?.id)?.slug || null}
            existingPublication={existingPublication}
            usedSlugs={usedSlugs}
          />
        )
      })()}
    </>
  )
}
