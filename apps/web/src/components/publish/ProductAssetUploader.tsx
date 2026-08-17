import { useState } from 'react'
import { uploadProductImage } from '@/api/assets'

type ProductAssetUploaderProps = {
  userId: string
  getToken: () => Promise<string | null>
}

export function ProductAssetUploader({ userId, getToken }: ProductAssetUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessage(null)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Sesi tidak valid. Silakan masuk kembali.')
      const url = await uploadProductImage(userId, file, token)
      setMessage(`Berhasil diunggah: ${url}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <section className="panel-section" aria-label="Unggah aset produk">
      <div className="panel-header">
        <div>
          <h2>Unggah Aset Produk</h2>
          <p>Simpen gambar atau aset lain untuk dipakai di halaman Anda.</p>
        </div>
      </div>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p className="feedback info">Mengunggah…</p>}
      {message && <p className="feedback info">{message}</p>}
      {error && <p className="feedback error">{error}</p>}
    </section>
  )
}
