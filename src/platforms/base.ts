export type Platform = 
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'notebooklm'
  | 'aistudio'
  | 'grok'
  | 'deepseek'
  | 'kimi'
  | 'zhipu'
  | 'doubao'
  | 'wenxin'
  | 'qwen'
  | 'minimax'
  | 'hunyuan'
  | 'generic';

export interface PlatformAdapter {
  name: Platform;
  hostname: string[];
  selectors: {
    input: string[];
    sendButton?: string[];
  };
  findInput(): HTMLElement | null;
  injectText(input: HTMLElement, text: string): Promise<boolean>;
  isReady(): boolean;
}

export const PLATFORM_CONFIGS: Record<Platform, Omit<PlatformAdapter, 'findInput' | 'injectText' | 'isReady'>> = {
  chatgpt: {
    name: 'chatgpt',
    hostname: ['chatgpt.com', 'chat.openai.com'],
    selectors: {
      input: ['#prompt-textarea', 'div[contenteditable="true"].ProseMirror'],
    },
  },
  claude: {
    name: 'claude',
    hostname: ['claude.ai'],
    selectors: {
      input: ['div[contenteditable="true"].ProseMirror', 'div[enterkeyhint="enter"][contenteditable="true"]'],
    },
  },
  gemini: {
    name: 'gemini',
    hostname: ['gemini.google.com'],
    selectors: {
      input: ['rich-textarea div[contenteditable="true"]', 'div[role="textbox"]', '.ql-editor'],
    },
  },
  notebooklm: {
    name: 'notebooklm',
    hostname: ['notebooklm.google.com'],
    selectors: {
      input: ['textarea[placeholder]', 'textarea.mat-input-element'],
    },
  },
  aistudio: {
    name: 'aistudio',
    hostname: ['aistudio.google.com'],
    selectors: {
      input: ['textarea[placeholder]', '.code-block textarea', 'div[contenteditable="true"]'],
    },
  },
  grok: {
    name: 'grok',
    hostname: ['grok.com'],
    selectors: {
      input: ['textarea[placeholder]', 'div[contenteditable="true"]'],
    },
  },
  deepseek: {
    name: 'deepseek',
    hostname: ['chat.deepseek.com'],
    selectors: {
      input: ['textarea#chat-input', 'textarea[placeholder]'],
    },
  },
  kimi: {
    name: 'kimi',
    hostname: ['kimi.com', 'kimi.moonshot.cn'],
    selectors: {
      input: ['div[contenteditable="true"][class*="editor"]', 'div[contenteditable="true"].ProseMirror'],
    },
  },
  zhipu: {
    name: 'zhipu',
    hostname: ['chatglm.cn'],
    selectors: {
      input: ['textarea.ant-input'],
    },
  },
  doubao: {
    name: 'doubao',
    hostname: ['doubao.com', 'www.doubao.com'],
    selectors: {
      input: ['div[data-slate-editor="true"]', 'div[contenteditable="true"][role="textbox"]'],
    },
  },
  wenxin: {
    name: 'wenxin',
    hostname: ['yiyan.baidu.com'],
    selectors: {
      input: ['div[contenteditable="true"]', 'textarea[placeholder]'],
    },
  },
  qwen: {
    name: 'qwen',
    hostname: ['tongyi.aliyun.com', 'qwen.ai'],
    selectors: {
      input: ['div[contenteditable="true"][class*="editor"]'],
    },
  },
  minimax: {
    name: 'minimax',
    hostname: ['hailuoai.com', 'www.hailuoai.com'],
    selectors: {
      input: ['textarea[placeholder]', 'div[contenteditable="true"]'],
    },
  },
  hunyuan: {
    name: 'hunyuan',
    hostname: ['hunyuan.tencent.com'],
    selectors: {
      input: ['textarea[placeholder]', 'div[contenteditable="true"]'],
    },
  },
  generic: {
    name: 'generic',
    hostname: [],
    selectors: {
      input: ['textarea', 'div[contenteditable="true"]'],
    },
  },
};

export function detectPlatform(): Platform {
  const h = window.location.hostname;
  if (h.includes('chatgpt.com') || h.includes('chat.openai.com')) return 'chatgpt';
  if (h.includes('claude.ai')) return 'claude';
  if (h.includes('gemini.google.com')) return 'gemini';
  if (h.includes('notebooklm.google.com')) return 'notebooklm';
  if (h.includes('aistudio.google.com')) return 'aistudio';
  if (h.includes('grok.com')) return 'grok';
  if (h.includes('chat.deepseek.com')) return 'deepseek';
  if (h.includes('kimi.com') || h.includes('kimi.moonshot.cn')) return 'kimi';
  if (h.includes('chatglm.cn')) return 'zhipu';
  if (h.includes('doubao.com')) return 'doubao';
  if (h.includes('yiyan.baidu.com')) return 'wenxin';
  if (h.includes('tongyi.aliyun.com') || h.includes('qwen.ai')) return 'qwen';
  if (h.includes('hailuoai.com')) return 'minimax';
  if (h.includes('hunyuan.tencent.com')) return 'hunyuan';
  return 'generic';
}

export function createPlatformAdapter(platform: Platform): PlatformAdapter {
  const config = PLATFORM_CONFIGS[platform];
  
  return {
    ...config,
    
    findInput(): HTMLElement | null {
      for (const selector of config.selectors.input) {
        const el = document.querySelector(selector);
        if (el && isVisible(el as HTMLElement)) {
          return el as HTMLElement;
        }
      }
      
      const genericSelectors = ['textarea', 'div[contenteditable="true"]'];
      for (const selector of genericSelectors) {
        const el = document.querySelector(selector);
        if (el && isVisible(el as HTMLElement)) {
          return el as HTMLElement;
        }
      }
      
      return null;
    },
    
    async injectText(input: HTMLElement, text: string): Promise<boolean> {
      input.focus();
      await new Promise(r => setTimeout(r, 50));
      
      let success = false;
      
      if (input.classList.contains('ProseMirror') || input.isContentEditable) {
        try {
          success = document.execCommand('insertText', false, text);
        } catch { }
      }
      
      if (!success) {
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
          const inputEl = input as HTMLInputElement | HTMLTextAreaElement;
          const valueSetter = Object.getOwnPropertyDescriptor(inputEl, 'value')?.set;
          const protoSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(inputEl), 'value'
          )?.set;
          
          const finalSetter = valueSetter || protoSetter;
          if (finalSetter) {
            finalSetter.call(inputEl, text);
          } else {
            inputEl.value = text;
          }
          
          const tracker = (inputEl as unknown as { _valueTracker?: { setValue(v: string): void } })._valueTracker;
          if (tracker) tracker.setValue('');
          
          success = true;
        } else {
          input.textContent = text;
          success = true;
        }
      }
      
      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new KeyboardEvent('keydown', { bubbles: true, key: ' ' }),
        new KeyboardEvent('keyup', { bubbles: true, key: ' ' })
      ];
      for (const e of events) {
        input.dispatchEvent(e);
      }
      
      return success;
    },
    
    isReady(): boolean {
      return this.findInput() !== null;
    }
  };
}

function isVisible(element: HTMLElement): boolean {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.getBoundingClientRect().height > 0;
}