# Model Configuration

## TL;DR — You Probably Don't Need This Page

Prompt Ark uses **Gemini Web** by default. If you're logged into [gemini.google.com](https://gemini.google.com), AI optimization, translation, Smart Convert, and title/category/tag extraction work immediately. You only need this guide if you want:
- Web-session providers such as **DeepSeek, Kimi, Qwen, Grok, or GLM**
- More stable or faster API calls through **Gemini API** or an **OpenAI-compatible API**
- Team or enterprise API credentials

## What Works Without Any API Key

| Feature | Status |
|---|---|
| ✨ Prompt Picker | Always works |
| ⚡ Quick Actions (Rewrite, Translate...) | Always works, using the current chat platform's own model |
| 🔮 Prompt Optimization (3 variants) | Works via Gemini Web by default |
| 🌐 Prompt Translation | Works via Gemini Web by default |
| 🪄 Smart Convert | Works via Gemini Web by default |
| 🏷️ Auto-extract title/category/tags | Works via Gemini Web by default |

## Adding Your Own Provider

Go to **Settings → Models → Click +**.

| Field | What to put |
|---|---|
| **Name** | Anything, such as "My DeepSeek" or "Team Gateway" |
| **Type** | Choose a Web-session provider, `Gemini API`, or `OpenAI Compatible` |
| **API Key** | Only needed for API providers; leave empty for Web-session providers |
| **Model** | For APIs, use values like `gemini-2.0-flash`, `gpt-4o-mini`, or `deepseek-chat`; Web providers can use their defaults |
| **API URL** | Only for `OpenAI Compatible`, such as `https://api.openai.com/v1` or your vendor/proxy endpoint |

Click **Save**, then click the radio button next to the provider to activate it.

## Supported Provider Types

| Type | How it works | API Key? | Best for |
|---|---|---|---|
| **Gemini Web** (default) | Uses your browser's Gemini login session | No | Zero-config setup |
| **DeepSeek Web** | Uses your `chat.deepseek.com` login session | No | DeepSeek users who prefer the web session |
| **Kimi Web / Qwen Web / Grok Web / GLM Web / Doubao Web** | Uses the corresponding website login session | No | Users already signed in to those platforms |
| **ChatGPT Web** | Uses the ChatGPT website session | No | Experimental use, verify manually |
| **Gemini API** | Direct Google AI API | Yes | Stable API calls |
| **OpenAI Compatible** | Any OpenAI-protocol endpoint | Yes | OpenAI, DeepSeek API, Groq, Together, self-hosted gateways |

> Web-session providers depend on the target website's login state and web interface. Feature coverage can vary slightly by provider. If a Web provider fails, open the provider's official site and confirm you're logged in.

## DeepSeek API Setup

DeepSeek API uses the **OpenAI Compatible** type:

| Field | Example |
|---|---|
| Type | `OpenAI Compatible` |
| API URL | `https://api.deepseek.com/v1` |
| API Key | Your DeepSeek API key |
| Model | `deepseek-chat` |

If you prefer the DeepSeek website session, choose **DeepSeek Web (No Key)** and log in at [chat.deepseek.com](https://chat.deepseek.com).

## Which Model Handles Classification?

Prompt Ark uses the currently active AI provider for title, tags, output modality, and category recommendations. Classification includes confidence:
- High-confidence matches are assigned to a system category or one of your existing custom categories
- Uncertain matches are marked for category review so you can confirm before sharing or publishing

## Edge Browser

Fully supported. Gemini Web, DeepSeek Web, and other Web-session providers use explicit cookie/session handling for cross-browser compatibility.
