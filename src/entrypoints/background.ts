import { defineBackground } from 'wxt/sandbox';
import { PromptStorage } from '@shared/api/storage';
import { getProviders, setProviders, callCloudAPI } from '@shared/api/ai';
import { extractTitleAndCategory } from '@shared/utils/text-analysis';
import { extractVariables, composePrompt } from '@shared/utils/variables';
import type { Prompt } from '@shared/types/prompt';

export default defineBackground(() => {
  console.log(`🔥 [background.ts] v${chrome.runtime.getManifest().version} loaded`);
  
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Side panel setup failed:', error));
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sendResponse).catch(err => {
      console.error('[Background] Error handling message:', err);
      sendResponse({ success: false, error: err.message });
    });
    return true;
  });
  
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('[Background] Extension installed/updated');
  });
});

async function handleMessage(message: { type: string; [key: string]: unknown }, sendResponse: (response: unknown) => void): Promise<void> {
  switch (message.type) {
    case 'GET_PROMPTS': {
      const prompts = await PromptStorage.get();
      sendResponse({ success: true, prompts });
      break;
    }
    
    case 'SAVE_PROMPT': {
      const promptData = message.prompt as Omit<Prompt, 'id' | 'createdAt'>;
      const newPrompt: Prompt = {
        ...promptData,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        usageCount: 0,
        lastUsedAt: null,
        favorite: false,
        versions: [],
        variables: extractVariables(promptData.content),
      };
      await PromptStorage.save(newPrompt);
      sendResponse({ success: true, prompt: newPrompt });
      
      if (!newPrompt.title || newPrompt.title.endsWith('...')) {
        await enrichPrompt(newPrompt.id, newPrompt.content);
      }
      break;
    }
    
    case 'UPDATE_PROMPT': {
      const { id, updates } = message as { id: string; updates: Partial<Prompt> };
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
        updated.variables = extractVariables(updates.content);
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
      const { id } = message as { id: string };
      await PromptStorage.delete(id);
      sendResponse({ success: true });
      break;
    }
    
    case 'TOGGLE_FAVORITE': {
      const { id } = message as { id: string };
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
      const { id } = message as { id: string };
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
      const activeProviderId = (await chrome.storage.local.get('activeProviderId')).activeProviderId;
      sendResponse({ success: true, providers, activeProviderId });
      break;
    }
    
    case 'SAVE_PROVIDERS': {
      const { providers, activeProviderId } = message as { providers: unknown[]; activeProviderId?: string };
      await setProviders(providers);
      if (activeProviderId) {
        await chrome.storage.local.set({ activeProviderId });
      }
      sendResponse({ success: true });
      break;
    }
    
    case 'COMPOSE_PROMPT': {
      const { prompt, contentOverride } = message as { prompt: Prompt; contentOverride?: string };
      const composed = composePrompt(prompt, contentOverride || null);
      const variables = extractVariables(composed).filter(v => v.type !== 'context');
      sendResponse({ 
        success: true, 
        composed, 
        variables: variables.map(v => v.name)
      });
      break;
    }
    
    case 'AUTO_EXTRACT': {
      const { content } = message as { content: string };
      const result = await extractTitleAndCategory(
        content,
        async () => {
          const providers = await getProviders();
          const activeId = (await chrome.storage.local.get('activeProviderId')).activeProviderId;
          return providers.find(p => p.id === activeId) || providers[0] || null;
        },
        callCloudAPI
      );
      sendResponse({ success: true, ...result });
      break;
    }
    
    case 'GET_PAGE_CONTEXT': {
      sendResponse({ success: false });
      break;
    }
    
    case 'CAPTURE_PAGE_CONTEXT': {
      sendResponse({ success: true });
      break;
    }
    
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

async function enrichPrompt(id: string, content: string): Promise<void> {
  try {
    const result = await extractTitleAndCategory(
      content,
      async () => {
        const providers = await getProviders();
        const activeId = (await chrome.storage.local.get('activeProviderId')).activeProviderId;
        return providers.find(p => p.id === activeId) || providers[0] || null;
      },
      callCloudAPI
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