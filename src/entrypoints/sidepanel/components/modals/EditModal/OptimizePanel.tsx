import type { JSX } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { Button } from '../../ui/Button';
import type { Provider } from '@shared/types/provider';

interface OptimizePanelProps {
  originalContent: string;
  providers: Provider[];
  activeProviderId: string | null;
  onOptimize: (providerId: string) => Promise<string>;
  onAccept: (optimizedContent: string) => void;
  onReject: () => void;
}

export function OptimizePanel(props: OptimizePanelProps): JSX.Element {
  const [selectedProviderId, setSelectedProviderId] = createSignal<string>(
    props.activeProviderId ?? props.providers[0]?.id ?? ''
  );
  const [isLoading, setIsLoading] = createSignal(false);
  const [optimizedContent, setOptimizedContent] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const handleOptimize = async () => {
    const providerId = selectedProviderId();
    if (!providerId) return;

    setIsLoading(true);
    setError(null);
    setOptimizedContent(null);

    try {
      const result = await props.onOptimize(providerId);
      setOptimizedContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    const content = optimizedContent();
    if (content) {
      props.onAccept(content);
    }
  };

  const handleReject = () => {
    setOptimizedContent(null);
    setError(null);
    props.onReject();
  };

  return (
    <div class="optimize-panel">
      <Show
        when={optimizedContent()}
        fallback={
          <div class="optimize-controls">
            <div class="provider-selector">
              <label for="provider-select">AI Provider</label>
              <select
                id="provider-select"
                value={selectedProviderId()}
                onChange={e => setSelectedProviderId(e.currentTarget.value)}
                disabled={isLoading() || props.providers.length === 0}
              >
                <Show when={props.providers.length === 0}>
                  <option value="">No providers available</option>
                </Show>
                <For each={props.providers}>
                  {provider => <option value={provider.id}>{provider.name}</option>}
                </For>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={handleOptimize}
              disabled={isLoading() || !selectedProviderId() || props.providers.length === 0}
            >
              <Show when={isLoading()} fallback="✨ Optimize">
                <span class="loading-spinner">⏳</span> Optimizing...
              </Show>
            </Button>

            <Show when={error()}>
              <div class="error-message">{error()}</div>
            </Show>
          </div>
        }
      >
        <div class="comparison-view">
          <div class="comparison-header">
            <h4>Optimization Result</h4>
          </div>

          <div class="comparison-content">
            <div class="before-content">
              <span class="content-label">Before</span>
              <pre>{props.originalContent}</pre>
            </div>

            <div class="after-content">
              <span class="content-label">After</span>
              <pre>{optimizedContent()}</pre>
            </div>
          </div>

          <div class="comparison-actions">
            <Button variant="secondary" onClick={handleReject}>
              Reject
            </Button>
            <Button variant="primary" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}
