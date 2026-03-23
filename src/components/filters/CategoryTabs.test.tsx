import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { CategoryTabs } from '../../entrypoints/sidepanel/components/filters/CategoryTabs';
import type { Prompt } from '../../shared/types/prompt';

const mockSetCategory = vi.fn();
const mockShowNotification = vi.fn();

const createMockPrompt = (id: string, category: string): Prompt => ({
  id,
  title: `Prompt ${id}`,
  content: 'Test content',
  category,
  tags: [],
  variables: [],
  versions: [],
  usageCount: 0,
  lastUsedAt: null,
  favorite: false,
  createdAt: Date.now(),
});

vi.mock('@/stores', () => ({
  usePromptStore: vi.fn(),
}));

vi.mock('../../entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

import { usePromptStore } from '@/stores';
import { useUIStore } from '../../entrypoints/sidepanel/stores/uiStore';

describe('CategoryTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
    });
  });

  it('should render All tab and unique categories', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [
        createMockPrompt('1', 'Writing'),
        createMockPrompt('2', 'Coding'),
        createMockPrompt('3', 'Writing'),
        createMockPrompt('4', 'Analysis'),
      ],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
  });

  it('should mark All tab as active by default', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    const allTab = screen.getByText('All');
    expect(allTab.classList.contains('active')).toBe(true);
  });

  it('should switch category when tab is clicked', async () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [createMockPrompt('1', 'Writing')],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    const writingTab = screen.getByText('Writing');
    fireEvent.click(writingTab);

    await waitFor(() => {
      expect(mockSetCategory).toHaveBeenCalledWith('Writing');
    });
  });

  it('should pass "all" when All tab is clicked', async () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [],
      selectedCategory: 'Coding',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    const allTab = screen.getByText('All');
    fireEvent.click(allTab);

    await waitFor(() => {
      expect(mockSetCategory).toHaveBeenCalledWith('all');
    });
  });

  it('should sort categories alphabetically', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [
        createMockPrompt('1', 'Writing'),
        createMockPrompt('2', 'Coding'),
        createMockPrompt('3', 'Analysis'),
      ],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    const buttons = screen.getAllByRole('button');
    const texts = buttons.map(b => b.textContent);

    expect(texts).toEqual(['All', 'Analysis', 'Coding', 'Writing']);
  });

  it('should handle error when setting category fails', async () => {
    mockSetCategory.mockImplementation(() => {
      throw new Error('Category change failed');
    });

    (usePromptStore as any).mockReturnValue({
      prompts: [createMockPrompt('1', 'Coding')],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    const codingTab = screen.getByText('Coding');
    fireEvent.click(codingTab);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Category change failed',
      });
    });
  });

  it('should filter out prompts without category', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [
        createMockPrompt('1', 'Writing'),
        { ...createMockPrompt('2', ''), category: '' },
        createMockPrompt('3', 'Coding'),
      ],
      selectedCategory: 'all',
      setCategory: mockSetCategory,
    });

    render(() => <CategoryTabs />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });
});
