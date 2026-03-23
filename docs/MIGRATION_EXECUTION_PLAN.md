# Prompt Ark WXT Migration 执行计划

> **创建日期**: 2025-03-23  
> **当前分支**: feat/wxt-migration  
> **目标**: 将原有 JavaScript 项目迁移到 WXT + TypeScript + Solid.js

## 当前项目状态

### 文件位置恢复完成 ✅
- `popup.html` - 原项目 HTML 结构（40KB，928行）
- `popup.css` - 原项目完整样式（64KB，3533行）
- `popup.js` - 原项目所有逻辑（115KB，PopupManager 类）
- `manifest.json` - 原 Manifest V3 配置

### 新架构已搭建部分 ✅
- `wxt.config.ts` - WXT 配置（含 manifest、vite 配置）
- `tsconfig.json` - TypeScript 配置
- `package.json` - 依赖管理
- `src/entrypoints/`
  - `background.ts` - Service Worker（基础消息处理）
  - `content.ts` - Content Script（平台适配器）
  - `sidepanel/` - 当前简单实现（需要重写）
  - `popup/` - 简单实现（需要重写）
- `src/shared/` - 类型定义、工具函数、API 封装
- `public/` - 静态资源（icons, _locales）

### 新旧代码共存状态
```
原代码（保留功能）：
├── popup.html / popup.css / popup.js （完整功能）
├── background.js （原 Service Worker）
├── content.js （原 Content Script）
├── lib/ （所有工具库）
└── manifest.json

新架构（WXT）：
├── src/entrypoints/
│   ├── background.ts （新，基础框架）
│   ├── content.ts （新，基础框架）
│   └── sidepanel/ （新，需要复刻原 popup）
├── src/shared/ （类型定义、工具函数）
├── wxt.config.ts
└── .output/chrome-mv3/ （构建输出）
```

---

## 核心问题

当前 sidepanel 与原 popup 差异巨大：

| 对比项 | 原 popup.js/css/html | 当前 sidepanel |
|--------|---------------------|----------------|
| 功能完整性 | 100% 功能完整 | 仅基础列表展示 |
| 样式系统 | Dark Theme + Design Tokens | 简单 Tailwind |
| 组件数量 | 15+ 个复杂组件 | 2 个基础组件 |
| 功能模块 | 设置、编辑、导入、AI优化、分享、历史等 | 仅列表展示 |
| 交互复杂度 | 极高 | 极低 |

---

## 迁移策略选择

### 方案 A: 完整复刻（推荐）
**目标**: 将原 popup 的所有功能完整迁移到新 sidepanel

**优点**:
- 保持所有功能不变
- 用户无感知迁移
- 代码质量提升（TypeScript + 组件化）

**工作量**: 5-7 天（全职）

### 方案 B: 渐进式迁移
**目标**: 先迁移核心功能，后续逐步添加

**优点**:
- 快速上线
- 风险可控

**缺点**:
- 功能缺失
- 需要多次迭代

**工作量**: 2-3 天（核心功能）

---

## 详细执行计划（方案 A: 完整复刻）

### Phase 1: 架构分析与准备（半天）

#### 任务 1.1: 深度分析原代码结构
**输入**: `popup.html`, `popup.css`, `popup.js`  
**输出**: 功能模块清单、组件依赖图

具体步骤:
1. 从 `popup.html` 提取所有 UI 模块
   - Header（Logo、Hub用户信息、设置按钮、新建按钮）
   - 设置面板（常规、模型、同步 3 个 Tab）
   - 搜索栏
   - 智能筛选（收藏、常用、最近）
   - 分类标签
   - Prompt 列表（带分页）
   - 编辑模态框（Skill 模式、优化按钮、翻译等）
   - 导入模态框
   - 历史版本模态框
   - 分享面板
   - Pack 工具栏
   - YouTube → Prompt 模态框
   - Skill Manager 模态框

