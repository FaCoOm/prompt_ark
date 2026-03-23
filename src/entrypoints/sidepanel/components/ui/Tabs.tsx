import type { JSX } from 'solid-js';
import { For } from 'solid-js';

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs(props: TabsProps): JSX.Element {
  return (
    <div class={`settings-tabs ${props.className || ''}`}>
      <For each={props.tabs}>
        {tab => (
          <button
            type="button"
            class="settings-tab"
            classList={{ active: props.activeTab === tab.id }}
            onClick={() => props.onChange(tab.id)}
          >
            {tab.label}
          </button>
        )}
      </For>
    </div>
  );
}
