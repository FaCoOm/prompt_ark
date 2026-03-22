import { create } from 'zustand';
import { PromptStorage } from '@shared/api/storage';
import type { Prompt } from '@shared/types/prompt';

interface PromptState {
  prompts: Prompt[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string;
  searchQuery: string;
  
  loadPrompts: () => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  trackUsage: (id: string) => Promise<void>;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  selectedCategory: 'all',
  searchQuery: '',
  
  loadPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const prompts = await PromptStorage.get();
      set({ prompts, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
  
  addPrompt: async (promptData) => {
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
  },
  
  updatePrompt: async (id, updates) => {
    const { prompts } = get();
    const existing = prompts.find(p => p.id === id);
    if (!existing) return;
    
    const updated = { ...existing, ...updates, updatedAt: Date.now() };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => p.id === id ? updated : p)
    }));
  },
  
  deletePrompt: async (id) => {
    await PromptStorage.delete(id);
    set(state => ({
      prompts: state.prompts.filter(p => p.id !== id)
    }));
  },
  
  toggleFavorite: async (id) => {
    const { prompts } = get();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    const updated = { ...prompt, favorite: !prompt.favorite };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => p.id === id ? updated : p)
    }));
  },
  
  trackUsage: async (id) => {
    const { prompts } = get();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;
    
    const updated = {
      ...prompt,
      usageCount: prompt.usageCount + 1,
      lastUsedAt: Date.now()
    };
    await PromptStorage.update(updated);
    set(state => ({
      prompts: state.prompts.map(p => p.id === id ? updated : p)
    }));
  },
  
  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));