# Prompt Ark 重构迁移总体计划

> **方案**: 增量式重构 + Git 分支影子迁移  
> **策略**: 文件级渐进替换，新旧代码并存，每步可验证可回滚  
> **预计工期**: 25-39 天（单人全职）  
> **审核状态**: 待审核  

---

## 📋 执行摘要

### 迁移目标
将 Prompt Ark 从 Vanilla JavaScript + Manifest V3 原生开发模式，迁移到 **WXT + TypeScript + Solid.js** 现代化技术栈，同时：
- ✅ 100% 保留现有功能
- ✅ 支持 Chrome + Firefox 跨浏览器
- ✅ 提升代码可维护性
- ✅ 建立完整的测试体系

### 核心策略
采用 **"影子迁移"（Shadow Migration）** 策略：
1. **旧代码保留不动** - 所有 `.js` 文件保留功能完整
2. **新代码渐进添加** - 在 `src/` 目录下创建新实现
3. **文件级替换** - 一次只迁移一个模块
4. **持续验证** - 每步提交后扩展都能正常工作
5. **即时回滚** - 发现问题立即 Git 回滚

### 关键原则
- **绝不同时修改新旧两份代码** - 只修改正在迁移的文件
- **保持可运行状态** - 每次提交后 `pnpm dev` 必须能启动
- **小步提交** - 每个文件迁移完成后立即 commit
- **测试先行** - 新代码必须有对应单元测试

---

## 🗺️ 总体架构图

```
迁移前状态                          迁移中状态                           迁移完成
┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
│ background.js    │              │ background.js    │ 保留           │ background.ts    │
│ content.js       │              │ content.js       │ 保留           │ content.ts       │
│ popup.js         │      →       │ popup.js         │ 保留      →    │ popup/           │
│ lib/*.js         │   渐进替换    │ lib/*.js         │ 逐步删除        │ src/shared/      │
│ manifest.json    │              │ manifest.json    │ 保留           │ wxt.config.ts    │
└──────────────────┘              └──────────────────┘              └──────────────────┘
                                   │ src/             │ 新增
                                   │   ├── entrypoints│
                                   │   ├── components │
                                   │   └── shared/    │
                                   └──────────────────┘
```

---

## 📅 阶段详细计划

---

## Phase 1: 基础设施搭建
**工期**: 2-3 天  
**风险**: 低  
**回滚难度**: 极低（删除配置文件即可）

### 1.1 依赖管理初始化

#### 任务 1.1.1: 创建 package.json
**执行步骤**:
1. 备份现有 `package.json`（如果有）
2. 创建新的 `package.json`：
   ```bash
   # 使用 pnpm 初始化
   pnpm init
   ```
3. 添加核心依赖：
   ```bash
   pnpm add wxt@^0.19.0
   pnpm add solid-js@^1.8.0 zustand@^5.0.0
   pnpm add @webext-core/storage@^1.0.0
   ```
4. 添加开发依赖：
   ```bash
   pnpm add -D typescript@^5.3.0 vite@^6.0.0 vite-plugin-solid@^2.8.0
   pnpm add -D tailwindcss@^4.0.0 postcss@^8.4.0 autoprefixer@^10.4.0
   pnpm add -D @types/chrome@^0.0.268
   pnpm add -D eslint@^8.57.0 @typescript-eslint/* prettier@^3.2.0
   pnpm add -D vitest@^2.0.0 playwright@^1.40.0
   pnpm add -D husky@^9.0.0 lint-staged@^15.0.0
   ```

**验证标准**:
- [ ] `pnpm install` 成功完成
- [ ] `node_modules/` 目录创建
- [ ] `pnpm-lock.yaml` 生成

**检查点**: 
- 提交: `chore: initialize package.json with dependencies`

---

