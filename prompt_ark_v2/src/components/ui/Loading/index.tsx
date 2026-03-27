import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface LoadingProps {
  variant?: 'spinner' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Loading: Component<LoadingProps> = (props) => {
  const sizeMap = {
    sm: { spinner: 'w-4 h-4', dot: 'w-1.5 h-1.5' },
    md: { spinner: 'w-6 h-6', dot: 'w-2 h-2' },
    lg: { spinner: 'w-8 h-8', dot: 'w-2.5 h-2.5' },
  };

  const Spinner = () => (
    <svg
      class={cn(
        'animate-spin text-primary-600 dark:text-primary-400',
        sizeMap[props.size || 'md'].spinner
      )}
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
  );

  const Dots = () => (
    <div class="flex items-center gap-1">
      <For each={[0, 1, 2]}>
        {(i) => (
          <div
            class={cn(
              'rounded-full bg-primary-600 dark:bg-primary-400 animate-bounce',
              sizeMap[props.size || 'md'].dot
            )}
            style={{ 'animation-delay': `${i * 0.15}s` }}
          />
        )}
      </For>
    </div>
  );

  return (
    <div class={cn('inline-flex items-center justify-center', props.class)}>
      {props.variant === 'dots' ? <Dots /> : <Spinner />}
    </div>
  );
};

export default Loading;
