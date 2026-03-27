import type { Component, JSX } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children?: JSX.Element;
  class?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Badge: Component<BadgeProps> = (props) => {
  const variantStyles = {
    default: cn(
      'bg-surface-100 text-surface-700',
      'dark:bg-surface-700 dark:text-surface-300'
    ),
    primary: cn(
      'bg-primary-100 text-primary-700',
      'dark:bg-primary-900/30 dark:text-primary-300'
    ),
    success: cn(
      'bg-green-100 text-green-700',
      'dark:bg-green-900/30 dark:text-green-300'
    ),
    warning: cn(
      'bg-yellow-100 text-yellow-700',
      'dark:bg-yellow-900/30 dark:text-yellow-300'
    ),
    danger: cn(
      'bg-red-100 text-red-700',
      'dark:bg-red-900/30 dark:text-red-300'
    ),
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      class={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[props.variant || 'default'],
        sizeStyles[props.size || 'md'],
        props.class
      )}
    >
      {props.children}
    </span>
  );
};

export default Badge;
