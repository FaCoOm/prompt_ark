import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { ModelsTab } from '../../../../src/entrypoints/sidepanel/components/settings/ModelsTab';
import type { Provider } from '../../../../src/shared/types/provider';

const mockAddProvider = vi.fn();
const mockUpdateProvider = vi.fn();
const mockRemoveProvider = vi.fn();
const mockUpdateModelSettings = vi.fn();

const createMockSettingsStore = (providers: Provider[] = [], visionModel = '') => ({
  general: {
    language: 'en' as const,
    defaultPlatform: '',
    githubToken: '',
    openClawEnabled: false,
    imagePromptEnabled: false,
  },
  models: {
    providers,
    activeProviderId: null,
    visionModel,
  },
  sync: {
    engine: 'local' as const,
    settings: {},
    lastSyncTime: null,
  },
  activeTab: 'models' as const,
  isLoading: false,
  error: null,
  loadSettings: vi.fn(),
  saveSettings: vi.fn(),
  addProvider: mockAddProvider,
  updateProvider: mockUpdateProvider,
  removeProvider: mockRemoveProvider,
  testConnection: vi.fn(),
  forceSync: vi.fn(),
  setActiveTab: vi.fn(),
  updateGeneralSettings: vi.fn(),
  updateSyncSettings: vi.fn(),
  updateModelSettings: mockUpdateModelSettings,
});

const mockOpenAIProvider: Provider = {
  id: 'provider-1',
  name: 'Test OpenAI',
  type: 'openai',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  apiKey: 'sk-test',
  model: 'gpt-4',
  enabled: true,
};

const mockGeminiProvider: Provider = {
  id: 'provider-2',
  name: 'Test Gemini',
  type: 'gemini',
  apiKey: 'gemini-test',
  model: 'gemini-pro',
  enabled: true,
};

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

const mockConfirm = vi.fn(() => true);
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

import { useSettingsStore } from '../../../../src/stores/settingsStore';

describe('ModelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider list rendering', () => {
    it('should render empty state when no providers', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      expect(screen.getByText('No providers configured')).toBeInTheDocument();
      expect(screen.getByText('Add a provider to use AI features')).toBeInTheDocument();
    });

    it('should render provider list when providers exist', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([mockOpenAIProvider]));

      render(() => <ModelsTab />);

      expect(screen.getByText('Test OpenAI')).toBeInTheDocument();
      expect(screen.getByText('OpenAI Compatible')).toBeInTheDocument();
      expect(screen.getByText('gpt-4')).toBeInTheDocument();
    });

    it('should render multiple providers', () => {
      (useSettingsStore as any).mockReturnValue(
        createMockSettingsStore([mockOpenAIProvider, mockGeminiProvider])
      );

      render(() => <ModelsTab />);

      expect(screen.getByText('Test OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Test Gemini')).toBeInTheDocument();
    });

    it('should render Gemini API label for gemini provider', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([mockGeminiProvider]));

      render(() => <ModelsTab />);

      expect(screen.getByText('Gemini API')).toBeInTheDocument();
    });
  });

  describe('Provider CRUD operations', () => {
    it('should open add provider modal when Add Provider button is clicked', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      const addButton = screen.getByRole('button', { name: /Add Provider/i });
      fireEvent.click(addButton);

      expect(screen.getByRole('heading', { name: 'Add Provider' })).toBeInTheDocument();
    });

    it('should render provider form fields in modal', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      const addButton = screen.getByRole('button', { name: /Add Provider/i });
      fireEvent.click(addButton);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Provider' })).toBeInTheDocument();
    });

    it('should open edit modal when edit button is clicked', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([mockOpenAIProvider]));

      render(() => <ModelsTab />);

      const editButton = screen.getByTitle('Edit');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Provider')).toBeInTheDocument();
    });

    it('should call addProvider when saving new provider', async () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      const nameInput = screen.getByPlaceholderText('e.g., My OpenAI Provider');
      fireEvent.input(nameInput, { target: { value: 'New Provider' } });

      const saveButton = screen.getAllByRole('button').find(b => b.textContent === 'Add Provider');
      fireEvent.click(saveButton!);

      expect(mockAddProvider).toHaveBeenCalled();
    });

    it('should call removeProvider when delete button is clicked', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([mockOpenAIProvider]));

      render(() => <ModelsTab />);

      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);

      expect(mockRemoveProvider).toHaveBeenCalledWith('provider-1');
    });

    it('should not call removeProvider if confirm is cancelled', () => {
      mockConfirm.mockReturnValueOnce(false);
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([mockOpenAIProvider]));

      render(() => <ModelsTab />);

      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);

      expect(mockRemoveProvider).not.toHaveBeenCalled();
    });
  });

  describe('Provider form types', () => {
    it('should show API URL field for OpenAI type', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      expect(screen.getByText('API URL')).toBeInTheDocument();
    });

    it('should show API Key field for OpenAI type', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      expect(screen.getByText('API Key')).toBeInTheDocument();
    });

    it('should show Model field for OpenAI type', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      expect(screen.getByText('Model')).toBeInTheDocument();
    });

    it('should allow selecting Gemini Web type', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      const typeSelect = screen.getByRole('combobox');
      expect(typeSelect).toBeInTheDocument();
    });
  });

  describe('Vision Model section', () => {
    it('should render Vision Model section', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      expect(screen.getByText('Vision Model')).toBeInTheDocument();
      expect(screen.getByText('Default Vision Model')).toBeInTheDocument();
    });

    it('should render vision model input with placeholder', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      expect(screen.getByPlaceholderText('e.g., gemini-pro-vision')).toBeInTheDocument();
    });

    it('should call updateModelSettings when vision model changes', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      const visionInput = screen.getByPlaceholderText('e.g., gemini-pro-vision');
      fireEvent.input(visionInput, { target: { value: 'new-vision-model' } });

      expect(mockUpdateModelSettings).toHaveBeenCalledWith({ visionModel: 'new-vision-model' });
    });

    it('should display saved vision model value', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([], 'saved-vision-model'));

      render(() => <ModelsTab />);

      expect(screen.getByDisplayValue('saved-vision-model')).toBeInTheDocument();
    });
  });

  describe('Modal interactions', () => {
    it('should close modal when Cancel is clicked', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));
      expect(screen.getByRole('heading', { name: 'Add Provider' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('heading', { name: 'Add Provider' })).not.toBeInTheDocument();
    });

    it('should render provider type options in select', () => {
      (useSettingsStore as any).mockReturnValue(createMockSettingsStore([]));

      render(() => <ModelsTab />);

      fireEvent.click(screen.getByRole('button', { name: /Add Provider/i }));

      const typeSelect = screen.getByRole('combobox');
      expect(typeSelect).toHaveValue('openai');
    });
  });
});
