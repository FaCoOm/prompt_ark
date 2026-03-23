import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import {
  YouTubeModal,
  type YouTubeModalProps,
} from '../../../../src/entrypoints/sidepanel/components/modals/YouTubeModal';

describe('YouTubeModal', () => {
  const mockOnClose = vi.fn();
  const mockOnGenerate = vi.fn();
  const mockOnSave = vi.fn();

  const mockGenerateResult = {
    visualDict: [
      { term: 'B-roll', description: 'Supplemental footage' },
      { term: 'Jump cut', description: 'Editing technique' },
    ],
    inspirations: ['Idea 1: Create a tutorial', 'Idea 2: Make a review video'],
    storyboard: [
      { timestamp: '0:00', description: 'Introduction' },
      { timestamp: '1:30', description: 'Main content starts' },
    ],
    template: 'Create a video about {{topic}} using {{style}} approach',
  };

  const defaultProps: YouTubeModalProps = {
    isOpen: true,
    onClose: mockOnClose,
    onGenerate: mockOnGenerate,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnGenerate.mockResolvedValue(mockGenerateResult);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render YouTubeModal with title', () => {
    render(() => <YouTubeModal {...defaultProps} />);

    expect(screen.getByText('YouTube Video Analysis')).toBeInTheDocument();
  });

  describe('Mode Selection', () => {
    it('should render all analysis modes', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      expect(screen.getByText('Style Transfer')).toBeInTheDocument();
      expect(screen.getByText('Full Analysis')).toBeInTheDocument();
      expect(screen.getByText('Inspiration Creation')).toBeInTheDocument();
      expect(screen.getByText('Content Extraction')).toBeInTheDocument();
    });

    it('should have Full Analysis selected by default', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const fullAnalysisBtn = screen.getByText('Full Analysis').closest('.mode-option');
      expect(fullAnalysisBtn).toHaveClass('active');
    });

    it('should select mode on click', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const styleTransferBtn = screen.getByText('Style Transfer');
      fireEvent.click(styleTransferBtn);

      const styleTransferOption = styleTransferBtn.closest('.mode-option');
      expect(styleTransferOption).toHaveClass('active');
    });
  });

  describe('Language Selection', () => {
    it('should render language selector', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      expect(screen.getByLabelText('Target Language')).toBeInTheDocument();
    });

    it('should have English selected by default', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const select = screen.getByLabelText('Target Language') as HTMLSelectElement;
      expect(select.value).toBe('EN');
    });

    it('should change language on selection', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const select = screen.getByLabelText('Target Language');
      fireEvent.change(select, { target: { value: 'ZH' } });

      expect((select as HTMLSelectElement).value).toBe('ZH');
    });

    it('should render all language options', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Chinese')).toBeInTheDocument();
      expect(screen.getByText('Japanese')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
      expect(screen.getByText('French')).toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();
      expect(screen.getByText('Korean')).toBeInTheDocument();
    });
  });

  describe('URL Input', () => {
    it('should render URL input', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      expect(screen.getByLabelText('YouTube URL')).toBeInTheDocument();
    });

    it('should accept YouTube URL input', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      expect((urlInput as HTMLInputElement).value).toBe('https://youtube.com/watch?v=123');
    });

    it('should disable Generate button with invalid URL', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'invalid-url' } });

      const generateBtn = screen.getByText('Generate');
      expect(generateBtn).toBeDisabled();
    });

    it('should enable Generate button with valid YouTube URL', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      expect(generateBtn).not.toBeDisabled();
    });

    it('should accept youtu.be short URLs', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtu.be/abc123' } });

      const generateBtn = screen.getByText('Generate');
      expect(generateBtn).not.toBeDisabled();
    });
  });

  describe('Generate Flow', () => {
    it('should call onGenerate when Generate clicked', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          'https://youtube.com/watch?v=123',
          'full-analysis',
          'EN'
        );
      });
    });

    it('should show loading state during generation', async () => {
      mockOnGenerate.mockImplementation(() => new Promise(() => {}));
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should display error on generation failure', async () => {
      mockOnGenerate.mockRejectedValue(new Error('API Error'));
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    it('should display results after generation', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('Visual Dictionary')).toBeInTheDocument();
        expect(screen.getByText('Inspiration Playground')).toBeInTheDocument();
        expect(screen.getByText('Video Storyboard')).toBeInTheDocument();
        expect(screen.getByText('Prompt Template Preview')).toBeInTheDocument();
      });
    });

    it('should display visual dictionary items', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('B-roll')).toBeInTheDocument();
        expect(screen.getByText('Supplemental footage')).toBeInTheDocument();
      });
    });

    it('should display inspiration tabs', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    });

    it('should switch inspiration tabs', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('#2')).toBeInTheDocument();
      });

      const tab2 = screen.getByText('#2');
      fireEvent.click(tab2);

      const tab2Button = tab2.closest('.inspiration-tab');
      expect(tab2Button).toHaveClass('active');
    });

    it('should display storyboard items', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument();
        expect(screen.getByText('Introduction')).toBeInTheDocument();
        expect(screen.getByText('1:30')).toBeInTheDocument();
      });
    });

    it('should display template with variables', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Create a video about/)).toBeInTheDocument();
      });
    });
  });

  describe('Variable Replacement', () => {
    it('should render variable input fields', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('{{topic}}')).toBeInTheDocument();
        expect(screen.getByText('{{style}}')).toBeInTheDocument();
      });
    });

    it('should update variable values', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter topic...')).toBeInTheDocument();
      });

      const topicInput = screen.getByPlaceholderText('Enter topic...');
      fireEvent.input(topicInput, { target: { value: 'Machine Learning' } });

      expect((topicInput as HTMLInputElement).value).toBe('Machine Learning');
    });
  });

  describe('Save Functionality', () => {
    it('should show Save button after generation', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('Save as Prompt')).toBeInTheDocument();
      });
    });

    it('should call onSave with correct data', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('Save as Prompt')).toBeInTheDocument();
      });

      const saveBtn = screen.getByText('Save as Prompt');
      fireEvent.click(saveBtn);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('YouTube Analysis'),
          content: mockGenerateResult.template,
          category: 'YouTube Analysis',
          tags: expect.arrayContaining(['youtube', 'full-analysis', 'EN']),
          variables: expect.arrayContaining(['topic', 'style']),
        })
      );
    });
  });

  describe('Modal Actions', () => {
    it('should close modal when close button clicked', () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state on close', async () => {
      render(() => <YouTubeModal {...defaultProps} />);

      const urlInput = screen.getByPlaceholderText('https://youtube.com/watch?v=...');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      const generateBtn = screen.getByText('Generate');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('Visual Dictionary')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
