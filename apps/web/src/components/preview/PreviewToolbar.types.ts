import type { ViewMode } from '../ViewModeToggle'

export type ViewportMode = 'desktop' | 'tablet' | 'mobile'

export type PreviewToolbarProps = {
  isPlanningMode: boolean
  planningPhase: string
  planningData: any
  activePlanningTab: string
  setActiveTab: (tab: any) => void
  handleGenerate: () => void
  isGenerating: boolean
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  viewportMode: ViewportMode
  setInternalViewportMode: (mode: ViewportMode) => void
  toggleInspectMode: () => void
  hasPreview: boolean
  isInspectMode: boolean
  onRefresh?: () => void
  handleRefresh: () => void
  isRefreshing: boolean
  onPublishRequest: () => void
  canPublish: boolean
  isPublishing: boolean
  pagePaths?: string[]
  currentPage?: string
  navigateToPage?: (href: string) => string | null
  canvasPages?: Array<{ path: string; html: string }>
}