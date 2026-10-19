import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { createFactoryFromEnv } from '../models/ai-factory'
import { listProjectFilesWithContent } from '../files/service'
import { getSessionForUser, getMessagesForSession } from './service'
import {
  brandFromHtmlTitle,
  cleanAndSanitizeTitle,
  cleanFallbackPrompt,
  decodeHtmlEntities,
  isUsableTitle,
  truncateToWordBoundary,
} from './title-utils'

export { brandFromHtmlTitle, cleanAndSanitizeTitle, cleanFallbackPrompt, decodeHtmlEntities, isUsableTitle, truncateToWordBoundary }

export interface GenerateTitleParams {
  sessionId?: string
  stage: 'initial' | 'completion'
  prompt?: string
  files?: Array<{ file_path: string; content?: string }>
}

export interface GenerateTitleResult {
  status: 'success' | 'skipped' | 'error'
  title: string
  stage?: 'initial' | 'completion'
  reason?: string
}

const DEFAULT_TITLE = 'Proyek Baru'

// The primary model is a reasoning model: it spends several hundred tokens
// thinking before it emits the visible title. A tiny max_tokens budget leaves
// the content empty (finish_reason=length), which used to push every request
// into the raw-prompt fallback.
const TITLE_MAX_TOKENS = 1500
const TITLE_TIMEOUT_MS = 30_000

/**
 * System instruction specifically designed for concise, punchy, professional title generation.
 */
export const TITLE_GENERATION_SYSTEM_PROMPT = `You are a specialized title generator for websites and workspaces.

Your objective: Generate a concise, punchy, memorable, and professional project title (singkat, padat, dan jelas).

Rules:
1. Length: Exactly 2 to 4 complete words (maximum 32 characters).
2. Content:
   - Prioritize the brand, business, or company name if present (e.g. "Kopi Senja", "Crust & Co Bakery", "Studio Foto Randai").
   - If no brand name is specified, describe the business or project purpose directly (e.g. "Portofolio Fotografi", "Klinik Gigi Sehat", "SaaS Task Manager").
   - NEVER use prices, phone numbers, social media handles, or raw lists of menu items as the title.
3. Format & Purity:
   - Plain text ONLY.
   - NEVER cut off words in the middle. Output complete words only.
   - NEVER include parenthetical explanations (e.g. output "Kafe Kekinian", NEVER "Kafe Kekinian (Specialty Coffee Shop)").
   - NEVER wrap the title in quotes (no "...", no '...').
   - NEVER use markdown formatting (no bold, no italics, no backticks).
   - NEVER include trailing periods, colons, semicolons, dashes, or slashes at the end.
   - NEVER output HTML entities (decode &amp; to &, &quot; to ", etc.).
   - NEVER include generic prefixes like "Website", "Web", "Situs", "Landing Page", "Title:", "Judul:", "Proyek:", "A website for".
4. Language:
   - Match the primary language of the input prompt (Indonesian for Indonesian, English for English).
   - Use proper Title Case capitalization.
5. Output:
   - Output ONLY the exact title text, nothing else. No conversational chatter, no explanations.`

/**
 * Asks the AI provider for a title. Returns '' when the call fails, times out,
 * or yields nothing usable, so the caller can pick a better-informed fallback.
 */
export async function generateTitleWithAI(env: Bindings, contextText: string): Promise<string> {
  try {
    const factory = await createFactoryFromEnv(env)
    const provider = factory.getPrimaryProvider()
    const model = factory.getPrimaryModel() || env.AI_DEFAULT_MODEL

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('title generation timed out')), TITLE_TIMEOUT_MS)
    })

    try {
      const response = await Promise.race([
        provider.chat({
          messages: [
            { role: 'system', content: TITLE_GENERATION_SYSTEM_PROMPT },
            { role: 'user', content: contextText },
          ],
          model,
          temperature: 0.3,
          max_tokens: TITLE_MAX_TOKENS,
          reasoning_effort: 'low',
        }),
        timeout,
      ])
      const raw = typeof response.message?.content === 'string' ? response.message.content : ''
      const title = cleanAndSanitizeTitle(raw)
      return isUsableTitle(title) ? title : ''
    } finally {
      if (timer) clearTimeout(timer)
    }
  } catch (error) {
    console.error('[title.service] AI call failed:', error)
    return ''
  }
}

function extractSiteCues(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]{1,160})<\/title>/i)
  const h1Match = html.match(/<h1[^>]*>([\s\S]{1,300}?)<\/h1>/i)
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']{1,200})["']/i)

  return {
    title: decodeHtmlEntities(titleMatch?.[1]?.trim() || ''),
    h1: decodeHtmlEntities((h1Match?.[1] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()),
    description: decodeHtmlEntities(metaDescMatch?.[1]?.trim() || ''),
  }
}

async function getFirstUserPrompt(env: Bindings, sessionId: string): Promise<string> {
  const msgs = await getMessagesForSession(env, sessionId)
  const firstUser = msgs.find((m: Record<string, unknown>) => m.role === 'user' || m.sender === 'user')
  return firstUser?.content ? String(firstUser.content) : ''
}

/**
 * Core handler to generate a session title.
 *
 * - 'initial' runs at most once per session (first user prompt).
 * - 'completion' runs at most once per session, after a website exists, and
 *   derives the title from the generated code rather than from the latest
 *   follow-up message ("ganti harga jadi 18rb" must never become a title).
 * - A manual rename (custom_title) is never overwritten.
 * - If neither the AI nor a trustworthy fallback produces a title, nothing is
 *   written, so a later stage can still fill it in.
 */
