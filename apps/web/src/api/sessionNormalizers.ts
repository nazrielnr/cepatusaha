import type { Profile } from '../types/profile'
import type { LayoutBlueprint } from '@/types/preview'
import type { ConversationStep, SessionModeEntry, SessionStatus } from '../types/session'

const EMPTY_PROFILE: Profile = {
  businessName: '',
  email: '',
  whatsapp: '',
  socialLinks: {},
  description: '',
  category: 'culinary',
}

export function normalizeConversationStep(value: unknown): ConversationStep {
  const steps: ConversationStep[] = ['idle', 'intro', 'profile', 'preferences', 'confirmation', 'previewing', 'editing', 'completed']
  const str = typeof value === 'string' ? value : ''
  return steps.includes(str as ConversationStep) ? (str as ConversationStep) : 'idle'
}

export function normalizeStatus(value: unknown): SessionStatus {
  const statuses: SessionStatus[] = ['active', 'completed', 'abandoned']
  const str = typeof value === 'string' ? value : ''
  if (statuses.includes(str as SessionStatus)) {
    return str as SessionStatus
  }
  if (str === 'archived') {
    return 'abandoned'
  }
  return 'active'
}

export function normalizeProfileDraft(value: unknown): Profile {
  const draft = { ...EMPTY_PROFILE, socialLinks: { ...EMPTY_PROFILE.socialLinks } }
  if (!value || typeof value !== 'object') {
    return draft
  }

  const source = value as Record<string, unknown>
  if (typeof source.businessName === 'string') draft.businessName = source.businessName
  if (typeof source.email === 'string') draft.email = source.email
  if (typeof source.whatsapp === 'string') draft.whatsapp = source.whatsapp
  if (typeof source.description === 'string') draft.description = source.description
  if (typeof source.category === 'string') draft.category = source.category

  if (source.socialLinks && typeof source.socialLinks === 'object') {
    const links = source.socialLinks as Record<string, unknown>
    draft.socialLinks = {
      instagram: typeof links.instagram === 'string' ? links.instagram : '',
      facebook: typeof links.facebook === 'string' ? links.facebook : '',
      tiktok: typeof links.tiktok === 'string' ? links.tiktok : '',
      website: typeof links.website === 'string' ? links.website : '',
    }
  }

  return draft
}

export function normalizeLayoutBlueprint(value: unknown): LayoutBlueprint | null {
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
        : 'hsl(var(--primary))',
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

export function normalizeModeHistory(value: unknown): SessionModeEntry[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const entries = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const record = item as Record<string, unknown>
      const modeValue = typeof record.mode === 'string' ? record.mode : ''
      const mode: 'chat' | 'build' | 'edit' | null = modeValue === 'chat' || modeValue === 'build' || modeValue === 'edit' ? modeValue : null
      if (!mode) {
        return null
      }
      const entry: SessionModeEntry = { mode }
      if (typeof record.note === 'string') {
        entry.note = record.note
      }
      if (typeof record.at === 'string') {
        entry.at = record.at
      }
      return entry
    })
    .filter((entry): entry is SessionModeEntry => entry !== null)

  return entries.length ? entries : undefined
}

