import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Box, ChevronDown, Image as ImageIcon, Info, Link2, Loader2, MousePointerClick, RotateCcw, Save, Type, Upload, X } from 'lucide-react'
import type { CanvasEditorPatch, CanvasEditorSelection } from '@/utils/canvasEditorBridge'
import { cn } from '@/lib/utils'
import { uploadProductImage } from '@/api/assets'
import { updateProjectFile } from '@/api/files'
import { findAssetUrl } from '@/utils/virtualAssetResolver'

type Props = {
  selected: CanvasEditorSelection
  iframeRect: DOMRect | null
  dirty: boolean
  onClose: () => void
  onCancel?: () => void
  onPatch: (patch: CanvasEditorPatch) => void
  onSave: (newFiles?: any[]) => void
  onAskAI: (selection: CanvasEditorSelection) => void
  getToken?: () => Promise<string | null>
  userId?: string
  projectId?: string
  onRefresh?: () => void
  files?: any[]
}

const textTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH'])

function CollapsibleSection({
  title,
  icon: Icon,
  defaultExpanded = true,
  children
}: {
  title: string
  icon: React.ElementType
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-1.5 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{title}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", expanded ? "rotate-180" : "rotate-0")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-in-out", expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="pt-1.5 pb-2 space-y-2">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

const getTagInfo = (tag: string) => {
  const t = tag.toUpperCase()
  if (t === 'IMG') return { icon: ImageIcon, label: 'Image' }
  if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(t)) return { icon: Type, label: 'Heading' }
  if (t === 'P' || t === 'SPAN') return { icon: Type, label: 'Text' }
  if (t === 'A') return { icon: Link2, label: 'Link' }
  if (t === 'BUTTON') return { icon: MousePointerClick, label: 'Button' }
  return { icon: Box, label: 'Element' }
}

export function CanvasEditPopup({ selected, iframeRect, dirty, onClose, onCancel, onPatch, onSave, onAskAI, getToken, userId, projectId, onRefresh, files }: Props) {
  const [text, setText] = useState(selected.text)
  const [assetPath, setAssetPath] = useState(selected.assetPath || selected.src || '')
  const [previewSrc, setPreviewSrc] = useState(selected.src || selected.assetPath || '')
  const [alt, setAlt] = useState(selected.alt || '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingAssetsRef = useRef<Map<string, string>>(new Map())
  const isClosingRef = useRef(false)
  const isText = textTags.has(selected.tag)
  const isImage = selected.tag === 'IMG'

  // Clean up internal editor classes from display
  const classes = selected.classes.split(' ').filter(c => Boolean(c) && !c.startsWith('__cu-editor'))

  const { icon: TagIcon, label: tagLabel } = getTagInfo(selected.tag)

  useEffect(() => {
    isClosingRef.current = false
    setText(selected.text)
    setAssetPath(selected.assetPath || selected.src || '')
    setPreviewSrc(selected.src || selected.assetPath || '')
    setAlt(selected.alt || '')
    setUploadError(null)
    pendingAssetsRef.current.clear()
  }, [selected.id])

  const resolvedPreview = useMemo(() => {
    if (!previewSrc) return ''
    if (/^(https?:)?\/\//i.test(previewSrc) || previewSrc.startsWith('data:') || previewSrc.startsWith('blob:')) {
      return previewSrc
    }
    if (files && files.length > 0) {
      const found = findAssetUrl(previewSrc, '', files as any)
      if (found?.url) return found.url
    }
    return previewSrc
  }, [previewSrc, files])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant local preview for immediate visual feedback
    const objectUrl = URL.createObjectURL(file)
    setPreviewSrc(objectUrl)
    setIsUploading(true)
    setUploadError(null)

    try {
      const token = getToken ? await getToken() : null
      if (!token) throw new Error('Sesi tidak valid atau belum masuk. Silakan login kembali.')
      const uploadedUrl = await uploadProductImage(userId || '', file, token)
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'image.png'
      const virtualPath = `assets/${safeName}`

      // Queue the asset to be saved when user presses Save
      pendingAssetsRef.current.set(virtualPath, uploadedUrl)

      setAssetPath(virtualPath)
      setPreviewSrc(uploadedUrl)
      onPatch({ src: uploadedUrl, assetPath: virtualPath })
    } catch (err: any) {
      setPreviewSrc(selected.src || selected.assetPath || '')
      setUploadError(err?.message || 'Gagal mengunggah gambar.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      try { URL.revokeObjectURL(objectUrl) } catch {}
    }
  }

  const handleSave = () => {
    isClosingRef.current = true
    const pendingList: Array<{ file_path: string; content: string; file_type?: string }> = []
    for (const [vPath, uUrl] of pendingAssetsRef.current.entries()) {
      pendingList.push({ file_path: vPath, content: uUrl, file_type: 'image' })
    }
    pendingAssetsRef.current.clear()
    onSave(pendingList)
  }

  const handleCancel = () => {
    isClosingRef.current = true
    pendingAssetsRef.current.clear()
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (dirty) handleCancel()
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dirty, onClose])

  const pos = useMemo(() => {
    const w = 300
    const h = isImage ? 380 : 300
    const leftBase = (iframeRect?.left || 0) + selected.rect.x + selected.rect.width + 12
    const topBase = (iframeRect?.top || 0) + selected.rect.y
    return {
      left: Math.max(10, Math.min(leftBase, window.innerWidth - w - 10)),
      top: Math.max(10, Math.min(topBase, window.innerHeight - h - 10)),
      width: w,
    }
  }, [iframeRect, selected.rect, isImage])

  return (
    <div style={{ position: 'fixed', left: pos.left, top: pos.top, width: pos.width, zIndex: 1000 }} className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg animate-in fade-in zoom-in-95 duration-150">
      <header className="flex items-center justify-between border-b bg-muted/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background shadow-sm">
            <TagIcon className="h-4 w-4 text-foreground/80" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold leading-none text-foreground">{tagLabel}</span>
              {dirty && <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground dark:bg-secondary/30 dark:text-secondary">Unsaved</span>}
            </div>
            <p className="truncate font-mono text-[10px] leading-none text-muted-foreground">
              <span className="font-medium text-foreground/70">{selected.tag.toLowerCase()}</span>
              {classes.length > 0 && <span className="text-muted-foreground/70">.{classes.join('.')}</span>}
            </p>
          </div>
        </div>
        <button onClick={dirty ? handleCancel : onClose} className="ml-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label="Close editor">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="max-h-[55vh] overflow-y-auto px-3 py-2 space-y-1">
        {isText && (
          <CollapsibleSection title="Content" icon={Type} defaultExpanded={true}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={() => {
                if (!isClosingRef.current) onPatch({ text })
              }}
              className="flex min-h-[80px] w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CollapsibleSection>
        )}

        {isImage && (
          <CollapsibleSection title="Image" icon={ImageIcon} defaultExpanded={true}>
            {resolvedPreview && (
              <div className="overflow-hidden rounded-md border">
                <img src={resolvedPreview} alt="" className="h-28 w-full object-cover" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  <span>Unggah Gambar</span>
                </>
              )}
            </button>
            {uploadError && (
              <p className="text-[11px] text-destructive leading-tight px-0.5">{uploadError}</p>
            )}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Lokasi / Path Asset</label>
              <input
                value={assetPath}
                onChange={e => setAssetPath(e.target.value)}
                onBlur={() => {
                  if (isClosingRef.current) return
                  const val = assetPath.trim()
                  const isRemote = /^(https?:)?\/\//i.test(val) || val.startsWith('data:') || val.startsWith('blob:')
                  if (isRemote) {
                    setPreviewSrc(val)
                    onPatch({ src: val, assetPath: '' })
                  } else {
                    onPatch({ src: val, assetPath: val })
                  }
                }}
                placeholder="assets/gambar.png"
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Teks Alternatif (Alt)</label>
              <input
                value={alt}
                onChange={e => setAlt(e.target.value)}
                onBlur={() => {
                  if (!isClosingRef.current) onPatch({ alt })
                }}
                placeholder="Deskripsi gambar..."
                className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Info" icon={Info} defaultExpanded={false}>
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Class:</span>
              <span className="break-all">{classes.join(' ') || '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Size:</span>
              <span>{Math.round(selected.rect.width)} × {Math.round(selected.rect.height)}</span>
            </div>
            {isText && (
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-foreground">Text:</span>
                <span className="line-clamp-3">{selected.text || '-'}</span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>

      <footer className="flex items-center gap-2 border-t p-3 bg-muted/20">
        <button
          type="button"
          onClick={() => onAskAI(selected)}
          className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-xs font-medium shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        >
          <Bot className="mr-1.5 h-4 w-4" />
          Ask AI
        </button>
        {dirty && (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border bg-background px-3 py-2 text-xs font-medium shadow-sm outline-none transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive/20"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save
        </button>
      </footer>
    </div>
  )
}
