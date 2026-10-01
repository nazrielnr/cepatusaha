import React, { useEffect, useState } from 'react'
import { X, ArrowUpRight } from 'lucide-react'
import arielImg from '@/assets/ariel.png'
import awsIcon from '@/assets/aws-icon.webp'
import dicodingIcon from '@/assets/dicoding-icon.avif'
import ekrafIcon from '@/assets/ekraf-icon.webp'

interface HackathonStoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const HackathonStoryModal: React.FC<HackathonStoryModalProps> = ({ isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
      const timer = setTimeout(() => setIsVisible(true), 20)
      return () => clearTimeout(timer)
    } else if (shouldRender) {
      setIsVisible(false)
      setIsClosing(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, shouldRender])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-250 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Landscape Modal Container */}
      <div
        className={`relative w-full max-w-5xl bg-background text-foreground rounded-2xl sm:rounded-3xl border-2 border-border shadow-2xl overflow-hidden my-auto transition-all duration-300 ease-out z-10 max-h-[92vh] md:max-h-[85vh] flex flex-col ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hackathon-modal-title"
      >
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border-2 border-border/50 transition-all cursor-pointer"
          aria-label="Tutup modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* 2-Column Responsive Landscape Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
          {/* Sisi Kiri: Editorial Storytelling (60% di Desktop) */}
          <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between md:overflow-y-auto border-b md:border-b-0 md:border-r border-border/80 bg-background">
            <div className="space-y-6">
              {/* Partner Logos Bar at Top Left */}
              <div className="flex items-center gap-3 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all">
                <img src={ekrafIcon} alt="KemenEkraf RI" className="h-6 sm:h-7 w-auto object-contain shrink-0" />
                <span className="text-border text-sm">/</span>
                <img src={awsIcon} alt="AWS" className="h-6 sm:h-7 w-auto object-contain shrink-0" />
                <span className="text-border text-sm">/</span>
                <img src={dicodingIcon} alt="Dicoding" className="h-5 sm:h-6 w-auto object-contain shrink-0" />
              </div>

              {/* Title & Subheading */}
              <div className="space-y-2">
                <h2 id="hackathon-modal-title" className="text-xl sm:text-2xl lg:text-[25px] font-bold tracking-tight text-foreground leading-snug">
                  Bermula dari panggung kompetisi, kini siap bantu usahamu go-digital.
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Cerita lahirnya CepatUsaha di ajang kolaborasi <strong>Kementerian Ekonomi Kreatif RI</strong>, <strong>Amazon Web Services (AWS)</strong>, dan <strong>Dicoding</strong>.
                </p>
              </div>

              {/* Story Narrative */}
              <div className="space-y-3.5 text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans border-t-2 border-border/60 pt-4">
                <p>
                  Banyak pemilik usaha lokal dan kreator punya produk hebat, tapi terhalang satu masalah klasik: <strong>biaya bikin website yang mahal dan urusan teknis koding yang bikin pusing</strong>.
                </p>

                <p>
                  Saat kompetisi nasional <em>“AI for Creative Economy”</em> dibuka, kami ingin menghadirkan solusi yang benar-benar membumi: <em>bagaimana jika membuat website bisnis bisa semudah mengetik ide dalam obrolan sehari-hari?</em>
                </p>

                <p>
                  Setelah melalui proses kurasi dan pengujian intensif selama 2 bulan bersama puluhan developer dari seluruh Indonesia, <strong>CepatUsaha resmi dinobatkan sebagai Top 5 Inovasi AI Terbaik Nasional</strong>.
                </p>

                <p className="text-muted-foreground text-xs leading-relaxed pt-1">
                  Kemenangan ini adalah awal dari komitmen kami untuk terus menghadirkan teknologi pembuatan website yang cepat, terjangkau, dan bisa dipakai siapa saja.
                </p>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Arsip Dokumen & Publikasi Resmi (40% di Desktop) */}
          <div className="md:col-span-5 p-6 sm:p-8 bg-muted/20 flex flex-col justify-between md:overflow-y-auto space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Publikasi Resmi Penyelenggara
                </h3>
              </div>

              {/* Reference Card 1: KemenEkraf RI */}
              <a
                href="https://ekraf.go.id/news-en/ministry-of-creative-economy-aws-and-dicoding-strengthen-digital-innovation-through-the-2025-hackathon-ai-for-creative-economy"
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-xl border-2 border-border/80 bg-background/80 hover:bg-background hover:border-primary transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <img src={ekrafIcon} alt="KemenEkraf RI" className="h-5 sm:h-6 w-auto object-contain shrink-0" />
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  Ministry of Creative Economy, AWS, and Dicoding Strengthen Digital Innovation Through Hackathon 2025
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  Rilis berita resmi Kementerian Ekonomi Kreatif mengenai penguatan inovasi AI bagi talenta digital ekonomi kreatif.
                </p>
              </a>

              {/* Reference Card 2: Dicoding & AWS Blog */}
              <a
                href="https://aws.dicoding.com/blog/420/selamat-kepada-pemenang-aws-back-end-academy-2025-online-hackathon-ai-for-creative-economy"
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-4 rounded-xl border-2 border-border/80 bg-background/80 hover:bg-background hover:border-primary transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <img src={awsIcon} alt="AWS" className="h-5 sm:h-6 w-auto object-contain shrink-0" />
                    <span className="text-border text-xs">/</span>
                    <img src={dicodingIcon} alt="Dicoding" className="h-4 sm:h-5 w-auto object-contain shrink-0" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                  Selamat kepada Pemenang AWS Back-End Academy 2025 Online Hackathon
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  Daftar 5 pemenang produk terbaik nasional: Nazriel Nur dengan platform CepatUsaha.
                </p>
              </a>
            </div>

            {/* Founder Profile at Bottom Right */}
            <div className="pt-4 border-t-2 border-border/60 flex items-center gap-3.5">
              <img
                src={arielImg}
                alt="Nazriel Nur"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-border shrink-0"
              />
              <div>
                <div className="font-semibold text-sm text-foreground">Nazriel Nur</div>
                <div className="text-xs text-muted-foreground">CEO & Founder, CepatUsaha</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
