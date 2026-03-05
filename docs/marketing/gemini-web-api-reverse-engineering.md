# I spent a night reverse engineering Gemini's internal API to understand how it authenticates requests

Posted to **r/programming** or **r/webdev**

---

I've been building **[Prompt Ark](https://github.com/keyonzeng/prompt_ark)**, a Chrome extension for managing AI prompts (think: a personal library of reusable templates for ChatGPT, Gemini, etc.). One feature I wanted to add was AI-powered translation — automatically localizing a prompt's title, tags, and content into a target language.

The obvious option was to call the Gemini or OpenAI API directly. But that requires the user to set up an API key, which has real friction. Then I thought: most of my users probably already have Gemini open in another tab. The web client is making API calls right now. What if the extension could piggyback on that session?

That rabbit hole led me to spend a night tracing through the full authentication mechanism. Here's what I found — nothing here isn't already visible in DevTools on any logged-in session.

---

## How the web client authenticates

When you load `gemini.google.com`, the page HTML contains a section of embedded JSON called `WIZ_global_data`. Three values from it are used as auth parameters in every API call:

```javascript
// These are extracted from the page HTML via regex
const atValue = extractWizValue('SNlM0e', html); // XSRF token → POST body
const blValue = extractWizValue('cfb2h',  html); // build label → ?bl= URL param
const fSid    = extractWizValue('FdrFJe', html); // session ID  → ?f.sid= URL param
```

Each goes to a different part of the request. Mixing them up or omitting one causes failures at different stages.

---

## The interesting part: synchronized per-request identifiers

Every message request generates two random identifiers that must appear **in both the HTTP headers and the request body**. If either location is missing or mismatched, you get a `400`.

```javascript
const traceId   = randomHex16();                      // 16-char hex
const requestId = crypto.randomUUID().toUpperCase();  // standard UUID

// Headers:
'x-goog-ext-525001261-jspb': `[1,null,null,null,"${MODEL_ID}",null,null,0,[4],null,null,2]`
'x-goog-ext-525005358-jspb': `["${requestId}",1]`
```

And inside the `f.req` body (a 68-element sparse JSON array):

```javascript
inner[4]  = traceId;    // must match the hex in ext-525001261 header
inner[59] = requestId;  // must match the UUID in ext-525005358 header
```

I'm guessing this is a CSRF-style defense — a server-generated token isn't practical here since it's a streaming endpoint, so they validate that the client itself generated a consistent token pair. Would love to hear from anyone who knows the actual design rationale.

---

## The f.req structure

The `f.req` parameter is a JSON-serialized 68-element sparse array. Most indices are null. The ones that actually matter:

| Index | Value | Purpose |
|---|---|---|
| `[0]` | `[prompt, 0, null, null, null, null, 0]` | user message |
| `[1]` | `['en']` | language |
| `[4]` | 16-char hex | must match header trace ID |
| `[59]` | UUID | must match header request ID |

The outer structure is `[null, JSON.stringify(inner)]`. So the whole thing is double-serialized, which is... classic Google.

---

## Parsing the streaming response

The response is a line-delimited stream, each line prefixed with `)]}'\n` (Google's standard anti-XSSI prefix). The actual text is nested about 5 levels deep:

```javascript
const envelope = JSON.parse(line.replace(/^\)\]\}'/, '').trim());
const payload  = JSON.parse(envelope[0][2]); // inner string, double-encoded
const text     = payload[4][0][1][0];        // the model's response text
```

One quirk: even when asking for JSON output, the response is often wrapped in markdown code fences:

    ```json
    {"result": "..."}
    ```

So you need to strip those before attempting to parse.

---

## What changed silently

I noticed the authentication scheme had drifted from what I'd seen documented elsewhere. Here's what's different now (as of early March 2026):

- `x-goog-ext-525005358-jspb` is now required (wasn't in older captures)
- `x-goog-ext-525001261-jspb` now has 12 elements instead of fewer; position `[11]` changed from `1` to `2`
- `f.req` inner array expanded from ~3 elements to 68
- `?f.sid=` and `?hl=` are now mandatory URL params

These kinds of changes are obviously unannounced. The only way to catch them is to compare your outgoing requests against what the official webapp sends. A simple `fetch` interceptor does the job:

```javascript
window.fetch = new Proxy(window.fetch, {
  apply(target, thisArg, args) {
    if (args[0]?.includes?.('StreamGenerate')) {
      console.log('[URL]', args[0]);
      console.log('[BODY]', args[1]?.body?.toString?.());
    }
    return Reflect.apply(target, thisArg, args);
  }
});
```

Inject that in the console before sending a message and you get the full raw request to diff against.

---

## Why I found this interesting

Most auth mechanisms I've worked with use either static API keys or OAuth flows. This per-request synchronized-token approach where the client generates a random pair and proves consistency across two channels is less common at the application layer. If anyone's seen similar patterns in other large-scale systems, I'm curious about the design tradeoffs.

The debugging workflow itself was also a useful exercise: inject an interceptor → capture real request → decode all the nested JSON layers → compare field by field. Applies to any opaque web API.

---

If you want to see the full `gemini-web.js` implementation in context, it's part of **Prompt Ark** — the Chrome extension I mentioned at the top: [github.com/keyonzeng/prompt_ark](https://github.com/keyonzeng/prompt_ark)

*Tested in Chrome on a logged-in Google account. All of this is visible in DevTools → Network tab with no special tooling.*

