import { storage } from 'wxt/storage';
import type {
  Prompt,
  Settings,
  AIProvider,
  Category,
  PromptHistory,
  ContextSnapshot,
} from '@types';

const syncStorage = storage.defineItem<unknown>('local:@@sync_fallback');

export class PromptStorage {
  static async getPrompts(): Promise<Prompt[]> {
    return (await storage.getItem('sync:prompts')) ?? [];
  }

  static async getPromptById(id: string): Promise<Prompt | null> {
    const prompts = await this.getPrompts();
    return prompts.find((p) => p.id === id) ?? null;
  }

  static async savePrompt(prompt: Prompt): Promise<void> {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex((p) => p.id === prompt.id);
    if (index >= 0) {
      prompts[index] = prompt;
    } else {
      prompts.push(prompt);
    }
    await storage.setItem('sync:prompts', prompts);
  }

  static async deletePrompt(id: string): Promise<void> {
    const prompts = await this.getPrompts();
    const filtered = prompts.filter((p) => p.id !== id);
    await storage.setItem('sync:prompts', filtered);
  }

  static async importPrompts(prompts: Prompt[]): Promise<void> {
    const existing = await this.getPrompts();
    const merged = [...existing, ...prompts];
    await storage.setItem('sync:prompts', merged);
  }

  static async exportPrompts(): Promise<Prompt[]> {
    return this.getPrompts();
  }
}

export class SettingsStorage {
  static async getSettings(): Promise<Settings> {
    const defaults: Settings = {
      language: 'zh-CN',
      theme: 'auto',
      syncEngine: 'chrome',
      imagePromptEnabled: false,
      preferences: {
        listView: 'grid',
        pageSize: 20,
        sortBy: 'updated',
        sortOrder: 'desc',
      },
    };
    const stored = await storage.getItem('sync:settings');
    return { ...defaults, ...(stored as Settings) };
  }

  static async saveSettings(settings: Settings): Promise<void> {
    await storage.setItem('sync:settings', settings);
  }
}

export class ProviderStorage {
  static async getProviders(): Promise<AIProvider[]> {
    return (await storage.getItem('sync:providers')) ?? [];
  }

  static async saveProvider(provider: AIProvider): Promise<void> {
    const providers = await this.getProviders();
    const index = providers.findIndex((p) => p.id === provider.id);
    if (index >= 0) {
      providers[index] = provider;
    } else {
      providers.push(provider);
    }
    await storage.setItem('sync:providers', providers);
  }

  static async deleteProvider(id: string): Promise<void> {
    const providers = await this.getProviders();
    const filtered = providers.filter((p) => p.id !== id);
    await storage.setItem('sync:providers', filtered);
  }
}

export class CategoryStorage {
  static async getCategories(): Promise<Category[]> {
    return (await storage.getItem('sync:categories')) ?? [];
  }

  static async saveCategory(category: Category): Promise<void> {
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.name === category.name);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    await storage.setItem('sync:categories', categories);
  }

  static async deleteCategory(name: string): Promise<void> {
    const categories = await this.getCategories();
    const filtered = categories.filter((c) => c.name !== name);
    await storage.setItem('sync:categories', filtered);
  }
}

export class HistoryStorage {
  static async getHistory(limit = 100): Promise<PromptHistory[]> {
    const history = (await storage.getItem('local:history')) ?? [];
    return (history as PromptHistory[]).slice(0, limit);
  }

  static async addHistory(entry: PromptHistory): Promise<void> {
    const history = await this.getHistory(1000);
    history.unshift(entry);
    await storage.setItem('local:history', history.slice(0, 100));
  }
}

export class ContextStorage {
  static async getLatestContext(): Promise<ContextSnapshot | null> {
    const snapshots =
      (await storage.getItem('local:snapshots')) ?? [];
    const sorted = (snapshots as ContextSnapshot[]).sort(
      (a, b) => b.capturedAt - a.capturedAt
    );
    const latest = sorted[0];
    if (latest && latest.expiresAt > Date.now()) {
      return latest;
    }
    return null;
  }

  static async saveContext(
    context: ContextSnapshot
  ): Promise<void> {
    const snapshots =
      (await storage.getItem<ContextSnapshot[]>('local:snapshots')) ?? [];
    snapshots.push(context);
    const valid = (snapshots as ContextSnapshot[]).filter(
      (s) => s.expiresAt > Date.now()
    );
    await storage.setItem('local:snapshots', valid);
  }
}

export {
  storage as wxtStorage,
  syncStorage,
};
