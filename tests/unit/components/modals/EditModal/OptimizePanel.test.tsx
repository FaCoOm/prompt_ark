import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { OptimizePanel } from '@/entrypoints/sidepanel/components/modals/EditModal/OptimizePanel';
import type { Provider } from '@/shared/types/provider';

describe('OptimizePanel', () => {
  const mockProviders: Provider[] = [
    {
      id: 'provider1',
      name: 'Provider 1',
      type: 'gemini',
      apiKey: 'key1',
      model: 'gemini-pro',
      enabled: true,
    },
    {
      id: 'provider2',
      name: 'Provider 2',
      type: 'openai',
      apiUrl: 'https://api.openai.com',
      apiKey: 'key2',
      model: 'gpt-4',
      enabled: true,
    },
  ];

  const defaultProps = {
    originalContent: 'Original prompt content',
    providers: mockProviders,
    activeProviderId: 'provider1',
    onOptimize: vi.fn(),
    onAccept: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders provider selector', () => {
    render(() => <OptimizePanel {...defaultProps} />);

    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument();
  });

  it('renders provider options in selector', () => {
    render(() => <OptimizePanel {...defaultProps} />);

    const select = screen.getByLabelText('AI Provider') as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    expect(select.options[0].text).toBe('Provider 1');
    expect(select.options[1].text).toBe('Provider 2');
  });

  it('selects active provider by default', () => {
    render(() => <OptimizePanel {...defaultProps} />);

    const select = screen.getByLabelText('AI Provider') as HTMLSelectElement;
    expect(select.value).toBe('provider1');
  });

  it('selects first provider when no active provider', () => {
    render(() => <OptimizePanel {...defaultProps} activeProviderId={null} />);

    const select = screen.getByLabelText('AI Provider') as HTMLSelectElement;
    expect(select.value).toBe('provider1');
  });

  it('shows "No providers available" when providers list is empty', () => {
    render(() => <OptimizePanel {...defaultProps} providers={[]} />);

    const select = screen.getByLabelText('AI Provider') as HTMLSelectElement;
    expect(select.options[0].text).toBe('No providers available');
  });

  it('renders optimize button', () => {
    render(() => <OptimizePanel {...defaultProps} />);

    expect(screen.getByText('✨ Optimize')).toBeInTheDocument();
  });

  it('calls onOptimize when optimize button is clicked', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized content');
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(onOptimize).toHaveBeenCalledWith('provider1');
    });
  });

  it('disables optimize button when no provider selected', () => {
    render(() => <OptimizePanel {...defaultProps} providers={[]} />);

    const optimizeButton = screen.getByRole('button', { name: /optimize/i });
    expect(optimizeButton).toBeDisabled();
  });

  it('shows loading state during optimization', async () => {
    const onOptimize = vi.fn().mockImplementation(() => new Promise(() => {}));
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText(/optimizing/i)).toBeInTheDocument();
    });
  });

  it('displays error message when optimization fails', async () => {
    const onOptimize = vi.fn().mockRejectedValue(new Error('Optimization failed'));
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Optimization failed')).toBeInTheDocument();
    });
  });

  it('displays comparison view after successful optimization', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized prompt content');
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Optimization Result')).toBeInTheDocument();
    });
  });

  it('shows before and after content in comparison view', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized content');
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  it('calls onAccept when accept button is clicked', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized content');
    const onAccept = vi.fn();
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} onAccept={onAccept} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledWith('Optimized content');
  });

  it('calls onReject when reject button is clicked', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized content');
    const onReject = vi.fn();
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} onReject={onReject} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalled();
  });

  it('returns to controls view after reject', async () => {
    const onOptimize = vi.fn().mockResolvedValue('Optimized content');
    render(() => <OptimizePanel {...defaultProps} onOptimize={onOptimize} />);

    const optimizeButton = screen.getByText('✨ Optimize');
    fireEvent.click(optimizeButton);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText('✨ Optimize')).toBeInTheDocument();
    });
  });
});
