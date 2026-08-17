import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Hand, Maximize2, Minus, MousePointer2, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type CanvasPage = { path: string; html: string }
type FrameBox = { x: number; y: number; w: number; h: number }
type Rect = { x: number; y: number; w: number; h: number }
type Action = 'drag' | 'resize' | 'marquee' | 'group-drag' | null
type Tool = 'pan' | 'select'
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

type Props = {
  pages: CanvasPage[]
  currentPage?: string
  viewportMode: 'desktop' | 'tablet' | 'mobile'
  isInspectMode: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
  setIframeRef: (iframe: HTMLIFrameElement) => void
  onSelectPage?: (path: string) => void
  active?: boolean
}

const WIDTH = { desktop: 1200, tablet: 834, mobile: 430 } as const
const HEIGHT = { desktop: 720, tablet: 720, mobile: 720 } as const
const GAP = 64
const PAD = 48
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
const bounds = (boxes: FrameBox[]): Rect => ({ x: Math.min(...boxes.map(b => b.x)), y: Math.min(...boxes.map(b => b.y)), w: Math.max(...boxes.map(b => b.x + b.w)) - Math.min(...boxes.map(b => b.x)), h: Math.max(...boxes.map(b => b.y + b.h)) - Math.min(...boxes.map(b => b.y)) })

