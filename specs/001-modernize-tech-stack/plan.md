# Implementation Plan: 技术栈现代化与架构重构

**Branch**: `001-modernize-tech-stack` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)

## Summary

将 Prompt Ark 从原生 JavaScript 迁移到 TypeScript + WXT + Solid.js 技术栈，采用并行开发模式（新项目 `prompt_ark_v2`），确保功能不丢失。重点包括：模块化拆分（background.js 1151 行、content.js 1883 行）、样式重构（TailwindCSS 替代 3623 行 CSS）、平台适配器基类设计。

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+
**Primary Dependencies**: WXT, Solid.js, Kobalte, TailwindCSS, Vitest, Playwright
**Storage**: Chrome Storage API (Sync/Local), GitHub Gist, WebDAV
**Testing**: Vitest (单元测试), Playwright (E2E 测试)
**Target Platform**: Chrome/Edge/Firefox (Manifest V3)
**Project Type**: Browser Extension
**Performance Goals**: 扩展加载 <500ms, UI 响应 <100ms
**Constraints**: 打包体积 <2MB, 兼容 Chrome 88+
**Scale/Scope**: 20+ AI 平台, 1000+ prompts 支持

## Project Structure

### Documentation (this feature)

```text
specs/001-modernize-tech-stack/
├── spec.md              # 功能规范
├── plan.md              # 本文件
└── tasks.md             # 任务清单（待生成）
```

### Source Code (repository root)

```text
prompt-ark/
├── prompt_ark/           # 原项目（保持运行）
│   ├── background.js     # 1151 行
│   ├── content.js        # 1883 行
│   ├── popup.html/js/css # 主界面（实际是 sidepanel）
│   ├── image-prompt.html # 图片 prompt 生成器
│   └── lib/              # 核心逻辑模块
│
└── prompt_ark_v2/        # 新项目（WXT + TS + Solid.js）
    ├── wxt.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── src/
    │   ├── entrypoints/
    │   │   ├── background/
    │   │   ├── content/
    │   │   ├── sidepanel/
    │   │   └── popup/
    │   ├── shared/
    │   ├── stores/
    │   └── components/
    └── tests/
```

**Structure Decision**: 采用并行开发模式，新旧项目独立，确保零风险迁移。

## Implementation Phases

### Phase 0: 准备工作（1-2 天）

**目标**: 建立测试基准，初始化新项目

**任务**:
1. 功能清单梳理（从 README 和代码提取）
2. 为核心功能编写 E2E 测试（Playwright）
3. 记录用户数据结构（Chrome Storage schema）
4. 初始化 `prompt_ark_v2` 项目（WXT + TS + Solid.js）
5. 配置 TailwindCSS、Kobalte、Vitest

**交付物**:
- 功能清单文档
- E2E 测试套件（覆盖核心流程）
- 新项目骨架（可运行的空扩展）

### Phase 1: 核心逻辑迁移（3-5 天）

**目标**: 迁移 lib/ 目录下的业务逻辑，保持 API 兼容

**迁移顺序**:
1. `lib/storage.js` → `src/shared/storage.ts`
2. `lib/variables.js` → `src/shared/variables.ts`
3. `lib/text-analysis.js` → `src/shared/text-analysis.ts`
4. `lib/ai/provider.js` → `src/shared/ai/provider.ts`
5. 其他 AI 功能模块（optimize, translate, share 等）

**验证方式**:
- 每个模块编写单元测试
- 确保函数签名和行为与原版一致
- TypeScript 类型覆盖率 100%

### Phase 2: Background 重构（2-3 天）

**目标**: 将 background.js (1151 行) 拆分为模块化结构

**拆分方案**:
```
src/entrypoints/background/
├── index.ts                    # 主入口
├── handlers/
│   ├── message-handler.ts      # 消息路由
│   ├── storage-handler.ts      # 存储操作
│   ├── ai-handler.ts           # AI API 调用
│   └── context-menu-handler.ts # 右键菜单
└── services/
    ├── sync-service.ts         # 同步服务
    └── shortcut-service.ts     # 快捷键
```

**验证方式**:
- 所有消息类型都有对应的 handler
- 与原版 background.js 功能对等测试
- 类型安全的消息传递

### Phase 3: Content Script 重构（3-4 天）

**目标**: 将 content.js (1883 行) 按平台拆分

**拆分方案**:
```
src/entrypoints/content/
├── index.ts                    # 平台检测
├── core/
│   ├── injector.ts             # UI 注入
│   ├── slash-command.ts        # 斜杠命令
│   └── quick-actions.ts        # 快捷操作
└── platforms/
    ├── base.ts                 # 基类
    ├── chatgpt.ts              # 各平台适配器
    └── ...
```

**验证方式**:
- 在 20+ 平台测试按钮注入
- 斜杠命令功能测试
- 样式隔离测试（不污染页面）

### Phase 4: UI 重构（5-7 天）

