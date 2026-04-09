// background.js - Service Worker
console.log(`🔥 [background.js] v${chrome.runtime.getManifest().version} loaded`);
import { callGeminiWeb, isGeminiWebAvailable } from './lib/gemini-web.js';
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

async function injectRedditPrefillInTab(tabId, title, text) {
  const redditTitle = String(title || 'AI Prompt');
  const redditBody = String(text || '');
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      args: [redditTitle, redditBody],
      func: (t, body) => {
        // Deep shadow DOM traversal — choose visible/live element (not hidden template)
        function isVisible(el) {
          if (!el) return false;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0
            && !el.closest('[hidden],[aria-hidden="true"]');
        }

        function queryDeep(selectors) {
          const queue = [document];
          const hits = [];
          while (queue.length) {
            const root = queue.shift();
            for (const sel of selectors) {
              root.querySelectorAll(sel).forEach((el) => hits.push({ sel, el }));
            }
            const all = root.querySelectorAll('*');
            for (const el of all) {
              if (el.shadowRoot) queue.push(el.shadowRoot);
            }
          }
          if (!hits.length) return null;

          const active = document.activeElement;
          if (active && active.isContentEditable && isVisible(active)) {
            const activeHit = hits.find((h) => h.el === active);
            if (activeHit) {
              return active;
            }
          }

          const visibleHits = hits.filter((h) => isVisible(h.el));
          const pool = visibleHits.length ? visibleHits : hits;
          return pool[pool.length - 1].el;
        }

        const setVal = (el, value) => {
          if (!el) return false;
          const str = String(value || '');
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const proto = Object.getPrototypeOf(el);
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) setter.call(el, str);
            else el.value = str;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return String(el.value || '').length > 0;
          }
          if (el.isContentEditable) {
            el.focus();
            const sel = window.getSelection();
            sel.selectAllChildren(el);
            sel.collapseToStart();

            const dt = new DataTransfer();
            dt.setData('text/plain', str);

            try {
              const beforeInput = new InputEvent('beforeinput', {
                inputType: 'insertFromPaste',
                bubbles: true,
                cancelable: true,
              });
              Object.defineProperty(beforeInput, 'dataTransfer', { get: () => dt });
              el.dispatchEvent(beforeInput);
              if ((el.textContent || '').trim().length > 0) return true;
            } catch (e1) {
              // fall back below
            }

            try {
              sel.selectAllChildren(el);
              sel.deleteFromDocument();
              document.execCommand('insertText', false, str);
              if ((el.textContent || '').trim().length > 0) return true;
            } catch (e2) {
              // give up quietly
            }
            return false;
          }
          return false;
        };

        const titleSels = [
          'textarea[name="title"]', 'input[name="title"]',
          'textarea[aria-label*="Title"]', 'input[aria-label*="Title"]',
          'textarea[aria-label*="title"]', 'input[placeholder*="Title"]',
        ];
        const bodySels = [
          'textarea[name="text"]', 'textarea[name="body"]',
          'textarea#submit_text',
          'textarea[data-testid="post-content-input"]',
          'div[contenteditable="true"][data-lexical-editor="true"]:not([aria-hidden="true"])',
          'div[contenteditable="true"][role="textbox"]:not([aria-hidden="true"])',
          'div[contenteditable="true"]:not([aria-hidden="true"])',
        ];

        let titleDone = false, bodyDone = false, bodyAttempted = false;
        const tryFill = () => {
          if (!titleDone) {
            const titleEl = queryDeep(titleSels);
            if (titleEl && setVal(titleEl, t)) {
              titleDone = true;
            }
          }
          if (!bodyDone && !bodyAttempted) {
            const bodyEl = queryDeep(bodySels);
            if (bodyEl) {
              bodyAttempted = true;
              if (setVal(bodyEl, body)) {
                bodyDone = true;
              }
            }
          }
          if (bodyAttempted && !bodyDone) {
            const bodyEl = queryDeep(bodySels);
            if (bodyEl && (bodyEl.textContent || '').trim().length > 0) {
              bodyDone = true;
            }
          }
          return bodyDone || bodyAttempted;
        };

        if (tryFill()) return;

        // MutationObserver for light DOM changes + polling for shadow DOM changes
        let stopped = false;
        const observer = new MutationObserver(() => {
          if (tryFill()) { stopped = true; observer.disconnect(); }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // Poll every 500ms to catch shadow DOM lazy renders (MutationObserver can't see them)
        let polls = 0;
        const poll = setInterval(() => {
          if (stopped || tryFill() || ++polls > 60) {
            stopped = true;
            clearInterval(poll);
            observer.disconnect();
          }
        }, 500);
        setTimeout(() => { stopped = true; clearInterval(poll); observer.disconnect(); }, 60000);
      }
    });
    return true;
  } catch {
    return false;
  }
}

