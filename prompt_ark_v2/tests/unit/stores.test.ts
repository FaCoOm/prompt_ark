/**
 * @fileoverview Unit tests for Solid.js State Stores
 *
 * Tests promptStore, settingsStore, historyStore, syncStore, uiStore
 * Uses Vitest with mocks for storage dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock WXT storage before any imports
vi.mock('wxt/utils/storage', () => ({
  storage: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
  },
}));

vi.mock('@/core/storage', () => ({
  LocalStorage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  },
  SyncStorage: {
    get: vi.fn(async () => null),
    set: vi.fn(async () => ({ synced: true })),
    remove: vi.fn(async () => {}),
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => `test-uuid-${Date.now()}`),
  },
  writable: true,
  configurable: true,
});

// Mock chrome storage
const mockStorage = new Map<string, unknown>();

Object.defineProperty(global, 'chrome', {
  value: {
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[]) => {
          const result: Record<string, unknown> = {};
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            if (mockStorage.has(key)) {
              result[key] = mockStorage.get(key);
            }
          }
          return result;
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) {
            mockStorage.set(key, value);
          }
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          for (const key of keyArray) {
            mockStorage.delete(key);
          }
        }),
      },
      sync: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
        getBytesInUse: vi.fn(async () => 0),
      },
    },
    runtime: {
      sendMessage: vi.fn(async () => {}),
      getPlatformInfo: vi.fn(async () => ({})),
    },
  },
  writable: true,
  configurable: true,
});

// Mock document for UI store
Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      classList: {
        toggle: vi.fn(),
      },
    },
  },
  writable: true,
  configurable: true,
});

// Mock services/sync
vi.mock('../../src/services/sync', () => ({
  SyncManager: {
    getConfig: vi.fn(async () => ({ backend: 'chrome' })),
    saveConfig: vi.fn(async () => {}),
    getStatus: vi.fn(async () => ({ state: 'idle', backend: 'chrome' })),
    sync: vi.fn(async () => ({ success: true })),
    testConnection: vi.fn(async () => ({ success: true })),
  },
}));

// Mock shared/storage
vi.mock('../../src/shared/storage', () => ({
  PromptStorage: {
    getPrompts: vi.fn(async () => []),
    savePrompt: vi.fn(async () => {}),
    deletePrompt: vi.fn(async () => {}),
  },
  SettingsStorage: {
    getSettings: vi.fn(async () => ({
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
    })),
    saveSettings: vi.fn(async () => {}),
  },
  HistoryStorage: {
    getHistory: vi.fn(async () => []),
    addHistory: vi.fn(async () => {}),
  },
}));

// Import stores after mocks are set up
import { promptStore } from '../../src/stores/promptStore';
import { settingsStore } from '../../src/stores/settingsStore';
import { historyStore } from '../../src/stores/historyStore';
import { syncStore } from '../../src/stores/syncStore';
import { uiStore } from '../../src/stores/uiStore';
import type { Prompt, PromptFilter, PromptSort } from '../../src/types';

// Helper to create test prompts
const createTestPrompt = (id: string, overrides = {}): Prompt => ({
  id,
  title: `Test Prompt ${id}`,
  content: `Content for ${id}`,
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

describe('promptStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('should have initial state', () => {
      expect(promptStore.state.prompts).toEqual([]);
      expect(promptStore.state.filteredPrompts).toEqual([]);
      expect(promptStore.state.selectedPrompt).toBeNull();
      expect(promptStore.state.isLoading).toBe(false);
      expect(promptStore.state.searchQuery).toBe('');
    });

    it('should set search query', () => {
      promptStore.setSearchQuery('test');
      expect(promptStore.state.searchQuery).toBe('test');
    });

    it('should set filter', () => {
      const filter: PromptFilter = { category: 'Work', isFavorite: true };
      promptStore.setFilter(filter);
      expect(promptStore.state.filter.category).toBe('Work');
      expect(promptStore.state.filter.isFavorite).toBe(true);
    });

    it('should set sort', () => {
      const sort: PromptSort = { by: 'title', order: 'asc' };
      promptStore.setSort(sort);
      expect(promptStore.state.sort.by).toBe('title');
      expect(promptStore.state.sort.order).toBe('asc');
    });

    it('should select a prompt', () => {
      const prompt = createTestPrompt('1');
      promptStore.selectPrompt(prompt);
      expect(promptStore.state.selectedPrompt).toEqual(prompt);
    });

    it('should deselect prompt when null is passed', () => {
      const prompt = createTestPrompt('1');
      promptStore.selectPrompt(prompt);
      promptStore.selectPrompt(null);
      expect(promptStore.state.selectedPrompt).toBeNull();
    });
  });

  describe('prompt CRUD operations', () => {
    it('should save a new prompt', async () => {
      const promptData = {
        title: 'New Prompt',
        content: 'New Content',
        category: 'Test',
        tags: ['test'],
        shortcut: 'test',
        isFavorite: false,
      };

      const saved = await promptStore.savePrompt(promptData);

      expect(saved.id).toBeDefined();
      expect(saved.title).toBe('New Prompt');
      expect(saved.content).toBe('New Content');
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should update an existing prompt', async () => {
      const saved = await promptStore.savePrompt({
        title: 'Original Title',
        content: 'Original Content',
        category: 'Test',
        tags: [],
        shortcut: 'test',
        isFavorite: false,
      });

      await promptStore.updatePrompt(saved.id, { title: 'Updated Title' });

      const updated = promptStore.state.prompts.find(p => p.id === saved.id);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should not update non-existent prompt', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await promptStore.updatePrompt('non-existent', { title: 'New Title' });
      
      consoleSpy.mockRestore();
    });

    it('should delete a prompt', async () => {
      const saved = await promptStore.savePrompt({
        title: 'To Delete',
        content: 'Content',
        category: 'Test',
        tags: [],
        shortcut: 'test',
        isFavorite: false,
      });

      await promptStore.deletePrompt(saved.id);

      const deleted = promptStore.state.prompts.find(p => p.id === saved.id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('filtering and sorting', () => {
    beforeEach(async () => {
      await Promise.all([
        promptStore.savePrompt({
          title: 'Email Template',
          content: 'Write an email',
          category: 'Work',
          tags: ['email', 'professional'],
          shortcut: 'email',
          isFavorite: true,
          useCount: 5,
        }),
        promptStore.savePrompt({
          title: 'Code Review',
          content: 'Review code',
          category: 'Development',
          tags: ['code', 'review'],
          shortcut: 'review',
          isFavorite: false,
          useCount: 10,
        }),
        promptStore.savePrompt({
          title: 'Meeting Notes',
          content: 'Take notes',
          category: 'Work',
          tags: ['meeting'],
          shortcut: 'notes',
          isFavorite: false,
          useCount: 3,
        }),
      ]);
    });

    it('should filter by search query', () => {
      promptStore.setSearchQuery('email');
      expect(promptStore.state.filteredPrompts.length).toBe(1);
      expect(promptStore.state.filteredPrompts[0].title).toBe('Email Template');
    });

    it('should filter by category', () => {
      promptStore.setFilter({ category: 'Work' });
      expect(promptStore.state.filteredPrompts.length).toBe(2);
    });

    it('should filter by favorite', () => {
      promptStore.setFilter({ isFavorite: true });
      expect(promptStore.state.filteredPrompts.length).toBe(1);
      expect(promptStore.state.filteredPrompts[0].isFavorite).toBe(true);
    });

    it('should search in tags', () => {
      promptStore.setSearchQuery('review');
      expect(promptStore.state.filteredPrompts.length).toBe(1);
    });

    it('should sort by title ascending', () => {
      promptStore.setSort({ by: 'title', order: 'asc' });
      const titles = promptStore.state.filteredPrompts.map(p => p.title);
      expect(titles[0]).toBe('Code Review');
    });

    it('should sort by title descending', () => {
      promptStore.setSort({ by: 'title', order: 'desc' });
      const titles = promptStore.state.filteredPrompts.map(p => p.title);
      expect(titles[0]).toBe('Meeting Notes');
    });

    it('should sort by usage count', () => {
      promptStore.setSort({ by: 'used', order: 'desc' });
      const counts = promptStore.state.filteredPrompts.map(p => p.useCount || 0);
      expect(counts[0]).toBeGreaterThanOrEqual(counts[1]);
    });
  });
});

describe('settingsStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('should have default settings', () => {
    expect(settingsStore.state.settings.language).toBe('zh-CN');
    expect(settingsStore.state.settings.theme).toBe('auto');
    expect(settingsStore.state.settings.syncEngine).toBe('chrome');
    expect(settingsStore.state.settings.imagePromptEnabled).toBe(false);
  });

  it('should update settings', async () => {
    const updates = {
      language: 'en' as const,
      theme: 'dark' as const,
    };

    await settingsStore.updateSettings(updates);

    expect(settingsStore.state.settings.language).toBe('en');
    expect(settingsStore.state.settings.theme).toBe('dark');
  });

  it('should set language', async () => {
    await settingsStore.setLanguage('en');
    expect(settingsStore.state.settings.language).toBe('en');
  });

  it('should set theme', async () => {
    await settingsStore.setTheme('light');
    expect(settingsStore.state.settings.theme).toBe('light');
  });
});

describe('historyStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    expect(historyStore.state.history).toEqual([]);
    expect(historyStore.state.isLoading).toBe(false);
    expect(historyStore.state.hasMore).toBe(true);
    expect(historyStore.state.page).toBe(1);
  });

  it('should add history entry', async () => {
    const entry = {
      promptId: 'test-prompt',
      promptTitle: 'Test Prompt',
      usedAt: Date.now(),
      platform: 'chatgpt',
    };

    await historyStore.addHistory(entry);

    expect(historyStore.state.history.length).toBeGreaterThan(0);
  });

  it('should get history by prompt id', async () => {
    const promptId = 'test-prompt';
    
    await historyStore.addHistory({
      promptId,
      promptTitle: 'Test Prompt',
      usedAt: Date.now(),
      platform: 'chatgpt',
    });

    const history = historyStore.getHistoryByPromptId(promptId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].promptId).toBe(promptId);
  });

  it('should calculate recent usage count', async () => {
    const promptId = 'test-prompt';
    
    await historyStore.addHistory({
      promptId,
      promptTitle: 'Test Prompt',
      usedAt: Date.now(),
      platform: 'chatgpt',
    });

    const count = historyStore.getRecentUsageCount(promptId, 30);
    expect(count).toBeGreaterThan(0);
  });

  it('should clear history', () => {
    historyStore.clearHistory();
    expect(historyStore.state.history).toEqual([]);
    expect(historyStore.state.hasMore).toBe(false);
  });
});

describe('syncStore', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    expect(syncStore.state.status.state).toBe('idle');
    expect(syncStore.state.status.backend).toBe('chrome');
    expect(syncStore.state.config.backend).toBe('chrome');
    expect(syncStore.state.isLoading).toBe(false);
  });

  it('should update config', async () => {
    const newConfig = {
      backend: 'gist' as const,
      gistToken: 'test-token',
    };

    await syncStore.updateConfig(newConfig);

    expect(syncStore.state.config.backend).toBe('gist');
    expect(syncStore.state.status.backend).toBe('gist');
  });

  it('should set backend', async () => {
    await syncStore.setBackend('webdav');
    expect(syncStore.state.config.backend).toBe('webdav');
  });

  it('should set sync state', () => {
    syncStore.setSyncState('syncing');
    expect(syncStore.state.status.state).toBe('syncing');

    syncStore.setSyncState('synced');
    expect(syncStore.state.status.state).toBe('synced');
  });

  it('should clear error', () => {
    syncStore.state.lastError = 'Test error';
    syncStore.clearError();
    expect(syncStore.state.lastError).toBeUndefined();
  });
});

describe('uiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have initial state', () => {
    expect(uiStore.state.sidebarOpen).toBe(false);
    expect(uiStore.state.activeRoute).toBe('/');
    expect(uiStore.state.activeModal).toBeNull();
    expect(uiStore.state.toasts).toEqual([]);
    expect(uiStore.state.isDarkMode).toBe(false);
    expect(uiStore.state.globalLoading).toBe(false);
  });

  describe('sidebar', () => {
    it('should toggle sidebar', () => {
      uiStore.toggleSidebar();
      expect(uiStore.state.sidebarOpen).toBe(true);
      uiStore.toggleSidebar();
      expect(uiStore.state.sidebarOpen).toBe(false);
    });

    it('should set sidebar open state', () => {
      uiStore.setSidebarOpen(true);
      expect(uiStore.state.sidebarOpen).toBe(true);
      uiStore.setSidebarOpen(false);
      expect(uiStore.state.sidebarOpen).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should set active route', () => {
      uiStore.setActiveRoute('/settings');
      expect(uiStore.state.activeRoute).toBe('/settings');
    });
  });

  describe('modals', () => {
    it('should open modal', () => {
      uiStore.openModal('test-modal', { foo: 'bar' });
      expect(uiStore.state.activeModal).toBe('test-modal');
      expect(uiStore.state.modalData).toEqual({ foo: 'bar' });
    });

    it('should close modal', () => {
      uiStore.openModal('test-modal');
      uiStore.closeModal();
      expect(uiStore.state.activeModal).toBeNull();
      expect(uiStore.state.modalData).toEqual({});
    });
  });

  describe('toasts', () => {
    it('should show toast', () => {
      uiStore.showToast('Test message', 'info', 0);
      expect(uiStore.state.toasts.length).toBe(1);
      expect(uiStore.state.toasts[0].message).toBe('Test message');
      expect(uiStore.state.toasts[0].type).toBe('info');
    });

    it('should show success toast', () => {
      uiStore.showSuccess('Success!', 0);
      expect(uiStore.state.toasts[0].type).toBe('success');
    });

    it('should show error toast', () => {
      uiStore.showError('Error!', 0);
      expect(uiStore.state.toasts[0].type).toBe('error');
    });

    it('should show warning toast', () => {
      uiStore.showWarning('Warning!', 0);
      expect(uiStore.state.toasts[0].type).toBe('warning');
    });

    it('should show info toast', () => {
      uiStore.showInfo('Info!', 0);
      expect(uiStore.state.toasts[0].type).toBe('info');
    });

    it('should dismiss toast', () => {
      uiStore.showToast('Test', 'info', 0);
      const toastId = uiStore.state.toasts[0].id;
      uiStore.dismissToast(toastId);
      expect(uiStore.state.toasts.length).toBe(0);
    });

    it('should dismiss all toasts', () => {
      uiStore.showToast('Test 1', 'info', 0);
      uiStore.showToast('Test 2', 'info', 0);
      uiStore.dismissAllToasts();
      expect(uiStore.state.toasts.length).toBe(0);
    });
  });

  describe('theme', () => {
    it('should set dark mode', () => {
      uiStore.setDarkMode(true);
      expect(uiStore.state.isDarkMode).toBe(true);
    });

    it('should toggle dark mode', () => {
      uiStore.setDarkMode(false);
      uiStore.toggleDarkMode();
      expect(uiStore.state.isDarkMode).toBe(true);
      uiStore.toggleDarkMode();
      expect(uiStore.state.isDarkMode).toBe(false);
    });
  });

  describe('loading', () => {
    it('should set global loading', () => {
      uiStore.setGlobalLoading(true, 'Loading...');
      expect(uiStore.state.globalLoading).toBe(true);
      expect(uiStore.state.loadingMessage).toBe('Loading...');
    });
  });

  describe('search', () => {
    it('should set search query', () => {
      uiStore.setSearchQuery('test query');
      expect(uiStore.state.searchQuery).toBe('test query');
    });

    it('should set search focused', () => {
      uiStore.setSearchFocused(true);
      expect(uiStore.state.searchFocused).toBe(true);
    });
  });

  describe('selection', () => {
    it('should select prompt', () => {
      uiStore.selectPrompt('prompt-1');
      expect(uiStore.state.selectedPromptIds).toContain('prompt-1');
    });

    it('should not duplicate selection', () => {
      uiStore.selectPrompt('prompt-1');
      uiStore.selectPrompt('prompt-1');
      expect(uiStore.state.selectedPromptIds.filter(id => id === 'prompt-1').length).toBe(1);
    });

    it('should deselect prompt', () => {
      uiStore.selectPrompt('prompt-1');
      uiStore.deselectPrompt('prompt-1');
      expect(uiStore.state.selectedPromptIds).not.toContain('prompt-1');
    });

    it('should toggle prompt selection', () => {
      uiStore.togglePromptSelection('prompt-1');
      expect(uiStore.state.selectedPromptIds).toContain('prompt-1');
      uiStore.togglePromptSelection('prompt-1');
      expect(uiStore.state.selectedPromptIds).not.toContain('prompt-1');
    });

    it('should select all prompts', () => {
      uiStore.selectAllPrompts(['p1', 'p2', 'p3']);
      expect(uiStore.state.selectedPromptIds).toEqual(['p1', 'p2', 'p3']);
    });

    it('should clear selection', () => {
      uiStore.selectAllPrompts(['p1', 'p2']);
      uiStore.clearSelection();
      expect(uiStore.state.selectedPromptIds).toEqual([]);
    });

    it('should check if prompt is selected', () => {
      uiStore.selectPrompt('prompt-1');
      expect(uiStore.isPromptSelected('prompt-1')).toBe(true);
      expect(uiStore.isPromptSelected('prompt-2')).toBe(false);
    });
  });
});
