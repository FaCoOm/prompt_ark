import { compress, decompress } from '../../utils/compression';
import type {
  Prompt,
  SlimPrompt,
  SyncResult,
  SyncStatus,
  SyncPayload,
  GistSyncConfig,
} from '../../types';
import type { SyncServiceAdapter, GistApiResponse } from './types';

const GIST_FILENAME = 'prompt_ark_sync.json';
const GIST_DESCRIPTION = 'Prompt Ark Sync Data';

function compressForSync(jsonStr: string): string {
  const compressed = compress(jsonStr);
  return 'lz::' + compressed;
}

function decompressFromSync(str: string): string {
  if (typeof str === 'string' && str.startsWith('lz::')) {
    const decompressed = decompress(str.slice(4));
    return decompressed || str.slice(4);
  }
  return str;
}

function toSlimPrompt(prompt: Prompt): SlimPrompt {
  return {
    id: prompt.id,
    title: prompt.title || '',
    content: prompt.content || '',
    category: prompt.category || '',
    tags: prompt.tags || [],
    shortcut: prompt.shortcut || '',
    variables: prompt.variables || [],
    favorite: prompt.isFavorite || prompt.favorite || false,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  };
}

function mergePrompts(syncPrompts: SlimPrompt[], localPrompts: Prompt[]): Prompt[] {
  if (!syncPrompts || syncPrompts.length === 0) return localPrompts || [];
  if (!localPrompts || localPrompts.length === 0) {
    return syncPrompts.map((sp) => ({
      ...sp,
      versions: [],
      useCount: 0,
      lastUsedAt: null,
      isFavorite: sp.favorite || false,
    }));
  }

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
        isFavorite: sp.favorite || local.isFavorite,
      });
      localMap.delete(sp.id);
    } else {
      merged.push({
        ...sp,
        versions: [],
        useCount: 0,
        lastUsedAt: null,
        isFavorite: sp.favorite || false,
      });
    }
  }

  for (const local of Array.from(localMap.values())) {
    merged.push(local);
  }

  return merged;
}

export class GistSyncAdapter implements SyncServiceAdapter {
  readonly name = 'gist' as const;
  readonly displayName = 'GitHub Gist';

  private token: string;
  private gistId: string;
  private baseUrl = 'https://api.github.com';

  constructor(config: GistSyncConfig) {
    this.token = config.token || '';
    this.gistId = config.gistId || '';
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.token) {
      return { success: false, error: 'GitHub token not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication failed. Check your token.' };
        }
        return { success: false, error: `GitHub API error: ${response.status}` };
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  async pull(): Promise<SyncResult> {
    if (!this.token) {
      return {
        success: false,
        action: 'none',
        error: 'GitHub token not configured',
        errorCode: 'ERR_GIST_NO_TOKEN',
      };
    }

    if (!this.gistId) {
      return {
        success: false,
        action: 'none',
        error: 'No Gist ID configured. Push first to create a Gist.',
        errorCode: 'ERR_GIST_EMPTY_ID_AUTO_CREATE',
      };
    }

    try {
      const content = await this.fetchGistContent(this.gistId);
      if (!content) {
        return {
          success: false,
          action: 'none',
          error: 'Gist has no content',
          errorCode: 'ERR_GIST_NO_CONTENT',
        };
      }

      const json = decompressFromSync(content);
      let payload: { prompts?: SlimPrompt[] };
      try {
        payload = JSON.parse(json);
      } catch {
        return {
          success: false,
          action: 'none',
          error: 'Failed to parse Gist content',
          errorCode: 'ERR_GIST_PARSE_FAILED',
        };
      }

      return {
        success: true,
        action: 'pulled',
        data: {
          prompts: (payload.prompts || []) as Prompt[],
          settings: {} as never,
          categories: [],
          version: 1,
          exportedAt: Date.now(),
        },
      };
    } catch (e) {
      const errorMsg = (e as Error).message;
      if (errorMsg.includes('404')) {
        return {
          success: false,
          action: 'none',
          error: 'Gist not found',
          errorCode: 'ERR_GIST_NO_CONTENT',
        };
      }
      return {
        success: false,
        action: 'none',
        error: errorMsg,
        errorCode: 'SYNC_NETWORK_ERROR',
      };
    }
  }

