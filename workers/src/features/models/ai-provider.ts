/**
 * AI Provider Adapter Interface
 * Defines a common interface for different AI providers
 * Adapted for Cloudflare Workers edge runtime
 */

import { ToolSchema } from '../files/tools';

export type ProviderToolSchema = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolSchema['parameters'];
  };
};

export type MessageContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: MessageContent;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
  /**
   * Thought signature for Gemini 3 Pro Preview
   * Required for multi-turn function calling - must be preserved and sent back
   */
  thought_signature?: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  tools?: ToolSchema[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
  /**
   * Optional reasoning effort for reasoning-capable models (e.g., o3)
   * Accepted values follow OpenAI schema: low | medium | high
   */
  reasoning_effort?: 'low' | 'medium' | 'high';
  tool_choice?: 'auto' | 'required';
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}

/**
 * Stream chunk types for AI provider streaming interface
 */
export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; tool_call: ToolCall }
  | { type: 'done'; message: ChatMessage };

/**
 * Base interface for AI providers
 */
export interface AIProvider {
  name: string;
  supportsToolCalling: boolean;
  
  /**
   * Send a chat request to the AI provider
   */
  chat(params: ChatParams): Promise<ChatResponse>;
  
  /**
   * Stream a chat request to the AI provider
   * Returns an async generator that yields chunks as they arrive
   */
  chatStream(params: ChatParams): AsyncGenerator<StreamChunk, ChatResponse, unknown>;
  
  /**
   * Check if the provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Base class with common functionality
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract supportsToolCalling: boolean;
  
  abstract chat(params: ChatParams): Promise<ChatResponse>;
  
  /**
   * Default implementation of chatStream that falls back to non-streaming
   * Providers should override this with proper streaming implementation
   */
  async *chatStream(params: ChatParams): AsyncGenerator<StreamChunk, ChatResponse, unknown> {
    const response = await this.chat(params);
    
    if (typeof response.message.content === 'string' && response.message.content) {
      yield {
        type: 'text',
        content: response.message.content,
      };
    }
    
    if (response.message.tool_calls) {
      for (const toolCall of response.message.tool_calls) {
        yield {
          type: 'tool_call',
          tool_call: toolCall,
        };
      }
    }
    
    yield {
      type: 'done',
      message: response.message,
    };
    
    return response;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      // Simple availability check - can be overridden by specific providers
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Convert tool schemas to provider-specific format
   */
  protected convertToolSchemas(tools: ToolSchema[]): ProviderToolSchema[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
  
  /**
   * Parse tool calls from provider response
   */
  protected parseToolCalls(response: { tool_calls?: unknown }): ToolCall[] | undefined {
    // Default implementation - override in specific providers if needed
    if (response.tool_calls && Array.isArray(response.tool_calls)) {
      return response.tool_calls as ToolCall[];    }
    return undefined;
  }
}
