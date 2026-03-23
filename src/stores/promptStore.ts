import { create } from 'solid-zustand';
import { PromptStorage } from '@shared/api/storage';
import type { Prompt } from '@shared/types/prompt';

interface PromptState {
  prompts: Prompt[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  searchQuery: string;
  filteredPrompts: Prompt[];
  currentCategory: string;
  activeSmartFilter: 'favorites' | 'frequent' | 'recent' | null;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  editingPrompt: Prompt | null;
  selectedIds: Set<string>;
  isPackMode: boolean;
  loadPrompts: () => Promise<void>;
  addPrompt: (
    prompt: Omit<Prompt, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'>
  ) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  trackUsage: (id: string) => Promise<void>;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  filterPrompts: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  selectPrompt: (id: string) => void;
  clearSelection: () => void;
  setPackMode: (enabled: boolean) => void;
  setSmartFilter: (filter: 'favorites' | 'frequent' | 'recent' | null) => void;
  setEditingPrompt: (prompt: Prompt | null) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  selectedCategory: 'all',
  searchQuery: '',
  filteredPrompts: [],
  currentCategory: 'all',
  activeSmartFilter: null,
  currentPage: 1,
  pageSize: 20,
  totalCount: 0,
  editingPrompt: null,
  selectedIds: new Set(),
  isPackMode: false,

  loadPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const prompts = await PromptStorage.get();
      set({ prompts, isLoading: false });
      get().filterPrompts();
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addPrompt: async promptData => {
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
    set(state => ({ prompts: [...state.prompts, newPrompt] }));
    get().filterPrompts();
  },

  updatePrompt: async (id, updates) => {
    const { prompts } = get();
    const existing = prompts.find(p => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => (p.id === id ? updated : p)),
    }));
    get().filterPrompts();
    if (get().editingPrompt?.id === id) {
      set({ editingPrompt: updated });
    }
  },

  deletePrompt: async id => {
    await PromptStorage.delete(id);
    set(state => ({
      prompts: state.prompts.filter(p => p.id !== id),
      selectedIds: new Set([...state.selectedIds].filter(sid => sid !== id)),
    }));
    get().filterPrompts();
  },

  toggleFavorite: async id => {
    const { prompts } = get();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    const updated = { ...prompt, favorite: !prompt.favorite };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => (p.id === id ? updated : p)),
    }));
    if (get().activeSmartFilter === 'favorites') {
      get().filterPrompts();
    }
  },

  trackUsage: async id => {
    const { prompts } = get();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    const updated = {
      ...prompt,
      usageCount: prompt.usageCount + 1,
      lastUsedAt: Date.now(),
    };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => (p.id === id ? updated : p)),
    }));
    if (get().activeSmartFilter === 'frequent' || get().activeSmartFilter === 'recent') {
      get().filterPrompts();
    }
  },

  setCategory: category => {
    set({ selectedCategory: category, currentCategory: category, currentPage: 1 });
    get().filterPrompts();
  },

  setSearchQuery: query => {
    set({ searchQuery: query, currentPage: 1 });
    get().filterPrompts();
  },

  filterPrompts: () => {
    const { prompts, currentCategory, searchQuery, activeSmartFilter } = get();

    let filtered = [...prompts];

    if (currentCategory && currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (activeSmartFilter) {
      switch (activeSmartFilter) {
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
    const { currentPage, pageSize } = get();
    const start = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    set({ filteredPrompts: paginated, totalCount });
  },

  setPage: page => {
    set({ currentPage: Math.max(1, page) });
    get().filterPrompts();
  },

  setPageSize: size => {
    set({ pageSize: Math.max(1, size), currentPage: 1 });
    get().filterPrompts();
  },

  selectPrompt: id => {
    set(state => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected };
    });
  },

  clearSelection: () => {
    set({ selectedIds: new Set() });
  },

  setPackMode: enabled => {
    set({ isPackMode: enabled });
    if (!enabled) {
      set({ selectedIds: new Set() });
    }
  },

  setSmartFilter: filter => {
    set({ activeSmartFilter: filter, currentPage: 1 });
    get().filterPrompts();
  },

  setEditingPrompt: prompt => {
    set({ editingPrompt: prompt });
  },
}));
