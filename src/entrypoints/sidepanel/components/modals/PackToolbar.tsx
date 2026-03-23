import type { JSX } from 'solid-js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface PackToolbarProps {
  isPackMode: boolean;
  selectedCount: number;
  packTitle: string;
  onTogglePackMode: () => void;
  onPackTitleChange: (title: string) => void;
  onSharePack: () => void;
}

export function PackToolbar(props: PackToolbarProps): JSX.Element {
  if (!props.isPackMode) {
    return (
      <div class="pack-toolbar">
        <Button onClick={props.onTogglePackMode} variant="secondary" class="pack-toggle">
          Enter Pack Mode
        </Button>
      </div>
    );
  }

  return (
    <div class="pack-toolbar">
      <Button onClick={props.onTogglePackMode} variant="ghost" class="pack-toggle">
        Exit Pack Mode
      </Button>

      <span class="pack-counter">{props.selectedCount} selected</span>

      <Input
        value={props.packTitle}
        onChange={props.onPackTitleChange}
        placeholder="Enter pack title..."
        class="pack-title-input"
      />

      <Button onClick={props.onSharePack} variant="primary" disabled={props.selectedCount === 0}>
        Share Pack
      </Button>
    </div>
  );
}
