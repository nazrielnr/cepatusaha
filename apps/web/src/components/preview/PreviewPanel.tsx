import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewMode } from '../ViewModeToggle'
import { CanvasEditPopup } from './CanvasEditPopup'
import { PreviewStage } from './PreviewStage'
import { PreviewToolbar } from './PreviewToolbar'
import { useCanvasEditor } from './useCanvasEditor'
import { useActivePlanningTab, useIsPlanningMode, usePlanningData, usePlanningPhase, usePlanningStore } from '@/stores/planning-store'
import { useInspectMode, type ElementData } from '@/hooks/useInspectMode'
import { APIError, formatErrorForLogging } from '@/utils/error-handler'
import type { File, LayoutBlueprint, PreviewResponse } from '@/types/preview'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

type PreviewPanelProps = {
  previewState: { data: PreviewResponse | null; loading: boolean; error: string | null }
  layoutBlueprint: LayoutBlueprint | null
  isGenerating: boolean
  isStreaming?: boolean
  isPublishing: boolean
  onGenerateRequest: () => void
  onPublishRequest: () => void
  isMobilePreviewMode?: boolean
  externalViewportMode?: ViewportMode
  previewProgress?: number
  previewStatus?: string
  onInspectAskAI?: (elementData: ElementData) => void
  onHtmlUpdate?: (html: string) => void
  sessionId?: string
  getToken?: () => Promise<string | null>
  projectId?: string
  userId?: string
  files?: File[]
  onRefresh?: () => void
  fileTreeRefreshTrigger?: number
  highlightedFilePaths?: string[]
  streamingFiles?: any[]
  onStreamingFileSelect?: (file: any) => void
  onPlanningSubmit?: (message: string) => void
  onPlanningGenerate?: (message: string) => void
  navigateToPage?: (href: string) => string | null
  pageBlobMappings?: { path: string; content?: string }[]
  currentPage?: string
}

function buildPlanningGenerateMessage(planningData: any): string {
  let message = 'Mulai implementasi website sekarang! Buat file HTML, CSS, dan JavaScript berdasarkan planning documents berikut:\n\n'

  if (planningData) {
    message += `## BUSINESS INFO\n`
    message += `- Name: ${planningData.business_info.name}\n`
    message += `- Category: ${planningData.business_info.category}\n`
    message += `- Target Audience: ${planningData.business_info.target_audience.join(', ')}\n\n`
    message += `## PRD (Product Requirements Document)\n${planningData.prd.executive_summary}\n\n`
    message += `Goals:\n${planningData.prd.goals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n')}\n\n`
    message += `Key Features:\n${planningData.prd.features.map((f: any) => `- ${f.name} (${f.priority}): ${f.description}`).join('\n')}\n\n`
    message += `## SITEMAP - FILE STRUCTURE\nWAJIB buat file HTML terpisah untuk SETIAP halaman berikut:\n`
    planningData.sitemap.pages.forEach((p: any, i: number) => {
      const fileName = p.path === '/' ? 'index.html' : `${p.path.replace('/', '')}.html`
      message += `${i + 1}. ${fileName} - ${p.name} page dengan sections: ${p.sections.join(', ')}\n`
    })
    message += `\nSetiap file HTML harus:\n- Link ke style.css yang sama\n- Link ke script.js yang sama\n- Punya navigation yang menghubungkan ke semua halaman lain\n- Berisi konten lengkap sesuai sections yang disebutkan\n\n`
    message += `## DESIGN BRIEF\nMood: ${planningData.design_brief.mood}\n`
    message += `Colors:\n${planningData.design_brief.color_palette.map((c: any) => `- ${c.name}: ${c.hex} (${c.usage})`).join('\n')}\n`
    message += `Typography: Heading=${planningData.design_brief.typography.heading_font}, Body=${planningData.design_brief.typography.body_font}\n\n`
    message += `## SEO PLAN\nPrimary Keywords: ${planningData.seo_plan.primary_keywords.join(', ')}\n`
    message += `Meta Title Template: ${planningData.seo_plan.meta_title_template}\nMeta Description Template: ${planningData.seo_plan.meta_description_template}\n\n`
  }

  return message + `CRITICAL INSTRUCTIONS:\n1. Jangan buat file dokumentasi lagi\n2. Buat SEMUA file HTML yang disebutkan di sitemap (jangan hanya index.html)\n3. Buat 1 file style.css untuk semua halaman\n4. Buat 1 file script.js untuk semua halaman\n5. Setiap HTML file harus lengkap dengan konten sesuai sections-nya\n6. Update navigation di semua halaman untuk link antar halaman\n`
}

