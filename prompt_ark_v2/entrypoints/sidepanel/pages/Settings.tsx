import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { settingsStore } from '../../../src/stores/settingsStore';
import { Button, Input, Select, Card } from '../../../src/components/ui';
import type { Settings, GistSyncConfig, WebDAVSyncConfig } from '../../../src/types';

const Settings: Component = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSaving, setIsSaving] = createSignal(false);
  const [settings, setSettings] = createSignal<Settings | null>(null);

  onMount(async () => {
    await settingsStore.loadSettings();
    setSettings({ ...settingsStore.state.settings });
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

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => prev ? { ...prev, ...updates } : null);
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
            </div>
          </Card>

          <Card
            header={
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {t('sync.title')}
              </h2>
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
    </div>
  );
};

export default Settings;
