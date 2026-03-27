import type { Component, JSX } from 'solid-js';
import { onMount, onCleanup, Show } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: JSX.Element;
  footer?: JSX.Element;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Modal: Component<ModalProps> = (props) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose();
    }
  };

  const handleOverlayClick = (e: MouseEvent) => {
    if (props.closeOnOverlayClick !== false && e.target === e.currentTarget) {
      props.onClose();
    }
  };

  onMount(() => {
    if (props.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';
  });

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={handleOverlayClick}
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          class={cn(
            'relative w-full bg-white dark:bg-surface-800 rounded-xl shadow-xl',
            'animate-slide-in',
            sizeStyles[props.size || 'md']
          )}
        >
          {(props.title || props.showCloseButton !== false) && (
            <div class="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
              {props.title && (
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {props.title}
                </h3>
              )}
              <Show when={props.showCloseButton !== false}>
                <button
                  onClick={props.onClose}
                  class={cn(
                    'p-1 rounded-lg transition-colors',
                    'text-surface-400 hover:text-surface-600 hover:bg-surface-100',
                    'dark:text-surface-500 dark:hover:text-surface-300 dark:hover:bg-surface-700',
                    !props.title && 'ml-auto'
                  )}
                  aria-label="Close"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </Show>
            </div>
          )}

          <div class="px-6 py-4">{props.children}</div>
          <Show when={props.footer}>
            <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-surface-200 dark:border-surface-700">
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default Modal;
