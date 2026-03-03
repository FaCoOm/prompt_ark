// prompt-ark-hub/hub-app.js — Hub SPA core logic
// Fetches the Hub index from GitHub Gist, renders prompt cards,
// handles filtering, sorting, search, detail modal, voting, and install.

const GITHUB_API = 'https://api.github.com';

// Index Gist ID — read from URL param or localStorage
// Usage: open Hub with ?index=GIST_ID to set the Index Gist
// Or ?gist=LISTING_GIST_ID to open a specific listing directly
const params = new URLSearchParams(window.location.search);
const INDEX_GIST_ID = params.get('index') || localStorage.getItem('hub_index_gist_id') || '';
const DIRECT_GIST_ID = params.get('gist') || '';
const INDEX_FILENAME = 'prompt-ark-hub-index.json';
const LISTING_FILENAME = 'prompt-ark-hub-listing.json';

// Persist the Index Gist ID if provided via URL param
if (params.get('index')) {
    localStorage.setItem('hub_index_gist_id', params.get('index'));
}

// ===== State =====
let allListings = [];
let filteredListings = [];
let currentCategory = 'all';
let currentSort = 'trending';
let currentSearch = '';
let currentDetailGistId = null;
let currentDetailData = null;
let deviceId = getDeviceId();

// ===== Device ID (for voting anti-spam) =====
function getDeviceId() {
    let id = localStorage.getItem('hub_device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('hub_device_id', id);
    }
    return id;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    bindEvents();
    await loadIndex();

    // Auto-open a specific listing if ?gist= param is present
    if (DIRECT_GIST_ID) {
        openDetail(DIRECT_GIST_ID);
    }
});

