import type { Prompt, Settings } from '../types';
import { PromptStorage, SettingsStorage } from './storage';

export interface V1Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  shortcut: string;
  createdAt: number;
  updatedAt: number;
  useCount: number;
  isFavorite: boolean;
}

export interface V1Settings {
  language?: string;
  theme?: string;
  syncEngine?: string;
  [key: string]: unknown;
}

export interface MigrationResult {
  success: boolean;
  migratedPrompts: number;
  errors: string[];
  backupCreated: boolean;
}

export class DataMigrator {
  static readonly V1_STORAGE_KEY = 'prompts:v1-backup';
  static readonly MIGRATION_VERSION_KEY = 'migration:version';

  static async detectV1Data(): Promise<{ hasPrompts: boolean; hasSettings: boolean }> {
    const allKeys = await chrome.storage.sync.get(null);
    const hasPrompts = Array.isArray(allKeys['prompts']);
    const hasSettings = typeof allKeys['settings'] === 'object' && allKeys['settings'] !== null;
    return { hasPrompts, hasSettings };
  }

  static async migrateV1ToV2(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedPrompts: 0,
      errors: [],
      backupCreated: false,
    };

    try {
      const v1Data = await chrome.storage.sync.get(['prompts', 'settings']);

      if (v1Data['prompts']) {
        await this.createBackup(v1Data);
        result.backupCreated = true;

        const v1Prompts = v1Data['prompts'] as V1Prompt[];
        const migratedPrompts = v1Prompts.map((p) => this.migratePrompt(p));

        for (const prompt of migratedPrompts) {
          try {
            await PromptStorage.savePrompt(prompt);
            result.migratedPrompts++;
          } catch (error) {
            result.errors.push(`Failed to migrate prompt ${prompt.id}: ${error}`);
          }
        }
      }

      if (v1Data['settings']) {
        const v1Settings = v1Data['settings'] as V1Settings;
        const migratedSettings = this.migrateSettings(v1Settings);
        await SettingsStorage.saveSettings(migratedSettings);
      }

      await chrome.storage.local.set({ [this.MIGRATION_VERSION_KEY]: 2 });
      result.success = true;
    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
    }

    return result;
  }

  static migratePrompt(v1: V1Prompt): Prompt {
    return {
      id: v1.id,
      title: v1.title,
      content: v1.content,
      category: v1.category || 'General',
      tags: v1.tags ? v1.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      shortcut: v1.shortcut || '',
      createdAt: v1.createdAt || Date.now(),
      updatedAt: v1.updatedAt || Date.now(),
      useCount: v1.useCount || 0,
      isFavorite: v1.isFavorite || false,
      language: this.detectLanguage(v1.content),
      source: { type: 'manual' },
      versions: [],
    };
  }

  static migrateSettings(v1: V1Settings): Settings {
    const language = v1.language || 'zh-CN';
    const theme = v1.theme || 'auto';
    const syncEngine = v1.syncEngine || 'chrome';

    const validLanguages = ['zh-CN', 'en', 'ja', 'ko', 'es', 'fr', 'de'] as const;
    const validThemes = ['auto', 'light', 'dark'] as const;
    const validSyncEngines = ['none', 'chrome', 'gist', 'webdav', 'obsidian', 'obsidian-local'] as const;

    return {
      language: validLanguages.includes(language as typeof validLanguages[number]) ? (language as Settings['language']) : 'zh-CN',
      theme: validThemes.includes(theme as typeof validThemes[number]) ? (theme as Settings['theme']) : 'auto',
      syncEngine: validSyncEngines.includes(syncEngine as typeof validSyncEngines[number]) ? (syncEngine as Settings['syncEngine']) : 'chrome',
      imagePromptEnabled: false,
      preferences: {
        listView: 'grid',
        pageSize: 20,
        sortBy: 'updated',
        sortOrder: 'desc',
      },
    };
  }

  static async createBackup(data: Record<string, unknown>): Promise<void> {
    await chrome.storage.local.set({
      [this.V1_STORAGE_KEY]: data,
      [`${this.V1_STORAGE_KEY}:timestamp`]: Date.now(),
    });
  }

  static async restoreFromBackup(): Promise<boolean> {
    const backup = await chrome.storage.local.get(this.V1_STORAGE_KEY);
    if (backup[this.V1_STORAGE_KEY]) {
      await chrome.storage.sync.set(backup[this.V1_STORAGE_KEY]);
      return true;
    }
    return false;
  }

  static async exportToJSON(): Promise<string> {
    const prompts = await PromptStorage.getPrompts();
    const settings = await SettingsStorage.getSettings();

    const exportData = {
      version: 2,
      exportedAt: Date.now(),
      prompts,
      settings,
    };

    return JSON.stringify(exportData, null, 2);
  }

  static async importFromJSON(json: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const result = { success: false, imported: 0, errors: [] as string[] };

    try {
      const data = JSON.parse(json);

      if (!data.prompts || !Array.isArray(data.prompts)) {
        result.errors.push('Invalid format: prompts array missing');
        return result;
      }

      for (const prompt of data.prompts as Prompt[]) {
        try {
          if (this.validatePrompt(prompt)) {
            await PromptStorage.savePrompt(prompt);
            result.imported++;
          } else {
            result.errors.push(`Invalid prompt data: ${prompt.id || 'unknown'}`);
          }
        } catch (error) {
          result.errors.push(`Failed to import prompt: ${error}`);
        }
      }

      if (data.settings) {
        await SettingsStorage.saveSettings(data.settings as Settings);
      }

      result.success = true;
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  static validatePrompt(prompt: Prompt): boolean {
    return (
      typeof prompt.id === 'string' &&
      typeof prompt.title === 'string' &&
      typeof prompt.content === 'string' &&
      prompt.title.length > 0 &&
      prompt.content.length > 0
    );
  }

  private static detectLanguage(content: string): string {
    const charCode = content.charCodeAt(0);
    if (charCode >= 0x4e00 && charCode <= 0x9fff) {
      return 'zh-CN';
    }
    return 'en';
  }
}
