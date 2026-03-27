import { createStore } from 'solid-js/store';
import type { ToastType } from '../types';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface UIStoreState {
  // Sidebar/Navigation
  sidebarOpen: boolean;
  activeRoute: string;

  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown>;

  // Toast notifications
  toasts: Toast[];

  // Global UI state
  isDarkMode: boolean;
  language: string;

  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Search
  searchQuery: string;
  searchFocused: boolean;

  // Selection
  selectedPromptIds: string[];
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

const [state, setState] = createStore<UIStoreState>({
  sidebarOpen: false,
  activeRoute: '/',
  activeModal: null,
  modalData: {},
  toasts: [],
  isDarkMode: false,
  language: 'zh-CN',
  globalLoading: false,
  loadingMessage: '',
  searchQuery: '',
  searchFocused: false,
  selectedPromptIds: [],
});

export const uiStore = {
  get state() {
    return state;
  },

  // Sidebar
  toggleSidebar(): void {
    setState('sidebarOpen', (prev) => !prev);
  },

  setSidebarOpen(open: boolean): void {
    setState('sidebarOpen', open);
  },

  // Navigation
  setActiveRoute(route: string): void {
    setState('activeRoute', route);
  },

  // Modals
  openModal(modalId: string, data?: Record<string, unknown>): void {
    setState('activeModal', modalId);
    if (data) {
      setState('modalData', data);
    }
  },

  closeModal(): void {
    batch(() => {
      setState('activeModal', null);
      setState('modalData', {});
    });
  },

  setModalData(data: Record<string, unknown>): void {
    setState('modalData', data);
  },

  // Toasts
  showToast(message: string, type: ToastType = 'info', duration = 3000): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, message, type, duration };
    setState('toasts', (prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(id);
      }, duration);
    }
  },

  showSuccess(message: string, duration?: number): void {
    this.showToast(message, 'success', duration);
  },

  showError(message: string, duration?: number): void {
    this.showToast(message, 'error', duration);
  },

  showWarning(message: string, duration?: number): void {
    this.showToast(message, 'warning', duration);
  },

  showInfo(message: string, duration?: number): void {
    this.showToast(message, 'info', duration);
  },

  dismissToast(id: string): void {
    setState('toasts', (prev) => prev.filter((t) => t.id !== id));
  },

  dismissAllToasts(): void {
    setState('toasts', []);
  },

  // Theme
  setDarkMode(isDark: boolean): void {
    setState('isDarkMode', isDark);
    document.documentElement.classList.toggle('dark', isDark);
  },

  toggleDarkMode(): void {
    this.setDarkMode(!state.isDarkMode);
  },

  // Language
  setLanguage(lang: string): void {
    setState('language', lang);
  },

  // Loading
  setGlobalLoading(loading: boolean, message = ''): void {
    setState('globalLoading', loading);
    setState('loadingMessage', message);
  },

  // Search
  setSearchQuery(query: string): void {
    setState('searchQuery', query);
  },

  setSearchFocused(focused: boolean): void {
    setState('searchFocused', focused);
  },

  // Selection
  selectPrompt(id: string): void {
    setState('selectedPromptIds', (prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  },

  deselectPrompt(id: string): void {
    setState('selectedPromptIds', (prev) => prev.filter((pid) => pid !== id));
  },

  togglePromptSelection(id: string): void {
    setState('selectedPromptIds', (prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  },

  selectAllPrompts(ids: string[]): void {
    setState('selectedPromptIds', ids);
  },

  clearSelection(): void {
    setState('selectedPromptIds', []);
  },

  isPromptSelected(id: string): boolean {
    return state.selectedPromptIds.includes(id);
  },
};
