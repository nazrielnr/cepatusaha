import type { ElementData } from '@/hooks/useInspectMode'
import type { ImageUploadSource } from '@/types/preview'
import { AssetsPanel } from './AssetsPanel'
import { ColorsPanel } from './ColorsPanel'
import { FontsPanel } from './FontsPanel'
import { ImageUploadDialog } from './ImageUploadDialog'
import { InspectContextMenu } from './InspectContextMenu'

type PreviewOverlaysProps = {
  selectedElement: ElementData | null
  setSelectedElement: (element: ElementData | null) => void
  handleAskAI: () => void
  handleEditText: (text: string) => void
  handleEditImage: () => void
  imageDialogOpen: boolean
  setImageDialogOpen: (open: boolean) => void
  selectedImageElement: ElementData | null
  setSelectedImageElement: (element: ElementData | null) => void
  handleImageUpdate: (imageUrl: string, source: ImageUploadSource) => Promise<void>
  sessionId?: string
  getToken?: () => Promise<string | null>
  isFontsPanelOpen: boolean
  setIsFontsPanelOpen: (open: boolean) => void
  fontsPanelPosition: { x: number; y: number }
  handleFontChange: (changes: any) => void
  isColorsPanelOpen: boolean
  setIsColorsPanelOpen: (open: boolean) => void
  colorsPanelPosition: { x: number; y: number }
  handleColorChange: (changes: any) => void
  isAssetsPanelOpen: boolean
  setIsAssetsPanelOpen: (open: boolean) => void
  assetsPanelPosition: { x: number; y: number }
  handleAssetChange: (changes: any) => void
  previewHtml?: string
}

export function PreviewOverlays({ selectedElement, setSelectedElement, handleAskAI, handleEditText, handleEditImage, imageDialogOpen, setImageDialogOpen, selectedImageElement, setSelectedImageElement, handleImageUpdate, sessionId, getToken, isFontsPanelOpen, setIsFontsPanelOpen, fontsPanelPosition, handleFontChange, isColorsPanelOpen, setIsColorsPanelOpen, colorsPanelPosition, handleColorChange, isAssetsPanelOpen, setIsAssetsPanelOpen, assetsPanelPosition, handleAssetChange, previewHtml }: PreviewOverlaysProps) {
  return (
    <>
      {selectedElement && <InspectContextMenu element={selectedElement} onAskAI={handleAskAI} onEditText={handleEditText} onEditImage={handleEditImage} onClose={() => setSelectedElement(null)} />}

      <ImageUploadDialog
        open={imageDialogOpen}
        onClose={() => {
          setImageDialogOpen(false)
          setSelectedImageElement(null)
        }}
        onConfirm={handleImageUpdate}
        currentImageUrl={selectedImageElement?.currentSrc}
        elementInfo={selectedImageElement ? `${selectedImageElement.tag.toLowerCase()}${selectedImageElement.classes ? '.' + selectedImageElement.classes.split(' ')[0] : ''}` : ''}
        sessionId={sessionId}
        getToken={getToken}
      />

      <FontsPanel key={isFontsPanelOpen ? 'fonts-open' : 'fonts-closed'} isOpen={isFontsPanelOpen} onClose={() => setIsFontsPanelOpen(false)} previewHtml={previewHtml} onFontChange={handleFontChange} position={fontsPanelPosition} />
      <ColorsPanel key={isColorsPanelOpen ? 'colors-open' : 'colors-closed'} isOpen={isColorsPanelOpen} onClose={() => setIsColorsPanelOpen(false)} previewHtml={previewHtml} onColorChange={handleColorChange} position={colorsPanelPosition} />
      <AssetsPanel key={isAssetsPanelOpen ? 'assets-open' : 'assets-closed'} isOpen={isAssetsPanelOpen} onClose={() => setIsAssetsPanelOpen(false)} previewHtml={previewHtml} onAssetChange={handleAssetChange} position={assetsPanelPosition} />
    </>
  )
}
