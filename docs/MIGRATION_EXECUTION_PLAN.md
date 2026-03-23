# Prompt Ark WXT Migration 执行计划 v2.0

> **创建日期**: 2025-03-23  
> **修订日期**: 2025-03-23  
> **当前分支**: feat/wxt-migration  
> **目标**: 将原有 JavaScript 项目迁移到 WXT + TypeScript + Solid.js，并对 popup 进行组件化拆解

## 1. 项目现状与问题分析

### 1.1 原项目规模（比预期大得多）

经过深度分析，原 popup 代码的规模远超初步估计：

| 文件 | 大小 | 行数 | 内容 |
|------|------|------|------|
| `popup.html` | 40KB | 928行 | 15+ 个模态框/组件的 DOM 结构 |
| `popup.css` | 64KB | 3,533行 | 完整的 Dark Theme + 所有组件样式 |
| `popup.js` | 115KB | 3,000+行有效代码 | 单个 `PopupManager` 类，包含全部业务逻辑 |

**核心问题**: 原代码采用**单体架构** - 一个 `PopupManager` 类管理所有状态、所有 UI、所有交互。这种架构在技术债阶段需要被拆解。

### 1.2 功能模块清单

原 popup 包含 **15+ 个功能模块**，每个都是复杂组件：

#### 一级组件（直接挂载到 App）
1. **Header** - Logo、Hub 用户信息、设置入口、新建按钮
2. **SettingsPanel** - 3个 Tab（常规/模型/同步）
3. **SearchBar** - 搜索输入 + 分类 Tab
4. **SmartFilters** - 智能筛选（收藏/常用/最近）
5. **PromptList** - 带分页的 Prompt 列表
6. **Pagination** - 分页控制器

#### 模态框组件（条件渲染）
7. **EditModal** - 编辑/新建（最复杂，含7个子功能）
   - 基础表单
   - Skill 模式（System Prompt + 知识片段）
   - AI 优化（Provider 选择 + 结果对比）
   - 输出规则构建器
   - 翻译功能
   - 版本历史入口
8. **ImportModal** - 导入（粘贴 + URL 扫描）
   - 粘贴导入 Tab
   - URL 导入 Tab（AI 分析 + 深度扫描）
9. **HistoryModal** - 历史版本（左侧列表 + 右侧对比）
10. **SharePanel** - 分享（9个平台 + 2种格式）
11. **PackToolbar** - Pack 工具栏（选择模式 + 批量操作）
12. **YouTubeModal** - YouTube → Prompt（4种模式 + 复杂结果面板）
13. **SkillManager** - Skill 管理（列表 + 详情视图）

#### 子组件/内嵌组件
14. **PromptCard** - 单个 Prompt 卡片（11个操作按钮）
15. **CategoryTabs** - 分类标签栏

### 1.3 当前新架构状态

```
新架构（WXT + TypeScript + Solid.js）：
├── src/entrypoints/
│   ├── background.ts     ✅ 基础框架（消息处理）
│   ├── content.ts        ✅ 基础框架（平台适配）
│   ├── sidepanel/        ⚠️  当前仅基础结构，需要完全重写
│   └── popup/            ⚠️  当前仅基础结构
├── src/shared/           ✅ 类型定义、部分工具函数
├── wxt.config.ts         ✅ WXT 配置
└── .output/              ⚠️  构建输出（被 gitignore）
```

**关键差距**: 当前 sidepanel 只有基础列表，需要完全重写以复刻原 popup 的 100% 功能。

---

## 2. 迁移策略：组件化拆解

### 2.1 为什么要组件化？

原架构的问题：
- ❌ `PopupManager` 类 3,000+ 行，职责过多
- ❌ 状态与 UI 耦合严重，难以测试
- ❌ 一个 bug 可能影响整个应用
- ❌ 新功能添加困难

新架构的目标：
- ✅ 每个组件独立，单一职责
- ✅ 状态集中管理（Zustand），UI 只负责渲染
- ✅ 可测试、可复用
- ✅ 易于维护和扩展

### 2.2 组件化架构设计