export async function handleGenerateSessionTitle(
  env: Bindings,
  userId: string,
  params: GenerateTitleParams
): Promise<GenerateTitleResult> {
  const { sessionId, stage, prompt, files: inputFiles } = params
  const sql = createSql(env)

  let session: Record<string, unknown> | null = null
  let existingTitle = DEFAULT_TITLE

  if (sessionId) {
    session = await getSessionForUser(env, sessionId, userId)
    if (!session) {
      return { status: 'error', title: existingTitle, reason: 'Session not found' }
    }

    existingTitle = (session.title as string) || DEFAULT_TITLE
    const meta = (session.metadata || {}) as Record<string, unknown>

    if (meta.custom_title === true || meta.is_custom_title === true) {
      return { status: 'skipped', title: existingTitle, stage, reason: 'custom_title' }
    }
    if (stage === 'initial' && meta.title_stage) {
      return { status: 'skipped', title: existingTitle, stage, reason: 'title_already_generated' }
    }
    if (stage === 'completion' && meta.title_stage === 'completion') {
      return { status: 'skipped', title: existingTitle, stage, reason: 'completion_already_done' }
    }
  }

  let contextText = ''
  let fallbackTitle = ''

  if (stage === 'initial') {
    let userPrompt = prompt || ''
    if (!userPrompt && sessionId) userPrompt = await getFirstUserPrompt(env, sessionId)
    if (!userPrompt.trim()) {
      return { status: 'skipped', title: existingTitle, stage, reason: 'empty_prompt' }
    }

    const candidate = cleanFallbackPrompt(userPrompt)
    fallbackTitle = isUsableTitle(candidate) ? candidate : ''
    contextText = `User prompt for creating a website:\n"${userPrompt.slice(0, 500)}"\n\nGenerate a concise, punchy title (2-4 words) for this website.`
  } else {
    let files = inputFiles
    if (!files && session?.project_id) {
      try {
        files = await listProjectFilesWithContent(env, String(session.project_id))
      } catch (err) {
        console.error('[title.service] Failed to list project files:', err)
      }
    }

    const indexFile = (files || []).find((f) => f.file_path === 'index.html')
      || (files || []).find((f) => f.file_path?.endsWith('/index.html'))
      || (files || []).find((f) => f.file_path?.endsWith('.html') && f.content)

    if (!indexFile?.content) {
      // Nothing generated yet: do not burn the one-shot completion stage.
      return { status: 'skipped', title: existingTitle, stage, reason: 'no_site_content' }
    }

    const cues = extractSiteCues(indexFile.content)
    const brand = brandFromHtmlTitle(cues.title)
    const h1Title = isUsableTitle(cues.h1) ? cues.h1 : ''
    fallbackTitle = brand || ''

    // The original brief, never the latest follow-up message.
    let originalPrompt = ''
    if (sessionId) {
      try {
        originalPrompt = await getFirstUserPrompt(env, sessionId)
      } catch (err) {
        console.error('[title.service] Failed to load first prompt:', err)
      }
    }
    if (!originalPrompt) originalPrompt = prompt || ''
    if (!fallbackTitle && !h1Title) {
      const candidate = cleanFallbackPrompt(originalPrompt)
      fallbackTitle = isUsableTitle(candidate) ? candidate : ''
    }
    if (!fallbackTitle) fallbackTitle = h1Title

    const siteCues = [
      cues.title ? `HTML Title tag: "${cues.title}"` : '',
      cues.h1 ? `Main Heading (H1): "${cues.h1}"` : '',
      cues.description ? `Meta Description: "${cues.description}"` : '',
    ].filter(Boolean).join('\n')

    contextText = [
      originalPrompt ? `Original user brief: "${originalPrompt.slice(0, 300)}"` : '',
      siteCues ? `Generated Website Details:\n${siteCues}` : '',
      'Based on the generated website, produce a final, concise, punchy title (2-4 words). Prefer the brand/business name.',
    ].filter(Boolean).join('\n\n')
  }

  const aiTitle = await generateTitleWithAI(env, contextText)
  const generatedTitle = aiTitle || fallbackTitle

  if (!generatedTitle) {
    return { status: 'skipped', title: existingTitle, stage, reason: 'no_usable_title' }
  }

  if (!sessionId) {
    return { status: 'success', title: generatedTitle, stage }
  }

  // Atomic update guarded against concurrent renames / duplicate stage runs.
  const now = new Date().toISOString()
  const updatedRows = await sql`
    UPDATE sessions
    SET title = ${generatedTitle},
        metadata = jsonb_set(
          jsonb_set(
            coalesce(metadata, '{}'::jsonb),
            '{title_stage}',
            to_jsonb(${stage}::text)
          ),
          '{last_title_generated_at}',
          to_jsonb(${now}::text)
        ),
        updated_at = ${now}
    WHERE id = ${sessionId}
      AND user_id = ${userId}
      AND coalesce(metadata->>'custom_title', 'false') != 'true'
      AND coalesce(metadata->>'is_custom_title', 'false') != 'true'
      AND (
        CASE WHEN ${stage}::text = 'initial'
          THEN metadata->>'title_stage' IS NULL
          ELSE metadata->>'title_stage' IS DISTINCT FROM 'completion'
        END
      )
    RETURNING id, title
  `

  if (updatedRows.length === 0) {
    const freshSession = await getSessionForUser(env, sessionId, userId)
    return {
      status: 'skipped',
      title: (freshSession?.title as string) || existingTitle,
      stage,
      reason: 'race_guard_prevented_overwrite',
    }
  }

  return {
    status: 'success',
    title: (updatedRows[0].title as string) || generatedTitle,
    stage,
  }
}
