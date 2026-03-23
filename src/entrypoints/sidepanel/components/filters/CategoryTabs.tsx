import { createMemo, type JSX, For } from 'solid-js';
import { usePromptStore } from '@/stores';
import { useUIStore } from '../../stores/uiStore';

export function CategoryTabs(): JSX.Element {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();

  const categories = createMemo(() => {
    const uniqueCategories = new Set<string>();
    promptStore.prompts.forEach(prompt => {
      if (prompt.category) {
        uniqueCategories.add(prompt.category);
      }
    });
    return ['All', ...Array.from(uniqueCategories).sort()];
  });

  const isActive = (category: string) => {
    const current = promptStore.selectedCategory;
    if (category === 'All') {
      return current === 'all' || current === 'All' || !current;
    }
    return current === category;
  };

  const handleCategoryClick = (category: string) => {
    try {
      const categoryValue = category === 'All' ? 'all' : category;
      promptStore.setCategory(categoryValue);
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to change category',
      });
    }
  };

  return (
    <div class="categories">
      <For each={categories()}>{category => (
        <button
          type="button"
          class={`category-tag ${isActive(category) ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category)}
        >
          {category}
        </button>
      )}</For>
    </div>
  );
}
