import { createSql } from '../../db';
import type { Bindings } from '../../bindings';
import { cached } from '../../shared/ttl-cache';
import type { ToolValue } from '../files/tool-types';

export type SkillSummary = { id: string; title: string; description: string };

type SkillRefRow = { skill_id: string; path: string; title: string; description: string; content: string; size_chars: number };

type LoadSkillsOptions = {
  ids: string[];
  raw?: boolean;
  paths?: string[];
  path?: string;
  line_start?: number;
  line_end?: number;
  cursor?: number;
  max_chars?: number;
  all?: boolean;
  query?: string;
};

export const DEFAULT_SKILL_SUMMARIES: SkillSummary[] = [
  { id: 'frontend-design', title: 'frontend-design', description: 'Create distinctive, production-grade frontend interfaces with high design quality; use for websites, landing pages, dashboards, React components, HTML/CSS layouts, or UI styling.' },
  { id: 'huashu-design', title: 'huashu-design', description: 'High-fidelity HTML prototypes, interaction demos, slides, animations, design variants, design direction, visual style recommendations, and expert design review.' },
  { id: 'web-design-guidelines', title: 'web-design-guidelines', description: 'Review UI code for Web Interface Guidelines compliance: accessibility, UX, design quality, and best practices.' },
  { id: 'make-interfaces-feel-better', title: 'make-interfaces-feel-better', description: 'Design engineering polish for UI components: animation, hover states, shadows, borders, typography, micro-interactions, optical alignment, and details.' },
  { id: 'stop-slop', title: 'stop-slop', description: 'Remove AI writing patterns from prose; use when drafting, editing, or reviewing text to eliminate predictable AI tells.' },
  { id: 'slop-detector', title: 'slop-detector', description: 'Detect AI-generated writing patterns in prose: vague language, identity leaks, hallucinated claims, stubs, document bloat, and slop before publishing.' },
];

const SKILL_IDS = new Set(DEFAULT_SKILL_SUMMARIES.map((s) => s.id));
const DEFAULT_REF_BUDGET = 6000;
const HARD_REF_BUDGET = 12000;
const DEFAULT_RAW_CHARS = 4000;
const HARD_RAW_CHARS = 12000;
const SKILLS_TTL_MS = 5 * 60 * 1000;
const skillSummariesCache = new Map<string, { expires: number; value: Promise<SkillSummary[]> }>();
const skillRefsCache = new Map<string, { expires: number; value: Promise<SkillRefRow[]> }>();
export const SKILL_ERROR_SUMMARY = `You have skills: ${DEFAULT_SKILL_SUMMARIES.map((s) => s.title).join(', ')}.`;

export async function listSkillSummaries(env: Bindings): Promise<SkillSummary[]> {
  try {
    return await cached(skillSummariesCache, 'active', SKILLS_TTL_MS, async () => {
      const rows = await createSql(env)`select id, title, description from agent_skills where is_active = true order by title` as SkillSummary[];
      return rows.length ? rows : DEFAULT_SKILL_SUMMARIES;
    });
  } catch { return DEFAULT_SKILL_SUMMARIES; }
}

export async function listSkill(env: Bindings, id?: string): Promise<ToolValue> {
  try {
    if (!id) return { skills: await listSkillSummaries(env) };
    if (!SKILL_IDS.has(id)) return { skills: await listSkillSummaries(env), refs: [], message: SKILL_ERROR_SUMMARY };
    const refs = await createSql(env)`
      select skill_id, path, title, description, content, size_chars
      from agent_skill_refs
      where skill_id = ${id}
      order by case when path = 'SKILL.md' then 0 else 1 end, path
    ` as SkillRefRow[];
    return { skill_id: id, refs: refs.map((r) => ({ skill_id: r.skill_id, path: r.path, title: r.title, description: r.description, size_chars: r.size_chars, total_lines: r.content.split('\n').length })) };
  } catch (error) { return toolError(error); }
}

export async function loadSkills(env: Bindings, options: LoadSkillsOptions, sessionId?: string): Promise<ToolValue> {
  const ids = normalizeIds(options.ids);
  if (!ids.length) return { skills: [], available_skills: DEFAULT_SKILL_SUMMARIES, message: SKILL_ERROR_SUMMARY };
  return options.raw ? loadRawSkills(env, { ...options, ids }, sessionId) : loadCompactSkills(env, { ...options, ids }, sessionId);
}

