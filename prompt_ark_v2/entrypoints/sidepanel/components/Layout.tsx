import type { Component, JSX } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface LayoutProps {
  children?: JSX.Element;
  header?: JSX.Element;
  sidebar?: JSX.Element;
  class?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Layout: Component<LayoutProps> = (props) => {
  return (
    <div class={cn('min-h-screen bg-surface-50 dark:bg-surface-900 flex', props.class)}>
      {/* Sidebar Navigation */}
      {props.sidebar && (
        <aside class="w-16 md:w-64 flex-shrink-0 bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 flex flex-col">
          {props.sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <main class="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {props.header && (
          <header class="h-16 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center px-4 md:px-6 flex-shrink-0">
            {props.header}
          </header>
        )}

        {/* Page Content */}
        <div class="flex-1 overflow-auto p-4 md:p-6">
          {props.children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
