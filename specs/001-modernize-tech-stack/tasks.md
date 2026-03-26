# Tasks: 技术栈现代化与架构重构

**Input**: spec.md, plan.md
**Branch**: `001-modernize-tech-stack`

## Format: `[ID] [P?] [Phase] Description`

- **[P]**: 可并行执行
- **[Phase]**: 所属阶段（Phase0-6）
- 包含具体文件路径

## Phase 0: 准备工作（1-2 天）

**目标**: 建立测试基准，初始化新项目

- [ ] [001] [Phase0] 梳理功能清单：从 README.md 和代码提取所有功能点，创建 `docs/feature-checklist.md`
- [ ] [002] [Phase0] 记录数据结构：分析 Chrome Storage 数据格式，创建 `docs/data-schema.md`
- [ ] [003] [P] [Phase0] 编写 E2E 测试：使用 Playwright 测试核心流程（保存 prompt、注入、搜索），创建 `tests/e2e/core-flows.spec.ts`
- [ ] [004] [P] [Phase0] 初始化 prompt_ark_v2：运行 `pnpm create wxt prompt_ark_v2`，配置 TypeScript + Solid.js
- [ ] [005] [Phase0] 配置开发环境：安装 TailwindCSS、Kobalte、Vitest，配置 `wxt.config.ts`、`tailwind.config.ts`
- [ ] [006] [Phase0] 创建项目骨架：设置目录结构 `src/entrypoints/`、`src/shared/`、`src/stores/`
- [ ] [007] [Phase0] 验证构建：确保空扩展可以构建并加载到浏览器

## Phase 1: 核心逻辑迁移（3-5 天）

**目标**: 迁移 lib/ 业务逻辑，保持 API 兼容

- [ ] [101] [P] [Phase1] 迁移存储模块：`lib/storage.js` → `src/shared/storage.ts`，保持 PromptStorage/SyncStorage/LocalStorage API
- [ ] [102] [P] [Phase1] 迁移变量系统：`lib/variables.js` → `src/shared/variables.ts`，支持四种变量类型
- [ ] [103] [P] [Phase1] 迁移文本分析：`lib/text-analysis.js` → `src/shared/text-analysis.ts`
- [ ] [104] [Phase1] 迁移 AI 提供商：`lib/ai/provider.js` → `src/shared/ai/provider.ts`，添加完整类型定义
- [ ] [105] [P] [Phase1] 迁移 AI 功能：`lib/ai/optimize.js` → `src/shared/ai/optimize.ts`
- [ ] [106] [P] [Phase1] 迁移翻译功能：`lib/ai/translate.js` → `src/shared/ai/translate.ts`
- [ ] [107] [P] [Phase1] 迁移智能转换：`lib/ai/smart-convert.js` → `src/shared/ai/smart-convert.ts`
- [ ] [108] [P] [Phase1] 迁移分享功能：`lib/ai/share.js` → `src/shared/ai/share.ts`
- [ ] [109] [P] [Phase1] 迁移 Gemini Web：`lib/gemini-web.js` → `src/shared/ai/gemini-web.ts`
- [ ] [110] [P] [Phase1] 迁移同步客户端：`lib/github-client.js` → `src/shared/sync/github.ts`
- [ ] [111] [Phase1] 编写单元测试：为所有迁移模块编写测试，确保行为一致

## Phase 2: Background 重构（2-3 天）

**目标**: 拆分 background.js (1151 行) 为模块化结构

- [ ] [201] [Phase2] 创建消息类型定义：`src/shared/types/messages.ts`，定义所有消息类型和 payload
- [ ] [202] [Phase2] 实现消息路由：`src/entrypoints/background/handlers/message-handler.ts`
- [ ] [203] [P] [Phase2] 实现存储处理器：`src/entrypoints/background/handlers/storage-handler.ts`
- [ ] [204] [P] [Phase2] 实现 AI 处理器：`src/entrypoints/background/handlers/ai-handler.ts`
- [ ] [205] [P] [Phase2] 实现右键菜单：`src/entrypoints/background/handlers/context-menu-handler.ts`
- [ ] [206] [P] [Phase2] 实现同步服务：`src/entrypoints/background/services/sync-service.ts`
- [ ] [207] [P] [Phase2] 实现快捷键服务：`src/entrypoints/background/services/shortcut-service.ts`
- [ ] [208] [Phase2] 创建主入口：`src/entrypoints/background/index.ts`，注册所有监听器
- [ ] [209] [Phase2] 功能对等测试：验证所有原 background.js 功能都正常工作

## Phase 3: Content Script 重构（3-4 天）

**目标**: 拆分 content.js (1883 行) 按平台拆分

