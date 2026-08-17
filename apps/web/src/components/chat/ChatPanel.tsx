import { useRef, useEffect, useState, useCallback, useMemo, useLayoutEffect } from 'react'
import type { ChatMessage, ChatMode } from '@/types/chat'
import { ChatComposer, type ComposerReplyContext } from './ChatComposer'
import { ChatPanelHeader } from './ChatPanelHeader'
import { ChatTurnList } from './ChatTurnList'
import { buildTurnsWithIterations, groupMessagesIntoTurns } from './messageTurns'

interface ChatPanelProps {
  messages: ChatMessage[]
  isTyping: boolean
  onSubmit: (message: string, mode: ChatMode, modelId?: string, planMode?: boolean, images?: File[]) => void
  inputValue: string
  onInputChange: (value: string) => void
  inputDisabled: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
  currentMode: ChatMode
  projectName?: string
  projectSubtitle?: string
  onCollapseSidebar?: () => void
  selectedModelId?: string
  onModelChange?: (modelId: string) => void
  replyContext?: ComposerReplyContext | null
  onClearReplyContext?: () => void
}

// Simple, battle-tested scroll model:
// 1. On mount / new messages: scroll to bottom (unless user scrolled up)
// 2. During streaming: keep following bottom (unless user scrolled up)
// 3. User scrolls up → stop auto-scroll. User scrolls back down → resume.
// 4. paddingBottom = composerHeight so content never hides behind composer.
// No dynamic spacers, no snap-to-top, no ResizeObserver. Just works.
function useChatScroll(messagesLength: number, composerHeight: number, isStreaming: boolean) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  const lastMessagesLengthRef = useRef(messagesLength)
  const isStreamingRef = useRef(isStreaming)
  isStreamingRef.current = isStreaming

  // On mount: scroll to bottom
  useLayoutEffect(() => {
    const c = scrollContainerRef.current
    if (c) c.scrollTop = c.scrollHeight
  }, [])

  // Detect whether user is near the bottom (= should auto-scroll)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const checkBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      shouldAutoScrollRef.current = scrollHeight - scrollTop - clientHeight < 80
    }

    container.addEventListener('scroll', checkBottom, { passive: true })
    return () => container.removeEventListener('scroll', checkBottom)
  }, [])

  // When composer height changes (e.g. after initial mount ResizeObserver or user typing multiple lines)
  useEffect(() => {
    const c = scrollContainerRef.current
    if (c && shouldAutoScrollRef.current) {
      c.scrollTop = c.scrollHeight
    }
  }, [composerHeight])

  // When new messages arrive or message count changes: scroll to bottom
  useEffect(() => {
    if (messagesLength > lastMessagesLengthRef.current) {
      // New message added — always scroll to bottom
      shouldAutoScrollRef.current = true
      const c = scrollContainerRef.current
      if (c) {
        requestAnimationFrame(() => {
          c.scrollTop = c.scrollHeight
        })
      }
    }
    lastMessagesLengthRef.current = messagesLength
  }, [messagesLength])

  // Auto-scroll when content grows (e.g. during streaming, images loading, etc)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const content = container.firstElementChild
    if (!content) return

    const observer = new ResizeObserver(() => {
      if (shouldAutoScrollRef.current) {
        // Only force scroll to bottom if the user is already near the bottom.
        // This allows the user to scroll up freely without fighting the auto-scroll.
        container.scrollTop = container.scrollHeight
      }
    })

    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return { scrollContainerRef, messagesEndRef }
}


export function ChatPanel({
  messages,
  isTyping,
  onSubmit,
  inputValue,
  onInputChange,
  inputDisabled,
  isStreaming,
  onStopStreaming,
  currentMode,
  projectName = 'My Website',
  projectSubtitle = 'Website Builder',
  onCollapseSidebar,
  selectedModelId,
  onModelChange,
  replyContext,
  onClearReplyContext,
}: ChatPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const [composerHeight, setComposerHeight] = useState(120)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [images, setImages] = useState<File[]>([])

  useLayoutEffect(() => {
    const el = composerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setComposerHeight(el.offsetHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])
  const turnsWithIterations = useMemo(() => buildTurnsWithIterations(turns), [turns])
  const { scrollContainerRef, messagesEndRef } = useChatScroll(messages.length, composerHeight, !!isStreaming)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
  }, [inputValue])

  const handleFormSubmit = useCallback((formData: Record<string, any>) => {
    onSubmit(Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join('\n'), currentMode)
  }, [onSubmit, currentMode])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <ChatPanelHeader projectName={projectName} projectSubtitle={projectSubtitle} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onCollapseSidebar={onCollapseSidebar} />
      <div className="relative flex flex-1 flex-col min-h-0">
        <ChatTurnList scrollContainerRef={scrollContainerRef} messagesEndRef={messagesEndRef} turnsWithIterations={turnsWithIterations} handleFormSubmit={handleFormSubmit} isTyping={isTyping} isStreaming={isStreaming} extraBottomPadding={composerHeight} />
        <div ref={composerRef} className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-t from-white via-white/90 to-transparent pt-6 dark:from-slate-900 dark:via-slate-900/90">
          <div className="pointer-events-auto">
            <ChatComposer textareaRef={textareaRef} inputValue={inputValue} onInputChange={onInputChange} inputDisabled={inputDisabled} isStreaming={isStreaming} onStopStreaming={onStopStreaming} currentMode={currentMode} selectedModelId={selectedModelId} onModelChange={onModelChange} onSubmit={onSubmit} replyContext={replyContext} onClearReplyContext={onClearReplyContext} images={images} onImagesChange={setImages} />
          </div>
        </div>
      </div>
    </div>
  )
}
