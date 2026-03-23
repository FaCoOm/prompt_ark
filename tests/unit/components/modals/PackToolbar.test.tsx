import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import {
  PackToolbar,
  type PackToolbarProps,
} from '../../../../src/entrypoints/sidepanel/components/modals/PackToolbar';

describe('PackToolbar', () => {
  const mockOnTogglePackMode = vi.fn();
  const mockOnPackTitleChange = vi.fn();
  const mockOnSharePack = vi.fn();

  const defaultProps: PackToolbarProps = {
    isPackMode: false,
    selectedCount: 0,
    packTitle: '',
    onTogglePackMode: mockOnTogglePackMode,
    onPackTitleChange: mockOnPackTitleChange,
    onSharePack: mockOnSharePack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Normal Mode', () => {
    it('should render Enter Pack Mode button when not in pack mode', () => {
      render(() => <PackToolbar {...defaultProps} />);

      expect(screen.getByText('Enter Pack Mode')).toBeInTheDocument();
    });

    it('should call onTogglePackMode when Enter Pack Mode clicked', () => {
      render(() => <PackToolbar {...defaultProps} />);

      const button = screen.getByText('Enter Pack Mode');
      fireEvent.click(button);

      expect(mockOnTogglePackMode).toHaveBeenCalled();
    });
  });

  describe('Pack Mode', () => {
    const packModeProps: PackToolbarProps = {
      ...defaultProps,
      isPackMode: true,
    };

    it('should render Exit Pack Mode button when in pack mode', () => {
      render(() => <PackToolbar {...packModeProps} />);

      expect(screen.getByText('Exit Pack Mode')).toBeInTheDocument();
    });

    it('should display selected count', () => {
      render(() => <PackToolbar {...packModeProps} selectedCount={5} />);

      expect(screen.getByText('5 selected')).toBeInTheDocument();
    });

    it('should render pack title input', () => {
      render(() => <PackToolbar {...packModeProps} />);

      expect(screen.getByPlaceholderText('Enter pack title...')).toBeInTheDocument();
    });

    it('should display current pack title value', () => {
      render(() => <PackToolbar {...packModeProps} packTitle="My Pack" />);

      const input = screen.getByPlaceholderText('Enter pack title...') as HTMLInputElement;
      expect(input.value).toBe('My Pack');
    });

    it('should call onPackTitleChange when title input changes', () => {
      render(() => <PackToolbar {...packModeProps} />);

      const input = screen.getByPlaceholderText('Enter pack title...');
      fireEvent.input(input, { target: { value: 'New Pack Title' } });

      expect(mockOnPackTitleChange).toHaveBeenCalledWith('New Pack Title');
    });

    it('should render Share Pack button', () => {
      render(() => <PackToolbar {...packModeProps} />);

      expect(screen.getByText('Share Pack')).toBeInTheDocument();
    });

    it('should disable Share Pack button when no items selected', () => {
      render(() => <PackToolbar {...packModeProps} selectedCount={0} />);

      const shareButton = screen.getByText('Share Pack');
      expect(shareButton).toBeDisabled();
    });

    it('should enable Share Pack button when items selected', () => {
      render(() => <PackToolbar {...packModeProps} selectedCount={3} />);

      const shareButton = screen.getByText('Share Pack');
      expect(shareButton).not.toBeDisabled();
    });

    it('should call onSharePack when Share Pack clicked', () => {
      render(() => <PackToolbar {...packModeProps} selectedCount={3} />);

      const shareButton = screen.getByText('Share Pack');
      fireEvent.click(shareButton);

      expect(mockOnSharePack).toHaveBeenCalled();
    });

    it('should call onTogglePackMode when Exit Pack Mode clicked', () => {
      render(() => <PackToolbar {...packModeProps} />);

      const exitButton = screen.getByText('Exit Pack Mode');
      fireEvent.click(exitButton);

      expect(mockOnTogglePackMode).toHaveBeenCalled();
    });
  });

  describe('Selection States', () => {
    it('should display zero selected', () => {
      render(() => <PackToolbar {...defaultProps} isPackMode={true} />);

      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should display single item selected', () => {
      render(() => <PackToolbar {...defaultProps} isPackMode={true} selectedCount={1} />);

      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should display multiple items selected', () => {
      render(() => <PackToolbar {...defaultProps} isPackMode={true} selectedCount={10} />);

      expect(screen.getByText('10 selected')).toBeInTheDocument();
    });
  });
});
