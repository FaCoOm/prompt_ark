import type { JSX } from 'solid-js';
import { createMemo, createSignal } from 'solid-js';
import { useSettingsStore, type SyncSettings } from '@/stores/settingsStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

type SyncEngine = SyncSettings['engine'];

const ENGINE_OPTIONS: { value: SyncEngine; label: string }[] = [
  { value: 'local', label: 'Local Storage' },
  { value: 'chrome', label: 'Chrome Sync' },
  { value: 'gist', label: 'GitHub Gist' },
  { value: 'webdav', label: 'WebDAV' },
  { value: 'obsidian', label: 'Obsidian' },
];

export function SyncTab(): JSX.Element {
  const store = useSettingsStore();
  const [isSyncing, setIsSyncing] = createSignal(false);

  const currentEngine = createMemo(() => store.sync.engine);
  const syncSettings = createMemo(() => store.sync.settings);
  const lastSyncTime = createMemo(() => store.sync.lastSyncTime);

  const handleEngineChange = (e: Event & { currentTarget: HTMLSelectElement }) => {
    const newEngine = e.currentTarget.value as SyncEngine;
    store.updateSyncSettings({ engine: newEngine });
  };

  const handleSettingChange = (key: string, value: string) => {
    store.updateSyncSettings({
      settings: { ...syncSettings(), [key]: value },
    });
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await store.forceSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never synced';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const renderEngineConfig = (): JSX.Element => {
    const engine = currentEngine();
    const settings = syncSettings();

    switch (engine) {
      case 'gist':
        return (
          <>
            <div class="form-group">
              <label for="gist-token">Gist Token</label>
              <Input
                id="gist-token"
                type="password"
                value={settings.gistToken || ''}
                onChange={value => handleSettingChange('gistToken', value)}
                placeholder="Enter your GitHub personal access token"
              />
            </div>
            <div class="form-group">
              <label for="gist-id">Gist ID</label>
              <Input
                id="gist-id"
                value={settings.gistId || ''}
                onChange={value => handleSettingChange('gistId', value)}
                placeholder="Enter your Gist ID (optional, will create new if empty)"
              />
            </div>
          </>
        );

      case 'webdav':
        return (
          <>
            <div class="form-group">
              <label for="webdav-url">WebDAV URL</label>
              <Input
                id="webdav-url"
                value={settings.webdavUrl || ''}
                onChange={value => handleSettingChange('webdavUrl', value)}
                placeholder="https://example.com/webdav/"
              />
            </div>
            <div class="form-group">
              <label for="webdav-username">Username</label>
              <Input
                id="webdav-username"
                value={settings.webdavUsername || ''}
                onChange={value => handleSettingChange('webdavUsername', value)}
                placeholder="Enter your WebDAV username"
              />
            </div>
            <div class="form-group">
              <label for="webdav-password">Password</label>
              <Input
                id="webdav-password"
                type="password"
                value={settings.webdavPassword || ''}
                onChange={value => handleSettingChange('webdavPassword', value)}
                placeholder="Enter your WebDAV password"
              />
            </div>
          </>
        );

      case 'obsidian':
        return (
          <div class="form-group">
            <label for="obsidian-vault">Vault Path</label>
            <Input
              id="obsidian-vault"
              value={settings.obsidianVault || ''}
              onChange={value => handleSettingChange('obsidianVault', value)}
              placeholder="Enter your Obsidian vault path"
            />
          </div>
        );

      case 'chrome':
      case 'local':
      default:
        return (
          <div class="form-group">
            <p class="text-secondary text-sm">
              No additional configuration required for{' '}
              {ENGINE_OPTIONS.find(o => o.value === engine)?.label}.
            </p>
          </div>
        );
    }
  };

  return (
    <div class="sync-tab">
      <div class="form-group">
        <label for="sync-engine">Sync Engine</label>
        <select
          id="sync-engine"
          class="settings-input"
          value={currentEngine()}
          onChange={handleEngineChange}
        >
          {ENGINE_OPTIONS.map(option => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {renderEngineConfig()}

      <div class="form-group">
        <label>Last Sync</label>
        <div class="sync-info">
          <span class="sync-time">{formatLastSyncTime(lastSyncTime())}</span>
        </div>
      </div>

      <div class="form-group">
        <Button variant="primary" onClick={handleForceSync} disabled={isSyncing()}>
          {isSyncing() ? 'Syncing...' : 'Force Sync'}
        </Button>
      </div>
    </div>
  );
}
