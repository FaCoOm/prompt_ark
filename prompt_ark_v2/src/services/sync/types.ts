/**
 * @fileoverview Sync service type definitions for Prompt Ark v2
 *
 * Service-level types for sync operations.
 * Complements the core types defined in src/types/sync.ts
 */

import type {
  SyncResult,
  SyncPayload,
  SyncBackend,
  SyncStatus,
  SyncConfig,
} from '../../types';
import type { Prompt } from '../../types';

/**
 * Sync service configuration with runtime settings
 */
export interface SyncServiceConfig extends SyncConfig {
  /** Debounce delay for sync operations (ms) */
  debounceMs: number;
  /** Whether to auto-sync on data changes */
  autoSync: boolean;
}

/**
 * Merge strategy for handling conflicts
 */
export type MergeStrategy = 'local-wins' | 'remote-wins' | 'newest-wins' | 'manual';

/**
 * Options for sync operations
 */
export interface SyncOptions {
  /** How to resolve conflicts */
  mergeStrategy?: MergeStrategy;
  /** Force sync even if no changes detected */
  force?: boolean;
  /** Timeout for the operation (ms) */
  timeout?: number;
}

/**
 * Internal sync state tracking
 */
export interface SyncInternalState {
  /** Currently configured backend */
  backend: SyncBackend;
  /** Whether config has been loaded */
  isConfigLoaded: boolean;
  /** Pending sync operation promise */
  pendingSync: Promise<SyncResult> | null;
  /** Last sync timestamp */
  lastSyncTime: number | null;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
}

/**
 * Debounced function wrapper
 */
export type DebouncedFunction<T extends unknown[]> = {
  (...args: T): Promise<void>;
  /** Cancel pending execution */
  cancel(): void;
  /** Flush pending execution immediately */
  flush(): Promise<void>;
};

/**
 * Chrome storage quota information
 */
export interface ChromeQuotaInfo {
  /** Bytes currently in use */
  bytesInUse: number;
  /** Maximum allowed bytes */
  quotaBytes: number;
  /** Usage percentage (0-100) */
  percentUsed: number;
  /** Remaining bytes */
  bytesRemaining: number;
}

/**
 * Gist file information from GitHub API
 */
export interface GistFile {
  /** File name */
  filename: string;
  /** File type */
  type: string;
  /** Language */
  language: string | null;
  /** Raw content URL */
  raw_url: string;
  /** File size in bytes */
  size: number;
  /** File content (when fetched with ?per_file_content=1) */
  content?: string;
  /** Truncated flag */
  truncated?: boolean;
}

/**
 * GitHub Gist API response
 */
export interface GistApiResponse {
  /** Gist ID */
  id: string;
  /** Gist description */
  description: string | null;
  /** Whether gist is public */
  public: boolean;
  /** Owner information */
  owner?: {
    login: string;
    id: number;
  };
  /** Files in the gist */
  files: Record<string, GistFile>;
  /** HTML URL */
  html_url: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * WebDAV PROPFIND response item
 */
export interface WebDAVPropfindItem {
  /** Item path (href) */
  href: string;
  /** Display name */
  displayName: string;
  /** Content type */
  contentType?: string;
  /** Last modified date */
  lastModified?: string;
  /** Content length */
  contentLength?: number;
  /** Whether it's a collection (directory) */
  isCollection: boolean;
}

/**
 * WebDAV file listing result
 */
export interface WebDAVFileList {
  /** Files found */
  files: Array<{
    name: string;
    lastModified: string;
  }>;
  /** Total count */
  count: number;
}

/**
 * Compression result for sync data
 */
export interface CompressionResult {
  /** Original size in bytes */
  originalSize: number;
  /** Compressed size in bytes */
  compressedSize: number;
  /** Compression ratio (compressed / original) */
  ratio: number;
  /** Whether compression was applied */
  compressed: boolean;
  /** The compressed data string (with lz:: prefix if compressed) */
  data: string;
}

/**
 * Prompt merge result
 */
export interface PromptMergeResult {
  /** Merged prompts */
  prompts: Prompt[];
  /** Number of prompts added from remote */
  added: number;
  /** Number of prompts updated from remote */
  updated: number;
  /** Number of local-only prompts kept */
  localOnly: number;
  /** Conflicts that need resolution */
  conflicts: Array<{
    promptId: string;
    localUpdatedAt: number;
    remoteUpdatedAt: number;
  }>;
}

/**
 * Obsidian vault prompt structure (for WebDAV sync)
 */
export interface ObsidianVaultPrompt {
  /** Prompt ID (stored in frontmatter as prompt_ark_id) */
  id?: string;
  /** Title */
  title: string;
  /** Content */
  content: string;
  /** Category */
  category?: string;
  /** Tags */
  tags?: string[];
  /** Favorite status */
  favorite?: boolean;
  /** Shortcut */
  shortcut?: string;
  /** Variables */
  variables?: unknown[];
  /** Prompt Ark ID from frontmatter */
  prompt_ark_id?: string;
}

/**
 * Obsidian Local API response
 */
export interface ObsidianLocalApiResponse {
  /** Success status */
  success: boolean;
  /** Response data */
  data?: unknown;
  /** Error message */
  error?: string;
}

/**
 * Sync adapter factory function type
 */
export type SyncAdapterFactory = (config: SyncConfig) => SyncServiceAdapter;

/**
 * Common interface for all sync service adapters
 * Each backend implements this interface
 */
export interface SyncServiceAdapter {
  /** Adapter name */
  readonly name: SyncBackend;
  /** Display name for UI */
  readonly displayName: string;
  /** Check if adapter is properly configured */
  isConfigured(): boolean;
  /** Test connection to the backend */
  testConnection(): Promise<{ success: boolean; error?: string }>;
  /** Pull data from remote */
  pull(): Promise<SyncResult>;
  /** Push data to remote */
  push(payload: SyncPayload): Promise<SyncResult>;
  /** Get sync status */
  getStatus(): Promise<SyncStatus>;
}

/**
 * Error codes specific to sync services
 */
export type SyncServiceErrorCode =
  | 'CHROME_QUOTA_EXCEEDED'
  | 'CHROME_SYNC_UNAVAILABLE'
  | 'CHROME_CHUNK_FAILED'
  | 'GIST_AUTH_FAILED'
  | 'GIST_NOT_FOUND'
  | 'GIST_RATE_LIMITED'
  | 'GIST_PARSE_ERROR'
  | 'WEBDAV_AUTH_FAILED'
  | 'WEBDAV_NOT_FOUND'
  | 'WEBDAV_TIMEOUT'
  | 'WEBDAV_MKCOL_FAILED'
  | 'OBSIDIAN_DIR_NOT_FOUND'
  | 'OBSIDIAN_LOCAL_OFFLINE'
  | 'OBSIDIAN_LOCAL_UNAUTHORIZED';

/**
 * Sync service error
 */
export class SyncServiceError extends Error {
  constructor(
    message: string,
    public readonly code: SyncServiceErrorCode,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SyncServiceError';
  }
}
