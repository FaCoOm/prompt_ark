# Prompt Ark - Comprehensive API Feature Analysis

**Generated:** 2026-05-16
**Version:** 1.0.1 (manifest.json:4)
**Manifest:** MV3 service worker (manifest.json:57-60)
**Branch:** main @ 972dd3a

## 1. Scope and Boundaries

**In scope (verified by source reads):**
- Authored MV3 extension code: `manifest.json`, `background.js` (1642 lines), `content.js` (2871 lines), `popup.js` (~5800 lines, sampled), `popup.html`, `image-prompt.html`/`image-prompt.js`, every file under `lib/`.
- Manifest permissions, host permissions, content scripts, commands, side panel, action.
- Message routing tables (`background.js` central dispatcher + content-script handler + port-based stream channel).
- Web-API-driven AI provider drivers in `lib/*-web.js` and the unified dispatcher in `lib/ai/provider.js`.
- Supabase Hub client (`lib/supabase/client.js`) and WebDAV/Obsidian sync (`lib/storage.js`, `lib/webdav-client.js`).
- Page-context hooks installed by `content.js` (fetch / XHR / postMessage on doubao.com).

**Excluded:**
- Bundled / minified third-party files: `lib/marked.min.js`, `lib/lz-string.min.js`, `lib/deepseek-wasm.js` (treated as opaque).
- Locale data and prompt markdown content (`_locales/`, `prompts/*.md`, `locales.js`) - data, not capability surface.
- Documentation under `docs/` and `doc/`.

**Note on indirection:** `chrome.runtime.onMessage` is registered twice in `background.js` - once at line 56 (Hub auth sync only, isolates `PROMPT_ARK_AUTH_SYNC`) and once at line 458 (the main `handleMessage` switch). Both fire for every message; ordering depends on registration time.

## 2. Entrypoints and Runtime Shape

| File | Runtime | Role |
|---|---|---|
| `manifest.json` | declarative | MV3 manifest. Declares permissions, content scripts, side panel, popup, commands, web-accessible resources |
| `background.js` | service worker (`type: "module"`) | Central dispatcher. Imports 30+ modules from `lib/`. Owns 50+ message handlers, context menus, keyboard commands, install/startup hooks, port-based video-prompt stream |
| `content.js` | content script @ `document_start` on `<all_urls>` | UI injector (Picker, slash dropdown, selection toolbar). Per-platform DOM injection. Page-context fetch/XHR hooks on doubao.com. Handles 19 inbound message types. Bridges Hub `postMessage` to extension |
| `popup.html` / `popup.js` | extension page (popup + side panel) | Dashboard UI. Same file serves both action popup and `chrome.sidePanel`. Communicates with background via `sendMessage` (~25 distinct types) |
| `image-prompt.html` / `image-prompt.js` | web-accessible iframe | Embedded image-prompt UI. Loaded by content.js via `chrome.runtime.getURL` for image hover prompts |
| `lib/marked.min.js` | content script (loaded before `content.js`) | Markdown rendering, third-party. Excluded from inventory |
| `lib/<provider>-web.js` (12 files) | imported by service worker | Reverse-engineered drivers calling AI provider web sessions directly (no API keys) |
| `lib/supabase/*` | imported by service worker | Supabase REST client for the Hub (publish, fetch, taxonomy sync) |
| `lib/webdav-client.js` | imported by service worker | Lightweight WebDAV client (GET/PUT/MKCOL with Basic Auth). Used for both raw sync blob and Obsidian Vault per-file `.md` sync |

**Imports at SW startup** (`background.js:3-44`): 30+ ES modules, including all 12 web-provider drivers and the Supabase client. The service worker eagerly preloads every prompt file (`background.js:48`).

## 3. Manifest Permissions

### 3.1 Declared `permissions` (manifest.json:7-17)

| Permission | Code Evidence | Purpose |
|---|---|---|
| `storage` | `chrome.storage.local` (55 sites), `chrome.storage.sync` (24 sites), `chrome.storage.session` (3 sites) | Dual-layer prompt persistence (`lib/storage.js:9-37`); slim sync + full local |
| `unlimitedStorage` | implicit | Lifts the 5MB local quota for prompt history/versions |
| `activeTab` | `chrome.tabs.query({ active: true, currentWindow: true })` (e.g. `background.js:1582`) | Used by command handlers to target the active tab |
| `scripting` | `chrome.scripting.executeScript` (10 sites, e.g. `lib/context-menu.js:180,356,403,491,566,646,684`) | Injects fallback toast UI when content script is missing or fails |
| `contextMenus` | `chrome.contextMenus.create` (`lib/context-menu.js:209-211, 254, 261, 274, 281, 293, 307`); `chrome.contextMenus.onClicked` (`background.js:1600`); `chrome.contextMenus.removeAll` (`lib/context-menu.js:251`) | "Add to Prompt Ark", "Smart Convert", per-prompt list, "Share Article to..." |
| `sidePanel` | `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` (`background.js:51-53`) | Toolbar click opens persistent side panel instead of popup |
| `cookies` | `chrome.cookies.getAll` (9 sites: `lib/gemini-web.js:43`, `lib/web-provider-utils.js:30,39,50,59`, plus 4 in other web drivers) | Edge/non-Chrome SW compat - explicit `Cookie` header for cross-origin web-session fetches |
| `tabs` | `chrome.tabs.create` (17), `.query` (21), `.sendMessage` (32), `.update` (1), `.get` (1), `.onActivated` (2), `.onUpdated` (9) | New-tab dispatch, broadcast-to-all-tabs, context-menu rebuild on tab change |
| `notifications` | `chrome.notifications.create` (7 sites in `background.js`) | Hub publish results, pending-intent resume notifications |

