/**
 * Function Executor Interface and Types for Cloudflare Workers
 * Defines the contract for executing AI function calls
 */

/**
 * Progress callback for streaming tool execution updates
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type ToolValue = JsonValue;
export type ToolParams = Record<string, ToolValue>;
export type ProgressCallback = (status: string, details?: ToolValue) => void;
export type AbortCheck = () => Promise<boolean>;

/**
 * Execution context containing request-level information
 */
export interface ExecutionContext {
  user_id: string;
  project_id: string;
  session_id: string;
  clerk_user_id?: string;
  signal?: AbortSignal;
  run_id?: string;
  isAborted?: AbortCheck;
  onProgress?: ProgressCallback; // Optional progress callback for streaming
}

/**
 * Result of a function execution
 */
export interface ExecutionResult {
  success: boolean;
  tool_name: string;
  data?: ToolValue;
  error?: string;
  error_code?: string;
  message?: string;
  retry_hint?: {
    search_performed?: boolean;
    matches_found?: number;
    suggestion?: string;
  };
}

/**
 * Tool call from AI provider
 */
export interface ToolCall {
  id?: string;
  name: string;
  parameters: ToolParams;
}

/**
 * Function executor interface
 * All function executors must implement this interface
 */
export interface FunctionExecutor {
  /**
   * Execute the function with given parameters
   *
   * @param toolCall - The tool call containing name and parameters
   * @param context - Execution context with user and project info
   * @returns Execution result
   */
  execute(toolCall: ToolCall, context: ExecutionContext): Promise<ExecutionResult>;
}
