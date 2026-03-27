import type { Component } from 'solid-js';
import { createSignal, Show, onMount } from 'solid-js';
import { useI18n } from '../../../src/i18n/context';
import { promptStore } from '../../../src/stores/promptStore';
import { Button, Input } from '../../../src/components/ui';
import { TagInput, MarkdownEditor } from '../../../src/components/form';
import type { Prompt } from '../../../src/types';

export interface PromptEditorProps {
  prompt?: Prompt | null;
  onSave: () => void;
  onCancel: () => void;
}

const PromptEditor: Component<PromptEditorProps> = (props) => {
  const { t } = useI18n();
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [category, setCategory] = createSignal('');
  const [tags, setTags] = createSignal<string[]>([]);
  const [shortcut, setShortcut] = createSignal('');
  const [isFavorite, setIsFavorite] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const isEditing = () => !!props.prompt;

  onMount(() => {
    if (props.prompt) {
      setTitle(props.prompt.title || '');
      setContent(props.prompt.content || '');
      setCategory(props.prompt.category || '');
      setTags(props.prompt.tags || []);
      setShortcut(props.prompt.shortcut || '');
      setIsFavorite(props.prompt.isFavorite || false);
    }
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!content().trim()) {
      newErrors.content = t('prompt.contentEmpty');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const promptData = {
        title: title(),
        content: content(),
        category: category(),
        tags: tags(),
        shortcut: shortcut(),
        isFavorite: isFavorite(),
        versions: [],
        useCount: props.prompt?.useCount || 0,
      };

      if (props.prompt) {
        await promptStore.updatePrompt(props.prompt.id, promptData);
      } else {
        await promptStore.savePrompt(promptData);
      }
      props.onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const categories = () => {
    const cats = new Set(promptStore.state.prompts.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  };

  const favButtonClasses = () => {
    const base = 'mt-6 p-2 rounded-lg transition-colors';
    return isFavorite()
      ? base + ' text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      : base + ' text-surface-400 hover:text-yellow-500';
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {isEditing() ? t('prompt.edit') : t('prompt.new')}
        </h1>
        <div class="flex items-center gap-2">
          <Button variant="secondary" onClick={props.onCancel}>
            {t('prompt.cancel')}
          </Button>
          <Button onClick={handleSave} loading={isSaving()}>
            {t('prompt.save')}
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('prompt.title')}
            placeholder={t('prompt.titlePlaceholder')}
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            fullWidth
          />

          <div class="flex gap-2">
            <div class="flex-1">
              <Input
                label={t('prompt.category')}
                placeholder="e.g., Writing, Coding"
                value={category()}
                onInput={(e) => setCategory(e.currentTarget.value)}
                list="categories"
                fullWidth
              />
              <datalist id="categories">
                <Show when={categories().length > 0}>
                  <For each={categories()}>
                    {(cat) => <option value={cat} />}
                  </For>
                </Show>
              </datalist>
            </div>
            <button
              onClick={() => setIsFavorite(!isFavorite())}
              class={favButtonClasses()}
              title={t('filter.favorites')}
            >
              <svg class="w-6 h-6" fill={isFavorite() ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {t('prompt.content')}
          </label>
          <p class="text-xs text-surface-500 dark:text-surface-500 mb-2">
            {t('prompt.contentHint')}
          </p>
          <MarkdownEditor
            value={content()}
            onChange={setContent}
            placeholder="Enter your prompt content..."
            showToolbar
            previewMode="tab"
            fullWidth
            rows={12}
          />
          <Show when={errors().content}>
            <p class="text-sm text-red-500 mt-1">{errors().content}</p>
          </Show>
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            Tags
          </label>
          <TagInput
            value={tags()}
            onChange={setTags}
            placeholder="Add tags (press Enter)"
            maxTags={10}
            fullWidth
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
            {t('prompt.shortcut')}
          </label>
          <Input
            placeholder={t('prompt.shortcutHint')}
            value={shortcut()}
            onInput={(e) => setShortcut(e.currentTarget.value)}
            fullWidth
          />
          <p class="text-xs text-surface-500 mt-1">
            Type /shortcut to quickly insert this prompt
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
