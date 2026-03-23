import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { SearchBar } from '../../entrypoints/sidepanel/components/filters/SearchBar';

const mockSetSearchQuery = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('@/stores', () => ({
  usePromptStore: vi.fn(),
}));

vi.mock('../../entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

import { usePromptStore } from '@/stores';
import { useUIStore } from '../../entrypoints/sidepanel/stores/uiStore';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    (usePromptStore as any).mockReturnValue({
      setSearchQuery: mockSetSearchQuery,
    });
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(() => <SearchBar />);
    expect(screen.getByPlaceholderText('Search prompts...')).toBeInTheDocument();
  });

  it('should debounce search query input', async () => {
    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...');

    fireEvent.input(input, { target: { value: 'test query' } });

    expect(mockSetSearchQuery).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockSetSearchQuery).toHaveBeenCalledWith('test query');
    });
  });

  it('should clear previous debounce timer on rapid input', async () => {
    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...');

    fireEvent.input(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(100);
    fireEvent.input(input, { target: { value: 'test query' } });
    vi.advanceTimersByTime(100);
    fireEvent.input(input, { target: { value: 'final query' } });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockSetSearchQuery).toHaveBeenCalledTimes(1);
      expect(mockSetSearchQuery).toHaveBeenCalledWith('final query');
    });
  });

  it('should show clear button when text is entered', () => {
    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...');

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();

    fireEvent.input(input, { target: { value: 'test' } });

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', async () => {
    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...') as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'test query' } });
    vi.advanceTimersByTime(300);

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });
  });

  it('should clear input value when clear button is clicked', async () => {
    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...') as HTMLInputElement;

    fireEvent.input(input, { target: { value: 'test query' } });

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
  });

  it('should handle error when setting search query fails', async () => {
    mockSetSearchQuery.mockImplementation(() => {
      throw new Error('Search failed');
    });

    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...');

    fireEvent.input(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Search failed',
      });
    });
  });

  it('should handle error when clearing search fails', async () => {
    mockSetSearchQuery.mockImplementation(() => {
      throw new Error('Clear failed');
    });

    render(() => <SearchBar />);
    const input = screen.getByPlaceholderText('Search prompts...');

    fireEvent.input(input, { target: { value: 'test' } });
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Clear failed',
      });
    });
  });
});
