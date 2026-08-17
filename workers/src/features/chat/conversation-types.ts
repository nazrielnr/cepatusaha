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
  error?: string;
}
