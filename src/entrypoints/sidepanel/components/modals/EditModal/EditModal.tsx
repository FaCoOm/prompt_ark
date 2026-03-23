import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show, createEffect, onMount } from 'solid-js';
import { useUIStore } from '../../../stores/uiStore';
import { usePromptStore } from '../../../../../stores/promptStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { BasicForm } from './BasicForm';
import { ContentEditor } from './ContentEditor';
import { SkillModeSection } from './SkillModeSection';
import { OptimizePanel } from './OptimizePanel';
import { ContractBuilder } from './ContractBuilder';
import { TranslationPanel } from './TranslationPanel';
import type { Prompt } from '@shared/types/prompt';
import { getProviders, getActiveProvider } from '@shared/api/ai';
import type { Provider } from '@shared/types/provider';

interface FormErrors {
  title?: string;
  content?: string;
}

interface FormState {
  title: string;
  content: string;
  category: string;
  shortcut: string;
  tags: string[];
  skillModeEnabled: boolean;
  systemPrompt: string;
  knowledgeFragments: string[];
  outputFormat: string;
  lengthLimit: number;
  tone: string;
  excludedContent: string;
}

const DEFAULT_FORM_STATE: FormState = {
  title: '',
  content: '',
  category: '',
  shortcut: '',
  tags: [],
  skillModeEnabled: false,
  systemPrompt: '',
  knowledgeFragments: [],
  outputFormat: 'markdown',
  lengthLimit: 1000,
  tone: 'professional',
  excludedContent: '',
};