async function loadCompactSkills(env: Bindings, options: LoadSkillsOptions, sessionId?: string): Promise<ToolValue> {
  const budget = clamp(options.max_chars ?? DEFAULT_REF_BUDGET, 1, HARD_REF_BUDGET);
  try {
    const rows = await allRefs(env);
    const wanted = new Set(options.ids);
    const query = options.query || options.ids.join(' ');
    const ranked = rows.filter((row) => wanted.has(row.skill_id)).map((row) => ({ row, score: scoreRef(row, query) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.row.size_chars - b.row.size_chars);
    const picked = ranked.length ? ranked : rows.filter((row) => wanted.has(row.skill_id) && row.path === 'SKILL.md').map((row) => ({ row, score: 1 }));
    let used = 0;
    const chunks = [] as ToolValue[];
    for (const { row, score } of picked) {
      if (used >= budget) break;
      const room = Math.min(3000, budget - used);
      const content = excerpt(row.content, query, room);
      used += content.length;
      chunks.push({ skill_id: row.skill_id, path: row.path, title: row.title, description: row.description, score, content, truncated: row.content.length > content.length, size_chars: row.size_chars });
    }
    await logCalls(env, options.ids, sessionId);
    return { mode: 'compact', chunks, budget_used: used, max_chars: budget, available_skills: DEFAULT_SKILL_SUMMARIES };
  } catch (error) { return toolError(error); }
}

async function loadRawSkills(env: Bindings, options: LoadSkillsOptions, sessionId?: string): Promise<ToolValue> {
  const paths = [...new Set([...(options.paths || []), ...(options.path ? [options.path] : [])].filter(Boolean))];
  const limit = clamp(options.max_chars ?? DEFAULT_RAW_CHARS, 1, HARD_RAW_CHARS);
  try {
    let refs = (await allRefs(env)).filter((r) => options.ids.includes(r.skill_id));
    if (paths.length) refs = refs.filter((r) => paths.includes(r.path));
    else if (!options.all) refs = refs.filter((r) => r.path === 'SKILL.md');

    const files = refs.map((ref) => rawRef(ref, options, limit));
    await logCalls(env, options.ids, sessionId);
    return { mode: 'raw', files, ...(options.all ? { warning: 'raw all may exceed model context; prefer paths or line ranges' } : {}) };
  } catch (error) { return toolError(error); }
}

function rawRef(ref: SkillRefRow, options: LoadSkillsOptions, limit: number): ToolValue {
  if (options.line_start !== undefined || options.line_end !== undefined) {
    const lines = ref.content.split('\n');
    const startLine = clamp(options.line_start ?? 1, 1, lines.length);
    const endLine = clamp(options.line_end ?? Math.min(lines.length, startLine + 120), startLine, lines.length);
    const selected = lines.slice(startLine - 1, endLine);
    return { skill_id: ref.skill_id, path: ref.path, title: ref.title, description: ref.description, content: selected.join('\n'), content_with_line_numbers: selected.map((line, i) => `${startLine + i}: ${line}`).join('\n'), line_start: startLine, line_end: endLine, total_lines: lines.length, next_line: endLine < lines.length ? endLine + 1 : null, truncated: endLine < lines.length, size_chars: ref.size_chars };
  }

  if (options.all) return { skill_id: ref.skill_id, path: ref.path, title: ref.title, description: ref.description, content: ref.content, truncated: false, size_chars: ref.size_chars };

  const start = Math.max(0, options.cursor ?? 0);
  const content = ref.content.slice(start, start + limit);
  const nextCursor = start + limit < ref.content.length ? start + limit : null;
  return { skill_id: ref.skill_id, path: ref.path, title: ref.title, description: ref.description, content, cursor: start, next_cursor: nextCursor, truncated: nextCursor !== null, size_chars: ref.size_chars };
}

async function allRefs(env: Bindings): Promise<SkillRefRow[]> {
  return cached(skillRefsCache, 'all', SKILLS_TTL_MS, async () => await createSql(env)`
    select skill_id, path, title, description, content, size_chars
    from agent_skill_refs
    where skill_id in ('frontend-design', 'huashu-design', 'web-design-guidelines', 'make-interfaces-feel-better', 'stop-slop', 'slop-detector')
    order by case when path = 'SKILL.md' then 0 else 1 end, path
  ` as SkillRefRow[]);
}

async function logCalls(env: Bindings, ids: string[], sessionId?: string) {
  if (!sessionId) return;
  for (const id of ids) { try { await createSql(env)`insert into agent_skill_calls (session_id, skill_id) values (${sessionId}, ${id})`; } catch {} }
}

function normalizeIds(ids: string[]): string[] { return [...new Set((ids || []).map((id) => id.trim()).filter((id) => SKILL_IDS.has(id)))]; }
function scoreRef(row: SkillRefRow, query: string): number {
  const hay = `${row.path} ${row.title} ${row.description} ${row.content.slice(0, 3000)}`.toLowerCase();
  const terms = query.toLowerCase().split(/[^a-z0-9\u00c0-\uffff_-]+/).filter((x) => x.length > 2);
  if (!terms.length) return row.path === 'SKILL.md' ? 2 : 0;
  let score = row.path === 'SKILL.md' ? 1 : 0;
  for (const term of terms) if (hay.includes(term)) score++;
  return score;
}
function excerpt(content: string, query: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  const terms = query.toLowerCase().split(/[^a-z0-9\u00c0-\uffff_-]+/).filter((x) => x.length > 2);
  const lower = content.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, hit - Math.floor(maxChars / 3));
  return content.slice(start, start + maxChars);
}
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.floor(value) : min)); }
function toolError(error: unknown): ToolValue { return { skills: [], available_skills: DEFAULT_SKILL_SUMMARIES, message: SKILL_ERROR_SUMMARY, error: error instanceof Error ? error.message : 'Skill tool failed' }; }
