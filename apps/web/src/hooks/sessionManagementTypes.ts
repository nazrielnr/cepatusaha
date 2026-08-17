import type { Profile } from '../types/profile'
import type { SessionData, SessionSummary } from '../types/session'

export type CreateSessionParams = {
  initialProfile?: Profile
  title?: string
}

export type UseSessionManagementOptions = {
  defaultProfile: Profile
  requireToken: () => Promise<string>
  enabled: boolean
}

export type UseSessionManagementValue = {
  sessions: SessionSummary[]
  activeSessionId: string
  currentSession: SessionData | null
  initialized: boolean
  isSessionLoading: boolean
  selectSession: (sessionId: string, options?: { replaceHistory?: boolean; forceRefresh?: boolean }) => Promise<SessionData | null>
  createSession: (params?: CreateSessionParams) => Promise<SessionData>
  deleteSession: (sessionId: string) => Promise<void>
  updateCurrentSession: (updater: (session: SessionData) => SessionData) => void
  resetSessions: () => void
  refreshSessions: () => Promise<void>
  updateSessionTitle: (sessionId: string, newTitle: string) => void
  clearActiveSession: () => void
}

