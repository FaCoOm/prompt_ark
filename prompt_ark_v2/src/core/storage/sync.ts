/**
 * @fileoverview SyncStorage operations for Prompt Ark v2
 *
 * Handles chrome.storage.sync with automatic chunking for large values.
 * Sync is best-effort - never throws on sync failure.
 */

import { LocalStorage } from './local';
import { STORAGE_LIMITS } from './types';

const { MAX_CHUNK_BYTES, SYNC_QUOTA_BYTES } = STORAGE_LIMITS;

const encoder = new TextEncoder();

/**
 * Result of a sync storage set operation
 */
export interface SyncSetResult {
  /** Whether the value was synced successfully */
  synced: boolean;
  /** Bytes used for storage */
  bytesUsed: number;
  /** Number of chunks if chunked, undefined otherwise */
  chunks?: number;
  /** Reason for failure if not synced */
  reason?: string;
}

/**
 * Check if running in a context where chrome.storage.sync is available
 */
function isSyncAvailable(): boolean {
  return typeof chrome !== 'undefined' && 
         chrome.storage !== undefined && 
         chrome.storage.sync !== undefined;
}

/**
 * Split a string into chunks where each chunk's UTF-8 byte length ≤ maxBytes
 * Uses binary search to handle multibyte characters correctly
 */
function chunkByBytes(str: string, maxBytes: number): string[] {
  const totalBytes = encoder.encode(str).length;
  if (totalBytes <= maxBytes) {
    return [str];
  }

  const chunks: string[] = [];
  let pos = 0;

  while (pos < str.length) {
    if (pos + 1 >= str.length) {
      chunks.push(str.slice(pos));
      break;
    }

    let lo = pos + 1;
    let hi = Math.min(pos + maxBytes, str.length);

    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (encoder.encode(str.slice(pos, mid)).length <= maxBytes) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }

    chunks.push(str.slice(pos, lo));
    pos = lo;
  }

  return chunks;
}

/**
 * Get metadata key for chunked storage
 */
function getMetaKey(key: string): string {
  return `${key}_meta`;
}

/**
 * Get chunk key for indexed chunk
 */
function getChunkKey(key: string, index: number): string {
  return `${key}_${index}`;
}

/**
 * SyncStorage with automatic chunking for large values
 * Best-effort operations - never throws, falls back to local on failure
 */
