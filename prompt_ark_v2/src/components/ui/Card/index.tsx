import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface CardProps {
  header?: JSX.Element;
  children?: JSX.Element;
  footer?: JSX.Element;
  class?: string;
  hover?: boolean;
  onClick?: () => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Card: Component<CardProps> = (props) => {
  return (
    <div
      onClick={props.onClick}
      class={cn(
        'bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700',
        'transition-shadow duration-200',
        props.hover && [
          'cursor-pointer',
          'hover:shadow-lg hover:border-surface-300 dark:hover:border-surface-600',
          'hover:-translate-y-0.5 transition-transform',
        ],
        props.class
      )}
    >
      <Show when={props.header}>
        <div class="px-5 py-4 border-b border-surface-200 dark:border-surface-700">
          {props.header}
        </div>
      </Show>

      <div class="px-5 py-4">{props.children}</div>

      <Show when={props.footer}>
        <div class="px-5 py-4 border-t border-surface-200 dark:border-surface-700">
          {props.footer}
        </div>
      </Show>
    </div>
  );
};

export default Card;
