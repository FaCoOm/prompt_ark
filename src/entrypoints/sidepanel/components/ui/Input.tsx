import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';

export interface InputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  class?: string;
}

export function Input(props: InputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'value',
    'onChange',
    'placeholder',
    'type',
    'disabled',
    'class',
  ]);

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    local.onChange(e.currentTarget.value);
  };

  return (
    <input
      type={local.type || 'text'}
      id={local.id}
      class={`settings-input ${local.class || ''}`}
      value={local.value}
      onInput={handleInput}
      placeholder={local.placeholder}
      disabled={local.disabled}
      {...rest}
    />
  );
}