#### 任务 1.1.2: 配置 TypeScript
**执行步骤**:
1. 创建 `tsconfig.json`：
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "jsx": "preserve",
       "jsxImportSource": "solid-js",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"],
         "@shared/*": ["./src/shared/*"],
         "@components/*": ["./src/components/*"],
         "@stores/*": ["./src/stores/*"]
       },
       "esModuleInterop": true,
       "skipLibCheck": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "declaration": true,
       "sourceMap": true
     },
     "include": ["src/**/*", ".wxt/**/*"],
     "exclude": ["node_modules", "dist", ".output"]
   }
   ```

**验证标准**:
- [ ] `npx tsc --version` 显示 TypeScript 5.x
- [ ] `npx tsc --init` 不报错（可选）

---

### 1.2 WXT 框架配置

#### 任务 1.2.1: 创建 wxt.config.ts
**执行步骤**:
1. 分析现有 `manifest.json` 的所有字段
2. 创建 `wxt.config.ts`：
   ```typescript
   import { defineConfig } from 'wxt';

   export default defineConfig({
     extensionApi: 'chrome',
     manifest: {
       manifest_version: 3,
       name: '__MSG_appName__',
       version: '1.0.0',
       default_locale: 'zh_CN',
       description: '__MSG_appDesc__',
       permissions: [
         'storage', 'unlimitedStorage', 'activeTab', 'scripting',
         'contextMenus', 'sidePanel', 'cookies', 'tabs', 'notifications'
       ],
       host_permissions: [
         'https://chat.openai.com/*', 'https://chatgpt.com/*',
         'https://claude.ai/*', 'https://gemini.google.com/*',
         // ... 所有现有 host_permissions
         '<all_urls>'
       ],
       commands: {
         'open-picker': {
           suggested_key: { default: 'Ctrl+Shift+P', mac: 'Command+Shift+P' },
           description: '__MSG_openPickerDesc__'
         },
         'grab-context': {
           suggested_key: { default: 'Ctrl+Shift+G', mac: 'Command+Shift+G' },
           description: '__MSG_grabContextDesc__'
         }
       }
     },
     vite: () => ({
       resolve: {
         alias: {
           '@': '/src',
           '@shared': '/src/shared',
           '@components': '/src/components',
           '@stores': '/src/stores'
         }
       }
     })
   });
   ```

**验证标准**:
- [ ] `wxt` 命令可用
- [ ] `wxt prepare` 成功（生成 .wxt/ 目录）

**检查点**:
- 提交: `chore: configure WXT framework`

---

#### 任务 1.2.2: 创建目录结构
**执行步骤**:
```bash
mkdir -p src/{entrypoints,components,composables,stores,shared/{types,constants,utils,api},features,platforms,assets/styles}
mkdir -p tests/{unit,e2e}
```

创建占位文件：
```bash
touch src/shared/types/index.ts
touch src/shared/constants/index.ts
touch src/shared/utils/index.ts
touch src/shared/api/index.ts
```

**验证标准**:
- [ ] `tree src/` 显示完整目录结构
- [ ] 所有叶子目录有 `.gitkeep` 或文件

**检查点**:
- 提交: `chore: create source directory structure`

---

### 1.3 代码质量工具配置

#### 任务 1.3.1: ESLint 配置
**执行步骤**:
1. 创建 `.eslintrc.cjs`：
   ```javascript
   module.exports = {
     root: true,
     env: { browser: true, es2022: true, webextensions: true },
     extends: [
       'eslint:recommended',
       'plugin:@typescript-eslint/recommended',
       'plugin:solid/typescript'
     ],
     parser: '@typescript-eslint/parser',
     parserOptions: {
       ecmaVersion: 'latest',
       sourceType: 'module',
       project: './tsconfig.json'
     },
     plugins: ['@typescript-eslint', 'solid'],
     rules: {
       '@typescript-eslint/no-explicit-any': 'error',
       '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
       'no-console': ['warn', { allow: ['error', 'warn'] }]
     }
   };
   ```

**验证标准**:
- [ ] `pnpm eslint --version` 正常工作

---

#### 任务 1.3.2: Prettier 配置
**执行步骤**:
1. 创建 `.prettierrc`：
   ```json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5",
     "printWidth": 100,
     "plugins": ["prettier-plugin-tailwindcss"]
   }
   ```

2. 创建 `.editorconfig`（如不存在）

**验证标准**:
- [ ] `pnpm prettier --version` 正常工作

**检查点**:
- 提交: `chore: configure ESLint and Prettier`

---

#### 任务 1.3.3: TailwindCSS 配置
**执行步骤**:
1. 创建 `tailwind.config.ts`：
   ```typescript
   import type { Config } from 'tailwindcss';
   export default {
     content: ['./src/**/*.{ts,tsx,html}', './.wxt/**/*.{ts,tsx,html}'],
     theme: { extend: {} },
     plugins: []
   } satisfies Config;
   ```

2. 创建 `postcss.config.js`：
   ```javascript
   export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
   ```

3. 创建 `src/assets/styles/global.css`：
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

**验证标准**:
- [ ] Tailwind CSS IntelliSense 工作正常（VS Code）

**检查点**:
- 提交: `chore: configure TailwindCSS`

---

#### 任务 1.3.4: Husky + lint-staged 配置
**执行步骤**:
1. 初始化 Husky：
   ```bash
   pnpm exec husky init
   ```

2. 配置 `package.json`：
   ```json
   {
     "lint-staged": {
       "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
     }
   }
   ```

3. 创建 `.husky/pre-commit`：
   ```bash
   pnpm lint-staged
   ```

**验证标准**:
- [ ] Git commit 时自动运行 lint

**检查点**:
- 提交: `chore: configure Git hooks`

---

### 1.4 开发工作流验证

#### 任务 1.4.1: 验证开发服务器
**执行步骤**:
```bash
# 创建测试入口文件
cat > src/entrypoints/background.ts << 'EOF'
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  console.log('Background initialized');
});
EOF

