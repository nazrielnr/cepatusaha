import type { Profile } from '../types/profile'
import type { PublicationRecord, PublishResponse } from '@/types/publication'
import type { LayoutBlueprint, GeneratedCopy } from '@/types/preview'
import type { SessionSummary } from '../types/session'
import { handleAPIResponse } from '../utils/error-handler'
import { fetchWithTokenRetry } from './auth'
import { apiPathUrl } from '@/lib/apiClient'
import { publicationCache } from './publication-cache'

function ensureToken(token?: string): string {
  if (!token) {
    throw new Error('Autentikasi diperlukan untuk mengakses sumber daya.')
  }
  return token
}

// Standard headers for Vercel API with Clerk authentication
function buildFunctionHeaders(token: string, includeJson = true): HeadersInit {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  }

  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

function normalizeLayoutBlueprint(value: unknown): LayoutBlueprint | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const record = value as Record<string, unknown>
  if (!Array.isArray(record.sections)) {
    return null
  }
  const rawTheme = typeof record.theme === 'object' && record.theme
    ? (record.theme as Record<string, unknown>)
    : undefined
  return {
    theme: {
      accentColor: typeof rawTheme?.accentColor === 'string'
        ? (rawTheme.accentColor as string)
        : '#2563eb',
      backgroundColor: typeof rawTheme?.backgroundColor === 'string'
        ? (rawTheme.backgroundColor as string)
        : undefined,
      textColor: typeof rawTheme?.textColor === 'string'
        ? (rawTheme.textColor as string)
        : undefined,
      fontFamily: typeof rawTheme?.fontFamily === 'string'
        ? (rawTheme.fontFamily as string)
        : undefined,
    },
    sections: (record.sections as unknown[])
      .map((section) => {
        if (!section || typeof section !== 'object') {
          return null
        }
        const detail = section as Record<string, unknown>
        const normalized: LayoutBlueprint['sections'][number] = {
          type: typeof detail.type === 'string' ? (detail.type as string) : 'section',
        }

        if (typeof detail.heading === 'string') {
          normalized.heading = detail.heading as string
        }
        if (typeof detail.subheading === 'string') {
          normalized.subheading = detail.subheading as string
        }
        if (typeof detail.body === 'string') {
          normalized.body = detail.body as string
        }
        if (Array.isArray(detail.highlights)) {
          const highlights = (detail.highlights as unknown[])
            .map((item) => (typeof item === 'string' ? item : String(item)))
            .filter((item) => item.trim().length > 0)
          if (highlights.length) {
            normalized.highlights = highlights
          }
        }
        if (typeof detail.image === 'string') {
          normalized.image = detail.image as string
        }
        if (Array.isArray(detail.actions)) {
          const actions = (detail.actions as unknown[])
            .map((action) => {
              if (!action || typeof action !== 'object') {
        return null
              }
              const parsed = action as Record<string, unknown>
              if (typeof parsed.label !== 'string') {
        return null
              }
              const result: { label: string; href?: string } = { label: parsed.label }
              if (typeof parsed.href === 'string') {
                result.href = parsed.href
              }
              return result
            })
            .filter((action): action is { label: string; href?: string } => action !== null)
          if (actions.length) {
            normalized.actions = actions
          }
        }

        return normalized
      })
      .filter((section): section is LayoutBlueprint['sections'][number] => Boolean(section)),
  }
}

type SessionPayload = {
  id: string
  title: string
  status?: string
  conversation_step?: string
  profile_draft?: Record<string, unknown> | null
  layout_blueprint?: Record<string, unknown> | null
  mode_history?: unknown
  last_preview?: unknown
  created_at: string
  updated_at: string
  preview_thumbnail?: string
}

function normalizeStatus(value: unknown): 'active' | 'completed' | 'abandoned' {
  const statuses: ('active' | 'completed' | 'abandoned')[] = ['active', 'completed', 'abandoned']
  const str = typeof value === 'string' ? value : ''
  if (statuses.includes(str as any)) {
    return str as 'active' | 'completed' | 'abandoned'
  }
  if (str === 'archived') {
    return 'abandoned'
  }
  return 'active'
}

function normalizeConversationStep(value: unknown): 'idle' | 'intro' | 'profile' | 'preferences' | 'confirmation' | 'previewing' | 'editing' | 'completed' {
  const steps: ('idle' | 'intro' | 'profile' | 'preferences' | 'confirmation' | 'previewing' | 'editing' | 'completed')[] = ['idle', 'intro', 'profile', 'preferences', 'confirmation', 'previewing', 'editing', 'completed']
  const str = typeof value === 'string' ? value : ''
  return steps.includes(str as any) ? (str as any) : 'idle'
}

function mapSessionSummary(payload: SessionPayload): SessionSummary {
  return {
    id: payload.id,
    title: payload.title || 'Proyek Baru',
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    status: normalizeStatus(payload.status),
    conversationStep: normalizeConversationStep(payload.conversation_step),
    previewThumbnail: typeof payload.preview_thumbnail === 'string' ? payload.preview_thumbnail : undefined,
  }
}

