# Portable AI Integration Packet

Use this folder to brief an AI agent working in a different extension repository. It describes how Prompt Ark integrates direct APIs and authenticated browser web sessions without assuming access to this repository.

## Read Order

1. [Architecture and Contracts](ARCHITECTURE.md)
2. [Provider Matrix](PROVIDERS.md)
3. [Implementation Packet](IMPLEMENTATION.md)

`../../PROVIDER_PORTING_GUIDE.md` is the detailed Gemini Web request/reference-driver guide. `../../API_FEATURE_ANALYSIS.md` is a broader capability inventory when available; it is not required by this packet.

## Scope

Included:

- Chrome/Edge Manifest V3 integration shape.
- UI request to service-worker to provider to feature-result flow.
- Direct Gemini/OpenAI-compatible APIs and logged-in browser sessions.
- Session credentials, page-state bridges, result parsing, retry, and login failures.
- Exact source packet needed before editing a target extension.

Excluded:

- Prompt storage, Hub publishing, WebDAV/Obsidian sync, picker DOM injection, and unrelated UI behavior.
- Claims that a provider's private web protocol is stable or permitted by its terms.

## Non-Negotiable Contracts

- A web driver returns final plain text: `Promise<string>`.
- Feature modules own their JSON/schema parsing; drivers own transport/session parsing.
- New web drivers normalize authentication loss to `Error('NOT_LOGGED_IN')` and invalidate credential caches.
- Prompt Ark's Gemini reference currently normalizes login HTML, but exposes POST `401`/`403` as ordinary errors after clearing its cache; porters should fix that inconsistency rather than copy it.
- A retry is bounded. Gemini retries once only when no valid result parsed.
- Add a provider everywhere its type is dispatched; a driver alone is incomplete.

## Minimum Source Context

Give a fresh agent these files from the target extension before it edits anything:

```text
manifest.json
background.js
lib/ai/provider.js
lib/web-provider-utils.js
popup.js
content.js
lib/gemini-web.js
PROVIDER_PORTING_GUIDE.md
```

Add the target provider's reference driver and every feature module that has a `provider.type` branch. The precise list is in [Implementation Packet](IMPLEMENTATION.md).

## Stop Condition

Stop when one provider can be selected in the UI, invoked from one real feature, return a validated result while logged in, and return `NOT_LOGGED_IN` while logged out. Do not add streaming, persistent task storage, browser UI automation, or extra providers unless explicitly required.
