import { createSignal, createEffect, type JSX } from 'solid-js';
import { usePromptStore } from '@/stores';
import { useUIStore } from '../../stores/uiStore';

export function SearchBar(): JSX.Element {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();
  const [localQuery, setLocalQuery] = createSignal('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const query = localQuery();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      try {
        promptStore.setSearchQuery(query);
      } catch (error) {
        uiStore.showNotification({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to set search query',
        });
      }
    }, 300);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  });

  const handleClear = () => {
    try {
      setLocalQuery('');
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      promptStore.setSearchQuery('');
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to clear search',
      });
    }
  };

  const hasText = () => localQuery().length > 0;

  return (
    <div class="search-bar">
      <div class="relative flex items-center">
        <svg
          class="pointer-events-none absolute left-3 text-[var(--text-muted)]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          type="text"
          value={localQuery()}
          onInput={e => setLocalQuery(e.currentTarget.value)}
          placeholder="Search prompts..."
          class="w-full pl-9 pr-9"
        />

        {hasText() && (
          <button
            onClick={handleClear}
            class="absolute right-3 rounded-full bg-[var(--text-muted)] p-0.5 text-[var(--bg-input)] transition-colors hover:bg-[var(--text-secondary)]"
            type="button"
            aria-label="Clear search"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
