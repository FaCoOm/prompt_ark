import { useSettingsStore } from '@/stores/settingsStore';
import type { GeneralSettings, ModelSettings, SyncSettings } from '@/stores/settingsStore';
import type { Provider } from '@/shared/types/provider';

/**
 * Hook for settings management
 * Wraps settingsStore with convenient access patterns
 */
export function useSettings() {
  const store = useSettingsStore();

  return {
    // State
    general: () => store.general,
    models: () => store.models,
    sync: () => store.sync,
    activeTab: () => store.activeTab,
    isLoading: () => store.isLoading,
    error: () => store.error,

    // Actions
    loadSettings: () => store.loadSettings(),
    saveSettings: () => store.saveSettings(),
    addProvider: (provider: Provider) => store.addProvider(provider),
    updateProvider: (id: string, updates: Partial<Provider>) => store.updateProvider(id, updates),
    removeProvider: (id: string) => store.removeProvider(id),
    testConnection: (providerId: string) => store.testConnection(providerId),
    forceSync: () => store.forceSync(),
    setActiveTab: (tab: 'general' | 'models' | 'sync') => store.setActiveTab(tab),
    updateGeneralSettings: (settings: Partial<GeneralSettings>) => store.updateGeneralSettings(settings),
    updateSyncSettings: (settings: Partial<SyncSettings>) => store.updateSyncSettings(settings),
    updateModelSettings: (settings: Partial<ModelSettings>) => store.updateModelSettings(settings),
  };
}
