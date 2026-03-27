/**
 * @fileoverview AI Provider service types for Prompt Ark v2
 *
 * Extended types for the AI Provider system, building on top of
 * the base types defined in @/types/ai.ts.
 *
 * @module services/ai/types
 */

import type { AIProvider, AIProviderType, MetadataExtractionResult } from '@/types/ai';

// ==================== Provider Storage Types ====================

/**
 * Provider data as stored in LocalStorage (with encrypted API keys)
 */
export interface StoredProvider extends Omit<AIProvider, 'apiKey'> {
  /** Encrypted API key */
  apiKey?: string;
}

/**
 * Provider data with decrypted API key (runtime use)
 */
export interface RuntimeProvider extends AIProvider {
  /** Decrypted API key */
  apiKey?: string;
}

// ==================== Provider Configuration Types ====================

/**
 * Configuration for creating a new provider
 */
export interface ProviderConfig {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Provider type */
  type: AIProviderType;
  /** Base URL for API requests */
  baseUrl?: string;
  /** API key (will be encrypted before storage) */
  apiKey?: string;
  /** Default model */
  model: string;
  /** Whether enabled */
  enabled: boolean;
}

/**
 * Legacy provider settings for migration
 */
export interface LegacyProviderSettings {
  /** Old AI provider identifier */
  aiProvider?: string;
  /** Gemini API key */
  geminiApiKey?: string;
  /** OpenAI API URL */
  openaiApiUrl?: string;
  /** OpenAI API key */
  openaiApiKey?: string;
  /** OpenAI model */
  openaiModel?: string;
  /** Providers array (already migrated) */
  providers?: StoredProvider[];
}

// ==================== API Request Types ====================

/**
 * Options for fetchWithTimeout
 */
export interface FetchWithTimeoutOptions extends RequestInit {
  /** Request timeout in milliseconds */
  timeoutMs?: number;
}

/**
 * Cloud API call options
 */
export interface CloudAPICallOptions {
  /** Text content to process */
  text: string;
  /** Language code (e.g., 'zh', 'en') */
  lang: string;
  /** Optional system prompt override */
  systemPrompt?: string;
}

// ==================== Gemini Web Types ====================

/**
 * Gemini Web model identifiers and their internal trace IDs
 */
export type GeminiWebModelId = 'gemini-3-flash' | 'gemini-3-flash-thinking' | 'gemini-3-pro';

/**
 * Map of Gemini Web model IDs to their internal trace IDs
 */
export type GeminiWebModelMap = Record<GeminiWebModelId, string>;

/**
 * Gemini Web authentication credentials
 */
export interface GeminiWebCredentials {
  /** SNlM0e XSRF token */
  atValue: string;
  /** Build label */
  blValue: string;
  /** Session ID */
  fSid: string;
  /** Auth user index */
  authUser: string;
}

/**
 * Parsed response from Gemini Web stream
 */
export interface GeminiWebResponse {
  /** Generated text content */
  text: string;
  /** Optional thinking/reasoning content */
  thoughts: string | null;
}

/**
 * Request correlation tokens for Gemini Web API
 */
export interface GeminiWebCorrelationTokens {
  /** 16-char hex trace ID */
  traceId: string;
  /** UUID for request tracking */
  requestId: string;
}

// ==================== Provider Base Types ====================

/**
 * Base interface that all AI providers must implement
 */
export interface AIProviderBase {
  /** Provider configuration */
  readonly config: RuntimeProvider;

  /**
   * Check if this provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generate text completion
   * @param prompt - The prompt to send
   * @returns Generated text
   */
  generateText(prompt: string): Promise<string>;

  /**
   * Extract metadata from text content
   * @param text - Content to analyze
   * @param lang - Language for response
   * @returns Extracted metadata
   */
  extractMetadata(text: string, lang: string): Promise<MetadataExtractionResult | null>;
}

/**
 * Provider manager interface
 */
export interface IProviderManager {
  /**
   * Get all configured providers
   */
  getProviders(): Promise<RuntimeProvider[]>;

  /**
   * Save providers (API keys will be encrypted)
   */
  setProviders(providers: RuntimeProvider[]): Promise<void>;

  /**
   * Get the currently active provider
   */
  getActiveProvider(): Promise<RuntimeProvider | null>;

  /**
   * Set the active provider by ID
   */
  setActiveProvider(providerId: string): Promise<void>;

  /**
   * Migrate legacy provider settings
   */
  migrateProviderSettings(): Promise<void>;
}

// ==================== Utility Types ====================

/**
 * Keep-alive interval controller
 */
export interface KeepAliveController {
  /** Stop the keep-alive interval */
  stop: () => void;
}

/**
 * Safe parse result
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * API error with status code
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseText?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Not logged in error for Gemini Web
 */
export class NotLoggedInError extends Error {
  constructor(message = 'NOT_LOGGED_IN') {
    super(message);
    this.name = 'NotLoggedInError';
  }
}
