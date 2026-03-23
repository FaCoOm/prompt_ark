import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show } from 'solid-js';
import { useUIStore } from '../../../stores/uiStore';
import { usePromptStore } from '../../../../../stores/promptStore';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export function EditModal(): JSX.Element {
  const { modals, closeModal, openModal } = useUIStore();
  const { editingPrompt } = usePromptStore();

  const [isSaving, setIsSaving] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal('basic');

  const isEditMode = createMemo(() => editingPrompt !== null);
  const modalTitle = createMemo(() => (isEditMode() ? 'Edit Prompt' : 'New Prompt'));

  const isOpen = () => modals.edit;
  const handleClose = () => {
    closeModal('edit');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      handleClose();
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
            <div class="form-group">
              <div class="edit-modal-placeholder">Basic Form (Title, Category, Tags)</div>
            </div>
          </Show>

          <Show when={activeTab() === 'content'}>
            <div class="form-group">
              <div class="edit-modal-placeholder">Content Editor</div>
            </div>
          </Show>

          <Show when={activeTab() === 'advanced'}>
            <div class="form-group">
              <div class="edit-modal-placeholder">Advanced Settings (Shortcut, Variables)</div>
            </div>
          </Show>
        </div>
      </div>
    </Modal>
  );
}
