import { cleanInspectArtifacts } from './cleanInspectArtifacts'

export type CanvasEditorStyle = {
  color: string
  backgroundColor: string
  fontSize: string
  fontWeight: string
  textAlign: string
  borderRadius: string
  padding: string
  width: string
}

export type CanvasEditorSelection = {
  id: string
  tag: string
  text: string
  classes: string
  src?: string
  alt?: string
  rect: { x: number; y: number; width: number; height: number }
  style: CanvasEditorStyle
}

export type CanvasEditorPatch = {
  text?: string
  src?: string
  alt?: string
  style?: Partial<CanvasEditorStyle>
}

export type CanvasEditorBridge = {
  applyPatch: (id: string, patch: CanvasEditorPatch) => CanvasEditorSelection | null
  clearSelection: () => void
  destroy: () => void
  getSelected: () => CanvasEditorSelection | null
  serialize: () => string
}

const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH'])
const IMAGE_TAGS = new Set(['IMG'])
const STRUCTURAL_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'FORM'])
const SELECTABLE_TAGS = new Set([...TEXT_TAGS, ...IMAGE_TAGS, ...STRUCTURAL_TAGS])
const ID_ATTR = 'data-cu-editor-id'
const HOVER_CLASS = '__cu-editor-hover__'
const SELECTED_CLASS = '__cu-editor-selected__'
const STYLE_ID = '__cu-editor-style__'

type Options = { onSelect?: (selection: CanvasEditorSelection | null) => void; onChange?: (selection: CanvasEditorSelection) => void }

declare global { interface Window { __canvasEditorBridge?: CanvasEditorBridge } }

function ensureId(el: HTMLElement) {
  let id = el.getAttribute(ID_ATTR)
  if (!id) {
    id = el.ownerDocument.defaultView?.crypto.randomUUID() || crypto.randomUUID()
    el.setAttribute(ID_ATTR, id)
  }
  return id
}

function isElement(target: EventTarget | null): target is HTMLElement {
  return Boolean(target && (target as Node).nodeType === 1 && (target as HTMLElement).tagName)
}

function isSelectable(el: HTMLElement) {
  if (!SELECTABLE_TAGS.has(el.tagName)) return false
  if (IMAGE_TAGS.has(el.tagName)) return Boolean((el as HTMLImageElement).currentSrc || el.getAttribute('src'))
  if (STRUCTURAL_TAGS.has(el.tagName)) return el !== el.ownerDocument.body
  return Boolean(el.textContent?.trim())
}

function closestSelectable(target: EventTarget | null) {
  let el = isElement(target) ? target : null
  while (el && el !== el.ownerDocument.body) {
    if (isSelectable(el)) return el
    el = el.parentElement
  }
  return null
}

function normalizeColor(value: string) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return ''
  if (value.startsWith('#')) return value.toUpperCase()
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return match ? `#${[match[1], match[2], match[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase() : value
}

function data(el: HTMLElement): CanvasEditorSelection {
  const view = el.ownerDocument.defaultView
  const c = view?.getComputedStyle(el)
  const rect = el.getBoundingClientRect()
  const img = el.tagName === 'IMG' ? el as HTMLImageElement : null
  return {
    id: ensureId(el),
    tag: el.tagName,
    text: TEXT_TAGS.has(el.tagName) ? el.textContent?.trim() || '' : '',
    classes: el.className,
    src: img?.getAttribute('src') || undefined,
    alt: img?.getAttribute('alt') || undefined,
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    style: {
      color: normalizeColor(c?.color || ''),
      backgroundColor: normalizeColor(c?.backgroundColor || ''),
      fontSize: c?.fontSize || '',
      fontWeight: c?.fontWeight || '',
      textAlign: c?.textAlign || '',
      borderRadius: c?.borderRadius || '',
      padding: c?.padding || '',
      width: c?.width || '',
    },
  }
}

function clean(doc: Document) {
  doc.querySelectorAll(`[${ID_ATTR}]`).forEach(el => el.removeAttribute(ID_ATTR))
  doc.querySelectorAll(`.${HOVER_CLASS}, .${SELECTED_CLASS}`).forEach(el => el.classList.remove(HOVER_CLASS, SELECTED_CLASS))
  doc.getElementById(STYLE_ID)?.remove()
  cleanInspectArtifacts(doc)
}

export function installCanvasEditorBridge(doc: Document, options: Options = {}): CanvasEditorBridge {
  doc.defaultView?.__canvasEditorBridge?.destroy()

  let selected: HTMLElement | null = null
  let hovered: HTMLElement | null = null
  const listeners: Array<[EventTarget, string, EventListener]> = []

  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${HOVER_CLASS}{outline:2px dotted #2563eb!important;outline-offset:2px!important;cursor:crosshair!important}
    .${SELECTED_CLASS}{outline:2px solid #2563eb!important;outline-offset:3px!important}
  `
  doc.head.appendChild(style)

  const select = (el: HTMLElement | null) => {
    selected?.classList.remove(SELECTED_CLASS)
    selected = el
    if (!selected) { options.onSelect?.(null); return }
    selected.classList.add(SELECTED_CLASS)
    options.onSelect?.(data(selected))
  }

  const onOver = (e: Event) => {
    const next = closestSelectable(e.target)
    if (next === hovered) return
    hovered?.classList.remove(HOVER_CLASS)
    hovered = next
    hovered?.classList.add(HOVER_CLASS)
  }
  const onOut = () => { hovered?.classList.remove(HOVER_CLASS); hovered = null }
  const onClick = (e: Event) => {
    const el = closestSelectable(e.target)
    if (!el) return
    e.preventDefault(); e.stopPropagation()
    select(el)
  }
  const add = (target: EventTarget, type: string, fn: EventListener) => { target.addEventListener(type, fn, true); listeners.push([target, type, fn]) }
  add(doc, 'mouseover', onOver)
  add(doc, 'mouseout', onOut)
  add(doc, 'click', onClick)

  const Observer = doc.defaultView?.MutationObserver || MutationObserver
  const observer = new Observer(() => {
    if (selected && !selected.isConnected) select(null)
  })
  observer.observe(doc.body, { childList: true, subtree: true })

  const bridge: CanvasEditorBridge = {
    applyPatch(id, patch) {
      const el = doc.querySelector(`[${ID_ATTR}="${CSS.escape(id)}"]`) as HTMLElement | null
      if (!el) return null
      if (TEXT_TAGS.has(el.tagName) && patch.text !== undefined) el.textContent = patch.text
      if (el.tagName === 'IMG') {
        if (patch.src !== undefined) el.setAttribute('src', patch.src)
        if (patch.alt !== undefined) el.setAttribute('alt', patch.alt)
      }
      if (patch.style) Object.entries(patch.style).forEach(([key, value]) => {
        if (value !== undefined) el.style[key as any] = value
      })
      const next = data(el)
      options.onChange?.(next)
      return next
    },
    clearSelection() { select(null) },
    destroy() {
      listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn, true))
      observer.disconnect()
      hovered?.classList.remove(HOVER_CLASS)
      selected?.classList.remove(SELECTED_CLASS)
      style.remove()
      doc.defaultView && delete doc.defaultView.__canvasEditorBridge
    },
    getSelected() { return selected ? data(selected) : null },
    serialize() {
      const clone = doc.cloneNode(true) as Document
      clean(clone)
      return `<!DOCTYPE html>\n${clone.documentElement.outerHTML}`
    },
  }

  if (doc.defaultView) doc.defaultView.__canvasEditorBridge = bridge
  return bridge
}
