# Feature Checklist: Prompt Ark v2

**Source**: README.md, v1 codebase analysis  
**Date**: 2026-03-26

## Core Features (核心功能)

### Prompt Management
- [ ] Create new prompt with title, category, content, tags
- [ ] Edit existing prompt
- [ ] Delete prompt with confirmation
- [ ] Search prompts by keyword
- [ ] Filter by category
- [ ] Filter by favorites
- [ ] Filter by most used
- [ ] Filter by recently used
- [ ] Sort by created/updated/used/title
- [ ] Variable support: `{{variable}}`, `{{lang:EN|ZH}}`, `{{style:default}}`
- [ ] Context variables: `{{@page_title}}`, `{{@page_url}}`, `{{@selection}}`

### Prompt Injection
- [ ] Picker button injection on AI platforms
- [ ] Quick Actions button injection
- [ ] Slash command support (`/keyword`)
- [ ] Variable fill modal
- [ ] One-click insert into chat box

### AI Integration
- [ ] AI provider management (add/edit/delete)
- [ ] Provider types: OpenAI-compatible, Gemini Web, Gemini API
- [ ] Prompt optimization (Concise/Enhanced/Professional variants)
- [ ] Prompt translation (7 languages)
- [ ] Smart convert text to prompt
- [ ] Auto-generate title/category/tags

### Sync & Sharing
- [ ] Chrome Sync
- [ ] GitHub Gist sync
- [ ] WebDAV sync (Jianguoyun, etc.)
- [ ] Obsidian Vault sync
- [ ] Obsidian Local sync
- [ ] Share to X/Twitter
- [ ] Share to Reddit
- [ ] Share to Zhihu
- [ ] Share to WeChat
- [ ] Share to Xiaohongshu
- [ ] Share to LinkedIn
- [ ] Pack sharing (multiple prompts)

### Import/Export
- [ ] JSON import/export
- [ ] CSV import
- [ ] Markdown import
- [ ] GitHub repo import
- [ ] URL import with AI quality scoring

### Settings
- [ ] Language switching (zh-CN/en)
- [ ] Theme (auto/light/dark)
- [ ] Default AI provider
- [ ] Sync engine configuration
- [ ] List view mode (grid/list)
- [ ] Page size
- [ ] Default sort

### Context Features
- [ ] Grab context (Ctrl+Shift+G)
- [ ] Page title/URL/selection capture
- [ ] Context variable resolution
- [ ] Right-click add to Prompt Ark
- [ ] Right-click smart convert
- [ ] Selection toolbar

### Image Prompt
- [ ] Hover image to generate prompt
- [ ] Image recognition model selection
- [ ] Copy generated prompt
- [ ] Save to Prompt Ark

### Quick Actions
- [ ] Rewrite
- [ ] Summarize
- [ ] Expand
- [ ] Translate
- [ ] Explain

## Platform Support (平台支持)

- [ ] ChatGPT
- [ ] Claude
- [ ] Gemini
- [ ] DeepSeek
- [ ] Kimi
- [ ] Doubao
- [ ] Qwen
- [ ] ChatGLM
- [ ] Hailuo AI
- [ ] Hunyuan
- [ ] Grok
- [ ] NotebookLM
- [ ] AI Studio
- [ ] Yiyan
- [ ] Perplexity

## UI Components (UI 组件)

### Sidepanel
- [ ] PromptList with cards
- [ ] SearchBar with filters
- [ ] EditModal with form
- [ ] Settings page
- [ ] Category management
- [ ] Language selector

### Popup (Image Prompt)
- [ ] Image upload
- [ ] Prompt generation
- [ ] Result display
- [ ] Copy/Save actions

### Shared Components
- [ ] Button (primary/secondary/danger)
- [ ] Input (text/textarea)
- [ ] Modal
- [ ] Dropdown
- [ ] Toast notifications

## Technical Features (技术特性)

- [ ] TypeScript strict mode
- [ ] WXT framework
- [ ] Solid.js + TailwindCSS
- [ ] Type-safe i18n
- [ ] Chrome Storage API
- [ ] Message passing protocol
- [ ] Platform adapter pattern
- [ ] Unit tests (Vitest)
- [ ] E2E tests (Playwright)

## Built-in Content (内置内容)

- [ ] 100 curated prompts (50 EN + 50 CN)
- [ ] Productivity category
- [ ] Writing category
- [ ] Coding category
- [ ] Education category
- [ ] Creative category
- [ ] Analysis category
