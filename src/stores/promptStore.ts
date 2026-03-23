import { PromptStorage } from '@shared/api/storage';
import type { Prompt } from '@shared/types/prompt';
import { createStore, produce } from 'solid-js/store';

const [state, setState] = createStore({
  prompts: [] as Prompt[],
  isLoading: false,
  error: null as string | null,
  selectedCategory: 'all',
  searchQuery: '',
  filteredPrompts: [] as Prompt[],
  currentCategory: 'all',
  activeSmartFilter: null as 'favorites' | 'frequent' | 'recent' | null,
  currentPage: 1,
  pageSize: 20,
  totalCount: 0,
  editingPrompt: null as Prompt | null,
  selectedIds: new Set<string>(),
  isPackMode: false,
});

export const promptStore = {
  get prompts() {
    return state.prompts;
  },
  get isLoading() {
    return state.isLoading;
  },
  get error() {
    return state.error;
  },
  get selectedCategory() {
    return state.selectedCategory;
  },
  get searchQuery() {
    return state.searchQuery;
  },
  get filteredPrompts() {
    return state.filteredPrompts;
  },
  get currentCategory() {
    return state.currentCategory;
  },
  get activeSmartFilter() {
    return state.activeSmartFilter;
  },
  get currentPage() {
    return state.currentPage;
  },
  get pageSize() {
    return state.pageSize;
  },
  get totalCount() {
    return state.totalCount;
  },
  get editingPrompt() {
    return state.editingPrompt;
  },
  get selectedIds() {
    return state.selectedIds;
  },
  get isPackMode() {
    return state.isPackMode;
  },

  loadPrompts: async () => {
    setState('isLoading', true);
    setState('error', null);
    try {
      const prompts = await PromptStorage.get();
      setState('prompts', prompts);
      setState('isLoading', false);
      promptStore.filterPrompts();
    } catch (error) {
      setState('error', String(error));
      setState('isLoading', false);
    }
  },

  addPrompt: async (
    promptData: Omit<
      Prompt,
      'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'
    >
  ) => {
    const newPrompt: Prompt = {
      ...promptData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      usageCount: 0,
      lastUsedAt: null,
      favorite: false,
      versions: [],
    };

    await PromptStorage.save(newPrompt);
    setState('prompts', prompts => [...prompts, newPrompt]);
    promptStore.filterPrompts();
  },

  updatePrompt: async (id: string, updates: Partial<Prompt>) => {
    const existing = state.prompts.find(p => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await PromptStorage.update(updated);

    setState('prompts', prompts => prompts.map(p => (p.id === id ? updated : p)));
    promptStore.filterPrompts();

    if (state.editingPrompt?.id === id) {
      setState('editingPrompt', updated);
    }
  },

  deletePrompt: async (id: string) => {
    await PromptStorage.delete(id);
    setState(
      produce(s => {
        s.prompts = s.prompts.filter(p => p.id !== id);
        s.selectedIds.delete(id);
      })
    );
    promptStore.filterPrompts();
  },

  toggleFavorite: async (id: string) => {
    const prompt = state.prompts.find(p => p.id === id);
    if (!prompt) return;

    const updated = { ...prompt, favorite: !prompt.favorite };
    await PromptStorage.update(updated);

    setState('prompts', prompts => prompts.map(p => (p.id === id ? updated : p)));

    if (state.activeSmartFilter === 'favorites') {
      promptStore.filterPrompts();
    }
  },

  trackUsage: async (id: string) => {
    const prompt = state.prompts.find(p => p.id === id);
    if (!prompt) return;

    const updated = {
      ...prompt,
      usageCount: prompt.usageCount + 1,
      lastUsedAt: Date.now(),
    };
    await PromptStorage.update(updated);

    setState('prompts', prompts => prompts.map(p => (p.id === id ? updated : p)));

    if (state.activeSmartFilter === 'frequent' || state.activeSmartFilter === 'recent') {
      promptStore.filterPrompts();
    }
  },

  setCategory: (category: string) => {
    setState('selectedCategory', category);
    setState('currentCategory', category);
    setState('currentPage', 1);
    promptStore.filterPrompts();
  },

  setSearchQuery: (query: string) => {
    setState('searchQuery', query);
    setState('currentPage', 1);
    promptStore.filterPrompts();
  },

  filterPrompts: () => {
    let filtered = [...state.prompts];

    if (state.currentCategory && state.currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === state.currentCategory);
    }

    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (state.activeSmartFilter) {
      switch (state.activeSmartFilter) {
        case 'favorites':
          filtered = filtered.filter(p => p.favorite);
          break;
        case 'frequent':
          filtered = filtered.sort((a, b) => b.usageCount - a.usageCount);
          break;
        case 'recent':
          filtered = filtered
            .filter(p => p.lastUsedAt !== null)
            .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
          break;
      }
    }

    const totalCount = filtered.length;
    const start = (state.currentPage - 1) * state.pageSize;
    const paginated = filtered.slice(start, start + state.pageSize);

    setState('filteredPrompts', paginated);
    setState('totalCount', totalCount);
  },

  setPage: (page: number) => {
    setState('currentPage', Math.max(1, page));
    promptStore.filterPrompts();
  },

  setPageSize: (size: number) => {
    setState('pageSize', Math.max(1, size));
    setState('currentPage', 1);
    promptStore.filterPrompts();
  },

  selectPrompt: (id: string) => {
    setState(
      produce(s => {
        if (s.selectedIds.has(id)) {
          s.selectedIds.delete(id);
        } else {
          s.selectedIds.add(id);
        }
      })
    );
  },

  clearSelection: () => {
    setState('selectedIds', new Set());
  },

  setPackMode: (enabled: boolean) => {
    setState('isPackMode', enabled);
    if (!enabled) {
      setState('selectedIds', new Set());
    }
  },

  setSmartFilter: (filter: 'favorites' | 'frequent' | 'recent' | null) => {
    setState('activeSmartFilter', filter);
    setState('currentPage', 1);
    promptStore.filterPrompts();
  },

  setEditingPrompt: (prompt: Prompt | null) => {
    setState('editingPrompt', prompt);
  },
};

export function usePromptStore() {
  return promptStore;
}

export default promptStore;
