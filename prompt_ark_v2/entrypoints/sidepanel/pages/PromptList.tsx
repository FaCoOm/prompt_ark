import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { promptStore } from '../../../src/stores/promptStore';
import { Button, Input, Card, Badge, Select } from '../../../src/components/ui';
import type { Prompt } from '../../../src/types';

export interface PromptListProps {
  onEditPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
}

const PromptList: Component<PromptListProps> = (props) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = createSignal(true);
  const [viewMode, setViewMode] = createSignal<'grid' | 'list'>('grid');

  onMount(async () => {
    await promptStore.loadPrompts();
    setIsLoading(false);
  });

  const categories = () => {
    const cats = new Set(promptStore.state.prompts.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  };

  const handleSearch = (value: string) => {
    promptStore.setSearchQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    promptStore.setFilter({ category: value === 'all' ? undefined : value });
  };

  const handleInsert = async (prompt: Prompt) => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        console.error('[PromptArk] No active tab found');
        return;
      }

      const response = await browser.runtime.sendMessage({
        type: 'INSERT_PROMPT',
        payload: { promptId: prompt.id, targetTabId: tab.id },
      });

      if (!response?.success) {
        console.error('[PromptArk] Insert failed:', response?.error);
        alert(t('action.insertError'));
      }
    } catch (error) {
      console.error('[PromptArk] Insert error:', error);
      alert(t('action.insertError'));
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    if (confirm(t('prompt.deleteConfirm'))) {
      await promptStore.deletePrompt(prompt.id);
    }
  };

  const categoryOptions = () =>
    categories().map((cat) => ({
      value: cat || 'all',
      label: cat === 'all' ? t('filter.categoryAll') : (cat || ''),
    }));

  const currentCategory = () => promptStore.state.filter.category || 'all';

  return (
    <div class="space-y-4 max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div class="flex-1 w-full sm:w-auto flex gap-2">
          <Input
            type="text"
            placeholder={t('prompt.searchPlaceholder')}
            value={promptStore.state.searchQuery}
            onInput={(e) => handleSearch(e.currentTarget.value)}
            fullWidth
            class="max-w-md"
          />
          <Select
            options={categoryOptions()}
            value={currentCategory()}
            onChange={(e) => handleCategoryChange(e.currentTarget.value)}
            class="w-40"
          />
        </div>

        <div class="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            class={viewMode() === 'grid' ? 'text-primary-600' : 'text-surface-400'}
            title="Grid view"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            class={viewMode() === 'list' ? 'text-primary-600' : 'text-surface-400'}
            title="List view"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Button onClick={props.onNewPrompt}>{t('prompt.new')}</Button>
        </div>
      </div>

      <Show when={!isLoading()} fallback={<div class="text-center py-12">Loading...</div>}>
        <Show
          when={promptStore.state.filteredPrompts.length > 0}
          fallback={
            <Card class="p-12 text-center">
              <div class="text-6xl mb-4">📝</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                {t('prompt.noPrompts')}
              </h3>
              <p class="text-surface-500 dark:text-surface-400 mb-6">
                {t('prompt.createFirst')}
              </p>
              <Button onClick={props.onNewPrompt}>{t('prompt.new')}</Button>
            </Card>
          }
        >
          <div
            class={viewMode() === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
            }
          >
            <For each={promptStore.state.filteredPrompts}>
              {(prompt) => (
                <PromptCard
                  prompt={prompt}
                  viewMode={viewMode()}
                  onEdit={() => props.onEditPrompt(prompt)}
                  onInsert={() => handleInsert(prompt)}
                  onDelete={() => handleDelete(prompt)}
                />
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

interface PromptCardProps {
  prompt: Prompt;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
  onInsert: () => void;
  onDelete: () => void;
}

const PromptCard: Component<PromptCardProps> = (props) => {
  const { t } = useI18n();

  if (props.viewMode === 'list') {
    return (
      <Card
        hover
        class="cursor-pointer group"
        onClick={props.onEdit}
      >
        <div class="flex items-center gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-surface-900 dark:text-surface-100 truncate">
                {props.prompt.title || 'Untitled'}
              </h3>
              <Show when={props.prompt.isFavorite}>
                <span class="text-yellow-500">⭐</span>
              </Show>
            </div>
            <p class="text-sm text-surface-500 dark:text-surface-400 truncate">
              {props.prompt.content || 'No content'}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Show when={props.prompt.category}>
              <Badge variant="default" size="sm">{props.prompt.category}</Badge>
            </Show>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); props.onInsert(); }}
                class="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
                title={t('action.insert')}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); props.onEdit(); }}
                class="p-2 text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                title={t('action.edit')}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); props.onDelete(); }}
                class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title={t('action.delete')}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      hover
      class="cursor-pointer group"
      onClick={props.onEdit}
      header={
        <div class="flex items-start justify-between">
          <h3 class="font-semibold text-surface-900 dark:text-surface-100 truncate pr-2">
            {props.prompt.title || 'Untitled'}
          </h3>
          <Show when={props.prompt.isFavorite}>
            <span class="text-yellow-500">⭐</span>
          </Show>
        </div>
      }
      footer={
        <div class="flex items-center justify-between">
          <div class="flex flex-wrap gap-1">
            <Show when={props.prompt.category}>
              <Badge variant="default" size="sm">{props.prompt.category}</Badge>
            </Show>
            <For each={props.prompt.tags.slice(0, 2)}>
              {(tag) => <Badge variant="primary" size="sm">{tag}</Badge>}
            </For>
            <Show when={props.prompt.tags.length > 2}>
              <Badge variant="default" size="sm">+{props.prompt.tags.length - 2}</Badge>
            </Show>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); props.onInsert(); }}
              class="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
              title={t('action.insert')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); props.onEdit(); }}
              class="p-1.5 text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"
              title={t('action.edit')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); props.onDelete(); }}
              class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title={t('action.delete')}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      }
    >
      <p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-3">
        {props.prompt.content || 'No content'}
      </p>
    </Card>
  );
};

export default PromptList;
