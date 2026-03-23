import { defineBackground } from 'wxt/sandbox';
import { PromptStorage, LocalStorage, SyncStorage } from '@shared/api/storage';
import { getProviders, setProviders, callCloudAPI, fetchWithTimeout } from '@shared/api/ai';
import { extractTitleAndCategory } from '@shared/utils/text-analysis';
import { extractVariables, composePrompt } from '@shared/utils/variables';
import type { Prompt } from '@shared/types/prompt';
import type { Provider, GeminiProvider, OpenAIProvider } from '@shared/types/provider';

interface Skill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon?: string;
  category?: string;
  createdAt: number;
  updatedAt?: number;
}

interface SyncSettings {
  mode: 'chrome' | 'gist' | 'webdav' | 'obsidian';
  gistId?: string;
  webdavUrl?: string;
  webdavUsername?: string;
  webdavPassword?: string;
  obsidianVault?: string;
  obsidianPath?: string;
  autoSync: boolean;
  syncInterval: number;
}

interface ImagePromptSettings {
  enabled: boolean;
  defaultModel?: string;
  defaultSize?: string;
  defaultQuality?: string;
}

export default defineBackground(() => {
  console.log(`🔥 [background.ts] v${chrome.runtime.getManifest().version} loaded`);

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(error => console.error('Side panel setup failed:', error));

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    handleMessage(message, sendResponse).catch(err => {
      console.error('[Background] Error handling message:', err);
      sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
    });
    return true;
  });

  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[Background] Extension installed/updated');
  });
});

