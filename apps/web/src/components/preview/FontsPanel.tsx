/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FontsPanelProps {
  isOpen: boolean
  onClose: () => void
  previewHtml?: string
  onFontChange?: (changes: FontChanges) => void
  position?: { x: number; y: number }
}

interface FontChanges {
  headingFont?: string
  headingWeight?: string
  headingSpacing?: string
  bodyFont?: string
  bodyWeight?: string
  bodySpacing?: string
}

interface DetectedFont {
  name: string
  sizes: string[]
  weight: string
  usageCount: number
}

// Popular Google Fonts list
const POPULAR_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Nunito', 'Playfair Display', 'Merriweather', 'PT Sans',
  'Source Sans Pro', 'Work Sans', 'Oswald', 'Ubuntu', 'Quicksand'
]

// Font pairings suggestions
const FONT_PAIRINGS = [
  { heading: 'Inter', body: 'Inter' },
  { heading: 'Playfair Display', body: 'Lato' },
  { heading: 'Montserrat', body: 'Open Sans' },
  { heading: 'Raleway', body: 'Merriweather' },
  { heading: 'Poppins', body: 'Roboto' },
  { heading: 'Oswald', body: 'PT Sans' },
  { heading: 'Nunito', body: 'Nunito' },
  { heading: 'Work Sans', body: 'Work Sans' }
]

const FONT_WEIGHTS = ['Light', 'Regular', 'Medium', 'Semibold', 'Bold']
const FONT_SPACINGS = ['Tighter', 'Tight', 'Default', 'Wide', 'Wider', 'Widest']

