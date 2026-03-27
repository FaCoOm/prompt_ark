import { createStore } from 'solid-js/store';
import type { AIProvider, AIProviderType } from '../types/ai';
import { ProviderManager } from '../services/ai/provider';
import { v4 as uuidv4 } from 'uuid';

interface ProviderStoreState {
  providers: AIProvider[];
  activeProviderId: string | null;
  isLoading: boolean;
}

const providerManager = new ProviderManager();

const [state, setState] = createStore<ProviderStoreState>({
  providers: [],
  activeProviderId: null,
  isLoading: false,
});

export const providerTypes: { value: AIProviderType; label: string }[] = [
  { value: 'gemini', label: 'Gemini API' },
  { value: 'gemini-web', label: 'Gemini Web (免 Key)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'openai-compatible', label: 'OpenAI 兼容' },
];

export const defaultModels: Record<AIProviderType, string> = {
  gemini: 'gemini-2.0-flash',
  'gemini-web': 'gemini-3-flash',
  openai: 'gpt-4o-mini',
  'openai-compatible': 'gpt-3.5-turbo',
  'azure-openai': 'gpt-4',
};

export const providerStore = {
  get state() {
    return state;
  },

  async loadProviders(): Promise<void> {
    setState('isLoading', true);
    try {
      const providers = await providerManager.getProviders();
      const active = await providerManager.getActiveProvider();
      setState('providers', providers);
      setState('activeProviderId', active?.id || null);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setState('isLoading', false);
    }
  },

  async addProvider(provider: Omit<AIProvider, 'id'>): Promise<void> {
    const newProvider: AIProvider = {
      ...provider,
      id: uuidv4(),
    };
    const updated = [...state.providers, newProvider];
    await providerManager.setProviders(updated);
    setState('providers', updated);
  },

  async updateProvider(id: string, updates: Partial<AIProvider>): Promise<void> {
    const updated = state.providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    await providerManager.setProviders(updated);
    setState('providers', updated);
  },

  async deleteProvider(id: string): Promise<void> {
    const updated = state.providers.filter((p) => p.id !== id);
    await providerManager.setProviders(updated);
    setState('providers', updated);
  },

  async setActiveProvider(id: string): Promise<void> {
    await providerManager.setActiveProvider(id);
    setState('activeProviderId', id);
  },

  createDefaultProvider(type: AIProviderType): Omit<AIProvider, 'id'> {
    return {
      name: type === 'gemini-web' ? 'Gemini Web' : 'New Provider',
      type,
      model: defaultModels[type],
      capabilities: { chat: true, vision: true, json: true },
      enabled: true,
    };
  },
};