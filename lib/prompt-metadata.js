import { buildDeferredMetadata, matchTaxonomyCategory, normalizeTags } from './text-analysis.js';
import {
  CATEGORY_TYPES,
  getCustomCategoryOptions,
  inferOutputModality,
  normalizePromptForStorage,
  normalizeOutputModality,
  resolveSystemCategoryKey,
} from './taxonomy.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeConfidence(value, fallback = undefined) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function getCustomCategoriesForClassification(prompts = [], excludePromptId = '') {
  return getCustomCategoryOptions(
    (prompts || []).filter((prompt) => String(prompt?.id || '') !== String(excludePromptId || ''))
  );
}

export function buildCategoryUniversePrompt(customCategories = [], locale = 'zh_CN') {
  const categories = (customCategories || []).map((item) => normalizeText(item)).filter(Boolean);

  if (String(locale || '').toLowerCase().startsWith('zh')) {
    if (categories.length === 0) {
      return '\n\n当前没有可用的已有自定义分类。只在系统分类中判断。';
    }

    return `\n\n额外分类上下文：\n- 除系统分类外，还存在以下用户已有自定义分类。\n- 如果某个自定义分类明显比系统分类更贴切，可以输出 \`recommended_category_type = "custom"\`。\n- 当你选择自定义分类时，\`recommended_category_key\` 必须与下列某一项完全一致。\n- \`confidence\` 必须是在“系统分类 + 全部已有自定义分类”一起比较后的最终置信度。\n- 只有在某个分类明显最匹配时才给 \`confidence >= 0.8\`；否则给低于 0.8，业务层会把它归到待确认。\n当前已有自定义分类：\n${categories.map((category) => `- ${category}`).join('\n')}`;
  }

  if (categories.length === 0) {
    return '\n\nThere are no existing custom categories available. Classify only against the system categories.';
  }

  return `\n\nAdditional category context:\n- Besides the system categories, the user also has the custom categories below.\n- If one custom category is clearly a better fit than every system category, return \`recommended_category_type = "custom"\`.\n- When choosing a custom category, \`recommended_category_key\` must exactly match one of the items below.\n- \`confidence\` must reflect the final confidence after comparing across system categories plus all existing custom categories.\n- Only use \`confidence >= 0.8\` when one category is clearly the best fit; otherwise keep it below 0.8 and the app will route it to pending review.\nExisting custom categories:\n${categories.map((category) => `- ${category}`).join('\n')}`;
}

function didCategorySelectionChange(existingPrompt = null, metadata = {}) {
  if (!existingPrompt) return true;

  const nextType = normalizeText(metadata.category_type);
  const nextKey = normalizeText(metadata.category_key);
  const prevType = normalizeText(existingPrompt.category_type);
  const prevKey = normalizeText(existingPrompt.category_key);

  return nextType !== prevType || nextKey !== prevKey;
}

function deriveInitialOutputModality(content, metadata = {}, options = {}) {
  const forcedOutputModality = normalizeOutputModality(options.forceOutputModality);
  if (forcedOutputModality) {
    return {
      output_modality: forcedOutputModality,
      output_modality_locked: true,
      needs_output_modality_review: false,
    };
  }

  const aiOutputModality = metadata.output_modality_source === 'ai'
    ? normalizeOutputModality(metadata.output_modality)
    : '';
  if (aiOutputModality) {
    return {
      output_modality: aiOutputModality,
      output_modality_locked: true,
      needs_output_modality_review: false,
    };
  }

  const explicitOutputModality = normalizeOutputModality(metadata.output_modality);
  if (explicitOutputModality === 'image' || explicitOutputModality === 'video') {
    return {
      output_modality: explicitOutputModality,
      output_modality_locked: true,
      needs_output_modality_review: false,
    };
  }

  const existingOutputModality = normalizeOutputModality(options.existingPrompt?.output_modality);
  if (existingOutputModality && explicitOutputModality === existingOutputModality) {
    return {
      output_modality: existingOutputModality,
      output_modality_locked: Boolean(options.existingPrompt?.output_modality_locked),
      needs_output_modality_review: Boolean(options.existingPrompt?.needs_output_modality_review),
    };
  }

  return {
    output_modality: inferOutputModality(content),
    output_modality_locked: false,
    needs_output_modality_review: true,
  };
}

