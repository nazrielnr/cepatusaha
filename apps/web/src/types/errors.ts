export interface APIErrorType {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

export interface ValidationError extends APIErrorType {
  code: 'VALIDATION_ERROR'
  fields?: Record<string, string[]>
}

export interface NetworkError extends APIErrorType {
  code: 'NETWORK_ERROR'
  retryable: boolean
}

export interface AuthError extends APIErrorType {
  code: 'AUTH_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN'
}

export interface StreamError extends APIErrorType {
  code: 'STREAM_ERROR' | 'ABORTED'
}

export type APIErrorUnion = ValidationError | NetworkError | AuthError | StreamError | APIErrorType
