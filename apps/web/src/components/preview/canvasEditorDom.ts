import { cleanInspectArtifacts } from '@/utils/cleanInspectArtifacts'

export function getDomPath(el: Element): string {
  const path: number[] = []
  let cur: Element | null = el
  while (cur?.parentElement && cur !== cur.ownerDocument.body) {
    path.unshift(Array.prototype.indexOf.call(cur.parentElement.children, cur))
    cur = cur.parentElement
  }
  return path.join('/')
}

export function getElementByDomPath(doc: Document, path?: string): HTMLElement | null {
  if (!path && path !== '') return null
  let cur: Element | null = doc.body
  for (const part of path.split('/').filter(Boolean)) cur = cur?.children[Number(part)] ?? null
  return cur instanceof HTMLElement ? cur : null
}

export function emitCleanHtml(doc: Document, onHtmlUpdate?: (html: string) => void) {
  cleanInspectArtifacts(doc)
  onHtmlUpdate?.(`<!DOCTYPE html>\n${doc.documentElement.outerHTML}`)
}

export function rgbToHex(value: string): string {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '#0f172a'
  if (value.startsWith('#')) return value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toUpperCase() : value.toUpperCase()
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return match ? `#${[match[1], match[2], match[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase() : '#0f172a'
}

export function firstFont(value: string): string {
  return (value || '').split(',')[0]?.replace(/["']/g, '').trim() || 'inherit'
}
