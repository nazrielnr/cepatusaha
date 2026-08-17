import type { Bindings } from '../../bindings'
import { createSql } from '../../db'
import { getSessionDbUserId } from './service'
import { normalizeReasoningMetadata } from '../chat/reasoning-metadata'

export async function assertSessionOwner(env: Bindings, clerkUserId: string, sessionId: string): Promise<void> {
  const userId = await getSessionDbUserId(env, clerkUserId)
  const rows = await createSql(env)`select id from sessions where id = ${sessionId} and user_id = ${userId} limit 1`
  if (!rows.length) throw new Error('NOT_FOUND')
}

export async function listMessages(env: Bindings, sessionId: string, limit: number, offset: number) {
  return await createSql(env)`
    select * from chat_messages
    where session_id = ${sessionId}
    order by timestamp asc
    limit ${limit} offset ${offset}
  `
}

type IncomingMessage = { id?: string; sender?: string; content?: string; createdAt?: string; metadata?: unknown; tool_calls?: unknown; toolCalls?: unknown; tool_results?: unknown }

export async function upsertMessages(env: Bindings, sessionId: string, messages: IncomingMessage[]) {
  const sql = createSql(env)
  const rows = Array.from(new Map(messages.map((m) => [m.id, {
    id: m.id,
    role: m.sender === 'ai' ? 'ai' : m.sender === 'tool' ? 'tool' : 'user',
    content: m.content ?? '',
    timestamp: typeof m.createdAt === 'string' ? m.createdAt : new Date().toISOString(),
    metadata: JSON.stringify(normalizeReasoningMetadata(m.metadata)),
    tool_calls: JSON.stringify(m.tool_calls ?? m.toolCalls ?? null),
    tool_results: JSON.stringify(m.tool_results ?? null),
  }])).values())
  const saved: Array<Record<string, unknown>> = []
  for (const row of rows) {
    const result = await sql`
      insert into chat_messages (id, session_id, role, content, timestamp, metadata, tool_calls, tool_results)
      values (${row.id}, ${sessionId}, ${row.role}, ${row.content}, ${row.timestamp}, ${row.metadata}::jsonb, ${row.tool_calls}::jsonb, ${row.tool_results}::jsonb)
      on conflict (id) do update set
        role = excluded.role,
        content = excluded.content,
        timestamp = excluded.timestamp,
        metadata = excluded.metadata,
        tool_calls = excluded.tool_calls,
        tool_results = excluded.tool_results
      returning *
    `
    saved.push(result[0])
  }
  return saved
}

export async function deleteCheckpointMessages(env: Bindings, sessionId: string) {
  await createSql(env)`
    delete from chat_messages
    where session_id = ${sessionId}
      and (role = 'checkpoint_indicator' or metadata->>'is_checkpoint_indicator' = 'true')
  `
}

export async function appendAiMessage(env: Bindings, sessionId: string, content: string, toolCalls: unknown[] | null, metadata: Record<string, unknown>): Promise<string | null> {
  const rows = await createSql(env)`
    insert into chat_messages (session_id, role, content, tool_calls, metadata)
    values (${sessionId}, 'ai', ${content}, ${JSON.stringify(toolCalls)}::jsonb, ${JSON.stringify(normalizeReasoningMetadata(metadata))}::jsonb)
    returning id
  `
  return rows[0]?.id ?? null
}