- [ ] [301] [Phase3] 创建平台基类：`src/entrypoints/content/platforms/base.ts`，定义统一接口
- [ ] [302] [Phase3] 实现 UI 注入器：`src/entrypoints/content/core/injector.ts`
- [ ] [303] [P] [Phase3] 实现斜杠命令：`src/entrypoints/content/core/slash-command.ts`
- [ ] [304] [P] [Phase3] 实现快捷操作：`src/entrypoints/content/core/quick-actions.ts`
- [ ] [305] [P] [Phase3] 实现变量解析：`src/entrypoints/content/core/variable-resolver.ts`
- [ ] [306] [Phase3] 创建平台适配器：ChatGPT、Claude、Gemini、DeepSeek 等（每个 ~50-100 行）
- [ ] [307] [Phase3] 创建主入口：`src/entrypoints/content/index.ts`，平台检测与初始化
- [ ] [308] [Phase3] 平台测试：在 20+ AI 平台测试按钮注入和功能

## Phase 4: UI 重构（5-7 天）

**目标**: 用 Solid.js + TailwindCSS 重建界面

### 设计系统
- [ ] [401] [Phase4] 提取设计系统：从 popup.css 提取颜色、间距、字体变量
- [ ] [402] [Phase4] 配置 Tailwind：在 `tailwind.config.ts` 中定义 design tokens

### 基础组件
- [ ] [403] [P] [Phase4] 创建 Button 组件：`src/components/ui/Button.tsx`
- [ ] [404] [P] [Phase4] 创建 Input 组件：`src/components/ui/Input.tsx`
- [ ] [405] [P] [Phase4] 创建 Modal 组件：`src/components/ui/Modal.tsx`
- [ ] [406] [P] [Phase4] 创建 Dropdown 组件：`src/components/ui/Dropdown.tsx`

### Sidepanel 主界面
- [ ] [407] [Phase4] 创建状态管理：`src/stores/promptStore.ts`、`src/stores/settingsStore.ts`
- [ ] [408] [Phase4] 创建 PromptList：`src/entrypoints/sidepanel/components/PromptList.tsx`
- [ ] [409] [P] [Phase4] 创建 SearchBar：`src/entrypoints/sidepanel/components/SearchBar.tsx`
- [ ] [410] [P] [Phase4] 创建 EditModal：`src/entrypoints/sidepanel/components/EditModal.tsx`
- [ ] [411] [P] [Phase4] 创建 Settings：`src/entrypoints/sidepanel/components/Settings.tsx`
- [ ] [412] [Phase4] 创建主入口：`src/entrypoints/sidepanel/index.tsx`

### Popup（image-prompt）
- [ ] [413] [Phase4] 重建 image-prompt：`src/entrypoints/popup/index.tsx`

### 测试
- [ ] [414] [Phase4] 视觉对比测试：对比新旧版本界面

## Phase 5: 数据兼容与迁移（2-3 天）

**目标**: 确保新版能读取旧版数据

- [ ] [501] [Phase5] 编写数据迁移脚本：`src/shared/migration/migrate.ts`
- [ ] [502] [Phase5] 测试数据读取：验证新版能读取旧版 Chrome Storage 数据
- [ ] [503] [Phase5] 测试边界情况：空数据、大量数据、损坏数据
- [ ] [504] [Phase5] 实现数据导出/导入：支持 JSON 格式导出导入
- [ ] [505] [Phase5] 兼容性测试：安装旧版 → 创建数据 → 安装新版 → 验证完整性

## Phase 6: 集成测试与发布（2-3 天）

**目标**: 全面测试，准备发布

- [ ] [601] [Phase6] E2E 测试：覆盖所有核心流程（保存、搜索、注入、编辑、同步）
- [ ] [602] [Phase6] 性能测试：测试加载速度、内存占用、响应时间
- [ ] [603] [Phase6] 多浏览器测试：Chrome、Edge、Firefox
- [ ] [604] [Phase6] 打包优化：代码分割、Tree shaking、压缩
- [ ] [605] [Phase6] 文档更新：更新 README、CLAUDE.md、开发文档
- [ ] [606] [Phase6] 创建迁移指南：为用户提供从旧版升级的指南
- [ ] [607] [Phase6] 最终验证：完整功能清单对照检查

## Task Summary

**总任务数**: 60+

- Phase 0: 7 个任务（准备工作）
- Phase 1: 11 个任务（核心逻辑迁移）
- Phase 2: 9 个任务（Background 重构）
- Phase 3: 8 个任务（Content Script 重构）
- Phase 4: 14 个任务（UI 重构）
- Phase 5: 5 个任务（数据兼容）
- Phase 6: 7 个任务（集成测试）

**可并行任务**: 标记 [P] 的任务可以并行执行

## Notes

- 每完成一个 Phase，进行阶段性测试
- 保持 `prompt_ark` 原项目不变，随时可回退
- 优先保证功能完整性，再优化代码质量
- 遇到问题及时记录，调整计划
