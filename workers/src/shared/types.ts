/**
 * Shared TypeScript type definitions for Cloudflare Workers
 * 
 * These types are adapted from the Vercel implementation to work with
 * Cloudflare Workers' edge runtime environment.
 * 
 * @see Requirements 2.4, 3.5
 */

import type { Context } from 'hono';
import type { Bindings } from '../bindings';

/**
 * Hono application context type with environment bindings and variables
 */
export type HonoContext = Context<{ Bindings: Bindings; Variables: { auth: AuthResult } }>;

/**
 * Authentication result from middleware
 */
export interface AuthResult {
  userId: string;
  sessionId: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  clerk_user_id: string;
  created_at: Date;
}

/**
 * Project entity
 */
export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Session entity
 */
export interface Session {
  id: string;
  user_id: string;
  project_id: string | null;
  started_at: Date;
  ended_at: Date | null;
  preview_thumbnail?: string;
}

/**
 * ChatMessage entity
 */
export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'ai' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * File entity
 */
export interface File {
  id: string;
  project_id: string;
  session_id: string | null;
  file_path: string;
  file_type: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Asset entity
 */
export interface Asset {
  id: string;
  project_id: string;
  asset_type: string;
  file_path: string;
  storage_url: string;
  context: string | null;
  uploaded_at: Date;
}

/**
 * Publication metadata
 */
export interface PublicationMetadata {
  vercelUrl?: string;
  vercelDeploymentId?: string;
  dbUrl?: string;
  deploymentStatus?: 'vercel_success' | 'vercel_failed_fallback_success' | 'failed';
  deploymentError?: string | null;
  customDomain?: string;
  [key: string]: unknown;
}

/**
 * Publication entity
 */
export interface Publication {
  id: string;
  project_id: string;
  published_url: string;
  published_at: Date;
  metadata: PublicationMetadata | null;
}

/**
 * Dependency entity
 */
export interface Dependency {
  id: string;
  project_id: string;
  dep_type: string;
  dep_name: string;
  version: string | null;
  added_at: Date;
}

/**
 * AnalyticsEvent entity
 */
export interface AnalyticsEvent {
  id: string;
  project_id: string | null;
  user_id: string | null;
  event_type: string;
  detail: Record<string, unknown> | null;
  timestamp: Date;
}

/**
 * FunctionCallLog entity
 */
export interface FunctionCallLog {
  id: string;
  session_id: string;
  function_name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  status: 'pending' | 'success' | 'error';
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: Date;
}

/**
 * Checkpoint entity
 */
export interface Checkpoint {
  id: string;
  project_id: string;
  session_id: string;
  name: string;
  description: string | null;
  created_at: Date;
}

// ============================================================================
// Database Insert Types
// ============================================================================

export interface UserInsert {
  id?: string;
  email: string;
  name?: string | null;
  clerk_user_id: string;
  created_at?: Date;
}

export interface ProjectInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  project_id?: string | null;
  started_at?: Date;
  ended_at?: Date | null;
  preview_thumbnail?: string;
}

export interface ChatMessageInsert {
  id?: string;
  session_id: string;
  role: 'user' | 'ai' | 'tool';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface FileInsert {
  id?: string;
  project_id: string;
  session_id?: string | null;
  file_path: string;
  file_type: string;
  content: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AssetInsert {
  id?: string;
  project_id: string;
  asset_type: string;
  file_path: string;
  storage_url: string;
  context?: string | null;
  uploaded_at?: Date;
}

export interface PublicationInsert {
  id?: string;
  project_id: string;
  published_url: string;
  published_at?: Date;
  metadata?: PublicationMetadata | null;
}

export interface DependencyInsert {
  id?: string;
  project_id: string;
  dep_type: string;
  dep_name: string;
  version?: string | null;
  added_at?: Date;
}

export interface AnalyticsEventInsert {
  id?: string;
  project_id?: string | null;
  user_id?: string | null;
  event_type: string;
  detail?: Record<string, unknown> | null;
  timestamp?: Date;
}

export interface FunctionCallLogInsert {
  id?: string;
  session_id: string;
  function_name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status?: 'pending' | 'success' | 'error';
  error_message?: string | null;
  execution_time_ms?: number | null;
  created_at?: Date;
}

export interface CheckpointInsert {
  id?: string;
  project_id: string;
  session_id: string;
  name: string;
  description?: string | null;
  created_at?: Date;
}

// ============================================================================
// Database Update Types
// ============================================================================

export interface ProjectUpdate {
  title?: string;
  description?: string | null;
  updated_at?: Date;
}

export interface SessionUpdate {
  ended_at?: Date | null;
  preview_thumbnail?: string;
}

export interface FileUpdate {
  content?: string;
  updated_at?: Date;
}

export interface FunctionCallLogUpdate {
  result?: unknown;
  status?: 'pending' | 'success' | 'error';
  error_message?: string | null;
  execution_time_ms?: number | null;
}

// ============================================================================
// Streaming Types (Removed - using static JSON responses now)
// ============================================================================
// Old SSE streaming types have been removed as we now use static JSON responses
// with fake streaming on the frontend for better UX control

/**
 * Stream chunk types for AI provider interface
 */
export type StreamChunk =
  | { type: 'text'; content: string }
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; tool_call: import('../features/models/ai-provider').ToolCall }
  | { type: 'done'; message: import('../features/models/ai-provider').ChatMessage };

// ============================================================================
// Chat Handler Types
// ============================================================================

/**
 * Chat mode type
 */
export type ChatMode = 'chat' | 'build' | 'edit';

/**
 * Conversation message (for API requests)
 */
export interface ConversationMessage {
  role?: 'user' | 'ai' | 'tool';
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
 * AI chat message for provider interface
 */
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Tool call structure for static response
 * Used in static chat endpoint to return complete tool call information
 */
export interface StaticToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'success' | 'error';
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
 * Static chat response structure
 * Complete response returned in a single HTTP request for fake streaming UX
 */
export interface StaticChatResponse {
  status: 'success' | 'error';
  data?: {
    text: string;
    toolCalls?: StaticToolCall[];
    iterations?: IterationData[]; // Array of iterations for progressive display
    metadata?: {
      model: string;
      tokens?: {
        prompt: number;
        completion: number;
        total: number;
      };
      duration?: number;
      iterations?: number;
      functionCallsCount?: number;
      textBeforeTools?: boolean;
    };
  };
  error?: string;
}

// ============================================================================
// AI Provider Types
// ============================================================================

/**
 * AI provider type
 */
export type AIProviderType = 'openai_compatible';

/**
 * AI provider configuration
 */
export interface ProviderConfig {
  type: AIProviderType;
  apiKey: string;
  model: string;
  priority: number;
}

/**
 * AI provider interface
 */
export interface AIProvider {
  type: AIProviderType;
  model: string;
  priority: number;
  chat(messages: AIChatMessage[], options?: ChatOptions): Promise<string>;
  streamChat(messages: AIChatMessage[], options?: ChatOptions): AsyncGenerator<StreamChunk>;
}

/**
 * Chat options for AI providers
 */
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'required' | 'none';
}

/**
 * Tool definition for function calling
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Function Executor Types
// ============================================================================

/**
 * Executor result
 */
export interface ExecutorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  execution_time_ms?: number;
}

/**
 * Executor context
 */
export interface ExecutorContext {
  sessionId: string;
  projectId: string;
  userId: string;
  env: Bindings;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error classes for consistent error handling
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InternalError';
  }
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}