export function PreviewPanel({
  previewState,
  layoutBlueprint: _layoutBlueprint,
  isGenerating,
  isStreaming = false,
  isPublishing,
  onGenerateRequest,
  onPublishRequest,
  isMobilePreviewMode: _isMobilePreviewMode = false,
  externalViewportMode,
  previewProgress: _previewProgress = 0,
  previewStatus: _previewStatus = '',
  onInspectAskAI,
  onHtmlUpdate,
  sessionId,
  getToken,
  projectId,
  userId,
  files = [],
  onRefresh,
  fileTreeRefreshTrigger: _fileTreeRefreshTrigger,
  highlightedFilePaths: _highlightedFilePaths,
  streamingFiles: _streamingFiles,
  onStreamingFileSelect: _onStreamingFileSelect,
  onPlanningSubmit,
  onPlanningGenerate,
  navigateToPage,
  pageBlobMappings = [],
  currentPage,
}: PreviewPanelProps) {
  const thumbnailErrorLoggedRef = useRef(false)
  const thumbnailSavedForSessionRef = useRef<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [internalViewportMode, setInternalViewportMode] = useState<ViewportMode>('desktop')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')

  const isPlanningMode = useIsPlanningMode()
  const planningData = usePlanningData()
  const activePlanningTab = useActivePlanningTab()
  const planningPhase = usePlanningPhase()
  const { setActiveTab, reset: resetPlanningStore } = usePlanningStore()
  const { isInspectMode, toggleInspectMode, setIframeRef } = useInspectMode()
  const viewportMode = externalViewportMode || internalViewportMode


  useEffect(() => {
    if (!previewState.data?.html) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(new Blob([previewState.data.html], { type: 'text/html' }))
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return url
    })
  }, [previewState.data?.html])

  useEffect(() => () => {
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return null
    })
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      if (event.data?.type !== 'PREVIEW_NAVIGATE' || typeof event.data.href !== 'string') return
      navigateToPage?.(event.data.href)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigateToPage])

  useEffect(() => {
    if (isStreaming) thumbnailSavedForSessionRef.current = null
  }, [isStreaming])

  useEffect(() => {
    if (!previewUrl || !iframeRef.current || !sessionId || !getToken || isStreaming) return
    if (thumbnailSavedForSessionRef.current === sessionId) return
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout> | null = null
    const iframe = iframeRef.current
    const capture = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(async () => {
        if (cancelled || thumbnailSavedForSessionRef.current === sessionId) return
        try {
          const { generateThumbnail } = await import('@/utils/generateThumbnail')
          const thumbnail = await generateThumbnail(iframe, sessionId, true)
          const token = thumbnail ? await getToken() : null
          if (!thumbnail || !token) return
          const { updateSession } = await import('@/api/sessions')
          try {
            thumbnailSavedForSessionRef.current = sessionId
            await updateSession(sessionId, { previewThumbnail: thumbnail }, token)
          } catch (err) {
            thumbnailSavedForSessionRef.current = null
            if (!thumbnailErrorLoggedRef.current) {
              thumbnailErrorLoggedRef.current = true
              const status = (err as APIError)?.statusCode
              console.error('[PreviewPanel] Failed to save thumbnail:', formatErrorForLogging(err as any))
              if (status === 401 || status === 403) console.warn('[PreviewPanel] Skipping further thumbnail saves due to auth error')
            }
          }
        } catch (error) {
          if (!thumbnailErrorLoggedRef.current) {
            thumbnailErrorLoggedRef.current = true
            console.error('[PreviewPanel] Failed to generate/save thumbnail:', formatErrorForLogging(error as any))
          }
        }
      }, 1000)
    }
    if (iframe.contentDocument?.readyState === 'complete') capture()
    else iframe.addEventListener('load', capture, { once: true })
    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
      iframe.removeEventListener('load', capture)
    }
  }, [previewUrl, sessionId, getToken, isStreaming])

  const canPublish = useMemo(() => Boolean(previewState.data) && !previewState.loading && !isPublishing && !isGenerating, [isGenerating, isPublishing, previewState.data, previewState.loading])
  const hasPreview = Boolean(previewState.data?.html && previewUrl)

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return
    setIsRefreshing(true)
    try { await onRefresh() }
    finally { setTimeout(() => setIsRefreshing(false), 500) }
  }, [onRefresh, isRefreshing])

  const handleGenerate = useCallback(() => {
    resetPlanningStore()
    if (onPlanningGenerate) onPlanningGenerate(buildPlanningGenerateMessage(planningData))
    else onGenerateRequest()
  }, [planningData, resetPlanningStore, onGenerateRequest, onPlanningGenerate])

  const canvasPages = useMemo(() => pageBlobMappings.flatMap(m => typeof m.content === 'string' ? [{ path: m.path, html: m.content }] : []), [pageBlobMappings])
  const { selected, dirty, applyPatch, clearSelection, save } = useCanvasEditor({ enabled: isInspectMode && viewMode !== 'code' && hasPreview, iframeRef, onHtmlUpdate })
  const [iframeRect, setIframeRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!selected || !iframeRef.current) return
    setIframeRect(iframeRef.current.getBoundingClientRect())
  }, [selected])

  const handleInspectorAskAI = useCallback((selection: any) => {
    onInspectAskAI?.({ element: null as any, tag: selection.tag, text: selection.text, classes: selection.classes, html: '', position: { x: selection.rect.x, y: selection.rect.y }, isTextEditable: true, isImageEditable: selection.tag === 'IMG', currentSrc: selection.src })
  }, [onInspectAskAI])

  return (
    <div className="flex h-full flex-col bg-muted dark:bg-muted min-h-0 relative">
      <PreviewToolbar isPlanningMode={isPlanningMode} planningPhase={planningPhase} planningData={planningData} activePlanningTab={activePlanningTab} setActiveTab={setActiveTab} handleGenerate={handleGenerate} isGenerating={isGenerating} viewMode={viewMode} setViewMode={setViewMode} viewportMode={viewportMode} setInternalViewportMode={setInternalViewportMode} toggleInspectMode={toggleInspectMode} hasPreview={hasPreview} isInspectMode={isInspectMode} onRefresh={onRefresh} handleRefresh={handleRefresh} isRefreshing={isRefreshing} onPublishRequest={onPublishRequest} canPublish={canPublish} isPublishing={isPublishing} pagePaths={pageBlobMappings.map(m => m.path)} currentPage={currentPage} navigateToPage={navigateToPage} />
      <div className="flex min-h-0 flex-1">
        <PreviewStage viewMode={viewMode} projectId={projectId} userId={userId} files={files} onRefresh={onRefresh} getToken={getToken} previewState={previewState} isPlanningMode={isPlanningMode} hasPreview={hasPreview} onPlanningSubmit={onPlanningSubmit} viewportMode={viewportMode} isInspectMode={isInspectMode} iframeRef={iframeRef} previewUrl={previewUrl} setIframeRef={setIframeRef} canvasPages={canvasPages} currentPage={currentPage} navigateToPage={navigateToPage} />
        {isInspectMode && viewMode !== 'code' && hasPreview && selected && <CanvasEditPopup selected={selected} iframeRect={iframeRect} dirty={dirty} onClose={clearSelection} onPatch={applyPatch} onSave={save} onAskAI={handleInspectorAskAI} />}
      </div>
    </div>
  )
}
