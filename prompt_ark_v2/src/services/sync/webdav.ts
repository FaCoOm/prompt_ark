import { compress, decompress } from '../../utils/compression';
import type {
  Prompt,
  SlimPrompt,
  SyncResult,
  SyncStatus,
  SyncPayload,
  WebDAVSyncConfig,
} from '../../types';
import type { SyncServiceAdapter, WebDAVFileList } from './types';

const SYNC_FILENAME = 'prompt_ark_sync.json';
const TIMEOUT_MS = 10000;

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

export class WebDAVSyncAdapter implements SyncServiceAdapter {
  readonly name = 'webdav' as const;
  readonly displayName = 'WebDAV';

  private url: string;
  private username: string;
  private password: string;
  private timeoutLimit: number;

  constructor(config: WebDAVSyncConfig) {
    this.url = config.url || '';
    this.username = config.username || '';
    this.password = config.password || '';
    this.timeoutLimit = TIMEOUT_MS;
  }

  isConfigured(): boolean {
    return !!this.url && !!this.username && !!this.password;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WebDAV not configured' };
    }

    try {
      await this._createDirectory();
      return { success: true };
    } catch (e) {
      const errorMsg = (e as Error).message;
      if (errorMsg.includes('401')) {
        return { success: false, error: 'Authentication failed. Check your credentials.' };
      }
      return { success: false, error: errorMsg };
    }
  }

  async pull(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'none',
        error: 'WebDAV not configured',
        errorCode: 'ERR_WEBDAV_MISSING_CONFIG',
      };
    }

    try {
      const content = await this.getFile(SYNC_FILENAME);
      const json = decompressFromSync(content);

      let payload: { prompts?: SlimPrompt[] };
      try {
        payload = JSON.parse(json);
      } catch {
        return {
          success: false,
          action: 'none',
          error: 'Failed to parse WebDAV content',
          errorCode: 'SYNC_PARSE_FAILED',
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
      if (errorMsg.includes('FILE_NOT_FOUND') || errorMsg.includes('404')) {
        return {
          success: false,
          action: 'none',
          error: 'Sync file not found. Push first to create it.',
          errorCode: 'ERR_WEBDAV_MISSING_CONFIG',
        };
      }
      if (errorMsg.includes('401')) {
        return {
          success: false,
          action: 'none',
          error: 'Authentication failed',
          errorCode: 'SYNC_AUTH_FAILED',
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
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'none',
        error: 'WebDAV not configured',
        errorCode: 'ERR_WEBDAV_MISSING_CONFIG',
      };
    }

    try {
      const slimPrompts = payload.prompts.map(toSlimPrompt);
      const data = { prompts: slimPrompts };
      const compressed = compressForSync(JSON.stringify(data));

      await this.putFile(SYNC_FILENAME, compressed);

      return {
        success: true,
        action: 'pushed',
      };
    } catch (e) {
      const errorMsg = (e as Error).message;
      if (errorMsg.includes('401')) {
        return {
          success: false,
          action: 'none',
          error: 'Authentication failed',
          errorCode: 'SYNC_AUTH_FAILED',
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

  async getStatus(): Promise<SyncStatus> {
    if (!this.isConfigured()) {
      return {
        state: 'failed',
        backend: 'webdav',
        error: 'WebDAV not configured',
      };
    }

    const test = await this.testConnection();
    if (!test.success) {
      return {
        state: 'failed',
        backend: 'webdav',
        error: test.error,
      };
    }

    return {
      state: 'synced',
      backend: 'webdav',
      lastSyncTime: Date.now(),
    };
  }

  private _normalizeBaseUrl(): string {
    let url = this.url.trim();
    if (url === 'https://dav.jianguoyun.com/dav' || url === 'https://dav.jianguoyun.com/dav/') {
      url = 'https://dav.jianguoyun.com/dav/PromptArk/';
    }
    if (!url.endsWith('/')) {
      url += '/';
    }
    return url;
  }

  private _normalizeUrl(filename: string): string {
    return this._normalizeBaseUrl() + filename;
  }

  private _getHeaders(contentType = 'application/json'): Record<string, string> {
    const token = btoa(`${this.username}:${this.password}`);
    return {
      Authorization: `Basic ${token}`,
      'Content-Type': contentType,
      Accept: 'application/json, text/plain, */*',
    };
  }

  private async _fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutLimit);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if ((error as Error).name === 'AbortError') {
        throw new Error('ERR_WEBDAV_TIMEOUT');
      }
      throw error;
    }
  }

  private async _createDirectory(): Promise<boolean> {
    const url = this._normalizeBaseUrl();
    const headers = this._getHeaders();

    const response = await this._fetchWithTimeout(url, {
      method: 'MKCOL',
      headers,
    });

    if (!response.ok && response.status !== 405) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`MKCOL ${response.status} ${errorText}`);
    }

    return true;
  }

  async putFile(filename: string, content: string, retries = 1): Promise<boolean> {
    const url = this._normalizeUrl(filename);
    const headers = this._getHeaders();

    const response = await this._fetchWithTimeout(url, {
      method: 'PUT',
      headers,
      body: content,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');

      if (response.status === 401) {
        throw new Error('ERR_WEBDAV_AUTH_FAILED');
      }

      if ((response.status === 409 || response.status === 404) && retries > 0) {
        try {
          await this._createDirectory();
          return await this.putFile(filename, content, 0);
        } catch {
          throw new Error('ERR_WEBDAV_MKCOL_FAILED');
        }
      }

      if (response.status === 409) {
        throw new Error('ERR_WEBDAV_409');
      }

      throw new Error(`WebDAV PUT Error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return true;
  }

  async getFile(filename: string): Promise<string> {
    const url = this._normalizeUrl(filename);
    const headers = this._getHeaders();

    const response = await this._fetchWithTimeout(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('FILE_NOT_FOUND');
      }
      if (response.status === 401) {
        throw new Error('ERR_WEBDAV_AUTH_FAILED');
      }
      throw new Error(`WebDAV GET Error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
  }

  async listMarkdownFiles(): Promise<WebDAVFileList> {
    const url = this._normalizeBaseUrl();
    const token = btoa(`${this.username}:${this.password}`);
    const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/xml',
      Depth: '1',
    };

    const body = `?xml version="1.0" encoding="utf-8"?
<D:propfind xmlns:D="DAV:">
  <D:prop>
    <D:displayname/>
    <D:getlastmodified/>
    <D:getcontenttype/>
  </D:prop>
</D:propfind>`;

    const response = await this._fetchWithTimeout(url, {
      method: 'PROPFIND',
      headers,
      body,
    });

    if (!response.ok && response.status !== 207) {
      if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
      if (response.status === 404) throw new Error('ERR_WEBDAV_DIR_NOT_FOUND');
      throw new Error(`WebDAV PROPFIND Error: ${response.status}`);
    }

    const xml = await response.text();
    return this._parseMultiStatus(xml);
  }

  async putMarkdownFile(filename: string, content: string, retries = 1): Promise<boolean> {
    const url = this._normalizeUrl(filename);
    const token = btoa(`${this.username}:${this.password}`);
    const headers = {
      Authorization: `Basic ${token}`,
      'Content-Type': 'text/markdown; charset=utf-8',
    };

    const response = await this._fetchWithTimeout(url, {
      method: 'PUT',
      headers,
      body: content,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
      if ((response.status === 409 || response.status === 404) && retries > 0) {
        try {
          await this._createDirectory();
          return await this.putMarkdownFile(filename, content, 0);
        } catch {
          throw new Error('ERR_WEBDAV_MKCOL_FAILED');
        }
      }
      const errorText = await response.text().catch(() => '');
      throw new Error(`WebDAV PUT MD Error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return true;
  }

  async deleteFile(filename: string): Promise<boolean> {
    const url = this._normalizeUrl(filename);
    const headers = this._getHeaders();

    const response = await this._fetchWithTimeout(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      if (response.status === 401) throw new Error('ERR_WEBDAV_AUTH_FAILED');
      throw new Error(`WebDAV DELETE Error: ${response.status}`);
    }

    return true;
  }

  private _parseMultiStatus(xml: string, baseUrl?: string): WebDAVFileList {
    const files: Array<{ name: string; lastModified: string }> = [];
    const responseBlocks = xml.split(/<D:response>/i).slice(1);

    for (const block of responseBlocks) {
      const hrefMatch = block.match(/<D:href>([^\u003c]+)<\/D:href>/i);
      if (!hrefMatch) continue;

      const href = decodeURIComponent(hrefMatch[1]);
      if (href.endsWith('/')) continue;

      const parts = href.split('/');
      const name = parts[parts.length - 1];

      if (!name.toLowerCase().endsWith('.md')) continue;

      const modMatch = block.match(/<D:getlastmodified>([^\u003c]+)<\/D:getlastmodified>/i);
      const lastModified = modMatch ? modMatch[1] : '';

      files.push({ name, lastModified });
    }

    void baseUrl;

    return { files, count: files.length };
  }

  async pullAndMerge(localPrompts: Prompt[]): Promise<{ prompts: Prompt[]; message: string }> {
    const result = await this.pull();

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Pull failed');
    }

    const merged = mergePrompts(result.data.prompts as SlimPrompt[], localPrompts);
    return {
      prompts: merged,
      message: 'MSG_WEBDAV_SYNC_SUCCESS',
    };
  }

  setConfig(config: Partial<WebDAVSyncConfig>): void {
    if (config.url !== undefined) this.url = config.url;
    if (config.username !== undefined) this.username = config.username;
    if (config.password !== undefined) this.password = config.password;
  }
}

export function createWebDAVAdapter(config: WebDAVSyncConfig): WebDAVSyncAdapter {
  return new WebDAVSyncAdapter(config);
}
