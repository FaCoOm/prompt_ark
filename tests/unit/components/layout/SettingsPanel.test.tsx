import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { SettingsPanel } from '../../../../src/entrypoints/sidepanel/components/layout/SettingsPanel';

const mockCloseSettings = vi.fn();
const mockSetActiveTab = vi.fn();

const createMockUIStore = (isOpen: boolean) => ({
  isSettingsOpen: isOpen,
  openSettings: vi.fn(),
  closeSettings: mockCloseSettings,
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
  editModalTab: 'basic' as const,
  openModal: vi.fn(),
  closeModal: vi.fn(),
  toggleModal: vi.fn(),
  setLoading: vi.fn(),
  showNotification: vi.fn(),
  dismissNotification: vi.fn(),
  setEditModalTab: vi.fn(),
});

const createMockSettingsStore = (activeTab: 'general' | 'models' | 'sync' = 'general') => ({
  activeTab,
  general: {
    language: 'en' as const,
    defaultPlatform: '',
    githubToken: '',
    openClawEnabled: false,
    imagePromptEnabled: false,
  },
  models: {
    providers: [],
    activeProviderId: null,
    visionModel: '',
  },
  sync: {
    engine: 'local' as const,
    settings: {},
    lastSyncTime: null,
  },
  isLoading: false,
  error: null,
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  addProvider: vi.fn(),
  updateProvider: vi.fn(),
  removeProvider: vi.fn(),
  testConnection: vi.fn(),
  forceSync: vi.fn(),
  setActiveTab: mockSetActiveTab,
  updateGeneralSettings: vi.fn(),
  updateSyncSettings: vi.fn(),
  updateModelSettings: vi.fn(),
});

vi.mock('@/entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

import { useUIStore } from '../../../../src/entrypoints/sidepanel/stores/uiStore';
import { useSettingsStore } from '../../../../src/stores/settingsStore';

describe('SettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Open/close behavior', () => {
    it('should render when isSettingsOpen is true', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not render when isSettingsOpen is false', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(false));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      const { container } = render(() => <SettingsPanel />);

      expect(container.querySelector('.modal')).not.toBeInTheDocument();
    });

    it('should call closeSettings when close button is clicked', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const closeButton = screen.getByLabelText('Close settings');
      fireEvent.click(closeButton);

      expect(mockCloseSettings).toHaveBeenCalledTimes(1);
    });

    it('should call closeSettings when backdrop is clicked', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      const { container } = render(() => <SettingsPanel />);

      const modal = container.querySelector('.modal');
      fireEvent.click(modal!);

      expect(mockCloseSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab switching', () => {
    it('should render all three tabs', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      expect(screen.getByRole('button', { name: 'General' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Models' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sync' })).toBeInTheDocument();
    });

    it('should mark General tab as active by default', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const generalTab = screen.getByRole('button', { name: 'General' });
      expect(generalTab).toHaveClass('active');
    });

    it('should call setActiveTab when Models tab is clicked', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const modelsTab = screen.getByRole('button', { name: 'Models' });
      fireEvent.click(modelsTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('models');
    });

    it('should call setActiveTab when Sync tab is clicked', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const syncTab = screen.getByRole('button', { name: 'Sync' });
      fireEvent.click(syncTab);

      expect(mockSetActiveTab).toHaveBeenCalledWith('sync');
    });

    it('should mark Models tab as active when activeTab is models', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('models'));

      render(() => <SettingsPanel />);

      const modelsTab = screen.getByRole('button', { name: 'Models' });
      expect(modelsTab).toHaveClass('active');
    });

    it('should mark Sync tab as active when activeTab is sync', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('sync'));

      render(() => <SettingsPanel />);

      const syncTab = screen.getByRole('button', { name: 'Sync' });
      expect(syncTab).toHaveClass('active');
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'settings-title');
    });

    it('should render settings title with correct id', () => {
      (useUIStore as any).mockReturnValue(createMockUIStore(true));
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore('general'));

      render(() => <SettingsPanel />);

      const title = screen.getByText('Settings');
      expect(title).toHaveAttribute('id', 'settings-title');
    });
  });
});
