import { BasePlatformAdapter } from './base';
import type { PlatformConfig } from './base';

export class ClaudeAdapter extends BasePlatformAdapter {
  readonly config: PlatformConfig = {
    name: 'claude',
    matches: ['https://claude.ai/*', 'https://*.claude.ai/*'],
    selectors: {
      messageContainer: ['[class*="chat-content"]'],
      inputArea: ['div[contenteditable="true"]', '[class*="input"]'],
      sendButton: ['button[type="submit"]', '[class*="send-button"]'],
      generatingIndicator: ['[class*="loading"]', '[class*="streaming"]'],
      message: ['[class*="message"]'],
      userRoleIndicator: ['[class*="human"]'],
      assistantRoleIndicator: ['[class*="assistant"]'],
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
      border: 1px solid #d1d5db;
      background: white;
      color: #d97757;
      cursor: pointer;
      font-size: 14px;
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
