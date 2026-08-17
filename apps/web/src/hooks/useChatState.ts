/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage, ChatMode, ChatConversationMessage } from '@/types/chat'
import { sendChatMessageStream, stopChatStream } from '../api/chat'
import { uploadChatImage } from '../api/assets'
import { fetchSessionDetail } from '../api/sessions'
import { useChatStreamCallbacks } from './useChatStreamCallbacks'

const MAX_HISTORY_MESSAGES = 8
const AI_FALLBACK_MESSAGE = 'Maaf, AI sedang tidak tersedia. Coba lagi ya.'

const createId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2))

interface CreateCheckpointOptions {
  previewUrl?: string
  sessionId?: string
  projectId?: string
}

interface UseChatStateOptions {
  requireToken: () => Promise<string>
  currentSessionId?: string
  onSessionCreate?: () => Promise<{ id: string }>
  onSessionCreated?: (sessionId: string) => void
  onPreviewRefresh?: (files: any[], sessionId?: string) => void
  projectId?: string
  onCheckpointCreate?: (options?: CreateCheckpointOptions) => Promise<void>
}

export function useChatState({ requireToken, currentSessionId, onSessionCreate, onSessionCreated, onPreviewRefresh, projectId }: UseChatStateOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [currentMode, setCurrentMode] = useState<ChatMode>('chat')
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(undefined)
  const sessionIdRef = useRef<string | null>(currentSessionId ?? null)
  const currentAiMessageIdRef = useRef<string | null>(null)
  const messagesRef = useRef<ChatMessage[]>([])
  const turnStartIndexRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const runIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (currentSessionId && currentSessionId !== sessionIdRef.current) {
      sessionIdRef.current = currentSessionId
    }
  }, [currentSessionId])
  const derivedProjectIdRef = useRef<string | null>(projectId ?? null)

  // Keep derived project id in sync with prop when it becomes available
  useEffect(() => {
    if (projectId && projectId !== derivedProjectIdRef.current) {
      derivedProjectIdRef.current = projectId
    }
  }, [projectId])

  // Reset derived project id when switching sessions
  useEffect(() => {
    derivedProjectIdRef.current = projectId ?? null
  }, [currentSessionId, projectId])

  // Prevent double submission
  const isSubmittingRef = useRef(false)

  // Batch tool call events to prevent double animation

  // Build conversation snapshot for AI
  const buildConversationSnapshot = useCallback(
    (pendingUser?: string): ChatConversationMessage[] => {
      const history = pendingUser
        ? [...messages, { id: 'pending-user', sender: 'user' as const, content: pendingUser }]
        : messages

      return history
        .slice(-MAX_HISTORY_MESSAGES)
        .filter((message) => {
          const content = message.content
          const hasToolCalls = 'metadata' in message && message.metadata?.tool_calls && (message.metadata.tool_calls as any[]).length > 0
          return content.length > 0 || hasToolCalls
        })
        .map((message) => {
          let content = message.content.slice(0, 5000)

          if (!content && 'metadata' in message && message.metadata?.tool_calls) {
            const toolNames = (message.metadata.tool_calls as any[]).map((tc: any) => tc.function.name).join(', ')
            content = `[Executed: ${toolNames}]`
          }

          return {
            role: message.sender === 'ai' ? 'assistant' : 'user',
            content,
            ...(message.images?.length ? { images: message.images } : {})
          }
        })
    },
    [messages],
  )

  // Helper to resolve project_id from props, cached ref, or session detail
  const resolveProjectId = useCallback(
    async (token?: string): Promise<string | null> => {
      if (projectId) return projectId
      if (derivedProjectIdRef.current) return derivedProjectIdRef.current

      if (currentSessionId && token) {
        try {
          const session = await fetchSessionDetail(currentSessionId, token)
          if (session.project_id) {
            derivedProjectIdRef.current = session.project_id
            return session.project_id
          }
        } catch (error) {
          console.error('[useChatState] Failed to resolve project_id via helper:', error)
        }
      }

      return null
    },
    [projectId, currentSessionId]
  )

  // Find the AI message for the current turn (prefer tracked id, fallback to last AI)
  const findCurrentAiMessageIndex = useCallback(
    (list: ChatMessage[]) => {
      if (currentAiMessageIdRef.current) {
        const byId = list.findIndex((msg) => msg.id === currentAiMessageIdRef.current)
        if (byId !== -1) return byId
      }

      for (let i = list.length - 1; i >= 0; i -= 1) {
        if (list[i].sender === 'ai') return i
      }
      return -1
    },
    []
  )

  // Handle user message submission
  const deriveIterationsFromMessages = useCallback((list: ChatMessage[]) => {
    const phaseRank = (phase?: string) => {
      if (phase === 'post_execution' || phase === 'complete') return 3
      if (phase === 'pre_execution') return 2
      if (phase === 'streaming') return 1
      return 0
    }
    const bestByIteration = new Map<number, ChatMessage>()
    for (const msg of list) {
      if (msg.sender !== 'ai') continue
      const iter = (msg.metadata as any)?.iteration
      if (iter === undefined || iter === null) continue
      const existing = bestByIteration.get(iter)
      const currentRank = phaseRank((msg.metadata as any)?.phase)
      const existingRank = existing ? phaseRank((existing.metadata as any)?.phase) : -1
      if (!existing || currentRank >= existingRank) bestByIteration.set(iter, msg)
    }
    return Array.from(bestByIteration.values()).sort((a, b) => ((a.metadata as any)?.iteration || 0) - ((b.metadata as any)?.iteration || 0))
  }, [])

  const buildStreamCallbacks = useChatStreamCallbacks({
    currentSessionId,
    projectId,
    requireToken,
    onPreviewRefresh,
    findCurrentAiMessageIndex,
    resolveProjectId,
    setMessages,
    setIsTyping,
    isSubmittingRef,
    sessionIdRef,
    derivedProjectIdRef,
    currentAiMessageIdRef,
    messagesRef,
    turnStartIndexRef,
    createId,
    deriveIterationsFromMessages,
    fallbackMessage: AI_FALLBACK_MESSAGE,
  })

  // Handle user message submission
  const handleUserSubmit = useCallback(
    async (rawInput: string, mode: ChatMode = currentMode, modelId?: string, planMode?: boolean, imageFiles: File[] = []) => {
      const trimmed = rawInput.trim()
      if (!trimmed && !imageFiles.length) return

      // Prevent double submission
      if (isSubmittingRef.current) {
        return
      }
      isSubmittingRef.current = true
      setIsStreaming(true)
      abortControllerRef.current = new AbortController()
      runIdRef.current = createId()

      // Use provided modelId or fall back to selectedModelId from state
      const finalModelId = modelId || selectedModelId

      // Get or create session ID
      let sessionId = currentSessionId
      if (!sessionId && onSessionCreate) {
        try {
          const newSession = await onSessionCreate()
          sessionId = newSession.id
          if (onSessionCreated) onSessionCreated(sessionId)
        } catch (error) {
          console.error('[useChatState] Failed to create session:', error)
          isSubmittingRef.current = false
          setIsStreaming(false)
          abortControllerRef.current = null
          runIdRef.current = null
          return
        }
      }

      if (!sessionId) {
        console.error('[useChatState] No session ID available')
        isSubmittingRef.current = false
        setIsStreaming(false)
        abortControllerRef.current = null
        runIdRef.current = null
        return
      }

      // Keep local ref for downstream callbacks
      sessionIdRef.current = sessionId

      // Clear input and set mode
      setInputValue('')
      setCurrentMode(mode)

      // Initialize allIterations array for this turn
      // This will store iteration snapshots for database save
      const allIterations: ChatMessage[] = []

      // Create user message
      const userMessage: ChatMessage = {
        id: createId(),
        sender: 'user',
        content: trimmed || 'Analisis gambar ini.',
        createdAt: new Date().toISOString(),
        metadata: { mode },
      }

      // Add user message to UI
      setMessages((prev) => {
        // Mark the start of this turn so fallback derivation only uses messages of this turn
        // IMPORTANT: Set to prev.length BEFORE adding user message (this is the start of the new turn)
        turnStartIndexRef.current = prev.length
        return [...prev, userMessage]
      })

      // Create placeholder AI message immediately for thinking/streaming
      const aiMessageId = createId()
      const placeholderAiMessage: ChatMessage = {
        id: aiMessageId,
        sender: 'ai',
        content: '',
        createdAt: new Date().toISOString(),
        tool_calls: [],
        metadata: {
          mode,
          phase: 'streaming',
          iteration: 1
        }
      }
      setMessages((prev) => [...prev, placeholderAiMessage])
      currentAiMessageIdRef.current = aiMessageId

      // Show typing indicator
      setIsTyping(true)

      try {
        // Get authentication token
        const token = await requireToken()
        const uploadedImages = imageFiles.every((file) => 'url' in (file as any)) ? imageFiles as any[] : await Promise.all(imageFiles.map((file) => uploadChatImage(file, token)))

        if (uploadedImages.length) {
          userMessage.images = uploadedImages
          userMessage.metadata = { ...(userMessage.metadata || {}), images: uploadedImages }
          setMessages((prev) => prev.map((msg) => msg.id === userMessage.id ? userMessage : msg))
        }

        // Build conversation for AI
        const conversation = buildConversationSnapshot(trimmed || 'Analisis gambar ini.')
        const last = conversation[conversation.length - 1]
        if (last && uploadedImages.length) last.images = uploadedImages

        await sendChatMessageStream(conversation, sessionId, buildStreamCallbacks(sessionId, { mode, userMessage, allIterations, placeholderAiMessageId: aiMessageId }), token, finalModelId, planMode, abortControllerRef.current.signal, runIdRef.current || undefined)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('[useChatState] Chat error:', error)

        // Show error message
        const errorMessage: ChatMessage = {
          id: createId(),
          sender: 'ai',
          content: AI_FALLBACK_MESSAGE,
          createdAt: new Date().toISOString(),
          metadata: {
            mode,
            error: true,
          },
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
        setIsStreaming(false)
        abortControllerRef.current = null
        runIdRef.current = null
        isSubmittingRef.current = false
      }
    },
    [currentMode, currentSessionId, requireToken, buildConversationSnapshot, onSessionCreate, onSessionCreated, onPreviewRefresh, projectId, selectedModelId, findCurrentAiMessageIndex, buildStreamCallbacks],
  )

  // Keep a live ref of messages for fallback derivation on save
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const currentProjectId = projectId ?? derivedProjectIdRef.current ?? null

  // Reset chat state when session changes
  useEffect(() => {

    // Clear messages when session changes (will be loaded from session data)
    setMessages([])

    // Reset typing indicator
    setIsTyping(false)

    // Reset submission flag
    isSubmittingRef.current = false
    currentAiMessageIdRef.current = null

    // Keep selected model when switching sessions (persist across sessions)
    // Don't reset selectedModelId here

  }, [currentSessionId])

  const stopStreaming = useCallback(() => {
    const sessionId = sessionIdRef.current
    const runId = runIdRef.current
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    runIdRef.current = null
    isSubmittingRef.current = false
    setIsStreaming(false)
    setIsTyping(false)
    setMessages((prev) => prev.map((msg, i) => i < turnStartIndexRef.current || msg.sender !== 'ai' ? msg : { ...msg, tool_calls: msg.tool_calls?.map((tc: any) => tc.status === 'pending' ? { ...tc, status: 'error', error: 'Stopped by user' } : tc), metadata: { ...(msg.metadata || {}), stopped: true, turn_done: true, done_event_received: true, is_thinking: false, reasoning_done: true } }))
    if (sessionId && runId) void requireToken().then((token) => stopChatStream(sessionId, runId, token)).catch((error) => console.error('[useChatState] stop stream failed:', error))
  }, [requireToken])

  return {
    messages,
    setMessages,
    isTyping,
    isStreaming,
    inputValue,
    setInputValue,
    currentMode,
    setCurrentMode,
    handleUserSubmit,
    stopStreaming,
    selectedModelId,
    setSelectedModelId,

    // Legacy compatibility
    layoutBlueprint: null,
    currentProjectId,
  }
}
