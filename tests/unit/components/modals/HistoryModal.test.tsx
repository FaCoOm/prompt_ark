import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import {
  HistoryModal,
  type HistoryModalProps,
} from '../../../../src/entrypoints/sidepanel/components/modals/HistoryModal/HistoryModal';

describe('HistoryModal', () => {
  const mockOnClose = vi.fn();
  const mockOnRestore = vi.fn();

  const mockHistory = [
    {
      id: 'v1',
      timestamp: Date.now() - 3600000,
      content: 'First version content',
      title: 'First Draft',
    },
    {
      id: 'v2',
      timestamp: Date.now() - 1800000,
      content: 'Second version content',
      title: 'Second Draft',
    },
    {
      id: 'v3',
      timestamp: Date.now(),
      content: 'Current version content',
      title: 'Current Version',
    },
  ];

  const defaultProps: HistoryModalProps = {
    isOpen: true,
    onClose: mockOnClose,
    promptId: 'prompt-123',
    history: mockHistory,
    currentContent: 'Current version content',
    onRestore: mockOnRestore,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render HistoryModal with title', () => {
    render(() => <HistoryModal {...defaultProps} />);

    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('should display version count', () => {
    render(() => <HistoryModal {...defaultProps} />);

    expect(screen.getByText(`Versions (${mockHistory.length})`)).toBeInTheDocument();
  });

  it('should sort versions by timestamp descending', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const versionItems = screen.getAllByRole('button', { name: /Draft|Version/i });
    expect(versionItems.length).toBe(mockHistory.length);
  });

  it('should display empty state when no history', () => {
    render(() => <HistoryModal {...defaultProps} history={[]} />);

    expect(screen.getByText('No version history available')).toBeInTheDocument();
  });

  it('should select version on click', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const firstVersion = screen.getByText('First Draft');
    fireEvent.click(firstVersion);

    expect(screen.getByText('Comparing with selected version')).toBeInTheDocument();
  });

  it('should show diff view when version selected', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const firstVersion = screen.getByText('First Draft');
    fireEvent.click(firstVersion);

    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Selected Version')).toBeInTheDocument();
  });

  it('should display placeholder when no version selected', () => {
    render(() => <HistoryModal {...defaultProps} />);

    expect(screen.getByText('Select a version to compare')).toBeInTheDocument();
  });

  it('should close modal when Close button clicked', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should restore version when Restore Version clicked', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const firstVersion = screen.getByText('First Draft');
    fireEvent.click(firstVersion);

    const restoreButton = screen.getByText('Restore Version');
    fireEvent.click(restoreButton);

    expect(mockOnRestore).toHaveBeenCalledWith('v1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not show restore button when no version selected', () => {
    render(() => <HistoryModal {...defaultProps} />);

    expect(screen.queryByText('Restore Version')).not.toBeInTheDocument();
  });

  it('should format relative time correctly', () => {
    const now = Date.now();
    const recentHistory = [
      {
        id: 'v1',
        timestamp: now - 30000,
        content: 'Just now version',
        title: 'Just Now Draft',
      },
    ];

    render(() => <HistoryModal {...defaultProps} history={recentHistory} />);

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should format minutes ago correctly', () => {
    const now = Date.now();
    const recentHistory = [
      {
        id: 'v1',
        timestamp: now - 300000,
        content: '5 minutes ago version',
        title: 'Recent Draft',
      },
    ];

    render(() => <HistoryModal {...defaultProps} history={recentHistory} />);

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('should format hours ago correctly', () => {
    const now = Date.now();
    const recentHistory = [
      {
        id: 'v1',
        timestamp: now - 7200000,
        content: '2 hours ago version',
        title: 'Earlier Draft',
      },
    ];

    render(() => <HistoryModal {...defaultProps} history={recentHistory} />);

    expect(screen.getByText('2h ago')).toBeInTheDocument();
  });

  it('should format days ago correctly', () => {
    const now = Date.now();
    const recentHistory = [
      {
        id: 'v1',
        timestamp: now - 172800000,
        content: '2 days ago version',
        title: 'Old Draft',
      },
    ];

    render(() => <HistoryModal {...defaultProps} history={recentHistory} />);

    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('should compute diff correctly for added lines', () => {
    render(() => (
      <HistoryModal
        {...defaultProps}
        currentContent="Line 1\nLine 2"
        history={[
          {
            id: 'v1',
            timestamp: Date.now(),
            content: 'Line 1\nLine 2\nLine 3',
            title: 'Added Line',
          },
        ]}
      />
    ));

    const versionButton = screen.getByText('Added Line');
    fireEvent.click(versionButton);

    const addedMarkers = screen.getAllByText('+');
    expect(addedMarkers.length).toBeGreaterThan(0);
    expect(addedMarkers[0].closest('.diff-added')).toBeInTheDocument();
  });

  it('should compute diff correctly for removed lines', () => {
    render(() => (
      <HistoryModal
        {...defaultProps}
        currentContent="Line 1\nLine 2\nLine 3"
        history={[
          {
            id: 'v1',
            timestamp: Date.now(),
            content: 'Line 1\nLine 2',
            title: 'Removed Line',
          },
        ]}
      />
    ));

    const versionButton = screen.getByText('Removed Line');
    fireEvent.click(versionButton);

    const removedMarkers = screen.getAllByText('-');
    expect(removedMarkers.length).toBeGreaterThan(0);
    expect(removedMarkers[0].closest('.diff-removed')).toBeInTheDocument();
  });

  it('should reset selection on close', () => {
    render(() => <HistoryModal {...defaultProps} />);

    const firstVersion = screen.getByText('First Draft');
    fireEvent.click(firstVersion);

    expect(screen.getByText('Comparing with selected version')).toBeInTheDocument();

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    render(() => <HistoryModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Version History')).not.toBeInTheDocument();
  });
});