# 启动开发服务器
pnpm dev
```

**验证标准**:
- [ ] WXT 启动无错误
- [ ] Chrome 可以加载扩展
- [ ] Console 显示 "Background initialized"

---

#### 任务 1.4.2: 验证构建流程
**执行步骤**:
```bash
# 构建 Chrome 版本
pnpm build

# 构建 Firefox 版本
pnpm build:firefox
```

**验证标准**:
- [ ] `dist/chrome/` 目录生成
- [ ] `dist/firefox/` 目录生成
- [ ] manifest.json 正确生成

**检查点**:
- 提交: `chore: verify build pipeline`

---

### Phase 1 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| `pnpm install` 成功 | ⬜ | 命令执行无错误 |
| `pnpm dev` 启动 | ⬜ | Chrome 能加载扩展 |
| `pnpm build` 成功 | ⬜ | dist/ 目录生成 |
| `pnpm lint` 无错误 | ⬜ | ESLint 通过 |
| Git hooks 工作 | ⬜ | commit 时自动 lint |

---

## Phase 2: 类型定义与常量迁移
**工期**: 2-3 天  
**风险**: 极低  
**回滚难度**: 极低

### 2.1 类型定义提取

#### 任务 2.1.1: 分析现有数据结构
**执行步骤**:
1. 从 `background.js` 提取 `Prompt` 数据结构：
   - 搜索所有 `prompt.` 字段访问
   - 记录所有可能的字段
   - 标记可选字段

2. 从 `lib/ai/provider.js` 提取 Provider 类型：
   - `type` 字段的可能值
   - 各 Provider 的特定字段

3. 从 `content.js` 提取 Platform 类型：
   - `detectPlatform()` 返回值
   - 各平台的配置差异

**输出文档**:
- 创建 `docs/DATA_STRUCTURES.md` 记录分析结果

---

#### 任务 2.1.2: 创建核心类型
**执行步骤**:

**文件**: `src/shared/types/prompt.ts`
```typescript
/**
 * 提示词数据模型
 * @description 对应原 background.js 中的 prompt 对象
 */
