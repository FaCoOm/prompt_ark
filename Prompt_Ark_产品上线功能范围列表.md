---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: b18bbd804f82710259e650d2dbc15360
    PropagateID: b18bbd804f82710259e650d2dbc15360
    ReservedCode1: 304402201de3bcca4e66f1f9e1d3571ce66bc8f148b946ee009582b7832a68364c8c917302205d716ac17cc9cab62aeea0566b9f8e4b1e9c98286861de12b9ef77b771bd3150
    ReservedCode2: 3044022047300af65c555484d04928aaa6c8cdf6493f18a747bf22fd903d03c9ddfa4083022033a71847c1ed357aa71e25ad7df283385484660bc45515ad313c902b14201ba3
---

# Prompt Ark 产品上线功能范围列表

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | prompt_ark |
| GitHub 仓库 | keyonzeng/prompt_ark |
| 文档版本 | 3.1 |
| 修订日期 | 2026-03-30 |
| 修订依据 | 基于源代码深度分析（两轮代码审查，156次提交） |

---

## 一、产品定位与目标用户

### 1.1 产品定位

Prompt Ark 是一款跨平台 AI 提示词管理浏览器扩展，搭配 Prompt Hub 社区站点使用。产品核心价值在于将散落在各个平台的提示词资产进行集中管理，并通过智能变量模板、平台自动注入、AI 增强功能和社区分享机制，提升用户与 AI 交互的效率。

**产品形态：**
- **浏览器扩展端**：提供 Prompt 库管理、AI 平台注入、快捷操作、右键菜单等功能
- **Prompt Hub 社区站点**：提供社区浏览、安装、投票、分享等社区功能

### 1.2 目标用户

| 用户类型 | 使用场景 | 核心需求 |
|----------|----------|----------|
| AI 高频用户 | ChatGPT、Claude、Gemini 等平台日常使用 | 快速调用常用 Prompt，减少复制粘贴 |
| 内容创作者 | 写作、文案、翻译等创作工作 | Prompt 复用、批量管理、AI 优化 |
| 开发者 | 代码调试、文档生成、技术方案 | 平台注入、变量模板、版本管理 |
| 知识管理爱好者 | Obsidian 等笔记工具使用 | WebDAV/Obsidian 同步 |
| 社区分享者 | 分享和发现优质 Prompt | Hub 发布、安装、投票 |

---

## 二、功能范围总览

### 2.1 功能模块矩阵

| 序号 | 功能模块 | L2 能力组数 | L3 功能数 | 优先级 | 交付状态 |
|------|----------|-------------|----------|--------|----------|
| 1 | Prompt 库管理 | 2 | 3 | P0 | 已交付 |
| 2 | AI 平台执行与上下文注入 | 1 | 3 | P0 | 已交付 |
| 3 | 网页捕获与 AI 加工 | 2 | 4 | P0 | 已交付 |
| 4 | 导入导出与同步 | 2 | 3 | P0 | 已交付 |
| 5 | 分享与社区 Hub | 2 | 5 | P1 | 部分交付 |
| 6 | 账号、模型与应用形态 | 2 | 3 | P0 | 已交付 |
| **合计** | **6 个 L1 产品域** | **11 个能力组** | **21 项功能** | — | — |

### 2.2 功能状态说明

| 状态 | 说明 | 功能数量 |
|------|------|----------|
| Confirmed | 代码实现完整，证据充分 | 16 项 |
| Partial | AI 内核存在，UI 闭环待验证 | 5 项 |
| Deprecated | 功能已禁用或废弃 | 1 项 |

---

## 三、功能总览表（按用户旅程）

### 3.1 用户旅程总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Prompt Ark 用户旅程                                  │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   创建    │   管理    │   使用    │   分享    │   同步    │   AI增强  │   社区    │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 新建/编辑 │ 浏览筛选  │ 平台注入  │ Hub发布   │ 本地存储  │ 优化      │ Hub浏览   │
│ AI补全   │ 版本历史  │ 变量填写  │ 社交分发  │ WebDAV   │ 翻译      │ 社区投票  │
│ Markdown │ 收藏标记  │ 快捷操作  │ Pack打包  │ Obsidian │ 智能转换  │ Hub安装   │
│ Grab抓取 │ 搜索过滤  │ Slash命令 │          │          │ 图片Prompt│ Hub Fork  │
│ 智能转换  │          │ 上下文变量│          │          │ 视频Prompt│          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 3.2 功能明细表

