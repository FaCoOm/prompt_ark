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

export interface PlatformConfig {
  name: string;
  hostname: string[];
  selectors: {
    input: string[];
    sendButton?: string[];
  };
}