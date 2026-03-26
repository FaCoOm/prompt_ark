import { ChatGPTAdapter } from './content/platforms/chatgpt';
import { ClaudeAdapter } from './content/platforms/claude';
import type { PlatformAdapter } from './content/platforms/base';

const adapters: PlatformAdapter[] = [
  new ChatGPTAdapter(),
  new ClaudeAdapter(),
];

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    console.log('Prompt Ark content script loaded');

    const adapter = adapters.find((a) => a.detect());
    if (!adapter) {
      console.log('No matching platform adapter found');
      return;
    }

    console.log(`Detected platform: ${adapter.config.name}`);

    adapter.waitForReady().then(() => {
      initPlatformAdapter(adapter);
    });

    browser.runtime.onMessage.addListener((message: { type: string; payload?: unknown }) => {
      if (message.type === 'INSERT_PROMPT_CONTENT') {
        const payload = message.payload as { content: string; variables?: Record<string, string> };
        adapter.insertPrompt(payload.content, payload.variables);
      } else if (message.type === 'OPEN_PICKER') {
        window.postMessage({ type: 'PROMPT_ARK_OPEN' }, '*');
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'PROMPT_ARK_GRAB_CONTEXT') {
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
