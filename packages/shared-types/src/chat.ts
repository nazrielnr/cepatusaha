/**
 * Chat and Messaging Types
 * Types for chat functionality shared between frontend and backend
 */

/**
 * Chat mode type
 */
export type ChatMode = 'chat' | 'build' | 'edit';

/**
 * Chat role type
 */
export type ChatRole = 'user' | 'ai' | 'assistant' | 'tool' | 'system';

/**
 * Action status for function calls
 */
export type ActionStatus = 'pending' | 'running' | 'completed' | 'error';

/**
 * Action types for function calls
 */
export type ActionType =
  | 'create_file'
  | 'delete_file'
  | 'edit_file'
  | 'read_file'
  | 'list_files'
  | 'search_in_files'
  | 'replace_code'
  | 'request_external_resource'
  | 'add_dependency'
  | 'remove_dependency'
  | 'run_preview'
  | 'publish_site'
  | 'check_workspace'
  | 'insert_code'
  | 'validate_code'
  | 'batch_replace'
  | 'rename_file'
  | 'copy_file'
  | 'get_file_diff'
  | 'get_element_selector';

/**
 * Action item for UI display
 */
export interface ActionItem {
  id: string;
  type: ActionType;
  label: string;
  status: ActionStatus;
  code?: string;
  data?: ResourceRequestData;
}

/**
 * Input field definition for resource request forms
 */
export interface InputField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'file' | 'color';
  required: boolean;
}

/**
 * Resource request data for dynamic forms
 */
export interface ResourceRequestData {
  resource_type: 'image' | 'logo' | 'text' | 'url' | 'file' | 'color' | 'font';
  purpose: string;
  input_fields: InputField[];
}

/**
 * Element context for targeted editing
 */
export interface ElementContext {
  tag: string;
  classes: string;
  text: string;
  isTextEditable: boolean;
}

/**
 * Chat message entity
 */
export interface ChatMessage {
  id: string;
  session_id?: string;
  sender?: 'ai' | 'user';
  role?: ChatRole;
  content: string;
  timestamp?: string | Date;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
  elementContext?: ElementContext;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  thinking?: string;
  actions?: ActionItem[];
}

/**
 * Tool call structure
 */
export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
  status: 'pending' | 'executing' | 'completed' | 'error';
  progress?: ToolCallProgress;
  isFrontendDetected?: boolean;
  isPartial?: boolean;
  file_path?: string;
}

/**
 * Tool call progress
 */
export interface ToolCallProgress {
  status: string;
  details?: Record<string, unknown>;
}

/**
 * Execution result from tool calls
 */
export interface ExecutionResult {
  tool_call_id: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tool_name?: string;
}

/**
 * Message metadata
 */
export interface MessageMetadata {
  mode?: ChatMode;
  streaming?: boolean;
  pending_iteration?: boolean;
  iteration?: number;
  text_streaming_done?: boolean;
  reasoning_content?: string;
  reasoning_done?: boolean;
  reasoning_duration_ms?: number;
  /** @deprecated Use reasoning_content. */
  thinking_content?: string;
  is_thinking?: boolean;
  /** @deprecated Use reasoning_done. */
  thinking_done?: boolean;
  tool_calls?: ToolCall[];
  execution_results?: ExecutionResult[];
  intent?: string;
  action?: 'trigger_generate' | 'trigger_edit' | 'chat';
  autoTrigger?: boolean;
  await_user_input?: boolean;
  error?: boolean;
  errorType?: 'cancelled' | 'network' | 'unknown';
  canRetry?: boolean;
}

/**
 * Conversation message (for API requests)
 */
export interface ConversationMessage {
  role?: ChatRole;
  sender?: 'user' | 'ai' | 'tool';
  content: string;
  timestamp?: string | Date;
}

/**
 * Chat request structure
 */
export interface ChatRequest {
  conversation: ConversationMessage[];
  sessionId?: string;
  context?: Record<string, unknown>;
  mode?: ChatMode;
}

/**
 * Chat response structure (streaming)
 */
export interface ChatResponse {
  reply: string;
  mode?: ChatMode;
  metadata?: {
    intent: 'build' | 'edit' | 'chat';
    action: 'trigger_generate' | 'trigger_edit' | 'chat';
    autoTrigger: boolean;
    hasPreview: boolean;
  };
}

/**
 * Tool call structure for static responses
 */
export interface StaticToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status?: 'pending' | 'success' | 'error';
  error?: string;
}

/**
 * Iteration data for progressive display
 * Each iteration contains its own text and tool calls
 */
export interface IterationData {
  iteration: number;
  text?: string;
  toolCalls?: StaticToolCall[];
  textBeforeTools?: boolean;
}

/**
 * Static chat response structure (for fake streaming)
 * Complete response returned in a single HTTP request
 */
export interface StaticChatResponse {
  text: string;
  toolCalls?: StaticToolCall[];
  iterations?: IterationData[]; // Array of iterations for progressive display
  metadata?: {
    model?: string;
    tokens?: {
      prompt?: number;
      completion?: number;
      total?: number;
    };
    duration?: number;
    iterations?: number;
    functionCallsCount?: number;
  };
}

/**
 * Playback phase state machine
 * Represents the current phase of UI rendering for static responses
 */
export type PlaybackPhase = 
  | 'idle'           // No active playback
  | 'thinking'       // Waiting for API response
  | 'toolLoading'    // Simulating tool execution
  | 'toolComplete'   // Tools finished
  | 'typing'         // Typewriter effect active
  | 'complete'       // All rendering done
  | 'error';         // Error occurred

/**
 * Playback state for managing UI transitions
 */
export interface PlaybackState {
  phase: PlaybackPhase;
  currentToolIndex: number;
  toolCalls: StaticToolCall[];
  text: string;
  displayedText: string;
  error: string | null;
}

/**
 * Playback configuration options
 */
export interface PlaybackConfig {
  /** Delay per tool in milliseconds */
  toolDelay: number;
  /** Characters per interval for typewriter */
  typewriterSpeed: number;
  /** Interval in milliseconds for typewriter */
  typewriterInterval: number;
  /** Enable animations */
  enableAnimations: boolean;
  /** Delay after tools complete before typing */
  toolCompleteDelay: number;
  /** Delay before resetting to idle after completion */
  completeResetDelay: number;
  /** Debounce delay for state updates */
  debounceDelay: number;
  /** Maximum characters to process in a single update */
  maxCharsPerUpdate: number;
}
