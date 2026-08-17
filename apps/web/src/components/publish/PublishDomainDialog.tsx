import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '../Modal'
import { AlertCircle } from 'lucide-react'

interface PublishDomainDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (domainName: string) => void
  isPublishing: boolean
  businessName?: string
}

export function PublishDomainDialog({
  isOpen,
  onClose,
  onConfirm,
  isPublishing,
  businessName = '',
}: PublishDomainDialogProps) {
  const [domainName, setDomainName] = useState('')
  const [error, setError] = useState('')

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
    if (validateDomainName(domainName)) {
      onConfirm(domainName)
    }
  }

  const handleUseSuggestion = () => {
    setDomainName(suggestedName)
    setError('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pilih Nama Domain"
    >
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Pilih nama untuk domain website Anda. Domain akan berbentuk:
          </p>
          <div className="rounded-lg bg-muted/50 dark:bg-muted/30 px-4 py-3 font-mono text-sm">
            <span className="text-primary font-semibold">{domainName || 'nama-anda'}</span>
            <span className="text-muted-foreground">-xxxxx.vercel.app</span>
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
            disabled={isPublishing || !domainName}
          >
            {isPublishing ? 'Publishing...' : 'Publish Website'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