// ===== Data Loading =====
async function loadIndex() {
    showLoading(true);

    try {
        if (INDEX_GIST_ID) {
            const resp = await fetch(`${GITHUB_API}/gists/${INDEX_GIST_ID}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const gist = await resp.json();
            const file = gist.files[INDEX_FILENAME];
            if (file) {
                const data = JSON.parse(file.content);
                allListings = data.listings || [];
            }
        }

        // If no index or empty, use demo data
        if (allListings.length === 0) {
            allListings = getDemoListings();
        }

        applyFilters();
        showLoading(false);
    } catch (e) {
        console.error('[Hub] Failed to load index:', e);
        allListings = getDemoListings();
        applyFilters();
        showLoading(false);
    }
}

// ===== Filtering & Sorting =====
function applyFilters() {
    let list = [...allListings];

    // Category filter
    if (currentCategory !== 'all') {
        list = list.filter(l => l.category === currentCategory);
    }

    // Search filter (fuzzy: title, tags, author, category)
    if (currentSearch.trim()) {
        const q = currentSearch.toLowerCase();
        list = list.filter(l => {
            const haystack = [
                l.title,
                l.category,
                l.author,
                ...(l.tags || []),
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }

    // Sort
    switch (currentSort) {
        case 'trending':
            list.sort((a, b) => (b.upvotes + b.installCount) - (a.upvotes + a.installCount));
            break;
        case 'newest':
            list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            break;
        case 'topRated':
            list.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
            break;
        case 'quality':
            list.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
            break;
    }

    filteredListings = list;
    renderGrid(list);
    updateStats(list.length, allListings.length);
}

// ===== Rendering =====
function renderGrid(listings) {
    const grid = document.getElementById('promptGrid');
    const empty = document.getElementById('emptyState');

    if (listings.length === 0) {
        grid.innerHTML = '';
        empty.style.display = '';
        return;
    }

    empty.style.display = 'none';

    grid.innerHTML = listings.map(l => `
    <div class="hub-card" data-gist="${l.gistId}">
      <div class="hub-card-header">
        <div class="hub-card-title">${escapeHtml(l.title)}</div>
        <span class="hub-card-type ${l.type}">${l.type === 'pack' ? `📦 Pack (${l.packCount || '?'})` : 'Prompt'}</span>
      </div>
      <div class="hub-card-desc">${escapeHtml(l.description || '')}</div>
      <div class="hub-card-tags">
        <span class="hub-tag">${escapeHtml(l.category || 'General')}</span>
        ${(l.tags || []).slice(0, 3).map(t => `<span class="hub-tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="hub-card-meta">
        <div class="hub-card-author">
          ${l.authorAvatar
            ? `<img class="hub-card-avatar" src="${escapeHtml(l.authorAvatar)}" alt="${escapeHtml(l.author)}" loading="lazy">`
            : `<div class="hub-card-avatar"></div>`
        }
          <span class="hub-card-author-name">${escapeHtml(l.author || 'anonymous')}</span>
        </div>
        <div class="hub-card-stats">
          <span class="hub-stat"><span class="hub-stat-icon">👍</span> ${l.upvotes || 0}</span>
          <span class="hub-stat"><span class="hub-stat-icon">⬇️</span> ${l.installCount || 0}</span>
          ${l.qualityScore ? `<span class="hub-card-score ${scoreClass(l.qualityScore)}">${l.qualityScore}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function scoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 50) return 'mid';
    return 'low';
}

function updateStats(shown, total) {
    const el = document.getElementById('statsCount');
    if (shown === total) {
        el.textContent = `${total} prompt${total !== 1 ? 's' : ''}`;
    } else {
        el.innerHTML = `<strong>${shown}</strong> of ${total} prompt${total !== 1 ? 's' : ''}`;
    }
}

function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? '' : 'none';
    document.getElementById('promptGrid').style.display = show ? 'none' : '';
}

// ===== Detail Modal =====
async function openDetail(gistId) {
    const modal = document.getElementById('modalBackdrop');
    modal.classList.add('active');
    currentDetailGistId = gistId;

    // Show basic info from index immediately
    const listing = allListings.find(l => l.gistId === gistId);
    document.getElementById('modalTitle').textContent = listing?.title || 'Loading...';
    document.getElementById('voteUpCount').textContent = listing?.upvotes || 0;
    document.getElementById('voteDownCount').textContent = listing?.downvotes || 0;

    const body = document.getElementById('modalBody');

    // Demo listings: render directly from in-memory data (no API call)
    if (listing?._demoContent) {
        currentDetailData = {
            type: listing.type,
            listing: listing,
            stats: { upvotes: listing.upvotes, downvotes: listing.downvotes, installCount: listing.installCount },
            prompts: listing._demoContent,
            pack: listing.type === 'pack' ? { title: listing.title, count: listing._demoContent.length } : null,
        };
        renderDetail(currentDetailData, listing);
        return;
    }

    body.innerHTML = '<div class="hub-loading"><div class="spinner"></div><p>Loading prompt details...</p></div>';

    try {
        // Fetch full listing from the Listing Gist
        const resp = await fetch(`${GITHUB_API}/gists/${gistId}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const gist = await resp.json();
        const file = gist.files[LISTING_FILENAME];
        if (!file) throw new Error('Invalid listing Gist');

        currentDetailData = JSON.parse(file.content);
        renderDetail(currentDetailData, listing);
    } catch (e) {
        console.error('[Hub] Failed to load listing:', e);
        body.innerHTML = `<div class="hub-empty"><div class="hub-empty-icon">⚠️</div><p>Failed to load: ${escapeHtml(e.message)}</p></div>`;
    }
}

function renderDetail(data, indexEntry) {
    const body = document.getElementById('modalBody');
    const prompts = data.prompts || [];

    if (data.type === 'pack' && prompts.length > 1) {
        // Pack view
        const meta = renderMetaItems(data.listing);
        body.innerHTML = `
      <div class="hub-modal-meta">${meta}</div>
      <p style="margin-bottom: 12px; color: var(--text-secondary);">This pack contains <strong>${prompts.length}</strong> prompts:</p>
      <div class="hub-pack-list">
        ${prompts.map((p, i) => `
          <div class="hub-pack-item" data-idx="${i}">
            <div class="hub-pack-item-title">${escapeHtml(p.title || `Prompt ${i + 1}`)}</div>
            <div class="hub-pack-item-preview">${escapeHtml((p.content || '').substring(0, 100))}...</div>
          </div>
        `).join('')}
      </div>
    `;
    } else {
        // Single prompt view
        const prompt = prompts[0] || {};
        const meta = renderMetaItems(data.listing);
        const contentHtml = typeof marked !== 'undefined'
            ? marked.parse(prompt.content || 'No content available.')
            : escapeHtml(prompt.content || 'No content available.');

        body.innerHTML = `
      <div class="hub-modal-meta">${meta}</div>
      <div class="hub-modal-content">${contentHtml}</div>
    `;
    }

    // Update vote counts from fresh data
    document.getElementById('voteUpCount').textContent = data.stats?.upvotes || 0;
    document.getElementById('voteDownCount').textContent = data.stats?.downvotes || 0;

    // Check if we already voted
    updateVoteUI();
}

function renderMetaItems(listing) {
    const items = [];
    if (listing.category) items.push(`<span class="hub-modal-meta-item">📁 ${escapeHtml(listing.category)}</span>`);
    if (listing.variableCount) items.push(`<span class="hub-modal-meta-item">🔤 ${listing.variableCount} variable${listing.variableCount > 1 ? 's' : ''}</span>`);
    if (listing.tokenEstimate) items.push(`<span class="hub-modal-meta-item">📏 ~${listing.tokenEstimate} tokens</span>`);
    if (listing.qualityScore) items.push(`<span class="hub-modal-meta-item hub-card-score ${scoreClass(listing.qualityScore)}">💎 ${listing.qualityScore}</span>`);
    if (listing.language) items.push(`<span class="hub-modal-meta-item">🌐 ${listing.language.toUpperCase()}</span>`);
    return items.join('');
}

function closeDetail() {
    document.getElementById('modalBackdrop').classList.remove('active');
    currentDetailGistId = null;
    currentDetailData = null;
}

// ===== Voting =====
function getVotes() {
    try { return JSON.parse(localStorage.getItem('hub_votes') || '{}'); }
    catch { return {}; }
}

function setVote(gistId, direction) {
    const votes = getVotes();
    const current = votes[gistId];

    if (current === direction) {
        // Toggle off
        delete votes[gistId];
    } else {
        votes[gistId] = direction;
    }

    localStorage.setItem('hub_votes', JSON.stringify(votes));
    updateVoteUI();

    // Update stats in listing data locally (optimistic)
    if (currentDetailData?.stats) {
        const stats = currentDetailData.stats;
        // Reset
        if (current === 'up') stats.upvotes = Math.max(0, stats.upvotes - 1);
        if (current === 'down') stats.downvotes = Math.max(0, stats.downvotes - 1);
        // Apply new
        const newDir = votes[gistId];
        if (newDir === 'up') stats.upvotes = (stats.upvotes || 0) + 1;
        if (newDir === 'down') stats.downvotes = (stats.downvotes || 0) + 1;

        document.getElementById('voteUpCount').textContent = stats.upvotes;
        document.getElementById('voteDownCount').textContent = stats.downvotes;

        // Update index entry
        const entry = allListings.find(l => l.gistId === currentDetailGistId);
        if (entry) {
            entry.upvotes = stats.upvotes;
            entry.downvotes = stats.downvotes;
        }
    }
}

function updateVoteUI() {
    if (!currentDetailGistId) return;
    const votes = getVotes();
    const current = votes[currentDetailGistId];

    const upBtn = document.getElementById('voteUp');
    const downBtn = document.getElementById('voteDown');

    upBtn.classList.toggle('active', current === 'up');
    downBtn.classList.toggle('active', current === 'down');
}

// ===== Install =====
function installPrompt() {
    if (!currentDetailData?.prompts?.length) {
        showToast('❌ No prompt data to install');
        return;
    }

    const payload = {
        format: 'prompt-ark',
        version: 1,
        prompts: currentDetailData.prompts.map(p => ({
            title: p.title,
            content: p.content,
            category: p.category || '',
            tags: p.tags || [],
            variables: p.variables || [],
        })),
    };

    if (currentDetailData.pack) {
        payload.pack = currentDetailData.pack;
    }

    // Send message to Prompt Ark content script
    window.postMessage({
        type: 'PROMPT_ARK_IMPORT',
        payload,
    }, '*');

    showToast(`✅ ${currentDetailData.prompts.length} prompt${currentDetailData.prompts.length > 1 ? 's' : ''} sent to Prompt Ark!`);

    // Track install
    const entry = allListings.find(l => l.gistId === currentDetailGistId);
    if (entry) {
        entry.installCount = (entry.installCount || 0) + 1;
    }
}

// ===== Events =====
function bindEvents() {
    // Search
    const searchInput = document.getElementById('searchInput');
    let searchTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentSearch = searchInput.value;
            applyFilters();
        }, 200);
    });

    // Category tabs
    document.getElementById('categoryTabs').addEventListener('click', (e) => {
        const btn = e.target.closest('.hub-cat-btn');
        if (!btn) return;
        document.querySelectorAll('.hub-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        applyFilters();
    });

    // Sort
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFilters();
    });

    // Card click → open detail
    document.getElementById('promptGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.hub-card');
        if (!card) return;
        openDetail(card.dataset.gist);
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeDetail);
    document.getElementById('modalBackdrop').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeDetail();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDetail();
    });

    // Voting
    document.getElementById('voteUp').addEventListener('click', () => setVote(currentDetailGistId, 'up'));
    document.getElementById('voteDown').addEventListener('click', () => setVote(currentDetailGistId, 'down'));

    // Install
    document.getElementById('installBtn').addEventListener('click', installPrompt);
}

// ===== Utilities =====
function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function timeAgo(dateStr) {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

// ===== Demo Data =====
function getDemoListings() {
    return [
        {
            gistId: 'demo-1',
            title: 'Professional Email Writer',
            description: 'Write polished, professional emails for any business context. Supports multiple tones and formats with dynamic variable substitution.',
            category: 'Productivity',
            tags: ['email', 'business', 'writing'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 88,
            upvotes: 42,
            downvotes: 3,
            installCount: 156,
            type: 'prompt',
            language: 'en',
            variableCount: 3,
            tokenEstimate: 280,
            publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            _demoContent: [{ title: 'Professional Email Writer', content: 'You are an expert business communication specialist. Write a **{{tone}}** email for the following context:\n\n**Recipient:** {{recipient}}\n**Purpose:** {{purpose}}\n\n## Guidelines\n- Keep paragraphs short (2-3 sentences max)\n- Use professional but approachable language\n- Include a clear call-to-action\n- Proofread for grammar and clarity\n\nWrite the complete email with subject line, greeting, body, and sign-off.', category: 'Productivity', tags: ['email', 'business', 'writing'] }],
        },
        {
            gistId: 'demo-2',
            title: 'Code Review Expert',
            description: 'Thorough code review assistant that checks for bugs, security issues, performance, and best practices. Outputs structured feedback.',
            category: 'Coding',
            tags: ['code-review', 'development', 'quality'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 92,
            upvotes: 67,
            downvotes: 2,
            installCount: 234,
            type: 'prompt',
            language: 'en',
            variableCount: 2,
            tokenEstimate: 450,
            publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            _demoContent: [{ title: 'Code Review Expert', content: 'You are a senior software engineer performing a thorough code review.\n\n**Language/Framework:** {{language}}\n\n## Review the following code:\n```\n{{code}}\n```\n\n## Provide feedback in this structure:\n\n### 🐛 Bugs & Issues\n- List any bugs, logic errors, or runtime issues\n\n### 🔒 Security\n- Identify potential security vulnerabilities (injection, XSS, etc.)\n\n### ⚡ Performance\n- Suggest performance optimizations\n\n### 📐 Best Practices\n- Code style, naming conventions, SOLID principles\n\n### ✅ Summary\n- Overall assessment (1-10) with key takeaways', category: 'Coding', tags: ['code-review', 'development', 'quality'] }],
        },
        {
            gistId: 'demo-3',
            title: 'Content Strategy Pack',
            description: 'A collection of 5 prompts for content strategy: audience analysis, content calendar, SEO optimization, social hooks, and performance metrics.',
            category: 'Creative',
            tags: ['content', 'marketing', 'strategy'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 85,
            upvotes: 31,
            downvotes: 1,
            installCount: 89,
            type: 'pack',
            packCount: 5,
            language: 'en',
            variableCount: 4,
            tokenEstimate: 1200,
            publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            _demoContent: [
                { title: 'Audience Analysis', content: 'Analyze the target audience for **{{brand}}** in the **{{industry}}** space. Provide demographics, psychographics, pain points, and content preferences.' },
                { title: 'Content Calendar', content: 'Create a 30-day content calendar for **{{brand}}**. Include post types, topics, optimal posting times, and platform-specific formatting.' },
                { title: 'SEO Optimizer', content: 'Optimize the following content for SEO targeting the keyword **{{keyword}}**:\n\n{{content}}\n\nProvide: title tag, meta description, header structure, and internal linking suggestions.' },
                { title: 'Social Media Hooks', content: 'Generate 10 scroll-stopping hooks for **{{topic}}** optimized for **{{platform}}**. Each hook should be under 150 characters.' },
                { title: 'Performance Metrics', content: 'Define KPIs and success metrics for a **{{campaign_type}}** campaign by **{{brand}}**. Include benchmarks and measurement methodology.' },
            ],
        },
        {
            gistId: 'demo-4',
            title: '学术论文助手',
            description: '结构化学术写作助手，支持论文大纲、文献综述、方法论描述和结论撰写。中英双语支持。',
            category: 'Education',
            tags: ['academic', 'research', 'writing'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 80,
            upvotes: 28,
            downvotes: 5,
            installCount: 112,
            type: 'prompt',
            language: 'zh',
            variableCount: 5,
            tokenEstimate: 520,
            publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
            _demoContent: [{ title: '学术论文助手', content: '你是一位资深学术写作顾问。请根据以下信息帮我撰写学术论文的 **{{section}}** 部分：\n\n**研究主题：** {{topic}}\n**研究方法：** {{methodology}}\n**目标期刊：** {{journal}}\n**语言：** {{language}}\n\n## 要求\n- 使用学术规范语言\n- 包含必要的引用格式占位符\n- 逻辑清晰，论证严密\n- 段落间过渡自然\n- 符合目标期刊的风格要求', category: 'Education', tags: ['academic', 'research', 'writing'] }],
        },
        {
            gistId: 'demo-5',
            title: 'Data Analysis Interpreter',
            description: 'Transform raw data descriptions into actionable insights. Identifies trends, anomalies, and provides visualization recommendations.',
            category: 'Analysis',
            tags: ['data', 'analytics', 'insights'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 78,
            upvotes: 19,
            downvotes: 4,
            installCount: 67,
            type: 'prompt',
            language: 'en',
            variableCount: 3,
            tokenEstimate: 380,
            publishedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
            _demoContent: [{ title: 'Data Analysis Interpreter', content: 'You are a data analyst. Analyze the following dataset description and provide actionable insights.\n\n**Dataset:** {{dataset_name}}\n**Context:** {{context}}\n**Key Question:** {{question}}\n\n## Provide:\n1. **Key Findings** — Top 3-5 patterns or trends\n2. **Anomalies** — Any outliers or unexpected data points\n3. **Recommendations** — Data-driven action items\n4. **Visualization Suggestions** — Best chart types for each finding\n5. **Limitations** — Caveats and areas needing more data', category: 'Analysis', tags: ['data', 'analytics', 'insights'] }],
        },
        {
            gistId: 'demo-6',
            title: 'Creative Story Builder',
            description: 'Interactive story generation with customizable genre, setting, characters, and plot complexity. Perfect for creative writing exercises.',
            category: 'Writing',
            tags: ['story', 'creative', 'fiction'],
            author: 'prompt-ark',
            authorAvatar: '',
            qualityScore: 75,
            upvotes: 35,
            downvotes: 6,
            installCount: 143,
            type: 'prompt',
            language: 'en',
            variableCount: 6,
            tokenEstimate: 420,
            publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
            _demoContent: [{ title: 'Creative Story Builder', content: 'You are a master storyteller. Create an engaging **{{genre}}** story with the following parameters:\n\n**Setting:** {{setting}}\n**Main Character:** {{protagonist}}\n**Antagonist/Conflict:** {{conflict}}\n**Tone:** {{tone}}\n**Length:** {{length}}\n\n## Story Structure\n1. **Opening Hook** — Grab the reader in the first paragraph\n2. **Rising Action** — Build tension through 2-3 key events\n3. **Climax** — The decisive moment\n4. **Resolution** — Satisfying conclusion with a twist\n\nUse vivid sensory details, sharp dialogue, and a strong narrative voice.', category: 'Writing', tags: ['story', 'creative', 'fiction'] }],
        },
    ];
}
