import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ChatTurnWithIterations } from './messageTurns'
import { MessageBubble } from './ChatPanelMessageBubble'
import { MarkdownContent } from './MarkdownContent'
import { ThinkingBlock } from './ThinkingBlock'

type ChatTurnListProps = {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  turnsWithIterations: ChatTurnWithIterations[]
  handleFormSubmit: (formData: Record<string, any>) => void
  isTyping: boolean
  isStreaming?: boolean
  extraBottomPadding?: number
}

function textOf(value: unknown) { return typeof value === 'string' ? value : '' }
function pathOf(tc: any) { return tc?.arguments?.path || tc?.arguments?.file_path || tc?.result?.file_path }
function isChangeTool(tc: any) { return ['write_file', 'create_file', 'edit_file', 'delete_file', 'replace_code', 'insert_code', 'batch_replace'].includes(tc?.name) }
function hasTools(m: any) { return Array.isArray(m.tool_calls) && m.tool_calls.length > 0 }
function hasText(m: any) { return Boolean(textOf(m.content).trim()) }

function changesFrom(turn: ChatTurnWithIterations) {
  return [...new Set(turn.aiMessages.flatMap((m) => m.tool_calls || []).filter(isChangeTool).map(pathOf).filter(Boolean))] as string[]
}

function lastTextMessage(turn: ChatTurnWithIterations) {
  return [...turn.aiMessages].reverse().find((m) => hasText(m) && !hasTools(m)) || [...turn.aiMessages].reverse().find(hasText)
}

function lastMessageAndChanges(turn: ChatTurnWithIterations) {
  const msg = lastTextMessage(turn)
  const text = textOf(msg?.content) || 'Done'
  const changes = changesFrom(turn)
  const start = Math.min(...turn.aiMessages.map((m) => m.createdAt ? new Date(m.createdAt).getTime() : Date.now()))
  const end = Math.max(...turn.aiMessages.map((m) => m.createdAt ? new Date(m.createdAt).getTime() : Date.now()))
  return { text, changes, durationMs: Math.max(0, end - start) }
}

function formatDuration(ms: number) {
  if (ms < 1000) return '<1s'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}s`
  return `${Math.round(sec / 60)}m`
}

function WorkedByDivider({ duration, open, onClick }: { duration: string; open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 py-2 focus:outline-none"
      aria-expanded={open}
    >
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700 transition-colors duration-200 group-hover:bg-slate-300 dark:group-hover:bg-slate-600" />
      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 transition-all duration-200 group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
        <span className="text-[11px] font-medium tracking-wide text-slate-400 dark:text-slate-500 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors duration-200">
          Worked for {duration}
        </span>
        <span className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors duration-200">
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700 transition-colors duration-200 group-hover:bg-slate-300 dark:group-hover:bg-slate-600" />
    </button>
  )
}

function LastMessage({ text, changes }: { text: string; changes: string[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
      <div className="prose prose-sm max-w-none prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-primary dark:prose-a:text-primary prose-code:text-foreground dark:prose-code:text-foreground break-words prose-p:last-of-type:mb-0">
        <MarkdownContent content={text} />
      </div>
      {changes.length > 0 && <ChangedFiles files={changes} />}
    </div>
  )
}

function ChangedFiles({ files }: { files: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 rounded-lg border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-colors group"
      >
        <div className="flex items-center gap-2">
           <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
           </svg>
           <span>{files.length} file diubah</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
           <span className="text-[10px] uppercase tracking-wider">{open ? 'Tutup' : 'Lihat'}</span>
           <svg
             className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
           >
             <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden min-h-0">
          <div className="px-3 pb-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-100/40 dark:bg-slate-900/20">
            <ul className="space-y-1.5 mt-1">
              {files.map((file) => (
                <li key={file} className="flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-primary/80 shrink-0"></span>
                  <code className="font-mono bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded px-1.5 py-[1px] shadow-sm">{file}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Turn({ turn, handleFormSubmit, isStreamingTurn }: { turn: ChatTurnWithIterations; handleFormSubmit: (formData: Record<string, any>) => void; isStreamingTurn?: boolean }) {
  const lastAi = [...turn.aiMessages].reverse()[0]
  const doneMeta = lastAi?.metadata as any
  const isStopped = doneMeta?.stopped === true
  const isDone = (!isStreamingTurn || isStopped) && doneMeta?.turn_done === true && doneMeta?.done_event_received === true
  const [open, setOpen] = useState(!isDone)
  const last = useMemo(() => lastMessageAndChanges(turn), [turn])
  useEffect(() => { if (isDone) setOpen(false) }, [isDone])

  const detailMessages = isDone
    ? turn.aiMessages.filter((msg) => msg.id !== lastTextMessage(turn)?.id)
    : turn.aiMessages

  return (
    <div className="flex flex-col">
      {turn.userMessage && <div className="mb-3"><MessageBubble message={turn.userMessage} onFormSubmit={handleFormSubmit} /></div>}

      {isDone && (
        <WorkedByDivider
          duration={formatDuration(last.durationMs)}
          open={open}
          onClick={() => setOpen(!open)}
        />
      )}

      <div
        className={`grid transition-[grid-template-rows,margin] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${
          open ? 'grid-rows-[1fr] mt-0' : 'grid-rows-[0fr] mt-2'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="space-y-0.5 pb-3">
            {detailMessages.map((msg, index) => {
              const isLastDetailMsg = index === detailMessages.length - 1;
              return (
                <MessageBubble key={msg.id} message={msg} onFormSubmit={handleFormSubmit} isStreaming={isStreamingTurn && !isStopped && isLastDetailMsg} />
              )
            })}
          </div>
        </div>
      </div>

      {isDone && <LastMessage text={last.text} changes={last.changes} />}
    </div>
  )
}

export function ChatTurnList({ scrollContainerRef, messagesEndRef, turnsWithIterations, handleFormSubmit, isTyping, isStreaming, extraBottomPadding = 120 }: ChatTurnListProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden px-4 pt-6 bg-white dark:bg-slate-900"
      style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', overflowAnchor: 'none', paddingBottom: extraBottomPadding + 24 }}
    >
      <div className="max-w-4xl mx-auto flex flex-col space-y-8">
        {turnsWithIterations.map((turn, i) => (
          <div key={`turn-${turn.turnIndex}`} id={`turn-${turn.turnIndex}`}>
            <Turn turn={turn} handleFormSubmit={handleFormSubmit} isStreamingTurn={isStreaming && i === turnsWithIterations.length - 1} />
          </div>
        ))}
      </div>
      {/* messagesEndRef is placed outside the space-y-8 container so it doesn't get a 32px top margin */}
      <div ref={messagesEndRef} />
    </div>
  )
}
