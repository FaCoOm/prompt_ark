import { browser } from 'wxt/browser';
import { compress, decompress } from '../../utils/compression';
import type { Prompt, SlimPrompt, SyncResult, SyncStatus, SyncPayload } from '../../types';
import type { SyncServiceAdapter } from './types';

const SYNC_QUOTA_BYTES = 102400;
const SAFE_ITEM_BYTES = 7500;
const P_INDEX = 'p_index';
const P_PREFIX = 'p_';

const encoder = new TextEncoder();

function syncKey(id: string): string {
  return P_PREFIX + id;
}

function contentChunkKey(id: string, n: number): string {
  return `${P_PREFIX}${id}_c${n}`;
}

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

function mergeOne(slim: SlimPrompt, local: Prompt | undefined): Prompt {
  if (!local) {
    return {
      ...slim,
      versions: [],
      useCount: 0,
      lastUsedAt: null,
      isFavorite: slim.favorite || false,
    };
  }
  return {
    ...local,
    ...slim,
    isFavorite: slim.favorite || local.isFavorite,
  };
}

export class ChromeSyncAdapter implements SyncServiceAdapter {
  readonly name = 'chrome' as const;
  readonly displayName = 'Chrome Sync';

  isConfigured(): boolean {
    return typeof browser !== 'undefined' && 
           browser.storage !== undefined && 
           browser.storage.sync !== undefined;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Chrome storage sync not available' };
    }
    try {
      await browser.storage.sync.getBytesInUse(null);
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  }

