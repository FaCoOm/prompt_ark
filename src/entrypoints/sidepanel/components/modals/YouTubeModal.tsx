import type { JSX } from 'solid-js';
import { createSignal, createMemo, Show, For } from 'solid-js';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Prompt } from '../../../../shared/types/prompt';

export interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    url: string,
    mode: string,
    language: string
  ) => Promise<{
    visualDict: Array<{ term: string; description: string }>;
    inspirations: string[];
    storyboard: Array<{ timestamp: string; description: string }>;
    template: string;
  }>;
  onSave: (prompt: Partial<Prompt>) => void;
}

type ModeType = 'style-transfer' | 'full-analysis' | 'inspiration-creation' | 'content-extraction';

interface ModeOption {
  id: ModeType;
  label: string;
  description: string;
}

interface LanguageOption {
  code: string;
  label: string;
}

const MODES: ModeOption[] = [
  {
    id: 'style-transfer',
    label: 'Style Transfer',
    description: 'Extract and apply visual/tonal style patterns',
  },
  {
    id: 'full-analysis',
    label: 'Full Analysis',
    description: 'Comprehensive breakdown of content structure and techniques',
  },
  {
    id: 'inspiration-creation',
    label: 'Inspiration Creation',
    description: 'Generate creative prompts based on video content',
  },
  {
    id: 'content-extraction',
    label: 'Content Extraction',
    description: 'Pull out key information, quotes, and timestamps',
  },
];

const LANGUAGES: LanguageOption[] = [
  { code: 'EN', label: 'English' },
  { code: 'ZH', label: 'Chinese' },
  { code: 'JP', label: 'Japanese' },
  { code: 'ES', label: 'Spanish' },
  { code: 'FR', label: 'French' },
  { code: 'DE', label: 'German' },
  { code: 'KO', label: 'Korean' },
];

interface GenerateResult {
  visualDict: Array<{ term: string; description: string }>;
  inspirations: string[];
  storyboard: Array<{ timestamp: string; description: string }>;
  template: string;
}

