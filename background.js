// background.js - Service Worker
console.log(`🔥 [background.js] v${chrome.runtime.getManifest().version} loaded`);
import { callGeminiWeb, isGeminiWebAvailable } from './lib/gemini-web.js';
import { callKimiWeb, isKimiWebAvailable } from './lib/kimi-web.js';
import { callXiaomimoWeb, isXiaomimoWebAvailable } from './lib/xiaomimo-web.js';
import { SyncStorage, LocalStorage, PromptStorage, migrateLocalToSync, SyncManager } from './lib/storage.js';
import { DEFAULT_PROMPTS } from './lib/default-prompts.js';
import { translations } from './locales.js';
import { loadPrompt, preloadAllPrompts } from './lib/prompt-loader.js';
import { HubClient } from './lib/supabase/client.js';
import { safeParseJSON, fetchWithTimeout, getProviders, setProviders, getActiveProvider, migrateProviderSettings, callCloudAPI } from './lib/ai/provider.js';
import { encrypt, decrypt } from './lib/crypto.js';
import { extractVariables, classifyVariables, resolveContextVariables, composePrompt } from './lib/variables.js';
import {
  detectLanguageHeuristic,
  extractTitleHeuristic,
  matchCategory,
  extractTitleAndCategory as _extractTitleAndCategory,
  buildDeferredMetadata,
  shouldEnrichPromptMetadata
} from './lib/text-analysis.js';
import { optimizePromptWithAI } from './lib/ai/optimize.js';
import { translatePromptWithAI } from './lib/ai/translate.js';
import { smartConvertWithAI, isSmartConvertInputValid } from './lib/ai/smart-convert.js';
import { asyncEnrichPrompt as _asyncEnrichPrompt } from './lib/ai/enrich.js';
import { generateVideoPromptWithAI } from './lib/ai/video-prompt.js';
// [DISABLED] import { generateSkillWithAI, pushSkillToOpenClaw } from './lib/ai/p2s-forge.js';
import { generateShareText, shareToSocialPlatform, generateArticleShareText, ARTICLE_SHARE_PLATFORMS, SOCIAL_EDITORS, buildFallbackText } from './lib/ai/share.js';
import { buildContextMenus, handleContextMenuClick, openPromptInDefaultAI } from './lib/context-menu.js';
import { initSupabase, initSupabaseFromStorage, ensureAuthenticatedSession, from as supabaseFrom, signOut } from './lib/supabase/client.js';


// Eagerly preload all prompt files into memory cache at service worker startup
preloadAllPrompts();

// Side Panel: toolbar click opens side panel instead of popup
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Side panel setup failed:', error));

// Listen for messages from content script (which receives postMessage from Hub)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROMPT_ARK_AUTH_SYNC') {
    const { isLoggedIn, accessToken, refreshToken, expiresAt, user } = message.payload || {};
    
    chrome.storage.local.set({
      isLoggedIn: isLoggedIn || false,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt || null,
      hubUser: user || null
    }).then(async () => {
      console.log('[Hub Auth Sync] Auth state updated:', { isLoggedIn, user: user?.email });
      
      if (isLoggedIn && accessToken && refreshToken) {
        await initSupabase(accessToken, refreshToken, expiresAt, user);
        await handlePendingIntent();
      } else {
        signOut();
      }
      
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('[Hub Auth Sync] Failed to store auth:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    return true;
  }
  return false;
});

const PENDING_INTENT_TTL = 15 * 60 * 1000;
let _isPendingIntentRunning = false;

async function getCurrentLocale() {
  const { language } = await chrome.storage.local.get('language');
  return language || (chrome.i18n.getUILanguage().startsWith('zh') ? 'zh_CN' : 'en');
}

async function t(key, params = {}) {
  const locale = await getCurrentLocale();
  const dict = translations[locale] || translations.en || {};
  let text = dict[key] || translations.en?.[key] || key;
  Object.keys(params).forEach((param) => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
  });
  return text;
}

