import type { Component } from 'solid-js';
import { createSignal, onMount, Show, For } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { historyStore } from '../../../src/stores/historyStore';
import { promptStore } from '../../../src/stores/promptStore';
import { Button, Card, Badge } from '../../../src/components/ui';
import type { PromptHistory } from '../../../src/types';

const History: Component = () => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    await Promise.all([
      historyStore.loadHistory(true),
      promptStore.loadPrompts(),
    ]);
    setIsLoading(false);
  });

  const getPromptTitle = (promptId: string) => {
    const prompt = promptStore.state.prompts.find((p) => p.id === promptId);
    return prompt?.title || 'Unknown Prompt';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('timeAgo.justNow');
    if (diffMins < 60) return t('timeAgo.minutes', { count: diffMins });
    if (diffHours < 24) return t('timeAgo.hours', { count: diffHours });
    return t('timeAgo.days', { count: diffDays });
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      historyStore.clearHistory();
    }
  };

  const handleLoadMore = () => {
    historyStore.loadMore();
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {t('history.title')}
        </h1>
        <Show when={historyStore.state.history.length > 0}>
          <Button variant="danger" size="sm" onClick={handleClearHistory}>
            Clear History
          </Button>
        </Show>
      </div>

      <Show when={!isLoading()} fallback={<div class="text-center py-12">Loading...</div>}>
        <Show
          when={historyStore.state.history.length > 0}
          fallback={
            <Card class="p-12 text-center">
              <div class="text-6xl mb-4">🕐</div>
              <h3 class="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                {t('history.noHistoryYet')}
              </h3>
              <p class="text-surface-500 dark:text-surface-400">
                Your prompt usage history will appear here
              </p>
            </Card>
          }
        >
          <div class="space-y-3">
            <For each={historyStore.state.history}>
              {(entry) => (
                <HistoryItem
                  entry={entry}
                  promptTitle={getPromptTitle(entry.promptId)}
                  formatTime={formatTime}
                />
              )}
            </For>
          </div>

          <Show when={historyStore.state.hasMore}>
            <div class="text-center pt-4">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                loading={historyStore.state.isLoading}
              >
                Load More
              </Button>
            </div>
          </Show>
        </Show>
      </Show>
    </div>
  );
};

interface HistoryItemProps {
  entry: PromptHistory;
  promptTitle: string;
  formatTime: (timestamp: number) => string;
}

const HistoryItem: Component<HistoryItemProps> = (props) => {
  const [isExpanded, setIsExpanded] = createSignal(false);

  const iconClasses = () => {
    const base = 'w-5 h-5 transition-transform';
    return isExpanded() ? base + ' rotate-180' : base;
  };

  return (
    <Card class="p-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-surface-900 dark:text-surface-100 truncate">
              {props.promptTitle}
            </h3>
            <Badge
              variant={props.entry.success ? 'success' : 'danger'}
              size="sm"
            >
              {props.entry.success ? 'Success' : 'Failed'}
            </Badge>
          </div>

          <p class="text-sm text-surface-500 dark:text-surface-400">
            {props.formatTime(props.entry.usedAt)}
          </p>

          <Show when={isExpanded()}>
            <div class="mt-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
              <p class="text-sm text-surface-700 dark:text-surface-300 font-medium mb-1">
                Content:
              </p>
              <p class="text-sm text-surface-600 dark:text-surface-400 whitespace-pre-wrap">
                {props.entry.content}
              </p>

              <Show when={props.entry.variables && Object.keys(props.entry.variables).length > 0}>
                <div class="mt-2">
                  <p class="text-sm text-surface-700 dark:text-surface-300 font-medium mb-1">
                    Variables:
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <For each={Object.entries(props.entry.variables || {})}>
                      {([key, value]) => (
                        <Badge variant="default" size="sm">
                          {key}: {value}
                        </Badge>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              <Show when={props.entry.platform}>
                <p class="text-sm text-surface-500 dark:text-surface-400 mt-2">
                  Platform: {props.entry.platform}
                </p>
              </Show>

              <Show when={props.entry.error}>
                <p class="text-sm text-red-500 mt-2">
                  Error: {props.entry.error}
                </p>
              </Show>
            </div>
          </Show>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded())}
          class="p-2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
        >
          <svg
            class={iconClasses()}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </Card>
  );
};

export default History;
