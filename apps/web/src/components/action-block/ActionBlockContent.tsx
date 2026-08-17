import type { ToolCall } from './types'
import { CodeBlock } from './CodeBlock'
import { DiffBlock } from './DiffBlock'

type ActionBlockContentProps = {
  toolCall?: ToolCall
  code?: string
  isError: boolean
  isCompleted: boolean
  isStreaming?: boolean
  onFormSubmit?: (formData: Record<string, any>) => void
}

export function ActionBlockContent({ toolCall, code, isError, isStreaming, isCompleted }: ActionBlockContentProps) {
  if (isError) return <div className="text-xs text-destructive whitespace-pre-wrap">{toolCall?.error || 'Execution failed'}</div>

  const result: any = toolCall?.result

  if (isCompleted && (toolCall?.name === 'search_files' || toolCall?.name === 'search_in_files') && Array.isArray(result?.matches)) {
    return (
      <div className="text-[10px] md:text-[11px] font-mono text-slate-600 leading-relaxed rounded-md bg-slate-200/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
        <div className="flex flex-col">
          {result.matches.slice(0, 15).map((m: any, i: number) => {
            const isFirst = i === 0
            const isLast = i === Math.min(result.matches.length, 15) - 1 && result.matches.length <= 15
            return (
              <div key={i} className="flex">
                <div className={`select-none text-slate-400 text-right pr-3 pl-2 sticky left-0 shrink-0 min-w-[3.5rem] bg-slate-200/40 border-r border-slate-200/50 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                  {m.line_number}
                </div>
                <div className={`flex-1 px-3 truncate text-slate-600 ${isFirst ? 'pt-2' : ''} ${isLast ? 'pb-2' : ''}`}>
                  <span className="font-semibold text-slate-500">{m.file_path?.split('/').pop()?.split('\\').pop()}</span>
                  <span className="opacity-40 px-2">|</span>
                  {m.line_content}
                </div>
              </div>
            )
          })}
          {result.matches.length > 15 && (
            <div className="flex mt-1 border-t border-slate-200/50 bg-slate-100/50">
               <div className="select-none text-slate-400 text-right pr-3 pl-2 pb-2 sticky left-0 shrink-0 min-w-[3.5rem] bg-slate-200/40 border-r border-slate-200/50">...</div>
               <div className="flex-1 px-3 py-1 pb-2 text-[10px] text-slate-500 italic">+ {result.matches.length - 15} temuan lainnya disembunyikan</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const diff = result?.diff
  if (isCompleted && diff && ['edit_file', 'replace_code', 'insert_code', 'batch_replace'].includes(toolCall?.name || '')) return <DiffBlock oldText={diff.old_text || ''} newText={diff.new_text || ''} />

  if (toolCall?.name === 'replace_file_content' || toolCall?.name === 'edit_file') {
    const oldText = toolCall?.arguments?.TargetContent
    const newText = toolCall?.arguments?.ReplacementContent
    if (oldText || newText) {
      return <DiffBlock oldText={oldText || ''} newText={newText || ''} />
    }
  }

  if (toolCall?.name === 'multi_replace_file_content') {
    const chunks = toolCall?.arguments?.ReplacementChunks
    if (Array.isArray(chunks)) {
      return (
        <div className="space-y-4">
          {chunks.map((chunk, idx) => (
            <DiffBlock key={idx} oldText={chunk.TargetContent || ''} newText={chunk.ReplacementContent || ''} />
          ))}
        </div>
      )
    }
  }

  if (isCompleted && toolCall?.name === 'read_file' && result?.content) return <CodeBlock code={result.content} showLineNumbers />
  if (isCompleted && toolCall?.name === 'get_file_diff' && result?.message) return <div className="text-xs text-slate-500">{result.message}</div>

  if (isCompleted && ['list_skill', 'load_skills'].includes(toolCall?.name || '')) {
    const skillIds = (Array.isArray(toolCall?.arguments?.ids) ? toolCall.arguments.ids : Array.isArray((toolCall?.result as any)?.skills) ? (toolCall?.result as any).skills.map((s: any) => s.id) : []).filter(Boolean)
    if (skillIds.length > 0) {
      return (
        <div className="flex flex-wrap gap-1.5 py-1">
          {skillIds.map((id) => (
            <span key={id} className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {id}
            </span>
          ))}
        </div>
      )
    }
    return null
  }

  if (isCompleted && ['search_design', 'get_design'].includes(toolCall?.name || '')) {
    const designIds = (toolCall?.arguments?.id ? [toolCall.arguments.id] : Array.isArray(toolCall?.arguments?.ids) ? toolCall.arguments.ids : Array.isArray((toolCall?.result as any)?.designs) ? (toolCall?.result as any).designs.map((d: any) => d.id) : []).filter(Boolean)
    if (designIds.length > 0) {
      return (
        <div className="flex flex-wrap gap-1.5 py-1">
          {designIds.map((id) => (
            <span key={id} className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 font-mono text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              {id}
            </span>
          ))}
        </div>
      )
    }
    return null
  }

  if (code) return <CodeBlock code={code} showLineNumbers isStreaming={isStreaming} />

  return null
}