async function handlePendingIntent() {
  if (_isPendingIntentRunning) {
    console.log('[PendingIntent] Already running, skipping');
    return;
  }
  _isPendingIntentRunning = true;
  
  try {
    const result = await chrome.storage.local.get(['pendingIntent']);
    const intent = result.pendingIntent;
    
    if (!intent) {
      _isPendingIntentRunning = false;
      return;
    }
    
    if (Date.now() - intent.timestamp > PENDING_INTENT_TTL) {
      await chrome.storage.local.remove('pendingIntent');
      _isPendingIntentRunning = false;
      return;
    }
    
    await chrome.storage.local.remove('pendingIntent');
    
    console.log('[PendingIntent] Executing:', intent.action);
    if (intent.summary) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: await t('pendingResumeTitle'),
        message: await t('pendingResumeMessage', { summary: intent.summary })
      });
    }
    
    if (intent.action === 'PUBLISH_TO_HUB') {
      const resp = await HubClient.publishPrompt(intent.promptData, intent.promptData.visibility || 'public');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🎉 Published to Hub!',
        message: `Your prompt "${intent.promptData.title}" is now live on Hub.`
      });
      if (resp?.url) {
        await chrome.tabs.create({ url: resp.url });
      }
    } else if (intent.action === 'PUBLISH_PROMPTS_TO_HUB' || intent.action === 'PUBLISH_PACK_TO_HUB') {
      const batchPrompts = intent.promptData.prompts || [];
      const resp = await HubClient.publishPrompts(
        batchPrompts,
        intent.promptData.visibility || 'public'
      );
      const count = resp?.ids?.length || batchPrompts.length || 0;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🎉 Prompts Published!',
        message: count > 1
          ? `${count} prompts are now live on Hub.`
          : 'Your prompt is now live on Hub.'
      });
      if (resp?.url) {
        await chrome.tabs.create({ url: resp.url });
      }
    } else if (intent.action === 'SHARE_TO_PLATFORM') {
      const { promptData } = intent;
      const platform = promptData.platform;
      const resp = await HubClient.publishPrompt(promptData, 'unlisted');
      
      const shareUrl = resp.url;
      const shareTitle = promptData.title || 'AI Prompt';
      const content = promptData.content || '';
      
      // Auto-inject platforms: use shareToSocialPlatform (which calls generateShareText internally)
      if (platform === 'zhihu' || platform === 'wechat' || platform === 'xiaohongshu') {
        const fallbackText = buildFallbackText(platform, shareTitle, shareUrl, promptData);
        await shareToSocialPlatform({
          content,
          title: shareTitle,
          url: shareUrl,
          platform,
          fallbackText,
        }, () => {});
      } else if (platform === 'twitter' || platform === 'reddit' || platform === 'linkedin') {
        // URL-based platforms: generate AI share text, fallback to buildFallbackText if failed
        let shareText = null;
        try {
          const aiResult = await generateShareText(content, shareTitle, shareUrl, platform);
          if (platform === 'reddit') {
            shareText = aiResult?.body;
          } else {
            shareText = aiResult?.text;
          }
        } catch (e) {
          console.warn('[PendingIntent] AI share text generation failed:', e);
        }
        
        // Fallback if AI generation failed
        if (!shareText) {
          shareText = buildFallbackText(platform, shareTitle, shareUrl, promptData);
        }
        
        if (platform === 'twitter') {
          await chrome.tabs.create({ url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}` });
        } else if (platform === 'reddit') {
          await chrome.tabs.create({ url: `https://www.reddit.com/submit?type=TEXT&title=${encodeURIComponent(shareTitle)}` });
          await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareText });
          });
        } else if (platform === 'linkedin') {
          await chrome.tabs.create({ url: 'https://www.linkedin.com/feed/?shareActive=true' });
          await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareText });
          });
        }
      } else if (platform === 'copy') {
        await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareUrl });
        });
      } else if (platform === 'json') {
        const json = JSON.stringify({ title: shareTitle, content: promptData.content, category: promptData.category, tags: promptData.tags }, null, 2);
        await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: json });
        });
      }
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🔗 ' + (platform === 'copy' || platform === 'json' ? 'Copied!' : 'Opening ' + platform + '...'),
        message: platform === 'copy' || platform === 'json' ? 'Check your clipboard' : 'Check the new tab to finish sharing.'
      });
    }
  } catch (e) {
    console.error('[PendingIntent] Failed:', e);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '❌ Publish Failed',
      message: `Failed to publish: ${e.message || 'Unknown error'}. Please try again.`
    });
  } finally {
    _isPendingIntentRunning = false;
  }
}

initSupabaseFromStorage().then(success => {
  if (success) {
    console.log('[Supabase] Session restored from storage');
  }
});

// --- Storage Helper (DRY) ---
// User content → Dual-layer: sync (slim) + local (full)
async function getPrompts() { return await PromptStorage.get(); }
async function setPrompts(prompts) { return await PromptStorage.set(prompts); }

function broadcastPromptsUpdated(payload = {}) {
  const message = { type: 'PROMPTS_UPDATED', ...payload };

  // Notify extension pages (popup/options) if they are listening.
  try { chrome.runtime.sendMessage(message).catch(() => { }); } catch (e) { /* no listeners */ }

  // Notify content scripts in all tabs so slash shortcut cache refreshes immediately.
  try {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (!tab?.id) return;
        chrome.tabs.sendMessage(tab.id, message).catch(() => { });
      });
    });
  } catch (e) { /* ignore send errors */ }
}


// Wrapper: delegate to text-analysis module with DI
async function extractTitleAndCategory(text) {
  return _extractTitleAndCategory(text, getActiveProvider, callCloudAPI);
}

// --- Install: seed default prompts + migrate settings ---
chrome.runtime.onInstalled.addListener(async () => {
  await migrateProviderSettings();
  await migrateLocalToSync();
  const prompts = await getPrompts();
  if (prompts.length > 0) return;

  // Seed from curated 100-prompt library (lib/default-prompts.js)
  const defaults = DEFAULT_PROMPTS.map((p, i) => {
    // Extract variables from content ({{var}} patterns)
    const vars = [...(p.content.matchAll(/\{\{(\w+)\}\}/g))].map(m => m[1]);
    const uniqueVars = [...new Set(vars)];
    return {
      id: crypto.randomUUID(),
      title: p.title,
      content: p.content,
      category: p.category || 'General',
      tags: p.tags || [],
      variables: uniqueVars,
      shortcut: p.shortcut || '',
      createdAt: Date.now() + i, // Preserve order
      usageCount: 0,
      lastUsed: null,
      lastUsedAt: null,
      builtIn: true
    };
  });

  await PromptStorage.bulkSet(defaults);
});

// --- Async AI Enrichment (wrapper with DI) ---
async function asyncEnrichPrompt(promptId, content) {
  return _asyncEnrichPrompt(promptId, content, extractTitleAndCategory, getPrompts, buildContextMenus);
}

function buildSavedPromptMetadata(content, metadata = {}) {
  return buildDeferredMetadata(content, {
    title: metadata.title,
    category: metadata.category,
    tags: metadata.tags,
    titleAutoGenerated: metadata.titleAutoGenerated,
    categoryAutoGenerated: metadata.categoryAutoGenerated,
  });
}