  async pull(): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'none',
        error: 'Chrome storage sync not available',
        errorCode: 'SYNC_BACKEND_NOT_CONFIGURED',
      };
    }

    try {
      const indexResult = await browser.storage.sync.get(P_INDEX);
      const ids = indexResult[P_INDEX] as string[] | undefined;

      if (!ids || !Array.isArray(ids)) {
        return {
          success: true,
          action: 'none',
          data: { prompts: [], settings: {} as never, categories: [], version: 1, exportedAt: Date.now() },
        };
      }

      const allKeys: string[] = [];
      for (const id of ids) allKeys.push(syncKey(id));

      const baseData = allKeys.length > 0 ? await browser.storage.sync.get(allKeys) : {};
      const chunkKeys: string[] = [];

      for (const id of ids) {
        const baseRaw = baseData[syncKey(id)];
        let base: { _chunks?: number } | null = null;
        if (typeof baseRaw === 'string' && baseRaw.startsWith('lz::')) {
          try {
            base = JSON.parse(decompressFromSync(baseRaw));
          } catch {
            base = null;
          }
        } else if (baseRaw) {
          base = baseRaw as { _chunks?: number };
        }

        if (base?._chunks) {
          for (let i = 1; i <= base._chunks; i++) {
            chunkKeys.push(contentChunkKey(id, i));
          }
        }
      }

      const chunkData = chunkKeys.length > 0 ? await browser.storage.sync.get(chunkKeys) : {};
      const allData = { ...baseData, ...chunkData };

      const prompts: SlimPrompt[] = [];
      for (const id of ids) {
        const slim = await this.readSyncPrompt(id, allData);
        if (slim) {
          prompts.push(slim);
        }
      }

      return {
        success: true,
        action: 'pulled',
        data: {
          prompts: prompts as Prompt[],
          settings: {} as never,
          categories: [],
          version: 1,
          exportedAt: Date.now(),
        },
      };
    } catch (e) {
      return {
        success: false,
        action: 'none',
        error: (e as Error).message,
        errorCode: 'SYNC_NETWORK_ERROR',
      };
    }
  }

  async push(payload: SyncPayload): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        action: 'none',
        error: 'Chrome storage sync not available',
        errorCode: 'SYNC_BACKEND_NOT_CONFIGURED',
      };
    }

    try {
      const slimPrompts = payload.prompts.map(toSlimPrompt);
      const ids = slimPrompts.map((p) => p.id);
      await browser.storage.sync.set({ [P_INDEX]: ids });

      for (const prompt of slimPrompts) {
        await this.writeSyncPrompt(prompt);
      }

      return {
        success: true,
        action: 'pushed',
      };
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
    if (!this.isConfigured()) {
      return {
        state: 'failed',
        backend: 'chrome',
        error: 'Chrome storage sync not available',
      };
    }

    try {
      const bytesInUse = await browser.storage.sync.getBytesInUse(null);
      const percentUsed = Math.round((bytesInUse / SYNC_QUOTA_BYTES) * 100);

      return {
        state: percentUsed > 95 ? 'failed' : 'synced',
        backend: 'chrome',
        lastSyncTime: Date.now(),
      };
    } catch (e) {
      return {
        state: 'failed',
        backend: 'chrome',
        error: (e as Error).message,
      };
    }
  }

  private async readSyncPrompt(
    id: string,
    prefetchedData: Record<string, unknown>
  ): Promise<SlimPrompt | null> {
    const baseRaw = prefetchedData[syncKey(id)] as string | undefined;
    if (!baseRaw) return null;

    type BaseWithChunks = { _chunks?: number; content?: string } & SlimPrompt;
    let base: BaseWithChunks;
    if (typeof baseRaw === 'string' && baseRaw.startsWith('lz::')) {
      try {
        base = JSON.parse(decompressFromSync(baseRaw)) as BaseWithChunks;
      } catch {
        return null;
      }
    } else if (typeof baseRaw === 'object') {
      base = baseRaw as BaseWithChunks;
    } else {
      return null;
    }

    if (!base._chunks || base._chunks === 0) {
      const { _chunks: _, ...clean } = base;
      return clean;
    }

    let fullContent = base.content || '';
    for (let i = 1; i <= base._chunks; i++) {
      const key = contentChunkKey(id, i);
      let chunkRaw = prefetchedData[key] as string | undefined;

      if (chunkRaw === undefined) {
        const fetched = await browser.storage.sync.get(key);
        chunkRaw = fetched[key] as string | undefined;
      }

      if (typeof chunkRaw === 'string') {
        if (chunkRaw.startsWith('lz::')) {
          const decompressed = decompressFromSync(chunkRaw);
          fullContent += JSON.parse(decompressed) as string;
        } else {
          fullContent += chunkRaw;
        }
      }
    }

    const { _chunks: _, ...clean } = base;
    return { ...clean, content: fullContent };
  }

  private async writeSyncPrompt(prompt: SlimPrompt): Promise<void> {
    const slim = { ...prompt } as SlimPrompt & { _chunks?: number; _contentLocal?: boolean };
    const json = JSON.stringify(slim);
    const payload = compressForSync(json);
    const bytes = encoder.encode(payload).length;

    try {
      if (bytes <= SAFE_ITEM_BYTES) {
        slim._chunks = 0;
        const basePayload = compressForSync(JSON.stringify(slim));
        await browser.storage.sync.set({ [syncKey(prompt.id)]: basePayload });
        return;
      }

      const content = slim.content || '';
      const slimWithoutContent: Omit<SlimPrompt, 'content'> & { _chunks?: number; content?: string } = {
        ...slim,
        _chunks: 0,
      };
      delete (slimWithoutContent as { content?: string }).content;

      const basePayload = compressForSync(JSON.stringify(slimWithoutContent));
      const baseOverhead = encoder.encode(basePayload).length + 50;
      const contentBudget = SAFE_ITEM_BYTES - baseOverhead;

      const chunks: string[] = [];
      let remaining = content;
      while (remaining.length > 0) {
        let sliceLen = Math.min(remaining.length, contentBudget);
        const testChunk = compressForSync(JSON.stringify(remaining.slice(0, sliceLen)));
        while (
          encoder.encode(testChunk).length >
            (chunks.length === 0 ? contentBudget : SAFE_ITEM_BYTES - 50) &&
          sliceLen > 1
        ) {
          sliceLen = Math.floor(sliceLen * 0.9);
        }
        chunks.push(remaining.slice(0, sliceLen));
        remaining = remaining.slice(sliceLen);
      }

      slimWithoutContent.content = chunks[0];
      slimWithoutContent._chunks = chunks.length - 1;

      const writeData: Record<string, string> = {
        [syncKey(prompt.id)]: compressForSync(JSON.stringify(slimWithoutContent)),
      };

      for (let i = 1; i < chunks.length; i++) {
        const ck = contentChunkKey(prompt.id, i);
        writeData[ck] = compressForSync(JSON.stringify(chunks[i]));
      }

      await browser.storage.sync.set(writeData);
    } catch (e) {
      if (
        (e as Error).message?.includes('quota') ||
        (e as Error).message?.includes('QUOTA')
      ) {
        await this.removeSyncPrompt(prompt.id);

        const metaOnly: Omit<SlimPrompt, 'content' | 'variables'> & { _chunks?: number; _contentLocal?: boolean; content?: string; variables?: unknown[] } = {
          ...slim,
          _chunks: 0,
          _contentLocal: true,
        };
        delete (metaOnly as { content?: string }).content;
        delete (metaOnly as { variables?: unknown[] }).variables;

        try {
          const fallbackPayload = compressForSync(JSON.stringify(metaOnly));
          await browser.storage.sync.set({ [syncKey(prompt.id)]: fallbackPayload });
        } catch (e2) {
          console.error(`[ChromeSync] Metadata-only sync failed for ${prompt.id}:`, e2);
        }
      } else {
        throw e;
      }
    }
  }

  private async removeSyncPrompt(id: string): Promise<void> {
    const data = await browser.storage.sync.get(syncKey(id));
    const baseRaw = data[syncKey(id)] as string | undefined;
    const keysToRemove = [syncKey(id)];

    if (baseRaw && typeof baseRaw === 'string') {
      let chunkCount = 0;
      if (baseRaw.startsWith('lz::')) {
        try {
          const parsed = JSON.parse(decompressFromSync(baseRaw)) as { _chunks?: number };
          chunkCount = parsed._chunks || 0;
        } catch {
          chunkCount = 0;
        }
      }

      if (chunkCount > 0) {
        for (let i = 1; i <= chunkCount; i++) {
          keysToRemove.push(contentChunkKey(id, i));
        }
      }
    }

    await browser.storage.sync.remove(keysToRemove);
  }

  async getQuota(): Promise<{
    bytesInUse: number;
    quotaBytes: number;
    percentUsed: number;
    bytesRemaining: number;
  }> {
    if (!this.isConfigured()) {
      return {
        bytesInUse: 0,
        quotaBytes: SYNC_QUOTA_BYTES,
        percentUsed: 0,
        bytesRemaining: SYNC_QUOTA_BYTES,
      };
    }

    const bytesInUse = await browser.storage.sync.getBytesInUse(null);
    return {
      bytesInUse,
      quotaBytes: SYNC_QUOTA_BYTES,
      percentUsed: Math.round((bytesInUse / SYNC_QUOTA_BYTES) * 100),
      bytesRemaining: SYNC_QUOTA_BYTES - bytesInUse,
    };
  }

  async mergeWithLocal(syncPrompts: SlimPrompt[], localPrompts: Prompt[]): Promise<Prompt[]> {
    if (!syncPrompts || syncPrompts.length === 0) return localPrompts || [];
    if (!localPrompts || localPrompts.length === 0) {
      return syncPrompts.map((sp) => mergeOne(sp, undefined));
    }

    const localMap = new Map(localPrompts.map((p) => [p.id, p]));
    const merged: Prompt[] = [];

    for (const sp of syncPrompts) {
      const local = localMap.get(sp.id);
      merged.push(mergeOne(sp, local));
      localMap.delete(sp.id);
    }

    for (const local of localMap.values()) {
      merged.push(local);
    }

    return merged;
  }
}

export const chromeSyncAdapter = new ChromeSyncAdapter();
