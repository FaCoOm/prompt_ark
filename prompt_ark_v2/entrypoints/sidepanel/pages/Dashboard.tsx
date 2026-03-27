import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { promptStore } from '../../../src/stores/promptStore';
import { historyStore } from '../../../src/stores/historyStore';
import { Button, Card, Badge } from '../../../src/components/ui';
import type { Prompt } from '../../../src/types';

export interface DashboardProps {
  onViewAllPrompts: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onNewPrompt: () => void;
}

const Dashboard: Component<DashboardProps> = (props) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    await Promise.all([
      promptStore.loadPrompts(),
      historyStore.loadHistory(true),
    ]);
    setIsLoading(false);
  });

  const recentPrompts = () => {
    return promptStore.state.filteredPrompts
      .slice()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 6);
  };

  const favoritePrompts = () => {
    return promptStore.state.filteredPrompts
      .filter((p) => p.isFavorite)
      .slice(0, 4);
  };

  const stats = () => ({
    total: promptStore.state.prompts.length,
    favorites: promptStore.state.prompts.filter((p) => p.isFavorite).length,
    recent: historyStore.state.history.length,
    categories: new Set(promptStore.state.prompts.map((p) => p.category).filter(Boolean)).size,
  });

  const handleInsert = async (prompt: Prompt) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.runtime.sendMessage({
        type: 'INSERT_PROMPT',
        payload: { promptId: prompt.id, targetTabId: tab.id },
      });
    }
  };

  return (
    <div class="space-y-6 max-w-6xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Prompts"
          value={stats().total}
          icon="📚"
          color="blue"
        />
        <StatCard
          label="Favorites"
          value={stats().favorites}
          icon="⭐"
          color="yellow"
        />
        <StatCard
          label="Recent Usage"
          value={stats().recent}
          icon="🕐"
          color="green"
        />
        <StatCard
          label="Categories"
          value={stats().categories}
          icon="🏷️"
          color="purple"
        />
      </div>

      <Show when={!isLoading()} fallback={<div class="text-center py-12">Loading...</div>}>
        <Show when={favoritePrompts().length > 0}>
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                ⭐ {t('filter.favorites')}
              </h2>
              <Button variant="ghost" size="sm" onClick={props.onViewAllPrompts}>
                View All →
              </Button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <For each={favoritePrompts()}>
                {(prompt) => (
                  <PromptCard
                    prompt={prompt}
                    onEdit={() => props.onEditPrompt(prompt)}
                    onInsert={() => handleInsert(prompt)}
                  />
                )}
              </For>
            </div>
          </section>
        </Show>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
              🕐 Recent Prompts
            </h2>
            <Button variant="ghost" size="sm" onClick={props.onViewAllPrompts}>
              View All →
            </Button>
          </div>
          <Show
            when={recentPrompts().length > 0}
            fallback={
              <Card class="p-8 text-center">
                <p class="text-surface-500 dark:text-surface-400 mb-4">
                  {t('prompt.noPrompts')}
                </p>
                <Button onClick={props.onNewPrompt}>{t('prompt.new')}</Button>
              </Card>
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <For each={recentPrompts()}>
                {(prompt) => (
                  <PromptCard
                    prompt={prompt}
                    onEdit={() => props.onEditPrompt(prompt)}
                    onInsert={() => handleInsert(prompt)}
                  />
                )}
              </For>
            </div>
          </Show>
        </section>
      </Show>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

const StatCard: Component<StatCardProps> = (props) => {
  const iconClass = () =>
    'w-10 h-10 rounded-lg flex items-center justify-center text-lg ' + colorClasses[props.color];

  return (
    <Card class="p-4">
      <div class="flex items-center gap-3">
        <div class={iconClass()}>
          {props.icon}
        </div>
        <div>
          <p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {props.value}
          </p>
          <p class="text-sm text-surface-500 dark:text-surface-400">{props.label}</p>
        </div>
      </div>
    </Card>
  );
};

interface PromptCardProps {
  prompt: Prompt;
  onEdit: () => void;
  onInsert: () => void;
}

const PromptCard: Component<PromptCardProps> = (props) => {
  const { t } = useI18n();

  return (
    <Card
      hover
      class="cursor-pointer group"
      header={
        <div class="flex items-center justify-between">
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
          <div class="flex items-center gap-2">
            <Show when={props.prompt.category}>
              <Badge variant="default" size="sm">{props.prompt.category}</Badge>
            </Show>
          </div>
          <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); props.onEdit(); }}
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              {t('action.edit')}
            </button>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); props.onInsert(); }}>
              {t('action.insert')}
            </Button>
          </div>
        </div>
      }
    >
      <p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
        {props.prompt.content || 'No content'}
      </p>
    </Card>
  );
};

export default Dashboard;
