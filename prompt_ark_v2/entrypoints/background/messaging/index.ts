/**
 * Messaging Module
 * Handles all chrome.runtime.onMessage events from content scripts and popup
 */
import type {
  Prompt,
  PromptFilter,
  PromptSort,
  CreatePromptDTO,
  UpdatePromptDTO,
  Settings,
} from '../../src/types';
import { PromptStorage, SettingsStorage, ContextStorage } from '../../src/shared/storage';
import { optimizePrompt, smartConvert } from '../../src/shared/ai/optimize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize messaging handlers
 */
export function initMessaging(): void {
  browser.runtime.onMessage.addListener(handleMessage);
}

/**
 * Main message handler
 */
async function handleMessage(
  message: { type: string; payload?: unknown },
  sender: browser.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
): Promise<unknown> {
  try {
    switch (message.type) {
      // Prompt CRUD operations
      case 'GET_PROMPTS':
        return handleGetPrompts(message.payload as { filter?: PromptFilter; sort?: PromptSort; page?: number; pageSize?: number });
      case 'SAVE_PROMPT':
        return handleSavePrompt(message.payload as { prompt: CreatePromptDTO });
      case 'UPDATE_PROMPT':
        return handleUpdatePrompt(message.payload as { id: string; updates: UpdatePromptDTO });
      case 'DELETE_PROMPT':
        return handleDeletePrompt(message.payload as { id: string });
      case 'INSERT_PROMPT':
        return handleInsertPrompt(message.payload as { promptId: string; variables?: Record<string, string>; targetTabId: number });

      // Settings operations
      case 'GET_SETTINGS':
        return handleGetSettings();
      case 'UPDATE_SETTINGS':
        return handleUpdateSettings(message.payload as { settings: Partial<Settings> });

      // AI operations
      case 'OPTIMIZE_PROMPT':
        return handleOptimizePrompt(message.payload as { content: string; providerId: string; variant: 'concise' | 'enhanced' | 'professional' });
      case 'SMART_CONVERT':
        return handleSmartConvert(message.payload as { text: string; pageUrl: string; pageTitle: string; providerId?: string });

      // Context operations
      case 'GET_CONTEXT':
        return handleGetContext();

      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============ Prompt Handlers ============

async function handleGetPrompts(payload?: { filter?: PromptFilter; sort?: PromptSort; page?: number; pageSize?: number }) {
  const prompts = await PromptStorage.getPrompts();
  const { filter, sort, page = 1, pageSize = 20 } = payload ?? {};

  let filtered = prompts;

  if (filter?.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search)
    );
  }

  if (filter?.category) {
    filtered = filtered.filter((p) => p.category === filter.category);
  }

  if (sort) {
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sort.by) {
        case 'created':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updated':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'used':
          comparison = (a.useCount || 0) - (b.useCount || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sort.order === 'asc' ? comparison : -comparison;
    });
  }

  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      prompts: paginated,
      total: filtered.length,
      page,
      pageSize,
    },
  };
}

async function handleSavePrompt(payload: { prompt: CreatePromptDTO }) {
  const now = Date.now();
  const prompt: Prompt = {
    id: uuidv4(),
    ...payload.prompt,
    tags: payload.prompt.tags ?? [],
    shortcut: payload.prompt.shortcut ?? '',
    createdAt: now,
    updatedAt: now,
    useCount: 0,
    isFavorite: false,
    language: payload.prompt.language ?? 'zh-CN',
    versions: [],
  };

  await PromptStorage.savePrompt(prompt);
  return { success: true, data: prompt };
}

async function handleUpdatePrompt(payload: { id: string; updates: UpdatePromptDTO }) {
  const existing = await PromptStorage.getPromptById(payload.id);
  if (!existing) {
    throw new Error('Prompt not found');
  }

  const updated: Prompt = {
    ...existing,
    ...payload.updates,
    updatedAt: Date.now(),
  };

  await PromptStorage.savePrompt(updated);
  return { success: true, data: updated };
}

async function handleDeletePrompt(payload: { id: string }) {
  await PromptStorage.deletePrompt(payload.id);
  return { success: true };
}

async function handleInsertPrompt(payload: { promptId: string; variables?: Record<string, string>; targetTabId: number }) {
  const prompt = await PromptStorage.getPromptById(payload.promptId);
  if (!prompt) {
    return { success: false, error: 'Prompt not found' };
  }

  try {
    await browser.tabs.sendMessage(payload.targetTabId, {
      type: 'INSERT_PROMPT_CONTENT',
      payload: {
        content: prompt.content,
        variables: payload.variables,
      },
    });

    prompt.useCount = (prompt.useCount || 0) + 1;
    prompt.lastUsedAt = Date.now();
    await PromptStorage.savePrompt(prompt);

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to insert prompt' };
  }
}

// ============ Settings Handlers ============

async function handleGetSettings() {
  const settings = await SettingsStorage.getSettings();
  return { success: true, data: settings };
}

async function handleUpdateSettings(payload: { settings: Partial<Settings> }) {
  const current = await SettingsStorage.getSettings();
  const updated = { ...current, ...payload.settings };
  await SettingsStorage.saveSettings(updated);
  return { success: true, data: updated };
}

// ============ AI Handlers ============

async function handleOptimizePrompt(payload: { content: string; providerId: string; variant: 'concise' | 'enhanced' | 'professional' }) {
  const result = await optimizePrompt({
    content: payload.content,
    providerId: payload.providerId,
    variant: payload.variant,
  });
  return { success: true, data: result };
}

async function handleSmartConvert(payload: { text: string; pageUrl: string; pageTitle: string; providerId?: string }) {
  const settings = await SettingsStorage.getSettings();
  const providerId = payload.providerId ?? settings.defaultProviderId;

  if (!providerId) {
    return { success: false, error: 'No AI provider configured' };
  }

  const result = await smartConvert({
    text: payload.text,
    pageContext: {
      url: payload.pageUrl,
      title: payload.pageTitle,
    },
    providerId,
  });

  return { success: true, data: result };
}

// ============ Context Handlers ============

async function handleGetContext() {
  const context = await ContextStorage.getLatestContext();
  return { success: true, data: context };
}
