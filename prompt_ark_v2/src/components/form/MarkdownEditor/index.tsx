import type { Component, JSX } from 'solid-js';
import { splitProps, createSignal, createMemo } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { marked } from 'marked';

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  previewMode?: 'split' | 'tab';
  disabled?: boolean;
  fullWidth?: boolean;
  rows?: number;
  class?: string;
  textareaClass?: string;
  previewClass?: string;
  id?: string;
}

type EditorMode = 'edit' | 'preview';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MarkdownEditor: Component<MarkdownEditorProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'placeholder',
    'showToolbar',
    'previewMode',
    'disabled',
    'fullWidth',
    'rows',
    'class',
    'textareaClass',
    'previewClass',
    'id',
  ]);

  const [mode, setMode] = createSignal<EditorMode>('edit');

  const editorId = () => local.id || `markdown-editor-${Math.random().toString(36).slice(2, 11)}`;

  const previewHtml = createMemo(async () => {
    const content = local.value || '';
    try {
      const html = await marked(content, { gfm: true, breaks: true });
      return html as string;
    } catch {
      return '<p class="text-red-500">Failed to render preview</p>';
    }
  });

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById(editorId()) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = local.value;
    const selected = text.substring(start, end);

    const newValue = text.substring(0, start) + before + selected + after + text.substring(end);
    local.onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarItems = [
    { icon: 'B', title: 'Bold', action: () => insertText('**', '**') },
    { icon: 'I', title: 'Italic', action: () => insertText('*', '*') },
    { icon: 'H', title: 'Heading', action: () => insertText('## ', '') },
    { icon: '🔗', title: 'Link', action: () => insertText('[', '](url)') },
    { icon: '`', title: 'Code', action: () => insertText('`', '`') },
    { icon: '```', title: 'Code Block', action: () => insertText('```\n', '\n```') },
    { icon: '-', title: 'List', action: () => insertText('- ', '') },
  ];

  const isSplitMode = () => local.previewMode === 'split' && mode() === 'edit';
  const isTabMode = () => local.previewMode !== 'split' || mode() === 'preview';

  return (
    <div
      class={cn(
        'flex flex-col gap-2',
        local.fullWidth && 'w-full',
        local.class
      )}
    >
      {(local.showToolbar !== false) && (
        <div class="flex items-center justify-between p-2 bg-surface-100 dark:bg-surface-800/50 rounded-lg">
          <div class="flex items-center gap-1">
            {toolbarItems.map((item) => (
              <button
                type="button"
                onClick={item.action}
                disabled={local.disabled || mode() === 'preview'}
                class={cn(
                  'px-2.5 py-1.5 text-sm font-medium rounded',
                  'text-surface-600 dark:text-surface-400',
                  'hover:bg-surface-200 dark:hover:bg-surface-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
                title={item.title}
              >
                {item.icon}
              </button>
            ))}
          </div>
          <div class="flex items-center bg-surface-200 dark:bg-surface-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setMode('edit')}
              class={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors duration-150',
                mode() === 'edit'
                  ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
              )}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setMode('preview')}
              class={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors duration-150',
                mode() === 'preview'
                  ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
              )}
            >
              Preview
            </button>
          </div>
        </div>
      )}

      <div class={cn('flex gap-4', isTabMode() && 'block')}>
        {(mode() === 'edit' || isSplitMode()) && (
          <div class={cn('flex-1', isSplitMode() && 'w-1/2')}>
            <textarea
              id={editorId()}
              value={local.value}
              onInput={(e) => local.onChange(e.currentTarget.value)}
              placeholder={local.placeholder}
              disabled={local.disabled}
              rows={local.rows || 8}
              class={cn(
                'w-full px-3 py-2',
                'bg-white dark:bg-surface-800',
                'border border-surface-300 dark:border-surface-600',
                'rounded-lg',
                'text-surface-900 dark:text-surface-100 text-sm',
                'placeholder:text-surface-400 dark:placeholder:text-surface-500',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100 dark:disabled:bg-surface-900',
                'resize-y font-mono leading-relaxed',
                local.textareaClass
              )}
            />
          </div>
        )}

        {(mode() === 'preview' || isSplitMode()) && (
          <div class={cn('flex-1', isSplitMode() && 'w-1/2')}>
            <div
              class={cn(
                'w-full min-h-[200px] max-h-[400px] overflow-y-auto',
                'px-4 py-3',
                'bg-surface-50 dark:bg-surface-800/50',
                'border border-surface-200 dark:border-surface-700',
                'rounded-lg',
                'prose prose-sm dark:prose-invert max-w-none',
                local.previewClass
              )}
              innerHTML={previewHtml()}
            />
          </div>
        )}
      </div>

      <div class="flex justify-end">
        <span class="text-xs text-surface-500 dark:text-surface-500">
          {local.value.length} characters
        </span>
      </div>
    </div>
  );
};

export default MarkdownEditor;
