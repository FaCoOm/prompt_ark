import type { JSX } from 'solid-js';
import { Show } from 'solid-js';
import type { Prompt } from '@shared/types/prompt';

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
    <title>Star</title>
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
    <title>Share</title>
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
    <title>Zap</title>
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
    <title>Arrow Right</title>
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
    <title>Edit</title>
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
    <title>Copy</title>
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
    <title>Translate</title>
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
    <title>Delete</title>
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
    <title>Select</title>
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
    <title>Preview</title>
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
    <title>History</title>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export interface PromptActionsProps {
  prompt: Prompt;
  isPackMode: boolean;
  isSelected: boolean;
  isFavorite: boolean;
  isSkillActive: boolean;
  showPreview: boolean;
  onFavorite: () => void;
  onShare: () => void;
  onSkill: () => void;
  onInsert: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onTranslate: () => void;
  onDelete: () => void;
  onPackSelect: () => void;
  onPreview: () => void;
  onHistory: () => void;
}

export function PromptActions(props: PromptActionsProps): JSX.Element {
  const handleDelete = () => {
    if (confirm(`Delete "${props.prompt.title}"?`)) {
      props.onDelete();
    }
  };

  return (
    <div class="prompt-actions">
      <button
        type="button"
        class="action-btn"
        classList={{ 'text-accent': props.isFavorite }}
        onClick={props.onFavorite}
        title={props.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <StarIcon filled={props.isFavorite} />
      </button>

      <button
        type="button"
        class="action-btn share-btn"
        onClick={props.onShare}
        title="Share prompt"
      >
        <ShareIcon />
      </button>

      <button
        type="button"
        class="action-btn"
        classList={{ 'text-accent': props.isSkillActive }}
        onClick={props.onSkill}
        title={props.isSkillActive ? 'Deactivate skill' : 'Activate skill'}
      >
        <ZapIcon active={props.isSkillActive} />
      </button>

      <button
        type="button"
        class="action-btn insert-btn"
        onClick={props.onInsert}
        title="Insert to webpage"
      >
        <ArrowRightIcon />
      </button>

      <button type="button" class="action-btn" onClick={props.onEdit} title="Edit prompt">
        <PencilIcon />
      </button>

      <button type="button" class="action-btn" onClick={props.onCopy} title="Copy content">
        <CopyIcon />
      </button>

      <button
        type="button"
        class="action-btn translate-list-btn"
        onClick={props.onTranslate}
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
          onClick={props.onPackSelect}
          title={props.isSelected ? 'Deselect' : 'Select for pack'}
        >
          <CheckSquareIcon checked={props.isSelected} />
        </button>
      </Show>

      <button
        type="button"
        class="action-btn"
        classList={{ 'text-info': props.showPreview }}
        onClick={props.onPreview}
        title={props.showPreview ? 'Hide preview' : 'Show preview'}
      >
        <EyeIcon />
      </button>

      <button type="button" class="action-btn" onClick={props.onHistory} title="View history">
        <ClockIcon />
      </button>
    </div>
  );
}
