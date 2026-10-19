// Pure helpers for session title generation.
// Kept dependency-free (plain JS, like thinking-tags.js) so node tests can import them directly.

const GENERIC_PLACEHOLDER_TITLES = new Set(['website baru', 'untitled', 'document', 'home', 'index'])

/** Decodes common HTML entities. */
export function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/**
 * Truncates text to a maximum length strictly at word boundaries and cleans
 * unclosed brackets / trailing punctuation.
 */
export function truncateToWordBoundary(text, maxLen = 36) {
  let cleaned = (text || '').trim()
  if (!cleaned) return ''

  if (cleaned.length > maxLen) {
    const slice = cleaned.slice(0, maxLen)
    const lastSpace = slice.lastIndexOf(' ')
    cleaned = lastSpace >= 8 ? slice.slice(0, lastSpace).trimEnd() : slice.trimEnd()
  }

  const openParen = (cleaned.match(/\(/g) || []).length
  const closeParen = (cleaned.match(/\)/g) || []).length
  if (openParen > closeParen) cleaned = cleaned.slice(0, cleaned.lastIndexOf('(')).trimEnd()

  const openBracket = (cleaned.match(/\[/g) || []).length
  const closeBracket = (cleaned.match(/\]/g) || []).length
  if (openBracket > closeBracket) cleaned = cleaned.slice(0, cleaned.lastIndexOf('[')).trimEnd()

  return cleaned.replace(/[\s.:;,\-_—/([{]+$/, '').trim()
}

/** Cleans a raw user prompt into a short title candidate. */
export function cleanFallbackPrompt(rawPrompt) {
  let text = decodeHtmlEntities(rawPrompt || '').trim()
  text = text.replace(/<[^>]*>/g, '').replace(/[`"'*#_~]/g, ' ')

  let prev = ''
  while (prev !== text) {
    prev = text
    text = text
      .replace(/^(tolong\s+(buatkan|bikin|buat|rancang|desain)|buatkan|bikin|buat|rancang|desain|saya\s+(ingin|mau)\s+(membuat|bikin|buat)|mau\s+(bikin|buat)|create|build|make|design|please\s+(create|build|make|design))\s+/i, '')
      .replace(/^(sebuah|suatu|an?|the)\s+/i, '')
      .replace(/^(website|web|landing\s*page|situs\s*web|situs|aplikasi|app|platform)\s+/i, '')
      .replace(/^(untuk|tentang|mengenai|bagi|for|about)\s+/i, '')
      .trim()
  }

  const withoutParens = text.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (withoutParens.split(' ').filter(Boolean).length >= 2) text = withoutParens

  text = text
    .replace(/\s+(bergaya|dengan\s+(fitur|tema|gaya|desain|tampilan|sistem)|yang\s+(aesthetic|elegan|modern|minimalis|keren|lengkap|mewah)|featuring|with\s+(style|design|features?))\b.*$/i, '')
    .trim()
    .replace(/\s+/g, ' ')

  text = truncateToWordBoundary(text, 36)

  return text
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

/**
 * A prompt-derived fallback is only trustworthy when it reads like a name:
 * raw prompts such as "matcha=18rb, coklat=18rb, ig=..., 0831..." must never
 * become a title.
 */
export function isUsableTitle(title) {
  const t = (title || '').trim()
  if (t.length < 2 || t.length > 36) return false
  if (/[=@,]|https?:|www\./i.test(t)) return false
  if (/\d{4,}/.test(t)) return false
  if (/\d+\s*(rb|k|ribu|jt|juta)\b/i.test(t)) return false
  if (t.split(/\s+/).length > 6) return false
  if (GENERIC_PLACEHOLDER_TITLES.has(t.toLowerCase())) return false
  return true
}

/** Cleans, validates, and normalizes an AI generated title. Returns '' when nothing usable remains. */
export function cleanAndSanitizeTitle(rawTitle) {
  let title = decodeHtmlEntities((rawTitle || '').trim())
  title = title.replace(/<[^>]*>/g, '')
  title = title.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '')
  title = title.replace(/^(title|judul|project|proyek|website|web|situs|landing\s*page)(:\s*|\s+)/i, '')

  const withoutParens = title.replace(/\s*\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (withoutParens.split(' ').filter(Boolean).length >= 2) title = withoutParens

  title = truncateToWordBoundary(title.replace(/\s+/g, ' ').trim(), 36)
  if (!title || title.length < 2) return ''

  return title.charAt(0).toUpperCase() + title.slice(1)
}

/**
 * Picks the brand part of an HTML <title>, e.g.
 * "Superyaki — Ikan Tahu Yaki & Minuman" -> "Superyaki".
 */
export function brandFromHtmlTitle(htmlTitle) {
  const decoded = decodeHtmlEntities((htmlTitle || '').trim())
  if (!decoded) return ''
  const brand = decoded.split(/\s+[—–|·•-]\s+|\s*[|•·]\s*/)[0].trim()
  if (GENERIC_PLACEHOLDER_TITLES.has(brand.toLowerCase())) return ''
  const cleaned = cleanAndSanitizeTitle(brand)
  return isUsableTitle(cleaned) ? cleaned : ''
}
