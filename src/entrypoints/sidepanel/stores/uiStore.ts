import { createStore, produce } from 'solid-js/store';

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

const [state, setState] = createStore({
  modals: {
    edit: false,
    import: false,
    history: false,
    share: false,
    youtube: false,
    skillManager: false,
  } as ModalState,
  loading: {} as Record<string, boolean>,
  notifications: [] as Notification[],
  isSettingsOpen: false,
  editModalTab: 'basic' as EditModalTab,
});

export const uiStore = {
  get modals() {
    return state.modals;
  },
  get loading() {
    return state.loading;
  },
  get notifications() {
    return state.notifications;
  },
  get isSettingsOpen() {
    return state.isSettingsOpen;
  },
  get editModalTab() {
    return state.editModalTab;
  },

  openModal: (name: keyof ModalState) => {
    setState(
      produce(s => {
        s.modals[name] = true;
      })
    );
  },

  closeModal: (name: keyof ModalState) => {
    setState(
      produce(s => {
        s.modals[name] = false;
      })
    );
  },

  toggleModal: (name: keyof ModalState) => {
    setState(
      produce(s => {
        s.modals[name] = !s.modals[name];
      })
    );
  },

  setLoading: (key: string, value: boolean) => {
    setState(
      produce(s => {
        s.loading[key] = value;
      })
    );
  },

  showNotification: (notification: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const duration = notification.duration ?? 3000;

    setState(
      produce(s => {
        s.notifications.push({ ...notification, id });
      })
    );

    if (duration > 0) {
      setTimeout(() => {
        uiStore.dismissNotification(id);
      }, duration);
    }
  },

  dismissNotification: (id: string) => {
    setState(
      produce(s => {
        s.notifications = s.notifications.filter(n => n.id !== id);
      })
    );
  },

  openSettings: () => {
    setState('isSettingsOpen', true);
  },

  closeSettings: () => {
    setState('isSettingsOpen', false);
  },

  setEditModalTab: (tab: EditModalTab) => {
    setState('editModalTab', tab);
  },
};

export function useUIStore() {
  return uiStore;
}

export default uiStore;
