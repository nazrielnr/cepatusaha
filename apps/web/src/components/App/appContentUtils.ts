import type { ChatMessage } from '@/types/chat'

export function deriveProjectTitle(files: any[], messages: ChatMessage[]): string | null {
  const primaryFile = files.find((f: any) => f.file_path === 'index.html' || f.file_path?.endsWith('/index.html'))
    || files.find((f: any) => f.file_path?.toLowerCase().endsWith('.html'))
    || files[0]
  let candidate: string | null = null

  if (primaryFile?.content) {
    const html = primaryFile.content as string
    const titleMatch = html.match(/<title[^>]*>([^<]{1,80})<\/title>/i)
    const h1Match = html.match(/<h1[^>]*>([^<]{1,80})<\/h1>/i)
    candidate = (titleMatch?.[1] || h1Match?.[1] || '').trim()
  }

  if (!candidate || candidate.length < 3) {
    candidate = [...messages].reverse().find((m) => m?.sender === 'user' && m?.content)?.content.slice(0, 50).trim() ?? null
  }

  if (!candidate || candidate.length < 3) return null

  candidate = candidate.replace(/\s+/g, ' ').replace(/["'<>]/g, '').trim()
  return candidate.length > 40 ? candidate.slice(0, 40).trimEnd() : candidate
}
