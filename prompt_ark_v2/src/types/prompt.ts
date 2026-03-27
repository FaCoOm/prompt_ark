/**
 * @fileoverview Prompt type definitions for Prompt Ark v2
 * 
 * Based on v1 data structures from lib/storage.js
 * Contains core prompt types: Prompt, PromptVersion, Category, Tag
 */

import type { VariableDefinition } from './variables';

/**
 * Type of prompt source - how the prompt was created
 */
export type PromptSourceType = 'manual' | 'smart-convert' | 'import' | 'shared';

/**
 * Source information for a prompt
 */
export interface PromptSource {
  /** How the prompt was created */
  type: PromptSourceType;
  /** Original URL if imported from web */
  url?: string;
  /** Original title if imported */
  title?: string;
}

/**
 * Represents a single version of a prompt's content
 * Versions are stored locally only (not synced)
 */
export interface PromptVersion {
  /** Unique identifier for this version */
  id: string;
  /** The prompt content at this version */
  content: string;
  /** Timestamp when this version was created (ms since epoch) */
  createdAt: number;
  /** Optional note describing this version */
  note?: string;
}

/**
 * Core Prompt type - represents a reusable AI prompt
 * 
 * Sync fields (cross-device): id, title, content, category, tags, shortcut, 
 *                              variables, favorite, createdAt, updatedAt
 * Local-only fields: versions, usageCount, lastUsedAt
 */
export interface Prompt {
  /** Unique identifier (UUID) */
  id: string;
  /** Display title of the prompt */
  title?: string;
  /** The actual prompt content (may contain {{variables}}) */
  content?: string;
  /** Category name for organization */
  category?: string;
  /** Array of tag names for filtering */
  tags: string[];
  /** Shortcut keyword for slash expansion (e.g., "email") */
  shortcut: string;
  /** Variable definitions extracted from content */
  variables?: VariableDefinition[];
  /** Whether the prompt is marked as favorite (v1 field) - use isFavorite for v2 */
  favorite?: boolean;
  /** Whether the prompt is marked as favorite (v2 field) */
  isFavorite: boolean;
  /** Timestamp when the prompt was created (ms since epoch) */
  createdAt: number;
  /** Timestamp when the prompt was last modified (ms since epoch) */
  updatedAt: number;
  /** Version history - local only, not synced */
  versions: PromptVersion[];
  /** Number of times the prompt has been used - local only */
  useCount: number;
  /** Timestamp of last usage, null if never used - local only */
  lastUsedAt?: number | null;
  /** Source information about how the prompt was created */
  source?: PromptSource;
  /** Context variable names used in this prompt (e.g., ['@page_title']) */
  contextVars?: string[];
  /** Language code for the prompt content */
  language?: string;
}

/**
 * Data Transfer Object for creating a new prompt
 * All fields except content are optional with sensible defaults
 */
export interface CreatePromptDTO {
  /** The prompt content (required) */
  content: string;
  /** Display title - will be auto-generated if not provided */
  title?: string;
  /** Category name - will be auto-generated if not provided */
  category?: string;
  /** Tag names for filtering */
  tags?: string[];
  /** Shortcut keyword for slash expansion */
  shortcut?: string;
  /** Source information */
  source?: PromptSource;
  /** Language code */
  language?: string;
}

/**
 * Data Transfer Object for updating an existing prompt
 * All fields are optional - only provided fields will be updated
 */
export interface UpdatePromptDTO {
  /** New display title */
  title?: string;
  /** New content */
  content?: string;
  /** New category */
  category?: string;
  /** New tags (replaces existing) */
  tags?: string[];
  /** New shortcut */
  shortcut?: string;
  /** Update favorite status */
  favorite?: boolean;
  isFavorite?: boolean;
  /** New version note if creating a version */
  versionNote?: string;
}

/**
 * Category for organizing prompts
 * Categories are user-defined or system-provided
 */
export interface Category {
  /** Internal name (used as identifier) */
  name: string;
  /** Display name shown in UI */
  displayName: string;
  /** Sort order for display */
  order: number;
  /** Icon identifier (e.g., Lucide icon name) */
  icon?: string;
  /** Color theme for the category */
  color?: string;
  /** Whether this is a built-in system category */
  isSystem: boolean;
  /** Timestamp when created */
  createdAt: number;
}

/**
 * Tag for labeling and filtering prompts
 * Tags are simple strings attached to prompts
 */
export interface Tag {
  /** The tag name (unique identifier) */
  name: string;
  /** Number of prompts using this tag */
  count: number;
  /** Timestamp when first used */
  createdAt: number;
}

/**
 * Slim/Minimal prompt structure used for sync operations
 * Contains only the fields that are synced cross-device
 * Excludes local-only data like versions and usage stats
 */
export interface SlimPrompt {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Prompt content */
  content: string;
  /** Category name */
  category: string;
  /** Tag names */
  tags: string[];
  /** Shortcut keyword */
  shortcut: string;
  /** Variable definitions */
  variables: VariableDefinition[];
  /** Favorite status */
  favorite: boolean;
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Filter options for querying prompts
 */
export interface PromptFilter {
  /** Filter by category name */
  category?: string;
  /** Filter by tags (must have all specified) */
  tags?: string[];
  /** Filter by favorite status */
  isFavorite?: boolean;
  /** Full-text search query */
  search?: string;
}

/**
 * Sort options for prompt lists
 */
export type SortBy = 'created' | 'updated' | 'used' | 'title';

/**
 * Sort order direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort configuration for prompt queries
 */
export interface PromptSort {
  /** Field to sort by */
  by: SortBy;
  /** Sort direction */
  order: SortOrder;
}

/**
 * View mode for prompt list display
 */
export type ListView = 'grid' | 'list';

/**
 * Paginated result wrapper for list queries
 */
export interface PaginatedResult<T> {
  /** Items in the current page */
  items: T[];
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
}
