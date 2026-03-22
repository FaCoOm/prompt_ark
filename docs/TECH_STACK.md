# Prompt Ark 技术栈规范文档

> **版本**: 1.0.0  
> **日期**: 2024-03-22  
> **分支**: `refactor/cleanup`

---

## 📋 技术栈总览

```yaml
核心框架: WXT (v0.19+)
前端框架: Solid.js (v1.8+) - 按需使用
语言: TypeScript (v5.3+)
样式: TailwindCSS (v4.0+)
状态管理: Zustand (v5.0+)
包管理: pnpm (v9+)
构建工具: Vite (v6+ - 内置在 WXT 中)
测试: Vitest + Playwright
代码规范: ESLint + Prettier + Husky
```

---

## 🎯 技术选型理由

### WXT (核心框架)
- ✅ 真正的跨浏览器支持 (Chrome/Firefox/Safari/Edge)
- ✅ 自动处理 MV2/MV3 差异
- ✅ 文件路由约定，减少配置
- ✅ 自动类型生成
- ✅ 活跃的社区维护

### Solid.js (UI 框架)
- ✅ 性能接近原生 (无 Virtual DOM)
- ✅ 打包体积小 (~7KB)
- ✅ 语法类似 React，学习成本低
- ✅ 响应式系统高效
- ✅ 适合浏览器扩展的性能要求

### TypeScript
- ✅ 类型安全
- ✅ 更好的 IDE 支持
- ✅ 代码可维护性
- ✅ 重构友好

### TailwindCSS
- ✅ 原子化 CSS，减少样式文件
- ✅ Tree-shaking 优化
- ✅ 开发效率高
- ✅ 一致性设计系统

### Zustand (状态管理)
- ✅ 极简 API
- ✅ 无样板代码
- ✅ TypeScript 友好
- ✅ 支持持久化

---

## 📁 目录结构规范

```
prompt-ark/
├── src/
│   ├── entrypoints/           # WXT 入口文件 (自动识别)
│   │   ├── background.ts      # Service Worker
│   │   ├── content.ts         # Content Script
│   │   ├── popup/             # 弹出窗口
│   │   │   ├── index.html
│   │   │   ├── index.tsx      # Solid.js App 入口
│   │   │   ├── App.tsx        # 根组件
│   │   │   └── app.css        # 样式
│   │   └── image-prompt/      # 图片提示页面
│   │       ├── index.html
│   │       └── index.ts
│   │
│   ├── components/            # 共享组件 (Solid.js)
│   │   ├── PromptCard.tsx
│   │   ├── PromptList.tsx
│   │   ├── CategoryTabs.tsx
│   │   ├── SearchBar.tsx
│   │   └── ui/                # 基础 UI 组件
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   │
│   ├── composables/           # 组合式逻辑 (vanilla TS)
│   │   ├── usePrompts.ts
│   │   ├── useSync.ts
│   │   ├── useAIProvider.ts
│   │   └── usePlatform.ts
│   │
│   ├── stores/                # 状态管理 (Zustand)
│   │   ├── promptStore.ts
│   │   ├── settingsStore.ts
│   │   └── syncStore.ts
│   │
│   ├── shared/                # 共享代码
│   │   ├── types/             # TypeScript 类型定义
│   │   │   ├── index.ts       # 统一导出
│   │   │   ├── prompt.ts
│   │   │   ├── provider.ts
│   │   │   ├── platform.ts
│   │   │   ├── sync.ts
│   │   │   └── message.ts
│   │   ├── constants/         # 常量定义
│   │   │   └── index.ts
│   │   ├── utils/             # 工具函数
│   │   │   ├── index.ts
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   └── api/               # API 客户端
│   │       ├── index.ts
│   │       ├── ai.ts
│   │       └── storage.ts
│   │
│   ├── features/              # 功能模块
│   │   ├── prompt-picker/     # 提示选择器
│   │   ├── slash-commands/    # /命令
│   │   ├── quick-actions/     # 快速操作
│   │   └── context-grabber/   # 上下文抓取
│   │
│   ├── platforms/             # 平台适配器
│   │   ├── index.ts
│   │   ├── base.ts            # 基础适配器
│   │   ├── chatgpt.ts
│   │   ├── claude.ts
│   │   ├── gemini.ts
│   │   └── ...
│   │
│   └── assets/                # 静态资源
│       ├── icons/
│       └── styles/
│           └── global.css
│
├── prompts/                   # AI prompts (保持原样)
├── _locales/                  # i18n 文件
├── tests/                     # 测试文件
│   ├── unit/                  # 单元测试
│   └── e2e/                   # E2E 测试
│
├── docs/                      # 文档
│   ├── TECH_STACK.md          # 本文档
│   ├── MIGRATION_PLAN.md      # 迁移计划
│   └── ARCHITECTURE.md        # 架构设计
│
├── wxt.config.ts              # WXT 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 包管理配置
├── tailwind.config.ts         # TailwindCSS 配置
├── postcss.config.js          # PostCSS 配置
├── .eslintrc.cjs              # ESLint 配置
├── .prettierrc                # Prettier 配置
├── .editorconfig              # EditorConfig
├── .gitignore                 # Git 忽略文件
└── README.md                  # 项目说明
```

