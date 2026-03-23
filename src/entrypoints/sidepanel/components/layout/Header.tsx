import type { JSX } from 'solid-js';
import { useUIStore } from '../../stores/uiStore';

// Mock Hub user data - will be replaced with actual Hub integration
const mockHubUser = {
  name: 'Demo User',
  avatar: null as string | null,
  initials: 'DU',
};

export function Header(): JSX.Element {
  const uiStore = useUIStore();

  const handleSettingsClick = () => {
    uiStore.openSettings();
  };

  const handleNewPromptClick = () => {
    uiStore.openModal('edit');
  };

  return (
    <header class="header">
      <div class="header-left">
        <img src="/icons/icon128.png" alt="Prompt Ark" class="header-logo" width="26" height="26" />
        <h1>Prompt Ark</h1>

        {/* Hub User Info - using mock data */}
        <div class="hub-user-info">
          {mockHubUser.avatar ? (
            <img src={mockHubUser.avatar} alt={mockHubUser.name} class="hub-user-avatar" />
          ) : (
            <div class="hub-user-initials">{mockHubUser.initials}</div>
          )}
          <span class="hub-user-name">{mockHubUser.name}</span>
        </div>
      </div>

      <div class="header-right">
        {/* Settings Button */}
        <button
          class="btn-icon header-btn"
          onClick={handleSettingsClick}
          title="Settings"
          aria-label="Open settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* New Prompt Button */}
        <button
          class="btn btn-primary btn-small"
          onClick={handleNewPromptClick}
          title="New Prompt"
          aria-label="Create new prompt"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            style={{ 'margin-right': '4px' }}
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>
      </div>
    </header>
  );
}
