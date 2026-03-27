import { browser } from 'wxt/browser';
import { ChromeSyncAdapter } from './chrome';
import { GistSyncAdapter, createGistAdapter } from './gist';
import { createWebDAVAdapter } from './webdav';
import type {
  SyncBackend,
  SyncStatus,
  SyncResult,
  SyncPayload,
  SyncConfig,
  Prompt,
  GistSyncConfig,
  WebDAVSyncConfig,
} from '../../types';
import type {
  SyncServiceAdapter,
  SyncOptions,
  MergeStrategy,
} from './types';

export { ChromeSyncAdapter } from './chrome';
export { GistSyncAdapter, createGistAdapter } from './gist';
export { WebDAVSyncAdapter, createWebDAVAdapter } from './webdav';
export type {
  SyncServiceAdapter,
  SyncServiceConfig,
  SyncOptions,
  MergeStrategy,
  SyncServiceError,
  CompressionResult,
  PromptMergeResult,
  ChromeQuotaInfo,
  GistApiResponse,
  WebDAVFileList,
  ObsidianVaultPrompt,
} from './types';

const DEBOUNCE_MS = 2000;

class SyncManagerClass {
  private backend: SyncBackend = 'none';
  private adapter: SyncServiceAdapter | null = null;
  private configPromise: Promise<void> | null = null;

  private gistId = '';
  private token = '';
  private url = '';
  private username = '';
  private password = '';

  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  async loadConfig(): Promise<void> {
    if (typeof browser === 'undefined' || !browser.storage?.local) {
      return;
    }

    try {
      const local = await browser.storage.local.get([
        'sync_backend',
        'gist_id',
        'githubToken',
        'webdavUrl',
        'webdavUser',
        'webdavPassword',
      ]);

      this.backend = (local.sync_backend as SyncBackend) || 'none';
      this.gistId = (local.gist_id as string) || '';
      this.token = (local.githubToken as string) || '';
      this.url = (local.webdavUrl as string) || '';
      this.username = (local.webdavUser as string) || '';
      this.password = (local.webdavPassword as string) || '';

      this.createAdapter();
    } catch (e) {
      console.error('[SyncManager] Failed to load config:', e);
    }
  }

  async ready(): Promise<void> {
    if (this.configPromise) {
      await this.configPromise;
    }
  }

  private createAdapter(): void {
    switch (this.backend) {
      case 'chrome':
        this.adapter = new ChromeSyncAdapter();
        break;
      case 'gist':
        this.adapter = createGistAdapter({
          enabled: true,
          gistId: this.gistId,
          token: this.token,
        } as GistSyncConfig);
        break;
      case 'webdav':
        this.adapter = createWebDAVAdapter({
          enabled: true,
          url: this.url,
          username: this.username,
          password: this.password,
        } as WebDAVSyncConfig);
        break;
      default:
        this.adapter = null;
    }
  }

  setBackend(backend: SyncBackend, config?: Partial<SyncConfig>): void {
    this.backend = backend;

    if (config) {
      if (config.gistId) this.gistId = config.gistId;
      if (config.gistToken) this.token = config.gistToken;
      if (config.webdavUrl) this.url = config.webdavUrl;
      if (config.webdavUsername) this.username = config.webdavUsername;
      if (config.webdavPassword) this.password = config.webdavPassword;
    }

    this.createAdapter();
    this.saveConfig();
  }

  getBackend(): SyncBackend {
    return this.backend;
  }

  getAdapter(): SyncServiceAdapter | null {
    return this.adapter;
  }

  private async saveConfig(): Promise<void> {
    if (typeof browser === 'undefined' || !browser.storage?.local) return;

    await browser.storage.local.set({
      sync_backend: this.backend,
      gist_id: this.gistId,
      githubToken: this.token,
      webdavUrl: this.url,
      webdavUser: this.username,
      webdavPassword: this.password,
    });
  }

