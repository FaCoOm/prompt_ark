import { BasePlatformAdapter } from './base';
import type { PlatformConfig } from './base';

export class DeepSeekAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'deepseek',
    matches: ['https://chat.deepseek.com/*'],
    selectors: {
      messageContainer: ['[class*="chat"]', '[class*="conversation"]', 'main'],
      inputArea: ['textarea#chat-input', 'textarea[placeholder*="Message"]', 'textarea'],
      sendButton: ['button[class*="send"]', 'button[type="submit"]', '[data-testid="send-button"]'],
      generatingIndicator: ['[class*="loading"]', '[class*="generating"]', '[class*="streaming"]'],
      message: ['[class*="message"]', '[class*="bubble"]'],
      userRoleIndicator: ['[class*="user"]', '[data-role="user"]'],
      assistantRoleIndicator: ['[class*="assistant"]', '[class*="ai"]', '[data-role="assistant"]'],
    },
    features: {
      supportsMultiTurn: true,
      supportsFileUpload: true,
      supportsVision: false,
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
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid #e5e7eb;
      background: white;
      color: #4f46e5;
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
