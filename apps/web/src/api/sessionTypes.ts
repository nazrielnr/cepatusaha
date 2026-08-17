import type { Profile } from '../types/profile'
import type { LayoutBlueprint, GeneratedCopy, PreviewResponse } from '@/types/preview'
import type { ConversationStep, SessionModeEntry, SessionStatus } from '../types/session'

export type SessionPayload = {
  id: string
  title: string
  status?: string
  conversation_step?: string
  profile_draft?: Record<string, unknown> | null
  layout_blueprint?: Record<string, unknown> | null
  mode_history?: unknown
  last_preview?: unknown
  created_at: string
  updated_at: string
  preview_thumbnail?: string
}
export type MessagePayload = {
  id: string
  role: 'user' | 'ai' | 'tool'
  content: string
  templates?: unknown
  created_at?: string
  timestamp?: string
  metadata?: Record<string, unknown> | null
  tool_calls?: any[] | null
  tool_call_id?: string | null
}
export type SessionUpsertPayload = {
  title?: string
  status?: SessionStatus
  conversationStep?: ConversationStep
  profileDraft?: Profile
  layoutBlueprint?: LayoutBlueprint | null
  modeHistory?: SessionModeEntry[]
  lastPreview?: PreviewResponse | null
  lastGeneratedCopy?: GeneratedCopy | null
  previewThumbnail?: string
}