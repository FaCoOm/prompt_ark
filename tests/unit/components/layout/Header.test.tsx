import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import { Header } from '@/entrypoints/sidepanel/components/layout/Header';

const mockOpenSettings = vi.fn();
const mockOpenModal = vi.fn();

vi.mock('@/entrypoints/sidepanel/stores/uiStore', () => ({
  useUIStore: () => ({
    openSettings: mockOpenSettings,
    openModal: mockOpenModal,
    isSettingsOpen: false,
    modals: {
      edit: false,
      import: false,
      history: false,
      share: false,
      youtube: false,
      skillManager: false,
    },
    loading: {},
    notifications: [],
    editModalTab: 'basic',
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hub info display', () => {
    it('should render the Prompt Ark logo and title', () => {
      render(() => <Header />);

      expect(screen.getByAltText('Prompt Ark')).toBeInTheDocument();
      expect(screen.getByText('Prompt Ark')).toBeInTheDocument();
    });

    it('should render hub user info with initials when no avatar', () => {
      render(() => <Header />);

      expect(screen.getByText('DU')).toBeInTheDocument();
      expect(screen.getByText('Demo User')).toBeInTheDocument();
    });

    it('should render hub user initials in the avatar placeholder', () => {
      render(() => <Header />);

      const initialsElement = screen.getByText('DU');
      expect(initialsElement).toHaveClass('hub-user-initials');
    });
  });

  describe('Button interactions', () => {
    it('should call openSettings when settings button is clicked', () => {
      render(() => <Header />);

      const settingsButton = screen.getByLabelText('Open settings');
      fireEvent.click(settingsButton);

      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });

    it('should call openModal with "edit" when New button is clicked', () => {
      render(() => <Header />);

      const newButton = screen.getByLabelText('Create new prompt');
      fireEvent.click(newButton);

      expect(mockOpenModal).toHaveBeenCalledTimes(1);
      expect(mockOpenModal).toHaveBeenCalledWith('edit');
    });

    it('should render settings button with correct aria-label', () => {
      render(() => <Header />);

      const settingsButton = screen.getByLabelText('Open settings');
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveAttribute('type', 'button');
    });

    it('should render New button with correct aria-label', () => {
      render(() => <Header />);

      const newButton = screen.getByLabelText('Create new prompt');
      expect(newButton).toBeInTheDocument();
      expect(newButton).toHaveTextContent('New');
    });
  });

  describe('Header structure', () => {
    it('should render header element with correct structure', () => {
      const { container } = render(() => <Header />);

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('header');
    });

    it('should render header-left and header-right sections', () => {
      const { container } = render(() => <Header />);

      expect(container.querySelector('.header-left')).toBeInTheDocument();
      expect(container.querySelector('.header-right')).toBeInTheDocument();
    });

    it('should render hub-user-info section', () => {
      const { container } = render(() => <Header />);

      expect(container.querySelector('.hub-user-info')).toBeInTheDocument();
    });
  });
});
