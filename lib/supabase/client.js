import { getHubUrl, getSiteRoot, getSupabaseConfig } from './config.js';
import { 
  initSupabaseClient, 
  setSession, 
  getUser, 
  from, 
  getSession, 
  isAuthenticated, 
  signOut,
  onAuthStateChange,
  authenticatedFetch
} from './minimal-client.js';

export async function initSupabase(accessToken, refreshToken, expiresAt, user) {
  if (!accessToken || !refreshToken) {
    console.warn('[Supabase] Missing tokens, skipping initialization');
    return;
  }
  
  const { url, anonKey } = await getSupabaseConfig();
  initSupabaseClient(
    url,
    anonKey,
    accessToken,
    refreshToken,
    expiresAt,
    user
  );
  
  console.log('[Supabase] Initialized for user:', user?.email);
}

export async function initSupabaseFromStorage() {
  const result = await chrome.storage.local.get([
    'accessToken', 
    'refreshToken', 
    'expiresAt', 
    'hubUser',
    'isLoggedIn'
  ]);
  
  if (result.isLoggedIn && result.accessToken && result.refreshToken) {
    await initSupabase(
      result.accessToken,
      result.refreshToken,
      result.expiresAt,
      result.hubUser
    );
    return true;
  }
  
  return false;
}

export async function ensureAuthenticatedSession() {
  if (!isAuthenticated()) {
    const restored = await initSupabaseFromStorage();
    if (!restored || !isAuthenticated()) {
      throw new Error('NOT_LOGGED_IN');
    }
  }

  const { url } = await getSupabaseConfig();

  try {
    const response = await authenticatedFetch(`${url}/auth/v1/user`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        signOut();
        throw new Error('NOT_LOGGED_IN');
      }
      throw new Error(`Supabase auth check failed: ${response.status}`);
    }

    const user = await response.json();
    return user || null;
  } catch (error) {
    const message = error?.message || '';
    if (
      message === 'NOT_LOGGED_IN' ||
      message.includes('No refresh token available') ||
      message.includes('Token refresh failed')
    ) {
      signOut();
      throw new Error('NOT_LOGGED_IN');
    }
    throw error;
  }
}

export { setSession, getUser, from, getSession, isAuthenticated, signOut, onAuthStateChange, authenticatedFetch };
export { getSession as getSupabaseSession, isAuthenticated as isSupabaseAuthenticated };

function detectLanguage(text) {
  if (!text) return 'en';
  const cjk = text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g);
  return (cjk && cjk.length > text.length * 0.1) ? 'zh' : 'en';
}

function extractVariableNames(content) {
  const matches = content?.match(/\{\{([^}]+)\}\}/g) || [];
  return [...new Set(matches.map(m => {
    const inner = m.replace(/\{\{|\}\}/g, '');
    return inner.split(/[:=|]/)[0].trim();
  }))];
}

function estimateQualityScore(content) {
  if (!content) return 0;
  let score = 50;
  if (content.includes('{{')) score += 10;
  if (content.includes('###')) score += 5;
  if (content.length > 500) score += 10;
  if (content.length > 1000) score += 10;
  return Math.min(score, 100);
}

function buildAuthorPayload(user) {
  return {
    authorId: user?.id || null,
    authorName: user?.email?.split('@')[0] || 'anonymous',
    authorAvatar: user?.user_metadata?.avatar_url || user?.avatar || user?.avatar_url || '',
  };
}

function normalizeMatchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getConfigAliases(item) {
  const aliases = item?.config?.aliases;
  return Array.isArray(aliases) ? aliases.filter(Boolean) : [];
}

function buildConfigCandidates(item) {
  return [
    item?.config_key,
    item?.labels?.en,
    item?.labels?.zh,
    ...(getConfigAliases(item)),
  ].map(normalizeMatchValue).filter(Boolean);
}

async function fetchHubConfigItems(configType) {
  const { url: supabaseUrl } = await getSupabaseConfig();
  const query = new URLSearchParams({
    select: '*',
    config_type: `eq.${configType}`,
    is_active: 'eq.true',
  });
  const response = await authenticatedFetch(`${supabaseUrl}/rest/v1/hub_config_items?${query.toString()}`);

  if (!response.ok) {
    console.warn(`[HubClient] Failed to fetch ${configType} config:`, response.status);
    return [];
  }

  return await response.json();
}

