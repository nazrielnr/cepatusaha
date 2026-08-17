interface Message {
  role: 'user' | 'assistant'
  content: string
}

const FALLBACK_TITLE = 'Proyek Baru'

export async function generateProjectTitle(messages: Message[]): Promise<string> {
  const firstUserMessage = messages.find((message) => message.role === 'user')?.content
  if (!firstUserMessage) return FALLBACK_TITLE
  return validateTitle(firstUserMessage) || FALLBACK_TITLE
}

function validateTitle(title: string): string | null {
  const cleaned = title
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ').filter(Boolean).slice(0, 4)
  if (words.length < 2) return null
  return words.join(' ').slice(0, 50)
}

export async function saveProjectTitle(_sessionId: string, _title: string): Promise<void> {
  // ponytail: title persistence skipped until session-service owns this endpoint.
}

export async function loadProjectTitle(_sessionId: string): Promise<string | null> {
  // ponytail: title persistence skipped until session-service owns this endpoint.
  return null
}
