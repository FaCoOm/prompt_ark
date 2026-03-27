import { LocalStorage } from '@/core/storage';
import { encrypt, decrypt } from '@/utils/crypto';
import {
  GeminiWebProvider,
  GeminiAPIProvider,
  OpenAICompatibleProvider,
} from './providers';
import type {
  RuntimeProvider,
  StoredProvider,
  LegacyProviderSettings,
  KeepAliveController,
} from './types';
import type { MetadataExtractionResult } from '@/types/ai';

export { safeParseJSON, fetchWithTimeout, keepAlive };

const STORAGE_KEY_PROVIDERS = 'providers';
const STORAGE_KEY_ACTIVE_PROVIDER = 'activeProviderId';

const DEFAULT_PROVIDERS: RuntimeProvider[] = [
  {
    id: 'gemini-web-default',
    name: 'Gemini Web',
    type: 'gemini-web',
    enabled: true,
    model: 'gemini-3-flash',
    capabilities: { chat: true, vision: true, json: true },
  },
];

function safeParseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(fixed) as T;
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function keepAlive(): KeepAliveController {
  const interval = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
  }, 25000);
  return { stop: () => clearInterval(interval) };
}

function createProviderInstance(config: RuntimeProvider) {
  switch (config.type) {
    case 'gemini-web':
      return new GeminiWebProvider(config);
    case 'gemini':
      return new GeminiAPIProvider(config);
    case 'openai':
    case 'openai-compatible':
      return new OpenAICompatibleProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

export class ProviderManager {
  async getProviders(): Promise<RuntimeProvider[]> {
    const stored = await LocalStorage.get<StoredProvider[]>(STORAGE_KEY_PROVIDERS);
    const providers = stored ?? DEFAULT_PROVIDERS;
    return Promise.all(
      providers.map(async (p) => {
        if (p.apiKey) {
          return { ...p, apiKey: await decrypt(p.apiKey) } as RuntimeProvider;
        }
        return p as RuntimeProvider;
      })
    );
  }

  async setProviders(providers: RuntimeProvider[]): Promise<void> {
    const encrypted = await Promise.all(
      providers.map(async (p) => {
        if (p.apiKey) {
          return { ...p, apiKey: await encrypt(p.apiKey) } as StoredProvider;
        }
        return p as StoredProvider;
      })
    );
    await LocalStorage.set(STORAGE_KEY_PROVIDERS, encrypted);
  }

  async getActiveProvider(): Promise<RuntimeProvider | null> {
    const providers = await this.getProviders();
    const activeProviderId = await LocalStorage.get<string>(STORAGE_KEY_ACTIVE_PROVIDER);
    if (activeProviderId) {
      const found = providers.find((p) => p.id === activeProviderId);
      if (found) return found;
    }
    const enabled = providers.find((p) => p.enabled);
    if (enabled) return enabled;
    const geminiWebProvider = providers.find((p) => p.type === 'gemini-web');
    if (geminiWebProvider) {
      const geminiProvider = createProviderInstance(geminiWebProvider);
      const isAvailable = await geminiProvider.isAvailable();
      if (isAvailable) {
        return { ...geminiWebProvider, name: 'Gemini Web (auto)' };
      }
    }
    return null;
  }

  async setActiveProvider(providerId: string): Promise<void> {
    await LocalStorage.set(STORAGE_KEY_ACTIVE_PROVIDER, providerId);
  }

  async migrateProviderSettings(): Promise<void> {
    const oldKeys = [
      'aiProvider',
      'geminiApiKey',
      'openaiApiUrl',
      'openaiApiKey',
      'openaiModel',
      'providers',
    ];
    const old = (await chrome.storage.local.get(oldKeys)) as LegacyProviderSettings;
    if (old.providers) return;
    const providers: RuntimeProvider[] = [];
    let activeId = '';
    if (!old.aiProvider || old.aiProvider === 'nano') {
      providers.push({
        id: 'gemini-web-default',
        name: 'Gemini Web',
        type: 'gemini-web',
        model: 'gemini-3-flash',
        capabilities: { chat: true, vision: true, json: true },
        enabled: true,
      });
      activeId = 'gemini-web-default';
    } else {
      if (old.aiProvider === 'gemini' && old.geminiApiKey) {
        const id = 'migrated-gemini';
        providers.push({
          id,
          name: 'Gemini API',
          type: 'gemini',
          apiKey: old.geminiApiKey,
          model: 'gemini-2.0-flash',
          capabilities: { chat: true, vision: true, json: true },
          enabled: true,
        });
        activeId = id;
      }
      if (old.aiProvider === 'openai' && old.openaiApiKey) {
        const id = 'migrated-openai';
        providers.push({
          id,
          name: 'OpenAI',
          type: 'openai',
          baseUrl: old.openaiApiUrl || 'https://api.openai.com/v1',
          apiKey: old.openaiApiKey,
          model: old.openaiModel || 'gpt-4o-mini',
          capabilities: { chat: true, vision: true, json: true },
          enabled: true,
        });
        activeId = id;
      }
    }
    await this.setProviders(providers);
    await LocalStorage.set(STORAGE_KEY_ACTIVE_PROVIDER, activeId);
    await chrome.storage.local.remove(oldKeys);
  }

  async callCloudAPI(
    text: string,
    lang: string
  ): Promise<MetadataExtractionResult | null> {
    const provider = await this.getActiveProvider();
    if (!provider) return null;
    const providerInstance = createProviderInstance(provider);
    return providerInstance.extractMetadata(text, lang);
  }
}

export const providerManager = new ProviderManager();

export async function getProviders(): Promise<RuntimeProvider[]> {
  return providerManager.getProviders();
}

export async function setProviders(providers: RuntimeProvider[]): Promise<void> {
  return providerManager.setProviders(providers);
}

export async function getActiveProvider(): Promise<RuntimeProvider | null> {
  return providerManager.getActiveProvider();
}

export async function migrateProviderSettings(): Promise<void> {
  return providerManager.migrateProviderSettings();
}

export async function callCloudAPI(
  text: string,
  lang: string
): Promise<MetadataExtractionResult | null> {
  return providerManager.callCloudAPI(text, lang);
}
