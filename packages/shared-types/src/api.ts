/**
 * API Response and Error Types
 * Shared types for API communication between frontend and backend
 */

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

/**
 * Base API error type
 */
export interface APIErrorType {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Validation error type
 */
export interface ValidationError extends APIErrorType {
  code: 'VALIDATION_ERROR';
  fields?: Record<string, string[]>;
}

/**
 * Network error type
 */
export interface NetworkError extends APIErrorType {
  code: 'NETWORK_ERROR';
  retryable: boolean;
}

/**
 * Authentication error type
 */
export interface AuthError extends APIErrorType {
  code: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN';
}

/**
 * Stream error type
 */
export interface StreamError extends APIErrorType {
  code: 'STREAM_ERROR' | 'ABORTED';
}

/**
 * Union type of all possible API errors
 */
export type APIErrorUnion = ValidationError | NetworkError | AuthError | StreamError | APIErrorType;

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
