# Everything You Can Do

## 🎯 The Essentials (Start Here)

### ✨ Prompt Picker — Your Library at Your Fingertips
On any supported AI platform, click the **✨** button next to the chat input.
- Search, browse by category, preview in Markdown
- Contains 100 built-in prompts out of the box
- If a prompt has `{{variables}}`, you'll get a fill-in form before injection

### ⚡ Quick Actions — One-Click Text Transform
Click the **⚡** button on any chat input:

| Action | What it does |
|---|---|
| ✏️ Rewrite | Polish and improve |
| 📋 Summarize | Extract key points |
| ➕ Expand | Add detail and depth |
| 🌐 Translate | Translate to English |
| 💡 Explain | Simplify into plain language |

> These work **without any API key** — they inject an instruction into the chat and let the platform's own AI handle it.

### `/slash` Commands — Even Faster
Type `/` + keyword in any chat box. A dropdown appears with matching prompts. Select one to expand it inline — no popup needed.

---

## 🔧 Power User Features

### Dynamic Variables — 3 Forms
Prompt Ark supports three kinds of variables that turn into interactive fill-in controls:

| Syntax | UI control | When to use |
|---|---|---|
| `{{Topic}}` | Free-text input | Any open-ended value |
| `{{lang:EN\|ZH\|JP}}` | Dropdown (enum) | Fixed set of options |
| `{{style:formal}}` | Pre-filled text | Sensible default, user can change |

### Prompt Taxonomy
Prompt Ark uses structured prompt-engineering metadata to organize prompts. Each prompt can carry:

| Metadata | What it does |
|---|---|
| **Output modality** | Marks a prompt as text, image, or video |
| **System category** | 10 stable domains: General & Productivity, Writing & Editing, Marketing & Brand, Sales & Support, Business & Operations, Research & Learning, Coding & Development, Data & Analytics, Design & Visual, Creative & Media |
| **Custom category** | Your own reusable labels |
| **AI recommendation** | Suggested when saving, importing, or using Smart Convert |
| **Review state** | Low-confidence classifications are marked for confirmation |

When editing a prompt, switch between **System Categories / Custom Categories / New**. Prompts that need review show a category review prompt; you can keep the current category, accept the AI recommendation, or choose your own.

### Context Variables (`{{@...}}`)
Auto-resolve from the current browser tab — no copy-paste needed:

| Variable | Resolves to |
|---|---|
| `{{@page_title}}` | Current tab's title |
| `{{@page_url}}` | Current tab's URL |
| `{{@selection}}` | Highlighted text on the page |
| `{{@page_text}}` | Full visible text content of the page |
| `{{@date}}` | Today's date (YYYY-MM-DD) |
| `{{@lang}}` | Your configured UI language |

> `{{@...}}` variables always resolve from the current tab when the prompt runs.

### AI Prompt Optimizer
Edit any prompt → Click **✨ Optimize** → Get 3 rewrites:
1. **Concise** — Minimal, essential only
2. **Enhanced** — Adds constraints and format
3. **Professional** — Full role + chain-of-thought scaffolding

Side-by-side diff view. One-click accept or reject.

### 🌐 AI Prompt Translation
Translate any saved prompt into 7 languages with one click:
1. Click the **🌐 globe** button on any prompt card in the list
2. Or open the edit modal and use the **Translate** section
3. Choose your target language: English · 中文 · 日本語 · Español · Français · Deutsch · 한국어
4. The title, category, tags, and content are all translated and **auto-saved**

> Preserves `{{variables}}`, markdown formatting, and technical terms. Uses Gemini Web by default (no API key needed). If your Gemini session expires, the login page opens automatically.

### 🪄 Smart Convert
Select any text on a webpage → Right-click → **"Smart Convert to Prompt"**.

The AI (via your active provider) analyzes the text to infer intent, craft a full role + task description, extract entities as `{{variables}}`, and auto-save the result as a reusable prompt with title, category, and tags.

> Works with Gemini Web by default (no API key). Best for turning articles, reports, or example outputs into templates. The generated prompt also includes title, output modality, system/custom category recommendation, and tags.

### Right-Click Quick Save
Select text on any webpage → Right-click → **"Add to Prompt Ark"**. AI auto-generates a title, output modality, category, and tags.

### Keyboard Shortcut
`Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) summons the Picker anywhere.

### Grab Context (`Ctrl+Shift+G`)
Turns the current page (title, URL, highlighted text, full page text) into a Smart Convert prompt card and stores that page as the card's `sourceContext` for traceability.

> On Mac: `Cmd+Shift+G`

### Version History & Rollback
Every edit auto-archives the previous version. Click **History** to browse, diff, and restore any past version.

### Favorites & Smart Filters
- ❤️ Heart icon to bookmark a prompt
- Sidebar filters: **All** · **Favorites** · **Recent** · **Most Used**

---

## 📦 Sharing & Community

### Share a Prompt
Click share → Publish to **Prompt Hub** → Get a landing page link. Then share with AI-generated platform-optimized text:

| Platform | Content style |
|---|---|
| **Twitter** | Concise tweet with hashtags |
| **Reddit** | Structured post title + body in Markdown |
| **Zhihu (知乎)** | Long-form article in Chinese |
| **WeChat (微信)** | Mobile-friendly WeChat article |
| **Xiaohongshu (小红书)** | Short-form with emoji and tags |

> Hub publishing requires logging into your Prompt Ark account.

### Prompt Packs
Select multiple prompts → Pack Mode → Publish as a bundled collection.

> Prompt Packs also publish through Prompt Hub and require account login.

---

## 📥 Import Prompts

### Paste Import
Paste raw text or JSON directly into the import tab.

### URL Import
Enter a file URL or a GitHub repo/folder URL. Prompt Ark:
1. Scans supported content and parses prompts
2. Scores each with AI quality analysis
3. Lets you filter by minimum quality score

> 💡 When importing a GitHub link, you can add a GitHub Token in the URL import tab to reduce rate limits (5000 req/hr vs 60).

---

## 🧩 Extras

### Page Context Variables
See the **Context Variables (`{{@...}}`)** section above for the full list of auto-resolved variables (`{{@page_title}}`, `{{@page_url}}`, `{{@selection}}`, `{{@page_text}}`, `{{@date}}`, `{{@lang}}`).

### Side Panel Mode
Prompt Ark can run as a **Side Panel** docked to the browser edge. Click the toolbar icon to toggle.

### 100 Built-in Prompts
50 English + 50 Chinese, covering: General & Productivity · Writing & Editing · Marketing & Brand · Sales & Support · Business & Operations · Research & Learning · Coding & Development · Data & Analytics · Design & Visual · Creative & Media
