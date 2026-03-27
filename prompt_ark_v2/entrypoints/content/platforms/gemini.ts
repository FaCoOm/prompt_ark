import { BasePlatformAdapter } from './base';
import type { PlatformConfig } from './base';

export class GeminiAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'gemini',
    matches: ['https://gemini.google.com/*'],
    selectors: {
      messageContainer: ['chat-window', '[class*="chat"]', 'main'],
      inputArea: ['rich-textarea div[contenteditable="true"]', 'div[role="textbox"]', '.ql-editor'],
      sendButton: ['button[aria-label="Send"]', 'button[class*="send"]', '[data-testid="send-button"]'],
      generatingIndicator: ['[class*="loading"]', '[class*="generating"]', '[class*="streaming"]'],
      message: ['[class*="message"]', '[data-testid="message"]'],
      userRoleIndicator: ['[class*="user"]', '[data-testid="user-message"]'],
      assistantRoleIndicator: ['[class*="model"]', '[class*="assistant"]', '[data-testid="model-message"]'],
    },
    features: {
      supportsMultiTurn: true,
      supportsFileUpload: true,
      supportsVision: true,
      requiresSpecialSend: false,
      inputType: 'contenteditable',
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
      right: 50px;
      bottom: 10px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #dadce0;
      background: white;
      color: #4285f4;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      transition: all 0.2s ease;
    `;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      button.style.background = '#3c4043';
      button.style.borderColor = '#5f6368';
      button.style.color = '#8ab4f8';
    }

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

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
