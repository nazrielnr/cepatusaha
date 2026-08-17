import { MessageCircle, Eye, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileToggleBarProps {
  mode: 'chat' | 'preview'
  onModeChange: (mode: 'chat' | 'preview') => void
  onPublish?: () => void
  isPublishing?: boolean
  canPublish?: boolean
  showPreviewControls?: boolean
}

/**
 * Mobile toggle bar with chat/preview toggle and publish button
 * Layout: [Chat/Preview Toggle] [Publish Button]
 * Only visible on mobile devices (< 768px)
 */
export function MobileToggleBar({
  mode,
  onModeChange,
  onPublish,
  isPublishing = false,
  canPublish = false,
  showPreviewControls = false,
}: MobileToggleBarProps) {
  return (
    <div className="h-14 min-h-[56px] border-t border-border bg-background flex items-center gap-2 px-3 md:hidden safe-area-inset-bottom">
      {/* CENTER: Chat/Preview Toggle - 44px minimum height for touch targets */}
      <div className="flex-1 flex h-11 bg-muted rounded-lg overflow-hidden">
        {/* Chat Button */}
        <button
          onClick={() => onModeChange('chat')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 transition-colors relative min-h-[44px] touch-manipulation',
            mode === 'chat'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground active:bg-transparent'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium text-sm">Chat</span>
        </button>

        {/* Preview Button */}
        <button
          onClick={() => onModeChange('preview')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 transition-colors relative min-h-[44px] touch-manipulation',
            mode === 'preview'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground active:bg-transparent'
          )}
        >
          <Eye className="w-4 h-4" />
          <span className="font-medium text-sm">Preview</span>
        </button>
      </div>

      {/* RIGHT: Publish Button - Only in Preview Mode - 44px minimum height */}
      {showPreviewControls && mode === 'preview' && onPublish && (
        <button
          onClick={onPublish}
          disabled={!canPublish}
          className={cn(
            'h-11 min-h-[44px] px-4 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg',
            'active:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-sm transition-all touch-manipulation'
          )}
        >
          <Sparkles className={cn('w-4 h-4', isPublishing && 'animate-spin')} />
          <span className="text-sm font-medium whitespace-nowrap">
            {isPublishing ? 'Publishing...' : 'Publish'}
          </span>
        </button>
      )}
    </div>
  )
}
