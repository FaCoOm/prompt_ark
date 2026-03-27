/**
 * @fileoverview PromptStorage - Main storage class for prompts
 *
 * Implements dual-layer storage architecture:
 * - Local: Full prompt data (versions, usage stats) - source of truth
 * - Sync: Slim prompt data (core fields) - cross-device sync
 *
 * Local is always guaranteed. Sync is best-effort (never throws).
 */

import { LocalStorage } from './local';
import { SyncStorage } from './sync';
import { STORAGE_KEYS, SYNC_FIELDS } from './types';
import type { Prompt, SlimPrompt } from '../../types';

const { LOCAL_PROMPTS, PROMPT_INDEX, PROMPT_PREFIX } = STORAGE_KEYS;

/**
 * Convert a full prompt to a slim prompt for sync
 * Removes local-only fields (versions, usage stats)
 */
function toSlimPrompt(prompt: Prompt): SlimPrompt {
  const slim: Partial<SlimPrompt> = {};
  for (const field of SYNC_FIELDS) {
    const value = prompt[field as keyof Prompt];
    if (value !== undefined) {
      (slim as Record<string, unknown>)[field] = value;
    }
  }
  return slim as SlimPrompt;
}

/**
 * Merge a slim prompt with local-only fields
 */
function mergeWithLocal(
  slim: SlimPrompt,
  local: Prompt | undefined
): Prompt {
  if (!local) {
    return {
      ...slim,
      isFavorite: slim.favorite ?? false,
      tags: slim.tags || [],
      shortcut: slim.shortcut || '',
      versions: [],
      useCount: 0,
    } as Prompt;
  }

  return {
    ...local,
    ...slim,
    versions: local.versions || [],
    useCount: local.useCount || 0,
    lastUsedAt: local.lastUsedAt,
  };
}

/**
 * Main storage class for prompts
 * Provides full CRUD operations with dual-layer storage
 */
export class PromptStorage {
  /**
   * Get all prompts from storage
   * Merges sync (slim) + local (full) data
   */
  static async get(): Promise<Prompt[]> {
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];

    // Try to get sync data for merge
    const syncIds = await SyncStorage.get<string[]>(PROMPT_INDEX);
    if (!syncIds || syncIds.length === 0) {
      return locals;
    }

    const localMap = new Map(locals.map((p) => [p.id, p]));
    const merged: Prompt[] = [];
    const seenIds = new Set<string>();

    for (const id of syncIds) {
      seenIds.add(id);
      const slim = await SyncStorage.get<SlimPrompt>(`${PROMPT_PREFIX}${id}`);
      if (slim) {
        merged.push(mergeWithLocal(slim, localMap.get(id)));
      } else if (localMap.has(id)) {
        // Sync missing - use local
        merged.push(localMap.get(id)!);
      }
    }

    // Include local-only prompts
    for (const local of locals) {
      if (!seenIds.has(local.id)) {
        merged.push(local);
      }
    }