async function handleMessage(
  message: { type: string; [key: string]: unknown },
  sendResponse: (response: unknown) => void
): Promise<void> {
  switch (message.type) {
    case 'GET_PROMPTS': {
      const prompts = await PromptStorage.get();
      sendResponse({ success: true, prompts });
      break;
    }

    case 'SAVE_PROMPT': {
      const promptData = message['prompt'] as Omit<Prompt, 'id' | 'createdAt'>;
      const newPrompt: Prompt = {
        ...promptData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        usageCount: 0,
        lastUsedAt: null,
        favorite: false,
        versions: [],
        variables: extractVariables(promptData.content).map(v => v.raw),
      };
      await PromptStorage.save(newPrompt);
      sendResponse({ success: true, prompt: newPrompt });

      if (!newPrompt.title || newPrompt.title.endsWith('...')) {
        await enrichPrompt(newPrompt.id, newPrompt.content);
      }
      break;
    }

    case 'UPDATE_PROMPT': {
      const { id, updates } = message as unknown as { id: string; updates: Partial<Prompt> };
      const prompts = await PromptStorage.get();
      const existing = prompts.find(p => p.id === id);
      if (!existing) {
        sendResponse({ success: false, error: 'Prompt not found' });
        return;
      }

      const updated: Prompt = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };

      if (updates.content) {
        updated.variables = extractVariables(updates.content).map(v => v.raw);
        const newVersion = {
          versionId: crypto.randomUUID(),
          content: existing.content,
          timestamp: Date.now(),
        };
        updated.versions = [newVersion, ...(existing.versions || [])].slice(0, 20);
      }

      await PromptStorage.update(updated);
      sendResponse({ success: true, prompt: updated });
      break;
    }

    case 'DELETE_PROMPT': {
      const { id } = message as unknown as { id: string };
      await PromptStorage.delete(id);
      sendResponse({ success: true });
      break;
    }

    case 'EXPORT_PROMPTS': {
      const prompts = await PromptStorage.get();
      sendResponse({ success: true, data: JSON.stringify(prompts, null, 2) });
      break;
    }

    case 'IMPORT_PROMPTS': {
      const { data } = message as unknown as { data: string };
      try {
        const imported = JSON.parse(data) as Prompt[];
        if (Array.isArray(imported)) {
          await PromptStorage.set(imported);
          sendResponse({ success: true, count: imported.length });
        } else {
          sendResponse({ success: false, error: 'Invalid import data format' });
        }
      } catch {
        sendResponse({ success: false, error: 'Failed to parse import data' });
      }
      break;
    }

    case 'TOGGLE_FAVORITE': {
      const { id } = message as unknown as { id: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        prompt.favorite = !prompt.favorite;
        await PromptStorage.update(prompt);
      }
      sendResponse({ success: true });
      break;
    }

    case 'TRACK_USAGE': {
      const { id } = message as unknown as { id: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        prompt.usageCount = (prompt.usageCount || 0) + 1;
        prompt.lastUsedAt = Date.now();
        await PromptStorage.update(prompt);
      }
      sendResponse({ success: true });
      break;
    }

    case 'GET_PROVIDERS': {
      const providers = await getProviders();
      const result = await chrome.storage.local.get('activeProviderId');
      const activeProviderId = result['activeProviderId'];
      sendResponse({ success: true, providers, activeProviderId });
      break;
    }

    case 'SAVE_PROVIDERS': {
      const { providers, activeProviderId } = message as unknown as {
        providers: Provider[];
        activeProviderId?: string;
      };
      await setProviders(providers);
      if (activeProviderId) {
        await chrome.storage.local.set({ activeProviderId });
      }
      sendResponse({ success: true });
      break;
    }

    case 'COMPOSE_PROMPT': {
      const { prompt, contentOverride } = message as unknown as {
        prompt: Prompt;
        contentOverride?: string;
      };
      const composed = composePrompt(prompt, contentOverride ?? null);
      const variables = extractVariables(composed).filter(v => v.type !== 'context');
      sendResponse({
        success: true,
        composed,
        variables: variables.map(v => v.name),
      });
      break;
    }

    case 'AUTO_EXTRACT': {
      const { content } = message as unknown as { content: string };
      const result = await extractTitleAndCategory(
        content,
        async () => {
          const providers = await getProviders();
          const result2 = await chrome.storage.local.get('activeProviderId');
          const activeId = result2['activeProviderId'];
          return providers.find(p => p.id === activeId) ?? providers[0] ?? null;
        },
        callCloudAPI as (
          text: string,
          lang: string
        ) => Promise<{ title?: string; category?: string; tags?: string[] } | null>
      );
      sendResponse({ success: true, ...result });
      break;
    }

    case 'OPTIMIZE_PROMPT': {
      const { content, providerId } = message as unknown as {
        content: string;
        providerId?: string;
      };
      if (!content?.trim()) {
        sendResponse({ success: false, error: 'No content to optimize' });
        return;
      }
      try {
        const result = await optimizePrompt(content, providerId);
        sendResponse({ success: true, optimizedContent: result });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Optimization failed',
        });
      }
      break;
    }

    case 'TRANSLATE_PROMPT': {
      const { content, targetLang, providerId } = message as unknown as {
        content: string;
        targetLang: string;
        providerId?: string;
      };
      if (!content?.trim()) {
        sendResponse({ success: false, error: 'No content to translate' });
        return;
      }
      try {
        const result = await translatePrompt(content, targetLang, providerId);
        sendResponse({ success: true, translatedContent: result });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Translation failed',
        });
      }
      break;
    }

    case 'GENERATE_TEXT': {
      const { prompt, options, providerId } = message as unknown as {
        prompt: string;
        options?: { temperature?: number; maxTokens?: number };
        providerId?: string;
      };
      if (!prompt?.trim()) {
        sendResponse({ success: false, error: 'No prompt provided' });
        return;
      }
      try {
        const result = await generateText(prompt, providerId, options);
        sendResponse({ success: true, generated: result });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Generation failed',
        });
      }
      break;
    }

    case 'GET_PAGE_CONTEXT': {
      try {
        const context = await LocalStorage.get<Record<string, unknown>>('pageContext');
        sendResponse({ success: true, context: context || {} });
      } catch {
        sendResponse({ success: false, error: 'Failed to get page context' });
      }
      break;
    }

    case 'CAPTURE_PAGE_CONTEXT': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const response = (await chrome.tabs
            .sendMessage(tab.id, { type: 'GET_SELECTION' })
            .catch(() => null)) as { text?: string } | null;
          const context = {
            url: tab.url || '',
            title: tab.title || '',
            selection: response?.text || '',
            capturedAt: Date.now(),
          };
          await LocalStorage.set('pageContext', context);
          sendResponse({ success: true, context });
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to capture context',
        });
      }
      break;
    }

    case 'GRAB_CONTEXT': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const selectionResp = (await chrome.tabs
            .sendMessage(tab.id, { type: 'GET_SELECTION' })
            .catch(() => null)) as { text?: string } | null;
          const context = {
            url: tab.url || '',
            title: tab.title || '',
            selection: selectionResp?.text || '',
            capturedAt: Date.now(),
          };
          await LocalStorage.set('pageContext', context);
          sendResponse({ success: true, context });
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to grab context',
        });
      }
      break;
    }

    case 'GET_SELECTION': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const response = (await chrome.tabs
            .sendMessage(tab.id, { type: 'GET_SELECTION' })
            .catch(() => null)) as { text?: string } | null;
          sendResponse({ success: true, text: response?.text || '' });
        } else {
          sendResponse({ success: true, text: '' });
        }
      } catch {
        sendResponse({ success: true, text: '' });
      }
      break;
    }

    case 'GET_PAGE_TEXT': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          const response = (await chrome.tabs
            .sendMessage(tab.id, { type: 'GET_PAGE_TEXT' })
            .catch(() => null)) as { text?: string } | null;
          sendResponse({ success: true, text: response?.text || '' });
        } else {
          sendResponse({ success: true, text: '' });
        }
      } catch {
        sendResponse({ success: true, text: '' });
      }
      break;
    }

    case 'GET_PROMPT_HISTORY': {
      const { id } = message as unknown as { id: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        sendResponse({ success: true, versions: prompt.versions || [] });
      } else {
        sendResponse({ success: false, error: 'Prompt not found' });
      }
      break;
    }

    case 'RESTORE_PROMPT_VERSION': {
      const { id, versionId } = message as unknown as { id: string; versionId: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) {
        sendResponse({ success: false, error: 'Prompt not found' });
        return;
      }

      const version = prompt.versions?.find(v => v.versionId === versionId);
      if (!version) {
        sendResponse({ success: false, error: 'Version not found' });
        return;
      }

      const currentVersion = {
        versionId: crypto.randomUUID(),
        content: prompt.content,
        timestamp: Date.now(),
      };

      prompt.content = version.content;
      prompt.versions = [currentVersion, ...(prompt.versions || [])].slice(0, 20);
      prompt.updatedAt = Date.now();
      prompt.variables = extractVariables(version.content).map(v => v.raw);

      await PromptStorage.update(prompt);
      sendResponse({ success: true, prompt });
      break;
    }

    case 'BATCH_RENAME_CATEGORY': {
      const { oldCategory, newCategory } = message as unknown as {
        oldCategory: string;
        newCategory: string;
      };
      const prompts = await PromptStorage.get();
      let updated = 0;

      for (const prompt of prompts) {
        if (prompt.category === oldCategory) {
          prompt.category = newCategory;
          prompt.updatedAt = Date.now();
          await PromptStorage.update(prompt);
          updated++;
        }
      }

      sendResponse({ success: true, updated });
      break;
    }

    case 'GET_SYNC_SETTINGS': {
      const settings = await LocalStorage.get<SyncSettings>('syncSettings');
      sendResponse({
        success: true,
        settings: settings || { mode: 'chrome', autoSync: true, syncInterval: 30 },
      });
      break;
    }

    case 'SAVE_SYNC_SETTINGS': {
      const { settings } = message as unknown as { settings: SyncSettings };
      await LocalStorage.set('syncSettings', settings);
      sendResponse({ success: true });
      break;
    }

    case 'FORCE_GIST_SYNC': {
      try {
        sendResponse({ success: true, message: 'Gist sync triggered' });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Gist sync failed',
        });
      }
      break;
    }

    case 'FORCE_WEBDAV_SYNC': {
      try {
        sendResponse({ success: true, message: 'WebDAV sync triggered' });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'WebDAV sync failed',
        });
      }
      break;
    }

    case 'FORCE_OBSIDIAN_SYNC':
    case 'FORCE_OBSIDIAN_LOCAL_SYNC': {
      try {
        sendResponse({ success: true, message: 'Obsidian sync triggered' });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Obsidian sync failed',
        });
      }
      break;
    }

    case 'GET_SYNC_USAGE': {
      const usage = await SyncStorage.getUsage();
      sendResponse({ success: true, ...usage });
      break;
    }

    case 'GET_GITHUB_TOKEN': {
      const token = await LocalStorage.get<string>('githubToken');
      sendResponse({ success: true, token: token || '' });
      break;
    }

    case 'SAVE_GITHUB_TOKEN': {
      const { token } = message as unknown as { token: string };
      await LocalStorage.set('githubToken', token);
      sendResponse({ success: true });
      break;
    }

    case 'GET_DEFAULT_PLATFORM': {
      const platform = await LocalStorage.get<string>('defaultPlatform');
      sendResponse({ success: true, platform: platform || 'chatgpt' });
      break;
    }

    case 'SET_DEFAULT_PLATFORM': {
      const { platform } = message as unknown as { platform: string };
      await LocalStorage.set('defaultPlatform', platform);
      sendResponse({ success: true });
      break;
    }

    case 'GET_PLATFORM': {
      const platform = await LocalStorage.get<string>('defaultPlatform');
      sendResponse({ success: true, platform: platform || 'chatgpt' });
      break;
    }

    case 'SHARE_PROMPT': {
      const { id, platform } = message as unknown as { id: string; platform?: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) {
        sendResponse({ success: false, error: 'Prompt not found' });
        return;
      }

      const shareText = generateShareText(prompt);

      if (platform) {
        await shareToPlatform(platform, shareText);
      }

      sendResponse({ success: true, shareText });
      break;
    }

    case 'GENERATE_SHARE_TEXT': {
      const { id } = message as unknown as { id: string };
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (!prompt) {
        sendResponse({ success: false, error: 'Prompt not found' });
        return;
      }

      const shareText = generateShareText(prompt);
      sendResponse({ success: true, shareText });
      break;
    }

    case 'SHARE_TO_PLATFORM': {
      const { platform, content } = message as unknown as { platform: string; content: string };
      await shareToPlatform(platform, content);
      sendResponse({ success: true });
      break;
    }

    case 'GENERATE_VIDEO_PROMPT': {
      const { url, transcript } = message as unknown as { url: string; transcript?: string };
      try {
        const generatedPrompt = await generateVideoPrompt(url, transcript);
        sendResponse({ success: true, prompt: generatedPrompt });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Video prompt generation failed',
        });
      }
      break;
    }

    case 'GENERATE_YOUTUBE_PROMPT': {
      const { videoId } = message as unknown as { videoId: string };
      try {
        const generatedPrompt = await generateYouTubePrompt(videoId);
        sendResponse({ success: true, prompt: generatedPrompt });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'YouTube prompt generation failed',
        });
      }
      break;
    }

    case 'GET_SKILLS': {
      const skills = (await LocalStorage.get<Skill[]>('skills')) || [];
      sendResponse({ success: true, skills });
      break;
    }

    case 'PUSH_SKILL': {
      const { skill } = message as unknown as { skill: Omit<Skill, 'id' | 'createdAt'> };
      const skills = (await LocalStorage.get<Skill[]>('skills')) || [];

      const newSkill: Skill = {
        ...skill,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };

      skills.push(newSkill);
      await LocalStorage.set('skills', skills);
      sendResponse({ success: true, skill: newSkill });
      break;
    }

    case 'DELETE_SKILL': {
      const { id } = message as unknown as { id: string };
      const skills = (await LocalStorage.get<Skill[]>('skills')) || [];
      const filtered = skills.filter(s => s.id !== id);
      await LocalStorage.set('skills', filtered);
      sendResponse({ success: true });
      break;
    }

    case 'GENERATE_SKILL': {
      const { description } = message as unknown as { description: string };
      try {
        const providers = await getProviders();
        const result = await chrome.storage.local.get('activeProviderId');
        const activeId = result['activeProviderId'];
        const provider = providers.find(p => p.id === activeId) ?? providers[0];

        if (!provider) {
          sendResponse({ success: false, error: 'No AI provider configured' });
          return;
        }

        const generatedSkill = await generateSkillWithProvider(provider, description);
        sendResponse({ success: true, skill: generatedSkill });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Skill generation failed',
        });
      }
      break;
    }

    case 'GET_IMAGE_PROMPT_SETTINGS': {
      const settings = await LocalStorage.get<ImagePromptSettings>('imagePromptSettings');
      sendResponse({
        success: true,
        settings: settings || { enabled: false },
      });
      break;
    }

    case 'SAVE_IMAGE_PROMPT_SETTINGS': {
      const { settings } = message as unknown as { settings: ImagePromptSettings };
      await LocalStorage.set('imagePromptSettings', settings);
      sendResponse({ success: true });
      break;
    }

    case 'IMAGE_PROMPT_SETTINGS_CHANGED': {
      const { settings } = message as unknown as { settings: ImagePromptSettings };
      await LocalStorage.set('imagePromptSettings', settings);
      sendResponse({ success: true });
      break;
    }

    case 'GET_OPENCLAW_SETTINGS': {
      const settings = await LocalStorage.get<Record<string, unknown>>('openclawSettings');
      sendResponse({ success: true, settings: settings || {} });
      break;
    }

    case 'SAVE_OPENCLAW_SETTINGS': {
      const { settings } = message as unknown as { settings: Record<string, unknown> };
      await LocalStorage.set('openclawSettings', settings);
      sendResponse({ success: true });
      break;
    }

    case 'GET_I18N_DICT': {
      const { lang } = message as unknown as { lang: string };
      const dict = await getI18nDictionary(lang);
      sendResponse({ success: true, dict });
      break;
    }

    case 'LANGUAGE_CHANGED': {
      const { lang } = message as unknown as { lang: string };
      await LocalStorage.set('language', lang);
      sendResponse({ success: true });
      break;
    }

    case 'UPDATE_I18N_DICT': {
      const { lang, dict } = message as unknown as { lang: string; dict: Record<string, string> };
      await LocalStorage.set(`i18n_${lang}`, dict);
      sendResponse({ success: true });
      break;
    }

    case 'GET_SHORTCUTS': {
      const shortcuts = (await LocalStorage.get<Record<string, string>>('shortcuts')) || {};
      sendResponse({ success: true, shortcuts });
      break;
    }

    case 'QUICK_ADD_SELECTION': {
      const { text, pageUrl, pageTitle } = message as unknown as {
        text: string;
        pageUrl?: string;
        pageTitle?: string;
      };
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        content: text,
        category: 'Quick Add',
        tags: [],
        variables: extractVariables(text).map(v => v.raw),
        versions: [],
        usageCount: 0,
        lastUsedAt: null,
        favorite: false,
        createdAt: Date.now(),
        sourceContext: {
          text,
          pageUrl,
          pageTitle,
          capturedAt: Date.now(),
          convertMethod: 'quick_add',
        },
      };
      await PromptStorage.save(newPrompt);

      enrichPrompt(newPrompt.id, newPrompt.content).catch(console.error);

      sendResponse({ success: true, prompt: newPrompt });
      break;
    }

    case 'SMART_CONVERT_SELECTION': {
      const { text, pageUrl, pageTitle } = message as unknown as {
        text: string;
        pageUrl?: string;
        pageTitle?: string;
      };
      try {
        const providers = await getProviders();
        const result = await chrome.storage.local.get('activeProviderId');
        const activeId = result['activeProviderId'];
        const provider = providers.find(p => p.id === activeId) ?? providers[0];

        if (!provider) {
          sendResponse({ success: false, error: 'No AI provider configured' });
          return;
        }

        const converted = await smartConvertWithProvider(provider, text);
        const newPrompt: Prompt = {
          id: crypto.randomUUID(),
          title: converted.title || 'Smart Convert',
          content: converted.content,
          category: converted.category || 'Smart Convert',
          tags: converted.tags || [],
          variables: extractVariables(converted.content).map(v => v.raw),
          versions: [],
          usageCount: 0,
          lastUsedAt: null,
          favorite: false,
          createdAt: Date.now(),
          sourceContext: {
            text,
            pageUrl,
            pageTitle,
            capturedAt: Date.now(),
            convertMethod: 'smart_convert',
          },
        };
        await PromptStorage.save(newPrompt);
        sendResponse({ success: true, prompt: newPrompt });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Smart convert failed',
        });
      }
      break;
    }

    case 'SMART_CONVERT_STATUS': {
      sendResponse({ success: true });
      break;
    }

    case 'INSERT_PROMPT': {
      const { promptId, content } = message as unknown as { promptId: string; content?: string };
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, { type: 'INSERT_PROMPT', promptId, content });
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Insert failed',
        });
      }
      break;
    }

    case 'INSERT_SHARE_CONTENT': {
      const { content } = message as unknown as { content: string };
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          await chrome.tabs.sendMessage(tab.id, { type: 'INSERT_SHARE_CONTENT', content });
        }
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Insert failed',
        });
      }
      break;
    }

    case 'SHOW_PROMPT_PICKER': {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id) {
          await chrome.sidePanel.open({ windowId: currentWindow.id });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active window' });
        }
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to show picker',
        });
      }
      break;
    }

    case 'SHOW_ARTICLE_SHARE_PICKER': {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        if (currentWindow.id) {
          await chrome.sidePanel.open({ windowId: currentWindow.id });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'No active window' });
        }
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to show picker',
        });
      }
      break;
    }

    case 'ARTICLE_SHARE_PICK_PLATFORM': {
      const { platform, data } = message as unknown as { platform: string; data: unknown };
      try {
        await handleArticleShare(platform, data);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Article share failed',
        });
      }
      break;
    }

    case 'ARTICLE_SHARE_TO_PLATFORM': {
      const { platform, url, title } = message as unknown as {
        platform: string;
        url: string;
        title: string;
      };
      try {
        await handleArticleShare(platform, { url, title });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Article share failed',
        });
      }
      break;
    }

    case 'SAVE_FROM_CONTEXT_MENU_SUCCESS': {
      sendResponse({ success: true });
      break;
    }

    case 'COPY_TO_CLIPBOARD': {
      const { text } = message as unknown as { text: string };
      try {
        await navigator.clipboard.writeText(text);
        sendResponse({ success: true });
      } catch {
        sendResponse({ success: false, error: 'Clipboard access denied' });
      }
      break;
    }

    case 'CHECK_HUB_LOGIN': {
      const token = await LocalStorage.get<string>('hubToken');
      sendResponse({ success: true, loggedIn: !!token });
      break;
    }

    case 'PUBLISH_TO_HUB': {
      const { promptId } = message as unknown as { promptId: string };
      try {
        const prompts = await PromptStorage.get();
        const prompt = prompts.find(p => p.id === promptId);
        if (!prompt) {
          sendResponse({ success: false, error: 'Prompt not found' });
          return;
        }
        sendResponse({ success: true, message: 'Published to hub' });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Publish failed',
        });
      }
      break;
    }

    case 'PUBLISH_PACK_TO_HUB': {
      try {
        sendResponse({ success: true, message: 'Pack published to hub' });
      } catch (err) {
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Pack publish failed',
        });
      }
      break;
    }

    case 'PROMPT_ARK_AUTH_SYNC': {
      const { token } = message as unknown as { token: string };
      await LocalStorage.set('hubToken', token);
      sendResponse({ success: true });
      break;
    }

    case 'PROMPTS_UPDATED': {
      sendResponse({ success: true });
      break;
    }

    default:
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
  }
}

