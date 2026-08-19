import React, { useRef, useEffect, useState } from 'react'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProjectHistorySection } from '@/components/ProjectHistorySection'
import { CommunityShowcase } from '@/components/landing/CommunityShowcase'
import { Footer } from '@/components/landing/Footer'

interface LandingPageProps {
  sessions: Array<{
    id: string
    title: string
    updatedAt: string
    previewThumbnail?: string
  }>
  isSessionLoading?: boolean
  onCreateSession: (message: string, modelId?: string, planMode?: boolean, images?: File[]) => Promise<void>
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onRefreshSessions?: () => Promise<void>
}

export function LandingPage({
  sessions,
  isSessionLoading = false,
  onCreateSession,
  onSelectSession,
  onDeleteSession,
  onRefreshSessions,
}: LandingPageProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)
  const revealContainerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const updateParallax = () => {
      // Only run parallax on desktop screens
      if (window.innerWidth < 768) return
      if (!textRef.current || !revealContainerRef.current) return
      const height = revealContainerRef.current.offsetHeight || 220
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) {
        textRef.current.style.transform = 'translate3d(0, 0, 0)'
        return
      }
      const currentScroll = window.scrollY
      const distFromBottom = Math.max(0, scrollHeight - currentScroll)
      const progress = Math.min(1, Math.max(0, 1 - distFromBottom / height))
      const translateY = (1 - progress) * (height * 0.45)
      textRef.current.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`
    }

    window.addEventListener('scroll', updateParallax, { passive: true })
    window.addEventListener('resize', updateParallax, { passive: true })
    updateParallax()

    return () => {
      window.removeEventListener('scroll', updateParallax)
      window.removeEventListener('resize', updateParallax)
    }
  }, [])

  const handleGenerate = async (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => {
    setIsGenerating(true)
    try {
      await onCreateSession(prompt, modelId, planMode, images)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Root Fixed Parallax Giant Text (Desktop Only: Anchored at the bottom) */}
      <div
        ref={revealContainerRef}
        className="hidden md:flex fixed bottom-0 left-0 right-0 z-0 pointer-events-none select-none items-center justify-center px-4 bg-muted/30 border-t border-border overflow-hidden"
        style={{
          height: '20vw',
          maxHeight: '260px',
          minHeight: '150px',
        }}
        aria-hidden="true"
      >
        {/* Soft, Subtle Background Dots Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

        {/* Giant Text (GPU hardware transform) */}
        <span
          ref={textRef}
          className="relative z-10 text-[14vw] font-black tracking-tight leading-none text-foreground/15 dark:text-foreground/20 whitespace-nowrap select-none text-center will-change-transform"
        >
          cepatusaha
        </span>
      </div>

      {/* Main Foreground Scrollable Content (All regular sections including Footer) */}
      <div className="relative z-10 bg-background border-b border-border">
        <Navbar />

        <main>
          <Hero onGenerate={handleGenerate} isGenerating={isGenerating} />

          {/* Project History Section */}
          {(isSessionLoading || sessions.length > 0) && (
            <div className="w-full py-12 sm:py-16 px-4 md:px-12 bg-muted/30 border-y border-border">
              <div className="max-w-6xl mx-auto">
                <ProjectHistorySection
                  sessions={sessions}
                  onSelectSession={onSelectSession}
                  onDeleteSession={onDeleteSession}
                  onRefresh={onRefreshSessions}
                  isLoading={isSessionLoading}
                />
              </div>
            </div>
          )}

          <CommunityShowcase />
        </main>

        {/* Footer as normal regular section */}
        <Footer />

        {/* Mobile Static Giant Text Section (No Parallax on mobile) */}
        <div className="md:hidden relative w-full py-10 sm:py-14 px-4 bg-muted/30 border-t border-border flex items-center justify-center overflow-hidden select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
          <span className="relative z-10 text-[13.5vw] font-black tracking-tight leading-none text-foreground/15 dark:text-foreground/20 whitespace-nowrap select-none text-center">
            cepatusaha
          </span>
        </div>
      </div>

      {/* Parallax Bottom Reveal Window (Desktop Only: reveals fixed text when scrolled past footer) */}
      <div
        className="hidden md:block relative z-0 w-full pointer-events-none"
        style={{
          height: '20vw',
          maxHeight: '260px',
          minHeight: '150px',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