```
sidepanel/
├── index.html              # 入口 HTML
├── main.tsx                # Solid.js 应用入口
├── App.tsx                 # 根组件（协调各一级组件）
├── styles.css              # 全局样式（复刻原 CSS 变量）
│
├── components/             # 组件目录
│   ├── layout/             # 布局组件
│   │   ├── Header.tsx              # Header
│   │   └── SettingsPanel.tsx       # 设置面板容器
│   │
│   ├── filters/            # 筛选相关
│   │   ├── SearchBar.tsx           # 搜索栏
│   │   ├── CategoryTabs.tsx        # 分类标签
│   │   └── SmartFilters.tsx        # 智能筛选按钮组
│   │
│   ├── prompts/            # Prompt 列表相关
│   │   ├── PromptList.tsx          # Prompt 列表容器
│   │   ├── PromptCard.tsx          # 单个 Prompt 卡片
│   │   ├── PromptActions.tsx       # 卡片操作按钮组
│   │   └── Pagination.tsx          # 分页组件
│   │
│   ├── modals/             # 模态框组件
│   │   ├── EditModal/              # 编辑模态框（复杂，单独目录）
│   │   │   ├── EditModal.tsx       # 主容器
│   │   │   ├── BasicForm.tsx       # 基础表单（标题/分类/快捷键）
│   │   │   ├── SkillModeSection.tsx # Skill 模式
│   │   │   ├── ContentEditor.tsx   # 内容编辑器
│   │   │   ├── OptimizePanel.tsx   # AI 优化面板
│   │   │   ├── ContractBuilder.tsx # 输出规则构建器
│   │   │   └── TranslationPanel.tsx # 翻译面板
│   │   │
│   │   ├── ImportModal.tsx         # 导入模态框
│   │   ├── HistoryModal.tsx        # 历史版本模态框
│   │   ├── SharePanel.tsx          # 分享面板
│   │   ├── YouTubeModal.tsx        # YouTube 生成模态框
│   │   └── SkillManager.tsx        # Skill 管理模态框
│   │
│   └── ui/                 # 通用 UI 组件
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Tabs.tsx
│       └── Dropdown.tsx
│
├── stores/                 # 状态管理
│   ├── promptStore.ts      # Prompt 状态（列表、CRUD、筛选）
│   ├── settingsStore.ts    # 设置状态（3个 Tab 的所有设置）
│   ├── uiStore.ts          # UI 状态（模态框开关、加载状态）
│   └── syncStore.ts        # 同步状态
│
├── hooks/                  # 自定义 Hooks
│   ├── usePrompts.ts       # Prompt 数据操作
│   ├── useSettings.ts      # 设置操作
│   ├── useI18n.ts          # 国际化
│   └── usePlatform.ts      # 平台检测
│
└── utils/                  # 组件内工具函数
    └── ...
```

### 2.3 Store 设计（状态拆分）

原 `PopupManager` 的所有状态将拆分到三个 Store：

#### promptStore.ts
```typescript
interface PromptState {
  // 数据
  prompts: Prompt[];
  filteredPrompts: Prompt[];
  
  // 筛选状态
  searchQuery: string;
  currentCategory: string;
  activeSmartFilter: 'favorites' | 'mostUsed' | 'recent' | null;
  
  // 分页
  currentPage: number;
  pageSize: number;
  totalCount: number;
  
  // 当前编辑
  editingPrompt: Prompt | null;
  isEditing: boolean;
  
  // 选中（Pack 模式）
  selectedIds: string[];
  isPackMode: boolean;
}

// Actions: loadPrompts, savePrompt, deletePrompt, toggleFavorite, 
//          insertPrompt, setFilter, setPage, selectPrompt, etc.
```

#### settingsStore.ts
```typescript
interface SettingsState {
  // 常规设置
  language: string;
  defaultPlatform: string;
  githubToken: string | null;
  openClawEnabled: boolean;
  imagePromptEnabled: boolean;
  
  // 模型设置
  providers: Provider[];
  activeProviderId: string | null;
  visionModel: string | null;
  
  // 同步设置
  syncEngine: 'local' | 'chrome' | 'gist' | 'webdav' | 'obsidian';
  syncSettings: Record<string, any>;
  lastSyncTime: number | null;
  
  // 设置面板状态
  isSettingsOpen: boolean;
  activeSettingsTab: 'general' | 'models' | 'sync';
}

// Actions: loadSettings, saveSettings, addProvider, removeProvider,
//          testConnection, forceSync, etc.
```

#### uiStore.ts
```typescript
interface UIState {
  // 模态框开关
  modals: {
    edit: boolean;
    import: boolean;
    history: boolean;
    share: boolean;
    youtube: boolean;
    skillManager: boolean;
  };
  
  // 加载状态
  loading: {
    prompts: boolean;
    save: boolean;
    optimize: boolean;
    translate: boolean;
    import: boolean;
    sync: boolean;
  };
  
  // 通知
  notifications: Notification[];
}

// Actions: openModal, closeModal, setLoading, showNotification, etc.
```

