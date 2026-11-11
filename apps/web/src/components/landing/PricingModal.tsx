import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Crown, X, Zap } from 'lucide-react'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

// Limits mirror workers/src/features/plan/pricing.js (PLAN_DEFAULTS).
// TODO: PRO_PRICE_IDR is a placeholder — set the real price before launch.
const PRO_PRICE_IDR = 49_000

const idr = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

// 1 build ≈ 20–60K token (lihat pricing.js), dipakai untuk estimasi jumlah website.
const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Coba bikin website bisnismu, tanpa biaya',
    price: 'Rp 0',
    period: 'selamanya',
    badge: undefined as string | undefined,
    features: ['200.000 token / bulan', '≈ 3–10 build website / bulan', '10 permintaan / menit', 'Publikasi website'],
    cta: 'Mulai Gratis',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Untuk UMKM & kreator yang aktif berkembang',
    price: idr(PRO_PRICE_IDR),
    period: '/ bulan',
    badge: 'Paling Populer',
    features: [
      '2.000.000 token / bulan',
      '≈ 33–100 build website / bulan',
      '60 permintaan / menit',
      'Publikasi website',
      'Prioritas kecepatan lebih tinggi',
    ],
    cta: 'Upgrade ke Pro',
  },
  {
    id: 'business',
    name: 'Bisnis',
    tagline: 'Untuk agensi & tim dengan kebutuhan besar',
    price: 'Custom',
    period: 'sesuai kebutuhan',
    badge: undefined as string | undefined,
    features: ['Kuota token khusus', 'Limit permintaan khusus', 'Bantuan onboarding', 'Dukungan langsung'],
    cta: 'Hubungi kami',
  },
]

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      const t = setTimeout(() => setIsVisible(true), 20)
      return () => clearTimeout(t)
    }
    setIsVisible(false)
    setNotice(null)
    const t = setTimeout(() => setShouldRender(false), 250)
    return () => clearTimeout(t)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-250 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        className={`relative z-10 my-auto w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-background text-foreground rounded-2xl sm:rounded-3xl border-2 border-border shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-5 sm:px-8 pt-8 pb-6 text-center">
          <h2 id="pricing-modal-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pilih paket yang pas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mulai gratis, upgrade saat bisnismu butuh lebih banyak kapasitas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 px-5 sm:px-8 pb-6">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                p.badge ? 'border-primary shadow-lg shadow-primary/10 bg-primary/[0.03]' : 'border-border bg-card'
              }`}
            >
              {p.badge && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1">
                  <Crown className="w-3 h-3" /> {p.badge}
                </span>
              )}
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-lg">{p.name}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {p.id === 'free' ? (
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/auth?mode=sign-up') }}
                  className="mt-6 h-10 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors cursor-pointer"
                >
                  {p.cta}
                </button>
              ) : p.id === 'business' ? (
                <a
                  href="mailto:hello@cepatusaha.ai?subject=Paket%20Bisnis%20CepatUsaha"
                  className="mt-6 h-10 inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
                >
                  {p.cta}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setNotice('Terima kasih! Paket Pro segera dibuka. Kami kabari begitu pembayaran tersedia.')}
                  className="mt-6 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors cursor-pointer"
                >
                  {p.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {notice && (
          <p role="status" className="mx-5 sm:mx-8 mb-4 rounded-lg bg-primary/10 text-primary text-sm text-center px-4 py-2.5">
            {notice}
          </p>
        )}

        <p className="px-5 sm:px-8 pb-6 text-center text-[11px] text-muted-foreground">
          Kuota token direset setiap awal bulan (UTC). Pembayaran Pro akan dibuka dalam waktu dekat.
        </p>
      </div>
    </div>
  )
}
