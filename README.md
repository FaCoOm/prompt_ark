<p align="center">
  <img src="icons/icon128.png" width="80" />
</p>

<h1 align="center">Prompt Ark</h1>

<p align="center">
  <b>Stop losing your best AI prompts.</b> Save, organize, and launch them in one click — right inside ChatGPT, Claude, Gemini, and 20+ other AI platforms.
</p>

<p align="center">
  <a href="docs/en/">📖 Docs</a> · <a href="docs/zh/">📖 中文文档</a> · <a href="#-30-second-quick-start">🚀 Quick Start</a>
</p>

---

## 😫 The Problem

You've spent hours crafting the perfect prompt. It works beautifully. But then...

- 📋 It's buried in a note app you'll never find again
- 🔄 You rewrite it from scratch every single time  
- 🤦 You paste it, then realize you forgot to change the `[topic]` placeholder
- 🚫 You can't share that killer prompt with your team without copy-pasting

**Prompt Ark fixes all of this.**

## ✨ What It Does (in 10 seconds)

| You want to... | Prompt Ark does... |
|---|---|
| **Reuse a prompt** | ✨ Click → Pick → Auto-inject into any AI chat box |
| **Customize each time** | `{{topic}}` variables become fill-in forms |
| **Quick-transform text** | ⚡ One-click Rewrite / Summarize / Translate / Expand |
| **Translate a prompt** | 🌐 Click translate on any card → Pick language → Auto-translated & saved |
| **Find that prompt you saved** | 🔍 Search, filter by category, favorites, recent |
| **Share with others** | 📦 Publish as Prompt Pack with a preview landing page |
| **Use across devices** | ☁️ Chrome Sync, GitHub Gist, or WebDAV |

## 🔌 Works Everywhere You Chat with AI

> **20+ platforms** · Custom injection for each · Chrome & Edge

ChatGPT · Claude · Gemini · NotebookLM · AI Studio · DeepSeek · Kimi · Doubao · Qwen · Grok · ChatGLM · Hailuo · Hunyuan · and more

## 🚀 Quick Start

### Step 1: Install & Pin
1. Download or clone this repo → Open `chrome://extensions/` (or `edge://extensions/`) → Enable **Developer mode** → Click **Load unpacked** → Select the project folder
2. Click the **🧩 Puzzle icon** in your toolbar → Click **📌 Pin** next to Prompt Ark

> 💡 Prompt Ark also supports **Side Panel** mode — click the extension icon to dock it as a persistent sidebar.

### Step 2: Zero Config — It Just Works
Prompt Ark ships with **Gemini Web** as the default AI backend. As long as you're logged into [gemini.google.com](https://gemini.google.com), all AI features work **immediately**:

| Feature | Status | What you do |
|---|---|---|
| ✨ Prompt Picker | ✅ Always works | Just click |
| ⚡ Quick Actions (Rewrite, Translate...) | ✅ Always works | Just click — uses the platform's own AI |
| 🔮 AI Prompt Optimization | ✅ Works by default | Be logged into Gemini |
| 🏷️ Auto-extract title/category/tags | ✅ Works by default | Save a prompt without filling in a title |

> 💡 No API key. No setup wizard. Just install and use.
>
> Want faster responses or a specific model? Go to **Settings → Models → +** to add your own provider (Gemini API / OpenAI Compatible). See [Model Configuration](docs/en/02-model-configuration.md).

### Step 3: Create Your First Prompt
1. Click the **Prompt Ark icon** to open the Dashboard
2. Click the blue **+ New** button
3. Write your prompt content — use `{{topic}}` or `{{language}}` to create **dynamic variables**
4. Click **Save**. Leave the title blank to let AI auto-generate a title, category, and tags!
5. Click **Preview** to check the Markdown rendering

### Step 4: Use It on AI Platforms
Open [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com) or any supported platform. You'll see two new buttons next to the chat input:

