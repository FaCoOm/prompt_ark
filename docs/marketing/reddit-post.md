# Reddit Post: r/ChatGPT, r/ClaudeAI, r/artificial, r/productivity

---

## Title Options (pick one):

1. I built a free browser extension that adds a ✨ button next to every AI chat input — it lets you save, organize, and one-click inject your prompts across 14 platforms
2. I got tired of rewriting the same prompts every day, so I built an open-source prompt manager that injects directly into ChatGPT, Claude, Gemini, and 11 other platforms
3. [Open Source] Prompt Ark — a browser extension that adds prompt shortcuts directly inside ChatGPT, Claude, DeepSeek, and 11 more AI platforms

---

## Post Body:

Hey everyone 👋

I've been using AI platforms daily — ChatGPT for writing, Claude for code review, DeepSeek for Chinese queries, Gemini for research. After a few months I realized I was spending a stupid amount of time on one thing:

**Rewriting the same prompts over and over.**

I'd craft a great prompt, get perfect results, and then... never find it again. It'd be buried in some note app, or a random browser tab, or a WeChat message I sent to myself at 2am.

So I built **Prompt Ark** — a browser extension that puts your prompt library right where you need it: **next to the chat input.**

### What it actually does

When you open ChatGPT (or Claude, Gemini, DeepSeek, etc.), you'll see two new buttons next to the text box:

- **✨** — Opens your prompt library. Pick one → it gets injected directly into the input. No copy-paste.
- **⚡** — Quick actions: one-click Rewrite / Summarize / Translate / Expand / Explain. Uses the platform's own AI, no API key needed.

### Why it's different from other prompt managers

Most tools make you: open the tool → find prompt → copy → switch back to ChatGPT → paste. Five steps.

Prompt Ark: click ✨ → select → done. The button is already there, right next to where you type.

### Some features I'm proud of:

- **14 platform-specific integrations** — Not just "works on ChatGPT." Each platform (ChatGPT, Claude, Gemini, NotebookLM, DeepSeek, Kimi, Doubao, Qwen, Grok, etc.) has custom injection logic. ChatGPT uses ProseMirror, Gemini uses React-managed textareas, NotebookLM hides inputs in Shadow DOM. Each needed different code.

- **`{{variables}}`** — Write `{{topic}}` or `{{language}}` in your prompt, and a form pops up when you use it. Same template, different inputs every time.

- **`/slash` commands** — Type `/email` in any chat box and your "Email Writer" prompt expands inline. Like text expansion but for AI.

- **AI Prompt Optimizer** — Click ✨ Optimize on any prompt → get 3 rewrites (Concise / Enhanced / Professional) with a line-by-line diff view. One-click accept.

- **100 built-in prompts** — Not filler. Each one has structured output format, negative constraints ("Do NOT give generic advice"), and `{{variables}}`. Categories: Productivity, Writing, Coding, Education, Creative, Analysis.

- **Page context variables** — Use `{{page_title}}`, `{{selected_text}}` in your prompts. They auto-fill with the current page content. Works cross-tab.

- **Right-click to save** — Select text on any webpage → right-click → "Add to Prompt Ark." AI auto-generates title, category, and tags.

### Zero config

It ships with Gemini Web as the default AI backend. If you're logged into gemini.google.com, all AI features (optimization, auto-categorization) work immediately. No API key needed.

Want to use your own GPT-4o or DeepSeek API? Just add it in settings.

### Sync

- Chrome Sync (default, automatic)
- GitHub Gist (unlimited, shareable)
- WebDAV (self-hosted, privacy-first)

### Links

- **GitHub**: [github.com/keyonzeng/prompt_ark](https://github.com/keyonzeng/prompt_ark)
- **License**: MIT (fully free and open source)
- **Works on**: Chrome & Edge

### What I'm looking for

Honest feedback. What features would make you actually use this daily? What's missing? What's unnecessary?

Also happy to answer any technical questions about the injection approach — getting text into 14 different chat UIs was... an adventure.

---

## Suggested subreddits:

| Subreddit | Angle |
|---|---|
| r/ChatGPT | Focus on ChatGPT integration, Quick Actions, /slash commands |
| r/ClaudeAI | Focus on Claude integration, prompt templates with variables |
| r/artificial | General AI productivity tool, open source |
| r/productivity | Focus on time saved, workflow automation, 100 built-in prompts |
| r/opensource | Technical details, architecture, contribution welcome |
| r/browsers | Browser extension, Chrome & Edge, Manifest V3 |

## Tips for Reddit:

- Post during US morning (9-11am EST) for best visibility
- Reply to EVERY comment in the first 2 hours
- Don't crosspost — write slightly different posts for each subreddit
- If mods remove it, message them politely and offer to adjust
- Follow up with a "1 month update" post showing changes based on feedback