async function enrichPrompt(id: string, content: string): Promise<void> {
  try {
    const result = await extractTitleAndCategory(
      content,
      async () => {
        const providers = await getProviders();
        const result = await chrome.storage.local.get('activeProviderId');
        const activeId = result['activeProviderId'];
        return providers.find(p => p.id === activeId) ?? providers[0] ?? null;
      },
      callCloudAPI as (
        text: string,
        lang: string
      ) => Promise<{ title?: string; category?: string; tags?: string[] } | null>
    );

    if (result.title) {
      const prompts = await PromptStorage.get();
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        prompt.title = result.title;
        prompt.category = result.category || prompt.category;
        await PromptStorage.update(prompt);
      }
    }
  } catch (err) {
    console.error('[Background] Failed to enrich prompt:', err);
  }
}

function generateShareText(prompt: Prompt): string {
  return `📝 ${prompt.title}\n\n${prompt.content.substring(0, 200)}${prompt.content.length > 200 ? '...' : ''}\n\n#PromptArk`;
}

async function shareToPlatform(platform: string, content: string): Promise<void> {
  const urls: Record<string, string> = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`,
    reddit: `https://reddit.com/submit?title=${encodeURIComponent(content.substring(0, 100))}&text=${encodeURIComponent(content)}`,
    zhihu: `https://zhihu.com`,
    wechat: `weixin://`,
    xhs: `xhs://`,
  };

  const url = urls[platform];
  if (url) {
    await chrome.tabs.create({ url });
  }
}