2. 从 `popup.js` 提取所有功能类
   - `PopupManager` 主类（约 2000 行）
   - 依赖的外部库:
     - `i18n` 国际化
     - `PromptParser` 解析器
     - `GitHubClient` GitHub 集成
     - `PromptScorer` 评分系统
     - `ContentAnalyzer` 内容分析
     - `HistoryPanel` 历史面板
     - `ShareManager` 分享管理
   - 所有消息类型与 background 的通信

3. 从 `popup.css` 提取设计系统
   - CSS 变量（Dark Theme）
   - 组件样式规范
   - 动画和过渡效果

#### 任务 1.2: 规划组件架构
**输出**: 新组件树结构

```
sidepanel/
├── index.html          # 入口 HTML（复刻原 popup.html 结构）
├── main.tsx            # Solid.js 入口
├── App.tsx             # 根组件
├── styles.css          # 全局样式（复刻原 popup.css 变量和基础样式）
├── components/         # 组件目录
│   ├── Header.tsx      # 头部（Logo、Hub、设置、新建）
│   ├── SettingsPanel.tsx   # 设置面板
│   │   ├── GeneralTab.tsx  # 常规设置
│   │   ├── ModelsTab.tsx   # 模型管理
│   │   └── SyncTab.tsx     # 同步设置
│   ├── SearchBar.tsx       # 搜索栏
│   ├── SmartFilters.tsx    # 智能筛选
│   ├── CategoryTabs.tsx    # 分类标签
│   ├── PromptList.tsx      # Prompt 列表
│   │   ├── PromptCard.tsx  # 单个 Prompt 卡片
│   │   └── Pagination.tsx  # 分页
│   ├── EditModal.tsx       # 编辑/新建模态框
│   │   ├── SkillModeSection.tsx  # Skill 模式
│   │   ├── OptimizePanel.tsx     # AI 优化
│   │   └── ContractBuilder.tsx   # 输出规则
│   ├── ImportModal.tsx     # 导入模态框
│   ├── HistoryModal.tsx    # 历史版本
│   ├── SharePanel.tsx      # 分享面板
│   ├── PackToolbar.tsx     # Pack 工具栏
│   ├── YouTubeModal.tsx    # YouTube 生成
│   └── SkillManager.tsx    # Skill 管理
├── stores/             # 状态管理
│   └── promptStore.ts  # Zustand store（复刻 PopupManager 状态）
└── hooks/              # 自定义 hooks
    ├── usePrompts.ts   # Prompt 数据管理
    ├── useSettings.ts  # 设置管理
    └── useI18n.ts      # 国际化
```

---

### Phase 2: 样式系统迁移（1 天）

#### 任务 2.1: 复刻 CSS 变量和基础样式
**输入**: `popup.css`  
**输出**: `src/entrypoints/sidepanel/styles.css`

必须迁移的内容:
1. CSS Design Tokens（第 1-29 行）
   ```css
   :root {
     --bg-base: #0f1117;
     --bg-surface: #171921;
     --bg-elevated: #1e2030;
     /* ... 所有变量 */
   }
   ```

2. 基础 Reset 和布局
3. 所有组件基础样式
4. 动画和过渡效果

**技术选择**:
- 方案 A: 直接复制 CSS（最快）
- 方案 B: 转换为 Tailwind + CSS 变量（需要大量调整）

**建议**: 采用方案 A，直接复制原 CSS 文件，然后在组件中使用这些样式。

#### 任务 2.2: 创建 HTML 骨架
**输入**: `popup.html`  
**输出**: `src/entrypoints/sidepanel/index.html`

将原 `popup.html` 的 body 内容提取，作为 Solid.js 应用的渲染容器。

---

### Phase 3: 核心组件迁移（2 天）

#### 任务 3.1: 状态管理 Store（半天）
**参考**: `popup.js` 中的 `PopupManager` 类  
**输出**: `src/stores/promptStore.ts`

