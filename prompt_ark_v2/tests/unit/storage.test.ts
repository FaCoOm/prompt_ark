/**
 * @fileoverview Unit tests for storage layer
 *
 * Tests LocalStorage, SyncStorage, and PromptStorage
 * Uses Vitest with manual mocks for WXT storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorage } from '../../src/core/storage/local';
import { SyncStorage } from '../../src/core/storage/sync';
import { PromptStorage } from '../../src/core/storage/core';
import { STORAGE_KEYS } from '../../src/core/storage/types';
import type { Prompt } from '../../src/types';

// Mock WXT storage
const mockStorage = new Map<string, unknown>();

vi.mock('wxt/utils/storage', () => ({
  storage: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: unknown) => {
      mockStorage.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

// Mock chrome.storage.sync
const mockSyncStorage = new Map<string, unknown>();
let mockSyncBytesInUse = 0;

Object.defineProperty(global, 'chrome', {
  value: {
    storage: {
      sync: {
        get: vi.fn(async (keys: string | string[]) => {
          const result: Record<string, unknown> = {};
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            if (mockSyncStorage.has(key)) {
              const value = mockSyncStorage.get(key);
              // Parse JSON strings back to objects (chrome.storage does this automatically)
              if (typeof value === 'string') {
                try {
                  result[key] = JSON.parse(value);
                } catch {
                  result[key] = value;
                }
              } else {
                result[key] = value;
              }
            }
          }
          return result;
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) {
            mockSyncStorage.set(key, value);
          }
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            mockSyncStorage.delete(key);
          }
        }),
        getBytesInUse: vi.fn(async () => mockSyncBytesInUse),
      },
    },
  },
  writable: true,
  configurable: true,
});

describe('LocalStorage', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await LocalStorage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return stored value', async () => {
      await LocalStorage.set('testKey', { data: 'value' });
      const result = await LocalStorage.get<{ data: string }>('testKey');
      expect(result).toEqual({ data: 'value' });
    });

    it('should return null on error', async () => {
      const result = await LocalStorage.get('');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value', async () => {
      await LocalStorage.set('key', 'value');
      expect(await LocalStorage.get('key')).toBe('value');
    });

    it('should store complex objects', async () => {
      const obj = { nested: { array: [1, 2, 3] } };
      await LocalStorage.set('complex', obj);
      expect(await LocalStorage.get('complex')).toEqual(obj);
    });
  });

  describe('remove', () => {
    it('should remove value', async () => {
      await LocalStorage.set('toRemove', 'value');
      await LocalStorage.remove('toRemove');
      expect(await LocalStorage.get('toRemove')).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should get multiple values', async () => {
      await LocalStorage.set('key1', 'value1');
      await LocalStorage.set('key2', 'value2');

      const result = await LocalStorage.getMany(['key1', 'key2', 'key3']);
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('setMany', () => {
    it('should set multiple values', async () => {
      await LocalStorage.setMany({ a: 1, b: 2 });
      expect(await LocalStorage.get('a')).toBe(1);
      expect(await LocalStorage.get('b')).toBe(2);
    });
  });

  describe('removeMany', () => {
    it('should remove multiple values', async () => {
      await LocalStorage.setMany({ a: 1, b: 2, c: 3 });
      await LocalStorage.removeMany(['a', 'b']);
      expect(await LocalStorage.get('a')).toBeNull();
      expect(await LocalStorage.get('b')).toBeNull();
      expect(await LocalStorage.get('c')).toBe(3);
    });
  });
});

describe('SyncStorage', () => {
  beforeEach(() => {
    mockSyncStorage.clear();
    mockSyncBytesInUse = 0;
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await SyncStorage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return single-key value', async () => {
      mockSyncStorage.set('test', JSON.stringify({ data: 'value' }));
      const result = await SyncStorage.get<{ data: string }>('test');
      expect(result).toEqual({ data: 'value' });
    });

    it('should return chunked value', async () => {
      // Store metadata as object (chrome.storage serializes automatically)
      mockSyncStorage.set('chunked_meta', { totalChunks: 2 });
      mockSyncStorage.set('chunked_0', '{"part":1');
      mockSyncStorage.set('chunked_1', '}');

      const result = await SyncStorage.get<{ part: number }>('chunked');
      // When concatenated, the chunks form valid JSON
      expect(result).toEqual({ part: 1 });
    });

    it('should return null when chunks are missing', async () => {
      mockSyncStorage.set('missing_meta', JSON.stringify({ totalChunks: 3 }));
      mockSyncStorage.set('missing_0', 'data');

      const result = await SyncStorage.get('missing');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set small value in single key', async () => {
      const result = await SyncStorage.set('small', { test: true });
      expect(result.synced).toBe(true);
      expect(result.chunks).toBeUndefined();
      expect(mockSyncStorage.has('small')).toBe(true);
    });

    it('should chunk large values', async () => {
      const largeValue = { data: 'x'.repeat(10000) };
      const result = await SyncStorage.set('large', largeValue);
      expect(result.synced).toBe(true);
      expect(result.chunks).toBeGreaterThan(1);
      expect(mockSyncStorage.has('large_meta')).toBe(true);
    });

    it('should not fail when sync unavailable', async () => {
      const originalChrome = global.chrome;
      // @ts-expect-error - Testing when chrome is undefined
      global.chrome = undefined;

      const result = await SyncStorage.set('fallback', { test: true });
      expect(result.synced).toBe(false);
      expect(result.reason).toBe('SYNC_NOT_AVAILABLE');

      global.chrome = originalChrome;
    });
  });

  describe('remove', () => {
    it('should remove single key', async () => {
      await SyncStorage.set('toRemove', { data: 1 });
      await SyncStorage.remove('toRemove');
      expect(mockSyncStorage.has('toRemove')).toBe(false);
    });

    it('should remove chunked data', async () => {
      mockSyncStorage.set('chunk_meta', { totalChunks: 2 });
      mockSyncStorage.set('chunk_0', 'a');
      mockSyncStorage.set('chunk_1', 'b');

      await SyncStorage.remove('chunk');
      expect(mockSyncStorage.has('chunk_meta')).toBe(false);
      expect(mockSyncStorage.has('chunk_0')).toBe(false);
      expect(mockSyncStorage.has('chunk_1')).toBe(false);
    });
  });

  describe('getUsage', () => {
    it('should return usage info', async () => {
      const usage = await SyncStorage.getUsage();
      expect(usage.quotaBytes).toBe(102400);
      expect(usage.percentUsed).toBeGreaterThanOrEqual(0);
    });

    it('should handle when sync unavailable', async () => {
      const originalChrome = global.chrome;
      // @ts-expect-error - Testing when chrome is undefined
      global.chrome = undefined;

      const usage = await SyncStorage.getUsage();
      expect(usage.bytesInUse).toBe(0);
      expect(usage.percentUsed).toBe(0);

      global.chrome = originalChrome;
    });
  });
});

describe('PromptStorage', () => {
  const createTestPrompt = (id: string, overrides = {}): Prompt => ({
    id,
    title: `Test ${id}`,
    content: `Content ${id}`,
    category: 'General',
    tags: ['test'],
    shortcut: `test${id}`,
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
    ...overrides,
  });

  beforeEach(() => {
    mockStorage.clear();
    mockSyncStorage.clear();
    mockSyncBytesInUse = 0;
  });

  describe('get', () => {
    it('should return empty array when no prompts', async () => {
      const prompts = await PromptStorage.get();
      expect(prompts).toEqual([]);
    });

    it('should return local prompts when sync is empty', async () => {
      const testPrompt = createTestPrompt('1');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [testPrompt]);

      const prompts = await PromptStorage.get();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].id).toBe('1');
    });

    it('should merge sync and local data', async () => {
      const localPrompt = createTestPrompt('1', {
        versions: [{ id: 'v1', content: 'v1', createdAt: Date.now() }],
        useCount: 5,
      });
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [localPrompt]);

      await SyncStorage.set(STORAGE_KEYS.PROMPT_INDEX, ['1']);
      await SyncStorage.set(`${STORAGE_KEYS.PROMPT_PREFIX}1`, {
        id: '1',
        title: 'Updated',
        content: 'Updated content',
        category: 'General',
        tags: ['test'],
        shortcut: 'test1',
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const prompts = await PromptStorage.get();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].title).toBe('Updated');
      expect(prompts[0].versions).toHaveLength(1);
      expect(prompts[0].useCount).toBe(5);
    });
  });

  describe('getById', () => {
    it('should return prompt by id', async () => {
      const prompt = createTestPrompt('1');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [prompt]);

      const result = await PromptStorage.getById('1');
      expect(result?.id).toBe('1');
    });

    it('should return null for non-existent id', async () => {
      const result = await PromptStorage.getById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save new prompt to local', async () => {
      const prompt = createTestPrompt('new');
      await PromptStorage.save(prompt);

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(1);
      expect(locals![0].id).toBe('new');
    });

    it('should append to existing prompts', async () => {
      const existing = createTestPrompt('existing');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [existing]);

      const newPrompt = createTestPrompt('new');
      await PromptStorage.save(newPrompt);

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(2);
    });

    it('should sync new prompt index', async () => {
      const prompt = createTestPrompt('synced');
      await PromptStorage.save(prompt);

      const index = await SyncStorage.get<string[]>(
        STORAGE_KEYS.PROMPT_INDEX
      );
      expect(index).toContain('synced');
    });
  });

  describe('update', () => {
    it('should update existing prompt', async () => {
      const original = createTestPrompt('update');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [original]);

      const updated = { ...original, title: 'Updated Title' };
      await PromptStorage.update(updated);

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals![0].title).toBe('Updated Title');
    });

    it('should add prompt if not exists', async () => {
      const newPrompt = createTestPrompt('new-update');
      await PromptStorage.update(newPrompt);

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete prompt from local', async () => {
      const prompt = createTestPrompt('delete');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [prompt]);

      await PromptStorage.delete('delete');

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(0);
    });

    it('should delete from sync index', async () => {
      await SyncStorage.set(STORAGE_KEYS.PROMPT_INDEX, ['delete', 'keep']);

      const prompt = createTestPrompt('delete');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [prompt]);

      await PromptStorage.delete('delete');

      const index = await SyncStorage.get<string[]>(
        STORAGE_KEYS.PROMPT_INDEX
      );
      expect(index).not.toContain('delete');
      expect(index).toContain('keep');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const prompts = [
        createTestPrompt('1', {
          title: 'Email Template',
          content: 'Write a professional email',
          category: 'Work',
          tags: ['email', 'professional'],
        }),
        createTestPrompt('2', {
          title: 'Code Review',
          content: 'Review this code',
          category: 'Development',
          tags: ['code', 'review'],
        }),
        createTestPrompt('3', {
          title: 'Meeting Notes',
          content: 'Summarize meeting',
          category: 'Work',
          tags: ['meeting'],
        }),
      ];
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, prompts);
    });

    it('should search by title', async () => {
      const results = await PromptStorage.search('Email');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should search by content', async () => {
      const results = await PromptStorage.search('code');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should search by category', async () => {
      const results = await PromptStorage.search('Work');
      expect(results).toHaveLength(2);
    });

    it('should search by tag', async () => {
      const results = await PromptStorage.search('meeting');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('3');
    });

    it('should return all for empty query', async () => {
      const results = await PromptStorage.search('');
      expect(results).toHaveLength(3);
    });

    it('should be case insensitive', async () => {
      const results = await PromptStorage.search('EMAIL');
      expect(results).toHaveLength(1);
    });

    it('should return empty for no matches', async () => {
      const results = await PromptStorage.search('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('bulkSet', () => {
    it('should replace all prompts', async () => {
      const existing = createTestPrompt('old');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [existing]);

      const newPrompts = [createTestPrompt('1'), createTestPrompt('2')];
      await PromptStorage.bulkSet(newPrompts);

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(2);
      expect(locals!.every((p) => ['1', '2'].includes(p.id))).toBe(true);
    });

    it('should sync bulk set', async () => {
      const prompts = [createTestPrompt('1'), createTestPrompt('2')];
      await PromptStorage.bulkSet(prompts);

      const index = await SyncStorage.get<string[]>(
        STORAGE_KEYS.PROMPT_INDEX
      );
      expect(index).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all prompts', async () => {
      const prompts = [createTestPrompt('1'), createTestPrompt('2')];
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, prompts);

      await PromptStorage.clear();

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toEqual([]);
    });
  });

  describe('stats', () => {
    it('should return storage stats', async () => {
      const prompts = [createTestPrompt('1'), createTestPrompt('2')];
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, prompts);
      await SyncStorage.set(STORAGE_KEYS.PROMPT_INDEX, ['1', '2', '3']);

      const stats = await PromptStorage.stats();
      expect(stats.count).toBe(2);
      expect(stats.localCount).toBe(2);
      expect(stats.syncCount).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should handle sync errors gracefully on save', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Fill sync to cause failure
      mockSyncBytesInUse = 102400;

      const prompt = createTestPrompt('error');
      await PromptStorage.save(prompt);

      // Should not throw, local should still work
      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(1);

      consoleSpy.mockRestore();
    });

    it('should handle sync errors gracefully on delete', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const prompt = createTestPrompt('delete-error');
      await LocalStorage.set(STORAGE_KEYS.LOCAL_PROMPTS, [prompt]);

      // This should not throw even if sync fails
      await PromptStorage.delete('delete-error');

      const locals = await LocalStorage.get<Prompt[]>(
        STORAGE_KEYS.LOCAL_PROMPTS
      );
      expect(locals).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });
});
