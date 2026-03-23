import { createMemo, type JSX } from 'solid-js';
import { usePromptStore } from '@/stores';

export function CategoryTabs(): JSX.Element {
  const promptStore = usePromptStore();

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
    const categoryValue = category === 'All' ? 'all' : category;
    promptStore.setCategory(categoryValue);
  };

  return (
    <div class="categories">
      {categories().map(category => (
        <button
          type="button"
          class={`category-tag ${isActive(category) ? 'active' : ''}`}
          onClick={() => handleCategoryClick(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
