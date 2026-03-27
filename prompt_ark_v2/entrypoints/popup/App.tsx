import { createSignal, onMount } from 'solid-js';
import { useI18n } from '../../src/i18n/context';
import { settingsStore } from '../../src/stores/settingsStore';
import './style.css';

export default function App() {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = createSignal('');
  const [isGenerating, setIsGenerating] = createSignal(false);
  const [generatedPrompt, setGeneratedPrompt] = createSignal('');
  const [error, setError] = createSignal('');

  onMount(async () => {
    await settingsStore.loadSettings();
  });

  const handleGenerate = async () => {
    const url = imageUrl().trim();
    if (!url) {
      setError(t('imagePrompt.emptyData'));
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedPrompt('');

    try {
      const result = await browser.runtime.sendMessage({
        type: 'OPTIMIZE_PROMPT',
        payload: {
          content: `Analyze this image and generate a detailed prompt for AI image generation: ${url}`,
          providerId: 'default',
          variant: 'enhanced',
        },
      });

      if (result.success) {
        setGeneratedPrompt(result.data.optimized);
      } else {
        setError(result.error || t('imagePrompt.error'));
      }
    } catch (e) {
      setError(t('imagePrompt.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt());
  };

  const handleSave = async () => {
    await browser.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      payload: {
        prompt: {
          title: `Image Prompt ${new Date().toLocaleDateString()}`,
          content: generatedPrompt(),
          category: 'Image',
        },
      },
    });
    alert(t('action.saveSuccess'));
  };

  return (
    <div class="min-w-[400px] min-h-[300px] bg-surface-50 p-6">
      <header class="mb-6">
        <h1 class="text-xl font-bold text-surface-900">{t('app.name')}</h1>
        <p class="text-sm text-surface-500">{t('imagePrompt.feature')}</p>
      </header>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-2">
            {t('import.tabUrl')}
          </label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl()}
            onInput={(e) => setImageUrl(e.currentTarget.value)}
            class="w-full rounded-lg border border-surface-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>

        {error() && (
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error()}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating()}
          class="w-full rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
        >
          {isGenerating() ? t('imagePrompt.generating') : t('imagePrompt.feature')}
        </button>

        {generatedPrompt() && (
          <div class="space-y-3">
            <div class="rounded-lg bg-white border border-surface-200 p-4">
              <p class="text-sm text-surface-700 whitespace-pre-wrap">
                {generatedPrompt()}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                onClick={handleCopy}
                class="flex-1 rounded-lg border border-surface-300 px-4 py-2 text-sm hover:bg-surface-100"
              >
                {t('action.copy')}
              </button>
              <button
                onClick={handleSave}
                class="flex-1 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
              >
                {t('action.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