### 3.2 Host Permissions (manifest.json:18-50)

26 explicit AI-platform origins plus `<all_urls>`. Significant:
- **`<all_urls>`** - required for `content_scripts.matches: ["<all_urls>"]` (manifest.json:75-77) and the `web_accessible_resources` matches.
- `https://generativelanguage.googleapis.com/*` - direct Gemini API calls (`background.js:468`, `lib/ai/provider.js:232`).
- All 13 AI-platform origins (gemini, claude, chatgpt, deepseek, kimi, doubao, qwen, grok, glm, hailuo, tongyi, hunyuan, etc.) - paired with web-session reverse-engineered drivers under `lib/<name>-web.js`. Cookies are read via `chrome.cookies.getAll` for Edge SW compatibility (`lib/web-provider-utils.js:18-92`).

### 3.3 Permission drift / risks

- **`<all_urls>` is broad.** Required because content.js runs on every page (Picker, slash, selection toolbar). Documented in README "Works Everywhere You Chat with AI."
- **`activeTab` is partially redundant** given `tabs` is already declared; both remain in manifest.
- **`chrome.permissions` API is not used** at all - the extension does not request permissions at runtime.

## 4. Chrome Extension APIs

### 4.1 chrome.runtime

| Method | File | Line(s) | Purpose |
|---|---|---|---|
| `getManifest` | background.js | 2 | Version banner at SW boot |
| `getPlatformInfo` | lib/ai/provider.js | 53 | Used as keep-alive ping (every 25s) to extend SW lifetime during long AI calls |
| `getURL` | (3 sites) | - | Resolve `image-prompt.html` for iframe injection |
| `onInstalled` | background.js | 317, 1614 | Seeds default prompts (line 317), rebuilds context menus (line 1614) |
| `onStartup` | background.js | 1615 | Rebuilds context menus on browser restart |
| `onConnect` | background.js | 429 | Long-lived port "video-prompt" - keeps SW alive for streaming video-prompt generation. Re-entrant: monkey-patches `chrome.runtime.sendMessage` to redirect `VIDEO_PROMPT_PROGRESS` events to the port (`background.js:436-443`) |
| `onMessage` (registered twice) | background.js | 56, 458 | First listener handles only `PROMPT_ARK_AUTH_SYNC`; second is the central `handleMessage` dispatcher with 50 cases |
| `sendMessage` | (85 sites) | - | Used by content.js → background, popup → background, and broadcasts. Highest-traffic API in the codebase |
| `connect` | (1 site) | - | popup.js side - establishes `video-prompt` port |
| `lastError` | (6 sites) | - | Defensive checks in callback-style chrome calls |

### 4.2 chrome.tabs

| Method | Sites | Purpose |
|---|---|---|
| `create` | 17 | Open AI-platform tabs (`openPromptInDefaultAI` at `lib/context-menu.js:90`); open share URLs (twitter/reddit/linkedin: `background.js:207-214`); open Hub publish-result page |
| `sendMessage` | 32 | Inbound delivery of `INSERT_PROMPT`, `COPY_TO_CLIPBOARD`, `RUN_CONTEXT_MENU_PROMPT`, `IMAGE_PROMPT_SETTINGS_CHANGED`, etc. Used in `broadcastPromptsUpdated` (`background.js:271-286`) which iterates all tabs |
| `query` | 21 | Find active tab (commands, share-text injection); enumerate all tabs for broadcast |
| `update` | 1 | Used in deferred prompt delivery flow |
| `get` | 1 | `lib/context-menu.js:165` - check tab status before sending prompt |
| `onActivated` | 2 | `background.js:1617` - rebuild context menus when active tab changes |
| `onUpdated` | 9 | `background.js:1621` - rebuild on URL change/page load; `lib/context-menu.js:162` - retry-deliver pending prompt when target AI tab finishes loading |

### 4.3 chrome.storage

