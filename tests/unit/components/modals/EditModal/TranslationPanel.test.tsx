import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { TranslationPanel } from '@/entrypoints/sidepanel/components/modals/EditModal/TranslationPanel';

describe('TranslationPanel', () => {
  const defaultProps = {
    originalContent: 'Hello world',
    onTranslate: vi.fn(),
    onAccept: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders language selector', () => {
    render(() => <TranslationPanel {...defaultProps} />);

    expect(screen.getByText('Target Language')).toBeInTheDocument();
  });

  it('renders all language options', () => {
    render(() => <TranslationPanel {...defaultProps} />);

    const select = document.querySelector('.language-selector') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.options.length).toBe(7);
    expect(select.options[0].text).toContain('EN');
    expect(select.options[1].text).toContain('ZH');
    expect(select.options[2].text).toContain('JP');
  });

  it('selects English by default', () => {
    render(() => <TranslationPanel {...defaultProps} />);

    const select = document.querySelector('.language-selector') as HTMLSelectElement;
    expect(select.value).toBe('EN');
  });

  it('renders translate button', () => {
    render(() => <TranslationPanel {...defaultProps} />);

    expect(screen.getByText('Translate')).toBeInTheDocument();
  });

  it('calls onTranslate when translate button is clicked', async () => {
    const onTranslate = vi.fn().mockResolvedValue('Hola mundo');
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(onTranslate).toHaveBeenCalledWith('Hello world', 'EN');
    });
  });

  it('calls onTranslate with selected language', async () => {
    const onTranslate = vi.fn().mockResolvedValue('Bonjour le monde');
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const select = document.querySelector('.language-selector') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'FR' } });

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(onTranslate).toHaveBeenCalledWith('Hello world', 'FR');
    });
  });

  it('disables translate button when content is empty', () => {
    render(() => <TranslationPanel {...defaultProps} originalContent="" />);

    const translateButton = screen.getByRole('button', { name: /translate/i });
    expect(translateButton).toBeDisabled();
  });

  it('disables translate button when content is whitespace only', () => {
    render(() => <TranslationPanel {...defaultProps} originalContent="   " />);

    const translateButton = screen.getByRole('button', { name: /translate/i });
    expect(translateButton).toBeDisabled();
  });

  it('shows loading state during translation', async () => {
    const onTranslate = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(screen.getAllByText(/translating/i)).toHaveLength(2);
    });
  });

  it('shows progress indicator during translation', async () => {
    const onTranslate = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(document.querySelector('.progress-indicator')).toBeInTheDocument();
    });
  });

  it('displays error when translation fails', async () => {
    const onTranslate = vi.fn().mockRejectedValue(new Error('Translation service error'));
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(screen.getByText('Translation service error')).toBeInTheDocument();
    });
  });

  it('displays error when content is empty', async () => {
    render(() => <TranslationPanel {...defaultProps} originalContent="" />);

    const translateButton = screen.getByRole('button', { name: /translate/i });
    expect(translateButton).toBeDisabled();
  });

  it('shows translation result after success', async () => {
    const onTranslate = vi.fn().mockResolvedValue('Hola mundo');
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(screen.getByText('Translated Result')).toBeInTheDocument();
      expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    });
  });

  it('calls onAccept when accept button is clicked', async () => {
    const onTranslate = vi.fn().mockResolvedValue('Hola mundo');
    const onAccept = vi.fn();
    render(() => (
      <TranslationPanel {...defaultProps} onTranslate={onTranslate} onAccept={onAccept} />
    ));

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith('Hola mundo');
  });

  it('does not show result section while translating', async () => {
    const onTranslate = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(document.querySelector('.progress-indicator')).toBeInTheDocument();
    });

    expect(screen.queryByText('Translated Result')).not.toBeInTheDocument();
  });

  it('disables language selector during translation', async () => {
    const onTranslate = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(() => <TranslationPanel {...defaultProps} onTranslate={onTranslate} />);

    const translateButton = screen.getByText('Translate');
    fireEvent.click(translateButton);

    await waitFor(() => {
      expect(document.querySelector('.progress-indicator')).toBeInTheDocument();
    });

    const select = document.querySelector('.language-selector') as HTMLSelectElement;
    expect(select).toBeDisabled();
  });
});