export function EditModal(): JSX.Element {
  const { modals, closeModal, openModal, showNotification, editModalTab } = useUIStore();
  const { editingPrompt, addPrompt, updatePrompt, prompts } = usePromptStore();

  // Form state
  const [formState, setFormState] = createSignal<FormState>({ ...DEFAULT_FORM_STATE });
  const [errors, setErrors] = createSignal<FormErrors>({});
  const [isSaving, setIsSaving] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<'basic' | 'content' | 'advanced'>(editModalTab);
  const [providers, setProviders] = createSignal<Provider[]>([]);
  const [activeProviderId, setActiveProviderId] = createSignal<string | null>(null);

  createEffect(() => {
    setActiveTab(editModalTab);
  });

  const isEditMode = createMemo(() => editingPrompt !== null);
  const modalTitle = createMemo(() => (isEditMode() ? 'Edit Prompt' : 'New Prompt'));

  const existingCategories = createMemo(() => {
    const categories = new Set<string>();
    prompts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort();
  });

  const isOpen = () => modals.edit;

  onMount(async () => {
    const loadedProviders = await getProviders();
    setProviders(loadedProviders);
    const active = await getActiveProvider();
    if (active) {
      setActiveProviderId(active.id);
    }
  });

  createEffect(() => {
    if (isOpen()) {
      if (editingPrompt) {
        setFormState({
          title: editingPrompt.title || '',
          content: editingPrompt.content || '',
          category: editingPrompt.category || '',
          shortcut: editingPrompt.shortcut || '',
          tags: editingPrompt.tags || [],
          skillModeEnabled: (editingPrompt as any).skillModeEnabled || false,
          systemPrompt: (editingPrompt as any).systemPrompt || '',
          knowledgeFragments: (editingPrompt as any).knowledgeFragments || [],
          outputFormat: (editingPrompt as any).outputFormat || 'markdown',
          lengthLimit: (editingPrompt as any).lengthLimit || 1000,
          tone: (editingPrompt as any).tone || 'professional',
          excludedContent: (editingPrompt as any).excludedContent || '',
        });
      } else {
        setFormState({ ...DEFAULT_FORM_STATE });
      }
      setErrors({});
      setActiveTab('basic');
    }
  });

  const handleClose = () => {
    closeModal('edit');
    setTimeout(() => {
      setFormState({ ...DEFAULT_FORM_STATE });
      setErrors({});
    }, 300);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const current = formState();

    if (!current.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!current.content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showNotification({
        type: 'error',
        message: 'Please fix the errors before saving',
      });
      return;
    }

    setIsSaving(true);
    try {
      const current = formState();
      const promptData: Omit<
        Prompt,
        'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'
      > &
        Record<string, any> = {
        title: current.title.trim(),
        content: current.content.trim(),
        category: current.category.trim(),
        tags: current.tags,
        shortcut: current.shortcut.trim() || undefined,
        variables: extractVariables(current.content),
        skillModeEnabled: current.skillModeEnabled,
        systemPrompt: current.systemPrompt,
        knowledgeFragments: current.knowledgeFragments,
        outputFormat: current.outputFormat,
        lengthLimit: current.lengthLimit,
        tone: current.tone,
        excludedContent: current.excludedContent,
      };

      if (editingPrompt) {
        await updatePrompt(editingPrompt.id, promptData);
        showNotification({
          type: 'success',
          message: 'Prompt updated successfully',
        });
      } else {
        await addPrompt(promptData);
        showNotification({
          type: 'success',
          message: 'Prompt created successfully',
        });
      }

      handleClose();
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save prompt',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleHistoryClick = () => {
    openModal('history');
  };

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors()[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleOptimize = async (providerId: string): Promise<string> => {
    const content = formState().content;
    if (!content.trim()) {
      throw new Error('No content to optimize');
    }

    const response = await chrome.runtime.sendMessage({
      type: 'OPTIMIZE_PROMPT',
      content,
      providerId,
    });

    if (!response.success) {
      throw new Error(response.error || 'Optimization failed');
    }

    return response.optimizedContent;
  };

  const handleOptimizeAccept = (optimizedContent: string) => {
    updateField('content', optimizedContent);
    showNotification({
      type: 'success',
      message: 'Optimization applied',
    });
  };

  const handleOptimizeReject = () => {};

  const handleTranslate = async (content: string, targetLang: string): Promise<string> => {
    if (!content.trim()) {
      throw new Error('No content to translate');
    }

    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_PROMPT',
      content,
      targetLang,
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    return response.translatedContent;
  };

  const handleTranslateAccept = (translatedContent: string) => {
    updateField('content', translatedContent);
    showNotification({
      type: 'success',
      message: 'Translation applied',
    });
  };

  const footer = () => (
    <div class="form-actions">
      <Button variant="ghost" onClick={handleHistoryClick}>
        History
      </Button>
      <div class="form-actions-spacer" />
      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave} disabled={isSaving()}>
        {isSaving() ? 'Saving...' : isEditMode() ? 'Save' : 'Create'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen()}
      onClose={handleClose}
      title={modalTitle()}
      footer={footer()}
      className="edit-modal"
    >
      <div class="edit-modal-container">
        <div class="edit-modal-tabs">
          <button
            type="button"
            class={`edit-modal-tab ${activeTab() === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic
          </button>
          <button
            type="button"
            class={`edit-modal-tab ${activeTab() === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content
          </button>
          <button
            type="button"
            class={`edit-modal-tab ${activeTab() === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <div class="edit-modal-body">
          <Show when={activeTab() === 'basic'}>
            <BasicForm
              title={formState().title}
              category={formState().category}
              shortcut={formState().shortcut}
              onTitleChange={value => updateField('title', value)}
              onCategoryChange={value => updateField('category', value)}
              onShortcutChange={value => updateField('shortcut', value)}
              errors={errors()}
              existingCategories={existingCategories()}
            />
          </Show>

          <Show when={activeTab() === 'content'}>
            <ContentEditor
              content={formState().content}
              onChange={value => updateField('content', value)}
            />
            {errors().content && <span class="error-message">{errors().content}</span>}
          </Show>

          <Show when={activeTab() === 'advanced'}>
            <div class="advanced-sections">
              <div class="advanced-section">
                <h4 class="section-title">AI Optimization</h4>
                <OptimizePanel
                  originalContent={formState().content}
                  providers={providers()}
                  activeProviderId={activeProviderId()}
                  onOptimize={handleOptimize}
                  onAccept={handleOptimizeAccept}
                  onReject={handleOptimizeReject}
                />
              </div>

              <div class="advanced-section">
                <h4 class="section-title">Translation</h4>
                <TranslationPanel
                  originalContent={formState().content}
                  onTranslate={handleTranslate}
                  onAccept={handleTranslateAccept}
                />
              </div>

              <div class="advanced-section">
                <h4 class="section-title">Skill Mode</h4>
                <SkillModeSection
                  enabled={formState().skillModeEnabled}
                  systemPrompt={formState().systemPrompt}
                  knowledgeFragments={formState().knowledgeFragments}
                  onEnabledChange={enabled => updateField('skillModeEnabled', enabled)}
                  onSystemPromptChange={value => updateField('systemPrompt', value)}
                  onFragmentsChange={fragments => updateField('knowledgeFragments', fragments)}
                />
              </div>

              <div class="advanced-section">
                <h4 class="section-title">Output Rules</h4>
                <ContractBuilder
                  outputFormat={formState().outputFormat}
                  lengthLimit={formState().lengthLimit}
                  tone={formState().tone}
                  excludedContent={formState().excludedContent}
                  onOutputFormatChange={format => updateField('outputFormat', format)}
                  onLengthLimitChange={limit => updateField('lengthLimit', limit)}
                  onToneChange={tone => updateField('tone', tone)}
                  onExcludedContentChange={content => updateField('excludedContent', content)}
                />
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Modal>
  );
}

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  const variables = matches.map(match => {
    const inner = match.slice(2, -2);
    return inner.split(':')[0].trim();
  });

  return [...new Set(variables)];
}