  async updateSyncStatus(state: SyncStatus['state']): Promise<void> {
    const status: SyncStatus = {
      state,
      backend: this.backend,
      lastSyncTime: state === 'synced' ? Date.now() : undefined,
    };

    try {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        await browser.storage.local.set({ syncStatus: status });
      }

      if (typeof browser !== 'undefined' && browser.runtime?.sendMessage) {
        browser.runtime
          .sendMessage({ type: 'SYNC_STATUS_CHANGED', status })
          .catch(() => {});
      }
    } catch {
      // Ignore
    }
  }

  async sync(payload: SyncPayload, _options?: SyncOptions): Promise<SyncResult> {
    if (!this.adapter) {
      return {
        success: false,
        action: 'none',
        error: 'No sync backend configured',
        errorCode: 'SYNC_NOT_ENABLED',
      };
    }

    await this.updateSyncStatus('syncing');

    try {
      const result = await this.adapter.push(payload);
      await this.updateSyncStatus(result.success ? 'synced' : 'failed');
      return result;
    } catch (e) {
      await this.updateSyncStatus('failed');
      return {
        success: false,
        action: 'none',
        error: (e as Error).message,
        errorCode: 'SYNC_NETWORK_ERROR',
      };
    }
  }

  async pull(): Promise<SyncResult> {
    if (!this.adapter) {
      return {
        success: false,
        action: 'none',
        error: 'No sync backend configured',
        errorCode: 'SYNC_NOT_ENABLED',
      };
    }

    await this.updateSyncStatus('syncing');

    try {
      const result = await this.adapter.pull();
      await this.updateSyncStatus(result.success ? 'synced' : 'failed');
      return result;
    } catch (e) {
      await this.updateSyncStatus('failed');
      return {
        success: false,
        action: 'none',
        error: (e as Error).message,
        errorCode: 'SYNC_NETWORK_ERROR',
      };
    }
  }

  async pullAndMerge(localPrompts: Prompt[]): Promise<{
    prompts: Prompt[];
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const result = await this.pull();

    if (!result.success) {
      return {
        success: false,
        prompts: localPrompts,
        error: result.error,
      };
    }

    if (!result.data || !result.data.prompts) {
      return {
        success: true,
        prompts: localPrompts,
        message: 'No remote data to merge',
      };
    }

    const merged = await this.mergePrompts(result.data.prompts, localPrompts);

    return {
      success: true,
      prompts: merged,
      message: 'Sync completed successfully',
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.adapter) {
      return { success: false, error: 'No sync backend configured' };
    }
    return this.adapter.testConnection();
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.adapter) {
      return {
        state: 'idle',
        backend: 'none',
      };
    }
    return this.adapter.getStatus();
  }

  private debounce<T extends unknown[]>(
    key: string,
    fn: (...args: T) => Promise<void>,
    ms = DEBOUNCE_MS
  ): (...args: T) => Promise<void> {
    return async (...args: T) => {
      const existing = this.debounceTimers.get(key);
      if (existing) {
        clearTimeout(existing);
      }

      return new Promise((resolve, reject) => {
        const timer = setTimeout(async () => {
          try {
            await fn(...args);
            resolve();
          } catch (e) {
            reject(e);
          } finally {
            this.debounceTimers.delete(key);
          }
        }, ms);

        this.debounceTimers.set(key, timer);
      });
    };
  }

  async triggerSync(payload: SyncPayload): Promise<SyncResult> {
    const debouncedFn = this.debounce('sync', async (p: SyncPayload) => {
      await this.sync(p);
    });

    await debouncedFn(payload);

    return {
      success: true,
      action: 'pushed',
    };
  }

  private async mergePrompts(
    syncPrompts: Prompt[],
    localPrompts: Prompt[],
    strategy: MergeStrategy = 'newest-wins'
  ): Promise<Prompt[]> {
    const localMap = new Map(localPrompts.map((p) => [p.id, p]));
    const merged: Prompt[] = [];

    for (const sp of syncPrompts) {
      const local = localMap.get(sp.id);

      if (!local) {
        merged.push(sp);
      } else {
        switch (strategy) {
          case 'remote-wins':
            merged.push({
              ...sp,
              versions: local.versions || [],
              useCount: local.useCount || 0,
              lastUsedAt: local.lastUsedAt || null,
            });
            break;
          case 'local-wins':
            merged.push(local);
            break;
          case 'newest-wins':
            if ((sp.updatedAt || 0) > (local.updatedAt || 0)) {
              merged.push({
                ...sp,
                versions: local.versions || [],
                useCount: local.useCount || 0,
                lastUsedAt: local.lastUsedAt || null,
              });
            } else {
              merged.push(local);
            }
            break;
          default:
            merged.push({
              ...sp,
              versions: local.versions || [],
              useCount: local.useCount || 0,
              lastUsedAt: local.lastUsedAt || null,
            });
        }
        localMap.delete(sp.id);
      }
    }

    for (const local of Array.from(localMap.values())) {
      merged.push(local);
    }

    return merged;
  }

  getGistId(): string {
    return this.gistId;
  }

  async setGistId(gistId: string): Promise<void> {
    this.gistId = gistId;
    await this.saveConfig();

    if (this.backend === 'gist' && this.adapter instanceof GistSyncAdapter) {
      this.adapter.setGistId(gistId);
    }
  }

  isConfigured(): boolean {
    if (!this.adapter) return false;
    return this.adapter.isConfigured();
  }
}

export const SyncManager = new SyncManagerClass();

SyncManager['loadConfig']();

export function toSlimPrompt(prompt: Prompt): {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  shortcut: string;
  variables: unknown[];
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
} {
  return {
    id: prompt.id,
    title: prompt.title || '',
    content: prompt.content || '',
    category: prompt.category || '',
    tags: prompt.tags || [],
    shortcut: prompt.shortcut || '',
    variables: (prompt.variables || []) as unknown[],
    favorite: prompt.isFavorite || prompt.favorite || false,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };
}

export function mergePrompts(
  syncPrompts: Prompt[],
  localPrompts: Prompt[]
): Prompt[] {
  if (!syncPrompts || syncPrompts.length === 0) return localPrompts || [];
  if (!localPrompts || localPrompts.length === 0) return syncPrompts;

  const localMap = new Map(localPrompts.map((p) => [p.id, p]));
  const merged: Prompt[] = [];

  for (const sp of syncPrompts) {
    const local = localMap.get(sp.id);
    if (local) {
      merged.push({
        ...sp,
        versions: local.versions || [],
        useCount: local.useCount || 0,
        lastUsedAt: local.lastUsedAt || null,
      });
      localMap.delete(sp.id);
    } else {
      merged.push({
        ...sp,
        versions: [],
        useCount: 0,
        lastUsedAt: null,
      });
    }
  }

  for (const local of Array.from(localMap.values())) {
    merged.push(local);
  }

  return merged;
}
