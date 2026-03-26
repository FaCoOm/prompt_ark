# Feature Specification: 技术栈现代化与架构重构

**Feature Branch**: `001-modernize-tech-stack`
**Created**: 2026-03-26
**Status**: Draft
**Input**: 技术栈优化，增强代码质量，并且架构也要使用新的设计

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 开发者使用 Solid.js 原生 API 开发新功能 (Priority: P1)

作为扩展开发者，我希望使用纯 Solid.js API 开发新功能，而不需要处理 React/Zustand 遗留代码或适配器，这样我可以获得更好的类型提示和开发体验。

**Why this priority**: 这是技术债的核心问题，影响所有后续开发工作。完成后可立即提升开发效率。

**Independent Test**: 可以通过创建一个新的 Solid.js 组件并验证不需要引入任何 React/Zustand 相关依赖来独立测试。

**Acceptance Scenarios**:

1. **Given** 开发者需要创建新组件，**When** 查看项目依赖和导入语句，**Then** 不存在 react、react-dom、zustand、solid-zustand 等依赖
2. **Given** 开发者使用 IDE 编写 Solid.js 代码，**When** 使用 createStore、createSignal 等 API，**Then** 获得完整的类型提示和自动补全
3. **Given** 现有组件使用 Solid.js store，**When** 开发者阅读代码，**Then** 所有状态管理逻辑清晰且符合 Solid.js 最佳实践

---

### User Story 2 - 开发者快速添加新 AI 平台支持 (Priority: P2)

作为扩展开发者，我希望通过继承统一的基础适配器类快速添加新 AI 平台支持，而不需要复制粘贴大量重复代码。

**Why this priority**: 平台适配是核心功能，优化后可显著降低维护成本和新平台接入时间。

**Independent Test**: 可以通过添加一个新的测试平台（如 Perplexity）并验证只需实现少量平台特定逻辑来独立测试。

**Acceptance Scenarios**:

1. **Given** 需要支持新 AI 平台，**When** 创建新适配器类，**Then** 只需实现 3-5 个平台特定方法（选择器、注入点等）
2. **Given** 多个平台适配器，**When** 查看代码，**Then** 公共逻辑（按钮渲染、事件处理）都在基类中复用
3. **Given** 平台适配器需要修复 bug，**When** 修改基类，**Then** 所有平台自动继承修复

---

### User Story 3 - 类型安全的消息传递 (Priority: P2)

作为扩展开发者，我希望在 background 和 content script 之间传递消息时获得完整的类型检查，避免运行时错误。

**Why this priority**: 消息传递是扩展架构的核心，类型安全可以在编译时发现大量潜在问题。

**Independent Test**: 可以通过发送一条消息并验证 TypeScript 在编译时捕获类型错误来独立测试。

**Acceptance Scenarios**:

1. **Given** 开发者发送消息，**When** 使用错误的消息类型或参数，**Then** TypeScript 编译时报错
2. **Given** 开发者处理消息响应，**When** 访问响应数据，**Then** 获得准确的类型提示
3. **Given** 添加新消息类型，**When** 更新类型定义，**Then** 所有相关代码自动获得类型检查

---

### User Story 4 - 统一的状态管理模式 (Priority: P3)

作为扩展开发者，我希望所有 store 遵循统一的模式和最佳实践，便于理解和维护。

**Why this priority**: 提升代码可读性和可维护性，但不阻塞核心功能开发。

**Independent Test**: 可以通过审查所有 store 文件并验证它们遵循相同的结构模式来独立测试。

**Acceptance Scenarios**:

1. **Given** 开发者查看任意 store，**When** 阅读代码结构，**Then** 发现统一的命名约定、action 定义、持久化逻辑
2. **Given** 需要添加新 store，**When** 参考现有 store，**Then** 可以快速复制模式并实现
3. **Given** store 需要持久化，**When** 使用统一的持久化工具，**Then** 自动处理序列化、同步等逻辑

---

### Edge Cases

- 迁移过程中如何保证现有功能不受影响？
- 如何处理用户数据迁移（如果 store 结构变化）？
- 如何确保类型定义与运行时行为一致？
- 重构后如何保证扩展在所有支持的浏览器中正常工作？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须完全移除 React、react-dom、zustand、solid-zustand 依赖
- **FR-002**: 所有组件必须使用 Solid.js 原生 API（createStore、createSignal、createMemo 等）
- **FR-003**: 平台适配器必须继承统一的基础类，复用公共逻辑
- **FR-004**: 消息传递必须提供完整的 TypeScript 类型定义和类型检查
- **FR-005**: 所有 store 必须遵循统一的结构模式和命名约定
- **FR-006**: 系统必须保持向后兼容，不破坏现有用户数据
- **FR-007**: 重构后的代码必须通过所有现有测试用例
- **FR-008**: TypeScript 严格模式必须启用，消除所有 any 类型滥用
- **FR-009**: 代码必须遵循统一的格式化和 lint 规则
- **FR-010**: 关键模块必须提供清晰的 JSDoc 注释和使用示例