    return merged;
  }

  /**
   * Get a single prompt by ID
   * Fast path: local-only lookup
   */
  static async getById(id: string): Promise<Prompt | null> {
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];
    return locals.find((p) => p.id === id) || null;
  }

  /**
   * Save a new prompt
   * Local write is guaranteed; sync is best-effort
   */
  static async save(prompt: Prompt): Promise<void> {
    // Local first (guaranteed)
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];
    locals.push(prompt);
    await LocalStorage.set(LOCAL_PROMPTS, locals);

    // Sync: best-effort
    try {
      // Update index
      const index = (await SyncStorage.get<string[]>(PROMPT_INDEX)) || [];
      if (!index.includes(prompt.id)) {
        index.push(prompt.id);
        await SyncStorage.set(PROMPT_INDEX, index);
      }

      // Save slim version
      const slim = toSlimPrompt(prompt);
      await SyncStorage.set(`${PROMPT_PREFIX}${prompt.id}`, slim);
    } catch (error) {
      console.warn(
        `[PromptStorage] Sync save failed for ${prompt.id}, data safe in local:`,
        error
      );
    }
  }

  /**
   * Update an existing prompt
   * Local write is guaranteed; sync is best-effort
   */
  static async update(prompt: Prompt): Promise<void> {
    // Local first (guaranteed)
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];
    const idx = locals.findIndex((p) => p.id === prompt.id);

    if (idx >= 0) {
      locals[idx] = prompt;
    } else {
      locals.push(prompt);
    }

    await LocalStorage.set(LOCAL_PROMPTS, locals);

    // Sync: best-effort
    try {
      const slim = toSlimPrompt(prompt);
      await SyncStorage.set(`${PROMPT_PREFIX}${prompt.id}`, slim);
    } catch (error) {
      console.warn(
        `[PromptStorage] Sync update failed for ${prompt.id}:`,
        error
      );
    }
  }

  /**
   * Delete a prompt
   * Local write is guaranteed; sync is best-effort
   */
  static async delete(id: string): Promise<void> {
    // Local first (guaranteed)
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];
    await LocalStorage.set(
      LOCAL_PROMPTS,
      locals.filter((p) => p.id !== id)
    );

    // Sync: best-effort
    try {
      const index = (await SyncStorage.get<string[]>(PROMPT_INDEX)) || [];
      const newIndex = index.filter((i) => i !== id);
      if (newIndex.length !== index.length) {
        await SyncStorage.set(PROMPT_INDEX, newIndex);
      }
      await SyncStorage.remove(`${PROMPT_PREFIX}${id}`);
    } catch (error) {
      console.warn(`[PromptStorage] Sync delete failed for ${id}:`, error);
    }
  }

  /**
   * Search prompts by query
   * Searches title, content, category, and tags
   */
  static async search(query: string): Promise<Prompt[]> {
    const prompts = await this.get();
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      return prompts;
    }

    return prompts.filter((p) => {
      const searchable = [
        p.title,
        p.content,
        p.category,
        ...(p.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(lowerQuery);
    });
  }

  /**
   * Bulk set all prompts (for import/migration)
 * Replaces all existing prompts
   */
  static async bulkSet(prompts: Prompt[]): Promise<void> {
    // Local first (guaranteed)
    await LocalStorage.set(LOCAL_PROMPTS, prompts);

    // Sync: best-effort
    try {
      const ids = prompts.map((p) => p.id);
      await SyncStorage.set(PROMPT_INDEX, ids);

      for (const prompt of prompts) {
        const slim = toSlimPrompt(prompt);
        await SyncStorage.set(`${PROMPT_PREFIX}${prompt.id}`, slim);
      }
    } catch (error) {
      console.warn(
        `[PromptStorage] Sync bulkSet failed for ${prompts.length} prompts:`,
        error
      );
    }
  }

  /**
   * Clear all prompts (use with caution)
   */
  static async clear(): Promise<void> {
    // Local first (guaranteed)
    await LocalStorage.set(LOCAL_PROMPTS, []);

    // Sync: best-effort
    try {
      await SyncStorage.set(PROMPT_INDEX, []);
      // Note: Individual prompt sync entries are not cleared here
      // They will be cleaned up on next sync or can be garbage collected
    } catch (error) {
      console.warn('[PromptStorage] Sync clear failed:', error);
    }
  }

  /**
   * Get storage statistics
   */
  static async stats(): Promise<{
    count: number;
    localCount: number;
    syncCount: number;
  }> {
    const locals = (await LocalStorage.get<Prompt[]>(LOCAL_PROMPTS)) || [];
    const syncIds = (await SyncStorage.get<string[]>(PROMPT_INDEX)) || [];

    return {
      count: locals.length,
      localCount: locals.length,
      syncCount: syncIds.length,
    };
  }
}
