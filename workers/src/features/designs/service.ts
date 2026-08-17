import { createSql } from '../../db';
import type { Bindings } from '../../bindings';
import { cached } from '../../shared/ttl-cache';
import type { ToolValue } from '../files/tool-types';

type DesignRow = { id: string; name: string; description: string; content: string; size_chars: number; total_lines: number; source_url: string };

const DEFAULT_SEARCH_LIMIT = 8;
const HARD_SEARCH_LIMIT = 20;
const DEFAULT_GET_CHARS = 6000;
const HARD_GET_CHARS = 20000;
const DESIGNS_TTL_MS = 5 * 60 * 1000;
const designsCache = new Map<string, { expires: number; value: Promise<DesignRow[]> }>();

export async function searchDesign(env: Bindings, query: string, limit = DEFAULT_SEARCH_LIMIT): Promise<ToolValue> {
  const q = (query || '').trim();
  if (!q) return { designs: [], error: 'query is required' };
  try {
    const rows = await allDesigns(env);
    const terms = termsOf(q);
    const designs = rows
      .map((row) => ({ row, score: score(row, terms) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id))
      .slice(0, clamp(limit, 1, HARD_SEARCH_LIMIT))
      .map(({ row, score }) => ({ id: row.id, name: row.name, description: row.description, size_chars: row.size_chars, total_lines: row.total_lines, source_url: row.source_url, score }));
    return { query: q, designs };
  } catch (error) { return toolError(error); }
}

export async function getDesign(env: Bindings, id: string, maxChars = DEFAULT_GET_CHARS, cursor = 0, lineStart?: number, lineEnd?: number): Promise<ToolValue> {
  if (!id) return { error: 'id is required' };
  try {
    const rows = await createSql(env)`select id, name, description, content, size_chars, total_lines, source_url from agent_designs where id = ${id} limit 1` as DesignRow[];
    const row = rows[0];
    if (!row) return { id, error: 'Design not found' };

    if (lineStart !== undefined || lineEnd !== undefined) {
      const lines = row.content.split('\n');
      const startLine = clamp(lineStart ?? 1, 1, lines.length);
      const endLine = clamp(lineEnd ?? Math.min(lines.length, startLine + 180), startLine, lines.length);
      const selected = lines.slice(startLine - 1, endLine);
      return meta(row, {
        content: selected.join('\n'),
        content_with_line_numbers: selected.map((line, i) => `${startLine + i}: ${line}`).join('\n'),
        line_start: startLine,
        line_end: endLine,
        next_line: endLine < lines.length ? endLine + 1 : null,
        truncated: endLine < lines.length,
      });
    }

    const limit = clamp(maxChars, 1, HARD_GET_CHARS);
    const start = Math.max(0, cursor || 0);
    const content = row.content.slice(start, start + limit);
    const nextCursor = start + limit < row.content.length ? start + limit : null;
    return meta(row, { content, cursor: start, next_cursor: nextCursor, truncated: nextCursor !== null });
  } catch (error) { return toolError(error); }
}

async function allDesigns(env: Bindings): Promise<DesignRow[]> {
  return cached(designsCache, 'all', DESIGNS_TTL_MS, async () => await createSql(env)`select id, name, description, content, size_chars, total_lines, source_url from agent_designs order by id` as DesignRow[]);
}

function meta(row: DesignRow, extra: Record<string, ToolValue>): ToolValue {
  return { id: row.id, name: row.name, description: row.description, size_chars: row.size_chars, total_lines: row.total_lines, source_url: row.source_url, ...extra };
}

function termsOf(query: string): string[] {
  return query.toLowerCase().split(/[^a-z0-9\u00c0-\uffff_-]+/).filter((x) => x.length > 1);
}

function score(row: DesignRow, terms: string[]): number {
  const id = row.id.toLowerCase();
  const name = row.name.toLowerCase();
  const desc = row.description.toLowerCase();
  const head = row.content.slice(0, 6000).toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (id === term) score += 100;
    else if (id.includes(term)) score += 20;
    if (name.includes(term)) score += 16;
    if (desc.includes(term)) score += 8;
    if (head.includes(term)) score += 2;
  }
  return score;
}

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.floor(value) : min)); }
function toolError(error: unknown): ToolValue { return { designs: [], error: error instanceof Error ? error.message : 'Design tool failed' }; }
