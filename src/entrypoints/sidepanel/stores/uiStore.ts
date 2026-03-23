import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  edit: boolean;
  import: boolean;
  history: boolean;
  share: boolean;
  youtube: boolean;
  skillManager: boolean;
}

export type EditModalTab = 'basic' | 'content' | 'advanced';

export interface UIState {
  modals: ModalState;
  loading: Record<string, boolean>;
  notifications: Notification[];
  isSettingsOpen: boolean;
  editModalTab: EditModalTab;
}

export interface UIActions {
  openModal: (name: keyof ModalState) => void;
  closeModal: (name: keyof ModalState) => void;
  toggleModal: (name: keyof ModalState) => void;
  setLoading: (key: string, value: boolean) => void;
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setEditModalTab: (tab: EditModalTab) => void;
}

const initialState: UIState = {
  modals: {
    edit: false,
    import: false,
    history: false,
    share: false,
    youtube: false,
    skillManager: false,
  },
  loading: {},
  notifications: [],
  isSettingsOpen: false,
  editModalTab: 'basic',
};

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  ...initialState,

  openModal: (name: keyof ModalState) => {
    set(state => ({
      modals: { ...state.modals, [name]: true },
    }));
  },

  closeModal: (name: keyof ModalState) => {
    set(state => ({
      modals: { ...state.modals, [name]: false },
    }));
  },

  toggleModal: (name: keyof ModalState) => {
    set(state => ({
      modals: { ...state.modals, [name]: !state.modals[name] },
    }));
  },

  setLoading: (key: string, value: boolean) => {
    set(state => ({
      loading: { ...state.loading, [key]: value },
    }));
  },

  showNotification: (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const duration = notification.duration ?? 3000;

    set(state => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }
  },

  dismissNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  openSettings: () => {
    set({ isSettingsOpen: true });
  },

  closeSettings: () => {
    set({ isSettingsOpen: false });
  },

  setEditModalTab: (tab: EditModalTab) => {
    set({ editModalTab: tab });
  },
}));
