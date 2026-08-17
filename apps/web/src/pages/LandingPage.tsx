import React from 'react'
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

  const handleGenerate = async (prompt: string, modelId: string, planMode?: boolean, images?: File[]) => {
    setIsGenerating(true)
    try {
      await onCreateSession(prompt, modelId, planMode, images)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main>
        <Hero onGenerate={handleGenerate} isGenerating={isGenerating} />

        {/* Project History Section */}
        {(isSessionLoading || sessions.length > 0) && (
          <div className="w-full py-16 px-4 md:px-12 bg-muted/30 border-y border-border">
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

      <Footer />
    </div>
  )
}