**Architecture (`lib/storage.js:9-37`):** Dual-layer.
- `chrome.storage.sync` - slim prompt records (core fields only) for cross-device sync. Per-prompt key `prompts_<id>`, chunked at 6000 bytes (`MAX_CHUNK_BYTES`) to stay under the 8192 byte/key quota.
- `chrome.storage.local` - full prompt data (versions, usage stats), all settings, all encrypted API keys, Hub auth tokens, sync config.
- `chrome.storage.session` (3 sites) - transient flags only.

| Surface | Sites | Notable Keys |
|---|---|---|
| `chrome.storage.local.set/get/remove` | 55 | `prompts`, `providers`, `activeProviderId`, `language`, `imagePrompt`, `defaultPlatform`, `accessToken`/`refreshToken`/`expiresAt`/`hubUser`, `pendingIntent`, `pendingPromptReveal`, `sync_backend`, `webdavUrl`/`User`/`Password`, `obsidianWebdavUrl`/`User`/`Password`/`obsidianFolder`, `githubToken` |
| `chrome.storage.sync.set/get/remove` | 24 | Slim prompt chunks via `lib/storage.js` |
| `chrome.storage.onChanged` | 3 sites | `background.js:1635-1641` - rebuild context menus when sync prompts or local language change |

**Encryption boundary** (`lib/crypto.js`, used in `lib/ai/provider.js:64-79`): all `apiKey` fields are encrypted at rest via `encrypt()`/`decrypt()` (key derived from extension ID).

### 4.4 chrome.scripting

| Method | Sites | Purpose |
|---|---|---|
| `executeScript` | 10 | Fallback toast injection when content script is unavailable or unresponsive. Always called with inline `func` (no remote code) and string args (`lib/context-menu.js:180-198, 356-368, 403-414, 491-503, 566-578, 646-657, 684-698`) |

**Pattern:** every `chrome.scripting.executeScript` call is wrapped in a `try/catch` that first attempts `chrome.tabs.sendMessage` and only falls through to scripting injection if the message fails. This is a graceful-degradation pattern for pages where the content script has not yet booted (e.g. CSP-blocked frames).

### 4.5 chrome.contextMenus

| Method | File | Line(s) | Purpose |
|---|---|---|---|
| `removeAll` | lib/context-menu.js | 251 | Always called before rebuild to avoid duplicate-id errors |
| `create` | lib/context-menu.js | 254, 261, 274, 281, 293, 307 (via `createMenu` wrapper at line 209) | Top-level "Add to Prompt Ark", "Smart Convert"; per-prompt items under "Prompts List"; "Share Article to..." with 6 platform sub-items |
| `onClicked` | background.js | 1600 | Delegates to `handleContextMenuClick` in `lib/context-menu.js:327` |

**Concurrency control** (`lib/context-menu.js:204-238`): `buildContextMenus` queues concurrent calls via a promise chain (`_buildMenusChain`) and a `_buildMenusPending` flag, preventing the dropped-call race that affects the chrome.contextMenus API.

### 4.6 chrome.cookies

| Site | Purpose |
|---|---|
| `lib/web-provider-utils.js:30, 39, 50, 59` | `getCookieHeader(domain, url)` - tries 4 cookie-fetch strategies: by URL, by domain, by domain-without-leading-dot, and a global filter. Used by all web-session drivers |
| `lib/gemini-web.js:43` | Specific `chrome.cookies.getAll({ domain: '.google.com', url: 'https://gemini.google.com' })` |

**Why explicit cookies:** `chrome.cookies` is needed because Edge's MV3 service worker does not always include credentials on cross-origin `fetch()` even with `credentials: 'include'`. The drivers manually attach a `Cookie` header.

### 4.7 chrome.notifications

7 sites, all in `background.js` (e.g. lines 131, 141, 157, 230, 243). All use `type: 'basic'` with `iconUrl: 'icons/icon128.png'` and i18n-resolved title/message. Triggered by `handlePendingIntent` flow (post-Hub-login resume) and by `PUBLISH_TO_HUB` results.

### 4.8 chrome.commands

Single registration at `background.js:1580`. Three commands declared in manifest.json:93-115:

| Command | Default Shortcut | Action |
|---|---|---|
| `open-picker` | Ctrl+Shift+P | Sends `TOGGLE_PICKER` to active tab |
| `grab-context` | Ctrl+Shift+G | Sends `GRAB_CONTEXT` to active tab → triggers Smart Convert with page metadata |
| `share-article` | Ctrl+Shift+Y | Sends `SHOW_ARTICLE_SHARE_PICKER` to active tab |

All three handlers reject non-`http(s)` tabs (`background.js:1583, 1588, 1593`).

### 4.9 chrome.sidePanel

Single use at `background.js:51-53`: `setPanelBehavior({ openPanelOnActionClick: true })` makes the toolbar action open the side panel. The same `popup.html` is used as both action popup default and `side_panel.default_path` (manifest.json:62, 65).

### 4.10 chrome.action

