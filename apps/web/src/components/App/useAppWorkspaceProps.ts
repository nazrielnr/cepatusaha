import { useCallback } from 'react'
import type { ElementData } from '@/hooks/useInspectMode'

type UseAppWorkspacePropsOptions = {
  appState: any
  chatState: any
  previewState: any
  userId?: string
  requireToken: () => Promise<string>
  handlePublishRequest: () => void
  handleHtmlUpdate: (html: string) => Promise<void>
}

export function useAppWorkspaceProps({ appState, chatState, previewState, userId, requireToken, handlePublishRequest, handleHtmlUpdate }: UseAppWorkspacePropsOptions) {
  const handleInspectAskAI = useCallback((_elementData: ElementData) => {
    // ponytail: element context plumbing paused; wire into chat composer when Ask AI UX returns
  }, [])

  return {
    sessions: appState.sessions,
    activeSessionId: appState.activeSessionId,
    currentSession: appState.currentSession,
    initialized: appState.initialized,
    isSessionLoading: appState.isSessionLoading,
    messages: chatState.messages,
    isTyping: chatState.isTyping,
    isStreaming: chatState.isStreaming,
    onStopStreaming: chatState.stopStreaming,
    isGenerating: previewState.isGeneratingPreview,
    onSubmit: chatState.handleUserSubmit,
    inputValue: chatState.inputValue,
    onInputChange: chatState.setInputValue,
    inputDisabled: previewState.isGeneratingPreview || appState.isPublishing,
    currentMode: chatState.currentMode,
    selectedModelId: chatState.selectedModelId,
    onModelChange: chatState.setSelectedModelId,
    previewState: {
      data: previewState.previewHtml ? { html: previewState.previewHtml, generatedCopy: null, layoutBlueprint: null } : null,
      loading: previewState.previewLoading,
      error: previewState.previewError,
    },
    layoutBlueprint: chatState.layoutBlueprint,
    isPublishing: appState.isPublishing,
    onPublishRequest: handlePublishRequest,
    onInspectAskAI: handleInspectAskAI,
    onHtmlUpdate: handleHtmlUpdate,
    previewProgress: previewState.previewProgress,
    previewStatus: previewState.previewStatus,
    sessionId: appState.activeSessionId ?? undefined,
    getToken: requireToken,
    projectId: chatState.currentProjectId ?? appState.currentSession?.project_id ?? undefined,
    userId,
    files: previewState.projectFiles,
    projectName: appState.currentSession?.title || 'Proyek Baru',
    projectSubtitle: appState.profileDraft?.businessName || 'Website Builder',
    onRefresh: previewState.handleManualRefresh,
    fileTreeRefreshTrigger: previewState.fileTreeRefreshTrigger,
    highlightedFilePaths: previewState.highlightedFilePaths,
    streamingFiles: previewState.streamingFiles,
    onStreamingFileSelect: (file: any) => {
          },
    pageBlobMappings: previewState.pageBlobMappings,
    currentPage: previewState.currentPage,
    navigateToPage: previewState.navigateToPage,
  }
}
