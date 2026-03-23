import type { Prompt } from '@shared/types/prompt';
import { createSignal, createEffect } from 'solid-js';

export function SidePanelApp() {
  const [prompts, setPrompts] = createSignal<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
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
    if (!searchQuery()) return prompts();
    const query = searchQuery().toLowerCase();
    return prompts().filter(p => 
      p.title.toLowerCase().includes(query) ||
      p.content.toLowerCase().includes(query)
    );
  };

  return (
    <div class="sidepanel-container">
      <header class="sidepanel-header">
        <h1>Prompt Ark</h1>
      </header>

      <div class="search-box">
        <input
          type="text"
          placeholder="搜索 Prompt..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>

      {loading() ? (
        <div class="loading">加载中...</div>
      ) : (
        <div class="prompt-list">
          {filteredPrompts().length === 0 ? (
            <div class="empty">没有找到 Prompt</div>
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
      class="prompt-card"
      onClick={handleClick}
    >
      <h3>{props.prompt.title}</h3>
      <p class="prompt-content">{props.prompt.content}</p>
      {props.prompt.category && (
        <span class="category-tag">{props.prompt.category}</span>
      )}
    </button>
  );
}