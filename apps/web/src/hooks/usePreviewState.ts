import { useState, useCallback, useEffect } from 'react'
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
  const [currentPage, setCurrentPage] = useState<string>('index.html')

  const resetPreviewState = useCallback(() => {
    setPreviewState({ data: null, loading: false, error: null })
    setLayoutBlueprint(null)
    setGeneratedCopy(null)
    setPreviewProgress(0)
    setPreviewStatus('')
    setIsGeneratingPreview(false)
    setProjectFiles([])
    setPageBlobMappings((prev) => {
      revokePageBlobMappings(prev)
      return []
    })
    setCurrentPage('index.html')
    setFileTreeRefreshTrigger((prev) => prev + 1)
  }, [])

  useEffect(() => () => revokePageBlobMappings(pageBlobMappings), [pageBlobMappings])

  // Update preview HTML
  const updatePreviewHtml = useCallback((html: string) => {
    setPreviewState(prev => {
      if (!prev.data) {
        return {
          ...prev,
          data: {
            html,
            generatedCopy: generatedCopy || {
              slogan: '',
              summary: '',
              highlights: [],
              cta: { heading: '', body: '', button: '' }
            },
            layoutBlueprint: layoutBlueprint
          }
        }
      }

      return {
        ...prev,
        data: {
          ...prev.data,
          html
        }
      }
    })
  }, [generatedCopy, layoutBlueprint])

  // Update preview from run_preview result
  const updatePreviewFromFiles = useCallback((files: any[]) => {

    // Create blob mappings for ALL HTML files (multi-page support)
    const mappings = createPageBlobMappings(files)
    setPageBlobMappings(mappings)

    // Find primary HTML file: prefer index.html, else first .html
    const indexFile = files.find((f: any) =>
      f.file_path === 'src/index.html' || f.file_path === 'index.html' || f.file_path.endsWith('/index.html')
    )
    const firstHtml = files.find((f: any) => f.file_path?.toLowerCase().endsWith('.html'))
    const primaryFile = indexFile || firstHtml || files[0]

    if (!primaryFile) {
      console.warn('[usePreviewState] No files returned for preview refresh')
      return
    }

    // Set current page for multi-page navigation
    const initialPage = primaryFile.file_path
    setCurrentPage(initialPage)

    // Get combined HTML from blob mapping (already has CSS/JS injected + nav handler)
    const initialMapping = mappings.find(m => m.path === initialPage)
    const combinedHtml = initialMapping?.content || primaryFile.content


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
    // Resolve path relative to current page
    const resolvedPath = resolvePagePath(currentPage, targetHref)

    // Find matching page in blob mappings
    const targetMapping = findPageMapping(pageBlobMappings, resolvedPath)

    if (!targetMapping) {
      console.warn('[usePreviewState] ⚠️ Page not found:', resolvedPath)
      return null
    }

    // Update current page
    setCurrentPage(targetMapping.path)

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
