import { useCallback } from 'react'
import type { AssetChange, PreviewStyleEditContext } from './previewStyleEditTypes'
import { emitUpdatedHtml, getIframeDocument } from './previewStyleEditUtils'

export function usePreviewAssetEdits({ iframeRef, previewHtml, onHtmlUpdate }: PreviewStyleEditContext, setIsAssetsPanelOpen: (open: boolean) => void) {
  return useCallback((changes: AssetChange) => {
    const doc = getIframeDocument(iframeRef.current, previewHtml)
    if (!doc) return


    const [type, indexStr] = changes.assetId.split('-')
    const index = parseInt(indexStr)

    if (type === 'img') {
      const targetImg = doc.querySelectorAll('img')[index]
      if (targetImg && changes.action === 'replace' && changes.newUrl) targetImg.setAttribute('src', changes.newUrl)
      else if (targetImg && changes.action === 'remove') targetImg.remove()
    } else if (type === 'bg') {
      let bgIndex = 0
      doc.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement
        const style = element.getAttribute('style')
        if (!style?.includes('background-image')) return
        if (bgIndex === index) {
          if (changes.action === 'replace' && changes.newUrl) {
            element.setAttribute('style', style.replace(/background-image:\s*url\(['"]?[^'"]+['"]?\)/, `background-image: url('${changes.newUrl}')`))
          } else if (changes.action === 'remove') {
            element.setAttribute('style', style.replace(/background-image:\s*url\(['"]?[^'"]+['"]?\);?/, ''))
          }
        }
        bgIndex++
      })
    }

    emitUpdatedHtml(doc, onHtmlUpdate)
    setIsAssetsPanelOpen(false)
  }, [iframeRef, previewHtml, onHtmlUpdate, setIsAssetsPanelOpen])
}
