import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '../Modal'
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react'
import type { PublishResponse } from '@/types/publication'

interface PublishDomainDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (domainName: string) => Promise<PublishResponse>
  isPublishing: boolean
  businessName?: string
  initialSlug?: string | null
  existingPublication?: { publicUrl: string; slug?: string | null } | null
}

export function PublishDomainDialog({
  isOpen,
  onClose,
  onConfirm,
  isPublishing,
  businessName = '',
  initialSlug,
  existingPublication,
}: PublishDomainDialogProps) {
  const [domainName, setDomainName] = useState('')
  const [error, setError] = useState('')
  const [deployed, setDeployed] = useState<PublishResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const prevOpenRef = useRef(false)

  const resolveExistingSlug = () => {
    if (existingPublication?.slug) return existingPublication.slug
    if (existingPublication?.publicUrl) {
      try {
        const hostname = new URL(existingPublication.publicUrl).hostname
        return hostname.split('.')[0]
      } catch {}
    }
    return ''
  }

  // Fresh form (and fresh success view) ONLY when the dialog transitions from closed to open.
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      const activeSlug = resolveExistingSlug() || initialSlug || ''
      setDomainName(activeSlug)
      setError('')
      setDeployed(null)
      setCopied(false)
    }
    prevOpenRef.current = isOpen
  }, [isOpen, initialSlug, existingPublication])

  // Generate suggested domain name from business name
  const suggestedName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'website'

  // Validate domain name
  const validateDomainName = (name: string): boolean => {
    if (!name || name.trim().length === 0) {
      setError('Nama domain tidak boleh kosong')
      return false
    }

    // Check format: only lowercase letters, numbers, hyphens
    const validFormat = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)
    if (!validFormat) {
      setError('Hanya huruf kecil, angka, dan tanda hubung (-) diperbolehkan')
      return false
    }

    // Check length
    if (name.length < 3) {
      setError('Nama domain minimal 3 karakter')
      return false
    }

    if (name.length > 40) {
      setError('Nama domain maksimal 40 karakter')
      return false
    }

    // Check doesn't start or end with hyphen
    if (name.startsWith('-') || name.endsWith('-')) {
      setError('Nama domain tidak boleh diawali atau diakhiri dengan tanda hubung')
      return false
    }

    setError('')
    return true
  }

  const handleInputChange = (value: string) => {
    // Convert to lowercase and remove invalid chars
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setDomainName(cleaned)
    setError('')
  }

  const handleConfirm = () => {
    const activeSlug = resolveExistingSlug()
    const targetDomain = activeSlug || domainName
    if (!existingPublication && !validateDomainName(targetDomain)) return
    void onConfirm(targetDomain)
      .then((result) => setDeployed(result))
      .catch((err: unknown) => {
        setError((err as Error)?.message || 'Publish gagal. Silakan coba lagi.')
      })
  }

  const handleCopy = () => {
    if (!deployed?.publicUrl) return
    void navigator.clipboard.writeText(deployed.publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleUseSuggestion = () => {
    setDomainName(suggestedName)
    setError('')
  }

  if (deployed?.publicUrl) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Deploy Berhasil!">
        <div className="space-y-6 p-6">
          <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                Website Anda sudah live di Vercel:
              </p>
              <a
                href={deployed.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block break-all font-mono text-sm text-primary underline underline-offset-2"
              >
                {deployed.publicUrl}
              </a>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCopy} disabled={copied}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Tersalin!' : 'Salin URL'}
            </Button>
            <Button type="button" asChild>
              <a href={deployed.publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Buka Website
              </a>
            </Button>
            <Button type="button" onClick={onClose}>
              Selesai
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingPublication ? 'Deploy Perubahan Website' : 'Pilih Nama Domain'}
    >
      <div className="space-y-6 p-6">
        {existingPublication ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Domain Terhubung</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                  Aktif
                </span>
              </div>
              <a
                href={existingPublication.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:text-primary transition-colors break-all"
              >
                <span>{existingPublication.publicUrl}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
              <p className="text-xs text-muted-foreground">
                Website ini sudah terhubung ke domain di atas. Pembaruan kode dan desain terbaru akan langsung dideploy ke domain ini.
              </p>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Pilih nama untuk website Anda. Situs akan tayang di:
              </p>
              <div className="rounded-lg bg-muted/50 dark:bg-muted/30 px-4 py-3 font-mono text-sm break-all">
                <span className="text-primary font-semibold">{domainName || 'nama-anda'}</span>
                <span className="text-muted-foreground">.vercel.app</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="domain-name">Nama Domain</Label>
                <Input
                  id="domain-name"
                  type="text"
                  value={domainName}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="contoh: tokobatik"
                  disabled={isPublishing}
                  className={error ? 'border-destructive' : ''}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {suggestedName && !domainName && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Saran berdasarkan nama bisnis:</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseSuggestion}
                    disabled={isPublishing}
                    className="text-xs"
                  >
                    Gunakan: <span className="ml-1 font-mono font-semibold">{suggestedName}</span>
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 text-sm text-foreground">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium">Tips:</p>
                  <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                    <li>Gunakan nama yang mudah diingat dan relevan dengan bisnis Anda</li>
                    <li>Hanya huruf kecil, angka, dan tanda hubung (-)</li>
                    <li>Minimal 3 karakter, maksimal 40 karakter</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPublishing}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPublishing || (!existingPublication && !domainName.trim())}
          >
            {isPublishing ? 'Mendeploy...' : existingPublication ? 'Deploy Perubahan' : 'Publish Website'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
