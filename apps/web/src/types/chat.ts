import type { ResourceRequestData } from './resource'

/** @deprecated Template system removed. Do not use. */
export type TemplateDescriptor = {
  id: string
  name: string
  category: string
  accentColor: string
  description: string
  heroImage: string
}

/** @deprecated Template system removed. Do not use. */
export type TemplatePreset = TemplateDescriptor

export type ChatRole = 'user' | 'assistant'

export type ChatImageAttachment = {
  url: string
  key?: string
  name?: string
  type?: string
  size?: number
}

export type ChatConversationMessage = {
  role: ChatRole
  content: string
  images?: ChatImageAttachment[]
}

export type ActionStatus = 'pending' | 'running' | 'completed' | 'error'

export type ActionType =
  | 'create_file'
  | 'delete_file'
  | 'read_file'
  | 'rename_file'
  | 'copy_file'
  | 'search_in_files'
  | 'replace_code'
  | 'insert_code'
  | 'batch_replace'
  | 'validate_code'
  | 'get_file_diff'
  | 'get_element_selector'
  | 'request_external_resource'
  | 'check_workspace'

export interface ActionItem {
  id: string
  type: ActionType
  label: string
  status: ActionStatus
  code?: string
  data?: ResourceRequestData
}

export type ChatMessage = {
  id: string
  sender: 'ai' | 'user'
  content: string
  /** @deprecated No longer populated. Will be removed. */
  templates?: TemplatePreset[]
  createdAt?: string
  metadata?: Record<string, unknown> | null
  images?: ChatImageAttachment[]
  elementContext?: {
    tag: string
    classes: string
    text: string
    isTextEditable: boolean
  }
  role?: 'user' | 'ai' | 'assistant' | 'tool' | 'system'
  tool_calls?: any[]
  tool_call_id?: string
  thinking?: string
  actions?: ActionItem[]
}

export type ChatMode = 'chat' | 'build' | 'edit'

export type ChatResponse = {
  reply: string
  mode?: ChatMode
  metadata?: {
    intent: 'build' | 'edit' | 'chat'
    action: 'trigger_generate' | 'trigger_edit' | 'chat'
    autoTrigger: boolean
    hasPreview: boolean
  }
}

export type ChatRequestPayload = {
  conversation: ChatConversationMessage[]
  step?: string
  context?: Record<string, unknown>
  mode?: ChatMode
  sessionId?: string | null
  reasoningEffort?: 'low' | 'medium' | 'high'
}
