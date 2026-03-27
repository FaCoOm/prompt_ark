import { BasePlatformAdapter } from './base';
import type { PlatformConfig } from './base';

export class GrokAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'grok',
    matches: ['https://grok.x.ai/*', 'https://grok.com/*'],
    selectors: {
      messageContainer: ['[class*="chat"]', '[class*="conversation"]', 'main'],
      inputArea: ['textarea[placeholder]', 'div[contenteditable="true"]', 'textarea'],
      sendButton: ['button[class*="send"]', 'button[type="submit"]', '[data-testid="send-button"]'],
      generatingIndicator: ['[class*="loading"]', '[class*="generating"]', '[class*="streaming"]'],
      message: ['[class*="message"]', '[class*="bubble"]'],
      userRoleIndicator: ['[class*="user"]', '[data-role="user"]'],
      assistantRoleIndicator: ['[class*="assistant"]', '[class*="ai"]', '[data-role="assistant"]'],
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
      right: 50px;
      bottom: 10px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: white;
      color: #6366f1;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
      transition: all 0.2s ease;
    `;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      button.style.background = '#1f2937';
      button.style.borderColor = '#374151';
      button.style.color = '#818cf8';
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
