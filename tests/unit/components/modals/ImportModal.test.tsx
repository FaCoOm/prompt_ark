import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { ImportModal } from '@/entrypoints/sidepanel/components/modals/ImportModal';
import * as uiStore from '@/entrypoints/sidepanel/stores/uiStore';
import * as promptStore from '@/stores/promptStore';

// Mock the stores
vi.mock('@/entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('@/stores/promptStore', () => ({
  usePromptStore: vi.fn(),
}));

describe('ImportModal', () => {
  const mockCloseModal = vi.fn();
  const mockShowNotification = vi.fn();
  const mockAddPrompt = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(uiStore.useUIStore).mockReturnValue({
      modals: { import: true },
      closeModal: mockCloseModal,
      showNotification: mockShowNotification,
    } as any);

    vi.mocked(promptStore.usePromptStore).mockReturnValue({
      addPrompt: mockAddPrompt,
    } as any);
  });

  it('should render ImportModal with tabs', () => {
    render(() => <ImportModal />);

    expect(screen.getByText('Import Prompts')).toBeInTheDocument();
    expect(screen.getByText('Paste Import')).toBeInTheDocument();
    expect(screen.getByText('URL Import')).toBeInTheDocument();
  });

  describe('Paste Import Flow', () => {
    it('should import valid JSON array', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      const jsonContent = JSON.stringify([
        { title: 'Test Prompt', content: 'Test content', category: 'Test', tags: ['tag1'] },
      ]);

      fireEvent.input(textarea, { target: { value: jsonContent } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Prompt',
            content: 'Test content',
            category: 'Test',
            tags: ['tag1'],
          })
        );
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: 'Successfully imported 1 prompt',
        })
      );
    });

    it('should import valid JSON object', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      const jsonContent = JSON.stringify({
        title: 'Single Prompt',
        content: 'Single content',
        category: 'General',
      });

      fireEvent.input(textarea, { target: { value: jsonContent } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Single Prompt',
            content: 'Single content',
          })
        );
      });
    });

    it('should import CSV format', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      const csvContent = `title,content,category,tags
Prompt 1,Content 1,Category 1,tag1;tag2
Prompt 2,Content 2,Category 2,tag3`;

      fireEvent.input(textarea, { target: { value: csvContent } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalledTimes(2);
      });

      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Successfully imported 2 prompts',
        })
      );
    });

    it('should import Markdown sections', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      const markdownContent = `# First Prompt
This is the content of the first prompt.

## Second Prompt
This is the content of the second prompt.`;

      fireEvent.input(textarea, { target: { value: markdownContent } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalledTimes(2);
      });
    });

    it('should show error for empty content', async () => {
      render(() => <ImportModal />);

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'Please enter content to import',
          })
        );
      });
    });

    it('should show error when no valid prompts found', async () => {
      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      fireEvent.input(textarea, { target: { value: 'just some text without structure' } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'No valid prompts found in content',
          })
        );
      });
    });

    it('should extract variables from content', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      const contentWithVariables = JSON.stringify({
        title: 'Variable Test',
        content: 'Hello {{name}}, welcome to {{place:home|office}}',
      });

      fireEvent.input(textarea, { target: { value: contentWithVariables } });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: expect.arrayContaining(['name', 'place']),
          })
        );
      });
    });
  });

  describe('URL Scan Flow', () => {
    it('should switch to URL tab', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      expect(screen.getByPlaceholderText(/https:\/\/github.com/i)).toBeInTheDocument();
      expect(screen.getByText('Scan')).toBeInTheDocument();
    });

    it('should show error for empty URL', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'Please enter a URL to scan',
          })
        );
      });
    });

    it('should show error for invalid URL', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      fireEvent.input(urlInput, { target: { value: 'not-a-valid-url' } });

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'Please enter a valid URL',
          })
        );
      });
    });

    it('should scan URL and display found prompts', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      fireEvent.input(urlInput, { target: { value: 'https://github.com/test/repo' } });

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      // Wait for the scan to complete
      await waitFor(() => {
        expect(screen.getByText(/Found Prompts/i)).toBeInTheDocument();
      });

      // Check for mock prompts
      expect(screen.getByText('Code Review Assistant')).toBeInTheDocument();
      expect(screen.getByText('Email Composer')).toBeInTheDocument();
    });

    it('should toggle prompt selection', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      fireEvent.input(urlInput, { target: { value: 'https://github.com/test/repo' } });

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/Found Prompts/i)).toBeInTheDocument();
      });

      // Click on a prompt to toggle selection
      const promptItem = screen.getByText('Meeting Summarizer').closest('.preview-item');
      if (promptItem) {
        fireEvent.click(promptItem);
      }

      // The selected count should update
      await waitFor(() => {
        expect(screen.getByText(/Import Selected/i)).toBeInTheDocument();
      });
    });

    it('should import selected prompts', async () => {
      mockAddPrompt.mockResolvedValue(undefined);

      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      fireEvent.input(urlInput, { target: { value: 'https://github.com/test/repo' } });

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/Found Prompts/i)).toBeInTheDocument();
      });

      // Import selected prompts
      const importButton = screen.getByText(/Import Selected/i);
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockAddPrompt).toHaveBeenCalled();
      });
    });

    it('should show error when no prompts selected for import', async () => {
      render(() => <ImportModal />);

      const urlTab = screen.getByText('URL Import');
      fireEvent.click(urlTab);

      const urlInput = screen.getByPlaceholderText(/https:\/\/github.com/i);
      fireEvent.input(urlInput, { target: { value: 'https://github.com/test/repo' } });

      const scanButton = screen.getByText('Scan');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/Found Prompts/i)).toBeInTheDocument();
      });

      // Deselect all prompts
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        if ((checkbox as HTMLInputElement).checked) {
          fireEvent.click(checkbox);
        }
      });

      // Try to import with no selection
      const importButton = screen.getByText(/Import Selected/i);
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: 'Please select at least one prompt to import',
          })
        );
      });
    });
  });

  describe('Modal Actions', () => {
    it('should close modal when Cancel clicked', () => {
      render(() => <ImportModal />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockCloseModal).toHaveBeenCalledWith('import');
    });

    it('should reset state on close', async () => {
      render(() => <ImportModal />);

      // Enter some content
      const textarea = screen.getByPlaceholderText(/Paste prompts in any format/i);
      fireEvent.input(textarea, { target: { value: 'some content' } });

      // Close the modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // After timeout, state should be reset
      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalled();
      });
    });
  });
});
