# Prompt Ark - Provider Porting Guide

**Question asked:** Can the existing build be leveraged to route requests to other AI CLI / web apps, drawing from Chinese reverse-engineered free-api projects and linux.do discussions?

**Short answer:** Yes. Prompt Ark already implements the exact same pattern that the LLM-Red-Team `*-free-api` family uses, but inside a Manifest V3 service worker instead of a Node/Docker daemon. Adding a new provider is a four-file change. The bigger wins are using the existing free-api source code as a porting reference and adding the providers Prompt Ark has host_permissions for but no driver yet.

---

## 1. The architectural match

Prompt Ark's `lib/<name>-web.js` modules and the LLM-Red-Team free-api repos solve the same problem with the same approach: forward a chat completion to an AI vendor's web frontend by replaying the page's authenticated XHR/SSE protocol against session cookies or refresh tokens, then re-encode the response into an OpenAI-compatible shape.

The only structural differences:

| Concern | LLM-Red-Team free-api | Prompt Ark |
|---|---|---|
| Runtime | Node.js (Docker / Vercel / PM2) | Chrome MV3 service worker |
| Auth source | Bearer token from request header | `chrome.cookies.getAll()` + content-script `localStorage` harvest |
| Output | OpenAI `/v1/chat/completions` JSON / SSE | Plain string return value from `callXxxWeb(prompt, model)` |
| Streaming | True SSE pass-through | Buffered final string (see "What's missing" below) |
| Persistence | None - request-scoped | `lib/web-provider-utils.js:createCredentialCache` for token caching |

Functionally these are siblings. Most upstream free-api code translates almost line-for-line into the Prompt Ark driver shape.

---

## 2. Delegation lifecycle: task submission through result retrieval

This section documents the existing `gemini-web` path as the reference implementation. "Delegation" here means that an extension feature hands a prepared prompt to the configured provider driver; it does **not** create a persistent Gemini task, queue job, or browser-tab automation session.

### 2.1 The complete path

```text
Popup/content-script feature
  -> chrome.runtime.sendMessage({ type, ... })
  -> background.js:handleMessage()
  -> feature module or callProvider()
  -> getActiveProvider()
  -> callGeminiWeb(prompt)
  -> authenticated StreamGenerate POST
  -> parse response body lines
  -> final string or parsed JSON
  -> sendResponse({ success, result/error })
```

The manifest enables this path: `manifest.json:7-18` grants `cookies`, `tabs`, and `storage`; `manifest.json:24` grants access to `https://gemini.google.com/*`; and `manifest.json:57-60` registers the module service worker. The extension page and content script use `chrome.runtime.sendMessage`; the service worker receives the request at `background.js:457-460` and routes it through `handleMessage()` at `background.js:538`.

AI features are independent callers, not one generic job queue. For example, translation, optimization, Smart Convert, metadata extraction, sharing, and video-prompt generation prepare feature-specific instructions, call the selected provider, then interpret the returned string for their own result shape. `callProvider()` provides the direct background dispatch surface (`background.js:463-507`); `callCloudAPI()` provides the metadata-extraction surface (`lib/ai/provider.js:220-432`). Both return values rather than task IDs.

### 2.2 Provider selection

`getActiveProvider()` in `lib/ai/provider.js:81-182` uses this deterministic order:

1. The saved `activeProviderId`, when it still exists.
2. The first enabled configured provider.
3. Auto-detected web sessions, starting with Gemini Web.
4. `null` when no configured or logged-in provider is available.

Gemini auto-detection calls `isGeminiWebAvailable()` (`lib/gemini-web.js:270-277`), which attempts only credential discovery. It does not send a model prompt. This makes the default experience zero-config while ensuring a missing Gemini login falls through to the next supported provider.

### 2.3 Gemini Web session bootstrap

`callGeminiWeb()` delegates to `_callGeminiWebInner()` (`lib/gemini-web.js:172-176`). Before submission, `fetchGeminiWebCredentials()` (`lib/gemini-web.js:83-117`) does the following:

1. Reuses a credential cache younger than five minutes.
2. Fetches `https://gemini.google.com/app` with the browser's Google cookies.
3. Detects a login wall from returned HTML.
4. Extracts the page-scoped `SNlM0e` XSRF token, `cfb2h` build label, and optional `FdrFJe` session ID.
5. Caches `{ atValue, blValue, fSid, authUser }` for the next call.

