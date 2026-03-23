import { usePromptStore } from '@/stores/promptStore';
import type { Prompt } from '@/shared/types/prompt';

/**
 * Hook for prompt data operations
 * Wraps promptStore with convenient access patterns
 */
export function usePrompts() {
  const store = usePromptStore();

  return {
    // State
    prompts: () => store.prompts,
    filteredPrompts: () => store.filteredPrompts,
    isLoading: () => store.isLoading,
    error: () => store.error,
    selectedCategory: () => store.selectedCategory,
    searchQuery: () => store.searchQuery,
    currentPage: () => store.currentPage,
    pageSize: () => store.pageSize,
    totalCount: () => store.totalCount,
    selectedIds: () => store.selectedIds,
    isPackMode: () => store.isPackMode,
    editingPrompt: () => store.editingPrompt,
    activeSmartFilter: () => store.activeSmartFilter,

    // Actions
    loadPrompts: () => store.loadPrompts(),
    addPrompt: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'>) =>
      store.addPrompt(prompt),
    updatePrompt: (id: string, updates: Partial<Prompt>) => store.updatePrompt(id, updates),
    deletePrompt: (id: string) => store.deletePrompt(id),
    toggleFavorite: (id: string) => store.toggleFavorite(id),
    trackUsage: (id: string) => store.trackUsage(id),
    setCategory: (category: string) => store.setCategory(category),
    setSearchQuery: (query: string) => store.setSearchQuery(query),
    setPage: (page: number) => store.setPage(page),
    setPageSize: (size: number) => store.setPageSize(size),
    selectPrompt: (id: string) => store.selectPrompt(id),
    clearSelection: () => store.clearSelection(),
    setPackMode: (enabled: boolean) => store.setPackMode(enabled),
    setSmartFilter: (filter: 'favorites' | 'frequent' | 'recent' | null) => store.setSmartFilter(filter),
    setEditingPrompt: (prompt: Prompt | null) => store.setEditingPrompt(prompt),
  };
}
