import { z } from 'zod';
import { ValidationError } from './errors';

export { ValidationError };

// Optional reasoning effort for reasoning-capable models
const ReasoningEffortSchema = z.enum(['low', 'medium', 'high']);

/**
 * Chat message schema
 * Validates individual chat messages with content length constraints
 */
const ChatImageSchema = z.object({
  url: z.string().url(),
  key: z.string().max(512).optional(),
  name: z.string().max(255).optional(),
  type: z.string().startsWith('image/').optional(),
  size: z.number().int().positive().max(10 * 1024 * 1024).optional(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'ai', 'assistant', 'tool', 'system']).optional(),
  sender: z.enum(['user', 'ai', 'assistant', 'tool']).optional(),
  content: z.string().min(1, { message: 'Message content cannot be empty' }).max(10000, { message: 'Message content exceeds maximum length of 10000 characters' }),
  timestamp: z.union([z.string(), z.date()]).optional(),
  images: z.array(ChatImageSchema).max(4).optional(),
}).refine(
  (data) => data.role || data.sender,
  { message: 'Either role or sender must be provided' }
);

/**
 * Chat request schema
 * Validates the entire chat request including conversation array
 */
export const ChatRequestSchema = z.object({
  conversation: z.array(ChatMessageSchema)
    .min(1, { message: 'Conversation must contain at least one message' })
    .max(100, { message: 'Conversation cannot exceed 100 messages' }),
  sessionId: z.string().uuid({ message: 'Invalid session ID format' }).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  mode: z.enum(['chat', 'build', 'edit']).optional(),
  reasoning_effort: ReasoningEffortSchema.optional(),
  model: z.string().optional(), // AI model identifier
  planMode: z.boolean().optional(), // Planning mode flag - outputs planning docs instead of code
  runId: z.string().optional(),
});

/**
 * Session ID schema
 * Validates UUID format for session identifiers
 */
export const SessionIdSchema = z.string().uuid({ message: 'Invalid session ID format' });

/**
 * Project ID schema
 */
export const ProjectIdSchema = z.string().uuid({ message: 'Invalid project ID format' });

/**
 * User ID schema
 */
export const UserIdSchema = z.string().trim().min(1, { message: 'User ID cannot be empty' });

/**
 * Pagination schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1, { message: 'Page must be greater than 0' }),
  limit: z.number().int().min(1).max(100, { message: 'Limit must be between 1 and 100' }),
});

/**
 * File upload schema
 */
export const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  content: z.string(),
  mimeType: z.string().optional(),
  size: z.number().int().positive().optional(),
});

/**
 * Session create schema
 */
export const SessionCreateSchema = z.object({
  project_id: z.string().uuid({ message: 'Invalid project ID format' }),
  title: z.string().min(1).max(255).optional(),
});

/**
 * Session update schema
 */
export const SessionUpdateSchema = z.object({
  session_id: z.string().uuid({ message: 'Invalid session ID format' }),
  title: z.string().min(1).max(255).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  fonts: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/font-woff2'],
  documents: ['text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json'],
};

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  font: 5 * 1024 * 1024,   // 5MB
  document: 2 * 1024 * 1024, // 2MB
  default: 10 * 1024 * 1024, // 10MB
};

/**
 * Validate chat request body
 * 
 * @param body - Raw request body to validate
 * @returns Validated chat request data
 * @throws ValidationError if validation fails
 */
export function validateChatRequest(body: unknown) {
  try {
    return ChatRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new ValidationError(messages);
    }
    throw error;
  }
}

/**
 * Validate session ID
 * 
 * @param id - Session ID to validate
 * @returns Validated session ID
 * @throws ValidationError if validation fails
 */
export function validateSessionId(id: unknown): string {
  try {
    return SessionIdSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0]?.message || 'Invalid session ID');
    }
    throw error;
  }
}

/**
 * Validate project ID
 * 
 * @param id - Project ID to validate
 * @returns Validated project ID
 * @throws ValidationError if validation fails
 */
export function validateProjectId(id: unknown): string {
  try {
    return ProjectIdSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0]?.message || 'Invalid project ID');
    }
    throw error;
  }
}

/**
 * Validate user ID
 * 
 * @param id - User ID to validate
 * @returns Validated user ID
 * @throws ValidationError if validation fails
 */
export function validateUserId(id: unknown): string {
  try {
    return UserIdSchema.parse(id);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0]?.message || 'Invalid user ID');
    }
    throw error;
  }
}

