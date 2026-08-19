import type { AIProvider, ChatMessage, ChatParams, ToolCall } from '../models/ai-provider';
import type { RateLimitConfig, StreamManager } from './conversation-types';
import { errorLog, warnLog } from '../../shared/logger';
import { toolFilePath, toolFilePathFromJson } from '../files/tool-path';

type TokenUsage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

// Billing fallback: if the provider omits usage, estimate ~4 chars ≈ 1 token.
const estimateTokens = (chars: number) => Math.max(1, Math.ceil(chars / 4));
function estimateUsage(messages: ChatMessage[], found: { content: string; reasoningContent: string; toolCalls: Map<string, ToolCall>; attempts: number }): TokenUsage {
  const inputChars = messages.reduce((sum, m) => {
    let chars = typeof m.content === 'string' ? m.content.length : JSON.stringify(m.content).length;
    if (m.tool_calls) chars += JSON.stringify(m.tool_calls).length;
    return sum + chars;
  }, 0);
  const outputChars = found.content.length + found.reasoningContent.length
    + [...found.toolCalls.values()].reduce((n, tc) => n + (tc.function.arguments?.length || 0), 0);
  // Retried attempts also consumed input tokens server-side; count them too.
  const promptTokens = estimateTokens(inputChars) * Math.max(1, found.attempts);
  const completionTokens = estimateTokens(outputChars);
  return { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };
}

