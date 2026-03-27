import { browser } from 'wxt/browser';
import { detectPlatform, type PlatformAdapter } from './content/platforms';
import { PromptPicker, type Prompt } from './content/ui/picker';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log('Prompt Ark content script loaded');

    const adapter = detectPlatform();
    if (!adapter) {
      console.log('No matching platform adapter found');
      return;
    }

    console.log(`Detected platform: ${adapter.config.name}`);

    let picker: PromptPicker | null = null;

    adapter.waitForReady().then(() => {
      initPlatformAdapter(adapter);
    });

    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message: { type: string; payload?: unknown }) => {
      if (message.type === 'INSERT_PROMPT_CONTENT') {
        const payload = message.payload as { content: string; variables?: Record<string, string> };
        adapter.insertPrompt(payload.content, payload.variables);
      } else if (message.type === 'OPEN_PICKER') {
        showPicker(adapter);
      } else if (message.type === 'GRAB_CONTEXT') {
        // Handle context grab from keyboard shortcut
        const selection = window.getSelection()?.toString() ?? '';
        browser.runtime.sendMessage({
          type: 'GRAB_CONTEXT',
          payload: {
            pageTitle: document.title,
            pageUrl: window.location.href,
            selection,
            pageText: document.body.innerText.slice(0, 5000),
          },
        });
      }
    });

    // Listen for messages from injected page scripts
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'PROMPT_ARK_OPEN') {
        showPicker(adapter);
      } else if (event.data?.type === 'PROMPT_ARK_GRAB_CONTEXT') {
        const selection = window.getSelection()?.toString() ?? '';
        browser.runtime.sendMessage({
          type: 'GRAB_CONTEXT',
          payload: {
            pageTitle: document.title,
            pageUrl: window.location.href,
            selection,
            pageText: document.body.innerText.slice(0, 5000),
          },
        });
      }
    });

    async function showPicker(adapter: PlatformAdapter) {
      try {
        // Fetch prompts from background
        const response = await browser.runtime.sendMessage({ type: 'GET_PROMPTS' }) as { success: boolean; data?: { prompts: Prompt[] } };
        
        if (!response?.success || !response.data?.prompts) {
          console.error('[PromptArk] Failed to fetch prompts');
          return;
        }

        if (picker) {
          picker.hide();
          picker = null;
          return;
        }

        picker = new PromptPicker({
          prompts: response.data.prompts,
          onSelect: (prompt) => {
            adapter.insertPrompt(prompt.content, {});
            picker?.hide();
            picker = null;
          },
          onClose: () => {
            picker = null;
          },
        });

        picker.show();
      } catch (error) {
        console.error('[PromptArk] Error showing picker:', error);
      }
    }
  },
});

function initPlatformAdapter(adapter: PlatformAdapter): void {
  const checkInterval = setInterval(() => {
    const inputContainer = adapter.findInputArea()?.parentElement;
    if (inputContainer) {
      adapter.injectPromptButton(inputContainer);
      clearInterval(checkInterval);
    }
  }, 1000);

  setTimeout(() => clearInterval(checkInterval), 30000);
}