### Key Entities

- **PromptStore**: 管理 prompt 数据、过滤、分页、选择状态的核心 store
- **SettingsStore**: 管理应用设置、同步配置、AI 提供商配置的 store
- **PlatformAdapter**: 平台适配器基类，定义统一的平台集成接口
- **MessageBus**: 类型安全的消息传递系统，连接 background 和 content script
- **StorageAPI**: 统一的存储抽象层，支持 Chrome Storage、GitHub Gist、WebDAV

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 项目依赖中不存在任何 React/Zustand 相关包
- **SC-002**: TypeScript 编译无错误，严格模式下无 any 类型警告
- **SC-003**: 所有现有功能测试通过率 100%
- **SC-004**: 新增平台适配器的代码量减少 60% 以上（相比当前实现）
- **SC-005**: IDE 中 Solid.js API 的类型提示准确率 100%
- **SC-006**: 消息传递相关的运行时类型错误减少到 0
- **SC-007**: 代码审查中发现的架构不一致问题减少 80%
- **SC-008**: 开发者文档完整度达到 90%（覆盖核心模块和最佳实践）

## Assumptions

- 用户数据结构保持稳定，不需要大规模迁移
- 现有的 WXT 框架配置和构建流程无需大幅调整
- Solid.js 生态系统成熟度足以支持所有现有功能
- 开发团队熟悉 Solid.js 响应式编程模型
- 重构可以分阶段进行，不需要一次性完成所有模块
- 浏览器兼容性要求保持不变（Chrome/Edge/Firefox）
- 性能要求保持不变或有所提升

## 迁移策略

### 项目结构

采用并行开发模式，新旧项目独立：

```
prompt-ark/
├── prompt_ark/           # 原项目（原生 JS，保持运行）
└── prompt_ark_v2/        # 新项目（WXT + TS + Solid.js）
```

### 旧项目 → 新项目对应关系

#### 核心逻辑模块

| 旧项目路径 | 新项目路径 | 说明 |
|-----------|-----------|------|
| `lib/storage.js` | `src/shared/storage.ts` | 存储抽象层，保持 API 兼容 |
| `lib/variables.js` | `src/shared/variables.ts` | 变量系统 |
| `lib/text-analysis.js` | `src/shared/text-analysis.ts` | 文本分析 |
| `lib/ai/provider.js` | `src/shared/ai/provider.ts` | AI 提供商管理 |
| `lib/ai/optimize.js` | `src/shared/ai/optimize.ts` | Prompt 优化 |
| `lib/ai/translate.js` | `src/shared/ai/translate.ts` | Prompt 翻译 |
| `lib/ai/smart-convert.js` | `src/shared/ai/smart-convert.ts` | 智能转换 |
| `lib/ai/share.js` | `src/shared/ai/share.ts` | 社交分享 |
| `lib/gemini-web.js` | `src/shared/ai/gemini-web.ts` | Gemini Web API |
| `lib/github-client.js` | `src/shared/sync/github.ts` | GitHub Gist 同步 |
| `lib/supabase/` | `src/shared/sync/supabase/` | Supabase Hub |
| `lib/crypto.js` | `src/shared/utils/crypto.ts` | 加密工具 |

#### 扩展入口点

| 旧项目路径 | 新项目路径 | 说明 |
|-----------|-----------|------|
| `background.js` | `src/entrypoints/background/` | Service Worker（拆分为多个模块） |
| `content.js` | `src/entrypoints/content/` | Content Script（按平台拆分） |
| `popup.html/js/css` | `src/entrypoints/sidepanel/` | 主界面（注意：旧项目命名错误，实际是 sidepanel） |
| `image-prompt.html/js` | `src/entrypoints/popup/` | 图片 Prompt 生成器（真正的 popup） |

#### background.js 拆分方案（1151 行 → 模块化）

```
src/entrypoints/background/
├── index.ts                    # 主入口，注册监听器
├── handlers/
│   ├── message-handler.ts      # 消息路由分发
│   ├── storage-handler.ts      # Prompt CRUD 操作
│   ├── ai-handler.ts           # AI API 调用代理
│   └── context-menu-handler.ts # 右键菜单逻辑
└── services/
    ├── sync-service.ts         # GitHub/WebDAV 同步
    └── shortcut-service.ts     # 键盘快捷键
```

