/**
 * @fileoverview Sync type definitions for Prompt Ark v2
 * 
 * Based on v1 data structures from lib/storage.js
 * Contains sync backend, status, and conflict types
 */

import type { Prompt } from './prompt';
import type { Settings } from './storage';
import type { Category } from './prompt';

/**
 * Available sync backends for cross-device synchronization
 * Based on v1 SyncManager.backend values from lib/storage.js
 */
export type SyncBackend = 
  | 'none'         // No sync enabled
  | 'chrome'       // Chrome Storage Sync (default, ~100KB limit)
  | 'gist'         // GitHub Gist sync (unlimited, needs token)
  | 'webdav'       // WebDAV server (self-hosted)
  | 'obsidian'     // Obsidian vault via WebDAV
  | 'obsidian-local'; // Obsidian Local REST API

/**
 * Current synchronization state
 */
export type SyncState = 
  | 'idle'      // No sync in progress
  | 'syncing'   // Sync operation in progress
  | 'synced'    // Successfully synced
  | 'failed'    // Last sync failed
  | 'conflict'; // Has unresolved conflicts

/**
 * Synchronization status for UI display
 */
export interface SyncStatus {
  /** Current sync state */
  state: SyncState;
  /** Which backend is configured */
  backend: SyncBackend;
  /** Timestamp of last successful sync */
  lastSyncTime?: number;
  /** Error message if failed */
  error?: string;
  /** Number of pending changes (if applicable) */
  pendingChanges?: number;
}

/**
 * Sync result returned by sync operations
 */
export interface SyncResult {
  /** Whether sync succeeded */
  success: boolean;
  /** What action was taken */
  action: 'pulled' | 'pushed' | 'merged' | 'none';
  /** The data that was synced (if pulled/merged) */
  data?: SyncPayload;
  /** Conflicts that need resolution */
  conflicts?: SyncConflict[];
  /** Error message if failed */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: SyncErrorCode;
}

/**
 * Sync payload containing data to be synchronized
 */
export interface SyncPayload {
  /** Prompts to sync (slim version without local-only fields) */
  prompts: Prompt[];
  /** Settings to sync (sensitive fields stripped) */
  settings: Settings;
  /** Categories to sync */
  categories: Category[];
  /** Schema version for migration handling */
  version: number;
  /** When the payload was exported */
  exportedAt: number;
}

/**
 * Sync conflict when local and remote data differ
 */
export interface SyncConflict {
  /** Type of item in conflict */
  type: 'prompt' | 'setting' | 'category';
  /** ID of the conflicting item */
  id: string;
  /** Local version of the data */
  localVersion: unknown;
  /** Remote version of the data */
  remoteVersion: unknown;
  /** How the conflict was/will be resolved */
  resolution?: 'local' | 'remote' | 'manual' | 'merge';
  /** Timestamp when conflict was detected */
  detectedAt?: number;
}

/**
 * Sync error codes for programmatic error handling
 */
export type SyncErrorCode =
  | 'SYNC_NOT_ENABLED'
  | 'SYNC_AUTH_FAILED'
  | 'SYNC_NETWORK_ERROR'
  | 'SYNC_PARSE_FAILED'
  | 'SYNC_QUOTA_EXCEEDED'
  | 'SYNC_CONFLICT'
  | 'SYNC_BACKEND_NOT_CONFIGURED'
  | 'ERR_GIST_NOT_ENABLED'
  | 'ERR_GIST_NO_TOKEN'
  | 'ERR_GIST_EMPTY_ID_AUTO_CREATE'
  | 'ERR_GIST_NO_CONTENT'
  | 'ERR_GIST_PARSE_FAILED'
  | 'ERR_WEBDAV_NOT_ENABLED'
  | 'ERR_WEBDAV_MISSING_CONFIG'
  | 'ERR_OBSIDIAN_LOCAL_NOT_ENABLED'
  | 'ERR_OBSIDIAN_LOCAL_OFFLINE'
  | 'ERR_OBSIDIAN_LOCAL_FETCH_FAILED';

/**
 * Sync engine adapter interface
 * Implemented by each sync backend
 */
export interface SyncEngineAdapter {
  /** Internal name of the adapter */
  readonly name: string;
  /** Display name for UI */
  readonly displayName: string;
  /** Check if the adapter is properly configured */
  isConfigured(): Promise<boolean>;
  /** Test connection to the backend */
  testConnection(): Promise<{ success: boolean; error?: string }>;
  /** Pull data from remote */
  pull(): Promise<SyncResult>;
  /** Push data to remote */
  push(data: SyncPayload): Promise<SyncResult>;
  /** Bidirectional sync (pull, merge, push) */
  sync(localData: SyncPayload): Promise<SyncResult>;
}

/**
 * Sync configuration for storage
 */
export interface SyncConfig {
  /** Currently active backend */
  backend: SyncBackend;
  /** GitHub token for Gist sync */
  gistToken?: string;
  /** Gist ID for storing data */
  gistId?: string;
  /** WebDAV server URL */
  webdavUrl?: string;
  /** WebDAV username */
  webdavUsername?: string;
  /** WebDAV password (encrypted) */
  webdavPassword?: string;
  /** Obsidian WebDAV URL */
  obsidianWebdavUrl?: string;
  /** Obsidian WebDAV username */
  obsidianWebdavUsername?: string;
  /** Obsidian WebDAV password (encrypted) */
  obsidianWebdavPassword?: string;
  /** Obsidian vault folder */
  obsidianFolder?: string;
  /** Obsidian Local API port */
  obsidianLocalPort?: number;
  /** Obsidian Local API key */
  obsidianLocalApiKey?: string;
}
