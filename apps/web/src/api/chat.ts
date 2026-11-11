import { apiUrl, jsonHeaders, requireToken } from './client'
import { joinApiUrl } from '../lib/apiClient'
import { API_BASE_URL, CHAT_API_BASE_URL } from '../lib/env'
import { APIError } from '../utils/error-handler'

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

// Which origin served each run, so /stop reaches the process that holds the stream.
const runBase = new Map<string, string>()

// Gateway statuses returned by a tunnel/proxy whose origin is down.
const ORIGIN_DOWN_STATUSES = new Set([502, 503, 504, 520, 521, 522, 523, 524, 530])

export async function stopChatStream(sessionId: string, runId: string, token?: string): Promise<void> {
  const base = runBase.get(runId)
  await fetchWithTokenRetry(base ? joinApiUrl('/api/chat/stop', base) : apiUrl('/api/chat/stop'), {
    method: 'POST',
    headers: jsonHeaders(requireToken(token)),
    body: JSON.stringify({ sessionId, runId }),
  })
}

async function readErrorDetails(response: Response): Promise<{ message: string; code?: string }> {
  const text = await response.text().catch(() => '')
  if (!text) return { message: response.statusText || 'Request failed' }
  try {
    const json = JSON.parse(text)
    const raw = json?.error
    const message = (typeof raw === 'string' ? raw : raw?.message) || json?.message || text
    const code = typeof raw === 'object' && raw ? raw.code : json?.code
    return { message, code }
  } catch {
    return { message: text }
  }
}

export async function sendChatMessageStream(conversation: any[], sessionId: string | undefined, callbacks: StreamCallbacks, token?: string, modelId?: string, planMode?: boolean, signal?: AbortSignal, runId?: string, context: Record<string, unknown> = {}): Promise<void> {
  const request: RequestInit = {
    method: 'POST',
    headers: jsonHeaders(requireToken(token)),
    body: JSON.stringify({ conversation, sessionId, context, model: modelId, planMode: planMode ?? false, runId }),
    signal,
  }
  // Prefer the dedicated chat origin when configured; if it is unreachable
  // (tunnel/container down) fall back to the default API before any bytes are streamed.
  let usedBase = CHAT_API_BASE_URL || API_BASE_URL
  let response: Response
  try {
    response = await fetchWithTokenRetry(joinApiUrl('/api/chat/stream', usedBase), request)
    if (usedBase !== API_BASE_URL && ORIGIN_DOWN_STATUSES.has(response.status)) throw new TypeError(`chat origin down (${response.status})`)
  } catch (error) {
    if (usedBase === API_BASE_URL || (error instanceof DOMException && error.name === 'AbortError')) throw error
    usedBase = API_BASE_URL
    response = await fetchWithTokenRetry(joinApiUrl('/api/chat/stream', usedBase), request)
  }
  if (runId) runBase.set(runId, usedBase)
  if (!response.ok) {
    const { message, code } = await readErrorDetails(response)
    throw new APIError(message, code, response.status)
  }
  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  // A turn ends with exactly one terminal event (done | error). If the stream closes
  // without either (Worker killed mid-run, proxy/network cut, upstream stall), the UI
  // would sit on "Thinking..." forever and the turn would never be saved.
  let terminated = false
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
          else if (event.type === 'done') { terminated = true; callbacks.onDone?.(event) }
          else if (event.type === 'error') { terminated = true; callbacks.onError?.(event.error || 'Stream error') }
        } catch (error) {
          console.error('[SSE] parse failed:', error)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
  if (!terminated && !signal?.aborted) {
    callbacks.onError?.('Koneksi ke server terputus sebelum AI selesai. Pekerjaan yang sudah dibuat tersimpan; kirim "lanjutkan" untuk meneruskan.')
  }
}
