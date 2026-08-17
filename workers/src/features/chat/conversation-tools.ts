import type { ToolCall } from '../models/ai-provider';
import type { ExecutionContext, ExecutionResult, ToolParams } from '../files/tool-types';
import type { StaticToolCall } from '../../shared/types';
import type { FunctionCallHandler } from '../files/tool-handler';
import type { StreamManager } from './conversation-types';
import { errorLog } from '../../shared/logger';
import { toolFilePath } from '../files/tool-path';

function record(value: string): ToolParams {
  const parsed = JSON.parse(value || '{}') as unknown;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as ToolParams : {};
}

function parseErrorParams(raw: string, error: unknown): ToolParams {
  const params: ToolParams = {
    _invalid_arguments_json: true,
    _raw_arguments: raw,
    _parse_error: error instanceof Error ? error.message : String(error),
  };
  const suspectedPath = raw.match(/"(?:path|file_path)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)?.[1];
  if (suspectedPath) params._suspected_path = suspectedPath;
  return params;
}

export function toExecutorToolCalls(toolCalls: ToolCall[], iterationNumber: number, streamManager: StreamManager | null) {
  return toolCalls.map((tc) => {
    let parameters: ToolParams = {};
    try { parameters = record(tc.function.arguments); }
    catch (e) {
      errorLog(undefined, '[ConversationLoop] Failed to parse tool args', { id: tc.id, name: tc.function.name, error: e instanceof Error ? e.message : String(e) });
      parameters = parseErrorParams(tc.function.arguments, e);
    }

    const filePath = toolFilePath(parameters);
    if (filePath) streamManager?.sendEvent('tool_call_detected', { id: tc.id, name: tc.function.name, args: parameters, file_path: filePath, status: 'pending', iteration: iterationNumber });
    if (tc.function.name === 'load_skills' && Array.isArray(parameters.ids)) {
      streamManager?.sendEvent('tool_call_detected', { id: tc.id, name: tc.function.name, skill_ids: parameters.ids.filter((id): id is string => typeof id === 'string'), status: 'pending', iteration: iterationNumber });
    }
    if (tc.function.name === 'list_skill' && typeof parameters.skill_id === 'string') {
      streamManager?.sendEvent('tool_call_detected', { id: tc.id, name: tc.function.name, skill_ids: [parameters.skill_id], status: 'pending', iteration: iterationNumber });
    }
    if (tc.function.name === 'get_design' && typeof parameters.id === 'string') {
      streamManager?.sendEvent('tool_call_detected', { id: tc.id, name: tc.function.name, skill_ids: [parameters.id], status: 'pending', iteration: iterationNumber });
    }
    return { id: tc.id, name: tc.function.name, parameters };
  });
}

export async function executeToolCalls(
  functionHandler: FunctionCallHandler,
  streamManager: StreamManager | null,
  executorToolCalls: ReturnType<typeof toExecutorToolCalls>,
  context: ExecutionContext,
  iterationNumber: number
): Promise<{ executionResults: ExecutionResult[]; executedToolCalls: StaticToolCall[] }> {
  const executionResults: ExecutionResult[] = [];
  const executedToolCalls: StaticToolCall[] = [];

  for await (const event of functionHandler.executeAllStream(executorToolCalls, context)) {
    const call = executorToolCalls.find((tc) => tc.id === event.id);
    if (event.type === 'function_call_start') {
      streamManager?.sendEvent('function_call_start', { id: event.id, name: event.name, args: event.args, ...(event.file_path && { file_path: event.file_path }), status: 'pending', iteration: iterationNumber });
      continue;
    }
    streamManager?.sendFunctionCallComplete(event.id, event.success, event.data, event.error, call?.name);
    executionResults.push({ success: event.success, tool_name: call?.name || 'unknown', data: event.data, error: event.error });
    executedToolCalls.push({
      id: event.id,
      name: call?.name || 'unknown',
      arguments: call?.parameters || {},
      status: event.success ? 'success' : 'error',
      result: event.data,
      error: event.error,
    });
  }

  return { executionResults, executedToolCalls };
}