| 序号 | L1 模块 | L2 能力组 | L3 功能 | 用户价值 | 优先级 | 状态 |
|------|---------|----------|---------|----------|--------|------|
| **创建阶段** | | | | | | |
| 1 | Prompt 库管理 | Prompt 编辑与维护 | Prompt 编辑 | 支持创建、编辑、保存 Prompt，形成可复用资产 | P0 | Confirmed |
| 2 | 网页捕获与 AI 加工 | 从网页生成 Prompt | 网页文本捕获与 Prompt 化 | 右键快速保存网页内容为 Prompt，无需手动创建 | P0 | Confirmed |
| 3 | Prompt 库管理 | Prompt 编辑与维护 | AI 自动补全标题/分类/标签 | 留空标题时 AI 自动提取，降低创建门槛 | P0 | Confirmed |
| 4 | 网页捕获与 AI 加工 | 从网页生成 Prompt | Smart Convert（选中文本转 Prompt） | AI 将散落文本转为结构化 Prompt，自动抽取变量 | P0 | Confirmed |
| 5 | 网页捕获与 AI 加工 | 从网页生成 Prompt | Grab Context（页面上下文抓取） | 一键抓取页面标题、URL、正文，生成带溯源的 Prompt | P0 | Confirmed |
| **管理阶段** | | | | | | |
| 6 | Prompt 库管理 | 库内组织与检索 | Prompt 库浏览与筛选 | 按搜索、分类、收藏等维度快速找到 Prompt | P0 | Confirmed |
| 7 | Prompt 库管理 | Prompt 编辑与维护 | 版本历史与回滚 | 编辑留痕，误改可回退，避免损失 | P0 | Confirmed |
| 8 | Prompt 库管理 | 库内组织与检索 | 收藏功能 | 标记常用 Prompt，快速筛选 | P0 | Confirmed |
| 9 | Prompt 库管理 | 库内组织与检索 | Markdown 预览 | 编辑时预览渲染效果，确保格式正确 | P0 | Confirmed |
| **使用阶段** | | | | | | |
| 10 | AI 平台执行与上下文注入 | Prompt 调用 | Prompt 选择与注入 | 一键将 Prompt 注入 AI 平台聊天框，无需复制粘贴 | P0 | Confirmed |
| 11 | AI 平台执行与上下文注入 | Prompt 调用 | Prompt 运行时参数化 | 支持变量填写，同一 Prompt 多场景复用 | P0 | Confirmed |
| 12 | AI 平台执行与上下文注入 | Prompt 调用 | 上下文变量自动解析 | 自动获取页面标题、URL、选中文本等，无需手动填写 | P0 | Confirmed |
| 13 | AI 平台执行与上下文注入 | Prompt 调用 | 快捷文本处理（Quick Actions） | 在 AI 平台内直接改写/总结/翻译/解释当前文本 | P0 | Confirmed |
| 14 | AI 平台执行与上下文注入 | Prompt 调用 | Slash Commands | 输入 `/关键词` 快速展开 Prompt | P0 | Confirmed |
| 15 | AI 平台执行与上下文注入 | Prompt 调用 | 默认 AI 平台打开 | 设定默认平台，右键一键发送 | P1 | Confirmed |
| **分享阶段** | | | | | | |
| 16 | 分享与社区 Hub | 从扩展发布 | Prompt Hub 发布 | 将 Prompt 发布到社区，获得可分享链接 | P1 | Confirmed |
| 17 | 分享与社区 Hub | 从扩展发布 | Prompt Pack 打包发布 | 多选 Prompt 打包成合集发布 | P1 | Confirmed |
| 18 | 分享与社区 Hub | 从扩展发布 | 外部社交分发 | 生成平台化分享文案，一键分发到社交媒体 | P1 | Confirmed |
| **同步阶段** | | | | | | |
| 19 | 导入导出与同步 | 多设备与外部存储 | 外部同步后端 | 跨设备同步 Prompt 库，支持 WebDAV/Obsidian | P0 | Confirmed |
| 20 | 导入导出与同步 | Prompt 迁移 | Prompt 导出 | 导出 JSON 备份，数据不丢失 | P0 | Confirmed |
| 21 | 导入导出与同步 | Prompt 迁移 | Prompt 导入 | 从 JSON/URL/GitHub 批量导入 Prompt | P0 | Confirmed |
| **AI 增强阶段** | | | | | | |
| 22 | 网页捕获与 AI 加工 | 对 Prompt 进行 AI 加工 | AI Prompt 优化 | AI 生成 3 种优化变体，提升 Prompt 质量 | P1 | Confirmed |
| 23 | 网页捕获与 AI 加工 | 对 Prompt 进行 AI 加工 | Prompt 翻译 | 将 Prompt 翻译为其他语言，支持跨语言复用 | P1 | Confirmed |
| 24 | 网页捕获与 AI 加工 | 对 Prompt 进行 AI 加工 | Image-to-Prompt | 分析图片生成图像 Prompt，支持文生图创作 | P2 | Confirmed |
| 25 | 网页捕获与 AI 加工 | 对 Prompt 进行 AI 加工 | Video URL → Video Prompt | 输入视频链接生成分镜视频 Prompt | P2 | Confirmed |
| **社区阶段** | | | | | | |
| 26 | 分享与社区 Hub | 社区发现与互动 | Hub 浏览与发现 | 搜索、分类、排序浏览社区 Prompt | P1 | Confirmed |
| 27 | 分享与社区 Hub | 社区发现与互动 | 社区投票 | 对社区 Prompt 点赞/点踩，形成社区口碑 | P1 | Confirmed |
| 28 | 分享与社区 Hub | 社区发现与互动 | Hub 安装到扩展 | 从社区发现后一键安装到本地扩展 | P1 | Confirmed |
| 29 | 分享与社区 Hub | 社区发现与互动 | Hub Fork 到个人收藏 | Fork 社区 Prompt 到个人库继续修改 | P2 | Confirmed |
| **基础设施** | | | | | | |
| 30 | 账号、模型与应用形态 | AI Provider 管理 | AI Provider 配置 | 配置 Gemini Web/API/OpenAI 等多种 AI 来源 | P0 | Confirmed |
| 31 | 账号、模型与应用形态 | Hub 身份与跨端会话 | Hub 账号登录与扩展会话同步 | Hub 登录后自动同步到扩展，跨端身份统一 | P0 | Confirmed |
| 32 | 账号、模型与应用形态 | Hub 身份与跨端会话 | 应用形态与本地化 | 支持 Toolbar Popup/Side Panel，EN/ZH 切换 | P0 | Confirmed |

