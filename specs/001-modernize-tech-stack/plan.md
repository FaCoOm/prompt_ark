# Implementation Plan: 技术栈现代化与架构重构

**Branch**: `001-modernize-tech-stack` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)

## Summary

将 Prompt Ark 从原生 JavaScript 迁移到 TypeScript + WXT + Solid.js 技术栈，采用并行开发模式（新项目 `prompt_ark_v2`），确保功能不丢失。重点包括：模块化拆分（background.js 1151 行、content.js 1883 行）、样式重构（TailwindCSS 替代 3623 行 CSS）、平台适配器基类设计，**以及完整的 i18n 国际化迁移方案**。

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+  
**Primary Dependencies**: WXT, Solid.js, Kobalte, TailwindCSS, Vitest, Playwright, @solid-primitives/i18n  
**Storage**: Chrome Storage API (Sync/Local), GitHub Gist, WebDAV  
**Testing**: Vitest (单元测试), Playwright (E2E 测试)  
**Target Platform**: Chrome/Edge/Firefox (Manifest V3)  
**Project Type**: Browser Extension  
**Performance Goals**: 扩展加载 <500ms, UI 响应 <100ms  
**Constraints**: 打包体积 <2MB, 兼容 Chrome 88+  
**Scale/Scope**: 20+ AI 平台, 1000+ prompts 支持

## Constitution Check

*当前项目没有定义 constitution.md，使用以下默认原则：*

### 核心原则

1. **类型安全优先**: TypeScript 严格模式，消除所有 `any` 类型
2. **测试驱动**: 每迁移一个模块，必须编写对应的单元测试
3. **渐进迁移**: 保持 API 兼容性，确保 v2 能读取 v1 的用户数据
4. **单一职责**: 每个文件 <300 行，模块职责单一

## ⚠️ 关键发现：i18n 迁移不完整

### 问题描述

**v1 项目使用双重 i18n 方案**：
1. **Chrome 扩展 i18n**: `_locales/{en,zh_CN}/messages.json` (206 个键值对)
2. **JavaScript 模块**: `locales.js` (630+ 行，包含 311 个中文 + 322 个英文 UI 翻译)

**当前 v2 项目状态**：
- ✅ `_locales/` 目录已复制
- ❌ **缺少 `locales.js` 的迁移方案**
- ❌ **没有 i18n 工具/Hooks 实现**
- ❌ **Solid.js 组件中没有集成 i18n**

### i18n 迁移方案

基于研究结果，**推荐使用 @solid-primitives/i18n 方案**：

```
迁移策略：使用 @solid-primitives/i18n 替代双轨制方案

v1 方案 (双轨制):
├── _locales/messages.json    → Chrome 扩展 API 使用
└── locales.js                → UI 组件使用 (630+ 翻译)

v2 方案 (统一使用 Solid.js i18n):
├── public/_locales/          → Manifest 名称/描述本地化
└── src/i18n/
    ├── locales/
    │   ├── en.ts             # 合并 messages.json + locales.js
    │   └── zh-CN.ts          # 中文翻译
    ├── context.tsx           # I18nProvider + useI18n Hook
    └── types.ts              # 类型定义
```

**选择 @solid-primitives/i18n 的原因**：
- ✅ 支持**运行时语言切换**（用户可在设置中切换语言）
- ✅ 完美支持 Solid.js 细粒度响应式
- ✅ 轻量级 (~2KB)
- ✅ TypeScript 类型安全
- ✅ 支持复数、插值、命名空间

**具体迁移步骤**：

1. **合并翻译文件**:
   - 将 `locales.js` 和 `_locales/messages.json` 合并为 TypeScript 对象
   - 创建 `src/i18n/locales/en.ts` 和 `src/i18n/locales/zh-CN.ts`
   - 统一键名命名规范（camelCase 嵌套结构）