---

## ⚙️ 配置文件规范

### 1. WXT 配置 (`wxt.config.ts`)

```typescript
import { defineConfig } from 'wxt';

export default defineConfig({
  // 浏览器支持
  extensionApi: 'chrome',
  
  manifest: {
    manifest_version: 3,
    name: '__MSG_appName__',
    version: '1.0.0',
    default_locale: 'zh_CN',
    description: '__MSG_appDesc__',
    
    permissions: [
      'storage',
      'unlimitedStorage',
      'activeTab',
      'scripting',
      'contextMenus',
      'sidePanel',
      'cookies',
      'tabs',
      'notifications',
    ],
    
    host_permissions: [
      'https://generativelanguage.googleapis.com/*',
      'https://chat.openai.com/*',
      'https://chatgpt.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
      'https://notebooklm.google.com/*',
      'https://aistudio.google.com/*',
      'https://grok.com/*',
      'https://chat.deepseek.com/*',
      'https://kimi.com/*',
      'https://kimi.moonshot.cn/*',
      'https://chatglm.cn/*',
      'https://www.doubao.com/*',
      'https://doubao.com/*',
      'https://yiyan.baidu.com/*',
      'https://tongyi.aliyun.com/*',
      'https://chat.qwen.ai/*',
      'https://hailuoai.com/*',
      'https://www.hailuoai.com/*',
      'https://hunyuan.tencent.com/*',
      '<all_urls>',
    ],
    
    web_accessible_resources: [
      {
        resources: ['image-prompt.html', 'image-prompt.js'],
        matches: ['<all_urls>'],
      },
    ],
    
    action: {
      default_popup: 'popup.html',
      default_title: 'Prompt Ark',
      default_icon: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png',
      },
    },
    
    commands: {
      'open-picker': {
        suggested_key: {
          default: 'Ctrl+Shift+P',
          mac: 'Command+Shift+P',
        },
        description: '__MSG_openPickerDesc__',
      },
      'grab-context': {
        suggested_key: {
          default: 'Ctrl+Shift+G',
          mac: 'Command+Shift+G',
        },
        description: '__MSG_grabContextDesc__',
      },
      'share-article': {
        suggested_key: {
          default: 'Ctrl+Shift+Y',
          mac: 'Command+Shift+Y',
        },
        description: '__MSG_shareArticleDesc__',
      },
    },
    
    externally_connectable: {
      matches: ['http://localhost:5173/*'],
    },
  },
  
  // 开发配置
  runner: {
    chromiumBinary: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    firefoxBinary: '/Applications/Firefox.app/Contents/MacOS/firefox',
    startUrls: ['https://chatgpt.com'],
  },
  
  // 构建配置
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
  },
  
  // Vite 配置
  vite: () => ({
    resolve: {
      alias: {
        '@': '/src',
        '@shared': '/src/shared',
        '@components': '/src/components',
        '@stores': '/src/stores',
        '@features': '/src/features',
        '@platforms': '/src/platforms',
      },
    },
  }),
});
```

### 2. TypeScript 配置 (`tsconfig.json`)

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
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@components/*": ["./src/components/*"],
      "@stores/*": ["./src/stores/*"],
      "@features/*": ["./src/features/*"],
      "@platforms/*": ["./src/platforms/*"]
    },
    
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", ".wxt/**/*"],
  "exclude": ["node_modules", "dist", ".output"]
}
```

### 3. 包管理配置 (`package.json`)

```json
{
  "name": "prompt-ark",
  "version": "1.0.0",
  "description": "Stop losing your best AI prompts. Save, organize, and launch them in one click.",
  "type": "module",
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "postinstall": "wxt prepare"
  },
  "dependencies": {
    "solid-js": "^1.8.0",
    "zustand": "^5.0.0",
    "@webext-core/storage": "^1.0.0"
  },
  "devDependencies": {
    "wxt": "^0.19.0",
    "typescript": "^5.3.0",
    "vite": "^6.0.0",
    "vite-plugin-solid": "^2.8.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/chrome": "^0.0.268",
    "@types/webextension-polyfill": "^0.10.0",
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-solid": "^0.13.0",
    "prettier": "^3.2.0",
    "prettier-plugin-tailwindcss": "^0.5.0",
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "playwright": "^1.40.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 4. ESLint 配置 (`.eslintrc.cjs`)

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:solid/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'solid'],
  rules: {
    // TypeScript 严格规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    
    // Solid.js 规则
    'solid/jsx-no-undef': 'error',
    'solid/no-react-deps': 'error',
    'solid/reactivity': 'warn',
    
    // 通用规则
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  ignorePatterns: ['dist/', '.output/', 'node_modules/', '*.config.*'],
};
```

### 5. Prettier 配置 (`.prettierrc`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindFunctions": ["clsx", "cn"]
}
```

