import type {
  AIProvider,
  AIProviderType,
  AIModel,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
} from '@types';

export interface AIProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly type: AIProviderType;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<AIModel[]>;
  chat(options: ChatOptions): Promise<ChatResponse>;
  chatStream(options: ChatOptions): AsyncIterable<ChatStreamChunk>;
  validateConfig(): Promise<{ valid: boolean; error?: string }>;
}

export class OpenAICompatibleProvider implements AIProviderAdapter {
  constructor(private config: AIProvider) {}

  get id() {
    return this.config.id;
  }
  get name() {
    return this.config.name;
  }
  get type() {
    return this.config.type;
  }

  async isAvailable(): Promise<boolean> {
    return this.config.enabled && !!this.config.apiKey;
  }

  async listModels(): Promise<AIModel[]> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      return [];
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data.map((m: { id: string }) => ({
        id: m.id,
        name: m.id,
        provider: this.config.name,
        capabilities: {
          chat: true,
          vision: false,
          json: true,
          streaming: true,
        },
        contextWindow: 4096,
      }));
    } catch {
      return [];
    }
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('Provider not configured');
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? this.config.defaults?.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.defaults?.maxTokens,
        top_p: options.topP ?? this.config.defaults?.topP ?? 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content ?? '',
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *chatStream(options: ChatOptions): AsyncIterable<ChatStreamChunk> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      throw new Error('Provider not configured');
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? this.config.defaults?.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? this.config.defaults?.maxTokens,
        top_p: options.topP ?? this.config.defaults?.topP ?? 1,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content ?? '';
            yield { content, done: false };
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    yield { content: '', done: true };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.baseUrl) {
      return { valid: false, error: 'Base URL is required' };
    }
    if (!this.config.apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return { valid: false, error: 'Invalid API key or base URL' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export class GeminiWebProvider implements AIProviderAdapter {
  constructor(private config: AIProvider) {}

  get id() {
    return this.config.id;
  }
  get name() {
    return this.config.name;
  }
  get type() {
    return 'gemini-web' as const;
  }

  async isAvailable(): Promise<boolean> {
    return this.config.enabled;
  }

  async listModels(): Promise<AIModel[]> {
    return [
      {
        id: 'gemini-web',
        name: 'Gemini Web',
        provider: this.config.name,
        capabilities: {
          chat: true,
          vision: true,
          json: true,
          streaming: true,
        },
        contextWindow: 1000000,
      },
    ];
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    // Gemini Web uses browser cookies, implementation depends on content script
    throw new Error('Gemini Web provider requires content script implementation');
  }

  async *chatStream(options: ChatOptions): AsyncIterable<ChatStreamChunk> {
    throw new Error('Gemini Web provider requires content script implementation');
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    // Check if user is logged into gemini.google.com
    try {
      const response = await fetch('https://gemini.google.com/app', {
        credentials: 'include',
        redirect: 'manual',
      });

      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Please log in to gemini.google.com' };
    } catch {
      return { valid: false, error: 'Cannot connect to Gemini' };
    }
  }
}

export class AIProviderFactory {
  static createProvider(config: AIProvider): AIProviderAdapter {
    switch (config.type) {
      case 'openai-compatible':
        return new OpenAICompatibleProvider(config);
      case 'gemini-web':
        return new GeminiWebProvider(config);
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }
  }
}

export class AIManager {
  private providers: Map<string, AIProviderAdapter> = new Map();

  registerProvider(config: AIProvider): void {
    const provider = AIProviderFactory.createProvider(config);
    this.providers.set(config.id, provider);
  }

  unregisterProvider(id: string): void {
    this.providers.delete(id);
  }

  getProvider(id: string): AIProviderAdapter | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): AIProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  async getAvailableProviders(): Promise<AIProviderAdapter[]> {
    const available: AIProviderAdapter[] = [];
    for (const provider of this.providers.values()) {
      if (await provider.isAvailable()) {
        available.push(provider);
      }
    }
    return available;
  }
}

export const aiManager = new AIManager();
