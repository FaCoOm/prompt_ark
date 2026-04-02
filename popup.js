console.log(`🔥 [popup.js] v${chrome.runtime.getManifest().version} loaded`);
import { i18n } from './i18n-manager.js';
import { PromptParser } from './lib/parsers.js';
import { GitHubClient } from './lib/github-client.js';
import { PromptScorer } from './lib/scorer.js';
import { ContentAnalyzer } from './lib/analyzer.js';
import { showToast, escapeHtml, debounce, renderMarkdown, formatRelativeTime, highlightVariables } from './lib/popup/utils.js';
import { HistoryPanel } from './lib/popup/history-panel.js';
import { ShareManager } from './lib/popup/share-manager.js';
import { CATEGORY_TYPES, getSystemCategoryOptions, getCustomCategoryOptions, derivePromptCategory } from './lib/taxonomy.js';

const CONTEXT_VAR_PATTERN = /\{\{(@page_text|@selection|@page_url|@page_title|@date)\}\}/g;
const CONTEXT_VAR_ITEMS = [
  { token: '{{@page_title}}', labelKey: 'contextVarPageTitle', descKey: 'contextVarPageTitleDesc' },
  { token: '{{@page_url}}', labelKey: 'contextVarPageUrl', descKey: 'contextVarPageUrlDesc' },
  { token: '{{@selection}}', labelKey: 'contextVarSelection', descKey: 'contextVarSelectionDesc' },
  { token: '{{@date}}', labelKey: 'contextVarDate', descKey: 'contextVarDateDesc' },
  { token: '{{@page_text}}', labelKey: 'contextVarPageText', descKey: 'contextVarPageTextDesc' }
];
const CATEGORY_FORM_SOURCES = {
  SYSTEM: 'system',
  MINE: 'mine',
  CUSTOM: 'custom',
};

