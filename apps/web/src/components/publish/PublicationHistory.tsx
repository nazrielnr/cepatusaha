/* eslint-disable react-hooks/exhaustive-deps */
import { CalendarDays, ExternalLink, Globe2, Loader2, RefreshCcw, Trash2, X } from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import type { PublicationRecord } from '@/types/publication'

type PublicationHistoryProps = {
  loading: boolean
  error: string | null
  records: PublicationRecord[]
  onRefresh: () => Promise<void>
  onClose?: () => void
  onDelete?: (publicationId: string) => Promise<void>
}

const publicationDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatPublishedAt(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return publicationDateFormatter.format(date)
}

function extractDomain(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.hostname
  } catch {
    return value
  }
}

export function PublicationHistory({ loading, error, records, onRefresh, onClose, onDelete }: PublicationHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const handleDeleteClick = (publicationId: string) => {
    setDeleteTargetId(publicationId)
    setDeleteConfirmText('')
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!onDelete || !deleteTargetId) return

    try {
      setDeletingId(deleteTargetId)
      setDeleteDialogOpen(false)
      await onDelete(deleteTargetId)
      await onRefresh() // Refresh list after deletion
    } catch (error) {
      console.error('Failed to delete publication', error)
      alert('Gagal menghapus publikasi. Silakan coba lagi.')
    } finally {
      setDeletingId(null)
      setDeleteTargetId(null)
      setDeleteConfirmText('')
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
    setDeleteConfirmText('')
  }

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation with slight delay for smooth entry
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    if (!onClose) return

    // Start exit animation
    setIsVisible(false)

    // Wait for animation to complete before unmounting
    setTimeout(() => {
      onClose()
    }, 200) // Match animation duration
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleteDialogOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [deleteDialogOpen, onClose])

  return (
    <>
      {/* Glassmorphism Backdrop */}
      <div
        className={`fixed inset-0 z-[70] bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[71] flex items-center justify-center p-2 md:p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-label="Riwayat publikasi"
      >
        {/* Content */}
        <div
          className={`relative w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden rounded-xl md:rounded-2xl border-2 border-border bg-card shadow-xl pointer-events-auto transition-all duration-200 ease-in-out ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
        {/* Header with actions - aligned with cards below */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Riwayat Publikasi</h2>
            <p className="text-sm text-muted-foreground">Jejak publikasi toko-link Anda.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Memuat…</span>
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Segarkan</span>
                </>
              )}
            </Button>

            {onClose && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleClose}
                aria-label="Tutup riwayat publikasi"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat riwayat…</span>
          </div>
        )}

        {records.length === 0 && !loading ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada publikasi.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ maxHeight: 'calc(85vh - 180px)' }}>
            <div className="space-y-3">
              {records.map((record) => {
                  const publishedAt = formatPublishedAt(record.publishedAt)
                  const domain = extractDomain(record.publicUrl) ?? 'Domain tidak tersedia'
                  const displayTitle = record.sessionTitle || 'Publikasi Website'

          return (
                    <Card
                      key={record.id}
                      className="w-full space-y-3 overflow-hidden border-2 border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
                        <h3 className="text-base font-semibold text-foreground break-words">
                          {displayTitle}
                        </h3>
                      </div>

                      {record.publicUrl && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain</p>

                          <Button
                            asChild
                            variant="outline"
                            className="h-auto w-full justify-between gap-2 md:gap-3 rounded-lg border-primary/30 bg-primary/5 px-2 py-2 md:px-3 text-xs md:text-sm font-medium text-primary hover:bg-primary/10"
                          >
                            <a
                              href={record.publicUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex w-full items-center justify-between gap-2 md:gap-3 overflow-hidden"
                            >
                              <span className="flex min-w-0 items-center gap-1.5 md:gap-2 overflow-hidden">
                                <Globe2 className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                                <span className="truncate text-left">{domain}</span>
                              </span>
                              <ExternalLink className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                            </a>
                          </Button>

                          {publishedAt && (
                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground/80">
                              <CalendarDays className="h-3 w-3 shrink-0" />
                              <span>{publishedAt}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {onDelete && (
                        <div className="pt-2 border-t border-border/50">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full gap-2 text-xs md:text-sm"
                            onClick={() => handleDeleteClick(record.id)}
                            disabled={deletingId === record.id}
                          >
                            {deletingId === record.id ? (
                              <>
                                <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                                <span>Menghapus...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                <span>Hapus Publikasi</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </Card>
                  )
              })}
            </div>
          </div>
        )}
      </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle>Konfirmasi Hapus Publikasi</AlertDialogTitle>
            <AlertDialogDescription>
              Website akan dihapus secara permanen dari CepatUsaha dan tidak dapat dikembalikan.
            </AlertDialogDescription>
            <div className="space-y-2 text-left">
              <Label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
                Ketik <span className="font-bold text-destructive">hapus</span> untuk mengkonfirmasi:
              </Label>
              <Input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Ketik 'hapus'"
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText.toLowerCase() !== 'hapus'}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hapus Publikasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
