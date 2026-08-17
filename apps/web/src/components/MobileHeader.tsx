import { ChevronLeft, Loader2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  projectTitle: string
  isLoadingTitle?: boolean
  onBack: () => void
  onHistoryClick?: () => void
  showAuroraBackground?: boolean
}

/**
 * Mobile header with centered AI-generated project title
 * Only visible on mobile devices (< 768px)
 */
export function MobileHeader({
  projectTitle,
  isLoadingTitle = false,
  onBack,
  onHistoryClick,
  showAuroraBackground = false,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'h-16 border-b flex items-center px-4 md:hidden flex-shrink-0 transition-[background-color,border-color] duration-500',
        showAuroraBackground ? 'glass-card-dark' : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-center w-full h-full">
        {/* Back Button - Left - Vertically centered */}
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 flex items-center justify-center"
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Title - Center - Vertically centered */}
        <div className="flex-1 flex items-center justify-center px-2 min-w-0 h-full py-2">
          {isLoadingTitle ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm leading-normal">Membuat judul...</span>
            </div>
          ) : (
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-[200px] leading-[1.5] py-0.5">
              {projectTitle}
            </h1>
          )}
        </div>

        {/* Right Actions - History Button */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onHistoryClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
            aria-label="Riwayat Publikasi"
            title="Riwayat Publikasi"
          >
            <Clock className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  )
}