function jsonStringField(raw: string, key: string): string | undefined {
  const match = new RegExp(`"${key}"\\s*:\\s*"`).exec(raw);
  if (!match) return undefined;
  let value = '';
  let escaped = false;
  for (let i = match.index + match[0].length; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { value += `\\${ch}`; escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') break;
    value += ch;
  }
  try { return JSON.parse(`"${value}"`) as string; } catch { return value.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'); }
}

function validOrRepairedToolCall(tc: ToolCall): ToolCall {
  const raw = tc.function.arguments || '';
  try { JSON.parse(raw || '{}'); return tc; } catch {}
  // ponytail: repair only huge write_file args; all other invalid JSON forwarded so executor returns structured error.
  if (['write_file', 'create_file'].includes(tc.function.name)) {
    const path = jsonStringField(raw, 'path') ?? jsonStringField(raw, 'file_path');
    const content = jsonStringField(raw, 'content');
    if (path && content && content.length >= 20) return { ...tc, function: { ...tc.function, arguments: JSON.stringify({ path, content, overwrite: true }) } };
  }
  return tc;
}

export type StreamAIResponseDeps = {
  provider: AIProvider;
  streamManager: StreamManager | null;
  planMode: boolean;
  preferredModel?: string;
  reasoningEffort?: ChatParams['reasoning_effort'];
  rateLimitConfig: RateLimitConfig;
  iteration: number;
  forceToolUse?: boolean;
  disableImageTool?: boolean;
  signal?: AbortSignal;
};

export async function streamAIResponse(deps: StreamAIResponseDeps, messages: ChatMessage[]): Promise<{ content: string; toolCalls: ToolCall[]; reasoning_content?: string; usage?: TokenUsage }> {
  const { provider, streamManager, planMode, preferredModel, reasoningEffort, rateLimitConfig, iteration, forceToolUse, disableImageTool, signal } = deps;
  const { TOOL_SCHEMAS } = await import('../files/tools');
  const baseTools = disableImageTool ? TOOL_SCHEMAS.filter((tool) => tool.name !== 'analyze_image') : TOOL_SCHEMAS;
  const tools = planMode ? [...(await import('../planning/tools')).PLANNING_TOOL_SCHEMAS, ...baseTools] : baseTools;

  for (let retry = 0; ; retry++) {
    let content = '';
    let reasoningContent = '';
    const toolCalls = new Map<string, ToolCall>();
    const detectedToolCalls = new Set<string>();
    let usage: TokenUsage | undefined;
    let stream: AsyncGenerator<import('../models/ai-provider').StreamChunk, import('../models/ai-provider').ChatResponse, unknown> | undefined;

    try {
      stream = provider.chatStream({ messages, tools, model: preferredModel, reasoning_effort: reasoningEffort, tool_choice: forceToolUse ? 'required' : 'auto' });
      while (true) {
        const next = await stream.next();
        // ponytail: check is signal-only here — free on Workers; the DB stop flag (`/api/chat/stop`)
        // is polled once per loop iteration instead. Polling Neon per chunk blows the 50-subrequest
        // (free plan) budget on long replies; upgrade path: Durable Object stop flag + nanosecond locks.
        if (signal?.aborted) throw new Error('Stream aborted');
        if (next.done) { usage = next.value?.usage; break; }
        const chunk = next.value;
        if (chunk.type === 'text') {
          content += chunk.content;
          if (chunk.content.trim()) streamManager?.sendEvent('text_chunk', { content: chunk.content, accumulated: content.trimStart() });
        } else if (chunk.type === 'thinking') {
          reasoningContent += chunk.content;
          streamManager?.sendEvent('thinking_chunk', { content: chunk.content });
        } else if (chunk.type === 'tool_call') {
          const tc = chunk.tool_call;
          if (tc.function.name) {
            let args: Record<string, unknown> = {};
            let skillIds: string[] | undefined;
            try {
              args = JSON.parse(tc.function.arguments || '{}');
              if (tc.function.name === 'load_skills' && Array.isArray(args.ids)) skillIds = args.ids.filter((id: unknown): id is string => typeof id === 'string');
              if (tc.function.name === 'list_skill' && typeof args.skill_id === 'string') skillIds = [args.skill_id];
              if (tc.function.name === 'get_design' && typeof args.id === 'string') skillIds = [args.id];
            } catch {}
            const filePath = toolFilePath(args) || toolFilePathFromJson(tc.function.arguments || '');
            if (!detectedToolCalls.has(tc.id) || filePath || Object.keys(args).length || skillIds?.length) {
              streamManager?.sendEvent('tool_call_detected', { id: tc.id, name: tc.function.name, args, ...(filePath && { file_path: filePath }), ...(skillIds?.length && { skill_ids: skillIds }), status: 'pending', iteration });
              if (filePath || Object.keys(args).length || skillIds?.length) detectedToolCalls.add(tc.id);
            }
          }
          const executable = validOrRepairedToolCall(tc);
          toolCalls.set(executable.id, executable);
        }
      }
      streamManager?.sendEvent('text_done', {});
      if (!usage) usage = estimateUsage(messages, { content, reasoningContent, toolCalls, attempts: retry + 1 });
      return { content, toolCalls: [...toolCalls.values()], reasoning_content: reasoningContent || undefined, usage };
    } catch (error) {
      try { await stream?.return?.({ message: { role: 'assistant', content: '' } }); } catch {}
      // Aborted (loop attempt timeout or user stop): propagate silently — no UI event, no internal retry.
      if (signal?.aborted) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      const is429 = /429|rate limit|too many requests/i.test(msg);
      const max = is429 ? rateLimitConfig.maxRetries429 : 2;
      if (retry >= max || (is429 && !rateLimitConfig.retryOn429)) {
        errorLog(undefined, '[ConversationLoop] AI API error after retries', { error: msg, retry, is429 });
        streamManager?.sendEvent('error', { error: `AI API error: ${msg}`, retries: retry, isRateLimitError: is429 });
        throw error;
      }
      const delay = is429 ? Math.min(5000 * 2 ** retry, 60000) : Math.min(2000 * 2 ** retry, 8000);
      warnLog(undefined, '[ConversationLoop] AI API retry', { error: msg, retry: retry + 1, delay, is429 });
      if (is429) streamManager?.sendEvent('rate_limit_retry', { retryCount: retry + 1, delayMs: delay, error: 'Rate limit exceeded' });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