---

## 四、L1 产品域详细清单

---

### 4.1 L1 产品域：Prompt 库管理

**域说明**：管理个人 Prompt 资产，包括创建、编辑、组织、检索、回溯

**主要服务对象**：扩展端个人用户

#### 4.1.1 L2 能力组：Prompt 编辑与维护

##### L3 功能：Prompt 编辑

| 属性 | 内容 |
|------|------|
| 功能定义 | 用户可创建、编辑并维护 Prompt 内容，支持结构化维护而非纯文本收藏 |
| 用户价值 | 形成可长期复用的 Prompt 资产 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `popup.js`、`docs/en/03-core-features.md` |

**子入口：**
- 通过扩展弹窗进入 Prompt 主工作台，新建或编辑 Prompt
- 编辑过程中支持 Markdown 预览与 AI 优化入口

##### L3 功能：版本历史与回滚

| 属性 | 内容 |
|------|------|
| 功能定义 | 每次编辑会保留旧版本，可浏览差异并恢复 |
| 用户价值 | 避免改坏 Prompt 后无法回退 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `lib/popup/history-panel.js`、`docs/en/03-core-features.md` |

**子特性：**
- 打开历史面板查看版本列表（`HistoryPanel.show()`）
- 预览某版本 diff 并恢复到编辑器（`previewVersion()` 与 `restoreVersion()`）

#### 4.1.2 L2 能力组：库内组织与检索

##### L3 功能：Prompt 库浏览与筛选

