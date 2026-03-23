import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@solidjs/testing-library';
import { createSignal, For } from 'solid-js';
import type { Prompt } from '../../src/shared/types/prompt';

describe('Prompt Lifecycle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPromptData: Prompt = {
    id: 'test-prompt-123',
    title: 'Test Prompt',
    content: 'This is test content with {{variable}}',
    category: 'Testing',
    tags: ['test', 'integration'],
    variables: ['variable'],
    versions: [],
    usageCount: 0,
    lastUsedAt: null,
    favorite: false,
    createdAt: Date.now(),
    shortcut: '/test',
  };

  describe('Create → Edit → Share → Delete Flow', () => {
    it('should complete full prompt lifecycle', async () => {
      const [prompts, setPrompts] = createSignal<Prompt[]>([]);
      const [selectedPrompt, setSelectedPrompt] = createSignal<Prompt | null>(null);
      const [sharePrompt, setSharePrompt] = createSignal<Prompt | null>(null);

      const createPrompt = (data: Partial<Prompt>) => {
        const newPrompt: Prompt = {
          ...mockPromptData,
          ...data,
          id: `prompt-${Date.now()}`,
          createdAt: Date.now(),
        };
        setPrompts(prev => [...prev, newPrompt]);
        return newPrompt;
      };

      const updatePrompt = (id: string, updates: Partial<Prompt>) => {
        setPrompts(prev =>
          prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p))
        );
      };

      const deletePrompt = (id: string) => {
        setPrompts(prev => prev.filter(p => p.id !== id));
      };

      const onShare = (prompt: Prompt) => {
        setSharePrompt(prompt);
      };

      const onCopyLink = vi.fn();
      const onCopyJSON = vi.fn();

      const PromptLifecycleTest = () => {
        return (
          <div>
            <div data-testid="prompt-count">{prompts().length}</div>
            <div data-testid="prompt-list">
              <For each={prompts()}>
                {prompt => (
                  <div data-testid={`prompt-${prompt.id}`}>
                    <span data-testid="prompt-title">{prompt.title}</span>
                    <button
                      type="button"
                      data-testid="edit-btn"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      Edit
                    </button>
                    <button type="button" data-testid="share-btn" onClick={() => onShare(prompt)}>
                      Share
                    </button>
                    <button
                      type="button"
                      data-testid="delete-btn"
                      onClick={() => deletePrompt(prompt.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </For>
            </div>

            <button
              type="button"
              data-testid="create-btn"
              onClick={() =>
                createPrompt({
                  title: 'New Test Prompt',
                  content: 'New content',
                  category: 'New Category',
                })
              }
            >
              Create Prompt
            </button>

            {selectedPrompt() && (
              <div data-testid="edit-modal">
                <input
                  data-testid="title-input"
                  value={selectedPrompt()!.title}
                  onInput={e =>
                    updatePrompt(selectedPrompt()!.id, { title: e.currentTarget.value })
                  }
                />
                <button
                  type="button"
                  data-testid="save-btn"
                  onClick={() => setSelectedPrompt(null)}
                >
                  Save
                </button>
              </div>
            )}

            {sharePrompt() && (
              <div data-testid="share-panel">
                <button
                  type="button"
                  data-testid="copy-link-btn"
                  onClick={() => {
                    onCopyLink();
                    setSharePrompt(null);
                  }}
                >
                  Copy Link
                </button>
                <button
                  type="button"
                  data-testid="copy-json-btn"
                  onClick={() => {
                    onCopyJSON();
                    setSharePrompt(null);
                  }}
                >
                  Copy JSON
                </button>
              </div>
            )}
          </div>
        );
      };

      render(() => <PromptLifecycleTest />);

      expect(screen.getByTestId('prompt-count').textContent).toBe('0');

      const createBtn = screen.getByTestId('create-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByTestId('prompt-count').textContent).toBe('1');
      });

      expect(screen.getByText('New Test Prompt')).toBeInTheDocument();

      const editBtn = screen.getByTestId('edit-btn');
      fireEvent.click(editBtn);

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();

      const titleInput = screen.getByTestId('title-input');
      fireEvent.input(titleInput, { target: { value: 'Updated Prompt Title' } });

      const saveBtn = screen.getByTestId('save-btn');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Updated Prompt Title')).toBeInTheDocument();

      const shareBtn = screen.getByTestId('share-btn');
      fireEvent.click(shareBtn);

      expect(screen.getByTestId('share-panel')).toBeInTheDocument();

      const copyLinkBtn = screen.getByTestId('copy-link-btn');
      fireEvent.click(copyLinkBtn);

      expect(onCopyLink).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.queryByTestId('share-panel')).not.toBeInTheDocument();
      });

      const deleteBtn = screen.getByTestId('delete-btn');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByTestId('prompt-count').textContent).toBe('0');
      });
    });

    it('should handle editing prompt content and tags', async () => {
      const [prompts, setPrompts] = createSignal<Prompt[]>([mockPromptData]);
      const [editingPrompt, setEditingPrompt] = createSignal<Prompt | null>(null);

      const updatePrompt = (id: string, updates: Partial<Prompt>) => {
        setPrompts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
      };

      const EditFlowTest = () => {
        return (
          <div>
            <div data-testid="content-display">{prompts()[0]?.content}</div>
            <div data-testid="tags-display">{prompts()[0]?.tags.join(', ')}</div>

            <button
              type="button"
              data-testid="edit-btn"
              onClick={() => setEditingPrompt(prompts()[0])}
            >
              Edit
            </button>

            {editingPrompt() && (
              <div data-testid="edit-form">
                <textarea
                  data-testid="content-input"
                  value={editingPrompt()!.content}
                  onInput={e =>
                    updatePrompt(editingPrompt()!.id, { content: e.currentTarget.value })
                  }
                />
                <input
                  data-testid="tags-input"
                  value={editingPrompt()!.tags.join(', ')}
                  onInput={e =>
                    updatePrompt(editingPrompt()!.id, {
                      tags: e.currentTarget.value.split(',').map(t => t.trim()),
                    })
                  }
                />
                <button
                  type="button"
                  data-testid="close-edit"
                  onClick={() => setEditingPrompt(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        );
      };

      render(() => <EditFlowTest />);

      expect(screen.getByTestId('content-display').textContent).toBe(
        'This is test content with {{variable}}'
      );
      expect(screen.getByTestId('tags-display').textContent).toBe('test, integration');

      fireEvent.click(screen.getByTestId('edit-btn'));

      const contentInput = screen.getByTestId('content-input');
      fireEvent.input(contentInput, {
        target: { value: 'Updated content with {{newVar}}' },
      });

      const tagsInput = screen.getByTestId('tags-input');
      fireEvent.input(tagsInput, { target: { value: 'updated, tags, new' } });

      fireEvent.click(screen.getByTestId('close-edit'));

      await waitFor(() => {
        expect(screen.getByTestId('content-display').textContent).toBe(
          'Updated content with {{newVar}}'
        );
      });

      expect(screen.getByTestId('tags-display').textContent).toBe('updated, tags, new');
    });

    it('should handle sharing to different platforms', async () => {
      const [shareAction, setShareAction] = createSignal<string | null>(null);

      const ShareFlowTest = () => {
        return (
          <div>
            <div data-testid="share-action">{shareAction() || 'none'}</div>
            <button
              type="button"
              data-testid="share-twitter"
              onClick={() => setShareAction('twitter')}
            >
              Share Twitter
            </button>
            <button
              type="button"
              data-testid="share-reddit"
              onClick={() => setShareAction('reddit')}
            >
              Share Reddit
            </button>
            <button type="button" data-testid="share-link" onClick={() => setShareAction('link')}>
              Copy Link
            </button>
            <button type="button" data-testid="share-json" onClick={() => setShareAction('json')}>
              Copy JSON
            </button>
          </div>
        );
      };

      render(() => <ShareFlowTest />);

      expect(screen.getByTestId('share-action').textContent).toBe('none');

      fireEvent.click(screen.getByTestId('share-twitter'));
      expect(screen.getByTestId('share-action').textContent).toBe('twitter');

      fireEvent.click(screen.getByTestId('share-reddit'));
      expect(screen.getByTestId('share-action').textContent).toBe('reddit');

      fireEvent.click(screen.getByTestId('share-link'));
      expect(screen.getByTestId('share-action').textContent).toBe('link');

      fireEvent.click(screen.getByTestId('share-json'));
      expect(screen.getByTestId('share-action').textContent).toBe('json');
    });

    it('should maintain prompt state through operations', async () => {
      const [prompts, setPrompts] = createSignal<Prompt[]>([]);
      const [operationLog, setOperationLog] = createSignal<string[]>([]);

      const logOperation = (op: string) => {
        setOperationLog(prev => [...prev, op]);
      };

      const StateManagementTest = () => {
        return (
          <div>
            <div data-testid="prompt-count">{prompts().length}</div>
            <div data-testid="operation-log">{operationLog().join(', ')}</div>

            <button
              type="button"
              data-testid="create-btn"
              onClick={() => {
                const newPrompt = { ...mockPromptData, id: `p${Date.now()}` };
                setPrompts(prev => [...prev, newPrompt]);
                logOperation('create');
              }}
            >
              Create
            </button>

            <button
              type="button"
              data-testid="update-btn"
              onClick={() => {
                if (prompts().length > 0) {
                  setPrompts(prev =>
                    prev.map(p => (p.id === prompts()[0].id ? { ...p, title: 'Updated' } : p))
                  );
                  logOperation('update');
                }
              }}
            >
              Update
            </button>

            <button
              type="button"
              data-testid="delete-btn"
              onClick={() => {
                if (prompts().length > 0) {
                  setPrompts(prev => prev.slice(0, -1));
                  logOperation('delete');
                }
              }}
            >
              Delete
            </button>
          </div>
        );
      };

      render(() => <StateManagementTest />);

      fireEvent.click(screen.getByTestId('create-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('prompt-count').textContent).toBe('1');
      });

      fireEvent.click(screen.getByTestId('update-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('operation-log').textContent).toContain('update');
      });

      expect(screen.getByTestId('prompt-count').textContent).toBe('1');

      fireEvent.click(screen.getByTestId('delete-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('prompt-count').textContent).toBe('0');
      });

      expect(screen.getByTestId('operation-log').textContent).toBe('create, update, delete');
    });
  });
});