Declarative only - `default_popup`, `default_title`, `default_icon` (manifest.json:64-72). No runtime API calls (no `chrome.action.setBadgeText`, etc.).

### 4.11 chrome.windows

Single use at `background.js:1628`: `onFocusChanged` listener that rebuilds context menus when window focus actually changes (skips `WINDOW_ID_NONE` defocus events).

### 4.12 chrome.i18n

| Method | Sites | Purpose |
|---|---|---|
| `getMessage` | 26 | Resolves toast/notification strings; falls through to inline default string when key missing |
| `getUILanguage` | 9 | Bootstrap-time locale detection (zh_CN if browser is zh*, else en). Used as default by `getCurrentLocale` (`background.js:90-93`) |

**Hybrid i18n model:** the extension declares a default locale in manifest (`zh_CN`) and ships `_locales/en` and `_locales/zh_CN` for `__MSG_*` placeholders, but runtime UI strings are resolved via the in-process `translations` dictionary (`locales.js`) plus a `language` override in `chrome.storage.local`. `chrome.i18n.getMessage` is used only for notification text where in-process translations are not available.

### 4.13 chrome.debugger

**Not used.** Despite the README mentioning "Manifest V3" and "Deep DOM traversal", there is no `chrome.debugger` API usage anywhere in the codebase. Automation is achieved via content-script DOM manipulation, not CDP.

### 4.14 chrome.downloads

**Not used.** No `chrome.downloads` calls. Export/import flows use `chrome.tabs.sendMessage` → content script → `navigator.clipboard.writeText` (line `content.js:1782`) or generated download links built in popup.

## 5. Chrome Debugger Protocol (CDP) Commands

**No CDP usage found.** This extension does not declare `debugger` permission and does not call `chrome.debugger.attach` / `sendCommand` / `detach`. All page automation is done via:

- Per-platform DOM input element discovery (`content.js` - extensive React-fiber bypass and shadow-root traversal logic, lines ~600-900)
- `document.execCommand('insertText', ...)` (`content.js:673`)
- `InputEvent` dispatch with `inputType: 'insertText'` (`content.js:683-732`)
- Direct value assignment + `input` event dispatch as fallback

This is **content-script automation, not debugger-based automation**.

## 6. Web APIs Intercepted / Hooked

### 6.1 `window.fetch` and `XMLHttpRequest.prototype.open` - scoped to doubao.com

**Location:** `content.js:5-127` (gated by `if (window.location.hostname.includes('doubao.com'))`).

| Hook | Site | Behavior |
|---|---|---|
| `window.fetch` override | content.js:37-53 | Intercepts every fetch on doubao.com. Calls `extractTokensFromUrl` to harvest `msToken`, `a_bogus`, `fp`, `tea_uuid`, `device_id`, `web_tab_id`, `aid`, `version_code`, `pc_version`, `region`, `language` from URL search params. Stores them on `window.__DOUBAO_DYNAMIC_TOKENS`. Falls through to original fetch unchanged |
| `XMLHttpRequest.prototype.open` override | content.js:58-69 | Same token extraction for legacy XHR-based requests on doubao.com |
| `localStorage.getItem('msToken')` | content.js:75-81, 92-100 | Bootstrap fallback when no fetch has fired yet |

**Scope:** strictly conditional on hostname. No global intercept on other AI sites - those use `chrome.cookies` instead.

### 6.2 `window.postMessage` bridge (Hub auth + a_bogus generation)

**Hub auth sync (extension <-> Hub web app):** `content.js:1105-1127`
- Listens for `window.message` events from the Hub web app and forwards `PROMPT_ARK_AUTH_SYNC` payloads to background via `chrome.runtime.sendMessage`. Background listener at `background.js:56-85` writes tokens into `chrome.storage.local` and initializes Supabase.
- Sends `PROMPT_ARK_AUTH_SYNC_REQUEST` postMessage outward to ask the Hub for current auth state.
- Sends `PROMPT_ARK_IMPORT_SUCCESS` / `PROMPT_ARK_IMPORT_FAILURE` back to the Hub source window after import completes (`content.js:1171, 1177`).

**Doubao a_bogus generation:** `content.js:131-225`
- Injects an inline `<script>` element that calls `window.byted_acrawler.frontierSign(queryString)` (page-context only function).
- The injected script uses `window.postMessage({ type: 'PROMPT_ARK_ABOGUS_RESULT', ... }, '*')` to return signed tokens to the content-script realm.
- Cleanup: removes both the script tag and the listener; falls back after 5s timeout.

This is the **only** code path that bridges page-context script execution back into the extension.

### 6.3 MutationObserver (DOM lifecycle)

| Site | Purpose |
|---|---|
| content.js:268, 1253 | DOM observation for image-prompt buttons and AI input element detection (re-injects buttons when SPA navigation rebuilds the DOM) |

### 6.4 Page-context state harvesting from content.js

When background asks content.js for AI-platform credentials, content.js reads page state directly:

