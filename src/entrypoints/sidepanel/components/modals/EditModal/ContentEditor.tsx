import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show } from 'solid-js';

import { marked } from 'marked';

export interface ContentEditorProps {
  content: string;
  onChange: (value: string) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderMarkdownWithHighlightedVars(content: string): string {
  // Process variables first - replace {{var}} with highlighted spans before markdown parsing
  const processedContent = content.replace(/\{\{([^}]+)\}\}/g, (_match, varName) => {
    return `<span class="content-editor-variable">{{${varName}}}</span>`;
  });

  let html = '';
  try {
    html = marked.parse(processedContent, { async: false }) as string;
  } catch {
    html = escapeHtml(processedContent);
  }

  return html;
}

export function ContentEditor(props: ContentEditorProps): JSX.Element {
  const [activeTab, setActiveTab] = createSignal<'edit' | 'preview'>('edit');

  const lineCount = createMemo(() => {
    return props.content.split('\n').length;
  });

  const handleTextareaChange = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    props.onChange(e.currentTarget.value);
  };

  const previewHtml = createMemo(() => {
    return renderMarkdownWithHighlightedVars(props.content);
  });

  return (
    <div class="content-editor">
      <div class="content-editor-tabs">
        <button
          type="button"
          class="content-editor-tab"
          classList={{ active: activeTab() === 'edit' }}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          class="content-editor-tab"
          classList={{ active: activeTab() === 'preview' }}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      <div class="content-editor-body">
        <Show when={activeTab() === 'edit'}>
          <div class="content-editor-edit-mode">
            <div class="content-editor-line-numbers">
              {Array.from({ length: lineCount() }, (_, i) => (
                <span class="content-editor-line-number">{i + 1}</span>
              ))}
            </div>
            <textarea
              class="content-editor-textarea"
              value={props.content}
              onInput={handleTextareaChange}
              placeholder="Write your prompt content here...
Use {{variable}} for dynamic values."
              spellcheck={false}
            />
          </div>
        </Show>

        <Show when={activeTab() === 'preview'}>
          <div class="content-editor-preview" innerHTML={previewHtml()} />
        </Show>
      </div>
    </div>
  );
}
