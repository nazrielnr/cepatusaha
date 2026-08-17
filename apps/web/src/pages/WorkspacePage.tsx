import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChatPanel } from '@/components/chat/ChatPanel'
import type { ComposerReplyContext } from '@/components/chat/ChatComposer'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { MobileToggleBar } from '@/components/MobileToggleBar'
import { ResizablePanels } from '@/components/ResizablePanels'
import type { ChatMessage, ChatMode } from '@/types/chat'
import type { PreviewResponse, LayoutBlueprint, File } from '@/types/preview'
import type { SessionData } from '@/types/session'
import type { ElementData } from '@/hooks/useInspectMode'
import type { StreamingFile } from '@/components/code/StreamingFileTree'

interface WorkspacePageProps {
  // Session data
  sessions: Array<{ id: string; title: string }>
  activeSessionId: string | null
  currentSession?: SessionData | null
  isSessionLoading?: boolean

  // Chat props
  messages: ChatMessage[]
  isTyping: boolean
  isGenerating: boolean
  onSubmit: (message: string, mode: ChatMode, modelId?: string, planMode?: boolean, images?: globalThis.File[]) => void
  inputValue: string
  onInputChange: (value: string) => void
  inputDisabled: boolean
  isStreaming?: boolean
  onStopStreaming?: () => void
  currentMode: ChatMode
  selectedModelId?: string
  onModelChange?: (modelId: string) => void

  // Preview props
  previewState: {
    data: PreviewResponse | null
    loading: boolean
    error: string | null
  }
  layoutBlueprint: LayoutBlueprint | null
  isPublishing: boolean
  onPublishRequest: () => void
  onInspectAskAI?: (elementData: ElementData) => void
  onHtmlUpdate?: (html: string) => void
  previewProgress?: number
  previewStatus?: string
  sessionId?: string
  getToken?: () => Promise<string | null>
  projectId?: string
  userId?: string
  files?: File[]
  onRefresh?: () => void
  fileTreeRefreshTrigger?: number
  highlightedFilePaths?: string[]
  streamingFiles?: StreamingFile[]
  onStreamingFileSelect?: (file: StreamingFile) => void
  projectName?: string
  projectSubtitle?: string
  navigateToPage?: (href: string) => string | null
  pageBlobMappings?: { path: string; content?: string }[]
  currentPage?: string

  // Checkpoint props - TEMPORARILY DISABLED
}

