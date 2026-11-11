import React, { useState } from 'react'
import arielImg from '@/assets/ariel.png'
import { HackathonStoryModal } from './HackathonStoryModal'

export const QuoteSection: React.FC = () => {
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState(false)

  return (
    <>
      <section className="w-full py-12 sm:py-16 px-4 md:px-12 border-b border-border bg-muted/20 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-2 mb-6 sm:mb-8 select-none">
            <img src="/logo.svg" alt="Logo CepatUsaha" className="w-5 h-5 rounded-md shadow-2xs" />
            <span className="font-bold text-base text-foreground tracking-tight">CepatUsaha</span>
          </div>

          {/* Big Quote with Interactive Hackathon Link & Badge */}
          <blockquote className="text-xl sm:text-3xl md:text-4xl font-sans font-semibold text-foreground tracking-tight leading-snug md:leading-normal mb-6 sm:mb-8 max-w-3xl px-2">
            “
            <span
              onClick={() => setIsHackathonModalOpen(true)}
              className="relative inline cursor-pointer font-handwriting text-primary font-bold tracking-normal group hover:opacity-90 transition-opacity"
              title="Klik untuk membaca kisah di balik karya ini"
            >
              Bermula dari karya terbaik
              <sup
                aria-label="Info karya terbaik"
                className="inline-flex items-center justify-center w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 -top-2 sm:-top-3 align-super text-[9px] sm:text-[10px] font-sans font-bold rounded-full bg-primary/15 text-primary border border-primary/35 hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95 transition-all select-none shadow-2xs"
              >
                ?
              </sup>
            </span>
            , dirancang agar usahamu bisa punya website siap pakai hanya dalam hitungan menit.”
          </blockquote>

          {/* Author Details */}
          <div className="flex flex-col items-center gap-1.5">
            <img
              src={arielImg}
              alt="Nazriel Nur"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-xs mb-1"
              loading="lazy"
            />
            <div className="font-semibold text-sm text-foreground">Nazriel Nur</div>
            <div className="text-xs text-muted-foreground">CEO & Founder, CepatUsaha</div>
          </div>
        </div>
      </section>

      {/* Hackathon Story Interactive Modal */}
      <HackathonStoryModal isOpen={isHackathonModalOpen} onClose={() => setIsHackathonModalOpen(false)} />
    </>
  )
}
