import { getSupabaseConfig } from './supabase/config.js';

const TAXONOMY_URL = chrome.runtime.getURL('taxonomy.v1.json');
const HUB_TAXONOMY_RPC = 'get_extension_taxonomy_v1';
const CATEGORY_TYPE_SYSTEM = 'system';
const CATEGORY_TYPE_CUSTOM = 'custom';
const CATEGORY_TYPE_PENDING = 'pending';
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const OUTPUT_MODALITIES = new Set(['text', 'image', 'video']);
const RUNTIME_TAXONOMY_KEY = 'hub_taxonomy_cache';

let _taxonomyPromise = null;
let _bundledTaxonomyPromise = null;

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function stripLookup(taxonomy = {}) {
  const { _lookup, ...plain } = taxonomy || {};
  return plain;
}

export function normalizeLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('zh') ? 'zh_CN' : 'en';
}

export function isConfirmedCategoryType(type) {
  return type === CATEGORY_TYPE_SYSTEM || type === CATEGORY_TYPE_CUSTOM;
}

export function isSystemCategoryType(type) {
  return type === CATEGORY_TYPE_SYSTEM || type === CATEGORY_TYPE_PENDING;
}

export function normalizeOutputModality(value) {
  const normalized = normalizeText(value).toLowerCase();
  return OUTPUT_MODALITIES.has(normalized) ? normalized : '';
}

export function inferOutputModality(text = '') {
  const lower = String(text || '').toLowerCase();
  if (!lower) return 'text';

  const imageHints = [
    'image', 'midjourney', 'stable diffusion', 'flux', 'poster', 'logo', 'illustration',
    '海报', '封面', '图片', '图像', '插画', '摄影', '视觉', 'logo'
  ];

  if (imageHints.some(keyword => lower.includes(keyword))) return 'image';
  return 'text';
}

function buildLookup(taxonomy) {
  const byId = new Map();
  const aliasToId = new Map();
  const modalitiesById = new Map();

  const domains = normalizeArray(taxonomy?.domains);
  for (const domain of domains) {
    if (!domain?.authority_category_id) continue;

    const id = domain.authority_category_id;
    byId.set(id, domain);

    const aliases = [
      id,
      domain.label_zh,
      domain.label_en,
      ...(Array.isArray(domain.alt_labels) ? domain.alt_labels : [])
    ];

    aliases.forEach((alias) => {
      const normalized = normalizeText(alias).toLowerCase();
      if (normalized) aliasToId.set(normalized, id);
    });
  }

  const modalities = normalizeArray(taxonomy?.modalities);
  for (const modality of modalities) {
    if (!modality?.id) continue;
    modalitiesById.set(modality.id, modality);
  }

  return { byId, aliasToId, modalitiesById };
}

function normalizeTaxonomy(taxonomy = {}) {
  const normalized = {
    version: normalizeText(taxonomy.version) || 'taxonomy.v1',
    scheme_id: normalizeText(taxonomy.scheme_id) || 'prompt-domains-v1',
    scheme_label: normalizeText(taxonomy.scheme_label) || 'Prompt Domains',
    revision: normalizeText(taxonomy.revision || taxonomy.generated_at),
    generated_at: normalizeText(taxonomy.generated_at),
    modalities: normalizeArray(taxonomy.modalities)
      .filter((item) => normalizeText(item?.id))
      .map((item) => ({
        id: normalizeText(item.id),
        label_zh: normalizeText(item.label_zh),
        label_en: normalizeText(item.label_en),
        icon: normalizeText(item.icon),
        sort_order: Number(item.sort_order || 0),
        is_active: item?.is_active !== false,
      })),
    domains: normalizeArray(taxonomy.domains)
      .filter((item) => normalizeText(item?.authority_category_id))
      .map((item) => ({
        authority_category_id: normalizeText(item.authority_category_id),
        label_zh: normalizeText(item.label_zh),
        label_en: normalizeText(item.label_en),
        alt_labels: normalizeArray(item.alt_labels)
          .map(alias => normalizeText(alias))
          .filter(Boolean),
        sort_order: Number(item.sort_order || 0),
        is_active: item?.is_active !== false,
      })),
  };

  return { ...normalized, _lookup: buildLookup(normalized) };
}

