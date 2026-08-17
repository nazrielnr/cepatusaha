/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles,
  Edit,
  X,
  Image as ImageIcon,
  ChevronDown,
  Type,
  Palette,
  Box,
  Maximize2
} from 'lucide-react'
import type { ElementData } from '@/hooks/useInspectMode'

interface InspectContextMenuProps {
  element: ElementData
  onAskAI: () => void
  onEditText: (newText: string) => void
  onEditImage: () => void
  onClose: () => void
}

// Extract computed styles from element
function getComputedStyles(element: HTMLElement) {
  const computed = window.getComputedStyle(element)
  return {
    // Typography
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    fontFamily: computed.fontFamily,
    color: computed.color,
    textAlign: computed.textAlign,
    lineHeight: computed.lineHeight,

    // Spacing
    marginTop: computed.marginTop,
    marginRight: computed.marginRight,
    marginBottom: computed.marginBottom,
    marginLeft: computed.marginLeft,
    paddingTop: computed.paddingTop,
    paddingRight: computed.paddingRight,
    paddingBottom: computed.paddingBottom,
    paddingLeft: computed.paddingLeft,

    // Size
    width: computed.width,
    height: computed.height,
    maxWidth: computed.maxWidth,
    maxHeight: computed.maxHeight,

    // Background
    backgroundColor: computed.backgroundColor,
    backgroundImage: computed.backgroundImage,

    // Border
    borderWidth: computed.borderWidth,
    borderStyle: computed.borderStyle,
    borderColor: computed.borderColor,
    borderRadius: computed.borderRadius,

    // Display
    display: computed.display,
    position: computed.position,
    opacity: computed.opacity,
  }
}

