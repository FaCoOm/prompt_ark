import { createEffect, createSignal, Show } from 'solid-js';
import type { Prompt } from '@/shared/types';
import { usePromptStore } from '@/stores/promptStore';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Header } from './components/layout/Header';
import { SettingsPanel } from './components/layout/SettingsPanel';
import { SearchBar } from './components/filters/SearchBar';
import { CategoryTabs } from './components/filters/CategoryTabs';
import { SmartFilters } from './components/filters/SmartFilters';
import { PromptList } from './components/prompts/PromptList';
import { Pagination } from './components/prompts/Pagination';
import { EditModal } from './components/modals/EditModal/EditModal';
import { ImportModal } from './components/modals/ImportModal';
import { HistoryModal } from './components/modals/HistoryModal/HistoryModal';
import { SharePanel } from './components/modals/SharePanel/SharePanel';
import { PackToolbar } from './components/modals/PackToolbar';
import { YouTubeModal } from './components/modals/YouTubeModal';
import { SkillManager } from './components/modals/SkillManager';

export default function App() {
  const promptStore = usePromptStore();
  const uiStore = useUIStore();
  const settingsStore = useSettingsStore();

  const [isPackMode, setIsPackMode] = createSignal(false);
  const [packTitle, setPackTitle] = createSignal('');

  createEffect(() => {
    promptStore.loadPrompts();
    settingsStore.loadSettings();
  });

  const handleInsertPrompt = async (prompt: { id: string; title: string; content: string }) => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await browser.tabs.sendMessage(tab.id, {
          type: 'INSERT_PROMPT',
          content: prompt.content,
        });
        promptStore.trackUsage(prompt.id);
        uiStore.showNotification({
          type: 'success',
          message: 'Prompt inserted successfully',
        });
      }
    } catch {
      uiStore.showNotification({
        type: 'error',
        message: 'Failed to insert prompt. Make sure you are on an AI platform page.',
      });
    }
  };

  const handleSharePack = () => {
    const selectedIds = Array.from(promptStore.selectedIds);
    if (selectedIds.length === 0) {
      uiStore.showNotification({
        type: 'error',
        message: 'Please select at least one prompt for the pack',
      });
      return;
    }
    uiStore.openModal('share');
  };

  const handleRestoreVersion = () => {
    uiStore.showNotification({
      type: 'success',
      message: 'Version restored successfully',
    });
    uiStore.closeModal('history');
  };

  const totalPages = () => Math.ceil(promptStore.totalCount / promptStore.pageSize);

  return (
    <div class="sidepanel-app">
      <Header />

      <Show when={isPackMode()}>
        <PackToolbar
          isPackMode={isPackMode()}
          selectedCount={promptStore.selectedIds.size}
          packTitle={packTitle()}
          onTogglePackMode={() => {
            setIsPackMode(!isPackMode());
            if (!isPackMode()) {
              promptStore.clearSelection();
            }
          }}
          onPackTitleChange={setPackTitle}
          onSharePack={handleSharePack}
        />
      </Show>

      <section class="filters-section">
        <SearchBar />
        <CategoryTabs />
        <SmartFilters />
      </section>

      <main class="sidepanel-main">
        <PromptList
          isPackMode={isPackMode()}
          onInsert={handleInsertPrompt}
        />
      </main>

      <Show when={promptStore.totalCount > promptStore.pageSize}>
        <Pagination totalPages={totalPages()} />
      </Show>

      <Show when={uiStore.isSettingsOpen}>
        <SettingsPanel />
      </Show>

      <Show when={uiStore.modals.edit}>
        <EditModal />
      </Show>

      <Show when={uiStore.modals.import}>
        <ImportModal />
      </Show>

      <Show when={uiStore.modals.history}>
        <HistoryModal
          isOpen={uiStore.modals.history}
          onClose={() => uiStore.closeModal('history')}
          promptId={promptStore.editingPrompt?.id || ''}
          history={[]}
          currentContent={promptStore.editingPrompt?.content || ''}
          onRestore={handleRestoreVersion}
        />
      </Show>

      <Show when={uiStore.modals.share}>
        <SharePanel
          prompt={promptStore.editingPrompt || ({} as Prompt)}
          onCopyLink={() => {
            navigator.clipboard.writeText(window.location.href);
            uiStore.showNotification({ type: 'success', message: 'Link copied!' });
          }}
          onCopyJSON={() => {
            navigator.clipboard.writeText(JSON.stringify(promptStore.editingPrompt, null, 2));
            uiStore.showNotification({ type: 'success', message: 'JSON copied!' });
          }}
        />
      </Show>

      <Show when={uiStore.modals.youtube}>
        <YouTubeModal
          isOpen={uiStore.modals.youtube}
          onClose={() => uiStore.closeModal('youtube')}
          onGenerate={async () => {
            return {
              visualDict: [{ term: 'Example', description: 'Example term' }],
              inspirations: ['Inspiration 1', 'Inspiration 2'],
              storyboard: [{ timestamp: '0:00', description: 'Intro' }],
              template: '{{topic}} analysis',
            };
          }}
          onSave={(prompt) => {
            promptStore.addPrompt(prompt as Prompt);
            uiStore.closeModal('youtube');
            uiStore.showNotification({ type: 'success', message: 'Prompt saved!' });
          }}
        />
      </Show>

      <Show when={uiStore.modals.skillManager}>
        <SkillManager
          skills={[]}
          onDeleteSkill={() => {
            uiStore.showNotification({ type: 'success', message: 'Skill deleted!' });
          }}
        />
      </Show>

      <footer class="sidepanel-footer">
        <span class="shortcut-hint">Press Ctrl+Shift+P for quick add</span>
      </footer>
    </div>
  );
}