2. **创建 i18n 基础设施**:
   - `src/i18n/types.ts` - 类型定义
   - `src/i18n/locales/en.ts` - 英文翻译
   - `src/i18n/locales/zh-CN.ts` - 中文翻译
   - `src/i18n/context.tsx` - I18nProvider + useI18n Hook

3. **集成到应用**:
   - 在 App 入口包裹 I18nProvider
   - 所有组件使用 useI18n Hook 获取 t() 函数
   - 设置页面添加语言切换器

## Project Structure

### Documentation (this feature)

```text
specs/001-modernize-tech-stack/
├── spec.md              # 功能规范
├── plan.md              # 本文件
├── tasks.md             # 任务清单
├── research.md          # 技术研究成果
├── data-model.md        # 数据模型设计
└── contracts/           # 接口契约定义
```

### Source Code (repository root)

Git 工作区根目录：`/Users/lilcarrot/Project/prompt-ark/prompt_ark/`

```text
prompt_ark/                    # Git 根目录（当前目录）
├── background.js             # 原项目 v1 文件（保持不动）
├── content.js                # 原项目 v1 文件
├── popup.html/js/css         # 原项目 v1 文件
├── lib/                      # 原项目 v1 核心逻辑
├── _locales/                 # 原项目 v1 国际化
│   ├── en/messages.json      # Chrome 扩展翻译 (206 行)
│   └── zh_CN/messages.json   # Chrome 扩展翻译 (206 行)
├── locales.js                # 原项目 v1 UI 翻译 (630+ 行) ⚠️ 需要迁移
├── prompt_ark_v2/            # 新项目 v2（WXT + TS + Solid.js）
│   ├── wxt.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── public/
│   │   ├── _locales/         # Manifest 本地化（仅名称/描述）
│   │   │   ├── en/messages.json
│   │   │   └── zh_CN/messages.json
│   │   └── icons/
│   └── src/
│       ├── i18n/             # [NEW] i18n 模块
│       │   ├── index.ts      # 导出 I18nProvider, useI18n
│       │   ├── context.tsx   # Provider 和 Hook 实现
│       │   ├── types.ts      # 类型定义
│       │   └── locales/
│       │       ├── en.ts     # 英文翻译（合并后）
       │       └── zh-CN.ts   # 中文翻译（合并后）
│       ├── utils/
│       │   └── storage.ts    # 存储工具
│       ├── entrypoints/
│       │   ├── background/   # [NEW] Service Worker 模块化
│       │   ├── content/      # [NEW] Content Script 平台适配器
│       │   ├── sidepanel/    # [NEW] 主界面（原 popup）
│       │   └── popup/        # 图片 Prompt 生成器
│       ├── shared/           # [NEW] 核心逻辑迁移
│       │   ├── storage.ts
│       │   ├── variables.ts
│       │   ├── ai/
│       │   └── sync/
│       ├── stores/           # [NEW] Solid.js Stores
│       │   ├── promptStore.ts
│       │   ├── settingsStore.ts
│       │   └── uiStore.ts
│       └── components/       # [NEW] 共享 UI 组件
└── specs/001-modernize-tech-stack/
    └── ...
```

## Implementation Phases

### Phase 0: 准备工作（1-2 天）

**目标**: 建立测试基准，初始化新项目，**完成 i18n 迁移设计**

**任务**:
1. 功能清单梳理（从 README 和代码提取）
2. 为核心功能编写 E2E 测试（Playwright）
3. 记录用户数据结构（Chrome Storage schema）
4. **i18n 审计**: 对比 v1 的 `_locales/` 和 `locales.js`，整理完整翻译清单
5. 初始化 `prompt_ark_v2` 项目（WXT + TS + Solid.js）
6. 配置 TailwindCSS、Kobalte、Vitest

**交付物**:
- 功能清单文档
- E2E 测试套件（覆盖核心流程）
- **i18n 迁移计划文档**（翻译键对照表）
- 新项目骨架（可运行的空扩展）

### Phase 1: 核心逻辑迁移（3-5 天）

