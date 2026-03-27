import type { Component, JSX } from 'solid-js';
import { createSignal, onCleanup, Show } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: JSX.Element;
  delay?: number;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Tooltip: Component<TooltipProps> = (props) => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [isMounted, setIsMounted] = createSignal(false);
  let timeoutId: ReturnType<typeof setTimeout>;
  const delay = props.delay ?? 300;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      setIsMounted(true);
      setTimeout(() => setIsVisible(true), 10);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
    setTimeout(() => setIsMounted(false), 200);
  };

  onCleanup(() => clearTimeout(timeoutId));

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-surface-800 dark:border-t-surface-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-surface-800 dark:border-b-surface-700',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-surface-800 dark:border-l-surface-700',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-surface-800 dark:border-r-surface-700',
  };

  return (
    <div
      class="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {props.children}

      <Show when={isMounted()}>
        <div
          class={cn(
            'absolute z-50 px-3 py-1.5 text-sm',
            'bg-surface-800 dark:bg-surface-700 text-white',
            'rounded-lg shadow-lg whitespace-nowrap',
            'transition-all duration-200 pointer-events-none',
            positionStyles[props.position || 'top'],
            isVisible() ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          )}
        >
          {props.content}
          <div
            class={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              arrowStyles[props.position || 'top']
            )}
          />
        </div>
      </Show>
    </div>
  );
};

export default Tooltip;
