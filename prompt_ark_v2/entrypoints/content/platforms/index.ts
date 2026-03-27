import { ChatGPTAdapter } from './chatgpt';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { DeepSeekAdapter } from './deepseek';
import { KimiAdapter } from './kimi';
import { DoubaoAdapter } from './doubao';
import { QwenAdapter } from './qwen';
import { ChatGLMAdapter } from './chatglm';
import { GrokAdapter } from './grok';
import type { PlatformAdapter } from './base';

export const adapters: PlatformAdapter[] = [
  new ChatGPTAdapter(),
  new ClaudeAdapter(),
  new GeminiAdapter(),
  new DeepSeekAdapter(),
  new KimiAdapter(),
  new DoubaoAdapter(),
  new QwenAdapter(),
  new ChatGLMAdapter(),
  new GrokAdapter(),
];

export function detectPlatform(): PlatformAdapter | null {
  for (const adapter of adapters) {
    if (adapter.detect()) {
      return adapter;
    }
  }
  return null;
}

export {
  ChatGPTAdapter,
  ClaudeAdapter,
  GeminiAdapter,
  DeepSeekAdapter,
  KimiAdapter,
  DoubaoAdapter,
  QwenAdapter,
  ChatGLMAdapter,
  GrokAdapter,
};

export * from './base';
