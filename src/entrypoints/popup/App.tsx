import type { Prompt } from '@shared/types/prompt';
import { createSignal, createEffect, For } from 'solid-js';

export function App() {
  const [prompts, setPrompts] = createSignal<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedCategory, setSelectedCategory] = createSignal('all');
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    loadPrompts();
  });

  async function loadPrompts() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PROMPTS' });
      if (response.success) {
        setPrompts(response.prompts);
      }
    } catch (err) {
      console.error('Failed to load prompts:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPrompts = () => {
    let result = prompts();
    
    if (selectedCategory() !== 'all') {
      result = result.filter(p => p.category === selectedCategory());
    }
    
    if (searchQuery()) {
      const query = searchQuery().toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query)
      );
    }
    
    return result;
  };

  const categories = () => {
    const cats = new Set(prompts().map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  };

  return (
    <div class="min-h-screen bg-gray-50 p-4">
      <header class="mb-4">
        <h1 class="text-xl font-bold text-gray-800">Prompt Ark</h1>
      </header>

      <div class="mb-4">
        <input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="mb-4 flex gap-2 overflow-x-auto">
        <For each={categories()}>{cat => (
          <button
            type="button"
            onClick={() => setSelectedCategory(cat)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCategory(cat); } }}
            class={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory() === cat
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        )}</For>
      </div>

      {loading() ? (
        <div class="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div class="space-y-2">
          {filteredPrompts().length === 0 ? (
            <div class="text-center py-8 text-gray-500">No prompts found</div>
          ) : (
            filteredPrompts().map(prompt => (
              <PromptCard prompt={prompt} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface PromptCardProps {
  prompt: Prompt;
}

function PromptCard(props: PromptCardProps) {
  async function handleClick() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'INSERT_PROMPT', 
        content: props.prompt.content 
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      class="w-full text-left p-3 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
    >
      <h3 class="font-medium text-gray-800 mb-1">{props.prompt.title}</h3>
      <p class="text-sm text-gray-500 line-clamp-2">{props.prompt.content}</p>
      {props.prompt.category && (
        <span class="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 rounded">
          {props.prompt.category}
        </span>
      )}
    </button>
  );
}