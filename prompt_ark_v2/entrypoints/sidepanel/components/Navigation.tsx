import type { Component, JSX } from 'solid-js';
import { For } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { useI18n } from '../../../src/i18n/context';

export type PageType = 'dashboard' | 'prompts' | 'editor' | 'history' | 'import-export' | 'settings';

export interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onNewPrompt: () => void;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: PageType;
  label: string;
  icon: (props: { class?: string }) => JSX.Element;
}

// Icon components
const DashboardIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const PromptsIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const HistoryIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImportExportIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const SettingsIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = (props: { class?: string }) => (
  <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
);

const Navigation: Component<NavigationProps> = (props) => {
  const { t } = useI18n();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: t('app.name'), icon: DashboardIcon },
    { id: 'prompts', label: t('prompt.title') || 'Prompts', icon: PromptsIcon },
    { id: 'history', label: t('history.title'), icon: HistoryIcon },
    { id: 'import-export', label: t('import.title') || 'Import/Export', icon: ImportExportIcon },
    { id: 'settings', label: t('settings.title'), icon: SettingsIcon },
  ];

  const isActive = (page: PageType) => props.currentPage === page;

  return (
    <div class="flex flex-col h-full">
      {/* Logo / Brand */}
      <div class="h-16 flex items-center justify-center md:justify-start md:px-4 border-b border-surface-200 dark:border-surface-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
            <span class="text-white font-bold text-sm">PA</span>
          </div>
          <span class="hidden md:block font-semibold text-surface-900 dark:text-surface-100">
            Prompt Ark
          </span>
        </div>
      </div>

      {/* New Prompt Button */}
      <div class="p-3">
        <button
          onClick={props.onNewPrompt}
          class={cn(
            'w-full flex items-center justify-center md:justify-start gap-2',
            'px-3 py-2.5 rounded-lg',
            'bg-primary-600 hover:bg-primary-700 text-white',
            'transition-colors duration-200',
            'font-medium text-sm'
          )}
        >
          <PlusIcon class="w-5 h-5" />
          <span class="hidden md:inline">{t('prompt.new')}</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav class="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        <For each={navItems}>
          {(item) => (
            <button
              onClick={() => props.onPageChange(item.id)}
              class={cn(
                'w-full flex items-center justify-center md:justify-start gap-3',
                'px-3 py-2.5 rounded-lg',
                'transition-colors duration-200',
                'font-medium text-sm',
                isActive(item.id)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-surface-900 dark:hover:text-surface-100'
              )}
              title={item.label}
            >
              <item.icon class={cn(
                'w-5 h-5 flex-shrink-0',
                isActive(item.id)
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-surface-400 dark:text-surface-500'
              )} />
              <span class="hidden md:block truncate">{item.label}</span>
            </button>
          )}
        </For>
      </nav>

      {/* Footer */}
      <div class="p-3 border-t border-surface-200 dark:border-surface-700">
        <div class="hidden md:block text-xs text-surface-500 dark:text-surface-500 text-center">
          Prompt Ark v2.0
        </div>
        <div class="md:hidden flex justify-center">
          <span class="text-xs text-surface-500">v2</span>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