The explicit cookie path is intentional. The shared request helper supports browser-service-worker cookie behavior, including Edge compatibility, rather than relying solely on `credentials: 'include'`. Reuse the helpers in `lib/web-provider-utils.js`; do not copy ad-hoc cookie handling into a new driver.

### 2.4 Submit one request

The Gemini driver creates request-correlated identifiers for each call (`lib/gemini-web.js:179-199`): a 16-character hex trace ID and an uppercase UUID. The trace ID must agree between the `f.req` payload and `x-goog-ext-525001261-jspb`; the UUID must agree between `f.req` and `x-goog-ext-525005358-jspb`.

It then sends one form-encoded POST to Gemini's `StreamGenerate` endpoint (`lib/gemini-web.js:201-231`). The request contains:

- Query values derived from the page session: `bl`, optional `f.sid`, randomized `_reqid`, and `rt`.
- Request headers: `X-Goog-AuthUser`, both correlated `x-goog-ext-*` headers, `Origin`, and `Referer`.
- Form fields: `at` and `f.req`.

Do not implement this as browser UI automation, a polling API, or an `EventSource` client. Prompt Ark makes one authenticated fetch and consumes its completed response body.

### 2.5 Retrieve and normalize the result

After the POST resolves, the driver calls `response.text()` and scans each newline-delimited record (`lib/gemini-web.js:238-263`). `parseStreamLine()` unwraps Gemini's nested JSON envelope and returns `{ text, thoughts }` when a candidate is valid (`lib/gemini-web.js:125-162`). The driver keeps the **last valid candidate** and returns its `text` as one plain string.

This is the result-retrieval contract for all current web-session drivers:

```javascript
const result = await callXxxWeb(prompt, model);
// result is the final text, not a task ID, stream, or response object.
```

Feature modules own any additional parsing. Metadata extraction prompts for JSON and extracts the JSON object after `callGeminiWeb()` returns (`lib/ai/provider.js:287-300`). Translation, Smart Convert, and video flows similarly parse their feature-specific output after receiving final text. A replicated feature should preserve this separation: driver returns transport-normalized text; caller validates its application result.

### 2.6 Failure, retry, and caller response

The driver has three distinct failure paths:

| Condition | Driver action | Caller contract |
|---|---|---|
| Gemini login HTML, missing XSRF token, or login redirect | Clear credentials where applicable; throw `Error('NOT_LOGGED_IN')` | Open or direct the user to the provider login flow, then return a typed failure response |
| HTTP error | Throw an error with the HTTP status | Surface the operation failure; do not present a fabricated result |
| No parseable candidate | Clear credentials and retry exactly once; then throw `Error('No valid response from Gemini Web')` | Surface failure after the bounded retry |

The auth checks are in `lib/gemini-web.js:98-110` and `lib/gemini-web.js:233-259`. `background.js` wraps `handleMessage()` in an error boundary and replies with `{ success: false, error }` for unhandled request failures. Feature handlers that provide login UX, such as translation, should preserve the `NOT_LOGGED_IN` discriminator instead of matching user-facing error text.

### 2.7 Minimal replication checklist

To reproduce the same capability for another logged-in web provider:

1. Keep the caller/driver boundary: feature builds a prompt; driver returns final text.
2. Add only the necessary `host_permissions` and `cookies` support in `manifest.json`.
3. Implement `fetchXxxCredentials()` with a short cache and explicit `NOT_LOGGED_IN` detection.
4. Implement one authenticated request that mirrors the provider's current browser protocol.
5. Parse the completed response into one final text string; use `parseSSEStream()` or `parseNDJSONStream()` from `lib/web-provider-utils.js` only when that provider actually emits those formats.
6. Clear stale credentials on authentication failure; retry only when a concrete existing driver pattern warrants it.
7. Wire the provider at every dispatch point listed in section 3, then manually verify a logged-in and logged-out browser state.

The current implementation has no persistent task registry, resume token, cross-process worker, or client-visible streaming protocol. Add those only if a feature genuinely requires progressive output or work that outlives a single MV3 service-worker request; the existing `video-prompt` runtime port is the relevant long-running pattern, not the normal web-session call path.

