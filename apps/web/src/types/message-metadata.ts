/**
 * Strongly-typed message metadata
 * Re-exports types from shared-types package for convenience
 */

// Re-export types from shared-types
export type {
  ToolCallProgress,
  ToolCall,
  ExecutionResult,
  MessageMetadata,
} from '@cepatusaha/shared-types'

// Re-export type guards from shared-types
export {
  isValidMessageMetadata,
  castMessageMetadata,
} from '@cepatusaha/shared-types'
