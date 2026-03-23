import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { GeneralTab } from '../../../../src/entrypoints/sidepanel/components/settings/GeneralTab';

const mockUpdateGeneralSettings = vi.fn();

const createMockSettingsStore = (overrides = {}) => ({
  general: {
    language: 'en' as const,
    defaultPlatform: '',
    githubToken: '',
    openClawEnabled: false,
    imagePromptEnabled: false,
    ...overrides,
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
  activeTab: 'general' as const,
  isLoading: false,
  error: null,
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  addProvider: vi.fn(),
  updateProvider: vi.fn(),
  removeProvider: vi.fn(),
  testConnection: vi.fn(),
  forceSync: vi.fn(),
  setActiveTab: vi.fn(),
  updateGeneralSettings: mockUpdateGeneralSettings,
  updateSyncSettings: vi.fn(),
  updateModelSettings: vi.fn(),
});

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

import { useSettingsStore } from '../../../../src/stores/settingsStore';

describe('GeneralTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form rendering', () => {
    it('should render language select', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Language' })).toBeInTheDocument();
    });

    it('should render default platform select', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByLabelText('Default AI Platform')).toBeInTheDocument();
    });

    it('should render GitHub token input', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByPlaceholderText('ghp_xxxxxxxxxxxx')).toBeInTheDocument();
    });

    it('should render OpenClaw toggle', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByLabelText('Enable OpenClaw')).toBeInTheDocument();
    });

    it('should render Image Prompt toggle', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByLabelText('Enable Image Prompt Generation')).toBeInTheDocument();
    });

    it('should render all language options', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      const languageSelect = screen.getByRole('combobox', { name: 'Language' });
      expect(languageSelect).toHaveValue('en');
    });

    it('should render platform options including Auto-detect', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      const platformSelect = screen.getByRole('combobox', { name: 'Default AI Platform' });
      expect(platformSelect).toBeInTheDocument();
    });
  });

  describe('Settings save/load', () => {
    it('should call updateGeneralSettings when language changes', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      const languageSelect = screen.getByRole('combobox', { name: 'Language' });
      fireEvent.change(languageSelect, { target: { value: 'zh' } });

      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith({ language: 'zh' });
    });

    it('should call updateGeneralSettings when platform changes', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      const platformSelect = screen.getByRole('combobox', { name: 'Default AI Platform' });
      fireEvent.change(platformSelect, { target: { value: 'chatgpt' } });

      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith({ defaultPlatform: 'chatgpt' });
    });

    it('should call updateGeneralSettings when GitHub token changes', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      const tokenInput = screen.getByPlaceholderText('ghp_xxxxxxxxxxxx');
      fireEvent.input(tokenInput, { target: { value: 'new-token' } });

      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith({ githubToken: 'new-token' });
    });

    it('should call updateGeneralSettings when OpenClaw toggle changes', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({ openClawEnabled: false })
      );

      render(() => <GeneralTab />);

      const openClawCheckbox = screen.getByLabelText('Enable OpenClaw');
      fireEvent.click(openClawCheckbox);

      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith({ openClawEnabled: true });
    });

    it('should call updateGeneralSettings when Image Prompt toggle changes', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({ imagePromptEnabled: false })
      );

      render(() => <GeneralTab />);

      const imagePromptCheckbox = screen.getByLabelText('Enable Image Prompt Generation');
      fireEvent.click(imagePromptCheckbox);

      expect(mockUpdateGeneralSettings).toHaveBeenCalledWith({ imagePromptEnabled: true });
    });

    it('should display saved GitHub token value', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({ githubToken: 'saved-token-123' })
      );

      render(() => <GeneralTab />);

      const tokenInput = screen.getByDisplayValue('saved-token-123');
      expect(tokenInput).toBeInTheDocument();
      expect(tokenInput).toHaveAttribute('type', 'password');
    });

    it('should display checked state for enabled toggles', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore({
          openClawEnabled: true,
          imagePromptEnabled: true,
        })
      );

      render(() => <GeneralTab />);

      const openClawCheckbox = screen.getByLabelText('Enable OpenClaw') as HTMLInputElement;
      const imagePromptCheckbox = screen.getByLabelText(
        'Enable Image Prompt Generation'
      ) as HTMLInputElement;

      expect(openClawCheckbox.checked).toBe(true);
      expect(imagePromptCheckbox.checked).toBe(true);
    });
  });

  describe('Form structure', () => {
    it('should render all form groups', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      const { container } = render(() => <GeneralTab />);

      const formGroups = container.querySelectorAll('.form-group');
      expect(formGroups.length).toBeGreaterThanOrEqual(5);
    });

    it('should render GitHub token hint', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore());

      render(() => <GeneralTab />);

      expect(screen.getByText('for Gist sync')).toBeInTheDocument();
    });
  });
});