function findConfigByText(items, values = []) {
  const normalizedValues = values.map(normalizeMatchValue).filter(Boolean);
  if (normalizedValues.length === 0) return null;

  return items.find((item) => {
    const candidates = buildConfigCandidates(item);
    return normalizedValues.some(value => candidates.includes(value));
  }) || null;
}

function normalizeTags(tags) {
  return Array.isArray(tags)
    ? tags.map(tag => String(tag || '').trim()).filter(Boolean)
    : [];
}

function buildPromptPayload(prompt, visibility, authorMeta, matches = {}, options = {}) {
  const content = prompt?.content || '';
  const outputModality = prompt?.output_modality || 'text';
  const submittedCategoryType = prompt?.category_type || '';
  const submittedCategoryKey = prompt?.category_key || '';
  const submittedCategoryText = prompt?.category || submittedCategoryKey || 'General';
  const type = prompt?.type === 'pack' ? 'pack' : 'prompt';

  return {
    title: prompt?.title || 'Untitled',
    content,
    tags: normalizeTags(prompt?.tags),
    description: content.substring(0, 200),
    visibility,
    type,
    author: authorMeta.authorName,
    author_id: authorMeta.authorId,
    author_avatar: authorMeta.authorAvatar,
    quality_score: Number.isFinite(Number(prompt?.quality_score)) ? Number(prompt.quality_score) : estimateQualityScore(content),
    language: prompt?.language || detectLanguage(content),
    variable_count: Number.isFinite(Number(prompt?.variable_count)) ? Number(prompt.variable_count) : extractVariableNames(content).length,
    token_estimate: Number.isFinite(Number(prompt?.token_estimate)) ? Number(prompt.token_estimate) : Math.ceil(content.length / 4),
    pack_count: type === 'pack' ? Number(prompt?.pack_count || 0) || null : null,
    submission_type: options.submissionType || 'hub_publish',
    review_status: options.reviewStatus || 'pending',
    output_modality_config_id: matches.outputModality?.id || null,
    submitted_output_modality_key: outputModality,
    submitted_category_type: submittedCategoryType,
    submitted_category_key: submittedCategoryKey,
    submitted_category_text: submittedCategoryText,
    ai_suggested_config_id: matches.category?.id || null,
    ai_confidence: Number.isFinite(Number(prompt?.ai_category_confidence)) ? Number(prompt.ai_category_confidence) : null,
    source_metadata: {
      extension_prompt_id: prompt?.id || null,
      category_type: submittedCategoryType,
      category_key: submittedCategoryKey,
      category_text: submittedCategoryText,
      output_modality: outputModality,
      manual_custom_category: prompt?.manual_custom_category || null,
      ai_category_type: prompt?.ai_category_type || null,
      ai_category_key: prompt?.ai_category_key || null,
      ai_category_confidence: prompt?.ai_category_confidence ?? null,
      classification_confidence: prompt?.classification_confidence ?? null,
      needs_category_review: Boolean(prompt?.needs_category_review),
      needs_output_modality_review: Boolean(prompt?.needs_output_modality_review),
      output_modality_locked: Boolean(prompt?.output_modality_locked),
    },
  };
}

async function buildHubPromptUrl(ids = []) {
  const hubUrl = await getHubUrl();
  const cleanIds = ids.filter(Boolean).map(id => String(id));

  if (cleanIds.length === 0) return hubUrl;
  if (cleanIds.length === 1) return `${hubUrl}?id=${encodeURIComponent(cleanIds[0])}`;

  return `${hubUrl}?ids=${cleanIds.map(id => encodeURIComponent(id)).join(',')}`;
}

async function buildHubSubmissionUrl(id) {
  const siteRoot = await getSiteRoot();
  return id ? `${siteRoot}/preview?id=${encodeURIComponent(id)}` : siteRoot;
}

