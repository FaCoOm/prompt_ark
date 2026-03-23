import type { JSX } from 'solid-js';
import { createSignal, createMemo, For, Show } from 'solid-js';
import { useUIStore } from '../../stores/uiStore';
import { usePromptStore } from '../../../../stores/promptStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';
import type { Prompt } from '@shared/types/prompt';

interface FoundPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  score: number;
  selected: boolean;
}

interface AIProgress {
  stage: string;
  progress: number;
  message: string;
}

export function ImportModal(): JSX.Element {
  const { modals, closeModal, showNotification } = useUIStore();
  const { addPrompt } = usePromptStore();

  const [activeTab, setActiveTab] = createSignal<'paste' | 'url'>('paste');
  const [pasteContent, setPasteContent] = createSignal('');
  const [isParsing, setIsParsing] = createSignal(false);
  const [url, setUrl] = createSignal('');
  const [isDeepScan, setIsDeepScan] = createSignal(false);
  const [scoreFilter, setScoreFilter] = createSignal(50);
  const [isScanning, setIsScanning] = createSignal(false);
  const [foundPrompts, setFoundPrompts] = createSignal<FoundPrompt[]>([]);
  const [aiProgress, setAIProgress] = createSignal<AIProgress | null>(null);

  const isOpen = () => modals.import;

  const tabs = [
    { id: 'paste', label: 'Paste Import' },
    { id: 'url', label: 'URL Import' },
  ];

  const handleClose = () => {
    closeModal('import');
    setTimeout(() => {
      setPasteContent('');
      setUrl('');
      setIsDeepScan(false);
      setScoreFilter(50);
      setFoundPrompts([]);
      setAIProgress(null);
      setActiveTab('paste');
    }, 300);
  };

  const parsePasteContent = (content: string): Array<Partial<Prompt>> => {
    const prompts: Array<Partial<Prompt>> = [];
    const trimmed = content.trim();

    if (!trimmed) return prompts;

    try {
      const json = JSON.parse(trimmed);
      if (Array.isArray(json)) {
        return json.map(item => ({
          title: item.title || item.name || 'Untitled',
          content: item.content || item.body || item.text || '',
          category: item.category || item.categoryName || 'General',
          tags: Array.isArray(item.tags) ? item.tags : [],
        }));
      } else if (typeof json === 'object') {
        return [
          {
            title: json.title || json.name || 'Untitled',
            content: json.content || json.body || json.text || '',
            category: json.category || json.categoryName || 'General',
            tags: Array.isArray(json.tags) ? json.tags : [],
          },
        ];
      }
    } catch {
      // Try other formats
    }

    if (trimmed.includes(',') && trimmed.split('\n').length > 1) {
      const lines = trimmed.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const prompt: Partial<Prompt> = {
          title: 'Untitled',
          content: '',
          category: 'General',
          tags: [],
        };

        headers.forEach((header, idx) => {
          const value = values[idx] || '';
          if (header.includes('title') || header.includes('name')) {
            prompt.title = value;
          } else if (
            header.includes('content') ||
            header.includes('body') ||
            header.includes('text')
          ) {
            prompt.content = value;
          } else if (header.includes('category')) {
            prompt.category = value;
          } else if (header.includes('tag')) {
            prompt.tags = value
              .split(';')
              .map(t => t.trim())
              .filter(Boolean);
          }
        });

        if (prompt.content) {
          prompts.push(prompt);
        }
      }

      if (prompts.length > 0) return prompts;
    }

    const sections = trimmed.split(/\n#{1,3}\s+/);
    if (sections.length > 1) {
      for (const section of sections.slice(1)) {
        const lines = section.split('\n');
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        if (content) {
          prompts.push({
            title: title || 'Untitled',
            content,
            category: 'General',
            tags: [],
          });
        }
      }
      if (prompts.length > 0) return prompts;
    }

    const paragraphs = trimmed.split('\n\n').filter(p => p.trim());
    for (const para of paragraphs) {
      const lines = para.split('\n');
      const firstLine = lines[0].trim();
      const rest = lines.slice(1).join('\n').trim();

      prompts.push({
        title: firstLine.length < 100 ? firstLine : 'Untitled',
        content: rest || firstLine,
        category: 'General',
        tags: [],
      });
    }

    return prompts;
  };

  const handlePasteImport = async () => {
    const content = pasteContent();
    if (!content.trim()) {
      showNotification({
        type: 'error',
        message: 'Please enter content to import',
      });
      return;
    }

    setIsParsing(true);
    try {
      const prompts = parsePasteContent(content);

      if (prompts.length === 0) {
        showNotification({
          type: 'error',
          message: 'No valid prompts found in content',
        });
        return;
      }

      let importedCount = 0;
      for (const promptData of prompts) {
        if (promptData.content) {
          await addPrompt({
            title: promptData.title || 'Untitled',
            content: promptData.content,
            category: promptData.category || 'General',
            tags: promptData.tags || [],
            shortcut: '',
            variables: extractVariables(promptData.content || ''),
          });
          importedCount++;
        }
      }

      showNotification({
        type: 'success',
        message: `Successfully imported ${importedCount} prompt${importedCount !== 1 ? 's' : ''}`,
      });

      handleClose();
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import prompts',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleUrlScan = async () => {
    const urlValue = url().trim();
    if (!urlValue) {
      showNotification({
        type: 'error',
        message: 'Please enter a URL to scan',
      });
      return;
    }

    try {
      new URL(urlValue);
    } catch {
      showNotification({
        type: 'error',
        message: 'Please enter a valid URL',
      });
      return;
    }

    setIsScanning(true);
    setFoundPrompts([]);
    setAIProgress({ stage: 'fetching', progress: 0, message: 'Fetching page content...' });

    try {
      await simulateScan(urlValue);

      showNotification({
        type: 'success',
        message: `Found ${foundPrompts().length} prompts`,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to scan URL',
      });
    } finally {
      setIsScanning(false);
      setAIProgress(null);
    }
  };

  const simulateScan = async (_urlValue: string): Promise<void> => {
    setAIProgress({ stage: 'fetching', progress: 20, message: 'Fetching page content...' });
    await delay(800);

    setAIProgress({ stage: 'analyzing', progress: 50, message: 'AI analyzing content...' });
    await delay(1200);

    setAIProgress({ stage: 'extracting', progress: 80, message: 'Extracting prompts...' });
    await delay(800);

    const mockPrompts: FoundPrompt[] = [
      {
        id: '1',
        title: 'Code Review Assistant',
        content:
          'Please review the following code for potential bugs, performance issues, and best practices...',
        category: 'Development',
        tags: ['coding', 'review'],
        score: 85,
        selected: true,
      },
      {
        id: '2',
        title: 'Email Composer',
        content: 'Write a professional email about {{topic}} to {{recipient}}...',
        category: 'Writing',
        tags: ['email', 'business'],
        score: 72,
        selected: true,
      },
      {
        id: '3',
        title: 'Meeting Summarizer',
        content:
          'Summarize the following meeting transcript into key action items and decisions...',
        category: 'Productivity',
        tags: ['meeting', 'summary'],
        score: 68,
        selected: false,
      },
    ];

    const filtered = mockPrompts.filter(p => p.score >= scoreFilter());
    setFoundPrompts(filtered);
  };

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const togglePromptSelection = (id: string) => {
    setFoundPrompts(prev => prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p)));
  };

  const handleImportSelected = async () => {
    const selected = foundPrompts().filter(p => p.selected);

    if (selected.length === 0) {
      showNotification({
        type: 'error',
        message: 'Please select at least one prompt to import',
      });
      return;
    }

    try {
      for (const prompt of selected) {
        await addPrompt({
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
          tags: prompt.tags,
          shortcut: '',
          variables: extractVariables(prompt.content),
        });
      }

      showNotification({
        type: 'success',
        message: `Imported ${selected.length} prompt${selected.length !== 1 ? 's' : ''}`,
      });

      handleClose();
    } catch (error) {
      showNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import prompts',
      });
    }
  };

  const selectedCount = createMemo(() => foundPrompts().filter(p => p.selected).length);

  const handleKeyToggle = (id: string, e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePromptSelection(id);
    }
  };

  const footer = () => (
    <div class="form-actions">
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Show when={activeTab() === 'paste'}>
        <Button
          variant="primary"
          onClick={handlePasteImport}
          disabled={isParsing() || !pasteContent().trim()}
        >
          {isParsing() ? 'Importing...' : 'Import'}
        </Button>
      </Show>
      <Show when={activeTab() === 'url'}>
        <Button
          variant="primary"
          onClick={handleImportSelected}
          disabled={selectedCount() === 0 || isScanning()}
        >
          Import Selected ({selectedCount()})
        </Button>
      </Show>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen()}
      onClose={handleClose}
      title="Import Prompts"
      footer={footer()}
      className="modal import-modal"
    >
      <div class="import-modal-container">
        <div class="import-tabs">
          <Tabs
            tabs={tabs}
            activeTab={activeTab()}
            onChange={tabId => setActiveTab(tabId as 'paste' | 'url')}
          />
        </div>

        <div class="import-modal-body">
          <Show when={activeTab() === 'paste'}>
            <div class="import-section">
              <label class="import-label" for="paste-textarea">
                Paste your prompts (JSON, CSV, or Markdown)
              </label>
              <textarea
                id="paste-textarea"
                class="import-textarea"
                value={pasteContent()}
                onInput={e => setPasteContent(e.currentTarget.value)}
                placeholder={`Paste prompts in any format:

JSON: [{"title": "...", "content": "..."}]
CSV: title,content,category
title1,content1,General

Markdown: # Title\nContent here
Or just paste plain text paragraphs`}
                rows={12}
              />
              <p class="import-hint">
                Supports JSON arrays/objects, CSV with headers, Markdown sections, or plain text
              </p>
            </div>
          </Show>

          <Show when={activeTab() === 'url'}>
            <div class="import-section">
              <label class="import-label" for="url-input">
                URL to scan
              </label>
              <div class="url-input-row">
                <Input
                  value={url()}
                  onChange={setUrl}
                  placeholder="https://github.com/user/repo or any webpage"
                  className="url-input"
                />
                <Button
                  variant="primary"
                  onClick={handleUrlScan}
                  disabled={isScanning() || !url().trim()}
                >
                  {isScanning() ? 'Scanning...' : 'Scan'}
                </Button>
              </div>

              <div class="import-options">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isDeepScan()}
                    onChange={e => setIsDeepScan(e.currentTarget.checked)}
                  />
                  <span>Deep scan (follow links for more prompts)</span>
                </label>

                <div class="score-filter">
                  <label class="score-label" for="score-slider">
                    Quality score filter: <span class="score-value">{scoreFilter()}+</span>
                  </label>
                  <input
                    id="score-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={scoreFilter()}
                    onInput={e => setScoreFilter(parseInt(e.currentTarget.value))}
                    class="score-slider"
                    disabled={isScanning()}
                  />
                </div>
              </div>

              <Show when={aiProgress()}>
                <div class="ai-progress-container">
                  <div class="ai-progress-bar">
                    <div class="ai-progress-fill" style={{ width: `${aiProgress()?.progress}%` }} />
                  </div>
                  <div class="ai-progress-message">
                    <span class="ai-spinner" />
                    {aiProgress()?.message}
                  </div>
                </div>
              </Show>

              <Show when={foundPrompts().length > 0}>
                <div class="preview-section">
                  <h4 class="preview-title">Found Prompts ({foundPrompts().length})</h4>
                  <div class="preview-list">
                    <For each={foundPrompts()}>
                      {prompt => (
                        <div
                          class={`preview-item ${prompt.selected ? 'selected' : ''}`}
                          onClick={() => togglePromptSelection(prompt.id)}
                          onKeyDown={e => handleKeyToggle(prompt.id, e)}
                          role="button"
                          tabindex="0"
                          aria-pressed={prompt.selected}
                        >
                          <input
                            type="checkbox"
                            checked={prompt.selected}
                            onChange={() => togglePromptSelection(prompt.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div class="preview-content">
                            <div class="preview-header">
                              <span class="preview-title-text">{prompt.title}</span>
                              <span
                                class={`preview-score score-${prompt.score >= 80 ? 'high' : prompt.score >= 60 ? 'medium' : 'low'}`}
                              >
                                {prompt.score}
                              </span>
                            </div>
                            <div class="preview-meta">
                              <span class="preview-category">{prompt.category}</span>
                              <span class="preview-tags">{prompt.tags.join(', ')}</span>
                            </div>
                            <p class="preview-snippet">
                              {prompt.content.slice(0, 100)}
                              {prompt.content.length > 100 ? '...' : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
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
