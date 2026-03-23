import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { Pagination } from '../../entrypoints/sidepanel/components/prompts/Pagination';

const mockSetPage = vi.fn();
const mockSetPageSize = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('@/stores', () => ({
  usePromptStore: vi.fn(),
}));

vi.mock('../../entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

import { usePromptStore } from '@/stores';
import { useUIStore } from '../../entrypoints/sidepanel/stores/uiStore';

describe('Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
    });
  });

  it('should render pagination info', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('should disable previous button on first page', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const prevButton = screen.getByTitle('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 5,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const nextButton = screen.getByTitle('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('should enable both buttons on middle page', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 3,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    expect(screen.getByTitle('Previous page')).not.toBeDisabled();
    expect(screen.getByTitle('Next page')).not.toBeDisabled();
  });

  it('should navigate to previous page when clicking previous button', async () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 3,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const prevButton = screen.getByTitle('Previous page');
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(mockSetPage).toHaveBeenCalledWith(2);
    });
  });

  it('should navigate to next page when clicking next button', async () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 3,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const nextButton = screen.getByTitle('Next page');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockSetPage).toHaveBeenCalledWith(4);
    });
  });

  it('should not navigate when clicking disabled previous button', async () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const prevButton = screen.getByTitle('Previous page');
    fireEvent.click(prevButton);

    expect(mockSetPage).not.toHaveBeenCalled();
  });

  it('should not navigate when clicking disabled next button', async () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 5,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const nextButton = screen.getByTitle('Next page');
    fireEvent.click(nextButton);

    expect(mockSetPage).not.toHaveBeenCalled();
  });

  it('should render page size options', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const select = screen.getByLabelText('Show:');
    expect(select).toBeInTheDocument();
  });

  it('should change page size when selecting different option', async () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const select = screen.getByLabelText('Show:');
    fireEvent.change(select, { target: { value: '50' } });

    await waitFor(() => {
      expect(mockSetPageSize).toHaveBeenCalledWith(50);
    });
  });

  it('should handle error when navigating page fails', async () => {
    mockSetPage.mockImplementation(() => {
      throw new Error('Page navigation failed');
    });

    (usePromptStore as any).mockReturnValue({
      currentPage: 3,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const nextButton = screen.getByTitle('Next page');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Page navigation failed',
      });
    });
  });

  it('should handle error when changing page size fails', async () => {
    mockSetPageSize.mockImplementation(() => {
      throw new Error('Page size change failed');
    });

    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const select = screen.getByLabelText('Show:');
    fireEvent.change(select, { target: { value: '50' } });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Page size change failed',
      });
    });
  });

  it('should display all page size options', () => {
    (usePromptStore as any).mockReturnValue({
      currentPage: 1,
      pageSize: 20,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
    });

    render(() => <Pagination totalPages={5} />);

    const select = screen.getByLabelText('Show:');
    const options = select.querySelectorAll('option');
    const values = Array.from(options).map(opt => opt.value);

    expect(values).toEqual(['10', '20', '50', '100']);
  });
});
