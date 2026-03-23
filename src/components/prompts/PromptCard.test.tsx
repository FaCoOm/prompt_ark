import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { PromptCard } from '../../entrypoints/sidepanel/components/prompts/PromptCard';
import type { Prompt } from '../../shared/types/prompt';
import { usePromptStore } from '@/stores';
import { useUIStore } from '../../entrypoints/sidepanel/stores/uiStore';

const mockToggleFavorite = vi.fn();
const mockSetEditingPrompt = vi.fn();
const mockTrackUsage = vi.fn();
const mockDeletePrompt = vi.fn();
const mockShowNotification = vi.fn();
const mockOpenModal = vi.fn();
const mockSetEditModalTab = vi.fn();

const createMockPrompt = (overrides: Partial<Prompt> = {}): Prompt => ({
  id: 'test-prompt-1',
  title: 'Test Prompt',
  content: 'This is a test prompt with {{variable}}',
  category: 'Test',
  tags: ['tag1', 'tag2'],
  variables: ['variable'],
  versions: [],
  usageCount: 5,
  lastUsedAt: Date.now(),
  favorite: false,
  createdAt: Date.now(),
  ...overrides,
});

const mockBrowser = {
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
};

Object.defineProperty(global, 'browser', {
  value: mockBrowser,
  writable: true,
});