需要实现的状态:
```typescript
interface PromptState {
  prompts: Prompt[];
  providers: Provider[];
  activeProviderId: string | null;
  currentCategory: string;
  searchQuery: string;
  editingId: string | null;
  activeSmartFilter: 'favorites' | 'mostUsed' | 'recent' | null;
  currentPage: number;
  pageSize: number;
  settings: Settings;
  // UI 状态
  isSettingsOpen: boolean;
  isEditModalOpen: boolean;
  // ... 其他 UI 状态
}
```

需要实现的方法（从 PopupManager 提取）:
- `loadPrompts()`
- `loadSettings()`
- `saveSettings()`
- `renderPrompts()` -> `getFilteredPrompts()`
- `savePrompt()`
- `deletePrompt()`
- `toggleFavorite()`
- `insertPrompt()`
- 等等...

#### 任务 3.2: Header 组件（半天）
**参考**: `popup.html` 第 200-225 行，`popup.css` 第 85-168 行  
**输出**: `src/entrypoints/sidepanel/components/Header.tsx`

功能:
- Logo 和标题
- Hub 用户信息显示（头像、名称）
- 设置按钮（切换设置面板）
- 新建按钮（打开编辑模态框）

#### 任务 3.3: 设置面板（半天）
**参考**: `popup.html` 第 227-442 行  
**输出**: `src/entrypoints/sidepanel/components/SettingsPanel.tsx`

包含 3 个 Tab:
1. **常规设置**
   - 语言选择
   - 默认 AI 平台
   - GitHub Token
   - OpenClaw 设置
   - 图像提示词功能开关

2. **模型设置**
   - Provider 列表（增删改查）
   - Provider 表单（名称、类型、API URL、Key、模型）
   - 图像识别模型选择

3. **同步设置**
   - 同步引擎选择（本地、Chrome、Gist、WebDAV、Obsidian）
   - 各同步方式的配置表单
   - 立即同步按钮

#### 任务 3.4: Prompt 列表（半天）
**参考**: `popup.html` 第 462-464 行，`popup.js` 第 453-591 行  
**输出**: 
- `src/entrypoints/sidepanel/components/PromptList.tsx`
- `src/entrypoints/sidepanel/components/PromptCard.tsx`
- `src/entrypoints/sidepanel/components/Pagination.tsx`

功能:
- 列表渲染（支持分页）
- 每个 Prompt 卡片显示:
  - 标题
  - 内容预览（Markdown + 高亮变量）
  - 分类、标签、快捷命令
  - 使用次数、质量评分
  - Source Context（如果有）
  - 操作按钮：收藏、分享、Skill、插入、编辑、复制、翻译、删除
- 分页控制

---

### Phase 4: 编辑与模态框（2 天）

#### 任务 4.1: 编辑模态框（1 天）
**参考**: `popup.html` 第 478-662 行，`popup.js` 相关方法  
**输出**: `src/entrypoints/sidepanel/components/EditModal.tsx`

这是一个复杂组件，包含:
1. **基础表单**
   - 标题输入
   - 分类输入（带 datalist）
   - 快捷命令输入

2. **Skill 模式**
   - 切换开关
   - System Prompt 输入
   - 知识片段列表（增删）

3. **Prompt 内容编辑**
   - 文本域
   - Markdown 预览切换
   - 变量高亮

4. **AI 优化功能**
   - 优化按钮
   - Provider 选择下拉
   - 优化结果对比面板（接受/拒绝）

5. **输出规则构建器**
   - 格式选择（Markdown、JSON、表格等）
   - 长度限制
   - 语气选择
   - 排除内容

6. **翻译功能**
   - 目标语言选择
   - 翻译按钮

7. **版本历史按钮**

#### 任务 4.2: 导入模态框（半天）
**参考**: `popup.html` 第 664-732 行  
**输出**: `src/entrypoints/sidepanel/components/ImportModal.tsx`

两个 Tab:
1. **粘贴导入**
   - 文本域（支持 JSON、CSV、Markdown）

2. **URL 导入**
   - URL 输入
   - 扫描按钮
   - 深度扫描选项
   - 分数筛选
   - 预览列表
   - AI 分析进度条