function isValidTaxonomyShape(taxonomy) {
  return Boolean(
    taxonomy &&
    typeof taxonomy === 'object' &&
    Array.isArray(taxonomy.domains) &&
    Array.isArray(taxonomy.modalities)
  );
}

export function invalidateTaxonomyCache() {
  _taxonomyPromise = null;
}

export async function loadBundledTaxonomy() {
  if (!_bundledTaxonomyPromise) {
    _bundledTaxonomyPromise = fetch(TAXONOMY_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load taxonomy: ${response.status}`);
      }
      return normalizeTaxonomy(await response.json());
    });
  }

  return _bundledTaxonomyPromise;
}

export async function loadRuntimeTaxonomy() {
  const result = await chrome.storage.local.get([RUNTIME_TAXONOMY_KEY]);
  const runtimeTaxonomy = result?.[RUNTIME_TAXONOMY_KEY];
  if (!isValidTaxonomyShape(runtimeTaxonomy)) return null;
  return normalizeTaxonomy(runtimeTaxonomy);
}

async function fetchHubTaxonomy() {
  const { url, anonKey } = await getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${HUB_TAXONOMY_RPC}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: '{}',
  });

  if (!response.ok) {
    throw new Error(`Hub taxonomy sync failed (${response.status})`);
  }

  const taxonomy = await response.json();
  if (!isValidTaxonomyShape(taxonomy)) {
    throw new Error('Hub taxonomy payload is invalid');
  }

  return normalizeTaxonomy(taxonomy);
}

export async function syncHubTaxonomy() {
  const taxonomy = await fetchHubTaxonomy();
  const plainTaxonomy = stripLookup(taxonomy);

  await chrome.storage.local.set({
    [RUNTIME_TAXONOMY_KEY]: plainTaxonomy,
  });

  _taxonomyPromise = Promise.resolve(taxonomy);
  return taxonomy;
}

export async function getTaxonomy() {
  if (!_taxonomyPromise) {
    _taxonomyPromise = (async () => {
      const runtimeTaxonomy = await loadRuntimeTaxonomy();
      if (runtimeTaxonomy) return runtimeTaxonomy;
      return loadBundledTaxonomy();
    })();
  }

  return _taxonomyPromise;
}

export async function getSystemCategoryOptions(locale = 'zh_CN', options = {}) {
  const taxonomy = await getTaxonomy();
  const normalizedLocale = normalizeLocale(locale);
  const includeInactive = Boolean(options?.includeInactive);

  return [...normalizeArray(taxonomy.domains)]
    .filter(domain => includeInactive || domain?.is_active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((domain) => ({
      id: domain.authority_category_id,
      label: normalizedLocale === 'zh_CN' ? domain.label_zh : domain.label_en,
      label_zh: domain.label_zh,
      label_en: domain.label_en,
    }));
}

function getDefaultModalityMeta(modality = 'text', locale = 'zh_CN') {
  const normalizedLocale = normalizeLocale(locale);

  switch (normalizeText(modality).toLowerCase()) {
    case 'image':
      return {
        id: 'image',
        icon: '🖼️',
        label: normalizedLocale === 'zh_CN' ? '图像' : 'Image',
      };
    case 'video':
      return {
        id: 'video',
        icon: '🎬',
        label: normalizedLocale === 'zh_CN' ? '视频' : 'Video',
      };
    case 'text':
    default:
      return {
        id: 'text',
        icon: '📝',
        label: normalizedLocale === 'zh_CN' ? '文本' : 'Text',
      };
  }
}

export async function getOutputModalityOptions(locale = 'zh_CN', options = {}) {
  const taxonomy = await getTaxonomy();
  const normalizedLocale = normalizeLocale(locale);
  const includeInactive = Boolean(options?.includeInactive);

  return [...normalizeArray(taxonomy.modalities)]
    .filter((modality) => includeInactive || modality?.is_active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((modality) => {
      const fallback = getDefaultModalityMeta(modality.id, normalizedLocale);
      return {
        id: modality.id,
        icon: normalizeText(modality.icon) || fallback.icon,
        label: normalizedLocale === 'zh_CN'
          ? (normalizeText(modality.label_zh) || normalizeText(modality.label_en) || fallback.label)
          : (normalizeText(modality.label_en) || normalizeText(modality.label_zh) || fallback.label),
        label_zh: normalizeText(modality.label_zh) || fallback.label,
        label_en: normalizeText(modality.label_en) || fallback.label,
        is_active: modality.is_active !== false,
      };
    });
}

export async function getOutputModalityMeta(modality = 'text', locale = 'zh_CN') {
  const normalizedModality = normalizeText(modality).toLowerCase() || 'text';
  const taxonomy = await getTaxonomy();
  const resolved = taxonomy?._lookup?.modalitiesById?.get(normalizedModality);
  const fallback = getDefaultModalityMeta(normalizedModality, locale);

  if (!resolved) {
    return fallback;
  }

  const normalizedLocale = normalizeLocale(locale);
  return {
    id: resolved.id,
    icon: normalizeText(resolved.icon) || fallback.icon,
    label: normalizedLocale === 'zh_CN'
      ? (normalizeText(resolved.label_zh) || normalizeText(resolved.label_en) || fallback.label)
      : (normalizeText(resolved.label_en) || normalizeText(resolved.label_zh) || fallback.label),
  };
}

export async function resolveSystemCategoryKey(rawValue) {
  const value = normalizeText(rawValue);
  if (!value) return '';
  const taxonomy = await getTaxonomy();
  const normalized = value.toLowerCase();
  return taxonomy._lookup.aliasToId.get(normalized) || '';
}

export async function getSystemCategoryLabel(categoryKey, locale = 'zh_CN') {
  const key = normalizeText(categoryKey);
  if (!key) return '';

  const taxonomy = await getTaxonomy();
  const domain = taxonomy._lookup.byId.get(key);
  if (!domain) return '';

  return normalizeLocale(locale) === 'zh_CN' ? domain.label_zh : domain.label_en;
}

export async function normalizeCategorySelection(input = {}) {
  const explicitType = normalizeText(input.category_type);
  const explicitKey = normalizeText(input.category_key);

  if (explicitType === CATEGORY_TYPE_CUSTOM && explicitKey) {
    return { category_type: CATEGORY_TYPE_CUSTOM, category_key: explicitKey };
  }

  if (explicitType === CATEGORY_TYPE_PENDING && explicitKey) {
    const mappedKey = await resolveSystemCategoryKey(explicitKey);
    return { category_type: CATEGORY_TYPE_PENDING, category_key: mappedKey || explicitKey };
  }

  if (explicitType === CATEGORY_TYPE_SYSTEM && explicitKey) {
    const mappedKey = await resolveSystemCategoryKey(explicitKey);
    if (mappedKey) {
      return { category_type: explicitType, category_key: mappedKey };
    }
  }

  return { category_type: '', category_key: '' };
}

export async function derivePromptCategory(prompt, locale = 'zh_CN') {
  const categoryType = normalizeText(prompt?.category_type);
  const categoryKey = normalizeText(prompt?.category_key);

  if (!categoryType || !categoryKey) return '';

  if (categoryType === CATEGORY_TYPE_CUSTOM) {
    return categoryKey;
  }

  if (categoryType === CATEGORY_TYPE_PENDING) {
    return await getSystemCategoryLabel(categoryKey, locale) || categoryKey;
  }

  if (categoryType === CATEGORY_TYPE_SYSTEM) {
    return await getSystemCategoryLabel(categoryKey, locale);
  }

  return '';
}

export async function migratePromptCategoryFields(prompt = {}, options = {}) {
  const locale = normalizeLocale(options.locale);
  const migrated = { ...prompt };
  const resolved = await normalizeCategorySelection(migrated);

  if (resolved.category_type) {
    migrated.category_type = resolved.category_type;
    migrated.category_key = resolved.category_key;
  } else {
    delete migrated.category_type;
    delete migrated.category_key;
  }

  if (migrated.classification_confidence !== undefined && migrated.classification_confidence !== null) {
    const numericConfidence = Number(migrated.classification_confidence);
    migrated.classification_confidence = Number.isFinite(numericConfidence) ? numericConfidence : undefined;
  }

  if (options.includeDisplayCategory) {
    migrated.category = await derivePromptCategory(migrated, locale);
  } else {
    delete migrated.category;
  }

  return migrated;
}

export async function hydratePromptForDisplay(prompt = {}, options = {}) {
  const locale = normalizeLocale(options.locale);
  const hydrated = await migratePromptCategoryFields(prompt, { locale, includeDisplayCategory: true });
  return hydrated;
}

export async function hydratePromptsForDisplay(prompts = [], options = {}) {
  const locale = normalizeLocale(options.locale);
  return Promise.all(prompts.map(prompt => hydratePromptForDisplay(prompt, { locale })));
}

export async function applyClassificationResult(prompt = {}, result = {}, options = {}) {
  const locale = normalizeLocale(options.locale);
  const nextPrompt = { ...prompt };

  if (result.title) nextPrompt.title = result.title;
  if (Array.isArray(result.tags)) nextPrompt.tags = result.tags;
  const modality = normalizeOutputModality(result.output_modality);
  if (modality) nextPrompt.output_modality = modality;

  const confidence = Number(result.confidence);
  if (Number.isFinite(confidence)) {
    nextPrompt.classification_confidence = confidence;
  }

  const recommendedType = normalizeText(result.recommended_category_type);
  const rawRecommendedKey = normalizeText(result.recommended_category_key);
  let recommendedKey = '';
  let confirmedType = CATEGORY_TYPE_SYSTEM;

  if (recommendedType === CATEGORY_TYPE_CUSTOM && rawRecommendedKey) {
    recommendedKey = rawRecommendedKey;
    confirmedType = CATEGORY_TYPE_CUSTOM;
  } else if (rawRecommendedKey) {
    recommendedKey = await resolveSystemCategoryKey(rawRecommendedKey);
    confirmedType = CATEGORY_TYPE_SYSTEM;
  }

  if (recommendedKey) {
    nextPrompt.category_key = recommendedKey;
    nextPrompt.category_type = confidence >= HIGH_CONFIDENCE_THRESHOLD
      ? confirmedType
      : CATEGORY_TYPE_PENDING;
  }

  nextPrompt.category = await derivePromptCategory(nextPrompt, locale);
  return nextPrompt;
}

export function getCustomCategoryOptions(prompts = []) {
  const categories = new Set();
  prompts.forEach((prompt) => {
    if (prompt?.category_type === CATEGORY_TYPE_CUSTOM && prompt?.category_key) {
      categories.add(prompt.category_key);
    }
  });
  return [...categories].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export async function normalizePromptForStorage(prompt = {}, options = {}) {
  const normalized = await migratePromptCategoryFields(prompt, {
    locale: options.locale || 'zh_CN',
    includeDisplayCategory: Boolean(options.includeDisplayCategory)
  });

  if (!normalized.output_modality && options.defaultOutputModality) {
    normalized.output_modality = options.defaultOutputModality;
  }

  return normalized;
}

export const CATEGORY_TYPES = {
  SYSTEM: CATEGORY_TYPE_SYSTEM,
  CUSTOM: CATEGORY_TYPE_CUSTOM,
  PENDING: CATEGORY_TYPE_PENDING,
};

export const CLASSIFICATION_HIGH_CONFIDENCE = HIGH_CONFIDENCE_THRESHOLD;
