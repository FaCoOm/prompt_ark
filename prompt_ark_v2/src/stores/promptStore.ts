import { batch, createSignal } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import type { Prompt, PromptFilter, PromptSort } from '../types';
import { PromptStorage } from '../shared/storage';

interface PromptStoreState {
  prompts: Prompt[];
  filteredPrompts: Prompt[];
  selectedPrompt: Prompt | null;
  isLoading: boolean;
  filter: PromptFilter;
  sort: PromptSort;
  searchQuery: string;
}

const [state, setState] = createStore<PromptStoreState>({
  prompts: [],
  filteredPrompts: [],
  selectedPrompt: null,
  isLoading: false,
  filter: {},
  sort: { by: 'updated', order: 'desc' },
  searchQuery: '',
});

export const promptStore = {
  get state() {
    return state;
  },

  reset(): void {
    setState({
      prompts: [],
      filteredPrompts: [],
      selectedPrompt: null,
      isLoading: false,
      filter: {},
      sort: { by: 'updated', order: 'desc' },
      searchQuery: '',
    });
  },

  async loadPrompts(): Promise<void> {
    setState('isLoading', true);
    try {
      const prompts = await PromptStorage.getPrompts();
      batch(() => {
        setState('prompts', prompts);
        setState('filteredPrompts', prompts);
        setState('isLoading', false);
      });
      this.applyFilterAndSort();
    } catch (error) {
      console.error('Failed to load prompts:', error);
      setState('isLoading', false);
    }
  },

  setSearchQuery(query: string): void {
    setState('searchQuery', query);
    this.applyFilterAndSort();
  },

  setFilter(filter: Partial<PromptFilter>): void {
    setState('filter', filter);
    this.applyFilterAndSort();
  },

  setSort(sort: PromptSort): void {
    setState('sort', sort);
    this.applyFilterAndSort();
  },

  selectPrompt(prompt: Prompt | null): void {
    setState('selectedPrompt', prompt);
  },

  async savePrompt(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    const now = Date.now();
    const newPrompt: Prompt = {
      ...promptData as Prompt,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await PromptStorage.savePrompt(newPrompt);
    setState(
      produce((draft) => {
        draft.prompts.push(newPrompt);
        this.recalculateFilteredPrompts(draft);
      })
    );
    return newPrompt;
  },

  async updatePrompt(id: string, updates: Partial<Prompt>): Promise<void> {
    const existing = state.prompts.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await PromptStorage.savePrompt(updated);
    setState('prompts', (prev) => prev.map((p) => (p.id === id ? updated : p)));
    this.applyFilterAndSort();
  },

  async deletePrompt(id: string): Promise<void> {
    await PromptStorage.deletePrompt(id);
    setState('prompts', (prev) => prev.filter((p) => p.id !== id));
    this.applyFilterAndSort();
  },

  recalculateFilteredPrompts(draft: PromptStoreState): void {
    const { prompts, searchQuery, filter, sort } = draft;
    
    let result = [...prompts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (filter.category) {
      result = result.filter((p) => p.category === filter.category);
    }

    if (filter.isFavorite !== undefined) {
      result = result.filter((p) => p.isFavorite === filter.isFavorite);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.by) {
        case 'created':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updated':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'used':
          comparison = (a.useCount || 0) - (b.useCount || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sort.order === 'asc' ? comparison : -comparison;
    });

    draft.filteredPrompts = result;
  },

  applyFilterAndSort(): void {
    setState(
      produce((draft) => {
        this.recalculateFilteredPrompts(draft);
      })
    );
  },
};
