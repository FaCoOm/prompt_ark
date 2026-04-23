# 模型配置指南

## 一句话结论：你可能不需要看这个页面

Prompt Ark 默认使用 **Gemini Web**，只要浏览器登录了 [gemini.google.com](https://gemini.google.com)，提示词优化、翻译、智能转换、标题/分类/标签提取等 AI 功能就能直接用。只有以下情况才需要配置：
- 想用 **DeepSeek、Kimi、Qwen、Grok、GLM** 等你更常用的 Web 会话模型
- 想通过 **Gemini API** 或 **OpenAI 兼容 API** 获得更稳定/更快的响应
- 公司或团队已经提供了统一 API Key

## 不配置 API Key 能用什么？

| 功能 | 状态 |
|---|---|
| ✨ 提示词选择器 | 始终可用 |
| ⚡ 快捷指令（润色、翻译……） | 始终可用，使用当前平台自己的聊天模型 |
| 🔮 提示词优化（3 个变体） | 默认通过 Gemini Web 可用 |
| 🌐 提示词翻译 | 默认通过 Gemini Web 可用 |
| 🪄 智能转换 | 默认通过 Gemini Web 可用 |
| 🏷️ 自动提取标题/分类/标签 | 默认通过 Gemini Web 可用 |

## 添加模型供应商

进入 **设置 → 模型 → 点 +**。

| 字段 | 填什么 |
|---|---|
| **别名** | 随便起，如“我的 DeepSeek”或“公司网关” |
| **类型** | 选择 Web 会话模型、`Gemini API` 或 `OpenAI 兼容` |
| **API Key** | 只有 API 类型需要；Web 会话模型不用填 |
| **模型** | API 类型可填 `gemini-2.0-flash`、`gpt-4o-mini`、`deepseek-chat` 等；Web 类型可留空或使用默认 |
| **API URL** | 仅 `OpenAI 兼容` 需要，如 `https://api.openai.com/v1` 或你的代理/厂商地址 |

点 **保存**，再点供应商旁边的单选按钮激活即可。

## 支持的供应商类型

| 类型 | 工作原理 | 需要 API Key？ | 适合谁 |
|---|---|---|---|
| **Gemini Web**（默认） | 使用浏览器里的 Gemini 登录会话 | 否 | 零配置、先装先用 |
| **DeepSeek Web** | 使用 `chat.deepseek.com` 登录会话 | 否 | 想用 DeepSeek 网页会话 |
| **Kimi Web / Qwen Web / Grok Web / GLM Web / Doubao Web** | 使用对应平台的网页登录会话 | 否 | 已经常驻这些平台的用户 |
| **ChatGPT Web** | 使用 ChatGPT 网页会话 | 否 | 实验性选项，适合愿意手动验证的用户 |
| **Gemini API** | Google AI API 直连 | 是 | 追求稳定 API 调用 |
| **OpenAI 兼容** | 任意 OpenAI 协议接口 | 是 | OpenAI、DeepSeek API、Groq、Together、自建网关等 |

> Web 会话模型依赖对应网站的登录状态和网页接口，部分 AI 功能的支持程度可能略有不同。如果某个 Web 模型返回异常，先打开对应官网确认已经登录。

## DeepSeek API 怎么填？

DeepSeek API 走 **OpenAI 兼容** 类型：

| 字段 | 示例 |
|---|---|
| 类型 | `OpenAI 兼容` |
| API URL | `https://api.deepseek.com/v1` |
| API Key | 你的 DeepSeek API Key |
| 模型 | `deepseek-chat` |

如果你想使用 DeepSeek 网页会话，则选择 **DeepSeek Web (免 Key)**，登录 [chat.deepseek.com](https://chat.deepseek.com) 即可。

## 分类与元数据会用哪个模型？

Prompt Ark v2 的标题、标签、输出类型和分类推荐都会走当前激活的 AI 供应商。分类结果会包含置信度：
- 高置信度会自动归入系统分类或已有自定义分类
- 不确定时会进入“分类待确认”状态，保存或分享前可以手动确认

## Edge 浏览器

完整支持。Gemini Web、DeepSeek Web 等 Web 会话模型会通过显式 Cookie/会话读取做跨浏览器兼容。
