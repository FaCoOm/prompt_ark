import type { JSX, ParentProps } from 'solid-js';
import { splitProps } from 'solid-js';

export interface ButtonProps extends ParentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button(props: ButtonProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'variant',
    'onClick',
    'disabled',
    'className',
    'children',
  ]);

  const variantClass = () => {
    switch (local.variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      case 'ghost':
        return 'btn-ghost';
      default:
        return 'btn-primary';
    }
  };

  const handleClick = () => {
    if (!local.disabled && local.onClick) {
      local.onClick();
    }
  };

  return (
    <button
      type={props.type || 'button'}
      class={`btn ${variantClass()} ${local.className || ''}`}
      classList={{ 'opacity-50 cursor-not-allowed': local.disabled }}
      onClick={handleClick}
      disabled={local.disabled}
      {...rest}
    >
      {local.children}
    </button>
  );
}
