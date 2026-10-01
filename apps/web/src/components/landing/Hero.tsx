import React from 'react'
import { InteractiveGridPattern } from './InteractiveGridPattern'
import { PromptInputBox } from './PromptInputBox'

interface HeroProps {
  onGenerate: (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => void
  isGenerating: boolean
}

export const Hero: React.FC<HeroProps> = ({ onGenerate, isGenerating }) => {
  return (
    <section className="relative w-full min-h-[100dvh] md:min-h-[88vh] pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 z-0 select-none">
        {/* Interactive Geometric Grid */}
        <InteractiveGridPattern />

        {/* Scattered Ambient Gradient Blobs (Confined to Hero) */}
        <div className="absolute pointer-events-none inset-0 overflow-hidden">
          {/* Top Left - Sky Blue (Visible on Mobile & Desktop) */}
          <div className="absolute -top-[10%] -left-[10%] w-48 h-48 md:w-[600px] md:h-[600px] bg-sky-400/20 rounded-full blur-[60px] md:blur-[130px] animate-blob"></div>
          {/* Top Right - Amber (Visible on Mobile & Desktop) */}
          <div
            className="absolute top-[5%] -right-[10%] w-56 h-56 md:w-[700px] md:h-[700px] bg-amber-400/20 rounded-full blur-[70px] md:blur-[140px] animate-blob"
            style={{ animationDelay: '2s' }}
          ></div>

          {/* Center Left - Emerald (Desktop Only) */}
          <div
            className="hidden md:block absolute top-[30%] -left-[15%] w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-[120px] animate-blob"
            style={{ animationDelay: '4s' }}
          ></div>
          {/* Center Right - Orange (Desktop Only) */}
          <div
            className="hidden md:block absolute top-[40%] -right-[5%] w-[650px] h-[650px] bg-orange-400/15 rounded-full blur-[130px] animate-blob"
            style={{ animationDelay: '1s' }}
          ></div>
          {/* Bottom Left - Amber (Desktop Only) */}
          <div
            className="hidden md:block absolute bottom-[5%] -left-[5%] w-[550px] h-[550px] bg-amber-400/15 rounded-full blur-[110px] animate-blob"
            style={{ animationDelay: '3s' }}
          ></div>
          {/* Bottom Right - Sky Blue (Desktop Only) */}
          <div
            className="hidden md:block absolute bottom-[-10%] -right-[10%] w-[650px] h-[650px] bg-sky-400/20 rounded-full blur-[130px] animate-blob"
            style={{ animationDelay: '5s' }}
          ></div>
        </div>

        {/* Gradient Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center gap-3 sm:gap-4 md:gap-6 mb-5 sm:mb-8 md:mb-10 px-2 sm:px-0">
        {/* Heading */}
        <h1 className="text-[1.75rem] xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-medium text-foreground tracking-tight leading-[1.2] sm:leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
          Ubah Ide Anda Menjadi <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-foreground bg-[length:200%_auto] animate-shimmer">
            Website Siap Pakai
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-xs sm:text-sm md:text-xl text-muted-foreground font-light max-w-md sm:max-w-xl md:max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-1 sm:px-0">
          Tulis apa pun yang ingin Anda bangun, dan saksikan ide tersebut menjadi situs web modern, responsif, dan
          fungsional secara instan.
        </p>
      </div>

      {/* Input Area */}
      <div className="relative w-full max-w-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
        <PromptInputBox onGenerate={onGenerate} isGenerating={isGenerating} showSuggestions={true} />
      </div>
    </section>
  )
}

