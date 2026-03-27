import { batch } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { SyncBackend, SyncState, SyncStatus, SyncConfig } from '../types';
import { SyncManager } from '../services/sync';

export interface SyncStoreState {
  status: SyncStatus;
  config: SyncConfig;
  isLoading: boolean;
  lastError?: string;
}

const defaultConfig: SyncConfig = {
  backend: 'chrome',
};

const [state, setState] = createStore<SyncStoreState>({
  status: {
    state: 'idle',
    backend: 'chrome',
  },
  config: defaultConfig,
  isLoading: false,
});

export const syncStore = {
  get state() {
    return state;
  },

  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.checkStatus();
  },

  async loadConfig(): Promise<void> {
    try {
      const config = await SyncManager.getConfig();
      batch(() => {
        setState('config', config);
        setState('status', 'backend', config.backend);
      });
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  },

  async updateConfig(updates: Partial<SyncConfig>): Promise<void> {
    const newConfig = { ...state.config, ...updates };
    await SyncManager.saveConfig(newConfig);
    batch(() => {
      setState('config', newConfig);
      setState('status', 'backend', newConfig.backend);
    });
  },

  async setBackend(backend: SyncBackend): Promise<void> {
    await this.updateConfig({ backend });
  },

  async checkStatus(): Promise<void> {
    try {
      const status = await SyncManager.getStatus();
      setState('status', status);
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  },

  async syncNow(): Promise<boolean> {
    if (state.isLoading) return false;

    batch(() => {
      setState('isLoading', true);
      setState('status', 'state', 'syncing');
      setState('lastError', undefined);
    });

    try {
      const result = await SyncManager.sync();

      batch(() => {
        setState('status', 'state', result.success ? 'synced' : 'failed');
        setState('status', 'lastSyncTime', result.success ? Date.now() : state.status.lastSyncTime);
        setState('lastError', result.error);
        setState('isLoading', false);
      });

      return result.success;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      batch(() => {
        setState('status', 'state', 'failed');
        setState('lastError', errorMsg);
        setState('isLoading', false);
      });
      return false;
    }
  },

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      return await SyncManager.testConnection();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  setSyncState(newState: SyncState): void {
    setState('status', 'state', newState);
  },

  clearError(): void {
    setState('lastError', undefined);
  },
};
