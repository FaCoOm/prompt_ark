import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
  children: JSX.Element;
  id?: string;
  class?: string;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FormField: Component<FormFieldProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'label',
    'error',
    'hint',
    'required',
    'fullWidth',
    'children',
    'id',
    'class',
  ]);

  const fieldId = () => local.id || `field-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <div class={cn('flex flex-col gap-1.5', local.fullWidth && 'w-full', local.class)}>
      {local.label && (
        <label
          for={fieldId()}
          class="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1"
        >
          {local.label}
          {local.required && (
            <span class="text-red-500 dark:text-red-400" aria-label="required">
              *
            </span>
          )}
        </label>
      )}
      <div class={cn('relative', local.fullWidth && 'w-full')}>
        {rest.children}
      </div>
      {local.hint && !local.error && (
        <span class="text-xs text-surface-500 dark:text-surface-400">{local.hint}</span>
      )}
      {local.error && (
        <span class="text-sm text-red-500 dark:text-red-400">{local.error}</span>
      )}
    </div>
  );
};

export default FormField;