---

## 3. 详细执行计划（组件化迁移）

### 📅 现实的时间预估：20-25 天

原估计 5-7 天严重低估了复杂度。基于实际代码量，重新估算：

| 阶段 | 内容 | 预估天数 | 说明 |
|------|------|----------|------|
| Phase 1 | 架构准备 + CSS 迁移 | 3 天 | CSS 变量 + Store 设计 |
| Phase 2 | 基础组件（Header, Search, List） | 4 天 | PromptCard 有11个按钮 |
| Phase 3 | EditModal（最复杂） | 5 天 | 7个子功能 |
| Phase 4 | 其他模态框 | 4 天 | Import, History, Share, YouTube, Skill |
| Phase 5 | 事件绑定 + 消息通信 | 3 天 | 30+ 消息类型 |
| Phase 6 | 测试 + 修复 | 3-5 天 | 功能验证 |
| Phase 7 | 清理 + 优化 | 2 天 | 删除旧代码 |
| **总计** | | **20-25 天** | 全职开发 |

---

### Phase 1: 架构准备 + CSS 迁移（3天）

#### 任务 1.1: 复刻 CSS 变量和基础样式
**输入**: `popup.css`  
**输出**: `src/entrypoints/sidepanel/styles.css`

具体步骤：
1. 提取 Design Tokens（第 1-200 行的 CSS 变量）
   ```css
   :root {
     --bg-base: #0f1117;
     --bg-surface: #171921;
     --bg-elevated: #1e2030;
     /* ... 所有颜色、间距、圆角变量 */
   }
   ```

2. 复刻基础样式
   - Reset 样式
   - 布局框架（flex/grid 系统）
   - 滚动条样式
   - 动画关键帧

3. **不转换 Tailwind** - 直接使用原 CSS 类名
   - 原 CSS 有 3,500+ 行，转换工作量巨大
   - 直接复用可以 100% 还原视觉效果
   - 在 Solid 组件中使用 `class={originalClassName}`

#### 任务 1.2: 设计 Store 架构
**输出**: 
- `src/stores/promptStore.ts`（基础结构）
- `src/stores/settingsStore.ts`（基础结构）
- `src/stores/uiStore.ts`（基础结构）

先定义接口和基础 state，不实现所有 actions。

