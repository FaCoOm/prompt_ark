import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show } from 'solid-js';

// @ts-ignore - marked is a plain JS file
import { marked } from '../../../../../lib/marked.min.js';

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
  const variables: { placeholder: string; content: string }[] = [];
  let varIndex = 0;

  const contentWithPlaceholders = content.replace(/\{\{([^}]+)\}\}/g, match => {
    const placeholder = `___VAR_${varIndex}___`;
    variables.push({ placeholder, content: match });
    varIndex++;
    return placeholder;
  });

  let html = '';
  try {
    html = marked.parse(contentWithPlaceholders, { async: false }) as string;
  } catch {
    html = escapeHtml(contentWithPlaceholders);
  }

  variables.forEach(({ placeholder, content }) => {
    const highlighted = `<span class="content-editor-variable">${escapeHtml(content)}</span>`;
    html = html.replace(
      new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      highlighted
    );
  });

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
