import { useState, useRef, useEffect, memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectDropdownProps {
  projectName: string
  onNavigateToDashboard: () => void
}

export const ProjectDropdown = memo(function ProjectDropdown({ projectName, onNavigateToDashboard }: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Project: ${projectName}. Click to open menu`}
      >
        <span className="text-sm font-medium text-foreground">
          {projectName}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            animation: 'dropdownSlideIn 0.2s ease-out'
          }}
          role="menu"
          aria-label="Project menu"
        >
          <button
            onClick={() => {
              setIsOpen(false)
              onNavigateToDashboard()
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-popover-foreground hover:bg-accent rounded-lg transition-colors duration-150"
            role="menuitem"
            aria-label="Return to dashboard"
          >
            Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  )
})
