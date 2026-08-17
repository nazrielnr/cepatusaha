import type { ChatMessage } from '@/types/chat'
import { handleAPIResponse, APIError } from '../utils/error-handler'
import { fetchWithBaseFallback } from '@/lib/apiClient'



function ensureToken(token?: string): string {
  if (!token) {
    throw new Error('Autentikasi diperlukan untuk mengakses sumber daya.')
  }
  return token
}

// Standard headers for Vercel API with Clerk authentication
function buildFunctionHeaders(token: string, includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

type MessagePayload = {
  id: string
  role: 'user' | 'ai' | 'tool'
  content: string
  templates?: unknown
  created_at?: string
  timestamp?: string
  metadata?: Record<string, unknown> | null
  tool_calls?: any[] | null
  tool_results?: any | null
  tool_call_id?: string | null
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
    role: payload.role as any, // Preserve original role (including 'checkpoint_indicator')
    content: payload.content ?? '',
    createdAt: payload.created_at ?? payload.timestamp ?? new Date().toISOString(),
    metadata: Object.keys(cleanMetadata || {}).length > 0 ? cleanMetadata : null,
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

function buildMessagePayload(message: ChatMessage): Record<string, unknown> {
  // Preserve pure chat content and persist metadata for tool calls
  // Include thinking and actions in metadata for persistence
  const metadata = {
    ...(message.metadata || {}),
  }

  // Add thinking to metadata if present
  if (message.thinking) {
    metadata.thinking = message.thinking
  }

  // Add actions to metadata if present
  if (message.actions && message.actions.length > 0) {
    metadata.actions = message.actions
      }

  const payload: any = {
    id: message.id,
    sender: message.sender,
    content: message.content ?? '',
    createdAt: message.createdAt,
    metadata,
    elementContext: message.elementContext,
  }

  // Persist tool calls so they survive refresh/reload
  if (message.tool_calls && message.tool_calls.length > 0) {
    payload.tool_calls = message.tool_calls
      }

  // Keep explicit role when provided (useful for AI/tool messages)
  if ((message as any).role) {
    payload.role = (message as any).role
  }
  return payload
}

export async function appendSessionMessages(sessionId: string, messages: ChatMessage[], token?: string): Promise<ChatMessage[]> {
  if (messages.length === 0) {
    return []
  }

  const sessionToken = ensureToken(token)

  async function saveOnce() {

    const payloadMessages = messages.map(buildMessagePayload)
    const response = await fetchWithBaseFallback('/session-messages', {
      method: 'POST',
      headers: buildFunctionHeaders(sessionToken),
      body: JSON.stringify({ sessionId, messages: payloadMessages }),
    })

    const payload = await handleAPIResponse<{ messages: MessagePayload[] }>(response)
    const savedMessages = (payload.messages ?? []).map(mapMessagePayload)


    return savedMessages
  }

  try {
    return await saveOnce()
  } catch (error) {
    console.error('[API Client] Failed to append messages:', {
      sessionId,
      messageCount: messages.length,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error instanceof APIError ? error.code : 'UNKNOWN'
    })

    // Retry once (helps when first base/path mismatches)
    try {
            return await saveOnce()
    } catch (retryError) {
      console.error('[API Client] Retry failed:', {
        sessionId,
        messageCount: messages.length,
        error: retryError instanceof Error ? retryError.message : 'Unknown error',
        errorCode: retryError instanceof APIError ? retryError.code : 'UNKNOWN'
      })

      // Keep unsent cache; re-throw with more context
      if (retryError instanceof APIError) {
        throw retryError
      }

      throw new APIError(
        `Failed to save messages after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
        'SESSION_SAVE_ERROR',
        undefined,
        { sessionId, messageCount: messages.length }
      )
    }
  }
}

/**
 * Delete checkpoint indicator messages from a session
 * This is called when a new checkpoint is created to clear old indicators
 */
export async function deleteCheckpointIndicators(sessionId: string, token?: string): Promise<void> {
  const sessionToken = ensureToken(token)


  const response = await fetchWithBaseFallback(`/session-messages/checkpoint-indicators?session_id=${sessionId}`, {
    method: 'DELETE',
    headers: buildFunctionHeaders(sessionToken),
  })

  await handleAPIResponse(response)

  }
