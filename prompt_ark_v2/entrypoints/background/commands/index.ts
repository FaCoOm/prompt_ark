/**
 * Commands Module
 * Handles keyboard shortcuts (Ctrl+Shift+P, Ctrl+Shift+G)
 */

/**
 * Initialize command handlers for keyboard shortcuts
 */
export function initCommands(): void {
  browser.commands.onCommand.addListener(handleCommand);
}

/**
 * Handle keyboard commands
 */
async function handleCommand(command: string): Promise<void> {
  switch (command) {
    case 'open-picker':
      await handleOpenPicker();
      break;
    case 'grab-context':
      await handleGrabContext();
      break;
    default:
      console.warn(`[Commands] Unknown command: ${command}`);
  }
}

/**
 * Handle open-picker command (Ctrl+Shift+P)
 * Sends message to active tab to open the prompt picker
 */
async function handleOpenPicker(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await browser.tabs.sendMessage(tab.id, { type: 'OPEN_PICKER' });
    } catch {
      // Tab may not have content script injected
      console.warn('[Commands] Failed to open picker - content script not available');
    }
  }
}

/**
 * Handle grab-context command (Ctrl+Shift+G)
 * Sends message to active tab to grab page context
 */
async function handleGrabContext(): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await browser.tabs.sendMessage(tab.id, { type: 'GRAB_CONTEXT' });
    } catch {
      // Tab may not have content script injected
      console.warn('[Commands] Failed to grab context - content script not available');
    }
  }
}