| Message | Source of truth | Site |
|---|---|---|
| `GET_KIMI_TOKEN` | `localStorage.getItem('access_token'/'refresh_token')` | content.js:1785-1800 |
| `GET_DEEPSEEK_TOKEN` | `localStorage.getItem('userToken')` (JSON-shaped) | content.js:1802-1824 |
| `GET_QWEN_CN_XSRF` | `<meta name="x-xsrf-token">`, `XSRF-TOKEN` cookie, `b-user-id` cookie, `window.__INITIAL_STATE__`, `localStorage`, `sessionStorage` (4-tier fallback) | content.js:1826-1879 |
| `GET_DOUBAO_TOKENS` | `window.__DOUBAO_DYNAMIC_TOKENS` (from the fetch interceptor above) | content.js:1881-1903 |

This pattern is the bridge that lets the SW-side web-provider drivers reach platform-specific tokens that `chrome.cookies` cannot see.

## 7. Message Routing and Control Flow

### 7.1 Background dispatcher (`background.js:517-1561`)

Single `switch (message.type)` over 50 cases. Direct evidence (line: case):

```
521: GET_PROMPTS                  662: UPDATE_PROMPT             1338: TOGGLE_FAVORITE
537: GET_IMAGE_PROMPT_SETTINGS    741: DELETE_PROMPT             1349: GET_PROMPT_HISTORY
541: SAVE_IMAGE_PROMPT_SETTINGS   748: EXPORT_PROMPTS            1356: RESTORE_PROMPT_VERSION
553: GENERATE_SKILL               752: IMPORT_PROMPTS            1381: BATCH_RENAME_CATEGORY
572: GET_SKILLS                   840: LANGUAGE_CHANGED          1393: GET_DEFAULT_PLATFORM
576: PUSH_SKILL                   858: AUTO_EXTRACT              1399: SET_DEFAULT_PLATFORM
587: DELETE_SKILL                 864: GENERATE_VIDEO_PROMPT     1405: GET_SYNC_USAGE
595: SAVE_PROMPT                  865: GENERATE_YOUTUBE_PROMPT   1411: SHARE_PROMPT
                                  877: QUICK_ADD_SELECTION       1422: CHECK_HUB_LOGIN
                                  941: SMART_CONVERT_SELECTION   1442: GET_GITHUB_TOKEN
                                 1079: OPTIMIZE_PROMPT           1448: SAVE_GITHUB_TOKEN
                                 1106: GENERATE_TEXT             1454: GET_SYNC_SETTINGS
                                 1121: TRANSLATE_PROMPT          1470: SAVE_SYNC_SETTINGS
                                 1152: GET_PROVIDERS             1487: FORCE_WEBDAV_SYNC
                                 1159: SAVE_PROVIDERS            1488: FORCE_OBSIDIAN_SYNC
                                 1168: GET_SHORTCUTS             1502: FORCE_HUB_TAXONOMY_SYNC
                                 1205: GENERATE_SHARE_TEXT       1513: PUBLISH_TO_HUB
                                 1218: SHARE_TO_PLATFORM         1524: PUBLISH_PROMPTS_TO_HUB
                                 1230: ARTICLE_SHARE_TO_PLATFORM 1525: PUBLISH_PACK_TO_HUB
                                 1277: OPEN_PROMPT_IN_DEFAULT_AI 1536: GET_PENDING_DOUBAO_PROMPT
                                 1289: COMPOSE_PROMPT            1546: CLEAR_PENDING_DOUBAO_PROMPT
                                 1311: TRACK_USAGE
                                 1556: default → "Unknown message type"
```

The dispatcher is wrapped in a try/catch at line 1559 that returns `{ success: false, error }` on any throw, so client errors never crash the SW.

### 7.2 Content-script dispatcher (`content.js`)

19 inbound message types, e.g.:

| Line | Type | Purpose |
|---|---|---|
| 1578 | `INSERT_PROMPT` | Inject prompt text into the active AI input element |
| 1602 | `INSERT_SHARE_CONTENT` | Inject share text |
| 1695 | `SHOW_PROMPT_PICKER` | Open the picker overlay |
| 1699 | `RUN_CONTEXT_MENU_PROMPT` | Resolve variables and inject a context-menu-selected prompt |
| 1741 | `GET_PLATFORM` | Identify which AI platform the tab is on |
| 1744 | `GET_ACTIVE_INPUT_TEXT` | Verification probe for delivery confirmation (`lib/context-menu.js:109`) |
| 1749 | `GRAB_CONTEXT` | Capture page title/URL/selection and trigger Smart Convert |
| 1753 | `PROMPTS_UPDATED` | Invalidate slash-shortcut cache |
| 1760 | `GET_SELECTION`, `GET_PAGE_TEXT` | Resolve `{{@selection}}` and `{{@page_text}}` context variables |
| 1781 | `COPY_TO_CLIPBOARD` | Used by share flow |
| 1785-1903 | `GET_KIMI_TOKEN`, `GET_DEEPSEEK_TOKEN`, `GET_QWEN_CN_XSRF`, `GET_DOUBAO_TOKENS` | Page-context credential harvesting (see section 6.4) |

