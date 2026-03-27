/**
 * @fileoverview Unit tests for Sync Service
 *
 * Tests SyncManager, ChromeSyncAdapter, and sync operations
 * Uses Vitest with mocks for chrome storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock compression
vi.mock('../../src/utils/compression', () => ({
  compress: vi.fn((str: string) => `compressed:${str}`),
  decompress: vi.fn((str: string) => str.replace('compressed:', '')),
}));

// Mock chrome storage
const mockSyncStorage = new Map<string, unknown>();
const mockLocalStorage = new Map<string, unknown>();
let mockBytesInUse = 0;

Object.defineProperty(global, 'chrome', {
  value: {
    storage: {
      sync: {
        get: vi.fn(async (keys: string | string[] | null) => {
          const result: Record<string, unknown> = {};
          if (keys === null) {
            for (const [key, value] of mockSyncStorage.entries()) {
              result[key] = value;
            }
          } else {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            for (const key of keyArray) {
              if (mockSyncStorage.has(key)) {
                result[key] = mockSyncStorage.get(key);
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
        getBytesInUse: vi.fn(async () => mockBytesInUse),
      },
      local: {
        get: vi.fn(async (keys?: string | string[] | null) => {
          const result: Record<string, unknown> = {};
          if (!keys) {
            for (const [key, value] of mockLocalStorage.entries()) {
              result[key] = value;
            }
          } else {
            const keyArray = Array.isArray(keys) ? keys : [keys];
            for (const key of keyArray) {
              if (mockLocalStorage.has(key)) {
                result[key] = mockLocalStorage.get(key);
              }
            }
          }
          return result;
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) {
            mockLocalStorage.set(key, value);
          }
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            mockLocalStorage.delete(key);
          }
        }),
      },
    },
    runtime: {
      sendMessage: vi.fn(async () => {}),
    },
  },
  writable: true,
  configurable: true,
});

import { SyncManager, toSlimPrompt, mergePrompts } from '../../src/services/sync';
import { ChromeSyncAdapter, chromeSyncAdapter } from '../../src/services/sync/chrome';
import { SyncServiceError } from '../../src/services/sync/types';
import type { Prompt, SlimPrompt, SyncPayload } from '../../src/types';

// Helper functions
const createTestPrompt = (id: string, overrides = {}): Prompt => ({
  id,
  title: `Prompt ${id}`,
  content: `Content ${id}`,
  category: 'General',
  tags: ['test'],
  shortcut: `test${id}`,
  isFavorite: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  versions: [],
  useCount: 0,
  lastUsedAt: null,
  ...overrides,
});

describe('toSlimPrompt', () => {
  it('should convert prompt to slim format', () => {
    const prompt = createTestPrompt('1', {
      versions: [{ id: 'v1', content: 'v1', createdAt: Date.now() }],
      useCount: 5,
      lastUsedAt: Date.now(),
    });

    const slim = toSlimPrompt(prompt);

    expect(slim.id).toBe('1');
    expect(slim.title).toBe('Prompt 1');
    expect(slim.content).toBe('Content 1');
    expect(slim.category).toBe('General');
    expect(slim.tags).toEqual(['test']);
    expect(slim.favorite).toBe(false);
    expect(slim.createdAt).toBeDefined();
    expect(slim.updatedAt).toBeDefined();
  });

  it('should handle empty optional fields', () => {
    const prompt = createTestPrompt('1', {
      title: undefined,
      content: undefined,
      category: undefined,
      tags: undefined,
      shortcut: undefined,
      variables: undefined,
      isFavorite: undefined,
    });

    const slim = toSlimPrompt(prompt);

    expect(slim.title).toBe('');
    expect(slim.content).toBe('');
    expect(slim.category).toBe('');
    expect(slim.tags).toEqual([]);
    expect(slim.shortcut).toBe('');
    expect(slim.variables).toEqual([]);
    expect(slim.favorite).toBe(false);
  });

  it('should handle legacy favorite field', () => {
    const prompt = createTestPrompt('1') as Prompt & { favorite?: boolean };
    prompt.favorite = true;
    prompt.isFavorite = false;

    const slim = toSlimPrompt(prompt);
    expect(slim.favorite).toBe(true);
  });
});

describe('mergePrompts', () => {
  it('should return empty array when both inputs are empty', () => {
    const result = mergePrompts([], []);
    expect(result).toEqual([]);
  });

  it('should return sync prompts when local is empty', () => {
    const syncPrompts = [createTestPrompt('1'), createTestPrompt('2')];
    const result = mergePrompts(syncPrompts, []);
    expect(result).toHaveLength(2);
  });

  it('should return local prompts when sync is empty', () => {
    const localPrompts = [createTestPrompt('1'), createTestPrompt('2')];
    const result = mergePrompts([], localPrompts);
    expect(result).toHaveLength(2);
  });

  it('should merge prompts with matching IDs', () => {
    const syncPrompts = [createTestPrompt('1', { title: 'Sync Title' })];
    const localPrompts = [
      createTestPrompt('1', {
        title: 'Local Title',
        versions: [{ id: 'v1', content: 'v1', createdAt: Date.now() }],
        useCount: 5,
      }),
    ];

    const result = mergePrompts(syncPrompts, localPrompts);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Sync Title');
    expect(result[0].versions).toHaveLength(1);
    expect(result[0].useCount).toBe(5);
  });

  it('should include both sync-only and local-only prompts', () => {
    const syncPrompts = [createTestPrompt('sync-only')];
    const localPrompts = [createTestPrompt('local-only')];

    const result = mergePrompts(syncPrompts, localPrompts);

    expect(result).toHaveLength(2);
    expect(result.some((p) => p.id === 'sync-only')).toBe(true);
    expect(result.some((p) => p.id === 'local-only')).toBe(true);
  });

  it('should handle undefined/null inputs', () => {
    // @ts-expect-error Testing invalid inputs
    const result1 = mergePrompts(null, []);
    expect(result1).toEqual([]);

    // @ts-expect-error Testing invalid inputs
    const result2 = mergePrompts([], null);
    expect(result2).toEqual([]);

    // @ts-expect-error Testing invalid inputs
    const result3 = mergePrompts(undefined, undefined);
    expect(result3).toEqual([]);
  });
});

describe('SyncManager', () => {
  beforeEach(() => {
    mockSyncStorage.clear();
    mockBytesInUse = 0;
    vi.clearAllMocks();
  });

  describe('backend configuration', () => {
    it('should set backend', () => {
      SyncManager.setBackend('gist');
      expect(SyncManager.getBackend()).toBe('gist');
    });

    it('should update config when setting backend', () => {
      SyncManager.setBackend('gist', {
        gistToken: 'test-token',
        gistId: 'test-gist-id',
      });

      expect(SyncManager.getGistId()).toBe('test-gist-id');
    });

    it('should return configured status', () => {
      SyncManager.setBackend('chrome');
      expect(SyncManager.isConfigured()).toBe(true);
    });

    it('should return unconfigured for none backend', () => {
      SyncManager.setBackend('none');
      expect(SyncManager.isConfigured()).toBe(false);
    });
  });

  describe('sync operations', () => {
    it('should fail sync with no adapter', async () => {
      SyncManager.setBackend('none');

      const result = await SyncManager.sync({
        prompts: [],
        settings: {} as never,
        categories: [],
        version: 1,
        exportedAt: Date.now(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No sync backend configured');
    });

    it('should fail pull with no adapter', async () => {
      SyncManager.setBackend('none');

      const result = await SyncManager.pull();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No sync backend configured');
    });

    it('should fail test connection with no adapter', async () => {
      SyncManager.setBackend('none');

      const result = await SyncManager.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No sync backend configured');
    });
  });

  describe('status management', () => {
    it('should update sync status', async () => {
      await SyncManager['updateSyncStatus']('synced');

      expect(mockLocalStorage.get('syncStatus')).toBeDefined();
    });

    it('should get status', async () => {
      SyncManager.setBackend('chrome');

      const status = await SyncManager.getStatus();

      expect(status.backend).toBe('chrome');
    });
  });

  describe('gist operations', () => {
    it('should get gist ID', () => {
      SyncManager.setBackend('gist', { gistId: 'my-gist' });

      expect(SyncManager.getGistId()).toBe('my-gist');
    });

    it('should set gist ID', async () => {
      SyncManager.setBackend('gist');
      await SyncManager.setGistId('new-gist-id');

      expect(SyncManager.getGistId()).toBe('new-gist-id');
    });
  });

  describe('pullAndMerge', () => {
    it('should return error when pull fails', async () => {
      SyncManager.setBackend('none');

      const localPrompts = [createTestPrompt('1')];
      const result = await SyncManager.pullAndMerge(localPrompts);

      expect(result.success).toBe(false);
      expect(result.prompts).toEqual(localPrompts);
    });

    it('should return success with no data', async () => {
      SyncManager.setBackend('chrome');

      // Mock adapter to return no data
      const adapter = SyncManager.getAdapter();
      if (adapter) {
        vi.spyOn(adapter, 'pull').mockResolvedValueOnce({
          success: true,
          action: 'pulled',
          data: undefined,
        });
      }

      const localPrompts = [createTestPrompt('1')];
      const result = await SyncManager.pullAndMerge(localPrompts);

      expect(result.success).toBe(true);
    });
  });
});

describe('ChromeSyncAdapter', () => {
  beforeEach(() => {
    mockSyncStorage.clear();
    mockBytesInUse = 0;
    vi.clearAllMocks();
  });

  it('should have correct name', () => {
    expect(chromeSyncAdapter.name).toBe('chrome');
    expect(chromeSyncAdapter.displayName).toBe('Chrome Sync');
  });

  it('should check if configured', () => {
    expect(chromeSyncAdapter.isConfigured()).toBe(true);
  });

  it('should test connection', async () => {
    const result = await chromeSyncAdapter.testConnection();
    expect(result.success).toBe(true);
  });

  it('should fail test when not configured', async () => {
    Object.defineProperty(global, 'chrome', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await chromeSyncAdapter.testConnection();
    expect(result.success).toBe(false);

    // Restore chrome mock
    Object.defineProperty(global, 'chrome', {
      value: {
        storage: {
          sync: {
            get: vi.fn(async () => ({})),
            set: vi.fn(async () => {}),
            remove: vi.fn(async () => {}),
            getBytesInUse: vi.fn(async () => 0),
          },
          local: {
            get: vi.fn(async () => ({})),
            set: vi.fn(async () => {}),
            remove: vi.fn(async () => {}),
          },
        },
        runtime: {
          sendMessage: vi.fn(async () => {}),
        },
      },
      writable: true,
      configurable: true,
    });
  });

  describe('push operations', () => {
    it('should push prompts to sync', async () => {
      const payload: SyncPayload = {
        prompts: [createTestPrompt('1'), createTestPrompt('2')],
        settings: {} as never,
        categories: [],
        version: 1,
        exportedAt: Date.now(),
      };

      const result = await chromeSyncAdapter.push(payload);

      expect(result.success).toBe(true);
      expect(result.action).toBe('pushed');
    });

    it('should fail when not configured', async () => {
      Object.defineProperty(global, 'chrome', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const payload: SyncPayload = {
        prompts: [],
        settings: {} as never,
        categories: [],
        version: 1,
        exportedAt: Date.now(),
      };

      const result = await chromeSyncAdapter.push(payload);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SYNC_BACKEND_NOT_CONFIGURED');
    });
  });

  describe('pull operations', () => {
    it('should pull prompts from sync', async () => {
      // Set up mock data - use a custom mock that returns our data
      const mockData: Record<string, unknown> = {
        p_index: ['1', '2'],
        p_1: 'lz::compressed:{"id":"1","title":"Prompt 1","content":"Content 1","category":"General","tags":[],"shortcut":"","variables":[],"favorite":false,"createdAt":0,"updatedAt":0}',
        p_2: 'lz::compressed:{"id":"2","title":"Prompt 2","content":"Content 2","category":"General","tags":[],"shortcut":"","variables":[],"favorite":false,"createdAt":0,"updatedAt":0}',
      };

      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            sync: {
              get: vi.fn(async (keys: string | string[] | null) => {
                if (keys === null) return mockData;
                const result: Record<string, unknown> = {};
                const keyArray = Array.isArray(keys) ? keys : [keys];
                for (const key of keyArray) {
                  if (mockData[key]) {
                    result[key] = mockData[key];
                  }
                }
                return result;
              }),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
              getBytesInUse: vi.fn(async () => 0),
            },
            local: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
            },
          },
          runtime: {
            sendMessage: vi.fn(async () => {}),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await chromeSyncAdapter.pull();

      expect(result.success).toBe(true);
      expect(result.action).toBe('pulled');
    });

    it('should return empty array when no index exists', async () => {
      // Ensure chrome is available
      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            sync: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
              getBytesInUse: vi.fn(async () => 0),
            },
            local: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
            },
          },
          runtime: {
            sendMessage: vi.fn(async () => {}),
          },
        },
        writable: true,
        configurable: true,
      });

      const result = await chromeSyncAdapter.pull();

      expect(result.success).toBe(true);
      expect(result.data?.prompts).toEqual([]);
    });

    it('should fail when not configured', async () => {
      Object.defineProperty(global, 'chrome', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = await chromeSyncAdapter.pull();

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SYNC_BACKEND_NOT_CONFIGURED');
    });
  });

  describe('quota management', () => {
    it('should get quota information', async () => {
      mockBytesInUse = 50000;

      // Ensure chrome is available
      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            sync: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
              getBytesInUse: vi.fn(async () => mockBytesInUse),
            },
            local: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
            },
          },
          runtime: {
            sendMessage: vi.fn(async () => {}),
          },
        },
        writable: true,
        configurable: true,
      });

      const quota = await chromeSyncAdapter.getQuota();

      expect(quota.bytesInUse).toBe(50000);
      expect(quota.quotaBytes).toBe(102400);
      expect(quota.percentUsed).toBe(49);
      expect(quota.bytesRemaining).toBe(52400);
    });

    it('should return default quota when not configured', async () => {
      Object.defineProperty(global, 'chrome', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const quota = await chromeSyncAdapter.getQuota();

      expect(quota.bytesInUse).toBe(0);
      expect(quota.quotaBytes).toBe(102400);
    });
  });

  describe('getStatus', () => {
    it('should return synced status', async () => {
      mockBytesInUse = 50000;

      // Ensure chrome is available for this test
      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            sync: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
              getBytesInUse: vi.fn(async () => mockBytesInUse),
            },
            local: {
              get: vi.fn(async () => ({})),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
            },
          },
          runtime: {
            sendMessage: vi.fn(async () => {}),
          },
        },
        writable: true,
        configurable: true,
      });

      const status = await chromeSyncAdapter.getStatus();

      expect(status.backend).toBe('chrome');
      expect(status.state).toBe('synced');
    });

    it('should return failed when quota exceeded', async () => {
      mockBytesInUse = 98000; // > 95% of 102400

      const status = await chromeSyncAdapter.getStatus();

      expect(status.state).toBe('failed');
    });

    it('should return failed when not configured', async () => {
      Object.defineProperty(global, 'chrome', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const status = await chromeSyncAdapter.getStatus();

      expect(status.state).toBe('failed');
    });
  });

  describe('mergeWithLocal', () => {
    it('should merge slim prompts with local prompts', async () => {
      const slimPrompts: SlimPrompt[] = [
        {
          id: '1',
          title: 'Sync Title',
          content: 'Sync Content',
          category: 'General',
          tags: [],
          shortcut: '',
          variables: [],
          favorite: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const localPrompts = [
        createTestPrompt('1', {
          versions: [{ id: 'v1', content: 'v1', createdAt: Date.now() }],
          useCount: 5,
        }),
        createTestPrompt('2'),
      ];

      const merged = await chromeSyncAdapter.mergeWithLocal(slimPrompts, localPrompts);

      expect(merged).toHaveLength(2);
      expect(merged[0].title).toBe('Sync Title');
      expect(merged[0].useCount).toBe(5);
    });

    it('should handle empty arrays', async () => {
      const localPrompts = [createTestPrompt('1')];

      const merged = await chromeSyncAdapter.mergeWithLocal([], localPrompts);
      expect(merged).toHaveLength(1);

      const merged2 = await chromeSyncAdapter.mergeWithLocal([], []);
      expect(merged2).toHaveLength(0);
    });
  });
});

describe('SyncServiceError', () => {
  it('should create error with code', () => {
    const originalError = new Error('Original error');
    const error = new SyncServiceError('Sync failed', 'CHROME_QUOTA_EXCEEDED', originalError);

    expect(error.message).toBe('Sync failed');
    expect(error.code).toBe('CHROME_QUOTA_EXCEEDED');
    expect(error.originalError).toBe(originalError);
    expect(error.name).toBe('SyncServiceError');
  });

  it('should create error without original error', () => {
    const error = new SyncServiceError('Sync failed', 'GIST_AUTH_FAILED');

    expect(error.message).toBe('Sync failed');
    expect(error.code).toBe('GIST_AUTH_FAILED');
    expect(error.originalError).toBeUndefined();
  });
});
