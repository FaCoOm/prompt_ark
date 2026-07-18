# Provider Matrix

Protocol details drift. Treat each row as a source-reading checklist, not a stable public API contract. Re-capture the provider's current browser request before implementation.

## Direct APIs

| Type | Auth | Dispatcher | Result |
|---|---|---|---|
| `gemini` | `x-goog-api-key` | `background.js:463-476`; metadata `lib/ai/provider.js:229-266` | Gemini candidate text / JSON |
| `openai` | `Authorization: Bearer` | `background.js:477-488`; metadata `lib/ai/provider.js:268-285` | chat-completion text / JSON |

Use direct APIs when reliability and vendor-supported behavior matter. These need API-key encryption at rest.

## Web-Session Providers

| Type | Driver | Session source | Transport/result | Special integration |
|---|---|---|---|---|
| `gemini-web` | `lib/gemini-web.js` | Google cookies + Gemini page tokens | `StreamGenerate`; final valid line | Reference implementation |
| `kimi-web` | `lib/kimi-web.js` | content-script `localStorage` token plus cookies | Connect-RPC | `GET_KIMI_TOKEN` bridge |
| `xiaomimo-web` | `lib/xiaomimo-web.js` | session cookies | provider JSON/stream | cookie session |
| `qwen-web` | `lib/qwen-web.js` | session cookies | bootstrap chat then SSE | cookie session |
| `qwen-cn-web` | `lib/qwen-cn-web.js` | cookies + XSRF + user token | JSON/SSE | `GET_QWEN_CN_XSRF` bridge |
| `grok-web` | `lib/grok-web.js` | session cookies | conversation plus NDJSON | cookie session |
| `glm-web` | `lib/glm-web.js` | session cookies | SSE | provider auth text handling |
| `glm-intl-web` | `lib/glm-intl-web.js` | cookie plus page interaction | final DOM text | page-side DOM simulation |
| `deepseek-web` | `lib/deepseek-web.js` | cookie plus local token | PoW plus SSE | `GET_DEEPSEEK_TOKEN` bridge |
| `doubao-web` | `lib/doubao-web.js` | cookie plus dynamic signed values | SSE | fetch/XHR harvest and signer bridge |
| `chatgpt-web` | `lib/chatgpt-web.js` | session cookies | API-first SSE | API-blocked DOM fallback; experimental |

## Gemini Web: Reference Flow

1. Fetch `https://gemini.google.com/app` with browser cookies.
2. Extract `SNlM0e`, `cfb2h`, and optional `FdrFJe` (`lib/gemini-web.js:83-117`).
3. Create correlated trace ID and UUID (`:179-199`).
4. POST form-encoded `at` and `f.req` to `StreamGenerate` with corresponding `x-goog-ext-*` headers (`:201-231`).
5. Read response text; parse newline records; keep the last valid candidate (`:238-263`).
6. Clear cache and throw `NOT_LOGGED_IN` for login signals; retry once on empty parse.

Full request-level detail: [`../../PROVIDER_PORTING_GUIDE.md`](../../PROVIDER_PORTING_GUIDE.md), sections 2 and 3.

## Provider Porting Rules

For every new type, update all applicable places:

1. `manifest.json`: host permissions and `cookies` only when needed.
2. `lib/<provider>-web.js`: driver plus availability probe.
3. `lib/ai/provider.js`: import, auto-detect, metadata dispatch.
4. `background.js`: import and `callProvider()` branch if raw text features use it.
5. `popup.js`: type list, label, form visibility.
6. `content.js`: only if the driver requires page-only state or signing.
7. Feature modules: every explicit `provider.type` switch must recognize the new type.

Search before editing: `rg "gemini-web|provider.type" background.js lib popup.js content.js`.

## Compliance Boundary

Web-session drivers replay a vendor's browser protocol against the user's own logged-in session. Provider terms may prohibit this. Do not market a reverse-engineered web protocol as stable, supported, or suitable for commercial resale. Prefer official APIs where production reliability or contractual compliance is required.
