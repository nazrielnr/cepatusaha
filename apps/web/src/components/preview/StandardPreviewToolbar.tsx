import { Monitor, MousePointerClick, RefreshCw, Smartphone, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewModeToggle } from '../ViewModeToggle'
import type { PreviewToolbarProps } from './PreviewToolbar.types'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export function StandardPreviewToolbar({
  viewMode,
  setViewMode,
  viewportMode,
  setInternalViewportMode,
  toggleInspectMode,
  hasPreview,
  isInspectMode,
  onRefresh,
  handleRefresh,
  isRefreshing,
  onPublishRequest,
  canPublish,
  isPublishing,
  pagePaths = [],
  currentPage,
  navigateToPage,
}: PreviewToolbarProps) {
  return (
    <div className="h-14 px-4 flex items-center justify-between relative">
      <div className="flex items-center gap-3 shrink-0">
        <ViewModeToggle activeMode={viewMode} onModeChange={setViewMode} />
        <div className="h-6 w-px bg-border dark:bg-border" />
        <div className={cn('flex items-center gap-1', viewMode === 'code' && 'opacity-40 pointer-events-none')} role="group" aria-label="Device viewport selection">
          <button onClick={() => setInternalViewportMode('desktop')} className={cn('h-9 w-9 flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/10', viewportMode === 'desktop' ? 'bg-muted dark:bg-muted text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/50')} title="Desktop View" aria-label="Switch to desktop view" aria-pressed={viewportMode === 'desktop'}>
            <Monitor className="w-4 h-4" aria-hidden="true" />
          </button>
          <button onClick={() => setInternalViewportMode('mobile')} className={cn('h-9 w-9 flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/10', viewportMode === 'mobile' ? 'bg-muted dark:bg-muted text-foreground dark:text-foreground' : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/50')} title="Mobile View" aria-label="Switch to mobile view" aria-pressed={viewportMode === 'mobile'}>
            <Smartphone className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          {onRefresh && (
            <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center justify-center h-9 w-9 rounded-lg transition-all text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/10" aria-label={isRefreshing ? 'Memuat ulang preview' : 'Muat ulang preview'} aria-busy={isRefreshing} title="Refresh">
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} aria-hidden="true" />
            </button>
          )}

          {pagePaths.length > 1 && viewMode !== 'code' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative group flex items-center h-9 pl-4 pr-9 rounded-full border border-border bg-background text-sm font-medium text-foreground outline-none transition-colors duration-300 hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-ring cursor-pointer"
                  aria-label="Pilih halaman preview"
                >
                  <span className="truncate max-w-[150px]">{currentPage ?? pagePaths[0]}</span>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground transition-colors duration-300 group-hover:text-accent-foreground">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[180px] z-50">
                {pagePaths.map((path) => (
                  <DropdownMenuItem
                    key={path}
                    onClick={() => navigateToPage?.(`/${path}`)}
                    className={cn("cursor-pointer", currentPage === path && "bg-accent text-accent-foreground")}
                  >
                    {path}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            onClick={toggleInspectMode}
            disabled={!hasPreview || viewMode === 'code'}
            className={cn(
              'flex items-center justify-center h-9 w-9 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/10',
              isInspectMode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground hover:bg-muted/50 dark:hover:bg-muted/50',
              (!hasPreview || viewMode === 'code') && 'opacity-50 cursor-not-allowed'
            )}
            aria-label={isInspectMode ? 'Matikan editor elemen' : 'Nyalakan editor elemen'}
            aria-pressed={isInspectMode}
            title="Edit Mode"
          >
            <MousePointerClick className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onPublishRequest} disabled={!canPublish} className={cn('flex items-center justify-center gap-2 h-9 px-3.5 text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2', 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20', 'disabled:opacity-50 disabled:cursor-not-allowed')} aria-label={isPublishing ? 'Publishing website' : 'Deploy website'} aria-busy={isPublishing}>
          <Sparkles className={cn('w-4 h-4', isPublishing && 'animate-spin')} aria-hidden="true" />
          <span className="hidden sm:inline">{isPublishing ? 'Publishing...' : 'Deploy'}</span>
        </button>
      </div>
    </div>
  )
}
