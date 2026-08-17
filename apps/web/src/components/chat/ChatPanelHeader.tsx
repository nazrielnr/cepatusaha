import { ChevronLeft, PanelLeftClose } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type ChatPanelHeaderProps = {
  projectName: string
  projectSubtitle?: string
  isDropdownOpen?: boolean
  setIsDropdownOpen?: (open: boolean) => void
  onCollapseSidebar?: () => void
}

export function ChatPanelHeader({ projectName, projectSubtitle, onCollapseSidebar }: ChatPanelHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="h-14 min-h-[3.5rem] w-full border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-slate-900 sticky top-0 z-10 shrink-0 transition-colors">
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center w-8 h-8 mr-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
            {projectName}
          </span>
        </div>
      </div>

      {onCollapseSidebar && (
        <div className="flex items-center gap-1 ml-4 shrink-0">
          <button onClick={onCollapseSidebar} className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Collapse Sidebar" aria-label="Collapse sidebar">
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
