export type ProviderType = 'gemini' | 'openai' | 'gemini-web';

export interface BaseProvider {
  id: string;
  name: string;
  type: ProviderType;
  model?: string;
  enabled: boolean;
}

export interface GeminiProvider extends BaseProvider {
  type: 'gemini';
  apiKey: string;
  model: string;
}

export interface OpenAIProvider extends BaseProvider {
  type: 'openai';
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface GeminiWebProvider extends BaseProvider {
  type: 'gemini-web';
}

export type Provider = GeminiProvider | OpenAIProvider | GeminiWebProvider;