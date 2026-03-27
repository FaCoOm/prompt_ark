export interface Prompt {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  favorite?: boolean;
  lastUsedAt?: number;
  variables?: Array<{
    name: string;
    type: 'text' | 'enum' | 'default' | 'context';
    options?: string[];
    default?: string;
  }>;
}

export interface PickerOptions {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  onClose: () => void;
}

export class PromptPicker {
  private container: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private listContainer: HTMLElement | null = null;
  private options: PickerOptions;
  private filteredPrompts: Prompt[] = [];
  private hoverCard: HTMLElement | null = null;
  private hoverTimer: number | null = null;

  constructor(options: PickerOptions) {
    this.options = options;
    this.filteredPrompts = [...options.prompts];
    this.sortPrompts();
  }

  private sortPrompts(): void {
    this.filteredPrompts.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
    });
  }

  show(): void {
    if (this.container) {
      this.hide();
      return;
    }

    this.render();
    this.attachEvents();
  }

  hide(): void {
    this.hideHoverPreview();
    if (this.hoverTimer) {
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.options.onClose();
  }

  private render(): void {
    this.container = document.createElement('div');
    this.container.id = 'prompt-ark-picker';
    this.container.innerHTML = `
      <div class="pa-picker-overlay"></div>
      <div class="pa-picker-modal">
        <div class="pa-picker-header">
          <input type="text" class="pa-picker-search" placeholder="Search prompts..." autofocus>
          <button class="pa-picker-close">×</button>
        </div>
        <div class="pa-picker-list">
          ${this.renderPromptList(this.filteredPrompts)}
        </div>
      </div>
    `;

    this.injectStyles();
    document.body.appendChild(this.container);

    this.searchInput = this.container.querySelector('.pa-picker-search');
    this.listContainer = this.container.querySelector('.pa-picker-list');

    setTimeout(() => this.searchInput?.focus(), 100);
  }

  private renderPromptList(prompts: Prompt[]): string {
    if (prompts.length === 0) {
      return '<div class="pa-picker-empty">No prompts found</div>';
    }

    return prompts.map((p) => {
      const varCount = p.variables?.length || 0;
      const varBadge = varCount > 0 ? `<span class="pa-picker-vars">${varCount} vars</span>` : '';
      const preview = this.escapeHtml(p.content.substring(0, 120));
      const favoriteIcon = p.favorite ? '★ ' : '';
      return `
        <div class="pa-picker-item" data-id="${p.id}">
          <div class="pa-picker-item-title">${favoriteIcon}${this.escapeHtml(p.title)}</div>
          <div class="pa-picker-item-preview">${preview}</div>
          ${varBadge}
        </div>
      `;
    }).join('');
  }

  private attachEvents(): void {
    if (!this.container) return;

    const closeBtn = this.container.querySelector('.pa-picker-close');
    const overlay = this.container.querySelector('.pa-picker-overlay');

    closeBtn?.addEventListener('click', () => this.hide());
    overlay?.addEventListener('click', () => this.hide());

    this.searchInput?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      this.filteredPrompts = this.options.prompts.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.content.toLowerCase().includes(term) ||
          p.tags?.some((t) => t.toLowerCase().includes(term))
      );
      if (this.listContainer) {
        this.listContainer.innerHTML = this.renderPromptList(this.filteredPrompts);
      }
    });

    this.listContainer?.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.pa-picker-item');
      if (item) {
        const id = item.getAttribute('data-id');
        const prompt = this.options.prompts.find((p) => p.id === id);
        if (prompt) {
          this.hide();
          this.options.onSelect(prompt);
        }
      }
    });

    this.listContainer?.addEventListener('mouseover', (e) => {
      const item = (e.target as HTMLElement).closest('.pa-picker-item');
      if (!item) return;

      if (this.hoverTimer) {
        window.clearTimeout(this.hoverTimer);
      }

      this.hoverTimer = window.setTimeout(() => {
        this.showHoverPreview(item as HTMLElement);
      }, 200);
    });

    this.listContainer?.addEventListener('mouseout', (e) => {
      const item = (e.target as HTMLElement).closest('.pa-picker-item');
      if (!item) return;

      if (this.hoverTimer) {
        window.clearTimeout(this.hoverTimer);
        this.hoverTimer = null;
      }
      this.hideHoverPreview();
    });

    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
    }
  };

  private showHoverPreview(item: HTMLElement): void {
    this.hideHoverPreview();

    const id = item.getAttribute('data-id');
    const prompt = this.options.prompts.find((p) => p.id === id);
    if (!prompt) return;

    this.hoverCard = document.createElement('div');
    this.hoverCard.className = 'pa-picker-hover-preview';
    this.hoverCard.textContent = prompt.content;

    document.body.appendChild(this.hoverCard);

    const rect = item.getBoundingClientRect();
    let left = rect.right + 8;
    let top = rect.top;

    if (left + 400 > window.innerWidth) {
      left = rect.left - 400 - 8;
      if (left < 0) left = rect.left;
    }

    if (top + 300 > window.innerHeight) {
      top = window.innerHeight - 300 - 8;
      if (top < 0) top = 8;
    }

    this.hoverCard.style.left = `${left}px`;
    this.hoverCard.style.top = `${top}px`;
  }

  private hideHoverPreview(): void {
    if (this.hoverCard) {
      this.hoverCard.remove();
      this.hoverCard = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private injectStyles(): void {
    if (document.getElementById('pa-picker-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'pa-picker-styles';
    styles.textContent = `
      #prompt-ark-picker {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .pa-picker-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }
      .pa-picker-modal {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 480px;
        max-height: 70vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .pa-picker-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e5e7eb;
        gap: 12px;
      }
      .pa-picker-search {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
      }
      .pa-picker-search:focus {
        border-color: #3b82f6;
      }
      .pa-picker-close {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        color: #6b7280;
      }
      .pa-picker-close:hover {
        background: #f3f4f6;
        color: #111827;
      }
      .pa-picker-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      .pa-picker-item {
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .pa-picker-item:hover {
        background: #f3f4f6;
      }
      .pa-picker-item-title {
        font-weight: 600;
        font-size: 14px;
        color: #111827;
        margin-bottom: 4px;
      }
      .pa-picker-item-preview {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .pa-picker-vars {
        display: inline-block;
        margin-top: 6px;
        padding: 2px 6px;
        background: #e0e7ff;
        color: #4338ca;
        font-size: 11px;
        border-radius: 4px;
      }
      .pa-picker-empty {
        text-align: center;
        padding: 40px;
        color: #6b7280;
        font-size: 14px;
      }
      .pa-picker-hover-preview {
        position: fixed;
        width: 400px;
        max-height: 300px;
        padding: 16px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        font-size: 13px;
        line-height: 1.6;
        color: #374151;
        overflow-y: auto;
        z-index: 2147483648;
        white-space: pre-wrap;
        word-break: break-word;
      }
      @media (prefers-color-scheme: dark) {
        .pa-picker-modal {
          background: #1f2937;
        }
        .pa-picker-header {
          border-bottom-color: #374151;
        }
        .pa-picker-search {
          background: #111827;
          border-color: #374151;
          color: #f9fafb;
        }
        .pa-picker-close {
          color: #9ca3af;
        }
        .pa-picker-close:hover {
          background: #374151;
          color: #f9fafb;
        }
        .pa-picker-item:hover {
          background: #374151;
        }
        .pa-picker-item-title {
          color: #f9fafb;
        }
        .pa-picker-item-preview {
          color: #9ca3af;
        }
        .pa-picker-hover-preview {
          background: #1f2937;
          color: #d1d5db;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}