**目标**: 迁移 lib/ 目录下的业务逻辑，**完成 i18n 基础设施**

**迁移顺序**:
1. `lib/storage.js` → `src/shared/storage.ts`
2. `lib/variables.js` → `src/shared/variables.ts`
3. `lib/text-analysis.js` → `src/shared/text-analysis.ts`
4. `lib/ai/provider.js` → `src/shared/ai/provider.ts`
5. 其他 AI 功能模块（optimize, translate, share 等）
6. **[NEW] i18n 模块搭建**: 
   - `src/i18n/types.ts` - 类型定义
   - `src/i18n/locales/en.ts` - 英文翻译
   - `src/i18n/locales/zh-CN.ts` - 中文翻译
   - `src/i18n/context.tsx` - I18nProvider + useI18n Hook

**i18n 实施细节**:

```typescript
// src/i18n/types.ts
export interface LocaleDict {
  app: {
    name: string;
    description: string;
  };
  menu: {
    settings: string;
    save: string;
    cancel: string;
  };
  prompt: {
    create: string;
    edit: string;
    delete: string;
    searchPlaceholder: string;
  };
  // ... 300+ 翻译键
}

export type Locale = 'en' | 'zh-CN';
```

```typescript
// src/i18n/context.tsx
import { createContext, useContext, ParentComponent, createSignal, createMemo } from 'solid-js';
import * as i18n from '@solid-primitives/i18n';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import type { Locale, LocaleDict } from './types';

const dictionaries: Record<Locale, LocaleDict> = { en, 'zh-CN': zhCN };

interface I18nContextValue {
  locale: () => Locale;
  setLocale: (locale: Locale) => void;
  t: i18n.Translator<LocaleDict>;
}

const I18nContext = createContext<I18nContextValue>();

export const I18nProvider: ParentComponent = (props) => {
  const [locale, setLocaleState] = createSignal<Locale>('zh-CN');
  const dict = createMemo(() => i18n.flatten(dictionaries[locale()]));
  const t = i18n.translator(dict, i18n.resolveTemplate);

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleState, t }}>
      {props.children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
```

**验证方式**:
- 每个模块编写单元测试
- 确保函数签名和行为与原版一致
- TypeScript 类型覆盖率 100%
- **i18n 测试**: 验证所有翻译键在两种语言下都能正确显示

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

**目标**: 用 Solid.js + TailwindCSS 重建 sidepanel 和 popup，**集成 i18n**

**步骤**:
1. 提取设计系统（颜色、间距、字体）
2. 配置 TailwindCSS
3. 创建基础组件（Button, Input, Modal 等）
4. **集成 i18n Hook 到所有组件**
5. 重建 sidepanel 主界面
6. 重建 image-prompt popup

**i18n 集成检查点**:
- [ ] 所有用户可见文本使用 `t()` 函数
- [ ] 设置页面支持语言切换预览
- [ ] 翻译键名类型安全（TypeScript 检查）

**不逐行翻译 CSS**:
- popup.css (3623 行) → TailwindCSS + 少量自定义
- 参考视觉效果，用现代方式重建

### Phase 5: 数据兼容与迁移（2-3 天）

**目标**: 确保新版能读取旧版数据

**任务**:
1. 编写数据迁移脚本
2. 测试 Chrome Storage 数据读取
3. 确保数据结构向后兼容
4. 提供数据导出/导入功能

### Phase 6: 集成测试与发布（2-3 天）

**目标**: 全面测试，准备发布

**任务**:
1. E2E 测试覆盖所有核心流程
2. **i18n 测试**: 两种语言完整功能测试
3. 性能测试（加载速度、内存占用）
4. 多浏览器测试（Chrome, Edge, Firefox）
5. 打包优化（体积、代码分割）
6. 文档更新

## Risk Management

### 高风险项

1. **功能遗漏**
   - 风险：迁移过程中遗漏某些功能
   - 缓解：Phase 0 建立完整功能清单和测试基准

