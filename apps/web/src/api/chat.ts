import { apiUrl, jsonHeaders, readError, requireToken } from './client'

let tokenRefreshCallback: (() => Promise<string>) | null = null
export function setTokenRefreshCallback(callback: () => Promise<string>) { tokenRefreshCallback = callback }

async function fetchWithTokenRetry(url: string, options: RequestInit, retryCount = 0): Promise<Response> {
  const response = await fetch(url, options)
  if (response.status === 401 && retryCount === 0 && tokenRefreshCallback) {
    const token = await tokenRefreshCallback()
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return fetchWithTokenRetry(url, { ...options, headers }, retryCount + 1)
  }
  return response
}

export interface StreamEvent { type: string; [key: string]: any }
export interface TextChunkEvent { type: 'text_chunk'; content: string; accumulated: string; timestamp: string }
export interface ThinkingChunkEvent { type: 'thinking_chunk'; content: string; timestamp: string }
export interface IterationDataEvent { type: 'iteration_data'; iteration: number; text: string; toolCalls: any[]; phase?: 'post_execution' | 'complete'; reasoning_content?: string; thinking_content?: string; timestamp: string }
export interface ToolCallDetectedEvent { type: 'tool_call_detected' | 'function_call_start'; id: string; name: string; args?: Record<string, any>; file_path?: string; search_query?: string; package_name?: string; skill_ids?: string[]; status: 'pending'; iteration: number; timestamp: string }
export interface FunctionCallCompleteEvent { type: 'function_call_complete'; id: string; name?: string; success: boolean; data?: any; error?: string }
export interface StreamStartEvent { type: 'stream_start'; sessionId?: string; projectId?: string; model?: string }
export interface IterationStartEvent { type: 'iteration_start'; iteration: number; timestamp: string }

export interface StreamCallbacks {
  onStreamStart?: (event: StreamStartEvent) => void
  onIterationStart?: (event: IterationStartEvent) => void
  onTextChunk?: (event: TextChunkEvent) => void
  onThinkingChunk?: (event: ThinkingChunkEvent) => void
  onIterationData?: (event: IterationDataEvent) => void
  onToolCallDetected?: (event: ToolCallDetectedEvent) => void
  onFunctionCallComplete?: (event: FunctionCallCompleteEvent) => void
  onDone?: (event: any) => void
  onError?: (error: string) => void
}

export async function stopChatStream(sessionId: string, runId: string, token?: string): Promise<void> {
  await fetchWithTokenRetry(apiUrl('/api/chat/stop'), {
    method: 'POST',
    headers: jsonHeaders(requireToken(token)),
    body: JSON.stringify({ sessionId, runId }),
  })
}

export async function sendChatMessageStream(conversation: any[], sessionId: string | undefined, callbacks: StreamCallbacks, token?: string, modelId?: string, planMode?: boolean, signal?: AbortSignal, runId?: string, context: Record<string, unknown> = {}): Promise<void> {
  const response = await fetchWithTokenRetry(apiUrl('/api/chat/stream'), {
    method: 'POST',
    headers: jsonHeaders(requireToken(token)),
    body: JSON.stringify({ conversation, sessionId, context, model: modelId, planMode: planMode ?? false, runId }),
    signal,
  })
  if (!response.ok) throw new Error(`Chat stream failed: ${await readError(response)}`)
  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const event: StreamEvent = JSON.parse(line.slice(6))
          if (event.type === 'text_chunk') callbacks.onTextChunk?.(event as TextChunkEvent)
          else if (event.type === 'thinking_chunk') callbacks.onThinkingChunk?.(event as ThinkingChunkEvent)
          else if (event.type === 'iteration_data') callbacks.onIterationData?.(event as IterationDataEvent)
          else if (event.type === 'tool_call_detected' || event.type === 'function_call_start') callbacks.onToolCallDetected?.({ status: 'pending', ...(event as any) } as ToolCallDetectedEvent)
          else if (event.type === 'function_call_complete') callbacks.onFunctionCallComplete?.(event as FunctionCallCompleteEvent)
          else if (event.type === 'stream_start') callbacks.onStreamStart?.(event as StreamStartEvent)
          else if (event.type === 'iteration_start') callbacks.onIterationStart?.(event as IterationStartEvent)
          else if (event.type === 'done') callbacks.onDone?.(event)
          else if (event.type === 'error') callbacks.onError?.(event.error || 'Stream error')
        } catch (error) {
          console.error('[SSE] parse failed:', error)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
