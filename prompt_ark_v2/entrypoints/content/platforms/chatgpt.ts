import { BasePlatformAdapter } from './base';
import type { PlatformConfig } from './base';

export class ChatGPTAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'chatgpt',
    matches: ['https://chatgpt.com/*', 'https://chat.openai.com/*'],
    selectors: {
      messageContainer: ['[class*="conversation"]'],
      inputArea: ['#prompt-textarea', '[contenteditable="true"]'],
      sendButton: ['button[data-testid="send-button"]', 'button[class*="send"]'],
      generatingIndicator: ['.loading', '[class*="generating"]'],
      message: ['[data-testid="conversation-turn"]'],
      userRoleIndicator: ['[class*="user"]'],
      assistantRoleIndicator: ['[class*="assistant"]'],
    },
    features: {
      supportsMultiTurn: true,
      supportsFileUpload: true,
      supportsVision: true,
      requiresSpecialSend: false,
      inputType: 'textarea',
    },
  };

  injectPromptButton(container: HTMLElement): HTMLElement | null {
    const existing = container.querySelector('#prompt-ark-btn');
    if (existing) return null;

    const button = document.createElement('button');
    button.id = 'prompt-ark-btn';
    button.textContent = '✨';
    button.title = 'Open Prompt Ark';
    button.style.cssText = `
      position: absolute;
      right: 60px;
      bottom: 12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: #10a37f;
      color: white;
      cursor: pointer;
      font-size: 16px;
      z-index: 1000;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.postMessage({ type: 'PROMPT_ARK_OPEN' }, '*');
    });

    container.style.position = 'relative';
    container.appendChild(button);
    this.injectedElements.push(button);

    return button;
  }
}
