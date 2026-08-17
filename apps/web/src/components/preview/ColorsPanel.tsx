/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { X, Sun, Moon, ChevronLeft } from 'lucide-react'

interface ColorsPanelProps {
  isOpen: boolean
  onClose: () => void
  previewHtml?: string
  onColorChange?: (changes: ColorChanges) => void
  position?: { x: number; y: number }
}

interface ColorChanges {
  mode?: 'light' | 'dark'
  theme?: string
  colors?: Record<string, string>
}

interface DetectedColor {
  name: string
  value: string
  type: 'text' | 'background' | 'border'
  usageCount: number
}

const STANDARD_THEME = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))']

// Theme presets
const THEME_PRESETS = [
  { name: 'CepatUsaha', colors: STANDARD_THEME },
]

const COLOR_FILTERS = ['All', 'Text', 'Background', 'Border']

// Color palettes for picker
const COLOR_PALETTES = {
  Standard: STANDARD_THEME,
}

export function ColorsPanel({ isOpen, onClose, previewHtml, onColorChange, position }: ColorsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light')
  const [selectedTheme, setSelectedTheme] = useState('CepatUsaha')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [detectedColors, setDetectedColors] = useState<DetectedColor[]>([])
  const [selectedColor, setSelectedColor] = useState<DetectedColor | null>(null)
  const [customColor, setCustomColor] = useState('')
  const [opacity, setOpacity] = useState(100)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 150)
  }

  // Sync customColor with selectedColor
  useEffect(() => {
    if (selectedColor) {
      setCustomColor(selectedColor.value)
    }
  }, [selectedColor])

  // Detect colors and state from preview HTML whenever panel opens
  useEffect(() => {
    if (previewHtml && isOpen) {
      detectAndInitializeColors(previewHtml)
    }
  }, [previewHtml, isOpen])

  const detectAndInitializeColors = (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Check for color-inspector style tag (our custom styles)
    const colorInspectorStyle = doc.querySelector('style[data-color-inspector]')
    if (colorInspectorStyle) {
      const cssText = colorInspectorStyle.textContent || ''

      // Detect color mode from body background
      const bodyBgMatch = cssText.match(/body\s*{[^}]*background-color:\s*([^;!]+)/i)
      if (bodyBgMatch) {
        const bgColor = bodyBgMatch[1].trim()
        if (bgColor === '#0f172a' || bgColor.includes('rgb(26') || bgColor.includes('hsl(0')) {
          setColorMode('dark')
        } else {
          setColorMode('light')
        }
      }

      // Try to detect theme from CSS variables
      const rootMatch = cssText.match(/:root\s*{([^}]+)}/i)
      if (rootMatch) {
        const rootVars = rootMatch[1]
        const primaryMatch = rootVars.match(/--color-primary:\s*([^;]+)/)
        if (primaryMatch) {
          const primaryColor = primaryMatch[1].trim()
          const themeColors: Record<string, string[]> = {
            CepatUsaha: STANDARD_THEME,
          }

          for (const [themeName, colors] of Object.entries(themeColors)) {
            if (colors[0].toLowerCase() === primaryColor.toLowerCase()) {
              setSelectedTheme(themeName)
              break
            }
          }
        }
      }
    }

    // Always detect colors from HTML using computed styles
    detectColorsFromHTML(html)
  }

  const detectColorsFromHTML = (html: string) => {
    const colorMap = new Map<string, DetectedColor>()

    // Create temporary iframe for computed styles
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return
    }

    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    // Wait for styles to load
    setTimeout(() => {
      try {
        const allElements = iframeDoc.querySelectorAll('body, body *')

        allElements.forEach((el) => {
          const element = el as HTMLElement

          // Skip non-visual elements
          if (['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD'].includes(element.tagName)) {
            return
          }

          const computedStyle = iframe.contentWindow?.getComputedStyle(element)
          if (!computedStyle) return

          // Get text color
          const color = computedStyle.color
          if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
            const hexColor = rgbToHex(color)
            if (hexColor) {
              addColor(colorMap, hexColor, 'text')
            }
          }

          // Get background color
          const bgColor = computedStyle.backgroundColor
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const hexBgColor = rgbToHex(bgColor)
            if (hexBgColor) {
              addColor(colorMap, hexBgColor, 'background')
            }
          }

          // Get border color
          const borderColor = computedStyle.borderTopColor
          if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
            const hexBorderColor = rgbToHex(borderColor)
            if (hexBorderColor) {
              addColor(colorMap, hexBorderColor, 'border')
            }
          }
        })

        const detected = Array.from(colorMap.values())
          .sort((a, b) => b.usageCount - a.usageCount)

        setDetectedColors(detected)
      } finally {
        document.body.removeChild(iframe)
      }
    }, 100)
  }

  const rgbToHex = (rgb: string): string | null => {
    if (rgb.startsWith('#')) {
      if (rgb.length === 4) {
        return '#' + rgb[1] + rgb[1] + rgb[2] + rgb[2] + rgb[3] + rgb[3]
      }
      return rgb.toUpperCase()
    }

    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!match) return null

    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])

    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('').toUpperCase()
  }

  const addColor = (
    map: Map<string, DetectedColor>,
    hexValue: string,
    type: DetectedColor['type']
  ) => {
    const key = `${hexValue}-${type}`

    if (map.has(key)) {
      map.get(key)!.usageCount++
    } else {
      map.set(key, {
        name: hexValue,
        value: hexValue,
        type,
        usageCount: 1
      })
    }
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

  const handleApplyChanges = () => {
    if (onColorChange) {
      onColorChange({
        mode: colorMode,
        theme: selectedTheme,
      })
    }
  }

  const handleRemoveColor = (colorName: string) => {
    setDetectedColors(prev => prev.filter(c => c.name !== colorName))
  }

  const handleColorSelect = (color: string) => {
    setCustomColor(color)
    if (selectedColor) {
      setDetectedColors(prev => prev.map(c =>
        c.name === selectedColor.name ? { ...c, value: color } : c
      ))

      if (onColorChange) {
        onColorChange({
          colors: {
            [selectedColor.name]: color
          }
        })
      }
    }
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCustomColor(value)
    if (value.match(/^#[0-9A-Fa-f]{6}$/) && selectedColor) {
      handleColorSelect(value)
    }
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpacity(parseInt(e.target.value))
  }

  const filteredColors = detectedColors.filter(color => {
    if (selectedFilter === 'All') return true
    return color.type.toLowerCase() === selectedFilter.toLowerCase()
  })

  if (!isOpen) return null

  // Calculate position
  const baseWidth = 280
  const pickerWidth = 400
  const totalWidth = selectedColor ? baseWidth + pickerWidth : baseWidth
  const panelMaxHeight = window.innerHeight * 0.5
  const padding = 10

  let x = position?.x ?? window.innerWidth / 2 - totalWidth / 2
  let y = position?.y ?? window.innerHeight / 2 - panelMaxHeight / 2

  if (x + totalWidth > window.innerWidth - padding) {
    x = window.innerWidth - totalWidth - padding
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
        width: totalWidth,
        zIndex: 999,
        maxHeight: '50vh',
      }}
      className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-row transition-all duration-150 ${
        isClosing
          ? 'animate-out fade-out slide-out-to-top-2'
          : 'animate-in fade-in slide-in-from-top-2'
      }`}
    >
      {/* Left Column - Color List */}
      <div style={{ width: baseWidth }} className="flex flex-col border-r border-slate-200">
        {/* Header */}
        <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 shadow-sm flex items-center justify-between flex-shrink-0">
          <div className="text-xs font-semibold text-slate-700">
            COLORS
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
            aria-label="Close colors panel"
          >
            <X className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        <div className="space-y-3 px-3 py-3">
          {/* Color Mode */}
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-semibold text-slate-600 mb-2">Color Mode</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setColorMode('light')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                  colorMode === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sun className="w-3 h-3" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setColorMode('dark')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium rounded transition-colors ${
                  colorMode === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
            </div>
          </div>

          {/* Theme Colors */}
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-semibold text-slate-600 mb-2">Quick Presets</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_PRESETS.map((theme) => (
                <button
                  key={theme.name}
                  type="button"
                  onClick={() => setSelectedTheme(theme.name)}
                  className={`p-2 rounded text-left transition-colors border ${
                    selectedTheme === theme.name
                      ? 'border-primary bg-primary'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {theme.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-900">{theme.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detected Colors */}
          {detectedColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-600">
                  Detected Colors
                </h3>
                <span className="text-[10px] text-slate-500">
                  {detectedColors.length} colors
                </span>
              </div>

              {/* Color Filters */}
              <div className="flex flex-wrap gap-1 mb-2">
                {COLOR_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                      selectedFilter === filter
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Color List */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {filteredColors.slice(0, 20).map((color, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded border transition-colors cursor-pointer ${
                      selectedColor?.name === color.name
                        ? 'bg-primary border-primary'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => setSelectedColor(color)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        className="w-6 h-6 rounded border border-slate-300 flex-shrink-0 transition-colors"
                        style={{ backgroundColor: color.value }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedColor(color)
                        }}
                        aria-label={`Select color ${color.value}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-slate-900 truncate">
                          {color.value}
                        </div>
                        <div className="text-[9px] text-slate-600">
                          {color.type.charAt(0).toUpperCase() + color.type.slice(1)} • {color.usageCount}x
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveColor(color.name)
                      }}
                      className="w-4 h-4 flex items-center justify-center rounded hover:bg-slate-200 transition-colors flex-shrink-0"
                      aria-label="Remove color"
                    >
                      <X className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyChanges}
            className="px-3 py-1.5 bg-primary hover:bg-primary text-primary-foreground text-xs font-semibold rounded transition-colors shadow-sm"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Right Column - Color Picker (shown when color is selected) */}
      {selectedColor && (
        <div style={{ width: pickerWidth }} className="flex flex-col animate-in slide-in-from-right duration-300">
          {/* Picker Header */}
          <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 shadow-sm flex items-center justify-between flex-shrink-0">
            <div className="text-xs font-semibold text-slate-700">
              PICK COLOR
            </div>
            <button
              type="button"
              onClick={() => setSelectedColor(null)}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
              aria-label="Back to color list"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          {/* Color Palettes */}
          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
            <div className="px-3 py-3 space-y-3">
              {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                <div key={name}>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2">{name}</h4>
                  <div className="flex gap-1 flex-wrap">
                    {colors.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          customColor.toLowerCase() === color.toLowerCase()
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div className="px-3 py-2.5 border-t border-slate-200 bg-slate-50 space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs font-medium text-slate-600">Color</span>
                <div
                  className="w-6 h-6 rounded border border-slate-300 flex-shrink-0"
                  style={{ backgroundColor: customColor }}
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                  placeholder="#0f172a"
                  aria-label="Custom color hex value"
                />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Opacity</span>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={handleOpacityChange}
                className="flex-1 h-1"
                aria-label="Color opacity"
              />
              <span className="text-xs font-medium text-slate-600 w-10">{opacity}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
