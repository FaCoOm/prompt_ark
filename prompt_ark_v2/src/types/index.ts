/**
 * @fileoverview Core type definitions for Prompt Ark v2
 * 
 * Unified export of all type modules.
 * Based on v1 data structures from lib/storage.js, lib/ai/provider.js, lib/variables.js
 */

// ==================== Prompt Types ====================
export type {
  Prompt,
  PromptVersion,
  PromptSource,
  PromptSourceType,
  CreatePromptDTO,
  UpdatePromptDTO,
  Category,
  Tag,
  SlimPrompt,
  PromptFilter,
  PromptSort,
  SortBy,
  SortOrder,
  ListView,
  PaginatedResult,
} from './prompt';

// ==================== Variable Types ====================
export type {
  VariableDefinition,
  VariableValue,
  VariableType,
  ClassifiedVariables,
  ContextVariableName,
  ContextVariableMap,
  ContextResolutionResult,
  ParsedVariableSpec,
} from './variables';

// ==================== AI Types ====================
export type {
  AIProvider,
  AIProviderType,
  AIModel,
  ModelCapabilities,
  ChatMessage,
  ChatMessageRole,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  MetadataExtractionResult,
  PromptOptimizationResult,
} from './ai';

// ==================== Storage Types ====================
export type {
  Settings,
  OutputRules,
  UserPreferences,
  ChromeSyncConfig,
  GistSyncConfig,
  WebDAVSyncConfig,
  ObsidianSyncConfig,
  ObsidianLocalConfig,
  ContextSnapshot,
  PromptHistory,
  VideoAnalysis,
  StorageSchema,
  StorageKey,
} from './storage';

// Re-export SyncPayload from sync.ts (canonical location)
export type { SyncPayload } from './sync';

// ==================== Sync Types ====================
export type {
  SyncBackend,
  SyncState,
  SyncStatus,
  SyncResult,
  SyncConflict,
  SyncErrorCode,
  SyncEngineAdapter,
  SyncConfig,
} from './sync';

// ==================== Platform Types ====================
export type {
  SupportedPlatform,
  PlatformConfig,
  PlatformAdapter,
  PlatformMessage,
  GenerationStatus,
  InsertionResult,
  InsertionErrorCode,
  PlatformDetectionResult,
} from './platform';

// ==================== Extension Message Types ====================

/** Message types for extension communication */
export type MessageType =
  | 'GET_PROMPTS'
  | 'SAVE_PROMPT'
  | 'UPDATE_PROMPT'
  | 'DELETE_PROMPT'
  | 'INSERT_PROMPT'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'OPTIMIZE_PROMPT'
  | 'TRANSLATE_PROMPT'
  | 'SMART_CONVERT'
  | 'SYNC_NOW'
  | 'SYNC_STATUS'
  | 'GRAB_CONTEXT'
  | 'GET_CONTEXT';

/** Extension message structure */
export interface ExtensionMessage {
  /** Message type identifier */
  type: MessageType;
  /** Message payload */
  payload?: unknown;
}

/** Extension response structure */
export interface ExtensionResponse<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  code?: ErrorCode;
}

// ==================== Error Codes ====================

/** Error codes for programmatic error handling */
export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  TIMEOUT = 'TIMEOUT',
  PROMPT_NOT_FOUND = 'PROMPT_NOT_FOUND',
  PROMPT_VALIDATION_FAILED = 'PROMPT_VALIDATION_FAILED',
  PROMPT_INSERT_FAILED = 'PROMPT_INSERT_FAILED',
  AI_PROVIDER_NOT_FOUND = 'AI_PROVIDER_NOT_FOUND',
  AI_REQUEST_FAILED = 'AI_REQUEST_FAILED',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
  SYNC_NOT_ENABLED = 'SYNC_NOT_ENABLED',
  SYNC_AUTH_FAILED = 'SYNC_AUTH_FAILED',
  SYNC_NETWORK_ERROR = 'SYNC_NETWORK_ERROR',
  CONTEXT_EXPIRED = 'CONTEXT_EXPIRED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
}
