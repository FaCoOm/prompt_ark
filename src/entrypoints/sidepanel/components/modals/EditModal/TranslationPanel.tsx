import type { JSX } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { Button } from '../../ui/Button';

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'ZH', name: '中文' },
  { code: 'JP', name: '日本語' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'KO', name: '한국어' },
] as const;

export interface TranslationPanelProps {
  originalContent: string;
  onTranslate: (content: string, targetLang: string) => Promise<string>;
  onAccept: (translatedContent: string) => void;
}

export function TranslationPanel(props: TranslationPanelProps): JSX.Element {
  const [selectedLang, setSelectedLang] = createSignal<string>('EN');
  const [isTranslating, setIsTranslating] = createSignal(false);
  const [translatedContent, setTranslatedContent] = createSignal<string>('');
  const [error, setError] = createSignal<string>('');

  const langSelectId = `lang-select-${Math.random().toString(36).substring(2, 9)}`;
  const resultId = `translation-result-${Math.random().toString(36).substring(2, 9)}`;

  const handleTranslate = async () => {
    if (!props.originalContent.trim()) {
      setError('No content to translate');
      return;
    }

    setError('');
    setIsTranslating(true);
    setTranslatedContent('');

    try {
      const result = await props.onTranslate(props.originalContent, selectedLang());
      setTranslatedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAccept = () => {
    const content = translatedContent();
    if (content) {
      props.onAccept(content);
    }
  };

  return (
    <div class="translation-panel">
      <div class="form-group">
        <label for={langSelectId}>Target Language</label>
        <select
          id={langSelectId}
          class="language-selector"
          value={selectedLang()}
          onChange={e => setSelectedLang(e.currentTarget.value)}
          disabled={isTranslating()}
        >
          {LANGUAGES.map(lang => (
            <option value={lang.code}>
              {lang.code} ({lang.name})
            </option>
          ))}
        </select>
      </div>

      <div class="form-group">
        <Button
          variant="primary"
          onClick={handleTranslate}
          disabled={isTranslating() || !props.originalContent.trim()}
        >
          {isTranslating() ? 'Translating...' : 'Translate'}
        </Button>
      </div>

      <Show when={isTranslating()}>
        <div class="progress-indicator">
          <div class="progress-bar" />
          <span class="progress-text">Translating...</span>
        </div>
      </Show>

      <Show when={error()}>
        <div class="error-message">{error()}</div>
      </Show>

      <Show when={translatedContent() && !isTranslating()}>
        <div class="translation-result">
          <label for={resultId}>Translated Result</label>
          <div id={resultId} class="translation-content">
            {translatedContent()}
          </div>
          <div class="translation-actions">
            <Button variant="primary" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