async function openRedditAndPrefill(title, text) {
  const redditTitle = String(title || 'AI Prompt');
  const redditBody = String(text || '');
  // Keep URL lightweight; fill title/body via in-page injection for better reliability.
  const url = 'https://www.reddit.com/submit?selftext=true';
  const tab = await chrome.tabs.create({ url });
  if (!tab?.id) return;

  // Reddit has a verification/challenge page that redirects.
  // The tab fires 'complete' multiple times — inject on EVERY complete,
  // not just the first one. Stop after 60s or when tab is closed.
  const tabId = tab.id;
  let attempts = 0;
  const maxAttempts = 10;
  const doInject = () => {
    attempts++;
    injectRedditPrefillInTab(tabId, redditTitle, redditBody).catch(() => {});
  };

  const onUpdated = (id, info) => {
    if (id !== tabId || info.status !== 'complete') return;
    doInject();
    if (attempts >= maxAttempts) cleanup();
  };
  const onRemoved = (id) => { if (id === tabId) cleanup(); };
  const cleanup = () => {
    chrome.tabs.onUpdated.removeListener(onUpdated);
    chrome.tabs.onRemoved.removeListener(onRemoved);
  };

  chrome.tabs.onUpdated.addListener(onUpdated);
  chrome.tabs.onRemoved.addListener(onRemoved);
  // Safety: also try at staggered intervals to cover slow loads
  setTimeout(doInject, 3000);
  setTimeout(doInject, 6000);
  setTimeout(doInject, 10000);
  // Cleanup after 60s regardless
  setTimeout(cleanup, 60000);
}

