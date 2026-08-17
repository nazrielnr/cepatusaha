// Auth module
export { setTokenRefreshCallback, fetchWithTokenRetry } from './auth'

// Chat module
export { setTokenRefreshCallback as setChatTokenRefreshCallback, sendChatMessageStream } from './chat'

// Assets module
export { uploadProductImage } from './assets'

// Profile module
export { getProfile, updateProfile } from './profile'

// Sessions module
export {
  fetchSessions,
  fetchSessionDetail,
  createSession,
  updateSession,
  deleteSession,
  mapSessionFromBackend,
  mapSessionToBackend,
} from './sessions'

// Messages module
export {
  appendSessionMessages,
  mapMessagePayload,
  deduplicateMessages,
  deleteCheckpointIndicators,
} from './messages'

// Publications module
export {
  publishSite,
  fetchPublications,
  deletePublication,
  type PublishSiteOptions,
} from './publications'

// Analytics module
export { fetchAnalytics } from './analytics'

// Models module
export { fetchModels, type AIModel } from './models'

// Utility functions
export { clearRequestCache } from './request-cache'
