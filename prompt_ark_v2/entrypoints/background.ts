import type {
  Prompt,
  PromptFilter,
  PromptSort,
  CreatePromptDTO,
  UpdatePromptDTO,
  Settings,
} from '../src/types';
import { PromptStorage, SettingsStorage, ContextStorage } from '../src/shared/storage';
import { optimizePrompt, smartConvert } from '../src/shared/ai/optimize';
import { v4 as uuidv4 } from 'uuid';

export default defineBackground(() => {
  console.log('Prompt Ark background script initialized');

  browser.runtime.onMessage.addListener(async (message: { type: string; payload?: unknown }) => {
    try {
      switch (message.type) {
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
        case 'GET_SETTINGS':
          return handleGetSettings();
        case 'UPDATE_SETTINGS':
          return handleUpdateSettings(message.payload as { settings: Partial<Settings> });
        case 'OPTIMIZE_PROMPT':
          return handleOptimizePrompt(message.payload as { content: string; providerId: string; variant: 'concise' | 'enhanced' | 'professional' });
        case 'SMART_CONVERT':
          return handleSmartConvert(message.payload as { text: string; pageUrl: string; pageTitle: string; providerId?: string });
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
  });

  browser.runtime.onInstalled.addListener(() => {
    console.log('Prompt Ark installed');
  });

  setupContextMenus();
  setupCommands();
});

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

async function handleGetContext() {
  const context = await ContextStorage.getLatestContext();
  return { success: true, data: context };
}

function setupContextMenus(): void {
  browser.contextMenus.create({
    id: 'add-to-prompt-ark',
    title: 'Add to Prompt Ark',
    contexts: ['selection'],
  });

  browser.contextMenus.create({
    id: 'smart-convert',
    title: 'Smart Convert to Prompt',
    contexts: ['selection'],
  });

  browser.contextMenus.onClicked.addListener(async (info: { menuItemId: string | number; selectionText?: string }, tab: { id?: number; url?: string; title?: string } | undefined) => {
    if (!tab?.id) return;

    if (info.menuItemId === 'add-to-prompt-ark' && info.selectionText) {
      await handleSavePrompt({
        prompt: {
          title: '',
          content: info.selectionText,
          category: 'General',
          source: {
            type: 'manual',
            url: tab.url,
            title: tab.title,
          },
        },
      });
    } else if (info.menuItemId === 'smart-convert' && info.selectionText) {
      const result = await handleSmartConvert({
        text: info.selectionText,
        pageUrl: tab.url ?? '',
        pageTitle: tab.title ?? '',
      });

      if (result.success && result.data) {
        const data = result.data as { title: string; content: string; category: string; tags: string[] };
        await handleSavePrompt({
          prompt: {
            title: data.title,
            content: data.content,
            category: data.category,
            tags: data.tags,
            source: {
              type: 'smart-convert',
              url: tab.url,
              title: tab.title,
            },
          },
        });
      }
    }
  });
}

function setupCommands(): void {
  browser.commands.onCommand.addListener(async (command: string) => {
    if (command === 'open-picker') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'OPEN_PICKER' });
      }
    } else if (command === 'grab-context') {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, { type: 'GRAB_CONTEXT' });
      }
    }
  });
}
