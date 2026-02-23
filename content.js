// content.js - Prompt Ark Content Script
// Unified deep traversal strategy for all platforms

class AIPromptManager {
  constructor() {
    this.platform = this.detectPlatform();
    this.pickerVisible = false;
    this.prompts = [];
    this.injectedMarker = 'data-apm-injected';
    this.onSelectCallback = null;

    // Slash command state
    this.slashDropdown = null;
    this.slashShortcuts = [];
    this.slashActiveIndex = -1;
    this.slashBound = false;

    this.init();
  }

  // Guard: check if extension context is still valid
  isContextValid() {
    try {
      return !!chrome.runtime?.id;
    } catch (e) {
      return false;
    }
  }

  detectPlatform() {
    const h = window.location.hostname;
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
  }

  // --- Input Detection ---

  findInputSimple() {
    const configs = {
      chatgpt: ['#prompt-textarea', 'div[contenteditable="true"].ProseMirror'],
      claude: ['div[contenteditable="true"].ProseMirror', 'div[enterkeyhint="enter"][contenteditable="true"]'],
      gemini: ['rich-textarea div[contenteditable="true"]', 'div[role="textbox"]', '.ql-editor'],
      notebooklm: ['textarea[placeholder]', 'textarea.mat-input-element'],
      aistudio: ['textarea[placeholder]', '.code-block textarea', 'div[contenteditable="true"]'],
      grok: ['textarea[placeholder]', 'div[contenteditable="true"]'],
      deepseek: ['textarea#chat-input', 'textarea[placeholder]'],
      kimi: ['div[contenteditable="true"][class*="editor"]', 'div[contenteditable="true"].ProseMirror'],
      zhipu: ['textarea.ant-input'],
      doubao: ['div[data-slate-editor="true"]', 'div[contenteditable="true"][role="textbox"]'],
      wenxin: ['div[contenteditable="true"]', 'textarea[placeholder]'],
      qwen: ['div[contenteditable="true"][class*="editor"]'],
      minimax: ['textarea[placeholder]', 'div[contenteditable="true"]'],
      hunyuan: ['textarea[placeholder]', 'div[contenteditable="true"]'],
    };
    // Try platform-specific selectors first, then generic fallback
    const selectors = configs[this.platform] || [];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && this.isVisible(el)) return el;
    }
    // Generic fallback for all platforms
    for (const sel of ['textarea', 'div[contenteditable="true"]']) {
      const el = document.querySelector(sel);
      if (el && this.isVisible(el)) return el;
    }
    return null;
  }

  // Collect ALL matching elements, traversing Shadow DOM boundaries
  queryAllDeep(predicate) {
    const results = [];
    const queue = [document];
    while (queue.length > 0) {
      const root = queue.shift();
      const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
      elements.forEach(el => {
        if (predicate(el)) results.push(el);
        if (el.shadowRoot) queue.push(el.shadowRoot);
      });
    }
    return results;
  }

  findInputElement() {
    // Try platform-specific simple selectors first (fast path)
    const simple = this.findInputSimple();
    if (simple) return simple;

    // Deep traversal fallback for Shadow DOM inputs
    const deep = this.queryAllDeep(el => {
      const tag = el.tagName?.toLowerCase();
      if (tag !== 'textarea' && !(tag === 'div' && el.isContentEditable)) return false;
      return this.isVisible(el);
    });
    return deep[0] || null;
  }

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.getBoundingClientRect().height > 0;
  }

  // --- Prompt Injection ---

  async injectIntoElement(inputEl, text) {
    if (!inputEl) return false;

    inputEl.focus();
    await new Promise(r => setTimeout(r, 50));

    let success = false;

    // Strategy A: ProseMirror / ContentEditable (ChatGPT, Claude)
    if (inputEl.classList.contains('ProseMirror') || inputEl.isContentEditable) {
      try {
        success = document.execCommand('insertText', false, text);
      } catch (e) { /* execCommand not supported */ }
    }

    // Strategy B: Textarea/Input with React bypass (Gemini, NotebookLM, or Generic Web Forms)
    if (!success) {
      if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
        const valueSetter = Object.getOwnPropertyDescriptor(inputEl, 'value')?.set;
        const protoSetter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(inputEl), 'value'
        )?.set;

        const finalSetter = valueSetter || protoSetter;

        if (finalSetter) {
          finalSetter.call(inputEl, text);
        } else {
          inputEl.value = text;
        }

        // Reset React's value tracker so it recognizes the change
        const tracker = inputEl._valueTracker;
        if (tracker) tracker.setValue('');

        success = true;
      } else {
        // ContentEditable fallback
        inputEl.textContent = text;
        success = true;
      }
    }

    // Trigger event chain to activate Send button
    [
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' }),
      new KeyboardEvent('keyup', { bubbles: true, key: ' ' })
    ].forEach(e => inputEl.dispatchEvent(e));

    this.showNotification(this.msg('insertSuccess', 'Prompt已填入'), 'success');
    return true;
  }

  async injectPromptRobust(text) {
    const inputEl = this.findInputElement();
    if (!inputEl) {
      this.showNotification(this.msg('inputNotFound', '未找到输入框'), 'error');
      return false;
    }
    return this.injectIntoElement(inputEl, text);
  }

  // --- Variable Processing ---

  extractVariables(content) {
    const matches = [];
    const brackets = content.match(/\{\{([^}]+)\}\}/g);
    if (brackets) {
      matches.push(...brackets.map(m => m.slice(2, -2).trim()));
    }
    const squares = content.match(/\[([a-zA-Z][a-zA-Z0-9_\s]*)\](?!\()/g);
    if (squares) {
      matches.push(...squares.map(m => m.slice(1, -1).trim()));
    }
    return [...new Set(matches)].filter(v => v.length > 0);
  }

  resolveVariables(content, values) {
    let resolved = content;
    for (const [name, value] of Object.entries(values)) {
      resolved = resolved.split(`{{${name}}}`).join(value);
      resolved = resolved.split(`[${name}]`).join(value);
    }
    return resolved;
  }

  // Context Grabber: auto-fill magic variables with live webpage data
  // These are resolved BEFORE showing the variable form, so users never see them.
  static CONTEXT_VARS = new Set(['page_text', 'selected_text', 'page_url', 'page_title']);

  // Capture current page context and cache it in background for cross-tab usage
  async capturePageContext() {
    const article = document.querySelector('article') || document.querySelector('main') || document.body;
    const context = {
      page_text: (article?.innerText || '').substring(0, 4000).trim(),
      page_title: document.title || '',
      page_url: window.location.href,
      selected_text: window.getSelection()?.toString()?.trim() || ''
    };
    try {
      await chrome.runtime.sendMessage({ type: 'CAPTURE_PAGE_CONTEXT', context });
      this.showPageToast(`📸 Page captured! Switch to AI chat and use magic variables.`);
    } catch (e) {
      console.error('[Prompt Ark] Capture failed:', e);
    }
  }

  // Async resolver: tries cached context first (cross-tab), falls back to live DOM
  async resolveContextVariables(content) {
    const vars = this.extractVariables(content);
    const hasContextVars = vars.some(v => AIPromptManager.CONTEXT_VARS.has(v));
    if (!hasContextVars) return content;

    const contextValues = {};

    // Strategy: try cached snapshot from background (cross-tab scenario)
    let cached = null;
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'GET_PAGE_CONTEXT' });
      if (resp?.success && resp.context) cached = resp.context;
    } catch (e) { /* no cache available */ }

    // Fill each variable: prefer cache, fallback to current page
    if (vars.includes('page_url')) {
      contextValues.page_url = cached?.page_url || window.location.href;
    }
    if (vars.includes('page_title')) {
      contextValues.page_title = cached?.page_title || document.title || '';
    }
    if (vars.includes('selected_text')) {
      // Selected text: prefer live selection (user might have just selected something)
      const liveSelection = window.getSelection()?.toString()?.trim() || '';
      contextValues.selected_text = liveSelection || cached?.selected_text || '';
    }
    if (vars.includes('page_text')) {
      if (cached?.page_text) {
        contextValues.page_text = cached.page_text;
      } else {
        const article = document.querySelector('article') || document.querySelector('main') || document.body;
        contextValues.page_text = (article?.innerText || '').substring(0, 4000).trim();
      }
    }

    return this.resolveVariables(content, contextValues);
  }

  // --- Initialization ---

  init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        this.showPromptPicker();
      }
      // Context Grabber: Alt+Shift+S = Snapshot current page context for cross-tab use
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        this.capturePageContext();
      }
      if (e.key === 'Escape' && this.pickerVisible) {
        this.hidePromptPicker();
      }
    });

    this.initSlashCommands();

    // Guard: Deep DOM traversal and helper buttons only run on known AI platforms!
    // Running this heavily active observer globally on <all_urls> would destroy browser performance.
    if (this.platform !== 'generic') {
      this.initMutationObserver();
      setTimeout(() => this.initHelperButtons(), 1000);
    }

    // Global Event Listener: Catch One-Click Install Events from Prompt Hub
    window.addEventListener('message', (event) => {
      // Security Check 1: Accept only from Verified Domains (e.g. your GitHub Pages, local dev)
      const verifiedDomains = [
        'https://keyonzeng.github.io',
        'http://127.0.0.1:8080',
        'http://localhost:8080'
      ];

      if (!verifiedDomains.includes(event.origin)) {
        return; // Ignore messages from untrusted origins
      }

      // Security Check 2: Accept events containing specifically structured payload
      if (event.data && event.data.type === 'PROMPT_ARK_IMPORT' && event.data.payload) {
        this.handleHubImportEvent(event.data.payload, event.source, event.origin);
      }
    });
  }

  async handleHubImportEvent(payload, sourceWindow, origin) {
    if (!payload || !payload.prompts || !Array.isArray(payload.prompts)) return;

    // Standardize prompts array for import
    const newPrompts = payload.prompts.map(p => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      title: p.title || p.act || 'Untitled',
      content: p.content || p.prompt || '',
      category: p.category || 'Downloaded',
      tags: p.tags || [],
      variables: p.variables || [],
      shortcut: p.shortcut || '',
      usageCount: 0,
      lastUsed: Date.now(),
      pinned: false,
      keywords: [(p.title || p.act || '').toLowerCase()]
    }));

    try {
      const response = await chrome.runtime.sendMessage({ type: 'IMPORT_PROMPTS', prompts: newPrompts });
      if (response.success) {
        // Display success Toast directly on the webpage (since Popup is closed)
        this.showPageToast(`🚀 Successfully added ${newPrompts.length} prompt(s) to your Prompt Ark!`);
        // Notify the sender (the Hub page) that it was successful (targeted to verified origin)
        if (sourceWindow) {
          sourceWindow.postMessage({ type: 'PROMPT_ARK_IMPORT_SUCCESS' }, origin);
        }
      } else {
        console.error('[Prompt Ark] Import failed via Hub:', response.error);
        this.showPageToast(`❌ Import Failed: ${response.error || 'Unknown Error'}`);
      }
    } catch (e) {
      console.error('[Prompt Ark] Import Error:', e);
    }
  }

  showPageToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(8px)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '999px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: '2147483647',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      opacity: '0',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });
    document.body.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });

    // Animate Out after 3s
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  initMutationObserver() {
    const observer = new MutationObserver(() => {
      if (this.mutationTimer) clearTimeout(this.mutationTimer);
      this.mutationTimer = setTimeout(() => this.initHelperButtons(), 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  initHelperButtons() {
    // Clean up orphaned wrappers whose target input is no longer in the DOM
    document.querySelectorAll('.notebook-helper-wrapper').forEach(wrapper => {
      const container = wrapper.parentElement;
      if (!container) { wrapper.remove(); return; }
      const markedInput = container.querySelector(`[${this.injectedMarker}="true"]`);
      if (!markedInput || !markedInput.isConnected) {
        wrapper.remove();
        if (markedInput) markedInput.removeAttribute(this.injectedMarker);
      }
    });

    const isValidInput = (el) => {
      if (el.getAttribute(this.injectedMarker) === 'true') return false;
      const tag = el.tagName.toLowerCase();
      if (tag !== 'textarea' && !(tag === 'div' && el.isContentEditable)) return false;
      const rect = el.getBoundingClientRect();
      if (rect.height < 10 || rect.width < 50) return false;
      if (window.getComputedStyle(el).display === 'none') return false;
      return true;
    };

    const candidates = this.queryAllDeep(isValidInput);

    candidates.forEach(input => {
      // Walk up to find a container without overflow clipping (max 5 levels)
      let container = input.parentElement;
      for (let i = 0; i < 5 && container && container !== document.body; i++) {
        const s = window.getComputedStyle(container);
        if (s.overflow !== 'hidden' && s.overflowX !== 'hidden' && s.overflowY !== 'hidden') break;
        container = container.parentElement;
      }
      if (!container) return;

      // Container for multiple buttons
      const btnWrapper = document.createElement('div');
      btnWrapper.className = 'notebook-helper-wrapper';
      btnWrapper.style.display = 'flex';
      btnWrapper.style.gap = '4px';
      btnWrapper.style.zIndex = '9999';

      const btn = document.createElement('button');
      btn.className = 'notebook-helper-btn';

      const placeholder = (input.getAttribute('placeholder') || input.getAttribute('aria-label') || '').toLowerCase();
      const isSearch = placeholder.includes('search') || placeholder.includes('research') || placeholder.includes('搜索');

      btn.innerHTML = isSearch ? '<span>🔍</span>' : '<span>✨</span>';
      btn.title = isSearch ? 'Search Prompts' : 'Insert Prompt';
      if (isSearch) btn.classList.add('apm-type-search');
      else btn.classList.add('apm-type-chat');

      btn.addEventListener('mousedown', e => e.preventDefault());
      btn.addEventListener('mouseenter', () => input.classList.add('apm-target-highlight'));
      btn.addEventListener('mouseleave', () => input.classList.remove('apm-target-highlight'));

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        input.classList.add('apm-target-highlight');
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });

        this.showPromptPicker(async (content) => {
          if (!input.isConnected) {
            this.showNotification(this.msg('inputNotFound', '输入框已失效'), 'error');
            return;
          }
          await this.injectIntoElement(input, content);
        });
      });

      btnWrapper.appendChild(btn);

      // Only add Quick Actions on Chat inputs, not Search inputs
      if (!isSearch) {
        const qaBtn = document.createElement('button');
        qaBtn.className = 'notebook-helper-btn apm-type-qa';
        qaBtn.innerHTML = '<span>⚡</span>';
        qaBtn.title = 'Power Actions';

        qaBtn.addEventListener('mousedown', e => e.preventDefault());
        qaBtn.addEventListener('mouseenter', () => input.classList.add('apm-target-highlight'));
        qaBtn.addEventListener('mouseleave', () => input.classList.remove('apm-target-highlight'));

        qaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          input.classList.add('apm-target-highlight');
          this.showQuickActionsMenu(qaBtn, input);
        });

        btnWrapper.appendChild(qaBtn);
      }

      // Position: use container-relative if possible, else body-fixed
      if (container === document.body) {
        const rect = input.getBoundingClientRect();
        btnWrapper.style.position = 'fixed';
        btnWrapper.style.top = (rect.top + 4) + 'px';
        btnWrapper.style.right = (window.innerWidth - rect.right + 4) + 'px';
        btnWrapper.style.left = 'auto';
      } else {
        const style = window.getComputedStyle(container);
        if (style.position === 'static') {
          container.style.position = 'relative';
        }
        // Platform specific offsets for container-relative positioning
        if (this.platform === 'notebooklm') {
          // NotebookLM has strict overflow clipping on the right edge.
          // Placing it on the far right (-45px) causes it to be cut off.
          // Positioning it at `right: 90px` places it cleanly to the left of the "1 source" and native send button.
          btnWrapper.style.right = '90px';
          btnWrapper.style.bottom = '8px';
          btnWrapper.style.top = 'auto';
        } else if (this.platform === 'gemini') {
          btnWrapper.style.right = '48px';
        }
      }

      container.appendChild(btnWrapper);
      input.setAttribute(this.injectedMarker, 'true');
    });
  }

  showQuickActionsMenu(anchorEl, inputEl) {
    // hide existing
    const existing = document.getElementById('apm-qa-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'apm-qa-menu';
    menu.className = 'apm-qa-menu';
    const actions = [
      { id: 'rewrite', icon: '📝', label: this.msg('qaRewriteLabel', 'Rewrite'), prompt: this.msg('qaRewritePrompt', 'Please rewrite the text above to be clearer and more professional.') },
      { id: 'summarize', icon: '📋', label: this.msg('qaSummarizeLabel', 'Summarize'), prompt: this.msg('qaSummarizePrompt', 'Please provide a concise summary of the text above.') },
      { id: 'expand', icon: '➕', label: this.msg('qaExpandLabel', 'Expand'), prompt: this.msg('qaExpandPrompt', 'Please expand on the text above and provide more details.') },
      { id: 'translate', icon: '🌐', label: this.msg('qaTranslateLabel', 'Translate to EN'), prompt: this.msg('qaTranslatePrompt', 'Please translate the text above to English.') },
      { id: 'explain', icon: '💡', label: this.msg('qaExplainLabel', 'Explain'), prompt: this.msg('qaExplainPrompt', 'Please explain the text above simply.') }
    ];

    menu.innerHTML = actions.map(act => `
      <div class="apm-qa-item" data-id="${act.id}">
        <span class="apm-qa-icon">${act.icon}</span>
        <span class="apm-qa-label">${act.label}</span>
      </div>
    `).join('');

    document.body.appendChild(menu);

    // Position relative to anchorEl
    const rect = anchorEl.getBoundingClientRect();
    menu.style.position = 'fixed';

    // Check if there's space below, else show above
    if (rect.bottom + 200 > window.innerHeight) {
      menu.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
      menu.style.top = 'auto';
    } else {
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.bottom = 'auto';
    }

    // Align right
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.style.left = 'auto';
    menu.style.zIndex = '2147483647';

    // Event listeners
    menu.querySelectorAll('.apm-qa-item').forEach((item, idx) => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = actions[idx];
        await this.injectIntoElement(inputEl, action.prompt);
        menu.remove();
        inputEl.classList.remove('apm-target-highlight');
      });
    });

    // Close on outside click
    const closeFn = (e) => {
      if (!menu.contains(e.target) && e.target !== anchorEl) {
        menu.remove();
        inputEl.classList.remove('apm-target-highlight');
        document.removeEventListener('click', closeFn);
      }
    };
    setTimeout(() => document.addEventListener('click', closeFn), 10);
  }

  handleMessage(message, sendResponse) {
    switch (message.type) {
      case 'INSERT_PROMPT':
        this.injectPromptRobust(message.content).then(success => sendResponse({ success }));
        break;
      case 'SHOW_PROMPT_PICKER':
        this.showPromptPicker();
        sendResponse({ success: true });
        break;
      case 'SAVE_FROM_CONTEXT_MENU_SUCCESS':
        this.showNotification(this.msg('contextMenuSaveSuccess', '已添加到 Prompt Ark ✓'), 'success');
        sendResponse({ success: true });
        break;
      case 'GET_PLATFORM':
        sendResponse({ platform: this.platform });
        break;
    }
  }

  // --- UI: Prompt Picker ---

  async showPromptPicker(onSelect = null) {
    if (this.pickerVisible) {
      this.hidePromptPicker();
      return;
    }

    if (!this.isContextValid()) {
      this.showNotification(this.msg('extensionReload', '扩展已更新，请刷新页面'), 'error');
      return;
    }

    this.onSelectCallback = onSelect;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PROMPTS' });
      if (!response.success) {
        this.showNotification(this.msg('loadError', '无法加载Prompts'), 'error');
        return;
      }
      this.prompts = response.prompts;
      // Smart sort: favorites first, then by most recently used
      this.prompts.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return (b.lastUsedAt || 0) - (a.lastUsedAt || 0);
      });
      this.renderPromptPicker();
      this.pickerVisible = true;
    } catch (e) {
      this.showNotification(this.msg('extensionReload', '扩展已更新，请刷新页面'), 'error');
    }
  }

  hidePromptPicker() {
    const picker = document.getElementById('ai-prompt-picker');
    if (picker) picker.remove();
    this.pickerVisible = false;
    this.onSelectCallback = null;
    document.querySelectorAll('.apm-target-highlight').forEach(el => {
      el.classList.remove('apm-target-highlight');
    });
  }

  async selectPrompt(id) {
    const prompt = this.prompts.find(p => p.id === id);
    if (!prompt) return;

    // Track usage
    chrome.runtime.sendMessage({ type: 'TRACK_USAGE', id }).catch(() => { });

    // 1. Compose prompt content
    const composeResp = await chrome.runtime.sendMessage({ type: 'COMPOSE_PROMPT', prompt });
    const composedRaw = composeResp?.success ? composeResp.composed : prompt.content;

    // 2. Context Grabber: auto-resolve magic variables FIRST
    const contextResolved = await this.resolveContextVariables(composedRaw);

    // 3. Now check for remaining user-defined variables
    const variables = this.extractVariables(contextResolved);

    if (variables.length > 0) {
      // Show variable fill form (only manual variables remain)
      this.showVariableForm({ ...prompt, content: contextResolved }, variables);
    } else {
      if (this.onSelectCallback) {
        await this.onSelectCallback(contextResolved);
      } else {
        await this.injectPromptRobust(contextResolved);
      }
      this.hidePromptPicker();
    }
  }



  // --- UI: Variable Fill Form ---

  showVariableForm(prompt, variables) {
    // Remove picker modal content, replace with variable form
    const picker = document.getElementById('ai-prompt-picker');
    if (!picker) return;

    const modal = picker.querySelector('.apm-modal');
    modal.innerHTML = `
      <div class="apm-header">
        <span class="apm-title">${this.escapeHtml(prompt.title)}</span>
        <button class="apm-close">&times;</button>
      </div>
      <div class="apm-var-form">
        ${variables.map(v => `
          <div class="apm-var-group">
            <label class="apm-var-label">${this.escapeHtml(v)}</label>
            <textarea class="apm-var-input" data-var="${this.escapeHtml(v)}" 
              placeholder="[${this.escapeHtml(v)}]" rows="2"></textarea>
          </div>
        `).join('')}
      </div>
      <div class="apm-actions">
        <button class="apm-btn apm-btn-cancel">Cancel</button>
        <button class="apm-btn apm-btn-primary">Insert</button>
      </div>
    `;

    // Focus first input
    const firstInput = modal.querySelector('.apm-var-input');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    // Bind events
    modal.querySelector('.apm-close').addEventListener('click', () => this.hidePromptPicker());
    modal.querySelector('.apm-btn-cancel').addEventListener('click', () => this.hidePromptPicker());
    modal.querySelector('.apm-btn-primary').addEventListener('click', async () => {
      const values = {};
      modal.querySelectorAll('.apm-var-input').forEach(input => {
        values[input.dataset.var] = input.value;
      });

      const resolved = this.resolveVariables(prompt.content, values);

      if (this.onSelectCallback) {
        await this.onSelectCallback(resolved);
      } else {
        await this.injectPromptRobust(resolved);
      }
      this.hidePromptPicker();
    });
  }

  renderPromptPicker() {
    const existingPicker = document.getElementById('ai-prompt-picker');
    if (existingPicker) existingPicker.remove();

    const picker = document.createElement('div');
    picker.id = 'ai-prompt-picker';
    picker.innerHTML = `
      <div class="apm-overlay"></div>
      <div class="apm-modal">
        <div class="apm-header">
          <input type="text" class="apm-search" placeholder="Search..." autofocus>
          <button class="apm-close">&times;</button>
        </div>
        <div class="apm-list">
          ${this.renderPromptList(this.prompts)}
        </div>
      </div>
    `;
    document.body.appendChild(picker);
    this.bindPickerEvents(picker);
    setTimeout(() => picker.querySelector('.apm-search').focus(), 100);
  }

  renderPromptList(prompts) {
    if (prompts.length === 0) return '<div class="apm-empty">No prompts</div>';
    return prompts.map(p => {
      const vars = this.extractVariables(p.content);
      const varBadge = vars.length > 0
        ? `<span class="apm-item-vars">${vars.length} vars</span>`
        : '';
      const preview = this.escapeHtml(p.content.substring(0, 120));
      return `
        <div class="apm-item" data-id="${p.id}">
          <div class="apm-item-title">${this.escapeHtml(p.title)}</div>
          <div class="apm-item-preview md-content">${preview}</div>
          ${varBadge}
        </div>
      `;
    }).join('');
  }

  bindPickerEvents(picker) {
    picker.querySelector('.apm-close').addEventListener('click', () => this.hidePromptPicker());
    picker.querySelector('.apm-overlay').addEventListener('click', () => this.hidePromptPicker());

    picker.querySelector('.apm-search').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = this.prompts.filter(p =>
        p.title.toLowerCase().includes(term) || p.content.toLowerCase().includes(term)
      );
      picker.querySelector('.apm-list').innerHTML = this.renderPromptList(filtered);
    });

    picker.querySelector('.apm-list').addEventListener('click', (e) => {
      const item = e.target.closest('.apm-item');
      if (item) this.selectPrompt(item.dataset.id);
    });
  }

  // --- Utilities ---

  showNotification(message, type) {
    const div = document.createElement('div');
    div.className = `apm-notification apm-${type}`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // i18n helper: try chrome.i18n, fall back to default
  msg(key, fallback) {
    try {
      return chrome.i18n.getMessage(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  // --- Slash Commands ---

  initSlashCommands() {
    // Use capture phase to detect slash input across all platforms
    document.addEventListener('input', (e) => this.handleSlashInput(e), true);
    document.addEventListener('keydown', (e) => this.handleSlashKeydown(e), true);
    // Also monitor Shadow DOM inputs via a periodic check
    document.addEventListener('click', () => {
      setTimeout(() => this.bindSlashToFocused(), 200);
    }, true);
  }

  bindSlashToFocused() {
    const el = document.activeElement;
    if (!el || this.slashBound) return;
    const tag = el.tagName?.toLowerCase();
    const isTextInput = tag === 'input' && (el.type === 'text' || el.type === 'search');
    if (tag !== 'textarea' && !isTextInput && !(tag === 'div' && el.isContentEditable)) return;
    if (el.dataset.apmSlashBound) return;
    el.dataset.apmSlashBound = 'true';
  }

  getInputText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value;
    return el.textContent || el.innerText || '';
  }

  async handleSlashInput(e) {
    const el = e.target;
    if (!el) return;
    const tag = el.tagName?.toLowerCase();
    const isTextInput = tag === 'input' && (el.type === 'text' || el.type === 'search');
    if (tag !== 'textarea' && !isTextInput && !(tag === 'div' && el.isContentEditable)) return;

    const text = this.getInputText(el);
    // Only trigger on lines that start with / (check last line for multi-line inputs)
    const match = text.match(/(?:^|\n)\/(\S*)$/);

    if (!match) {
      this.hideSlashDropdown();
      return;
    }

    const query = match[1].toLowerCase();

    // Fetch shortcuts if cache is empty
    if (this.slashShortcuts.length === 0) {
      try {
        const resp = await chrome.runtime.sendMessage({ type: 'GET_SHORTCUTS' });
        if (resp.success) this.slashShortcuts = resp.shortcuts;
      } catch (e) { return; }
    }

    const filtered = this.slashShortcuts.filter(s =>
      s.shortcut.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      this.hideSlashDropdown();
      return;
    }

    this.showSlashDropdown(el, filtered, query);
  }

  showSlashDropdown(inputEl, items, query) {
    this.hideSlashDropdown();

    const dropdown = document.createElement('div');
    dropdown.className = 'apm-slash-dropdown';
    dropdown.innerHTML = items.map((item, i) => `
      <div class="apm-slash-item ${i === 0 ? 'active' : ''}" data-index="${i}">
        <span class="apm-slash-cmd">/${this.escapeHtml(item.shortcut)}</span>
        <span class="apm-slash-title">${this.escapeHtml(item.title)}</span>
      </div>
    `).join('');

    // Position near the input
    const rect = inputEl.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = Math.min(rect.width, 360) + 'px';

    document.body.appendChild(dropdown);
    this.slashDropdown = dropdown;
    this.slashActiveIndex = 0;
    this._slashItems = items;
    this._slashInputEl = inputEl;
    this._slashQuery = query;

    // Click handler
    dropdown.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const item = e.target.closest('.apm-slash-item');
      if (item) {
        this.selectSlashItem(parseInt(item.dataset.index));
      }
    });
  }

  hideSlashDropdown() {
    if (this.slashDropdown) {
      this.slashDropdown.remove();
      this.slashDropdown = null;
    }
    this.slashActiveIndex = -1;
    this._slashItems = null;
    this._slashInputEl = null;
  }

  handleSlashKeydown(e) {
    if (!this.slashDropdown || !this._slashItems) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      this.slashActiveIndex = (this.slashActiveIndex + 1) % this._slashItems.length;
      this.updateSlashHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      this.slashActiveIndex = (this.slashActiveIndex - 1 + this._slashItems.length) % this._slashItems.length;
      this.updateSlashHighlight();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (this.slashActiveIndex >= 0) {
        e.preventDefault();
        e.stopPropagation();
        this.selectSlashItem(this.slashActiveIndex);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.hideSlashDropdown();
    }
  }

  updateSlashHighlight() {
    if (!this.slashDropdown) return;
    this.slashDropdown.querySelectorAll('.apm-slash-item').forEach((el, i) => {
      el.classList.toggle('active', i === this.slashActiveIndex);
    });
  }

  async selectSlashItem(index) {
    const item = this._slashItems?.[index];
    const inputEl = this._slashInputEl;
    if (!item || !inputEl) return;

    // Replace the /command text with the prompt content
    const text = this.getInputText(inputEl);
    const replaced = text.replace(/(?:^|\n)\/(\S*)$/, '');

    // 1. Compose with Persona/Style (Global & Local)
    const composeResp = await chrome.runtime.sendMessage({ type: 'COMPOSE_PROMPT', prompt: item });
    const composedRaw = composeResp?.success ? composeResp.composed : item.content;

    // 2. Context Grabber: auto-resolve magic variables FIRST
    const contextResolved = await this.resolveContextVariables(composedRaw);
    const finalContent = (replaced ? replaced + '\n' : '') + contextResolved;

    this.hideSlashDropdown();
    // Reset the shortcut cache so it's fresh next time
    this.slashShortcuts = [];

    // 3. Check for remaining user-defined variables
    const vars = this.extractVariables(finalContent);
    if (vars.length > 0) {
      // Set callback to inject into the original input
      this.onSelectCallback = async (content) => {
        await this.injectIntoElement(inputEl, content);
      };

      this.renderPromptPicker();
      this.pickerVisible = true;
      // Pass finalContent as the composed text to be variable-substituted
      this.showVariableForm({ title: item.title, content: finalContent }, vars);
    } else {
      // Track usage for slash command injection
      chrome.runtime.sendMessage({ type: 'TRACK_USAGE', id: item.id }).catch(() => { });
      await this.injectIntoElement(inputEl, finalContent);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new AIPromptManager());
} else {
  new AIPromptManager();
}
