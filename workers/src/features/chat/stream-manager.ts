import type { ToolValue } from '../files/tool-types';

export class StreamManager {
  private encoder = new TextEncoder();
  constructor(private controller: ReadableStreamDefaultController) {}

  sendEvent(type: string, data: Record<string, unknown>): void {
    this.controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ type, ...data, timestamp: new Date().toISOString() })}\n\n`));
  }

  sendFunctionCallComplete(id: string, success: boolean, data?: ToolValue, error?: string, name?: string): void {
    this.sendEvent('function_call_complete', { id, success, data, error, ...(name && { name }) });
  }

  close(): void { this.controller.close(); }
}
