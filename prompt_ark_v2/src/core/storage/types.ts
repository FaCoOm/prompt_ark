/**
 * @fileoverview Storage types for Prompt Ark v2
 *
 * Defines storage-related types, constants, and interfaces
 * for the dual-layer storage architecture.
 */

import type { Prompt, SlimPrompt } from '../../types';

/**
 * Chrome storage quota limits
 */
export const STORAGE_LIMITS = {
  /** Max bytes per sync item (8KB) */
  MAX_CHUNK_BYTES: 6000,
  /** Total sync quota (100KB) */
  SYNC_QUOTA_BYTES: 102400,
  /** Debounce delay in ms */
  DEBOUNCE_MS: 500,
} as const;

/**
 * Fields that are synced cross-device (per-prompt key)
 */
export const SYNC_FIELDS = [
  'id',
  'title',
  'content',
  'category',
  'tags',
  'shortcut',
  'variables',
  'favorite',
  'createdAt',
  'updatedAt',
] as const;

/**
 * Storage keys used in browser.storage
 */
export const STORAGE_KEYS = {
  /** Index of all prompt IDs */
  PROMPT_INDEX: 'p_index',
  /** Prefix for prompt data */
  PROMPT_PREFIX: 'p_',
  /** Local prompts array */
  LOCAL_PROMPTS: 'prompts',
  /** Sync status */
  SYNC_STATUS: 'syncStatus',
  /** Settings */
  SETTINGS: 'settings',
} as const;

/**
 * Sync backend types
 */
export type SyncBackend =
  | 'none'
  | 'chrome'
  | 'gist'
  | 'webdav'
  | 'obsidian'
  | 'obsidian-local';

/**
 * Sync status state
 */
export type SyncState = 'synced' | 'syncing' | 'failed' | 'none';

/**
 * Sync status information
 */
export interface SyncStatus {
  /** Current sync state */
  state: SyncState;
  /** Last successful sync timestamp */
  lastSyncTime?: number;
  /** Current backend */
  backend: SyncBackend;
  /** Error message if failed */
  error?: string;
}

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  /** Whether operation succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  /** Backend type */
  backend: SyncBackend;
  /** GitHub Gist ID */
  gistId?: string;
  /** GitHub token */
  githubToken?: string;
  /** WebDAV URL */
  webdavUrl?: string;
  /** WebDAV username */
  webdavUser?: string;
  /** WebDAV password */
  webdavPassword?: string;
  /** Obsidian WebDAV URL */
  obsidianWebdavUrl?: string;
  /** Obsidian WebDAV username */
  obsidianWebdavUser?: string;
  /** Obsidian WebDAV password */
  obsidianWebdavPassword?: string;
  /** Obsidian folder */
  obsidianFolder: string;
  /** Obsidian Local port */
  obsidianLocalPort: number;
  /** Obsidian Local API key */
  obsidianLocalApiKey?: string;
}

/**
 * Chunked prompt data for large content
 */
export interface ChunkedPromptData {
  /** Base prompt data (compressed) */
  base: string;
  /** Number of content chunks */
  _chunks?: number;
}

/**
 * Sync payload for external backends
 */
export interface SyncPayload {
  /** Slim prompts for sync */
  prompts: SlimPrompt[];
  /** Timestamp */
  timestamp: number;
  /** Version */
  version: string;
}
