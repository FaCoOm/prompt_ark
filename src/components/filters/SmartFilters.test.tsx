import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { SmartFilters } from '../../entrypoints/sidepanel/components/filters/SmartFilters';

const mockSetSmartFilter = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('@/stores', () => ({
  usePromptStore: vi.fn(),
}));

vi.mock('../../entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

import { usePromptStore } from '@/stores';
import { useUIStore } from '../../entrypoints/sidepanel/stores/uiStore';

describe('SmartFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
    });
  });

  it('should render all filter buttons', () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    expect(screen.getByLabelText('Filter by favorites')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by frequent')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by recent')).toBeInTheDocument();
  });

  it('should activate favorites filter when clicked', async () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const favoritesButton = screen.getByLabelText('Filter by favorites');
    fireEvent.click(favoritesButton);

    await waitFor(() => {
      expect(mockSetSmartFilter).toHaveBeenCalledWith('favorites');
    });
  });

  it('should activate frequent filter when clicked', async () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const frequentButton = screen.getByLabelText('Filter by frequent');
    fireEvent.click(frequentButton);

    await waitFor(() => {
      expect(mockSetSmartFilter).toHaveBeenCalledWith('frequent');
    });
  });

  it('should activate recent filter when clicked', async () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const recentButton = screen.getByLabelText('Filter by recent');
    fireEvent.click(recentButton);

    await waitFor(() => {
      expect(mockSetSmartFilter).toHaveBeenCalledWith('recent');
    });
  });

  it('should deactivate filter when clicking active filter', async () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: 'favorites',
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const favoritesButton = screen.getByLabelText('Filter by favorites');
    fireEvent.click(favoritesButton);

    await waitFor(() => {
      expect(mockSetSmartFilter).toHaveBeenCalledWith(null);
    });
  });

  it('should handle error when setting filter fails', async () => {
    mockSetSmartFilter.mockImplementation(() => {
      throw new Error('Filter activation failed');
    });

    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const favoritesButton = screen.getByLabelText('Filter by favorites');
    fireEvent.click(favoritesButton);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Filter activation failed',
      });
    });
  });

  it('should have correct aria-pressed state for inactive filters', () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: null,
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const favoritesButton = screen.getByLabelText('Filter by favorites');
    expect(favoritesButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('should have correct aria-pressed state for active filter', () => {
    (usePromptStore as any).mockReturnValue({
      activeSmartFilter: 'favorites',
      setSmartFilter: mockSetSmartFilter,
    });

    render(() => <SmartFilters />);

    const favoritesButton = screen.getByLabelText('Filter by favorites');
    expect(favoritesButton.getAttribute('aria-pressed')).toBe('true');
  });
});
