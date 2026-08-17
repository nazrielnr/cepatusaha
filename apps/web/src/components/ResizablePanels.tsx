import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

interface ResizablePanelsProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  defaultLeftWidth?: number // percentage (0-100)
  minLeftWidth?: number // percentage
  maxLeftWidth?: number // percentage
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 30,
  minLeftWidth = 20,
  maxLeftWidth = 60,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Clamp between min and max
      const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newLeftWidth))
      setLeftWidth(clampedWidth)
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle blur/focus loss - reset drag state
  const handleBlur = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      // Add all event listeners to document
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      // Also listen for mouseleave on document to catch mouse leaving window
      document.addEventListener('mouseleave', handleMouseUp)
      // Listen for blur/focus loss
      window.addEventListener('blur', handleBlur)

      // Set cursor and disable text selection
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      // Disable pointer events on iframes while dragging
      const iframes = document.querySelectorAll('iframe')
      iframes.forEach(iframe => {
        iframe.style.pointerEvents = 'none'
      })

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('mouseleave', handleMouseUp)
        window.removeEventListener('blur', handleBlur)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''

        // Re-enable pointer events on iframes
        iframes.forEach(iframe => {
          iframe.style.pointerEvents = ''
        })
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleBlur])

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left Panel */}
      <div
        className="min-w-0 border-r border-brand-border"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <div
        className={`relative w-1 bg-brand-border hover:bg-brand-primary transition-colors cursor-col-resize group ${isDragging ? 'bg-brand-primary' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator on hover/drag */}
        <div className={`absolute inset-y-0 -left-1 -right-1 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="h-full w-3 bg-brand-primary/10" />
        </div>

        {/* Center grip indicator */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="flex flex-col gap-1 p-2 bg-brand-surface rounded shadow-lg border border-brand-border">
            <div className="w-1 h-1 bg-brand-secondary rounded-full" />
            <div className="w-1 h-1 bg-brand-secondary rounded-full" />
            <div className="w-1 h-1 bg-brand-secondary rounded-full" />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="min-w-0"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
