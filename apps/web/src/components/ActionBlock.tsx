import { memo, useState, useEffect, useRef } from 'react'
import { BookOpenCheck, Circle, FileMinus2, FilePenLine, FilePlus2, FileSearch, Files, Loader2, Search, XCircle, ChevronRight, Lightbulb, Sparkles, ClipboardList, HelpCircle, Image } from 'lucide-react'
import type { ActionType } from './action-block/types'
import type { ActionBlockProps, ToolCall } from './action-block/types'
import { extractToolDetails, extractToolFilePath } from './action-block/toolDetails'
import { ActionBlockContent } from './action-block/ActionBlockContent'
import { areActionBlockPropsEqual } from './action-block/areActionBlockPropsEqual'

const pathOf = extractToolFilePath
const skillIdsOf = (tc?: ToolCall) => (Array.isArray(tc?.arguments?.ids) ? tc?.arguments?.ids : Array.isArray((tc?.result as any)?.skills) ? (tc?.result as any).skills.map((s: any) => s.id) : []).filter(Boolean)
const designIdsOf = (tc?: ToolCall) => (tc?.arguments?.id ? [tc.arguments.id] : Array.isArray(tc?.arguments?.ids) ? tc.arguments.ids : Array.isArray((tc?.result as any)?.designs) ? (tc?.result as any).designs.map((d: any) => d.id) : []).filter(Boolean)

function Icon({ name, status, className = '' }: { name?: string; status?: string; className?: string }) {
  const cls = `h-3.5 w-3.5 ${className}`
  if (status === 'error') return <XCircle className={cls} />
  if (status === 'pending' || status === 'running') return <Loader2 className={`${cls} animate-spin`} />
  if (name === 'write_file' || name === 'create_file') return <FilePlus2 className={cls} />
  if (name === 'delete_file') return <FileMinus2 className={cls} />
  if (name === 'edit_file' || name === 'replace_code' || name === 'insert_code' || name === 'batch_replace') return <FilePenLine className={cls} />
  if (name === 'read_file') return <FileSearch className={cls} />
  if (['search_design', 'get_design', 'list_skill', 'load_skills'].includes(name || '')) return <BookOpenCheck className={cls} />
  if (name === 'search_files' || name === 'search_in_files') return <Search className={cls} />
  if (name === 'list_files' || name === 'check_workspace') return <Files className={cls} />
  if (name === 'generate_planning_docs') return <Lightbulb className={cls} />
  if (name === 'execute_plan') return <Sparkles className={cls} />
  if (name === 'gather_requirements') return <ClipboardList className={cls} />
  if (name === 'ask_user') return <HelpCircle className={cls} />
  if (name === 'analyze_image') return <Image className={cls} />
  return <Circle className={cls} />
}

export const ActionBlock = memo(function ActionBlock({ type, label, status, code, toolCall, onFormSubmit }: ActionBlockProps) {
  const normalized = status === 'loading' ? 'running' : status === 'complete' ? 'completed' : status === 'failed' ? 'error' : status
  const name = (type || toolCall?.name || 'tool') as ActionType
  const file = pathOf(toolCall)
  const skillIds = skillIdsOf(toolCall)
  const designIds = designIdsOf(toolCall)
  const isSkillLoad = ['list_skill', 'load_skills'].includes(name)
  const isDesignLoad = ['search_design', 'get_design'].includes(name)
  const title = label || extractToolDetails(toolCall, normalized) || String(name).replace(/_/g, ' ')
  const replacementText = Array.isArray(toolCall?.arguments?.ReplacementChunks) ? toolCall.arguments.ReplacementChunks.map((c: any) => c.ReplacementContent).join('\n...\n') : undefined
  const isSearch = name === 'search_files' || name === 'search_in_files'
  const actualCode = code || toolCall?.arguments?.content || toolCall?.arguments?.CodeContent || toolCall?.arguments?.ReplacementContent || toolCall?.arguments?.Instruction || replacementText || (!isSearch ? toolCall?.arguments?.query : undefined) || toolCall?.streamingContent
  const hasDiff = Boolean((toolCall?.result as any)?.diff)
  const isSkillOrDesign = isSkillLoad || isDesignLoad
  const hasBody = Boolean(
    (!isSkillOrDesign && actualCode) ||
    hasDiff ||
    toolCall?.error ||
    (toolCall?.result && ['get_file_diff'].includes(toolCall.name)) ||
    (normalized === 'completed' && isSkillLoad && skillIds.length > 0) ||
    (normalized === 'completed' && isDesignLoad && designIds.length > 0)
  )
  const tone = normalized === 'error' ? 'text-destructive' : normalized === 'pending' || normalized === 'running' ? 'text-primary' : 'text-slate-400'
  const [isOpen, setIsOpen] = useState(false)
  const [userToggled, setUserToggled] = useState(false)
  const prevStatusRef = useRef(normalized)

  const handleToggle = () => {
    setIsOpen(!isOpen)
    setUserToggled(true)
  }

  useEffect(() => {
    if (!isSkillOrDesign || !hasBody) return

    // Case 1: Just completed -> Auto-expand then collapse after 1500ms
    if (normalized === 'completed' && prevStatusRef.current !== 'completed') {
      if (!userToggled) {
        setIsOpen(true)
        const timer = setTimeout(() => {
          setIsOpen(false)
        }, 1500)
        return () => clearTimeout(timer)
      }
    }

    // Case 2: Running/Pending -> Auto-expand
    if ((normalized === 'running' || normalized === 'pending') && (prevStatusRef.current !== 'running' && prevStatusRef.current !== 'pending')) {
      if (!userToggled) {
        setIsOpen(true)
      }
    }

    prevStatusRef.current = normalized
  }, [normalized, isSkillOrDesign, hasBody, userToggled])

  return (
    <div className="w-full animate-enter" style={{ animationFillMode: 'forwards' }}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex min-h-[36px] w-full items-center gap-2 py-2 text-left group cursor-pointer select-none focus:outline-none rounded touch-manipulation"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-transparent">
          <Icon name={toolCall?.name} status={normalized} className={tone} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs leading-normal">
          <span className={`shrink-0 font-medium ${
            normalized === 'pending' || normalized === 'running'
              ? 'bg-gradient-to-r from-slate-500 via-white to-slate-500 dark:from-slate-400 dark:via-slate-100 dark:to-slate-400 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent'
              : 'text-slate-600 dark:text-slate-300'
          }`}>
            {title}
          </span>

          {file && !['list_files', 'check_workspace', 'search_files', 'search_in_files'].includes(name) && (!isSkillOrDesign || normalized === 'completed') && (
            <span className="min-w-0 truncate rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
              {file}
            </span>
          )}
        </div>
        {hasBody && (
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
        )}
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-500 [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] ${
          isOpen && hasBody ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="ml-2.5 border-l-2 border-slate-200/40 pl-4">
            <ActionBlockContent
              toolCall={toolCall}
              code={actualCode}
              isError={normalized === 'error'}
              isCompleted={normalized === 'completed'}
              isStreaming={normalized === 'pending' || normalized === 'running'}
              onFormSubmit={onFormSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}, areActionBlockPropsEqual)