#### 任务 4.3: 历史版本模态框（半天）
**参考**: `popup.html` 第 734-754 行  
**输出**: `src/entrypoints/sidepanel/components/HistoryModal.tsx`

- 左侧版本列表
- 右侧差异对比
- 还原按钮

---

### Phase 5: 高级功能（1 天）

#### 任务 5.1: 分享面板（半天）
**参考**: `popup.html` 第 756-802 行  
**输出**: `src/entrypoints/sidepanel/components/SharePanel.tsx`

分享选项:
- Publish to Hub
- 分享到 X/Twitter
- 分享到 Reddit
- 分享到知乎
- 分享到公众号
- 分享到小红书
- Share to LinkedIn
- 复制链接
- 复制为 JSON

#### 任务 5.2: Pack 工具栏（半天）
**参考**: `popup.html` 第 804-816 行  
**输出**: `src/entrypoints/sidepanel/components/PackToolbar.tsx`

- 选择模式切换
- 已选数量显示
- Pack 标题输入
- 分享合集按钮

#### 任务 5.3: YouTube → Prompt 模态框（半天）
**参考**: `popup.html` 第 818-893 行  
**输出**: `src/entrypoints/sidepanel/components/YouTubeModal.tsx`

复杂模态框，包含:
- 模式选择（风格迁移、完整分析、灵感创作）
- 目标语言选择
- URL 输入和生成按钮
- 结果面板:
  - 视觉词典（可点击术语）
  - 灵感试验场（变量替换）
  - 视频分镜列表
  - Prompt 模板预览
  - 保存按钮

#### 任务 5.4: Skill Manager 模态框（半天）
**参考**: `popup.html` 第 897-920 行  
**输出**: `src/entrypoints/sidepanel/components/SkillManager.tsx`

- 列表视图（空状态、Skill 列表）
- 详情视图（返回按钮、标题、Markdown 内容）

---

### Phase 6: 事件与交互（1 天）

#### 任务 6.1: 事件绑定
将所有原 `popup.js` 中的事件绑定逻辑迁移到 Solid.js 组件:
- 使用 Solid 的 `onClick`、`onInput`、`onChange` 等事件
- 使用 `createEffect` 处理响应式数据
- 使用 `createSignal` 管理组件状态

#### 任务 6.2: 消息通信
确保与 background script 的消息通信正常:
- `GET_PROMPTS`
- `SAVE_PROMPT`
- `UPDATE_PROMPT`
- `DELETE_PROMPT`
- `TOGGLE_FAVORITE`
- `TRACK_USAGE`
- `GET_PROVIDERS`
- `SAVE_PROVIDERS`
- `OPTIMIZE_PROMPT`
- `TRANSLATE_PROMPT`
- `AUTO_EXTRACT`
- `GENERATE_TEXT`
- `GET_SYNC_SETTINGS`
- `SAVE_SYNC_SETTINGS`
- `FORCE_GIST_SYNC`
- `FORCE_WEBDAV_SYNC`
- `FORCE_OBSIDIAN_SYNC`
- `FORCE_OBSIDIAN_LOCAL_SYNC`
- `GET_GITHUB_TOKEN`
- `SAVE_GITHUB_TOKEN`
- `GET_OPENCLAW_SETTINGS`
- `SAVE_OPENCLAW_SETTINGS`
- `GET_IMAGE_PROMPT_SETTINGS`
- `SAVE_IMAGE_PROMPT_SETTINGS`
- `BATCH_RENAME_CATEGORY`
- `SET_DEFAULT_PLATFORM`
- `GET_DEFAULT_PLATFORM`
- `GET_PROMPT_HISTORY`
- `RESTORE_PROMPT_VERSION`
- `SHARE_PROMPT`
- `GENERATE_VIDEO_PROMPT`
- `GENERATE_YOUTUBE_PROMPT`
- `PUSH_SKILL`
- `GET_SKILLS`
- `DELETE_SKILL`