---

## 3. The driver contract (verified from source)

Every web driver must export exactly two functions. Confirmed from `lib/gemini-web.js:172-277`, `lib/ai/provider.js:3-12, 81-183, 287-430`, and `background.js:464-508`.

```javascript
// lib/<name>-web.js

export async function callXxxWeb(prompt, model = 'default-model-id') {
    // 1. Resolve credentials (cookies via chrome.cookies / localStorage via content.js)
    // 2. POST to the provider's web endpoint with the page's signing scheme
    // 3. Parse the streaming or buffered response into a single string
    // 4. Return the string. On 401/403 throw 'NOT_LOGGED_IN'. Invalidate cached creds.
}

export async function isXxxWebAvailable() {
    try {
        // Probe credentials. Return true if a chat would succeed right now.
        return true;
    } catch {
        return false;
    }
}
```

**Error semantics** (matches `lib/gemini-web.js:233-244`):
- Throw `Error('NOT_LOGGED_IN')` on auth failure. The dispatcher catches this and triggers the pending-intent flow.
- Throw any other `Error` for transport / parse failures - the message bubbles up to the popup.
- One auto-retry with fresh credentials is the convention (`gemini-web.js:253-258`).

**Helpers in `lib/web-provider-utils.js`** that every new driver should reuse:

| Helper | Purpose | Used by |
|---|---|---|
| `getCookieHeader(domain, url)` | 4-strategy `chrome.cookies.getAll` fallback | All cookie-based drivers |
| `fetchWithCookies(url, cookieHeader, options, timeoutMs)` | Edge-compatible cookie attachment | Edge-affected drivers |
| `parseSSEStream(response)` | Async generator yielding parsed SSE events | Streaming drivers |
| `parseNDJSONStream(response)` | Async generator over newline-delimited JSON | Streaming drivers |
| `createCredentialCache(ttlMs)` | get/set/clear/isValid token cache | Drivers that fetch creds via HTML scrape |
| `extractValueFromText(key, text)` | Regex helper for HTML-embedded tokens | Web-page-scrape auth |
| `extractJSONFromText(text)` | Try-multiple-patterns JSON extraction | `__NEXT_DATA__` style scraping |
| `randomHex(byteLength)` | Crypto-strong hex for trace IDs | All drivers needing per-request IDs |
| `isNotLoggedIn(response, bodyText)` | Heuristic 401 / Chinese login-page detection | All drivers |
| `retryWithBackoff(fn, maxRetries, delayMs)` | Exponential backoff helper | Long-running calls |

**Driver dispatch sites** that must be updated for every new provider:

1. `lib/ai/provider.js:3-12` - import the driver.
2. `lib/ai/provider.js:81-183` - add an auto-detect entry in the `getActiveProvider` chain.
3. `lib/ai/provider.js:287-430` - add a `provider.type === 'xxx-web'` branch in `callCloudAPI` (used for metadata extraction with the JSON-only sandwich pattern - copy the existing `gemini-web` block).
4. `background.js:3-12` - import for the SW.
5. `background.js:464-508` - add a `callProvider` branch.
6. `manifest.json:18-50` - add the host(s) to `host_permissions`.
7. **Settings UI** - check `popup.js` for the provider type registry (the popup file is large - search for `'gemini-web'` to find the dropdown definition; the same string token works as the discriminator).

That is the complete porting surface.

---

## 4. Token-bridge pattern (when cookies aren't enough)

Some providers store auth in `localStorage` (Kimi, DeepSeek), in meta tags (Qwen CN), or behind anti-bot signing (Doubao). For these, `chrome.cookies` alone is insufficient. Prompt Ark already has the bridge:

**Read-only bridge (Kimi, DeepSeek, Qwen CN style):**
1. Driver in service worker sends `chrome.tabs.sendMessage(tabId, { type: 'GET_KIMI_TOKEN' })` to a tab on the provider's domain.
2. `content.js:1785-1879` reads `localStorage`, meta tags, cookies, etc. and replies.
3. Driver uses returned values as bearer tokens.

**Active bridge with page-context script execution (Doubao style):**

