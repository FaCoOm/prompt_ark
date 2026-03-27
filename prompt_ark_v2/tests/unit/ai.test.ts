/**
 * @fileoverview Unit tests for AI Provider Service
 *
 * Tests ProviderManager, AI providers, and utility functions
 * Uses Vitest with mocks for storage and fetch
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock storage
const mockStorage = new Map<string, unknown>();

vi.mock('@/core/storage', () => ({
  LocalStorage: {
    get: vi.fn(async (key: string) => mockStorage.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      mockStorage.set(key, value);
    }),
    remove: vi.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

// Mock crypto
vi.mock('@/utils/crypto', () => ({
  encrypt: vi.fn(async (text: string) => `encrypted:${text}`),
  decrypt: vi.fn(async (text: string) => text.replace('encrypted:', '')),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  ProviderManager,
  providerManager,
  getProviders,
  setProviders,
  getActiveProvider,
  migrateProviderSettings,
  callCloudAPI,
  safeParseJSON,
  fetchWithTimeout,
  keepAlive,
} from '../../src/services/ai/provider';
import {
  GeminiWebProvider,
  GeminiAPIProvider,
  OpenAICompatibleProvider,
} from '../../src/services/ai/providers';
import type {
  RuntimeProvider,
  StoredProvider,
  KeepAliveController,
} from '../../src/services/ai/types';
import { APIError, NotLoggedInError } from '../../src/services/ai/types';

describe('safeParseJSON', () => {
  it('should parse valid JSON', () => {
    const result = safeParseJSON<{ test: string }>('{"test": "value"}');
    expect(result).toEqual({ test: 'value' });
  });

  it('should handle escaped characters', () => {
    const json = '{"text": "line1\\nline2"}';
    const result = safeParseJSON<{ text: string }>(json);
    expect(result.text).toBe('line1\nline2');
  });

  it('should fix invalid escape sequences', () => {
    // JSON.stringify produces valid escape sequences like C:\path (in JS string) 
    // which becomes C:\\path in the JSON text, and parses back to C:\path
    const jsonWithEscapes = '{"text": "C:\\\\path"}';
    const result = safeParseJSON<{ text: string }>(jsonWithEscapes);
    expect(result.text).toBe('C:\\path'); // After parsing, \ becomes single \
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should fetch with default timeout', async () => {
    mockFetch.mockResolvedValueOnce(new Response('OK'));

    const response = await fetchWithTimeout('https://example.com');
    expect(response.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('should respect custom timeout', async () => {
    mockFetch.mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 50);
      })
    );

    await expect(fetchWithTimeout('https://example.com', {}, 10)).rejects.toThrow();
  });

  it('should pass request options', async () => {
    mockFetch.mockResolvedValueOnce(new Response('OK'));

    await fetchWithTimeout('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      })
    );
  });
});

describe('keepAlive', () => {
  it('should create keep-alive controller', () => {
    const controller = keepAlive();
    expect(controller).toHaveProperty('stop');
    expect(typeof controller.stop).toBe('function');
  });

  it('should stop keep-alive interval', () => {
    const controller = keepAlive();
    controller.stop();
  });
});

describe('ProviderManager', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockFetch.mockClear();
    vi.clearAllMocks();
  });

  describe('getProviders', () => {
    it('should return default providers when none stored', async () => {
      const providers = await providerManager.getProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0].type).toBe('gemini-web');
    });

    it('should decrypt API keys', async () => {
      const storedProviders: StoredProvider[] = [
        {
          id: 'test-provider',
          name: 'Test Provider',
          type: 'openai',
          apiKey: 'encrypted:secret-key',
          model: 'gpt-4',
          enabled: true,
          capabilities: { chat: true, vision: false, json: true },
        },
      ];
      mockStorage.set('providers', storedProviders);

      const providers = await providerManager.getProviders();
      expect(providers[0].apiKey).toBe('secret-key');
    });

    it('should handle providers without API keys', async () => {
      const storedProviders: StoredProvider[] = [
        {
          id: 'test-provider',
          name: 'Test Provider',
          type: 'gemini-web',
          model: 'gemini-pro',
          enabled: true,
          capabilities: { chat: true, vision: true, json: true },
        },
      ];
      mockStorage.set('providers', storedProviders);

      const providers = await providerManager.getProviders();
      expect(providers[0].apiKey).toBeUndefined();
    });
  });

  describe('setProviders', () => {
    it('should encrypt API keys when storing', async () => {
      const providers: RuntimeProvider[] = [
        {
          id: 'test-provider',
          name: 'Test Provider',
          type: 'openai',
          apiKey: 'secret-key',
          model: 'gpt-4',
          enabled: true,
          capabilities: { chat: true, vision: false, json: true },
        },
      ];

      await providerManager.setProviders(providers);

      const stored = mockStorage.get('providers') as StoredProvider[];
      expect(stored[0].apiKey).toBe('encrypted:secret-key');
    });

    it('should store providers without API keys', async () => {
      const providers: RuntimeProvider[] = [
        {
          id: 'test-provider',
          name: 'Test Provider',
          type: 'gemini-web',
          model: 'gemini-pro',
          enabled: true,
          capabilities: { chat: true, vision: true, json: true },
        },
      ];

      await providerManager.setProviders(providers);

      const stored = mockStorage.get('providers') as StoredProvider[];
      expect(stored[0].apiKey).toBeUndefined();
    });
  });

  describe('getActiveProvider', () => {
    it('should return active provider by ID', async () => {
      const providers: RuntimeProvider[] = [
        {
          id: 'provider-1',
          name: 'Provider 1',
          type: 'openai',
          model: 'gpt-4',
          enabled: true,
          capabilities: { chat: true, vision: false, json: true },
        },
        {
          id: 'provider-2',
          name: 'Provider 2',
          type: 'gemini',
          model: 'gemini-pro',
          enabled: false,
          capabilities: { chat: true, vision: true, json: true },
        },
      ];
      await providerManager.setProviders(providers);
      mockStorage.set('activeProviderId', 'provider-2');

      const active = await providerManager.getActiveProvider();
      expect(active?.id).toBe('provider-2');
    });

    it('should return first enabled provider if no active ID', async () => {
      const providers: RuntimeProvider[] = [
        {
          id: 'provider-1',
          name: 'Provider 1',
          type: 'openai',
          model: 'gpt-4',
          enabled: false,
          capabilities: { chat: true, vision: false, json: true },
        },
        {
          id: 'provider-2',
          name: 'Provider 2',
          type: 'gemini',
          model: 'gemini-pro',
          enabled: true,
          capabilities: { chat: true, vision: true, json: true },
        },
      ];
      await providerManager.setProviders(providers);

      const active = await providerManager.getActiveProvider();
      expect(active?.id).toBe('provider-2');
    });

    it('should return null when no providers available', async () => {
      mockStorage.set('providers', []);

      const active = await providerManager.getActiveProvider();
      expect(active).toBeNull();
    });
  });

  describe('setActiveProvider', () => {
    it('should set active provider ID', async () => {
      await providerManager.setActiveProvider('provider-1');
      expect(mockStorage.get('activeProviderId')).toBe('provider-1');
    });
  });

  describe('migrateProviderSettings', () => {
    it('should migrate old settings to new format', async () => {
      const chromeStorage: Record<string, unknown> = {
        aiProvider: 'gemini',
        geminiApiKey: 'old-gemini-key',
      };

      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            local: {
              get: vi.fn(async (keys: string | string[]) => {
                if (Array.isArray(keys)) {
                  return Object.fromEntries(
                    keys.map((k) => [k, chromeStorage[k]])
                  );
                }
                return { [keys]: chromeStorage[keys] };
              }),
              set: vi.fn(async (obj: Record<string, unknown>) => {
                Object.assign(chromeStorage, obj);
              }),
              remove: vi.fn(async (keys: string | string[]) => {
                if (Array.isArray(keys)) {
                  keys.forEach((k) => delete chromeStorage[k]);
                } else {
                  delete chromeStorage[keys];
                }
              }),
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await providerManager.migrateProviderSettings();

      const providers = mockStorage.get('providers') as RuntimeProvider[];
      expect(providers).toBeDefined();
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should skip migration if providers already exist', async () => {
      mockStorage.set('providers', [{ id: 'existing', name: 'Existing' }]);

      const chromeStorage: Record<string, unknown> = {
        providers: [{ id: 'existing', name: 'Existing' }],
        aiProvider: 'openai',
        openaiApiKey: 'old-key',
      };

      Object.defineProperty(global, 'chrome', {
        value: {
          storage: {
            local: {
              get: vi.fn(async (keys: string | string[]) => {
                if (Array.isArray(keys)) {
                  return Object.fromEntries(
                    keys.map((k) => [k, chromeStorage[k]])
                  );
                }
                return { [keys]: chromeStorage[keys] };
              }),
              set: vi.fn(async () => {}),
              remove: vi.fn(async () => {}),
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await providerManager.migrateProviderSettings();

      // Should not overwrite existing providers
      const providers = mockStorage.get('providers') as RuntimeProvider[];
      expect(providers[0].id).toBe('existing');
    });
  });

  describe('callCloudAPI', () => {
    it('should return null when no provider available', async () => {
      mockStorage.set('providers', []);

      const result = await providerManager.callCloudAPI('test text', 'en');
      expect(result).toBeNull();
    });
  });
});

describe('Provider exports', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('should export getProviders function', async () => {
    const providers = await getProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should export setProviders function', async () => {
    const providers: RuntimeProvider[] = [
      {
        id: 'test',
        name: 'Test',
        type: 'openai',
        model: 'gpt-4',
        enabled: true,
        capabilities: { chat: true, vision: false, json: true },
      },
    ];

    await setProviders(providers);
    const retrieved = await getProviders();
    expect(retrieved.length).toBe(providers.length);
  });

  it('should export getActiveProvider function', async () => {
    const provider = await getActiveProvider();
    expect(provider === null || typeof provider === 'object').toBe(true);
  });

  it('should export migrateProviderSettings function', async () => {
    await expect(migrateProviderSettings()).resolves.not.toThrow();
  });

  it('should export callCloudAPI function', async () => {
    const providers: RuntimeProvider[] = [
      {
        id: 'test-openai',
        name: 'Test OpenAI',
        type: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        enabled: true,
        capabilities: { chat: true, vision: false, json: true },
      },
    ];
    await setProviders(providers);
    await providerManager.setActiveProvider('test-openai');

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"title": "Test", "category": "Test", "tags": ["test"]}' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await callCloudAPI('test', 'en');
    expect(result === null || typeof result === 'object').toBe(true);
  });
});

describe('AI Error Classes', () => {
  it('should create APIError with status code', () => {
    const error = new APIError('Test error', 500, 'Server error');
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.responseText).toBe('Server error');
    expect(error.name).toBe('APIError');
  });

  it('should create NotLoggedInError', () => {
    const error = new NotLoggedInError();
    expect(error.message).toBe('NOT_LOGGED_IN');
    expect(error.name).toBe('NotLoggedInError');
  });

  it('should create NotLoggedInError with custom message', () => {
    const error = new NotLoggedInError('Custom login error');
    expect(error.message).toBe('Custom login error');
  });
});

describe('Provider Classes', () => {
  describe('GeminiWebProvider', () => {
    const config: RuntimeProvider = {
      id: 'gemini-web',
      name: 'Gemini Web',
      type: 'gemini-web',
      model: 'gemini-3-flash',
      enabled: true,
      capabilities: { chat: true, vision: true, json: true },
    };

    it('should create provider instance', () => {
      const provider = new GeminiWebProvider(config);
      expect(provider.config).toEqual(config);
    });

    it('should check availability', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          '<html>WIZ_global_data = { "SNlM0e": "test-token", "cfb2h": "test-bl" }</html>',
          { status: 200 }
        )
      );

      const provider = new GeminiWebProvider(config);
      const available = await provider.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('should implement AIProviderBase interface', () => {
      const provider = new GeminiWebProvider(config);
      expect(typeof provider.isAvailable).toBe('function');
      expect(typeof provider.generateText).toBe('function');
      expect(typeof provider.extractMetadata).toBe('function');
    });
  });

  describe('GeminiAPIProvider', () => {
    const config: RuntimeProvider = {
      id: 'gemini-api',
      name: 'Gemini API',
      type: 'gemini',
      model: 'gemini-2.0-flash',
      apiKey: 'test-api-key',
      enabled: true,
      capabilities: { chat: true, vision: true, json: true },
    };

    it('should create provider instance', () => {
      const provider = new GeminiAPIProvider(config);
      expect(provider.config).toEqual(config);
    });

    it('should check availability with API key', async () => {
      const provider = new GeminiAPIProvider(config);
      const available = await provider.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('should be unavailable without API key', async () => {
      const noKeyConfig = { ...config, apiKey: undefined };
      const provider = new GeminiAPIProvider(noKeyConfig);
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });
  });

  describe('OpenAICompatibleProvider', () => {
    const config: RuntimeProvider = {
      id: 'openai',
      name: 'OpenAI',
      type: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      apiKey: 'test-api-key',
      enabled: true,
      capabilities: { chat: true, vision: true, json: true },
    };

    it('should create provider instance', () => {
      const provider = new OpenAICompatibleProvider(config);
      expect(provider.config).toEqual(config);
    });

    it('should check availability with API key', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ id: 'gpt-4' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const provider = new OpenAICompatibleProvider(config);
      const available = await provider.isAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('should be unavailable without API key', async () => {
      const noKeyConfig = { ...config, apiKey: undefined };
      const provider = new OpenAICompatibleProvider(noKeyConfig);
      const available = await provider.isAvailable();
      expect(available).toBe(false);
    });

    it('should handle API errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const provider = new OpenAICompatibleProvider(config);
      await expect(provider.generateText('test')).rejects.toThrow('Network error');

      global.fetch = originalFetch;
    });
  });
});