#### 任务 1.3: 创建通用 UI 组件
**输出**: 
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Tabs.tsx`

基于原 CSS 类名封装，保持样式一致。

**交付标准**:
- [ ] CSS 变量全部迁移
- [ ] 基础 UI 组件可用
- [ ] Store 结构定义完成

---

### Phase 2: 基础组件开发（4天）

#### 任务 2.1: Header 组件
**参考**: `popup.html` 第 200-225 行
**输出**: `src/components/layout/Header.tsx`

功能：
- Logo 和标题
- Hub 用户信息（头像、名称）
- 设置按钮 → 打开 SettingsPanel
- 新建按钮 → 打开 EditModal

#### 任务 2.2: SettingsPanel 组件
**参考**: `popup.html` 第 227-442 行
**输出**: 
- `src/components/layout/SettingsPanel.tsx`
- `src/components/settings/GeneralTab.tsx`
- `src/components/settings/ModelsTab.tsx`
- `src/components/settings/SyncTab.tsx`

三个 Tab 对应三种设置类型，数据来自 settingsStore。

#### 任务 2.3: 筛选组件
**参考**: `popup.html` 第 444-461 行
**输出**: 
- `src/components/filters/SearchBar.tsx`
- `src/components/filters/CategoryTabs.tsx`
- `src/components/filters/SmartFilters.tsx`

搜索 + 分类 Tab + 智能筛选按钮组（收藏/常用/最近）。

#### 任务 2.4: Prompt 列表组件
**参考**: `popup.html` 第 462-464 行, `popup.js` 渲染逻辑
**输出**: 
- `src/components/prompts/PromptList.tsx`
- `src/components/prompts/PromptCard.tsx`
- `src/components/prompts/PromptActions.tsx`
- `src/components/prompts/Pagination.tsx`

**PromptCard 的 11 个操作按钮**（逐个实现）：
1. 收藏/取消收藏
2. 分享
3. Skill 开关
4. 插入到网页
5. 编辑
6. 复制内容
7. 翻译
8. 删除
9. Pack 选择
10. 预览
11. 历史版本

**交付标准**:
- [ ] Header 正常显示 Hub 信息
- [ ] SettingsPanel 三个 Tab 可切换
- [ ] 搜索/分类/筛选联动
- [ ] Prompt 列表渲染正常
- [ ] PromptCard 所有按钮可点击

---

### Phase 3: EditModal 开发（5天）

这是**最复杂的组件**，包含 7 个子功能模块。

**参考**: `popup.html` 第 478-662 行

#### 任务 3.1: EditModal 框架
**输出**: `src/components/modals/EditModal/EditModal.tsx`

基础结构：
- Modal 容器
- 标签页切换（如果有）
- 保存/取消按钮

#### 任务 3.2: BasicForm 组件
**输出**: `src/components/modals/EditModal/BasicForm.tsx`

表单字段：
- 标题输入
- 分类输入（带 datalist 自动完成）
- 快捷命令输入

#### 任务 3.3: ContentEditor 组件
**输出**: `src/components/modals/EditModal/ContentEditor.tsx`

功能：
- 文本域输入
- Markdown 预览切换
- 变量高亮（`{{variable}}`）

#### 任务 3.4: SkillModeSection 组件
**输出**: `src/components/modals/EditModal/SkillModeSection.tsx`

功能：
- Skill 模式开关
- System Prompt 输入
- 知识片段列表（增删）

#### 任务 3.5: OptimizePanel 组件
**输出**: `src/components/modals/EditModal/OptimizePanel.tsx`

功能：
- Provider 选择下拉
- 优化按钮
- 结果对比面板（接受/拒绝）
- 与原代码逻辑一致

#### 任务 3.6: ContractBuilder 组件
**输出**: `src/components/modals/EditModal/ContractBuilder.tsx`

功能：
- 格式选择（Markdown/JSON/表格等）
- 长度限制滑块
- 语气选择
- 排除内容输入

#### 任务 3.7: TranslationPanel 组件
**输出**: `src/components/modals/EditModal/TranslationPanel.tsx`

功能：
- 目标语言选择（7种语言）
- 翻译按钮
- 进度显示

**交付标准**:
- [ ] EditModal 能正常打开/关闭
- [ ] 基础表单可保存
- [ ] Skill 模式开关正常
- [ ] AI 优化功能可用
- [ ] 翻译功能可用

---

### Phase 4: 其他模态框（4天）

#### 任务 4.1: ImportModal
**参考**: `popup.html` 第 664-732 行
**输出**: `src/components/modals/ImportModal.tsx`

两个 Tab：
1. 粘贴导入（JSON/CSV/Markdown）
2. URL 导入（AI 扫描 + 深度扫描 + 分数筛选）

#### 任务 4.2: HistoryModal
**参考**: `popup.html` 第 734-754 行
**输出**: `src/components/modals/HistoryModal.tsx`

布局：
- 左侧：版本列表
- 右侧：差异对比
- 还原按钮

#### 任务 4.3: SharePanel
**参考**: `popup.html` 第 756-802 行
**输出**: `src/components/modals/SharePanel.tsx`

9 个分享选项：
- Publish to Hub
- Twitter/X
- Reddit
- 知乎
- 微信公众号
- 小红书
- LinkedIn
- 复制链接
- 复制 JSON

#### 任务 4.4: PackToolbar
**参考**: `popup.html` 第 804-816 行
**输出**: `src/components/modals/PackToolbar.tsx`

功能：
- 选择模式切换
- 已选数量显示
- Pack 标题输入
- 分享合集按钮

#### 任务 4.5: YouTubeModal
**参考**: `popup.html` 第 818-893 行
**输出**: `src/components/modals/YouTubeModal.tsx`

复杂模态框：
- 模式选择（4种：风格迁移/完整分析/灵感创作/...）
- 目标语言选择
- URL 输入和生成按钮
- 结果面板（4个区域）：
  - 视觉词典（可点击术语）
  - 灵感试验场（变量替换）
  - 视频分镜列表
  - Prompt 模板预览

#### 任务 4.6: SkillManager
**参考**: `popup.html` 第 897-920 行
**输出**: `src/components/modals/SkillManager.tsx`

两视图：
- 列表视图（空状态/Skill 列表）
- 详情视图（返回按钮/标题/Markdown 内容）

**交付标准**:
- [ ] ImportModal 两种导入方式可用
- [ ] HistoryModal 可查看和还原版本
- [ ] SharePanel 9 个平台可分享
- [ ] YouTubeModal 可生成 Prompt
- [ ] SkillManager 可管理 Skills

---

### Phase 5: 事件绑定与消息通信（3天）

#### 任务 5.1: 组件事件绑定
将原 `popup.js` 的事件逻辑迁移到 Solid.js：

```typescript
// 原代码
this.elements.newPromptBtn.addEventListener('click', () => this.openEditModal());

