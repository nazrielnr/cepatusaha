/**
 * Type Guards
 * Runtime type checking utilities for shared types
 */

import type { MessageMetadata, ChatMessage, ToolCall } from './chat';
import type { StreamEvent } from './streaming';
import type { ApiResponse, ValidationResult } from './api';

/**
 * Check if value is a valid MessageMetadata
 */
export function isValidMessageMetadata(value: unknown): value is MessageMetadata {
  if (!value || typeof value !== 'object') return false;

  const metadata = value as Record<string, unknown>;

  // Check optional fields have correct types
  if (metadata.mode !== undefined && typeof metadata.mode !== 'string') return false;
  if (metadata.streaming !== undefined && typeof metadata.streaming !== 'boolean') return false;
  if (metadata.iteration !== undefined && typeof metadata.iteration !== 'number') return false;
  if (metadata.pending_iteration !== undefined && typeof metadata.pending_iteration !== 'boolean') return false;
  if (metadata.text_streaming_done !== undefined && typeof metadata.text_streaming_done !== 'boolean') return false;
  if (metadata.is_thinking !== undefined && typeof metadata.is_thinking !== 'boolean') return false;
  if (metadata.reasoning_done !== undefined && typeof metadata.reasoning_done !== 'boolean') return false;
  if (metadata.thinking_done !== undefined && typeof metadata.thinking_done !== 'boolean') return false;
  if (metadata.error !== undefined && typeof metadata.error !== 'boolean') return false;
  if (metadata.canRetry !== undefined && typeof metadata.canRetry !== 'boolean') return false;

  return true;
}

/**
 * Safely cast metadata with validation
 */
export function castMessageMetadata(value: unknown): MessageMetadata {
  if (isValidMessageMetadata(value)) {
    return value;
  }

  console.warn('[MessageMetadata] Invalid metadata, returning empty object:', value);
  return {};
}

/**
 * Check if value is a valid ChatMessage
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;

  const msg = value as Record<string, unknown>;

  // Required fields
  if (typeof msg.id !== 'string') return false;
  if (typeof msg.content !== 'string') return false;

  // Optional fields type checks
  if (msg.sender !== undefined && !['ai', 'user'].includes(msg.sender as string)) return false;
  if (msg.role !== undefined && !['user', 'ai', 'assistant', 'tool', 'system'].includes(msg.role as string)) return false;

  return true;
}

/**
 * Check if value is a valid ToolCall
 */
export function isToolCall(value: unknown): value is ToolCall {
  if (!value || typeof value !== 'object') return false;

  const tc = value as Record<string, unknown>;

  if (typeof tc.id !== 'string') return false;
  if (!tc.function || typeof tc.function !== 'object') return false;

  const fn = tc.function as Record<string, unknown>;
  if (typeof fn.name !== 'string') return false;
  if (typeof fn.arguments !== 'string') return false;

  if (!['pending', 'executing', 'completed', 'error'].includes(tc.status as string)) return false;

  return true;
}

/**
 * Check if value is a valid StreamEvent
 */
export function isStreamEvent(value: unknown): value is StreamEvent {
  if (!value || typeof value !== 'object') return false;

  const event = value as Record<string, unknown>;

  if (typeof event.type !== 'string') return false;

  const validTypes = [
    'text_chunk',
    'thinking_chunk',
    'text_done',
    'function_call_start',
    'function_call_complete',
    'iteration_start',
    'iteration_complete',
    'loop_complete',
    'metadata',
    'done',
    'error',
  ];

  return validTypes.includes(event.type);
}

/**
 * Check if value is a valid ApiResponse
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== 'object') return false;

  const response = value as Record<string, unknown>;

  if (!['success', 'error'].includes(response.status as string)) return false;

  return true;
}

/**
 * Check if value is a valid ValidationResult
 */
export function isValidationResult<T>(value: unknown): value is ValidationResult<T> {
  if (!value || typeof value !== 'object') return false;

  const result = value as Record<string, unknown>;

  if (typeof result.success !== 'boolean') return false;

  return true;
}

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid date string
 */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Check if value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
