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
  assetPath?: string
  alt?: string
  rect: { x: number; y: number; width: number; height: number }
  style: CanvasEditorStyle
}

export type CanvasEditorPatch = {
  text?: string
  src?: string
  assetPath?: string
  alt?: string
  style?: Partial<CanvasEditorStyle>
}

export type ElementSnapshot = {
  id: string
  text?: string
  src: string | null
  assetPath: string | null
  alt: string | null
  style: string | null
}

export type CanvasEditorBridge = {
  applyPatch: (id: string, patch: CanvasEditorPatch) => CanvasEditorSelection | null
  revert: () => CanvasEditorSelection | null
  commit: () => void
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
  const rawAssetPath = img?.getAttribute('data-asset-path') || ''
  const rawSrc = img?.getAttribute('src') || ''
  const isRemote = /^(https?:)?\/\//i.test(rawSrc) || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:')
  const assetPath = rawAssetPath || (!isRemote && rawSrc ? rawSrc : '') || undefined
  const displaySrc = isRemote ? rawSrc : (img?.currentSrc || rawSrc || undefined)

  return {
    id: ensureId(el),
    tag: el.tagName,
    text: TEXT_TAGS.has(el.tagName) ? el.textContent?.trim() || '' : '',
    classes: el.className,
    src: displaySrc,
    assetPath,
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

function clean(root: Document | Element | null) {
  if (!root || typeof (root as any).querySelectorAll !== 'function') return
  root.querySelectorAll(`[${ID_ATTR}]`).forEach(el => el.removeAttribute(ID_ATTR))
  root.querySelectorAll(`.${HOVER_CLASS}, .${SELECTED_CLASS}`).forEach(el => el.classList.remove(HOVER_CLASS, SELECTED_CLASS))
  const styleEl = typeof (root as Document).getElementById === 'function'
    ? (root as Document).getElementById(STYLE_ID)
    : root.querySelector?.(`#${STYLE_ID}`)
  styleEl?.remove()
  cleanInspectArtifacts(root)

  // Remove preview injected scripts
  root.querySelectorAll('script[data-preview-nav="true"], script[data-workspace-env="true"]').forEach(el => el.remove())

  // Restore inlined CSS to <link rel="stylesheet">
  root.querySelectorAll('style[data-injected="true"]').forEach(el => {
    const source = el.getAttribute('data-source')
    if (source) {
      const doc = (root as any).ownerDocument || (root as Document)
      const link = doc.createElement('link')
      link.setAttribute('rel', 'stylesheet')
      link.setAttribute('href', source)
      el.replaceWith(link)
    } else {
      el.remove()
    }
  })

  root.querySelectorAll('[data-asset-path]').forEach(el => {
    const original = el.getAttribute('data-asset-path')
    if (original) el.setAttribute('src', original)
    el.removeAttribute('data-asset-path')
  })
}

export function installCanvasEditorBridge(doc: Document, options: Options = {}): CanvasEditorBridge {
  doc.defaultView?.__canvasEditorBridge?.destroy()

  let selected: HTMLElement | null = null
  let hovered: HTMLElement | null = null
  let initialSnapshot: ElementSnapshot | null = null
  let isDirty = false
  const listeners: Array<[EventTarget, string, EventListener]> = []

  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .${HOVER_CLASS}{outline:2px dotted #2563eb!important;outline-offset:2px!important;cursor:crosshair!important}
    .${SELECTED_CLASS}{outline:2px solid #2563eb!important;outline-offset:3px!important}
  `
  doc.head.appendChild(style)

  const takeSnapshot = (el: HTMLElement): ElementSnapshot => {
    const img = el.tagName === 'IMG' ? (el as HTMLImageElement) : null
    return {
      id: ensureId(el),
      text: TEXT_TAGS.has(el.tagName) ? el.textContent || '' : undefined,
      src: img ? img.getAttribute('src') : null,
      assetPath: img ? img.getAttribute('data-asset-path') : null,
      alt: img ? img.getAttribute('alt') : null,
      style: el.getAttribute('style'),
    }
  }

  const restoreSnapshot = (el: HTMLElement, snapshot: ElementSnapshot) => {
    if (TEXT_TAGS.has(el.tagName) && snapshot.text !== undefined) {
      el.textContent = snapshot.text
    }
    if (el.tagName === 'IMG') {
      if (snapshot.src !== null) {
        el.setAttribute('src', snapshot.src)
      } else {
        el.removeAttribute('src')
      }
      if (snapshot.assetPath !== null) {
        el.setAttribute('data-asset-path', snapshot.assetPath)
      } else {
        el.removeAttribute('data-asset-path')
      }
      if (snapshot.alt !== null) {
        el.setAttribute('alt', snapshot.alt)
      } else {
        el.removeAttribute('alt')
      }
    }
    if (snapshot.style !== null) {
      el.setAttribute('style', snapshot.style)
    } else {
      el.removeAttribute('style')
    }
  }

  const select = (el: HTMLElement | null) => {
    // If there were uncommitted changes on previously selected element, restore them
    if (selected && isDirty && initialSnapshot && selected !== el) {
      restoreSnapshot(selected, initialSnapshot)
      isDirty = false
      initialSnapshot = null
    }

    selected?.classList.remove(SELECTED_CLASS)
    selected = el
    if (!selected) {
      initialSnapshot = null
      isDirty = false
      options.onSelect?.(null)
      return
    }
    selected.classList.add(SELECTED_CLASS)
    initialSnapshot = takeSnapshot(selected)
    isDirty = false
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
        if (patch.assetPath !== undefined) {
          if (patch.assetPath) {
            el.setAttribute('data-asset-path', patch.assetPath)
          } else {
            el.removeAttribute('data-asset-path')
          }
        }
        if (patch.src !== undefined) {
          el.setAttribute('src', patch.src)
          if (patch.assetPath === undefined && (/^(https?:)?\/\//i.test(patch.src) || patch.src.startsWith('data:'))) {
            el.removeAttribute('data-asset-path')
          }
        }
        if (patch.alt !== undefined) el.setAttribute('alt', patch.alt)
      }
      if (patch.style) Object.entries(patch.style).forEach(([key, value]) => {
        if (value !== undefined) el.style[key as any] = value
      })
      isDirty = true
      const next = data(el)
      options.onChange?.(next)
      return next
    },
    revert() {
      if (selected && initialSnapshot) {
        restoreSnapshot(selected, initialSnapshot)
        isDirty = false
        const current = selected
        initialSnapshot = null
        const next = data(current)
        options.onChange?.(next)
        return next
      }
      return null
    },
    commit() {
      isDirty = false
      initialSnapshot = selected ? takeSnapshot(selected) : null
    },
    clearSelection() { select(null) },
    destroy() {
      if (selected && isDirty && initialSnapshot) {
        restoreSnapshot(selected, initialSnapshot)
      }
      listeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn, true))
      observer.disconnect()
      hovered?.classList.remove(HOVER_CLASS)
      selected?.classList.remove(SELECTED_CLASS)
      style.remove()
      doc.defaultView && delete doc.defaultView.__canvasEditorBridge
    },
    getSelected() { return selected ? data(selected) : null },
    serialize() {
      const root = doc?.documentElement
      if (!root) return ''
      const clone = root.cloneNode(true) as HTMLElement
      clean(clone)
      return `<!DOCTYPE html>\n${clone.outerHTML}`
    },
  }

  if (doc.defaultView) doc.defaultView.__canvasEditorBridge = bridge
  return bridge
}
