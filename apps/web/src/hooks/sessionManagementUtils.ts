import type { Profile } from '../types/profile'
import type { SessionData, SessionSummary, SessionModeEntry } from '../types/session'
import type { ChatMessage } from '@/types/chat'
import type { LayoutBlueprint } from '@/types/preview'

export const cloneProfile = (profile: Profile): Profile => ({
  ...profile,
  socialLinks: { ...profile.socialLinks },
})

export const ensureSessionTitle = (session: SessionData): SessionData => {
  const layoutBlueprint = session.layoutBlueprint ?? null
  const modeHistory = session.modeHistory ?? []
  const lastGeneratedCopy = session.lastGeneratedCopy ?? null

  // Use AI-generated title from database, fallback to 'Proyek Baru'
  const title = session.title && session.title.trim().length > 0
    ? session.title
    : 'Proyek Baru'

  return {
    ...session,
    title,
    layoutBlueprint,
    modeHistory,
    lastGeneratedCopy,
  }
}

export const sessionToSummary = (session: SessionData): SessionSummary => ({
  id: session.id,
  title: session.title,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  status: session.status ?? (session.conversationStep === 'completed' ? 'completed' : 'active'),
  conversationStep: session.conversationStep,
  previewThumbnail: session.previewThumbnail,
})

export const getSessionIdFromPath = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }
  const path = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/, '')
  if (!path) return ''

  // Handle /projects/:sessionId route
  const segments = path.split('/')
  if (segments[0] === 'projects' && segments[1]) {
    return segments[1]
  }

  // Fallback for legacy /:sessionId route
  return segments[0] ?? ''
}

// Collapse duplicate tool-call messages: keep the best (success/error) over pending for the same tool_call id
export const collapseToolCallMessages = (messages: SessionData['messages']): SessionData['messages'] => {
  if (!messages || messages.length === 0) return messages

  const statusRank = (status?: string) => {
    if (!status) return 0
    const s = status.toLowerCase()
    if (s === 'success' || s === 'completed') return 2
    if (s === 'error' || s === 'failed') return 1
    return 0 // pending/unknown
  }

  // Track best message per tool_call.id
  const bestByToolCall = new Map<string, { rank: number; messageId: string }>()

  // Ensure deterministic order by createdAt then id
  const sorted = [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt || '').getTime() || 0
    const tb = new Date(b.createdAt || '').getTime() || 0
    if (ta !== tb) return ta - tb
    return (a.id || '').localeCompare(b.id || '')
  })

  for (const msg of sorted) {
    if (msg.sender !== 'ai' || !msg.tool_calls || msg.tool_calls.length === 0) continue
    const msgRank = Math.max(...msg.tool_calls.map(tc => statusRank(tc.status)))
    for (const tc of msg.tool_calls) {
      const existing = bestByToolCall.get(tc.id)
      if (!existing || msgRank >= existing.rank) {
        bestByToolCall.set(tc.id, { rank: msgRank, messageId: msg.id })
      }
    }
  }

  // Keep messages that are not AI with tool_calls OR are the best for all of their tool_calls
  return sorted.filter(msg => {
    if (msg.sender !== 'ai' || !msg.tool_calls || msg.tool_calls.length === 0) return true
    return msg.tool_calls.every(tc => {
      const best = bestByToolCall.get(tc.id)
      return best?.messageId === msg.id
    })
  })
}

// Normalize / repair iteration metadata after load; optionally synthesize placeholders if total_iterations hint exists
export const normalizeIterationsAfterLoad = (messages: SessionData['messages']): SessionData['messages'] => {
  if (!messages?.length) return messages
  return [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt || '').getTime() || 0
    const tb = new Date(b.createdAt || '').getTime() || 0
    if (ta !== tb) return ta - tb
    return (a.id || '').localeCompare(b.id || '')
  })
}

export const updateBrowserHistory = (sessionId: string | null, replace = false) => {
  if (typeof window === 'undefined') {
    return
  }
  const target = sessionId ? `/projects/${sessionId}` : '/'
  if (replace) {
    window.history.replaceState({ sessionId }, '', target)
  } else {
    window.history.pushState({ sessionId }, '', target)
  }
}

