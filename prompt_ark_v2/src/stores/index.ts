/**
 * @fileoverview Solid.js State Stores for Prompt Ark v2
 *
 * Unified export of all state management stores.
 * Each store manages a specific domain of application state
 * with auto-persistence to chrome.storage where applicable.
 */

export { promptStore } from './promptStore';
export { settingsStore } from './settingsStore';
export { historyStore } from './historyStore';
export { syncStore } from './syncStore';
export { uiStore, type ToastType } from './uiStore';

/**
 * Initialize all stores that need async setup
 * Call this once when the app starts
 */
export async function initializeStores(): Promise<void> {
  // Load persisted data
  await Promise.all([
    // promptStore loads on demand
    // settingsStore loads on demand
    // historyStore loads on demand
    syncStore.initialize(),
  ]);
}

/**
 * Re-export store types for convenience
 */
export type { PromptStoreState } from './promptStore';
export type { SettingsStoreState } from './settingsStore';
export type { HistoryStoreState } from './historyStore';
export type { SyncStoreState } from './syncStore';
export type { UIStoreState } from './uiStore';
