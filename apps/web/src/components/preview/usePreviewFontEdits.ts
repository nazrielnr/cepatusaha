import { useCallback } from 'react'
import type { FontChange, PreviewStyleEditContext } from './previewStyleEditTypes'
import { getIframeDocument, getOrCreateStyleTag } from './previewStyleEditUtils'

const weightMap: Record<string, string> = {
  Light: '300',
  Regular: '400',
  Medium: '500',
  Semibold: '600',
  Bold: '700',
}

const spacingMap: Record<string, string> = {
  Tighter: '-0.05em',
  Tight: '-0.025em',
  Default: 'normal',
  Wide: '0.025em',
  Wider: '0.05em',
  Widest: '0.1em',
}

export function usePreviewFontEdits({ iframeRef, previewHtml, onHtmlUpdate }: PreviewStyleEditContext, setIsFontsPanelOpen: (open: boolean) => void) {
  return useCallback((changes: FontChange) => {
    const doc = getIframeDocument(iframeRef.current, previewHtml)
    if (!doc) return


    const styleTag = getOrCreateStyleTag(doc, 'data-font-inspector')
    let css = ''

    if (changes.headingFont || changes.headingWeight || changes.headingSpacing) {
      css += `
        h1, h2, h3, h4, h5, h6 {
          font-family: '${changes.headingFont || 'inherit'}', sans-serif !important;
          font-weight: ${changes.headingWeight ? weightMap[changes.headingWeight] || '400' : 'inherit'} !important;
          letter-spacing: ${changes.headingSpacing ? spacingMap[changes.headingSpacing] || 'normal' : 'inherit'} !important;
        }
      `
    }

    if (changes.bodyFont || changes.bodyWeight || changes.bodySpacing) {
      css += `
        body, p, span, div, a, li, td, th {
          font-family: '${changes.bodyFont || 'inherit'}', sans-serif !important;
          font-weight: ${changes.bodyWeight ? weightMap[changes.bodyWeight] || '400' : 'inherit'} !important;
          letter-spacing: ${changes.bodySpacing ? spacingMap[changes.bodySpacing] || 'normal' : 'inherit'} !important;
        }
      `
    }

    styleTag.textContent = css

    const fonts = [changes.headingFont, changes.bodyFont].filter(Boolean) as string[]
    if (fonts.length) {
      doc.querySelector('link[href*="fonts.googleapis.com"]')?.remove()
      const link = doc.createElement('link')
      link.rel = 'stylesheet'
      link.href = `https://fonts.googleapis.com/css2?family=${fonts.map(f => f.replace(/ /g, '+')).join('&family=')}:wght@300;400;500;600;700&display=swap`
      doc.head.appendChild(link)
    }

    onHtmlUpdate?.(doc.documentElement.outerHTML)
    setIsFontsPanelOpen(false)
  }, [iframeRef, previewHtml, onHtmlUpdate, setIsFontsPanelOpen])
}
