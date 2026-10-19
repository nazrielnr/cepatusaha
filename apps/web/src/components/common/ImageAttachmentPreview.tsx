import React, { useEffect, useMemo } from 'react'
import { X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageAttachmentPreviewProps {
  images: File[]
  onRemove: (index: number) => void
  disabled?: boolean
  className?: string
  compact?: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ImageAttachmentPreview: React.FC<ImageAttachmentPreviewProps> = ({
  images,
  onRemove,
  disabled = false,
  className,
  compact = false,
}) => {
  // Generate and manage object URLs cleanly without memory leaks
  const previewUrls = useMemo(() => {
    return images.map((file) => URL.createObjectURL(file))
  }, [images])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  if (images.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {images.map((image, index) => {
        const url = previewUrls[index]
        return (
          <div
            key={`${image.name}-${image.size}-${index}`}
            className={cn(
              'group relative flex items-center gap-2 rounded-xl border border-border/80 bg-muted/60 dark:bg-muted/30 p-1.5 shadow-2xs backdrop-blur-xs transition-all hover:border-primary/40 hover:bg-muted/90',
              compact ? 'text-xs' : 'text-xs'
            )}
          >
            {/* Thumbnail */}
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-background/80">
              {url ? (
                <img
                  src={url}
                  alt={image.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to icon on error
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 max-w-[130px] sm:max-w-[180px] flex-col pr-1">
              <span className="truncate font-medium text-foreground text-[11px] sm:text-xs" title={image.name}>
                {image.name}
              </span>
              <span className="text-[10px] text-muted-foreground">{formatFileSize(image.size)}</span>
            </div>

            {/* Remove button */}
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation()
                onRemove(index)
              }}
              className="rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/15 hover:text-destructive focus:outline-hidden disabled:pointer-events-none cursor-pointer"
              aria-label={`Hapus ${image.name}`}
              title="Hapus gambar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
