export interface Variable {
  name: string;
  type: 'text' | 'enum' | 'default' | 'context';
  raw: string;
  options?: string[];
  default?: string;
}

export interface VariableModalOptions {
  title: string;
  content: string;
  variables: Variable[];
  onSubmit: (values: Record<string, string>, resolvedContent: string) => void;
  onCancel: () => void;
}

export class VariableModal {
  private modal: HTMLElement | null = null;
  private options: VariableModalOptions;

  constructor(options: VariableModalOptions) {
    this.options = options;
  }

  show(): void {
    this.hide();
    this.render();
    this.attachEvents();
  }

  hide(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  private render(): void {
    this.modal = document.createElement('div');
    this.modal.id = 'pa-variable-modal';
    this.modal.innerHTML = `
      <div class="pa-var-overlay"></div>
      <div class="pa-var-container">
        <div class="pa-var-header">
          <span class="pa-var-title">${this.escapeHtml(this.options.title)}</span>
          <button class="pa-var-close">×</button>
        </div>
        <div class="pa-var-form">
          ${this.options.variables
            .map((v) => {
              if (v.type === 'enum' && v.options) {
                return `
                  <div class="pa-var-group">
                    <label class="pa-var-label">${this.escapeHtml(v.name)}</label>
                    <select class="pa-var-input" data-var="${this.escapeHtml(v.raw)}">
                      ${v.options
                        .map(
                          (opt) =>
                            `<option value="${this.escapeHtml(opt)}"${opt === v.default ? ' selected' : ''}>${this.escapeHtml(opt)}</option>`
                        )
                        .join('')}
                    </select>
                  </div>
                `;
              }
              const defaultVal = v.type === 'default' ? v.default : '';
              return `
                <div class="pa-var-group">
                  <label class="pa-var-label">${this.escapeHtml(v.name)}</label>
                  <textarea class="pa-var-input" data-var="${this.escapeHtml(v.raw)}" 
                    placeholder="${defaultVal ? this.escapeHtml(defaultVal) : `[${this.escapeHtml(v.name)}]`}"
                    rows="2">${defaultVal ? this.escapeHtml(defaultVal) : ''}</textarea>
                </div>
              `;
            })
            .join('')}
        </div>
        <div class="pa-var-actions">
          <button class="pa-var-btn pa-var-btn-cancel">Cancel</button>
          <button class="pa-var-btn pa-var-btn-primary">Insert</button>
        </div>
      </div>
    `;

    this.injectStyles();
    document.body.appendChild(this.modal);

    const firstInput = this.modal.querySelector('.pa-var-input');
    setTimeout(() => (firstInput as HTMLElement)?.focus(), 50);
  }

  private attachEvents(): void {
    if (!this.modal) return;

    const closeBtn = this.modal.querySelector('.pa-var-close');
    const cancelBtn = this.modal.querySelector('.pa-var-btn-cancel');
    const submitBtn = this.modal.querySelector('.pa-var-btn-primary');
    const overlay = this.modal.querySelector('.pa-var-overlay');

    const handleClose = () => {
      this.hide();
      this.options.onCancel();
    };

    closeBtn?.addEventListener('click', handleClose);
    cancelBtn?.addEventListener('click', handleClose);
    overlay?.addEventListener('click', handleClose);

    submitBtn?.addEventListener('click', () => {
      const values: Record<string, string> = {};
      this.modal?.querySelectorAll('.pa-var-input').forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const varName = input.getAttribute('data-var');
        if (varName) {
          values[varName] = input.value;
        }
      });

      let resolved = this.options.content;
      for (const [rawSpec, val] of Object.entries(values)) {
        resolved = resolved.split(`{{${rawSpec}}}`).join(val || '');
        if (!rawSpec.includes(':')) {
          resolved = resolved.split(`[${rawSpec}]`).join(val || '');
        }
      }

      this.hide();
      this.options.onSubmit(values, resolved);
    });

    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
      this.options.onCancel();
    }
  };

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private injectStyles(): void {
    if (document.getElementById('pa-variable-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'pa-variable-modal-styles';
    styles.textContent = `
      #pa-variable-modal {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .pa-var-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
      }
      .pa-var-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 420px;
        max-height: 80vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .pa-var-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      .pa-var-title {
        font-weight: 600;
        font-size: 16px;
        color: #111827;
      }
      .pa-var-close {
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
      .pa-var-close:hover {
        background: #f3f4f6;
        color: #111827;
      }
      .pa-var-form {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .pa-var-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .pa-var-label {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }
      .pa-var-input {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
      }
      .pa-var-input:focus {
        border-color: #3b82f6;
      }
      select.pa-var-input {
        background: white;
        cursor: pointer;
      }
      textarea.pa-var-input {
        resize: vertical;
        min-height: 60px;
      }
      .pa-var-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
      }
      .pa-var-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
        border: 1px solid transparent;
      }
      .pa-var-btn-cancel {
        background: transparent;
        border-color: #d1d5db;
        color: #374151;
      }
      .pa-var-btn-cancel:hover {
        background: #f3f4f6;
      }
      .pa-var-btn-primary {
        background: #3b82f6;
        color: white;
      }
      .pa-var-btn-primary:hover {
        background: #2563eb;
      }
      @media (prefers-color-scheme: dark) {
        .pa-var-container {
          background: #1f2937;
        }
        .pa-var-header {
          border-bottom-color: #374151;
        }
        .pa-var-title {
          color: #f9fafb;
        }
        .pa-var-close {
          color: #9ca3af;
        }
        .pa-var-close:hover {
          background: #374151;
          color: #f9fafb;
        }
        .pa-var-label {
          color: #d1d5db;
        }
        .pa-var-input {
          background: #111827;
          border-color: #374151;
          color: #f9fafb;
        }
        .pa-var-input:focus {
          border-color: #60a5fa;
        }
        select.pa-var-input {
          background: #111827;
        }
        .pa-var-actions {
          border-top-color: #374151;
        }
        .pa-var-btn-cancel {
          border-color: #4b5563;
          color: #d1d5db;
        }
        .pa-var-btn-cancel:hover {
          background: #374151;
        }
        .pa-var-btn-primary {
          background: #3b82f6;
        }
        .pa-var-btn-primary:hover {
          background: #2563eb;
        }
      }
    `;
    document.head.appendChild(styles);
  }
}
