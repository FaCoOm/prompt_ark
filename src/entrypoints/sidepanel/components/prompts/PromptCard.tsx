import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show, untrack, For } from 'solid-js';
import type { Prompt } from '@shared/types/prompt';
import { usePromptStore } from '@stores/promptStore';
import { useUIStore } from '../../stores/uiStore';

import { marked } from 'marked';

const StarIcon = (props: { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={props.filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShareIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const ZapIcon = (props: { active?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={props.active ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const CopyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckSquareIcon = (props: { checked?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={props.checked ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <Show when={props.checked}>
      <polyline points="9 11 12 14 22 4" />
    </Show>
  </svg>
);

const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface PromptCardProps {
  prompt: Prompt;
  isPackMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onInsert?: (prompt: Prompt) => void;
}

function highlightVariables(content: string): string {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return escaped.replace(/\{\{([^}]+)\}\}/g, '<span class="prompt-variable">{{$1}}</span>');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()  }...`;
}

export function PromptCard(props: PromptCardProps): JSX.Element {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();
  const [isSkillActive, setIsSkillActive] = createSignal(false);
  const [showPreview, setShowPreview] = createSignal(false);

  const markdownPreview = createMemo(() => {
    const prompt = untrack(() => props.prompt);
    const truncated = truncateText(prompt.content, 150);
    try {
      const html = marked.parse(truncated, { async: false });
      const textOnly = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return textOnly;
    } catch {
      return truncated;
    }
  });

  const variables = createMemo(() => {
    const matches = props.prompt.content.match(/\{\{([^}]+)\}\}/g);
    return matches ? matches.map(v => v.slice(2, -2)) : [];
  });

  const qualityScore = createMemo(() => {
    const usage = props.prompt.usageCount;
    if (usage > 50) return 95;
    if (usage > 20) return 85;
    if (usage > 5) return 75;
    return 60;
  });

  const handleFavorite = async () => {
    try {
      await promptStore.toggleFavorite(props.prompt.id);
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to toggle favorite',
      });
    }
  };

  const handleShare = () => {
    try {
      promptStore.setEditingPrompt(props.prompt);
      uiStore.openModal('share');
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open share modal',
      });
    }
  };

  const handleSkillToggle = () => {
    try {
      const newState = !isSkillActive();
      setIsSkillActive(newState);
      uiStore.showNotification({
        type: 'info',
        message: newState ? 'Skill activated' : 'Skill deactivated',
      });
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to toggle skill',
      });
    }
  };

  const handleInsert = async () => {
    try {
      if (props.onInsert) {
        props.onInsert(props.prompt);
      } else {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          throw new Error('No active tab found');
        }

        await browser.tabs.sendMessage(tab.id, {
          type: 'INSERT_PROMPT',
          prompt: props.prompt,
        });

        uiStore.showNotification({
          type: 'success',
          message: 'Prompt inserted successfully',
        });
      }
      await promptStore.trackUsage(props.prompt.id);
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to insert prompt',
      });
    }
  };

  const handleEdit = () => {
    try {
      promptStore.setEditingPrompt(props.prompt);
      uiStore.openModal('edit');
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open edit modal',
      });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.prompt.content);
      uiStore.showNotification({
        type: 'success',
        message: 'Copied to clipboard',
      });
    } catch {
      uiStore.showNotification({
        type: 'error',
        message: 'Failed to copy',
      });
    }
  };

  const handleTranslate = () => {
    try {
      promptStore.setEditingPrompt(props.prompt);
      uiStore.openModal('edit');
      uiStore.setEditModalTab('advanced');
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open translation panel',
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (confirm(`Delete "${props.prompt.title}"?`)) {
        await promptStore.deletePrompt(props.prompt.id);
        uiStore.showNotification({
          type: 'success',
          message: 'Prompt deleted',
        });
      }
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to delete prompt',
      });
    }
  };

  const handlePackSelect = () => {
    try {
      if (props.onSelect) {
        props.onSelect(props.prompt.id);
      }
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to select prompt',
      });
    }
  };

  const handlePreview = () => {
    try {
      setShowPreview(!showPreview());
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to toggle preview',
      });
    }
  };

  const handleHistory = () => {
    try {
      promptStore.setEditingPrompt(props.prompt);
      uiStore.openModal('history');
    } catch (error) {
      uiStore.showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to open history modal',
      });
    }
  };

  return (
    <div class="prompt-item" data-prompt-id={props.prompt.id}>
      <div class="prompt-main">
        <div class="prompt-header">
          <h3 class="prompt-title" title={props.prompt.title}>
            {props.prompt.title}
          </h3>
          <div class="prompt-actions">
            <button
              type="button"
              class="action-btn"
              classList={{ 'text-accent': props.prompt.favorite }}
              onClick={handleFavorite}
              title={props.prompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <StarIcon filled={props.prompt.favorite} />
            </button>
          </div>
        </div>

        <div class="prompt-preview">
          <Show
            when={showPreview()}
            fallback={<span innerHTML={highlightVariables(markdownPreview())} />}
          >
            <div class="bg-surface rounded p-3 text-sm">
              <div innerHTML={String(marked.parse(props.prompt.content, { async: false }))} />
            </div>
          </Show>
        </div>

        <div class="prompt-meta">
          <span class="prompt-category">{props.prompt.category}</span>

          <For each={props.prompt.tags.slice(0, 3)}>{tag => (
            <span class="prompt-tag">{tag}</span>
          )}</For>

          {variables().length > 0 && (
            <span class="prompt-vars" title={`Variables: ${variables().join(', ')}`}>
              {variables().length} vars
            </span>
          )}

          <span class="prompt-shortcut" title="Usage count">
            {props.prompt.usageCount} uses
          </span>

          <span
            class="prompt-shortcut"
            style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
            }}
            title="Quality score"
          >
            ★ {qualityScore()}
          </span>
        </div>
      </div>

      <div class="prompt-actions" style={{ 'margin-top': '10px' }}>
        <button
          type="button"
          class="action-btn share-btn"
          onClick={handleShare}
          title="Share prompt"
        >
          <ShareIcon />
        </button>

        <button
          type="button"
          class="action-btn"
          classList={{ 'text-accent': isSkillActive() }}
          onClick={handleSkillToggle}
          title={isSkillActive() ? 'Deactivate skill' : 'Activate skill'}
        >
          <ZapIcon active={isSkillActive()} />
        </button>

        <button
          type="button"
          class="action-btn insert-btn"
          onClick={handleInsert}
          title="Insert to webpage"
        >
          <ArrowRightIcon />
        </button>

        <button type="button" class="action-btn" onClick={handleEdit} title="Edit prompt">
          <PencilIcon />
        </button>

        <button type="button" class="action-btn" onClick={handleCopy} title="Copy content">
          <CopyIcon />
        </button>

        <button
          type="button"
          class="action-btn translate-list-btn"
          onClick={handleTranslate}
          title="Translate prompt"
        >
          <GlobeIcon />
        </button>

        <button
          type="button"
          class="action-btn delete-btn"
          onClick={handleDelete}
          title="Delete prompt"
        >
          <TrashIcon />
        </button>

        <Show when={props.isPackMode}>
          <button
            type="button"
            class="action-btn"
            classList={{ 'text-success': props.isSelected }}
            onClick={handlePackSelect}
            title={props.isSelected ? 'Deselect' : 'Select for pack'}
          >
            <CheckSquareIcon checked={props.isSelected} />
          </button>
        </Show>

        <button
          type="button"
          class="action-btn"
          classList={{ 'text-info': showPreview() }}
          onClick={handlePreview}
          title={showPreview() ? 'Hide preview' : 'Show preview'}
        >
          <EyeIcon />
        </button>

        <button type="button" class="action-btn" onClick={handleHistory} title="View history">
          <ClockIcon />
        </button>
      </div>
    </div>
  );
}
