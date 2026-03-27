/**
 * @fileoverview Platform adapter type definitions for Prompt Ark v2
 * 
 * Contains platform-specific types for AI platform integration
 */

/**
 * Supported AI platforms for prompt injection
 */
export type SupportedPlatform =
  | 'chatgpt'      // OpenAI ChatGPT
  | 'claude'       // Anthropic Claude
  | 'gemini'       // Google Gemini
  | 'deepseek'     // DeepSeek
  | 'kimi'         // Moonshot Kimi
  | 'doubao'       // ByteDance Doubao
  | 'qwen'         // Alibaba Qwen
  | 'chatglm'      // Zhipu ChatGLM
  | 'hailuoai'     // MiniMax Hailuo AI
  | 'hunyuan'      // Tencent Hunyuan
  | 'grok'         // xAI Grok
  | 'notebooklm'   // Google NotebookLM
  | 'aistudio'     // Google AI Studio
  | 'yiyan'        // Baidu Ernie/Yiyan
  | 'perplexity';  // Perplexity

/**
 * Platform configuration for injection behavior
 */
export interface PlatformConfig {
  /** Platform identifier */
  id: SupportedPlatform;
  /** Display name */
  name: string;
  /** URL patterns that match this platform */
  urlPatterns: string[];
  /** DOM selectors for finding the chat input */
  inputSelectors: string[];
  /** Whether the platform uses a rich text editor */
  isRichEditor: boolean;
  /** Whether the platform supports file attachments */
  supportsAttachments: boolean;
  /** Maximum character limit (if any) */
  charLimit?: number;
  /** Whether to simulate user input events */
  simulateInput: boolean;
  /** Whether to wait for page to be ready */
  waitForReady: boolean;
}

/**
 * Platform adapter interface for DOM injection
 * Each platform implements this for custom injection logic
 */
export interface PlatformAdapter {
  /** Platform configuration */
  readonly config: PlatformConfig;
  /** Check if current page matches this platform */
  matches(url: string): boolean;
  /** Find the chat input element */
  findInput(): HTMLElement | null;
  /** Insert text into the chat input */
  insert(text: string): Promise<{ success: boolean; error?: string }>;
  /** Get current input value */
  getValue(): string;
  /** Clear the input */
  clear(): void;
  /** Check if the platform is ready for input */
  isReady(): boolean;
}

/**
 * Message in a platform conversation
 */
export interface PlatformMessage {
  /** Unique message identifier */
  id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Optional timestamp */
  timestamp?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Generation state on the platform
 */
export interface GenerationStatus {
  /** Whether the AI is currently generating */
  isGenerating: boolean;
  /** Generation progress (0-100) if available */
  progress?: number;
  /** Model being used */
  model?: string;
}

/**
 * Result of a prompt insertion operation
 */
export interface InsertionResult {
  /** Whether insertion succeeded */
  success: boolean;
  /** Platform where insertion was attempted */
  platform: SupportedPlatform;
  /** Timestamp of insertion */
  timestamp: number;
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: InsertionErrorCode;
}

/**
 * Error codes for insertion failures
 */
export type InsertionErrorCode =
  | 'PLATFORM_NOT_DETECTED'
  | 'INPUT_NOT_FOUND'
  | 'INPUT_NOT_READY'
  | 'INSERTION_FAILED'
  | 'CHAR_LIMIT_EXCEEDED'
  | 'PLATFORM_NOT_SUPPORTED';

/**
 * Platform detection result
 */
export interface PlatformDetectionResult {
  /** Detected platform (null if none detected) */
  platform: SupportedPlatform | null;
  /** Confidence level of detection (0-1) */
  confidence: number;
  /** URL that was analyzed */
  url: string;
}
