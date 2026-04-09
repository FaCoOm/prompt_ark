import { DEFAULT_PROMPTS } from './default-prompts.js';
import { extractVariables } from './variables.js';
import { getSupabaseConfig } from './supabase/config.js';

export const HUB_DEFAULT_PROMPTS_RPC = 'get_extension_default_prompts_v1';
export const DEFAULT_PROMPT_INIT_STATE_KEY = 'default_prompt_init_state';

export const DEFAULT_PROMPT_INIT_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeTags(tags) {
  return Array.isArray(tags)
    ? tags.map(tag => normalizeText(tag)).filter(Boolean)
    : [];
}

function buildLocalPromptBase(item, options = {}) {
  const content = String(item?.content || '');
  const prompt = {
    id: crypto.randomUUID(),
    title: normalizeText(item?.title) || 'Untitled',
    content,
    output_modality: normalizeText(item?.output_modality) || 'text',
    category_type: normalizeText(item?.category_type) || 'system',
    category_key: normalizeText(item?.category_key),
    category_source: normalizeText(item?.category_source) || 'system',
    tags: normalizeTags(item?.tags),
    variables: extractVariables(content),
    shortcut: normalizeText(options.shortcut),
    createdAt: Number(options.createdAt || Date.now()),
    usageCount: 0,
    lastUsed: null,
    lastUsedAt: null,
    favorite: false,
    builtIn: true,
    classification_confidence: Number.isFinite(Number(item?.classification_confidence))
      ? Number(item.classification_confidence)
      : 1,
    skip_async_enrich: item?.skip_async_enrich !== false,
    sync_hub_taxonomy: Boolean(options.syncHubTaxonomy),
    hub_prompt_id: normalizeText(options.hubPromptId),
    origin_action: normalizeText(options.originAction),
  };

  return prompt;
}

export function validateHubDefaultPromptPayload(payload) {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error('Hub default prompts payload is empty');
  }

  payload.forEach((item, index) => {
    const title = normalizeText(item?.title);
    const content = normalizeText(item?.content);
    const categoryKey = normalizeText(item?.category_key);
    const outputModality = normalizeText(item?.output_modality);
    const hubPromptId = normalizeText(item?.hub_prompt_id);

    if (!title || !content || !categoryKey || !outputModality || !hubPromptId) {
      throw new Error(`Hub default prompts payload is invalid at index ${index}`);
    }
  });

  return payload;
}

export async function fetchHubDefaultPrompts() {
  const { url, anonKey } = await getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${HUB_DEFAULT_PROMPTS_RPC}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`Hub default prompt init failed (${response.status})`);
  }

  const payload = await response.json();
  return validateHubDefaultPromptPayload(payload);
}

export function mapHubDefaultPromptToLocalPrompt(item, options = {}) {
  return buildLocalPromptBase(item, {
    createdAt: options.createdAt,
    shortcut: '',
    syncHubTaxonomy: true,
    hubPromptId: item?.hub_prompt_id,
    originAction: 'hub_default_init',
  });
}

export function buildBundledFallbackPrompts(options = {}) {
  const startedAt = Number(options.startedAt || Date.now());
  return DEFAULT_PROMPTS.map((item, index) => buildLocalPromptBase(item, {
    createdAt: startedAt + index,
    shortcut: item?.shortcut || '',
    syncHubTaxonomy: false,
    hubPromptId: '',
    originAction: 'bundled_default_init',
  }));
}

export async function initializeDefaultPrompts(options = {}) {
  const startedAt = Number(options.startedAt || Date.now());

  try {
    const payload = await fetchHubDefaultPrompts();
    const prompts = payload.map((item, index) => mapHubDefaultPromptToLocalPrompt(item, {
      createdAt: startedAt + index,
    }));

    return {
      source: 'hub',
      prompts,
    };
  } catch (hubError) {
    const prompts = buildBundledFallbackPrompts({ startedAt });
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw hubError;
    }

    return {
      source: 'bundled',
      prompts,
      fallbackReason: hubError?.message || 'Hub default prompt init failed',
    };
  }
}