  async push(payload: SyncPayload): Promise<SyncResult> {
    if (!this.token) {
      return {
        success: false,
        action: 'none',
        error: 'GitHub token not configured',
        errorCode: 'ERR_GIST_NO_TOKEN',
      };
    }

    try {
      const slimPrompts = payload.prompts.map(toSlimPrompt);
      const data = { prompts: slimPrompts };
      const compressed = compressForSync(JSON.stringify(data));

      if (!this.gistId) {
        const result = await this.createGist(GIST_DESCRIPTION, GIST_FILENAME, compressed);
        this.gistId = result.gistId;
        await this.saveGistId(this.gistId);

        return {
          success: true,
          action: 'pushed',
          data: {
            prompts: slimPrompts as Prompt[],
            settings: payload.settings,
            categories: payload.categories,
            version: payload.version,
            exportedAt: Date.now(),
          },
        };
      } else {
        await this.updateGist(this.gistId, GIST_FILENAME, compressed);
        return {
          success: true,
          action: 'pushed',
        };
      }
    } catch (e) {
      return {
        success: false,
        action: 'none',
        error: (e as Error).message,
        errorCode: 'SYNC_NETWORK_ERROR',
      };
    }
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.token) {
      return {
        state: 'failed',
        backend: 'gist',
        error: 'GitHub token not configured',
      };
    }

    const test = await this.testConnection();
    if (!test.success) {
      return {
        state: 'failed',
        backend: 'gist',
        error: test.error,
      };
    }

    return {
      state: 'synced',
      backend: 'gist',
      lastSyncTime: Date.now(),
    };
  }

  getGistId(): string {
    return this.gistId;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    };
  }

  private async createGist(
    description: string,
    filename: string,
    content: string
  ): Promise<{ htmlUrl: string; rawUrl: string; gistId: string }> {
    const response = await fetch(`${this.baseUrl}/gists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description,
        public: true,
        files: {
          [filename]: { content },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({} as { message?: string }));
      throw new Error(err.message || `GitHub API error: ${response.status}`);
    }

    const gist = (await response.json()) as GistApiResponse;
    const file = gist.files[filename];
    return {
      htmlUrl: gist.html_url,
      rawUrl: file?.raw_url || '',
      gistId: gist.id,
    };
  }

  private async updateGist(
    gistId: string,
    filename: string,
    content: string
  ): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        files: {
          [filename]: { content },
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({} as { message?: string }));
      throw new Error(err.message || `GitHub API error during update: ${response.status}`);
    }

    return true;
  }

  private async fetchGistContent(gistId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Gist: ${response.status}`);
    }

    const gist = (await response.json()) as GistApiResponse;
    const files = Object.values(gist.files);
    if (files.length === 0) {
      throw new Error('Gist has no files');
    }

    return files[0].content || '';
  }

  private async saveGistId(gistId: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ gist_id: gistId });
    }
  }

  async pullAndMerge(localPrompts: Prompt[]): Promise<{ prompts: Prompt[]; message: string }> {
    const result = await this.pull();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Pull failed');
    }

    const merged = mergePrompts(result.data.prompts as SlimPrompt[], localPrompts);
    return {
      prompts: merged,
      message: 'MSG_GIST_SYNC_SUCCESS',
    };
  }

  setGistId(gistId: string): void {
    this.gistId = gistId;
  }

  setToken(token: string): void {
    this.token = token;
  }
}

export function createGistAdapter(config: GistSyncConfig): GistSyncAdapter {
  return new GistSyncAdapter(config);
}