#### content.js 拆分方案（1883 行 → 按平台拆分）

```
src/entrypoints/content/
├── index.ts                    # 主入口，平台检测与初始化
├── core/
│   ├── injector.ts             # UI 注入核心逻辑
│   ├── slash-command.ts        # 斜杠命令处理（//prompt-name）
│   ├── variable-resolver.ts    # 变量解析与填充
│   └── quick-actions.ts        # 快捷操作（重写、总结等）
└── platforms/
    ├── base.ts                 # 平台适配器基类
    ├── chatgpt.ts              # ChatGPT 适配器
    ├── claude.ts               # Claude 适配器
    ├── gemini.ts               # Gemini 适配器
    ├── deepseek.ts             # DeepSeek 适配器
    └── ...                     # 其他 20+ 平台
```

**拆分优势：**
- 每个平台适配器 ~50-100 行，易于维护
- 基类封装公共逻辑（按钮渲染、事件处理）
- 添加新平台只需继承基类并实现选择器

#### 样式迁移方案

**问题：** popup.css 3623 行，content.css 775 行，过于冗长

**解决方案：** TailwindCSS + CSS Modules

| 旧项目 | 新项目 | 迁移策略 |
|-------|-------|---------|
| `popup.css` | TailwindCSS + 组件级样式 | 提取设计系统，用 Tailwind 重建 |
| `content.css` | Scoped CSS Modules | 最小化样式，避免污染页面 |

**迁移步骤：**

1. **提取设计系统**（从 popup.css 的 CSS 变量）
   ```
   颜色：--primary-color, --text-color, --border-color 等
   间距：统一的 padding/margin 规范
   字体：DM Sans, DM Mono
   ```

2. **配置 TailwindCSS**
   ```typescript
   // tailwind.config.ts
   theme: {
     colors: { primary: '#...', secondary: '#...' },
     fontFamily: { sans: ['DM Sans'], mono: ['DM Mono'] }
   }
   ```

3. **组件级迁移**
   - 每个 Solid.js 组件使用 TailwindCSS 类名
   - 复杂动画/过渡用 CSS Modules
   - 不逐行翻译旧 CSS，而是参考视觉效果重建

4. **Content Script 样式隔离**
   - 使用 Shadow DOM 或 scoped CSS
   - 最小化注入的 CSS 体积
   - 避免与页面样式冲突

**原则：**
- ❌ 不要逐行翻译 3623 行 CSS
- ✅ 提取设计系统，用现代方式重建
- ✅ 利用 TailwindCSS 减少自定义样式
- ✅ 组件化思维，样式跟随组件

#### UI 组件（新项目重构）

| 功能模块 | 新项目路径 | 说明 |
|---------|-----------|------|
| Prompt 列表 | `src/entrypoints/sidepanel/components/PromptList.tsx` | 使用 Solid.js + Kobalte |
| 搜索过滤 | `src/entrypoints/sidepanel/components/SearchBar.tsx` | 搜索、分类、标签过滤 |
| 编辑模态框 | `src/entrypoints/sidepanel/components/EditModal.tsx` | Prompt 编辑 |
| 设置面板 | `src/entrypoints/sidepanel/components/Settings.tsx` | 同步、AI 提供商配置 |
| 变量输入 | `src/entrypoints/sidepanel/components/VariableInput.tsx` | 变量填充表单 |

#### 状态管理（新增）

| 功能 | 新项目路径 | 说明 |
|-----|-----------|------|
| Prompt Store | `src/stores/promptStore.ts` | 使用 Solid.js `createStore` |
| Settings Store | `src/stores/settingsStore.ts` | 应用设置状态 |
| UI Store | `src/stores/uiStore.ts` | UI 状态（模态框、加载等） |

#### 配置与资源

| 旧项目路径 | 新项目路径 | 说明 |
|-----------|-----------|------|
| `manifest.json` | `wxt.config.ts` | WXT 自动生成 manifest |
| `_locales/` | `public/_locales/` | 国际化文件 |
| `icons/` | `public/icons/` | 图标资源 |
| `prompts/` | `src/assets/prompts/` | 默认 prompt 库 |

### 迁移原则

1. **API 兼容性**：核心逻辑模块保持相同的函数签名，确保行为一致
2. **数据兼容性**：新版能读取旧版的 Chrome Storage 数据
3. **功能对等**：每个旧功能在新版中都有对应实现
4. **测试驱动**：每迁移一个模块，编写测试确保功能正确
5. **渐进发布**：新版稳定后再逐步替换旧版
