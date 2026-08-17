/**
 * Streaming Types (Server-Sent Events)
 * Types for SSE streaming between frontend and backend
 */

/**
 * Text chunk event - sent as AI generates response text
 */
export interface TextChunkEvent {
  type: 'text_chunk';
  content: string;
}

/**
 * Thinking chunk event - sent as AI generates reasoning/thinking process
 */
export interface ThinkingChunkEvent {
  type: 'thinking_chunk';
  content: string;
}

/**
 * Text done event - sent when text streaming is complete
 */
export interface TextDoneEvent {
  type: 'text_done';
}

/**
 * Function call start event - sent when a function begins execution
 */
export interface FunctionCallStartEvent {
  type: 'function_call_start';
  id: string;
  name: string;
  args: Record<string, unknown>;
  file_path?: string;
}

/**
 * Function call complete event - sent when a function finishes
 */
export interface FunctionCallCompleteEvent {
  type: 'function_call_complete';
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
  execution_time_ms?: number;
}

/**
 * Iteration start event - sent when conversation loop iteration begins
 */
export interface IterationStartEvent {
  type: 'iteration_start';
  iteration: number;
}

/**
 * Iteration complete event - sent when conversation loop iteration ends
 */
export interface IterationCompleteEvent {
  type: 'iteration_complete';
  iteration: number;
  function_calls_count: number;
}

/**
 * Loop complete event - sent when conversation loop finishes
 */
export interface LoopCompleteEvent {
  type: 'loop_complete';
  total_iterations: number;
  total_function_calls: number;
}

/**
 * Metadata event - sent with additional context
 */
export interface MetadataEvent {
  type: 'metadata';
  intent?: 'chat' | 'build';
  action?: string;
  autoTrigger?: boolean;
  [key: string]: unknown;
}

/**
 * Done event - sent when streaming is complete
 */
export interface DoneEvent {
  type: 'done';
  message_id: string;
  total_tokens?: number;
}

/**
 * Error event - sent when an error occurs
 */
export interface ErrorEvent {
  type: 'error';
  error: string;
  code?: string;
}

/**
 * Union type of all possible stream events
 */
export type StreamEvent =
  | TextChunkEvent
  | ThinkingChunkEvent
  | TextDoneEvent
  | FunctionCallStartEvent
  | FunctionCallCompleteEvent
  | IterationStartEvent
  | IterationCompleteEvent
  | LoopCompleteEvent
  | MetadataEvent
  | DoneEvent
  | ErrorEvent;

/**
 * Iteration data structure for playback sequences
 */
export interface IterationData {
  iteration: number;
  text?: string;
  toolCalls?: any[];
  textBeforeTools?: boolean;
}

/**
 * Stream chunk types for AI provider interface
 */
export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; tool_call: unknown }
  | { type: 'done'; message: unknown };
