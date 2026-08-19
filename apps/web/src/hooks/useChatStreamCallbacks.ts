import { useCallback, useRef } from 'react'
import { appendSessionMessages } from '../api'
import { getProjectFiles } from '../api/files'
import type { StreamCallbacks } from '../api/chat'
import type { ChatMessage, ChatMode } from '@/types/chat'

type UseChatStreamCallbacksOptions = {
  currentSessionId?: string
  projectId?: string
  requireToken: () => Promise<string>
  onPreviewRefresh?: (files: any[], sessionId?: string) => void
  findCurrentAiMessageIndex: (list: ChatMessage[]) => number
  resolveProjectId: (token?: string) => Promise<string | null>
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>
  isSubmittingRef: React.MutableRefObject<boolean>
  sessionIdRef: React.MutableRefObject<string | null>
  derivedProjectIdRef: React.MutableRefObject<string | null>
  currentAiMessageIdRef: React.MutableRefObject<string | null>
  messagesRef: React.MutableRefObject<ChatMessage[]>
  turnStartIndexRef: React.MutableRefObject<number>
  createId: () => string
  deriveIterationsFromMessages: (list: ChatMessage[]) => ChatMessage[]
  fallbackMessage: string
}

const fileOps = ['write_file', 'create_file', 'edit_file', 'delete_file', 'replace_code', 'insert_code', 'batch_replace', 'copy_file', 'rename_file']
const pathKeys = ['path', 'file_path', 'filePath', 'filepath', 'file', 'file_searched', 'source_path', 'dest_path', 'old_path', 'new_path', 'target_path', 'input_path', 'output_path', 'file_pattern']
const eventPath = (event: { file_path?: string; args?: Record<string, any> }) => event.file_path || pathKeys.map((key) => event.args?.[key]).find((v): v is string => typeof v === 'string' && Boolean(v.trim()))

type EventKind = 'thinking' | 'text' | 'actions'

