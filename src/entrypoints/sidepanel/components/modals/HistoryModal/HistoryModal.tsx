import type { JSX } from 'solid-js';
import { createSignal, createMemo, For, Show } from 'solid-js';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export interface HistoryItem {
  id: string;
  timestamp: number;
  content: string;
  title: string;
}

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  history: HistoryItem[];
  currentContent: string;
  onRestore: (versionId: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

function computeDiffLines(
  original: string,
  modified: string
): Array<{
  type: 'unchanged' | 'added' | 'removed';
  line: string;
}> {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');
  const result: Array<{ type: 'unchanged' | 'added' | 'removed'; line: string }> = [];

  let i = 0;
  let j = 0;

  while (i < originalLines.length || j < modifiedLines.length) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[j];

    if (i < originalLines.length && j < modifiedLines.length && origLine === modLine) {
      result.push({ type: 'unchanged', line: origLine });
      i++;
      j++;
    } else if (i < originalLines.length) {
      result.push({ type: 'removed', line: origLine });
      i++;
    } else if (j < modifiedLines.length) {
      result.push({ type: 'added', line: modLine });
      j++;
    }
  }

  return result;
}

export function HistoryModal(props: HistoryModalProps): JSX.Element {
  const [selectedVersionId, setSelectedVersionId] = createSignal<string | null>(null);

  const sortedHistory = createMemo(() => {
    return [...props.history].sort((a, b) => b.timestamp - a.timestamp);
  });

  const selectedVersion = createMemo(() => {
    const id = selectedVersionId();
    if (!id) return null;
    return props.history.find(h => h.id === id) || null;
  });

  const diffLines = createMemo(() => {
    const version = selectedVersion();
    if (!version) return [];
    return computeDiffLines(props.currentContent, version.content);
  });

  const handleVersionClick = (versionId: string) => {
    setSelectedVersionId(versionId);
  };

  const handleRestore = () => {
    const versionId = selectedVersionId();
    if (versionId) {
      props.onRestore(versionId);
      props.onClose();
    }
  };

  const handleClose = () => {
    setSelectedVersionId(null);
    props.onClose();
  };

  const footer = () => (
    <div class="history-modal-footer">
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      <Show when={selectedVersionId()}>
        <Button variant="primary" onClick={handleRestore}>
          Restore Version
        </Button>
      </Show>
    </div>
  );

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Version History"
      footer={footer()}
      className="history-modal"
    >
      <div class="history-modal-content">
        <div class="history-list">
          <div class="history-list-header">
            <span>Versions ({sortedHistory().length})</span>
          </div>
          <For each={sortedHistory()}>
            {item => (
              <button
                type="button"
                class={`history-item ${selectedVersionId() === item.id ? 'selected' : ''}`}
                onClick={() => handleVersionClick(item.id)}
              >
                <div class="history-item-title">{item.title}</div>
                <div class="history-item-meta">
                  <span class="history-item-time">{formatRelativeTime(item.timestamp)}</span>
                  <span class="history-item-date">{formatDate(item.timestamp)}</span>
                </div>
              </button>
            )}
          </For>
          <Show when={sortedHistory().length === 0}>
            <div class="history-empty-state">
              <span>No version history available</span>
            </div>
          </Show>
        </div>

        <div class="diff-view">
          <Show
            when={selectedVersion()}
            fallback={
              <div class="diff-view-placeholder">
                <span>Select a version to compare</span>
              </div>
            }
          >
            <div class="diff-view-header">
              <span class="diff-view-label">Comparing with selected version</span>
            </div>
            <div class="diff-view-content">
              <div class="diff-before">
                <div class="diff-section-header">
                  <span class="diff-label diff-label-removed">Current</span>
                </div>
                <div class="diff-section-content">
                  <For each={diffLines()}>
                    {line => (
                      <Show when={line.type !== 'added'}>
                        <div
                          class={`diff-line ${line.type === 'removed' ? 'diff-removed' : 'diff-unchanged'}`}
                        >
                          <span class="diff-marker">{line.type === 'removed' ? '-' : ' '}</span>
                          <span class="diff-text">{line.line || ' '}</span>
                        </div>
                      </Show>
                    )}
                  </For>
                </div>
              </div>

              <div class="diff-after">
                <div class="diff-section-header">
                  <span class="diff-label diff-label-added">Selected Version</span>
                </div>
                <div class="diff-section-content">
                  <For each={diffLines()}>
                    {line => (
                      <Show when={line.type !== 'removed'}>
                        <div
                          class={`diff-line ${line.type === 'added' ? 'diff-added' : 'diff-unchanged'}`}
                        >
                          <span class="diff-marker">{line.type === 'added' ? '+' : ' '}</span>
                          <span class="diff-text">{line.line || ' '}</span>
                        </div>
                      </Show>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </Modal>
  );
}
