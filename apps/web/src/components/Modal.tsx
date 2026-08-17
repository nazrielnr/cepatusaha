import { useEffect, useState, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  frameless?: boolean
}

export function Modal({ isOpen, onClose, title, children, footer, frameless = false }: ModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  // Handle opening and closing animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
      // Trigger open animation after render
      setTimeout(() => {
        setIsVisible(true)
      }, 10)
    } else if (shouldRender) {
      // Start closing animation
      setIsVisible(false)
      setIsClosing(true)
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 200) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen, shouldRender])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isClosing, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isClosing) {
      onClose()
    }
  }

  if (!shouldRender) {
    return null
  }

  return (
    <>
      {/* Glassmorphism Backdrop */}
      <div
        className={`fixed inset-0 z-[70] bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        {...(frameless ? { 'aria-label': title } : { 'aria-labelledby': 'modal-title' })}
      >
        {/* Modal Content */}
        <div
          className={`relative w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-xl border-2 border-border overflow-hidden transition-all duration-300 pointer-events-auto ${
            isVisible
              ? 'scale-100 opacity-100'
              : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {frameless ? (
          <>{children}</>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <h2 className="text-xl font-semibold text-card-foreground" id="modal-title">{title}</h2>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] bg-card">
              {children}
            </div>
            {footer && (
              <div className="px-6 py-4 border-t border-border bg-card">
                {footer}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  )
}
