import { createSignal, onMount } from 'solid-js';
import { promptStore } from '../../src/stores/promptStore';
import { settingsStore } from '../../src/stores/settingsStore';
import { useI18n } from '../../src/i18n/context';
import Layout from './components/Layout';
import Navigation, { type PageType } from './components/Navigation';
import Dashboard from './pages/Dashboard';
import PromptList from './pages/PromptList';
import PromptEditor from './pages/PromptEditor';
import History from './pages/History';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';
import type { Prompt } from '../../src/types';

export default function App() {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = createSignal<PageType>('dashboard');
  const [editingPrompt, setEditingPrompt] = createSignal<Prompt | null>(null);

  onMount(() => {
    promptStore.loadPrompts();
    settingsStore.loadSettings();
  });

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    setEditingPrompt(null);
  };

  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setCurrentPage('editor');
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setCurrentPage('editor');
  };

  const handleSavePrompt = () => {
    setCurrentPage('prompts');
    setEditingPrompt(null);
  };

  const handleCancelEdit = () => {
    setCurrentPage('prompts');
    setEditingPrompt(null);
  };

  const renderPage = () => {
    switch (currentPage()) {
      case 'dashboard':
        return (
          <Dashboard
            onViewAllPrompts={() => setCurrentPage('prompts')}
            onEditPrompt={handleEditPrompt}
            onNewPrompt={handleNewPrompt}
          />
        );
      case 'prompts':
        return (
          <PromptList
            onEditPrompt={handleEditPrompt}
            onNewPrompt={handleNewPrompt}
          />
        );
      case 'editor':
        return (
          <PromptEditor
            prompt={editingPrompt()}
            onSave={handleSavePrompt}
            onCancel={handleCancelEdit}
          />
        );
      case 'history':
        return <History />;
      case 'import-export':
        return <ImportExport />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewAllPrompts={() => setCurrentPage('prompts')} onEditPrompt={handleEditPrompt} onNewPrompt={handleNewPrompt} />;
    }
  };

  const renderHeader = () => {
    const pageTitles: Record<PageType, string> = {
      dashboard: t('app.name'),
      prompts: 'All Prompts',
      editor: editingPrompt() ? t('prompt.edit') : t('prompt.new'),
      history: t('history.title'),
      'import-export': `${t('action.import')} / ${t('action.export')}`,
      settings: t('settings.title'),
    };

    return (
      <div class="flex items-center justify-between w-full">
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">
          {pageTitles[currentPage()]}
        </h1>
        <div class="text-sm text-surface-500 dark:text-surface-400">
          {t('app.shortcutHint')}
        </div>
      </div>
    );
  };

  return (
    <Layout
      sidebar={
        <Navigation
          currentPage={currentPage()}
          onPageChange={handlePageChange}
          onNewPrompt={handleNewPrompt}
        />
      }
      header={renderHeader()}
    >
      {renderPage()}
    </Layout>
  );
}
