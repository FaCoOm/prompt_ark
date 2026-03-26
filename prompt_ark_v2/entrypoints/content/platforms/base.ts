import type { PlatformMessage, GenerationStatus } from '../../../src/types';

export interface PlatformConfig {
  name: string;
  matches: string[];
  selectors: {
    messageContainer: string[];
    inputArea: string[];
    sendButton: string[];
    generatingIndicator: string[];
    message: string[];
    userRoleIndicator: string[];
    assistantRoleIndicator: string[];
  };
  features: {
    supportsMultiTurn: boolean;
    supportsFileUpload: boolean;
    supportsVision: boolean;
    requiresSpecialSend: boolean;
    inputType: 'textarea' | 'contenteditable' | 'custom';
  };
}

export interface PlatformAdapter {
  readonly config: PlatformConfig;
  detect(): boolean;
  waitForReady(): Promise<void>;
  findMessageContainer(): HTMLElement | null;
  findInputArea(): HTMLElement | null;
  findSendButton(): HTMLElement | null;
  detectGenerationStatus(): GenerationStatus;
  getMessages(): PlatformMessage[];
  getLastMessage(): PlatformMessage | null;
  setInputContent(content: string): void;
  sendMessage(content: string): Promise<boolean>;
  insertPrompt(content: string, variables?: Record<string, string>): Promise<boolean>;
  injectPromptButton(container: HTMLElement): HTMLElement | null;
  removeInjectedUI(): void;
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly config: PlatformConfig;
  protected injectedElements: HTMLElement[] = [];

  detect(): boolean {
    return this.config.matches.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(window.location.href);
    });
  }

  async waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });
  }

  findMessageContainer(): HTMLElement | null {
    for (const selector of this.config.selectors.messageContainer) {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (element) return element;
    }
    return null;
  }

  findInputArea(): HTMLElement | null {
    for (const selector of this.config.selectors.inputArea) {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (element) return element;
    }
    return null;
  }

  findSendButton(): HTMLElement | null {
    for (const selector of this.config.selectors.sendButton) {
      const element = document.querySelector(selector) as HTMLElement | null;
      if (element) return element;
    }
    return null;
  }

  detectGenerationStatus(): GenerationStatus {
    for (const selector of this.config.selectors.generatingIndicator) {
      const element = document.querySelector(selector);
      if (element) {
        return { isGenerating: true };
      }
    }
    return { isGenerating: false };
  }

  getMessages(): PlatformMessage[] {
    const messages: PlatformMessage[] = [];
    const elements = document.querySelectorAll(this.config.selectors.message.join(', '));

    elements.forEach((el, index) => {
      const role = this.detectMessageRole(el);
      const content = this.extractMessageContent(el);
      messages.push({
        id: `msg-${index}`,
        role,
        content,
      });
    });

    return messages;
  }

  getLastMessage(): PlatformMessage | null {
    const messages = this.getMessages();
    return messages[messages.length - 1] ?? null;
  }

  setInputContent(content: string): void {
    const input = this.findInputArea();
    if (!input) return;

    if (this.config.features.inputType === 'textarea') {
      (input as HTMLTextAreaElement).value = content;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (this.config.features.inputType === 'contenteditable') {
      input.innerHTML = content.replace(/\n/g, '<br>');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async sendMessage(content: string): Promise<boolean> {
    this.setInputContent(content);

    const sendButton = this.findSendButton();
    if (sendButton) {
      sendButton.click();
      return true;
    }

    const input = this.findInputArea();
    if (input) {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
      });
      input.dispatchEvent(event);
      return true;
    }

    return false;
  }

  async insertPrompt(content: string, variables?: Record<string, string>): Promise<boolean> {
    let processedContent = content;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        processedContent = processedContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return this.sendMessage(processedContent);
  }

  abstract injectPromptButton(container: HTMLElement): HTMLElement | null;

  removeInjectedUI(): void {
    for (const element of this.injectedElements) {
      element.remove();
    }
    this.injectedElements = [];
  }

  protected detectMessageRole(element: Element): 'user' | 'assistant' | 'system' {
    for (const selector of this.config.selectors.userRoleIndicator) {
      if (element.matches(selector) || element.closest(selector)) {
        return 'user';
      }
    }
    for (const selector of this.config.selectors.assistantRoleIndicator) {
      if (element.matches(selector) || element.closest(selector)) {
        return 'assistant';
      }
    }
    return 'assistant';
  }

  protected extractMessageContent(element: Element): string {
    return element.textContent ?? '';
  }
}
