import type { Component, JSX } from 'solid-js';
import { splitProps, createSignal, For } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  class?: string;
  inputClass?: string;
  tagClass?: string;
  id?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TagInput: Component<TagInputProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'placeholder',
    'maxTags',
    'disabled',
    'fullWidth',
    'class',
    'inputClass',
    'tagClass',
    'id',
  ]);

  const [inputValue, setInputValue] = createSignal('');

  const inputId = () => local.id || `tag-input-${Math.random().toString(36).slice(2, 11)}`;

  const canAddTag = () => {
    if (local.disabled) return false;
    if (local.maxTags !== undefined && local.value.length >= local.maxTags) return false;
    return true;
  };

  const addTag = () => {
    const value = inputValue().trim();
    if (!value) return;
    if (local.value.includes(value)) {
      setInputValue('');
      return;
    }
    if (!canAddTag()) return;

    local.onChange([...local.value, value]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    if (local.disabled) return;
    local.onChange(local.value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue() && local.value.length > 0) {
      e.preventDefault();
      removeTag(local.value[local.value.length - 1]);
    }
  };

  return (
    <div
      class={cn(
        'flex flex-wrap items-center gap-2',
        'px-3 py-2 bg-white dark:bg-surface-800',
        'border border-surface-300 dark:border-surface-600',
        'rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
        'transition-colors duration-200',
        local.disabled && 'opacity-50 cursor-not-allowed bg-surface-100 dark:bg-surface-900',
        local.fullWidth && 'w-full',
        local.class
      )}
      id={inputId()}
    >
      <For each={local.value}>
        {(tag) => (
          <span
            class={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 text-sm',
              'bg-primary-100 dark:bg-primary-900/30',
              'text-primary-700 dark:text-primary-300',
              'rounded-full transition-colors duration-200',
              !local.disabled && 'hover:bg-primary-200 dark:hover:bg-primary-900/50 cursor-pointer',
              local.tagClass
            )}
            onClick={() => removeTag(tag)}
            title={local.disabled ? tag : `Click to remove "${tag}"`}
          >
            {tag}
            {!local.disabled && (
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </span>
        )}
      </For>
      <input
        type="text"
        value={inputValue()}
        onInput={(e) => setInputValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={
          canAddTag()
            ? local.placeholder || 'Type and press Enter...'
            : `Max ${local.maxTags} tags reached`
        }
        disabled={local.disabled || !canAddTag()}
        class={cn(
          'flex-1 min-w-[120px] bg-transparent',
          'text-surface-900 dark:text-surface-100',
          'placeholder:text-surface-400 dark:placeholder:text-surface-500',
          'focus:outline-none',
          'disabled:cursor-not-allowed',
          local.inputClass
        )}
      />
    </div>
  );
};

export default TagInput;
