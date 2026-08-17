import { useEffect, useState, memo } from 'react'
import * as React from 'react'
import { ChevronRight, Lightbulb } from 'lucide-react'
import { MarkdownContent } from './MarkdownContent'
import { StreamingContentAnimated } from '../chat/StreamingContentAnimated'

export interface ThinkingBlockProps {
  text: string
  isFinished: boolean
  durationMs?: number
}

function formatDuration(ms: number) {
  if (ms < 1000) return '<1s'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.round(sec / 60)}m`
}

// Detect if thinking content has markdown formatting
function hasMarkdownFormatting(text: string): boolean {
  return (
    text.includes('```') ||
    text.includes('**') ||
    text.includes('##') ||
    /^\d+\.\s/m.test(text) || // Numbered lists
    /^[-*]\s/m.test(text) ||   // Bullet lists
    text.includes('[') && text.includes('](')
  )
}

export const ReasoningStatus = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center justify-center w-5 h-5">
        <Lightbulb className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-xs font-medium leading-normal bg-gradient-to-r from-slate-500 via-white to-slate-500 dark:from-slate-400 dark:via-slate-100 dark:to-slate-400 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
        Thinking...
      </span>
    </div>
  )
}

export const ThinkingBlock = memo(function ThinkingBlock({ text, isFinished, durationMs }: ThinkingBlockProps) {
  const trimmedText = text.trimStart()
  const hasText = trimmedText.length > 0
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Initial state: collapsed if already finished (hydrated), expanded if streaming
  const [isOpen, setIsOpen] = useState(() => {
    // If already finished on mount (hydrated from DB), start collapsed
    if (isFinished) return false
    // If has text but not finished, it's streaming, so expand
    return hasText
  })
  const [userToggled, setUserToggled] = useState(false)
  const wasFinishedOnMount = React.useRef(isFinished)
  const [startTime] = useState(Date.now())
  const [realDurationMs, setRealDurationMs] = useState(0)

  // Record actual streaming duration
  useEffect(() => {
    if (isFinished && !wasFinishedOnMount.current && realDurationMs === 0) {
      setRealDurationMs(Date.now() - startTime)
    }
  }, [isFinished, startTime, realDurationMs])

  const finalDurationMs = durationMs || (realDurationMs > 0 ? realDurationMs : Math.max(1000, Math.round((text.length / 100) * 1000)))
  const formattedDuration = formatDuration(finalDurationMs)

  // Auto-expand ketika text pertama kali muncul (pre-thinking -> thinking)
  // But only if it wasn't finished on mount (not hydrated)
  useEffect(() => {
    if (hasText && !userToggled && !wasFinishedOnMount.current) {
      setIsOpen(true)
    }
  }, [hasText, userToggled])

  // Auto-collapse when finished (streaming completes), but allow manual toggle
  // Only collapse if it wasn't finished on mount (was actively streaming)
  useEffect(() => {
    if (isFinished && !userToggled && !wasFinishedOnMount.current) {
      const timer = setTimeout(() => setIsOpen(false), 1200) // Delay collapse to let user see completion
      return () => clearTimeout(timer)
    }
  }, [isFinished, userToggled])

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (scrollRef.current && !isFinished && hasText) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [text, isFinished, hasText])

  // Handle manual toggle
  const handleToggle = () => {
    setIsOpen(!isOpen)
    setUserToggled(true)
  }

  return (
    <div className={`w-full animate-enter transition-all duration-500 ${isFinished ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`} style={{ animationFillMode: 'forwards' }}>
      {/* Header - struktur identik dengan ActionBlock row */}
      <button
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggle()
          }
        }}
        className="flex min-h-[36px] w-full items-center gap-2 py-2 text-left group cursor-pointer select-none focus:outline-none rounded touch-manipulation"
        type="button"
        aria-expanded={isOpen}
        aria-label={`AI reasoning process. ${isOpen ? 'Expanded' : 'Collapsed'}. ${isFinished ? 'Thinking complete' : 'Currently thinking'}. Press Enter to ${isOpen ? 'collapse' : 'expand'}`}
      >
        {isFinished ? (
          <>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-transparent">
              <Lightbulb className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-xs leading-normal">
              <span className="shrink-0 font-medium text-slate-600 dark:text-slate-300">Thought for {formattedDuration}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-transparent">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2 text-xs leading-normal">
              <span className="shrink-0 font-medium bg-gradient-to-r from-slate-500 via-white to-slate-500 dark:from-slate-400 dark:via-slate-100 dark:to-slate-400 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">Thinking...</span>
            </div>
          </>
        )}
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
      </button>

      {/* Content - Collapsible dengan grid animation */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${
          isOpen && hasText ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="ml-2.5 pl-4 border-l-2 border-slate-200/40">
            {hasText && (
              <div
                ref={scrollRef}
                className="text-[10px] md:text-[11px] font-mono text-slate-600 leading-relaxed p-2 rounded-md bg-slate-200/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                role="log"
                aria-live={!isFinished ? "polite" : "off"}
                aria-label="AI reasoning process"
              >
                {hasMarkdownFormatting(trimmedText) ? (
                  <div className="prose prose-xs max-w-none prose-slate">
                    <MarkdownContent content={trimmedText} />
                  </div>
                ) : (
                  <>
                    <StreamingContentAnimated
                      key="thinking-text"
                      content={trimmedText}
                      isStreaming={!isFinished}
                      className="whitespace-pre-wrap"
                    />
                    {!isFinished && (
                      <span className="inline-block w-1.5 h-3 bg-primary ml-1 align-middle animate-pulse rounded-[1px]" aria-label="Currently thinking" />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if text or isFinished changes
  return (
    prevProps.text === nextProps.text &&
    prevProps.isFinished === nextProps.isFinished
  )
})
