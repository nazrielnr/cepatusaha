import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import {
  appendSessionMessages,
  createSession as createSessionApi,
  deleteSession as deleteSessionApi,
  fetchSessionDetail,
  fetchSessions as fetchSessionsApi,
  updateSession as updateSessionApi,
} from '../api'
import type { SessionData, SessionSummary } from '../types/session'
import type { UseSessionManagementOptions, UseSessionManagementValue, CreateSessionParams } from './sessionManagementTypes'
import {
  blueprintEquals,
  cloneProfile,
  collapseToolCallMessages,
  ensureSessionTitle,
  getSessionIdFromPath,
  hasSessionChanged,
  modeHistoryEquals,
  normalizeIterationsAfterLoad,
  previewEquals,
  profileEquals,
  sessionToSummary,
} from './sessionManagementUtils'

export function useSessionManagement({ defaultProfile, requireToken, enabled }: UseSessionManagementOptions): UseSessionManagementValue {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const [sessionsState, setSessionsState] = useState<SessionSummary[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [currentSessionState, setCurrentSessionState] = useState<SessionData | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [isSessionLoading, setIsSessionLoading] = useState(false)

  const sessionsRef = useRef<SessionSummary[]>([])
  const currentSessionRef = useRef<SessionData | null>(null)
  const sessionCacheRef = useRef(new Map<string, SessionData>())
  const lastSyncedMessagesRef = useRef(new Map<string, number>())
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve())
  const initializingRef = useRef(false)
  const loadRequestRef = useRef(0)

  const setSessionsSafe = useCallback((updater: (prev: SessionSummary[]) => SessionSummary[]) => {
    setSessionsState((prev) => {
      const next = updater(prev)
      sessionsRef.current = next
      return next
    })
  }, [])

  const setCurrentSessionSafe = useCallback((value: SessionData | null | ((prev: SessionData | null) => SessionData | null)) => {
    setCurrentSessionState((prev) => {
      const next = typeof value === 'function' ? (value as (previous: SessionData | null) => SessionData | null)(prev) : value
      currentSessionRef.current = next
      if (next) {
        sessionCacheRef.current.set(next.id, next)
      }
      return next
    })
  }, [])

  const resetState = useCallback(() => {
    sessionCacheRef.current.clear()
    lastSyncedMessagesRef.current.clear()
    sessionsRef.current = []
    currentSessionRef.current = null
    setSessionsState([])
    setCurrentSessionState(null)
    setActiveSessionId('')
    setInitialized(false)
  }, [])

  const updateSessionListWith = useCallback((session: SessionData) => {
    setSessionsSafe((prev) => {
      const summary = sessionToSummary(session)
      const filtered = prev.filter((item) => item.id !== summary.id)
      const next = [summary, ...filtered].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      return next
    })
  }, [setSessionsSafe])

  const persistSessionChanges = useCallback(async (previous: SessionData, updated: SessionData) => {

    try {
      const token = await requireToken()

      let mergedSession = updated
      const metadataChanged =
        previous.title !== updated.title ||
        previous.conversationStep !== updated.conversationStep ||
        previous.status !== updated.status ||
        !profileEquals(previous.profileDraft, updated.profileDraft) ||
      !previewEquals(previous.lastPreview ?? null, updated.lastPreview ?? null) ||
        !blueprintEquals(previous.layoutBlueprint ?? null, updated.layoutBlueprint ?? null) ||
        !modeHistoryEquals(previous.modeHistory, updated.modeHistory) ||
        JSON.stringify(previous.lastGeneratedCopy ?? null) !== JSON.stringify(updated.lastGeneratedCopy ?? null)

      if (metadataChanged) {

        try {
          const synced = await updateSessionApi(updated.id, {
            title: updated.title,
            conversationStep: updated.conversationStep,
            profileDraft: updated.profileDraft,
            layoutBlueprint: updated.layoutBlueprint,
            modeHistory: updated.modeHistory,
            status: updated.status,
            lastPreview: updated.lastPreview ?? null,
            lastGeneratedCopy: updated.lastGeneratedCopy ?? null,
          }, token)


          mergedSession = {
            ...updated,
            title: synced.title,
            status: synced.status,
            conversationStep: synced.conversationStep,
            profileDraft: synced.profileDraft,
            layoutBlueprint: synced.layoutBlueprint,
            modeHistory: synced.modeHistory,
            lastPreview: synced.lastPreview,
            lastGeneratedCopy: synced.lastGeneratedCopy ?? updated.lastGeneratedCopy ?? null,
            createdAt: synced.createdAt,
            updatedAt: synced.updatedAt,
          }
        } catch (error) {
          console.error('[SessionManagement] ❌ Failed to sync metadata:', error)
          // Continue to try syncing messages even if metadata sync fails
        }
      }

      const prevCount = lastSyncedMessagesRef.current.get(updated.id) ?? previous.messages.length
      const nextCount = mergedSession.messages.length

      if (nextCount > prevCount) {
        const newMessages = mergedSession.messages.slice(prevCount, nextCount).map((message) => ({
          ...message,
          createdAt: message.createdAt ?? new Date().toISOString(),
        }))

        if (newMessages.length > 0) {

          try {
            await appendSessionMessages(mergedSession.id, newMessages, token)
            lastSyncedMessagesRef.current.set(mergedSession.id, nextCount)
            mergedSession = {
              ...mergedSession,
              updatedAt: new Date().toISOString(),
            }
                } catch (error) {
            console.error('[SessionManagement] ❌ Failed to sync messages:', error)
            // Don't throw - let the UI continue with local state
          }
        }
      }

      sessionCacheRef.current.set(mergedSession.id, mergedSession)
      setCurrentSessionSafe(() => mergedSession)
      updateSessionListWith(mergedSession)

    } catch (error) {
      console.error('[SessionManagement] ❌ Session sync failed:', {
        sessionId: updated.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      // Don't throw - let the UI continue with local state
    }
  }, [requireToken, setCurrentSessionSafe, updateSessionListWith])

  const scheduleSync = useCallback((previous: SessionData, updated: SessionData) => {
    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(() => persistSessionChanges(previous, updated))
      .catch((error) => {
        console.error('[SessionManagement] ❌ Sync queue error:', {
          sessionId: updated.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      })
  }, [persistSessionChanges])

  const loadSessionInternal = useCallback(async (sessionId: string, options?: { token?: string; replaceHistory?: boolean; forceRefresh?: boolean }) => {
    if (!sessionId) {
      return null
    }
    setIsSessionLoading(true)
    const requestId = ++loadRequestRef.current

    // Check cache first (Requirement 1.3: Use cached session data when available)
    // Skip cache if forceRefresh is true
    const cached = sessionCacheRef.current.get(sessionId)
    if (cached && !options?.forceRefresh) {
      // Validate cache: ensure it has messages loaded (not just summary)
      // A cached session with messages is fully loaded and can be used
      if (cached.messages && cached.messages.length >= 0) {
        const ensured = {
          ...ensureSessionTitle(cached),
          messages: normalizeIterationsAfterLoad(collapseToolCallMessages(cached.messages || [])) || [],
        }
        setCurrentSessionSafe(ensured)
        setActiveSessionId(sessionId)
        updateSessionListWith(ensured)


        setIsSessionLoading(false)
        return ensured
      }
    }

    // Cache miss or incomplete data - fetch from API
    const token = options?.token ?? (await requireToken())
    const detail = ensureSessionTitle(await fetchSessionDetail(sessionId, token))

    // Collapse duplicate tool-call messages to avoid pending+completed duplicates
    detail.messages = collapseToolCallMessages(detail.messages || [])
    detail.messages = normalizeIterationsAfterLoad(detail.messages || [])

    if (requestId !== loadRequestRef.current) return null

    // Update cache with full session data
    sessionCacheRef.current.set(sessionId, detail)
    lastSyncedMessagesRef.current.set(sessionId, detail.messages.length)

    setCurrentSessionSafe(detail)
    setActiveSessionId(sessionId)
    updateSessionListWith(detail)

    setIsSessionLoading(false)
    return detail
  }, [requireToken, setCurrentSessionSafe, updateSessionListWith])

  useEffect(() => {
    if (!enabled) {
      resetState()
      return
    }

    if (initialized || initializingRef.current) {
      return
    }

    initializingRef.current = true

    ;(async () => {
      try {
        const token = await requireToken()
        let targetId = getSessionIdFromPath()

        if (targetId) {
          // Optimization: When session ID in URL, fetch detail first (Requirement 1.1)
          // This eliminates the need for separate session list fetch
          try {
            const detail = ensureSessionTitle(await fetchSessionDetail(targetId, token))

            // Cache the session data (Requirement 1.2)
            sessionCacheRef.current.set(targetId, detail)
            lastSyncedMessagesRef.current.set(targetId, detail.messages.length)

            // Set as current session
            setCurrentSessionSafe(detail)
            setActiveSessionId(targetId)

            // Update session list with this session (Requirement 1.3)
            const summary = sessionToSummary(detail)
            setSessionsSafe(() => [summary])

            // Fetch remaining sessions in background to populate full list
            // This is non-blocking and doesn't delay initialization
            fetchSessionsApi(token).then((summaries) => {
              setSessionsSafe(() => summaries.slice())
            }).catch((error) => {
              console.error('[SessionManagement] Failed to fetch session list:', error)
              // Keep the single session we already have
            })

            setInitialized(true)
    } catch (error) {
            // Session not found or error - fall back to fetching list
            console.error('[SessionManagement] Failed to load session from URL:', error)
            targetId = ''

            // Fetch session list as fallback
            const summaries = await fetchSessionsApi(token)
            setSessionsSafe(() => summaries.slice())
            setCurrentSessionSafe(null)
            setActiveSessionId('')
            setInitialized(true)
          }
        } else {
          // NO session ID in URL = Landing page (Requirement 1.4)
          // Fetch session list for history sidebar
          const summaries = await fetchSessionsApi(token)
          setSessionsSafe(() => summaries.slice())

          // Session will be created on first user message
          setCurrentSessionSafe(null)
          setActiveSessionId('')
          setInitialized(true)
        }
      } catch {
        resetState()
        setInitialized(true)
      } finally {
        initializingRef.current = false
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Sync session state with URL (React Router owns history; this only mirrors route)
  useEffect(() => {
    if (!enabled || !initialized) return

    const urlSessionId = getSessionIdFromPath()

    if (!urlSessionId) {
      if (activeSessionId) {
        setCurrentSessionSafe(null)
        setActiveSessionId('')
      }
      return
    }

    if (navigationType === 'POP' && activeSessionId && urlSessionId !== activeSessionId) {
      setCurrentSessionSafe(null)
      setActiveSessionId('')
      navigate('/', { replace: true })
      return
    }

    if (urlSessionId !== activeSessionId) {
      void loadSessionInternal(urlSessionId).catch(() => setIsSessionLoading(false))
    }
  }, [enabled, initialized, activeSessionId, location.pathname, loadSessionInternal, navigate, navigationType, setCurrentSessionSafe])

  const selectSession = useCallback(
    async (sessionId: string, options?: { replaceHistory?: boolean }) => {
      try {
        const result = await loadSessionInternal(sessionId, options)
        return result
      } catch {
        setIsSessionLoading(false)
        return null
      }
    },
    [loadSessionInternal],
  )

  const isCreatingSessionRef = useRef(false)

  const createSession = useCallback(
    async (params?: CreateSessionParams) => {
      // Prevent duplicate session creation at API level
      if (isCreatingSessionRef.current) {
        throw new Error('Session creation already in progress')
      }

      isCreatingSessionRef.current = true
      try {
        const token = await requireToken()
        const created = ensureSessionTitle(await createSessionApi({
          title: params?.title,
          profileDraft: cloneProfile(params?.initialProfile ?? defaultProfile),
          layoutBlueprint: null,
          modeHistory: [],
          lastPreview: null,
          lastGeneratedCopy: null,
        }, token))

        sessionCacheRef.current.set(created.id, created)
        lastSyncedMessagesRef.current.set(created.id, created.messages.length)
        setCurrentSessionSafe(created)
        setActiveSessionId(created.id)
        updateSessionListWith(created)
        return created
      } finally {
        isCreatingSessionRef.current = false
      }
    },
    [defaultProfile, requireToken, setCurrentSessionSafe, updateSessionListWith],
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const token = await requireToken()
      await deleteSessionApi(sessionId, token)

      sessionCacheRef.current.delete(sessionId)
      lastSyncedMessagesRef.current.delete(sessionId)

      const remaining = sessionsRef.current.filter((item) => item.id !== sessionId)
      setSessionsSafe(() => remaining)

      if (sessionId === activeSessionId) {
        setCurrentSessionSafe(null)
        setActiveSessionId('')
      }
    },
    [activeSessionId, loadSessionInternal, requireToken, setCurrentSessionSafe, setSessionsSafe],
  )

  const updateCurrentSession = useCallback(
    (updater: (session: SessionData) => SessionData) => {
      setCurrentSessionSafe((previous) => {
        if (!previous) {
          return previous
        }

        const updatedBase = ensureSessionTitle({
          ...updater(previous),
          updatedAt: new Date().toISOString(),
          status: previous.status ?? (previous.conversationStep === 'completed' ? 'completed' : 'active'),
        })

        // Use optimized change detection with shallow comparison (Requirements 3.1, 3.2, 3.4)
        if (!hasSessionChanged(previous, updatedBase)) {
          return previous
        }

        scheduleSync(previous, updatedBase)
        updateSessionListWith(updatedBase)
        return updatedBase
      })
    },
    [scheduleSync, setCurrentSessionSafe, updateSessionListWith],
  )

  const resetSessions = useCallback(() => {
    resetState()
  }, [resetState])

  const refreshSessions = useCallback(async () => {
    if (!requireToken) return
    try {
      const token = await requireToken()
      const summaries = await fetchSessionsApi(token)
      setSessionsSafe(() => summaries.slice())
    } catch (error) {
      console.error('[SessionManagement] Failed to refresh sessions:', error)
    }
  }, [requireToken, setSessionsSafe])

  const updateSessionTitle = useCallback((sessionId: string, newTitle: string) => {
    // Update sessions list
    setSessionsSafe((prev) => {
      return prev.map((session) =>
        session.id === sessionId
          ? { ...session, title: newTitle, updatedAt: new Date().toISOString() }
          : session
      )
    })

    // Update current session if it's the active one
    if (currentSessionRef.current?.id === sessionId) {
      setCurrentSessionSafe((prev) => {
        if (!prev || prev.id !== sessionId) return prev
        return { ...prev, title: newTitle }
      })
    }
  }, [setSessionsSafe, setCurrentSessionSafe])

  const clearActiveSession = useCallback(() => {
    setCurrentSessionSafe(null)
    setActiveSessionId('')
  }, [setCurrentSessionSafe])

  const value = useMemo<UseSessionManagementValue>(() => ({
    sessions: sessionsState,
    activeSessionId,
    currentSession: currentSessionState,
    initialized,
    isSessionLoading,
    selectSession,
    createSession,
    deleteSession,
    updateCurrentSession,
    resetSessions,
    refreshSessions,
    updateSessionTitle,
    clearActiveSession,
  }), [activeSessionId, clearActiveSession, createSession, currentSessionState, deleteSession, initialized, isSessionLoading, refreshSessions, resetSessions, selectSession, sessionsState, updateCurrentSession, updateSessionTitle])

  return value
}