2. **数据丢失**
   - 风险：用户数据在迁移过程中损坏
   - 缓解：充分测试数据兼容性，提供回退方案

3. **i18n 遗漏**
   - 风险：v1 的翻译内容没有完整迁移到 v2
   - 缓解：建立翻译键对照表，逐一验证

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
- Phase 1: 3-5 天（包含 i18n 基础设施）
- Phase 2: 2-3 天
- Phase 3: 3-4 天
- Phase 4: 5-7 天（包含 i18n 集成）
- Phase 5: 2-3 天
- Phase 6: 2-3 天

## Success Criteria

### 功能完整性
- ✅ 所有原版功能在新版中都有对应实现
- ✅ E2E 测试通过率 100%
- ✅ 20+ AI 平台注入测试通过
- ✅ **所有 v1 翻译内容完整迁移到 v2**

### 代码质量
- ✅ TypeScript 严格模式，无 any 类型
- ✅ 单元测试覆盖率 >80%
- ✅ 所有模块有清晰的类型定义
- ✅ **i18n 类型安全，编译时检查翻译键名**

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
4. **立即开始 i18n 审计和迁移设计**

## Git 提交策略

### 分支管理

```
main
└── 001-modernize-tech-stack (当前分支)
    ├── phase0-setup
    ├── phase1-core-logic
    │   └── i18n-infrastructure  # [NEW] i18n 基础设施
    ├── phase2-background
    ├── phase3-content
    ├── phase4-ui
    │   └── i18n-integration     # [NEW] UI i18n 集成
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
- `i18n`: [NEW] 国际化相关

**示例**:
```
feat(storage): migrate storage.js to TypeScript
i18n(utils): add i18n utility module and type definitions
i18n(locales): merge locales.js into TypeScript dictionaries
refactor(background): split message handlers into modules
test(e2e): add core flow tests
chore(setup): initialize WXT project
```

## 附录：i18n 迁移检查清单

### 翻译键审计

| 来源 | 键数量 | 迁移状态 |
|------|--------|----------|
| `_locales/en/messages.json` | 42 | ✅ 已复制到 public/ |
| `_locales/zh_CN/messages.json` | 42 | ✅ 已复制到 public/ |
| `locales.js` (zh_CN) | 311 | ⚠️ 待迁移到 src/i18n/locales/zh-CN.ts |
| `locales.js` (en) | 322 | ⚠️ 待迁移到 src/i18n/locales/en.ts |

### 必须迁移的 UI 翻译键（部分示例）

来自 `locales.js` 的高频使用键：
- `app.name`, `app.description`
- `menu.settings`, `menu.save`, `menu.cancel`
- `prompt.newPrompt`, `prompt.editPrompt`, `prompt.searchPlaceholder`
- `prompt.categoryAll`, `prompt.import`, `prompt.export`
- `form.title`, `form.category`, `form.content`
- `action.cancel`, `action.save`, `action.deleteConfirm`
- `empty.noPrompts`, `empty.createFirst`
- `settings.language`, `settings.theme`
- `ai.models`, `ai.addProvider`, `ai.editProvider`
- `filter.favorites`, `filter.mostUsed`, `filter.recentlyUsed`
- ... (共 300+ 个键需要整理)

### 迁移后验证步骤

1. [ ] 对比 v1 和 v2 的翻译键总数
2. [ ] 确保所有键都有中英文版本
3. [ ] 在 UI 中逐一检查文本显示
4. [ ] 测试语言切换功能
5. [ ] 验证占位符替换（如 `{count}`）正常工作
6. [ ] TypeScript 编译检查所有翻译键类型正确

## 参考文档

- [WXT i18n 文档](https://wxt.dev/guide/essentials/i18n.html)
- [@solid-primitives/i18n 文档](https://primitives.solidjs.community/package/i18n)
- [Chrome Extension i18n API](https://developer.chrome.com/docs/extensions/reference/api/i18n)
