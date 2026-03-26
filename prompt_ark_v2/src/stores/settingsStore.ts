import { createStore } from 'solid-js/store';
import type { Settings } from '../types';
import { SettingsStorage } from '../shared/storage';

interface SettingsStoreState {
  settings: Settings;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  language: 'zh-CN',
  theme: 'auto',
  syncEngine: 'chrome',
  imagePromptEnabled: false,
  preferences: {
    listView: 'grid',
    pageSize: 20,
    sortBy: 'updated',
    sortOrder: 'desc',
  },
};

const [state, setState] = createStore<SettingsStoreState>({
  settings: defaultSettings,
  isLoading: false,
});

export const settingsStore = {
  get state() {
    return state;
  },

  async loadSettings(): Promise<void> {
    setState('isLoading', true);
    try {
      const settings = await SettingsStorage.getSettings();
      setState('settings', settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setState('isLoading', false);
    }
  },

  async updateSettings(updates: Partial<Settings>): Promise<void> {
    const newSettings = { ...state.settings, ...updates };
    await SettingsStorage.saveSettings(newSettings);
    setState('settings', newSettings);
  },

  async setLanguage(language: Settings['language']): Promise<void> {
    await this.updateSettings({ language });
  },

  async setTheme(theme: Settings['theme']): Promise<void> {
    await this.updateSettings({ theme });
  },
};
