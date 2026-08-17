/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { X, Image as ImageIcon, Upload, Search } from 'lucide-react'

interface AssetsPanelProps {
  isOpen: boolean
  onClose: () => void
  previewHtml?: string
  onAssetChange?: (changes: AssetChanges) => void
  position?: { x: number; y: number }
}

interface AssetChanges {
  action: 'replace' | 'remove' | 'add'
  assetId: string
  newUrl?: string
}

interface DetectedAsset {
  id: string
  url: string
  type: 'image' | 'background' | 'icon'
  tag: string
  instance: number
  alt?: string
  width?: string
  height?: string
}

export function AssetsPanel({ isOpen, onClose, previewHtml, onAssetChange, position }: AssetsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [detectedAssets, setDetectedAssets] = useState<DetectedAsset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<DetectedAsset | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 150) // Match animation duration
  }

  // Detect assets from preview HTML whenever panel opens
  useEffect(() => {
    if (previewHtml && isOpen) {
      detectAssetsFromHTML(previewHtml)
    }
  }, [previewHtml, isOpen])

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

  const detectAssetsFromHTML = (html: string) => {
    const assets: DetectedAsset[] = []
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Find all img tags
    const images = doc.querySelectorAll('img')
    images.forEach((img, index) => {
      const src = img.getAttribute('src')
      if (src) {
        assets.push({
          id: `img-${index}`,
          url: src,
          type: 'image',
          tag: 'Image Tag',
          instance: index + 1,
          alt: img.getAttribute('alt') || undefined,
          width: img.getAttribute('width') || undefined,
          height: img.getAttribute('height') || undefined,
        })
      }
    })

    // Find elements with background images
    const allElements = doc.querySelectorAll('*')
    let bgIndex = 0
    allElements.forEach((el) => {
      const element = el as HTMLElement
      const style = element.getAttribute('style')
      if (style) {
        const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/)
        if (bgMatch) {
          assets.push({
            id: `bg-${bgIndex}`,
            url: bgMatch[1],
            type: 'background',
            tag: 'Background',
            instance: bgIndex + 1,
          })
          bgIndex++
        }
      }
    })

    setDetectedAssets(assets)
  }

  const handleRemoveAsset = (assetId: string) => {
    if (onAssetChange) {
      onAssetChange({
        action: 'remove',
        assetId,
      })
    }
    setDetectedAssets(prev => prev.filter(a => a.id !== assetId))
  }

  const handleReplaceAsset = (assetId: string) => {
    // This would trigger an AI prompt or file upload dialog
      }

  const filteredAssets = detectedAssets.filter(asset => {
    if (!searchQuery) return true
    return asset.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset.tag.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (!isOpen) return null

  // Calculate position
  const panelWidth = 400
  const panelMaxHeight = window.innerHeight * 0.6
  const padding = 10

  let x = position?.x ?? window.innerWidth / 2 - panelWidth / 2
  let y = position?.y ?? 100

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
        maxHeight: '60vh',
        zIndex: 999,
        willChange: 'opacity, transform',
        animationFillMode: 'forwards'
      }}
      className={`bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col transition-all duration-150 ${
        isClosing
          ? 'animate-out fade-out slide-out-to-top-2'
          : 'animate-in fade-in slide-in-from-top-2'
      }`}
    >
      {/* Header */}
      <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-200 shadow-sm flex items-center justify-between flex-shrink-0">
        <div className="text-xs font-semibold text-slate-700">
          SELECTION ASSETS
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 transition-colors"
          aria-label="Close assets panel"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2.5 border-b border-slate-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Assets Count */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex-shrink-0">
        <p className="text-xs text-slate-600">
          Found {filteredAssets.length} {filteredAssets.length === 1 ? 'image' : 'images'} in your design
        </p>
      </div>

      {/* Scrollable Assets List */}
      <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
        <div className="px-3 py-2 space-y-2">
          {filteredAssets.length === 0 ? (
            <div className="py-8 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No images found</p>
              <p className="text-xs text-slate-400 mt-1">Add images to your design to see them here</p>
            </div>
          ) : (
            filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`p-2.5 rounded-lg border transition-colors ${
                  selectedAsset?.id === asset.id
                    ? 'bg-primary border-primary'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded border border-slate-300 flex-shrink-0 overflow-hidden bg-slate-100">
                    {asset.url.startsWith('data:') ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    ) : (
                      <img
                        src={asset.url}
                        alt={asset.alt || 'Asset'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                        }}
                      />
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate mb-0.5">
                      {asset.url.length > 40 ? asset.url.slice(0, 40) + '...' : asset.url}
                    </div>
                    <div className="text-[10px] text-slate-600 mb-1.5">
                      {asset.tag} • Instance #{asset.instance}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReplaceAsset(asset.id)
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Image
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAsset(asset.id)
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive transition-colors"
                        aria-label="Remove asset"
                      >
                        <X className="w-3.5 h-3.5 text-slate-500 hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <button
          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5"
          aria-label="Upload new asset"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload New
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded transition-colors shadow-sm"
        >
          Done
        </button>
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