class PopupManager {
  constructor() {
    this.prompts = [];
    this.providers = [];
    this.activeProviderId = null;
    this.currentCategory = 'all';
    this.currentCategoryScope = 'all';
    this.currentModality = 'all';
    this.editingId = null;
    this.activeViewMode = 'smart';
    this.currentPage = 1;
    this.pageSize = 10;
    this.categoryVisibleLimit = 6;
    this.categoryExpanded = {
      all: false,
      [CATEGORY_TYPES.SYSTEM]: false,
      [CATEGORY_TYPES.CUSTOM]: false,
    };
    this.categoryFormState = this.createCategoryFormState();
    this.pendingRevealPromptId = null;
    this.revealPromptTimer = null;
    this.importedPromptsCache = []; // Full list of scanned prompts
    this.filteredImportCache = []; // List after applying score filter
    this.isImportScanRunning = false;
    this.importScanAbortController = null;
    this.githubClient = new GitHubClient();
    this.contentAnalyzer = new ContentAnalyzer();
    this.history = new HistoryPanel();
    this.shareManager = new ShareManager({ getPrompts: () => this.prompts });
    
    // Track current tab for side panel context
    this.currentTab = null;
    this.isSidePanel = false;

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
    await this.loadGithubToken();
    this.renderModalityFilters();
    await this.renderCategories();
    this.renderPrompts();
    this.bindEvents();
    await this.consumePendingPromptReveal();

    // Render Hub user info if logged in
    this.renderHubUserInfo();
    void this.syncHubAuthState();
    
    // Detect if running in side panel and track tab changes
    this.detectSidePanelAndTrackTab();

    // Listen for Hub auth changes (real-time sync)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.hubUser || changes.isLoggedIn)) {
        this.renderHubUserInfo();
      }
    });

    // Real-time usage updates from background (for most-used / recent-used filters)
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type !== 'PROMPT_USAGE_UPDATED' || !msg.prompt?.id) return;
      const idx = this.prompts.findIndex(p => String(p.id) === String(msg.prompt.id));
      if (idx < 0) return;
      this.prompts[idx] = {
        ...this.prompts[idx],
        usageCount: msg.prompt.usageCount || 0,
        lastUsedAt: msg.prompt.lastUsedAt || null,
        lastUsed: msg.prompt.lastUsed || null,
      };
      this.renderPrompts();
    });

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
          this.renderModalityFilters();
          void this.renderCategories();
          this.renderPrompts();
          if (msg.action === 'create' && msg.prompt?.id) {
            this.pendingRevealPromptId = String(msg.prompt.id);
            this.consumePendingPromptReveal();
          }
        } else {
          // Full reload fallback (e.g. force-sync from remote)
          this.loadPrompts().then(() => {
            this.renderModalityFilters();
            void this.renderCategories();
            this.renderPrompts();
            this.consumePendingPromptReveal();
          });
        }
      }
    });
  }

  async syncHubAuthState() {
    try {
      await chrome.runtime.sendMessage({ type: 'CHECK_HUB_LOGIN' });
    } catch (e) {
      console.warn('[Popup] Failed to sync Hub auth state:', e);
    }
  }

  localize() {
    i18n.translatePage();
    this.updateControlStates();
    this.updateGithubTokenPanel();
    this.renderContextVarPopover();
    this.updateCategorySourceButtons();
    this.updateCategoryInputMode();
    this.renderCategoryDropdown();
    this.renderModalityFilters();
    if (this.prompts.length > 0) {
      void this.renderCategories();
    }
  }

  async detectSidePanelAndTrackTab() {
    const url = new URL(window.location.href);
    this.isSidePanel = url.searchParams.get('panel') === 'side' || window.outerWidth > 400;
    
    if (this.isSidePanel) {
      await this.refreshActiveTab();
      chrome.tabs.onActivated.addListener(() => this.refreshActiveTab());
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (this.currentTab?.id === tabId && changeInfo.status === 'complete') {
          this.refreshActiveTab();
        }
      });
    }
  }
  
  async refreshActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      this.renderPlatformStatus();
    } catch (e) {
      console.warn('Failed to refresh active tab:', e);
    }
  }
  
  renderPlatformStatus() {
    const indicator = document.getElementById('platformIndicator');
    if (!indicator) return;
    
    const platform = this.getPlatformFromUrl(this.currentTab?.url);
    if (platform && platform !== 'generic') {
      indicator.textContent = `当前页面: ${this.getPlatformName(platform)}`;
      indicator.className = 'platform-indicator supported';
    } else {
      indicator.textContent = '当前页面: 不支持自动插入';
      indicator.className = 'platform-indicator unsupported';
    }
  }
  
  getPlatformFromUrl(url) {
    if (!url) return null;
    try {
      const h = new URL(url).hostname;
      if (h.includes('chatgpt.com') || h.includes('chat.openai.com')) return 'chatgpt';
      if (h.includes('claude.ai')) return 'claude';
      if (h.includes('gemini.google.com')) return 'gemini';
      if (h.includes('notebooklm.google.com')) return 'notebooklm';
      if (h.includes('aistudio.google.com')) return 'aistudio';
      if (h.includes('grok.com')) return 'grok';
      if (h.includes('chat.deepseek.com')) return 'deepseek';
      if (h.includes('kimi.com') || h.includes('kimi.moonshot.cn')) return 'kimi';
      if (h.includes('chatglm.cn')) return 'zhipu';
      if (h.includes('doubao.com')) return 'doubao';
      if (h.includes('yiyan.baidu.com')) return 'wenxin';
      if (h.includes('tongyi.aliyun.com') || h.includes('qwen.ai')) return 'qwen';
      if (h.includes('hailuoai.com')) return 'minimax';
      if (h.includes('hunyuan.tencent.com')) return 'hunyuan';
      return 'generic';
    } catch {
      return null;
    }
  }
  
  getPlatformName(platform) {
    const names = {
      chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini',
      notebooklm: 'NotebookLM', aistudio: 'AI Studio', grok: 'Grok',
      deepseek: 'DeepSeek', kimi: 'Kimi', zhipu: '智谱清言',
      doubao: '豆包', wenxin: '文心一言', qwen: '通义千问',
      minimax: '海螺AI', hunyuan: '混元'
    };
    return names[platform] || platform;
  }

  // --- Hub User Info (登录显示头像和名字) ---
  async renderHubUserInfo() {
    const container = document.getElementById('hubUserInfo');
    const nameSpan = document.getElementById('hubUserName');
    if (!container || !nameSpan) return;

    try {
      const data = await chrome.storage.local.get(['isLoggedIn', 'hubUser']);
      const { isLoggedIn, hubUser } = data || {};
      const oldImg = container.querySelector('.hub-user-avatar');
      if (oldImg) oldImg.remove();
      const oldInitials = container.querySelector('.hub-user-initials');
      if (oldInitials) oldInitials.remove();

      if (isLoggedIn && hubUser) {
        if (hubUser.avatar) {
          const img = document.createElement('img');
          img.className = 'hub-user-avatar';
          img.alt = 'Avatar';
          img.src = hubUser.avatar;
          img.onerror = () => {
            img.remove();
            const initials = document.createElement('span');
            initials.className = 'hub-user-initials';
            initials.textContent = (hubUser.name || hubUser.email || '?')[0].toUpperCase();
            container.insertBefore(initials, nameSpan);
          };
          container.insertBefore(img, nameSpan);
        } else {
          const initials = document.createElement('span');
          initials.className = 'hub-user-initials';
          initials.textContent = (hubUser.name || hubUser.email || '?')[0].toUpperCase();
          container.insertBefore(initials, nameSpan);
        }
        nameSpan.textContent = hubUser.name || hubUser.email || '';
        container.classList.remove('hidden');
      } else {
        nameSpan.textContent = '';
        container.classList.add('hidden');
      }
    } catch (e) {
      const oldImg = container.querySelector('.hub-user-avatar');
      if (oldImg) oldImg.remove();
      const oldInitials = container.querySelector('.hub-user-initials');
      if (oldInitials) oldInitials.remove();
      nameSpan.textContent = '';
      container.classList.add('hidden');
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

    // [DISABLED] Load OpenClaw settings
    // const ocResp = await chrome.runtime.sendMessage({ type: 'GET_OPENCLAW_SETTINGS' });
    // const ocEndpointInput = document.getElementById('openclawEndpointInput');
    // if (ocEndpointInput && ocResp.endpoint) ocEndpointInput.value = ocResp.endpoint;
    // const ocApiKeyInput = document.getElementById('openclawApiKeyInput');
    // if (ocApiKeyInput && ocResp.apiKey) ocApiKeyInput.value = ocResp.apiKey;

    // Load Sync Settings
    const syncResp = await chrome.runtime.sendMessage({ type: 'GET_SYNC_SETTINGS' });
    const syncSelect = document.getElementById('syncBackendSelect');
    if (syncSelect) syncSelect.value = syncResp.syncBackend || 'none';

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

    this.toggleSyncUI(syncResp.syncBackend);
    
    // Load Image Prompt settings
    const imgResp = await chrome.runtime.sendMessage({ type: 'GET_IMAGE_PROMPT_SETTINGS' });
    const imagePromptEnabled = document.getElementById('imagePromptEnabled');
    if (imagePromptEnabled) imagePromptEnabled.checked = imgResp.enabled || false;
    
    // Render image recognition model selector
    this.renderImageModelSelector(imgResp.imageModelId);
  }

  async loadGithubToken() {
    const ghResp = await chrome.runtime.sendMessage({ type: 'GET_GITHUB_TOKEN' });
    const ghInput = document.getElementById('githubTokenInput');
    if (ghInput) ghInput.value = ghResp.token || '';
    this.updateGithubTokenPanel();
  }

  toggleSyncUI(backend) {
    document.querySelectorAll('.sync-config-panel').forEach(el => el.classList.add('hidden'));
    if (backend === 'webdav') document.getElementById('webdavContainer')?.classList.remove('hidden');
    if (backend === 'obsidian') document.getElementById('obsidianContainer')?.classList.remove('hidden');
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

    // [DISABLED] Save OpenClaw settings
    // const openclawEndpoint = document.getElementById('openclawEndpointInput')?.value?.trim() || '';
    // const openclawApiKey = document.getElementById('openclawApiKeyInput')?.value?.trim() || '';
    // await chrome.runtime.sendMessage({ 
    //   type: 'SAVE_OPENCLAW_SETTINGS', 
    //   endpoint: openclawEndpoint,
    //   apiKey: openclawApiKey
    // });

    // Save Sync Settings
    const syncBackend = document.getElementById('syncBackendSelect')?.value || 'none';
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
      webdavUrl,
      webdavUser,
      webdavPassword,
      obsidianWebdavUrl,
      obsidianWebdavUser,
      obsidianWebdavPassword,
      obsidianFolder
    });
    
    // Save Image Prompt settings
    const imagePromptEnabled = document.getElementById('imagePromptEnabled')?.checked || false;
    const imageModelSelect = document.getElementById('imageRecognitionModelSelect');
    const imageModelId = imageModelSelect?.value || '';
    await chrome.runtime.sendMessage({
      type: 'SAVE_IMAGE_PROMPT_SETTINGS',
      enabled: imagePromptEnabled,
      imageModelId: imageModelId
    });

    this.showToast(i18n.t('settingsSaved'));
  }

  async saveGithubToken() {
    const ghToken = document.getElementById('githubTokenInput')?.value?.trim() || '';
    await chrome.runtime.sendMessage({ type: 'SAVE_GITHUB_TOKEN', token: ghToken });
    this.updateGithubTokenPanel();
  }

  updateGithubTokenPanel() {
    const panel = document.getElementById('githubTokenPanel');
    const statusEl = document.getElementById('githubTokenStatus');
    const input = document.getElementById('githubTokenInput');
    const url = document.getElementById('importUrlInput')?.value?.trim() || '';
    const activeTab = document.querySelector('.import-tab.active')?.dataset.tab;
    const shouldShow = activeTab === 'url' && !!this.githubClient.parseUrl(url);
    const hasToken = !!input?.value?.trim();

    if (panel) {
      panel.classList.toggle('hidden', !shouldShow);
      panel.classList.toggle('has-token', hasToken);
    }

    if (statusEl) {
      statusEl.textContent = i18n.t(hasToken ? 'githubTokenStatusReady' : 'githubTokenStatusEmpty');
    }
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
    
    // Update image model selector visibility and options
    this.renderImageModelSelector();
  }
  
  renderImageModelSelector(selectedId = '') {
    const selector = document.getElementById('imageModelSelector');
    const select = document.getElementById('imageRecognitionModelSelect');
    if (!selector || !select) return;
    
    // Show selector only if providers exist
    if (this.providers.length === 0) {
      selector.classList.add('hidden');
      return;
    }
    
    selector.classList.remove('hidden');
    
    // Generate options
    const options = this.providers.map(p => {
      const isSelected = p.id === selectedId || p.id === this.activeProviderId;
      return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`;
    }).join('');
    
    select.innerHTML = `<option value="">${i18n.t('selectProvider')}</option>` + options;
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

  renderModalityFilters() {
    const container = document.getElementById('modalityFilters');
    if (!container) return;

    const options = [
      { id: 'all', label: i18n.t('modalityAll') },
      { id: 'text', label: i18n.t('modalityText') },
      { id: 'image', label: i18n.t('modalityImage') },
      { id: 'video', label: i18n.t('modalityVideo') },
    ];

    container.innerHTML = options.map((option) => `
      <button class="smart-view-btn filter-chip-btn ${this.currentModality === option.id ? 'active' : ''}" data-modality="${option.id}">
        <span class="chip-text">${this.escapeHtml(option.label)}</span>
      </button>
    `).join('');
  }

  getCategoryFilterToken(prompt) {
    if (!prompt?.category_type || !prompt?.category_key) return '';
    const type = prompt.category_type === CATEGORY_TYPES.PENDING
      ? CATEGORY_TYPES.SYSTEM
      : prompt.category_type;
    return `${type}:${prompt.category_key}`;
  }

  getCategoryScopeFromToken(token = '') {
    if (token.startsWith(`${CATEGORY_TYPES.SYSTEM}:`)) return CATEGORY_TYPES.SYSTEM;
    if (token.startsWith(`${CATEGORY_TYPES.CUSTOM}:`)) return CATEGORY_TYPES.CUSTOM;
    return 'all';
  }

  getCategoryCounts() {
    const counts = new Map();

    this.prompts.forEach((prompt) => {
      const token = this.getCategoryFilterToken(prompt);
      if (!token) return;
      counts.set(token, (counts.get(token) || 0) + 1);
    });

    return counts;
  }

  promptMatchesCategoryScope(prompt, scope = this.currentCategoryScope) {
    if (scope === 'all') return true;
    return this.getCategoryScopeFromToken(this.getCategoryFilterToken(prompt)) === scope;
  }

  getVisibleCategoryOptions(options, activeToken) {
    if (this.categoryExpanded[this.currentCategoryScope] || options.length <= this.categoryVisibleLimit) {
      return options;
    }

    const initial = options.slice(0, this.categoryVisibleLimit);
    if (!activeToken || activeToken === 'all' || initial.some(option => option.token === activeToken)) {
      return initial;
    }

    const activeOption = options.find(option => option.token === activeToken);
    if (!activeOption) return initial;

    return [
      ...options.slice(0, Math.max(this.categoryVisibleLimit - 1, 0)),
      activeOption,
    ];
  }

  async renderCategories() {
    const container = document.getElementById('categories');
    if (!container) return;

    const categoryCounts = this.getCategoryCounts();
    const rawSystemCategories = await getSystemCategoryOptions(i18n.getLanguage());
    const rawCustomCategories = getCustomCategoryOptions(this.prompts);

    const systemCategories = rawSystemCategories
      .map((cat, index) => {
        const token = `${CATEGORY_TYPES.SYSTEM}:${cat.id}`;
        return {
          token,
          type: CATEGORY_TYPES.SYSTEM,
          key: cat.id,
          label: cat.label,
          count: categoryCounts.get(token) || 0,
          order: index,
        };
      })
      .sort((a, b) => (b.count - a.count) || (a.order - b.order));

    const customCategories = rawCustomCategories
      .map((cat, index) => {
        const token = `${CATEGORY_TYPES.CUSTOM}:${cat}`;
        return {
          token,
          type: CATEGORY_TYPES.CUSTOM,
          key: cat,
          label: cat,
          count: categoryCounts.get(token) || 0,
          order: index,
        };
      })
      .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

    const availableTokens = new Set([
      ...systemCategories.map(cat => cat.token),
      ...customCategories.map(cat => cat.token),
    ]);

    if (this.currentCategory !== 'all' && !availableTokens.has(this.currentCategory)) {
      this.currentCategory = 'all';
    }

    const scope = this.currentCategoryScope;
    const scopedCategories = scope === CATEGORY_TYPES.SYSTEM
      ? systemCategories
      : scope === CATEGORY_TYPES.CUSTOM
        ? customCategories
        : [...systemCategories, ...customCategories];

    const visibleCategories = this.getVisibleCategoryOptions(scopedCategories, this.currentCategory);
    const showToggle = scopedCategories.length > this.categoryVisibleLimit;

    const scopeButtons = [
      { id: 'all', label: i18n.t('categoryScopeAll') },
      { id: CATEGORY_TYPES.SYSTEM, label: i18n.t('categoryScopeSystem') },
      { id: CATEGORY_TYPES.CUSTOM, label: i18n.t('categoryScopeCustom') },
    ].map((option) => `
      <button type="button"
              class="smart-view-btn filter-chip-btn category-scope-tag ${this.currentCategoryScope === option.id ? 'active' : ''}"
              data-category-scope="${option.id}"
              aria-pressed="${this.currentCategoryScope === option.id ? 'true' : 'false'}">
        <span class="chip-text">${this.escapeHtml(option.label)}</span>
      </button>
    `).join('');

    const categoryButtons = visibleCategories.map((cat) => `
      <button type="button"
              class="smart-view-btn filter-chip-btn ${this.currentCategory === cat.token ? 'active' : ''}"
              data-category="${this.escapeHtml(cat.token)}"
              data-category-type="${cat.type}"
              data-category-key="${this.escapeHtml(cat.key)}"
              title="${this.escapeHtml(`${cat.label} (${cat.count})`)}">
        <span class="chip-text">${this.escapeHtml(cat.label)}</span>
      </button>
    `).join('');

    container.classList.add('category-sectioned');
    container.innerHTML = `
      <div class="category-filter-group category-scope-row">
        ${scopeButtons}
      </div>
      <div class="category-filter-group category-chip-row">
        ${categoryButtons || `<span class="category-empty-state">${this.escapeHtml(i18n.t('categoryEmptyState'))}</span>`}
        ${showToggle ? `
          <button type="button"
                  class="smart-view-btn filter-chip-btn category-more-tag"
                  data-category-more="${this.categoryExpanded[this.currentCategoryScope] ? 'collapse' : 'expand'}">
            <span class="chip-text">${this.escapeHtml(this.categoryExpanded[this.currentCategoryScope] ? i18n.t('categoryShowLess') : i18n.t('categoryShowMore'))}</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  createCategoryFormState() {
    return {
      source: CATEGORY_FORM_SOURCES.SYSTEM,
      query: '',
      selectedKey: '',
      selectedLabel: '',
      open: false,
      systemOptions: [],
      customOptions: [],
    };
  }

  async loadCategoryFormOptions() {
    const systemOptions = await getSystemCategoryOptions(i18n.getLanguage());
    this.categoryFormState.systemOptions = systemOptions.map((cat) => ({
      source: CATEGORY_FORM_SOURCES.SYSTEM,
      key: cat.id,
      label: cat.label,
    }));
    this.categoryFormState.customOptions = getCustomCategoryOptions(this.prompts).map((cat) => ({
      source: CATEGORY_FORM_SOURCES.MINE,
      key: cat,
      label: cat,
    }));
  }

  getCategoryFormOptions(source = this.categoryFormState.source) {
    if (source === CATEGORY_FORM_SOURCES.SYSTEM) return this.categoryFormState.systemOptions;
    if (source === CATEGORY_FORM_SOURCES.MINE) return this.categoryFormState.customOptions;
    return [];
  }

  getCategoryFormFilterQuery() {
    const query = String(this.categoryFormState.query || '').trim();
    const selectedLabel = String(this.categoryFormState.selectedLabel || '').trim();
    if (this.categoryFormState.selectedKey && query === selectedLabel) return '';
    return query.toLowerCase();
  }

  getFilteredCategoryFormOptions(source = this.categoryFormState.source) {
    const options = this.getCategoryFormOptions(source);
    const query = this.getCategoryFormFilterQuery();
    if (!query) return options;

    return options.filter((option) => {
      const label = String(option.label || '').toLowerCase();
      const key = String(option.key || '').toLowerCase();
      return label.includes(query) || key.includes(query);
    });
  }

  updateCategorySourceButtons() {
    document.querySelectorAll('[data-category-source]').forEach((button) => {
      const isActive = button.dataset.categorySource === this.categoryFormState.source;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  updateCategoryInputMode() {
    const input = document.getElementById('categorySearchInput');
    const toggle = document.getElementById('categoryDropdownToggle');
    if (!input || !toggle) return;

    const isCustomMode = this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM;
    input.placeholder = i18n.t(isCustomMode ? 'customCategoryPlaceholder' : 'categorySearchPlaceholder');
    input.setAttribute('aria-autocomplete', isCustomMode ? 'none' : 'list');
    toggle.disabled = isCustomMode;
    toggle.classList.toggle('hidden', isCustomMode);
  }

  renderCategoryDropdown() {
    const dropdown = document.getElementById('categoryDropdown');
    const toggle = document.getElementById('categoryDropdownToggle');
    if (!dropdown || !toggle) return;

    if (!this.categoryFormState.open || this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM) {
      dropdown.classList.add('hidden');
      toggle.classList.remove('open');
      return;
    }

    const options = this.getFilteredCategoryFormOptions();
    dropdown.innerHTML = options.length
      ? options.map((option) => `
          <button type="button"
                  class="category-option ${this.categoryFormState.selectedKey === option.key ? 'active' : ''}"
                  data-category-option-key="${this.escapeHtml(option.key)}"
                  data-category-option-label="${this.escapeHtml(option.label)}">
            <span class="category-option-label">${this.escapeHtml(option.label)}</span>
            <span class="category-option-kind">${this.escapeHtml(option.source === CATEGORY_FORM_SOURCES.SYSTEM ? i18n.t('systemCategories') : i18n.t('customCategories'))}</span>
          </button>
        `).join('')
      : `<div class="category-dropdown-empty">${this.escapeHtml(i18n.t('categoryEmptyState'))}</div>`;

    dropdown.classList.remove('hidden');
    toggle.classList.add('open');
  }

  openCategoryDropdown() {
    if (this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM) return;
    this.categoryFormState.open = true;
    this.renderCategoryDropdown();
  }

  closeCategoryDropdown() {
    this.categoryFormState.open = false;
    this.renderCategoryDropdown();
  }

  setCategoryFormSource(source, options = {}) {
    const input = document.getElementById('categorySearchInput');
    if (!input) return;

    const query = options.query !== undefined ? String(options.query || '') : '';
    const selectedKey = options.selectedKey !== undefined ? String(options.selectedKey || '') : '';
    const selectedLabel = options.selectedLabel !== undefined ? String(options.selectedLabel || '') : '';

    this.categoryFormState.source = source;
    this.categoryFormState.query = query;
    this.categoryFormState.selectedKey = selectedKey;
    this.categoryFormState.selectedLabel = selectedLabel;

    input.value = query;
    this.updateCategorySourceButtons();
    this.updateCategoryInputMode();
    this.syncCategoryFormState();

    if (options.openDropdown) {
      this.openCategoryDropdown();
    } else {
      this.closeCategoryDropdown();
    }

    if (options.focusInput) {
      input.focus();
      if (source === CATEGORY_FORM_SOURCES.CUSTOM) {
        input.setSelectionRange(input.value.length, input.value.length);
      } else {
        input.select();
      }
    }
  }

  selectCategoryFormOption(optionKey, optionLabel) {
    this.categoryFormState.selectedKey = String(optionKey || '');
    this.categoryFormState.selectedLabel = String(optionLabel || '');
    this.categoryFormState.query = String(optionLabel || '');

    const input = document.getElementById('categorySearchInput');
    if (input) input.value = this.categoryFormState.query;

    this.syncCategoryFormState();
    this.closeCategoryDropdown();
  }

  syncCategoryFormState() {
    const categoryInput = document.getElementById('categoryInput');
    const categoryTypeInput = document.getElementById('categoryTypeInput');
    const categoryKeyInput = document.getElementById('categoryKeyInput');
    const searchInput = document.getElementById('categorySearchInput');
    if (!categoryInput || !categoryTypeInput || !categoryKeyInput || !searchInput) return;

    const inputValue = String(searchInput.value || '').trim();
    const { source, selectedKey, selectedLabel } = this.categoryFormState;

    if (source === CATEGORY_FORM_SOURCES.CUSTOM) {
      categoryTypeInput.value = inputValue ? CATEGORY_TYPES.CUSTOM : '';
      categoryKeyInput.value = inputValue;
      categoryInput.value = inputValue;
      return;
    }

    let resolvedKey = selectedKey;
    let resolvedLabel = String(selectedLabel || '').trim();

    if (!resolvedKey && inputValue) {
      const exactMatch = this.getCategoryFormOptions(source).find((option) => {
        const label = String(option.label || '').trim().toLowerCase();
        const key = String(option.key || '').trim().toLowerCase();
        const target = inputValue.toLowerCase();
        return label === target || key === target;
      });
      if (exactMatch) {
        resolvedKey = exactMatch.key;
        resolvedLabel = exactMatch.label;
        this.categoryFormState.selectedKey = exactMatch.key;
        this.categoryFormState.selectedLabel = exactMatch.label;
      }
    }

    if (resolvedKey && inputValue && inputValue === resolvedLabel) {
      categoryTypeInput.value = source === CATEGORY_FORM_SOURCES.SYSTEM
        ? CATEGORY_TYPES.SYSTEM
        : CATEGORY_TYPES.CUSTOM;
      categoryKeyInput.value = resolvedKey;
      categoryInput.value = inputValue;
      return;
    }

    categoryTypeInput.value = '';
    categoryKeyInput.value = '';
    categoryInput.value = '';
  }

  async setCategoryFormValue(prompt = null) {
    this.categoryFormState = this.createCategoryFormState();
    await this.loadCategoryFormOptions();

    const categoryType = prompt?.category_type === CATEGORY_TYPES.CUSTOM
      ? CATEGORY_TYPES.CUSTOM
      : prompt?.category_type === CATEGORY_TYPES.PENDING
        ? CATEGORY_TYPES.SYSTEM
        : (prompt?.category_type || '');
    const categoryKey = prompt?.category_key || '';
    const displayCategory = prompt ? (await derivePromptCategory(prompt, i18n.getLanguage())) : '';

    if (categoryType === CATEGORY_TYPES.CUSTOM && categoryKey) {
      this.setCategoryFormSource(CATEGORY_FORM_SOURCES.MINE, {
        query: categoryKey,
        selectedKey: categoryKey,
        selectedLabel: categoryKey,
      });
      return;
    }

    if (categoryType === CATEGORY_TYPES.SYSTEM && categoryKey) {
      this.setCategoryFormSource(CATEGORY_FORM_SOURCES.SYSTEM, {
        query: displayCategory,
        selectedKey: categoryKey,
        selectedLabel: displayCategory,
      });
      return;
    }

    this.setCategoryFormSource(CATEGORY_FORM_SOURCES.SYSTEM, {
      query: '',
      selectedKey: '',
      selectedLabel: '',
    });
  }

  getCategoryFormPayload() {
    this.syncCategoryFormState();
    return {
      category: document.getElementById('categoryInput').value.trim(),
      category_type: document.getElementById('categoryTypeInput').value.trim(),
      category_key: document.getElementById('categoryKeyInput').value.trim(),
    };
  }

  async getStoredPendingPromptReveal() {
    try {
      const { pendingPromptReveal } = await chrome.storage.local.get('pendingPromptReveal');
      if (!pendingPromptReveal?.id) return null;

      const timestamp = Number(pendingPromptReveal.timestamp || 0);
      if (timestamp && (Date.now() - timestamp) > 10 * 60 * 1000) {
        await chrome.storage.local.remove('pendingPromptReveal');
        return null;
      }

      return String(pendingPromptReveal.id);
    } catch (e) {
      return null;
    }
  }

  async clearPendingPromptReveal() {
    this.pendingRevealPromptId = null;
    try {
      await chrome.storage.local.remove('pendingPromptReveal');
    } catch (e) {
      // Ignore storage cleanup failures for this ephemeral state.
    }
  }

  async consumePendingPromptReveal() {
    const revealId = this.pendingRevealPromptId || await this.getStoredPendingPromptReveal();
    if (!revealId) return false;

    const prompt = this.prompts.find(p => String(p.id) === String(revealId));
    if (!prompt) return false;

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    this.activeViewMode = 'recentAdded';
    this.currentCategory = 'all';
    this.currentCategoryScope = 'all';
    this.currentModality = 'all';
    this.currentPage = 1;
    this.renderModalityFilters();
    void this.renderCategories();
    this.renderPrompts();

    const selector = `.prompt-item[data-id="${String(revealId).replace(/"/g, '\\"')}"]`;
    const target = document.querySelector(selector);
    if (target) {
      target.classList.add('prompt-item-reveal');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      clearTimeout(this.revealPromptTimer);
      this.revealPromptTimer = setTimeout(() => {
        target.classList.remove('prompt-item-reveal');
      }, 2600);
    }

    await this.clearPendingPromptReveal();
    return true;
  }

  getPromptUsageCount(prompt) {
    return Number(prompt?.usageCount || 0);
  }

  getPromptLastUsedAt(prompt) {
    const usageCount = this.getPromptUsageCount(prompt);
    const legacyLastUsed = usageCount > 0 ? Number(prompt?.lastUsed || 0) : 0;
    return Number(prompt?.lastUsedAt || legacyLastUsed || 0);
  }

  getPromptCreatedAt(prompt) {
    const explicitCreatedAt = Number(prompt?.createdAt || 0);
    if (explicitCreatedAt > 0) return explicitCreatedAt;

    // Backward compatibility for old imported prompts that only wrote `lastUsed`.
    if (!prompt?.lastUsedAt && this.getPromptUsageCount(prompt) === 0 && prompt?.lastUsed) {
      return Number(prompt.lastUsed || 0);
    }

    return Number(prompt?.updatedAt || 0);
  }

  comparePrompts(a, b, sortMode = 'smart') {
    const favoriteDiff = Number(Boolean(b?.favorite)) - Number(Boolean(a?.favorite));
    const lastUsedDiff = this.getPromptLastUsedAt(b) - this.getPromptLastUsedAt(a);
    const usageDiff = this.getPromptUsageCount(b) - this.getPromptUsageCount(a);
    const createdDiff = this.getPromptCreatedAt(b) - this.getPromptCreatedAt(a);

    if (sortMode === 'lastUsedAt') {
      if (lastUsedDiff !== 0) return lastUsedDiff;
      if (favoriteDiff !== 0) return favoriteDiff;
      if (usageDiff !== 0) return usageDiff;
      if (createdDiff !== 0) return createdDiff;
    } else if (sortMode === 'usageCount') {
      if (usageDiff !== 0) return usageDiff;
      if (favoriteDiff !== 0) return favoriteDiff;
      if (lastUsedDiff !== 0) return lastUsedDiff;
      if (createdDiff !== 0) return createdDiff;
    } else if (sortMode === 'createdAt') {
      if (createdDiff !== 0) return createdDiff;
      if (favoriteDiff !== 0) return favoriteDiff;
      if (lastUsedDiff !== 0) return lastUsedDiff;
      if (usageDiff !== 0) return usageDiff;
    } else {
      if (favoriteDiff !== 0) return favoriteDiff;
      if (lastUsedDiff !== 0) return lastUsedDiff;
      if (usageDiff !== 0) return usageDiff;
      if (createdDiff !== 0) return createdDiff;
    }

    const titleA = String(a?.title || '');
    const titleB = String(b?.title || '');
    const titleDiff = titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    if (titleDiff !== 0) return titleDiff;

    return String(a?.id || '').localeCompare(String(b?.id || ''));
  }

  sortPrompts(prompts, sortMode = 'smart') {
    return [...prompts].sort((a, b) => this.comparePrompts(a, b, sortMode));
  }

  getViewConfig(viewMode = this.activeViewMode) {
    const configs = {
      smart: {
        sortMode: 'smart',
        predicate: null
      },
      favorites: {
        sortMode: 'smart',
        predicate: (prompt) => Boolean(prompt.favorite)
      },
      mostUsed: {
        sortMode: 'usageCount',
        predicate: (prompt) => this.getPromptUsageCount(prompt) > 0
      },
      recentUsed: {
        sortMode: 'lastUsedAt',
        predicate: (prompt) => this.getPromptLastUsedAt(prompt) > 0
      },
      recentAdded: {
        sortMode: 'createdAt',
        predicate: (prompt) => !prompt.builtIn && this.getPromptCreatedAt(prompt) > 0
      }
    };

    return configs[viewMode] || configs.smart;
  }

  updateControlStates() {
    document.querySelectorAll('.smart-view-btn[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === this.activeViewMode);
    });
  }

  renderPromptScoreBadge(prompt) {
    const score = PromptScorer.score(prompt?.content);
    return `<span class="prompt-score-badge" style="color:${PromptScorer.getScoreColor(score)}" title="${i18n.t('promptQuality') || 'Prompt Quality'}: ${score}/100">${(score / 10).toFixed(1)}</span>`;
  }

  // --- Prompt List Rendering ---

  renderPrompts() {
    const container = document.getElementById('promptList');
    const searchQuery = (document.getElementById('searchInput').value || '').toLowerCase();
    const viewConfig = this.getViewConfig();

    let filtered = this.prompts;

    if (viewConfig.predicate) {
      filtered = filtered.filter(viewConfig.predicate);
    }

    if (this.currentModality !== 'all') {
      filtered = filtered.filter(p => (p.output_modality || 'text') === this.currentModality);
    }

    if (this.currentCategoryScope !== 'all') {
      filtered = filtered.filter(p => this.promptMatchesCategoryScope(p));
    }

    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(p => this.getCategoryFilterToken(p) === this.currentCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p => {
        const title = String(p.title || '').toLowerCase();
        const content = String(p.content || '').toLowerCase();
        const category = String(p.category || '').toLowerCase();
        const sourceText = String(p.sourceContext?.text || '').toLowerCase();
        return title.includes(searchQuery) ||
          content.includes(searchQuery) ||
          category.includes(searchQuery) ||
          (p.tags && p.tags.some(t => String(t || '').toLowerCase().includes(searchQuery))) ||
          sourceText.includes(searchQuery);
      });
    }

    filtered = this.sortPrompts(filtered, viewConfig.sortMode);
    this.updateControlStates();

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
      <div class="prompt-item ${this.shareManager.isPackMode ? 'selectable' : ''}" data-id="${p.id}">
        <div class="prompt-main">
          <div class="prompt-header">
            <div class="prompt-title-row">
              <div class="prompt-title" title="${this.escapeHtml(p.title)}">${this.escapeHtml(p.title)}</div>
              ${this.renderPromptScoreBadge(p)}
            </div>
            <div class="prompt-actions">
              <button class="action-btn fav-btn ${p.favorite ? 'active' : ''}" title="${i18n.t('favorite')}">
                ${p.favorite ? '⭐' : '☆'}
              </button>
              <button class="action-btn share-btn" title="${i18n.t('share')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
              <!-- [DISABLED] <button class="action-btn p2s-btn" title="${i18n.t('promptToSkill')}">🧩</button> -->
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
              <button class="action-btn translate-list-btn" title="${i18n.t('translate')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
                </svg>
              </button>
              <button class="action-btn delete-btn" title="${i18n.t('deleteConfirm')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="prompt-preview md-content">${highlightVariables(this.renderMarkdown(p.content))}</div>
          <div class="prompt-meta">
            ${p.category ? `<span class="prompt-category ${p.category_type === CATEGORY_TYPES.PENDING ? 'pending' : ''}">${this.escapeHtml(p.category)}</span>` : ''}
            ${p.category_type === CATEGORY_TYPES.PENDING ? `<span class="prompt-category-status">${this.escapeHtml(i18n.t('categoryPending'))}</span>` : ''}
            ${p.tags && p.tags.length > 0 ? p.tags.map(t => `<span class="prompt-tag">${this.escapeHtml(t)}</span>`).join('') : ''}
            ${p.shortcut ? `<span class="prompt-shortcut">/${this.escapeHtml(p.shortcut)}</span>` : ''}
            ${p.variables && p.variables.length > 0 ?
        `<span class="prompt-vars">${p.variables.length} ${i18n.t('variables')}</span>` : ''}
          </div>
${p.sourceContext ? `
          <div class="source-panel">
            <div class="source-toggle" data-source-toggle>
              <span>📋 ${i18n.t('source')}</span>
              <span class="source-arrow">▶</span>
            </div>
            <div class="source-content hidden">
              ${p.sourceContext.pageTitle ? `<div class="source-meta"><strong>${i18n.t('from')}:</strong> ${p.sourceContext.pageUrl ? `<a href="${this.escapeHtml(p.sourceContext.pageUrl)}" target="_blank" title="${this.escapeHtml(p.sourceContext.pageUrl)}">${this.escapeHtml(p.sourceContext.pageTitle)}</a>` : this.escapeHtml(p.sourceContext.pageTitle)}</div>` : ''}
              ${p.sourceContext.capturedAt ? `<div class="source-meta"><strong>${i18n.t('captured')}:</strong> ${formatRelativeTime(p.sourceContext.capturedAt)}</div>` : ''}
              <div class="source-meta"><strong>${i18n.t('method')}:</strong> ${p.sourceContext.convertMethod === 'smart_convert' ? i18n.t('smartConvert') : i18n.t('quickAdd')}</div>
              <div class="source-text">${this.escapeHtml(p.sourceContext.text?.substring(0, 500) || '')}${(p.sourceContext.text?.length || 0) > 500 ? '...' : ''}</div>
              <div class="source-actions">
                <button class="source-action-btn copy-source-btn" title="${i18n.t('copySourceText')}">${i18n.t('copyBtn')}</button>
                ${p.sourceContext.pageUrl ? `<button class="source-action-btn open-source-btn" data-url="${this.escapeHtml(p.sourceContext.pageUrl)}" title="${i18n.t('openSourcePage')}">${i18n.t('openBtn')}</button>` : ''}
              </div>
            </div>
          </div>
` : ''}
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
      await this.loadPrompts();
      await this.renderCategories();
      this.renderPrompts();
      if (!document.getElementById('editModal').classList.contains('hidden')) {
        this.updateShortcutVisibility();
      }
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

    // Modality filter
    document.getElementById('modalityFilters').addEventListener('click', (e) => {
      const tag = e.target.closest('button[data-modality]');
      if (!tag) return;
      this.currentModality = tag.dataset.modality;
      this.currentPage = 1;
      this.renderModalityFilters();
      this.renderPrompts();
    });

    // Category filter
    document.getElementById('categories').addEventListener('click', (e) => {
      const scopeTag = e.target.closest('button[data-category-scope]');
      if (scopeTag) {
        const nextScope = scopeTag.dataset.categoryScope || 'all';
        this.currentCategoryScope = nextScope;
        if (nextScope === 'all') {
          this.currentCategory = 'all';
        } else if (this.currentCategory !== 'all' && this.getCategoryScopeFromToken(this.currentCategory) !== nextScope) {
          this.currentCategory = 'all';
        }
        this.currentPage = 1;
        void this.renderCategories();
        this.renderPrompts();
        return;
      }

      const moreTag = e.target.closest('button[data-category-more]');
      if (moreTag) {
        this.categoryExpanded[this.currentCategoryScope] = moreTag.dataset.categoryMore === 'expand';
        void this.renderCategories();
        return;
      }

      const tag = e.target.closest('button[data-category]');
      if (tag) {
        this.currentCategory = tag.dataset.category;
        this.currentPage = 1;
        void this.renderCategories();
        this.renderPrompts();
      }
    });

    // Category right-click rename
    document.getElementById('categories').addEventListener('contextmenu', async (e) => {
      const tag = e.target.closest('button[data-category]');
      if (!tag || tag.dataset.category === 'all') return;
      if (tag.dataset.categoryType !== CATEGORY_TYPES.CUSTOM) {
        this.showToast(i18n.t('renameSystemCategoryDisabled'));
        return;
      }
      e.preventDefault();
      const oldName = tag.dataset.categoryKey;
      const newName = prompt(i18n.t('renameCategoryPrompt'), oldName);
      if (!newName || newName.trim() === '' || newName.trim() === oldName) return;
      const trimmed = newName.trim();
      this.prompts.forEach(p => {
        if (p.category_type === CATEGORY_TYPES.CUSTOM && p.category_key === oldName) {
          p.category_key = trimmed;
          p.category = trimmed;
        }
      });
      await chrome.runtime.sendMessage({ type: 'BATCH_RENAME_CATEGORY', oldName, newName: trimmed });
      if (this.currentCategory === `${CATEGORY_TYPES.CUSTOM}:${oldName}`) {
        this.currentCategory = `${CATEGORY_TYPES.CUSTOM}:${trimmed}`;
      }
      void this.renderCategories();
      this.renderPrompts();
      this.showToast(i18n.t('renameCategory') + ': ' + trimmed);
    });

    document.querySelector('.category-source-selector')?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-category-source]');
      if (!button) return;

      const source = button.dataset.categorySource;
      if (source === this.categoryFormState.source) {
        if (source === CATEGORY_FORM_SOURCES.CUSTOM) {
          document.getElementById('categorySearchInput')?.focus();
        } else {
          this.openCategoryDropdown();
          document.getElementById('categorySearchInput')?.focus();
        }
        return;
      }

      this.setCategoryFormSource(source, {
        query: '',
        selectedKey: '',
        selectedLabel: '',
        focusInput: true,
        openDropdown: source !== CATEGORY_FORM_SOURCES.CUSTOM,
      });
    });

    document.getElementById('categorySearchInput')?.addEventListener('focus', () => {
      if (this.categoryFormState.source !== CATEGORY_FORM_SOURCES.CUSTOM) {
        this.openCategoryDropdown();
      }
    });

    document.getElementById('categorySearchInput')?.addEventListener('click', () => {
      if (this.categoryFormState.source !== CATEGORY_FORM_SOURCES.CUSTOM) {
        this.openCategoryDropdown();
      }
    });

    document.getElementById('categorySearchInput')?.addEventListener('input', (e) => {
      const value = String(e.target.value || '');
      this.categoryFormState.query = value;

      if (this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM) {
        this.categoryFormState.selectedKey = '';
        this.categoryFormState.selectedLabel = value.trim();
        this.syncCategoryFormState();
        return;
      }

      if (value.trim() !== this.categoryFormState.selectedLabel) {
        this.categoryFormState.selectedKey = '';
        this.categoryFormState.selectedLabel = '';
      }
      this.syncCategoryFormState();
      this.openCategoryDropdown();
    });

    document.getElementById('categorySearchInput')?.addEventListener('keydown', (e) => {
      if (this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM) return;

      if (e.key === 'Escape') {
        this.closeCategoryDropdown();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.openCategoryDropdown();
        return;
      }

      if (e.key === 'Enter') {
        const firstOption = this.getFilteredCategoryFormOptions()[0];
        if (!firstOption) return;
        e.preventDefault();
        this.selectCategoryFormOption(firstOption.key, firstOption.label);
      }
    });

    document.getElementById('categoryDropdownToggle')?.addEventListener('click', () => {
      if (this.categoryFormState.source === CATEGORY_FORM_SOURCES.CUSTOM) return;
      if (this.categoryFormState.open) {
        this.closeCategoryDropdown();
      } else {
        this.openCategoryDropdown();
      }
    });

    document.getElementById('categoryDropdown')?.addEventListener('click', (e) => {
      const option = e.target.closest('button[data-category-option-key]');
      if (!option) return;
      this.selectCategoryFormOption(option.dataset.categoryOptionKey, option.dataset.categoryOptionLabel);
    });

    document.addEventListener('click', (e) => {
      const editor = document.querySelector('.category-editor');
      if (!editor || editor.contains(e.target)) return;
      this.closeCategoryDropdown();
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

      // Source panel: toggle
      const sourceToggle = e.target.closest('[data-source-toggle]');
      if (sourceToggle) {
        const panel = sourceToggle.closest('.source-panel');
        const content = panel.querySelector('.source-content');
        const arrow = panel.querySelector('.source-arrow');
        content.classList.toggle('hidden');
        arrow.textContent = content.classList.contains('hidden') ? '▶' : '▼';
        return;
      }
      // Source panel: copy source text
      if (e.target.closest('.copy-source-btn')) {
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt?.sourceContext?.text) {
          navigator.clipboard.writeText(prompt.sourceContext.text);
          this.showToast(i18n.t('sourceTextCopied'));
        }
        return;
      }
      // Source panel: open source URL
      const openBtn = e.target.closest('.open-source-btn');
      if (openBtn) {
        window.open(openBtn.dataset.url, '_blank');
        return;
      }

      // Selection mode: toggle checkbox instead of normal actions
      if(this.shareManager.isPackMode){
        item.classList.toggle('selected');
        this._updatePackCount();
        return;
      }

      if (e.target.closest('.insert-btn')) this.insertPrompt(id);
      else if (e.target.closest('.fav-btn')) this.toggleFavorite(id);
      else if (e.target.closest('.share-btn')) this.sharePrompt(id);
      // [DISABLED] else if (e.target.closest('.p2s-btn')) this.pushToSkill(id, e.target.closest('.p2s-btn'));
      else if (e.target.closest('.edit-btn')) this.editPrompt(id);
      else if (e.target.closest('.copy-btn')) this.copyPrompt(id);
      else if (e.target.closest('.translate-list-btn')) this.showTranslatePopover(id, e.target.closest('.translate-list-btn'));
      else if (e.target.closest('.delete-btn')) { this.deletePrompt(id); }
    });

    // [DISABLED] Skill mode toggle
    // document.getElementById('skillModeToggle')?.addEventListener('change', (e) => {
    //   document.getElementById('skillFields').classList.toggle('hidden', !e.target.checked);
    // });

    // [DISABLED] Knowledge snippets: add button
    // document.getElementById('addSnippetBtn')?.addEventListener('click', () => {
    //   this._addSnippetRow();
    // });

    // [DISABLED] Knowledge snippets: remove button (delegated)
    // document.getElementById('snippetsList')?.addEventListener('click', (e) => {
    //   if (e.target.closest('.snippet-remove')) {
    //     e.target.closest('.snippet-item')?.remove();
    //   }
    // });

    // Edit modal
    document.getElementById('closeModal').addEventListener('click', () => this.hideEditModal());
    document.getElementById('cancelBtn').addEventListener('click', () => this.hideEditModal());
    document.getElementById('promptForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePrompt();
    });

    // Translate Prompt
    document.getElementById('translateBtn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const targetLang = document.getElementById('translateTargetLang').value;
      const titleInput = document.getElementById('titleInput');
      const tagsInput = document.getElementById('tagsInput');
      const contentInput = document.getElementById('contentInput');
      const categoryPayload = this.getCategoryFormPayload();

      if (!contentInput.value.trim()) {
        this.showToast(i18n.t('contentEmpty') || 'Content is empty', 3000);
        return;
      }

      const originalHtml = btn.innerHTML;
      btn.innerHTML = '⏳...';
      btn.disabled = true;

      try {
        const resp = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_PROMPT',
          targetLanguage: targetLang,
          promptData: {
            title: titleInput.value.trim(),
            category: categoryPayload.category,
            tags: tagsInput?.value.trim() || '',
            content: contentInput.value.trim()
          }
        });

        if (resp && resp.success && resp.data) {
          if (resp.data.title) titleInput.value = resp.data.title;
          if (resp.data.category && categoryPayload.category_type === CATEGORY_TYPES.CUSTOM) {
            this.setCategoryFormSource(CATEGORY_FORM_SOURCES.CUSTOM, {
              query: resp.data.category,
              selectedKey: '',
              selectedLabel: '',
            });
          }
          if (resp.data.tags && tagsInput) {
            tagsInput.value = Array.isArray(resp.data.tags)
              ? resp.data.tags.join(', ')
              : String(resp.data.tags || '');
          }
          if (resp.data.content) {
            contentInput.value = resp.data.content;
            // Update markdown preview if visible
            const mdPreview = document.getElementById('mdPreview');
            if (mdPreview && !mdPreview.classList.contains('hidden')) {
              mdPreview.innerHTML = this.renderMarkdown(contentInput.value);
            }
          }
          this.showToast(i18n.t('translateSuccess'));
        } else {
          this.showToast('❌ ' + (resp?.error || i18n.t('translateFailed')), 4000);
        }
      } catch (err) {
        this.showToast('❌ ' + i18n.t('translateError'), 4000);
      } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
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
    document.getElementById('importUrlInput')?.addEventListener('input', () => this.updateGithubTokenPanel());
    document.getElementById('importUrlInput')?.addEventListener('change', () => this.updateGithubTokenPanel());
    this.debouncedSaveGithubToken = this.debounce(() => this.saveGithubToken(), 600);
    document.getElementById('githubTokenInput')?.addEventListener('input', () => {
      this.updateGithubTokenPanel();
      this.debouncedSaveGithubToken();
    });
    document.getElementById('githubTokenInput')?.addEventListener('change', () => {
      this.updateGithubTokenPanel();
      this.debouncedSaveGithubToken();
    });

    // Score Filter
    document.getElementById('scoreFilter').addEventListener('input', (e) => {
      document.getElementById('scoreValue').textContent = e.target.value;
      this.filterImportedPrompts(parseInt(e.target.value, 10));
    });

    // Markdown preview toggle
    const previewToggle = document.getElementById('previewToggle');
    const contentInput = document.getElementById('contentInput');
    const mdPreview = document.getElementById('mdPreview');
    contentInput?.addEventListener('input', () => this.updateShortcutVisibility());
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

    const contextVarBtn = document.getElementById('contextVarBtn');
    contextVarBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleContextVarPopover();
    });

    document.getElementById('contextVarPopover')?.addEventListener('click', (e) => {
      const item = e.target.closest('.context-var-item');
      if (!item) return;
      this.insertContextVariable(item.dataset.token);
    });

    document.addEventListener('click', (e) => {
      const popover = document.getElementById('contextVarPopover');
      const trigger = document.getElementById('contextVarBtn');
      if (!popover || popover.classList.contains('hidden')) return;
      if (popover.contains(e.target) || trigger?.contains(e.target)) return;
      this.toggleContextVarPopover(false);
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
    
    // Image Prompt toggle change handler - save settings when toggled
    document.getElementById('imagePromptEnabled')?.addEventListener('change', async (e) => {
      await this.saveSettings();
    });
    document.getElementById('imagePromptEnabled')?.addEventListener('change', async (e) => {
      if (e.target.checked) {
        // Check if any provider is available for image recognition
        // FIXME: Temporarily disabled for testing hover button
        // const hasProvider = this.providers.length > 0;
        // if (!hasProvider) {
        //   e.target.checked = false;
        //   this.showToast(i18n.t('imagePromptNoProvider'));
        // }
        // const hasProvider = this.providers.length > 0;
        // if (!hasProvider) {
        //   e.target.checked = false;
        //   this.showToast(i18n.t('imagePromptNoProvider'));
        // }
      }
    });

    // Sync Backend select
    document.getElementById('syncBackendSelect')?.addEventListener('change', (e) => this.toggleSyncUI(e.target.value));

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
          this.renderModalityFilters();
          void this.renderCategories();
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
          this.renderModalityFilters();
          void this.renderCategories();
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

    document.getElementById('smartViews')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.smart-view-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      if (!view || this.activeViewMode === view) return;
      this.activeViewMode = view;
      this.currentPage = 1;
      this.updateControlStates();
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

    // Output Contract Builder
    document.getElementById('enhanceBtn')?.addEventListener('click', () => this.toggleContractBuilder());
    document.getElementById('closeContractBtn')?.addEventListener('click', () => this.toggleContractBuilder(false));
    document.getElementById('insertContractBtn')?.addEventListener('click', () => this.insertOutputContract());

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
    document.getElementById('closeLoginRequiredModal')?.addEventListener('click', () => this.hideLoginRequiredModal());
    document.getElementById('loginRequiredCancelBtn')?.addEventListener('click', () => this.hideLoginRequiredModal());
    document.getElementById('loginRequiredGoBtn')?.addEventListener('click', () => this.continuePendingLoginAction());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSharePanel();
        this.hideLoginRequiredModal();
      }
    });

    // --- Pack Mode ---
    document.getElementById('packBtn')?.addEventListener('click', () => this.enterPackMode());
    document.getElementById('packShareBtn')?.addEventListener('click', () => this.sharePack());
    document.getElementById('packCancelBtn')?.addEventListener('click', () => this.exitPackMode());

    // --- YouTube → Prompt ---
    document.getElementById('youtubePromptBtn')?.addEventListener('click', () => this.showYoutubeModal());
    document.getElementById('closeYoutubeModal')?.addEventListener('click', () => this.hideYoutubeModal());

    // [DISABLED] --- Skill Manager ---
    // document.getElementById('skillManagerBtn')?.addEventListener('click', () => this.showSkillManager());
    // document.getElementById('closeSkillManagerModal')?.addEventListener('click', () => this.hideSkillManager());
    // document.getElementById('skillBackBtn')?.addEventListener('click', () => this.backToSkillList());
    document.getElementById('youtubeGenerateBtn')?.addEventListener('click', () => this.generateYoutubePrompt());
    document.getElementById('youtubeSaveBtn')?.addEventListener('click', () => this.saveYoutubePrompt());
    document.getElementById('youtubeEditSaveBtn')?.addEventListener('click', () => this.editYoutubePrompt());
    // Mode selector toggle
    document.getElementById('youtubeModeSelector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.youtube-mode-btn');
      if (!btn) return;
      document.querySelectorAll('.youtube-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    // Listen for progress updates from two-step video analysis pipeline
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === 'VIDEO_PROMPT_PROGRESS') {
        const statusEl = document.getElementById('youtubeStatus');
        if (statusEl && !statusEl.classList.contains('hidden')) {
          statusEl.textContent = msg.message;
        }
      }
    });
  }



  // --- YouTube → Prompt Modal ---

  showYoutubeModal() {
    document.getElementById('youtubeModal').classList.remove('hidden');
    document.getElementById('youtubeUrlInput').focus();
    // Custom language toggle
    const langSel = document.getElementById('youtubeTargetLang');
    const customInput = document.getElementById('youtubeCustomLang');
    if (langSel && customInput) {
      langSel.onchange = () => {
        customInput.classList.toggle('hidden', langSel.value !== 'custom');
        if (langSel.value === 'custom') customInput.focus();
      };
    }
  }

  hideYoutubeModal() {
    document.getElementById('youtubeModal').classList.add('hidden');
    // Reset state
    document.getElementById('youtubeResult').classList.add('hidden');
    document.getElementById('youtubeStatus').classList.add('hidden');
    document.getElementById('youtubeUrlInput').value = '';
    document.getElementById('youtubeGenerateBtn').disabled = false;
    document.getElementById('youtubeGenerateBtn').textContent = i18n.t('youtubeGenerate');
    // Reset mode selector to default
    document.querySelectorAll('.youtube-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'both'));
    // Reset language selector
    const langSel = document.getElementById('youtubeTargetLang');
    if (langSel) langSel.value = '';
    const customLang = document.getElementById('youtubeCustomLang');
    if (customLang) { customLang.value = ''; customLang.classList.add('hidden'); }
    this._youtubeResult = null;
  }

  async generateYoutubePrompt() {
    const url = document.getElementById('youtubeUrlInput').value.trim();
    if (!url) { this.showToast(i18n.t('youtubeUrlRequired'), 3000); return; }

    const platformLabels = {
      'youtube': '📺 YouTube', 'youtube-shorts': '📱 YouTube Shorts',
      'tiktok': '🎵 TikTok', 'douyin': '🎵 抖音', 'kuaishou': '🔥 快手'
    };
    let detectedPlatform = null;
    try {
      const u = new URL(url);
      const h = u.hostname.replace(/^www\./, '');
      if (h === 'youtube.com' && u.pathname.startsWith('/shorts/')) detectedPlatform = 'youtube-shorts';
      else if ((h === 'youtube.com' && u.searchParams.has('v')) || h === 'youtu.be') detectedPlatform = 'youtube';
      else if (h.includes('tiktok.com')) detectedPlatform = 'tiktok';
      else if (h.includes('douyin.com')) detectedPlatform = 'douyin';
      else if (h.includes('kuaishou.com')) detectedPlatform = 'kuaishou';
    } catch { /* invalid URL, let backend handle error */ }

    if (!detectedPlatform) {
      this.showToast(i18n.t('youtubeUnsupportedUrl'), 4000);
      return;
    }

    const btn = document.getElementById('youtubeGenerateBtn');
    const statusEl = document.getElementById('youtubeStatus');
    const resultEl = document.getElementById('youtubeResult');

    btn.disabled = true;
    btn.textContent = i18n.t('youtubeGenerating');
    const label = platformLabels[detectedPlatform] || detectedPlatform;
    statusEl.textContent = `${label} — ${i18n.t('youtubeFetchingMetadata')}`;
    statusEl.classList.remove('hidden', 'youtube-status-error');
    resultEl.classList.add('hidden');

    try {
      const result = await new Promise((resolve, reject) => {
        const port = chrome.runtime.connect({ name: 'video-prompt' });
        port.onMessage.addListener((msg) => {
          if (msg.type === 'VIDEO_PROMPT_PROGRESS') {
            statusEl.textContent = msg.message;
          } else if (msg.type === 'VIDEO_PROMPT_RESULT') {
            port.disconnect();
            if (msg.success) resolve(msg.result);
            else reject(new Error(msg.error || 'Generation failed'));
          }
        });
        port.onDisconnect.addListener(() => {
          reject(new Error(chrome.runtime.lastError?.message || 'Connection lost'));
        });
        port.postMessage({
          type: 'GENERATE_VIDEO_PROMPT',
          videoUrl: url,
          mode: document.querySelector('.youtube-mode-btn.active')?.dataset.mode || 'both',
          targetLang: (() => {
            const sel = document.getElementById('youtubeTargetLang');
            if (sel?.value === 'custom') return document.getElementById('youtubeCustomLang')?.value.trim() || '';
            return sel?.value || '';
          })(),
        });
      });

      this._youtubeResult = result;
      this._renderYoutubeResult(result);
      statusEl.classList.add('hidden');
      resultEl.classList.remove('hidden');
    } catch (err) {
      statusEl.textContent = '❌ ' + err.message;
      statusEl.classList.add('youtube-status-error');
    } finally {
      btn.disabled = false;
      btn.textContent = i18n.t('youtubeGenerate');
    }
  }

  _renderYoutubeResult(data) {
    // Title + Tags
    document.getElementById('youtubeResultTitle').textContent = data.title || '';
    const tagsEl = document.getElementById('youtubeResultTags');
    tagsEl.innerHTML = (data.tags || []).map(t => `<span class="prompt-tag">${this.escapeHtml(t)}</span>`).join('');

    const storyboardEl = document.getElementById('youtubeStoryboard');
    const resultMode = data._mode || 'both';
    let anchorsHtml = '';

    // Content/Both modes: show character + scene anchors (editable)
    if (resultMode !== 'style' && (data.character_anchor || data.scene_anchor || data.style_consistency)) {
      anchorsHtml = `<div class="youtube-anchors">
        ${data.character_anchor ? `<div class="youtube-anchor-row"><span class="youtube-anchor-icon">👤</span><span class="youtube-anchor-label">${i18n.t('characterAnchor')}</span><span class="youtube-anchor-text" contenteditable="true" data-anchor-key="character_anchor">${this.escapeHtml(data.character_anchor)}</span></div>` : ''}
        ${data.scene_anchor ? `<div class="youtube-anchor-row"><span class="youtube-anchor-icon">🏠</span><span class="youtube-anchor-label">${i18n.t('sceneAnchor')}</span><span class="youtube-anchor-text" contenteditable="true" data-anchor-key="scene_anchor">${this.escapeHtml(data.scene_anchor)}</span></div>` : ''}
        ${data.style_consistency ? `<div class="youtube-anchor-row"><span class="youtube-anchor-icon">🎨</span><span class="youtube-anchor-label">${i18n.t('styleConsistency')}</span><span class="youtube-anchor-text" contenteditable="true" data-anchor-key="style_consistency">${this.escapeHtml(data.style_consistency)}</span></div>` : ''}
      </div>`;
    }

    // Style/Both modes: show style anchor as a prominent block (editable)
    if (resultMode !== 'content' && (data.style_anchor || data.style_consistency)) {
      anchorsHtml += `<div class="youtube-anchors">
        ${data.style_anchor ? `<div class="youtube-anchor-row"><span class="youtube-anchor-icon">🎨</span><span class="youtube-anchor-label">${i18n.t('styleDNA')}</span><span class="youtube-anchor-text" contenteditable="true" data-anchor-key="style_anchor">${this.escapeHtml(data.style_anchor)}</span></div>` : ''}
        ${resultMode === 'style' && data.style_consistency ? `<div class="youtube-anchor-row"><span class="youtube-anchor-icon">🎬</span><span class="youtube-anchor-label">${i18n.t('styleConsistency')}</span><span class="youtube-anchor-text" contenteditable="true" data-anchor-key="style_consistency">${this.escapeHtml(data.style_consistency)}</span></div>` : ''}
      </div>`;
    }

    // Video transcript + summary (from Gemini API or Gemini Web Step 1)
    const transcriptContent = data.video_transcript || '';
    const summaryContent = data.video_summary || data._video_analysis || '';
    let scriptHtml = '';

    // Visual Dictionary — click to highlight in prompts, copy style block
    const vocabEl = document.getElementById('youtubeVisualVocabulary');
    const vocabTagsEl = document.getElementById('youtubeVocabTags');
    if (data.visual_vocabulary && Array.isArray(data.visual_vocabulary) && data.visual_vocabulary.length > 0) {
      const vocabTerms = data.visual_vocabulary;
      vocabTagsEl.innerHTML = vocabTerms.map(v => `<span class="vocab-tag">${this.escapeHtml(v)}</span>`).join('');
      vocabEl.classList.remove('hidden');

      // Store original prompt text for highlight toggling
      this._vocabActiveTag = null;

      vocabTagsEl.querySelectorAll('.vocab-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const term = tag.textContent;
          const wasActive = tag.classList.contains('active');

          // Clear all active states
          vocabTagsEl.querySelectorAll('.vocab-tag').forEach(t => t.classList.remove('active'));

          // Restore all prompt texts (remove highlights, re-apply current variables)
          const currentVars = {};
          document.querySelectorAll('.pg-input').forEach(inp => {
            currentVars[inp.dataset.varKey] = inp.value;
          });
          const applyVars = (text) => {
            Object.entries(currentVars).forEach(([k, v]) => {
              text = text.replaceAll(`{{${k}}}`, v || `{{${k}}}`);
            });
            return text;
          };

          document.querySelectorAll('.youtube-beat-prompt-text').forEach(el => {
            const base = el.dataset.original || el.textContent;
            el.innerHTML = this.escapeHtml(applyVars(base));
          });

          if (wasActive) {
            this._vocabActiveTag = null;
            return;
          }

          // Toggle on — highlight this term in all prompts (after variable substitution)
          tag.classList.add('active');
          this._vocabActiveTag = term;

          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedTerm})`, 'gi');

          document.querySelectorAll('.youtube-beat-prompt-text').forEach(el => {
            const base = el.dataset.original || el.textContent;
            const resolved = applyVars(base);
            if (regex.test(resolved)) {
              el.innerHTML = this.escapeHtml(resolved).replace(regex, '<span class="vocab-highlight">$1</span>');
            }
          });
        });
      });

      // Copy Style Block button
      const copyAllBtn = document.getElementById('youtubeVocabCopyAll');
      if (copyAllBtn) {
        const freshBtn = copyAllBtn.cloneNode(true);
        copyAllBtn.parentNode.replaceChild(freshBtn, copyAllBtn);
        freshBtn.addEventListener('click', () => {
          const styleBlock = vocabTerms.join(', ');
          navigator.clipboard.writeText(styleBlock).then(() => {
            this.showToast(i18n.t('youtubeStyleBlockCopied') + styleBlock.slice(0, 60) + '...');
          });
        });
      }
    } else {
      vocabEl.classList.add('hidden');
    }

    // Variable Playground — only in style mode (user provides their own subject/scene)
    const pgEl = document.getElementById('youtubeVariablePlayground');
    const pgInputsEl = document.getElementById('youtubePlaygroundInputs');
    const playgroundVars = data.variables || {};
    if (resultMode === 'style' && Object.keys(playgroundVars).length > 0) {
      this._currentVariables = playgroundVars;
      pgInputsEl.innerHTML = Object.entries(playgroundVars).map(([key, val]) => `
        <div class="pg-input-row">
          <span class="pg-input-label">{{${this.escapeHtml(key)}}}</span>
          <input type="text" class="pg-input" data-var-key="${this.escapeHtml(key)}" value="${this.escapeHtml(val)}">
        </div>
      `).join('');
      pgEl.classList.remove('hidden');
    } else {
      pgEl.classList.add('hidden');
    }

    if (transcriptContent) {
      scriptHtml += `<details class="youtube-script-panel">
        <summary class="youtube-script-toggle">📋 完整 Transcript <span class="youtube-script-badge">${transcriptContent.length} 字</span></summary>
        <div class="youtube-script-content">${this.escapeHtml(transcriptContent)}</div>
      </details>`;
    }
    if (summaryContent) {
      scriptHtml += `<details class="youtube-script-panel" ${!transcriptContent ? 'open' : ''}>
        <summary class="youtube-script-toggle">📝 视频 Summary <span class="youtube-script-badge">${summaryContent.length} 字</span></summary>
        <div class="youtube-script-content">${this.escapeHtml(summaryContent)}</div>
      </details>`;
    }

    // Shots — programmatically inject {{subject}}/{{scene}} if not already present
    const shots = data.shots || data.storyboard || [];
    const hasVars = data.variables && Object.keys(data.variables).length > 0;
    storyboardEl.innerHTML = anchorsHtml + scriptHtml + shots.map(s => {
      let rawPrompt = s.prompt || s.ai_video_prompt || s.action || '';
      return `
      <div class="youtube-beat">
        <div class="youtube-beat-header">
          <span class="youtube-beat-num">Shot ${s.beat}</span>
          <span class="youtube-beat-ts">${this.escapeHtml(s.time || s.timestamp_hint || '')}</span>
        </div>
        ${s.description ? `<div class="youtube-beat-desc">${this.escapeHtml(s.description)}</div>` : ''}
        <div class="youtube-beat-prompt">
          <div class="youtube-beat-prompt-header">
            <span class="youtube-beat-prompt-label">${i18n.t('videoPrompt')}</span>
            <button class="youtube-copy-btn" title="${i18n.t('copy')}">📋</button>
          </div>
          <div class="youtube-beat-prompt-text" data-original="${this.escapeHtml(rawPrompt)}">${this.escapeHtml(rawPrompt)}</div>
        </div>
      </div>`;
    }).join('');

    // Real-time variable replacement: typing in playground instantly updates all shots
    if (hasVars) {
      const applyVarsToShots = () => {
        const inputs = pgInputsEl.querySelectorAll('.pg-input');
        const vars = {};
        inputs.forEach(inp => { vars[inp.dataset.varKey] = inp.value; });
        storyboardEl.querySelectorAll('.youtube-beat-prompt-text').forEach(el => {
          let text = el.dataset.original || el.textContent;
          Object.entries(vars).forEach(([k, v]) => {
            text = text.replaceAll(`{{${k}}}`, v || `{{${k}}}`);
          });
          el.textContent = text;
        });
      };
      pgInputsEl.addEventListener('input', applyVarsToShots);
      // Apply once immediately with default example values
      applyVarsToShots();
    }

    // Make prompt cards and copy buttons work — assemble complete prompt on copy
    storyboardEl.querySelectorAll('.youtube-beat').forEach(card => {
      const copyBtn = card.querySelector('.youtube-copy-btn');
      const promptText = card.querySelector('.youtube-beat-prompt-text');

      const doCopy = () => {
        const shotText = card.querySelector('.youtube-beat-prompt-text')?.textContent || '';
        // Read current (possibly edited) anchor values by key in semantic order
        const getAnchor = (key) => storyboardEl.querySelector(`[data-anchor-key="${key}"]`)?.textContent?.trim() || '';
        let parts;
        if (resultMode === 'style') {
          // Style mode: style_anchor + action + style_consistency
          parts = [getAnchor('style_anchor'), shotText, getAnchor('style_consistency')].filter(Boolean);
        } else {
          // Content/Both: character + scene + action + style
          parts = [getAnchor('character_anchor'), getAnchor('scene_anchor'), shotText, getAnchor('style_consistency')].filter(Boolean);
        }
        navigator.clipboard.writeText(parts.join('. ')).then(() => this.showToast(i18n.t('promptCopied')));
      };
      if (copyBtn) copyBtn.addEventListener('click', doCopy);
      if (promptText) promptText.addEventListener('click', doCopy);
    });

    // Highlights
    const highlightsEl = document.getElementById('youtubeHighlights');
    const h = data.highlights || {};
    highlightsEl.innerHTML = Object.keys(h).length > 0 ? `
      <div class="youtube-highlights-grid">
        ${h.hook ? `<div class="youtube-highlight-item"><span class="youtube-highlight-label">🪝 Hook</span><span>${this.escapeHtml(h.hook)}</span></div>` : ''}
        ${h.viral_element ? `<div class="youtube-highlight-item"><span class="youtube-highlight-label">🔥 Viral</span><span>${this.escapeHtml(h.viral_element)}</span></div>` : ''}
        ${h.emotional_peak ? `<div class="youtube-highlight-item"><span class="youtube-highlight-label">💥 Peak</span><span>${this.escapeHtml(h.emotional_peak)}</span></div>` : ''}
      </div>
    ` : '';

    // Prompt preview
    document.getElementById('youtubePromptPreview').value = data.prompt || '';
  }

  async saveYoutubePrompt() {
    if (!this._youtubeResult) return;
    const d = this._youtubeResult;

    // Build rich content that preserves ALL analysis knowledge
    const sections = [];

    // 1. Master template (the core reusable prompt)
    if (d.prompt) sections.push(d.prompt);

    // 2. Visual vocabulary as a style block
    if (d.visual_vocabulary && d.visual_vocabulary.length > 0) {
      sections.push(`\n---\n📖 Visual Vocabulary: ${d.visual_vocabulary.join(', ')}`);
    }

    // 3. Style anchors
    if (d.style_anchor) sections.push(`🎨 Style Anchor: ${d.style_anchor}`);
    if (d.style_consistency) sections.push(`🎬 Style Consistency: ${d.style_consistency}`);
    if (d.character_anchor) sections.push(`👤 Character Anchor: ${d.character_anchor}`);
    if (d.scene_anchor) sections.push(`🏠 Scene Anchor: ${d.scene_anchor}`);

    // 4. Individual shot prompts
    const shots = d.shots || d.storyboard || [];
    if (shots.length > 0) {
      sections.push(`\n---\n🎬 Shot Prompts (${shots.length} shots):`);
      shots.forEach(s => {
        const prompt = s.prompt || s.ai_video_prompt || '';
        if (prompt) sections.push(`Shot ${s.beat}: ${prompt}`);
      });
    }

    // Merge visual_vocabulary terms into tags for searchability
    const allTags = [...(d.tags || [])];
    if (d.visual_vocabulary) {
      d.visual_vocabulary.forEach(v => {
        if (!allTags.includes(v)) allTags.push(v);
      });
    }

    const resp = await chrome.runtime.sendMessage({
      type: 'SAVE_PROMPT',
      prompt: {
        title: d.title || i18n.t('youtubeVideoPrompt'),
        content: sections.join('\n'),
        category: d.category || 'Creative',
        category_type: d.category ? CATEGORY_TYPES.CUSTOM : '',
        category_key: d.category || '',
        output_modality: 'video',
        tags: allTags,
        videoData: d, // structured JSON for re-rendering in video modal
      }
    });
    if (resp.success) {
      this.showToast(i18n.t('videoAnalysisSaved'));
      this.hideYoutubeModal();
      await this.loadPrompts();
      this.renderModalityFilters();
      void this.renderCategories();
      this.renderPrompts();
    } else {
      this.showToast(i18n.t('saveFailed'), 3000);
    }
  }

  editYoutubePrompt() {
    if (!this._youtubeResult) return;
    const d = this._youtubeResult;
    this.hideYoutubeModal();
    // Pre-fill edit modal with generated content
    this.showEditModal({
      id: null,
      title: d.title || '',
      content: d.prompt || '',
      category: d.category || 'Creative',
      category_type: d.category ? CATEGORY_TYPES.CUSTOM : '',
      category_key: d.category || '',
      output_modality: 'video',
      tags: d.tags || [],
      shortcut: '',
    });
  }

  // --- Edit Modal ---

  showEditModal(prompt = null) {
    // If this is a saved video prompt, re-open in the interactive video modal
    if (prompt?.videoData) {
      this._youtubeResult = prompt.videoData;
      this._renderYoutubeResult(prompt.videoData);
      document.getElementById('youtubeModal').classList.remove('hidden');
      return;
    }

    const modal = document.getElementById('editModal');
    const title = document.getElementById('modalTitle');

    if (prompt) {
      title.textContent = i18n.t('editPrompt');
      document.getElementById('promptId').value = prompt.id;
      document.getElementById('titleInput').value = prompt.title;
      document.getElementById('tagsInput').value = Array.isArray(prompt.tags) ? prompt.tags.join(', ') : '';
      document.getElementById('shortcutInput').value = prompt.shortcut || '';
      document.getElementById('contentInput').value = prompt.content;
      this.editingId = prompt.id;
      document.getElementById('historyBtn').classList.remove('hidden');

      // [DISABLED] Skill mode fields
      // const isSkill = !!prompt.skillMode;
      // document.getElementById('skillModeToggle').checked = isSkill;
      // document.getElementById('skillFields').classList.toggle('hidden', !isSkill);
      // document.getElementById('systemPromptInput').value = prompt.systemPrompt || '';
      // this._renderSnippets(prompt.knowledgeSnippets || []);
    } else {
      title.textContent = i18n.t('newPrompt');
      document.getElementById('promptForm').reset();
      document.getElementById('promptId').value = '';
      this.editingId = null;
      document.getElementById('historyBtn').classList.add('hidden');

      // [DISABLED] Reset skill mode
      // document.getElementById('skillModeToggle').checked = false;
      // document.getElementById('skillFields').classList.add('hidden');
      // document.getElementById('systemPromptInput').value = '';
      // this._renderSnippets([]);
    }

    void this.setCategoryFormValue(prompt);

    modal.classList.remove('hidden');
    document.getElementById('titleInput').focus();
    // Reset diff panel state on open
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    document.getElementById('contentInput').classList.remove('hidden');
    this._originalContent = null;
    this._optimizedContent = null;
    this.toggleContextVarPopover(false);
    this.updateShortcutVisibility();
  }

  hideEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    this.closeCategoryDropdown();
    document.getElementById('mdPreview').classList.add('hidden');
    document.getElementById('contentInput').classList.remove('hidden');
    document.getElementById('previewToggle').textContent = i18n.t('preview');
    document.getElementById('optimizeDiffPanel').classList.add('hidden');
    this._originalContent = null;
    this._optimizedContent = null;
    this._optimizeProviderId = null;
    this.editingId = null;
    this.toggleContextVarPopover(false);
    this.toggleContractBuilder(false);
    this.resetContractBuilder();
  }

  updateShortcutVisibility() {
    const content = document.getElementById('contentInput')?.value || '';
    const shortcutGroup = document.getElementById('shortcutFormGroup');
    if (shortcutGroup) {
      CONTEXT_VAR_PATTERN.lastIndex = 0;
      shortcutGroup.classList.toggle('hidden', CONTEXT_VAR_PATTERN.test(content));
    }
  }

  renderContextVarPopover() {
    const popover = document.getElementById('contextVarPopover');
    if (!popover) return;

    popover.innerHTML = `
      <div class="context-var-popover-header">
        <div class="context-var-popover-title">${this.escapeHtml(i18n.t('contextVarPanelTitle'))}</div>
        <div class="context-var-popover-hint">${this.escapeHtml(i18n.t('contextVarPanelHint'))}</div>
      </div>
      <div class="context-var-list">
        ${CONTEXT_VAR_ITEMS.map(item => `
          <button type="button" class="context-var-item" data-token="${this.escapeHtml(item.token)}">
            <div class="context-var-item-top">
              <span class="context-var-name">${this.escapeHtml(i18n.t(item.labelKey))}</span>
              <code class="context-var-token">${this.escapeHtml(item.token)}</code>
            </div>
            <div class="context-var-desc">${this.escapeHtml(i18n.t(item.descKey))}</div>
          </button>
        `).join('')}
      </div>
    `;
  }

  toggleContextVarPopover(force) {
    const popover = document.getElementById('contextVarPopover');
    const trigger = document.getElementById('contextVarBtn');
    if (!popover || !trigger) return;

    const shouldShow = typeof force === 'boolean'
      ? force
      : popover.classList.contains('hidden');

    if (shouldShow) {
      const mdPreview = document.getElementById('mdPreview');
      const contentInput = document.getElementById('contentInput');
      if (mdPreview && contentInput && !mdPreview.classList.contains('hidden')) {
        mdPreview.classList.add('hidden');
        contentInput.classList.remove('hidden');
        document.getElementById('previewToggle').textContent = i18n.t('preview');
      }

      const shell = document.querySelector('.content-editor-shell');
      const shellRect = shell?.getBoundingClientRect();
      const triggerRect = trigger.getBoundingClientRect();
      if (shellRect) {
        const top = triggerRect.bottom - shellRect.top + 8;
        const right = Math.max(0, shellRect.right - triggerRect.right);
        popover.style.top = `${top}px`;
        popover.style.right = `${right}px`;
      }
    }

    popover.classList.toggle('hidden', !shouldShow);
    trigger.classList.toggle('active', shouldShow);
    trigger.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
  }

  insertContextVariable(token) {
    const textarea = document.getElementById('contentInput');
    if (!textarea || !token) return;

    textarea.focus();

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.setRangeText(token, start, end, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    this.toggleContextVarPopover(false);
    this.showToast(i18n.t('contextVarInserted'));
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

  // --- Output Contract Builder ---
  toggleContractBuilder(show) {
    const panel = document.getElementById('contractBuilderPanel');
    if (show === undefined) {
      panel.classList.toggle('hidden');
    } else if (show) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }

  resetContractBuilder() {
    document.getElementById('contractFormatSelect').value = '';
    document.getElementById('contractLengthInput').value = '';
    document.getElementById('contractToneSelect').value = '';
    document.getElementById('contractExclusionsInput').value = '';
  }

  insertOutputContract() {
    const format = document.getElementById('contractFormatSelect').value;
    const length = document.getElementById('contractLengthInput').value;
    const tone = document.getElementById('contractToneSelect').value;
    const doNot = document.getElementById('contractExclusionsInput').value;

    // Check if everything is empty
    if (!format && !length && !tone && !doNot) {
      this.showToast(i18n.t('ruleToastEmpty'));
      return;
    }

    const textarea = document.getElementById('contentInput');
    const content = textarea.value;
    const isZh = this._detectLanguage(content) === 'zh';

    // Localized maps: key → { zh, en }
    const FORMAT_MAP = {
      markdown: { zh: '结构化 Markdown，包含标题层级和要点列表', en: 'Structured Markdown with headers and bullet points' },
      json: { zh: '仅输出合法 JSON，不使用 Markdown', en: 'Valid JSON only, no markdown formatting' },
      table: { zh: '对比表格，包含选项、优点、缺点、推荐度', en: 'Comparison table with columns: Option, Pros, Cons, Recommendation' },
      text: { zh: '纯文本，精炼段落', en: 'Plain text, concise paragraphs' },
      code: { zh: '仅代码块，含行内注释', en: 'Code block with inline comments only' }
    };
    const TONE_MAP = {
      professional: { zh: '专业、客观、严谨', en: 'Professional, objective, and academic' },
      concise: { zh: '极其简练、直击要点', en: 'Concise, direct, highly actionable' },
      creative: { zh: '生动有趣、富有感染力', en: 'Creative, engaging, and empathetic' }
    };

    const lang = isZh ? 'zh' : 'en';
    const header = isZh ? '\n\n## 输出要求\n' : '\n\n## Output Rules\n';

    // Dedup check
    if (content.includes('## 输出要求') || content.includes('## Output Rules') || content.includes('## 输出约束') || content.includes('## Constraints')) {
      this.showToast(i18n.t('ruleToastExists'));
      return;
    }

    let lines = [];
    if (format && FORMAT_MAP[format]) {
      lines.push(isZh ? `- **输出格式：** ${FORMAT_MAP[format][lang]}` : `- **Format:** ${FORMAT_MAP[format][lang]}`);
    }
    if (length) {
      lines.push(isZh ? `- **字数限制：** 严格控制在 ${length} 字以内` : `- **Length:** Strictly under ${length} words`);
    }
    if (tone && TONE_MAP[tone]) {
      lines.push(isZh ? `- **语气风格：** ${TONE_MAP[tone][lang]}` : `- **Tone:** ${TONE_MAP[tone][lang]}`);
    }
    if (doNot) {
      lines.push(isZh ? `- **禁止：** ${doNot}` : `- **Do NOT:** ${doNot}`);
    }

    textarea.value = content + header + lines.join('\n');

    this.toggleContractBuilder(false);
    this.resetContractBuilder();

    this.showToast(i18n.t('ruleToastSuccess'));
  }

  _detectLanguage(text) {
    if (!text) return 'en';
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g) || []).length;
    const total = text.replace(/\s/g, '').length;
    return total > 0 && cjk / total > 0.3 ? 'zh' : 'en';
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
    const typeLabels = { 'gemini-web': 'Gemini', 'gemini': 'Gemini API', 'openai': 'OpenAI' };
    menu.innerHTML = cloudProviders.map(p => {
      const isActive = p.id === activeId;
      const modelInfo = p.model || p.type;
      const typeLabel = typeLabels[p.type] || p.type;
      return `<button type="button" class="optimize-provider-option${isActive ? ' active' : ''}" data-provider-id="${p.id}">
        <span class="provider-dot"></span>
        <div class="provider-option-info">
          <span class="provider-option-name">${this.escapeHtml(p.name)}</span>
          <span class="provider-option-meta">${this.escapeHtml(modelInfo)} · ${typeLabel}</span>
        </div>
      </button>`;
    }).join('');

    menu.classList.remove('hidden');

    // Smart position: open up if room above, else down
    const btn = document.getElementById('optimizeProviderBtn');
    const btnRect = btn.getBoundingClientRect();
    const spaceAbove = btnRect.top;
    const spaceBelow = window.innerHeight - btnRect.bottom;
    const menuHeight = Math.min(menu.scrollHeight, 280);

    menu.classList.remove('open-up', 'open-down');
    if (spaceAbove < menuHeight + 8 && spaceBelow > spaceAbove) {
      menu.classList.add('open-down');
    } else {
      menu.classList.add('open-up');
    }

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
    const isEditing = Boolean(this.editingId);
    const categoryPayload = this.getCategoryFormPayload();
    const prompt = {
      title: document.getElementById('titleInput').value.trim(),
      category: categoryPayload.category,
      category_type: categoryPayload.category_type,
      category_key: categoryPayload.category_key,
      tags: String(document.getElementById('tagsInput')?.value || '')
        .split(/[,\n，、]/)
        .map(tag => tag.trim())
        .filter(Boolean),
      shortcut: document.getElementById('shortcutInput').value.trim().replace(/^\//, '').replace(/[^a-zA-Z0-9_-]/g, ''),
      content: document.getElementById('contentInput').value.trim()
    };

    if (!prompt.content) {
      this.showToast(i18n.t('requiredFields'));
      return;
    }

    // [DISABLED] Skill mode fields
    // const isSkill = document.getElementById('skillModeToggle').checked;
    // prompt.skillMode = isSkill;
    // prompt.systemPrompt = isSkill ? document.getElementById('systemPromptInput').value.trim() : '';
    // prompt.knowledgeSnippets = isSkill ? this._collectSnippets() : [];

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
      this.renderModalityFilters();
      void this.renderCategories();
      this.renderPrompts();
      this.hideEditModal();
      if (!isEditing && response.promptId) {
        this.pendingRevealPromptId = String(response.promptId);
      }
      await this.consumePendingPromptReveal();
    } else {
      console.error('Save failed:', response);
      this.showToast('❌ ' + i18n.t('saveError'));
    }
  }

  editPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (prompt) this.showEditModal(prompt);
  }

  // --- Inline Translate (Prompt List) ---
  showTranslatePopover(promptId, btnEl) {
    // Dismiss any existing popover
    document.querySelector('.translate-popover')?.remove();

    const languages = [
      { code: 'English', label: 'English' },
      { code: 'Chinese', label: '中文' },
      { code: 'Japanese', label: '日本語' },
      { code: 'Spanish', label: 'Español' },
      { code: 'French', label: 'Français' },
      { code: 'German', label: 'Deutsch' },
      { code: 'Korean', label: '한국어' },
    ];

    const popover = document.createElement('div');
    popover.className = 'translate-popover';
    popover.innerHTML = languages.map(l =>
      `<button class="translate-lang-option" data-lang="${l.code}">${l.label}</button>`
    ).join('');

    // Position relative to button
    const rect = btnEl.getBoundingClientRect();
    const listRect = document.getElementById('promptList').getBoundingClientRect();
    popover.style.top = `${rect.bottom - listRect.top + 4}px`;
    popover.style.left = `${rect.left - listRect.left}px`;

    // Attach to promptList (relative positioned parent)
    document.getElementById('promptList').style.position = 'relative';
    document.getElementById('promptList').appendChild(popover);

    // Handle language selection
    popover.addEventListener('click', (e) => {
      const opt = e.target.closest('.translate-lang-option');
      if (!opt) return;
      popover.remove();
      this.translatePromptInline(promptId, opt.dataset.lang);
    });

    // Dismiss on outside click (next tick to avoid immediate dismiss)
    requestAnimationFrame(() => {
      const dismiss = (e) => {
        if (!popover.contains(e.target) && !btnEl.contains(e.target)) {
          popover.remove();
          document.removeEventListener('click', dismiss, true);
        }
      };
      document.addEventListener('click', dismiss, true);
    });
  }

  async translatePromptInline(promptId, targetLanguage) {
    const prompt = this.prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // Visual feedback: find the button and show spinner
    const card = document.querySelector(`.prompt-item[data-id="${promptId}"]`);
    const btn = card?.querySelector('.translate-list-btn');
    const originalHtml = btn?.innerHTML;
    if (btn) { btn.innerHTML = '⏳'; btn.disabled = true; }

    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_PROMPT',
        targetLanguage,
        promptData: {
          title: prompt.title,
          category: prompt.category || '',
          tags: (prompt.tags || []).join(', '),
          content: prompt.content,
        }
      });

      if (!resp?.success || !resp?.data) {
        throw new Error(resp?.error || i18n.t('translateFailed'));
      }

      // Update in-memory prompt
      const d = resp.data;
      if (d.title) prompt.title = d.title;
      if (d.category && prompt.category_type === CATEGORY_TYPES.CUSTOM) {
        prompt.category_key = d.category;
        prompt.category = d.category;
      }
      if (d.content) prompt.content = d.content;
      if (d.tags) {
        prompt.tags = Array.isArray(d.tags) ? d.tags : d.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      // Persist via UPDATE_PROMPT
      await chrome.runtime.sendMessage({
        type: 'UPDATE_PROMPT',
        prompt: {
          id: prompt.id,
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
          category_type: prompt.category_type,
          category_key: prompt.category_key,
          tags: prompt.tags,
          shortcut: prompt.shortcut || '',
        }
      });

      this.renderPrompts();
      this.showToast(`✅ Translated to ${targetLanguage}`);
    } catch (err) {
      console.error('[TranslateInline]', err);
      this.showToast(`❌ ${err.message || 'Translation error'}`, 4000);
    } finally {
      if (btn) { btn.innerHTML = originalHtml; btn.disabled = false; }
    }
  }

  async pushToSkill(id, btn) {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="p2s-spinner"></span>';
    btn.disabled = true;

    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'GENERATE_SKILL',
        promptData: {
          id: prompt.id,
          title: prompt.title,
          category: prompt.category,
          content: prompt.content
        }
      });
      if (resp.success) {
        this.showToast('✅ Skill generated & saved: ' + (resp.skill?.skill_name || ''));
      } else {
        this.showToast('❌ ' + (resp.error || 'Generation failed'), 4000);
      }
    } catch (e) {
      this.showToast('❌ Communication error', 4000);
    } finally {
      btn.innerHTML = originalHtml;
      btn.disabled = false;
    }
  }

  // --- Skill Manager Panel ---

  async showSkillManager() {
    const modal = document.getElementById('skillManagerModal');
    modal.classList.remove('hidden');
    await this.renderSkillList();
  }

  hideSkillManager() {
    document.getElementById('skillManagerModal').classList.add('hidden');
    // Hide detail view if open
    document.getElementById('skillDetailView')?.classList.add('hidden');
    document.getElementById('skillListView')?.classList.remove('hidden');
  }

  async renderSkillList() {
    const listEl = document.getElementById('skillListContent');
    const emptyEl = document.getElementById('skillEmptyState');
    const resp = await chrome.runtime.sendMessage({ type: 'GET_SKILLS' });
    const skills = resp.skills || [];

    if (skills.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    listEl.innerHTML = skills.map(s => {
      const date = new Date(s.createdAt).toLocaleString();
      const pushBadge = s.pushed
        ? '<span class="skill-badge skill-badge-pushed">✅ Pushed</span>'
        : '<span class="skill-badge skill-badge-local">💾 Local</span>';
      return `
      <div class="skill-card" data-skill-id="${s.id}">
        <div class="skill-card-header">
          <span class="skill-card-name">🧩 ${this.escapeHtml(s.skill_name)}</span>
          ${pushBadge}
        </div>
        <div class="skill-card-desc">${this.escapeHtml(s.description || 'No description')}</div>
        <div class="skill-card-meta">
          <span>📄 ${this.escapeHtml(s.source_prompt_title || 'Unknown Prompt')}</span>
          <span>🕐 ${date}</span>
        </div>
        <div class="skill-card-actions">
          <button class="btn btn-secondary btn-small skill-view-btn">📖 View</button>
          <button class="btn btn-primary btn-small skill-push-btn" ${s.pushed ? 'disabled' : ''}>🚀 Push</button>
          <button class="btn btn-small skill-delete-btn">🗑️</button>
        </div>
      </div>`;
    }).join('');

    // Event delegation
    listEl.onclick = async (e) => {
      const card = e.target.closest('.skill-card');
      if (!card) return;
      const skillId = card.dataset.skillId;

      if (e.target.closest('.skill-view-btn')) {
        this.viewSkillDetail(skillId, skills);
      } else if (e.target.closest('.skill-push-btn')) {
        await this.pushSkillFromManager(skillId, e.target.closest('.skill-push-btn'));
      } else if (e.target.closest('.skill-delete-btn')) {
        await this.deleteSkill(skillId);
      }
    };
  }

  viewSkillDetail(skillId, skills) {
    const skill = (skills || []).find(s => s.id === skillId);
    if (!skill) return;

    document.getElementById('skillListView').classList.add('hidden');
    const detailView = document.getElementById('skillDetailView');
    detailView.classList.remove('hidden');

    document.getElementById('skillDetailTitle').textContent = skill.skill_name;
    const contentEl = document.getElementById('skillDetailContent');
    const md = skill.files?.['SKILL.md'] || 'No SKILL.md content';
    // Render as markdown if marked.js available, otherwise plain text
    if (typeof marked !== 'undefined') {
      contentEl.innerHTML = marked.parse(md);
    } else {
      contentEl.textContent = md;
    }
  }

  backToSkillList() {
    document.getElementById('skillDetailView').classList.add('hidden');
    document.getElementById('skillListView').classList.remove('hidden');
  }

  async pushSkillFromManager(skillId, btn) {
    const origText = btn.textContent;
    btn.textContent = '⏳...';
    btn.disabled = true;
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'PUSH_SKILL', skillId });
      if (resp.success) {
        this.showToast('✅ Pushed to OpenClaw');
        await this.renderSkillList(); // refresh to show pushed badge
      } else {
        this.showToast('❌ ' + (resp.error || 'Push failed'), 4000);
        btn.disabled = false;
      }
    } catch (e) {
      this.showToast('❌ Network error', 4000);
      btn.disabled = false;
    } finally {
      btn.textContent = origText;
    }
  }

  async deleteSkill(skillId) {
    if (!confirm(i18n.t('deleteSkillConfirm'))) return;
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'DELETE_SKILL', skillId });
      if (resp.success) {
        this.showToast(i18n.t('skillDeleted'));
        await this.renderSkillList();
      }
    } catch (e) {
      this.showToast(i18n.t('deleteFailed'), 3000);
    }
  }

  async deletePrompt(id) {
    if (!confirm(i18n.t('deleteConfirm'))) return;

    // Optimistic: remove from memory and re-render immediately
    const removed = this.prompts.find(p => p.id === id);
    this.prompts = this.prompts.filter(p => p.id !== id);
    this.renderModalityFilters();
    void this.renderCategories();
    this.renderPrompts();

    // Background: persist the deletion
    try {
      const response = await chrome.runtime.sendMessage({ type: 'DELETE_PROMPT', id });
      if (!response?.success) throw new Error('Delete failed');
    } catch (e) {
      console.error('Delete error:', e);
      // Rollback
      if (removed) this.prompts.push(removed);
      this.renderModalityFilters();
      void this.renderCategories();
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

  // --- Share (delegated to ShareManager) ---
  async sharePrompt(id) { await this.shareManager.sharePrompt(id); }
  showSharePanel(url, title) { this.shareManager.showSharePanel(url, title); }
  hideSharePanel() { this.shareManager.hideSharePanel(); }
  async hideLoginRequiredModal() { await this.shareManager.hideLoginRequiredModal(); }
  async continuePendingLoginAction() { await this.shareManager.continuePendingLoginAction(); }
  async _handleShareOption(platform) { await this.shareManager.handleShareOption(platform); }
  enterPackMode() { this.shareManager.enterPackMode(); }
  exitPackMode() { this.shareManager.exitPackMode(); }
  _updatePackCount() { this.shareManager._updatePackCount(); }
  async sharePack() { await this.shareManager.sharePack(); }

  // --- Insert with Variable Fill ---

  // Resolve {{@clipboard}} in popup context (clipboard API unavailable in background)
  async _resolveClipboard(content) {
    if (!content.includes('{{@clipboard}}')) return content;
    try {
      const clipText = await navigator.clipboard.readText();
      return content.split('{{@clipboard}}').join(clipText || '');
    } catch (e) {
      console.warn('[ContextVar] Clipboard access denied:', e);
      return content.split('{{@clipboard}}').join('');
    }
  }

  // [DISABLED] --- Skill Mode: Snippet Helpers ---
  // _renderSnippets(snippets) {
  //   const list = document.getElementById('snippetsList');
  //   list.innerHTML = '';
  //   if (snippets.length === 0) return;
  //   snippets.forEach(s => this._addSnippetRow(s.title, s.content));
  // }

  // _addSnippetRow(title = '', content = '') {
  //   const list = document.getElementById('snippetsList');
  //   const item = document.createElement('div');
  //   item.className = 'snippet-item';
  //   item.innerHTML = `
  //     <input type="text" class="snippet-title" placeholder="Title" value="${this.escapeHtml(title)}">
  //     <textarea class="snippet-content" rows="2" placeholder="Reference content...">${this.escapeHtml(content)}</textarea>
  //     <button type="button" class="snippet-remove" title="Remove">✕</button>
  //   `;
  //   list.appendChild(item);
  // }

  // _collectSnippets() {
  //   const items = document.querySelectorAll('#snippetsList .snippet-item');
  //   const snippets = [];
  //   items.forEach(item => {
  //     const title = item.querySelector('.snippet-title')?.value.trim();
  //     const content = item.querySelector('.snippet-content')?.value.trim();
  //     if (title || content) {
  //       snippets.push({ title: title || 'Untitled', content: content || '' });
  //     }
  //   });
  //   return snippets;
  // }

  async markPromptUsed(id, prompt) {
    await chrome.runtime.sendMessage({ type: 'TRACK_USAGE', id });
    if (prompt) {
      prompt.usageCount = (prompt.usageCount || 0) + 1;
      const now = Date.now();
      prompt.lastUsedAt = now;
      prompt.lastUsed = now;
    }
  }

  async insertPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    let tab = this.currentTab;
    if (!tab) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs[0];
    }

    if (!tab?.id) {
      this.showToast(i18n.t('insertError'));
      return;
    }

    const platform = this.getPlatformFromUrl(tab.url);
    if (!platform || platform === 'generic') {
      const isSidePanel = this.isSidePanel || window.outerWidth > 400;
      if (isSidePanel) {
        this.showToast('当前页面不支持自动插入，请先切换到AI平台页面');
      } else {
        this.showToast(i18n.t('insertError'));
      }
      return;
    }

    // COMPOSE PROMPT (context vars resolved by background, except clipboard)
    const resp = await chrome.runtime.sendMessage({ type: 'COMPOSE_PROMPT', prompt });
    let composedContent = prompt.content;
    let composedVars = prompt.variables || [];
    if (resp && resp.success) {
      composedContent = await this._resolveClipboard(resp.composed);
      composedVars = resp.variables || [];
      // Notify user about auto-resolved context vars
      if (resp.contextResolved && Object.keys(resp.contextResolved).length > 0) {
        this.showToast(i18n.t('contextVarsResolved') || '✨ Context auto-filled');
      }
    }

    // [DISABLED] Skill mode: prepend system prompt + knowledge snippets
    // if (prompt.skillMode) {
    //   const parts = [];
    //   if (prompt.systemPrompt) parts.push(prompt.systemPrompt);
    //   if (prompt.knowledgeSnippets?.length > 0) {
    //     const snippetText = prompt.knowledgeSnippets
    //       .map(s => `## ${s.title}\n${s.content}`)
    //       .join('\n\n');
    //     parts.push('---\n\n# Reference Knowledge\n\n' + snippetText);
    //   }
    //   if (parts.length > 0) {
    //     composedContent = parts.join('\n\n') + '\n\n---\n\n' + composedContent;
    //   }
    // }

    const composedPrompt = { ...prompt, content: composedContent, variables: composedVars };

    const performInsert = async (content) => {
      try {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'INSERT_PROMPT',
          content: content
        });
        await this.markPromptUsed(id, prompt);
        if (!this.isSidePanel) {
          window.close();
        }
      } catch (error) {
        if (this.isSidePanel && !this.getPlatformFromUrl(tab.url)) {
          this.showToast('页面已切换，请切换到AI平台页面后重试');
        } else {
          this.showToast(i18n.t('insertError'));
        }
      }
    };

    // Check for remaining user variables
    if (composedVars && composedVars.length > 0) {
      this.showVariableFillModal(composedPrompt, performInsert, i18n.t('insert'));
    } else {
      await performInsert(composedContent);
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

    // Variables are now structured objects: { name, type, options, default, raw }
    const variables = prompt.variables || [];

    // Render variable inputs based on type
    const container = varModal.querySelector('#varFormContainer');
    container.innerHTML = variables.map(v => {
      const escapedName = this.escapeHtml(v.name);
      const escapedRaw = this.escapeHtml(v.raw || v.name);

      if (v.type === 'enum' && v.options) {
        // Dropdown select for enum variables
        const optionsHtml = v.options.map(opt =>
          `<option value="${this.escapeHtml(opt)}">${this.escapeHtml(opt)}</option>`
        ).join('');
        return `
        <div class="form-group">
          <label for="var-${escapedRaw}">${escapedName}</label>
          <select id="var-${escapedRaw}" data-var="${escapedRaw}" class="var-select">
            ${optionsHtml}
          </select>
        </div>`;
      }

      // Text input (with optional default value)
      const defaultVal = v.type === 'default' && v.default ? this.escapeHtml(v.default) : '';
      return `
      <div class="form-group">
        <label for="var-${escapedRaw}">${escapedName}</label>
        <input type="text" id="var-${escapedRaw}" data-var="${escapedRaw}" 
               value="${defaultVal}" placeholder="${defaultVal || `[${escapedName}]`}">
      </div>`;
    }).join('');

    varModal.classList.remove('hidden');

    // Focus first input/select
    const firstInput = container.querySelector('input, select');
    if (firstInput) firstInput.focus();

    // Bind events
    const closeBtn = varModal.querySelector('#closeVarModal');
    const cancelBtn = varModal.querySelector('#cancelVarBtn');
    const insertBtn = varModal.querySelector('#insertVarBtn');

    insertBtn.textContent = actionBtnText;

    const hideVarModal = () => varModal.classList.add('hidden');

    closeBtn.onclick = hideVarModal;
    cancelBtn.onclick = hideVarModal;
    insertBtn.onclick = async () => {
      // Collect values and substitute
      let content = prompt.content;
      container.querySelectorAll('[data-var]').forEach(el => {
        const rawSpec = el.dataset.var;
        const val = el.value;
        // Replace {{rawSpec}} with selected/entered value
        content = content.split(`{{${rawSpec}}}`).join(val || '');
        // Also try bracket syntax for plain vars
        if (!rawSpec.includes(':')) {
          content = content.split(`[${rawSpec}]`).join(val || '');
        }
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
      composedContent = await this._resolveClipboard(resp.composed);
      composedVars = resp.variables || [];
      if (resp.contextResolved && Object.keys(resp.contextResolved).length > 0) {
        this.showToast(i18n.t('contextVarsResolved') || '✨ Context auto-filled');
      }
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
      const sorted = [...response.data].sort((a, b) => {
        const catA = (a.category || '').toLowerCase();
        const catB = (b.category || '').toLowerCase();
        if (!catA && catB) return 1;
        if (catA && !catB) return -1;
        if (catA !== catB) return catA.localeCompare(catB);
        return (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      });
      const data = JSON.stringify(sorted, null, 2);
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
    document.getElementById('importUrlInput').value = '';
    document.getElementById('urlPreview').classList.add('hidden');
    document.getElementById('previewCount').innerText = '0';
    document.getElementById('previewAvgScore').innerText = '-';
    document.getElementById('previewCategoryStats').classList.add('hidden');
    document.getElementById('previewCategoryStats').innerHTML = '';
    document.getElementById('previewList').innerHTML = '';
    this.importedPromptsCache = [];
    this.filteredImportCache = [];
    this.switchImportTab('paste');
    this.updateGithubTokenPanel();
  }

  hideImportModal() {
    this.cancelImportScan({ silent: true });
    document.getElementById('importModal').classList.add('hidden');
  }

  switchImportTab(tabName) {
    document.querySelectorAll('.import-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.getElementById('importPasteArea').classList.toggle('hidden', tabName !== 'paste');
    document.getElementById('importUrlArea').classList.toggle('hidden', tabName !== 'url');
    this.updateGithubTokenPanel();
  }

  cancelImportScan({ silent = false } = {}) {
    if (!this.isImportScanRunning || !this.importScanAbortController) return false;
    this.importScanAbortController.abort();
    if (!silent) {
      const statusEl = document.getElementById('scanStatus');
      if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.textContent = 'Stopping scan...';
      }
    }
    return true;
  }

  async fetchUrlPrompts() {
    const url = document.getElementById('importUrlInput').value.trim();
    if (!url) return;

    const btn = document.getElementById('scanBtn');
    const statusEl = document.getElementById('scanStatus');
    const deepScan = document.getElementById('deepScan').checked;
    const progressDiv = document.getElementById('aiProgress');

    if (this.isImportScanRunning) {
      this.cancelImportScan();
      return;
    }

    const originalText = btn.innerText;
    const abortController = new AbortController();
    this.isImportScanRunning = true;
    this.importScanAbortController = abortController;
    btn.innerText = 'Stop';
    btn.disabled = false;
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

      if (ghInfo) {
        files = await this.githubClient.scanRecursively(url, (msg) => {
          statusEl.textContent = msg;
        }, deepScan, abortController.signal);
      } else {
        statusEl.textContent = 'Fetching single URL...';
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        files = [{ path: 'url', content: text, url: url }];
      }
      if (abortController.signal.aborted) throw new DOMException('Scan cancelled', 'AbortError');
      if (files.length === 0) throw new Error('No supported files found.');

      // Phase 1: Parse files into prompts
      statusEl.textContent = i18n.t('scanParsing', { count: files.length });
      const rawPrompts = [];

      for (const file of files) {
        if (abortController.signal.aborted) throw new DOMException('Scan cancelled', 'AbortError');
        const parsed = ghInfo
          ? PromptParser.parseUrlImportContent(file.content, file.path)
          : PromptParser.parse(file.content, file.path);
        parsed.forEach((p) => {
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

      // Phase 3: AI Analysis — only on filtered subset (cap at 100)
      const toAnalyze = filtered.slice(0, 100);

      if (toAnalyze.length > 0) {
        progressDiv.classList.remove('hidden');

        const aiResults = await this.contentAnalyzer.analyzeBatch(toAnalyze, () => { }, abortController.signal);
        if (abortController.signal.aborted) throw new DOMException('Scan cancelled', 'AbortError');
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
      if (error.name === 'AbortError') {
        statusEl.textContent = 'Scan cancelled.';
      } else {
        console.error('[Prompt Ark] Scan error:', error);
        this.showToast('❌ ' + i18n.t('scanFailed') + ': ' + error.message);
        statusEl.textContent = 'Error: ' + error.message;
      }
    } finally {
      progressDiv.classList.add('hidden');
      this.isImportScanRunning = false;
      this.importScanAbortController = null;
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }

  filterImportedPrompts(minScore) {
    if (!this.importedPromptsCache.length) return;

    this.filteredImportCache = this.importedPromptsCache
      .filter(p => p.score >= minScore)
      .sort((a, b) => b.score - a.score);

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

    const avgScore = this.filteredImportCache.length > 0
      ? Math.round(this.filteredImportCache.reduce((sum, p) => sum + p.score, 0) / this.filteredImportCache.length)
      : 0;
    document.getElementById('previewAvgScore').innerText = avgScore;

    const categoryStats = document.getElementById('previewCategoryStats');
    const categoryCount = {};
    this.filteredImportCache.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sortedCategories.length > 0) {
      categoryStats.innerHTML = sortedCategories.map(([cat, count]) =>
        `<span class="category-stat"><span class="category-name">${this.escapeHtml(cat)}</span><span class="category-count">${count}</span></span>`
      ).join('');
      categoryStats.classList.remove('hidden');
    } else {
      categoryStats.classList.add('hidden');
    }

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
        promptsToImport = PromptParser.parseImportContent(dataStr);
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
      category: p.category || '',
      category_type: p.category_type || '',
      category_key: p.category_key || '',
      output_modality: p.output_modality || '',
      classification_confidence: p.classification_confidence,
      tags: p.tags || [],
      titleAutoGenerated: activeTab === 'paste'
        ? (!p.category && (!p.tags || p.tags.length === 0))
        : (!p.tags || p.tags.length === 0),
      shortcut: p.shortcut || '',
      favorite: p.favorite || false,
      variables: p.variables || [],
      usageCount: 0,
      lastUsedAt: null,
      lastUsed: null,
      pinned: false,
      keywords: [String(p.act || '').toLowerCase()],
      createdAt: Date.now()
    }));

    try {
      const response = await chrome.runtime.sendMessage({ type: 'IMPORT_PROMPTS', prompts: newPrompts });

      if (response.success) {
        await this.loadPrompts();
        if (response.firstPromptId) {
          this.pendingRevealPromptId = String(response.firstPromptId);
        }
        this.renderModalityFilters();
        void this.renderCategories();
        this.renderPrompts();
        await this.consumePendingPromptReveal();
        this.hideImportModal();
        this.showToast(i18n.t('importSuccess', { count: newPrompts.length }));

        // Cleanup
        this.importedPromptsCache = [];
        document.getElementById('importData').value = '';
        document.getElementById('importUrlInput').value = '';
        document.getElementById('urlPreview').classList.add('hidden');
        this.updateGithubTokenPanel();
      } else {
        this.showToast('❌ ' + i18n.t('importError') + ': ' + (response.error || ''));
      }
    } catch (error) {
      this.showToast('❌ ' + i18n.t('importError') + ': ' + error.message);
    }
  }

  // --- History Management (delegated to HistoryPanel) ---

  async showHistory() {
    await this.history.show(this.editingId);
  }

  hideHistory() {
    this.history.hide();
  }

  renderHistoryList() {
    this.history._renderList();
  }

  previewVersion(versionId) {
    this.history.previewVersion(versionId);
  }

  async restoreVersion() {
    await this.history.restoreVersion();
  }



  formatRelativeTime(timestamp) {
    return formatRelativeTime(timestamp);
  }


  // --- Utilities ---

  showToast(message) {
    showToast(message);
  }

  escapeHtml(text) {
    return escapeHtml(text);
  }

  debounce(func, wait) {
    return debounce(func, wait);
  }

  renderMarkdown(text) {
    return renderMarkdown(text);
  }
}

new PopupManager();