export type PublishSiteOptions = {
  generatedCopy?: GeneratedCopy | null
  sessionId?: string | null
  html?: string | null // Add HTML parameter to use existing preview
  existingSlug?: string | null // Use existing slug to update same deployment
  customDomainName?: string | null // Custom domain name chosen by user
}

export async function publishSite(
  profile: Profile,
  layoutBlueprint: LayoutBlueprint,
  options: PublishSiteOptions = {},
  token?: string,
): Promise<PublishResponse> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/publish-site'),
    {
      method: 'POST',
      headers: buildFunctionHeaders(sessionToken),
      body: JSON.stringify({
        profile,
        layoutBlueprint,
        generatedCopy: options.generatedCopy ?? null,
        sessionId: options.sessionId ?? null,
        html: options.html ?? null, // Send HTML if provided
        existingSlug: options.existingSlug ?? null, // Send existing slug to reuse
        customDomainName: options.customDomainName ?? null, // Send custom domain name
      }),
    }
  )
  const result = await handleAPIResponse<PublishResponse>(response)

  // Invalidate publication cache after successful publish (Requirement 4.4)
  publicationCache.invalidate()


  return result
}

export async function fetchPublications(token?: string): Promise<PublicationRecord[]> {
  const sessionToken = ensureToken(token)

  // Check cache first (Requirement 4.2: Return cached data within TTL)
  const cached = publicationCache.get()
  if (cached) {
    return cached
  }


  // Fetch from API (Requirement 4.3: Fetch fresh data after expiry)
  const response = await fetchWithTokenRetry(
    apiPathUrl('/list-publications'),
    {
      method: 'GET',
      headers: buildFunctionHeaders(sessionToken, false),
    }
  )
  const payload = await handleAPIResponse<{ publications: Array<Record<string, unknown>> }>(response)

  // Extract sessionIds from publications to fetch titles
  const sessionIds = new Set<string>()
  const publications = (payload.publications ?? []).map((record) => {
    const recordPayload = record.payload as Record<string, unknown> | null
    const sessionId = typeof recordPayload?.sessionId === 'string' ? recordPayload.sessionId : null

    if (sessionId) sessionIds.add(sessionId)

    return {
      id: String(record.id),
      templateId: typeof record.templateId === 'string' ? record.templateId : typeof record.template_id === 'string' ? record.template_id : null,
      publicUrl: typeof record.publicUrl === 'string' ? record.publicUrl : typeof record.public_url === 'string' ? record.public_url : '',
      status: typeof record.status === 'string' ? record.status : 'PUBLISHED',
      publishedAt: typeof record.publishedAt === 'string' ? record.publishedAt : typeof record.published_at === 'string' ? record.published_at : null,
      slug: typeof record.slug === 'string' ? record.slug : null,
      layoutBlueprint: normalizeLayoutBlueprint(record.layoutBlueprint ?? record.layout_snapshot ?? null),
      sessionId,
      sessionTitle: null as string | null, // Will be filled below
    }
  })

  // Fetch session titles for all sessionIds
  if (sessionIds.size > 0) {
    try {
      const sessionTitlesMap = new Map<string, string>()

      // Fetch all sessions to get titles
      const sessionsResponse = await fetchWithTokenRetry(
        apiPathUrl('/sessions'),
        {
          method: 'GET',
          headers: buildFunctionHeaders(sessionToken, false),
        }
      )
      const sessionsPayload = await handleAPIResponse<{ sessions: SessionPayload[] }>(sessionsResponse)

      // Build sessionId -> title map
      for (const session of sessionsPayload.sessions ?? []) {
        const mappedSession = mapSessionSummary(session)
        if (mappedSession.id && mappedSession.title) {
          sessionTitlesMap.set(mappedSession.id, mappedSession.title)
        }
      }

      // Fill session titles
      for (const pub of publications) {
        if (pub.sessionId) {
          const title = sessionTitlesMap.get(pub.sessionId)
          pub.sessionTitle = title || null
        }
      }
    } catch (error) {
      console.error('Failed to fetch session titles for publications', error)
      // Continue without titles
    }
  }

  // Store in cache (Requirement 4.1: Cache with 30-second TTL)
  publicationCache.set(publications)


  return publications
}

export async function deletePublication(publicationId: string, token?: string): Promise<{ success: boolean; message: string }> {
  const sessionToken = ensureToken(token)
  const response = await fetchWithTokenRetry(
    apiPathUrl(`/delete-publication?id=${encodeURIComponent(publicationId)}`),
    {
      method: 'DELETE',
      headers: buildFunctionHeaders(sessionToken, false),
    }
  )
  const result = await handleAPIResponse<{ success: boolean; message: string }>(response)

  // Invalidate publication cache after successful delete (Requirement 4.4)
  publicationCache.invalidate()


  return result
}
