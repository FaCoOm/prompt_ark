import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import {
  SharePanel,
  type SharePanelProps,
} from '../../../../src/entrypoints/sidepanel/components/modals/SharePanel/SharePanel';
import type { Prompt } from '../../../../src/shared/types/prompt';

describe('SharePanel', () => {
  const mockOnCopyLink = vi.fn();
  const mockOnCopyJSON = vi.fn();

  const mockPrompt: Prompt = {
    id: 'prompt-123',
    title: 'Test Prompt',
    content: 'This is a test prompt with {{variable}}',
    category: 'Testing',
    tags: ['test', 'example'],
    variables: ['variable'],
    versions: [],
    usageCount: 5,
    lastUsedAt: Date.now(),
    favorite: false,
    createdAt: Date.now(),
    shortcut: '/test',
  };

  const defaultProps: SharePanelProps = {
    prompt: mockPrompt,
    onCopyLink: mockOnCopyLink,
    onCopyJSON: mockOnCopyJSON,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    global.window.open = vi.fn();
  });

  it('should render SharePanel with all share options', () => {
    render(() => <SharePanel {...defaultProps} />);

    expect(screen.getByText('Publish to Hub')).toBeInTheDocument();
    expect(screen.getByText('Twitter/X')).toBeInTheDocument();
    expect(screen.getByText('Reddit')).toBeInTheDocument();
    expect(screen.getByText('知乎')).toBeInTheDocument();
    expect(screen.getByText('微信')).toBeInTheDocument();
    expect(screen.getByText('小红书')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Copy JSON')).toBeInTheDocument();
  });

  describe('Share Generation', () => {
    it('should open Hub publish page', () => {
      render(() => <SharePanel {...defaultProps} />);

      const hubButton = screen.getByText('Publish to Hub');
      fireEvent.click(hubButton);

      expect(window.open).toHaveBeenCalledWith(
        'https://prompt-ark.hub/publish?promptId=prompt-123',
        '_blank'
      );
    });

    it('should open Twitter share', () => {
      render(() => <SharePanel {...defaultProps} />);

      const twitterButton = screen.getByText('Twitter/X');
      fireEvent.click(twitterButton);

      expect(window.open).toHaveBeenCalled();
      const mockedOpen = window.open as ReturnType<typeof vi.fn>;
      const callArg = mockedOpen.mock.calls[0][0];
      expect(callArg).toContain('twitter.com/intent/tweet');
      expect(callArg).toContain(encodeURIComponent('Test Prompt'));
    });

    it('should open Reddit share', () => {
      render(() => <SharePanel {...defaultProps} />);

      const redditButton = screen.getByText('Reddit');
      fireEvent.click(redditButton);

      expect(window.open).toHaveBeenCalled();
      const mockedOpen = window.open as ReturnType<typeof vi.fn>;
      const callArg = mockedOpen.mock.calls[0][0];
      expect(callArg).toContain('reddit.com/submit');
    });

    it('should open Zhihu share', () => {
      render(() => <SharePanel {...defaultProps} />);

      const zhihuButton = screen.getByText('知乎');
      fireEvent.click(zhihuButton);

      expect(window.open).toHaveBeenCalled();
      const mockedOpen = window.open as ReturnType<typeof vi.fn>;
      const callArg = mockedOpen.mock.calls[0][0];
      expect(callArg).toContain('zhihu.com');
    });

    it('should copy to clipboard for WeChat', async () => {
      global.alert = vi.fn();
      render(() => <SharePanel {...defaultProps} />);

      const wechatButton = screen.getByText('微信');
      fireEvent.click(wechatButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should copy to clipboard for Xiaohongshu', async () => {
      global.alert = vi.fn();
      render(() => <SharePanel {...defaultProps} />);

      const xhsButton = screen.getByText('小红书');
      fireEvent.click(xhsButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should open LinkedIn share', () => {
      render(() => <SharePanel {...defaultProps} />);

      const linkedinButton = screen.getByText('LinkedIn');
      fireEvent.click(linkedinButton);

      expect(window.open).toHaveBeenCalled();
      const mockedOpen = window.open as ReturnType<typeof vi.fn>;
      const callArg = mockedOpen.mock.calls[0][0];
      expect(callArg).toContain('linkedin.com');
    });
  });

  describe('Copy to Clipboard', () => {
    it('should copy link to clipboard', async () => {
      render(() => <SharePanel {...defaultProps} />);

      const copyLinkButton = screen.getByText('Copy Link');
      fireEvent.click(copyLinkButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('/prompt/prompt-123')
        );
      });

      expect(mockOnCopyLink).toHaveBeenCalled();
    });

    it('should copy JSON to clipboard', async () => {
      render(() => <SharePanel {...defaultProps} />);

      const copyJsonButton = screen.getByText('Copy JSON');
      fireEvent.click(copyJsonButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });

      const mockedClipboard = navigator.clipboard.writeText as ReturnType<typeof vi.fn>;
      const clipboardCall = mockedClipboard.mock.calls[0][0];
      const parsedJson = JSON.parse(clipboardCall);
      expect(parsedJson).toMatchObject({
        id: 'prompt-123',
        title: 'Test Prompt',
        content: 'This is a test prompt with {{variable}}',
        category: 'Testing',
        tags: ['test', 'example'],
        shortcut: '/test',
        variables: ['variable'],
      });

      expect(mockOnCopyJSON).toHaveBeenCalled();
    });

    it('should handle truncated content in share text', () => {
      const longContentPrompt: Prompt = {
        ...mockPrompt,
        content: 'A'.repeat(300),
      };

      render(() => <SharePanel {...defaultProps} prompt={longContentPrompt} />);

      const twitterButton = screen.getByText('Twitter/X');
      fireEvent.click(twitterButton);

      expect(window.open).toHaveBeenCalled();
      const mockedOpen = window.open as ReturnType<typeof vi.fn>;
      const callArg = mockedOpen.mock.calls[0][0];
      expect(callArg).toContain('...');
    });
  });

  describe('Button Titles', () => {
    it('should have correct title attributes', () => {
      render(() => <SharePanel {...defaultProps} />);

      expect(screen.getByTitle('Publish to Prompt Ark Hub')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Twitter/X')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Reddit')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Zhihu')).toBeInTheDocument();
      expect(screen.getByTitle('Share on WeChat')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Xiaohongshu')).toBeInTheDocument();
      expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByTitle('Copy Link')).toBeInTheDocument();
      expect(screen.getByTitle('Copy JSON')).toBeInTheDocument();
    });
  });
});
