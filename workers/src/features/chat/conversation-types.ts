import type { ChatMessage, ChatParams, ToolCall } from '../models/ai-provider';
import type { ExecutionResult, ToolValue } from '../files/tool-types';
import type { StaticToolCall } from '../../shared/types';

export interface StreamManager {
  sendEvent(type: string, data: Record<string, unknown>): void;
  sendFunctionCallComplete(id: string, success: boolean, data?: ToolValue, error?: string, name?: string): void;
}

export type RateLimitStrategy = 'fixed' | 'linear' | 'exponential';
export interface RateLimitConfig {
  enabled: boolean;
  baseDelayMs: number;
  maxDelayMs: number;
  strategy: RateLimitStrategy;
  backoffMultiplier: number;
  retryOn429: boolean;
  maxRetries429: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  baseDelayMs: 500,
  maxDelayMs: 30000,
  strategy: 'exponential',
  backoffMultiplier: 1.5,
  retryOn429: true,
  maxRetries429: 3,
};

export interface ConversationLoopConfig {
  maxIterations: number;
  iterationTimeout: number;
  enabled: boolean;
  rateLimit?: Partial<RateLimitConfig>;
  /** Silent retries after an iteration times out (default 10). Retries are hidden from the UI. */
  iterationRetries?: number;
  /** Called after each iteration with tokens consumed so far in this run. Returns remaining monthly
   *  quota (<= 0 stops the run early). Implementations must charge the delta only once. */
  usageReporter?: (cumulative: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => Promise<number | undefined>;
}

export interface LoopContext {
  userId: string;
  sessionId: string;
  projectId: string;
  clerkUserId: string;
  signal?: AbortSignal;
  runId?: string;
}

export interface IterationResult {
  iteration: number;
  aiResponse: { content: string; toolCalls: ToolCall[]; reasoning_content?: string };
  executionResults: ExecutionResult[];
  executedToolCalls?: StaticToolCall[];
  duration: number;
  shouldContinue: boolean;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface LoopResult {
  success: boolean;
  totalIterations: number;
  totalFunctionCalls: number;
  finalMessage: ChatMessage;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  /** True when the loop stopped because the per-run token cap was hit. */
  stoppedByQuota?: boolean;
  error?: string;
}