function shouldPreserveAutoTitle(existing, nextTitle) {
  const normalizedTitle = String(nextTitle || '').trim();
  if (!normalizedTitle) return true;
  return !!(existing?.titleAutoGenerated && normalizedTitle === String(existing.title || '').trim());
}

function shouldPreserveAutoCategory(existing, nextCategory) {
  const normalizedCategory = String(nextCategory || '').trim();
  if (!normalizedCategory) return true;
  return !!(existing?.categoryAutoGenerated && normalizedCategory === String(existing.category || '').trim());
}

// --- Port-based handler for long-running video prompt generation ---
// Port keeps MV3 Service Worker alive (unlike one-shot sendMessage)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'video-prompt') return;

  port.onMessage.addListener(async (msg) => {
    if (msg.type !== 'GENERATE_VIDEO_PROMPT') return;
    try {
      // Override progress sender to use port instead of broadcast
      const origSendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
      chrome.runtime.sendMessage = (m) => {
        if (m?.type === 'VIDEO_PROMPT_PROGRESS') {
          try { port.postMessage({ type: 'VIDEO_PROMPT_PROGRESS', message: m.message }); } catch { }
          return Promise.resolve();
        }
        return origSendMessage(m);
      };

      const result = await generateVideoPromptWithAI(msg.videoUrl, msg.mode || 'both', msg.targetLang || '');
      port.postMessage({ type: 'VIDEO_PROMPT_RESULT', success: true, result });

      // Restore original sendMessage
      chrome.runtime.sendMessage = origSendMessage;
    } catch (e) {
      console.error('[Port:video-prompt] Error:', e);
      try { port.postMessage({ type: 'VIDEO_PROMPT_RESULT', success: false, error: e.message }); } catch { }
    }
  });
});

// --- Message Handler ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sendResponse);
  return true;
});

