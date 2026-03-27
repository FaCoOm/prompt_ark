import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { settingsStore } from '../../../src/stores/settingsStore';
import { providerStore, providerTypes, defaultModels } from '../../../src/stores/providerStore';
import { Button, Input, Select, Card, Modal, Badge } from '../../../src/components/ui';
import type { Settings, GistSyncConfig, WebDAVSyncConfig, AIProvider, AIProviderType } from '../../../src/types';

const platformOptions = [
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'doubao', label: '豆包' },
  { value: 'qwen', label: '通义千问' },
  { value: 'chatglm', label: 'ChatGLM' },
];

const Settings: Component = () => {
  const { t, setLocale } = useI18n();
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSaving, setIsSaving] = createSignal(false);
  const [settings, setSettings] = createSignal<Settings | null>(null);
  const [syncStatus, setSyncStatus] = createSignal<string>('');
  
  // Provider management
  const [showProviderModal, setShowProviderModal] = createSignal(false);
  const [editingProvider, setEditingProvider] = createSignal<AIProvider | null>(null);
  const [newProvider, setNewProvider] = createSignal<Partial<AIProvider>>({
    name: '',
    type: 'gemini' as AIProviderType,
    model: defaultModels['gemini'],
    enabled: true,
    capabilities: { chat: true, vision: true, json: true },
  });

  onMount(async () => {
    await Promise.all([
      settingsStore.loadSettings(),
      providerStore.loadProviders(),
    ]);
    const loadedSettings = settingsStore.state.settings;
    setSettings({ ...loadedSettings });
    setLocale(loadedSettings.language as 'en' | 'zh-CN');
    setIsLoading(false);
  });

  const handleSave = async () => {
    if (!settings()) return;
    setIsSaving(true);
    try {
      await settingsStore.updateSettings(settings()!);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings()!, ...updates };
    setSettings(newSettings);
    await settingsStore.updateSettings(updates);
    
    // Sync i18n locale when language changes
    if (updates.language) {
      setLocale(updates.language as 'en' | 'zh-CN');
    }
  };

  const updateGistSync = (updates: Partial<GistSyncConfig>) => {
    const current = settings()!.gistSync || { enabled: false };
    updateSettings({
      gistSync: { ...current, ...updates, enabled: current.enabled }
    });
  };

  const updateWebdavSync = (updates: Partial<WebDAVSyncConfig>) => {
    const current = settings()!.webdavSync || { enabled: false };
    updateSettings({
      webdavSync: { ...current, ...updates, enabled: current.enabled }
    });
  };

  const handleSyncNow = async () => {
    setSyncStatus('Syncing...');
    try {
      // Trigger sync via background script
      const result = await browser.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
      setSyncStatus(result?.success ? 'Synced ✓' : 'Sync failed');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch {
      setSyncStatus('Sync failed');
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  // Provider management handlers
  const handleAddProvider = () => {
    setEditingProvider(null);
    setNewProvider({
      name: '',
      type: 'gemini',
      model: defaultModels['gemini'],
      enabled: true,
      capabilities: { chat: true, vision: true, json: true },
    });
    setShowProviderModal(true);
  };

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider);
    setNewProvider({ ...provider });
    setShowProviderModal(true);
  };

  const handleDeleteProvider = async (id: string) => {
    if (confirm('Are you sure you want to delete this provider?')) {
      await providerStore.deleteProvider(id);
    }
  };

  const handleSaveProvider = async () => {
    const provider = newProvider();
    if (!provider.name) return;

    if (editingProvider()) {
      await providerStore.updateProvider(editingProvider()!.id, provider);
    } else {
      await providerStore.addProvider(provider as Omit<AIProvider, 'id'>);
    }
    setShowProviderModal(false);
  };

  const handleSetActiveProvider = async (id: string) => {
    await providerStore.setActiveProvider(id);
    await updateSettings({ defaultProviderId: id });
  };

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
  ];

  const themeOptions = [
    { value: 'auto', label: t('settings.themeAuto') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const syncEngineOptions = [
    { value: 'none', label: t('sync.noSync') },
    { value: 'chrome', label: t('sync.chromeSync') },
    { value: 'gist', label: t('sync.gistSync') },
    { value: 'webdav', label: t('sync.webdavSync') },
  ];

  const viewModeOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'list', label: 'List' },
  ];

  const sortByOptions = [
    { value: 'updated', label: 'Last Updated' },
    { value: 'created', label: 'Created Date' },
    { value: 'title', label: 'Title' },
    { value: 'used', label: 'Usage Count' },
  ];

  const sortOrderOptions = [
    { value: 'desc', label: 'Descending' },
    { value: 'asc', label: 'Ascending' },
  ];

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {t('settings.title')}
        </h1>
        <Button onClick={handleSave} loading={isSaving()}>
          {t('settings.save')}
        </Button>
      </div>

      <Show when={!isLoading() && settings()} fallback={<div>Loading...</div>}>
        <div class="space-y-6">
          {/* General Settings */}
          <Card
            header={
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {t('tabs.general')}
              </h2>
            }
          >
            <div class="space-y-4">
              <Select
                label={t('settings.language')}
                options={languageOptions}
                value={settings()!.language}
                onChange={(e) => updateSettings({ language: e.currentTarget.value })}
                fullWidth
              />

              <Select
                label={t('settings.theme')}
                options={themeOptions}
                value={settings()!.theme}
                onChange={(e) => updateSettings({ theme: e.currentTarget.value as Settings['theme'] })}
                fullWidth
              />

              <Select
                label="Default AI Platform"
                options={platformOptions}
                value={settings()!.defaultPlatform || 'chatgpt'}
                onChange={(e) => updateSettings({ defaultPlatform: e.currentTarget.value })}
                fullWidth
              />

              <div class="flex items-center justify-between py-2">
                <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Image Prompt Generation
                </label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    class="sr-only peer"
                    checked={settings()!.imagePromptEnabled}
                    onChange={(e) => updateSettings({ imagePromptEnabled: e.currentTarget.checked })}
                  />
                  <div class="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* AI Providers */}
          <Card
            header={
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  AI Providers
                </h2>
                <Button onClick={handleAddProvider} size="sm">
                  + Add Provider
                </Button>
              </div>
            }
          >
            <div class="space-y-3">
              <For each={providerStore.state.providers}>
                {(provider) => (
                  <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                    <div class="flex items-center gap-3">
                      <input
                        type="radio"
                        name="activeProvider"
                        checked={provider.id === providerStore.state.activeProviderId}
                        onChange={() => handleSetActiveProvider(provider.id)}
                        class="w-4 h-4 text-primary-500"
                      />
                      <div>
                        <div class="font-medium text-surface-900 dark:text-surface-100">
                          {provider.name}
                          {provider.id === providerStore.state.activeProviderId && (
                            <Badge variant="primary" size="sm" class="ml-2">Active</Badge>
                          )}
                        </div>
                        <div class="text-sm text-surface-500 dark:text-surface-400">
                          {provider.type} • {provider.model}
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditProvider(provider)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteProvider(provider.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card>

          {/* Sync Settings */}
          <Card
            header={
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {t('sync.title')}
                </h2>
                <div class="flex items-center gap-2">
                  {syncStatus() && (
                    <span class="text-sm text-surface-500">{syncStatus()}</span>
                  )}
                  <Button onClick={handleSyncNow} size="sm" variant="secondary">
                    Sync Now
                  </Button>
                </div>
              </div>
            }
          >
            <div class="space-y-4">
              <Select
                label={t('sync.engine')}
                options={syncEngineOptions}
                value={settings()!.syncEngine}
                onChange={(e) => updateSettings({ syncEngine: e.currentTarget.value as Settings['syncEngine'] })}
                fullWidth
              />

              <Show when={settings()!.syncEngine === 'gist'}>
                <Input
                  label={t('sync.githubToken')}
                  type="password"
                  placeholder={t('sync.githubTokenPlaceholder')}
                  value={settings()!.gistSync?.token || ''}
                  onInput={(e) => updateGistSync({ token: e.currentTarget.value })}
                  fullWidth
                />
                <Input
                  label={t('sync.gistId')}
                  placeholder={t('sync.gistIdPlaceholder')}
                  value={settings()!.gistSync?.gistId || ''}
                  onInput={(e) => updateGistSync({ gistId: e.currentTarget.value })}
                  fullWidth
                />
              </Show>

              <Show when={settings()!.syncEngine === 'webdav'}>
                <Input
                  label={t('sync.webdavUrl')}
                  placeholder="https://..."
                  value={settings()!.webdavSync?.url || ''}
                  onInput={(e) => updateWebdavSync({ url: e.currentTarget.value })}
                  fullWidth
                />
                <div class="grid grid-cols-2 gap-4">
                  <Input
                    label={t('sync.webdavUser')}
                    value={settings()!.webdavSync?.username || ''}
                    onInput={(e) => updateWebdavSync({ username: e.currentTarget.value })}
                  />
                  <Input
                    label={t('sync.webdavPassword')}
                    type="password"
                    value={settings()!.webdavSync?.password || ''}
                    onInput={(e) => updateWebdavSync({ password: e.currentTarget.value })}
                  />
                </div>
              </Show>
            </div>
          </Card>

          {/* Display Preferences */}
          <Card
            header={
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                Display Preferences
              </h2>
            }
          >
            <div class="space-y-4">
              <Select
                label="Default View Mode"
                options={viewModeOptions}
                value={settings()!.preferences.listView}
                onChange={(e) => updateSettings({
                  preferences: { ...settings()!.preferences, listView: e.currentTarget.value as 'grid' | 'list' }
                })}
                fullWidth
              />

              <Select
                label="Sort By"
                options={sortByOptions}
                value={settings()!.preferences.sortBy}
                onChange={(e) => updateSettings({
                  preferences: { ...settings()!.preferences, sortBy: e.currentTarget.value as any }
                })}
                fullWidth
              />

              <Select
                label="Sort Order"
                options={sortOrderOptions}
                value={settings()!.preferences.sortOrder}
                onChange={(e) => updateSettings({
                  preferences: { ...settings()!.preferences, sortOrder: e.currentTarget.value as 'asc' | 'desc' }
                })}
                fullWidth
              />

              <Input
                label="Items Per Page"
                type="number"
                min={5}
                max={100}
                value={settings()!.preferences.pageSize}
                onInput={(e) => updateSettings({
                  preferences: { ...settings()!.preferences, pageSize: parseInt(e.currentTarget.value) || 20 }
                })}
                fullWidth
              />
            </div>
          </Card>
        </div>
      </Show>

      {/* Provider Modal */}
      <Modal
        isOpen={showProviderModal()}
        onClose={() => setShowProviderModal(false)}
        title={editingProvider() ? 'Edit Provider' : 'Add Provider'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowProviderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProvider}>
              Save
            </Button>
          </>
        }
      >
        <div class="space-y-4">
          <Input
            label="Provider Name"
            value={newProvider()?.name || ''}
            onInput={(e) => setNewProvider({ ...newProvider(), name: e.currentTarget.value })}
            placeholder="My AI Provider"
            fullWidth
          />

          <Select
            label="Provider Type"
            options={providerTypes}
            value={newProvider()?.type || 'gemini'}
            onChange={(e) => {
              const type = e.currentTarget.value as AIProviderType;
              setNewProvider({
                ...newProvider(),
                type,
                model: defaultModels[type],
              });
            }}
            fullWidth
          />

          <Show when={newProvider()?.type !== 'gemini-web'}>
            <Input
              label="API URL"
              value={newProvider()?.baseUrl || ''}
              onInput={(e) => setNewProvider({ ...newProvider(), baseUrl: e.currentTarget.value })}
              placeholder="https://api.openai.com/v1"
              fullWidth
            />

            <Input
              label="API Key"
              type="password"
              value={newProvider()?.apiKey || ''}
              onInput={(e) => setNewProvider({ ...newProvider(), apiKey: e.currentTarget.value })}
              placeholder="sk-..."
              fullWidth
            />
          </Show>

          <Input
            label="Model"
            value={newProvider()?.model || ''}
            onInput={(e) => setNewProvider({ ...newProvider(), model: e.currentTarget.value })}
            placeholder="gpt-4o-mini"
            fullWidth
          />

          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="providerEnabled"
              checked={newProvider()?.enabled}
              onChange={(e) => setNewProvider({ ...newProvider(), enabled: e.currentTarget.checked })}
            />
            <label for="providerEnabled">Enabled</label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;