export function YouTubeModal(props: YouTubeModalProps): JSX.Element {
  const [selectedMode, setSelectedMode] = createSignal<ModeType>('full-analysis');
  const [selectedLanguage, setSelectedLanguage] = createSignal<string>('EN');
  const [url, setUrl] = createSignal<string>('');
  const [isGenerating, setIsGenerating] = createSignal<boolean>(false);
  const [result, setResult] = createSignal<GenerateResult | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedInspiration, setSelectedInspiration] = createSignal<number>(0);
  const [variableValues, setVariableValues] = createSignal<Record<string, string>>({});

  const isValidUrl = createMemo(() => {
    const urlValue = url().trim();
    if (!urlValue) return false;
    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(urlValue);
  });

  const handleGenerate = async () => {
    if (!isValidUrl()) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const generateResult = await props.onGenerate(
        url().trim(),
        selectedMode(),
        selectedLanguage()
      );
      setResult(generateResult);

      // Initialize variable values from template
      const variables = extractVariables(generateResult.template);
      const initialValues: Record<string, string> = {};
      variables.forEach(v => {
        initialValues[v] = '';
      });
      setVariableValues(initialValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const currentResult = result();
    if (!currentResult) return;

    const promptData: Partial<Prompt> = {
      title: `YouTube Analysis: ${url().slice(0, 50)}...`,
      content: currentResult.template,
      category: 'YouTube Analysis',
      tags: ['youtube', selectedMode(), selectedLanguage()],
      variables: extractVariables(currentResult.template),
    };

    props.onSave(promptData);
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [variable]: value }));
  };

  const getProcessedTemplate = createMemo(() => {
    const currentResult = result();
    if (!currentResult) return '';

    let processed = currentResult.template;
    const vars = variableValues();
    Object.entries(vars).forEach(([key, value]) => {
      if (value) {
        processed = processed.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }
    });
    return processed;
  });

  const handleClose = () => {
    setSelectedMode('full-analysis');
    setSelectedLanguage('EN');
    setUrl('');
    setResult(null);
    setError(null);
    setVariableValues({});
    props.onClose();
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="YouTube Video Analysis"
      className="youtube-modal"
    >
      <div class="youtube-modal-content">
        {/* Mode Selector */}
        <div class="mode-selector">
          <span class="field-label">Analysis Mode</span>
          <div class="mode-options">
            <For each={MODES}>
              {mode => (
                <button
                  type="button"
                  class={`mode-option ${selectedMode() === mode.id ? 'active' : ''}`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  <span class="mode-label">{mode.label}</span>
                  <span class="mode-description">{mode.description}</span>
                </button>
              )}
            </For>
          </div>
        </div>

        {/* Language Selector */}
        <div class="language-selector">
          <label class="field-label" for="language-select">
            Target Language
          </label>
          <select
            id="language-select"
            class="language-select"
            value={selectedLanguage()}
            onChange={e => setSelectedLanguage(e.currentTarget.value)}
          >
            <For each={LANGUAGES}>{lang => <option value={lang.code}>{lang.label}</option>}</For>
          </select>
        </div>

        {/* URL Input */}
        <div class="url-input-section">
          <label class="field-label" for="youtube-url">
            YouTube URL
          </label>
          <Input
            value={url()}
            onChange={setUrl}
            placeholder="https://youtube.com/watch?v=..."
            className="youtube-url-input"
          />
        </div>

        {/* Error Display */}
        <Show when={error()}>
          <div class="error-message">{error()}</div>
        </Show>

        {/* Generate Button */}
        <div class="generate-section">
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating() || !isValidUrl()}
            className="generate-btn"
          >
            {isGenerating() ? 'Generating...' : 'Generate'}
          </Button>
        </div>

        {/* Result Panels */}
        <Show when={result()}>
          {r => (
            <div class="result-panels">
              {/* Visual Dictionary */}
              <div class="result-panel visual-dict">
                <h4 class="panel-title">Visual Dictionary</h4>
                <div class="panel-content">
                  <Show
                    when={r().visualDict.length > 0}
                    fallback={<p class="empty-message">No visual terms extracted</p>}
                  >
                    <ul class="dict-list">
                      <For each={r().visualDict}>
                        {item => (
                          <li class="dict-item">
                            <button
                              type="button"
                              class="dict-term-btn"
                              onClick={() => {
                                // Copy term to clipboard or insert into template
                                navigator.clipboard.writeText(item.term);
                              }}
                              title="Click to copy"
                            >
                              <span class="dict-term">{item.term}</span>
                              <span class="dict-description">{item.description}</span>
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>
              </div>

              {/* Inspiration Playground */}
              <div class="result-panel inspiration-panel">
                <h4 class="panel-title">Inspiration Playground</h4>
                <div class="panel-content">
                  <Show
                    when={r().inspirations.length > 0}
                    fallback={<p class="empty-message">No inspirations generated</p>}
                  >
                    <div class="inspiration-tabs">
                      <For each={r().inspirations}>
                        {(_, index) => (
                          <button
                            type="button"
                            class={`inspiration-tab ${selectedInspiration() === index() ? 'active' : ''}`}
                            onClick={() => setSelectedInspiration(index())}
                          >
                            #{index() + 1}
                          </button>
                        )}
                      </For>
                    </div>
                    <div class="inspiration-content">
                      <p class="inspiration-text">{r().inspirations[selectedInspiration()]}</p>
                    </div>

                    {/* Variable Replacement */}
                    <div class="variable-section">
                      <h5 class="variable-title">Customize Variables</h5>
                      <For each={extractVariables(r().template)}>
                        {variable => (
                          <div class="variable-input-row">
                            <span class="variable-label">{`{{${variable}}}`}</span>
                            <Input
                              value={variableValues()[variable] || ''}
                              onChange={value => handleVariableChange(variable, value)}
                              placeholder={`Enter ${variable}...`}
                              className="variable-input"
                            />
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </div>

              {/* Storyboard */}
              <div class="result-panel storyboard">
                <h4 class="panel-title">Video Storyboard</h4>
                <div class="panel-content">
                  <Show
                    when={r().storyboard.length > 0}
                    fallback={<p class="empty-message">No storyboard items</p>}
                  >
                    <ul class="storyboard-list">
                      <For each={r().storyboard}>
                        {item => (
                          <li class="storyboard-item">
                            <span class="storyboard-timestamp">{item.timestamp}</span>
                            <span class="storyboard-description">{item.description}</span>
                          </li>
                        )}
                      </For>
                    </ul>
                  </Show>
                </div>
              </div>

              {/* Template Preview */}
              <div class="result-panel template-preview">
                <h4 class="panel-title">Prompt Template Preview</h4>
                <div class="panel-content">
                  <pre class="template-code">
                    <code>{getProcessedTemplate()}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Show>

        {/* Save Button */}
        <Show when={result()}>
          <div class="save-section">
            <Button variant="primary" onClick={handleSave} className="save-btn">
              Save as Prompt
            </Button>
          </div>
        </Show>
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
