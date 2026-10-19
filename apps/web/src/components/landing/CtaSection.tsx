import React from 'react'
import { PromptInputBox } from './PromptInputBox'

interface CtaSectionProps {
  onGenerate: (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => void
  isGenerating: boolean
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onGenerate, isGenerating }) => {
  return (
    <section className="w-full py-12 sm:py-16 md:py-20 px-4 md:px-12 bg-background border-b border-border relative z-20">
      <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Side: Call to Action (Ajakan) */}
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4 text-left">
          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] font-serif font-medium text-foreground tracking-tight leading-snug">
            Siap Mewujudkan Website <br className="hidden sm:inline" />
            <span className="text-primary">Bisnis Impian Anda?</span>
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-relaxed max-w-md">
            Ketik konsep atau jenis usaha Anda di samping. AI kami akan merancang struktur, desain interaktif, dan
            konten siap pakai yang langsung dapat Anda gunakan.
          </p>
        </div>

        {/* Right Side: Reused Input Message Box (Standardized with Hero sizing & layout) */}
        <div className="lg:col-span-7 w-full flex flex-col">
          <PromptInputBox
            onGenerate={onGenerate}
            isGenerating={isGenerating}
            showSuggestions={true}
          />
        </div>
      </div>
    </section>
  )
}



