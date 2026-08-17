import type { ChatMessage, ChatMode } from './chat'
import type { GeneratedCopy, LayoutBlueprint, PreviewResponse } from './preview'
import type { Profile } from './profile'

export type ConversationStep =
  | 'idle'
  | 'intro'
  | 'profile'
  | 'preferences'
  | 'confirmation'
  | 'previewing'
  | 'editing'
  | 'completed'

export type SessionModeEntry = {
  mode: ChatMode
  note?: string
  at?: string
}

export type SessionStatus = 'active' | 'completed' | 'abandoned'

export type SessionData = {
  id: string
  title: string
  project_id?: string
  messages: ChatMessage[]
  conversationStep: ConversationStep
  profileDraft: Profile
  layoutBlueprint: LayoutBlueprint | null
  createdAt: string
  updatedAt: string
  lastPreview?: PreviewResponse | null
  status: SessionStatus
  modeHistory?: SessionModeEntry[]
  lastGeneratedCopy?: GeneratedCopy | null
  previewThumbnail?: string
}

export type SessionSummary = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  status: SessionStatus
  conversationStep: ConversationStep
  previewThumbnail?: string
}