The Doubao flow at `content.js:5-225` is the template for any provider with anti-bot signing. Verified pattern:

1. **Install fetch/XHR interceptors** on `document_start` to passively harvest tokens (`msToken`, `a_bogus`, `tea_uuid`, `device_id`, etc.) from URL query params:
    ```javascript
    if (window.location.hostname.includes('doubao.com')) {
      window.__DOUBAO_DYNAMIC_TOKENS = window.__DOUBAO_DYNAMIC_TOKENS || {};
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('doubao.com')) {
          updateTokens(extractTokensFromUrl(url));
        }
        return originalFetch.apply(this, args);
      };
      // ditto XMLHttpRequest.prototype.open
    }
    ```
2. **Inject a `<script>` element into page context** when a signed token is needed:
    ```javascript
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        const result = window.byted_acrawler.frontierSign("${queryString}");
        window.postMessage({ type: 'PROMPT_ARK_ABOGUS_RESULT', result }, '*');
      })();
    `;
    document.head.appendChild(script);
    ```
3. **Listen for the result** in the content-script realm via `window.addEventListener('message', ...)`, with cleanup on the script tag and a 5s timeout.

This is the only Prompt Ark code path that bridges page-context script execution back into the extension. It's the template for any provider whose web frontend uses `byted_acrawler`-style signing (TikTok, Douyin, Doubao, Jimeng) or any signing function exposed only on `window`.

**Manifest CSP note:** Prompt Ark already uses `script-src 'self' 'wasm-unsafe-eval'` for extension pages (`manifest.json:117`). The Doubao injection works because it injects into the page's CSP context, not the extension's. New providers using the same trick will work without manifest changes.

---

## 5. Chinese prior art (reverse-engineered web-session APIs)

Confirmed via direct repo lookups. All are MIT/GPL/AGPL licensed - **the source code is fair game as a porting reference, not a runtime dependency.**

### 4.1 LLM-Red-Team / Vinlic family (the canonical set)

| Repo | Provider | Stars | Auth | Status |
|---|---|---|---|---|
| `LLM-Red-Team/kimi-free-api` | Moonshot Kimi | ~5K | `refresh_token` from `localStorage` | Active |
| `LLM-Red-Team/deepseek-free-api` | DeepSeek | ~2.9K | `userToken` from `localStorage` | Active |
| `LLM-Red-Team/qwen-free-api` | Alibaba Tongyi Qwen 2.5 | ~1.2K | `tongyi_sso_ticket` or `login_aliyunid_ticket` cookie | Active |
| `LLM-Red-Team/glm-free-api` | Zhipu ChatGLM-4-Plus | ~870 | session cookie | Active |
| `LLM-Red-Team/step-free-api` | StepChat YueWen (multimodal) | ~250 | session cookie | Active |
| `LLM-Red-Team/doubao-free-api` | ByteDance Doubao | TBD | session + signed `a_bogus` | Active |
| `LLM-Red-Team/jimeng-free-api` | ByteDance Jimeng (image gen) | TBD | session + signed token | Active |
| `LLM-Red-Team/spark-free-api` | iFlytek Spark | TBD | session cookie | Active |
| `LLM-Red-Team/minimax-free-api` (formerly hailuo-free-api) | MiniMax Hailuo | ~470 | session cookie | **Archived** (last push 2025-01-25) |
| `LLM-Red-Team/metaso-free-api` | Metaso AI | TBD | session cookie | Active |
| `LLM-Red-Team/emohaa-free-api` | Emohaa | - | session cookie | **OUT OF ORDER** per upstream README |
| `LLM-Red-Team/free-api-hub` | Index repo | 180 | - | **Archived** |

All of the above are TypeScript Express services that expose `POST /v1/chat/completions` with bearer-token auth. Each one's request builder, header map, and response parser is what you copy into a Prompt Ark driver - swap the Node `fetch` for `fetchWithCookies`, replace bearer-token reads with `chrome.cookies.getAll`, drop the Express layer.

### 4.2 Other Chinese reverse-engineered repos

| Repo | Provider | Notes |
|---|---|---|
| `chenwr727/yuanbao-free-api` (229 stars) | Tencent Yuanbao (混元/DeepSeek hybrid) | **Playwright-based** - useful for the Hunyuan host gap. Uses headless browser to harvest `x-uskey` cookie via QR-code login |
| `HarcicYang/rev_HunYuan` (11 stars) | Tencent Hunyuan classic | Pure cookie-based, dormant since 2023 |
| `floatin/hunyuan_proxy` | Hunyuan via LiteLLM | Format-shim for tool-calling parity, useful as a parameter-mapping reference |
| `leeeduke/revTongYi` (69 stars) | Alibaba Tongyi (qianwen.aliyun.com) | **Different from `chat.qwen.ai`** - covers the `tongyi.aliyun.com` host Prompt Ark already permits but lacks a driver for. Cookie-dict auth |
| `zhuweiyou/yiyan-api` (72 stars) | Baidu Wenxin Yiyan | **Archived** but still the reference for the `yiyan.baidu.com` host Prompt Ark permits |
| `RockChinQ/free-one-api` (802 stars) | Multi-provider router | AGPL - shows the dispatch architecture (closest spiritual cousin to Prompt Ark) |

### 4.3 Cross-cutting / English equivalents

| Repo | Approach | Why interesting |
|---|---|---|
| `lumingya/universal-web-api` | DrissionPage browser automation | Generic "any AI website → OpenAI" via local Chromium scheduling. Lists supported sites: ChatGPT, DeepSeek, Gemini, Claude, Kimi, Qwen, Grok, Doubao, AI Studio, Arena.ai |
| `Ciyfly/web2api` | Real browser + Playwright | OpenAI-compat for Claude session keys via fingerprint browser |
| `flay-o/arena2api` | Chrome extension + Python proxy | **Same architectural shape as Prompt Ark** - extension pushes tokens to a local server. Demonstrates two-realm reCAPTCHA bypass and shard-cookie reassembly for Arena's 300+ models |
| `linuxhsj/openclaw-zero-token` | Browser-driven multi-provider gateway | Lists providers with the same coverage as Prompt Ark plus Manus. Useful as a feature-parity baseline |
| `osen77/NotebookLM-API` and `teng-lin/notebooklm-py` (13K stars) | Playwright-based NotebookLM RPC | Direct fit for the unfilled `notebooklm.google.com` host_permission. teng-lin's repo reverse-engineers Google's `batchexecute` RPC envelope (the same format `lib/gemini-web.js` decodes) |
| `li-linfeng/AIstudioProxyAPI` | Camoufox + Playwright | Direct fit for `aistudio.google.com` - already in host_permissions. Uses Camoufox to bypass automation detection |

---

## 6. linux.do signal

linux.do is the active Chinese-language community where these projects get debated. Sampled threads (verified):

- **"请问你们逆向xxx ai的原理是啥呀"** ([linux.do/t/topic/101592](https://linux.do/t/topic/101592)) - General primer on the reverse-engineering motivation. Confirms "API token costs more than web users; reverse-engineer the network requests, deobfuscate the JS challenge, replay against cookies."
- **"关于目前API中转站逆向、混用的判断"** ([linux.do/t/topic/57660](https://linux.do/t/topic/57660)) - How to detect a proxy claiming to be official: feed it a tool-call request and see if it falls through. Reverse APIs typically don't support function calling.
- **"Deepseek2API-三开重置版"** ([linux.do/t/topic/1552939](https://linux.do/t/topic/1552939)) - Active maintainer of `CJackHwang/ds2api`, an actively-developed fork of `iidamie/deepseek2api` and `LLM-Red-Team/deepseek-free-api`. Adds tool-calling shim layer. Vercel deployment focus. **Important:** confirms `LLM-Red-Team/deepseek-free-api` is dormant; the active replacement is `CJackHwang/ds2api`.
- **"通义千问：Qwen Code 免费每日2000次, token无限制"** ([linux.do/t/topic/861857](https://linux.do/t/topic/861857)) - Qwen now offers official OAuth flow via `qwen-cli`. May obviate the need for `chat.qwen.ai` reverse-engineering for some use cases.
- **"CLIProxyAPI 和 Sub2api 有啥区别啊？"** ([linux.do/t/topic/1679178](https://linux.do/t/topic/1679178)) - Two newer proxy projects worth checking; specifics not extracted.

**Sentiment patterns observed:**
- Web-session APIs **break frequently** on every provider redesign. Maintainers warn: "Reverse APIs are unstable. Use the official paid API in production."
- DeepSeek and Qwen are considered "easy" targets (stable cookies, no aggressive signing).
- Doubao and Jimeng are the hardest - active anti-bot with `byted_acrawler` signing. Prompt Ark's existing bridge is non-trivial work that should not be discarded.
- The free-api Docker image author `vinlic` is the maintainer behind every LLM-Red-Team repo and the published `vinlic/*-free-api` Docker images.

linux.do search was rate-limited via WebExa - results above came from cached snippets. Direct site search via Google was blocked by auth on this environment.

---

## 7. Gap analysis vs Prompt Ark's existing surface

`manifest.json:18-50` lists hosts. Existing `lib/<name>-web.js` drivers cover:

```
chat.deepseek.com (deepseek-web)        chat.qwen.ai (qwen-web)
kimi.com / kimi.moonshot.cn (kimi-web)  chat.z.ai (glm-intl-web)
gemini.google.com (gemini-web)          chatglm.cn (glm-web)
claude.ai (claude-web)                  doubao.com (doubao-web)
chatgpt.com (chatgpt-web)               grok.com (grok-web)
                                         aistudio.xiaomimimo.com (xiaomimo-web)
chat2.qianwen.com (qwen-cn-web)         tongyi.aliyun.com - PARTIAL via qwen-cn-web
```

**Hosts already permitted but with NO driver - low-hanging fruit:**

| Host | Reference repo for porting | Difficulty |
|---|---|---|
| `notebooklm.google.com` | `teng-lin/notebooklm-py` (13K stars), `osen77/NotebookLM-API` | Medium - Google batchexecute, similar to gemini-web |
| `aistudio.google.com` | `li-linfeng/AIstudioProxyAPI` (Playwright) | Hard - heavy automation detection |
| `yiyan.baidu.com` | `zhuweiyou/yiyan-api` (archived but valid) | Medium - cookie auth |
| `tongyi.aliyun.com` | `leeeduke/revTongYi` (different from chat.qwen.ai) | Easy - cookie auth |
| `hailuoai.com` | `LLM-Red-Team/minimax-free-api` (archived 2025-01) | Medium - protocol may have drifted |
| `hunyuan.tencent.com` | `chenwr727/yuanbao-free-api`, `HarcicYang/rev_HunYuan` | Medium - Tencent has aggressive anti-bot |

**Hosts NOT in manifest that the user might want to add:**
- `yuanbao.tencent.com` - Tencent's newer hybrid (DeepSeek + Hunyuan models). `chenwr727/yuanbao-free-api` is the canonical reference.
- `metaso.cn` - search-augmented LLM, useful for research workflows.
- `arena.ai` - 300+ models in one place. `flay-o/arena2api` shows the extension-pushing-tokens pattern Prompt Ark could adopt.

---

## 8. Concrete porting recipe (worked example: Hailuo / MiniMax)

Take `LLM-Red-Team/minimax-free-api` (TypeScript) and convert to a Prompt Ark driver:

**Step 1.** Read the upstream's auth flow. For minimax-free-api, the bearer token is a `_token` cookie from hailuoai.com.

**Step 2.** Create `lib/hailuo-web.js`:

```javascript
import { getCookieHeader, fetchWithCookies, createCredentialCache, randomHex } from './web-provider-utils.js';

const credCache = createCredentialCache(5 * 60 * 1000);

async function fetchHailuoCredentials() {
    if (credCache.isValid()) return credCache.get();
    const cookieHeader = await getCookieHeader('.hailuoai.com', 'https://hailuoai.com');
    const tokenMatch = cookieHeader.match(/_token=([^;]+)/);
    if (!tokenMatch) throw new Error('NOT_LOGGED_IN');
    const creds = { token: tokenMatch[1], cookieHeader };
    credCache.set(creds);
    return creds;
}

export async function callHailuoWeb(prompt, model = 'MiniMax-Text-01') {
    const creds = await fetchHailuoCredentials();
    // Copy the URL + headers + body shape from minimax-free-api's
    // src/api/controllers/chat.ts createCompletion()
    const response = await fetchWithCookies(
        'https://hailuoai.com/v4/api/multimodal/chat/msg',  // verify against upstream
        creds.cookieHeader,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': creds.token,
                'X-Trace-Id': randomHex(16),
            },
            body: JSON.stringify({ /* upstream's payload shape */ }),
        }
    );
    if (response.status === 401 || response.status === 403) {
        credCache.clear();
        throw new Error('NOT_LOGGED_IN');
    }
    // Parse SSE stream - reuse parseSSEStream() helper
    let final = '';
    for await (const event of parseSSEStream(response)) {
        const data = JSON.parse(event.data);
        if (data.delta?.content) final += data.delta.content;
    }
    return final;
}