async function buildPromptSubmissionPayload(prompt, visibility, authorMeta, options = {}, configItems = null) {
  const [categories, outputModalities] = configItems || (await Promise.all([
    fetchHubConfigItems('category'),
    fetchHubConfigItems('output_modality'),
  ]));
  const category = findConfigByText(categories, [
    prompt?.category_key,
    prompt?.category,
    prompt?.ai_category_key,
  ]);
  const outputModality = findConfigByText(outputModalities, [
    prompt?.output_modality || 'text',
  ]) || findConfigByText(outputModalities, ['text']);

  return buildPromptPayload(prompt, visibility, authorMeta, { category, outputModality }, options);
}

export const HubClient = {
  async checkLogin() {
    const user = await getUser();
    return { loggedIn: !!user, user };
  },

  async fetchPublicPrompts(limit = 50) {
    const queryBuilder = await from('prompts');
    const { data, error } = await queryBuilder
      .select('*')
      .eq('visibility', 'public')
      .execute();
    
    if (error) throw error;
    return data?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit) || [];
  },

  async fetchPromptById(id) {
    const queryBuilder = await from('prompts');
    const { data, error } = await queryBuilder
      .select('*')
      .eq('id', id)
      .execute();
    
    if (error) throw error;
    return data?.[0] || null;
  },

  async publishPrompt(prompt, visibility = 'unlisted') {
    const { user } = await this.checkLogin();
    const authorMeta = buildAuthorPayload(user);
    const isPublicHubPublish = visibility === 'public';
    const payload = await buildPromptSubmissionPayload(prompt, visibility, authorMeta, isPublicHubPublish ? {
      submissionType: 'hub_publish',
      reviewStatus: 'pending',
    } : {
      submissionType: 'external_preview',
      reviewStatus: 'not_for_review',
    });

    const queryBuilder = await from('prompt_submissions');
    const { data, error } = await queryBuilder.insert(payload).execute();

    if (error) throw error;

    return {
      id: data[0]?.id,
      ids: data[0]?.id ? [data[0].id] : [],
      url: await buildHubSubmissionUrl(data[0]?.id),
      visibility,
      reviewStatus: payload.review_status,
      submissionType: payload.submission_type,
    };
  },

  async publishPrompts(prompts, visibility = 'public') {
    const validPrompts = (prompts || []).filter(Boolean);
    if (validPrompts.length === 0) {
      return {
        id: null,
        ids: [],
        url: await buildHubPromptUrl([]),
        visibility,
      };
    }

    const { user } = await this.checkLogin();
    const authorMeta = buildAuthorPayload(user);
    const configItems = await Promise.all([
      fetchHubConfigItems('category'),
      fetchHubConfigItems('output_modality'),
    ]);
    const payload = await Promise.all(validPrompts.map(prompt => buildPromptSubmissionPayload(prompt, visibility, authorMeta, {
      submissionType: 'hub_publish',
      reviewStatus: 'pending',
    }, configItems)));

    const queryBuilder = await from('prompt_submissions');
    const { data, error } = await queryBuilder.insert(payload).execute();

    if (error) throw error;

    const ids = (data || []).map(item => item?.id).filter(Boolean);

    return {
      id: ids[0] || null,
      ids,
      url: ids.length === 1 ? await buildHubSubmissionUrl(ids[0]) : await buildHubPromptUrl([]),
      visibility,
      reviewStatus: 'pending',
      submissionType: 'hub_publish',
    };
  },

  async publishPack(prompts, packTitle, visibility = 'public') {
    console.warn('[HubClient] publishPack is deprecated, falling back to publishPrompts:', packTitle);
    return this.publishPrompts(prompts, visibility);
  },

  async updateVisibility(promptId, visibility) {
    const { url: supabaseUrl } = await getSupabaseConfig();
    const url = `${supabaseUrl}/rest/v1/prompts?id=eq.${promptId}`;
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ visibility })
    });
    
    if (!response.ok) {
      throw new Error('Update visibility failed');
    }
    
    return { success: true };
  },

  async deletePrompt(promptId) {
    const { url: supabaseUrl } = await getSupabaseConfig();
    const url = `${supabaseUrl}/rest/v1/prompts?id=eq.${promptId}`;
    const response = await authenticatedFetch(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Delete failed');
    }
    
    return { success: true };
  },
};
