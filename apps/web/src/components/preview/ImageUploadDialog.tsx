import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Link, Loader2, AlertCircle } from 'lucide-react'
import type { ImageUploadSource } from '@/types/preview'
import { apiPathUrl } from '@/lib/apiClient'

interface ImageUploadDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (imageUrl: string, source: ImageUploadSource) => Promise<void>
  currentImageUrl?: string
  elementInfo: string
  sessionId?: string
  getToken?: () => Promise<string | null>
}

export function ImageUploadDialog({
  open,
  onClose,
  onConfirm,
  currentImageUrl,
  elementInfo,
  sessionId,
  getToken
}: ImageUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      setFile(null)
      setPreviewUrl(null)
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB')
      setFile(null)
      setPreviewUrl(null)
      return
    }

    setFile(selectedFile)
    setError(null)

    // Generate preview
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleConfirm = async () => {
    setUploading(true)
    setError(null)

    try {
      if (activeTab === 'url') {
        // URL direct
        if (!urlInput.trim()) {
          throw new Error('URL gambar tidak boleh kosong')
        }

        // Basic URL validation
        try {
          new URL(urlInput.trim())
        } catch {
          throw new Error('URL tidak valid')
        }

        await onConfirm(urlInput.trim(), 'url')
      } else {
        // Upload file
        if (!file) {
          throw new Error('Pilih file gambar terlebih dahulu')
        }

        // Check if session ID is provided
        if (!sessionId) {
          throw new Error('Session tidak ditemukan. Buat preview terlebih dahulu.')
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('sessionId', sessionId)

        // Send old image URL for cleanup
        if (currentImageUrl) {
          formData.append('oldImageUrl', currentImageUrl)
        }

        if (!getToken) {
          throw new Error('Authentication tidak tersedia. Silakan refresh halaman.')
        }

        // Get Clerk session token
        const token = await getToken()
        if (!token) {
          throw new Error('Authentication token tidak ditemukan. Silakan login kembali.')
        }


        const response = await fetch(apiPathUrl('/images/upload'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Gagal mengupload gambar' }))
          throw new Error(errorData.message || 'Gagal mengupload gambar')
        }

        const { imageUrl } = await response.json()
        await onConfirm(imageUrl, 'upload')
      }

      // Reset form
      setUrlInput('')
      setFile(null)
      setPreviewUrl(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setUrlInput('')
      setFile(null)
      setPreviewUrl(null)
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Gambar</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Element: <code className="font-mono bg-muted px-1 py-0.5 rounded">{elementInfo}</code>
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'url' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <Link className="w-4 h-4 mr-2" />
              URL Gambar
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL Gambar</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={uploading}
              />
            </div>
            {currentImageUrl && (
              <div className="p-3 bg-muted/50 dark:bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-1">Gambar saat ini:</p>
                <p className="text-xs text-muted-foreground break-all font-mono">{currentImageUrl}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Klik untuk pilih gambar
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maks 5MB • JPG, PNG, GIF, WebP, SVG
                </p>
              </label>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview:</p>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/50 dark:bg-muted/30">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive border border-destructive rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={uploading || (activeTab === 'url' && !urlInput.trim()) || (activeTab === 'upload' && !file)}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Gambar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