describe('PromptCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowser.tabs.query.mockResolvedValue([{ id: 123 }]);
    mockBrowser.tabs.sendMessage.mockResolvedValue({});
    (usePromptStore as any).mockReturnValue({
      toggleFavorite: mockToggleFavorite,
      setEditingPrompt: mockSetEditingPrompt,
      trackUsage: mockTrackUsage,
      deletePrompt: mockDeletePrompt,
      selectedIds: new Set(),
    });
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
      openModal: mockOpenModal,
      setEditModalTab: mockSetEditModalTab,
    });
  });

  it('should render prompt title and category', () => {
    const prompt = createMockPrompt();
    render(() => <PromptCard prompt={prompt} />);

    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  describe('Button 1: Favorite', () => {
    it('should toggle favorite when favorite button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const favoriteButton = screen.getByTitle('Add to favorites');
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(mockToggleFavorite).toHaveBeenCalledWith('test-prompt-1');
      });
    });

    it('should show remove from favorites when already favorited', () => {
      const prompt = createMockPrompt({ favorite: true });
      render(() => <PromptCard prompt={prompt} />);

      expect(screen.getByTitle('Remove from favorites')).toBeInTheDocument();
    });
  });

  describe('Button 2: Share', () => {
    it('should open share modal when share button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const shareButton = screen.getByTitle('Share prompt');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockSetEditingPrompt).toHaveBeenCalledWith(prompt);
        expect(mockOpenModal).toHaveBeenCalledWith('share');
      });
    });
  });

  describe('Button 3: Skill Toggle', () => {
    it('should toggle skill when skill button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const skillButton = screen.getByTitle('Activate skill');
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'info',
          message: 'Skill activated',
        });
      });
    });

    it('should deactivate skill when clicking active skill button', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const skillButton = screen.getByTitle('Activate skill');
      fireEvent.click(skillButton);
      fireEvent.click(skillButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenLastCalledWith({
          type: 'info',
          message: 'Skill deactivated',
        });
      });
    });
  });

  describe('Button 4: Insert', () => {
    it('should insert prompt when insert button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const insertButton = screen.getByTitle('Insert to webpage');
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(mockBrowser.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
        expect(mockBrowser.tabs.sendMessage).toHaveBeenCalledWith(123, {
          type: 'INSERT_PROMPT',
          prompt,
        });
      });
    });

    it('should track usage after insert', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const insertButton = screen.getByTitle('Insert to webpage');
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(mockTrackUsage).toHaveBeenCalledWith('test-prompt-1');
      });
    });

    it('should call onInsert prop when provided', async () => {
      const prompt = createMockPrompt();
      const onInsert = vi.fn();
      render(() => <PromptCard prompt={prompt} onInsert={onInsert} />);

      const insertButton = screen.getByTitle('Insert to webpage');
      fireEvent.click(insertButton);

      await waitFor(() => {
        expect(onInsert).toHaveBeenCalledWith(prompt);
      });
    });
  });

  describe('Button 5: Edit', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const editButton = screen.getByTitle('Edit prompt');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(mockSetEditingPrompt).toHaveBeenCalledWith(prompt);
        expect(mockOpenModal).toHaveBeenCalledWith('edit');
      });
    });
  });

  describe('Button 6: Copy', () => {
    it('should copy content when copy button is clicked', async () => {
      const prompt = createMockPrompt();
      const mockClipboard = { writeText: vi.fn() };
      Object.defineProperty(global, 'navigator', {
        value: { clipboard: mockClipboard },
        writable: true,
      });

      render(() => <PromptCard prompt={prompt} />);

      const copyButton = screen.getByTitle('Copy content');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(prompt.content);
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Copied to clipboard',
        });
      });
    });
  });

  describe('Button 7: Translate', () => {
    it('should open translation panel when translate button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const translateButton = screen.getByTitle('Translate prompt');
      fireEvent.click(translateButton);

      await waitFor(() => {
        expect(mockSetEditingPrompt).toHaveBeenCalledWith(prompt);
        expect(mockOpenModal).toHaveBeenCalledWith('edit');
        expect(mockSetEditModalTab).toHaveBeenCalledWith('advanced');
      });
    });
  });

  describe('Button 8: Delete', () => {
    it('should delete prompt when delete is confirmed', async () => {
      const prompt = createMockPrompt();
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(() => <PromptCard prompt={prompt} />);

      const deleteButton = screen.getByTitle('Delete prompt');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeletePrompt).toHaveBeenCalledWith('test-prompt-1');
        expect(mockShowNotification).toHaveBeenCalledWith({
          type: 'success',
          message: 'Prompt deleted',
        });
      });
    });

    it('should not delete when confirm is cancelled', async () => {
      const prompt = createMockPrompt();
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(() => <PromptCard prompt={prompt} />);

      const deleteButton = screen.getByTitle('Delete prompt');
      fireEvent.click(deleteButton);

      expect(mockDeletePrompt).not.toHaveBeenCalled();
    });
  });

  describe('Button 9: Pack Select', () => {
    it('should select prompt when pack select button is clicked', async () => {
      const prompt = createMockPrompt();
      const onSelect = vi.fn();

      render(() => <PromptCard prompt={prompt} isPackMode={true} onSelect={onSelect} />);

      const selectButton = screen.getByTitle('Select for pack');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith('test-prompt-1');
      });
    });

    it('should show deselect when already selected', () => {
      const prompt = createMockPrompt();

      render(() => <PromptCard prompt={prompt} isPackMode={true} isSelected={true} />);

      expect(screen.getByTitle('Deselect')).toBeInTheDocument();
    });
  });

  describe('Button 10: Preview Toggle', () => {
    it('should toggle preview when preview button is clicked', async () => {
      const prompt = createMockPrompt({ content: '# Markdown Content' });
      render(() => <PromptCard prompt={prompt} />);

      const previewButton = screen.getByTitle('Show preview');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByTitle('Hide preview')).toBeInTheDocument();
      });
    });
  });

  describe('Button 11: History', () => {
    it('should open history modal when history button is clicked', async () => {
      const prompt = createMockPrompt();
      render(() => <PromptCard prompt={prompt} />);

      const historyButton = screen.getByTitle('View history');
      fireEvent.click(historyButton);

      await waitFor(() => {
        expect(mockSetEditingPrompt).toHaveBeenCalledWith(prompt);
        expect(mockOpenModal).toHaveBeenCalledWith('history');
      });
    });
  });

  it('should display usage count', () => {
    const prompt = createMockPrompt({ usageCount: 42 });
    render(() => <PromptCard prompt={prompt} />);

    expect(screen.getByText('42 uses')).toBeInTheDocument();
  });

  it('should display quality score', () => {
    const prompt = createMockPrompt({ usageCount: 25 });
    render(() => <PromptCard prompt={prompt} />);

    expect(screen.getByText('★ 85')).toBeInTheDocument();
  });

  it('should display variables count', () => {
    const prompt = createMockPrompt({ content: 'Hello {{name}} from {{place}}' });
    render(() => <PromptCard prompt={prompt} />);

    expect(screen.getByText('2 vars')).toBeInTheDocument();
  });

  it('should display tags', () => {
    const prompt = createMockPrompt({ tags: ['tag1', 'tag2', 'tag3'] });
    render(() => <PromptCard prompt={prompt} />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
  });
});
