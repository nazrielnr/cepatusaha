import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { RefObject } from 'react'
import type { ViewMode } from '../ViewModeToggle'
import type { File } from '@/types/preview'
import { CodeViewPane } from '../code/CodeViewPane'
import { InteractiveEmptyState } from './InteractiveEmptyState'
import { PlanningPreview } from '../planning'
import { CanvasBoard } from './CanvasBoard'

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

type PreviewStageProps = {
  viewMode: ViewMode
  projectId?: string
  userId?: string
  files: File[]
  onRefresh?: () => void
  getToken?: () => Promise<string | null>
  previewState: { data: { html: string } | null; loading: boolean; error: string | null }
  isPlanningMode: boolean
  hasPreview: boolean
  onPlanningSubmit?: (message: string) => void
  viewportMode: ViewportMode
  isInspectMode: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
  previewUrl: string | null
  setIframeRef: (iframe: HTMLIFrameElement) => void
  canvasPages?: Array<{ path: string; html: string }>
  currentPage?: string
  navigateToPage?: (href: string) => string | null
}

const VIEWPORT_MAX_WIDTH: Record<ViewportMode, string | undefined> = {
  desktop: undefined,
  tablet: '834px',
  mobile: '430px',
}

export function PreviewStage({ viewMode, projectId, userId, files, onRefresh, getToken, previewState, isPlanningMode, hasPreview, onPlanningSubmit, viewportMode, isInspectMode, iframeRef, previewUrl, setIframeRef, canvasPages = [], currentPage, navigateToPage }: PreviewStageProps) {
  return (
    <div className={cn('flex-1 min-h-0 min-w-0', viewMode === 'code' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto md:overflow-hidden flex items-center justify-center')}>
      {viewMode === 'code' && projectId && userId && <CodeViewPane projectId={projectId} userId={userId} files={files} onRefresh={onRefresh} getToken={getToken} />}

      {viewMode !== 'code' && (
        <>
          {previewState.loading && <InteractiveEmptyState isActive={true} />}

          {previewState.error && !previewState.loading && (
            <Card className="p-8 max-w-md w-full text-center space-y-4 border-destructive/50 bg-destructive/5 animate-fade-in">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-destructive mb-2">Terjadi Kesalahan</h3>
                <p className="text-sm text-muted-foreground">{previewState.error}</p>
              </div>
            </Card>
          )}

          {!previewState.loading && !previewState.error && isPlanningMode && <PlanningPreview className="w-full h-full" onSubmitToChat={onPlanningSubmit} />}
          {!previewState.loading && !previewState.error && !hasPreview && !isPlanningMode && <InteractiveEmptyState isActive={false} />}

          {hasPreview && !isPlanningMode && <div className={cn('h-full w-full', viewMode !== 'canvas' && 'hidden')}><CanvasBoard active={viewMode === 'canvas'} pages={canvasPages.length ? canvasPages : previewUrl ? [{ path: currentPage || 'index.html', html: previewState.data?.html || '' }] : []} currentPage={currentPage} viewportMode={viewportMode} isInspectMode={isInspectMode} iframeRef={iframeRef} setIframeRef={setIframeRef} onSelectPage={(path) => navigateToPage?.(`/${path}`)} /></div>}

          {hasPreview && !isPlanningMode && (
            <div className="preview-content w-full h-full bg-muted dark:bg-muted flex items-center justify-center" style={{ display: viewMode === 'preview' ? undefined : 'none' }}>
              <div className={cn('w-full h-full transition-all animate-fade-in', viewportMode === 'mobile' && 'max-w-[430px]', viewportMode === 'tablet' && 'max-w-[834px]', isInspectMode && 'cursor-crosshair')} style={{ maxWidth: VIEWPORT_MAX_WIDTH[viewportMode] || '100%' }}>
                <iframe
                  ref={iframeRef}
                  key={`${previewUrl}-${viewportMode}`}
                  title="AI Website Preview"
                  className={cn('preview-iframe w-full h-full border-0 bg-background dark:bg-background', isInspectMode && 'cursor-crosshair')}
                  src={previewUrl ?? 'about:blank'}
                  sandbox="allow-same-origin allow-scripts allow-forms"
                  onLoad={() => {
                    if (iframeRef.current) setIframeRef(iframeRef.current)
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
