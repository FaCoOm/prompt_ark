import type { JSX } from 'solid-js';
import { createSignal, For, Show } from 'solid-js';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Provider, ProviderType } from '@shared/types/provider';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface ProviderFormData {
  name: string;
  type: ProviderType;
  apiUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_FORM_DATA: ProviderFormData = {
  name: '',
  type: 'openai',
  apiUrl: '',
  apiKey: '',
  model: '',
};

export function ModelsTab(): JSX.Element {
  const settingsStore = useSettingsStore();
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [editingProvider, setEditingProvider] = createSignal<Provider | null>(null);
  const [formData, setFormData] = createSignal<ProviderFormData>(DEFAULT_FORM_DATA);
  const [visionModel, setVisionModel] = createSignal(settingsStore.models.visionModel);

  const handleOpenAdd = () => {
    setEditingProvider(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      apiUrl:
        provider.type === 'openai'
          ? (provider as Extract<Provider, { type: 'openai' }>).apiUrl
          : '',
      apiKey:
        provider.type === 'gemini-web'
          ? ''
          : (provider as Extract<Provider, { type: 'gemini' | 'openai' }>).apiKey,
      model:
        provider.type === 'gemini-web'
          ? ''
          : (provider as Extract<Provider, { type: 'gemini' | 'openai' }>).model,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
    setFormData(DEFAULT_FORM_DATA);
  };

  const handleSaveProvider = () => {
    const data = formData();

    if (!data.name.trim()) return;

    const baseProvider = {
      name: data.name.trim(),
      type: data.type,
      enabled: true,
    };

    if (editingProvider()) {
      const updates: Partial<Provider> = { ...baseProvider };

      if (data.type === 'openai') {
        (updates as Extract<Provider, { type: 'openai' }>).apiUrl = data.apiUrl.trim();
        (updates as Extract<Provider, { type: 'openai' }>).apiKey = data.apiKey.trim();
        (updates as Extract<Provider, { type: 'openai' }>).model = data.model.trim();
      } else if (data.type === 'gemini') {
        (updates as Extract<Provider, { type: 'gemini' }>).apiKey = data.apiKey.trim();
        (updates as Extract<Provider, { type: 'gemini' }>).model = data.model.trim();
      }

      settingsStore.updateProvider(editingProvider()!.id, updates);
    } else {
      const newProvider: Provider = {
        ...baseProvider,
        id: crypto.randomUUID(),
      } as Provider;

      if (data.type === 'openai') {
        (newProvider as Extract<Provider, { type: 'openai' }>).apiUrl = data.apiUrl.trim();
        (newProvider as Extract<Provider, { type: 'openai' }>).apiKey = data.apiKey.trim();
        (newProvider as Extract<Provider, { type: 'openai' }>).model = data.model.trim();
      } else if (data.type === 'gemini') {
        (newProvider as Extract<Provider, { type: 'gemini' }>).apiKey = data.apiKey.trim();
        (newProvider as Extract<Provider, { type: 'gemini' }>).model = data.model.trim();
      }

      settingsStore.addProvider(newProvider);
    }

    handleCloseModal();
  };

  const handleDeleteProvider = (provider: Provider) => {
    if (confirm(`Are you sure you want to delete "${provider.name}"?`)) {
      settingsStore.removeProvider(provider.id);
    }
  };

  const handleVisionModelChange = (value: string) => {
    setVisionModel(value);
    settingsStore.updateModelSettings({ visionModel: value });
  };

  const getProviderTypeLabel = (type: ProviderType): string => {
    switch (type) {
      case 'openai':
        return 'OpenAI Compatible';
      case 'gemini':
        return 'Gemini API';
      case 'gemini-web':
        return 'Gemini Web';
      default:
        return type;
    }
  };

  const showApiUrlField = () => formData().type === 'openai';
  const showApiKeyField = () => formData().type !== 'gemini-web';
  const showModelField = () => formData().type !== 'gemini-web';

  return (
    <div class="settings-tab-content">
      <div class="settings-section">
        <div class="settings-section-header">
          <h3>AI Providers</h3>
          <Button variant="primary" onClick={handleOpenAdd} className="btn-small">
            + Add Provider
          </Button>
        </div>

        <div class="provider-list">
          <For each={settingsStore.models.providers}>
            {provider => (
              <div class="provider-item">
                <div class="provider-info">
                  <div class="provider-name">{provider.name}</div>
                  <div class="provider-type">{getProviderTypeLabel(provider.type)}</div>
                  <Show when={provider.type !== 'gemini-web'}>
                    <div class="provider-model">
                      {(provider as Extract<Provider, { type: 'gemini' | 'openai' }>).model}
                    </div>
                  </Show>
                </div>
                <div class="provider-actions">
                  <button
                    type="button"
                    class="action-btn"
                    onClick={() => handleOpenEdit(provider)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    class="action-btn delete-btn"
                    onClick={() => handleDeleteProvider(provider)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </For>

          <Show when={settingsStore.models.providers.length === 0}>
            <div class="empty-state">
              <p>No providers configured</p>
              <p class="hint">Add a provider to use AI features</p>
            </div>
          </Show>
        </div>
      </div>

      <div class="settings-section">
        <h3>Vision Model</h3>
        <div class="form-group">
          <label for="vision-model-input">Default Vision Model</label>
          <Input
            value={visionModel()}
            onChange={handleVisionModelChange}
            placeholder="e.g., gemini-pro-vision"
            className="settings-input"
          />
          <p class="hint">Model used for image analysis and vision tasks</p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen()}
        onClose={handleCloseModal}
        title={editingProvider() ? 'Edit Provider' : 'Add Provider'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProvider}>
              {editingProvider() ? 'Save Changes' : 'Add Provider'}
            </Button>
          </>
        }
      >
        <div class="provider-form">
          <div class="form-group">
            <label for="provider-name">Name</label>
            <Input
              value={formData().name}
              onChange={value => setFormData({ ...formData(), name: value })}
              placeholder="e.g., My OpenAI Provider"
              className="settings-input"
            />
          </div>

          <div class="form-group">
            <label for="provider-type">Type</label>
            <select
              id="provider-type"
              class="settings-input"
              value={formData().type}
              onChange={e =>
                setFormData({ ...formData(), type: e.currentTarget.value as ProviderType })
              }
            >
              <option value="openai">OpenAI Compatible</option>
              <option value="gemini">Gemini API</option>
              <option value="gemini-web">Gemini Web (Free)</option>
            </select>
          </div>

          <Show when={showApiUrlField()}>
            <div class="form-group">
              <label for="provider-api-url">API URL</label>
              <Input
                value={formData().apiUrl}
                onChange={value => setFormData({ ...formData(), apiUrl: value })}
                placeholder="https://api.openai.com/v1/chat/completions"
                className="settings-input"
              />
            </div>
          </Show>

          <Show when={showApiKeyField()}>
            <div class="form-group">
              <label for="provider-api-key">API Key</label>
              <Input
                type="password"
                value={formData().apiKey}
                onChange={value => setFormData({ ...formData(), apiKey: value })}
                placeholder="sk-..."
                className="settings-input"
              />
            </div>
          </Show>

          <Show when={showModelField()}>
            <div class="form-group">
              <label for="provider-model">Model</label>
              <Input
                value={formData().model}
                onChange={value => setFormData({ ...formData(), model: value })}
                placeholder="e.g., gpt-4, gemini-pro"
                className="settings-input"
              />
            </div>
          </Show>
        </div>
      </Modal>
    </div>
  );
}
