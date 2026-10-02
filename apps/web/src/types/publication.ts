export type PublishResponse = {
  success: boolean
  publicUrl?: string
  domainUrl?: string
  vercelUrl?: string | null
  vercelDeploymentId?: string | null
  fallbackUrl?: string
  publishedAt?: string
  slug?: string
  deploymentId?: string | null
  deploymentStatus?: 'vercel_success' | 'vercel_failed_fallback_success' | 'failed'
  deploymentError?: string | null
  reused?: boolean
}

export type PublicationRecord = {
  id: string
  projectId?: string | null
  publicUrl: string
  status: string
  publishedAt: string | null
  slug: string | null
  sessionId: string | null
  sessionTitle: string | null
  fallbackUrl?: string | null
  vercelUrl?: string | null
  deploymentStatus?: string | null
}