// 新代码
<Button onClick={() => uiStore.openModal('edit')}>
  New Prompt
</Button>
```

所有事件使用 Solid 的响应式系统：
- `onClick`, `onInput`, `onChange` 等
- `createEffect` 监听状态变化
- `createSignal` 管理组件内部状态

#### 任务 5.2: Background Script 消息处理
**参考**: 原 `popup.js` + `background.js`  
**输出**: 完善 `src/entrypoints/background.ts`

需要支持的 30+ 消息类型：
```typescript
// Prompt CRUD
GET_PROMPTS, SAVE_PROMPT, UPDATE_PROMPT, DELETE_PROMPT

// 收藏和使用
TOGGLE_FAVORITE, TRACK_USAGE

// Provider 管理
GET_PROVIDERS, SAVE_PROVIDERS

// AI 功能
OPTIMIZE_PROMPT, TRANSLATE_PROMPT, AUTO_EXTRACT, GENERATE_TEXT

// 同步
GET_SYNC_SETTINGS, SAVE_SYNC_SETTINGS, FORCE_GIST_SYNC, 
FORCE_WEBDAV_SYNC, FORCE_OBSIDIAN_SYNC

// 设置
GET_GITHUB_TOKEN, SAVE_GITHUB_TOKEN, SET_DEFAULT_PLATFORM

// 历史和分享
GET_PROMPT_HISTORY, RESTORE_PROMPT_VERSION, SHARE_PROMPT

// YouTube
GENERATE_VIDEO_PROMPT, GENERATE_YOUTUBE_PROMPT

// Skill
PUSH_SKILL, GET_SKILLS, DELETE_SKILL

// 其他
BATCH_RENAME_CATEGORY, GET_IMAGE_PROMPT_SETTINGS, SAVE_IMAGE_PROMPT_SETTINGS
```

#### 任务 5.3: 外部库集成
确保以下库在新架构可用：
- `marked` - Markdown 渲染
- `i18n` - 国际化（需要适配 Solid）
- `PromptParser` - 原 lib/ 中的解析器（需要迁移）
- `PromptScorer` - 评分系统（需要迁移）
- `ContentAnalyzer` - 内容分析（需要迁移）

**交付标准**:
- [ ] 所有按钮点击有响应
- [ ] 30+ 消息类型 background 处理正确
- [ ] 外部库功能正常

---

### Phase 6: 测试与修复（3-5天）

#### 任务 6.1: 功能测试清单
逐条验证原 popup 的所有功能：

**基础功能**：
- [ ] Header 显示 Hub 用户信息和头像
- [ ] 设置面板三个 Tab 可切换和保存
- [ ] 搜索功能（实时过滤）
- [ ] 分类 Tab 切换
- [ ] 智能筛选（收藏/常用/最近）

**Prompt 操作**：
- [ ] Prompt 列表渲染（标题/内容/分类/标签/评分）
- [ ] PromptCard 11 个按钮全部可用
- [ ] 新建 Prompt（打开 EditModal）
- [ ] 编辑 Prompt（数据回显）
- [ ] 删除 Prompt（确认弹窗）
- [ ] 插入 Prompt 到网页（调用 content script）

**EditModal 功能**：
- [ ] 基础表单保存
- [ ] Skill 模式开关
- [ ] AI 优化（选择 Provider + 生成 + 接受/拒绝）
- [ ] 翻译（7种语言）
- [ ] 版本历史入口

**其他模态框**：
- [ ] 导入（粘贴/URL）
- [ ] 历史版本（查看 + 还原）
- [ ] 分享（9个平台）
- [ ] Pack 功能（选择 + 分享合集）
- [ ] YouTube 生成
- [ ] Skill 管理

**设置功能**：
- [ ] Provider 增删改查
- [ ] 同步配置（5种引擎）
- [ ] GitHub Token 设置
- [ ] 语言切换

#### 任务 6.2: 样式验证
- [ ] Dark Theme 与原 popup 100% 一致
- [ ] 所有动画和过渡效果正常
- [ ] Side Panel 宽度自适应
- [ ] 滚动条样式正确

#### 任务 6.3: 构建验证
- [ ] `wxt build` 无错误
- [ ] Chrome 加载扩展无警告
- [ ] 功能测试通过

**交付标准**:
- [ ] 所有功能与原 popup 一致
- [ ] 无明显样式差异
- [ ] 构建成功

---

### Phase 7: 清理与优化（2天）

#### 任务 7.1: 删除旧代码
删除根目录下的旧文件：
- `popup.html`
- `popup.css`
- `popup.js`
- `background.js`
- `content.js`
- `lib/` 目录（如果已全部迁移）
- `manifest.json`

#### 任务 7.2: 代码优化
- 检查类型完整性（无 `any`）
- 优化性能（减少不必要的渲染）
- 添加错误边界
- 完善注释

#### 任务 7.3: 文档更新
更新 README 和文档，说明新架构。

**交付标准**:
- [ ] 旧代码已删除
- [ ] 代码质量达标
- [ ] 文档已更新

---

## 4. 关键决策点

### 决策 1: CSS 处理方式
**选择**: **直接复刻原 CSS，不转 Tailwind**

原因：
- 原 CSS 3,500+ 行，转换工作量巨大（可能增加 5-7 天）
- 直接复刻可以 100% 还原视觉效果
- 在 Solid 组件中使用原 CSS 类名即可

实施方案：
```typescript
// 直接复制 popup.css 的变量和基础样式到 styles.css
// 组件中使用原类名
<div class="prompt-card">
  <div class="prompt-card-header">...</div>
