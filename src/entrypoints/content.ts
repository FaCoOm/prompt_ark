import { defineContentScript } from 'wxt/sandbox';
import { detectPlatform, createPlatformAdapter } from '@platforms/base';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const platform = detectPlatform();
    const adapter = createPlatformAdapter(platform);

    console.log('[Content] Platform detected:', platform);

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      handleMessage(message, adapter, sendResponse).catch(err => {
        console.error('[Content] Error:', err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    });

    if (platform !== 'generic') {
      initializePlatformUI(adapter);
    }
  },
});

async function handleMessage(
  message: { type: string; [key: string]: unknown },
  adapter: ReturnType<typeof createPlatformAdapter>,
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'INSERT_PROMPT': {
      const { content } = message as unknown as { content: string };
      const input = adapter.findInput();
      if (!input) {
        sendResponse({ success: false, error: 'No input found' });
        return;
      }
      const success = await adapter.injectText(input, content);
      sendResponse({ success });
      break;
    }

    case 'GET_SELECTION': {
      const selection = window.getSelection()?.toString() || '';
      sendResponse({ text: selection });
      break;
    }

    case 'GET_PAGE_TEXT': {
      const text = document.body.innerText?.replace(/\s+/g, ' ').trim().substring(0, 5000) || '';
      sendResponse({ text });
      break;
    }

    case 'GET_PLATFORM': {
      sendResponse({ platform: adapter.name });
      break;
    }

    case 'COPY_TO_CLIPBOARD': {
      const { text } = message as unknown as { text: string };
      navigator.clipboard.writeText(text).catch(() => {});
      sendResponse({ success: true });
      break;
    }

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

function initializePlatformUI(adapter: ReturnType<typeof createPlatformAdapter>): void {
  const checkInterval = setInterval(() => {
    if (adapter.isReady()) {
      clearInterval(checkInterval);
      console.log('[Content] Platform ready, injecting UI...');
    }
  }, 1000);

  setTimeout(() => clearInterval(checkInterval), 30000);
}
