import { createSignal, onMount } from 'solid-js';
import { promptStore } from '../../src/stores/promptStore';
import { settingsStore } from '../../src/stores/settingsStore';
import { useI18n } from '../../src/i18n';

export default function App() {
  const { t } = useI18n();

  onMount(() => {
    promptStore.loadPrompts();
    settingsStore.loadSettings();
  });

  return (
    <div class="min-h-screen bg-surface-50 p-4">
      <header class="mb-6">
        <h1 class="text-2xl font-bold text-surface-900">
          {t('app.name')}
        </h1>
        <p class="text-sm text-surface-500">
          {t('app.description')}
        </p>
      </header>

      <PromptList />
    </div>
  );
}

function PromptList() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = createSignal('');

  const handleSearch = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setSearchQuery(target.value);
    promptStore.setSearchQuery(target.value);
  };

  return (
    <div class="space-y-4">
      <div class="relative">
        <input
          type="text"
          placeholder={t('prompt.searchPlaceholder')}
          value={searchQuery()}
          onInput={handleSearch}
          class="w-full rounded-lg border border-surface-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
        />
      </div>

      <div class="space-y-2">
        {promptStore.state.filteredPrompts.map((prompt) => (
          <PromptCard prompt={prompt} />
        ))}
      </div>
    </div>
  );
}

function PromptCard(props: { prompt: import('../../src/types').Prompt }) {
  const { t } = useI18n();
  const { prompt } = props;

  const handleInsert = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.runtime.sendMessage({
        type: 'INSERT_PROMPT',
        payload: { promptId: prompt.id, targetTabId: tab.id },
      });
    }
  };

  return (
    <div class="rounded-lg border border-surface-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div class="flex items-start justify-between">
        <h3 class="font-semibold text-surface-900">{prompt.title}</h3>
        <button
          onClick={handleInsert}
          class="rounded bg-primary-500 px-3 py-1 text-sm text-white hover:bg-primary-600"
        >
          {t('action.insert')}
        </button>
      </div>
      <p class="mt-2 line-clamp-2 text-sm text-surface-600">{prompt.content}</p>
      <div class="mt-2 flex items-center gap-2 text-xs text-surface-400">
        <span>{prompt.category}</span>
        <span>•</span>
        <span>{prompt.tags.join(', ')}</span>
      </div>
    </div>
  );
}
