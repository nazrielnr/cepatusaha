import type { GeneratedCopy } from '@/types/preview'
import type { SessionData, SessionSummary } from '../types/session'
import type { MessagePayload, SessionPayload } from './sessionTypes'
import { deduplicateMessages, mapMessagePayload } from './sessionMessageMappers'
import {
  normalizeConversationStep,
  normalizeLayoutBlueprint,
  normalizeModeHistory,
  normalizeProfileDraft,
  normalizeStatus,
} from './sessionNormalizers'

export { deduplicateMessages, mapMessagePayload } from './sessionMessageMappers'
export { normalizeConversationStep, normalizeLayoutBlueprint, normalizeModeHistory, normalizeProfileDraft, normalizeStatus } from './sessionNormalizers'

/**
 * Map session data from backend format to frontend format
 * Requirement 8.1: Backend returns session data in consistent structure with metadata at root
 * Requirement 8.3: Use explicit mapping functions for session data
 */
export function mapSessionFromBackend(backendSession: SessionPayload, messages: MessagePayload[] = []): SessionData {
  return {
    id: backendSession.id,
    title: backendSession.title || 'Proyek Baru',
    project_id: (backendSession as any).project_id ?? null,
    status: normalizeStatus(backendSession.status),
    conversationStep: normalizeConversationStep(backendSession.conversation_step),
    profileDraft: normalizeProfileDraft(backendSession.profile_draft),
    layoutBlueprint: normalizeLayoutBlueprint(backendSession.layout_blueprint),
    modeHistory: normalizeModeHistory(backendSession.mode_history),
    lastPreview: backendSession.last_preview && typeof backendSession.last_preview === 'object'
      ? (() => {
          const previewRecord = backendSession.last_preview as Record<string, unknown>
          const layoutBlueprint = normalizeLayoutBlueprint(previewRecord.layoutBlueprint ?? previewRecord.layout_blueprint ?? null)
          return {
            html: typeof previewRecord.html === 'string' ? previewRecord.html : '',
            generatedCopy: {
              slogan: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && typeof (previewRecord.generatedCopy as Record<string, unknown>).slogan === 'string'
                ? (previewRecord.generatedCopy as Record<string, unknown>).slogan as string
                : '',
              summary: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && typeof (previewRecord.generatedCopy as Record<string, unknown>).summary === 'string'
                ? (previewRecord.generatedCopy as Record<string, unknown>).summary as string
                : '',
              highlights: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && Array.isArray((previewRecord.generatedCopy as Record<string, unknown>).highlights)
                ? ((previewRecord.generatedCopy as Record<string, unknown>).highlights as unknown[]).map((item) => (typeof item === 'string' ? item : String(item)))
                : [],
              cta: {
                heading: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && typeof (previewRecord.generatedCopy as Record<string, unknown>).cta === 'object' && (previewRecord.generatedCopy as Record<string, unknown>).cta && typeof ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).heading === 'string'
                  ? ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).heading as string
                  : '',
                body: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && typeof (previewRecord.generatedCopy as Record<string, unknown>).cta === 'object' && (previewRecord.generatedCopy as Record<string, unknown>).cta && typeof ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).body === 'string'
                  ? ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).body as string
                  : '',
                button: typeof previewRecord.generatedCopy === 'object' && previewRecord.generatedCopy && typeof (previewRecord.generatedCopy as Record<string, unknown>).cta === 'object' && (previewRecord.generatedCopy as Record<string, unknown>).cta && typeof ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).button === 'string'
                  ? ((previewRecord.generatedCopy as Record<string, unknown>).cta as Record<string, unknown>).button as string
                  : '',
              },
            },
            layoutBlueprint: layoutBlueprint ?? null,
          }
        })()
      : null,
    lastGeneratedCopy: backendSession.last_preview && typeof backendSession.last_preview === 'object' && (backendSession.last_preview as Record<string, unknown>).generatedCopy
      ? (backendSession.last_preview as Record<string, unknown>).generatedCopy as GeneratedCopy
      : null,
    createdAt: backendSession.created_at,
    updatedAt: backendSession.updated_at,
    messages: deduplicateMessages(messages.map(mapMessagePayload)),
    previewThumbnail: typeof backendSession.preview_thumbnail === 'string' ? backendSession.preview_thumbnail : undefined,
  }
}

/**
 * Map session data from frontend format to backend format
 * Requirement 8.2: Frontend sends session updates in structure backend expects
 * Requirement 8.3: Use explicit mapping functions for session data
 */
export function mapSessionToBackend(session: Partial<SessionData>): Record<string, unknown> {
  const body: Record<string, unknown> = {}

  if (session.title !== undefined) {
    body.title = session.title
  }
  if (session.project_id !== undefined) {
    body.project_id = session.project_id
  }
  if (session.status !== undefined) {
    body.status = session.status
  }
  if (session.conversationStep !== undefined) {
    body.conversationStep = session.conversationStep
  }
  if (session.profileDraft !== undefined) {
    body.profileDraft = session.profileDraft
  }
  if (session.layoutBlueprint !== undefined) {
    body.layoutBlueprint = session.layoutBlueprint
  }
  if (session.modeHistory !== undefined) {
    body.modeHistory = session.modeHistory
  }
  if (session.lastPreview !== undefined) {
    body.lastPreview = session.lastPreview
  }
  if (session.lastGeneratedCopy !== undefined) {
    body.lastGeneratedCopy = session.lastGeneratedCopy
  }
  return body
}

export function mapSessionSummary(payload: SessionPayload): SessionSummary {
  return {
    id: payload.id,
    title: payload.title || 'Proyek Baru',
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    status: normalizeStatus(payload.status),
    conversationStep: normalizeConversationStep(payload.conversation_step),
    previewThumbnail: typeof payload.preview_thumbnail === 'string' ? payload.preview_thumbnail : undefined,
  }
}

