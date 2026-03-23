import type { Provider, GeminiProvider, OpenAIProvider } from '../types/provider';
import { LocalStorage } from './storage';

export function safeParseJSON<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(fixed) as T;
  }
}

export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export function keepAlive(): () => void {
  const interval = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
  }, 25000);
  return () => clearInterval(interval);
}

export async function getProviders(): Promise<Provider[]> {
  const providers = await LocalStorage.get<Provider[]>('providers');
  return (
    providers || [
      { id: 'gemini-web-default', name: 'Gemini Web', type: 'gemini-web', enabled: true },
    ]
  );
}

export async function setProviders(providers: Provider[]): Promise<void> {
  await LocalStorage.set('providers', providers);
}

export async function getActiveProvider(): Promise<Provider | null> {
  const providers = await LocalStorage.get<Provider[]>('providers');
  const activeProviderId = await LocalStorage.get<string>('activeProviderId');
  const list = providers || [];

  if (activeProviderId) {
    const found = list.find(p => p.id === activeProviderId);
    if (found) return found;
  }

  const enabled = list.find(p => p.enabled);
  if (enabled) return enabled;

  return null;
}

export async function migrateProviderSettings(): Promise<void> {
  const oldKeys = [
    'aiProvider',
    'geminiApiKey',
    'openaiApiUrl',
    'openaiApiKey',
    'openaiModel',
    'providers',
  ];
  const old = (await chrome.storage.local.get(oldKeys)) as Record<string, string>;

  if (old['providers']) return;

  if (!old['aiProvider'] || old['aiProvider'] === 'nano') {
    await LocalStorage.set('providers', [
      { id: 'gemini-web-default', name: 'Gemini Web', type: 'gemini-web', enabled: true },
    ]);
    await LocalStorage.set('activeProviderId', 'gemini-web-default');
  } else {
    const providers: Provider[] = [];
    let activeId = '';

    if (old['aiProvider'] === 'gemini' && old['geminiApiKey']) {
      const id = 'migrated-gemini';
      providers.push({
        id,
        name: 'Gemini API',
        type: 'gemini',
        apiKey: old['geminiApiKey'],
        model: 'gemini-2.0-flash',
        enabled: true,
      });
      activeId = id;
    }

    if (old['aiProvider'] === 'openai' && old['openaiApiKey']) {
      const id = 'migrated-openai';
      providers.push({
        id,
        name: 'OpenAI',
        type: 'openai',
        apiUrl: old['openaiApiUrl'] || 'https://api.openai.com/v1',
        apiKey: old['openaiApiKey'],
        model: old['openaiModel'] || 'gpt-4o-mini',
        enabled: true,
      });
      activeId = id;
    }

    await LocalStorage.set('providers', providers);
    await LocalStorage.set('activeProviderId', activeId);
  }

  await chrome.storage.local.remove(oldKeys);
}

interface MetadataResult {
  title: string;
  category: string;
  tags?: string[];
}

export async function callCloudAPI(
  text: string,
  lang: 'zh' | 'en'
): Promise<MetadataResult | null> {
  const provider = await getActiveProvider();
  if (!provider) return null;

  const userContent = text.substring(0, 500);

  if (provider.type === 'gemini') {
    return callGeminiAPI(provider, userContent, lang);
  } else if (provider.type === 'openai') {
    return callOpenAIAPI(provider, userContent, lang);
  }

  return null;
}

async function callGeminiAPI(
  provider: GeminiProvider,
  userContent: string,
  lang: 'zh' | 'en'
): Promise<MetadataResult | null> {
  const model = provider.model || 'gemini-2.0-flash';
  const systemPrompt =
    lang === 'zh'
      ? 'Extract title, category, and tags from the following prompt content. Return as JSON.'
      : 'Extract title, category, and tags from the following prompt content. Return as JSON.';

  const resp = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: {
          responseModalities: ['TEXT'],
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!resp.ok) {
    throw new Error(`Gemini API ${resp.status}`);
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }
  const data = (await resp.json()) as GeminiResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) return null;

  try {
    return safeParseJSON<MetadataResult>(rawText);
  } catch {
    return null;
  }
}

async function callOpenAIAPI(
  provider: OpenAIProvider,
  userContent: string,
  lang: 'zh' | 'en'
): Promise<MetadataResult | null> {
  const systemPrompt =
    lang === 'zh'
      ? 'Extract title, category, and tags from the following prompt content. Return as JSON with fields: title, category, tags.'
      : 'Extract title, category, and tags from the following prompt content. Return as JSON with fields: title, category, tags.';

  const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API ${resp.status}`);
  }

  interface OpenAIResponse {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }
  const data = (await resp.json()) as OpenAIResponse;
  const rawText = data.choices?.[0]?.message?.content;

  if (!rawText) return null;

  try {
    return safeParseJSON<MetadataResult>(rawText);
  } catch {
    return null;
  }
}
