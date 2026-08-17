import type { Bindings } from '../../bindings';
import type { StaticToolCall } from '../../shared/types';
import { upsertFile } from '../files/service';
import type { ExecutionContext } from '../files/tool-types';
import type { StreamManager } from './conversation-types';

type FileBlock = { path: string; content: string };

const FENCE = /```file:([^\n`]+)\n([\s\S]*?)```/g;

export function parseFileBlocks(text: string): FileBlock[] {
  const files: FileBlock[] = [];
  for (const match of text.matchAll(FENCE)) {
    const path = match[1]?.trim().replace(/^\/+/, '');
    const content = match[2]?.replace(/^\n|\n$/g, '');
    if (path && content) files.push({ path, content });
  }
  return files;
}

export function stripFileBlocks(text: string): string {
  return text.replace(FENCE, '').replace(/\n{3,}/g, '\n\n').trim();
}

export async function saveFileBlocks(env: Bindings, context: ExecutionContext, text: string, streamManager: StreamManager | null, iteration: number): Promise<StaticToolCall[]> {
  const files = parseFileBlocks(text);
  const calls: StaticToolCall[] = [];
  for (const file of files) {
    const id = `file_block_${crypto.randomUUID()}`;
    streamManager?.sendEvent('tool_call_detected', { id, name: 'write_file', file_path: file.path, status: 'pending', iteration });
    if (context.signal?.aborted || await context.isAborted?.()) {
      streamManager?.sendFunctionCallComplete(id, false, undefined, 'Tool execution aborted', 'write_file');
      calls.push({ id, name: 'write_file', arguments: { path: file.path }, status: 'error', error: 'Tool execution aborted' });
      continue;
    }
    await upsertFile(env, context.project_id, file.path, file.content);
    const data = { file_path: file.path };
    streamManager?.sendFunctionCallComplete(id, true, data, undefined, 'write_file');
    calls.push({ id, name: 'write_file', arguments: { path: file.path }, status: 'success', result: data });
  }
  return calls;
}
