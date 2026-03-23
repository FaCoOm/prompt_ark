import { usePromptStore } from '@/stores';
import type { JSX } from 'solid-js';

export function SmartFilters(): JSX.Element {
  const promptStore = usePromptStore();
  const activeFilter = () => promptStore.activeSmartFilter;

  const handleFilterClick = (filter: 'favorites' | 'frequent' | 'recent') => {
    if (activeFilter() === filter) {
      promptStore.setSmartFilter(null);
    } else {
      promptStore.setSmartFilter(filter);
    }
  };

  const isActive = (filter: 'favorites' | 'frequent' | 'recent') => activeFilter() === filter;

  return (
    <div class="smart-filters flex items-center gap-2">
      <button
        type="button"
        class="btn btn-small btn-icon"
        classList={{ active: isActive('favorites') }}
        onClick={() => handleFilterClick('favorites')}
        title="Favorites"
        aria-label="Filter by favorites"
        aria-pressed={isActive('favorites')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={isActive('favorites') ? 'currentColor' : 'none'}
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>

      <button
        type="button"
        class="btn btn-small btn-icon"
        classList={{ active: isActive('frequent') }}
        onClick={() => handleFilterClick('frequent')}
        title="Frequent"
        aria-label="Filter by frequent"
        aria-pressed={isActive('frequent')}
      >
        <svg
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
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      </button>

      <button
        type="button"
        class="btn btn-small btn-icon"
        classList={{ active: isActive('recent') }}
        onClick={() => handleFilterClick('recent')}
        title="Recent"
        aria-label="Filter by recent"
        aria-pressed={isActive('recent')}
      >
        <svg
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
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
    </div>
  );
}