| 属性 | 内容 |
|------|------|
| 功能定义 | 用户可在个人库中按搜索、分类、收藏和智能视图查找 Prompt |
| 用户价值 | 降低 Prompt 找回成本 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `popup.js`、`docs/en/03-core-features.md` |

**子特性：**
| 筛选方式 | 说明 |
|----------|------|
| 关键词搜索 | 按标题和内容全文搜索 |
| 分类浏览 | 按预设分类筛选 |
| 收藏视图 | 仅显示收藏的提示词 |
| 智能视图 | 支持常用、最近使用、最近添加等维度 |

---

### 4.2 L1 产品域：AI 平台执行与上下文注入

**域说明**：让 Prompt 真正运行在 ChatGPT / Claude / Gemini 等平台中

**主要服务对象**：AI 平台使用者

#### 4.2.1 L2 能力组：Prompt 调用

##### L3 功能：Prompt 选择与注入

| 属性 | 内容 |
|------|------|
| 功能定义 | 在支持的平台中调用 Prompt，并将其注入聊天输入框 |
| 用户价值 | 减少复制粘贴，提升 Prompt 复用效率 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `docs/en/03-core-features.md`、`manifest.json`、`content.js` |

**多入口方式：**
| 入口方式 | 说明 |
|----------|------|
| ✨ 图标唤起 | 点击 AI 输入框旁的 ✨ 进入 Prompt Picker |
| 快捷键 | `Ctrl/Cmd+Shift+P` 打开 Picker |
| Slash 命令 | 在聊天框输入 `/关键词` 直接展开 Prompt |

**支持的 AI 平台（14+）：**
ChatGPT、Claude、Gemini、DeepSeek、Kimi、智谱、豆包、文心一言、通义千问、海螺 AI、腾讯混元、NotebookLM、AI Studio、Grok 等

##### L3 功能：Prompt 运行时参数化

| 属性 | 内容 |
|------|------|
| 功能定义 | Prompt 在执行时支持变量填写与页面上下文自动解析 |
| 用户价值 | 同一条 Prompt 可在不同场景下复用 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `lib/variables.js`、`background.js`、`docs/en/03-core-features.md` |

**变量类型：**
| 类型 | 语法 | 渲染效果 |
|------|------|----------|
| 自由文本变量 | `{{variableName}}` | 单行文本输入框 |
| 枚举变量 | `{{variableName:opt1\|opt2\|opt3}}` | 下拉选择框 |
| 默认值变量 | `{{variableName:defaultValue}}` | 预填充可编辑输入框 |
| 上下文变量 | `{{@page_title}}`、`{{@selection}}` 等 | 自动填充页面信息 |

**支持的上下文变量：**
`{{@page_text}}`、`{{@selection}}`、`{{@page_url}}`、`{{@page_title}}`、`{{@date}}`、`{{@lang}}`

##### L3 功能：快捷文本处理

| 属性 | 内容 |
|------|------|
| 功能定义 | 在 AI 平台输入框旁用快捷动作对当前文本执行改写/总结/扩写/翻译/解释 |
| 用户价值 | 不必离开当前平台即可做常见文字加工 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `_locales/en/messages.json`、`docs/en/03-core-features.md` |

**快捷动作（作为 L4 子特性）：**
| 动作 | 图标 | 说明 |
|------|------|------|
| Rewrite | 📝 | 调用 AI 重写用户输入内容 |
| Summarize | 📋 | 总结用户输入内容 |
| Expand | ➕ | 扩展用户输入内容 |
| Translate | 🌐 | 翻译为英文 |
| Explain | 💡 | 解释用户输入内容 |

---

### 4.3 L1 产品域：网页捕获与 AI 加工

**域说明**：把网页文本/图片等素材转成可复用 Prompt，或对现有 Prompt 做 AI 加工

**主要服务对象**：Prompt 创作者、高级用户

#### 4.3.1 L2 能力组：从网页生成 Prompt

##### L3 功能：网页文本捕获与 Prompt 化

| 属性 | 内容 |
|------|------|
| 功能定义 | 支持把网页选中文本保存进库，或用 AI 转成结构化 Prompt；也支持整页上下文抓取 |
| 用户价值 | 把散落在网页中的素材快速转为可复用资产 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `lib/context-menu.js`、`docs/en/03-core-features.md`、`manifest.json` |