export const SyncStorage = {
  /**
   * Get a value from sync storage
   * Handles both single-key and chunked formats
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isSyncAvailable()) {
      return null;
    }

    try {
      // Check for chunked format first
      const metaKey = getMetaKey(key);
      const metaResult = await chrome.storage.sync.get(metaKey);

      if (metaResult[metaKey]) {
        const { totalChunks } = metaResult[metaKey] as { totalChunks: number };
        const chunkKeys = Array.from(
          { length: totalChunks },
          (_, i) => getChunkKey(key, i)
        );
        const chunks = await chrome.storage.sync.get(chunkKeys);

        let payload = '';
        for (let i = 0; i < totalChunks; i++) {
          const chunk = chunks[getChunkKey(key, i)];
          if (chunk === undefined) {
            console.warn(`[SyncStorage] Missing chunk ${i} for key ${key}`);
            return null;
          }
          payload += chunk as string;
        }

        return JSON.parse(payload) as T;
      }

      // Try single-key format (legacy)
      const result = await chrome.storage.sync.get(key);
      if (result[key] !== undefined) {
        return result[key] as T;
      }

      return null;
    } catch (error) {
      console.warn(`[SyncStorage] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in sync storage with automatic chunking
   * Falls back to local storage if quota exceeded
   */
  async set<T>(key: string, value: T): Promise<SyncSetResult> {
    if (!isSyncAvailable()) {
      // Fall back to local storage
      await LocalStorage.set(`_sync_fallback_${key}`, value);
      return { synced: false, bytesUsed: 0, reason: 'SYNC_NOT_AVAILABLE' };
    }

    try {
      const json = JSON.stringify(value);
      const byteSize = encoder.encode(json).length;

      // Check total quota
      const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
      const oldBytes = await this._getKeyBytes(key);
      const projected = bytesInUse - oldBytes + byteSize + 200; // Buffer for overhead

      if (projected > SYNC_QUOTA_BYTES) {
        console.warn(
          `[SyncStorage] Quota exceeded (${projected}/${SYNC_QUOTA_BYTES} bytes). ` +
          'Falling back to local.'
        );
        await LocalStorage.set(`_sync_fallback_${key}`, value);
        return {
          synced: false,
          bytesUsed: projected,
          reason: 'QUOTA_EXCEEDED',
        };
      }

      // Clean up old chunks first
      await this._removeChunks(key);

      // Chunk if necessary
      const chunks = chunkByBytes(json, MAX_CHUNK_BYTES);

      if (chunks.length === 1) {
        // Fits in single key
        await chrome.storage.sync.set({ [key]: json });
        return { synced: true, bytesUsed: byteSize };
      }

      // Write metadata + chunks
      const metaKey = getMetaKey(key);
      const writeData: Record<string, string> = {
        [metaKey]: JSON.stringify({ totalChunks: chunks.length }),
      };
      chunks.forEach((chunk, i) => {
        writeData[getChunkKey(key, i)] = chunk;
      });

      await chrome.storage.sync.set(writeData);
      console.log(
        `[SyncStorage] Wrote ${key} in ${chunks.length} chunks (${byteSize} bytes)`
      );
      return {
        synced: true,
        bytesUsed: byteSize,
        chunks: chunks.length,
      };
    } catch (error) {
      console.warn(`[SyncStorage] Failed to set ${key}:`, error);
      // Fall back to local storage
      try {
        await LocalStorage.set(`_sync_fallback_${key}`, value);
      } catch (localError) {
        console.error(`[SyncStorage] Local fallback also failed:`, localError);
      }
      return {
        synced: false,
        bytesUsed: 0,
        reason: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      };
    }
  },

  /**
   * Remove a value from sync storage (including chunks)
   */
  async remove(key: string): Promise<void> {
    if (!isSyncAvailable()) {
      return;
    }

    try {
      await this._removeChunks(key);
    } catch (error) {
      console.warn(`[SyncStorage] Failed to remove ${key}:`, error);
      // Best-effort: don't throw
    }
  },

  /**
   * Get current sync storage usage
   */
  async getUsage(): Promise<{
    bytesInUse: number;
    quotaBytes: number;
    percentUsed: number;
  }> {
    if (!isSyncAvailable()) {
      return {
        bytesInUse: 0,
        quotaBytes: SYNC_QUOTA_BYTES,
        percentUsed: 0,
      };
    }

    try {
      const bytesInUse = await chrome.storage.sync.getBytesInUse(null);
      return {
        bytesInUse,
        quotaBytes: SYNC_QUOTA_BYTES,
        percentUsed: Math.round((bytesInUse / SYNC_QUOTA_BYTES) * 100),
      };
    } catch (error) {
      console.warn('[SyncStorage] Failed to get usage:', error);
      return {
        bytesInUse: 0,
        quotaBytes: SYNC_QUOTA_BYTES,
        percentUsed: 0,
      };
    }
  },

  /**
   * Internal: Get bytes used by a key (including chunks)
   */
  async _getKeyBytes(key: string): Promise<number> {
    if (!isSyncAvailable()) {
      return 0;
    }

    try {
      const metaKey = getMetaKey(key);
      const metaResult = await chrome.storage.sync.get(metaKey);

      if (metaResult[metaKey]) {
        const { totalChunks } = JSON.parse(metaResult[metaKey] as string) as {
          totalChunks: number;
        };
        const chunkKeys = [
          metaKey,
          ...Array.from({ length: totalChunks }, (_, i) => getChunkKey(key, i)),
        ];
        return await chrome.storage.sync.getBytesInUse(chunkKeys);
      }

      return await chrome.storage.sync.getBytesInUse(key);
    } catch {
      return 0;
    }
  },

  /**
   * Internal: Remove all chunks for a key
   */
  async _removeChunks(key: string): Promise<void> {
    if (!isSyncAvailable()) {
      return;
    }

    const metaKey = getMetaKey(key);
    const metaResult = await chrome.storage.sync.get(metaKey);

    const keysToRemove = [key, metaKey];

    if (metaResult[metaKey]) {
      const metaValue = metaResult[metaKey];
      const meta = typeof metaValue === 'string'
        ? (JSON.parse(metaValue) as { totalChunks: number })
        : (metaValue as { totalChunks: number });
      for (let i = 0; i < meta.totalChunks; i++) {
        keysToRemove.push(getChunkKey(key, i));
      }
    }

    await chrome.storage.sync.remove(keysToRemove);
  },
};
