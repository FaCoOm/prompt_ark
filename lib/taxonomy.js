const TAXONOMY_URL = chrome.runtime.getURL('taxonomy.v1.json');
const CATEGORY_TYPE_SYSTEM = 'system';
const CATEGORY_TYPE_CUSTOM = 'custom';
const CATEGORY_TYPE_PENDING = 'pending';
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const LEGACY_SYSTEM_CATEGORY_MAP = new Map([
  ['productivity', 'general_productivity'],
  ['职场效率', 'general_productivity'],
  ['lifestyle', 'general_productivity'],
  ['生活助手', 'general_productivity'],
  ['ai & prompting', 'general_productivity'],
  ['ai and prompting', 'general_productivity'],
  ['context grabber', 'general_productivity'],
  ['context grabber ★', 'general_productivity'],
  ['writing', 'writing_editing'],
  ['中文写作', 'writing_editing'],
  ['coding', 'coding_dev'],
  ['编程开发', 'coding_dev'],
  ['education', 'research_learning'],
  ['学习教育', 'research_learning'],
  ['国学文化', 'research_learning'],
  ['creative', 'creative_media'],
  ['自媒体', 'creative_media'],
  ['analysis', 'data_analytics'],
  ['思维工具', 'data_analytics'],
]);

let _taxonomyPromise = null;

function normalizeText(value) {
  return String(value || '').trim();
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

export function inferOutputModality(text = '') {
  const lower = String(text || '').toLowerCase();
  if (!lower) return 'text';

  const videoHints = [
    'video', 'youtube', 'shorts', 'reels', 'tiktok', '剪辑', '视频', '脚本',
    '分镜', '口播', '镜头', '运镜', '字幕', '配音'
  ];
  const imageHints = [
    'image', 'midjourney', 'stable diffusion', 'flux', 'poster', 'logo', 'illustration',
    '海报', '封面', '图片', '图像', '插画', '摄影', '视觉', 'logo'
  ];

  if (videoHints.some(keyword => lower.includes(keyword))) return 'video';
  if (imageHints.some(keyword => lower.includes(keyword))) return 'image';
  return 'text';
}

function buildLookup(taxonomy) {
  const byId = new Map();
  const aliasToId = new Map();

  const domains = Array.isArray(taxonomy?.domains) ? taxonomy.domains : [];
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

  return { byId, aliasToId };
}

export async function getTaxonomy() {
  if (!_taxonomyPromise) {
    _taxonomyPromise = fetch(TAXONOMY_URL).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load taxonomy: ${response.status}`);
      }
      const taxonomy = await response.json();
      return { ...taxonomy, _lookup: buildLookup(taxonomy) };
    });
  }
  return _taxonomyPromise;
}

export async function getSystemCategoryOptions(locale = 'zh_CN') {
  const taxonomy = await getTaxonomy();
  const normalizedLocale = normalizeLocale(locale);
  return [...(taxonomy.domains || [])]
    .filter(domain => domain?.is_active !== false)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((domain) => ({
      id: domain.authority_category_id,
      label: normalizedLocale === 'zh_CN' ? domain.label_zh : domain.label_en,
      label_zh: domain.label_zh,
      label_en: domain.label_en,
    }));
}

export async function resolveSystemCategoryKey(rawValue) {
  const value = normalizeText(rawValue);
  if (!value) return '';
  const taxonomy = await getTaxonomy();
  const normalized = value.toLowerCase();
  return taxonomy._lookup.aliasToId.get(normalized) || '';
}

export async function resolveKnownSystemCategoryKey(rawValue) {
  const mappedKey = await resolveSystemCategoryKey(rawValue);
  if (mappedKey) return mappedKey;

  const normalized = normalizeText(rawValue).toLowerCase();
  return LEGACY_SYSTEM_CATEGORY_MAP.get(normalized) || '';
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
  const legacyCategory = normalizeText(input.category);

  if (explicitType === CATEGORY_TYPE_CUSTOM && explicitKey) {
    return { category_type: CATEGORY_TYPE_CUSTOM, category_key: explicitKey };
  }

  if ((explicitType === CATEGORY_TYPE_SYSTEM || explicitType === CATEGORY_TYPE_PENDING) && explicitKey) {
    const mappedKey = await resolveKnownSystemCategoryKey(explicitKey);
    if (mappedKey) {
      return { category_type: explicitType, category_key: mappedKey };
    }
  }

  if (legacyCategory) {
    const mappedKey = await resolveKnownSystemCategoryKey(legacyCategory);
    if (mappedKey) {
      return { category_type: CATEGORY_TYPE_SYSTEM, category_key: mappedKey };
    }
    return { category_type: CATEGORY_TYPE_CUSTOM, category_key: legacyCategory };
  }

  return { category_type: '', category_key: '' };
}

export async function derivePromptCategory(prompt, locale = 'zh_CN') {
  const categoryType = normalizeText(prompt?.category_type);
  const categoryKey = normalizeText(prompt?.category_key);

  if (!categoryType || !categoryKey) {
    return normalizeText(prompt?.category);
  }

  if (categoryType === CATEGORY_TYPE_CUSTOM) {
    return categoryKey;
  }

  if (categoryType === CATEGORY_TYPE_SYSTEM || categoryType === CATEGORY_TYPE_PENDING) {
    return await getSystemCategoryLabel(categoryKey, locale);
  }

  return normalizeText(prompt?.category);
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
  if (result.output_modality) nextPrompt.output_modality = result.output_modality;

  const confidence = Number(result.confidence);
  if (Number.isFinite(confidence)) {
    nextPrompt.classification_confidence = confidence;
  }

  const recommendedKey = await resolveKnownSystemCategoryKey(result.recommended_category_key);
  if (recommendedKey) {
    nextPrompt.category_key = recommendedKey;

    if (!isConfirmedCategoryType(nextPrompt.category_type)) {
      nextPrompt.category_type = confidence >= HIGH_CONFIDENCE_THRESHOLD
        ? CATEGORY_TYPE_SYSTEM
        : CATEGORY_TYPE_PENDING;
    }
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