export default function WorkspacePage({
  sessions,
  activeSessionId,
  currentSession,
  isSessionLoading = false,
  messages,
  isTyping,
  isGenerating,
  onSubmit,
  inputValue,
  onInputChange,
  inputDisabled,
  isStreaming,
  onStopStreaming,
  currentMode,
  selectedModelId,
  onModelChange,
  previewState,
  layoutBlueprint,
  isPublishing,
  onPublishRequest,
  onInspectAskAI,
  onHtmlUpdate,
  previewProgress,
  previewStatus,
  sessionId,
  getToken,
  projectId,
  userId,
  files = [],
  onRefresh,
  fileTreeRefreshTrigger,
  highlightedFilePaths = [],
  streamingFiles = [],
  onStreamingFileSelect,
  projectName = 'My Website',
  projectSubtitle = 'Website Builder',
  navigateToPage,
  pageBlobMappings = [],
  currentPage,
  // checkpointState, // TEMPORARILY DISABLED
}: WorkspacePageProps) {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [mobileView, setMobileView] = useState<'chat' | 'preview'>('chat')
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [replyContext, setReplyContext] = useState<ComposerReplyContext | null>(null)

  const handleInspectAskAI = (element: ElementData) => {
    setReplyContext({
      title: `${element.tag.toLowerCase()} Selected`,
      subtitle: element.classes || 'no class',
      body: element.text || element.currentSrc || undefined,
    })
    onInspectAskAI?.(element)
    setMobileView('chat')
  }

  // Validate session ID
  const currentSessionId = urlSessionId || activeSessionId || sessionId
  const sessionExists = sessions.some((s) => s.id === currentSessionId) || currentSession?.id === currentSessionId

  // Handle invalid session ID using effect to avoid state updates during render
  useEffect(() => {
    if (!currentSessionId || isSessionLoading) {
      if (sessionError) {
        setSessionError(null)
      }
      return
    }

    if (!sessionExists) {
      setSessionError('Session not found. Redirecting to home...')
      const timeout = setTimeout(() => {
    navigate('/', { replace: true })
      }, 800) // Reduced from 1500ms to 800ms
      return () => clearTimeout(timeout)
    }

    if (sessionError) {
      setSessionError(null)
    }
  }, [currentSessionId, isSessionLoading, sessionExists, navigate, sessionError])

  if (sessionError) {
    // Show clean error UI while redirecting
    return (
      <div className="h-screen flex items-center justify-center bg-brand-surface">
        <div className="text-center p-8 max-w-md mx-4">
          {/* Error icon */}
          <div className="mb-6 inline-block">
            <div className="bg-destructive p-6 rounded-2xl border border-destructive">
              <svg className="w-12 h-12 mx-auto text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Error message */}
          <h2 className="text-xl font-semibold text-brand-primary mb-3">
            Sesi Tidak Ditemukan
          </h2>
          <p className="text-brand-secondary mb-6 leading-relaxed">
            Sesi yang Anda cari tidak ada atau telah dihapus. Anda akan diarahkan ke halaman utama.
          </p>

          {/* Redirect indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-brand-secondary">
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  // Calculate if publish is available
  const canPublish = Boolean(previewState.data) && !previewState.loading && !isPublishing && !isGenerating

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-surface">
      {/* Desktop: Side-by-side layout with resizable panels */}
      <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          defaultLeftWidth={30}
          minLeftWidth={20}
          maxLeftWidth={60}
          leftPanel={
            <ChatPanel
              messages={messages}
              isTyping={isTyping}
              onSubmit={onSubmit}
              inputValue={inputValue}
              onInputChange={onInputChange}
              inputDisabled={inputDisabled}
              isStreaming={isStreaming}
              onStopStreaming={onStopStreaming}
              currentMode={currentMode}
              projectName={projectName}
              projectSubtitle={projectSubtitle}
              selectedModelId={selectedModelId}
              onModelChange={onModelChange}
              replyContext={replyContext}
              onClearReplyContext={() => setReplyContext(null)}
            // checkpointState={checkpointState} // TEMPORARILY DISABLED
            />
          }
          rightPanel={
            <PreviewPanel
              previewState={previewState}
              layoutBlueprint={layoutBlueprint}
              isGenerating={isGenerating}
              isStreaming={isStreaming}
              isPublishing={isPublishing}
              onGenerateRequest={() => onSubmit('Mulai implementasi website sekarang! Buat file HTML, CSS, dan JavaScript berdasarkan planning documents (PRD, Sitemap, Design Brief, SEO Plan) yang sudah ada. Jangan buat file dokumentasi lagi, langsung coding website-nya. Mulai dari index.html sebagai homepage.', currentMode, undefined, false)}
              onPublishRequest={onPublishRequest}
              onInspectAskAI={handleInspectAskAI}
              onHtmlUpdate={onHtmlUpdate}
              previewProgress={previewProgress}
              previewStatus={previewStatus}
              sessionId={sessionId}
              getToken={getToken}
              projectId={projectId}
              userId={userId}
              files={files}
              onRefresh={onRefresh}
              fileTreeRefreshTrigger={fileTreeRefreshTrigger}
              highlightedFilePaths={highlightedFilePaths}
              streamingFiles={streamingFiles}
              onStreamingFileSelect={onStreamingFileSelect}
              onPlanningSubmit={(message) => onSubmit(message, currentMode, undefined, true)}
              onPlanningGenerate={(message) => onSubmit(message, currentMode, undefined, false)}
              navigateToPage={navigateToPage}
              pageBlobMappings={pageBlobMappings}
              currentPage={currentPage}
            />
          }
        />
      </div>

      {/* Mobile: Stacked layout with toggle */}
      <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Active Panel */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileView === 'chat' ? (
            <ChatPanel
              messages={messages}
              isTyping={isTyping}
              onSubmit={onSubmit}
              inputValue={inputValue}
              onInputChange={onInputChange}
              inputDisabled={inputDisabled}
              isStreaming={isStreaming}
              onStopStreaming={onStopStreaming}
              currentMode={currentMode}
              projectName={projectName}
              projectSubtitle={projectSubtitle}
              selectedModelId={selectedModelId}
              onModelChange={onModelChange}
              replyContext={replyContext}
              onClearReplyContext={() => setReplyContext(null)}
            // checkpointState={checkpointState} // TEMPORARILY DISABLED
            />
          ) : (
            <PreviewPanel
              previewState={previewState}
              layoutBlueprint={layoutBlueprint}
              isGenerating={isGenerating}
              isStreaming={isStreaming}
              isPublishing={isPublishing}
              onGenerateRequest={() => onSubmit('Mulai implementasi website sekarang! Buat file HTML, CSS, dan JavaScript berdasarkan planning documents (PRD, Sitemap, Design Brief, SEO Plan) yang sudah ada. Jangan buat file dokumentasi lagi, langsung coding website-nya. Mulai dari index.html sebagai homepage.', currentMode, undefined, false)}
              onPublishRequest={onPublishRequest}
              onInspectAskAI={handleInspectAskAI}
              onHtmlUpdate={onHtmlUpdate}
              previewProgress={previewProgress}
              previewStatus={previewStatus}
              sessionId={sessionId}
              getToken={getToken}
              projectId={projectId}
              userId={userId}
              files={files}
              onRefresh={onRefresh}
              fileTreeRefreshTrigger={fileTreeRefreshTrigger}
              highlightedFilePaths={highlightedFilePaths}
              streamingFiles={streamingFiles}
              onStreamingFileSelect={onStreamingFileSelect}
              isMobilePreviewMode={true}
              onPlanningSubmit={(message) => onSubmit(message, currentMode, undefined, true)}
              onPlanningGenerate={(message) => onSubmit(message, currentMode, undefined, false)}
              navigateToPage={navigateToPage}
              pageBlobMappings={pageBlobMappings}
              currentPage={currentPage}
            />
          )}
        </div>

        {/* Mobile Toggle Bar */}
        <MobileToggleBar
          mode={mobileView}
          onModeChange={setMobileView}
          onPublish={onPublishRequest}
          isPublishing={isPublishing}
          canPublish={canPublish}
          showPreviewControls={true}
        />
      </div>
    </div>
  )
}
