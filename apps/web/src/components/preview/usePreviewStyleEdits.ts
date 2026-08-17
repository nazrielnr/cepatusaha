import type { RefObject } from 'react'
import { usePreviewAssetEdits } from './usePreviewAssetEdits'
import { usePreviewColorEdits } from './usePreviewColorEdits'
import { usePreviewFontEdits } from './usePreviewFontEdits'

type UsePreviewStyleEditsOptions = {
  iframeRef: RefObject<HTMLIFrameElement | null>
  previewHtml?: string
  onHtmlUpdate?: (html: string) => void
  setIsFontsPanelOpen: (open: boolean) => void
  setIsColorsPanelOpen: (open: boolean) => void
  setIsAssetsPanelOpen: (open: boolean) => void
}

export function usePreviewStyleEdits({ iframeRef, previewHtml, onHtmlUpdate, setIsFontsPanelOpen, setIsColorsPanelOpen, setIsAssetsPanelOpen }: UsePreviewStyleEditsOptions) {
  const context = { iframeRef, previewHtml, onHtmlUpdate }
  const handleFontChange = usePreviewFontEdits(context, setIsFontsPanelOpen)
  const handleColorChange = usePreviewColorEdits(context, setIsColorsPanelOpen)
  const handleAssetChange = usePreviewAssetEdits(context, setIsAssetsPanelOpen)

  return { handleFontChange, handleColorChange, handleAssetChange }
}
