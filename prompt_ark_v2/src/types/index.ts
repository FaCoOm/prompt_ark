/**
 * Core type definitions for Prompt Ark v2
 * Based on data-model.md
 */

// ==================== Prompt ====================

export interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  shortcut: string;
  createdAt: number;
  updatedAt: number;
  useCount: number;
  isFavorite: boolean;
  lastUsedAt?: number;
  language: string;
  source?: {
    type: 'manual' | 'smart-convert' | 'import' | 'shared';
    url?: string;
    title?: string;
  };
  contextVars?: string[];
  versions?: PromptVersion[];
}

export interface PromptVersion {
  id: string;
  content: string;
  createdAt: number;
  note?: string;
}

export interface CreatePromptDTO {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  shortcut?: string;
  language?: string;
  source?: Prompt['source'];
}

export interface UpdatePromptDTO {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  shortcut?: string;
  isFavorite?: boolean;
}

// ==================== Settings ====================

export type Language = 'zh-CN' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
export type Theme = 'auto' | 'light' | 'dark';
export type SyncEngine = 'none' | 'chrome' | 'gist' | 'webdav' | 'obsidian' | 'obsidian-local';
export type ListView = 'grid' | 'list';
export type SortBy = 'created' | 'updated' | 'used' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface Settings {
  language: Language;
  theme: Theme;
  syncEngine: SyncEngine;
  chromeSync?: {
    enabled: boolean;
    lastSyncAt?: number;
  };
  gistSync?: {
    enabled: boolean;
    token?: string;
    gistId?: string;
    lastSyncAt?: number;
  };
  webdavSync?: {
    enabled: boolean;
    url?: string;
    username?: string;
    password?: string;
    folder?: string;
    lastSyncAt?: number;
  };
  obsidianSync?: {
    enabled: boolean;
    webdavUrl?: string;
    username?: string;
    password?: string;
    folder?: string;
    lastSyncAt?: number;
  };
  obsidianLocal?: {
    enabled: boolean;
    port?: number;
    apiKey?: string;
    lastSyncAt?: number;
  };
  defaultProviderId?: string;
  imagePromptEnabled: boolean;
  defaultOutputRules?: OutputRules;
  preferences: {
    listView: ListView;
    pageSize: number;
    sortBy: SortBy;
    sortOrder: SortOrder;
  };
}

export interface OutputRules {
  format: 'auto' | 'markdown' | 'json' | 'table' | 'text' | 'code';
  maxLength?: number;
  tone: 'default' | 'professional' | 'concise' | 'creative';
  exclusions: string[];
}

// ==================== AI Provider ====================

export type AIProviderType = 'openai-compatible' | 'gemini-web' | 'gemini-api' | 'azure-openai';

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  baseUrl?: string;
  apiKey?: string;
  model: string;
  capabilities: {
    chat: boolean;
    vision: boolean;
    json: boolean;
  };
  defaults?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  enabled: boolean;
  createdAt: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapabilities;
  contextWindow: number;
}

export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  json: boolean;
  streaming: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ==================== Category ====================

export interface Category {
  name: string;
  displayName: string;
  order: number;
  icon?: string;
  color?: string;
  isSystem: boolean;
  createdAt: number;
}

// ==================== History ====================

export interface PromptHistory {
  id: string;
  promptId: string;
  content: string;
  variables?: Record<string, string>;
  platform?: string;
  usedAt: number;
  success: boolean;
  error?: string;
}

// ==================== Context ====================

export interface ContextSnapshot {
  id: string;
  pageTitle: string;
  pageUrl: string;
  selection?: string;
  pageText?: string;
  capturedAt: number;
  expiresAt: number;
}

// ==================== Video Analysis ====================

export interface VideoAnalysis {
  id: string;
  videoUrl: string;
  title: string;
  type: 'style-transfer' | 'complete-analysis' | 'inspiration';
  styleVocabulary?: {
    terms: Array<{
      term: string;
      definition: string;
      examples: string[];
    }>;
  };
  analysis?: {
    summary: string;
    style: string;
    storyboard: Array<{
      timestamp: string;
      description: string;
      shot: string;
    }>;
  };
  generatedPrompt?: string;
  analyzedAt: number;
}

// ==================== Storage Schema ====================

export interface StorageSchema {
  prompts: Prompt[];
  settings: Settings;
  providers: AIProvider[];
  categories: Category[];
  history: PromptHistory[];
  snapshots: ContextSnapshot[];
  'video-analyses': VideoAnalysis[];
  'cache:translations': Record<string, string>;
  'cache:ai-responses': Record<string, unknown>;
}

// ==================== Message Types ====================

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

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ==================== Filter & Sort ====================

export interface PromptFilter {
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  search?: string;
}

export interface PromptSort {
  by: SortBy;
  order: SortOrder;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Platform ====================

export type SupportedPlatform =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'kimi'
  | 'doubao'
  | 'qwen'
  | 'chatglm'
  | 'hailuoai'
  | 'hunyuan'
  | 'grok'
  | 'notebooklm'
  | 'aistudio'
  | 'yiyan'
  | 'perplexity';

export interface PlatformMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress?: number;
  model?: string;
}

// ==================== Sync ====================

export interface SyncPayload {
  prompts: Prompt[];
  settings: Settings;
  categories: Category[];
  version: number;
  exportedAt: number;
}

export interface SyncResult {
  success: boolean;
  action: 'pulled' | 'pushed' | 'merged' | 'none';
  data?: SyncPayload;
  conflict?: SyncConflict[];
  error?: string;
}

export interface SyncConflict {
  type: 'prompt' | 'setting' | 'category';
  id: string;
  localVersion: unknown;
  remoteVersion: unknown;
  resolution?: 'local' | 'remote' | 'manual';
}

export interface SyncEngineAdapter {
  readonly name: string;
  readonly displayName: string;
  isConfigured(): Promise<boolean>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  pull(): Promise<SyncResult>;
  push(data: SyncPayload): Promise<SyncResult>;
  sync(localData: SyncPayload): Promise<SyncResult>;
}

// ==================== Error Codes ====================

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
