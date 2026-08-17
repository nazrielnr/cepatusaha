import type { ChatMessage } from '@/types/chat'
import type { MessagePayload } from './sessionTypes'

/**
 * Deduplicate messages by ID, keeping the last occurrence and maintaining chronological order
 * This fixes the issue where duplicate messages appear in the UI
 */
export function deduplicateMessages(messages: ChatMessage[]): ChatMessage[] {
  const seen = new Map<string, ChatMessage>()

  // Iterate through messages and keep the last occurrence of each ID
  for (const message of messages) {
    seen.set(message.id, message)
  }

  // Return deduplicated messages sorted by createdAt to maintain chronological order
  const deduplicated = Array.from(seen.values()).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateA - dateB
  })


  return deduplicated
}

export function mapMessagePayload(payload: MessagePayload): ChatMessage {
  // Extract elementContext dari metadata
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata as Record<string, unknown> : null
  const elementContext = metadata?.elementContext && typeof metadata.elementContext === 'object' ? metadata.elementContext as any : undefined

  // Extract reasoning from metadata (legacy thinking_* read-only fallback)
  const thinking = (metadata?.reasoning_content && typeof metadata.reasoning_content === 'string' ? metadata.reasoning_content : undefined)
    || (metadata?.thinking_content && typeof metadata.thinking_content === 'string' ? metadata.thinking_content : undefined)
    || (metadata?.thinking && typeof metadata.thinking === 'string' ? metadata.thinking : undefined)

  // Extract actions from metadata
  const actions = metadata?.actions && Array.isArray(metadata.actions) ? metadata.actions : undefined
  const images = metadata?.images && Array.isArray(metadata.images) ? metadata.images as any[] : undefined

  // Debug logging for actions

  // Remove elementContext, legacy thinking fields, and actions dari metadata untuk tidak duplicate
  const cleanMetadata = metadata ? { ...metadata } : null
  if (cleanMetadata) {
    if ('elementContext' in cleanMetadata) {
      delete cleanMetadata.elementContext
    }
    if ('thinking' in cleanMetadata) {
      delete cleanMetadata.thinking
    }
    if ('thinking_content' in cleanMetadata) {
      delete cleanMetadata.thinking_content
    }
    if ('actions' in cleanMetadata) {
      delete cleanMetadata.actions
    }
  }

  // Map role to sender and preserve role for compatibility
  const sender = payload.role === 'ai' ? 'ai' : 'user'

  const message: ChatMessage = {
    id: payload.id,
    sender,
    content: payload.content ?? '',
    createdAt: payload.created_at ?? payload.timestamp ?? new Date().toISOString(),
    metadata: Object.keys(cleanMetadata || {}).length > 0 ? cleanMetadata : null,
    images,
    elementContext: elementContext,
  }

  // Add thinking if present
  if (thinking) {
    message.thinking = thinking
  }

  // Add actions if present
  if (actions) {
    message.actions = actions
  }

  // Add role field for messages that need it (for AI conversation)
  if (payload.role) {
    (message as any).role = payload.role
  }

  // Add tool_calls if present
  if (payload.tool_calls) {
    (message as any).tool_calls = payload.tool_calls
  }

  // Add tool_call_id if present (for tool response messages)
  if (payload.tool_call_id) {
    (message as any).tool_call_id = payload.tool_call_id
  }

  return message
}