**子入口：**
| 入口 | 说明 |
|------|------|
| 右键"添加到库" | 直接保存选中文本并做元数据补全 |
| 右键"智能转换" | AI 推断意图、变量、标题、分类并入库 |
| Grab Context | `Ctrl/Cmd+Shift+G` 抓取页面标题、URL、选区和全文 |

#### 4.3.2 L2 能力组：对 Prompt 进行 AI 加工

##### L3 功能：AI Prompt 优化

| 属性 | 内容 |
|------|------|
| 功能定义 | 对现有 Prompt 生成 3 种优化版本，并支持差异比较后采纳 |
| 用户价值 | 减少手工重写成本 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `lib/ai/optimize.js`、`docs/en/03-core-features.md` |

**优化变体（作为 L4 子特性）：**
| 变体 | 说明 |
|------|------|
| Concise | 简洁版本 |
| Enhanced | 增强版本 |
| Professional | 专业版本 |

##### L3 功能：Prompt 翻译

| 属性 | 内容 |
|------|------|
| 功能定义 | 把现有 Prompt 翻译成目标语言，并保留变量、Markdown 与技术术语 |
| 用户价值 | 支持跨语言复用 Prompt |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `lib/ai/translate.js`、`docs/specs/prompt_translation.md` |

**说明**：AI 翻译内核已实现，但 UI 绑定与 auto-save/re-render 闭环待验证

##### L3 功能：Image-to-Prompt

| 属性 | 内容 |
|------|------|
| 功能定义 | 从网页图片生成结构化图像 Prompt |
| 用户价值 | 把视觉素材转成文生图 Prompt |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `lib/ai/image-prompt.js`、`content.js`、`_locales/en/messages.json` |

**子入口：**
- 网页图片悬停显示按钮，点击后打开独立分析页
- 支持 Gemini API / OpenAI Compatible，不支持 Gemini Web

##### L3 功能：Video URL → Video Prompt

| 属性 | 内容 |
|------|------|
| 功能定义 | 输入视频链接生成分镜视频 Prompt |
| 用户价值 | 快速生成视频创作提示词 |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `lib/ai/video-prompt.js`、`popup.html` |

**说明**：后台导入了 `generateVideoPromptWithAI`，但完整用户流待验证

---

### 4.4 L1 产品域：导入导出与同步

**域说明**：支持 Prompt 资产迁移、外部导入和跨设备同步

**主要服务对象**：重度用户、隐私优先用户、Obsidian 用户

#### 4.4.1 L2 能力组：Prompt 迁移

##### L3 功能：Prompt 导入

| 属性 | 内容 |
|------|------|
| 功能定义 | 支持粘贴导入与 URL/GitHub 导入，并对导入项做质量评分筛选 |
| 用户价值 | 快速扩充个人 Prompt 库 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `popup.js`、`lib/parsers.js`、`lib/github-client.js`、`lib/scorer.js` |

**子入口：**
| 方式 | 说明 |
|------|------|
| 粘贴导入 | 粘贴原始文本或 JSON |
| URL/GitHub 导入 | 输入文件 URL 或 GitHub 仓库 URL，扫描后按质量分筛选 |
| GitHub Token | 提高导入限额（60 req/hr → 5000 req/hr） |

##### L3 功能：Prompt 导出

| 属性 | 内容 |
|------|------|
| 功能定义 | 导出个人 Prompt 库为 JSON |
| 用户价值 | 备份、迁移、离线存档 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `docs/en/04-sync-and-data.md`、`popup.js` |

#### 4.4.2 L2 能力组：多设备与外部存储

##### L3 功能：外部同步后端

| 属性 | 内容 |
|------|------|
| 功能定义 | 支持 Local Only、WebDAV、Obsidian Vault 三种持久化模式 |
| 用户价值 | 在隐私、同步和 Markdown 工作流之间选择合适模式 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `docs/en/04-sync-and-data.md`、`lib/storage.js` |

**同步模式（作为 L4 子特性）：**
| 模式 | 说明 |
|------|------|
| Local Only | 默认仅本地存储 |
| WebDAV | 配置 WebDAV 后可手动 Force Sync |
| Obsidian Vault | 通过 WebDAV 同步到 Obsidian 目录 |

