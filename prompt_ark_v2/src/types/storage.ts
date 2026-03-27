/**
 * @fileoverview Storage schema type definitions for Prompt Ark v2
 * 
 * Based on v1 data structures from lib/storage.js
 * Contains storage schemas and sync payload types
 */

import type { Prompt } from './prompt';
import type { AIProvider } from './ai';
import type { Category } from './prompt';
import type { SyncBackend } from './sync';

/**
 * Output format rules for AI generation
 */
export interface OutputRules {
  /** Desired output format */
  format: 'auto' | 'markdown' | 'json' | 'table' | 'text' | 'code';
  /** Maximum length constraint */
  maxLength?: number;
  /** Tone/style for output */
  tone: 'default' | 'professional' | 'concise' | 'creative';
  /** Content to exclude from output */
  exclusions: string[];
}

/**
 * Chrome Sync configuration
 */
export interface ChromeSyncConfig {
  /** Whether Chrome sync is enabled */
  enabled: boolean;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
}

/**
 * GitHub Gist sync configuration
 */
export interface GistSyncConfig {
  /** Whether Gist sync is enabled */
  enabled: boolean;
  /** GitHub personal access token */
  token?: string;
  /** Gist ID for storing data */
  gistId?: string;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
}

/**
 * WebDAV sync configuration
 */
export interface WebDAVSyncConfig {
  /** Whether WebDAV sync is enabled */
  enabled: boolean;
  /** WebDAV server URL */
  url?: string;
  /** WebDAV username */
  username?: string;
  /** WebDAV password (encrypted) */
  password?: string;
  /** Folder path on WebDAV server */
  folder?: string;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
}

/**
 * Obsidian WebDAV sync configuration
 */
export interface ObsidianSyncConfig {
  /** Whether Obsidian WebDAV sync is enabled */
  enabled: boolean;
  /** WebDAV URL for Obsidian vault */
  webdavUrl?: string;
  /** WebDAV username */
  username?: string;
  /** WebDAV password (encrypted) */
  password?: string;
  /** Folder within vault */
  folder?: string;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
}

/**
 * Obsidian Local REST API configuration
 */
export interface ObsidianLocalConfig {
  /** Whether Obsidian Local is enabled */
  enabled: boolean;
  /** Local REST API port (default: 27123) */
  port?: number;
  /** API key for REST API */
  apiKey?: string;
  /** Last successful sync timestamp */
  lastSyncAt?: number;
}

/**
 * User display and behavior preferences
 */
export interface UserPreferences {
  /** List view mode */
  listView: 'grid' | 'list';
  /** Number of items per page */
  pageSize: number;
  /** Default sort field */
  sortBy: 'created' | 'updated' | 'used' | 'title';
  /** Default sort order */
  sortOrder: 'asc' | 'desc';
}

/**
 * Application settings
 */
export interface Settings {
  /** UI language code */
  language: string;
  /** UI theme */
  theme: 'auto' | 'light' | 'dark';
  /** Active sync backend */
  syncEngine: SyncBackend;
  /** Chrome sync settings */
  chromeSync?: ChromeSyncConfig;
  /** Gist sync settings */
  gistSync?: GistSyncConfig;
  /** WebDAV sync settings */
  webdavSync?: WebDAVSyncConfig;
  /** Obsidian WebDAV settings */
  obsidianSync?: ObsidianSyncConfig;
  /** Obsidian Local settings */
  obsidianLocal?: ObsidianLocalConfig;
  /** ID of default AI provider */
  defaultProviderId?: string;
  /** Default AI platform for quick open */
  defaultPlatform?: string;
  /** Whether image prompt generation is enabled */
  imagePromptEnabled: boolean;
  /** Default output rules for AI features */
  defaultOutputRules?: OutputRules;
  /** User display preferences */
  preferences: UserPreferences;
}

/**
 * Context snapshot captured from a web page
 */
export interface ContextSnapshot {
  /** Unique identifier */
  id: string;
  /** Page title at capture time */
  pageTitle: string;
  /** Page URL */
  pageUrl: string;
  /** Selected text (if any) */
  selection?: string;
  /** Full page text content (truncated) */
  pageText?: string;
  /** When the snapshot was captured */
  capturedAt: number;
  /** When the snapshot expires (typically 10 min TTL) */
  expiresAt: number;
}

/**
 * Prompt usage history entry
 */
export interface PromptHistory {
  /** Unique identifier */
  id: string;
  /** ID of the prompt used */
  promptId: string;
  /** Content that was sent */
  content: string;
  /** Variable values used */
  variables?: Record<string, string>;
  /** Platform where it was used */
  platform?: string;
  /** When it was used */
  usedAt: number;
  /** Whether insertion succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Video analysis result
 */
export interface VideoAnalysis {
  /** Unique identifier */
  id: string;
  /** Source video URL */
  videoUrl: string;
  /** Video title */
  title: string;
  /** Type of analysis performed */
  type: 'style-transfer' | 'complete-analysis' | 'inspiration';
  /** Extracted style vocabulary */
  styleVocabulary?: {
    terms: Array<{
      term: string;
      definition: string;
      examples: string[];
    }>;
  };
  /** Detailed analysis results */
  analysis?: {
    summary: string;
    style: string;
    storyboard: Array<{
      timestamp: string;
      description: string;
      shot: string;
    }>;
  };
  /** Generated prompt from analysis */
  generatedPrompt?: string;
  /** When analysis was completed */
  analyzedAt: number;
}

/**
 * Complete storage schema for local storage
 * Defines all data stored by the extension
 */
export interface StorageSchema {
  /** All saved prompts */
  prompts: Prompt[];
  /** Application settings */
  settings: Settings;
  /** Configured AI providers */
  providers: AIProvider[];
  /** Custom categories */
  categories: Category[];
  /** Usage history */
  history: PromptHistory[];
  /** Context snapshots */
  snapshots: ContextSnapshot[];
  /** Video analyses */
  'video-analyses': VideoAnalysis[];
  /** Translation cache */
  'cache:translations': Record<string, string>;
  /** AI response cache */
  'cache:ai-responses': Record<string, unknown>;
}

/**
 * Sync payload for cross-device synchronization
 * Contains only the data that should be synced
 */
export interface SyncPayload {
  /** Slim prompts (without local-only data) */
  prompts: Prompt[];
  /** Settings (with sensitive fields stripped) */
  settings: Settings;
  /** Categories */
  categories: Category[];
  /** Schema version for migration */
  version: number;
  /** Export timestamp */
  exportedAt: number;
}

/**
 * Key paths in the storage schema for type-safe access
 */
export type StorageKey = keyof StorageSchema;