/**
 * Validates file type against allowed types
 * 
 * @param mimeType - File MIME type
 * @param category - File category (images, fonts, documents)
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateFileType(mimeType: string, category: keyof typeof ALLOWED_FILE_TYPES): boolean {
  const allowedTypes = ALLOWED_FILE_TYPES[category];
  
  if (!allowedTypes.includes(mimeType)) {
    throw new ValidationError(
      `Invalid file type. Allowed types for ${category}: ${allowedTypes.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validates file size against maximum allowed
 * 
 * @param size - File size in bytes
 * @param category - File category
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateFileSize(size: number, category: keyof typeof MAX_FILE_SIZES = 'default'): boolean {
  const maxSize = MAX_FILE_SIZES[category];
  
  if (size > maxSize) {
    throw new ValidationError(
      `File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`
    );
  }
  
  return true;
}

/**
 * Validates file extension
 * 
 * @param filename - File name
 * @param allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.png'])
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(extension)) {
    throw new ValidationError(
      `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validates UUID format
 * 
 * @param value - String to validate
 * @param fieldName - Field name for error message
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateUUID(value: string, fieldName: string = 'ID'): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`Invalid ${fieldName} format`);
  }
  
  return true;
}

/**
 * Validates email format
 * 
 * @param email - Email to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  return true;
}

/**
 * Validates URL format
 * 
 * @param url - URL to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    throw new ValidationError('Invalid URL format');
  }
}

/**
 * Validates string length
 * 
 * @param value - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @param fieldName - Field name for error message
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateStringLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): boolean {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`
    );
  }
  
  return true;
}

/**
 * Validates required fields in an object
 * 
 * @param data - Object to validate
 * @param requiredFields - Array of required field names
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): boolean {
  const missingFields = requiredFields.filter(field => {
    return data[field] === undefined || data[field] === null || data[field] === '';
  });
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validates enum value
 * 
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Field name for error message
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateEnum(value: unknown, allowedValues: unknown[], fieldName: string = 'Value'): boolean {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Allowed values: ${allowedValues.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Sanitizes string input by removing potentially dangerous characters
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates file path format (no directory traversal)
 * 
 * @param filePath - File path to validate
 * @returns true if valid
 * @throws ValidationError if invalid
 */
export function validateFilePath(filePath: string): boolean {
  // Check for directory traversal attempts
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new ValidationError('Invalid file path: directory traversal not allowed');
  }
  
  // Check for absolute paths
  if (filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)) {
    throw new ValidationError('Invalid file path: absolute paths not allowed');
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_\-./]+$/.test(filePath)) {
    throw new ValidationError('Invalid file path: contains invalid characters');
  }
  
  return true;
}

/**
 * Validates JSON string
 * 
 * @param jsonString - JSON string to validate
 * @returns Parsed JSON object if valid
 * @throws ValidationError if invalid
 */
export function validateJSON(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch {
    throw new ValidationError('Invalid JSON format');
  }
}

/**
 * Validates pagination parameters
 * 
 * @param page - Page number
 * @param limit - Items per page
 * @returns Validated pagination params
 * @throws ValidationError if invalid
 */
export function validatePagination(
  page: number,
  limit: number
): { page: number; limit: number; offset: number } {
  try {
    const validated = PaginationSchema.parse({ page, limit });
    return {
      ...validated,
      offset: (validated.page - 1) * validated.limit,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join('; ');
      throw new ValidationError(messages);
    }
    throw error;
  }
}

/**
 * Type exports for validated data
 */
export type ValidatedChatMessage = z.infer<typeof ChatMessageSchema>;
export type ValidatedChatRequest = z.infer<typeof ChatRequestSchema>;
export type ValidatedPagination = z.infer<typeof PaginationSchema>;

/**
 * Verify session belongs to user
 * 
 * @param client - database client
 * @param sessionId - Session ID to verify
 * @param dbUserId - Database user ID
 * @returns true if session exists and belongs to user
 */
export async function verifySession(
  client: { from(table: string): { select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { single(): Promise<{ data?: unknown }> } } } } },
  sessionId: string,
  dbUserId: string
): Promise<boolean> {
  const { data: session } = await client
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', dbUserId)
    .single();

  return !!session;
}

/**
 * Build AI messages array from conversation
 * 
 * Properly handles:
 * - System messages
 * - User messages
 * - Assistant messages with tool_calls
 * - Tool result messages
 * 
 * This ensures AI has full conversation context including tool execution history.
 * 
 * @param conversation - Array of conversation messages
 * @param systemPrompt - System prompt to prepend
 * @returns Array of AI messages with complete context
 */
export function buildAIMessages(
  conversation: Array<{ role?: string; sender?: string; content?: string; tool_calls?: unknown; tool_call_id?: string; name?: string; images?: Array<{ url: string; key?: string; name?: string; type?: string; size?: number }> }>, 
  systemPrompt: string
): import('../features/models/ai-provider').ChatMessage[] {
  // Convert conversation messages with proper tool call handling
  const conversationMessages = conversation.map((msg) => {
    // Determine role
    const role = (msg.role === 'user' || msg.sender === 'user') 
      ? 'user' as const 
      : (msg.role === 'tool' || msg.sender === 'tool')
        ? 'tool' as const
        : msg.role === 'system'
          ? 'system' as const
          : 'assistant' as const;

    // Build message object
    const message: import('../features/models/ai-provider').ChatMessage = {
      role,
      content: msg.images?.length
        ? [
            { type: 'text' as const, text: msg.content || '' },
            ...msg.images.map((image) => ({ type: 'image_url' as const, image_url: { url: image.url } })),
          ]
        : msg.content || '',
    };

    // Include tool_calls if present (from assistant)
    if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
      message.tool_calls = msg.tool_calls;
    }

    // Include tool_call_id if present (from tool result)
    if (msg.tool_call_id) {
      message.tool_call_id = msg.tool_call_id;
    }

    // Include name if present (for tool results)
    if (msg.name) {
      message.name = msg.name;
    }

    return message;
  });

  // Build messages array with system prompt at the beginning
  const messages = [
    {
      role: 'system' as const,
      content: systemPrompt
    },
    ...conversationMessages
  ];


  return messages;
}
