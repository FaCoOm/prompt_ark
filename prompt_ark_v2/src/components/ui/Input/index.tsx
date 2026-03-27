import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Input: Component<InputProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'label',
    'error',
    'fullWidth',
    'class',
    'id',
  ]);

  const inputId = () => local.id || `input-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <div class={cn('flex flex-col gap-1.5', local.fullWidth && 'w-full')}>
      {local.label && (
        <label
          for={inputId()}
          class="text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {local.label}
        </label>
      )}
      <input
        {...rest}
        id={inputId()}
        class={cn(
          'px-3 py-2 bg-white dark:bg-surface-800 border rounded-lg',
          'text-surface-900 dark:text-surface-100',
          'placeholder:text-surface-400 dark:placeholder:text-surface-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100 dark:disabled:bg-surface-900',
          local.error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-surface-300 dark:border-surface-600',
          local.fullWidth && 'w-full',
          local.class as string
        )}
      />
      {local.error && (
        <span class="text-sm text-red-500 dark:text-red-400">{local.error}</span>
      )}
    </div>
  );
};

export default Input;