export interface Prompt {
  /** 唯一标识符 */
  id: string;
  /** 标题 */
  title: string;
  /** 提示词内容 */
  content: string;
  /** 分类 */
  category: string;
  /** 标签列表 */
  tags: string[];
  /** 快捷命令 (如 "email") */
  shortcut?: string;
  /** 提取的变量名列表 */
  variables: string[];
  /** 版本历史 */
  versions: PromptVersion[];
  /** 使用次数统计 */
  usageCount: number;
  /** 最后使用时间戳 */
  lastUsedAt: number | null;
  /** 是否收藏 */
  favorite: boolean;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt?: number;
  /** 是否内置提示词 */
  builtIn?: boolean;
  /** 标题是否由 AI 自动生成 */
  titleAutoGenerated?: boolean;
  /** 来源上下文 (右键添加时使用) */
  sourceContext?: SourceContext;
  /** 视频数据 (YouTube 转提示词时使用) */
  videoData?: VideoData;
}

export interface PromptVersion {
  versionId: string;
  content: string;
  timestamp: number;
}

export interface SourceContext {
  text: string;
  pageTitle?: string;
  pageUrl?: string;
  capturedAt: number;
  convertMethod: 'quick_add' | 'smart_convert';
}

export interface VideoData {
  url: string;
  transcript?: string;
  summary?: string;
}
```

**验证标准**:
- [ ] 所有字段都有 JSDoc 注释
- [ ] 可选字段用 `?` 标记
- [ ] 类型检查通过

---

**文件**: `src/shared/types/provider.ts`
```typescript
export type ProviderType = 'gemini' | 'openai' | 'gemini-web';

export interface BaseProvider {
  id: string;
  name: string;
  type: ProviderType;
  model?: string;
  enabled: boolean;
}

export interface GeminiProvider extends BaseProvider {
  type: 'gemini';
  apiKey: string;
  model: string;
}

export interface OpenAIProvider extends BaseProvider {
  type: 'openai';
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface GeminiWebProvider extends BaseProvider {
  type: 'gemini-web';
}

export type Provider = GeminiProvider | OpenAIProvider | GeminiWebProvider;
```

---

**文件**: `src/shared/types/platform.ts`
```typescript
export type Platform = 
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'notebooklm'
  | 'aistudio'
  | 'grok'
  | 'deepseek'
  | 'kimi'
  | 'zhipu'
  | 'doubao'
  | 'wenxin'
  | 'qwen'
  | 'minimax'
  | 'hunyuan'
  | 'generic';

export interface PlatformConfig {
  name: string;
  hostname: string[];
  selectors: {
    input: string[];
    sendButton?: string[];
  };
}
```

---

**文件**: `src/shared/types/message.ts`
```typescript
// 所有 background.js 中处理的消息类型
export type MessageType =
  | 'GET_PROMPTS'
  | 'SAVE_PROMPT'
  | 'UPDATE_PROMPT'
  | 'DELETE_PROMPT'
  | 'GET_PROVIDERS'
  | 'SAVE_PROVIDERS'
  | 'CAPTURE_PAGE_CONTEXT'
  | 'GET_PAGE_CONTEXT'
  // ... 其他所有消息类型

export interface BaseMessage {
  type: MessageType;
}

export interface GetPromptsMessage extends BaseMessage {
  type: 'GET_PROMPTS';
}

export interface SavePromptMessage extends BaseMessage {
  type: 'SAVE_PROMPT';
  prompt: Omit<Prompt, 'id' | 'createdAt'>;
}

// ... 为每个消息类型定义接口

export type Message = 
  | GetPromptsMessage 
  | SavePromptMessage 
  // ...;
```

**验证标准**:
- [ ] 所有消息类型都有定义
- [ ] Request/Response 类型完整

**检查点**:
- 提交: `types: define core data models`

---

### 2.2 常量迁移

#### 任务 2.2.1: 迁移 default-prompts
**执行步骤**:
1. 复制 `lib/default-prompts.js` 到 `src/shared/constants/default-prompts.ts`
2. 添加类型注解：
   ```typescript
   import type { Prompt } from '../types/prompt';
   
