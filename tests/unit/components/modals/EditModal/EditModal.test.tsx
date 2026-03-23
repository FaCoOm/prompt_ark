import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { EditModal } from '@/entrypoints/sidepanel/components/modals/EditModal/EditModal';

const mockCloseModal = vi.fn();
const mockOpenModal = vi.fn();
const mockShowNotification = vi.fn();
const mockAddPrompt = vi.fn();
const mockUpdatePrompt = vi.fn();

vi.mock('@/entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: () => ({
    modals: {
      edit: true,
      import: false,
      history: false,
      share: false,
      youtube: false,
      skillManager: false,
    },
    closeModal: mockCloseModal,
    openModal: mockOpenModal,
    showNotification: mockShowNotification,
    editModalTab: 'basic',
    loading: {},
    notifications: [],
    isSettingsOpen: false,
    setLoading: vi.fn(),
    dismissNotification: vi.fn(),
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    setEditModalTab: vi.fn(),
    toggleModal: vi.fn(),
  }),
}));

vi.mock('@/stores/promptStore', () => ({
  usePromptStore: vi.fn(() => ({
    editingPrompt: null,
    addPrompt: mockAddPrompt,
    updatePrompt: mockUpdatePrompt,
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
    selectedIds: new Set(),
    isPackMode: false,
    loadPrompts: vi.fn(),
    deletePrompt: vi.fn(),
    toggleFavorite: vi.fn(),
    trackUsage: vi.fn(),
    setCategory: vi.fn(),
    setSearchQuery: vi.fn(),
    filterPrompts: vi.fn(),
    setPage: vi.fn(),
    setPageSize: vi.fn(),
    selectPrompt: vi.fn(),
    clearSelection: vi.fn(),
    setPackMode: vi.fn(),
    setSmartFilter: vi.fn(),
    setEditingPrompt: vi.fn(),
  })),
}));

vi.mock('@/shared/api/ai', () => ({
  getProviders: vi.fn().mockResolvedValue([
    {
      id: 'provider1',
      name: 'Provider 1',
      type: 'gemini',
      apiKey: 'key',
      model: 'model',
      enabled: true,
    },
  ]),
  getActiveProvider: vi.fn().mockResolvedValue({
    id: 'provider1',
    name: 'Provider 1',
    type: 'gemini',
    apiKey: 'key',
    model: 'model',
    enabled: true,
  }),
}));

describe('EditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.chrome.runtime.sendMessage as Mock) = vi.fn();
  });

  it('renders modal with title "New Prompt" in create mode', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('New Prompt')).toBeInTheDocument();
    });
  });

  it('renders basic, content, and advanced tabs', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });

  it('starts with basic tab active', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      const basicTab = screen.getByText('Basic');
      expect(basicTab).toHaveClass('active');
    });
  });

  it('switches to content tab when clicked', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    const contentTab = screen.getByText('Content');
    fireEvent.click(contentTab);

    expect(contentTab).toHaveClass('active');
  });

  it('switches to advanced tab when clicked', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });

    const advancedTab = screen.getByText('Advanced');
    fireEvent.click(advancedTab);

    expect(advancedTab).toHaveClass('active');
  });

  it('renders form fields in basic tab', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Shortcut')).toBeInTheDocument();
    });
  });

  it('renders cancel and create buttons in create mode', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });
  });

  it('calls closeModal when cancel is clicked', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockCloseModal).toHaveBeenCalledWith('edit');
  });

  it('shows validation error when title is empty', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Please fix the errors before saving',
      });
    });
  });

  it('shows validation error when content is empty', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'Test Title' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Please fix the errors before saving',
      });
    });
  });

  it('calls addPrompt when creating a new prompt', async () => {
    mockAddPrompt.mockResolvedValue(undefined);

    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'Test Title' } });

    const contentTab = screen.getByText('Content');
    fireEvent.click(contentTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write your prompt content here/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    fireEvent.input(textarea, { target: { value: 'Test content' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockAddPrompt).toHaveBeenCalled();
    });

    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'success',
      message: 'Prompt created successfully',
    });
  });

  it('calls closeModal after successful save', async () => {
    mockAddPrompt.mockResolvedValue(undefined);

    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'Test Title' } });

    const contentTab = screen.getByText('Content');
    fireEvent.click(contentTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write your prompt content here/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    fireEvent.input(textarea, { target: { value: 'Test content' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalledWith('edit');
    });
  });

  it('shows error notification when save fails', async () => {
    mockAddPrompt.mockRejectedValue(new Error('Save failed'));

    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'Test Title' } });

    const contentTab = screen.getByText('Content');
    fireEvent.click(contentTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write your prompt content here/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    fireEvent.input(textarea, { target: { value: 'Test content' } });

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Save failed',
      });
    });
  });

  it('opens history modal when history button is clicked', async () => {
    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    const historyButton = screen.getByText('History');
    fireEvent.click(historyButton);

    expect(mockOpenModal).toHaveBeenCalledWith('history');
  });

  it('extracts variables from content correctly', async () => {
    mockAddPrompt.mockResolvedValue(undefined);

    render(() => <EditModal />);

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('Title');
    fireEvent.input(titleInput, { target: { value: 'Test Title' } });

    const contentTab = screen.getByText('Content');
    fireEvent.click(contentTab);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Write your prompt content here/i)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Write your prompt content here/i);
    fireEvent.input(textarea, { target: { value: 'Hello {{name}} and {{place}}' } });

    const basicTab = screen.getByText('Basic');
    fireEvent.click(basicTab);

    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockAddPrompt).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.arrayContaining(['name', 'place']),
        })
      );
    });
  });
});
