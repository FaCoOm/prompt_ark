/**
 * Lifecycle Module
 * Handles extension installation, updates, and startup
 */
import { browser } from 'wxt/browser';
import type { Browser } from 'wxt/browser';
import { PromptStorage } from '../../../src/shared/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default prompts to seed on first install
 */
const DEFAULT_PROMPTS = [
  {
    title: 'Professional Email Writer',
    content: 'Write a professional email about {{topic}}. Tone: {{tone:formal}}. Length: {{length:medium}}.',
    category: 'Productivity',
    tags: ['email', 'writing', 'professional'],
    shortcut: 'email',
  },
  {
    title: 'Code Review Assistant',
    content: 'Review the following code for best practices, potential bugs, and optimization opportunities:\n\n```\n{{code}}\n```',
    category: 'Coding',
    tags: ['code', 'review', 'development'],
    shortcut: 'review',
  },
  {
    title: 'Meeting Summarizer',
    content: 'Summarize the following meeting notes:\n\n{{notes}}\n\nFormat: Key decisions, action items, and follow-ups.',
    category: 'Productivity',
    tags: ['meeting', 'summary', 'notes'],
    shortcut: 'meeting',
  },
];

/**
 * Initialize lifecycle handlers
 */
export function initLifecycle(): void {
  browser.runtime.onInstalled.addListener(handleInstalled);
  browser.runtime.onStartup.addListener(handleStartup);
}

/**
 * Handle extension installation or update
 */
async function handleInstalled(details: Browser.runtime.InstalledDetails): Promise<void> {
  console.log('[Lifecycle] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    await handleFirstInstall();
  } else if (details.reason === 'update') {
    await handleUpdate(details.previousVersion);
  }
}

/**
 * Handle extension startup (browser restart)
 */
async function handleStartup(): Promise<void> {
  console.log('[Lifecycle] Extension startup');

  // Rebuild any ephemeral state here
  // e.g., rebuild context menus, clear stale caches
}

/**
 * Handle first-time installation
 * Seeds default prompts if storage is empty
 */
async function handleFirstInstall(): Promise<void> {
  console.log('[Lifecycle] First install - seeding default prompts');

  try {
    const existingPrompts = await PromptStorage.getPrompts();

    if (existingPrompts.length === 0) {
      const now = Date.now();
      const defaultPrompts = DEFAULT_PROMPTS.map((p, index) => ({
        id: uuidv4(),
        title: p.title,
        content: p.content,
        category: p.category,
        tags: p.tags,
        shortcut: p.shortcut,
        createdAt: now + index,
        updatedAt: now + index,
        useCount: 0,
        isFavorite: false,
        language: 'en',
        versions: [],
        builtIn: true,
      }));

      for (const prompt of defaultPrompts) {
        await PromptStorage.savePrompt(prompt);
      }

      console.log(`[Lifecycle] Seeded ${defaultPrompts.length} default prompts`);
    }
  } catch (error) {
    console.error('[Lifecycle] Failed to seed default prompts:', error);
  }
}

/**
 * Handle extension update
 * Perform any necessary data migrations
 */
async function handleUpdate(previousVersion?: string): Promise<void> {
  console.log('[Lifecycle] Updated from version:', previousVersion);

  // Perform data migrations here if needed
  // e.g., schema updates, format conversions
}
