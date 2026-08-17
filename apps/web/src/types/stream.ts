export interface TextChunkEvent {
  type: 'text_chunk'
  content: string
}

export interface ThinkingChunkEvent {
  type: 'thinking_chunk'
  content: string
}

export interface FunctionCallStartEvent {
  type: 'function_call_start'
  id: string
  name: string
  args: Record<string, any>
}

export interface FunctionCallCompleteEvent {
  type: 'function_call_complete'
  id: string
  success: boolean
  data?: any
  error?: string
  execution_time_ms?: number
}

export interface MetadataEvent {
  type: 'metadata'
  intent: 'chat' | 'build'
  action: string
  autoTrigger?: boolean
}

export interface TextDoneEvent {
  type: 'text_done'
}

export interface DoneEvent {
  type: 'done'
  message_id: string
  total_tokens?: number
}

export interface ErrorEvent {
  type: 'error'
  error: string
  code?: string
}

export interface IterationStartEvent {
  type: 'iteration_start'
  iteration: number
}

export interface IterationCompleteEvent {
  type: 'iteration_complete'
  iteration: number
  function_calls_count: number
}

export interface LoopCompleteEvent {
  type: 'loop_complete'
  total_iterations: number
  total_function_calls: number
}

export type StreamEvent =
  | TextChunkEvent
  | ThinkingChunkEvent
  | TextDoneEvent
  | FunctionCallStartEvent
  | FunctionCallCompleteEvent
  | MetadataEvent
  | DoneEvent
  | ErrorEvent
  | IterationStartEvent
  | IterationCompleteEvent
  | LoopCompleteEvent
