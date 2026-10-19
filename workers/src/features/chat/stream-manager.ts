import type { ToolValue } from '../files/tool-types';

export class StreamManager {
  private encoder = new TextEncoder();
  private isClosed = false;
  private hasSentError = false;

  constructor(private controller: ReadableStreamDefaultController) {}

  sendEvent(type: string, data: Record<string, unknown>): void {
    if (this.isClosed) return;
    if (type === 'error') {
      if (this.hasSentError) return;
      this.hasSentError = true;
    }
    try {
      this.controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ type, ...data, timestamp: new Date().toISOString() })}\n\n`));
    } catch {
      this.isClosed = true;
    }
  }

  sendFunctionCallComplete(id: string, success: boolean, data?: ToolValue, error?: string, name?: string): void {
    this.sendEvent('function_call_complete', { id, success, data, error, ...(name && { name }) });
  }

  close(): void {
    if (this.isClosed) return;
    this.isClosed = true;
    try {
      this.controller.close();
    } catch {}
  }
}