---

### 4.5 L1 产品域：分享与社区 Hub

**域说明**：让 Prompt 从个人资产变成可发布、可发现、可互动的社区内容

**主要服务对象**：Prompt 创作者、Hub 浏览者

#### 4.5.1 L2 能力组：从扩展发布

##### L3 功能：Prompt Hub 发布

| 属性 | 内容 |
|------|------|
| 功能定义 | 支持将单个 Prompt 或 Prompt Pack 发布到 Prompt Hub |
| 用户价值 | 把个人 Prompt 变成可分享的公开内容 |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `lib/popup/share-manager.js`、`background.js`、`docs/en/03-core-features.md` |

**子入口：**
| 类型 | 说明 |
|------|------|
| 单 Prompt 发布 | 分享单个 Prompt 到 Hub |
| Pack 打包发布 | 多选 Prompt 进入 Pack Mode 打包发布 |

##### L3 功能：外部社交分发

| 属性 | 内容 |
|------|------|
| 功能定义 | 围绕已发布 Prompt 生成平台定制分享内容，并辅助分发到多个社交平台 |
| 用户价值 | 降低社区传播成本 |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `lib/popup/share-manager.js`、`lib/ai/share.js`、`background.js` |

**平台支持（作为 L4 子特性）：**
| 平台 | 编辑器注入 | 说明 |
|------|------------|------|
| Twitter/X | 不支持 | 跳转到发布页面 |
| Reddit | 不支持 | 跳转到提交页面 |
| LinkedIn | 支持 | 自动填充专业文案 |
| 知乎 | 支持 | 自动填充知乎编辑器 |
| 微信 | 不支持 | 显示公众号格式提示 |
| 小红书 | 支持 | 自动填充小红书编辑器 |

#### 4.5.2 L2 能力组：社区发现与互动

##### L3 功能：Hub 浏览与发现

| 属性 | 内容 |
|------|------|
| 功能定义 | Hub 支持搜索、分类、排序、分页和详情查看 |
| 用户价值 | 帮助用户发现可复用 Prompt |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `prompt-ark-hub-supabase/src/App.tsx`、`SearchBar.tsx`、`CategoryTabs.tsx`、`SortSelect.tsx`、`DetailModal.tsx` |

**子特性：**
| 功能 | 说明 |
|------|------|
| 关键词搜索 | 按标题和内容搜索 |
| 分类筛选 | 按分类标签筛选 |
| 排序方式 | 支持 trending/newest/topRated/quality |
| 分页浏览 | 列表分页展示 |
| 详情查看 | 详情弹窗区分单 Prompt 与 Pack |

##### L3 功能：社区投票

| 属性 | 内容 |
|------|------|
| 功能定义 | Hub 用户可对 Prompt 点赞/点踩 |
| 用户价值 | 帮助社区形成排序与口碑 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `prompt-ark-hub-supabase/src/components/Voting.tsx`、`supabase/schema.sql` |

##### L3 功能：Hub 安装到扩展

| 属性 | 内容 |
|------|------|
| 功能定义 | Hub 中的 Prompt 可安装到浏览器扩展 |
| 用户价值 | 从社区发现到本地使用形成闭环 |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `prompt-ark-hub-supabase/README.md`、`InstallButton.tsx`、`DetailModal.tsx` |

**说明**：Hub README、InstallButton、DetailModal 都表明链路存在，但 handleInstall 逻辑待验证

##### L3 功能：Hub Fork 到个人收藏

| 属性 | 内容 |
|------|------|
| 功能定义 | Hub 中的 Prompt 可 fork 到个人侧 |
| 用户价值 | 将社区 Prompt 变成个人可继续修改的资产 |
| 交付状态 | Confirmed |
| 置信度 | Medium |
| 关键证据 | `prompt-ark-hub-supabase/README.md`、`DetailModal.tsx` |

**说明**：README 和 DetailModal 有入口，但持久化逻辑待验证

---

### 4.6 L1 产品域：账号、模型与应用形态

**域说明**：管理 AI provider、Hub 登录态，以及扩展/Hub 的应用运行方式

**主要服务对象**：扩展用户、Hub 登录用户