### 7.3 Port-based stream channel (`background.js:429-455`)

Long-running operations use `chrome.runtime.connect` (port name `video-prompt`). The handler **monkey-patches** `chrome.runtime.sendMessage` for the duration of the call so that internal modules emitting `VIDEO_PROMPT_PROGRESS` events route through the port instead of the broadcast channel. The original sendMessage is restored after completion. This is fragile but documented as MV3 SW keep-alive (the comment at line 427 explicitly notes it).

### 7.4 Broadcast pattern (`background.js:271-291`)

`broadcastPromptsUpdated` and `broadcastTaxonomyUpdated` send to **both** the extension page (`chrome.runtime.sendMessage` with a `.catch(() => {})`) and **every** content-script tab (`chrome.tabs.query({})` then per-tab `sendMessage`). Failures are silently swallowed because most tabs do not have the listener.

### 7.5 Pending-intent pattern (`background.js:87-252`)

When an action requires Hub login mid-flow, the action payload is stored as `pendingIntent` in `chrome.storage.local` with a 15-minute TTL. After auth sync completes (the line-56 listener), `handlePendingIntent` is invoked. The function is guarded by `_isPendingIntentRunning` to prevent re-entrance during the auth roundtrip.

## 8. Deep-Dive Subsystems

### 8.1 AI Provider Dispatch (lib/ai/provider.js)

**Provider type registry** (verified at `provider.js:81-183` and `background.js:464-508`):

| Provider type | Driver | Auth | Endpoint |
|---|---|---|---|
| `gemini` | direct fetch | `x-goog-api-key` header | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| `openai` | direct fetch | `Bearer {apiKey}` | `{apiUrl}/chat/completions` (configurable) |
| `gemini-web` | `lib/gemini-web.js` | session cookies | `gemini.google.com/u/{authUser}/_/BardChatUi/data/.../StreamGenerate` |
| `kimi-web` | `lib/kimi-web.js` | localStorage `access_token` | kimi.com REST |
| `xiaomimo-web` | `lib/xiaomimo-web.js` | session cookies | aistudio.xiaomimimo.com |
| `qwen-web` | `lib/qwen-web.js` | session cookies | chat.qwen.ai |
| `qwen-cn-web` | `lib/qwen-cn-web.js` | meta tag XSRF + cookie | tongyi.aliyun.com |
| `grok-web` | `lib/grok-web.js` | session cookies | grok.com |
| `glm-web` | `lib/glm-web.js` | session cookies | chatglm.cn |
| `glm-intl-web` | `lib/glm-intl-web.js` | session cookies | chat.z.ai |
| `deepseek-web` | `lib/deepseek-web.js` | localStorage `userToken` | chat.deepseek.com |
| `claude-web` | `lib/claude-web.js` | session cookies | claude.ai |
| `chatgpt-web` | `lib/chatgpt-web.js` | session cookies | chatgpt.com (marked "experimental") |
| `doubao-web` | `lib/doubao-web.js` | content-script-injected `a_bogus` + dynamic tokens | doubao.com |

**Auto-detection chain** (`provider.js:81-183`): if no `activeProviderId` and no enabled provider, the dispatcher tries each `is*WebAvailable()` in order: Gemini → Kimi → Xiaomimo → Qwen → Grok → QwenCN → GLMIntl → DeepSeek → GLM → Claude → ChatGPT. First success becomes the auto provider.

**Reverse-engineered Gemini Web flow** (`lib/gemini-web.js:172-264`): Detailed in module header comments. POST to `BardFrontendService/StreamGenerate` with:
- `at` (SNlM0e XSRF token from page HTML)
- `f.req` JSON envelope with sparse 68-element inner array
- `x-goog-ext-525001261-jspb` header carries a per-request 16-char hex `traceId` that **must** match `inner[4]`
- `x-goog-ext-525005358-jspb` header carries a UUID that **must** match `inner[59]`
- `bl`, `f.sid`, `hl`, `_reqid`, `rt` URL query params

Credentials cached for 5 minutes (`CREDENTIAL_TTL_MS`), invalidated on 401/403 with one auto-retry.

**MV3 SW keep-alive** (`provider.js:51-56`): `keepAlive()` returns a stop function. Pings `chrome.runtime.getPlatformInfo` every 25s during long-running AI calls to prevent SW termination at 30s idle.

### 8.2 Storage architecture (lib/storage.js)

**Layers:**
- `SyncManager` (line 56-...) - strategy router with backends `none | webdav | obsidian` (the `chrome` sync backend was removed; `loadConfig` migrates `'chrome'` → `'none'` at line 76-78).
- `PromptStorage` - dual-layer prompt CRUD (slim sync chunks + full local).
- `LocalStorage`, `SyncStorage` - thin wrappers around `chrome.storage.local`/`.sync`.

