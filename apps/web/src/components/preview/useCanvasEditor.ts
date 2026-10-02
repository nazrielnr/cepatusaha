import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { installCanvasEditorBridge, type CanvasEditorBridge, type CanvasEditorPatch, type CanvasEditorSelection } from '@/utils/canvasEditorBridge'

type Options = {
  enabled: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
  onHtmlUpdate?: (html: string, newFiles?: any[], pagePath?: string) => void
}

export function useCanvasEditor({ enabled, iframeRef, onHtmlUpdate }: Options) {
  const bridgeRef = useRef<CanvasEditorBridge | null>(null)
  const [selected, setSelected] = useState<CanvasEditorSelection | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const install = () => {
      bridgeRef.current?.destroy()
      bridgeRef.current = null
      setSelected(null)
      setDirty(false)
      if (!enabled || !iframeRef.current?.contentDocument) {
        return
      }
      const bridge = installCanvasEditorBridge(iframeRef.current.contentDocument, {
        onSelect: setSelected,
        onChange: (next) => { setSelected(next); setDirty(true) },
      })
      bridgeRef.current = bridge
    }
    install()
    window.addEventListener('canvas-iframe-focus', install)
    const iframe = iframeRef.current
    iframe?.addEventListener('load', install)
    return () => {
      window.removeEventListener('canvas-iframe-focus', install)
      iframe?.removeEventListener('load', install)
      bridgeRef.current?.destroy()
      bridgeRef.current = null
    }
  }, [enabled, iframeRef])

  const applyPatch = useCallback((patch: CanvasEditorPatch) => {
    if (!selected) return
    const next = bridgeRef.current?.applyPatch(selected.id, patch)
    if (next) { setSelected(next); setDirty(true) }
  }, [selected])

  const revert = useCallback(() => {
    bridgeRef.current?.revert()
    bridgeRef.current?.clearSelection()
    setSelected(null)
    setDirty(false)
  }, [])

  const clearSelection = useCallback(() => {
    if (dirty) {
      bridgeRef.current?.revert()
    }
    bridgeRef.current?.clearSelection()
    setSelected(null)
    setDirty(false)
  }, [dirty])

  const save = useCallback((newFiles?: any[]) => {
    try {
      bridgeRef.current?.commit()
      const html = bridgeRef.current?.serialize()
      const iframe = iframeRef.current
      const pagePath = iframe?.getAttribute('data-page-path') || iframe?.title?.replace(/^Canvas\s+/, '') || undefined
      bridgeRef.current?.clearSelection()
      setSelected(null)
      setDirty(false)
      if (html) {
        onHtmlUpdate?.(html, newFiles, pagePath)
      }
    } catch (e) {
      console.error('[useCanvasEditor] Error during save:', e)
      bridgeRef.current?.clearSelection()
      setSelected(null)
      setDirty(false)
    }
  }, [onHtmlUpdate, iframeRef])

  return { selected, dirty, applyPatch, clearSelection, revert, save }
}
