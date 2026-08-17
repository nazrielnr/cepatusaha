import { firstFont, rgbToHex } from './canvasEditorDom'

export type CanvasDraft = {
  text: string
  src: string
  alt: string
  fontFamily: string
  fontSize: string
  fontWeight: string
  color: string
  backgroundColor: string
  textAlign: string
  borderRadius: string
  padding: string
  width: string
}

export const textTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH'])
export const boxTags = new Set(['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'FORM'])

const emptyDraft: CanvasDraft = {
  text: '', src: '', alt: '', fontFamily: '', fontSize: '', fontWeight: '400', color: '', backgroundColor: '', textAlign: 'left', borderRadius: '', padding: '', width: '',
}

function computed(el: HTMLElement): CSSStyleDeclaration | null {
  try { return el.ownerDocument?.defaultView?.getComputedStyle?.(el) ?? null }
  catch { return null }
}

function color(value: string | undefined | null) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return ''
  return rgbToHex(value)
}

export function readElementDraft(el: HTMLElement | null, fallbackText = ''): CanvasDraft {
  if (!el) return { ...emptyDraft, text: fallbackText }
  const c = computed(el)
  const inline = el.style
  const img = el instanceof HTMLImageElement ? el : null
  return {
    text: el.textContent?.trim() || fallbackText,
    src: img?.getAttribute('src') || '',
    alt: img?.getAttribute('alt') || '',
    fontFamily: firstFont(c?.fontFamily || inline.fontFamily || ''),
    fontSize: c?.fontSize || inline.fontSize || '',
    fontWeight: c?.fontWeight || inline.fontWeight || '400',
    color: color(c?.color || inline.color),
    backgroundColor: color(c?.backgroundColor || inline.backgroundColor),
    textAlign: c?.textAlign || inline.textAlign || 'left',
    borderRadius: c?.borderRadius || inline.borderRadius || '',
    padding: c?.padding || inline.padding || '',
    width: c?.width || inline.width || '',
  }
}

export function applyElementDraft(el: HTMLElement | null, next: CanvasDraft, base: CanvasDraft) {
  if (!el) return
  const changed = (key: keyof CanvasDraft) => next[key] !== base[key]

  if (textTags.has(el.tagName) && changed('text')) el.textContent = next.text
  if (el instanceof HTMLImageElement) {
    if (changed('src') && next.src) el.setAttribute('src', next.src)
    if (changed('alt')) el.setAttribute('alt', next.alt)
  }

  // Only write touched props. No computed-style dumping into inline CSS.
  if (textTags.has(el.tagName)) {
    if (changed('fontFamily')) el.style.fontFamily = next.fontFamily
    if (changed('fontSize')) el.style.fontSize = next.fontSize
    if (changed('fontWeight')) el.style.fontWeight = next.fontWeight
    if (changed('color')) el.style.color = next.color
    if (changed('textAlign')) el.style.textAlign = next.textAlign
  }
  if (boxTags.has(el.tagName) || el instanceof HTMLImageElement || textTags.has(el.tagName)) {
    if (changed('backgroundColor')) el.style.backgroundColor = next.backgroundColor || ''
    if (changed('borderRadius')) el.style.borderRadius = next.borderRadius
    if (changed('padding')) el.style.padding = next.padding
  }
  if (el instanceof HTMLImageElement && changed('width')) el.style.width = next.width
}
