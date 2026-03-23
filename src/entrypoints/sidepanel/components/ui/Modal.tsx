import type { JSX, ParentProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import { splitProps, Show } from 'solid-js';

export interface ModalProps extends ParentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  footer?: JSX.Element;
  className?: string;
}

export function Modal(props: ModalProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'isOpen',
    'onClose',
    'title',
    'footer',
    'className',
    'children',
  ]);

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      local.onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      local.onClose();
    }
  };

  return (
    <Show when={local.isOpen}>
      <Portal>
        <div
          class={`modal ${local.className || ''}`}
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...rest}
        >
          <div class="modal-content">
            <Show when={local.title}>
              <div class="modal-header">
                <h2>{local.title}</h2>
                <button
                  type="button"
                  class="modal-close"
                  onClick={local.onClose}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </Show>
            <div class="modal-body">{local.children}</div>
            <Show when={local.footer}>
              <div class="modal-footer">{local.footer}</div>
            </Show>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
