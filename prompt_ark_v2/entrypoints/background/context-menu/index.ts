/**
 * Context Menu Module
 * Handles right-click context menus for "Add to Prompt Ark" and "Smart Convert"
 */
import { PromptStorage } from '../../src/shared/storage';
import { smartConvert } from '../../src/shared/ai/optimize';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize context menu handlers
 */
export function initContextMenu(): void {
  setupContextMenus();

  browser.contextMenus.onClicked.addListener(handleContextMenuClick);
}

/**
 * Setup context menu items
 */
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
}

/**
 * Handle context menu clicks
 */
async function handleContextMenuClick(
  info: { menuItemId: string | number; selectionText?: string },
  tab: { id?: number; url?: string; title?: string } | undefined
): Promise<void> {
  if (!tab?.id) return;

  if (info.menuItemId === 'add-to-prompt-ark' && info.selectionText) {
    await handleAddToPromptArk(info.selectionText, tab);
  } else if (info.menuItemId === 'smart-convert' && info.selectionText) {
    await handleSmartConvert(info.selectionText, tab);
  }
}

/**
 * Handle "Add to Prompt Ark" - save selected text as a prompt
 */
async function handleAddToPromptArk(
  selectionText: string,
  tab: { url?: string; title?: string }
): Promise<void> {
  const prompt = {
    id: uuidv4(),
    title: '',
    content: selectionText,
    category: 'General',
    tags: [],
    shortcut: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    useCount: 0,
    isFavorite: false,
    language: 'zh-CN',
    versions: [],
    source: {
      type: 'manual' as const,
      url: tab.url,
      title: tab.title,
    },
  };

  await PromptStorage.savePrompt(prompt);
}

/**
 * Handle "Smart Convert" - use AI to convert selected text into a structured prompt
 */
async function handleSmartConvert(
  selectionText: string,
  tab: { url?: string; title?: string }
): Promise<void> {
  const result = await smartConvert({
    text: selectionText,
    pageContext: {
      url: tab.url ?? '',
      title: tab.title ?? '',
    },
  });

  if (result) {
    const prompt = {
      id: uuidv4(),
      title: result.title || '',
      content: result.content,
      category: result.category || 'General',
      tags: result.tags || [],
      shortcut: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: 0,
      isFavorite: false,
      language: 'zh-CN',
      versions: [],
      source: {
        type: 'smart-convert' as const,
        url: tab.url,
        title: tab.title,
      },
    };

    await PromptStorage.savePrompt(prompt);
  }
}
