import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children?: JSX.Element;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'children',
    'class',
    'disabled',
  ]);

  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-surface-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    local.class as string
  );

  const variantStyles = {
    primary: cn(
      'bg-primary-600 text-white hover:bg-primary-700',
      'focus:ring-primary-500',
      'dark:bg-primary-500 dark:hover:bg-primary-600'
    ),
    secondary: cn(
      'bg-surface-200 text-surface-900 hover:bg-surface-300',
      'focus:ring-surface-400',
      'dark:bg-surface-700 dark:text-surface-100 dark:hover:bg-surface-600'
    ),
    danger: cn(
      'bg-red-600 text-white hover:bg-red-700',
      'focus:ring-red-500',
      'dark:bg-red-600 dark:hover:bg-red-700'
    ),
    ghost: cn(
      'bg-transparent text-surface-700 hover:bg-surface-100',
      'focus:ring-surface-400',
      'dark:text-surface-300 dark:hover:bg-surface-800'
    ),
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      {...rest}
      class={cn(
        baseStyles,
        variantStyles[local.variant || 'primary'],
        sizeStyles[local.size || 'md'],
        (local.loading || local.disabled) && 'opacity-50 cursor-not-allowed'
      )}
      disabled={local.loading || local.disabled}
    >
      {local.loading && (
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {local.children}
    </button>
  );
};

export default Button;
