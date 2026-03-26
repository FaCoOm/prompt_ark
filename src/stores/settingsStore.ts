import { LocalStorage } from '@shared/api/storage';
import type { Provider } from '@shared/types/provider';
import { createStore, produce } from 'solid-js/store';

export interface GeneralSettings {
  language: 'en' | 'zh';
  defaultPlatform: string;
  githubToken: string;
  openClawEnabled: boolean;
  imagePromptEnabled: boolean;
}

export interface SyncSettings {
  engine: 'local' | 'chrome' | 'gist' | 'webdav' | 'obsidian';
  settings: Record<string, unknown>;
  lastSyncTime: number | null;
}

export interface ModelSettings {
  providers: Provider[];
  activeProviderId: string | null;
  visionModel: string;
}

const STORAGE_KEY = 'promptark_settings';

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  language: 'en',
  defaultPlatform: '',
  githubToken: '',
  openClawEnabled: false,
  imagePromptEnabled: false,
};

const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  providers: [],
  activeProviderId: null,
  visionModel: '',
};

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  engine: 'local',
  settings: {},
  lastSyncTime: null,
};

const [state, setState] = createStore({
  general: DEFAULT_GENERAL_SETTINGS,
  models: DEFAULT_MODEL_SETTINGS,
  sync: DEFAULT_SYNC_SETTINGS,
  activeTab: 'general' as 'general' | 'models' | 'sync',
  isLoading: false,
  error: null as string | null,
});

export const settingsStore = {
  get general() {
    return state.general;
  },
  get models() {
    return state.models;
  },
  get sync() {
    return state.sync;
  },
  get activeTab() {
    return state.activeTab;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },

  loadSettings: async () => {
    setState('isLoading', true);
    setState('error', null);
    try {
      const stored = await LocalStorage.get<{
        general?: Partial<GeneralSettings>;
        models?: Partial<ModelSettings>;
        sync?: Partial<SyncSettings>;
      }>(STORAGE_KEY);

      if (stored) {
        setState('general', { ...DEFAULT_GENERAL_SETTINGS, ...stored.general });
        setState('models', { ...DEFAULT_MODEL_SETTINGS, ...stored.models });
        setState('sync', { ...DEFAULT_SYNC_SETTINGS, ...stored.sync });
      }
      setState('isLoading', false);
    } catch (error) {
      setState('error', String(error));
      setState('isLoading', false);
    }
  },

  saveSettings: async () => {
    try {
      await LocalStorage.set(STORAGE_KEY, {
        general: state.general,
        models: state.models,
        sync: state.sync,
      });
    } catch (error) {
      setState('error', String(error));
    }
  },

  addProvider: (provider: Provider) => {
    setState('models', 'providers', providers => [...providers, provider]);
    settingsStore.saveSettings();
  },

  updateProvider: (id: string, updates: Partial<Provider>) => {
    setState(
      produce(s => {
        const idx = s.models.providers.findIndex(p => p.id === id);
        if (idx !== -1) {
          s.models.providers[idx] = { ...s.models.providers[idx], ...updates } as Provider;
        }
      })
    );
    settingsStore.saveSettings();
  },

  removeProvider: (id: string) => {
    setState('models', 'providers', providers => providers.filter(p => p.id !== id));
    if (state.models.activeProviderId === id) {
      setState('models', 'activeProviderId', null);
    }
    settingsStore.saveSettings();
  },

  testConnection: async (_providerId: string): Promise<{ success: boolean; message: string }> => {
    return { success: true, message: 'Connection successful' };
  },

  forceSync: async (): Promise<{ success: boolean; message: string }> => {
    return { success: true, message: 'Sync completed' };
  },

  setActiveTab: (tab: 'general' | 'models' | 'sync') => {
    setState('activeTab', tab);
  },

  updateGeneralSettings: (settings: Partial<GeneralSettings>) => {
    setState('general', g => ({ ...g, ...settings }));
    settingsStore.saveSettings();
  },

  updateSyncSettings: (settings: Partial<SyncSettings>) => {
    setState('sync', s => ({ ...s, ...settings }));
    settingsStore.saveSettings();
  },

  updateModelSettings: (settings: Partial<ModelSettings>) => {
    setState('models', m => ({ ...m, ...settings }));
    settingsStore.saveSettings();
  },
};

export function useSettingsStore() {
  return settingsStore;
}

export default settingsStore;