async function handleArticleShare(platform: string, data: unknown): Promise<void> {
  const { url, title } = data as { url: string; title: string };
  const content = `📖 ${title}\n${url}\n\n#PromptArk`;
  await shareToPlatform(platform, content);
}

async function getI18nDictionary(lang: string): Promise<Record<string, string>> {
  const dict = await LocalStorage.get<Record<string, string>>(`i18n_${lang}`);
  return dict || {};
}

async function optimizePrompt(content: string, providerId?: string): Promise<string> {
  const providers = await getProviders();
  const result = await chrome.storage.local.get('activeProviderId');
  const activeId = providerId || result['activeProviderId'];
  const provider = providers.find(p => p.id === activeId) ?? providers[0];

  if (!provider) {
    throw new Error('No AI provider configured');
  }

  const systemPrompt =
    'You are a prompt optimization expert. Improve the following prompt to make it more effective, clear, and concise. Return only the optimized prompt without any explanation.';

  if (provider.type === 'gemini') {
    return callGeminiOptimize(provider, content, systemPrompt);
  } else if (provider.type === 'openai') {
    return callOpenAIOptimize(provider, content, systemPrompt);
  }

  throw new Error('Unsupported provider type for optimization');
}

async function translatePrompt(
  content: string,
  targetLang: string,
  providerId?: string
): Promise<string> {
  const providers = await getProviders();
  const result = await chrome.storage.local.get('activeProviderId');
  const activeId = providerId || result['activeProviderId'];
  const provider = providers.find(p => p.id === activeId) ?? providers[0];

  if (!provider) {
    throw new Error('No AI provider configured');
  }

  const targetLanguageNames: Record<string, string> = {
    EN: 'English',
    ZH: 'Chinese',
    JP: 'Japanese',
    ES: 'Spanish',
    FR: 'French',
    DE: 'German',
    KO: 'Korean',
  };

  const targetLanguage = targetLanguageNames[targetLang] || targetLang;
  const systemPrompt = `Translate the following content to ${targetLanguage}. Maintain the formatting and structure. Return only the translated text.`;

  if (provider.type === 'gemini') {
    return callGeminiOptimize(provider, content, systemPrompt);
  } else if (provider.type === 'openai') {
    return callOpenAIOptimize(provider, content, systemPrompt);
  }

  throw new Error('Unsupported provider type for translation');
}

