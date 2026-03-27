/**
 * @fileoverview AI Provider type definitions for Prompt Ark v2
 * 
 * Based on v1 data structures from lib/ai/provider.js
 * Contains AI provider, model, and chat types
 */

/**
 * AI Provider type - determines the API protocol used
 */
export type AIProviderType =
  | 'openai'           // OpenAI API
  | 'openai-compatible' // OpenAI-compatible providers (generic)
  | 'gemini'           // Google Gemini API
  | 'gemini-web'       // Gemini Web interface (free, no API key)
  | 'azure-openai';    // Azure OpenAI Service

/**
 * AI Provider configuration
 * Contains API credentials and default settings
 */
export interface AIProvider {
  /** Unique identifier for this provider instance */
  id: string;
  /** Display name (user-defined) */
  name: string;
  /** Provider type determines API protocol */
  type: AIProviderType;
  /** Base URL for API requests (not needed for gemini-web) */
  baseUrl?: string;
  /** API key (encrypted in storage) */
  apiKey?: string;
  /** Default model identifier */
  model: string;
  /** Capabilities supported by this provider */
  capabilities: {
    /** Basic chat/text completion */
    chat: boolean;
    /** Vision/multimodal (image input) */
    vision: boolean;
    /** Structured JSON output */
    json: boolean;
  };
  /** Default parameters for generation */
  defaults?: {
    /** Temperature (0-2, default varies by provider) */
    temperature?: number;
    /** Maximum tokens to generate */
    maxTokens?: number;
    /** Top-p sampling parameter */
    topP?: number;
  };
  /** Whether this provider is enabled */
  enabled: boolean;
}

/**
 * AI Model information
 */
export interface AIModel {
  /** Model identifier (used in API calls) */
  id: string;
  /** Display name */
  name: string;
  /** Provider ID that hosts this model */
  provider: string;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Context window size in tokens */
  contextWindow: number;
}

/**
 * Model capability flags
 */
export interface ModelCapabilities {
  /** Basic chat completion */
  chat: boolean;
  /** Vision/image input support */
  vision: boolean;
  /** Structured JSON output */
  json: boolean;
  /** Streaming response support */
  streaming: boolean;
}

/**
 * Role of a chat message
 */
export type ChatMessageRole = 'system' | 'user' | 'assistant';

/**
 * Single message in a chat conversation
 */
export interface ChatMessage {
  /** Message role */
  role: ChatMessageRole;
  /** Message content (text) */
  content: string;
  /** Optional base64-encoded images for vision models */
  images?: string[];
}

/**
 * Options for chat/completion requests
 */
export interface ChatOptions {
  /** Model identifier to use */
  model: string;
  /** Conversation messages */
  messages: ChatMessage[];
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Standard chat response structure
 */
export interface ChatResponse {
  /** Generated content */
  content: string;
  /** Model that generated the response */
  model: string;
  /** Token usage statistics */
  usage?: {
    /** Tokens in the prompt */
    promptTokens: number;
    /** Tokens in the completion */
    completionTokens: number;
    /** Total tokens used */
    totalTokens: number;
  };
}

/**
 * Single chunk from a streaming response
 */
export interface ChatStreamChunk {
  /** Content delta for this chunk */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Token usage (usually only on final chunk) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Metadata extraction result (title/category/tags)
 * Returned by AI when analyzing prompt content
 */
export interface MetadataExtractionResult {
  /** Extracted title */
  title: string;
  /** Extracted category */
  category: string;
  /** Extracted tags */
  tags: string[];
}

/**
 * Prompt optimization result
 */
export interface PromptOptimizationResult {
  /** Original prompt content */
  original: string;
  /** Optimized versions */
  variants: {
    /** Concise/clear version */
    concise?: string;
    /** Enhanced/detailed version */
    enhanced?: string;
    /** Professional/formal version */
    professional?: string;
  };
}