   export const DEFAULT_PROMPTS: Array<Omit<Prompt, 'id' | 'createdAt'>> = [
     // ... 原数据
   ];
   ```

**验证标准**:
- [ ] 数据内容完全一致
- [ ] TypeScript 类型正确

**检查点**:
- 提交: `types: migrate default prompts constants`

---

#### 任务 2.2.2: 迁移平台配置
**执行步骤**:
从 `content.js` 提取：
```typescript
// src/shared/constants/platforms.ts
import type { PlatformConfig } from '../types/platform';

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  chatgpt: {
    name: 'ChatGPT',
    hostname: ['chatgpt.com', 'chat.openai.com'],
    selectors: {
      input: ['#prompt-textarea', 'div[contenteditable="true"].ProseMirror'],
    },
  },
  // ... 其他平台
};
```

---

### Phase 2 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| Prompt 类型完整 | ⬜ | 覆盖所有字段 |
| Provider 类型完整 | ⬜ | 覆盖所有类型 |
| Platform 类型完整 | ⬜ | 覆盖所有平台 |
| Message 类型完整 | ⬜ | 覆盖所有消息 |
| 常量数据一致 | ⬜ | 与原文件对比 |
| 类型检查通过 | ⬜ | `tsc --noEmit` |

---

## Phase 3: 工具函数迁移
**工期**: 3-4 天  
**风险**: 低  
**回滚难度**: 低

### 3.1 纯工具函数（无依赖）

#### 任务 3.1.1: text-analysis.ts
**源文件**: `lib/text-analysis.js`  
**目标文件**: `src/shared/utils/text.ts`

**执行步骤**:
1. 复制函数实现
2. 添加类型注解
3. 添加单元测试

```typescript
// src/shared/utils/text.ts

/**
 * 检测文本语言
 * @param text - 输入文本
 * @returns 语言代码 ('zh' | 'en' | 'other')
 */
export function detectLanguageHeuristic(text: string): 'zh' | 'en' | 'other' {
  // 原实现
}

/**
 * 提取标题启发式
 * @param text - 输入文本
 * @returns 提取的标题
 */
export function extractTitleHeuristic(text: string): string {
  // 原实现
}
```

**测试文件**: `tests/unit/utils/text.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { detectLanguageHeuristic, extractTitleHeuristic } from '@/shared/utils/text';

describe('text utils', () => {
  describe('detectLanguageHeuristic', () => {
    it('should detect Chinese', () => {
      expect(detectLanguageHeuristic('你好世界')).toBe('zh');
    });
    
    it('should detect English', () => {
      expect(detectLanguageHeuristic('Hello world')).toBe('en');
    });
  });
  
  describe('extractTitleHeuristic', () => {
    it('should extract first line as title', () => {
      const text = 'First line\nSecond line';
      expect(extractTitleHeuristic(text)).toBe('First line');
    });
  });
});
```

**验证标准**:
- [ ] 所有原函数都有对应实现
- [ ] 单元测试覆盖主要场景
- [ ] 测试结果与旧实现一致

---

#### 任务 3.1.2: variables.ts
**源文件**: `lib/variables.js`  
**目标文件**: `src/shared/utils/variables.ts`

**关键函数**:
- `extractVariables(content: string): string[]`
- `classifyVariables(variables: string[]): { user: string[]; context: string[] }`
- `resolveContextVariables(content: string): Promise<ResolvedVars>`
- `composePrompt(prompt: Prompt, overrides?: Record<string, string>): string`

---

#### 任务 3.1.3: parsers.ts
**源文件**: `lib/parsers.js`  
**目标文件**: `src/shared/utils/parsers.ts`

---

#### 任务 3.1.4: frontmatter.ts
**源文件**: `lib/frontmatter.js`  
**目标文件**: `src/shared/utils/frontmatter.ts`

---

### 3.2 轻依赖工具函数

#### 任务 3.2.1: ui.ts
**源文件**: `lib/popup/utils.js`  
**目标文件**: `src/shared/utils/ui.ts`

**函数清单**:
- `escapeHtml(str: string): string`
- `debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T`
- `renderMarkdown(content: string): string`
- `formatRelativeTime(timestamp: number): string`
- `highlightVariables(content: string): string`

---

#### 任务 3.2.2: format.ts
**新文件**: `src/shared/utils/format.ts`

**新增函数**:
- `formatDate(timestamp: number): string`
- `truncate(str: string, maxLength: number): string`

---

### Phase 3 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| text-analysis 迁移 | ⬜ | 测试通过 |
| variables 迁移 | ⬜ | 测试通过 |
| parsers 迁移 | ⬜ | 测试通过 |
| frontmatter 迁移 | ⬜ | 测试通过 |
| UI utils 迁移 | ⬜ | 测试通过 |
| 单元测试覆盖率 > 80% | ⬜ | Vitest 报告 |

---

## Phase 4: 核心服务层迁移
**工期**: 4-6 天  
**风险**: 中  
**回滚难度**: 中

### 4.1 Storage 服务

#### 任务 4.1.1: 创建 Storage API
**源文件**: `lib/storage.js`  
**目标文件**: `src/shared/api/storage.ts`

**接口设计**:
```typescript
export interface StorageAdapter<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  remove(): Promise<void>;
}

