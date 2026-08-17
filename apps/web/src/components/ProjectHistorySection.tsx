import { Sparkles, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ProjectCard } from './ProjectCard'
import { Modal } from './Modal'

interface ProjectHistorySectionProps {
  sessions: Array<{
    id: string
    title: string
    updatedAt: string
    previewThumbnail?: string
  }>
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onRefresh?: () => Promise<void>
}

export function ProjectHistorySection({
  sessions,
  onSelectSession,
  onDeleteSession,
  isLoading = false,
}: ProjectHistorySectionProps & { isLoading?: boolean }) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const INITIAL_DISPLAY = 11 // 11 projects + 1 "New Project" card = 12 cards (3x4 grid)
  const displayedSessions = sessions.slice(0, INITIAL_DISPLAY)
  const hasMore = sessions.length > INITIAL_DISPLAY

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
    <section className="w-full">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">
          Proyek Terkini
        </h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-300 shadow-sm flex items-center gap-1"
          >
            Lihat Semua ({sessions.length})
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[240px] rounded-xl overflow-hidden animate-pulse border border-border bg-card">
              <div className="h-full bg-muted" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 px-4">
          <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Belum ada proyek</p>
          <p className="text-muted-foreground/70 text-sm mt-2">Mulai percakapan untuk membuat proyek pertama Anda</p>
        </div>
      ) : (
        <>
          {/* Project Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* New Project Card */}
            <button
              type="button"
              className="group flex flex-col h-[240px] rounded-xl border border-dashed border-border bg-background/40 hover:bg-background transition-all duration-300 cursor-pointer p-5 items-center justify-center text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mb-3 group-hover:bg-muted transition-all duration-300 shadow-sm">
                <Plus className="w-6 h-6 text-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground">Proyek Baru</span>
              <span className="text-xs text-muted-foreground mt-1 max-w-[150px] leading-relaxed">Mulai buat website baru dari nol</span>
            </button>

            {displayedSessions.map((session) => (
              <ProjectCard
                key={session.id}
                session={session}
                onSelect={onSelectSession}
                onDelete={onDeleteSession}
              />
            ))}
          </div>

          {/* Project History Modal */}
          <Modal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            title="Riwayat Proyek"
          >
            <div className="p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id)
                    setIsHistoryModalOpen(false)
                  }}
                  className="flex items-center justify-between p-3 bg-card hover:bg-muted rounded-xl border border-border transition-all cursor-pointer group"
                >
                  {/* Left Side: Thumbnail & Title Info */}
                  <div className="flex items-center min-w-0">
                    <div className="w-14 h-9 rounded-lg bg-muted overflow-hidden relative flex items-center justify-center border border-border flex-shrink-0">
                      {session.previewThumbnail ? (
                        <img
                          src={session.previewThumbnail}
                          alt={session.title}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col p-1.5 bg-muted/50 relative overflow-hidden">
                          <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-[0.3]" />
                          <div className="w-full flex-1 rounded-[3px] border border-border bg-card p-0.5 flex flex-col gap-0.5">
                            <div className="flex justify-between border-b border-border pb-0.5">
                              <div className="w-4 h-0.5 bg-muted-foreground/30 rounded-sm" />
                            </div>
                            <div className="flex-1 rounded-[2px] bg-muted border border-border/50 flex flex-col items-center justify-center">
                              <div className="w-5 h-1 bg-muted-foreground/30 rounded-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={session.title}>
                        {session.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        Diedit {formatDate(session.updatedAt)} • {session.id.substring(0, 8)}.cepatusaha.ai
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Quick Action buttons */}
                  <div className="flex items-center gap-1.5 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id)
                        setIsHistoryModalOpen(false)
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        </>
      )}
    </section>
  )
}
