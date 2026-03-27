import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { promptStore } from '../../../src/stores/promptStore';
import { Button, Card } from '../../../src/components/ui';

const ImportExport: Component = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = createSignal<'import' | 'export'>('import');
  const [importText, setImportText] = createSignal('');
  const [isImporting, setIsImporting] = createSignal(false);
  const [isExporting, setIsExporting] = createSignal(false);
  const [importResult, setImportResult] = createSignal<{ success: boolean; message: string } | null>(null);
  const [exportData, setExportData] = createSignal('');

  const importTabClass = () => {
    const base = 'px-4 py-2 font-medium text-sm border-b-2 transition-colors';
    return activeTab() === 'import'
      ? base + ' border-primary-500 text-primary-600'
      : base + ' border-transparent text-surface-600 hover:text-surface-900';
  };

  const exportTabClass = () => {
    const base = 'px-4 py-2 font-medium text-sm border-b-2 transition-colors';
    return activeTab() === 'export'
      ? base + ' border-primary-500 text-primary-600'
      : base + ' border-transparent text-surface-600 hover:text-surface-900';
  };

  const resultClass = () => {
    const base = 'p-3 rounded-lg';
    return importResult()?.success
      ? base + ' bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
      : base + ' bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
  };

  const handleImport = async () => {
    if (!importText().trim()) {
      setImportResult({ success: false, message: t('import.emptyData') });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const data = JSON.parse(importText());
      let prompts: any[] = [];

      if (Array.isArray(data)) {
        prompts = data;
      } else if (data.prompts && Array.isArray(data.prompts)) {
        prompts = data.prompts;
      } else {
        setImportResult({ success: false, message: t('import.parseFailed') });
        return;
      }

      let imported = 0;
      for (const prompt of prompts) {
        if (prompt.content) {
          await promptStore.savePrompt({
            title: prompt.title || '',
            content: prompt.content,
            category: prompt.category || '',
            tags: prompt.tags || [],
            shortcut: prompt.shortcut || '',
            isFavorite: prompt.isFavorite || false,
            versions: prompt.versions || [],
            useCount: prompt.useCount || 0,
          });
          imported++;
        }
      }

      setImportResult({
        success: true,
        message: t('action.importSuccess', { count: imported }),
      });
      setImportText('');
    } catch (error) {
      setImportResult({ success: false, message: t('import.importError') });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await promptStore.loadPrompts();
      const data = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        prompts: promptStore.state.prompts,
      };
      setExportData(JSON.stringify(data, null, 2));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportData());
  };

  const handleDownload = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-ark-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
        {t('import.title')} / {t('action.export')}
      </h1>

      <div class="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        <button
          onClick={() => setActiveTab('import')}
          class={importTabClass()}
        >
          {t('action.import')}
        </button>
        <button
          onClick={() => setActiveTab('export')}
          class={exportTabClass()}
        >
          {t('action.export')}
        </button>
      </div>

      <Show when={activeTab() === 'import'}>
        <Card
          header={
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
              {t('action.import')}
            </h2>
          }
        >
          <div class="space-y-4">
            <p class="text-sm text-surface-600 dark:text-surface-400">
              {t('import.pasteHint')}
            </p>

            <textarea
              value={importText()}
              onInput={(e) => setImportText(e.currentTarget.value)}
              placeholder={t('import.pastePlaceholder')}
              rows={10}
              class="w-full px-3 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-900 dark:text-surface-100 font-mono text-sm resize-y"
            />

            <Show when={importResult()}>
              <div class={resultClass()}>
                {importResult()?.message}
              </div>
            </Show>

            <div class="flex justify-end">
              <Button onClick={handleImport} loading={isImporting()}>
                {t('action.import')}
              </Button>
            </div>
          </div>
        </Card>
      </Show>

      <Show when={activeTab() === 'export'}>
        <Card
          header={
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                {t('action.export')}
              </h2>
              <Show when={exportData()}>
                <div class="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleCopyExport}>
                    {t('action.copy')}
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    Download
                  </Button>
                </div>
              </Show>
            </div>
          }
        >
          <div class="space-y-4">
            <Show
              when={exportData()}
              fallback={
                <div class="text-center py-8">
                  <Button onClick={handleExport} loading={isExporting()}>
                    Generate Export
                  </Button>
                </div>
              }
            >
              <textarea
                value={exportData()}
                readOnly
                rows={15}
                class="w-full px-3 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 font-mono text-sm resize-y"
              />
            </Show>
          </div>
        </Card>
      </Show>

      <Card
        header={
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Data Info
          </h2>
        }
      >
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {promptStore.state.prompts.length}
            </p>
            <p class="text-sm text-surface-500">Total Prompts</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {new Set(promptStore.state.prompts.map((p) => p.category).filter(Boolean)).size}
            </p>
            <p class="text-sm text-surface-500">Categories</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
              {promptStore.state.prompts.filter((p) => p.isFavorite).length}
            </p>
            <p class="text-sm text-surface-500">Favorites</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportExport;