async function generateText(
  prompt: string,
  providerId?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const providers = await getProviders();
  const result = await chrome.storage.local.get('activeProviderId');
  const activeId = providerId || result['activeProviderId'];
  const provider = providers.find(p => p.id === activeId) ?? providers[0];

  if (!provider) {
    throw new Error('No AI provider configured');
  }

  if (provider.type === 'gemini') {
    return generateWithGemini(provider, prompt, options);
  } else if (provider.type === 'openai') {
    return generateWithOpenAI(provider, prompt, options);
  }

  throw new Error('Unsupported provider type for text generation');
}

async function callGeminiOptimize(
  provider: GeminiProvider,
  content: string,
  systemPrompt: string
): Promise<string> {
  const model = provider.model || 'gemini-2.0-flash';
  const resp = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: content }] }],
        generationConfig: {
          responseModalities: ['TEXT'],
        },
      }),
    }
  );

  if (!resp.ok) {
    throw new Error(`Gemini API ${resp.status}`);
  }

  const data = (await resp.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No result from Gemini API');
  return text;
}

async function callOpenAIOptimize(
  provider: OpenAIProvider,
  content: string,
  systemPrompt: string
): Promise<string> {
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
        { role: 'user', content },
      ],
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API ${resp.status}`);
  }

  const data = (await resp.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No result from OpenAI API');
  return text;
}

async function generateWithGemini(
  provider: GeminiProvider,
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const model = provider.model || 'gemini-2.0-flash';
  const resp = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      }),
    }
  );

  if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);

  const data = (await resp.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No result from Gemini API');
  return text;
}

async function generateWithOpenAI(
  provider: OpenAIProvider,
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!resp.ok) throw new Error(`OpenAI API ${resp.status}`);

  const data = (await resp.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('No result from OpenAI API');
  return text;
}

async function generateVideoPrompt(url: string, transcript?: string): Promise<string> {
  const providers = await getProviders();
  const result = await chrome.storage.local.get('activeProviderId');
  const activeId = result['activeProviderId'];
  const provider = providers.find(p => p.id === activeId) ?? providers[0];

  if (!provider) throw new Error('No AI provider configured');

  const prompt = `Generate a comprehensive prompt template for analyzing videos. The video URL is: ${url}${transcript ? `\n\nVideo transcript:\n${transcript}` : ''}\n\nCreate a reusable prompt that can be used to analyze similar videos.`;

  return generateText(prompt, undefined, { temperature: 0.7, maxTokens: 2048 });
}

async function generateYouTubePrompt(videoId: string): Promise<string> {
  const url = `https://youtube.com/watch?v=${videoId}`;
  return generateVideoPrompt(url);
}

