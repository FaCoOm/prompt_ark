import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Tabs } from '../ui/Tabs';
import { GeneralTab } from '../settings/GeneralTab';
import { ModelsTab } from '../settings/ModelsTab';
import { SyncTab } from '../settings/SyncTab';

const SETTINGS_TABS = [
  { id: 'general', label: 'General' },
  { id: 'models', label: 'Models' },
  { id: 'sync', label: 'Sync' },
] as const;

export function SettingsPanel(): JSX.Element {
  const uiStore = useUIStore();
  const settingsStore = useSettingsStore();

  const handleClose = () => {
    uiStore.closeSettings();
  };

  const handleTabChange = (tabId: string) => {
    settingsStore.setActiveTab(tabId as 'general' | 'models' | 'sync');
  };

  const renderTabContent = (): JSX.Element => {
    switch (settingsStore.activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'models':
        return <ModelsTab />;
      case 'sync':
        return <SyncTab />;
      default:
        return <GeneralTab />;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Show when={uiStore.isSettingsOpen}>
      <div
        class="modal"
        onClick={e => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        <div class="modal-content settings-panel-content">
          <div class="modal-header">
            <h2 id="settings-title">Settings</h2>
            <button
              type="button"
              class="modal-close"
              onClick={handleClose}
              aria-label="Close settings"
            >
              ×
            </button>
          </div>

          <div class="settings-tabs-container">
            <Tabs
              tabs={SETTINGS_TABS.map(tab => ({ id: tab.id, label: tab.label }))}
              activeTab={settingsStore.activeTab}
              onChange={handleTabChange}
            />
          </div>

          <div class="settings-panel-body">{renderTabContent()}</div>
        </div>
      </div>
    </Show>
  );
}
