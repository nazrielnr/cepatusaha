/**
 * OpenAI-Compatible AI Provider Adapter
 * Implements the AIProvider interface for OpenAI-compatible APIs
 * Supports MegaLLM, OpenRouter, and other OpenAI-compatible providers
 * Adapted for Cloudflare Workers edge runtime
 */

import { BaseAIProvider, ChatParams, ChatResponse, ChatMessage, StreamChunk, ToolCall } from '../ai-provider';
import { debugLog, errorLog, warnLog } from '../../../shared/logger';
import { toolFilePathFromJson } from '../../files/tool-path';
import { createThinkingTagParser } from './thinking-tags';

type OpenAIToolCall = ToolCall & { _isPartial?: boolean; _earlyNotification?: boolean; _hasDetails?: boolean };

type OpenAIMessage = {
  content?: string;
  reasoning_content?: string;
  reasoning?: string;
  tool_calls?: OpenAIToolCall[];
};

type OpenAIChoice = {
  message?: OpenAIMessage;
  finish_reason?: string;
};

type OpenAIResponse = {
  choices?: OpenAIChoice[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

type OpenAIRequestBody = Record<string, unknown> & {
  model: string;
  messages: Array<Record<string, unknown>>;
  temperature: number;
  max_tokens: number;
  stream?: boolean;
};

type OpenAIContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

const MAX_OUTPUT_TOKENS = 32768;
const STREAM_IDLE_TIMEOUT_MS = 120_000;
const COMPLETE_TOOL_CALL_IDLE_FINISH_MS = 4_000;
const validJson = (value: string) => { try { JSON.parse(value || '{}'); return value || '{}'; } catch { return JSON.stringify({ _invalid_arguments_json: true }); } };
const validArgsObject = (value = '') => { try { const parsed = JSON.parse(value); return parsed && typeof parsed === 'object' && !Array.isArray(parsed); } catch { return false; } };

function mergeToolCall(target: ToolCall[], raw: Record<string, unknown>, fallbackIndex: number, snapshot: boolean): ToolCall | undefined {
  const index = typeof raw.index === 'number' ? raw.index : fallbackIndex;
  const fn = raw.function as Record<string, unknown> | undefined;
  const name = typeof fn?.name === 'string' ? fn.name : typeof raw.name === 'string' ? raw.name : undefined;
  const args = typeof fn?.arguments === 'string' ? fn.arguments : typeof raw.arguments === 'string' ? raw.arguments : undefined;
  const id = typeof raw.id === 'string' ? raw.id : target[index]?.id || `call_${index}`;
  const existing = target[index];
  if (!existing) {
    target[index] = { id, type: 'function', function: { name: name || '', arguments: args || '' } };
    return target[index];
  }
  existing.id = id;
  if (snapshot) {
    if (name !== undefined) existing.function.name = name;
    if (args !== undefined) existing.function.arguments = args;
  } else {
    if (name) existing.function.name += name;
    if (args) existing.function.arguments += args;
  }
  return existing;
}



export interface OpenAICompatibleConfig {
  /** Provider name for logging */
  providerName: string;
  /** API endpoint base URL */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Additional headers (optional) */
  extraHeaders?: Record<string, string>;
  /** Environment name for debug logs */
  nodeEnv?: string;
}

export class OpenAICompatibleProvider extends BaseAIProvider {
  name: string;
  supportsToolCalling = true;
  
  private apiKey: string;
  private baseUrl: string;
  private extraHeaders: Record<string, string>;
  private nodeEnv?: string;
  
  constructor(config: OpenAICompatibleConfig) {
    super();
    if (!config.apiKey) {
      throw new Error(`${config.providerName} API key is required`);
    }
    if (!config.baseUrl) {
      throw new Error(`${config.providerName} base URL is required`);
    }
    
    this.name = config.providerName;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.extraHeaders = config.extraHeaders || {};
    this.nodeEnv = config.nodeEnv;
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    const { messages, tools, temperature = 1.0, max_tokens = MAX_OUTPUT_TOKENS, model, reasoning_effort, tool_choice = 'auto' } = params;
    
    if (!model) {
      throw new Error(`${this.name} provider requires explicit model parameter`);
    }
    
    const requestBody: OpenAIRequestBody = {
      model: model,
      messages: this.convertMessages(messages),
      temperature,
      max_tokens: Math.min(max_tokens, MAX_OUTPUT_TOKENS),
    };
    
    if (reasoning_effort) {
      requestBody.reasoning_effort = reasoning_effort;
    }
    
    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = this.convertToolSchemas(tools);
      requestBody.tool_choice = tool_choice;
    }
    
    try {
      debugLog({ NODE_ENV: this.nodeEnv }, `[${this.name}] Sending request:`, {
        model,
        messageCount: messages.length,
        hasTools: !!requestBody.tools,
        toolsCount: Array.isArray(requestBody.tools) ? requestBody.tools.length : 0,
        reasoningEffort: reasoning_effort || 'none',
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.extraHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
      
      if (!response.ok) {
        const error = await response.text();
        errorLog(undefined, `[${this.name}] API Error Response:`, error);
        throw new Error(`${this.name} API error: ${response.status} - ${error}`);
      }
      
      const data = await response.json() as OpenAIResponse;
      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorLog(undefined, `[${this.name}] Request timeout after 30s`);
          throw new Error(`${this.name} request timeout - API took too long to respond`);
        }
        errorLog(undefined, `[${this.name}] Request failed:`, error.message);
        throw new Error(`${this.name} request failed: ${error.message}`);
      }
      throw new Error(`${this.name} request failed: Unknown error`);
    }
  }
  
  /**
   * Stream chat responses from OpenAI-compatible API
   * Uses SSE streaming API with Web Streams API
   */
  async *chatStream(params: ChatParams): AsyncGenerator<StreamChunk, ChatResponse, unknown> {
    const { messages, tools, temperature = 1.0, max_tokens = MAX_OUTPUT_TOKENS, model, reasoning_effort, tool_choice = 'auto' } = params;
    
    if (!model) {
      throw new Error(`${this.name} provider requires explicit model parameter`);
    }
    
    const requestBody: OpenAIRequestBody = {
      model: model,
      messages: this.convertMessages(messages),
      temperature,
      max_tokens: Math.min(max_tokens, MAX_OUTPUT_TOKENS),
      stream: true, // Enable streaming
      stream_options: { include_usage: true }, // Ask for the final usage chunk so billing is exact
    };
    
    if (reasoning_effort) {
      requestBody.reasoning_effort = reasoning_effort;
    }
    
    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = this.convertToolSchemas(tools);
      requestBody.tool_choice = tool_choice;
    }
    
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleFinish: (() => boolean) | undefined;
    const resetStreamTimeout = () => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => idleFinish?.() ? controller.abort('complete_tool_call_idle') : controller.abort(), idleFinish?.() ? COMPLETE_TOOL_CALL_IDLE_FINISH_MS : STREAM_IDLE_TIMEOUT_MS);
    };

    try {
      debugLog({ NODE_ENV: this.nodeEnv }, `[${this.name}] Sending streaming request:`, {
        model,
        messageCount: messages.length,
        hasTools: !!requestBody.tools,
        toolsCount: Array.isArray(requestBody.tools) ? requestBody.tools.length : 0,
        reasoningEffort: reasoning_effort || 'none',
      });

      resetStreamTimeout();
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.extraHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        const error = await response.text();
        errorLog(undefined, `[${this.name}] Streaming API Error Response:`, error);
        throw new Error(`${this.name} API error: ${response.status} - ${error}`);
      }
      
      if (!response.body) {
        throw new Error('Response body is null');
      }
      
      // Get ReadableStream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Accumulate complete message for final response
      let fullContent = '';
      const toolCalls: ToolCall[] = [];
      const yieldedToolCalls = new Set<number>(); // Track early notifications
      const detailYieldedToolCalls = new Set<number>(); // Track detailed updates
      let finishReason: string | undefined;
      let streamUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
      const thinkingParser = createThinkingTagParser();
      idleFinish = () => Boolean(toolCalls.length && toolCalls.some((tc) => tc?.function.name && validArgsObject(tc.function.arguments || '')));
      
      // Parse one complete SSE line into stream chunks. Extracted so the final leftover
      // buffer (a line without a trailing newline at EOF) can reuse the same logic —
      // otherwise the stream tail (tool-call arguments / usage chunk / final text,
      // i.e. the end of a created file) is silently dropped.
      const providerName = this.name;
      const nodeEnv = this.nodeEnv;
      function* parseSseLine(line: string): Generator<StreamChunk, void, unknown> {
        const trimmedLine = line.trim();
        
        // Skip empty lines and SSE comments (including keep-alive)
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          return;
        }
        
        // Parse SSE data lines
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6).trim();
              
              // Skip empty data or keep-alive messages
              if (!dataStr || dataStr === ':' || dataStr.startsWith(':')) {
                return;
              }
              
              // Check for [DONE] signal
              if (dataStr === '[DONE]') {
                return;
              }
              
              try {
                const data = JSON.parse(dataStr);
                // Usage arrives on its own terminal chunk (no choices) when stream_options.include_usage is on.
                if (data.usage && (data.usage.prompt_tokens || data.usage.completion_tokens)) {
                  streamUsage = data.usage;
                }
                const choice = data.choices?.[0];
                
                if (!choice) {
                  return;
                }
                
                const delta = choice.delta;
                const toolDelta = delta?.tool_calls || delta?.toolCalls || delta?.function_call || delta?.functionCall;
                const toolSnapshot = !toolDelta && (choice.message?.tool_calls || choice.message?.toolCalls || choice.message?.function_call || choice.message?.functionCall);
                
                // Handle native reasoning fields before visible content.
                const reasoning = delta?.reasoning_content || delta?.reasoning;
                if (reasoning) yield { type: 'thinking', content: reasoning } as StreamChunk;

                // Handle text content; split <think> tags server-side.
                if (delta?.content) {
                  const content = delta.content;
                  fullContent += content;

                  for (const parsed of thinkingParser.feed(content)) {
                    yield parsed as StreamChunk;
                  }
                }
                
                // Handle tool calls
                if (toolDelta || toolSnapshot) {
                  const rawToolCalls = Array.isArray(toolDelta || toolSnapshot) ? toolDelta || toolSnapshot : [toolDelta || toolSnapshot];
                  for (const toolCall of rawToolCalls) {
                    const index = toolCall.index || 0;
                    const currentToolCall = mergeToolCall(toolCalls, toolCall, index, Boolean(toolSnapshot));
                    
                    // Yield tool_call when name AND enough arguments are available
                    // Dual-yield strategy for optimal UX:
                    // 1. Yield immediately when name appears (for early notification)
                    // 2. Yield when args reach threshold (for file_path extraction)
                    if (currentToolCall && currentToolCall.function.name) {
                      const argsLength = currentToolCall.function.arguments?.length || 0;
                      const hasBeenYielded = yieldedToolCalls.has(index);
                      const hasBeenDetailYielded = detailYieldedToolCalls.has(index);
                      const filePath = toolFilePathFromJson(currentToolCall.function.arguments);
                      
                      // Yield immediately on first detection (name only)
                      if (!hasBeenYielded && argsLength === 0) {
                        yield {
                          type: 'tool_call',
                          tool_call: {
                            ...currentToolCall,
                            _isPartial: true,
                            _earlyNotification: true // Flag for early yield
                          } as OpenAIToolCall,
                        };
                        
                        yieldedToolCalls.add(index);
                        
                        debugLog({ NODE_ENV: nodeEnv }, `[${providerName}] 🔔 Early notification - tool call detected`, {
                          index,
                          name: currentToolCall.function.name,
                          timestamp: new Date().toISOString(),
                        });
                      }
                      // Yield when real metadata appears; byte length is not metadata.
                      else if (!hasBeenDetailYielded && filePath) {
                        yield {
                          type: 'tool_call',
                          tool_call: {
                            ...currentToolCall,
                            _isPartial: true,
                            _hasDetails: true // Flag for detailed yield
                          } as OpenAIToolCall,
                        };
                        
                        detailYieldedToolCalls.add(index);
                        
                        debugLog({ NODE_ENV: nodeEnv }, `[${providerName}] ⚡ Updated with args`, {
                          index,
                          name: currentToolCall.function.name,
                          argsLength,
                          argsPreview: currentToolCall.function.arguments?.substring(0, 100),
                          timestamp: new Date().toISOString(),
                        });
                      }
                      // If we got name + args in first chunk (skipped early notification)
                      // Yield immediately with details
                      else if (!hasBeenYielded && !hasBeenDetailYielded && argsLength > 0) {
                        yield {
                          type: 'tool_call',
                          tool_call: {
                            ...currentToolCall,
                            _isPartial: true,
                            _hasDetails: Boolean(filePath),
                            _earlyNotification: !filePath
                          } as OpenAIToolCall,
                        };
                        
                        yieldedToolCalls.add(index);
                        if (filePath) {
                          detailYieldedToolCalls.add(index);
                        }
                        
                        debugLog({ NODE_ENV: nodeEnv }, `[${providerName}] 🚀 Fast yield - name + args together`, {
                          index,
                          name: currentToolCall.function.name,
                          argsLength,
                          hasDetails: Boolean(filePath),
                          timestamp: new Date().toISOString(),
                        });
                      }
                    }
                  }
                }
                
                // Capture finish reason
                if (choice.finish_reason) {
                  finishReason = choice.finish_reason;
                }
              } catch (e) {
                errorLog(undefined, `[${providerName}] Failed to parse SSE event:`, dataStr, e);
              }
            }
        }

      // Read and parse SSE stream
      try {
        while (true) {
          const { done, value } = await reader.read();
          resetStreamTimeout();
          
          if (done) {
            // Final flush: the stream may end without a trailing newline, and a UTF-8
            // code point may straddle the last chunk. Without this the tail is dropped.
            buffer += decoder.decode();
            break;
          }
          
          // Decode chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Split by newlines to get complete lines
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';
          
          // Process complete lines (logic lives in parseSseLine so the EOF tail reuses it)
          for (const line of lines) yield* parseSseLine(line);
        }

        // Flush any leftover line that did not end with a newline before EOF.
        if (buffer.trim()) yield* parseSseLine(buffer);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError' && controller.signal.reason === 'complete_tool_call_idle') {
          errorLog(undefined, `[${this.name}] Stream ended by complete tool-call idle cutoff`);
        } else {
          throw error;
        }
      } finally {
        reader.releaseLock();
      }

      if (finishReason === 'length') {
        warnLog(undefined, `[${this.name}] Output hit max_tokens (${Math.min(max_tokens, MAX_OUTPUT_TOKENS)}) — stream may be truncated`, {
          toolCallCount: toolCalls.length,
          finishReason,
        });
      }
      
      for (const parsed of thinkingParser.flush()) {
        yield parsed as StreamChunk;
      }
      
      // Yield final complete tool calls. Partial early yields are UI-only; final yield replaces them before execution/history.
      const finalToolCalls: ToolCall[] = [];
      for (let i = 0; i < toolCalls.length; i++) {
        const toolCall = toolCalls[i];
        if (!toolCall) continue;
        const argsLength = toolCall.function.arguments?.length || 0;
        if (argsLength > 0) {
          try {
            JSON.parse(toolCall.function.arguments);
          } catch (e) {
            errorLog(undefined, `[${this.name}] Forwarding tool call with invalid JSON`, {
              index: i,
              name: toolCall.function.name,
              argsLength,
              error: e instanceof Error ? e.message : 'Invalid JSON',
            });
          }
        }
        finalToolCalls.push(toolCall);
        yield { type: 'tool_call', tool_call: toolCall };
      }
      
      // Build final message - remove thinking tags from content
      const cleanContent = fullContent
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<think>[\s\S]*$/g, '')
        .replace(/<\/think>/g, '')
        .trim();
      
      const message: ChatMessage = {
        role: 'assistant',
        content: cleanContent,
        tool_calls: finalToolCalls.length > 0 ? finalToolCalls : undefined,
      };
      
      // Yield done event
      yield {
        type: 'done',
        message,
      };
      
      // Return final response
      return {
        message,
        finish_reason: finishReason,
        usage: streamUsage
          ? {
              prompt_tokens: streamUsage.prompt_tokens || 0,
              completion_tokens: streamUsage.completion_tokens || 0,
              total_tokens: streamUsage.total_tokens || (streamUsage.prompt_tokens || 0) + (streamUsage.completion_tokens || 0),
            }
          : undefined,
      };
    } catch (error) {
      try { controller.abort(); } catch {}
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorLog(undefined, `[${this.name}] Streaming idle timeout after ${STREAM_IDLE_TIMEOUT_MS / 1000}s`);
          throw new Error(`${this.name} streaming timeout - API took too long to respond`);
        }
        errorLog(undefined, `[${this.name}] Streaming failed:`, error.message);
        throw new Error(`${this.name} streaming failed: ${error.message}`);
      } else {
        throw new Error(`${this.name} streaming failed: Unknown error`);
      }
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.extraHeaders,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Convert internal message format to OpenAI-compatible format
   */
  private convertMessages(messages: ChatMessage[]): Array<Record<string, unknown>> {
    return messages.map((msg) => {
      const converted: Record<string, unknown> = {
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content as OpenAIContent,
      };
      
      if (msg.tool_calls) {
        converted.tool_calls = msg.tool_calls.map((tc) => ({ ...tc, function: { name: tc.function.name, arguments: validJson(tc.function.arguments) } }));
      }
      
      if (msg.tool_call_id) {
        converted.role = 'tool';
        converted.tool_call_id = msg.tool_call_id;
      }
      
      if (msg.name) {
        converted.name = msg.name;
      }
      
      return converted;
    });
  }
  
  /**
   * Parse OpenAI-compatible response to internal format
   */
  private parseResponse(data: OpenAIResponse): ChatResponse {
    const choice = data.choices?.[0];
    
    if (!choice) {
      throw new Error(`Invalid response from ${this.name}: no choices`);
    }
    
    const parser = createThinkingTagParser();
    const parts = [...parser.feed(choice.message?.content || ''), ...parser.flush()];
    const content = parts.filter((p) => p.type === 'text').map((p) => p.content).join('').trim();
    const reasoning = [choice.message?.reasoning_content, choice.message?.reasoning, ...parts.filter((p) => p.type === 'thinking').map((p) => p.content)].filter(Boolean).join('');

    const message: ChatMessage = {
      role: 'assistant',
      content,
    };
    if (reasoning) (message as ChatMessage & { reasoning_content?: string }).reasoning_content = reasoning;
    
    // Parse tool calls if present
    if (choice.message?.tool_calls) {
      message.tool_calls = choice.message.tool_calls.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
    }
    
    return {
      message,
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens || 0,
        completion_tokens: data.usage.completion_tokens || 0,
        total_tokens: data.usage.total_tokens || 0,
      } : undefined,
      finish_reason: choice.finish_reason,
    };
  }
}
