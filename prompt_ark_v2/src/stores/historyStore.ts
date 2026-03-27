import { batch } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { PromptHistory } from '../types';
import { HistoryStorage } from '../shared/storage';

interface HistoryStoreState {
  history: PromptHistory[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
}

const PAGE_SIZE = 20;

const [state, setState] = createStore<HistoryStoreState>({
  history: [],
  isLoading: false,
  hasMore: true,
  page: 1,
});

export const historyStore = {
  get state() {
    return state;
  },

  async loadHistory(reset = false): Promise<void> {
    if (state.isLoading) return;

    setState('isLoading', true);
    try {
      const page = reset ? 1 : state.page;
      const limit = page * PAGE_SIZE;
      const history = await HistoryStorage.getHistory(limit);

      batch(() => {
        setState('history', history);
        setState('hasMore', history.length === limit);
        setState('page', page);
        setState('isLoading', false);
      });
    } catch (error) {
      console.error('Failed to load history:', error);
      setState('isLoading', false);
    }
  },

  async loadMore(): Promise<void> {
    if (state.isLoading || !state.hasMore) return;
    setState('page', state.page + 1);
    await this.loadHistory();
  },

  async addHistory(entry: Omit<PromptHistory, 'id'>): Promise<void> {
    const newEntry: PromptHistory = {
      ...entry,
      id: crypto.randomUUID(),
    };

    await HistoryStorage.addHistory(newEntry);
    setState('history', (prev) => [newEntry, ...prev]);
  },

  clearHistory(): void {
    batch(() => {
      setState('history', []);
      setState('hasMore', false);
      setState('page', 1);
    });
  },

  getHistoryByPromptId(promptId: string): PromptHistory[] {
    return state.history.filter((h) => h.promptId === promptId);
  },

  getRecentUsageCount(promptId: string, days = 30): number {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return state.history.filter(
      (h) => h.promptId === promptId && h.usedAt > cutoff
    ).length;
  },
};
