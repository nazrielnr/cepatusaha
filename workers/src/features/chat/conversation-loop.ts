import type { AIProvider, ChatMessage, ChatParams, ToolCall } from '../models/ai-provider';
import type { FunctionCallHandler } from '../files/tool-handler';
import type { ExecutionContext } from '../files/tool-types';
import type { StaticToolCall } from '../../shared/types';
import { errorLog, warnLog } from '../../shared/logger';
import { formatToolResults, shouldContinueLoop } from './conversation-decision';
import { streamAIResponse } from './conversation-stream';
import { executeToolCalls, toExecutorToolCalls } from './conversation-tools';
import { saveFileBlocks, stripFileBlocks } from './file-blocks';
import { DEFAULT_RATE_LIMIT_CONFIG } from './conversation-types';
import { isChatRunStopped } from './stop';
import type { ConversationLoopConfig, IterationResult, LoopContext, LoopResult, RateLimitConfig, StreamManager } from './conversation-types';

const FILE_MUTATION_TOOLS = ['write_file', 'create_file', 'edit_file', 'replace_code', 'insert_code', 'batch_replace', 'delete_file'];
const FILE_CHANGE_REQUEST = /\b(buat|create|build|website|edit|ubah|ganti|hapus|delete|tambah|update)\b/i;
const text = (content: ChatMessage['content']) => typeof content === 'string' ? content : content.map((part) => part.type === 'text' ? part.text : '').join('\n');

/** A single LLM call exceeded `iterationTimeout` (possibly after internal retries are exhausted).
 *  The loop retries these silently; only exhausted retries surface to the UI. */
class IterationTimeoutError extends Error {
  constructor(iteration: number, timeoutMs: number) {
    super(`Iteration ${iteration} timed out after ${timeoutMs}ms`);
    this.name = 'IterationTimeoutError';
  }
}
export { DEFAULT_RATE_LIMIT_CONFIG } from './conversation-types';
export type { ConversationLoopConfig, IterationResult, LoopContext, LoopResult, RateLimitConfig, RateLimitStrategy, StreamManager } from './conversation-types';

export class ConversationLoop {
  private rateLimitConfig: RateLimitConfig;
  private MAX_MESSAGE_HISTORY = 50;

