import { useState, useCallback, useEffect, useRef } from 'react'
import type { PreviewResponse, LayoutBlueprint, GeneratedCopy } from '@/types/preview'
import {
  createPageBlobMappings,
  revokePageBlobMappings,
  resolvePagePath,
  findPageMapping,
  type PageBlobMapping
} from '../utils/multiPagePreview'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

interface UsePreviewStateOptions {
  appState?: any // Accept appState but don't use it for now
}

export function usePreviewState(_options?: UsePreviewStateOptions) {
  const [previewState, setPreviewState] = useState<AsyncState<PreviewResponse | null>>({
    data: null,
    loading: false,
    error: null
  })
  const [layoutBlueprint, setLayoutBlueprint] = useState<LayoutBlueprint | null>(null)
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopy | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewProgress, setPreviewProgress] = useState<number>(0)
  const [previewStatus, setPreviewStatus] = useState<string>('')
  const [projectFiles, setProjectFiles] = useState<any[]>([])
  const [fileTreeRefreshTrigger, setFileTreeRefreshTrigger] = useState(0)

  // Multi-page preview state
  const [pageBlobMappings, setPageBlobMappings] = useState<PageBlobMapping[]>([])
  const [currentPage, setCurrentPage] = useState<string>(() => {
    try {
      return (typeof window !== 'undefined' && sessionStorage.getItem('cu_preview_page')) || 'index.html'
    } catch {
      return 'index.html'
    }
  })
  const currentPageRef = useRef<string>(currentPage)
  useEffect(() => {
    currentPageRef.current = currentPage
    try {
      if (currentPage && typeof window !== 'undefined') sessionStorage.setItem('cu_preview_page', currentPage)
    } catch {}
  }, [currentPage])

  const resetPreviewState = useCallback(() => {
    setPreviewState({ data: null, loading: false, error: null })
    setLayoutBlueprint(null)
    setGeneratedCopy(null)
    setPreviewProgress(0)
    setPreviewStatus('')
    setIsGeneratingPreview(false)
    projectFilesRef.current = []
    setProjectFiles([])
    setPageBlobMappings((prev) => {
      revokePageBlobMappings(prev)
      return []
    })
    setCurrentPage('index.html')
    setFileTreeRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => () => revokePageBlobMappings(pageBlobMappings), [pageBlobMappings])

  const projectFilesRef = useRef<any[]>([])
  useEffect(() => {
    projectFilesRef.current = projectFiles
  }, [projectFiles])

  // Update preview HTML
  const updatePreviewHtml = useCallback((html: string, pagePath?: string, newFiles?: any[]) => {
    const targetPage = pagePath || currentPageRef.current || currentPage

    let updated = projectFilesRef.current.map(f => {
      if (f.file_path === targetPage || f.file_path.endsWith(targetPage) || targetPage.endsWith(f.file_path)) {
        return { ...f, content: html }
      }
      return f
    })
    const matched = updated.some(f => f.file_path === targetPage || f.file_path.endsWith(targetPage) || targetPage.endsWith(f.file_path))
    if (!matched) {
      updated.push({ file_path: targetPage, content: html, file_type: 'html' })
    }
    if (newFiles && newFiles.length > 0) {
      for (const nf of newFiles) {
        const idx = updated.findIndex(f => f.file_path === nf.file_path || f.file_path.endsWith(nf.file_path) || nf.file_path.endsWith(f.file_path))
        if (idx >= 0) updated[idx] = nf
        else updated.push(nf)
      }
    }

    projectFilesRef.current = updated
    setProjectFiles(updated)

    // Re-generate complete preview mappings with inlined CSS/JS, resolved virtual assets, and nav handler
    const mappings = createPageBlobMappings(updated)
    setPageBlobMappings(mappings)

    const desiredPage = targetPage || currentPageRef.current || currentPage
    const activeMapping = findPageMapping(mappings, desiredPage) || findPageMapping(mappings, targetPage) || mappings[0]
    const combinedHtml = activeMapping?.content || html

    if (activeMapping?.path) {
      setCurrentPage(activeMapping.path)
      currentPageRef.current = activeMapping.path
    }

    setPreviewState(ps => ({
      ...ps,
      data: {
        html: combinedHtml,
        generatedCopy: generatedCopy || {
          slogan: '',
          summary: '',
          highlights: [],
          cta: { heading: '', body: '', button: '' }
        },
        layoutBlueprint: layoutBlueprint
      }
    }))

    setFileTreeRefreshTrigger(prev => prev + 1)
  }, [currentPage, generatedCopy, layoutBlueprint])

  // Update preview from run_preview result
  const updatePreviewFromFiles = useCallback((files: any[]) => {
    projectFilesRef.current = files

    // Create blob mappings for ALL HTML files (multi-page support)
    const mappings = createPageBlobMappings(files)
    setPageBlobMappings(mappings)

    // Find primary HTML file: prefer index.html, else first .html
    const indexFile = files.find((f: any) =>
      f.file_path === 'index.html' || f.file_path === 'src/index.html' || f.file_path.endsWith('/index.html')
    )
    const firstHtml = files.find((f: any) => f.file_path?.toLowerCase().endsWith('.html'))
    const primaryFile = indexFile || firstHtml || files[0]

    if (!primaryFile) {
      console.warn('[usePreviewState] No files returned for preview refresh')
      return
    }

    // Preserve current page if it exists in the updated mappings
    const savedPage = typeof window !== 'undefined' ? sessionStorage.getItem('cu_preview_page') : null
    const desiredPage = currentPageRef.current || savedPage || currentPage
    let activeMapping = desiredPage ? findPageMapping(mappings, desiredPage) : undefined
    if (!activeMapping) {
      activeMapping = mappings.find(m => m.path === primaryFile.file_path) || mappings[0]
    }

    const activePage = activeMapping ? activeMapping.path : primaryFile.file_path
    setCurrentPage(activePage)
    currentPageRef.current = activePage

    // Get combined HTML from blob mapping (already has CSS/JS injected + nav handler)
    const combinedHtml = activeMapping?.content || primaryFile.content

    // Update preview state
    setPreviewState({
      data: {
        html: combinedHtml,
        generatedCopy: generatedCopy || {
          slogan: '',
          summary: '',
          highlights: [],
          cta: { heading: '', body: '', button: '' }
        },
        layoutBlueprint: layoutBlueprint
      },
      loading: false,
      error: null
    })

    // Update file tree state for the UI (code tab)
    setProjectFiles(files)
    setFileTreeRefreshTrigger(prev => prev + 1)

  }, [generatedCopy, layoutBlueprint])

  // Navigate to a different page (for multi-page support)
  const navigateToPage = useCallback((targetHref: string) => {
    // 1. Direct match check
    let targetMapping = findPageMapping(pageBlobMappings, targetHref)

    // 2. Relative resolution fallback
    if (!targetMapping) {
      const activeCurrent = currentPageRef.current || currentPage
      const resolvedPath = resolvePagePath(activeCurrent, targetHref)
      targetMapping = findPageMapping(pageBlobMappings, resolvedPath)
    }

    if (!targetMapping) {
      console.warn('[usePreviewState] ⚠️ Page not found:', targetHref)
      return null
    }

    // Update current page
    setCurrentPage(targetMapping.path)
    currentPageRef.current = targetMapping.path

    // Update preview HTML
    setPreviewState(prev => ({
      ...prev,
      data: prev.data ? {
        ...prev.data,
        html: targetMapping.content
      } : null
    }))

    return targetMapping.blobUrl
  }, [currentPage, pageBlobMappings])

  return {
    // Preview state
    previewHtml: previewState.data?.html || null,
    previewLoading: previewState.loading,
    previewError: previewState.error,

    // Layout and copy
    layoutBlueprint,
    setLayoutBlueprint,
    generatedCopy,
    setGeneratedCopy,

    // Generation state
    isGeneratingPreview,
    setIsGeneratingPreview,
    previewProgress,
    setPreviewProgress,
    previewStatus,
    setPreviewStatus,

    // Update functions
    updatePreviewHtml,
    updatePreviewFromFiles,
    setPreviewState,
    resetPreviewState,

    // Clear preview - for hard refresh
    clearPreview: () => {
      setPreviewState({ data: null, loading: false, error: null })
      projectFilesRef.current = []
      setProjectFiles([])
      setPageBlobMappings((prev) => {
        revokePageBlobMappings(prev)
        return []
      })
      setFileTreeRefreshTrigger(prev => prev + 1)
    },

    // Refresh preview by incrementing file tree trigger
    refresh: () => {
      setFileTreeRefreshTrigger(prev => prev + 1)
    },

    // Legacy compatibility - these will be removed
    updateHtml: updatePreviewHtml,
    currentProjectId: null,
    projectFiles,
    handleManualRefresh: () => {},
    fileTreeRefreshTrigger,
    highlightedFilePaths: [],
    streamingFiles: [],

    // Multi-page preview support
    pageBlobMappings,
    currentPage,
    setCurrentPage,
    navigateToPage,
  }
}
