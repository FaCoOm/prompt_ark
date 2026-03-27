import type {
  AIProviderBase,
  RuntimeProvider,
} from '../types';
import type { MetadataExtractionResult } from '@/types/ai';
import { fetchWithTimeout } from '../provider';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
}

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAICompatibleProvider implements AIProviderBase {
  readonly config: RuntimeProvider;

  constructor(config: RuntimeProvider) {
    this.config = config;
  }

  private get apiUrl(): string {
    return this.config.baseUrl || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey);
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }
    const model = this.config.model || 'gpt-4o-mini';
    const url = `${this.apiUrl}/chat/completions`;
    const requestBody: OpenAIChatRequest = {
      model,
      messages: [{ role: 'user', content: prompt }],
    };
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
      60000
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    const data = (await response.json()) as OpenAIChatResponse;
    return data.choices?.[0]?.message?.content ?? '';
  }

  async extractMetadata(
    text: string,
    lang: string
  ): Promise<MetadataExtractionResult | null> {
    if (!this.config.apiKey) {
      throw new Error('API key not configured');
    }
    const systemPrompt =
      lang === 'zh'
        ? '你是一个专业的提示词分析助手。请分析给定的提示词内容，提取标题、分类和标签。'
        : 'You are a professional prompt analysis assistant. Analyze the given prompt content and extract title, category, and tags.';
    const userContent = text.substring(0, 500);
    const model = this.config.model || 'gpt-4o-mini';
    const url = `${this.apiUrl}/chat/completions`;
    const requestBody: OpenAIChatRequest = {
      model,
      messages: [
        {
          role: 'system',
          content:
            systemPrompt +
            ' Return JSON only: {"title":"...","category":"...","tags":["...","..."]}',
        },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    };
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
      60000
    );
    if (!response.ok) {
      throw new Error(`OpenAI API ${response.status}`);
    }
    const data = (await response.json()) as OpenAIChatResponse;
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MetadataExtractionResult;
    } catch {
      return null;
    }
  }
}