  constructor(
    private provider: AIProvider,
    private functionHandler: FunctionCallHandler,
    private streamManager: StreamManager | null,
    private config: ConversationLoopConfig,
    private preferredModel?: string,
    private reasoningEffort?: ChatParams['reasoning_effort'],
    private planMode = false,
    private disableImageTool = false
  ) {
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config.rateLimit };
  }

  async executeLoop(messages: ChatMessage[], context: LoopContext): Promise<LoopResult> {
    const history = [...messages];
    const start = Date.now();
    const isAborted = async () => Boolean(context.signal?.aborted || await isChatRunStopped(this.functionHandler.env, context.sessionId, context.runId));
    const executionContext: ExecutionContext = { user_id: context.userId, session_id: context.sessionId, project_id: context.projectId, clerk_user_id: context.clerkUserId, signal: context.signal, run_id: context.runId, isAborted };
    const allToolCalls: StaticToolCall[] = [];
    const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let stoppedByQuota = false;
    let finalMessage: ChatMessage = { role: 'assistant', content: '', tool_calls: [] };
    let iteration = 0;

    try {
      for (; iteration < this.config.maxIterations; iteration++) {
        const n = iteration + 1;
        await this.delay(n);
        if (await isAborted()) throw new Error('Stream aborted');
        // Timeout + silent retry lives inside runIteration (per LLM call), so tool
        // execution only ever happens once per iteration.
        const result = await this.runIteration(history, n, executionContext);

        allToolCalls.push(...(result.executedToolCalls || []));
        if (result.usage) {
          usage.prompt_tokens += result.usage.prompt_tokens;
          usage.completion_tokens += result.usage.completion_tokens;
          usage.total_tokens += result.usage.total_tokens;
        }

        // Live monthly quota: stop the loop once the month budget runs out mid-run.
        let monthExhausted = false;
        if (this.config.usageReporter && usage.total_tokens > 0) {
          const remainingMonth = await this.config.usageReporter(usage);
          monthExhausted = typeof remainingMonth === 'number' && remainingMonth <= 0;
        }
        if (monthExhausted) {
          stoppedByQuota = true;
          this.streamManager?.sendEvent('quota_hit', { tokensUsed: usage.total_tokens, monthly: monthExhausted });
        } else {
          this.streamManager?.sendEvent('iteration_data', {
            iteration: n,
            text: result.aiResponse.content.trim(),
            toolCalls: result.executedToolCalls || [],
            reasoning_content: result.aiResponse.reasoning_content,
            phase: result.aiResponse.toolCalls.length ? 'post_execution' : 'complete',
          });
          this.streamManager?.sendEvent('iteration_complete', { iteration: n, function_calls_count: result.executionResults.length, duration_ms: result.duration });
        }

        finalMessage = { role: 'assistant', content: result.aiResponse.content.trim(), tool_calls: allToolCalls.length ? allToolCalls as unknown as ToolCall[] : result.aiResponse.toolCalls };
        if (stoppedByQuota || !result.shouldContinue) break;
      }

      const maxed = iteration >= this.config.maxIterations && finalMessage.content === '';
      if (maxed) warnLog(undefined, '[ConversationLoop] Max iterations reached', { maxIterations: this.config.maxIterations, sessionId: context.sessionId });
      this.streamManager?.sendEvent('loop_complete', { total_iterations: Math.min(iteration + 1, this.config.maxIterations), total_function_calls: allToolCalls.length, max_iterations_reached: maxed });
      return { success: true, totalIterations: Math.min(iteration + 1, this.config.maxIterations), totalFunctionCalls: allToolCalls.length, finalMessage, usage: usage.total_tokens ? usage : undefined, stoppedByQuota };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errorLog(undefined, '[ConversationLoop] Loop failed', { error: msg, iteration, sessionId: context.sessionId, duration: Date.now() - start });
      this.streamManager?.sendEvent('error', { error: msg, iteration });
      return { success: false, totalIterations: iteration, totalFunctionCalls: allToolCalls.length, finalMessage, error: msg };
    }
  }

  private async runIteration(messages: ChatMessage[], iteration: number, context: ExecutionContext): Promise<IterationResult> {
    const start = Date.now();
    this.streamManager?.sendEvent('iteration_start', { iteration });
    const nextMessages = iteration === 1 ? messages : [...messages, { role: 'system' as const, content: this.iterationPrompt(messages, iteration) }];
    const wantsFileChange = messages.some((m) => m.role === 'user' && FILE_CHANGE_REQUEST.test(text(m.content)));
    const forceToolUse = wantsFileChange && !messages.some((m) => m.role === 'tool' && FILE_MUTATION_TOOLS.some((tool) => text(m.content).includes(`"tool_name":"${tool}"`)));

    // Single LLM call bounded by iterationTimeout, retried silently on timeout up to
    // iterationRetries ×. On timeout the in-flight stream is aborted so the provider
    // stops billing for a stalled call; the UI never sees the retry activity.
    // ponytail: an attempt that already streamed partial text will stream it again on
    // retry — suppress if partial-output visibility becomes worth buffering.
    const retries = Math.max(0, this.config.iterationRetries ?? 10);
    let ai!: Awaited<ReturnType<typeof streamAIResponse>>;
    for (let attempt = 0; ; attempt++) {
      const ctl = new AbortController();
      if (context.signal) context.signal.addEventListener('abort', () => ctl.abort());
      const call = streamAIResponse({ provider: this.provider, streamManager: this.streamManager, planMode: this.planMode, preferredModel: this.preferredModel, reasoningEffort: this.reasoningEffort, rateLimitConfig: this.rateLimitConfig, iteration, forceToolUse, disableImageTool: this.disableImageTool, signal: ctl.signal }, nextMessages);
      const timeoutMs = this.config.iterationTimeout;
      try {
        ai = await (timeoutMs > 0
          ? Promise.race([call, new Promise<never>((_, reject) => setTimeout(() => {
              ctl.abort();
              reject(new IterationTimeoutError(iteration, timeoutMs));
            }, timeoutMs))])
          : call);
        break;
      } catch (error) {
        const timedOut = error instanceof IterationTimeoutError && context.signal?.aborted !== true;
        if (!timedOut || attempt >= retries) throw error;
        warnLog(undefined, '[ConversationLoop] Iteration timed out, retrying silently', { iteration, attempt: attempt + 1, of: retries, session_id: context.session_id });
        if (await context.isAborted?.()) throw new Error('Stream aborted');
        await new Promise((r) => setTimeout(r, 1500 + attempt * 1000));
      }
    }


    messages.push({ role: 'assistant', content: ai.content, tool_calls: ai.toolCalls.length ? ai.toolCalls : undefined });
    this.prune(messages);

    let executionResults: IterationResult['executionResults'] = [];
    let executedToolCalls: StaticToolCall[] = [];
    const blockToolCalls = await saveFileBlocks(this.functionHandler.env, context, ai.content, this.streamManager, iteration);
    const cleanContent = stripFileBlocks(ai.content);
    if (blockToolCalls.length) executedToolCalls.push(...blockToolCalls);
    if (ai.toolCalls.length) {
      const executed = await executeToolCalls(this.functionHandler, this.streamManager, toExecutorToolCalls(ai.toolCalls, iteration, this.streamManager), context, iteration);
      executionResults = executed.executionResults;
      executedToolCalls.push(...executed.executedToolCalls);
      messages.push(...formatToolResults(ai.toolCalls, executionResults));
      this.prune(messages);
    }

    return {
      iteration,
      aiResponse: { content: cleanContent, toolCalls: ai.toolCalls, reasoning_content: ai.reasoning_content },
      executionResults,
      executedToolCalls,
      duration: Date.now() - start,
      shouldContinue: shouldContinueLoop(ai.toolCalls, iteration, executionResults),
      usage: ai.usage,
    };
  }

  private iterationPrompt(messages: ChatMessage[], iteration: number): string {
    const done: string[] = [];
    const failed: string[] = [];
    for (const m of messages) if (m.role === 'tool') try {
      const r = JSON.parse(text(m.content) || '{}');
      (r.success ? done : failed).push(`${m.name}${r.error ? `: ${r.error}` : ''}`);
    } catch {}
    return `ITERATION ${iteration}\nCompleted: ${done.join(', ') || '-'}\nFailed: ${failed.join(', ') || '-'}\nContinue only if needed. Use only provided tools. If complete, write a concise final response with no tool calls.`;
  }

  private async delay(iteration: number): Promise<void> {
    if (!this.rateLimitConfig.enabled || iteration <= 1) return;
    const { baseDelayMs, maxDelayMs, strategy, backoffMultiplier } = this.rateLimitConfig;
    const ms = Math.min(strategy === 'fixed' ? baseDelayMs : strategy === 'linear' ? baseDelayMs * (iteration - 1) : baseDelayMs * backoffMultiplier ** (iteration - 2), maxDelayMs);
    this.streamManager?.sendEvent('rate_limit_delay', { iteration, delayMs: ms, strategy });
    await new Promise((r) => setTimeout(r, ms));
  }

  private prune(messages: ChatMessage[]): void {
    if (messages.length <= this.MAX_MESSAGE_HISTORY) return;
    const system = messages.filter((m) => m.role === 'system').slice(0, 1);
    messages.splice(0, messages.length, ...system, ...messages.filter((m) => m.role !== 'system').slice(-(this.MAX_MESSAGE_HISTORY - system.length)));
  }
}