function normalizeRedditBody(body, shareUrl = '') {
  let text = String(body || '').replace(/\r/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  text = text.replace(/(^|\n)(##[^\n]*)(?!\n\n)/g, '$1$2\n\n');
  text = text.replace(/\n(> [^\n]*)(?!\n\n)/g, '\n$1\n\n');

  if (shareUrl) {
    const canonicalLine = `Full prompt: ${shareUrl}`;
    // Drop any pre-existing Full prompt or promptark hub URL lines, then append one canonical line.
    text = text
      .split('\n')
      .filter(line => !/Full prompt\s*:/i.test(line) && !/https?:\/\/promptark\.oometa\.ai\/hub\?id=/i.test(line))
      .join('\n');

    text = `${text}\n\n${canonicalLine}`;
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
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
    const updatePendingNotification = async (title, message, requireInteraction = false) => {
      const options = {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title,
        message,
      };
      if (requireInteraction) options.requireInteraction = true;
      try {
        await chrome.notifications.create(options);
      } catch (e) {
        console.warn('[PendingIntent] Notification update failed:', e);
      }
    };
    if (intent.summary) {
      await chrome.notifications.create({
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
      if (platform === 'reddit') {
        await updatePendingNotification(
          '⏳ Preparing Reddit share...',
          'Continuing your previous action · creating share link...',
          false
        );
      }
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
        let redditPrefillTitle = shareTitle;
        let redditPrefillBody = content || '';
        let redditAiApplied = false;

        try {
          if (platform === 'reddit') {
            const withTimeout = async (promise, timeoutMs) => {
              return await new Promise((resolve) => {
                let settled = false;
                const timer = setTimeout(() => {
                  if (settled) return;
                  settled = true;
                  resolve(null);
                }, timeoutMs);
                Promise.resolve(promise).then((value) => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timer);
                  resolve(value || null);
                }).catch(() => {
                  if (settled) return;
                  settled = true;
                  clearTimeout(timer);
                  resolve(null);
                });
              });
            };

            // Login-resume settle: avoid racing immediately after auth redirect.
            await new Promise((resolve) => setTimeout(resolve, 1800));

            const attempts = [
              { settleDelay: 1400, timeoutMs: 12000, hint: 'Finalizing login session...' },
              { settleDelay: 500, timeoutMs: 8000, hint: 'Retrying polish once...' }
            ];
            for (let i = 0; i < attempts.length; i++) {
              const attempt = attempts[i];
              if (attempt.settleDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, attempt.settleDelay));
              }
              await updatePendingNotification(
                '✨ Generating...',
                `Continuing your previous action · ${attempt.hint}`,
                true
              );
              const aiResult = await withTimeout(
                generateShareText(content, shareTitle, shareUrl, platform),
                attempt.timeoutMs
              );
              redditPrefillTitle = aiResult?.title || redditPrefillTitle;
              redditPrefillBody = aiResult?.body || redditPrefillBody;
              redditAiApplied = !!(aiResult?.title || aiResult?.body);
              if (redditAiApplied) break;
            }
          } else {
            const aiResult = await generateShareText(content, shareTitle, shareUrl, platform);
            shareText = aiResult?.text;
          }
        } catch (e) {
          console.warn('[PendingIntent] AI share text generation failed:', e);
        }

        // Fallback if AI generation failed
        if (platform !== 'reddit' && !shareText) {
          shareText = buildFallbackText(platform, shareTitle, shareUrl, promptData);
        }
        if (platform === 'reddit') {
          redditPrefillBody = normalizeRedditBody(redditPrefillBody, shareUrl);
        }

        if (platform === 'twitter') {
          await chrome.tabs.create({ url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}` });
        } else if (platform === 'reddit') {
          if (!redditAiApplied) {
            try {
              await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: '⚠️ Reddit polish failed',
                message: 'Opened with original prompt content this time.',
                requireInteraction: true
              });
            } catch (e) {
              console.warn('[PendingIntent] Reddit failure notification failed:', e);
            }
          }
          await updatePendingNotification(
            '🔗 Opening Reddit...',
            redditAiApplied
              ? 'Polish completed · opening Reddit editor now.'
              : 'AI polish timed out · opening with original content.',
            true
          );
          try {
            await openRedditAndPrefill(redditPrefillTitle, redditPrefillBody);
          } catch (e) {
            console.warn('[PendingIntent] openRedditAndPrefill failed, fallback open submit page:', e);
            await chrome.tabs.create({ url: 'https://www.reddit.com/submit?selftext=true' });
          }
          await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: redditPrefillBody }).catch(() => {});
            }
          });
        } else if (platform === 'linkedin') {
          await chrome.tabs.create({ url: 'https://www.linkedin.com/feed/?shareActive=true' });
          await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareText }).catch(() => {});
            }
          });
        }
      } else if (platform === 'copy') {
        await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareUrl }).catch(() => {});
          }
        });
      } else if (platform === 'json') {
        const json = JSON.stringify({ title: shareTitle, content: promptData.content, category: promptData.category, tags: promptData.tags }, null, 2);
        await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: json }).catch(() => {});
          }
        });
      }
      
      if (platform !== 'reddit') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '🔗 ' + (platform === 'copy' || platform === 'json' ? 'Copied!' : 'Opening ' + platform + '...'),
          message: platform === 'copy' || platform === 'json' ? 'Check your clipboard' : 'Check the new tab to finish sharing.'
        });
      }
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
    handlePendingIntent().catch((e) => {
      console.warn('[PendingIntent] Resume after storage restore failed:', e);
    });
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
            const isLoginError = e.message === 'NOT_LOGGED_IN' || e.message?.includes('No valid response from Gemini Web');
            if (isLoginError) {
              chrome.tabs.create({ url: 'https://gemini.google.com/app', active: true });
            }
            sendResponse({
              success: false,
              error: isLoginError
                ? '请先登录 Gemini，已自动打开登录页。登录后关闭该页并重新点击翻译。'
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

      case 'OPEN_REDDIT_PREFILL': {
        (async () => {
          try {
            await openRedditAndPrefill(message.title || 'AI Prompt', message.text || '');
            sendResponse({ success: true });
          } catch (e) {
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
              await openRedditAndPrefill(redditTitle, shareText);
              // Copy body to clipboard for pasting
              try {
                await chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                  if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'COPY_TO_CLIPBOARD', text: shareText }).catch(() => {});
                  }
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
          await handlePendingIntent();
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