export const PromptStorage: StorageAdapter<Prompt[]> = {
  async get() {
    // 使用 @webext-core/storage
  },
  async set(value) {
    // 分层存储逻辑
  },
  async remove() {
    // 清理存储
  }
};
```

**关键考虑**:
- 保持与旧存储格式的兼容性
- 实现 Sync + Local 分层存储
- 数据压缩（如果使用）

---

### 4.2 AI Provider 服务

#### 任务 4.2.1: 迁移 Provider API
**源文件**: `lib/ai/provider.js`  
**目标文件**: `src/shared/api/ai.ts`

**接口设计**:
```typescript
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  generate(prompt: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

export class GeminiProvider implements AIProvider {
  // 实现
}

export class OpenAIProvider implements AIProvider {
  // 实现
}

export class GeminiWebProvider implements AIProvider {
  // 实现
}
```

---

### 4.3 Zustand Store

#### 任务 4.3.1: Prompt Store
**文件**: `src/stores/promptStore.ts`

```typescript
import { create } from 'zustand';
import { PromptStorage } from '@shared/api/storage';
import type { Prompt } from '@shared/types/prompt';

interface PromptState {
  prompts: Prompt[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPrompts: () => Promise<void>;
  addPrompt: (prompt: Omit<Prompt, 'id'>) => Promise<void>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  isLoading: false,
  error: null,
  
  async loadPrompts() {
    set({ isLoading: true });
    try {
      const prompts = await PromptStorage.get();
      set({ prompts, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
  
  // ... 其他 actions
}));
```

---

### Phase 4 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| Storage API 可用 | ⬜ | 读写测试通过 |
| Provider API 可用 | ⬜ | AI 调用测试 |
| Prompt Store 工作 | ⬜ | 状态管理测试 |
| 与旧数据兼容 | ⬜ | 使用旧数据测试 |

---

## Phase 5: Background Script 迁移
**工期**: 4-6 天  
**风险**: 中  
**回滚难度**: 中

### 5.1 消息处理器

#### 任务 5.1.1: 创建处理器框架
**文件结构**:
```
src/entrypoints/background.ts
src/background/
  ├── index.ts          # 入口
  ├── handlers/
  │   ├── index.ts      # 处理器注册
  │   ├── prompt.ts     # 提示词相关
  │   ├── sync.ts       # 同步相关
  │   ├── ai.ts         # AI 调用相关
  │   └── settings.ts   # 设置相关
  └── services/
      └── contextMenu.ts # 上下文菜单
```

---

#### 任务 5.1.2: 迁移 Prompt 处理器
从 `background.js` 提取：
- `GET_PROMPTS`
- `SAVE_PROMPT`
- `UPDATE_PROMPT`
- `DELETE_PROMPT`

---

#### 任务 5.1.3: 迁移 AI 处理器
从 `background.js` 提取：
- `GENERATE_TEXT`
- `OPTIMIZE_PROMPT`
- `TRANSLATE_PROMPT`
- `AUTO_EXTRACT`

---

### 5.2 上下文菜单

#### 任务 5.2.1: 迁移 Context Menu
**源文件**: `lib/context-menu.js`  
**目标文件**: `src/background/services/contextMenu.ts`

---

### Phase 5 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| Background 启动 | ⬜ | Console 无错误 |
| Prompt CRUD | ⬜ | Popup 能操作 |
| AI 功能 | ⬜ | 优化/翻译可用 |
| 上下文菜单 | ⬜ | 右键菜单正常 |
| 快捷键 | ⬜ | Ctrl+Shift+P 可用 |

---

## Phase 6: Content Script 迁移
**工期**: 6-8 天  
**风险**: 高  
**回滚难度**: 高

### 6.1 平台适配器架构

#### 任务 6.1.1: 创建基础适配器
**文件**: `src/platforms/base.ts`

```typescript
export abstract class PlatformAdapter {
  abstract readonly name: string;
  abstract readonly selectors: PlatformSelectors;
  
  abstract findInput(): HTMLElement | null;
  abstract injectText(input: HTMLElement, text: string): Promise<boolean>;
  abstract isReady(): boolean;
}
```

---

#### 任务 6.1.2: 迁移各平台适配器
逐个迁移：
- [ ] ChatGPT (`src/platforms/chatgpt.ts`)
- [ ] Claude (`src/platforms/claude.ts`)
- [ ] Gemini (`src/platforms/gemini.ts`)
- [ ] DeepSeek
- [ ] Kimi
- [ ] ...其他平台

---

### 6.2 功能模块

#### 任务 6.2.1: Prompt Picker
**文件**: `src/features/picker/`

---

#### 任务 6.2.2: Slash Commands
**文件**: `src/features/slash-commands/`

---

#### 任务 6.2.3: Quick Actions
**文件**: `src/features/quick-actions/`

---

### Phase 6 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| ChatGPT 注入 | ⬜ | 按钮显示/点击 |
| Claude 注入 | ⬜ | 按钮显示/点击 |
| Gemini 注入 | ⬜ | 按钮显示/点击 |
| Prompt Picker | ⬜ | 选择器弹出 |
| Slash 命令 | ⬜ | /触发 |
| 快速操作 | ⬜ | 按钮功能 |

---

## Phase 7: Popup 重构
**工期**: 6-8 天  
**风险**: 高  
**回滚难度**: 高

### 7.1 应用架构

#### 任务 7.1.1: 创建 Solid.js 应用
**文件**: `src/entrypoints/popup/`

```
popup/
├── index.html
├── index.tsx       # 入口
├── App.tsx         # 根组件
├── app.css         # 全局样式
└── components/     # 子组件
```

---

### 7.2 UI 组件开发

#### 任务 7.2.1: 基础组件
- [ ] `Button.tsx`
- [ ] `Input.tsx`
- [ ] `Modal.tsx`
- [ ] `Toast.tsx`

---

#### 任务 7.2.2: 业务组件
- [ ] `PromptCard.tsx`
- [ ] `PromptList.tsx`
- [ ] `CategoryTabs.tsx`
- [ ] `SearchBar.tsx`
- [ ] `EditModal.tsx`
- [ ] `SettingsPanel.tsx`

---

### 7.3 功能实现

#### 任务 7.3.1: 提示词 CRUD
- [ ] 列表展示
- [ ] 新建/编辑
- [ ] 删除确认
- [ ] 复制内容

---

#### 任务 7.3.2: 搜索与筛选
- [ ] 实时搜索
- [ ] 分类筛选
- [ ] 智能筛选（收藏/最近/最常用）

---

#### 任务 7.3.3: 设置管理
- [ ] Provider 配置
- [ ] 同步设置
- [ ] 语言切换

---

### Phase 7 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| Popup 加载 | ⬜ | < 100ms |
| 列表渲染 | ⬜ | 100条流畅 |
| CRUD 完整 | ⬜ | 增删改查 |
| 搜索响应 | ⬜ | 实时 |
| 设置保存 | ⬜ | 持久化 |

---

## Phase 8: 测试与验证
**工期**: 3-5 天  
**风险**: 中  
**回滚难度**: 中

### 8.1 单元测试

#### 任务 8.1.1: 工具函数测试
覆盖率目标: > 80%

---

#### 任务 8.1.2: Store 测试
覆盖率目标: > 70%

---

### 8.2 E2E 测试

#### 任务 8.2.1: 核心流程测试
- [ ] 创建提示词
- [ ] 在 ChatGPT 使用
- [ ] 同步到 Gist

---

### 8.3 跨浏览器测试

#### 任务 8.3.1: Chrome 测试
- [ ] MV3 功能完整

---

#### 任务 8.3.2: Firefox 测试
- [ ] MV2/MV3 适配

---

### Phase 8 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| 单元测试 | ⬜ | > 80% |
| E2E 通过 | ⬜ | Playwright |
| Chrome OK | ⬜ | 手动测试 |
| Firefox OK | ⬜ | 手动测试 |

---

## Phase 9: 清理与优化
**工期**: 2-3 天  
**风险**: 低  
**回滚难度**: 低

### 9.1 代码清理

#### 任务 9.1.1: 删除旧文件
```bash
# 删除已迁移的 .js 文件
rm lib/text-analysis.js
rm lib/variables.js
# ... 其他
```

---

#### 任务 9.1.2: 更新 manifest
切换到 WXT 生成的 manifest

---

### 9.2 文档更新

#### 任务 9.2.1: README 更新
- [ ] 新的开发指南
- [ ] 构建说明
- [ ] 贡献指南

---

### Phase 9 里程碑检查

| 检查项 | 状态 | 验证方法 |
|--------|------|----------|
| 旧代码删除 | ⬜ | 无 .js 残留 |
| 文档更新 | ⬜ | README 完整 |
| 构建成功 | ⬜ | pnpm build |

---

## 🔄 回滚策略详解

### Level 1: 文件级回滚
```bash
# 恢复单个文件
git checkout HEAD~1 -- src/shared/utils/text.ts
```

### Level 2: 阶段级回滚
```bash
# 回滚整个 Phase
git reset --hard phase-2-complete
```

### Level 3: 完全回滚
```bash
# 切换到 main 分支
git checkout main
```

---

## 📊 风险管理矩阵

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Content Script 平台适配失败 | 中 | 高 | 保留原文件，逐个迁移 |
| 数据格式不兼容 | 低 | 高 | 编写迁移脚本 |
| 性能下降 | 低 | 中 | 建立基准，持续监控 |
| 第三方 API 变更 | 低 | 中 | 抽象 API 层 |

---

## ✅ 审核检查清单

### 计划完整性
- [ ] 所有 9 个 Phase 详细描述
- [ ] 每个任务有明确的输入/输出
- [ ] 验证标准可量化
- [ ] 回滚策略可操作

### 风险评估
- [ ] 高风险点已识别
- [ ] 缓解措施合理
- [ ] 回滚方案可行

### 资源需求
- [ ] 工期估算合理
- [ ] 工具链明确
- [ ] 测试策略完整

---

## 🚀 下一步行动

1. **审核本计划** - 检查是否符合预期
2. **确认时间预算** - 25-39 天是否可接受
3. **确定开始日期** - 何时开始 Phase 1
4. **分配资源** - 单人还是协作

请审核后回复：
- **通过** - 开始实施 Phase 1
- **修改** - 需要调整的部分
- **讨论** - 需要进一步澄清的问题