### 6. TailwindCSS 配置 (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx,html}',
    './.wxt/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 7. PostCSS 配置 (`postcss.config.js`)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 8. Husky 配置 (`.husky/pre-commit`)

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

---

## 🎨 代码规范

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `PromptCard.tsx` |
| 工具函数 | camelCase | `formatDate.ts` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_PROMPTS.ts` |
| 类型 | PascalCase + .type.ts | `prompt.type.ts` |
| 组合式函数 | use + PascalCase | `usePrompts.ts` |
| 接口 | I + PascalCase | `IPrompt` |
| 枚举 | PascalCase | `SyncBackend` |

### 文件组织

```typescript
// 导入顺序
import { createSignal } from 'solid-js';           // 1. 框架
import { useStore } from '@stores/prompt';         // 2. 绝对路径别名
import { formatDate } from '@shared/utils';        // 3. 共享模块
import { PromptCard } from './PromptCard';         // 4. 相对路径
import styles from './PromptList.module.css';      // 5. 样式
```

### 类型定义规范

```typescript
// types/prompt.ts

/** 提示词数据结构 */
export interface Prompt {
  /** 唯一标识符 */
  id: string;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 分类 */
  category: string;
  /** 标签列表 */
  tags: string[];
  /** 快捷键 */
  shortcut?: string;
  /** 变量列表 */
  variables: string[];
  /** 版本历史 */
  versions: PromptVersion[];
  /** 使用次数 */
  usageCount: number;
  /** 最后使用时间 */
  lastUsedAt: number | null;
  /** 是否收藏 */
  favorite: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt?: number;
}

/** 提示词版本 */
export interface PromptVersion {
  versionId: string;
  content: string;
  timestamp: number;
}

/** 提示词筛选条件 */
export type PromptFilter = 'all' | 'favorites' | 'recent' | 'mostUsed';
```

---

## 🧪 测试策略

### 单元测试 (Vitest)

```typescript
// tests/unit/stores/promptStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createPromptStore } from '@/stores/promptStore';

describe('promptStore', () => {
  let store: ReturnType<typeof createPromptStore>;
  
  beforeEach(() => {
    store = createPromptStore();
  });
  
  it('should add a prompt', () => {
    store.addPrompt({
      title: 'Test',
      content: 'Hello {{name}}',
    });
    expect(store.prompts).toHaveLength(1);
    expect(store.prompts[0].title).toBe('Test');
  });
  
  it('should extract variables from content', () => {
    store.addPrompt({
      title: 'Test',
      content: 'Hello {{name}}, you are {{age}} years old',
    });
    expect(store.prompts[0].variables).toEqual(['name', 'age']);
  });
});
```

### E2E 测试 (Playwright)

```typescript
// tests/e2e/prompt.spec.ts
import { test, expect } from '@playwright/test';

test('create and use a prompt', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  // 创建提示词
  await page.click('[data-testid="add-prompt-btn"]');
  await page.fill('[data-testid="title-input"]', 'Test Prompt');
  await page.fill('[data-testid="content-input"]', 'Hello {{name}}');
  await page.click('[data-testid="save-btn"]');
  
  // 验证提示词列表
  await expect(page.locator('[data-testid="prompt-card"]')).toHaveCount(1);
});
```

---

## 📚 相关文档

- [迁移计划](./MIGRATION_PLAN.md) - 详细迁移步骤
- [架构设计](./ARCHITECTURE.md) - 系统架构说明
- [开发指南](./CONTRIBUTING.md) - 开发规范指南

---

## 🔄 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2024-03-22 | 初始版本，确定技术栈规范 |

---

> **注意**: 本文档是活文档，技术栈决策如有变更，请及时更新本文档。
