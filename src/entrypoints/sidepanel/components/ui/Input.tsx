import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';

export interface InputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export function Input(props: InputProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'value',
    'onChange',
    'placeholder',
    'type',
    'disabled',
    'className',
  ]);

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    local.onChange(e.currentTarget.value);
  };

  return (
    <input
      type={local.type || 'text'}
      class={`settings-input ${local.className || ''}`}
      value={local.value}
      onInput={handleInput}
      placeholder={local.placeholder}
      disabled={local.disabled}
      {...rest}
    />
  );
}