export const profileEquals = (a: Profile, b: Profile): boolean => {
  return (
    a.businessName === b.businessName &&
    a.email === b.email &&
    (a.whatsapp ?? '') === (b.whatsapp ?? '') &&
    a.description === b.description &&
    a.category === b.category &&
    (a.socialLinks.instagram ?? '') === (b.socialLinks.instagram ?? '') &&
    (a.socialLinks.facebook ?? '') === (b.socialLinks.facebook ?? '') &&
    (a.socialLinks.tiktok ?? '') === (b.socialLinks.tiktok ?? '') &&
    (a.socialLinks.website ?? '') === (b.socialLinks.website ?? '')
  )
}

export const previewEquals = (a: SessionData['lastPreview'], b: SessionData['lastPreview']): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

const messagesChanged = (prev: ChatMessage[], next: ChatMessage[]): boolean => {
  if (prev.length !== next.length) {
    return true
  }
  for (let index = 0; index < prev.length; index += 1) {
    if (prev[index] !== next[index]) {
      return true
    }
  }
  return false
}

export const blueprintEquals = (a: LayoutBlueprint | null, b: LayoutBlueprint | null): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  return JSON.stringify(a) === JSON.stringify(b)
}

export const modeHistoryEquals = (a: SessionModeEntry[] | undefined, b: SessionModeEntry[] | undefined): boolean => {
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false
  for (let index = 0; index < a.length; index += 1) {
    const left = a[index]
    const right = b[index]
    if (!right || left.mode !== right.mode || left.note !== right.note || left.at !== right.at) {
      return false
    }
  }
  return true
}

/**
 * Shallow equality check for objects (Requirement 3.4)
 * Compares object keys and values using reference equality
 */
const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true
  if (!obj1 || !obj2) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }

  return true
}

/**
 * Optimized session change detection (Requirements 3.1, 3.2, 3.4)
 * Uses fast-path reference equality and shallow comparison before expensive deep comparison
 */
export const hasSessionChanged = (prev: SessionData, next: SessionData): boolean => {
  // Fast path: reference equality (Requirement 3.2)
  if (prev === next) return false

  // Check primitive fields first (cheapest)
  if (prev.title !== next.title) return true
  if (prev.conversationStep !== next.conversationStep) return true
  if (prev.status !== next.status) return true

  // Check profile with existing optimized function
  if (!profileEquals(prev.profileDraft, next.profileDraft)) return true

  // Check arrays/objects with shallow comparison first (Requirement 3.4)
  // Only fall back to deep comparison if shallow check indicates possible change

  // Messages: check length and reference equality first
  if (prev.messages.length !== next.messages.length) return true
  if (messagesChanged(prev.messages, next.messages)) return true

  // Preview: shallow check before deep comparison
  const prevPreview = prev.lastPreview ?? null
  const nextPreview = next.lastPreview ?? null
  if (prevPreview !== nextPreview) {
    if (!prevPreview || !nextPreview) return true
    if (!shallowEqual(prevPreview, nextPreview)) {
      // Only do expensive JSON comparison if shallow check failed
      if (!previewEquals(prevPreview, nextPreview)) return true
    }
  }

  // Blueprint: shallow check before deep comparison
  const prevBlueprint = prev.layoutBlueprint ?? null
  const nextBlueprint = next.layoutBlueprint ?? null
  if (prevBlueprint !== nextBlueprint) {
    if (!prevBlueprint || !nextBlueprint) return true
    if (!shallowEqual(prevBlueprint, nextBlueprint)) {
      if (!blueprintEquals(prevBlueprint, nextBlueprint)) return true
    }
  }

  // Mode history: use existing optimized function
  if (!modeHistoryEquals(prev.modeHistory, next.modeHistory)) return true

  // Last generated copy: shallow check before JSON comparison
  const prevCopy = prev.lastGeneratedCopy ?? null
  const nextCopy = next.lastGeneratedCopy ?? null
  if (prevCopy !== nextCopy) {
    if (!prevCopy || !nextCopy) return true
    if (!shallowEqual(prevCopy, nextCopy)) {
      // Only do expensive JSON comparison if shallow check failed (Requirement 3.1)
      if (JSON.stringify(prevCopy) !== JSON.stringify(nextCopy)) return true
    }
  }

  return false
}

