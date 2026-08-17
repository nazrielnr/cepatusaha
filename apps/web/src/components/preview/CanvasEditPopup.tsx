import { useEffect, useMemo, useState } from 'react'
import { Bot, Box, ChevronDown, Image as ImageIcon, Info, Link2, MousePointerClick, Save, Type, X } from 'lucide-react'
import type { CanvasEditorPatch, CanvasEditorSelection } from '@/utils/canvasEditorBridge'
import { cn } from '@/lib/utils'

type Props = {
  selected: CanvasEditorSelection
  iframeRect: DOMRect | null
  dirty: boolean
  onClose: () => void
  onPatch: (patch: CanvasEditorPatch) => void
  onSave: () => void
  onAskAI: (selection: CanvasEditorSelection) => void
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

export function CanvasEditPopup({ selected, iframeRect, dirty, onClose, onPatch, onSave, onAskAI }: Props) {
  const [text, setText] = useState(selected.text)
  const [src, setSrc] = useState(selected.src || '')
  const [alt, setAlt] = useState(selected.alt || '')
  const isText = textTags.has(selected.tag)
  const isImage = selected.tag === 'IMG'

  // Clean up internal editor classes from display
  const classes = selected.classes.split(' ').filter(c => Boolean(c) && !c.startsWith('__cu-editor'))

  const { icon: TagIcon, label: tagLabel } = getTagInfo(selected.tag)

  useEffect(() => {
    setText(selected.text)
    setSrc(selected.src || '')
    setAlt(selected.alt || '')
  }, [selected.id, selected.text, selected.src, selected.alt])

  const pos = useMemo(() => {
    const w = 300
    const h = isImage ? 340 : 300
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
        <button onClick={onClose} className="ml-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" aria-label="Close editor">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="max-h-[55vh] overflow-y-auto px-3 py-2 space-y-1">
        {isText && (
          <CollapsibleSection title="Content" icon={Type} defaultExpanded={true}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onBlur={() => onPatch({ text })}
              className="flex min-h-[80px] w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </CollapsibleSection>
        )}

        {isImage && (
          <CollapsibleSection title="Image" icon={ImageIcon} defaultExpanded={true}>
            {src && (
              <div className="overflow-hidden rounded-md border">
                <img src={src} alt="" className="h-28 w-full object-cover" />
              </div>
            )}
            <input
              value={src}
              onChange={e => setSrc(e.target.value)}
              onBlur={() => onPatch({ src })}
              placeholder="Image URL"
              className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <input
              value={alt}
              onChange={e => setAlt(e.target.value)}
              onBlur={() => onPatch({ alt })}
              placeholder="Alt text"
              className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
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
        <button onClick={() => onAskAI(selected)} className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20">
          <Bot className="mr-2 h-4 w-4" />
          Ask AI
        </button>
        <button onClick={onSave} disabled={!dirty} className="inline-flex h-9 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
          <Save className="mr-2 h-4 w-4" />
          Save
        </button>
      </footer>
    </div>
  )
}
