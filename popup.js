console.log(`🔥 [popup.js] v${chrome.runtime.getManifest().version} loaded`);
import { i18n } from './i18n-manager.js';
import { PromptParser } from './lib/parsers.js';
import { GitHubClient } from './lib/github-client.js';
import { PromptScorer } from './lib/scorer.js';
import { ContentAnalyzer } from './lib/analyzer.js';

class PopupManager {
  constructor() {
    this.prompts = [];
    this.providers = [];
    this.activeProviderId = null;
    this.currentCategory = 'all';
    this.editingId = null;
    this.activeSmartFilter = null;
    this.currentPage = 1;
    this.pageSize = 10;
    this.importedPromptsCache = []; // Full list of scanned prompts
    this.filteredImportCache = []; // List after applying score filter
    this.githubClient = new GitHubClient();
    this.contentAnalyzer = new ContentAnalyzer();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    await i18n.init();
    this.localize();

    const langSelect = document.getElementById('languageSelect');
    if (langSelect) langSelect.value = i18n.getLanguage();

    await this.loadPrompts();
    await this.loadSettings();
    this.renderCategories();
    this.renderPrompts();
    this.bindEvents();

    // Listen for async AI enrichment updates from background
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'PROMPTS_UPDATED') {
        if (msg.prompt) {
          // Fast path: targeted in-memory patch for a single prompt
          const idx = this.prompts.findIndex(p => p.id === msg.prompt.id);
          if (idx >= 0) {
            // Update existing prompt (e.g. AI enrichment filled in title/category)
            this.prompts[idx] = { ...this.prompts[idx], ...msg.prompt };
          } else {
            // New prompt (e.g. from Smart Convert / Add to Prompt Ark)
            this.prompts.unshift(msg.prompt);
          }
          this.renderCategories();
          this.renderPrompts();
        } else {
          // Full reload fallback (e.g. force-sync from remote)
          this.loadPrompts().then(() => {
            this.renderCategories();
            this.renderPrompts();
          });
        }
      }
    });
  }

  localize() {
    i18n.translatePage();
    if (this.prompts.length > 0) {
      this.renderCategories();
    }
  }

  async loadPrompts() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROMPTS' });
    if (response.success) {
      this.prompts = response.prompts;
    }
  }

  async loadSettings() {
    const resp = await chrome.runtime.sendMessage({ type: 'GET_PROVIDERS' });
    if (resp.success) {
      this.providers = resp.providers || [];
      this.activeProviderId = resp.activeProviderId;
    }
    this.renderProviders();

    // Load default platform
    const dpResp = await chrome.runtime.sendMessage({ type: 'GET_DEFAULT_PLATFORM' });
    const platformSelect = document.getElementById('defaultPlatformSelect');
    if (platformSelect) platformSelect.value = dpResp.defaultPlatform || 'chatgpt';

    // Load GitHub token
    const ghResp = await chrome.runtime.sendMessage({ type: 'GET_GITHUB_TOKEN' });
    const ghInput = document.getElementById('githubTokenInput');
    if (ghInput && ghResp.token) ghInput.value = ghResp.token;

    // Load Sync Settings
    const syncResp = await chrome.runtime.sendMessage({ type: 'GET_SYNC_SETTINGS' });
    const syncSelect = document.getElementById('syncBackendSelect');
    if (syncSelect) syncSelect.value = syncResp.syncBackend || 'none';

    const gistIdInput = document.getElementById('gistIdInput');
    if (gistIdInput && syncResp.gistId) gistIdInput.value = syncResp.gistId;

    const webdavUrlInput = document.getElementById('webdavUrlInput');
    if (webdavUrlInput && syncResp.webdavUrl) webdavUrlInput.value = syncResp.webdavUrl;
    const webdavUserInput = document.getElementById('webdavUserInput');
    if (webdavUserInput && syncResp.webdavUser) webdavUserInput.value = syncResp.webdavUser;
    const webdavPasswordInput = document.getElementById('webdavPasswordInput');
    if (webdavPasswordInput && syncResp.webdavPassword) webdavPasswordInput.value = syncResp.webdavPassword;

    // Obsidian Vault settings
    const obsidianWebdavUrlInput = document.getElementById('obsidianWebdavUrlInput');
    if (obsidianWebdavUrlInput && syncResp.obsidianWebdavUrl) obsidianWebdavUrlInput.value = syncResp.obsidianWebdavUrl;
    const obsidianWebdavUserInput = document.getElementById('obsidianWebdavUserInput');
    if (obsidianWebdavUserInput && syncResp.obsidianWebdavUser) obsidianWebdavUserInput.value = syncResp.obsidianWebdavUser;
    const obsidianWebdavPasswordInput = document.getElementById('obsidianWebdavPasswordInput');
    if (obsidianWebdavPasswordInput && syncResp.obsidianWebdavPassword) obsidianWebdavPasswordInput.value = syncResp.obsidianWebdavPassword;
    const obsidianFolderInput = document.getElementById('obsidianFolderInput');
    if (obsidianFolderInput) obsidianFolderInput.value = syncResp.obsidianFolder || 'prompts';

    // Obsidian Local settings
    const obsidianLocalPortInput = document.getElementById('obsidianLocalPortInput');
    if (obsidianLocalPortInput) obsidianLocalPortInput.value = syncResp.obsidianLocalPort || 27123;
    const obsidianLocalApiKeyInput = document.getElementById('obsidianLocalApiKeyInput');
    if (obsidianLocalApiKeyInput && syncResp.obsidianLocalApiKey) obsidianLocalApiKeyInput.value = syncResp.obsidianLocalApiKey;

    this.toggleSyncUI(syncResp.syncBackend);
  }

  toggleSyncUI(backend) {
    document.querySelectorAll('.sync-config-panel').forEach(el => el.classList.add('hidden'));
    if (backend === 'gist') document.getElementById('gistIdContainer')?.classList.remove('hidden');
    if (backend === 'webdav') document.getElementById('webdavContainer')?.classList.remove('hidden');
    if (backend === 'obsidian') document.getElementById('obsidianContainer')?.classList.remove('hidden');
    if (backend === 'obsidian-local') document.getElementById('obsidianLocalContainer')?.classList.remove('hidden');
  }

  async saveSettings() {
    await chrome.runtime.sendMessage({
      type: 'SAVE_PROVIDERS',
      providers: this.providers,
      activeProviderId: this.activeProviderId
    });
    // Save default platform
    const platform = document.getElementById('defaultPlatformSelect')?.value || 'chatgpt';
    await chrome.runtime.sendMessage({ type: 'SET_DEFAULT_PLATFORM', platform });

    // Save GitHub token — only if non-empty to avoid overwriting a valid token
    const ghToken = document.getElementById('githubTokenInput')?.value?.trim();
    if (ghToken) {
      await chrome.runtime.sendMessage({ type: 'SAVE_GITHUB_TOKEN', token: ghToken });
    }

    // Save Sync Settings
    const syncBackend = document.getElementById('syncBackendSelect')?.value || 'none';
    const gistId = document.getElementById('gistIdInput')?.value?.trim() || '';
    const webdavUrl = document.getElementById('webdavUrlInput')?.value?.trim() || '';
    const webdavUser = document.getElementById('webdavUserInput')?.value?.trim() || '';
    const webdavPassword = document.getElementById('webdavPasswordInput')?.value?.trim() || '';

    // Obsidian Vault fields
    const obsidianWebdavUrl = document.getElementById('obsidianWebdavUrlInput')?.value?.trim() || '';
    const obsidianWebdavUser = document.getElementById('obsidianWebdavUserInput')?.value?.trim() || '';
    const obsidianWebdavPassword = document.getElementById('obsidianWebdavPasswordInput')?.value?.trim() || '';
    const obsidianFolder = document.getElementById('obsidianFolderInput')?.value?.trim() || 'prompts';

    await chrome.runtime.sendMessage({
      type: 'SAVE_SYNC_SETTINGS',
      backend: syncBackend,
      gistId: gistId,
      webdavUrl,
      webdavUser,
      webdavPassword,
      obsidianWebdavUrl,
      obsidianWebdavUser,
      obsidianWebdavPassword,
      obsidianFolder,
      obsidianLocalPort: parseInt(document.getElementById('obsidianLocalPortInput')?.value) || 27123,
      obsidianLocalApiKey: document.getElementById('obsidianLocalApiKeyInput')?.value?.trim() || ''
    });

    this.showToast(i18n.t('settingsSaved'));
  }

  // --- Provider Management ---

  renderProviders() {
    const container = document.getElementById('providerList');
    if (!container) return;

    container.innerHTML = this.providers.map(p => {
      const isActive = p.id === this.activeProviderId;
      const detail = p.type === 'gemini-web' ? 'Web Session' : `${p.type} · ${p.model || ''}`;
      return `
        <div class="provider-item ${isActive ? 'active' : ''}" data-provider-id="${p.id}">
          <input type="radio" name="activeProvider" value="${p.id}" ${isActive ? 'checked' : ''}>
          <div class="provider-info">
            <div class="provider-label">${this.escapeHtml(p.name)}</div>
            <div class="provider-detail">${this.escapeHtml(detail)}</div>
          </div>
          <div class="provider-item-actions">
            <button class="edit-btn" title="${i18n.t('edit')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="delete-btn" title="${i18n.t('deleteProvider')}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  showProviderForm(provider = null) {
    const form = document.getElementById('providerForm');
    const typeSelect = document.getElementById('providerTypeSelect');
    const apiUrlRow = document.getElementById('providerApiUrlRow');

    document.getElementById('providerEditId').value = provider?.id || '';
    document.getElementById('providerNameInput').value = provider?.name || '';
    typeSelect.value = provider?.type || 'gemini';
    document.getElementById('providerApiUrlInput').value = provider?.apiUrl || '';
    document.getElementById('providerApiKeyInput').value = provider ? '••••••••' : '';
    document.getElementById('providerModelInput').value = provider?.model || '';

    // Show/hide form fields based on type
    const isGeminiWeb = typeSelect.value === 'gemini-web';
    apiUrlRow.classList.toggle('hidden', typeSelect.value !== 'openai');
    document.getElementById('providerApiKeyInput').closest('.form-row').classList.toggle('hidden', isGeminiWeb);
    document.getElementById('providerModelInput').closest('.form-row').classList.toggle('hidden', isGeminiWeb);

    form.classList.remove('hidden');
    document.getElementById('providerNameInput').focus();
  }

  hideProviderForm() {
    document.getElementById('providerForm').classList.add('hidden');
  }

  saveProviderForm() {
    const editId = document.getElementById('providerEditId').value;
    const name = document.getElementById('providerNameInput').value.trim();
    const type = document.getElementById('providerTypeSelect').value;
    const apiUrl = document.getElementById('providerApiUrlInput').value.trim();
    const apiKeyVal = document.getElementById('providerApiKeyInput').value.trim();
    const model = document.getElementById('providerModelInput').value.trim();

    if (!name) return;

    if (editId) {
      // Edit existing
      const idx = this.providers.findIndex(p => p.id === editId);
      if (idx !== -1) {
        this.providers[idx].name = name;
        this.providers[idx].type = type;
        this.providers[idx].model = model;
        if (type === 'openai') this.providers[idx].apiUrl = apiUrl;
        if (apiKeyVal && apiKeyVal !== '••••••••') this.providers[idx].apiKey = apiKeyVal;
      }
    } else {
      // Add new
      const newProvider = {
        id: 'provider-' + Date.now(),
        name,
        type,
        apiKey: apiKeyVal,
        model,
        enabled: true
      };
      if (type === 'openai') newProvider.apiUrl = apiUrl;
      this.providers.push(newProvider);

      // Auto-activate if it's the first cloud provider
      if (this.providers.length === 1) {
        this.activeProviderId = newProvider.id;
      }
    }

    this.hideProviderForm();
    this.renderProviders();
    this.saveSettings();
  }

  deleteProvider(id) {
    if (!confirm(i18n.t('deleteProviderConfirm') || 'Delete this provider?')) return;
    this.providers = this.providers.filter(p => p.id !== id);
    if (this.activeProviderId === id) {
      this.activeProviderId = this.providers[0]?.id || '';
    }
    this.renderProviders();
    this.saveSettings();
  }

  setActiveProvider(id) {
    this.activeProviderId = id;
    this.renderProviders();
    this.saveSettings();
  }

  // --- Category Rendering ---

  renderCategories() {
    const container = document.getElementById('categories');
    const categories = this.getCategories();

    container.innerHTML = `
      <button class="category-tag ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">${i18n.t('categoryAll')}</button>
      ${categories.map(cat => `
        <button class="category-tag ${this.currentCategory === cat ? 'active' : ''}" 
                data-category="${this.escapeHtml(cat)}">
          ${this.escapeHtml(cat)}
        </button>
      `).join('')}
    `;

    const datalist = document.getElementById('categoryList');
    datalist.innerHTML = categories.map(cat =>
      `<option value="${this.escapeHtml(cat)}">`
    ).join('');
  }

  getCategories() {
    const categories = new Set();
    this.prompts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort();
  }

  // --- Prompt List Rendering ---

  renderPrompts() {
    const container = document.getElementById('promptList');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    let filtered = this.prompts;

    // Smart filter
    if (this.activeSmartFilter === 'favorites') {
      filtered = filtered.filter(p => p.favorite);
    } else if (this.activeSmartFilter === 'mostUsed') {
      filtered = filtered.filter(p => (p.usageCount || 0) > 0).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (this.activeSmartFilter === 'recent') {
      filtered = filtered.filter(p => p.lastUsedAt).sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0));
    }

    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.currentCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchQuery) ||
        p.content.toLowerCase().includes(searchQuery) ||
        (p.category && p.category.toLowerCase().includes(searchQuery)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery)))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>${i18n.t('noPrompts')}</p>
          <p class="hint">${i18n.t('createFirst')}</p>
        </div>
      `;
      return;
    }

    // --- Pagination ---
    const totalPages = Math.ceil(filtered.length / this.pageSize);
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageItems = filtered.slice(startIdx, startIdx + this.pageSize);

    container.innerHTML = pageItems.map(p => `
      <div class="prompt-item" data-id="${p.id}">
        <div class="prompt-main">
          <div class="prompt-header">
            <div class="prompt-title" title="${this.escapeHtml(p.title)}">${this.escapeHtml(p.title)}</div>
            <div class="prompt-actions">
              <button class="action-btn fav-btn ${p.favorite ? 'active' : ''}" title="Favorite">
                ${p.favorite ? '⭐' : '☆'}
              </button>
              <button class="action-btn share-btn" title="Share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <button class="action-btn insert-btn" title="${i18n.t('insert')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </button>
              <button class="action-btn edit-btn" title="${i18n.t('editPrompt')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn copy-btn" title="${i18n.t('copySuccess')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" title="${i18n.t('deleteConfirm')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="prompt-preview md-content">${this.renderMarkdown(p.content)}</div>
          <div class="prompt-meta">
            ${p.category ? `<span class="prompt-category">${this.escapeHtml(p.category)}</span>` : ''}
            ${p.tags && p.tags.length > 0 ? p.tags.map(t => `<span class="prompt-tag">${this.escapeHtml(t)}</span>`).join('') : ''}
            ${p.shortcut ? `<span class="prompt-shortcut">/${this.escapeHtml(p.shortcut)}</span>` : ''}
            ${(p.usageCount || 0) > 0 ? `<span class="prompt-usage">${p.usageCount}×</span>` : ''}
            ${p.variables && p.variables.length > 0 ?
        `<span class="prompt-vars">${p.variables.length} ${i18n.t('variables')}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // --- Pagination Controls ---
    if (totalPages > 1) {
      const pageInfo = i18n.t('pageInfo').replace('{current}', this.currentPage).replace('{total}', totalPages);
      let paginationHtml = `<div class="pagination">`;
      paginationHtml += `<button class="page-btn" data-page="prev" ${this.currentPage <= 1 ? 'disabled' : ''}>${i18n.t('prevPage')}</button>`;
      for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      paginationHtml += `<button class="page-btn" data-page="next" ${this.currentPage >= totalPages ? 'disabled' : ''}>${i18n.t('nextPage')}</button>`;
      paginationHtml += `<span class="page-info">${pageInfo}</span></div>`;
      container.insertAdjacentHTML('beforeend', paginationHtml);
    }
  }

  goToPage(page) {
    if (page === 'prev') page = this.currentPage - 1;
    else if (page === 'next') page = this.currentPage + 1;
    else page = parseInt(page, 10);
    if (page < 1 || isNaN(page)) return;
    this.currentPage = page;
    this.renderPrompts();
  }

  // --- Event Binding ---

  bindEvents() {
    // Settings toggle
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsPanel').classList.toggle('hidden');
    });

    // Settings Tabs switching
    document.querySelector('.settings-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.settings-tab');
      if (!tab) return;

      // Update Tab active state
      document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update Pane active state
      const targetId = tab.dataset.tab;
      document.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.remove('active'));
      document.getElementById(targetId)?.classList.add('active');
    });

    // Language switch
    document.getElementById('languageSelect')?.addEventListener('change', async (e) => {
      await i18n.setLanguage(e.target.value);
      this.localize();
      this.renderProviders();
      await chrome.runtime.sendMessage({ type: 'LANGUAGE_CHANGED' });
      this.renderPrompts();
    });

    // New prompt
    document.getElementById('addPromptBtn').addEventListener('click', () => {
      this.showEditModal();
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', () => {
      this.currentPage = 1;
      this.renderPrompts();
    });

    // Category filter
    document.getElementById('categories').addEventListener('click', (e) => {
      if (e.target.classList.contains('category-tag')) {
        this.currentCategory = e.target.dataset.category;
        this.currentPage = 1;
        this.renderCategories();
        this.renderPrompts();
      }
    });

    // Category right-click rename
    document.getElementById('categories').addEventListener('contextmenu', async (e) => {
      const tag = e.target.closest('.category-tag');
      if (!tag || tag.dataset.category === 'all') return;
      e.preventDefault();
      const oldName = tag.dataset.category;
      const newName = prompt(i18n.t('renameCategoryPrompt'), oldName);
      if (!newName || newName.trim() === '' || newName.trim() === oldName) return;
      const trimmed = newName.trim();
      this.prompts.forEach(p => {
        if (p.category === oldName) p.category = trimmed;
      });
      await chrome.runtime.sendMessage({ type: 'BATCH_RENAME_CATEGORY', oldName, newName: trimmed });
      if (this.currentCategory === oldName) this.currentCategory = trimmed;
      this.renderCategories();
      this.renderPrompts();
      this.showToast(i18n.t('renameCategory') + ': ' + trimmed);
    });

    // Prompt list actions (delegated)
    document.getElementById('promptList').addEventListener('click', (e) => {
      // Pagination buttons
      const pageBtn = e.target.closest('.page-btn');
      if (pageBtn) {
        this.goToPage(pageBtn.dataset.page);
        return;
      }

      const item = e.target.closest('.prompt-item');
      if (!item) return;
      const id = item.dataset.id;

      // Selection mode: toggle checkbox instead of normal actions
      if (this._packMode) {
        item.classList.toggle('selected');
        this._updatePackCount();
        return;
      }

      if (e.target.closest('.insert-btn')) this.insertPrompt(id);
      else if (e.target.closest('.fav-btn')) this.toggleFavorite(id);
      else if (e.target.closest('.share-btn')) this.sharePrompt(id);
      else if (e.target.closest('.edit-btn')) this.editPrompt(id);
      else if (e.target.closest('.copy-btn')) this.copyPrompt(id);
      else if (e.target.closest('.delete-btn')) { this.deletePrompt(id); }
    });

    // Edit modal
    document.getElementById('closeModal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancelBtn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('promptForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePrompt();
    });

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', () => this.showImportModal());
    document.getElementById('exportBtn').addEventListener('click', () => this.exportPrompts());
    document.getElementById('closeImportModal').addEventListener('click', () => this.hideImportModal());
    document.getElementById('cancelImportBtn').addEventListener('click', () => this.hideImportModal());
    document.getElementById('confirmImportBtn').addEventListener('click', () => this.importPrompts());

    // Import Tabs
    document.querySelectorAll('.import-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchImportTab(e.target.dataset.tab);
      });
    });

    // Fetch URL
    document.getElementById('scanBtn').addEventListener('click', () => this.fetchUrlPrompts());

    // Score Filter
    document.getElementById('scoreFilter').addEventListener('input', (e) => {
      document.getElementById('scoreValue').textContent = e.target.value;
      this.filterImportedPrompts(parseInt(e.target.value, 10));
    });

    // Markdown preview toggle
    const previewToggle = document.getElementById('previewToggle');
    const contentInput = document.getElementById('contentInput');
    const mdPreview = document.getElementById('mdPreview');
    previewToggle?.addEventListener('click', () => {
      const isPreviewVisible = !mdPreview.classList.contains('hidden');
      if (isPreviewVisible) {
        mdPreview.classList.add('hidden');
        contentInput.classList.remove('hidden');
        previewToggle.textContent = i18n.t('preview');
      } else {
        mdPreview.innerHTML = this.renderMarkdown(contentInput.value);
        mdPreview.classList.remove('hidden');
        contentInput.classList.add('hidden');
        previewToggle.textContent = i18n.t('edit');
      }
    });


    // Provider management
    document.getElementById('addProviderBtn')?.addEventListener('click', () => this.showProviderForm());
    document.getElementById('cancelProviderBtn')?.addEventListener('click', () => this.hideProviderForm());
    document.getElementById('saveProviderBtn')?.addEventListener('click', () => this.saveProviderForm());
    document.getElementById('providerTypeSelect')?.addEventListener('change', (e) => {
      const isGeminiWeb = e.target.value === 'gemini-web';
      document.getElementById('providerApiUrlRow')?.classList.toggle('hidden', e.target.value !== 'openai');
      document.getElementById('providerApiKeyInput')?.closest('.form-row')?.classList.toggle('hidden', isGeminiWeb);
      document.getElementById('providerModelInput')?.closest('.form-row')?.classList.toggle('hidden', isGeminiWeb);
    });

    // Provider list events (delegated)
    document.getElementById('providerList')?.addEventListener('click', (e) => {
      const item = e.target.closest('.provider-item');
      if (!item) return;
      const id = item.dataset.providerId;

      if (e.target.closest('.edit-btn')) {
        const provider = this.providers.find(p => p.id === id);
        if (provider) this.showProviderForm(provider);
      } else if (e.target.closest('.delete-btn')) {
        this.deleteProvider(id);
      } else {
        // Click on item selects it as active
        this.setActiveProvider(id);
      }
    });

    // Auto-save settings on input/change
    this.debouncedSaveSettings = this.debounce(() => this.saveSettings(), 600);
    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel?.addEventListener('input', (e) => {
      // Skip provider form inputs — they save explicitly via Save button
      if (e.target.closest('#providerForm')) return;
      if (e.target.matches('.settings-input, input[type="radio"], select')) {
        this.debouncedSaveSettings();
      }
    });
    settingsPanel?.addEventListener('change', (e) => {
      if (e.target.closest('#providerForm')) return;
      if (e.target.matches('.settings-input, input[type="radio"], select')) {
        this.debouncedSaveSettings();
      }
    });

    // Sync Backend select
    document.getElementById('syncBackendSelect')?.addEventListener('change', (e) => this.toggleSyncUI(e.target.value));

    document.getElementById('forceSyncGistBtn')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = 'Syncing...';
      btn.disabled = true;

      const resp = await chrome.runtime.sendMessage({ type: 'FORCE_GIST_SYNC' });

      btn.textContent = originalText;
      btn.disabled = false;

      if (resp.success) {
        this.showToast(i18n.t(resp.message) || resp.message || 'Gist Sync Successful');
        await this.loadPrompts();
        this.currentPage = 1;
        this.renderCategories();
        this.renderPrompts();
      } else {
        const errorKey = resp.error || 'Unknown';
        const errorMsg = i18n.t(errorKey) || errorKey;
        this.showToast('❌ ' + errorMsg, 4000);
      }
    });

    document.getElementById('forceSyncWebdavBtn')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = 'Syncing...';
      btn.disabled = true;

      const resp = await chrome.runtime.sendMessage({ type: 'FORCE_WEBDAV_SYNC' });

      btn.textContent = originalText;
      btn.disabled = false;

      if (resp.success) {
        this.showToast(i18n.t(resp.message) || resp.message || 'WebDAV Sync Successful');
        await this.loadPrompts();
        this.currentPage = 1;
        this.renderCategories();
        this.renderPrompts();
      } else {
        const errorKey = resp.error || 'Unknown';
        const errorMsg = i18n.t(errorKey) || errorKey;
        this.showToast('❌ ' + errorMsg, 4000);
      }
    });

    document.getElementById('forceSyncObsidianBtn')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = 'Syncing...';
      btn.disabled = true;

      try {
        const resp = await chrome.runtime.sendMessage({ type: 'FORCE_OBSIDIAN_SYNC' });
        btn.textContent = originalText;
        btn.disabled = false;

        if (resp.success) {
          this.showToast(i18n.t(resp.message) || resp.message || 'Obsidian Vault Sync Successful');
          await this.loadPrompts();
          this.currentPage = 1;
          this.renderCategories();
          this.renderPrompts();
        } else {
          const errorKey = resp.error || 'Unknown';
          const errorMsg = i18n.t(errorKey) || errorKey;
          this.showToast('❌ ' + errorMsg, 4000);
        }
      } catch (err) {
        btn.textContent = originalText;
        btn.disabled = false;
        this.showToast('❌ ' + err.message, 4000);
      }
    });

    // Obsidian Local: Test Connection
    document.getElementById('testObsidianLocalBtn')?.addEventListener('click', async () => {
      const port = document.getElementById('obsidianLocalPortInput')?.value || 27123;
      const apiKey = document.getElementById('obsidianLocalApiKeyInput')?.value?.trim() || '';
      const statusEl = document.getElementById('obsidianLocalStatus');

      try {
        const headers = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const resp = await fetch(`http://127.0.0.1:${port}/prompt-ark/health`, { headers });
        const data = await resp.json();

        if (data.status === 'ok') {
          if (statusEl) statusEl.innerHTML = `🟢 Connected — Vault: <strong>${data.vault}</strong>, Folder: <code>${data.promptFolder}</code>`;
          this.showToast('✅ Obsidian plugin connected!');
        } else {
          if (statusEl) statusEl.textContent = '🔴 Unexpected response';
        }
      } catch (e) {
        if (statusEl) statusEl.textContent = '🔴 Cannot reach Obsidian plugin. Is it running?';
        this.showToast('❌ Cannot reach Obsidian plugin', 4000);
      }
    });

    // Obsidian Local: Force Sync
    document.getElementById('forceSyncObsidianLocalBtn')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const originalText = btn.textContent;
      btn.textContent = 'Syncing...';
      btn.disabled = true;

      try {
        const resp = await chrome.runtime.sendMessage({ type: 'FORCE_OBSIDIAN_LOCAL_SYNC' });
        btn.textContent = originalText;
        btn.disabled = false;

        if (resp.success) {
          this.showToast(i18n.t(resp.message) || resp.message || 'Obsidian Local Sync Successful');
          await this.loadPrompts();
          this.currentPage = 1;
          this.renderCategories();
          this.renderPrompts();
        } else {
          const errorKey = resp.error || 'Unknown';
          const errorMsg = i18n.t(errorKey) || errorKey;
          this.showToast('❌ ' + errorMsg, 4000);
        }
      } catch (err) {
        btn.textContent = originalText;
        btn.disabled = false;
        this.showToast('❌ ' + err.message, 4000);
      }
    });

    // Smart filters
    document.getElementById('smartFilters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.smart-filter-btn');
      if (!btn) return;
      const filter = btn.dataset.filter;
      if (this.activeSmartFilter === filter) {
        this.activeSmartFilter = null; // Toggle off
        btn.classList.remove('active');
      } else {
        this.activeSmartFilter = filter;
        document.querySelectorAll('.smart-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      this.currentPage = 1;
      this.renderPrompts();
    });

    // Optimize prompt
    document.getElementById('optimizeBtn')?.addEventListener('click', () => this.optimizePrompt());
    document.getElementById('optimizeAcceptBtn')?.addEventListener('click', () => this.acceptOptimize());
    document.getElementById('optimizeRejectBtn')?.addEventListener('click', () => this.rejectOptimize());
    document.getElementById('variantTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.variant-tab');
      if (tab) this.switchVariant(Number(tab.dataset.variantIdx));
    });
    document.getElementById('optimizeProviderBtn')?.addEventListener('click', () => this.showProviderPicker());
    document.getElementById('optimizeProviderMenu')?.addEventListener('click', (e) => {
      const opt = e.target.closest('.optimize-provider-option');
      if (opt) this.selectOptimizeProvider(opt.dataset.providerId);
    });

    // History
    document.getElementById('historyBtn')?.addEventListener('click', () => this.showHistory());
    document.getElementById('closeHistoryModal')?.addEventListener('click', () => this.hideHistory());
    document.getElementById('historyList')?.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (item) this.previewVersion(item.dataset.versionId);
    });
    document.getElementById('restoreBtn')?.addEventListener('click', () => this.restoreVersion());

    // --- Share Panel ---
    document.getElementById('sharePanelBackdrop')?.addEventListener('click', () => this.hideSharePanel());
    document.getElementById('sharePanelClose')?.addEventListener('click', () => this.hideSharePanel());
    document.getElementById('sharePanel')?.addEventListener('click', (e) => {
      const opt = e.target.closest('.share-option');
      if (!opt) return;
      const platform = opt.dataset.platform;
      this._handleShareOption(platform);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideSharePanel();
    });

    // --- Pack Mode ---
    document.getElementById('packBtn')?.addEventListener('click', () => this.enterPackMode());
    document.getElementById('packShareBtn')?.addEventListener('click', () => this.sharePack());
    document.getElementById('packCancelBtn')?.addEventListener('click', () => this.exitPackMode());
  }



  // --- Edit Modal ---

  showEditModal(prompt = null) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('modalTitle');

    if (prompt) {
      title.textContent = i18n.t('editPrompt');
      document.getElementById('promptId').value = prompt.id;
      document.getElementById('titleInput').value = prompt.title;
      document.getElementById('categoryInput').value = prompt.category || '';
      document.getElementById('shortcutInput').value = prompt.shortcut || '';
      document.getElementById('contentInput').value = prompt.content;
      this.editingId = prompt.id;
      document.getElementById('historyBtn').classList.remove('hidden');
    } else {
      title.textContent = i18n.t('newPrompt');
      document.getElementById('promptForm').reset();
      document.getElementById('promptId').value = '';
      this.editingId = null;
      document.getElementById('historyBtn').classList.add('hidden');
    }

    modal.classList.remove('hidden');
    document.getElementById('titleInput').focus();
    // Reset diff panel state on open
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    document.getElementById('contentInput').classList.remove('hidden');
    this._originalContent = null;
    this._optimizedContent = null;
  }

  hideEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('mdPreview').classList.add('hidden');
    document.getElementById('contentInput').classList.remove('hidden');
    document.getElementById('previewToggle').textContent = i18n.t('preview');
    // Reset diff panel state
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    this._originalContent = null;
    this._optimizedContent = null;
    this._optimizeProviderId = null;
    this.editingId = null;
  }

  // --- Prompt Optimization with Diff View ---
  async optimizePrompt() {
    const contentEl = document.getElementById('contentInput');
    const content = contentEl.value.trim();
    if (!content) return;

    // Exit preview mode if active
    const mdPreview = document.getElementById('mdPreview');
    if (!mdPreview.classList.contains('hidden')) {
      mdPreview.classList.add('hidden');
      contentEl.classList.remove('hidden');
      document.getElementById('previewToggle').textContent = i18n.t('preview');
    }

    const btn = document.getElementById('optimizeBtn');
    btn.disabled = true;
    btn.textContent = '⏳...';

    try {
      const msg = { type: 'OPTIMIZE_PROMPT', content };
      if (this._optimizeProviderId) msg.providerId = this._optimizeProviderId;

      const resp = await chrome.runtime.sendMessage(msg);

      if (resp?.success && resp.variants?.length) {
        this._originalContent = content;
        this._variants = resp.variants;
        this._selectedVariant = 0;
        this.showVariantPicker(content, resp.variants);
      } else {
        const errMsg = resp.error === 'NEED_CLOUD'
          ? i18n.t('optimizeNeedCloud')
          : (resp.error ? `${i18n.t('optimizeFailed')}: ${resp.error}` : i18n.t('optimizeFailed'));
        console.error('Optimize failed:', resp);
        this.showToast(errMsg);
      }
    } catch (e) {
      console.error('Optimize exception:', e);
      this.showToast(i18n.t('optimizeFailed'));
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ ' + i18n.t('optimize');
    }
  }

  // Line-based diff algorithm
  computeLineDiff(original, optimized) {
    const oldLines = original.split('\n');
    const newLines = optimized.split('\n');
    const result = [];

    // LCS-based diff
    const m = oldLines.length, n = newLines.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = oldLines[i - 1] === newLines[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    // Backtrack to produce diff
    let i = m, j = n;
    const ops = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        ops.unshift({ type: 'unchanged', text: oldLines[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.unshift({ type: 'added', text: newLines[j - 1] });
        j--;
      } else {
        ops.unshift({ type: 'removed', text: oldLines[i - 1] });
        i--;
      }
    }
    return ops;
  }

  showOptimizeDiff(original, optimized) {
    const diff = this.computeLineDiff(original, optimized);
    const container = document.getElementById('optimizeDiffContent');
    container.innerHTML = diff.map(op => {
      const prefix = op.type === 'added' ? '+ ' : op.type === 'removed' ? '- ' : '  ';
      const cls = `diff-line ${op.type}`;
      const escaped = op.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div class="${cls}">${prefix}${escaped}</div>`;
    }).join('');
  }

  showVariantPicker(original, variants) {
    const variantLabels = [
      i18n.t('variantConcise') || '⚡ 精炼',
      i18n.t('variantEnhanced') || '🎯 合约',
      i18n.t('variantPro') || '🏗️ 全规格'
    ];

    // Build tabs (only if multiple variants)
    const tabsContainer = document.getElementById('variantTabs');
    if (variants.length > 1) {
      tabsContainer.innerHTML = variants.map((_, idx) => {
        const label = variantLabels[idx] || `Variant ${idx + 1}`;
        return `<button type="button" class="variant-tab${idx === 0 ? ' active' : ''}" data-variant-idx="${idx}">${label}</button>`;
      }).join('');
      tabsContainer.classList.remove('hidden');
    } else {
      tabsContainer.innerHTML = '';
      tabsContainer.classList.add('hidden');
    }

    // Show first variant's diff
    this.showOptimizeDiff(original, variants[0]);

    document.getElementById('contentInput').classList.add('hidden');
    document.getElementById('optimizeDiffPanel').classList.remove('hidden');
  }

  switchVariant(idx) {
    if (!this._variants || idx >= this._variants.length) return;
    this._selectedVariant = idx;

    // Update tab active state
    document.querySelectorAll('.variant-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === idx);
    });

    // Re-render diff
    this.showOptimizeDiff(this._originalContent, this._variants[idx]);
  }

  acceptOptimize() {
    const contentEl = document.getElementById('contentInput');
    const selectedText = this._variants?.[this._selectedVariant] || this._variants?.[0];
    if (selectedText) contentEl.value = selectedText;
    contentEl.classList.remove('hidden');
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    document.getElementById('variantTabs')?.classList.add('hidden');
    this._originalContent = null;
    this._variants = null;
    this._selectedVariant = 0;
    this.showToast('✨');
  }

  rejectOptimize() {
    const contentEl = document.getElementById('contentInput');
    contentEl.value = this._originalContent;
    contentEl.classList.remove('hidden');
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    document.getElementById('variantTabs')?.classList.add('hidden');
    this._originalContent = null;
    this._variants = null;
    this._selectedVariant = 0;
  }

  // --- Provider Picker for Optimization ---
  async showProviderPicker() {
    const menu = document.getElementById('optimizeProviderMenu');
    if (!menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
      return;
    }

    const resp = await chrome.runtime.sendMessage({ type: 'GET_PROVIDERS' });
    if (!resp.success) return;

    const cloudProviders = resp.providers;
    if (cloudProviders.length === 0) {
      this.showToast(i18n.t('optimizeNeedCloud'));
      return;
    }

    const activeId = this._optimizeProviderId || resp.activeProviderId;
    menu.innerHTML = cloudProviders.map(p => {
      const isActive = p.id === activeId;
      return `<button type="button" class="optimize-provider-option${isActive ? ' active' : ''}" data-provider-id="${p.id}">
        <span class="provider-dot"></span>
        ${p.name} <span style="color:var(--text-tertiary);font-size:11px">(${p.model || p.type})</span>
      </button>`;
    }).join('');

    menu.classList.remove('hidden');

    // Close on outside click
    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target.id !== 'optimizeProviderBtn') {
        menu.classList.add('hidden');
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  selectOptimizeProvider(providerId) {
    this._optimizeProviderId = providerId;
    document.getElementById('optimizeProviderMenu').classList.add('hidden');
    const option = document.querySelector(`.optimize-provider-option[data-provider-id="${providerId}"]`);
    const name = option?.textContent?.trim()?.split('(')[0]?.trim() || '';
    this.showToast(i18n.t('optimizeWith', { name }));
  }

  async savePrompt() {
    const prompt = {
      title: document.getElementById('titleInput').value.trim(),
      category: document.getElementById('categoryInput').value.trim(),
      shortcut: document.getElementById('shortcutInput').value.trim().replace(/^\//, '').replace(/[^a-zA-Z0-9_-]/g, ''),
      content: document.getElementById('contentInput').value.trim()
    };

    if (!prompt.content) {
      this.showToast(i18n.t('requiredFields'));
      return;
    }

    // Instant fallback: use content snippet as title if empty
    // AI extraction happens asynchronously in background after save
    if (!prompt.title) {
      prompt.title = prompt.content.substring(0, 30).replace(/\n/g, ' ') + '...';
      document.getElementById('titleInput').value = prompt.title;
    }

    let response;
    try {
      if (this.editingId) {
        prompt.id = this.editingId;
        response = await chrome.runtime.sendMessage({ type: 'UPDATE_PROMPT', prompt });
      } else {
        response = await chrome.runtime.sendMessage({ type: 'SAVE_PROMPT', prompt });
      }
    } catch (e) {
      console.error('Save sendMessage error:', e);
      this.showToast('❌ ' + i18n.t('saveError'));
      return;
    }

    if (response?.success) {
      await this.loadPrompts();
      this.renderCategories();
      this.renderPrompts();
      this.hideEditModal();
    } else {
      console.error('Save failed:', response);
      this.showToast('❌ ' + i18n.t('saveError'));
    }
  }

  editPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (prompt) this.showEditModal(prompt);
  }

  async deletePrompt(id) {
    if (!confirm(i18n.t('deleteConfirm'))) return;

    // Optimistic: remove from memory and re-render immediately
    const removed = this.prompts.find(p => p.id === id);
    this.prompts = this.prompts.filter(p => p.id !== id);
    this.renderCategories();
    this.renderPrompts();

    // Background: persist the deletion
    try {
      const response = await chrome.runtime.sendMessage({ type: 'DELETE_PROMPT', id });
      if (!response?.success) throw new Error('Delete failed');
    } catch (e) {
      console.error('Delete error:', e);
      // Rollback
      if (removed) this.prompts.push(removed);
      this.renderCategories();
      this.renderPrompts();
      this.showToast(i18n.t('saveError'));
    }
  }

  // --- Favorites ---
  async toggleFavorite(id) {
    // Optimistic: flip in memory and re-render immediately
    const p = this.prompts.find(p => p.id === id);
    if (p) {
      p.favorite = !p.favorite;
      this.renderPrompts();
    }
    // Fire-and-forget to background, rollback on failure
    chrome.runtime.sendMessage({ type: 'TOGGLE_FAVORITE', id }).catch(e => {
      if (p) { p.favorite = !p.favorite; this.renderPrompts(); }
      console.error('toggleFavorite failed:', e);
    });
  }

  // --- Share via GitHub Gist + Social Panel ---
  async sharePrompt(id) {
    const btn = document.querySelector(`.prompt-item[data-id="${id}"] .share-btn`);
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳'; }
    const prompt = this.prompts.find(p => p.id === id);
    const title = prompt?.title || 'Untitled Prompt';

    try {
      const resp = await chrome.runtime.sendMessage({ type: 'SHARE_PROMPT', id });
      if (!resp.success) {
        if (resp.error === 'GitHub token not configured') {
          this.showToast(i18n.t('configureGithubToken'));
        } else {
          this.showToast('❌ ' + resp.error);
        }
        return;
      }
      this.showSharePanel(resp.url, title);
    } catch (e) {
      this.showToast('❌ ' + i18n.t('shareFailed') + ': ' + e.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
      }
    }
  }

  // Show floating share panel with social options
  showSharePanel(url, title) {
    this._shareUrl = url;
    this._shareTitle = title;
    document.getElementById('sharePanelTitle').textContent = `${i18n.t('sharePrompt')} "${title}"`;
    document.getElementById('sharePanel').classList.remove('hidden');
    document.getElementById('sharePanelBackdrop').classList.remove('hidden');
  }

  hideSharePanel() {
    document.getElementById('sharePanel').classList.add('hidden');
    document.getElementById('sharePanelBackdrop').classList.add('hidden');
    this._shareUrl = null;
    this._shareTitle = null;
  }

  async _handleShareOption(platform) {
    const url = this._shareUrl;
    const title = this._shareTitle || 'AI Prompt';
    if (!url) return;

    switch (platform) {
      case 'twitter': {
        const text = `🔥 ${title} — My AI Prompt\n\nInstall this prompt with one click:\n${url}\n\n#PromptArk #AI #Prompt`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
        break;
      }
      case 'reddit': {
        const redditTitle = `[Prompt] ${title}`;
        const redditText = `I made this AI prompt. You can try it and install it with one click here:\n${url}`;
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(redditTitle)}&text=${encodeURIComponent(redditText)}`, '_blank');
        break;
      }
      case 'copy': {
        await navigator.clipboard.writeText(url);
        this.showToast(i18n.t('linkCopied'));
        break;
      }
      case 'json': {
        const prompt = this.prompts.find(p => p.title === title);
        if (prompt) {
          const json = JSON.stringify({ title: prompt.title, content: prompt.content, category: prompt.category, tags: prompt.tags }, null, 2);
          await navigator.clipboard.writeText(json);
          this.showToast(i18n.t('jsonCopied'));
        }
        break;
      }
    }
    this.hideSharePanel();
  }

  // --- Prompt Pack (Selection Mode) ---
  enterPackMode() {
    this._packMode = true;
    this._packSelected = new Set();
    document.querySelectorAll('.prompt-item').forEach(el => el.classList.add('selectable'));
    document.getElementById('packToolbar').classList.remove('hidden');
    document.getElementById('packTitleInput').value = '';
    this._updatePackCount();
    this.showToast(i18n.t('packMode'));
  }

  exitPackMode() {
    this._packMode = false;
    this._packSelected = null;
    document.querySelectorAll('.prompt-item').forEach(el => {
      el.classList.remove('selectable', 'selected');
    });
    document.getElementById('packToolbar').classList.add('hidden');
  }

  _updatePackCount() {
    const count = document.querySelectorAll('.prompt-item.selected').length;
    document.getElementById('packSelectedCount').textContent = count;
    document.getElementById('packShareBtn').disabled = count === 0;
  }

  async sharePack() {
    const selectedItems = document.querySelectorAll('.prompt-item.selected');
    const ids = Array.from(selectedItems).map(el => el.dataset.id);
    const packTitle = document.getElementById('packTitleInput').value.trim() || `Prompt Pack (${ids.length})`;

    if (ids.length === 0) {
      this.showToast(i18n.t('packSelectOne'));
      return;
    }

    const btn = document.getElementById('packShareBtn');
    btn.disabled = true;
    btn.textContent = i18n.t('packSharing');

    try {
      const resp = await chrome.runtime.sendMessage({ type: 'SHARE_PACK', ids, packTitle });
      if (!resp.success) {
        if (resp.error === 'GitHub token not configured') {
          this.showToast(i18n.t('configureGithubToken'));
        } else {
          this.showToast('❌ ' + resp.error);
        }
        return;
      }
      this.exitPackMode();
      this.showSharePanel(resp.url, packTitle);
    } catch (e) {
      this.showToast('❌ ' + i18n.t('packShareFailed') + ': ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = i18n.t('packShare');
    }
  }

  // --- Insert with Variable Fill ---

  async insertPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    // Track usage
    chrome.runtime.sendMessage({ type: 'TRACK_USAGE', id }).catch(() => { });
    const p = this.prompts.find(p => p.id === id);
    if (p) { p.usageCount = (p.usageCount || 0) + 1; p.lastUsedAt = Date.now(); }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      this.showToast(i18n.t('insertError'));
      return;
    }

    // COMPOSE PROMPT
    const resp = await chrome.runtime.sendMessage({ type: 'COMPOSE_PROMPT', prompt });
    let composedContent = prompt.content;
    let composedVars = prompt.variables || [];
    if (resp && resp.success) {
      composedContent = resp.composed;
      composedVars = resp.variables || [];
    }
    const composedPrompt = { ...prompt, content: composedContent, variables: composedVars };

    // Check for variables
    if (composedVars && composedVars.length > 0) {
      this.showVariableFillModal(composedPrompt, async (filledContent) => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'INSERT_PROMPT',
            content: filledContent
          });
          window.close();
        } catch (error) {
          this.showToast(i18n.t('insertError'));
        }
      }, i18n.t('insert'));
    } else {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'INSERT_PROMPT',
          content: composedContent
        });
        window.close();
      } catch (error) {
        this.showToast(i18n.t('insertError'));
      }
    }
  }
  showVariableFillModal(prompt, onComplete, actionBtnText = 'Confirm') {
    // Reuse the edit modal area for variable fill
    let varModal = document.getElementById('variableModal');
    if (!varModal) {
      varModal = document.createElement('div');
      varModal.id = 'variableModal';
      varModal.className = 'modal hidden';
      varModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="varModalTitle">${i18n.t('fillVariables')}</h2>
          <button class="modal-close" id="closeVarModal">&times;</button>
        </div>
        <div id="varFormContainer" style="padding: 16px; overflow-y: auto;"></div>
        <div class="form-actions" style="padding: 0 16px 16px;">
          <button class="btn btn-secondary" id="cancelVarBtn">${i18n.t('cancel')}</button>
          <button class="btn btn-primary" id="insertVarBtn"></button>
        </div>
      </div>
    `;
      document.body.appendChild(varModal);
    }

    // Update title
    varModal.querySelector('#varModalTitle').textContent = `${i18n.t('fillVariables')}: ${prompt.title}`;

    // Render variable inputs
    const container = varModal.querySelector('#varFormContainer');
    container.innerHTML = prompt.variables.map(v => `
    <div class="form-group">
      <label for="var-${this.escapeHtml(v)}">${this.escapeHtml(v)}</label>
      <input type="text" id="var-${this.escapeHtml(v)}" data-var="${this.escapeHtml(v)}" 
             placeholder="[${this.escapeHtml(v)}]">
    </div>
  `).join('');

    varModal.classList.remove('hidden');

    // Focus first input
    const firstInput = container.querySelector('input');
    if (firstInput) firstInput.focus();

    // Bind events (use cloneNode trick to remove old listeners)
    const closeBtn = varModal.querySelector('#closeVarModal');
    const cancelBtn = varModal.querySelector('#cancelVarBtn');
    const insertBtn = varModal.querySelector('#insertVarBtn');

    insertBtn.textContent = actionBtnText;

    const hideVarModal = () => varModal.classList.add('hidden');

    closeBtn.onclick = hideVarModal;
    cancelBtn.onclick = hideVarModal;
    insertBtn.onclick = async () => {
      // Collect values
      let content = prompt.content;
      container.querySelectorAll('[data-var]').forEach(input => {
        const varName = input.dataset.var;
        const val = input.value;
        // Replace both {{varName}} and [varName] formats
        content = content.split(`{{${varName}}}`).join(val || `{{${varName}}}`);
        content = content.split(`[${varName}]`).join(val || `[${varName}]`);
      });

      hideVarModal();
      if (onComplete) {
        await onComplete(content);
      }
    };
  }
  // --- Copy ---

  async copyPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    const doCopy = async (content) => {
      try {
        await navigator.clipboard.writeText(content);
        this.showToast(i18n.t('copySuccess'));
      } catch (error) {
        console.error('Copy failed:', error);
      }
    };

    const resp = await chrome.runtime.sendMessage({ type: 'COMPOSE_PROMPT', prompt });
    let composedContent = prompt.content;
    let composedVars = prompt.variables || [];
    if (resp && resp.success) {
      composedContent = resp.composed;
      composedVars = resp.variables || [];
    }
    const composedPrompt = { ...prompt, content: composedContent, variables: composedVars };

    if (composedVars && composedVars.length > 0) {
      this.showVariableFillModal(composedPrompt, doCopy, i18n.t('copy') || 'Copy');
    } else {
      await doCopy(composedContent);
    }
  }

  // --- Import/Export ---

  async exportPrompts() {
    const response = await chrome.runtime.sendMessage({ type: 'EXPORT_PROMPTS' });
    if (response.success) {
      const data = JSON.stringify(response.data, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-prompts-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast(i18n.t('exportSuccess'));
    }
  }

  showImportModal() {
    document.getElementById('importModal').classList.remove('hidden');
    document.getElementById('importData').value = '';
    this.switchImportTab('paste');
  }

  hideImportModal() {
    document.getElementById('importModal').classList.add('hidden');
  }

  switchImportTab(tabName) {
    document.querySelectorAll('.import-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.getElementById('importPasteArea').classList.toggle('hidden', tabName !== 'paste');
    document.getElementById('importUrlArea').classList.toggle('hidden', tabName !== 'url');
  }

  async fetchUrlPrompts() {
    const url = document.getElementById('importUrlInput').value.trim();
    if (!url) return;

    const btn = document.getElementById('scanBtn');
    const statusEl = document.getElementById('scanStatus');
    const deepScan = document.getElementById('deepScan').checked;

    const originalText = btn.innerText;
    btn.innerText = 'Stop';
    btn.disabled = true;
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Initializing scan...';

    this.importedPromptsCache = [];
    this.filteredImportCache = [];

    try {
      // Refresh GitHubClient with saved token for authenticated API access (5000 req/hr)
      const ghToken = document.getElementById('githubTokenInput')?.value?.trim() || '';
      this.githubClient = new GitHubClient(ghToken);

      let files = [];

      // Check if it's a GitHub URL
      const ghInfo = this.githubClient.parseUrl(url);

      // Check if it's a Gist URL
      const gistInfo = this.githubClient.parseGistUrl(url);

      if (gistInfo.isGist) {
        statusEl.textContent = 'Fetching Gist...';
        let content;
        if (gistInfo.rawUrl) {
          const resp = await fetch(gistInfo.rawUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          content = await resp.text();
        } else {
          content = await this.githubClient.fetchGistContent(gistInfo.gistId);
        }
        files = [{ path: 'gist.json', content, url }];
      } else if (ghInfo) {
        files = await this.githubClient.scanRecursively(url, (msg) => {
          statusEl.textContent = msg;
        }, deepScan);
      } else {
        statusEl.textContent = 'Fetching single URL...';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        files = [{ path: 'url', content: text, url: url }];
      }

      if (files.length === 0) throw new Error('No supported files found.');

      // Phase 1: Parse files into raw prompts (heuristic scored)
      statusEl.textContent = i18n.t('scanParsing', { count: files.length });
      const rawPrompts = [];

      for (const file of files) {
        const parsed = PromptParser.parse(file.content, file.path);
        parsed.forEach((p, idx) => {
          const id = `p-${rawPrompts.length}`;
          rawPrompts.push({
            ...p,
            id,
            score: PromptScorer.score(p.prompt),
            sourceUrl: file.url
          });
        });
      }

      this.importedPromptsCache = rawPrompts;

      // Phase 2: Apply heuristic filter FIRST to get manageable subset
      const minScore = parseInt(document.getElementById('scoreFilter').value, 10);
      const filtered = rawPrompts
        .filter(p => p.score >= minScore)
        .sort((a, b) => b.score - a.score);

      statusEl.textContent = i18n.t('scanParsed', { total: rawPrompts.length, passed: filtered.length, min: minScore });

      // Phase 3: AI Analysis — only on filtered subset (cap at 200)
      const toAnalyze = filtered.slice(0, 200);

      if (toAnalyze.length > 0) {
        const progressDiv = document.getElementById('aiProgress');
        progressDiv.classList.remove('hidden');

        const aiResults = await this.contentAnalyzer.analyzeBatch(toAnalyze, () => { });
        progressDiv.classList.add('hidden');

        // Phase 4: Merge AI results back
        const idMap = new Map(rawPrompts.map(p => [p.id, p]));
        let mergedCount = 0;
        aiResults.forEach(res => {
          const p = idMap.get(res.id);
          if (p) {
            if (res.title) { p.act = res.title; mergedCount++; }
            if (res.category) p.category = res.category;
            if (res.tags && Array.isArray(res.tags)) p.tags = res.tags;
            if (res.score > 0) p.score = res.score;
          }
        });

        statusEl.textContent = i18n.t('scanDone', { analyzed: toAnalyze.length, enriched: mergedCount });
      } else {
        statusEl.textContent = rawPrompts.length > 0
          ? i18n.t('scanNonePassed', { total: rawPrompts.length, min: minScore })
          : i18n.t('scanNoPrompts', { files: files.length });
      }

      // Phase 5: Re-apply filter and render
      this.filterImportedPrompts(minScore);

    } catch (error) {
      console.error('[Prompt Ark] Scan error:', error);
      this.showToast('❌ ' + i18n.t('scanFailed') + ': ' + error.message);
      statusEl.textContent = 'Error: ' + error.message;
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }

  filterImportedPrompts(minScore) {
    if (!this.importedPromptsCache.length) return;

    this.filteredImportCache = this.importedPromptsCache
      .filter(p => p.score >= minScore)
      .sort((a, b) => b.score - a.score); // Sort high score first

    const previewList = document.getElementById('previewList');
    previewList.innerHTML = '';

    this.filteredImportCache.slice(0, 100).forEach(p => {
      const div = document.createElement('div');
      div.className = 'preview-item';

      const color = PromptScorer.getScoreColor(p.score);
      const categoryHtml = p.category ? `<span class="category-badge">${this.escapeHtml(p.category)}</span>` : '';

      div.innerHTML = `
             <span class="score-badge" style="background-color: ${color}">${p.score}</span>
             <span class="act" title="${this.escapeHtml(p.act)}">${categoryHtml}${this.escapeHtml(p.act)}</span>
             <span class="prompt" title="${this.escapeHtml(p.prompt)}">${this.escapeHtml(p.prompt)}</span>
           `;
      previewList.appendChild(div);
    });

    document.getElementById('previewCount').innerText = this.filteredImportCache.length;
    document.getElementById('urlPreview').classList.remove('hidden');
  }

  async importPrompts() {
    const activeTab = document.querySelector('.import-tab.active').dataset.tab;
    let promptsToImport = [];

    if (activeTab === 'paste') {
      const dataStr = document.getElementById('importData').value.trim();
      if (!dataStr) {
        this.showToast(i18n.t('importEmptyData'));
        return;
      }
      try {
        // Try JSON first
        try {
          const json = JSON.parse(dataStr);
          promptsToImport = PromptParser.parseJson(json);
        } catch {
          // Try other parsers
          promptsToImport = PromptParser.parse(dataStr);
        }
      } catch (e) {
        this.showToast('❌ ' + i18n.t('parseFailed') + ': ' + e.message);
        return;
      }
    } else {
      promptsToImport = this.filteredImportCache || [];
    }

    if (promptsToImport.length === 0) {
      this.showToast(i18n.t('noValidPrompts'));
      return;
    }

    if (!confirm(i18n.t('confirmImport', { count: promptsToImport.length }))) return;

    // Save to storage
    const newPrompts = promptsToImport.map(p => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      title: p.act,
      content: p.prompt,
      category: p.category || 'Imported',
      tags: p.tags || [],
      usageCount: 0,
      lastUsed: Date.now(),
      pinned: false,
      keywords: [p.act.toLowerCase()]
    }));

    try {
      const response = await chrome.runtime.sendMessage({ type: 'IMPORT_PROMPTS', prompts: newPrompts });

      if (response.success) {
        await this.loadPrompts();
        this.renderCategories();
        this.renderPrompts();
        this.hideImportModal();
        this.showToast(i18n.t('importSuccess', { count: newPrompts.length }));

        // Cleanup
        this.importedPromptsCache = [];
        document.getElementById('importData').value = '';
        document.getElementById('importUrlInput').value = '';
        document.getElementById('urlPreview').classList.add('hidden');
      } else {
        this.showToast('❌ ' + i18n.t('importError') + ': ' + (response.error || ''));
      }
    } catch (error) {
      this.showToast('❌ ' + i18n.t('importError') + ': ' + error.message);
    }
  }

  // --- History Management ---

  async showHistory() {
    if (!this.editingId) return;
    const response = await chrome.runtime.sendMessage({ type: 'GET_PROMPT_HISTORY', id: this.editingId });
    if (response.success) {
      this.currentHistory = response.versions;
      this.renderHistoryList();
      document.getElementById('historyModal').classList.remove('hidden');
      if (this.currentHistory.length > 0) {
        this.previewVersion(this.currentHistory[0].versionId);
      } else {
        document.getElementById('diffContent').textContent = 'No history yet.';
        document.getElementById('restoreBtn').classList.add('hidden');
      }
    }
  }

  hideHistory() {
    document.getElementById('historyModal').classList.add('hidden');
  }

  renderHistoryList() {
    const list = document.getElementById('historyList');
    list.innerHTML = this.currentHistory.map(v => `
      <div class="history-item" data-version-id="${v.versionId}">
        <div class="version-time">${this.formatRelativeTime(v.timestamp)}</div>
        <div class="version-preview">${this.escapeHtml(v.content.substring(0, 40))}...</div>
      </div>
    `).join('');
  }

  previewVersion(versionId) {
    const version = this.currentHistory.find(v => v.versionId === versionId);
    if (!version) return;

    this.previewingVersionId = versionId;
    const content = document.getElementById('diffContent');
    content.innerHTML = this.renderMarkdown(version.content);

    document.getElementById('restoreBtn').classList.remove('hidden');

    // Highlight active item
    document.querySelectorAll('.history-item').forEach(el => {
      el.classList.toggle('active', el.dataset.versionId === versionId);
    });
  }

  async restoreVersion() {
    if (!this.previewingVersionId || !this.editingId) return;

    const version = this.currentHistory.find(v => v.versionId === this.previewingVersionId);
    if (version) {
      document.getElementById('contentInput').value = version.content;
      this.hideHistory();
      this.showToast(i18n.t('restoreSuccess') || 'Restored');
    }
  }



  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return i18n.t('timeAgoDays', { count: days }) || `${days}d ago`;
    if (hours > 0) return i18n.t('timeAgoHours', { count: hours }) || `${hours}h ago`;
    if (minutes > 0) return i18n.t('timeAgoMinutes', { count: minutes }) || `${minutes}m ago`;
    return i18n.t('timeAgoJustNow') || 'just now';
  }


  // --- Utilities ---

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  renderMarkdown(text) {
    if (!text) return '';
    try {
      return marked.parse(text);
    } catch (e) {
      return this.escapeHtml(text);
    }
  }
}

new PopupManager();
