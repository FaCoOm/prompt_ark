import type { Component, JSX } from 'solid-js';
import { splitProps, For } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Select: Component<SelectProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'options',
    'label',
    'error',
    'placeholder',
    'fullWidth',
    'class',
    'id',
    'value',
    'onChange',
  ]);

  const selectId = () => local.id || `select-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <div class={cn('flex flex-col gap-1.5', local.fullWidth && 'w-full')}>
      {local.label && (
        <label
          for={selectId()}
          class="text-sm font-medium text-surface-700 dark:text-surface-300"
        >
          {local.label}
        </label>
      )}
      <div class="relative">
        <select
          {...rest}
          id={selectId()}
          value={local.value}
          onChange={local.onChange}
          class={cn(
            'px-3 py-2 pr-10 bg-white dark:bg-surface-800 border rounded-lg',
            'text-surface-900 dark:text-surface-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100 dark:disabled:bg-surface-900',
            'appearance-none cursor-pointer',
            local.error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-surface-300 dark:border-surface-600',
            local.fullWidth && 'w-full',
            local.class as string
          )}
        >
          {local.placeholder && (
            <option value="" disabled>
              {local.placeholder}
            </option>
          )}
          <For each={local.options}>
            {(option) => (
              <option value={option.value}>{option.label}</option>
            )}
          </For>
        </select>
        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            class="w-4 h-4 text-surface-400 dark:text-surface-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      {local.error && (
        <span class="text-sm text-red-500 dark:text-red-400">{local.error}</span>
      )}
    </div>
  );
};

export default Select;
