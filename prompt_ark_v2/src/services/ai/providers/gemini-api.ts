import type {
  AIProviderBase,
  RuntimeProvider,
} from '../types';
import type { MetadataExtractionResult } from '@/types/ai';
import { fetchWithTimeout, safeParseJSON } from '../provider';

interface GeminiGenerateContentRequest {
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    responseModalities: string[];
    responseMimeType: string;
    responseSchema: {
      type: string;
      properties: Record<
        string,
        { type: string; description: string; items?: { type: string } }
      >;
      required: string[];
    };
  };
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export class GeminiAPIProvider implements AIProviderBase {
  readonly config: RuntimeProvider;

  constructor(config: RuntimeProvider) {
    this.config = config;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey);
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    const model = this.config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const requestBody: GeminiGenerateContentRequest = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT'],
        responseMimeType: 'text/plain',
        responseSchema: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Generated text' },
          },
          required: ['text'],
        },
      },
    };
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      },
      60000
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }
    const data = (await response.json()) as GeminiGenerateContentResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async extractMetadata(
    text: string,
    lang: string
  ): Promise<MetadataExtractionResult | null> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    const systemPrompt =
      lang === 'zh'
        ? '你是一个专业的提示词分析助手。请分析给定的提示词内容，提取标题、分类和标签。'
        : 'You are a professional prompt analysis assistant. Analyze the given prompt content and extract title, category, and tags.';
    const userContent = text.substring(0, 500);
    const model = this.config.model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const requestBody: GeminiGenerateContentRequest = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT'],
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short title',
            },
            category: {
              type: 'string',
              description: 'Concise category',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: '1-3 search keyword tags',
            },
          },
          required: ['title', 'category'],
        },
      },
    };
    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey,
        },
        body: JSON.stringify(requestBody),
      },
      60000
    );
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GeminiAPIProvider] Error:', response.status, errorText);
      throw new Error(`Gemini API ${response.status}: ${errorText}`);
    }
    const data = (await response.json()) as GeminiGenerateContentResponse;
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    try {
      return safeParseJSON<MetadataExtractionResult>(raw);
    } catch {
      return null;
    }
  }
}