export function FontsPanel({ isOpen, onClose, previewHtml, onFontChange, position }: FontsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'change' | 'imported'>('change')
  const [headingFont, setHeadingFont] = useState('Inter')
  const [headingWeight, setHeadingWeight] = useState('Regular')
  const [headingSpacing, setHeadingSpacing] = useState('Default')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [bodyWeight, setBodyWeight] = useState('Regular')
  const [bodySpacing, setBodySpacing] = useState('Default')
  const [detectedFonts, setDetectedFonts] = useState<DetectedFont[]>([])
  const [importedFonts, setImportedFonts] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 150)
  }

  // Detect and initialize fonts from preview HTML whenever panel opens
  useEffect(() => {
    if (previewHtml && isOpen) {
      detectAndInitializeFonts(previewHtml)
    }
  }, [previewHtml, isOpen])

  const detectAndInitializeFonts = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Check for font-inspector style tag (our custom styles)
    const fontInspectorStyle = doc.querySelector('style[data-font-inspector]')
    if (fontInspectorStyle) {
      const cssText = fontInspectorStyle.textContent || ''

      // Extract heading font settings
      const h1Match = cssText.match(/h1[^{]*{[^}]*font-family:\s*'([^']+)'[^}]*font-weight:\s*(\d+)[^}]*letter-spacing:\s*([^;!]+)/i)
      if (h1Match) {
        setHeadingFont(h1Match[1])
        setHeadingWeight(mapWeightToName(h1Match[2]))
        setHeadingSpacing(mapSpacingToName(h1Match[3].trim()))
      }

      // Extract body font settings
      const bodyMatch = cssText.match(/body[^{]*{[^}]*font-family:\s*'([^']+)'[^}]*font-weight:\s*(\d+)[^}]*letter-spacing:\s*([^;!]+)/i)
      if (bodyMatch) {
        setBodyFont(bodyMatch[1])
        setBodyWeight(mapWeightToName(bodyMatch[2]))
        setBodySpacing(mapSpacingToName(bodyMatch[3].trim()))
      }
    } else {
      // Detect from actual elements
      const h1 = doc.querySelector('h1, h2, h3')
      if (h1) {
        const style = (h1 as HTMLElement).getAttribute('style') || ''
        const fontMatch = style.match(/font-family:\s*'?([^';,]+)'?/)
        const weightMatch = style.match(/font-weight:\s*(\d+)/)
        const spacingMatch = style.match(/letter-spacing:\s*([^;]+)/)

        if (fontMatch) setHeadingFont(fontMatch[1].trim())
        if (weightMatch) setHeadingWeight(mapWeightToName(weightMatch[1]))
        if (spacingMatch) setHeadingSpacing(mapSpacingToName(spacingMatch[1].trim()))
      }

      const body = doc.querySelector('body, p')
      if (body) {
        const style = (body as HTMLElement).getAttribute('style') || ''
        const fontMatch = style.match(/font-family:\s*'?([^';,]+)'?/)
        const weightMatch = style.match(/font-weight:\s*(\d+)/)
        const spacingMatch = style.match(/letter-spacing:\s*([^;]+)/)

        if (fontMatch) setBodyFont(fontMatch[1].trim())
        if (weightMatch) setBodyWeight(mapWeightToName(weightMatch[1]))
        if (spacingMatch) setBodySpacing(mapSpacingToName(spacingMatch[1].trim()))
      }
    }

    detectFontsFromHTML(html)
  }

  const mapWeightToName = (weight: string): string => {
    const weightMap: Record<string, string> = {
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semibold',
      '700': 'Bold',
    }
    return weightMap[weight] || 'Regular'
  }

  const mapSpacingToName = (spacing: string): string => {
    const spacingMap: Record<string, string> = {
      '-0.05em': 'Tighter',
      '-0.025em': 'Tight',
      'normal': 'Default',
      '0.025em': 'Wide',
      '0.05em': 'Wider',
      '0.1em': 'Widest',
    }
    return spacingMap[spacing] || 'Default'
  }

  // Focus on mount
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus()
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
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
  }, [isOpen])

  const detectFontsFromHTML = (html: string) => {
    // Parse HTML and detect fonts
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    const fontMap = new Map<string, DetectedFont>()

    // Check all elements for font-family
    const allElements = doc.querySelectorAll('*')
    allElements.forEach(el => {
      const style = window.getComputedStyle(el as HTMLElement)
      const fontFamily = style.fontFamily
      const fontSize = style.fontSize
      const fontWeight = style.fontWeight

      if (fontFamily && fontFamily !== 'inherit') {
        const fontName = fontFamily.split(',')[0].replace(/['"]/g, '').trim()

        if (fontMap.has(fontName)) {
          const existing = fontMap.get(fontName)!
          existing.usageCount++
          if (!existing.sizes.includes(fontSize)) {
            existing.sizes.push(fontSize)
          }
        } else {
          fontMap.set(fontName, {
            name: fontName,
            sizes: [fontSize],
            weight: fontWeight,
            usageCount: 1
          })
        }
      }
    })

    const detected = Array.from(fontMap.values())
      .sort((a, b) => b.usageCount - a.usageCount)

    setDetectedFonts(detected)

    // Extract imported fonts from link tags
    const linkTags = doc.querySelectorAll('link[href*="fonts.googleapis.com"]')
    const imported: string[] = []
    linkTags.forEach(link => {
      const href = link.getAttribute('href') || ''
      const match = href.match(/family=([^:&]+)/)
      if (match) {
        imported.push(match[1].replace(/\+/g, ' '))
      }
    })
    setImportedFonts(imported)
  }

  const handleApplyChanges = () => {
    if (onFontChange) {
      onFontChange({
        headingFont,
        headingWeight,
        headingSpacing,
        bodyFont,
        bodyWeight,
        bodySpacing
      })
    }
  }

  const handleRemoveFont = (fontName: string) => {
    setImportedFonts(prev => prev.filter(f => f !== fontName))
  }

  if (!isOpen) return null

  // Calculate position - default to center if no position provided
  const panelWidth = 280
  const panelMaxHeight = window.innerHeight * 0.5 // 50vh
  const padding = 10

  let x = position?.x ?? window.innerWidth / 2 - panelWidth / 2
  let y = position?.y ?? window.innerHeight / 2 - panelMaxHeight / 2

  // Adjust if panel goes off screen
  if (x + panelWidth > window.innerWidth - padding) {
    x = window.innerWidth - panelWidth - padding
  }
  if (x < padding) {
    x = padding
  }
  if (y + panelMaxHeight > window.innerHeight - padding) {
    y = window.innerHeight - panelMaxHeight - padding
  }
  if (y < padding) {
    y = padding
  }

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        width: panelWidth,
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
            FONTS
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('change')}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'change'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              CHANGE
            </button>
            <button
              onClick={() => setActiveTab('imported')}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                activeTab === 'imported'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              IMPORTED
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

        {/* Scrollable content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {activeTab === 'change' ? (
            <div className="space-y-3 px-3 py-3">
              {/* Headings Section */}
              <div className="border-b border-slate-100 pb-3">
                <div className="mb-2">
                  <h3 className="text-xs font-semibold text-slate-600">Headings</h3>
                  <p className="text-[10px] text-slate-500">Size &gt; 20px</p>
                </div>

                <div className="space-y-2">
                  {/* Font Family Dropdown */}
                  <Select value={headingFont} onValueChange={setHeadingFont}>
                    <SelectTrigger className="w-full h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors duration-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gray-300 dark:bg-transparent dark:border-border dark:text-foreground">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_FONTS.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Font Weight */}
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Weight</div>
                    <div className="flex flex-wrap gap-1">
                      {FONT_WEIGHTS.map(weight => (
                        <button
                          key={weight}
                          onClick={() => setHeadingWeight(weight)}
                          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                            headingWeight === weight
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Spacing</div>
                    <div className="flex flex-wrap gap-1">
                      {FONT_SPACINGS.map(spacing => (
                        <button
                          key={spacing}
                          onClick={() => setHeadingSpacing(spacing)}
                          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                            headingSpacing === spacing
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {spacing}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Text Section */}
              <div className="border-b border-slate-100 pb-3">
                <div className="mb-2">
                  <h3 className="text-xs font-semibold text-slate-600">Body Text</h3>
                  <p className="text-[10px] text-slate-500">Size ≤ 20px</p>
                </div>

                <div className="space-y-2">
                  {/* Font Family Dropdown */}
                  <Select value={bodyFont} onValueChange={setBodyFont}>
                    <SelectTrigger className="w-full h-8 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors duration-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-1 focus-visible:outline-gray-300 dark:bg-transparent dark:border-border dark:text-foreground">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {POPULAR_FONTS.map(font => (
                        <SelectItem key={font} value={font}>{font}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Font Weight */}
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Weight</div>
                    <div className="flex flex-wrap gap-1">
                      {FONT_WEIGHTS.map(weight => (
                        <button
                          key={weight}
                          onClick={() => setBodyWeight(weight)}
                          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                            bodyWeight === weight
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {weight}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">Spacing</div>
                    <div className="flex flex-wrap gap-1">
                      {FONT_SPACINGS.map(spacing => (
                        <button
                          key={spacing}
                          onClick={() => setBodySpacing(spacing)}
                          className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                            bodySpacing === spacing
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {spacing}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Font Styles */}
              {detectedFonts.length > 0 && (
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-semibold text-slate-600 mb-2">Detected Styles</h3>
                  <div className="space-y-2">
                    {detectedFonts.slice(0, 2).map((font, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="text-[10px] font-semibold text-slate-900 mb-1">
                          {font.sizes[0]} - {font.weight}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {font.name} ({font.usageCount}x)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Font Pairings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Pairings</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONT_PAIRINGS.slice(0, 6).map((pairing, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setHeadingFont(pairing.heading)
                        setBodyFont(pairing.body)
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded text-left transition-colors border border-slate-200"
                    >
                      <div className="text-[10px] font-semibold text-slate-900 truncate">{pairing.heading}</div>
                      <div className="text-[9px] text-slate-600 truncate">{pairing.body}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Imported Fonts Tab
            <div className="px-3 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-600">Imported</h3>
                <button className="px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
                  Remove Unused
                </button>
              </div>

              {importedFonts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {importedFonts.map((font, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-full"
                    >
                      <span className="text-[10px] font-medium text-slate-900">{font}</span>
                      <button
                        onClick={() => handleRemoveFont(font)}
                        className="w-3 h-3 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 text-slate-600" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[10px] text-slate-500">
                  No imported fonts
                </div>
              )}

              {/* Font Pairings in Imported Tab */}
              <div className="border-t border-slate-100 pt-3">
                <h3 className="text-xs font-semibold text-slate-600 mb-2">Pairings</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONT_PAIRINGS.slice(0, 6).map((pairing, idx) => (
                    <button
                      key={idx}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded text-left transition-colors border border-slate-200"
                    >
                      <div className="text-[10px] font-semibold text-slate-900 truncate">{pairing.heading}</div>
                      <div className="text-[9px] text-slate-600 truncate">{pairing.body}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'change' && (
          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyChanges}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded transition-colors shadow-sm"
            >
              Apply Changes
            </button>
          </div>
        )}

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