export async function isHailuoWebAvailable() {
    try { await fetchHailuoCredentials(); return true; } catch { return false; }
}
```

**Step 3.** Register the driver. Edit:

- `lib/ai/provider.js`: add `import { callHailuoWeb, isHailuoWebAvailable } from '../hailuo-web.js';`
- `lib/ai/provider.js` (`getActiveProvider`): paste a copy of the Kimi try-block, swap names.
- `lib/ai/provider.js` (`callCloudAPI`): paste the `gemini-web` JSON-only block, swap to `callHailuoWeb`.
- `background.js`: same imports + a new branch in `callProvider`.
- `manifest.json` host_permissions: already has `hailuoai.com`.
- `popup.js`: search for `'gemini-web'` to find the provider-type registry; add `hailuo-web`.

**Step 4.** Reload the extension, log into hailuoai.com, exercise the picker on any AI site. Expected: `getActiveProvider` auto-detect picks up Hailuo, the call goes through.

**Time estimate per provider:** 30-90 minutes for cookie-based providers, 2-4 hours for ones requiring a content.js bridge.

---

## 9. What the existing build does NOT give you

Honest gaps against the LLM-Red-Team feature set:

- **No streaming to the client.** Every `callXxxWeb` returns a final string. The picker shows "thinking…" then the full result. Streaming would require a port-based channel (the pattern is already in `background.js:429-455` for video-prompt - but unused for chat).
- **No image / file uploads.** `callCloudAPI` only handles text. The free-api repos all support `gpt-4-vision-preview`-style image attachments.
- **No drawing / image generation routing.** Qwen / GLM / Jimeng web-session APIs all expose draw endpoints.
- **No bearer-token-array round-robin.** LLM-Red-Team supports `Authorization: Bearer t1,t2,t3` for load balancing across accounts. Prompt Ark uses one logged-in browser session.
- **MV3 service worker 30s idle kill** is mitigated by `keepAlive()` in `lib/ai/provider.js:51-56`. Long generations (Jimeng image, GLM video) may need the port pattern.

---

## 10. Recommended next steps (in priority order)

1. **Port `tongyi.aliyun.com` driver** using `leeeduke/revTongYi` as reference. The host is already permitted; this fills an obvious gap and is the easiest win (cookie-only auth).
2. **Port `notebooklm.google.com` driver** using `teng-lin/notebooklm-py` as reference. NotebookLM's batchexecute RPC envelope is structurally identical to Gemini's - copy the parsing logic from `lib/gemini-web.js:125-162`.
3. **Add streaming via the existing port pattern.** Generalize the video-prompt port handler at `background.js:429-455` into a per-call streaming channel for chat. Lets you ship token-by-token output.
4. **Add `yuanbao.tencent.com` host + driver.** Use `chenwr727/yuanbao-free-api` as reference. This brings Tencent Hunyuan to working state without dealing with `hunyuan.tencent.com` directly.
5. **Replace the dormant `LLM-Red-Team/deepseek-free-api` reference with `CJackHwang/ds2api`** for tool-call support.

---

## 11. Compliance note

Every reference repo above carries the disclaimer "for testing only, use the official paid API in production." Most providers' ToS forbid reverse-engineering. Prompt Ark already includes "如需商用请前往官方开放平台" in its model description (manifest.json default locale `zh_CN`). The user's existing posture - free, personal, manual login required - is consistent with how the Chinese community deploys these. Productizing or reselling would be a different conversation.