export function CanvasBoard({ pages, currentPage: _currentPage, viewportMode, isInspectMode, iframeRef, setIframeRef, onSelectPage, active = true }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const iframeEls = useRef<Record<string, HTMLIFrameElement | null>>({})
  const actionRef = useRef<Action>(null)
  const panRef = useRef({ x: 0, y: 0, left: 0, top: 0, down: false })
  const [pan, setPan] = useState({ x: 48, y: 48 })
  const [zoom, setZoom] = useState(0.72)
  const [boxes, setBoxes] = useState<Record<string, FrameBox>>({})
  const [z, setZ] = useState<Record<string, number>>({})
  const zTop = useRef(1)
  const [selected, setSelected] = useState<string[]>([])
  const [activeFrame, setActiveFrame] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [tool, setTool] = useState<Tool>('pan')
  const width = WIDTH[viewportMode]
  const height = HEIGHT[viewportMode]
  const urls = useMemo(() => pages.map((page, i) => ({ ...page, url: URL.createObjectURL(new Blob([page.html], { type: 'text/html' })), x: i * (width + GAP), y: 0, w: width, h: height })), [pages, width, height])
  useEffect(() => () => urls.forEach(page => URL.revokeObjectURL(page.url)), [urls])
  useEffect(() => { setBoxes({}); setZ({}); zTop.current = 1; setSelected([]); setActiveFrame(null) }, [viewportMode])
  useEffect(() => {
    setSelected(prev => prev.filter(path => urls.some(u => u.path === path)))
    setActiveFrame(prev => prev && urls.some(u => u.path === prev) ? prev : null)
  }, [urls] )

  const box = (path: string, fallback: FrameBox) => boxes[path] || fallback
  const frameByPath = new Map(urls.map(u => [u.path, box(u.path, u)]))
  const topPath = urls.reduce((top, u) => (z[u.path] || 1) >= (z[top.path] || 1) ? u : top, urls[0]).path
  const extents = urls.map(u => box(u.path, u))
  const totalW = Math.max(...extents.map(b => b.x + b.w), width) + PAD * 2
  const totalH = Math.max(...extents.map(b => b.y + b.h), height) + PAD * 2 + 28
  const group = selected.length > 1 ? bounds(selected.map(path => frameByPath.get(path)).filter(Boolean) as FrameBox[]) : null
  const toCanvas = (clientX: number, clientY: number) => {
    const r = boardRef.current!.getBoundingClientRect()
    return { x: (clientX - r.left - pan.x) / zoom - PAD, y: (clientY - r.top - pan.y) / zoom - PAD }
  }

  const bringFront = (path: string) => setZ(prev => ({ ...prev, [path]: ++zTop.current }))
  const setActiveIframe = (path: string) => {
    setActiveFrame(path)
    const iframe = iframeEls.current[path]
    if (!iframe) return
    iframeRef.current = iframe
    iframe.focus()
    setIframeRef(iframe)
    window.dispatchEvent(new Event('canvas-iframe-focus'))
  }
  const activateFrame = (path: string) => {
    bringFront(path)
    setSelected([path])
    setActiveIframe(path)
  }

  const fit = useCallback(() => {
    const el = boardRef.current
    if (!el) return
    const next = clamp(Math.min((el.clientWidth - 96) / totalW, (el.clientHeight - 96) / totalH, 1), 0.15, 1)
    setZoom(next)
    setPan({ x: (el.clientWidth - totalW * next) / 2, y: (el.clientHeight - totalH * next) / 2 })
  }, [totalW, totalH])
  useEffect(() => { if (active) requestAnimationFrame(fit) }, [active, viewportMode, urls.length])

  const moveFrames = (paths: string[], start: Record<string, FrameBox>, sx: number, sy: number) => (ev: PointerEvent) => {
    const dx = (ev.clientX - sx) / zoom
    const dy = (ev.clientY - sy) / zoom
    setBoxes(prev => ({ ...prev, ...Object.fromEntries(paths.map(path => [path, { ...start[path], x: start[path].x + dx, y: start[path].y + dy }])) }))
  }

  const endAction = (move: (ev: PointerEvent) => void, up: () => void) => {
    actionRef.current = null
    setAction(null)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }

  if (!urls.length) return null

  return (
    <div
      ref={boardRef}
      className={cn('relative h-full w-full overflow-hidden bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.28)_1px,transparent_1px)] [background-size:20px_20px] bg-muted/20', tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair')}
      onWheel={(e) => {
        if ((e.target as HTMLElement).closest('iframe')) return
        e.preventDefault()
        if (actionRef.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        const factor = e.ctrlKey || e.metaKey ? 1 - e.deltaY * 0.004 : 1 - e.deltaY * 0.0015
        const next = clamp(zoom * factor, 0.15, 2)
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        setPan({ x: cx - ((cx - pan.x) / zoom) * next, y: cy - ((cy - pan.y) / zoom) * next })
        setZoom(next)
      }}
      onPointerDown={(e) => {
        if (actionRef.current || (e.target as HTMLElement).closest('button,iframe,[data-group]')) return
        if (tool === 'select') {
          e.preventDefault()
          setSelected([])
          setActiveFrame(null)
          setMarquee(null)
          actionRef.current = 'marquee'; setAction('marquee')
          const start = toCanvas(e.clientX, e.clientY)
          let current: Rect | null = null
          const move = (ev: PointerEvent) => {
            const p = toCanvas(ev.clientX, ev.clientY)
            current = { x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) }
            setMarquee(current)
          }
          const up = () => {
            const picked = current ? urls.filter(u => intersects(box(u.path, u), current!)).map(u => u.path) : []
            setSelected(picked)
            if (picked[0]) setActiveIframe(picked[0])
            else setActiveFrame(null)
            setMarquee(null)
            endAction(move, up)
          }
          window.addEventListener('pointermove', move)
          window.addEventListener('pointerup', up)
          return
        }
        setSelected([])
        setActiveFrame(null)
        setMarquee(null)
        panRef.current = { x: e.clientX, y: e.clientY, left: pan.x, top: pan.y, down: true }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!panRef.current.down) return
        setPan({ x: panRef.current.left + e.clientX - panRef.current.x, y: panRef.current.top + e.clientY - panRef.current.y })
      }}
      onPointerUp={() => { panRef.current.down = false }}
    >
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
        <button className={cn('grid h-8 w-8 place-items-center rounded-md hover:bg-accent', tool === 'pan' && 'bg-accent text-accent-foreground')} onClick={() => setTool('pan')} title="Pan"><Hand className="h-4 w-4" /></button>
        <button className={cn('grid h-8 w-8 place-items-center rounded-md hover:bg-accent', tool === 'select' && 'bg-accent text-accent-foreground')} onClick={() => setTool('select')} title="Select"><MousePointer2 className="h-4 w-4" /></button>
        <div className="mx-1 h-5 w-px bg-border" />
        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" onClick={() => setZoom(z => clamp(z - 0.1, 0.15, 2))} title="Zoom out"><Minus className="h-4 w-4" /></button>
        <button className="h-8 min-w-14 rounded-md px-2 text-xs font-medium hover:bg-accent" onClick={() => setZoom(1)} title="100%">{Math.round(zoom * 100)}%</button>
        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" onClick={() => setZoom(z => clamp(z + 0.1, 0.15, 2))} title="Zoom in"><Plus className="h-4 w-4" /></button>
        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" onClick={fit} title="Fit"><Maximize2 className="h-4 w-4" /></button>
        <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent" onClick={() => { setBoxes({}); setSelected([]); setActiveFrame(null); setMarquee(null); setZoom(0.72); setPan({ x: 48, y: 48 }) }} title="Reset layout"><RotateCcw className="h-4 w-4" /></button>
      </div>

      <div className="absolute left-0 top-0" style={{ padding: PAD, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        {marquee && <div className="pointer-events-none absolute border border-primary bg-primary/10" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
        {group && (
          <div
            data-group
            className="pointer-events-none absolute z-20 bg-transparent"
            style={{ left: group.x - 6, top: group.y - 6, width: group.w + 12, height: group.h + 12 }}
            onPointerDown={(e) => {
              e.preventDefault(); e.stopPropagation()
              actionRef.current = 'group-drag'; setAction('group-drag')
              const start = Object.fromEntries(selected.map(path => [path, frameByPath.get(path)!]))
              const move = moveFrames(selected, start, e.clientX, e.clientY)
              const up = () => endAction(move, up)
              window.addEventListener('pointermove', move)
              window.addEventListener('pointerup', up)
            }}
          />
        )}
        {urls.map((u) => {
          const b = box(u.path, u)
          const isSelected = selected.includes(u.path)
          const isActive = activeFrame === u.path
          const bind = (iframe: HTMLIFrameElement) => { iframeEls.current[u.path] = iframe }
          const drag = (e: React.PointerEvent) => {
            if ((e.target as HTMLElement).closest('[data-resize]')) return
            e.preventDefault(); e.stopPropagation()
            const paths = selected.length > 1 && isSelected ? selected : [u.path]
            setSelected(paths)
            paths.forEach(bringFront)
            setActiveIframe(u.path)
            actionRef.current = 'drag'; setAction('drag')
            const start = Object.fromEntries(paths.map(path => [path, frameByPath.get(path)!]))
            const move = moveFrames(paths, start, e.clientX, e.clientY)
            const up = () => endAction(move, up)
            window.addEventListener('pointermove', move)
            window.addEventListener('pointerup', up)
          }
          const resize = (dir: ResizeDir) => (e: React.PointerEvent) => {
            e.preventDefault(); e.stopPropagation()
            const paths = selected.length > 1 && isSelected ? selected : [u.path]
            setSelected(paths)
            paths.forEach(bringFront)
            setActiveIframe(u.path)
            actionRef.current = 'resize'; setAction('resize')
            const start = { x: e.clientX, y: e.clientY, boxes: Object.fromEntries(paths.map(path => [path, frameByPath.get(path)!])) }
            const resizeBox = (box: FrameBox, dx: number, dy: number) => {
              const next = { ...box }
              if (dir.includes('e')) next.w = clamp(box.w + dx, 320, 1800)
              if (dir.includes('s')) next.h = clamp(box.h + dy, 320, 1600)
              if (dir.includes('w')) { const w = clamp(box.w - dx, 320, 1800); next.x = box.x + box.w - w; next.w = w }
              if (dir.includes('n')) { const h = clamp(box.h - dy, 320, 1600); next.y = box.y + box.h - h; next.h = h }
              return next
            }
            const move = (ev: PointerEvent) => {
              const dx = (ev.clientX - start.x) / zoom
              const dy = (ev.clientY - start.y) / zoom
              setBoxes(prev => ({ ...prev, ...Object.fromEntries(paths.map(path => [path, resizeBox(start.boxes[path], dx, dy)])) }))
            }
            const up = () => endAction(move, up)
            window.addEventListener('pointermove', move)
            window.addEventListener('pointerup', up)
          }
          const handle = (dir: ResizeDir, cls: string) => {
            const isCorner = dir.length > 1
            const visibilityClass = isCorner
              ? isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-70 focus:opacity-100'
              : 'opacity-0 hover:opacity-100'
            return (
              <button
                data-resize
                onPointerDown={resize(dir)}
                className={cn(
                  'absolute z-20 transition-all duration-200',
                  visibilityClass,
                  cls
                )}
                title={`Resize ${dir}`}
                aria-label={`Resize ${dir}`}
              />
            )
          }
          const side = 'bg-transparent transition-colors duration-150'
          const corner = 'h-3 w-3 rounded-full border-2 border-primary bg-background shadow-md hover:scale-125 hover:bg-primary hover:border-white transition-all duration-200'
          return (
            <section key={u.path} className="absolute" style={{ left: b.x, top: b.y, width: b.w, zIndex: z[u.path] || 1 }} onPointerDownCapture={() => { bringFront(u.path); setActiveIframe(u.path) }}>
              <button onPointerDown={drag} onClick={() => onSelectPage?.(`/${u.path}`)} className="mb-3 block max-w-full origin-bottom-left cursor-move truncate rounded-md bg-background/80 px-2 py-1 text-left text-xs font-medium text-foreground shadow-sm hover:bg-accent" style={{ transform: `scale(${1 / zoom})` }}>{u.path}</button>
              <div className={cn('group relative overflow-visible bg-transparent', (tool === 'select' || isSelected) && 'cursor-move', isInspectMode && 'cursor-crosshair')} style={{ width: b.w, height: b.h }} onPointerDown={drag} onMouseEnter={() => onSelectPage?.(`/${u.path}`)}>
                {(isSelected || isActive) && <div className="pointer-events-none absolute -inset-[2px] z-30 rounded-md border-2 border-primary/80" />}
                <div className="h-full w-full overflow-hidden border bg-background shadow-xl">
                  <iframe
                    title={`Canvas ${u.path}`}
                    src={u.url}
                    sandbox="allow-same-origin allow-scripts allow-forms"
                    className={cn('block h-full w-full border-0 bg-background', (action || tool === 'select' || activeFrame !== u.path) && 'pointer-events-none', isInspectMode && activeFrame === u.path && 'cursor-crosshair')}
                    onPointerDown={() => activateFrame(u.path)}
                    onMouseEnter={(e) => bind(e.currentTarget)}
                    onFocus={(e) => { bind(e.currentTarget); activateFrame(u.path) }}
                    onLoad={(e) => bind(e.currentTarget)}
                  />
                  {activeFrame !== u.path && !action && tool !== 'select' && <button className="absolute inset-0 z-10 cursor-pointer bg-transparent" onClick={(e) => { e.stopPropagation(); activateFrame(u.path) }} aria-label={`Activate ${u.path}`} />}
                </div>
                {handle('n', `left-3 right-3 -top-1 h-2 cursor-ns-resize hover:bg-primary/30 ${side}`)}
                {handle('s', `left-3 right-3 -bottom-1 h-2 cursor-ns-resize hover:bg-primary/30 ${side}`)}
                {handle('e', `-right-1 bottom-3 top-3 w-2 cursor-ew-resize hover:bg-primary/30 ${side}`)}
                {handle('w', `-left-1 bottom-3 top-3 w-2 cursor-ew-resize hover:bg-primary/30 ${side}`)}
                {handle('nw', `-left-1.5 -top-1.5 cursor-nwse-resize ${corner}`)}
                {handle('ne', `-right-1.5 -top-1.5 cursor-nesw-resize ${corner}`)}
                {handle('sw', `-bottom-1.5 -left-1.5 cursor-nesw-resize ${corner}`)}
                {handle('se', `-bottom-1.5 -right-1.5 cursor-nwse-resize ${corner}`)}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