#### 任务 6.3: 外部库依赖
确保以下外部库功能可用:
- `marked` - Markdown 渲染
- `i18n` - 国际化
- `PromptParser` - 解析器
- `PromptScorer` - 评分
- `ContentAnalyzer` - 内容分析
- `HistoryPanel` - 历史面板
- `ShareManager` - 分享管理

---

### Phase 7: 测试与验证（半天）

#### 任务 7.1: 功能测试清单
- [ ] Header 显示和交互
- [ ] 设置面板（所有 Tab）
- [ ] 搜索功能
- [ ] 分类筛选
- [ ] 智能筛选（收藏、常用、最近）
- [ ] Prompt 列表渲染
- [ ] Prompt 卡片操作（所有按钮）
- [ ] 新建 Prompt
- [ ] 编辑 Prompt
- [ ] 删除 Prompt
- [ ] 插入 Prompt 到网页
- [ ] Provider 管理
- [ ] 同步功能
- [ ] AI 优化
- [ ] 翻译功能
- [ ] 导入/导出
- [ ] 历史版本
- [ ] 分享功能
- [ ] Pack 功能
- [ ] YouTube 生成
- [ ] Skill 管理

#### 任务 7.2: 样式验证
- [ ] Dark Theme 正确显示
- [ ] 所有动画和过渡正常
- [ ] 响应式布局（Side Panel 自适应）
- [ ] 与原版视觉一致

---

## 关键决策点

### 1. CSS 处理方式
**选项 A**: 直接复制原 CSS（推荐）
- 优点: 100% 还原视觉效果，最快
- 缺点: 不是 Tailwind 风格

**选项 B**: 转换为 Tailwind
- 优点: 统一技术栈
- 缺点: 工作量巨大，可能无法完全还原

**决策**: 采用方案 A，直接复制 `popup.css` 到 `sidepanel/styles.css`，在 Solid 组件中使用原样式类名。

### 2. 状态管理方式
**选项 A**: Zustand Store（已搭建）
- 将 PopupManager 的逻辑拆分到 store
- 组件订阅 store 状态

**选项 B**: Solid 原生 Signal
- 使用 `createSignal`、`createStore`
- 可能更复杂

**决策**: 继续使用 Zustand，与现有架构保持一致。

### 3. 组件粒度
**选项 A**: 细粒度组件（推荐）
- 每个功能模块独立组件
- 便于维护和测试

**选项 B**: 大组件
- 类似原 popup.js 的大类
- 迁移快但难以维护

**决策**: 采用细粒度组件，按 Phase 3-5 的组件列表拆分。

---

## 风险与挑战

### 高风险
1. **复杂模态框**: EditModal、YouTubeModal 有大量交互逻辑
2. **外部依赖**: 需要确保 marked、i18n 等库在新架构可用
3. **消息通信**: 大量消息类型需要 background.ts 支持

### 中风险
1. **样式还原**: 可能需要微调才能达到 100% 一致
2. **性能**: Solid.js 的响应式 vs 原生的 DOM 操作

### 缓解措施
1. 分阶段开发，每个 Phase 完成后验证
2. 保留原文件作为参考
3. 及时测试构建输出

---

## 提交规划

每个 Phase 完成后提交:

1. `feat: migrate design tokens and base styles`
2. `feat: add Header and SettingsPanel components`
3. `feat: add PromptList with pagination`
4. `feat: add EditModal with skill mode and optimization`
5. `feat: add Import, History, Share modals`
6. `feat: add PackToolbar, YouTubeModal, SkillManager`
7. `feat: complete sidepanel migration with all interactions`
8. `chore: remove legacy popup files`

---

## 总结

**总工作量**: 5-7 天（全职开发）  
**核心任务**: 复刻原 popup 的 100% 功能到新 sidepanel  
**技术栈**: WXT + TypeScript + Solid.js + Zustand + 原 CSS  
**成功标准**: 构建后的 sidepanel 与原 popup 功能和视觉完全一致

---

**下一步**: 确认此计划后，开始 Phase 1: 深度分析原代码结构。