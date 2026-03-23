import { createSignal, createEffect } from 'solid-js';
import { LocalStorage } from '@/shared/api/storage';

export type Language = 'en' | 'zh';

interface I18nDictionary {
  [key: string]: string;
}

const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Hook for internationalization
 * Manages language state and dictionary loading
 */
export function useI18n() {
  const [currentLang, setCurrentLang] = createSignal<Language>(DEFAULT_LANGUAGE);
  const [dictionary, setDictionary] = createSignal<I18nDictionary>({});
  const [isLoading, setIsLoading] = createSignal(false);

  // Load saved language preference on mount
  createEffect(() => {
    void loadLanguagePreference();
  });

  /**
   * Load language preference from storage
   */
  const loadLanguagePreference = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const saved = await LocalStorage.get<Language>('language');
      const lang = saved ?? DEFAULT_LANGUAGE;
      setCurrentLang(lang);
      await loadDictionary(lang);
    } catch (error) {
      console.error('[useI18n] Failed to load language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load dictionary for a language
   */
  const loadDictionary = async (lang: Language): Promise<void> => {
    try {
      // Try to load from chrome i18n API first
      if (typeof chrome !== 'undefined' && chrome.i18n) {
        // Use chrome i18n - messages are already loaded via _locales
        setDictionary({});
        return;
      }

      // Fallback: load from storage or use default
      const savedDict = await LocalStorage.get<I18nDictionary>(`i18n_${lang}`);
      setDictionary(savedDict ?? {});
    } catch (error) {
      console.error('[useI18n] Failed to load dictionary:', error);
      setDictionary({});
    }
  };

  /**
   * Change the current language
   */
  const changeLanguage = async (lang: Language): Promise<void> => {
    setCurrentLang(lang);
    await LocalStorage.set('language', lang);
    await loadDictionary(lang);
  };

  /**
   * Translate a key
   */
  const t = (key: string, fallback?: string): string => {
    // First try chrome i18n
    if (typeof chrome !== 'undefined' && chrome.i18n) {
      const message = chrome.i18n.getMessage(key);
      if (message) return message;
    }

    // Fall back to dictionary
    return dictionary()[key] ?? fallback ?? key;
  };

  return {
    currentLang,
    dictionary,
    isLoading,
    t,
    changeLanguage,
    loadDictionary,
  };
}
