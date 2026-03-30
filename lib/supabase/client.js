import { getHubUrl, getSupabaseConfig } from './config.js';
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

function buildPromptPayload(prompt, visibility, authorMeta) {
  const content = prompt?.content || '';

  return {
    title: prompt?.title || 'Untitled',
    content,
    category: prompt?.category || 'General',
    tags: prompt?.tags || [],
    description: content.substring(0, 200),
    visibility,
    type: 'prompt',
    author: authorMeta.authorName,
    author_id: authorMeta.authorId,
    author_avatar: authorMeta.authorAvatar,
    quality_score: estimateQualityScore(content),
    language: detectLanguage(content),
    variable_count: extractVariableNames(content).length,
    token_estimate: Math.ceil(content.length / 4),
  };
}

async function buildHubPromptUrl(ids = []) {
  const hubUrl = await getHubUrl();
  const cleanIds = ids.filter(Boolean).map(id => String(id));

  if (cleanIds.length === 0) return hubUrl;
  if (cleanIds.length === 1) return `${hubUrl}?id=${encodeURIComponent(cleanIds[0])}`;

  return `${hubUrl}?ids=${cleanIds.map(id => encodeURIComponent(id)).join(',')}`;
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
    const payload = buildPromptPayload(prompt, visibility, authorMeta);

    const queryBuilder = await from('prompts');
    const { data, error } = await queryBuilder.insert(payload).execute();

    if (error) throw error;

    return {
      id: data[0]?.id,
      url: await buildHubPromptUrl([data[0]?.id]),
      visibility,
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
    const payload = validPrompts.map(prompt => buildPromptPayload(prompt, visibility, authorMeta));

    const queryBuilder = await from('prompts');
    const { data, error } = await queryBuilder.insert(payload).execute();

    if (error) throw error;

    const ids = (data || []).map(item => item?.id).filter(Boolean);

    return {
      id: ids[0] || null,
      ids,
      url: await buildHubPromptUrl(ids),
      visibility,
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
