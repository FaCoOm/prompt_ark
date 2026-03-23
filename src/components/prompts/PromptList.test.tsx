import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { PromptList } from '../../entrypoints/sidepanel/components/prompts/PromptList';
import type { Prompt } from '../../shared/types/prompt';

const mockSelectPrompt = vi.fn();
const mockShowNotification = vi.fn();

const createMockPrompt = (id: string, title: string): Prompt => ({
  id,
  title,
  content: `Content for ${title}`,
  category: 'Test',
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
import { fireEvent } from '@solidjs/testing-library';

describe('PromptList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useUIStore as any).mockReturnValue({
      showNotification: mockShowNotification,
    });
  });

  it('should render loading state when isLoading is true', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [],
      filteredPrompts: [],
      isLoading: true,
      totalCount: 0,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.getByText('Loading prompts...')).toBeInTheDocument();
  });

  it('should render empty state when no prompts', () => {
    (usePromptStore as any).mockReturnValue({
      prompts: [],
      filteredPrompts: [],
      isLoading: false,
      totalCount: 0,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.getByText('No prompts found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search or filters/)).toBeInTheDocument();
  });

  it('should render list of prompts', () => {
    const prompts = [
      createMockPrompt('1', 'Prompt One'),
      createMockPrompt('2', 'Prompt Two'),
      createMockPrompt('3', 'Prompt Three'),
    ];
    (usePromptStore as any).mockReturnValue({
      prompts,
      filteredPrompts: prompts,
      isLoading: false,
      totalCount: 3,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.getByText('Prompt One')).toBeInTheDocument();
    expect(screen.getByText('Prompt Two')).toBeInTheDocument();
    expect(screen.getByText('Prompt Three')).toBeInTheDocument();
  });

  it('should render pagination when total pages is greater than 1', () => {
    const prompts = Array.from({ length: 25 }, (_, i) =>
      createMockPrompt(String(i + 1), `Prompt ${i + 1}`)
    );
    (usePromptStore as any).mockReturnValue({
      prompts,
      filteredPrompts: prompts.slice(0, 20),
      isLoading: false,
      totalCount: 25,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
  });

  it('should not render pagination when total pages is 1', () => {
    const prompts = [createMockPrompt('1', 'Prompt One'), createMockPrompt('2', 'Prompt Two')];
    (usePromptStore as any).mockReturnValue({
      prompts,
      filteredPrompts: prompts,
      isLoading: false,
      totalCount: 2,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
  });

  it('should handle error when selecting prompt fails', async () => {
    mockSelectPrompt.mockImplementation(() => {
      throw new Error('Selection failed');
    });

    const prompts = [createMockPrompt('1', 'Prompt One')];
    (usePromptStore as any).mockReturnValue({
      prompts,
      filteredPrompts: prompts,
      isLoading: false,
      totalCount: 1,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    const { container } = render(() => <PromptList />);
    const promptItem = container.querySelector('[data-prompt-id="1"]');

    if (promptItem) {
      const title = promptItem.querySelector('.prompt-title');
      if (title) {
        fireEvent.click(title);
      }
    }

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Selection failed',
      });
    });
  });

  it('should render in pack mode', () => {
    const prompts = [createMockPrompt('1', 'Prompt One'), createMockPrompt('2', 'Prompt Two')];
    (usePromptStore as any).mockReturnValue({
      prompts,
      filteredPrompts: prompts,
      isLoading: false,
      totalCount: 2,
      pageSize: 20,
      currentPage: 1,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList isPackMode={true} />);

    expect(screen.getByText('Prompt One')).toBeInTheDocument();
    expect(screen.getByText('Prompt Two')).toBeInTheDocument();
  });

  it('should display correct pagination info for multiple pages', () => {
    const allPrompts = Array.from({ length: 50 }, (_, i) =>
      createMockPrompt(String(i + 1), `Prompt ${i + 1}`)
    );
    (usePromptStore as any).mockReturnValue({
      prompts: allPrompts,
      filteredPrompts: allPrompts.slice(20, 40),
      isLoading: false,
      totalCount: 50,
      pageSize: 20,
      currentPage: 2,
      selectedIds: new Set(),
      selectPrompt: mockSelectPrompt,
    });

    render(() => <PromptList />);

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });
});
