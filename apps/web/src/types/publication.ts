import type { LayoutBlueprint } from './preview'

export type PublishResponse = {
  success: boolean
  publicUrl?: string
  vercelUrl?: string | null
  vercelDeploymentId?: string | null
  fallbackUrl?: string
  publishedAt?: string
  slug?: string
  layoutBlueprint?: LayoutBlueprint
  deploymentError?: string | null
  deploymentStatus?: 'vercel_success' | 'vercel_failed_fallback_success' | 'failed'
}

export type PublicationRecord = {
  id: string
  publicUrl: string
  status: string
  publishedAt: string | null
  slug: string | null
  layoutBlueprint: LayoutBlueprint | null
  sessionId: string | null
  sessionTitle: string | null
}
