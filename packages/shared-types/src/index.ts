/**
 * @cepatusaha/shared-types
 * Shared TypeScript types and interfaces for CepatUsaha platform
 */

// API types
export type {
  ApiResponse,
  APIErrorType,
  ValidationError,
  NetworkError,
  AuthError,
  StreamError,
  APIErrorUnion,
  ValidationResult,
  ValidationErrorDetail,
} from './api';

// Entity types
export type {
  User,
  Project,
  Session,
  File,
  Asset,
  PublicationMetadata,
  Publication,
  Dependency,
  AnalyticsEvent,
  FunctionCallLog,
  Checkpoint,
} from './entities';

// Chat types
export type {
  ChatMode,
  ChatRole,
  ActionStatus,
  ActionType,
  ActionItem,
  InputField,
  ResourceRequestData,
  ElementContext,
  ChatMessage,
  ToolCall,
  ToolCallProgress,
  ExecutionResult,
  MessageMetadata,
  ConversationMessage,
  ChatRequest,
  ChatResponse,
  StaticChatResponse,
  StaticToolCall,
  PlaybackPhase,
  PlaybackState,
  PlaybackConfig,
} from './chat';

// Streaming types
export type {
  TextChunkEvent,
  ThinkingChunkEvent,
  TextDoneEvent,
  FunctionCallStartEvent,
  FunctionCallCompleteEvent,
  IterationStartEvent,
  IterationCompleteEvent,
  LoopCompleteEvent,
  MetadataEvent,
  DoneEvent,
  ErrorEvent,
  StreamEvent,
  StreamChunk,
  IterationData,
} from './streaming';

// Session types
export type {
  SocialLinks,
  Profile,
  LayoutSection,
  LayoutBlueprint,
  GeneratedCopy,
  PreviewResponse,
  PublishResponse,
  PublicationRecord,
  AnalyticsSummary,
  ConversationStep,
  SessionModeEntry,
  SessionStatus,
  SessionData,
  SessionSummary,
  ImageUploadSource,
  ImageUpdatePayload,
} from './session';

// Admin types
export type {
  TimeSeriesData,
  CategoryData,
  DateRange,
  AdminStats,
  TokenUsage,
  SystemHealth,
  AdminActionLog,
} from './admin';

// Type guards
export {
  isValidMessageMetadata,
  castMessageMetadata,
  isChatMessage,
  isToolCall,
  isStreamEvent,
  isApiResponse,
  isValidationResult,
  isObject,
  isNonEmptyString,
  isDateString,
  isUUID,
} from './guards';
