export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
}

export interface QuickActionsOptions {
  actions?: QuickAction[];
  onSelect: (action: QuickAction, inputEl: HTMLElement) => void;
  anchorEl: HTMLElement;
  inputEl: HTMLElement;
}

export class QuickActions {
  private menu: HTMLElement | null = null;
  private options: QuickActionsOptions;

  static readonly DEFAULT_ACTIONS: QuickAction[] = [
    {
      id: 'rewrite',
      icon: '📝',
      label: 'Rewrite',
      prompt: 'Please rewrite the following text to be clearer and more professional.',
    },
    {
      id: 'summarize',
      icon: '📋',
      label: 'Summarize',
      prompt: 'Please provide a concise summary of the following text.',
    },
    {
      id: 'expand',
      icon: '➕',
      label: 'Expand',
      prompt: 'Please expand on the following text and provide more details.',
    },
    {
      id: 'translate',
      icon: '🌐',
      label: 'Translate to EN',
      prompt: 'Please translate the following text to English.',
    },
    {
      id: 'explain',
      icon: '💡',
      label: 'Explain',
      prompt: 'Please explain the following text in simple terms.',
    },
  ];

  constructor(options: QuickActionsOptions) {
    this.options = options;
  }

  show(): void {
    this.hide();
    this.render();
    this.attachEvents();
  }

  hide(): void {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }

  private render(): void {
    const actions = this.options.actions || QuickActions.DEFAULT_ACTIONS;

    this.menu = document.createElement('div');
    this.menu.id = 'pa-quick-actions-menu';
    this.menu.innerHTML = actions
      .map(
        (act) => `
      <div class="pa-qa-item" data-id="${act.id}">
        <span class="pa-qa-icon">${act.icon}</span>
        <span class="pa-qa-label">${act.label}</span>
      </div>
    `
      )
      .join('');

    this.injectStyles();
    document.body.appendChild(this.menu);

    this.positionMenu();
  }

  private positionMenu(): void {
    if (!this.menu) return;

    const rect = this.options.anchorEl.getBoundingClientRect();
    const menuRect = this.menu.getBoundingClientRect();

    let top = rect.bottom + 4;
    let right = window.innerWidth - rect.right;

    if (top + menuRect.height > window.innerHeight) {
      top = rect.top - menuRect.height - 4;
    }

    this.menu.style.position = 'fixed';
    this.menu.style.top = `${top}px`;
    this.menu.style.right = `${right}px`;
  }

  private attachEvents(): void {
    if (!this.menu) return;

    const actions = this.options.actions || QuickActions.DEFAULT_ACTIONS;

    this.menu.querySelectorAll('.pa-qa-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = (item as HTMLElement).getAttribute('data-id');
        const action = actions.find((a) => a.id === id);

        if (action) {
          this.options.onSelect(action, this.options.inputEl);
        }
        this.hide();
      });
    });

    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 10);
  }

  private handleOutsideClick = (e: MouseEvent): void => {
    if (!this.menu?.contains(e.target as Node)) {
      this.hide();
      document.removeEventListener('click', this.handleOutsideClick);
    }
  };

  private injectStyles(): void {
    if (document.getElementById('pa-quick-actions-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'pa-quick-actions-styles';
    styles.textContent = `
      #pa-quick-actions-menu {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 6px;
        min-width: 160px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .pa-qa-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        color: #374151;
        transition: background 0.15s;
      }
      .pa-qa-item:hover {
        background: #f3f4f6;
      }
      .pa-qa-icon {
        font-size: 14px;
        width: 20px;
        text-align: center;
      }
      .pa-qa-label {
        font-weight: 500;
      }
      @media (prefers-color-scheme: dark) {
        #pa-quick-actions-menu {
          background: #1f2937;
          border: 1px solid #374151;
        }
        .pa-qa-item {
          color: #d1d5db;
        }
        .pa-qa-item:hover {
          background: #374151;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}
