import type { ChatMessage, ToolCall } from '../models/ai-provider';
import type { ExecutionResult } from '../files/tool-types';

const PLANNING_TOOL_NAMES = ['gather_requirements', 'generate_planning_docs', 'execute_plan'];

export function shouldContinueLoop(toolCalls: ToolCall[], _iteration: number, executionResults: ExecutionResult[] = []): boolean {
  if (toolCalls.some((tc) => ['ask_user', 'request_external_resource'].includes(tc.function.name))) return false;
  if (toolCalls.some((tc) => PLANNING_TOOL_NAMES.includes(tc.function.name))) {
    return executionResults.some((r, i) => PLANNING_TOOL_NAMES.includes(toolCalls[i]?.function.name) && !r.success);
  }
  return toolCalls.length > 0;
}

export function formatToolResults(toolCalls: ToolCall[], results: ExecutionResult[]): ChatMessage[] {
  return results.map((result, index) => ({
    role: 'tool' as const,
    content: JSON.stringify({
      success: result.success,
      tool_name: result.tool_name,
      ...(result.data && { data: result.data }),
      ...(result.error && { error: result.error }),
      ...(result.error_code && { error_code: result.error_code }),
    }),
    tool_call_id: toolCalls[index]?.id || `call_${index}`,
    name: result.tool_name,
  }));
}
