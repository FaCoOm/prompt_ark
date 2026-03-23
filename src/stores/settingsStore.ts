import { create } from 'solid-zustand';
import { LocalStorage } from '@shared/api/storage';
import type { Provider } from '@shared/types/provider';

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

export interface SettingsState {
  general: GeneralSettings;
  models: ModelSettings;
  sync: SyncSettings;
  activeTab: 'general' | 'models' | 'sync';
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  addProvider: (provider: Provider) => void;
  updateProvider: (id: string, updates: Partial<Provider>) => void;
  removeProvider: (id: string) => void;
  testConnection: (_providerId: string) => Promise<{ success: boolean; message: string }>;
  forceSync: () => Promise<{ success: boolean; message: string }>;
  setActiveTab: (tab: 'general' | 'models' | 'sync') => void;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateSyncSettings: (settings: Partial<SyncSettings>) => void;
  updateModelSettings: (settings: Partial<ModelSettings>) => void;
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

const DEFAULT_STATE = {
  general: DEFAULT_GENERAL_SETTINGS,
  models: DEFAULT_MODEL_SETTINGS,
  sync: DEFAULT_SYNC_SETTINGS,
  activeTab: 'general' as const,
  isLoading: false,
  error: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_STATE,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const stored = await LocalStorage.get<{
        general?: Partial<GeneralSettings>;
        models?: Partial<ModelSettings>;
        sync?: Partial<SyncSettings>;
      }>(STORAGE_KEY);

      if (stored) {
        set({
          general: { ...DEFAULT_GENERAL_SETTINGS, ...stored.general },
          models: { ...DEFAULT_MODEL_SETTINGS, ...stored.models },
          sync: { ...DEFAULT_SYNC_SETTINGS, ...stored.sync },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  saveSettings: async () => {
    const { general, models, sync } = get();
    try {
      await LocalStorage.set(STORAGE_KEY, { general, models, sync });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  addProvider: (provider: Provider) => {
    set(state => ({
      models: {
        ...state.models,
        providers: [...state.models.providers, provider],
      },
    }));
    void get().saveSettings();
  },

  updateProvider: (id: string, updates: Partial<Provider>) => {
    set(state => ({
      models: {
        ...state.models,
        providers: state.models.providers.map(p =>
          p.id === id ? ({ ...p, ...updates } as Provider) : p
        ),
      },
    }));
    void get().saveSettings();
  },

  removeProvider: (id: string) => {
    set(state => {
      const filteredProviders: Provider[] = state.models.providers.filter(p => p.id !== id);
      const newActiveId =
        state.models.activeProviderId === id
          ? (filteredProviders[0]?.id ?? null)
          : state.models.activeProviderId;
      return {
        models: {
          ...state.models,
          providers: filteredProviders,
          activeProviderId: newActiveId,
        },
      };
    });
    void get().saveSettings();
  },

  testConnection: async (_providerId: string) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Connection test passed (mock)',
        });
      }, 500);
    });
  },

  forceSync: async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        set(state => ({
          sync: {
            ...state.sync,
            lastSyncTime: Date.now(),
          },
        }));
        void get().saveSettings();
        resolve({
          success: true,
          message: 'Sync completed (mock)',
        });
      }, 500);
    });
  },

  setActiveTab: (tab: 'general' | 'models' | 'sync') => {
    set({ activeTab: tab });
  },

  updateGeneralSettings: (settings: Partial<GeneralSettings>) => {
    set(state => ({
      general: { ...state.general, ...settings },
    }));
    void get().saveSettings();
  },

  updateSyncSettings: (settings: Partial<SyncSettings>) => {
    set(state => ({
      sync: { ...state.sync, ...settings },
    }));
    void get().saveSettings();
  },

  updateModelSettings: (settings: Partial<ModelSettings>) => {
    set(state => ({
      models: { ...state.models, ...settings },
    }));
    void get().saveSettings();
  },
}));
