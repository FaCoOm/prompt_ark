import { createSignal } from 'solid-js';
import type { Prompt } from '@/shared/types';

export default function App() {
  const [loading] = createSignal(true);
  const [searchQuery, setSearchQuery] = createSignal('');

  const filteredPrompts = (): Prompt[] => {
    if (!searchQuery()) return [];
    return [];
  };

  return (
    <div class="sidepanel-app">
      <header class="sidepanel-header">
        <h1 class="app-title">Prompt Ark</h1>
      </header>

      <section class="search-section">
        <input
          type="text"
          class="search-input"
          placeholder="Search prompts..."
          value={searchQuery()}
          onInput={e => setSearchQuery(e.currentTarget.value)}
        />
      </section>

      <main class="sidepanel-main">
        {loading() ? (
          <div class="loading-state">
            <span>Loading...</span>
          </div>
        ) : filteredPrompts().length === 0 ? (
          <div class="empty-state">
            <span>No prompts found</span>
          </div>
        ) : (
          <div class="prompt-list" />
        )}
      </main>

      <footer class="sidepanel-footer" />
    </div>
  );
}
