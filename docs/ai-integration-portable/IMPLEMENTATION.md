# Implementation Packet

## Give This Context to a Fresh Agent

### Always Required

| File | Why |
|---|---|
| `manifest.json` | MV3 entrypoints, permissions, host access |
| `background.js` | Service-worker imports, message switch, raw provider dispatch |
| `lib/ai/provider.js` | Provider persistence, selection, direct API and metadata routes |
| `lib/web-provider-utils.js` | Cookie headers, caches, SSE/NDJSON utilities |
| `popup.js` | Provider form, labels, active-provider UI |
| `lib/gemini-web.js` | Canonical web-session driver |
| `PROVIDER_PORTING_GUIDE.md` | Complete Gemini lifecycle and driver wiring |

### Only When Needed

| Need | Include |
|---|---|
| Page-state credentials or signer | `content.js` and matching driver |
| Metadata extraction | `lib/ai/provider.js` and prompt templates it loads |
| Prompt optimization | `lib/ai/optimize.js` |
| Translation | `lib/ai/translate.js` |
| Smart Convert | `lib/ai/smart-convert.js` |
| Video generation | `lib/ai/video-prompt.js` |
| Social/article sharing | `lib/ai/share.js` |
| New provider | nearest matching `lib/*-web.js` reference driver |

Do not send every file by default. Start with the always-required packet and exact feature/provider files. Add `content.js` only for a documented page bridge.

## Execution Checklist

### 1. Select the Smallest Delivery Slice

Choose one feature and one provider. Recommended first slice: metadata extraction or raw text generation through an official API. Use Gemini Web only when the product specifically needs logged-in-session behavior.

### 2. Add Provider Configuration

- Define the type token once and reuse it exactly.
- Save provider records through the existing provider storage path.
- Hide API-key input for web-session types.
- Keep a selected active provider and a fallback chain.

### 3. Implement Driver Before Feature Branches

- Implement `callXxxWeb()` and `isXxxWebAvailable()`.
- Reuse cookie/cache/stream helpers.
- Return final text only.
- Test logged-in, logged-out, empty-response, and malformed-response paths.

### 4. Wire Every Dispatch Surface

- Service-worker import.
- Raw text `callProvider()` branch where present.
- Metadata dispatcher.
- Auto-detection.
- UI type list and labels.
- Feature-specific `provider.type` branches.
- Content bridge, only if required.
- Manifest host permissions.

### 5. Preserve Boundary Ownership

| Concern | Owner |
|---|---|
| Session discovery, vendor HTTP, stream parsing | Driver |
| Prompt instruction, JSON/schema extraction | Feature module |
| Request routing, response envelope, login navigation | Service worker |
| Form fields and active-provider control | Popup |
| Page-local state/signature collection | Content script |

## Required Verification

Use binary checks. Do not claim support from a successful import alone.

| Scenario | Action | Pass condition |
|---|---|---|
| Logged-in happy path | Configure/select provider; invoke one real feature | UI receives schema-valid result |
| Logged-out session | Remove/expire vendor session; invoke same feature | UI receives identifiable `NOT_LOGGED_IN` path; no fake result |
| Invalid transport result | Mock/capture malformed vendor payload where testable | Driver throws; feature does not persist malformed data |
| Existing provider regression | Invoke prior default provider | Its result remains valid |
| MV3 lifecycle | Let call exceed idle threshold where applicable | Request completes or explicit keep-alive/port strategy is proven |

`keepAlive()` exists in `lib/ai/provider.js:51-56`, but current callers are image/video flows, not normal text or Gemini Web calls. For a long-running provider, prove completion past the idle threshold or add the smallest explicit keep-alive/port strategy. A normal web-session call remains buffered; do not add a streaming channel unless progressive output is explicitly required.

## Common Failure Modes

| Symptom | Likely missing surface |
|---|---|
| UI type absent | `popup.js` registry/label/form gating |
| Driver never selected | `getActiveProvider()` auto-detect or provider persistence |
| Cross-origin fetch fails | host permission or explicit cookie header |
| Works in Chrome, fails Edge | cookie helper / service-worker credential behavior |
| 401 after a prior success | stale credential cache not cleared |
| No token available | required `content.js` bridge absent or provider tab unavailable |
| Text returned but feature fails | feature-level JSON/schema parser not updated |
| Driver works in one feature only | omitted `provider.type` branch elsewhere |

## Deliberate Non-Features

Prompt Ark's standard path does not implement provider task IDs, queued work, polling, resumable jobs, token-by-token client streaming, uploads, or account round-robin. Add one only after a concrete feature requires it. The smallest reliable unit remains: one feature request, one selected provider, one final result.
