/**
 * @fileoverview VersionManager - Version history system for prompts
 *
 * Manages version history for prompts with the following features:
 * - Auto-create versions when prompt content changes
 * - Maximum 10 versions per prompt (configurable)
 * - Rollback to any previous version
 * - Optional notes for each version
 *
 * Versions are stored locally only (not synced) as part of the Prompt object.
 */

import { PromptStorage } from './core';
import type { PromptVersion } from '../../types';

/** Default maximum number of versions to keep per prompt */
const DEFAULT_MAX_VERSIONS = 10;

/** Storage result type for version operations */
export interface VersionResult<T = unknown> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if failed */
  error?: string;
}

/**
 * VersionManager - Handles all version-related operations for prompts
 *
 * All methods are static for consistency with PromptStorage API.
 * Versions are stored as part of the Prompt object in local storage.
 */
export class VersionManager {
  /**
   * Create a new version for a prompt
   * @param promptId - The ID of the prompt
   * @param content - The content to save in this version
   * @param note - Optional note describing this version
   * @returns Result with the created version or error
   */
  static async createVersion(
    promptId: string,
    content: string,
    note?: string
  ): Promise<VersionResult<PromptVersion>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const version: PromptVersion = {
        id: crypto.randomUUID(),
        content,
        createdAt: Date.now(),
        note,
      };

      const versions = [version, ...(prompt.versions || [])];
      const prunedVersions = versions.slice(0, DEFAULT_MAX_VERSIONS);

      await PromptStorage.update({
        ...prompt,
        versions: prunedVersions,
      });

      return { success: true, data: version };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get all versions for a prompt
   * @param promptId - The ID of the prompt
   * @returns Array of versions (empty if prompt not found or no versions)
   */
  static async getVersions(promptId: string): Promise<PromptVersion[]> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return [];
      }
      return prompt.versions || [];
    } catch (error) {
      console.error(`[VersionManager] Failed to get versions for ${promptId}:`, error);
      return [];
    }
  }

  /**
   * Get a specific version by ID
   * @param promptId - The ID of the prompt
   * @param versionId - The ID of the version to retrieve
   * @returns The version or null if not found
   */
  static async getVersionById(
    promptId: string,
    versionId: string
  ): Promise<PromptVersion | null> {
    try {
      const versions = await this.getVersions(promptId);
      return versions.find((v) => v.id === versionId) || null;
    } catch (error) {
      console.error(
        `[VersionManager] Failed to get version ${versionId} for ${promptId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Rollback a prompt to a specific version
   * Creates a new version with the current content before rolling back
   * @param promptId - The ID of the prompt
   * @param versionId - The ID of the version to rollback to
   * @returns Result with the restored content or error
   */
  static async rollback(
    promptId: string,
    versionId: string
  ): Promise<VersionResult<string>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const targetVersion = await this.getVersionById(promptId, versionId);
      if (!targetVersion) {
        return { success: false, error: 'Version not found' };
      }

      const currentContent = prompt.content || '';

      if (currentContent !== targetVersion.content) {
        await this.createVersion(
          promptId,
          currentContent,
          'Auto-saved before rollback'
        );
      }

      const updatedPrompt = await PromptStorage.getById(promptId);
      if (!updatedPrompt) {
        return { success: false, error: 'Prompt not found after auto-save' };
      }

      await PromptStorage.update({
        ...updatedPrompt,
        content: targetVersion.content,
        updatedAt: Date.now(),
      });

      return { success: true, data: targetVersion.content };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete a specific version
   * @param promptId - The ID of the prompt
   * @param versionId - The ID of the version to delete
   * @returns Result indicating success or failure
   */
  static async deleteVersion(
    promptId: string,
    versionId: string
  ): Promise<VersionResult<void>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const versions = prompt.versions || [];
      const filteredVersions = versions.filter((v) => v.id !== versionId);

      if (filteredVersions.length === versions.length) {
        return { success: false, error: 'Version not found' };
      }

      await PromptStorage.update({
        ...prompt,
        versions: filteredVersions,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Prune versions to keep only the maximum allowed
   * Removes oldest versions first
   * @param promptId - The ID of the prompt
   * @param maxVersions - Maximum number of versions to keep (default: 10)
   * @returns Result with the number of versions removed or error
   */
  static async pruneVersions(
    promptId: string,
    maxVersions: number = DEFAULT_MAX_VERSIONS
  ): Promise<VersionResult<number>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      const versions = prompt.versions || [];
      if (versions.length <= maxVersions) {
        return { success: true, data: 0 };
      }

      // Keep only the most recent versions
      const prunedVersions = versions.slice(0, maxVersions);
      const removedCount = versions.length - prunedVersions.length;

      await PromptStorage.update({
        ...prompt,
        versions: prunedVersions,
      });

      return { success: true, data: removedCount };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Auto-create a version if the content has changed
   * Should be called before updating a prompt's content
   * @param promptId - The ID of the prompt
   * @param newContent - The new content being set
   * @param note - Optional note for the auto-created version
   * @returns Result with the created version (if any) or error
   */
  static async autoCreateVersionIfChanged(
    promptId: string,
    newContent: string,
    note?: string
  ): Promise<VersionResult<PromptVersion | null>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      // Only create version if content has actually changed
      if (prompt.content === newContent) {
        return { success: true, data: null };
      }

      // Create version with current content before it changes
      const result = await this.createVersion(
        promptId,
        prompt.content || '',
        note || 'Auto-saved before edit'
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get version count for a prompt
   * @param promptId - The ID of the prompt
   * @returns Number of versions (0 if prompt not found)
   */
  static async getVersionCount(promptId: string): Promise<number> {
    const versions = await this.getVersions(promptId);
    return versions.length;
  }

  /**
   * Clear all versions for a prompt
   * @param promptId - The ID of the prompt
   * @returns Result indicating success or failure
   */
  static async clearVersions(promptId: string): Promise<VersionResult<void>> {
    try {
      const prompt = await PromptStorage.getById(promptId);
      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      await PromptStorage.update({
        ...prompt,
        versions: [],
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