</div>
```

### 决策 2: 状态管理方式
**选择**: **Zustand Store（继续现有架构）**

将原 `PopupManager` 的 3,000+ 行逻辑拆分为三个 Store：
- `promptStore` - Prompt 数据管理
- `settingsStore` - 设置管理  
- `uiStore` - UI 状态管理

### 决策 3: 组件粒度
**选择**: **细粒度组件化**

每个功能模块独立组件，便于维护和测试。共 20+ 个组件。

### 决策 4: 是否保留原文件
**选择**: **Phase 7 再删除**

迁移过程中保留原文件作为参考，全部完成后再删除。

---

## 5. 风险与挑战

### 🔴 高风险
1. **EditModal 复杂度** - 7 个子功能，可能遇到预期外的问题
2. **消息通信** - 30+ 消息类型，需要确保 background 全部支持
3. **外部依赖** - `marked`, `i18n` 等库需要适配 Solid.js

### 🟡 中风险
1. **样式还原** - 虽然复刻 CSS，但可能需要微调
2. **性能** - Solid.js 响应式 vs 原生的 DOM 操作，需要验证性能

### 🟢 缓解措施
1. 分阶段开发，每个 Phase 完成后验证
2. 保留原文件作为参考
3. 及时测试构建输出
4. 复杂功能（如 EditModal）预留缓冲时间

---

## 6. 提交规划

每个 Phase 完成后提交：

```
phase-1: feat: migrate CSS design tokens and store architecture
phase-2: feat: add Header, SettingsPanel, and PromptList components
phase-3: feat: add EditModal with all sub-features
phase-4: feat: add Import, History, Share, YouTube, Skill modals
phase-5: feat: wire up events and background message handling
phase-6: test: complete functional testing and bug fixes
phase-7: chore: remove legacy files and finalize
```

---

## 7. 总结

### 核心信息
- **总工作量**: 20-25 天（全职开发）
- **核心任务**: 将原 popup 组件化拆解并完整迁移
- **技术栈**: WXT + TypeScript + Solid.js + Zustand + 原 CSS
- **组件数量**: 20+ 个细粒度组件
- **成功标准**: 构建后的 sidepanel 与原 popup 功能和视觉 100% 一致

### 与原计划的主要变化
1. **时间更现实** - 从 5-7 天调整到 20-25 天
2. **强调组件化** - 明确拆解 20+ 个组件，而非直接搬运代码
3. **Store 拆分** - 三个独立的 Store 替代单个 PopupManager
4. **详细分解** - 每个 Phase 有明确的交付标准和验收清单

---

## 下一步

**请您审阅此计划，确认以下事项**：

1. ✅ **时间预估 20-25 天** 是否合理？
2. ✅ **组件化架构** 是否符合预期？
3. ✅ **Store 拆分方案**（prompt/settings/ui）是否合适？
4. ✅ **CSS 直接复刻**（不转 Tailwind）是否可以接受？
5. ✅ **Phase 划分** 是否清晰？

**确认后，我将开始 Phase 1：架构准备 + CSS 迁移。**



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

## 提交规划（细粒度）

**原则**: 每个组件或独立功能完成后立即提交，保持提交历史清晰、可回滚。

### Phase 1: 架构准备（7 个提交）

```
p1-1  feat(sidepanel): setup directory structure and base files
      - Create component directories (layout, filters, prompts, modals, ui)
      - Setup main.tsx, App.tsx skeleton
      - Add route configuration

