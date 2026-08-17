import { useCallback } from 'react'
import type { ColorChange, PreviewStyleEditContext } from './previewStyleEditTypes'
import { emitUpdatedHtml, getIframeDocument, getOrCreateStyleTag } from './previewStyleEditUtils'

const themeColors: Record<string, string[]> = {
  CepatUsaha: ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))'],
}


export function usePreviewColorEdits({ iframeRef, previewHtml, onHtmlUpdate }: PreviewStyleEditContext, setIsColorsPanelOpen: (open: boolean) => void) {
  return useCallback((changes: ColorChange) => {
    const doc = getIframeDocument(iframeRef.current, previewHtml)
    if (!doc) return


    const styleTag = getOrCreateStyleTag(doc, 'data-color-inspector')
    let css = ''

    if (changes.theme && themeColors[changes.theme]) {
      const colors = themeColors[changes.theme]
      css += `
        :root {
          --color-primary: ${colors[0]};
          --color-secondary: ${colors[1]};
          --color-accent: ${colors[2]};
          --color-highlight: ${colors[3]};
        }
      `
    }

    if (changes.colors) {
      Object.entries(changes.colors).forEach(([colorName, colorValue]) => {
        doc.querySelectorAll(`[class*="${colorName}"]`).forEach(el => {
          const element = el as HTMLElement
          if (colorName.includes('bg-')) element.style.backgroundColor = colorValue
          else if (colorName.includes('text-')) element.style.color = colorValue
          else if (colorName.includes('border-')) element.style.borderColor = colorValue
        })
      })
    }

    if (changes.mode) {
      css += changes.mode === 'dark'
        ? '\n          body { background-color: #0f172a !important; color: #f0f9ff !important; }\n        '
        : '\n          body { background-color: #ffffff !important; color: #0f172a !important; }\n        '
    }

    styleTag.textContent = css
    emitUpdatedHtml(doc, onHtmlUpdate)
    setIsColorsPanelOpen(false)
  }, [iframeRef, previewHtml, onHtmlUpdate, setIsColorsPanelOpen])
}
