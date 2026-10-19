import { ChevronLeft, PanelLeftClose, Pencil, Check, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

type ChatPanelHeaderProps = {
  projectName: string
  projectSubtitle?: string
  isDropdownOpen?: boolean
  setIsDropdownOpen?: (open: boolean) => void
  onCollapseSidebar?: () => void
  onRenameProject?: (newTitle: string) => void
}

export function ChatPanelHeader({ projectName, projectSubtitle, onCollapseSidebar, onRenameProject }: ChatPanelHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [titleValue, setTitleValue] = useState(projectName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitleValue(projectName)
  }, [projectName])

  const handleSave = () => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== projectName && onRenameProject) {
      onRenameProject(trimmed)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTitleValue(projectName)
    setIsEditing(false)
  }

  return (
    <div className="h-14 min-h-[3.5rem] w-full border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 bg-white dark:bg-slate-900 sticky top-0 z-10 shrink-0 transition-colors">
      <div className="flex items-center min-w-0 flex-1">
        <button
          onClick={() => { window.location.replace('/') }}
          className="flex items-center justify-center w-8 h-8 mr-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center min-w-0 flex-1">
          {isEditing ? (
            <div className="flex items-center gap-1.5 min-w-0 max-w-xs flex-1">
              <input
                ref={inputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') handleCancel()
                }}
                className="w-full text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-primary text-slate-800 dark:text-slate-100 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSave}
                className="p-1 text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded shrink-0"
                title="Simpan"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded shrink-0"
                title="Batal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              className={`group/title flex items-center gap-1.5 min-w-0 ${onRenameProject ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => onRenameProject && setIsEditing(true)}
              title={onRenameProject ? 'Klik untuk mengganti nama proyek' : undefined}
            >
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
                {projectName}
              </span>
              {onRenameProject && (
                <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
              )}
            </div>
          )}
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