p1-2  feat(styles): migrate CSS design tokens and variables
      - Extract CSS variables from popup.css
      - Setup dark theme base styles
      - Add animation keyframes

p1-3  feat(styles): migrate component base styles
      - Layout styles (header, panels)
      - Form element styles
      - Card and list styles
      - Modal base styles

p1-4  feat(ui): add base UI components
      - Button component
      - Input component  
      - Modal wrapper component

p1-5  feat(store): setup promptStore with basic state
      - Define PromptState interface
      - Add prompts array and filter state
      - Add pagination state

p1-6  feat(store): setup settingsStore with all tabs
      - Define SettingsState interface
      - Add general settings (language, platform, github)
      - Add models settings (providers, vision model)
      - Add sync settings (engine, config)

p1-7  feat(store): setup uiStore for modal and loading states
      - Define UIState interface
      - Add modal visibility states
      - Add loading states
      - Add notification system
```

### Phase 2: 基础组件（11 个提交）

```
p2-1  feat(header): add Header component with Hub integration
      - Logo and title display
      - Hub user info (avatar, name)
      - Settings button with click handler
      - New prompt button

p2-2  feat(settings): add GeneralTab component
      - Language selector
      - Default platform selector
      - GitHub token input
      - OpenClaw toggle
      - Image prompt toggle

p2-3  feat(settings): add ModelsTab component
      - Provider list display
      - Add/Edit/Delete provider
      - Provider form (name, type, URL, key, model)
      - Vision model selector

p2-4  feat(settings): add SyncTab component
      - Sync engine selector
      - Per-engine configuration forms
      - Last sync time display
      - Force sync button

p2-5  feat(settings): add SettingsPanel container with tabs
      - Tab navigation
      - Panel open/close animation
      - Integration with settingsStore

p2-6  feat(filters): add SearchBar component
      - Search input with debounce
      - Real-time filtering
      - Clear search button

p2-7  feat(filters): add CategoryTabs component
      - Category list from prompts
      - Active tab highlight
      - Click to filter

p2-8  feat(filters): add SmartFilters component
      - Favorites filter button
      - Most used filter button
      - Recent filter button
      - Active state indicator

p2-9  feat(prompts): add PromptCard component
      - Title display
      - Content preview with markdown
      - Category and tags
      - Usage count and quality score
      - Action buttons (favorite, share, skill, insert, edit, copy, translate, delete)

p2-10 feat(prompts): add PromptList and Pagination components
      - Virtual scrolling for performance
      - Pagination controls
      - Empty state handling

p2-11 feat(prompts): add PromptActions component
      - Extract action buttons from PromptCard
      - Handle all 11 action types
      - Confirmation dialogs for destructive actions
```

### Phase 3: EditModal（8 个提交）

```
p3-1  feat(edit-modal): add EditModal container and routing
      - Modal open/close state
      - Tab navigation if needed
      - Save/Cancel buttons

p3-2  feat(edit-modal): add BasicForm component
      - Title input
      - Category input with datalist
      - Shortcut command input
      - Form validation

p3-3  feat(edit-modal): add ContentEditor component
      - Textarea for content
      - Markdown preview toggle
      - Variable highlighting ({{variable}})
      - Line numbers (optional)

p3-4  feat(edit-modal): add SkillModeSection component
      - Skill mode toggle
      - System prompt textarea
      - Knowledge snippets list (add/remove)

p3-5  feat(edit-modal): add OptimizePanel component
      - Provider selector for optimization
      - Optimize button
      - Loading state
      - Result comparison view
      - Accept/Reject buttons

p3-6  feat(edit-modal): add ContractBuilder component
      - Format selector (markdown/json/table)
      - Length limit slider
      - Tone selector
      - Exclude content textarea

p3-7  feat(edit-modal): add TranslationPanel component
      - Language selector (7 languages)
      - Translate button
      - Progress indicator
      - Result display

