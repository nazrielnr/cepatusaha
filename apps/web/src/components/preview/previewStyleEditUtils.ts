import { cleanInspectArtifacts } from '@/utils/cleanInspectArtifacts'

export function getIframeDocument(iframe: HTMLIFrameElement | null, previewHtml?: string): Document | null {
  if (!iframe || !previewHtml) return null
  return iframe.contentDocument
}

export function emitUpdatedHtml(doc: Document, onHtmlUpdate?: (html: string) => void, withDoctype = true) {
  cleanInspectArtifacts(doc)
  const html = `${withDoctype ? '<!DOCTYPE html>\n' : ''}${doc.documentElement.outerHTML}`
  onHtmlUpdate?.(html)
}

export function getOrCreateStyleTag(doc: Document, attr: string): HTMLStyleElement {
  let styleTag = doc.querySelector(`style[${attr}]`) as HTMLStyleElement | null
  if (!styleTag) {
    styleTag = doc.createElement('style')
    styleTag.setAttribute(attr.replace(/^data-/, 'data-'), 'true')
    doc.head.appendChild(styleTag)
  }
  return styleTag
}
