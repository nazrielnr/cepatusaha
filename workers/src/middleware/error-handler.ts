/**
 * Error handling middleware for Cloudflare Workers
 * 
 * Maps error types to HTTP status codes and returns consistent error responses.
 * Adapted from api/lib/errors.ts for Cloudflare Workers environment.
 * 
 * @see Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */
import { warnLog, errorLog } from '../shared/logger';

import type { Context } from 'hono';
import type { Bindings } from '../bindings';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '../shared/errors';

/**
 * Error response format matching Vercel implementation
 */
export interface ErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Maps error types to HTTP status codes
 * 
 * @param error - Error object
 * @returns HTTP status code
 */
export function getStatusCodeForError(error: Error): number {
  // Check if error has statusCode property (AppError subclasses)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  
  // Fallback to instanceof checks for compatibility
  if (error instanceof ValidationError) {
    return 400;
  }
  if (error instanceof AuthenticationError) {
    return 401;
  }
  if (error instanceof AuthorizationError) {
    return 403;
  }
  if (error instanceof NotFoundError) {
    return 404;
  }
  if (error instanceof ConflictError) {
    return 409;
  }
  if (error instanceof InternalError) {
    return 500;
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Maps error types to error codes
 * 
 * @param error - Error object
 * @returns Error code string
 */
export function getErrorCode(error: Error): string {
  // Check if error has code property (AppError subclasses)
  if ('code' in error && typeof error.code === 'string') {
    return error.code;
  }
  
  // Fallback to instanceof checks for compatibility
  if (error instanceof ValidationError) {
    return 'VALIDATION_ERROR';
  }
  if (error instanceof AuthenticationError) {
    return 'UNAUTHORIZED';
  }
  if (error instanceof AuthorizationError) {
    return 'FORBIDDEN';
  }
  if (error instanceof NotFoundError) {
    return 'NOT_FOUND';
  }
  if (error instanceof ConflictError) {
    return 'CONFLICT';
  }
  if (error instanceof InternalError) {
    return 'INTERNAL_ERROR';
  }
  
  // Default error code
  return 'INTERNAL_ERROR';
}

/**
 * Creates a standardized error response
 * 
 * @param error - Error object
 * @param env - Environment bindings
 * @returns Error response object
 */
export function createErrorResponse(error: Error, env?: Bindings): ErrorResponse {
  const statusCode = getStatusCodeForError(error);
  const code = getErrorCode(error);
  
  // In production, hide internal error details
  const message = env?.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal error occurred'
    : error.message;
  
  return {
    status: 'error',
    error: {
      code,
      message,
    },
  };
}

/**
 * Logs error with appropriate context
 * 
 * @param error - Error object
 * @param context - Additional context
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  errorLog(undefined, 'Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Error handler middleware for Hono
 * 
 * Catches all unhandled errors and returns appropriate HTTP responses.
 * Maintains backward compatibility with Vercel implementation.
 * Logs errors to system_error_logs table for monitoring.
 * 
 * @param err - Error object
 * @param c - Hono context
 * @returns JSON error response
 */
import type { HonoContext } from '../shared/types';

export async function errorHandler(err: Error, c: HonoContext) {
  // Log error for debugging (console)
  logError(err, {
    path: c.req.path,
    method: c.req.method,
  });
  
  // Get status code and create response
  const statusCode = getStatusCodeForError(err);
  const errorResponse = createErrorResponse(err, c.env);
  
  return c.json(errorResponse, statusCode as never);
}