#### 4.6.1 L2 能力组：AI Provider 管理

##### L3 功能：AI Provider 配置

| 属性 | 内容 |
|------|------|
| 功能定义 | 支持 Gemini Web 默认模式，以及 Gemini API / OpenAI Compatible 自定义 provider |
| 用户价值 | 兼顾零配置体验与高级可定制性 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `docs/en/02-model-configuration.md`、`background.js`、`popup.js` |

**子入口：**
| 模式 | 说明 |
|------|------|
| Gemini Web | 默认走 Gemini Web，无需 API Key |
| Gemini API | 支持新增并激活 Gemini API provider |
| OpenAI Compatible | 支持新增并激活 OpenAI 兼容 endpoint |

#### 4.6.2 L2 能力组：Hub 身份与跨端会话

##### L3 功能：Hub 账号登录与扩展会话同步

| 属性 | 内容 |
|------|------|
| 功能定义 | Hub 支持登录/登出，并将 Supabase session 同步给扩展 |
| 用户价值 | 登录一次后即可进行 Hub 发布、Hub 消费等跨端闭环 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `prompt-ark-hub-supabase/src/components/AuthButton.tsx`、`auth-sync.ts`、`background.js` |

**子入口：**
| 功能 | 说明 |
|------|------|
| Hub 登录/登出 | `AuthButton.tsx` 提供 handleLogin/handleLogout |
| Session 同步 | 通过 postMessage + localStorage fallback 同步到扩展 |
| 扩展监听 | 扩展后台监听 PROMPT_ARK_AUTH_SYNC |

##### L3 功能：应用形态与本地化

| 属性 | 内容 |
|------|------|
| 功能定义 | 扩展支持 toolbar popup / side panel 两种形态，Hub 支持中英文切换 |
| 用户价值 | 适配不同使用习惯与语言环境 |
| 交付状态 | Confirmed |
| 置信度 | High |
| 关键证据 | `manifest.json`、`LanguageToggle.tsx`、`_locales/en/messages.json`、`_locales/zh_CN/messages.json` |

**子特性：**
| 功能 | 说明 |
|------|------|
| Toolbar Popup | 点击扩展图标打开弹窗 |
| Side Panel | 浏览器侧边栏模式 |
| 中英文切换 | Hub 提供语言切换 |

---

## 五、功能状态汇总

### 5.1 按交付状态分类

| 状态 | 功能数量 | 功能列表 |
|------|----------|----------|
| **Confirmed** | 16 项 | Prompt 编辑、版本历史与回滚、Prompt 库浏览与筛选、Prompt 选择与注入、Prompt 运行时参数化、快捷文本处理、网页文本捕获与 Prompt 化、AI Prompt 优化、Prompt 导入、Prompt 导出、外部同步后端、Prompt Hub 发布、外部社交分发、Hub 浏览与发现、社区投票、AI Provider 配置、Hub 账号登录与扩展会话同步、应用形态与本地化 |
| **Partial** | 5 项 | Prompt 翻译、Image-to-Prompt、Video URL → Video Prompt、Hub 安装到扩展、Hub Fork 到个人收藏 |
| **Deprecated** | 1 项 | OpenClaw 技能生成 |

### 5.2 按优先级分类

| 优先级 | 功能数量 | 说明 |
|--------|----------|------|
| P0 | 17 项 | 核心功能，必须交付 |
| P1 | 5 项 | 重要功能，应尽量交付 |
| P2 | 2 项 | 辅助功能，可延后交付 |

---

## 六、技术架构概要

### 6.1 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 扩展类型 | Chrome Extension Manifest V3 | 支持 Chrome、Edge 等 Chromium 浏览器 |
| 主要语言 | JavaScript (73.7%) | ES6+ 模块化语法 |
| 样式 | CSS (12.8%) | 原生 CSS 样式 |
| 后端 | Supabase | Hub 平台数据存储和用户认证 |
| AI 后端 | Gemini Web / Gemini API / OpenAI Compatible | 多提供商支持 |

### 6.2 文件结构