// --- Provider Dispatch Helper (DRY: replaces 3-branch inline dispatch) ---
async function callProvider(provider, prompt) {
  if (provider.type === 'gemini') {
    const model = provider.model || 'gemini-2.0-flash';
    const resp = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
  } else if (provider.type === 'openai') {
    const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
      body: JSON.stringify({
        model: provider.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI API ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content;
  } else if (provider.type === 'gemini-web') {
    return await callGeminiWeb(prompt);
  } else if (provider.type === 'kimi-web') {
    return await callKimiWeb(prompt, provider.model);
  } else if (provider.type === 'xiaomimo-web') {
    return await callXiaomimoWeb(prompt, provider.model);
  }
  return null;
}

async function requireHubAuth() {
  await ensureAuthenticatedSession();
  const { accessToken } = await chrome.storage.local.get(['accessToken']);
  if (!accessToken) throw new Error('NOT_LOGGED_IN');
  return accessToken;
}

async function handleMessage(message, sendResponse) {
  try {
    switch (message.type) {

      case 'GET_PROMPTS':
        sendResponse({ success: true, prompts: await getPrompts() });
        break;

      // [DISABLED] case 'GET_OPENCLAW_SETTINGS':
      //   const ocSettings = await LocalStorage.get('openclaw') || { endpoint: '', apiKey: '' };
      //   if (ocSettings.apiKey) ocSettings.apiKey = await decrypt(ocSettings.apiKey);
      //   sendResponse(ocSettings);
      //   break;

      // [DISABLED] case 'SAVE_OPENCLAW_SETTINGS':
      //   const encApiKey = message.apiKey ? await encrypt(message.apiKey) : '';
      //   await LocalStorage.set('openclaw', { endpoint: message.endpoint, apiKey: encApiKey });
      //   sendResponse({ success: true });
      //   break;

      case 'GET_IMAGE_PROMPT_SETTINGS':
        sendResponse(await LocalStorage.get('imagePrompt') || { enabled: false, imageModelId: '' });
        break;

      case 'SAVE_IMAGE_PROMPT_SETTINGS':
        await LocalStorage.set('imagePrompt', { enabled: message.enabled, imageModelId: message.imageModelId });
        // Broadcast to all tabs to enable/disable image prompt feature
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: 'IMAGE_PROMPT_SETTINGS_CHANGED', enabled: message.enabled }).catch(() => {});
          });
        });
        sendResponse({ success: true });
        break;

        
      // [DISABLED] case 'GENERATE_SKILL': {
      //   const skillPayload = await generateSkillWithAI(message.promptData);
      //   const skills = await LocalStorage.get('skills') || [];
      //   const skillRecord = {
      //     id: crypto.randomUUID(),
      //     skill_name: skillPayload.skill_name,
      //     description: skillPayload.description || '',
      //     source_prompt_id: message.promptData.id,
      //     source_prompt_title: message.promptData.title || '',
      //     files: skillPayload.files,
      //     pushed: false,
      //     createdAt: Date.now()
      //   };
      //   skills.unshift(skillRecord);
      //   await LocalStorage.set('skills', skills);
      //   sendResponse({ success: true, skill: skillRecord });
      //   break;
      // }

      // [DISABLED] case 'GET_SKILLS':
      //   sendResponse({ success: true, skills: await LocalStorage.get('skills') || [] });
      //   break;

      // [DISABLED] case 'PUSH_SKILL': {
      //   const allSkills = await LocalStorage.get('skills') || [];
      //   const target = allSkills.find(s => s.id === message.skillId);
      //   if (!target) throw new Error('Skill not found');
      //   await pushSkillToOpenClaw(target);
      //   target.pushed = true;
      //   await LocalStorage.set('skills', allSkills);
      //   sendResponse({ success: true });
      //   break;
      // }

      // [DISABLED] case 'DELETE_SKILL': {
      //   let dSkills = await LocalStorage.get('skills') || [];
      //   dSkills = dSkills.filter(s => s.id !== message.skillId);
      //   await LocalStorage.set('skills', dSkills);
      //   sendResponse({ success: true });
      //   break;
      // }

      case 'SAVE_PROMPT': {
        const newId = crypto.randomUUID();
        const metadata = buildSavedPromptMetadata(message.prompt.content, {
          title: message.prompt.title,
          category: message.prompt.category,
          tags: message.prompt.tags,
        });
        const newPrompt = {
          id: newId,
          title: metadata.title,
          content: message.prompt.content,
          category: metadata.category,
          tags: metadata.tags,
          shortcut: message.prompt.shortcut || '',
          variables: extractVariables(message.prompt.content),
          versions: [],
          usageCount: 0,
          lastUsedAt: null,
          favorite: false,
          titleAutoGenerated: metadata.titleAutoGenerated,
          categoryAutoGenerated: metadata.categoryAutoGenerated,
          createdAt: Date.now()
        };
        // Preserve structured video data for re-rendering in video modal
        if (message.prompt.videoData) newPrompt.videoData = message.prompt.videoData;
        await PromptStorage.save(newPrompt);
        await markPendingPromptReveal(newId);
        sendResponse({ success: true, promptId: newId });
        broadcastPromptsUpdated({ action: 'create', promptId: newId, prompt: newPrompt });

        // Async AI enrichment — MUST be awaited (not fire-and-forget)
        // to keep MV3 Service Worker alive until completion
        if (shouldEnrichPromptMetadata(newPrompt)) {
          await asyncEnrichPrompt(newId, message.prompt.content);
        }
        break;
      }

      case 'UPDATE_PROMPT': {
        const prompts = await getPrompts();
        const existing = prompts.find(p => p.id === message.prompt.id);
        const metadata = buildSavedPromptMetadata(message.prompt.content, {
          title: message.prompt.title,
          category: message.prompt.category,
          tags: message.prompt.tags,
          titleAutoGenerated: shouldPreserveAutoTitle(existing, message.prompt.title),
          categoryAutoGenerated: shouldPreserveAutoCategory(existing, message.prompt.category),
        });

        // Push current state to versions before updating
        const versions = existing?.versions || [];
        const newVersion = {
          versionId: crypto.randomUUID(),
          content: existing?.content || '',
          timestamp: Date.now()
        };
        const updatedVersions = [newVersion, ...versions].slice(0, 10);

        const updatedPrompt = {
          ...(existing || {}),
          title: metadata.title,
          content: message.prompt.content,
          category: metadata.category,
          tags: metadata.tags,
          shortcut: message.prompt.shortcut || '',
          variables: extractVariables(message.prompt.content),
          versions: updatedVersions,
          titleAutoGenerated: metadata.titleAutoGenerated,
          categoryAutoGenerated: metadata.categoryAutoGenerated,
          updatedAt: Date.now()
        };

        await PromptStorage.update(updatedPrompt);
        sendResponse({ success: true, prompt: updatedPrompt });
        broadcastPromptsUpdated({ action: 'update', promptId: updatedPrompt.id });

        // Async AI enrichment — awaited to keep MV3 worker alive
        if (shouldEnrichPromptMetadata(updatedPrompt)) {
          await asyncEnrichPrompt(message.prompt.id, message.prompt.content);
        }
        break;
      }

      case 'DELETE_PROMPT': {
        await PromptStorage.delete(message.id);
        sendResponse({ success: true });
        broadcastPromptsUpdated({ action: 'delete', promptId: message.id });
        break;
      }

      case 'EXPORT_PROMPTS':
        sendResponse({ success: true, data: await getPrompts() });
        break;

      case 'IMPORT_PROMPTS': {
        const imported = message.prompts.map(p => {
          const metadata = buildSavedPromptMetadata(p.content, {
            title: p.title,
            category: p.category,
            tags: p.tags,
            titleAutoGenerated: p.titleAutoGenerated,
            categoryAutoGenerated: p.categoryAutoGenerated,
          });

          return {
            id: crypto.randomUUID(),
            title: metadata.title,
            content: p.content,
            category: metadata.category,
            tags: metadata.tags,
            shortcut: p.shortcut || '',
            favorite: p.favorite || false,
            variables: p.variables || extractVariables(p.content),
            titleAutoGenerated: metadata.titleAutoGenerated,
            categoryAutoGenerated: metadata.categoryAutoGenerated,
            createdAt: Date.now()
          };
        });
        // Append to existing (not overwrite!)
        const existing = await getPrompts();
        await PromptStorage.bulkSet([...existing, ...imported]);
        await rebuildContextMenusForActiveTab();
        sendResponse({
          success: true,
          promptIds: imported.map(p => p.id),
          firstPromptId: imported[0]?.id || null
        });

        // Async AI enrichment for imported prompts missing metadata
        for (const p of imported) {
          if (shouldEnrichPromptMetadata(p)) {
            await asyncEnrichPrompt(p.id, p.content);
          }
        }
        break;
      }

      case 'GET_I18N_DICT': {
        const { language: lang } = await chrome.storage.local.get('language');
        const locale = lang || (chrome.i18n.getUILanguage().startsWith('zh') ? 'zh_CN' : 'en');
        sendResponse(translations[locale] || translations['en']);
        break;
      }

      case 'LANGUAGE_CHANGED': {
        // Rebuild context menus immediately when user changes language
        rebuildContextMenusForActiveTab();

        // Broadcast new translation dictionary to all active tabs
        chrome.storage.local.get('language').then(({ language }) => {
          let locale = language || (chrome.i18n.getUILanguage().startsWith('zh') ? 'zh_CN' : 'en');
          const dict = translations[locale] || translations['en'];
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_I18N_DICT', dict }).catch(() => { });
            });
          });
        });
        sendResponse({ success: true });
        break;
      }

      case 'AUTO_EXTRACT': {
        const result = await extractTitleAndCategory(message.content);
        sendResponse({ success: true, ...result });
        break;
      }

      case 'GENERATE_VIDEO_PROMPT':
      case 'GENERATE_YOUTUBE_PROMPT': {
        try {
          const result = await generateVideoPromptWithAI(message.videoUrl, message.mode || 'both', message.targetLang || '');
          sendResponse({ success: true, result });
        } catch (e) {
          console.error('[GENERATE_VIDEO_PROMPT] Error:', e);
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      // Selection toolbar: save raw selected text (same path as context menu "Add to Prompt Ark")
      case 'QUICK_ADD_SELECTION': {
        const selectedText = (message.text || '').trim();
        if (!selectedText) { sendResponse({ success: false }); break; }

        const hTitle = extractTitleHeuristic(selectedText);
        const hLang = detectLanguageHeuristic(selectedText);
        const metadata = buildSavedPromptMetadata(selectedText, {
          title: hTitle,
          category: matchCategory(selectedText, hLang),
          tags: [],
          titleAutoGenerated: true,
          categoryAutoGenerated: true,
        });
        const newId = crypto.randomUUID();
        const now = Date.now();
        const newPrompt = {
          id: newId,
          title: metadata.title,
          content: selectedText,
          category: metadata.category,
          tags: metadata.tags,
          shortcut: '',
          variables: extractVariables(selectedText),
          versions: [],
          usageCount: 0,
          lastUsedAt: null,
          lastUsed: null,
          favorite: false,
          sourceContext: {
            text: selectedText.substring(0, 5000),
            pageTitle: message.pageTitle || '',
            pageUrl: message.pageUrl || '',
            capturedAt: now,
            convertMethod: 'quick_add',
          },
          titleAutoGenerated: metadata.titleAutoGenerated,
          categoryAutoGenerated: metadata.categoryAutoGenerated,
          createdAt: now
        };
        await PromptStorage.save(newPrompt);
        await rebuildContextMenusForActiveTab();
        await markPendingPromptReveal(newId);
        broadcastPromptsUpdated({ action: 'create', promptId: newId, prompt: newPrompt });
        sendResponse({ success: true });
        // Async AI enrichment (non-blocking)
        if (shouldEnrichPromptMetadata(newPrompt)) {
          await asyncEnrichPrompt(newId, selectedText);
        }
        break;
      }

      // Selection toolbar: AI-powered smart convert (single LLM call)
      case 'SMART_CONVERT_SELECTION': {
        const selectedText = (message.text || '').trim();
        if (!selectedText) { sendResponse({ success: false, error: 'No text' }); break; }
        if (!isSmartConvertInputValid(selectedText)) {
          sendResponse({ success: false, error: 'TEXT_TOO_SHORT' });
          break;
        }
        const now = Date.now();
        try {
          const result = await smartConvertWithAI(selectedText);
          if (!result?.prompt) throw new Error('Empty result');
          const metadata = buildSavedPromptMetadata(result.prompt, {
            title: result.title,
            category: result.category,
            tags: result.tags,
            titleAutoGenerated: !String(result.title || '').trim(),
            categoryAutoGenerated: !String(result.category || '').trim(),
          });

          const newId = crypto.randomUUID();
          const newPrompt = {
            id: newId,
            title: metadata.title,
            content: result.prompt,
            category: metadata.category,
            tags: metadata.tags,
            shortcut: '',
            variables: extractVariables(result.prompt),
            versions: [],
            usageCount: 0,
            lastUsedAt: null,
            lastUsed: null,
            favorite: false,
            sourceContext: {
              text: selectedText.substring(0, 5000),
              pageTitle: message.pageTitle || '',
              pageUrl: message.pageUrl || '',
              capturedAt: now,
              convertMethod: 'smart_convert',
            },
            titleAutoGenerated: metadata.titleAutoGenerated,
            categoryAutoGenerated: metadata.categoryAutoGenerated,
            createdAt: now
          };
          await PromptStorage.save(newPrompt);
          await rebuildContextMenusForActiveTab();
          await markPendingPromptReveal(newId);
          broadcastPromptsUpdated({ action: 'create', promptId: newId, prompt: newPrompt });
          sendResponse({ success: true, title: newPrompt.title });
          if (shouldEnrichPromptMetadata(newPrompt)) {
            await asyncEnrichPrompt(newId, newPrompt.content);
          }
        } catch (e) {
          console.error('[SMART_CONVERT_SELECTION] Failed:', e);
          const heuristicTitle = extractTitleHeuristic(selectedText);
          const lang = detectLanguageHeuristic(selectedText);
          const metadata = buildSavedPromptMetadata(selectedText, {
            title: heuristicTitle,
            category: matchCategory(selectedText, lang),
            tags: [],
            titleAutoGenerated: true,
            categoryAutoGenerated: true,
          });
          const fallbackId = crypto.randomUUID();
          const fallbackPrompt = {
            id: fallbackId,
            title: metadata.title,
            content: selectedText,
            category: metadata.category,
            tags: metadata.tags,
            shortcut: '',
            variables: extractVariables(selectedText),
            versions: [],
            usageCount: 0,
            lastUsedAt: null,
            lastUsed: null,
            favorite: false,
            sourceContext: {
              text: selectedText.substring(0, 5000),
              pageTitle: message.pageTitle || '',
              pageUrl: message.pageUrl || '',
              capturedAt: now,
              convertMethod: 'smart_convert',
            },
            titleAutoGenerated: metadata.titleAutoGenerated,
            categoryAutoGenerated: metadata.categoryAutoGenerated,
            createdAt: now
          };
          await PromptStorage.save(fallbackPrompt);
          await rebuildContextMenusForActiveTab();
          await markPendingPromptReveal(fallbackId);
          broadcastPromptsUpdated({ action: 'create', promptId: fallbackId, prompt: fallbackPrompt });
          sendResponse({ success: false, error: e.message, fallbackSaved: true, title: fallbackPrompt.title });
          if (shouldEnrichPromptMetadata(fallbackPrompt)) {
            await asyncEnrichPrompt(fallbackId, fallbackPrompt.content);
          }
        }
        break;
      }

      case 'OPTIMIZE_PROMPT': {
        try {
          let targetProvider = null;
          if (message.providerId) {
            const providers = await getProviders();
            targetProvider = providers.find(p => p.id === message.providerId) || null;
          }
          if (!targetProvider) {
            targetProvider = await getActiveProvider();
          }
          if (!targetProvider) {
            sendResponse({ success: false, error: 'NEED_CLOUD' });
            break;
          }
          const variants = await optimizePromptWithAI(message.content, targetProvider);
          if (!variants || variants.length === 0) {
            sendResponse({ success: false, error: 'Empty optimization result' });
            break;
          }
          sendResponse({ success: true, variants });
        } catch (e) {
          console.error('OPTIMIZE_PROMPT error:', e);
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'GENERATE_TEXT': {
        const provider = await getActiveProvider();
        if (!provider) {
          sendResponse({ success: false, error: 'NEED_CLOUD' });
          break;
        }
        try {
          const text = await callProvider(provider, message.prompt);
          sendResponse({ success: !!text, text });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'TRANSLATE_PROMPT': {
        (async () => {
          try {
            const data = await translatePromptWithAI(message.promptData, message.targetLanguage);
            sendResponse({ success: true, data });
          } catch (e) {
            console.error('[TRANSLATE_PROMPT] Error:', e);
            const isLoginError = e.message === 'NOT_LOGGED_IN' || e.message?.includes('No valid response from Gemini Web') || e.message?.includes('Kimi Web returned empty response');
            if (isLoginError) {
              // Determine which provider failed and open appropriate login page
              const provider = await getActiveProvider();
              const loginUrl = provider?.type === 'kimi-web' ? 'https://www.kimi.com/' : 'https://gemini.google.com/app';
              chrome.tabs.create({ url: loginUrl, active: true });
            }
            sendResponse({
              success: false,
              error: isLoginError
                ? '请先登录对应的 AI 服务，已自动打开登录页。登录后关闭该页并重新点击翻译。'
                : e.message,
              errorCode: isLoginError ? 'NOT_LOGGED_IN' : null,
            });
          }
        })();
        return true;
      }

      case 'GET_PROVIDERS': {
        const providers = await getProviders();
        const activeProviderId = await LocalStorage.get('activeProviderId');
        sendResponse({ success: true, providers, activeProviderId });
        break;
      }

      case 'SAVE_PROVIDERS': {
        await setProviders(message.providers);
        if (message.activeProviderId) {
          await LocalStorage.set('activeProviderId', message.activeProviderId);
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_SHORTCUTS': {
        const allPrompts = await getPrompts();
        const defaultShortcutByTitle = new Map(
          DEFAULT_PROMPTS
            .filter(p => p.shortcut)
            .map(p => [p.title, String(p.shortcut).trim().replace(/^\/+/, '')])
        );

        const maybeRecoveredPrompts = allPrompts.map(p => {
          let normalizedShortcut = String(p.shortcut || '').trim().replace(/^\/+/, '');
          if (!normalizedShortcut && p.builtIn) {
            normalizedShortcut = defaultShortcutByTitle.get(p.title) || '';
          }
          if (normalizedShortcut === String(p.shortcut || '').trim()) return p;
          return { ...p, shortcut: normalizedShortcut };
        });

        if (maybeRecoveredPrompts.some((p, idx) => p !== allPrompts[idx])) {
          await PromptStorage.set(maybeRecoveredPrompts);
        }

        const shortcuts = maybeRecoveredPrompts
          .map(p => {
            const normalizedShortcut = String(p.shortcut || '').trim().replace(/^\/+/, '');
            return {
              id: p.id,
              shortcut: normalizedShortcut,
              title: p.title,
              content: p.content,
              variables: p.variables
            };
          })
          .filter(p => p.shortcut);
        sendResponse({ success: true, shortcuts });
        break;
      }

      case 'GENERATE_SHARE_TEXT': {
        (async () => {
          try {
            const result = await generateShareText(message.content, message.title, message.url, message.platform);
            sendResponse({ success: !!result, ...result });
          } catch (e) {
            console.error('[GENERATE_SHARE_TEXT] Error:', e);
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      case 'SHARE_TO_PLATFORM': {
        (async () => {
          try {
            await shareToSocialPlatform(message, sendResponse);
          } catch (e) {
            console.error('[SHARE_TO_PLATFORM] Error:', e);
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      case 'ARTICLE_SHARE_TO_PLATFORM': {
        (async () => {
          try {
            const { sourceText, platform } = message;
            const result = await generateArticleShareText(sourceText, platform);
            if (!result) {
              sendResponse({ success: false, error: 'Failed to generate article' });
              return;
            }

            const shareText = result.body || '';
            const articleTitle = result.title || '';

            // Auto-inject platforms (知乎/公众号/小红书/LinkedIn)
            if (platform === 'zhihu' || platform === 'wechat' || platform === 'xiaohongshu' || platform === 'linkedin') {
              await shareToSocialPlatform({
                content: '', title: articleTitle, url: '', platform,
                fallbackText: articleTitle ? `${articleTitle}\n\n${shareText}` : shareText,
                skipGenerate: true,  // Article already generated by generateArticleShareText — don't overwrite with prompt share
              }, sendResponse);
              return;
            }

            // URL-based platforms
            if (platform === 'twitter') {
              const tweetText = shareText.substring(0, 280);
              await chrome.tabs.create({ url: `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}` });
            } else if (platform === 'reddit') {
              const redditTitle = articleTitle || shareText.split('\n')[0].substring(0, 120);
              await chrome.tabs.create({ url: `https://www.reddit.com/submit?type=TEXT&title=${encodeURIComponent(redditTitle)}` });
              // Copy body to clipboard for pasting
              try {
                await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                  if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareText });
                });
              } catch (e) { /* best effort */ }
            }

            sendResponse({ success: true, title: articleTitle, body: shareText });
          } catch (e) {
            console.error('[ARTICLE_SHARE_TO_PLATFORM] Error:', e);
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      case 'OPEN_PROMPT_IN_DEFAULT_AI': {
        (async () => {
          try {
            await openPromptInDefaultAI(message.content || '');
            sendResponse({ success: true });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true;
      }

      case 'COMPOSE_PROMPT': {
        (async () => {
          try {
            const composed = composePrompt(message.prompt, message.contentOverride);
            // Resolve context variables (@-prefixed)
            const { resolved, resolvedMap } = await resolveContextVariables(composed);
            const allVars = extractVariables(composed);
            const { user: userVars } = classifyVariables(allVars);
            // Only return user vars (context vars already resolved in content)
            sendResponse({
              success: true,
              composed: resolved,
              variables: userVars,
              contextResolved: resolvedMap
            });
          } catch (e) {
            sendResponse({ success: false, error: e.message });
          }
        })();
        return true; // Keep message channel open for async response
      }

      case 'TRACK_USAGE': {
        const prompts = await getPrompts();
        const now = Date.now();
        const messageId = String(message.id);
        const updated = prompts.map(p => {
          if (String(p.id) === messageId) {
            return { ...p, usageCount: (p.usageCount || 0) + 1, lastUsedAt: now, lastUsed: now };
          }
          return p;
        });
        const target = updated.find(p => String(p.id) === messageId);
        if (target) {
          await PromptStorage.update(target);
          chrome.runtime.sendMessage({
            type: 'PROMPT_USAGE_UPDATED',
            prompt: {
              id: target.id,
              usageCount: target.usageCount || 0,
              lastUsedAt: target.lastUsedAt || null,
              lastUsed: target.lastUsed || null,
            }
          }).catch(() => { });
        }
        sendResponse({ success: true });
        break;
      }

      case 'TOGGLE_FAVORITE': {
        const prompts = await getPrompts();
        const target = prompts.find(p => p.id === message.id);
        if (target) {
          target.favorite = !target.favorite;
          await PromptStorage.update(target);
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_PROMPT_HISTORY': {
        const prompts = await getPrompts();
        const prompt = prompts.find(p => p.id === message.id);
        sendResponse({ success: true, versions: prompt?.versions || [] });
        break;
      }

      case 'RESTORE_PROMPT_VERSION': {
        const prompts = await getPrompts();
        const target = prompts.find(p => p.id === message.id);
        if (target) {
          const version = target.versions?.find(v => v.versionId === message.versionId);
          if (version) {
            // Save current state as new version before restoring (audit trail)
            const currentVersion = {
              versionId: crypto.randomUUID(),
              content: target.content,
              timestamp: Date.now()
            };
            target.versions = [currentVersion, ...(target.versions || [])].slice(0, 10);
            
            // Restore the selected version
            target.content = version.content;
            target.variables = extractVariables(version.content);
            target.updatedAt = Date.now();
            await PromptStorage.update(target);
          }
        }
        sendResponse({ success: true });
        break;
      }

      case 'BATCH_RENAME_CATEGORY': {
        const prompts = await getPrompts();
        // Update each prompt in the old category individually
        const toUpdate = prompts.filter(p => p.category === message.oldName);
        for (const p of toUpdate) {
          p.category = message.newName;
          await PromptStorage.update(p);
        }
        sendResponse({ success: true });
        break;
      }

      case 'GET_DEFAULT_PLATFORM': {
        const platform = await LocalStorage.get('defaultPlatform');
        sendResponse({ success: true, defaultPlatform: platform || 'chatgpt' });
        break;
      }

      case 'SET_DEFAULT_PLATFORM': {
        await LocalStorage.set('defaultPlatform', message.platform);
        sendResponse({ success: true });
        break;
      }

      case 'GET_SYNC_USAGE': {
        const usage = await SyncStorage.getUsage();
        sendResponse({ success: true, ...usage });
        break;
      }

      case 'SHARE_PROMPT': {
        try {
          await requireHubAuth();
          const result = await HubClient.publishPrompt(message.prompt, 'unlisted');
          sendResponse({ success: true, id: result.id, url: result.url });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'CHECK_HUB_LOGIN': {
        try {
          const user = await ensureAuthenticatedSession();
          await chrome.storage.local.set({
            isLoggedIn: true,
            hubUser: user ? {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.name,
              avatar: user.user_metadata?.avatar_url || user.avatar || user.avatar_url || ''
            } : null
          });
          sendResponse({ success: true, isLoggedIn: true, user });
        } catch (e) {
          await chrome.storage.local.set({ isLoggedIn: false, hubUser: null });
          sendResponse({ success: true, isLoggedIn: false });
        }
        break;
      }

      case 'GET_GITHUB_TOKEN': {
        const ghToken = await LocalStorage.get('githubToken');
        sendResponse({ success: true, token: ghToken || '' });
        break;
      }

      case 'SAVE_GITHUB_TOKEN': {
        await LocalStorage.set('githubToken', message.token || '');
        sendResponse({ success: true });
        break;
      }

      case 'GET_SYNC_SETTINGS': {
        const syncKeys = [
          'sync_backend', 'webdavUrl', 'webdavUser', 'webdavPassword',
          'obsidianWebdavUrl', 'obsidianWebdavUser', 'obsidianWebdavPassword',
          'obsidianFolder'
        ];
        const defaults = { sync_backend: 'none', obsidianFolder: 'prompts' };
        const values = await Promise.all(syncKeys.map(k => LocalStorage.get(k)));
        const settings = Object.fromEntries(syncKeys.map((k, i) => {
          const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
          return [camel, values[i] || defaults[k] || ''];
        }));
        sendResponse({ success: true, ...settings });
        break;
      }

      case 'SAVE_SYNC_SETTINGS': {
        await LocalStorage.set('sync_backend', message.backend);

        if (message.webdavUrl !== undefined) await LocalStorage.set('webdavUrl', message.webdavUrl);
        if (message.webdavUser !== undefined) await LocalStorage.set('webdavUser', message.webdavUser);
        if (message.webdavPassword !== undefined) await LocalStorage.set('webdavPassword', message.webdavPassword);

        if (message.obsidianWebdavUrl !== undefined) await LocalStorage.set('obsidianWebdavUrl', message.obsidianWebdavUrl);
        if (message.obsidianWebdavUser !== undefined) await LocalStorage.set('obsidianWebdavUser', message.obsidianWebdavUser);
        if (message.obsidianWebdavPassword !== undefined) await LocalStorage.set('obsidianWebdavPassword', message.obsidianWebdavPassword);
        if (message.obsidianFolder !== undefined) await LocalStorage.set('obsidianFolder', message.obsidianFolder);

        await SyncManager.loadConfig();
        sendResponse({ success: true });
        break;
      }

      case 'FORCE_WEBDAV_SYNC':
      case 'FORCE_OBSIDIAN_SYNC': {
        const syncMethods = {
          FORCE_WEBDAV_SYNC: 'pullFromWebdavAndMerge',
          FORCE_OBSIDIAN_SYNC: 'pullFromObsidianAndMerge',
        };
        try {
          const result = await SyncManager[syncMethods[message.type]]();
          sendResponse({ success: true, message: result?.message });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'PUBLISH_TO_HUB': {
        try {
          await requireHubAuth();
          const result = await HubClient.publishPrompt(message.prompt, message.visibility || 'public');
          sendResponse({ success: true, id: result.id, url: result.url });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'PUBLISH_PROMPTS_TO_HUB':
      case 'PUBLISH_PACK_TO_HUB': {
        try {
          await requireHubAuth();
          const result = await HubClient.publishPrompts(message.prompts, message.visibility || 'public');
          sendResponse({ success: true, id: result.id, ids: result.ids, url: result.url });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'GET_PENDING_DOUBAO_PROMPT': {
        try {
          const data = await chrome.storage.session.get(['pendingDoubaoPrompt', 'pendingDoubaoTimestamp']);
          sendResponse({ success: true, prompt: data.pendingDoubaoPrompt, timestamp: data.pendingDoubaoTimestamp });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'CLEAR_PENDING_DOUBAO_PROMPT': {
        try {
          await chrome.storage.session.remove(['pendingDoubaoPrompt', 'pendingDoubaoTimestamp']);
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function markPendingPromptReveal(promptId) {
  if (!promptId) return;
  try {
    await chrome.storage.local.set({
      pendingPromptReveal: {
        id: String(promptId),
        timestamp: Date.now()
      }
    });
  } catch (e) {
    console.warn('[PromptReveal] Failed to persist pending prompt id:', e);
  }
}


// Execute specific commands bound in manifest
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-picker") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.startsWith("http")) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_PICKER" }).catch(() => { });
    });
  } else if (command === "grab-context") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.startsWith("http")) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "GRAB_CONTEXT" }).catch(() => { });
    });
  } else if (command === "share-article") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].url.startsWith("http")) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "SHOW_ARTICLE_SHARE_PICKER" }).catch(() => { });
    });
  }
});

// Context menu click handler — delegates to lib/context-menu.js
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await handleContextMenuClick(info, tab, getPrompts, asyncEnrichPrompt, () => rebuildContextMenusForActiveTab());
});

async function rebuildContextMenusForActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await buildContextMenus(getPrompts, { tabUrl: tabs[0]?.url || '' });
  } catch (e) {
    await buildContextMenus(getPrompts);
  }
}

// Build menus on install/startup
chrome.runtime.onInstalled.addListener(() => rebuildContextMenusForActiveTab());
chrome.runtime.onStartup.addListener(() => rebuildContextMenusForActiveTab());

chrome.tabs.onActivated.addListener(() => {
  rebuildContextMenusForActiveTab();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab?.active) return;
  if (changeInfo.status === 'complete' || changeInfo.url) {
    rebuildContextMenusForActiveTab();
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    rebuildContextMenusForActiveTab();
  }
});

// Auto-rebuild menus when prompts change
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.prompts || Object.keys(changes).some(k => k.startsWith('prompts_')))) {
    rebuildContextMenusForActiveTab();
  }
  if (area === 'local' && changes.language) {
    rebuildContextMenusForActiveTab();
  }
});