p3-8  feat(edit-modal): integrate all sub-components
      - Wire up all sections
      - Save prompt functionality
      - History button integration
```

### Phase 4: 其他模态框（6 个提交）

```
p4-1  feat(import-modal): add ImportModal with paste and URL tabs
      - Paste import tab (JSON/CSV/Markdown)
      - URL import tab
      - Scan button
      - Deep scan toggle
      - Score filter
      - AI analysis progress

p4-2  feat(history-modal): add HistoryModal component
      - Left panel: version list
      - Right panel: diff view
      - Restore button
      - Close button

p4-3  feat(share-panel): add SharePanel component
      - Publish to Hub
      - Twitter/X share
      - Reddit share
      - Zhihu share
      - WeChat share
      - Xiaohongshu share
      - LinkedIn share
      - Copy link
      - Copy JSON

p4-4  feat(pack-toolbar): add PackToolbar component
      - Selection mode toggle
      - Selected count display
      - Pack title input
      - Share pack button

p4-5  feat(youtube-modal): add YouTubeModal component
      - Mode selector (4 modes)
      - Language selector
      - URL input
      - Generate button
      - Result panels (visual dictionary, inspiration, scenes, template)
      - Save button

p4-6  feat(skill-manager): add SkillManager component
      - List view (empty state, skill list)
      - Detail view (back button, title, markdown content)
      - Navigation between views
```

### Phase 5: 事件与通信（4 个提交）

```
p5-1  feat(events): wire up Header and Settings events
      - Settings button opens panel
      - New prompt button opens edit modal
      - Tab switching in settings
      - Save settings on change

p5-2  feat(events): wire up PromptList and PromptCard events
      - All 11 action buttons functional
      - Filter changes update list
      - Pagination navigation
      - Search debounced filtering

p5-3  feat(events): wire up EditModal events
      - Form field updates
      - Skill mode toggle
      - AI optimization flow
      - Translation flow
      - Save and cancel actions

p5-4  feat(background): add all message handlers
      - Implement 30+ message types
      - Prompt CRUD operations
      - Provider management
      - Sync operations
      - AI feature endpoints
```

### Phase 6: 测试与修复（迭代提交）

```
p6-1  test: add Header and Settings tests
      - Hub info display
      - Settings tabs navigation
      - Settings save/load

p6-2  test: add PromptList and filtering tests
      - Search functionality
      - Category filtering
      - Smart filters
      - Pagination

p6-3  test: add EditModal tests
      - Form validation
      - Skill mode toggle
      - Save functionality

p6-4  test: add integration tests for modals
      - Import flow
      - History restore
      - Share generation
      - YouTube generation

p6-5  fix: address testing bugs (iterative)
      - Bug fixes as issues found
      - One fix per commit with description
```

### Phase 7: 清理与优化（3 个提交）

```
p7-1  refactor: optimize performance and clean code
      - Remove unnecessary re-renders
      - Add memoization where needed
      - Improve type safety

p7-2  chore: remove legacy popup files
      - Delete popup.html
      - Delete popup.css
      - Delete popup.js
      - Delete old background.js and content.js
      - Clean up lib/ directory

p7-3  docs: update documentation for new architecture
      - Update README
      - Add component documentation
      - Update architecture diagrams
```

---

## 提交统计

| Phase | 提交数 | 说明 |
|-------|--------|------|
| Phase 1 | 7 | 架构基础 |
| Phase 2 | 11 | 基础组件 |
| Phase 3 | 8 | EditModal（最复杂）|
| Phase 4 | 6 | 其他模态框 |
| Phase 5 | 4 | 事件绑定 |
| Phase 6 | 5+ | 测试（迭代）|
| Phase 7 | 3 | 清理 |
| **总计** | **44+** | 细粒度提交 |

**提交命名规范**:
- `feat(scope): description` - 新功能
- `fix(scope): description` - Bug 修复
- `test(scope): description` - 测试
- `refactor(scope): description` - 重构
- `chore(scope): description` - 杂项
- `docs(scope): description` - 文档

---

## 总结

**总工作量**: 5-7 天（全职开发）  
**核心任务**: 复刻原 popup 的 100% 功能到新 sidepanel  
**技术栈**: WXT + TypeScript + Solid.js + Zustand + 原 CSS  
**成功标准**: 构建后的 sidepanel 与原 popup 功能和视觉完全一致

---

**下一步**: 确认此计划后，开始 Phase 1: 深度分析原代码结构。