async function deriveInitialCategoryState(content, metadata = {}, options = {}) {
  const existingPrompt = options.existingPrompt || null;
  const categoryChanged = didCategorySelectionChange(existingPrompt, metadata);
  const categorySource = normalizeText(metadata.category_source);
  const explicitType = normalizeText(metadata.category_type);
  const explicitKey = normalizeText(metadata.category_key);
  const reviewConfirmed = Boolean(metadata.confirm_category_review);
  const manualCustomCategory = Boolean(metadata.manual_custom_category ?? existingPrompt?.manual_custom_category);

  if (manualCustomCategory) {
    const manualKey = explicitKey || normalizeText(metadata.category) || normalizeText(existingPrompt?.category_key);
    if (manualKey) {
      return {
        category_type: CATEGORY_TYPES.CUSTOM,
        category_key: manualKey,
        classification_confidence: normalizeConfidence(metadata.classification_confidence, 1),
        needs_category_review: !reviewConfirmed,
      };
    }
  }

  if (metadata.classification_source === 'ai') {
    const aiType = normalizeText(metadata.category_type);
    const aiKey = normalizeText(metadata.category_key);
    if (aiKey && (aiType === CATEGORY_TYPES.SYSTEM || aiType === CATEGORY_TYPES.CUSTOM || aiType === CATEGORY_TYPES.PENDING)) {
      const aiConfidence = normalizeConfidence(metadata.classification_confidence, 0.85);
      return {
        category_type: aiConfidence >= 0.8
          ? (aiType === CATEGORY_TYPES.CUSTOM ? CATEGORY_TYPES.CUSTOM : CATEGORY_TYPES.SYSTEM)
          : CATEGORY_TYPES.PENDING,
        category_key: aiKey,
        classification_confidence: aiConfidence,
        needs_category_review: aiConfidence < 0.8,
      };
    }
  }

  if (existingPrompt && !categoryChanged && !reviewConfirmed) {
    return {
      category_type: normalizeText(existingPrompt.category_type),
      category_key: normalizeText(existingPrompt.category_key),
      classification_confidence: normalizeConfidence(existingPrompt.classification_confidence),
      needs_category_review: Boolean(existingPrompt.needs_category_review),
    };
  }

  if (categorySource === 'system' && explicitType === CATEGORY_TYPES.SYSTEM && explicitKey) {
    const systemKey = await resolveSystemCategoryKey(explicitKey);
    if (systemKey) {
      return {
        category_type: CATEGORY_TYPES.SYSTEM,
        category_key: systemKey,
        classification_confidence: normalizeConfidence(metadata.classification_confidence, 1),
        needs_category_review: false,
      };
    }
  }

  if ((categorySource === 'mine' || categorySource === 'custom') && explicitType === CATEGORY_TYPES.CUSTOM && explicitKey) {
    return {
      category_type: CATEGORY_TYPES.CUSTOM,
      category_key: explicitKey,
      classification_confidence: normalizeConfidence(metadata.classification_confidence, 1),
      needs_category_review: !reviewConfirmed,
    };
  }

  const heuristicConfidence = normalizeConfidence(metadata.classification_confidence, explicitKey ? 0.6 : 0.35);

  if ((explicitType === CATEGORY_TYPES.SYSTEM || explicitType === CATEGORY_TYPES.PENDING) && explicitKey) {
    const systemKey = await resolveSystemCategoryKey(explicitKey);
    return {
      category_type: CATEGORY_TYPES.PENDING,
      category_key: systemKey || explicitKey,
      classification_confidence: heuristicConfidence,
      needs_category_review: true,
    };
  }

  const heuristicKey = matchTaxonomyCategory(content) || 'general_productivity';
  return {
    category_type: CATEGORY_TYPES.PENDING,
    category_key: heuristicKey,
    classification_confidence: heuristicConfidence,
    needs_category_review: true,
  };
}

async function deriveAiRecommendationState(metadata = {}) {
  const aiType = normalizeText(
    metadata.ai_category_type || (metadata.classification_source === 'ai' ? metadata.category_type : '')
  );
  const aiKey = normalizeText(
    metadata.ai_category_key || (metadata.classification_source === 'ai' ? metadata.category_key : '')
  );
  const aiConfidence = normalizeConfidence(
    metadata.ai_category_confidence,
    normalizeConfidence(metadata.classification_confidence)
  );

  if (!aiKey) {
    return {
      ai_category_type: '',
      ai_category_key: '',
      ai_category_confidence: aiConfidence,
    };
  }

  if (aiType === CATEGORY_TYPES.CUSTOM) {
    return {
      ai_category_type: CATEGORY_TYPES.CUSTOM,
      ai_category_key: aiKey,
      ai_category_confidence: aiConfidence,
    };
  }

  const systemKey = await resolveSystemCategoryKey(aiKey);
  return {
    ai_category_type: CATEGORY_TYPES.SYSTEM,
    ai_category_key: systemKey || aiKey,
    ai_category_confidence: aiConfidence,
  };
}

export async function buildSavedPromptMetadata(content, metadata = {}, options = {}) {
  const locale = options.locale || 'zh_CN';
  const deferred = buildDeferredMetadata(content, {
    title: metadata.title,
    tags: metadata.tags,
    titleAutoGenerated: metadata.titleAutoGenerated,
  });

  const outputState = deriveInitialOutputModality(content, metadata, options);
  const categoryState = await deriveInitialCategoryState(content, metadata, options);
  const aiRecommendationState = await deriveAiRecommendationState(metadata);

  const normalized = await normalizePromptForStorage({
    category_type: categoryState.category_type,
    category_key: categoryState.category_key,
    category: metadata.category,
    output_modality: outputState.output_modality,
    classification_confidence: categoryState.classification_confidence,
  }, {
    locale,
    includeDisplayCategory: true,
    defaultOutputModality: outputState.output_modality,
  });

  return {
    title: deferred.title,
    tags: normalizeTags(deferred.tags),
    titleAutoGenerated: deferred.titleAutoGenerated,
    category: normalized.category || '',
    category_type: normalized.category_type || '',
    category_key: normalized.category_key || '',
    output_modality: normalizeOutputModality(normalized.output_modality) || 'text',
    output_modality_locked: Boolean(outputState.output_modality_locked),
    classification_confidence: normalizeConfidence(normalized.classification_confidence),
    needs_output_modality_review: Boolean(outputState.needs_output_modality_review),
    needs_category_review: Boolean(categoryState.needs_category_review),
    manual_custom_category: Boolean(metadata.manual_custom_category ?? options.existingPrompt?.manual_custom_category),
    ai_category_type: aiRecommendationState.ai_category_type,
    ai_category_key: aiRecommendationState.ai_category_key,
    ai_category_confidence: aiRecommendationState.ai_category_confidence,
  };
}
