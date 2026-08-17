import { FileText, Network, Palette, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PreviewToolbarProps } from './PreviewToolbar.types'

const tabs = [
  ['prd', 'PRD', FileText],
  ['sitemap', 'Sitemap', Network],
  ['design', 'Design', Palette],
  ['seo', 'SEO', Search],
] as const

export function PlanningPreviewToolbar({ planningPhase, planningData, activePlanningTab, setActiveTab, handleGenerate, isGenerating }: PreviewToolbarProps) {
  const ready = planningPhase === 'review' && planningData

  return (
    <div className="h-14 px-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground dark:text-foreground leading-none">
            {ready ? planningData.business_info.name || 'Planning Mode' : 'Planning Mode'}
          </span>
          {ready && (
            <span className="text-xs text-muted-foreground dark:text-muted-foreground uppercase tracking-wide">
              {planningData.business_info.category}
            </span>
          )}
        </div>
      </div>

      {ready && (
        <div className="flex items-center gap-1 bg-muted dark:bg-muted p-1 rounded-lg border border-border dark:border-border">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                activePlanningTab === id
                  ? 'bg-background dark:bg-background text-foreground dark:text-foreground shadow-sm'
                  : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {ready && (
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all',
            'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Sparkles className={cn('w-4 h-4', isGenerating && 'animate-spin')} />
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      )}
    </div>
  )
}
