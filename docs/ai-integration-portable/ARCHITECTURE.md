# Architecture and Contracts

## Runtime Boundaries

| Realm | Responsibility | Prompt Ark evidence |
|---|---|---|
| Popup/side panel | Provider configuration; initiates feature requests | `popup.js:516-636` |
| Content script | Reads provider page state unavailable to the service worker | `content.js:1752-1869` |
| MV3 service worker | Message router, provider dispatch, cross-origin fetch | `background.js:457-460`, `background.js:463-507`, `background.js:538` |
| Provider driver | Credentials, request protocol, transport parsing, final text | `lib/gemini-web.js:83-277` |
| Feature module | Builds feature prompt; validates/parses returned text | `lib/ai/translate.js`, `lib/ai/optimize.js`, `lib/ai/smart-convert.js` |

The service worker is the trust and network boundary. Do not move provider secrets or cross-origin requests into a content script merely to avoid message routing.

## Normal Request Lifecycle

```text
User action
  -> popup/content script chrome.runtime.sendMessage({ type, payload })
  -> background handleMessage()
  -> feature module builds an instruction
  -> getActiveProvider()
  -> direct API call or callXxxWeb()
  -> driver returns final text
  -> feature parses JSON/schema when required
  -> background sendResponse({ success, result })
```

`background.js:538` is the central switch. `background.js:463-507` is the direct raw-text provider dispatcher. `lib/ai/provider.js:220-432` is the metadata-specific provider dispatcher.

This is request/response delegation, not a task queue. There is no provider task ID, polling loop, or persistent provider-job registry. Gemini Web uses one POST, then parses the completed response body line by line (`lib/gemini-web.js:238-263`).

## Provider Selection

`getActiveProvider()` (`lib/ai/provider.js:81-182`) applies this order:

1. Saved active provider ID.
2. First enabled configured provider.
3. Auto-detected web sessions, beginning with Gemini Web.
4. `null`.

`isXxxWebAvailable()` must probe credentials only. It must not send an expensive model request.

Provider records use this practical shape:

```javascript
{
  id: 'unique-id',
  name: 'Display name',
  type: 'gemini' | 'openai' | 'gemini-web' | '...',
  enabled: true,
  apiKey: 'only for direct API providers',
  apiUrl: 'only for OpenAI-compatible providers',
  model: 'optional provider model'
}
```

`setProviders()` encrypts API keys before `chrome.storage.local` persistence (`lib/ai/provider.js:71-79`). Web-session providers use a browser login, not an API key.

## Web Driver Contract

Every web driver exposes:

```javascript
export async function callXxxWeb(prompt, model = 'default-model') {
  // Resolve session credentials.
  // Make one authenticated vendor request.
  // Parse transport records.
  // Return final text.
}

export async function isXxxWebAvailable() {
  // Return whether credentials are usable.
}
```

Required behavior:

- Use `lib/web-provider-utils.js` for cookie headers, credential cache, SSE, and NDJSON when applicable.
- Detect auth loss from status and provider login HTML/text.
- Invalidate stale cached credentials.
- Throw `Error('NOT_LOGGED_IN')` for authentication failures.
- Throw ordinary errors for protocol, transport, or parse failures.
- Do not return raw `Response`, task handles, or provider-specific payloads.

## Credential Sources

| Source | Use | Existing example |
|---|---|---|
| Cookie only | Service worker reads cookies, attaches explicit `Cookie` header | Gemini, Qwen, Grok |
| Page `localStorage` | Driver messages a tab; content script reads local state | Kimi, DeepSeek |
| Meta/cookie/page state | Content script gathers XSRF and account values | Qwen CN |
| Page-context signer | Content script injects page-realm script; receives `postMessage` result | Doubao |

Use the weakest bridge that works. Cookie-only is simpler. Do not inject a page script unless the vendor requires a page-context signer.

## Error and Retry Rules

| Condition | Required behavior |
|---|---|
| Missing session / login redirect / 401 / 403 | Clear credentials; throw `NOT_LOGGED_IN` |
| Network or vendor protocol failure | Throw descriptive ordinary error |
| Completed response has no valid candidate | At most one retry with refreshed credentials when established by the reference driver |
| Feature JSON invalid | Feature returns a parse failure; driver remains transport-only |

Gemini reference: detects login HTML at `lib/gemini-web.js:98-110` and `:240-244`; retries exactly once after an empty parse at `:253-259`. Its POST `401`/`403` branch at `:233-235` clears the cache but throws an ordinary error. This is a current implementation inconsistency, not a contract to copy.

## Manifest Requirements

The baseline is in `manifest.json:7-87`:

- `storage`: provider records and active ID.
- `cookies`: session extraction, especially Edge-compatible service worker fetches.
- `tabs`: locate a provider page for content-script token bridges.
- provider `host_permissions`: page origin and any direct API origin.
- module service worker: `background.js`.
- content script at `document_start` when page hooks must observe early requests.

Do not add `<all_urls>` merely for a provider. Prompt Ark has it for its global picker. A new extension should grant the narrowest hosts that support its actual UX.