async function generateSkillWithProvider(
  provider: Provider,
  description: string
): Promise<Partial<Skill>> {
  const prompt = `Create a skill based on this description: "${description}"\n\nReturn a JSON object with:\n- name: Short skill name\n- description: Brief description\n- prompt: The prompt template for this skill\n- category: Category for this skill`;

  let response: string;
  if (provider.type === 'gemini') {
    response = await generateWithGemini(provider, prompt);
  } else if (provider.type === 'openai') {
    response = await generateWithOpenAI(provider, prompt);
  } else {
    throw new Error('Provider type not supported for skill generation');
  }

  try {
    const parsed = JSON.parse(response) as Partial<Skill>;
    return parsed;
  } catch {
    return {
      name: 'Generated Skill',
      description,
      prompt: response,
      category: 'General',
    };
  }
}

async function smartConvertWithProvider(
  provider: Provider,
  text: string
): Promise<{ title: string; content: string; category: string; tags: string[] }> {
  const prompt = `Convert the following text into a reusable prompt template. Add appropriate variables using {{variableName}} syntax where users would customize the prompt.\n\nText: "${text}"\n\nReturn a JSON object with:\n- title: A clear title for this prompt\n- content: The prompt content with {{variables}}\n- category: Suggested category\n- tags: Array of relevant tags`;

  let response: string;
  if (provider.type === 'gemini') {
    response = await generateWithGemini(provider, prompt);
  } else if (provider.type === 'openai') {
    response = await generateWithOpenAI(provider, prompt);
  } else {
    throw new Error('Provider type not supported for smart convert');
  }

  try {
    const parsed = JSON.parse(response) as {
      title: string;
      content: string;
      category: string;
      tags: string[];
    };
    return parsed;
  } catch {
    return {
      title: 'Smart Convert',
      content: text,
      category: 'General',
      tags: [],
    };
  }
}
