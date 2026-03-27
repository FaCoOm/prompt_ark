/**
 * Background Script Main Entry Point
 * Modular background script for Prompt Ark v2
 *
 * Imports and initializes all background modules:
 * - Messaging: Handles chrome.runtime.onMessage events
 * - Context Menu: Right-click menu handlers
 * - Commands: Keyboard shortcuts
 * - Sync: Synchronization scheduling
 * - Lifecycle: Install/update/startup handlers
 */
import { initMessaging } from './messaging';
import { initContextMenu } from './context-menu';
import { initCommands } from './commands';
import { initSync } from './sync';
import { initLifecycle } from './lifecycle';

/**
 * Initialize all background modules
 */
export default defineBackground(() => {
  console.log('[Background] Prompt Ark v2 background script initialized');

  // Initialize messaging handlers (prompt CRUD, settings, AI operations)
  initMessaging();

  // Initialize context menu (right-click "Add to Prompt Ark", "Smart Convert")
  initContextMenu();

  // Initialize keyboard commands (Ctrl+Shift+P, Ctrl+Shift+G)
  initCommands();

  // Initialize sync scheduling (Chrome Sync, Gist, WebDAV)
  initSync();

  // Initialize lifecycle handlers (install, update, startup)
  initLifecycle();

  // Initialize side panel if available
  setupSidePanel();

  console.log('[Background] All modules initialized');
});

/**
 * Setup side panel behavior
 */
function setupSidePanel(): void {
  if (browser.sidePanel) {
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error: Error) => {
        console.error('[Background] Side panel setup failed:', error);
      });
  }
}