| Button | What it does |
|---|---|
| **✨ Picker** | Browse your prompt library → Select → Auto-inject into chat box |
| **⚡ Quick Actions** | One-click Rewrite / Summarize / Translate / Expand / Explain |
| **`/slash`** | Type `/keyword` in the chat box for instant prompt expansion |
| **`Ctrl+Shift+P`** | Global keyboard shortcut to summon the Picker overlay |
| **Right-click** | Select any text → "Add to Prompt Ark" to save it instantly |

### Step 5: Sync Across Devices (Optional)
Go to **Settings → Sync** and choose your sync engine:

| Method | Best for |
|---|---|
| **Chrome Sync** (default) | Zero config, automatic, ~100KB limit |
| **GitHub Gist** | Unlimited storage, team sharing |
| **WebDAV** | Self-hosted, privacy-first (e.g., Jianguoyun) |

> 📚 **[Full Documentation →](docs/en/)** for more details on every feature.


## ⚡ Power Moves

### One-click text transforms
The **⚡** button appears next to every AI chat input. Click it to instantly:

**✏️ Rewrite** · **📋 Summarize** · **➕ Expand** · **🌐 Translate** · **💡 Explain**

> No API key needed — these use the platform's own AI.

### Dynamic variables
Write `{{language}}` or `{{topic}}` in your prompt. When you use it, a form pops up so you fill in the blanks. Every time.

### Slash commands  
Type `/email` in any chat box → Your "Professional Email Writer" prompt expands instantly. Like text shortcuts, but for AI.

### AI Prompt Optimizer
Click ✨ Optimize on any prompt → Get 3 professional rewrites (Concise / Enhanced / Professional) with diff view. Accept with one click.

### AI Prompt Translation
**Translate any saved prompt** into 7 languages with one click — directly from the prompt list or the edit modal.

- Click the **🌐** button on any prompt card in the list
- Choose: English · 中文 · 日本語 · Español · Français · Deutsch · 한국어
- The title, category, tags, and content are all translated and **auto-saved**
- If your Gemini session expires, the login page opens automatically

> Uses your configured AI provider (Gemini Web by default — no API key needed).

### Right-click to save
See a great prompt on a webpage? Select text → Right-click → **"Add to Prompt Ark"**. It's saved with AI-generated title, category, and tags.

### Page-aware prompts
Use `{{page_title}}`, `{{selected_text}}`, `{{page_url}}` in your prompts — they auto-fill with the current page's content.

## 📚 100 Built-in Prompts, Ready to Go

Don't start from zero. Prompt Ark ships with **100 curated prompts** (50 English + 50 Chinese):

| Category | Examples |
|---|---|
| 💼 Productivity | Meeting notes, email drafts, SWOT analysis |
| ✍️ Writing | Blog outlines, copywriting, proofreading |
| 💻 Coding | Code review, debugging, SQL generation |
| 🎓 Education | Concept explainer, quiz generator, study plans |
| 🎨 Creative | Storytelling, brainstorming, naming |
| 📊 Analysis | Data interpretation, market research |

## ☁️ Your Data, Your Way

| Method | Best for |
|---|---|
| **Chrome Sync** (default) | Automatic, zero config, works across Chrome instances |
| **GitHub Gist** | Unlimited storage, version history, share with team |
| **WebDAV** | Self-hosted, privacy-first users (e.g., Jianguoyun) |

Full JSON export/import. URL import from GitHub repos with AI quality scoring.

## 🛠 For Developers

- **Manifest V3** — `storage`, `contextMenus`, `scripting`, `sidePanel`, `cookies`
- **Deep DOM traversal** — Shadow DOM, React fiber bypass, per-platform injection
- **Zero-config AI** — Gemini Web session as default; auto-redirects to login on session expiry; explicit cookie handling for Edge
- **Runtime i18n** — Live Chinese/English switching
- **Auto-save** — 600ms debounce across all settings

## 📄 License

MIT © 2026 Prompt Ark Team
