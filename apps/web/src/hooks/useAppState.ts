import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '../types/profile'
import type { PublicationRecord } from '@/types/publication'
import type { AnalyticsSummary } from '@/types/analytics'
import { getProfile, fetchPublications, fetchAnalytics } from '../api'
import { useSessionManagement } from './useSessionManagement'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

const DEFAULT_PROFILE: Profile = {
  businessName: '',
  email: '',
  whatsapp: '',
  socialLinks: {
    instagram: '',
    facebook: '',
    tiktok: '',
    website: '',
  },
  description: '',
  category: 'culinary',
}

interface UseAppStateOptions {
  sessionId?: string
  requireToken: () => Promise<string>
  enabled: boolean
}

export function useAppState({ requireToken, enabled }: UseAppStateOptions) {
  const [profileDraft, setProfileDraft] = useState<Profile>(DEFAULT_PROFILE)
  const [historyState, setHistoryState] = useState<AsyncState<PublicationRecord[]>>({
    data: null,
    loading: false,
    error: null
  })
  const [analyticsState, setAnalyticsState] = useState<AsyncState<AnalyticsSummary>>({
    data: null,
    loading: false,
    error: null
  })

  // Session management
  const {
    sessions,
    activeSessionId,
    currentSession,
    isSessionLoading,
    selectSession,
    createSession,
    deleteSession,
    updateCurrentSession,
    resetSessions,
    refreshSessions,
    updateSessionTitle,
    clearActiveSession,
  } = useSessionManagement({
    defaultProfile: DEFAULT_PROFILE,
    requireToken,
    enabled
  })

  // Load initial data when user signs in
  useEffect(() => {
    if (!enabled) {
      return
    }

    const load = async () => {
      setHistoryState((prev) => ({ ...prev, loading: true, error: null }))
      setAnalyticsState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const token = await requireToken()
        const [profile, publications, analytics] = await Promise.all([
          getProfile(token),
          fetchPublications(token),
          fetchAnalytics(token),
        ])

        const hydratedProfile = profile?.category ? profile : { ...DEFAULT_PROFILE, ...profile }
        setProfileDraft(hydratedProfile)
        setHistoryState({ data: publications, loading: false, error: null })
        setAnalyticsState({ data: analytics, loading: false, error: null })
      } catch (error) {
        const message = (error as Error).message
        setHistoryState((prev) => ({ ...prev, loading: false, error: message }))
        setAnalyticsState((prev) => ({ ...prev, loading: false, error: message }))
      }
    }

    void load()
  }, [enabled, requireToken])

  // Refresh functions
  const refreshHistory = useCallback(async () => {
    try {
      setHistoryState((prev) => ({ ...prev, loading: true, error: null }))
      const token = await requireToken()
      const publications = await fetchPublications(token)
      setHistoryState({ data: publications, loading: false, error: null })
    } catch (error) {
      setHistoryState((prev) => ({ ...prev, loading: false, error: (error as Error).message }))
    }
  }, [requireToken])

  const refreshAnalytics = useCallback(async () => {
    try {
      setAnalyticsState((prev) => ({ ...prev, loading: true, error: null }))
      const token = await requireToken()
      const analytics = await fetchAnalytics(token)
      setAnalyticsState({ data: analytics, loading: false, error: null })
    } catch (error) {
      setAnalyticsState((prev) => ({ ...prev, loading: false, error: (error as Error).message }))
    }
  }, [requireToken])

  return {
    // Profile state
    profileDraft,
    setProfileDraft,

    // Publications state
    publications: historyState.data,
    publicationsLoading: historyState.loading,
    publicationsError: historyState.error,
    refreshHistory,

    // Analytics state
    analytics: analyticsState.data,
    analyticsLoading: analyticsState.loading,
    analyticsError: analyticsState.error,
    refreshAnalytics,

    // Session management
    sessions,
    activeSessionId,
    currentSession,
    isSessionLoading,
    selectSession,
    createSession,
    deleteSession,
    updateCurrentSession,
    resetSessions,
    refreshSessions,
    updateSessionTitle,
    clearActiveSession,

    // Legacy compatibility - these will be removed
    historyState,
    analyticsState,
    sessionDeploymentSlug: null,
    isPublishing: false,
    handlePublishWithDomain: async () => {},
    handleDeletePublication: async () => {},
    handleSessionSelect: selectSession,
    handleDeleteSession: deleteSession,
  }
}
