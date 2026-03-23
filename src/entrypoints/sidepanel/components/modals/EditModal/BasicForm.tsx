import type { JSX } from 'solid-js';

export interface BasicFormProps {
  title: string;
  category: string;
  shortcut: string;
  onTitleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShortcutChange: (value: string) => void;
  errors: { title?: string };
  existingCategories: string[];
}

export function BasicForm(props: BasicFormProps): JSX.Element {
  const titleId = 'basic-form-title';
  const categoryId = 'basic-form-category';
  const shortcutId = 'basic-form-shortcut';
  const categoryDatalistId = 'basic-form-category-list';

  return (
    <>
      <div class="form-group">
        <label for={titleId}>Title</label>
        <input
          id={titleId}
          type="text"
          class={`settings-input ${props.errors.title ? 'error' : ''}`}
          value={props.title}
          onInput={e => props.onTitleChange(e.currentTarget.value)}
          placeholder="Enter prompt title"
        />
        {props.errors.title && <span class="error-message">{props.errors.title}</span>}
      </div>

      <div class="form-group">
        <label for={categoryId}>Category</label>
        <input
          id={categoryId}
          type="text"
          class="settings-input"
          value={props.category}
          onInput={e => props.onCategoryChange(e.currentTarget.value)}
          placeholder="Enter or select category"
          list={categoryDatalistId}
        />
        <datalist id={categoryDatalistId}>
          {props.existingCategories.map(cat => (
            <option value={cat} />
          ))}
        </datalist>
      </div>

      <div class="form-group">
        <label for={shortcutId}>Shortcut</label>
        <input
          id={shortcutId}
          type="text"
          class="settings-input"
          value={props.shortcut}
          onInput={e => props.onShortcutChange(e.currentTarget.value)}
          placeholder="e.g., /email"
        />
      </div>
    </>
  );
}
