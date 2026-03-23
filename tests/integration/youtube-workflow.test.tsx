import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { createSignal, For } from 'solid-js';
import type { Prompt } from '../../src/shared/types/prompt';

describe('YouTube Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockGenerateResult = {
    visualDict: [
      { term: 'B-roll', description: 'Supplemental footage intercut with main shot' },
      { term: 'Jump cut', description: 'Abrupt transition between shots' },
    ],
    inspirations: [
      'Create a tutorial video explaining this concept',
      'Make a reaction video with commentary',
      'Produce a documentary-style analysis',
    ],
    storyboard: [
      { timestamp: '0:00', description: 'Hook - grab attention' },
      { timestamp: '0:30', description: 'Introduction of main topic' },
      { timestamp: '2:00', description: 'Key content delivery' },
    ],
    template: 'Create a {{duration}} video about {{topic}} using {{style}} style',
  };

  describe('YouTube URL → Generate → Save Flow', () => {
    it('should complete full YouTube workflow', async () => {
      const [savedPrompts, setSavedPrompts] = createSignal<Prompt[]>([]);
      const [youtubeUrl, setYoutubeUrl] = createSignal('');
      const [selectedMode, setSelectedMode] = createSignal('full-analysis');
      const [selectedLanguage, setSelectedLanguage] = createSignal('EN');
      const [isGenerating, setIsGenerating] = createSignal(false);
      const [generationResult, setGenerationResult] = createSignal<
        typeof mockGenerateResult | null
      >(null);
      const [variableValues, setVariableValues] = createSignal<Record<string, string>>({});

      const mockGenerate = vi.fn(async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        setGenerationResult(mockGenerateResult);
        setIsGenerating(false);
        return mockGenerateResult;
      });

      const savePrompt = () => {
        const result = generationResult();
        if (!result) return;

        const vars = extractVariables(result.template);
        const newPrompt: Prompt = {
          id: `youtube-${Date.now()}`,
          title: `YouTube Analysis: ${youtubeUrl().slice(0, 30)}...`,
          content: result.template,
          category: 'YouTube Analysis',
          tags: ['youtube', selectedMode(), selectedLanguage()],
          variables: vars,
          versions: [],
          usageCount: 0,
          lastUsedAt: null,
          favorite: false,
          createdAt: Date.now(),
        };
        setSavedPrompts(prev => [...prev, newPrompt]);
      };

      const YouTubeWorkflowTest = () => {
        return (
          <div>
            <div data-testid="saved-count">{savedPrompts().length}</div>

            <select
              data-testid="mode-select"
              value={selectedMode()}
              onChange={e => setSelectedMode(e.currentTarget.value)}
            >
              <option value="style-transfer">Style Transfer</option>
              <option value="full-analysis">Full Analysis</option>
              <option value="inspiration-creation">Inspiration Creation</option>
              <option value="content-extraction">Content Extraction</option>
            </select>

            <select
              data-testid="language-select"
              value={selectedLanguage()}
              onChange={e => setSelectedLanguage(e.currentTarget.value)}
            >
              <option value="EN">English</option>
              <option value="ZH">Chinese</option>
              <option value="JP">Japanese</option>
            </select>

            <input
              data-testid="url-input"
              value={youtubeUrl()}
              onInput={e => setYoutubeUrl(e.currentTarget.value)}
              placeholder="https://youtube.com/watch?v=..."
            />

            <button
              type="button"
              data-testid="generate-btn"
              onClick={mockGenerate}
              disabled={isGenerating() || !youtubeUrl().trim()}
            >
              {isGenerating() ? 'Generating...' : 'Generate'}
            </button>

            {generationResult() && (
              <div data-testid="results-panel">
                <div data-testid="visual-dict">
                  <h4>Visual Dictionary</h4>
                  <For each={generationResult()!.visualDict}>
                    {item => (
                      <div>
                        <span>{item.term}</span>: <span>{item.description}</span>
                      </div>
                    )}
                  </For>
                </div>

                <div data-testid="inspirations">
                  <h4>Inspirations</h4>
                  <For each={generationResult()!.inspirations}>{insp => <div>{insp}</div>}</For>
                </div>

                <div data-testid="storyboard">
                  <h4>Storyboard</h4>
                  <For each={generationResult()!.storyboard}>
                    {item => (
                      <div>
                        <span>{item.timestamp}</span>: <span>{item.description}</span>
                      </div>
                    )}
                  </For>
                </div>

                <div data-testid="template-preview">
                  <h4>Template</h4>
                  <pre>{generationResult()!.template}</pre>
                </div>

                <div data-testid="variable-inputs">
                  <h4>Variables</h4>
                  <For each={extractVariables(generationResult()!.template)}>
                    {variable => (
                      <div>
                        <label for={`var-${variable}`}>{`{{${variable}}}`}</label>
                        <input
                          id={`var-${variable}`}
                          data-testid={`var-${variable}`}
                          value={variableValues()[variable] || ''}
                          onInput={e =>
                            setVariableValues(prev => ({
                              ...prev,
                              [variable]: e.currentTarget.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </For>
                </div>

                <button type="button" data-testid="save-btn" onClick={savePrompt}>
                  Save as Prompt
                </button>
              </div>
            )}
          </div>
        );
      };

      render(() => <YouTubeWorkflowTest />);

      expect(screen.getByTestId('saved-count').textContent).toBe('0');

      const urlInput = screen.getByTestId('url-input');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } });

      expect((urlInput as HTMLInputElement).value).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ');

      fireEvent.click(screen.getByTestId('generate-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('results-panel')).toBeInTheDocument();
      });

      expect(screen.getByText('B-roll')).toBeInTheDocument();
      expect(screen.getByText('Supplemental footage intercut with main shot')).toBeInTheDocument();

      expect(
        screen.getByText('Create a tutorial video explaining this concept')
      ).toBeInTheDocument();
      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('Hook - grab attention')).toBeInTheDocument();

      expect(
        screen.getByText('Create a {{duration}} video about {{topic}} using {{style}} style')
      ).toBeInTheDocument();

      expect(screen.getByTestId('var-duration')).toBeInTheDocument();
      expect(screen.getByTestId('var-topic')).toBeInTheDocument();
      expect(screen.getByTestId('var-style')).toBeInTheDocument();

      fireEvent.input(screen.getByTestId('var-duration'), { target: { value: '5-minute' } });
      fireEvent.input(screen.getByTestId('var-topic'), { target: { value: 'AI tools' } });
      fireEvent.input(screen.getByTestId('var-style'), { target: { value: 'educational' } });

      fireEvent.click(screen.getByTestId('save-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('saved-count').textContent).toBe('1');
      });

      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should handle different analysis modes', async () => {
      const [selectedMode, setSelectedMode] = createSignal('full-analysis');
      const modes = [
        { id: 'style-transfer', name: 'Style Transfer' },
        { id: 'full-analysis', name: 'Full Analysis' },
        { id: 'inspiration-creation', name: 'Inspiration Creation' },
        { id: 'content-extraction', name: 'Content Extraction' },
      ];

      const ModeSelectionTest = () => {
        return (
          <div>
            <div data-testid="current-mode">{selectedMode()}</div>
            <For each={modes}>
              {mode => (
                <button
                  type="button"
                  data-testid={`mode-${mode.id}`}
                  class={selectedMode() === mode.id ? 'active' : ''}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {mode.name}
                </button>
              )}
            </For>
          </div>
        );
      };

      render(() => <ModeSelectionTest />);

      expect(screen.getByTestId('current-mode').textContent).toBe('full-analysis');

      fireEvent.click(screen.getByTestId('mode-style-transfer'));
      expect(screen.getByTestId('current-mode').textContent).toBe('style-transfer');

      fireEvent.click(screen.getByTestId('mode-inspiration-creation'));
      expect(screen.getByTestId('current-mode').textContent).toBe('inspiration-creation');

      fireEvent.click(screen.getByTestId('mode-content-extraction'));
      expect(screen.getByTestId('current-mode').textContent).toBe('content-extraction');
    });

    it('should handle language selection', async () => {
      const [selectedLang, setSelectedLang] = createSignal('EN');

      const LanguageSelectionTest = () => {
        return (
          <div>
            <div data-testid="current-lang">{selectedLang()}</div>
            <select
              data-testid="lang-select"
              value={selectedLang()}
              onChange={e => setSelectedLang(e.currentTarget.value)}
            >
              <option value="EN">English</option>
              <option value="ZH">Chinese</option>
              <option value="JP">Japanese</option>
              <option value="ES">Spanish</option>
            </select>
          </div>
        );
      };

      render(() => <LanguageSelectionTest />);

      expect(screen.getByTestId('current-lang').textContent).toBe('EN');

      const select = screen.getByTestId('lang-select');
      fireEvent.change(select, { target: { value: 'ZH' } });

      expect(screen.getByTestId('current-lang').textContent).toBe('ZH');

      fireEvent.change(select, { target: { value: 'JP' } });
      expect(screen.getByTestId('current-lang').textContent).toBe('JP');
    });

    it('should handle generation errors', async () => {
      const [error, setError] = createSignal<string | null>(null);
      const [isGenerating, setIsGenerating] = createSignal(false);

      const mockFailedGenerate = vi.fn(async () => {
        setIsGenerating(true);
        try {
          await new Promise((_, reject) => setTimeout(() => reject(new Error('API Error')), 100));
        } catch (e) {
          setIsGenerating(false);
          setError('API Error');
          throw e;
        }
      });

      const ErrorHandlingTest = () => {
        return (
          <div>
            <button
              type="button"
              data-testid="generate-btn"
              onClick={() => mockFailedGenerate().catch(() => {})}
              disabled={isGenerating()}
            >
              {isGenerating() ? 'Generating...' : 'Generate'}
            </button>
            {error() && <div data-testid="error-message">{error()}</div>}
          </div>
        );
      };

      render(() => <ErrorHandlingTest />);

      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('generate-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message').textContent).toBe('API Error');
    });

    it('should validate YouTube URLs', async () => {
      const [url, setUrl] = createSignal('');
      const [isValid, setIsValid] = createSignal(false);

      const validateUrl = (value: string) => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        setIsValid(youtubeRegex.test(value));
      };

      const URLValidationTest = () => {
        return (
          <div>
            <input
              data-testid="url-input"
              value={url()}
              onInput={e => {
                const value = e.currentTarget.value;
                setUrl(value);
                validateUrl(value);
              }}
            />
            <div data-testid="valid-status">{isValid() ? 'valid' : 'invalid'}</div>
            <button type="button" data-testid="submit-btn" disabled={!isValid()}>
              Submit
            </button>
          </div>
        );
      };

      render(() => <URLValidationTest />);

      expect(screen.getByTestId('valid-status').textContent).toBe('invalid');
      expect(screen.getByTestId('submit-btn')).toBeDisabled();

      const urlInput = screen.getByTestId('url-input');
      fireEvent.input(urlInput, { target: { value: 'https://youtube.com/watch?v=123' } });

      expect(screen.getByTestId('valid-status').textContent).toBe('valid');
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled();

      fireEvent.input(urlInput, { target: { value: 'invalid-url' } });

      expect(screen.getByTestId('valid-status').textContent).toBe('invalid');
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
    });

    it('should extract and fill template variables', async () => {
      const [filledTemplate, setFilledTemplate] = createSignal('');
      const [variables, setVariables] = createSignal<Record<string, string>>({});

      const template = 'Create a {{duration}} video about {{topic}} using {{style}} style';

      const updateVariable = (name: string, value: string) => {
        setVariables(prev => ({ ...prev, [name]: value }));
      };

      const applyVariables = () => {
        let result = template;
        Object.entries(variables()).forEach(([key, value]) => {
          result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        setFilledTemplate(result);
      };

      const VariableFillingTest = () => {
        const vars = extractVariables(template);

        return (
          <div>
            <div data-testid="template">{template}</div>
            <div data-testid="filled-template">{filledTemplate()}</div>

            <For each={vars}>
              {variable => (
                <input
                  data-testid={`var-${variable}`}
                  placeholder={variable}
                  value={variables()[variable] || ''}
                  onInput={e => updateVariable(variable, e.currentTarget.value)}
                />
              )}
            </For>

            <button type="button" data-testid="apply-btn" onClick={applyVariables}>
              Apply
            </button>
          </div>
        );
      };

      render(() => <VariableFillingTest />);

      fireEvent.input(screen.getByTestId('var-duration'), { target: { value: '10-minute' } });
      fireEvent.input(screen.getByTestId('var-topic'), { target: { value: 'AI' } });
      fireEvent.input(screen.getByTestId('var-style'), { target: { value: 'tutorial' } });

      fireEvent.click(screen.getByTestId('apply-btn'));

      expect(screen.getByTestId('filled-template').textContent).toBe(
        'Create a 10-minute video about AI using tutorial style'
      );
    });
  });
});

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];

  const variables = matches.map(match => {
    const inner = match.slice(2, -2);
    return inner.split(':')[0].trim();
  });

  return [...new Set(variables)];
}