export function useChatStreamCallbacks(options: UseChatStreamCallbacksOptions) {
  const previewRefreshSeqRef = useRef(0)
  return useCallback((sessionId: string, run: { mode: ChatMode; userMessage: ChatMessage; allIterations: ChatMessage[]; placeholderAiMessageId?: string }): StreamCallbacks => {
    const { mode, userMessage, allIterations, placeholderAiMessageId } = run
    const { currentSessionId, projectId, requireToken, onPreviewRefresh, setMessages, setIsTyping, isSubmittingRef, sessionIdRef, derivedProjectIdRef, currentAiMessageIdRef, messagesRef, turnStartIndexRef, createId, deriveIterationsFromMessages, fallbackMessage } = options
    const messageByIteration = new Map<number, string>()
    const toolNameById = new Map<string, string>()
    if (placeholderAiMessageId) {
      messageByIteration.set(1, placeholderAiMessageId)
    }
    let currentIteration = 1
    let saved = false

    const remember = (msg: ChatMessage) => {
      const iter = msg.metadata?.iteration
      if (typeof iter !== 'number') return
      const i = allIterations.findIndex((m) => m.metadata?.iteration === iter)
      if (i === -1) allIterations.push(msg)
      else allIterations[i] = msg
    }

    const withOrder = (metadata: Record<string, unknown> | null | undefined, event: EventKind) => {
      const order = Array.isArray(metadata?.event_order) ? [...metadata.event_order as string[]] : []
      if (!order.includes(event)) order.push(event)
      return { ...(metadata || {}), event_order: order }
    }

    const ensureIterationMessage = (prev: ChatMessage[], iteration = currentIteration) => {
      const updated = [...prev]
      const existingId = messageByIteration.get(iteration)
      let index = existingId ? updated.findIndex((m) => m.id === existingId) : -1
      if (index !== -1) return { updated, index }
      const msg: ChatMessage = { id: createId(), sender: 'ai', content: '', createdAt: new Date().toISOString(), tool_calls: [], metadata: { mode, phase: 'streaming', iteration } }
      messageByIteration.set(iteration, msg.id)
      currentAiMessageIdRef.current = msg.id
      updated.push(msg)
      remember(msg)
      return { updated, index: updated.length - 1 }
    }

    const saveTurn = async (totals?: { totalIterations?: number; totalFunctionCalls?: number }, error?: string) => {
      if (saved) return
      saved = true
      const targetSessionId = sessionIdRef.current || sessionId
      if (!targetSessionId) return
      const token = await requireToken()
      const fromState = deriveIterationsFromMessages(messagesRef.current.slice(turnStartIndexRef.current))
      const byId = new Map<string, ChatMessage>()
      for (const msg of [...fromState, ...allIterations]) byId.set(msg.id, msg)
      const messagesToSave = [...byId.values()].filter((m) => m.sender === 'ai')
      if (error && messagesToSave.length === 0) {
        messagesToSave.push({ id: createId(), sender: 'ai', content: fallbackMessage, createdAt: new Date().toISOString(), metadata: { mode, error: true, stream_error: error, turn_done: true } })
      }
      if (!messagesToSave.length) return
      const final = messagesToSave.map((msg, idx) => ({
        ...msg,
        metadata: {
          ...(msg.metadata || {}),
          ...(idx === messagesToSave.length - 1 ? { turn_done: true } : {}),
          ...(error ? { stream_error: error } : {}),
          total_iterations: totals?.totalIterations || messagesToSave.length,
          total_function_calls: totals?.totalFunctionCalls || 0,
        }
      }))
      await appendSessionMessages(targetSessionId, [userMessage, ...final], token)
    }

    async function refreshPreview(event: any, toolName: string) {
      if (!event.success || !fileOps.includes(toolName) || !onPreviewRefresh) return
      const seq = ++previewRefreshSeqRef.current
      const token = await requireToken()
      let resolvedProjectId = projectId || derivedProjectIdRef.current || event.data?.project_id || event.data?.projectId || undefined
      if (!resolvedProjectId) resolvedProjectId = await options.resolveProjectId(token) || undefined
      if (!resolvedProjectId) return
      const files = await getProjectFiles(resolvedProjectId, token)
      if (seq === previewRefreshSeqRef.current) onPreviewRefresh(files, sessionIdRef.current ?? currentSessionId)
    }

    return {
      onStreamStart: (event) => {
        if (event.projectId && !derivedProjectIdRef.current) derivedProjectIdRef.current = event.projectId
      },

      onIterationStart: (event) => {
        currentIteration = event.iteration
        setIsTyping(false)
        setMessages((prev) => ensureIterationMessage(prev, event.iteration).updated)
      },

      onTextChunk: (event) => {
        setIsTyping(false)
        setMessages((prev) => {
          const { updated, index } = ensureIterationMessage(prev)
          const startMs = updated[index].metadata?.reasoning_start_ms as number | undefined
          const duration = startMs && !updated[index].metadata?.reasoning_duration_ms ? Date.now() - startMs : updated[index].metadata?.reasoning_duration_ms
          updated[index] = { ...updated[index], content: event.accumulated, metadata: { ...withOrder(updated[index].metadata, 'text'), phase: 'streaming', iteration: currentIteration, is_thinking: false, reasoning_done: true, ...(duration ? { reasoning_duration_ms: duration } : {}) } }
          remember(updated[index])
          return updated
        })
      },

      onThinkingChunk: (event) => {
        setIsTyping(false)
        setMessages((prev) => {
          const { updated, index } = ensureIterationMessage(prev)
          const current = (updated[index].metadata?.reasoning_content as string) || (updated[index].metadata?.thinking_content as string) || ''
          const startMs = (updated[index].metadata?.reasoning_start_ms as number) || Date.now()
          updated[index] = { ...updated[index], metadata: { ...withOrder(updated[index].metadata, 'thinking'), phase: 'streaming', iteration: currentIteration, reasoning_content: current + event.content, is_thinking: true, reasoning_done: false, reasoning_start_ms: startMs } }
          remember(updated[index])
          return updated
        })
      },

      onToolCallDetected: (event) => {
        setIsTyping(false)
        setMessages((prev) => {
          const { updated, index } = ensureIterationMessage(prev, event.iteration || currentIteration)
          const toolCalls = [...(updated[index].tool_calls || [])]
          const i = toolCalls.findIndex((tc: any) => tc.id === event.id)
          const args = event.args || {}
          const filePath = eventPath(event)
          const patch = { id: event.id, name: event.name, arguments: { ...args, ...(filePath ? { file_path: filePath } : {}), ...(event.search_query ? { query: event.search_query } : {}), ...(event.package_name ? { package: event.package_name } : {}), ...(event.skill_ids ? { ids: event.skill_ids } : {}) }, status: 'pending' as const, file_path: filePath, search_query: event.search_query, package_name: event.package_name }
          toolNameById.set(event.id, event.name)
          if (i === -1) toolCalls.push(patch)
          else toolCalls[i] = { ...toolCalls[i], ...patch, arguments: { ...(toolCalls[i] as any).arguments, ...patch.arguments } }

          const startMs = updated[index].metadata?.reasoning_start_ms as number | undefined
          const duration = startMs && !updated[index].metadata?.reasoning_duration_ms ? Date.now() - startMs : updated[index].metadata?.reasoning_duration_ms

          updated[index] = { ...updated[index], tool_calls: toolCalls, metadata: { ...withOrder(updated[index].metadata, 'actions'), phase: 'streaming', iteration: event.iteration || currentIteration, ...(duration ? { reasoning_duration_ms: duration } : {}) } }
          remember(updated[index])
          return updated
        })
      },

      onFunctionCallComplete: (event) => {
        const completedToolName = toolNameById.get(event.id) || event.name || ''
        setMessages((prev) => prev.map((msg) => {
          if (msg.sender !== 'ai' || !msg.tool_calls) return msg
          const i = msg.tool_calls.findIndex((tc: any) => tc.id === event.id)
          if (i === -1) return msg
          const toolCalls = [...msg.tool_calls]
          toolCalls[i] = { ...toolCalls[i], status: event.success ? 'success' : 'error', result: event.data, error: event.error }
          const next = { ...msg, tool_calls: toolCalls, metadata: { ...(msg.metadata || {}), phase: 'post_execution' } }
          remember(next)
          return next
        }))
        void refreshPreview(event, completedToolName).catch((error) => console.error('[useChatState] preview refresh failed:', error))
      },

      onIterationData: (event) => {
        const rawToolCalls = event.toolCalls || []
        const reasoningContent = event.reasoning_content || event.thinking_content
        const iterationMessage: ChatMessage = { id: messageByIteration.get(event.iteration) || createId(), sender: 'ai', content: event.text || '', createdAt: new Date().toISOString(), tool_calls: rawToolCalls, metadata: { mode, iteration: event.iteration, phase: event.phase || 'complete', reasoning_content: reasoningContent, is_thinking: false, reasoning_done: !!reasoningContent } }
        messageByIteration.set(event.iteration, iterationMessage.id)
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === iterationMessage.id)
          const existingMeta = (idx !== -1 ? prev[idx].metadata || {} : {}) as Record<string, unknown>
          const resolvedReasoningContent = reasoningContent || (existingMeta.reasoning_content as string | undefined) || (existingMeta.thinking_content as string | undefined)

          const startMs = existingMeta.reasoning_start_ms as number | undefined
          const duration = startMs && !existingMeta.reasoning_duration_ms ? Date.now() - startMs : existingMeta.reasoning_duration_ms

          const mergedMetadata = { ...(iterationMessage.metadata || {}), event_order: existingMeta.event_order, reasoning_content: resolvedReasoningContent, reasoning_done: !!resolvedReasoningContent, is_thinking: false, ...(duration ? { reasoning_duration_ms: duration } : {}) }
          const finalMessage = { ...iterationMessage, metadata: mergedMetadata }
          remember(finalMessage)
          if (idx === -1) return [...prev, finalMessage]
          const next = [...prev]
          next[idx] = { ...next[idx], ...finalMessage, createdAt: next[idx].createdAt || finalMessage.createdAt }
          return next
        })
      },

      onDone: async (event) => {
        setIsTyping(false)
        isSubmittingRef.current = false
        setMessages((prev) => {
          const next = [...prev]
          for (let i = next.length - 1; i >= turnStartIndexRef.current; i--) {
            if (next[i]?.sender !== 'ai') continue
            next[i] = { ...next[i], metadata: { ...(next[i].metadata || {}), turn_done: true, done_event_received: true } }
            remember(next[i])
            break
          }
          return next
        })
        if (allIterations.length) {
          const last = allIterations[allIterations.length - 1]
          allIterations[allIterations.length - 1] = { ...last, metadata: { ...(last.metadata || {}), turn_done: true, done_event_received: true } }
        }
        // Monthly quota ran out mid-run: append the LimitReached card after the partial content.
        if (event.stoppedByQuota) {
          setMessages((prev) => [...prev, { id: createId(), sender: 'ai', content: '', createdAt: new Date().toISOString(), tool_calls: [], metadata: { mode, error: true, error_code: 'PLAN_QUOTA_EXCEEDED' } }])
        }
        await saveTurn({ totalIterations: event.totalIterations, totalFunctionCalls: event.totalFunctionCalls })
      },

      onError: (error) => {
        console.error('[useChatState] Stream error:', error)
        const errorMessage: ChatMessage = { id: createId(), sender: 'ai', content: fallbackMessage, createdAt: new Date().toISOString(), metadata: { mode, error: true, stream_error: error, turn_done: true } }
        setMessages((prev) => [...prev, errorMessage])
        remember(errorMessage)
        void saveTurn(undefined, error).catch((saveError) => console.error('[useChatState] Failed to save errored stream:', saveError))
      }
    }
  }, [options])
}
