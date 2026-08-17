import React, { useEffect, useState } from 'react'
import { Globe, MoreHorizontal, Trash2 } from 'lucide-react'
import { getCachedThumbnail } from '@/utils/thumbnailCache'
import { handleProjectCardHover, cancelPrefetch } from '@/utils/prefetch'
import { useAuth } from '@clerk/clerk-react'

export interface ProjectCardProps {
  session: {
    id: string
    title: string
    updatedAt: string
    previewThumbnail?: string
  }
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

export function ProjectCard({ session, onSelect, onDelete }: ProjectCardProps) {
  const { getToken } = useAuth()
  const [thumbnail, setThumbnail] = useState<string | undefined>(session.previewThumbnail)
  const [activeMenu, setActiveMenu] = useState(false)

  useEffect(() => {
    if (!session.previewThumbnail) {
      const cached = getCachedThumbnail(session.id)
      if (cached) {
        setThumbnail(cached)
      }
    } else {
      setThumbnail(session.previewThumbnail)
    }
  }, [session.id, session.previewThumbnail])

  const handleClick = () => {
    onSelect(session.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(session.id)
    setActiveMenu(false)
  }

  const handleMouseEnter = () => {
    if (getToken) {
      handleProjectCardHover(session.id, async () => {
        const token = await getToken()
        if (!token) throw new Error('No token available')
        return token
      })
    }
  }

  const handleMouseLeave = () => {
    cancelPrefetch(session.id)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Baru saja'
      if (diffMins < 60) return `${diffMins}m lalu`
      if (diffHours < 24) return `${diffHours}j lalu`
      if (diffDays < 7) return `${diffDays}h lalu`
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    } catch {
      return 'Baru saja'
    }
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col h-[240px] bg-card rounded-xl border border-border transition-all duration-300 cursor-pointer ${activeMenu ? 'z-30 shadow-lg shadow-foreground/5 border-primary/30' : ''}`}
    >
      {/* Thumbnail Section */}
      <div className="w-full h-[140px] bg-muted relative overflow-hidden border-b border-border rounded-t-[11px]">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={session.title}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col p-3 bg-muted/50 relative overflow-hidden">
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-[0.3]" />
            
            {/* Mock webpage illustration inside */}
            <div className="w-full flex-1 rounded border border-border bg-card shadow-sm p-2 flex flex-col gap-1.5 transform rotate-1 translate-y-1 scale-[0.98] group-hover:rotate-0 transition-all duration-500">
              {/* Mock header */}
              <div className="flex items-center justify-between border-b border-border pb-1">
                <div className="w-8 h-2 bg-muted-foreground/30 rounded-sm" />
                <div className="flex gap-1">
                  <div className="w-4 h-1.5 bg-muted-foreground/20 rounded-sm" />
                  <div className="w-4 h-1.5 bg-muted-foreground/20 rounded-sm" />
                </div>
              </div>
              {/* Mock hero section */}
              <div className="flex-1 rounded bg-muted border border-border/50 flex flex-col items-center justify-center p-2 text-center gap-1">
                <div className="w-12 h-2.5 bg-muted-foreground/30 rounded-sm mx-auto" />
                <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-sm mx-auto" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Body */}
      <div className="p-4 flex flex-col justify-between flex-1 min-h-0">
        <div className="flex items-start justify-between mb-1 relative">
          <h3 className="font-semibold text-sm text-foreground truncate pr-2 flex-1 group-hover:text-primary transition-colors" title={session.title}>
            {session.title}
          </h3>

          {/* Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setActiveMenu(!activeMenu)
              }}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Menu opsi proyek"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {activeMenu && (
              <>
                <div
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(false); }}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-card rounded-lg shadow-xl shadow-foreground/10 border border-border z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2"
                    onClick={handleClick}
                  >
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Buka
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>{formatDate(session.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
