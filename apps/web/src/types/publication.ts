export type PublishResponse = {
  success: boolean
  publicUrl?: string
  publishedAt?: string
  slug?: string
  deploymentId?: string | null
}

export type PublicationRecord = {
  id: string
  publicUrl: string
  status: string
  publishedAt: string | null
  slug: string | null
  sessionId: string | null
  sessionTitle: string | null
}