**WebDAV backend** (`storage.js:99-156`): single blob `prompt_ark_sync.json`, LZ-compressed, 2s debounce on uploads. Auto-creates `https://dav.jianguoyun.com/dav/PromptArk/` prefix when user supplies the bare Jianguoyun root URL (`webdav-client.js:30-33`).

**Obsidian backend** (`storage.js:158-...`): per-prompt `.md` files with YAML frontmatter, written via the same WebDAV protocol. Pruning is conservative - only deletes files with `prompt_ark_id` frontmatter to avoid clobbering user-authored notes.

**Race protection:** `_configPromise` plus `await SyncManager.ready()` ensures every storage op waits for config load (line 93-96).

### 8.3 Hub (Supabase) integration (lib/supabase/client.js)

**Tables touched** (verified in `client.js`):
- `prompt_submissions` - INSERT for every publish (line 301, 340). Carries category/modality matching, AI confidence, `submitted_*` snapshots, `source_metadata` provenance.
- `prompts` - SELECT for `fetchPublicPrompts`/`fetchPromptById`; PATCH for `updateVisibility`; DELETE for `deletePrompt`.
- `hub_config_items` - SELECT filtered by `config_type = category | output_modality` for category matching during submission.
- `auth/v1/user` - GET to verify session is still live (line 66).

**Auth pattern:** tokens persisted in `chrome.storage.local` (`accessToken`, `refreshToken`, `expiresAt`, `hubUser`). `ensureAuthenticatedSession` first restores from storage, then probes `/auth/v1/user`. On 401/403 it `signOut`s and throws `NOT_LOGGED_IN`, which the dispatcher catches and converts into the pending-intent flow.

### 8.4 Context menu lifecycle

| Trigger | Site | Action |
|---|---|---|
| `chrome.runtime.onInstalled` | background.js:1614 | Build menus |
| `chrome.runtime.onStartup` | background.js:1615 | Build menus |
| `chrome.tabs.onActivated` | background.js:1617 | Rebuild for new active tab |
| `chrome.tabs.onUpdated` (active tab, `complete` or URL change) | background.js:1621 | Rebuild |
| `chrome.windows.onFocusChanged` (real focus, not `WINDOW_ID_NONE`) | background.js:1628 | Rebuild |
| `chrome.storage.onChanged` (sync prompts, or local language) | background.js:1635 | Rebuild |

The rebuild walks all prompts and creates a sub-item per "context-aware" prompt (those that reference `{{@page_text}}`, `{{@selection}}`, `{{@page_url}}`, `{{@page_title}}`, or `{{@date}}` and are marked built-in or share the "Context Grabber ★" category - `lib/context-menu.js:64-78`).

### 8.5 Prompt delivery (lib/context-menu.js:84-171)

`openPromptInDefaultAI` is the most retry-heavy path. Constants at lines 34-37:
- `PROMPT_DELIVERY_INITIAL_DELAY_MS = 600`
- `PROMPT_DELIVERY_RETRY_MS = 250`
- `PROMPT_DELIVERY_VERIFY_DELAY_MS = 700`
- `PROMPT_DELIVERY_MAX_ATTEMPTS = 12`

Flow: open new tab → wait for `tabs.onUpdated.complete` → send `INSERT_PROMPT` → wait → send `GET_ACTIVE_INPUT_TEXT` → compare normalized text → on mismatch, retry up to 12 times. The pending content is stored in `pendingPrompt` local storage and cleared on successful verification.

## 9. Data Flow Summary

```
┌──────────────┐      sendMessage       ┌──────────────────┐
│  popup.js    ├───────────────────────►│   background.js  │
│  (UI)        │                        │   (dispatcher)   │
└──────────────┘                        └──┬────────────┬──┘
                                           │            │
                                           ▼            ▼
                            ┌─────────────────┐   ┌──────────────────┐
                            │ chrome.storage  │   │ lib/ai/provider  │
                            │  local + sync   │   │   (dispatch)     │
                            └─────────────────┘   └──┬──┬──┬──┬──────┘
                                                     │  │  │  │
                  ┌──────────────────────────────────┘  │  │  └────────────────┐
                  │                                     │  │                   │
                  ▼                                     ▼  ▼                   ▼
          ┌──────────────┐                ┌────────────────────┐     ┌────────────────┐
          │ direct fetch │                │ web-session driver │     │ Supabase Hub   │
          │ Gemini API   │                │ (12 providers)     │     │ (publish, read)│
          │ OpenAI API   │                │ uses chrome.cookies│     │                │
          └──────────────┘                │ + content-script   │     └────────────────┘
                                          │   token harvest    │
                                          └─────────┬──────────┘
                                                    │
                                                    ▼
                       ┌──────────────────────────────────────────┐
                       │  AI platform (gemini.google.com,         │
                       │  claude.ai, kimi.com, doubao.com, etc.)  │
                       └──────────────────────────────────────────┘
                                                    ▲
                                                    │ token harvest via
                                                    │ chrome.tabs.sendMessage
                                                    │
                       ┌──────────────────────────────────────────┐
                       │  content.js (per-tab, doubao.com hooks   │
                       │  window.fetch + XHR; reads localStorage; │
                       │  postMessage bridge with Hub web app)    │
                       └──────────────────────────────────────────┘
```