**目标**: 用 Solid.js + TailwindCSS 重建 sidepanel 和 popup

**步骤**:
1. 提取设计系统（颜色、间距、字体）
2. 配置 TailwindCSS
3. 创建基础组件（Button, Input, Modal 等）
4. 重建 sidepanel 主界面
5. 重建 image-prompt popup

**不逐行翻译 CSS**:
- popup.css (3623 行) → TailwindCSS + 少量自定义
- 参考视觉效果，用现代方式重建

**验证方式**:
- 视觉对比测试
- 响应式布局测试
- 暗色模式测试

### Phase 5: 数据兼容与迁移（2-3 天）

**目标**: 确保新版能读取旧版数据

**任务**:
1. 编写数据迁移脚本
2. 测试 Chrome Storage 数据读取
3. 确保数据结构向后兼容
4. 提供数据导出/导入功能

**验证方式**:
- 安装旧版 → 创建数据 → 安装新版 → 验证数据完整
- 测试边界情况（空数据、大量数据、损坏数据）

### Phase 6: 集成测试与发布（2-3 天）

**目标**: 全面测试，准备发布

**任务**:
1. E2E 测试覆盖所有核心流程
2. 性能测试（加载速度、内存占用）
3. 多浏览器测试（Chrome, Edge, Firefox）
4. 打包优化（体积、代码分割）
5. 文档更新

**交付物**:
- 完整的 `prompt_ark_v2` 扩展
- 测试报告
- 迁移指南

## Risk Management

### 高风险项

1. **功能遗漏**
   - 风险：迁移过程中遗漏某些功能
   - 缓解：Phase 0 建立完整功能清单和测试基准

2. **数据丢失**
   - 风险：用户数据在迁移过程中损坏
   - 缓解：充分测试数据兼容性，提供回退方案

3. **性能下降**
   - 风险：新技术栈导致性能不如原版
   - 缓解：性能测试，优化打包体积

### 中风险项

1. **平台兼容性**
   - 风险：某些 AI 平台注入失败
   - 缓解：逐个平台测试，保留原版作为参考

2. **学习曲线**
   - 风险：团队不熟悉 Solid.js
   - 缓解：提供文档和示例代码

## Timeline

**总计**: 18-27 天（约 3-4 周）

- Phase 0: 1-2 天
- Phase 1: 3-5 天
- Phase 2: 2-3 天
- Phase 3: 3-4 天
- Phase 4: 5-7 天
- Phase 5: 2-3 天
- Phase 6: 2-3 天

## Success Criteria

### 功能完整性
- ✅ 所有原版功能在新版中都有对应实现
- ✅ E2E 测试通过率 100%
- ✅ 20+ AI 平台注入测试通过

### 代码质量
- ✅ TypeScript 严格模式，无 any 类型
- ✅ 单元测试覆盖率 >80%
- ✅ 所有模块有清晰的类型定义

### 性能指标
- ✅ 扩展加载时间 <500ms
- ✅ UI 响应时间 <100ms
- ✅ 打包体积 <2MB

### 可维护性
- ✅ 单个文件 <300 行
- ✅ 模块职责单一
- ✅ 代码风格统一（Prettier + ESLint）

## Next Steps

1. 获取用户确认此计划
2. 使用 `/speckit.tasks` 生成详细任务清单
3. 开始 Phase 0 准备工作

## Git 提交策略

### 分支管理

```
main
└── 001-modernize-tech-stack (当前分支)
    ├── phase0-setup
    ├── phase1-core-logic
    ├── phase2-background
    ├── phase3-content
    ├── phase4-ui
    ├── phase5-data-migration
    └── phase6-integration
```

### 提交规范

**格式**: `<type>(<scope>): <subject>`

**类型**:
- `feat`: 新功能
- `refactor`: 重构
- `test`: 测试
- `chore`: 配置、工具

**示例**:
```
feat(storage): migrate storage.js to TypeScript
refactor(background): split message handlers into modules
test(e2e): add core flow tests
chore(setup): initialize WXT project
```

### 提交频率

- **小步提交**: 每完成一个模块立即提交
- **功能完整**: 每个提交应该是可运行的状态
- **阶段里程碑**: 每个 Phase 结束创建 tag

### 里程碑标签

```
v2.0.0-alpha.0  # Phase 0 完成
v2.0.0-alpha.1  # Phase 1 完成
v2.0.0-alpha.2  # Phase 2 完成
v2.0.0-alpha.3  # Phase 3 完成
v2.0.0-beta.1   # Phase 4 完成
v2.0.0-beta.2   # Phase 5 完成
v2.0.0-rc.1     # Phase 6 完成
```

### PR 策略

- 每个 Phase 完成后创建 PR 到 `001-modernize-tech-stack`
- PR 包含：代码变更、测试结果、功能对比
- 最终将 `001-modernize-tech-stack` 合并到 `main`

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
