# 模型配置指南

## 一句话结论：你可能不需要看这个页面

Prompt Ark 默认用 **Gemini Web**（免费，不需要 API Key）就能正常工作。只有以下情况才需要配置：
- ⚡ 想要**更快**的响应（API 比网页抓取更快）
- 🎯 想用**特定模型**（GPT-4o、DeepSeek 等）
- 🏢 公司提供了**企业 API 额度**

## 不配置 API Key 能用什么？

| 功能 | 状态 |
|---|---|
| ✨ 提示词选择器 | ✅ 始终可用 |
| ⚡ 快捷指令（润色、翻译……） | ✅ 始终可用 — 用平台自身的 AI |
| 🔮 提示词优化（3 个变体） | ✅ 通过 Gemini Web 可用 |
| 🏷️ 自动提取标题/分类/标签 | ✅ 通过 Gemini Web 可用 |

## 添加自定义供应商

**设置 → 模型 → 点 +**

| 字段 | 填什么 |
|---|---|
| **别名** | 随便（如"我的 DeepSeek"） |
| **类型** | `Gemini API` 或 `OpenAI 兼容` |
| **密钥** | 你的 API Key |
| **模型** | `gemini-2.0-flash`、`gpt-4o-mini`、`deepseek-chat` 等 |
| **接口地址** | 仅 OpenAI 兼容需要（如 `https://api.openai.com/v1`） |

点 **保存**，点单选按钮激活，搞定。

## 支持的供应商类型

| 类型 | 工作原理 | 需要 API Key？ |
|---|---|---|
| **Gemini Web**（默认） | 用浏览器的 Gemini 登录会话 | ❌ 免费 |
| **Gemini API** | Google AI 接口直连 | ✅ 需要 |
| **OpenAI 兼容** | 任何 OpenAI 协议 API（OpenAI、DeepSeek、Groq、Together 等） | ✅ 需要 |

## Edge 浏览器

完整支持。Gemini Web 使用显式 Cookie 处理确保跨浏览器兼容。
