/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, type RefObject } from 'react'
import type { ElementData } from '@/hooks/useInspectMode'
import { cleanInspectArtifacts } from '@/utils/cleanInspectArtifacts'
import type { ImageUploadSource } from '@/types/preview'
import { usePreviewStyleEdits } from './usePreviewStyleEdits'

type UsePreviewEditsOptions = {
  selectedElement: ElementData | null
  setSelectedElement: (element: ElementData | null) => void
  disableInspectMode: () => void
  onInspectAskAI?: (elementData: ElementData) => void
  iframeRef: RefObject<HTMLIFrameElement | null>
  setSelectedImageElement: (element: ElementData | null) => void
  setImageDialogOpen: (open: boolean) => void
  selectedImageElement: ElementData | null
  previewHtml?: string
  onHtmlUpdate?: (html: string) => void
  setIsFontsPanelOpen: (open: boolean) => void
  setIsColorsPanelOpen: (open: boolean) => void
  setIsAssetsPanelOpen: (open: boolean) => void
}

export function usePreviewEdits({ selectedElement, setSelectedElement, disableInspectMode, onInspectAskAI, iframeRef, setSelectedImageElement, setImageDialogOpen, selectedImageElement, previewHtml, onHtmlUpdate, setIsFontsPanelOpen, setIsColorsPanelOpen, setIsAssetsPanelOpen }: UsePreviewEditsOptions) {
  // Handle "Ask AI" from context menu
  const handleAskAI = () => {
    if (!selectedElement) return

    setSelectedElement(null) // Close menu
    disableInspectMode() // Exit inspect mode (use disable, not toggle)

    // Pass full element data (not just context string)
    if (onInspectAskAI) {
      onInspectAskAI(selectedElement)
    }
  }

  // Handle "Edit Text" from context menu
  const handleEditText = (newText: string) => {
    if (!selectedElement || !iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    // Find the element again in the iframe
    // (We can't use the stored element reference directly)
    const elements = Array.from(doc.querySelectorAll(selectedElement.tag))
    const targetElement = elements.find(el =>
      el.textContent?.trim() === selectedElement.text
    ) as HTMLElement | undefined

    if (targetElement) {
      // Update the text content directly
      targetElement.textContent = newText

      // CRITICAL: Clean inspect artifacts BEFORE extracting HTML
      cleanInspectArtifacts(doc)

      // Extract updated HTML with DOCTYPE
      const doctype = '<!DOCTYPE html>\n'
      const htmlContent = doc.documentElement.outerHTML
      const updatedHtml = doctype + htmlContent

      // Notify parent to save
      if (onHtmlUpdate) {
        onHtmlUpdate(updatedHtml)
      }
    }

    // Don't close menu - let user continue editing
  }

  // Handle "Edit Image" from context menu
  const handleEditImage = useCallback(() => {
    if (!selectedElement || !selectedElement.isImageEditable) return

    setSelectedImageElement(selectedElement)
    setImageDialogOpen(true)

    // Close context menu and disable inspect mode
    setSelectedElement(null)
    disableInspectMode()
  }, [selectedElement, disableInspectMode])

  // Handle image update from dialog
  const handleImageUpdate = useCallback(async (imageUrl: string, _source: ImageUploadSource) => {
    if (!selectedImageElement || !previewHtml || !iframeRef.current) return


    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    // Find the image element in the iframe
    const imgElements = Array.from(doc.querySelectorAll('img')) as HTMLImageElement[]
    const targetImage = imgElements.find(img => img.src === selectedImageElement.currentSrc)

    if (targetImage) {
      // Update image src in the live preview
      targetImage.src = imageUrl

      // CRITICAL: Clean inspect artifacts BEFORE extracting HTML
      cleanInspectArtifacts(doc)

      // Extract updated HTML with DOCTYPE
      const doctype = '<!DOCTYPE html>\n'
      const htmlContent = doc.documentElement.outerHTML
      const updatedHtml = doctype + htmlContent

      // Notify parent to save
      if (onHtmlUpdate) {
        onHtmlUpdate(updatedHtml)
      }

    } else {
      console.warn('⚠️ Could not find image element to update')
    }

    // Close dialog and context menu
    setImageDialogOpen(false)
    setSelectedElement(null)
    setSelectedImageElement(null)

    // Don't disable inspect mode - let user continue editing
  }, [selectedImageElement, previewHtml, onHtmlUpdate, setSelectedElement])

  const { handleFontChange, handleColorChange, handleAssetChange } = usePreviewStyleEdits({
    iframeRef,
    previewHtml,
    onHtmlUpdate,
    setIsFontsPanelOpen,
    setIsColorsPanelOpen,
    setIsAssetsPanelOpen,
  })

  return { handleAskAI, handleEditText, handleEditImage, handleImageUpdate, handleFontChange, handleColorChange, handleAssetChange }
}