```
prompt_ark/
├── _locales/                 # 国际化语言文件
├── docs/                     # 英文和中文文档
├── icons/                    # 扩展图标
├── lib/                      # 核心库
│   ├── ai/                   # AI 功能模块
│   │   ├── enrich.js         # 元数据提取
│   │   ├── image-prompt.js   # 图片提示生成
│   │   ├── optimize.js       # 提示词优化
│   │   ├── provider.js       # AI 提供商管理
│   │   ├── share.js          # 社交分享
│   │   ├── smart-convert.js  # 智能转换
│   │   ├── translate.js      # 翻译功能
│   │   └── video-prompt.js  # 视频提示生成
│   ├── popup/                # Popup UI 组件
│   ├── supabase/             # Supabase 集成
│   ├── context-menu.js       # 右键菜单
│   ├── default-prompts.js    # 内置提示词
│   ├── frontmatter.js        # Markdown 元数据
│   ├── parsers.js            # 导入解析器
│   ├── storage.js            # 存储管理
│   ├── variables.js          # 变量解析
│   └── webdav-client.js     # WebDAV 客户端
├── prompts/                  # 内置提示词模板文件
├── background.js             # Service Worker
├── content.js                # 内容脚本
├── popup.html/js/css        # 弹出窗口
├── image-prompt.html/js      # 图片提示页面
├── i18n-manager.js           # 国际化管理
├── locales.js                # 语言词典
└── manifest.json             # 扩展清单

prompt-ark-hub-supabase/       # Hub 站点
├── src/
│   ├── components/           # React 组件
│   │   ├── AuthButton.tsx    # 认证按钮
│   │   ├── CategoryTabs.tsx  # 分类标签
│   │   ├── DetailModal.tsx  # 详情弹窗
│   │   ├── InstallButton.tsx # 安装按钮
│   │   ├── LanguageToggle.tsx # 语言切换
│   │   ├── SearchBar.tsx    # 搜索栏
│   │   ├── SortSelect.tsx   # 排序选择
│   │   └── Voting.tsx       # 投票组件
│   ├── lib/
│   │   └── auth-sync.ts     # 认证同步
│   └── App.tsx              # 主应用
└── supabase/
    └── schema.sql           # 数据库 Schema
```

---

## 七、版本规划建议

### 7.1 首发版本（V1.0）

**核心目标**：建立产品基本能力，确保用户能够完成提示词的管理、注入和基本 AI 增强功能。

**功能范围**：所有 P0 级别核心功能

**优化重点**：提示词管理核心流程、平台注入能力、变量模板系统

### 7.2 迭代版本（V2.0）

**功能扩展**：Hub 平台功能（浏览、投票、安装）、Prompt 翻译功能、图片/视频 Prompt 生成完善

**优化重点**：性能优化、用户体验优化

### 7.3 进阶版本（V3.0）

**功能扩展**：Hub Fork 功能完善、Hub 安装到扩展完整闭环、开放 API 接口

**生态建设**：开发者社区、提示词模板市场、第三方集成

---

## 八、风险与注意事项

### 8.1 技术风险

| 风险项 | 风险描述 | 应对措施 |
|--------|----------|----------|
| 平台适配失效 | AI 平台 UI 改版导致输入框定位失效 | 建立平台适配监控机制；快速响应更新 |
| Gemini Web 变更 | Google 修改认证机制导致无 API 调用失效 | 提供 API Key 配置作为备选方案 |
| Chrome 政策变更 | Manifest V3 政策收紧影响功能实现 | 关注政策动向；预留架构调整空间 |

### 8.2 产品风险

| 风险项 | 风险描述 | 应对措施 |
|--------|----------|----------|
| 功能过于复杂 | 内置 100 个模板分散用户注意力 | 提供新手引导；突出核心功能 |
| 同步冲突 | 多设备使用导致数据不一致 | 完善冲突解决策略；提供手动解决选项 |
| Hub 闭环待验证 | Hub 安装/Fork 完整链路待开发 | V2.0 重点完善 |

### 8.3 运营风险

| 风险项 | 风险描述 | 应对措施 |
|--------|----------|----------|
| Hub 平台监管 | 用户发布内容可能涉及合规问题 | 建立内容审核机制；明确用户协议 |
| 提示词版权 | 用户分享的提示词可能存在版权争议 | 添加版权声明功能；引导原创 |

---

**文档结束**
