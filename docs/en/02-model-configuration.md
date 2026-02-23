# Model Configuration

## TL;DR — You Probably Don't Need This Page

Prompt Ark works **out of the box** with Gemini Web (free, no API key). You only need this guide if you want:
- ⚡ **Faster** responses (API is faster than web scraping)
- 🎯 A **specific model** (GPT-4o, DeepSeek, etc.)
- 🏢 **Team/enterprise** API credentials

## What Works Without Any API Key

| Feature | Status |
|---|---|
| ✨ Prompt Picker | ✅ Always works |
| ⚡ Quick Actions (Rewrite, Translate...) | ✅ Always works — uses the platform's own AI |
| 🔮 Prompt Optimization (3 variants) | ✅ Works via Gemini Web |
| 🏷️ Auto-extract title/category/tags | ✅ Works via Gemini Web |

## Adding Your Own Provider

**Settings → Models → Click +**

| Field | What to put |
|---|---|
| **Name** | Anything (e.g., "My DeepSeek") |
| **Type** | `Gemini API` or `OpenAI Compatible` |
| **API Key** | Your secret key |
| **Model** | `gemini-2.0-flash`, `gpt-4o-mini`, `deepseek-chat`, etc. |
| **API URL** | Only for OpenAI Compatible (e.g., `https://api.openai.com/v1`) |

Click **Save**. Click the radio button to activate it. Done.

## Supported Provider Types

| Type | How it works | API Key? |
|---|---|---|
| **Gemini Web** (default) | Uses your browser's Gemini login session | ❌ Free |
| **Gemini API** | Direct Google AI API | ✅ Required |
| **OpenAI Compatible** | Any OpenAI-protocol endpoint (OpenAI, DeepSeek, Groq, Together, etc.) | ✅ Required |

## Edge Browser

Fully supported. Gemini Web uses explicit cookie handling for cross-browser compatibility.
