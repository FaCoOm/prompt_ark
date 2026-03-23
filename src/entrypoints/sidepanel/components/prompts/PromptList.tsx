import type { JSX } from 'solid-js';
import { For, Show, createMemo } from 'solid-js';
import { usePromptStore } from '@stores/promptStore';
import { useUIStore } from '../../stores/uiStore';
import { PromptCard } from './PromptCard';
import { Pagination } from './Pagination';

interface PromptListProps {
  isPackMode?: boolean;
  onInsert?: (prompt: { id: string; title: string; content: string }) => void;
}

export function PromptList(props: PromptListProps): JSX.Element {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();

  const totalPages = createMemo(() => {
    if (promptStore.pageSize === 0) return 0;
    return Math.ceil(promptStore.totalCount / promptStore.pageSize);
  });

  const showPagination = createMemo(() => totalPages() > 1);

  const handleSelect = (id: string) => {
    try {
      promptStore.selectPrompt(id);
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to select prompt',
      });
    }
  };

  return (
    <div class="prompt-list-container">
      <div class="prompt-list">
        <Show
          when={!promptStore.isLoading}
          fallback={
            <div class="loading-state">
              <div class="loading-spinner" />
              <span>Loading prompts...</span>
            </div>
          }
        >
          <Show
            when={promptStore.filteredPrompts.length > 0}
            fallback={
              <div class="empty-state">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style={{ margin: '0 auto 16px', opacity: 0.5 }}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p>No prompts found</p>
                <p class="hint">Try adjusting your search or filters, or create a new prompt.</p>
              </div>
            }
          >
            <For each={promptStore.filteredPrompts}>
              {prompt => (
                <PromptCard
                  prompt={prompt}
                  isPackMode={props.isPackMode}
                  isSelected={promptStore.selectedIds.has(prompt.id)}
                  onSelect={handleSelect}
                  onInsert={props.onInsert}
                />
              )}
            </For>
          </Show>
        </Show>
      </div>

      <Show when={showPagination()}>
        <Pagination totalPages={totalPages()} />
      </Show>
    </div>
  );
}
