import { createSignal, createEffect } from 'solid-js';
import { LocalStorage } from '@/shared/api/storage';
import type { Prompt } from '@/shared/types/prompt';

export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'perplexity' | 'deepseek' | 'kimi' | 'other';

/**
 * Hook for platform detection and prompt injection
 * Manages platform state and handles content script communication
 */
export function usePlatform() {
  const [currentPlatform, setCurrentPlatform] = createSignal<Platform | null>(null);
  const [isInjecting, setIsInjecting] = createSignal(false);
  const [lastError, setLastError] = createSignal<string | null>(null);

  // Detect current platform based on active tab
  createEffect(() => {
    void detectPlatform();
  });

  /**
   * Detect the current AI platform from the active tab
   */
  const detectPlatform = async (): Promise<void> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        setCurrentPlatform('other');
        return;
      }

      const url = tab.url.toLowerCase();

      if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
        setCurrentPlatform('chatgpt');
      } else if (url.includes('claude.ai')) {
        setCurrentPlatform('claude');
      } else if (url.includes('gemini.google.com')) {
        setCurrentPlatform('gemini');
      } else if (url.includes('perplexity.ai')) {
        setCurrentPlatform('perplexity');
      } else if (url.includes('deepseek.com')) {
        setCurrentPlatform('deepseek');
      } else if (url.includes('kimi') || url.includes('moonshot.cn')) {
        setCurrentPlatform('kimi');
      } else {
        setCurrentPlatform('other');
      }
    } catch (error) {
      console.error('[usePlatform] Failed to detect platform:', error);
      setCurrentPlatform('other');
    }
  };

  /**
   * Get the default platform from settings
   */
  const getDefaultPlatform = async (): Promise<Platform> => {
    try {
      const saved = await LocalStorage.get<Platform>('defaultPlatform');
      return saved ?? 'chatgpt';
    } catch {
      return 'chatgpt';
    }
  };

  /**
   * Set the default platform
   */
  const setDefaultPlatform = async (platform: Platform): Promise<void> => {
    await LocalStorage.set('defaultPlatform', platform);
  };

  /**
   * Insert a prompt into the current platform's chat input
   */
  const insertPrompt = async (prompt: Prompt, contentOverride?: string): Promise<{ success: boolean; error?: string }> => {
    setIsInjecting(true);
    setLastError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'INSERT_PROMPT',
        promptId: prompt.id,
        content: contentOverride ?? prompt.content,
      });

      // Track usage
      await chrome.runtime.sendMessage({
        type: 'TRACK_USAGE',
        id: prompt.id,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to insert prompt';
      setLastError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsInjecting(false);
    }
  };

  /**
   * Check if the current platform is supported for injection
   */
  const isPlatformSupported = (): boolean => {
    const platform = currentPlatform();
    return platform !== null && platform !== 'other';
  };

  return {
    currentPlatform,
    isInjecting,
    lastError,
    detectPlatform,
    getDefaultPlatform,
    setDefaultPlatform,
    insertPrompt,
    isPlatformSupported,
  };
}
