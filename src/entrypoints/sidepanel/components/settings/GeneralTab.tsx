import { For } from "solid-js";
import type { JSX } from 'solid-js';
import { useSettingsStore } from '@/stores/settingsStore';
import { Input } from '../ui/Input';
import type { Platform } from '@shared/types/platform';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
] as const;

const PLATFORMS: { value: Platform | ''; label: string }[] = [
  { value: '', label: 'Auto-detect' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'claude', label: 'Claude' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'notebooklm', label: 'NotebookLM' },
  { value: 'aistudio', label: 'AI Studio' },
  { value: 'grok', label: 'Grok' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'kimi', label: 'Kimi' },
  { value: 'zhipu', label: 'Zhipu (智谱)' },
  { value: 'doubao', label: 'Doubao (豆包)' },
  { value: 'wenxin', label: 'Wenxin (文心)' },
  { value: 'qwen', label: 'Qwen (通义千问)' },
  { value: 'minimax', label: 'MiniMax' },
  { value: 'hunyuan', label: 'Hunyuan (混元)' },
  { value: 'generic', label: 'Generic' },
];

export function GeneralTab(): JSX.Element {
  const store = useSettingsStore();

  const handleLanguageChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    store.updateGeneralSettings({ language: target.value as 'en' | 'zh' });
  };

  const handlePlatformChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    store.updateGeneralSettings({ defaultPlatform: target.value });
  };

  const handleGithubTokenChange = (value: string) => {
    store.updateGeneralSettings({ githubToken: value });
  };

  const handleOpenClawToggle = (e: Event) => {
    const target = e.target as HTMLInputElement;
    store.updateGeneralSettings({ openClawEnabled: target.checked });
  };

  const handleImagePromptToggle = (e: Event) => {
    const target = e.target as HTMLInputElement;
    store.updateGeneralSettings({ imagePromptEnabled: target.checked });
  };

  return (
    <div class="space-y-5">
      <div class="form-group">
        <label for="language">Language</label>
        <select
          id="language"
          class="settings-input"
          value={store.general.language}
          onChange={handleLanguageChange}
        >
          <For each={LANGUAGES}>{lang => (
            <option value={lang.value}>{lang.label}</option>
          )}</For>
        </select>
      </div>

      <div class="form-group">
        <label for="defaultPlatform">Default AI Platform</label>
        <select
          id="defaultPlatform"
          class="settings-input"
          value={store.general.defaultPlatform}
          onChange={handlePlatformChange}
        >
          <For each={PLATFORMS}>{platform => (
            <option value={platform.value}>{platform.label}</option>
          )}</For>
        </select>
      </div>

      <div class="form-group">
        <label for="githubToken">
          GitHub Token
          <span class="hint">for Gist sync</span>
        </label>
        <Input
          type="password"
          value={store.general.githubToken}
          onChange={handleGithubTokenChange}
          placeholder="ghp_xxxxxxxxxxxx"
        />
      </div>

      <div class="form-group">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={store.general.openClawEnabled}
            onChange={handleOpenClawToggle}
            class="border-border bg-bg-input text-accent focus:ring-accent h-4 w-4 rounded focus:ring-2"
          />
          <span>Enable OpenClaw</span>
        </label>
      </div>

      <div class="form-group">
        <label class="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={store.general.imagePromptEnabled}
            onChange={handleImagePromptToggle}
            class="border-border bg-bg-input text-accent focus:ring-accent h-4 w-4 rounded focus:ring-2"
          />
          <span>Enable Image Prompt Generation</span>
        </label>
      </div>
    </div>
  );
}
