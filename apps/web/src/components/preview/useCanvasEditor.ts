import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { installCanvasEditorBridge, type CanvasEditorBridge, type CanvasEditorPatch, type CanvasEditorSelection } from '@/utils/canvasEditorBridge'

type Options = {
  enabled: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
  onHtmlUpdate?: (html: string) => void
}

export function useCanvasEditor({ enabled, iframeRef, onHtmlUpdate }: Options) {
  const bridgeRef = useRef<CanvasEditorBridge | null>(null)
  const [selected, setSelected] = useState<CanvasEditorSelection | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const install = () => {
      if (!enabled || !iframeRef.current?.contentDocument) {
        bridgeRef.current?.destroy()
        bridgeRef.current = null
        setSelected(null)
        setDirty(false)
        return
      }
      bridgeRef.current?.destroy()
      const bridge = installCanvasEditorBridge(iframeRef.current.contentDocument, {
        onSelect: setSelected,
        onChange: (next) => { setSelected(next); setDirty(true) },
      })
      bridgeRef.current = bridge
    }
    install()
    window.addEventListener('canvas-iframe-focus', install)
    return () => {
      window.removeEventListener('canvas-iframe-focus', install)
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [enabled, iframeRef])

  const applyPatch = useCallback((patch: CanvasEditorPatch) => {
    if (!selected) return
    const next = bridgeRef.current?.applyPatch(selected.id, patch)
    if (next) { setSelected(next); setDirty(true) }
  }, [selected])

  const clearSelection = useCallback(() => {
    bridgeRef.current?.clearSelection()
    setSelected(null)
  }, [])

  const save = useCallback(() => {
    const html = bridgeRef.current?.serialize()
    if (!html) return
    onHtmlUpdate?.(html)
    setDirty(false)
  }, [onHtmlUpdate])

  return { selected, dirty, applyPatch, clearSelection, save }
}