## 10. Risks, Gaps, and Unknowns

### Direct evidence
- **Two `chrome.runtime.onMessage` listeners.** Both fire for every message (lines 56 and 458 in `background.js`). The line-56 listener returns `false` for non-matching types, so no handlers leak, but adding a third listener would risk silent ordering bugs.
- **Monkey-patched `chrome.runtime.sendMessage`** (`background.js:436-443`). Restored in the success path but **not** restored in the catch path - if `generateVideoPromptWithAI` throws, the patched sendMessage continues redirecting `VIDEO_PROMPT_PROGRESS` to a closed port. The `try { } catch { }` at line 452 only attempts `port.postMessage`; the original sendMessage is never restored on error.
- **`pendingIntent` re-entrance lock** (`background.js:88, 110, 250`) is set in a `try { ... } finally { ... }` but the `_isPendingIntentRunning = false` reset path in early-return branches (lines 117 and 123) is correct.
- **`<all_urls>` host permission** is mandatory because of `content_scripts.matches`; not reducible without a major UX change.
- **`chrome.scripting` injects only inline `func` with bound args.** No `files: [...]` use, no remote code; CSP-compliant.
- **Encryption key for `apiKey`** is derived from extension ID (verified by reading `lib/crypto.js` import patterns in `lib/ai/provider.js:64-79` and `background.js:22, 532`). Anyone who can read `chrome.storage.local` and load the extension can decrypt; this is **obfuscation, not security** - acceptable for a personal-use extension but should not be presented as encryption-at-rest in marketing.

### Strong inference
- The `manifest.json.backup` file at the repo root preserves the previous v1.0.0 manifest. The new manifest (v1.0.1) added `chatglm.cn`, several `*.openai.com` hosts, and switched `content_scripts.run_at` from `document_idle` to `document_start` - that change makes content.js load earlier, which is consistent with the doubao fetch interceptor needing to install before page scripts.
- `[DISABLED]` markers in `background.js:41, 525, 531` indicate the OpenClaw/skill-push subsystem is intentionally inactive in this build but the `case 'GENERATE_SKILL'`, `'GET_SKILLS'`, `'PUSH_SKILL'`, `'DELETE_SKILL'` handlers remain wired (lines 553-587). They will dispatch but the underlying p2s-forge module is commented out at the import.

### Unknown / unverified
- The exact 401-recovery semantics of every web-session provider (only gemini-web verified end-to-end in this analysis).
- Whether `popup.js` (~5800 lines, sampled at message-type-dispatch level only) has additional `chrome.*` API surfaces beyond `runtime.sendMessage`. The grep at section 7 covered all message types but not all chrome calls within popup.
- The `lib/popup/share-manager.js` (33KB) was not deeply read; section 8 covers only the background-side share flow.

## 11. Summary Table

| Area | Primary Files | Key Finding |
|---|---|---|
| Manifest | manifest.json | MV3, 9 permissions, 26 host permissions + `<all_urls>`, side panel reuses popup.html |
| Dispatcher | background.js (1642 LOC) | 50-case switch + secondary auth listener + port-based stream channel |
| Content scripts | content.js (2871 LOC) | 19-case dispatcher, fetch/XHR hooks scoped to doubao.com, postMessage bridge to Hub |
| AI providers | lib/ai/provider.js, lib/*-web.js (12 files) | Unified dispatch over 14 provider types: 2 cloud APIs + 12 reverse-engineered web sessions |
| Storage | lib/storage.js (1053 LOC) | Dual-layer sync+local with chunked slim sync, WebDAV/Obsidian backends, 2s debounce |
| Hub integration | lib/supabase/client.js | Inserts into `prompt_submissions`, queries `hub_config_items` for category matching, pending-intent flow for mid-action auth |
| Context menus | lib/context-menu.js (732 LOC) | Promise-chain serialization to avoid duplicate-id race; rebuilt on 6 different chrome events |
| Commands | manifest.json + background.js:1580 | 3 keyboard shortcuts: open-picker, grab-context, share-article |
| CDP usage | (none) | Not used. All automation is content-script DOM, not chrome.debugger |
| Web hooks | content.js:5-127 | doubao.com only: `window.fetch`, `XMLHttpRequest.prototype.open`, `<script>`-injected `byted_acrawler.frontierSign` bridge via postMessage |