export function InspectContextMenu({
  element,
  onAskAI,
  onEditText,
  onEditImage,
  onClose
}: InspectContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  // Default: expand all sections
  const initialSections = new Set(['info', 'typography', 'spacing', 'size', 'appearance'])
  if (element.isTextEditable && element.text) {
    initialSections.add('text')
  }
  if (element.isImageEditable) {
    initialSections.add('image')
  }
  const [expandedSections, setExpandedSections] = useState<Set<string>>(initialSections)
  const [editingText, setEditingText] = useState(element.text || '')
  const [isTextDirty, setIsTextDirty] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // Tab state: 'edit' or 'prompt'
  const [activeTab, setActiveTab] = useState<'edit' | 'prompt'>('edit')
  const [aiPrompt, setAiPrompt] = useState('')

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 150) // Match animation duration
  }

  // Calculate position
  const position = useMemo(() => {
    const menuWidth = 280
    const menuMaxHeight = window.innerHeight * 0.5 // 50vh
    const padding = 10

    let x = element.position.x
    let y = element.position.y

    if (x + menuWidth > window.innerWidth - padding) {
      x = element.position.x - menuWidth
    }
    if (y + menuMaxHeight > window.innerHeight - padding) {
      y = element.position.y - menuMaxHeight
    }

    x = Math.max(padding, Math.min(x, window.innerWidth - menuWidth - padding))
    y = Math.max(padding, Math.min(y, window.innerHeight - menuMaxHeight - padding))

    return { x, y }
  }, [element.position])

  // Extract computed styles
  const styles = useMemo(() => getComputedStyles(element.element), [element.element])

  // Parse classes for display
  const classList = element.classes.split(' ').filter(Boolean)

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Generate AI prompt for CSS changes
  const handleStyleChange = (property: string, value: string) => {
    const prompt = `Change the ${property} of the "${element.tag}" element with text "${element.text.slice(0, 30)}..." to ${value}.

Element selector: ${element.tag}${element.classes ? '.' + element.classes.split(' ').join('.') : ''}

Please update the CSS file accordingly.`

    // Call onAskAI with the structured prompt
    // This will populate the chat input
        onAskAI() // For now, just trigger the AI dialog
  }

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value)
    setIsTextDirty(true)
  }

  // Save text changes
  const handleSaveText = () => {
    if (isTextDirty && editingText !== element.text) {
      onEditText(editingText)
      setIsTextDirty(false)
    }
  }

  // Handle Apply Changes
  const handleApplyChanges = () => {
    if (aiPrompt.trim()) {
      // Call the parent's onAskAI with the prompt
      onAskAI()
      setAiPrompt('')
      setActiveTab('edit') // Back to edit view
    }
  }

  // Handle Cancel - back to edit view
  const handleCancelPrompt = () => {
    setActiveTab('edit')
    setAiPrompt('')
  }

  // Focus on mount
  useEffect(() => {
    menuRef.current?.focus()
  }, [])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div
      ref={menuRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        width: 280,
        zIndex: 999,
        maxHeight: '50vh',
        willChange: 'opacity, transform',
        animationFillMode: 'forwards'
      }}
      className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col transition-all duration-150 ${
        isClosing
          ? 'animate-out fade-out slide-out-to-top-2'
          : 'animate-in fade-in slide-in-from-top-2'
      }`}
    >
      {/* Header with tabs */}
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 shadow-sm flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-slate-700">
            {element.tag.toUpperCase()}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'edit'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              EDIT
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'prompt'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              PROMPT
            </button>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Scrollable content - with proper overflow handling */}
      <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        {activeTab === 'edit' ? (
          // EDIT VIEW
          <>
        {/* Element Info - Horizontal layout like Family Elements */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection('info')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
          >
            <span className="text-xs font-semibold text-slate-600">Element</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('info') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('info') && (
            <div className="px-3 pb-2.5">
              {/* Horizontal layout with tag and classes */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="px-2 py-1 bg-primary/10 rounded text-xs font-mono text-primary font-semibold">
                  {element.tag.toLowerCase()}
                </div>
                {classList.length > 0 && classList.slice(0, 4).map((cls, i) => (
                  <div key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-600">
                    {cls.length > 10 ? cls.slice(0, 10) + '…' : cls}
                  </div>
                ))}
                {classList.length > 4 && (
                  <div className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono text-slate-500">
                    +{classList.length - 4}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Content - Editable if text element */}
        {element.isTextEditable && element.text && (
          <div className="border-b border-slate-100">
            <button
              onClick={() => toggleSection('text')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <Edit className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">Text Content</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('text') ? '' : '-rotate-90'}`} />
            </button>
            {expandedSections.has('text') && (
              <div className="px-3 pb-2.5 space-y-2">
                <textarea
                  value={editingText}
                  onChange={handleTextChange}
                  onBlur={handleSaveText}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Enter text content..."
                />
                {isTextDirty && (
                  <button
                    onClick={handleSaveText}
                    className="w-full px-2 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium rounded transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Image Section - If image element */}
        {element.isImageEditable && (
          <div className="border-b border-slate-100">
            <button
              onClick={() => toggleSection('image')}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600">Image</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('image') ? '' : '-rotate-90'}`} />
            </button>
            {expandedSections.has('image') && (
              <div className="px-3 pb-2.5 space-y-2">
                <div className="text-xs text-slate-600 mb-2">
                  Use AI to change or generate a new image
                </div>
                <button
                  onClick={onEditImage}
                  className="w-full px-2 py-1.5 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium rounded transition-colors"
                >
                  Change Image with AI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Typography Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection('typography')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Typography</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('typography') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('typography') && (
            <div className="px-3 pb-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Font Size</div>
                  <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                    {styles.fontSize}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Weight</div>
                  <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                    {styles.fontWeight}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Color</div>
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                  {styles.color}
                </div>
              </div>
              <button
                onClick={() => handleStyleChange('typography', 'custom values')}
                className="w-full px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded transition-colors"
              >
                Edit with AI
              </button>
            </div>
          )}
        </div>

        {/* Spacing Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection('spacing')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Box className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Spacing</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('spacing') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('spacing') && (
            <div className="px-3 pb-2.5 space-y-2">
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Margin</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    T: {styles.marginTop}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    R: {styles.marginRight}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    B: {styles.marginBottom}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    L: {styles.marginLeft}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Padding</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    T: {styles.paddingTop}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    R: {styles.paddingRight}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    B: {styles.paddingBottom}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-[10px] font-mono text-slate-700">
                    L: {styles.paddingLeft}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStyleChange('spacing', 'custom values')}
                className="w-full px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded transition-colors"
              >
                Edit with AI
              </button>
            </div>
          )}
        </div>

        {/* Size Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection('size')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Size</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('size') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('size') && (
            <div className="px-3 pb-2.5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Width</div>
                  <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                    {styles.width}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Height</div>
                  <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                    {styles.height}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStyleChange('size', 'custom values')}
                className="w-full px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded transition-colors"
              >
                Edit with AI
              </button>
            </div>
          )}
        </div>

        {/* Appearance Section */}
        <div className="border-b border-slate-100">
          <button
            onClick={() => toggleSection('appearance')}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Appearance</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedSections.has('appearance') ? '' : '-rotate-90'}`} />
          </button>
          {expandedSections.has('appearance') && (
            <div className="px-3 pb-2.5 space-y-2">
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Background</div>
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                  {styles.backgroundColor}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Opacity</div>
                <div className="px-2 py-1.5 bg-slate-50 rounded text-xs font-mono text-slate-700">
                  {styles.opacity}
                </div>
              </div>
              <button
                onClick={() => handleStyleChange('appearance', 'custom values')}
                className="w-full px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded transition-colors"
              >
                Edit with AI
              </button>
            </div>
          )}
        </div>
        </>
        ) : (
          // PROMPT VIEW
          <div className="flex flex-col h-full">
            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {/* Prompt Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Describe what you want to change:
                </label>

                {/* Prompt Textarea */}
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Adapt to dark mode, add details, make adaptive, change text to..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  rows={4}
                  autoFocus
                />
              </div>

              {/* Element Info Section */}
              <div className="pt-1">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Selected Element
                </div>

                <div className="space-y-2">
                  {/* Tag Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">Tag:</span>
                    <div className="px-2 py-0.5 bg-primary/10 rounded text-xs font-mono text-primary font-semibold">
                      {element.tag.toUpperCase()}
                    </div>
                  </div>

                  {/* Classes Display */}
                  {classList.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1.5">Classes:</span>
                      <div className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md">
                        <div className="text-[10px] font-mono text-slate-700 break-all leading-relaxed">
                          {classList.join(' ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="border-t border-slate-200 bg-slate-50 px-3 py-3 space-y-2.5 flex-shrink-0">
              {/* Cost Info */}
              <div className="text-[10px] text-slate-500 text-center">
                Costs 1 prompt. Will autosave after completion.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelPrompt}
                  className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyChanges}
                  disabled={!aiPrompt.trim()}
                  className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono shadow-sm">
            ESC
          </kbd>
          to close
        </span>
      </div>


    </div>
  )
}
