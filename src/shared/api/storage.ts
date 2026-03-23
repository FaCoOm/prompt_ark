import type { Prompt } from '../types/prompt';

const SYNC_FIELDS: (keyof Prompt)[] = [
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
];

function toSlimPrompt(prompt: Prompt): Partial<Prompt> {
  const slim: Partial<Prompt> = {};
  SYNC_FIELDS.forEach(field => {
    (slim as Record<string, unknown>)[field] = prompt[field];
  });
  return slim;
}

export interface StorageAdapter<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  remove(): Promise<void>;
}

export const PromptStorage = {
  async get(): Promise<Prompt[]> {
    const result = await chrome.storage.local.get('prompts');
    return result['prompts'] || [];
  },

  async set(prompts: Prompt[]): Promise<void> {
    await chrome.storage.local.set({ prompts });
  },

  async save(prompt: Prompt): Promise<void> {
    const prompts = await this.get();
    const existingIndex = prompts.findIndex(p => p.id === prompt.id);
    if (existingIndex >= 0) {
      prompts[existingIndex] = prompt;
    } else {
      prompts.push(prompt);
    }
    await this.set(prompts);
  },

  async update(prompt: Prompt): Promise<void> {
    await this.save(prompt);
  },

  async delete(id: string): Promise<void> {
    const prompts = await this.get();
    const filtered = prompts.filter(p => p.id !== id);
    await this.set(filtered);
  },

  async bulkSet(prompts: Prompt[]): Promise<void> {
    await this.set(prompts);
  },
};

export const LocalStorage = {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};

export const SyncStorage = {
  async getUsage(): Promise<{ used: number; total: number; percentage: number }> {
    try {
      const result = await chrome.storage.sync.get(null);
      const json = JSON.stringify(result);
      const used = new Blob([json]).size;
      const total = 102400;
      return {
        used,
        total,
        percentage: Math.round((used / total) * 100),
      };
    } catch {
      return { used: 0, total: 102400, percentage: 0 };
    }
  },
};

export async function migrateLocalToSync(): Promise<void> {
  const local = await chrome.storage.local.get('prompts');
  if (local['prompts']) {
    const syncPrompts = (local['prompts'] as Prompt[]).map((p: Prompt) => toSlimPrompt(p));
    await chrome.storage.sync.set({ prompts: syncPrompts });
  }
}
