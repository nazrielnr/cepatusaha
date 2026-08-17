import { useState, useCallback, useRef, useEffect } from 'react'

export type ElementData = {
  element: HTMLElement
  tag: string
  text: string
  classes: string
  html: string
  position: { x: number; y: number }
  isTextEditable: boolean // true = can edit inline, false = AI-only
  isImageEditable: boolean // true = can edit image (IMG tag), false = not image
  currentSrc?: string // Current image src (if IMG tag)
  domPath?: string
}

type InspectModeState = {
  isActive: boolean
  selectedElement: ElementData | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

export function useInspectMode() {
  const [state, setState] = useState<InspectModeState>({
    isActive: false,
    selectedElement: null,
    saveStatus: 'idle',
  })

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const cleanupFnRef = useRef<(() => void) | null>(null)

  const enableInspectMode = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }))
  }, [])

  const disableInspectMode = useCallback(() => {
    // Cleanup any active listeners
    if (cleanupFnRef.current) {
      cleanupFnRef.current()
      cleanupFnRef.current = null
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      saveStatus: 'idle',
    }))
  }, [])

  const toggleInspectMode = useCallback(() => {
    setState(prev => {
      if (prev.isActive) {
        // Cleanup when disabling
        if (cleanupFnRef.current) {
          cleanupFnRef.current()
          cleanupFnRef.current = null
        }
        return {
          ...prev,
          isActive: false,
          saveStatus: 'idle',
        }
      } else {
        return { ...prev, isActive: true }
      }
    })
  }, [])

  const setSelectedElement = useCallback((element: ElementData | null) => {
    setState(prev => ({ ...prev, selectedElement: element }))
  }, [])

  const setSaveStatus = useCallback((status: InspectModeState['saveStatus']) => {
    setState(prev => ({ ...prev, saveStatus: status }))
  }, [])

  const setIframeRef = useCallback((iframe: HTMLIFrameElement | null) => {
    iframeRef.current = iframe
  }, [])

  const setCleanupFn = useCallback((fn: (() => void) | null) => {
    cleanupFnRef.current = fn
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current()
      }
    }
  }, [])

  return {
    isInspectMode: state.isActive,
    selectedElement: state.selectedElement,
    saveStatus: state.saveStatus,
    iframeRef,
    enableInspectMode,
    disableInspectMode,
    toggleInspectMode,
    setSelectedElement,
    setSaveStatus,
    setIframeRef,
    setCleanupFn,
  }
}
