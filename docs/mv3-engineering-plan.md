# Prompt Ark 工程化升级 + Firefox 支持方案

## 目标
1. 建立现代化前端工程体系（TypeScript + 构建工具）
2. 实现 Chrome/Firefox 双平台支持
3. 保持功能完全复刻，提升代码可维护性

---

## 技术栈选型

| 用途 | 技术 | 说明 |
|------|------|------|
| 构建工具 | **WXT** | 专为浏览器扩展设计的构建工具，自动处理 MV2/MV3 差异 |
| 语言 | **TypeScript** | 类型安全，更好的 IDE 支持 |
| 样式 | **TailwindCSS** | 原子化 CSS，快速开发 UI |
| 测试 | **Vitest** | 快速单元测试 |
| 代码规范 | **Biome** | 一站式 Lint + Format（比 ESLint+Prettier 更快） |
| 包管理 | **pnpm** | 节省磁盘空间，安装速度快 |

---

## 目录结构

```
prompt-ark/
├── src/
│   ├── entrypoints/           # 扩展入口点（WXT 约定）
│   │   ├── background.ts      # Service Worker / Background Script
│   │   ├── content.ts         # Content Script
│   │   ├── popup/             # Popup 页面
│   │   │   ├── index.html
│   │   │   ├── index.ts
│   │   │   └── style.css
│   │   ├── options/           # 设置页面
│   │   └── sidepanel/         # Side Panel (Chrome only)
│   │
│   ├── components/            # 共享 UI 组件
│   │   ├── PromptPicker.ts
│   │   ├── VariableForm.ts
│   │   └── QuickActions.ts
│   │
│   ├── composables/           # 可复用逻辑（类似 React Hooks）
│   │   ├── usePrompts.ts      # Prompt 数据管理
│   │   ├── useStorage.ts      # Storage 封装
│   │   ├── useI18n.ts         # 国际化
│   │   └── usePlatform.ts     # 平台检测
│   │
│   ├── utils/                 # 工具函数
│   │   ├── variables.ts       # 变量解析
│   │   ├── inject.ts          # DOM 注入
│   │   └── helpers.ts
│   │
│   ├── api/                   # 外部 API 调用
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   └── github.ts
│   │
│   ├── types/                 # TypeScript 类型定义
│   │   ├── prompt.ts
│   │   ├── provider.ts
│   │   └── message.ts
│   │
│   └── assets/                # 静态资源
│       ├── icons/
│       └── _locales/
│
├── public/                    # 直接复制到输出的文件
├── wxt.config.ts              # WXT 配置
├── tsconfig.json
├── package.json
└── biome.json
```

---

## 核心改动点

### 1. 入口文件迁移

| 原文件 | 新位置 | 说明 |
|--------|--------|------|
| `background.js` | `src/entrypoints/background.ts` | Service Worker |
| `content.js` | `src/entrypoints/content.ts` | Content Script |
| `popup.js/html/css` | `src/entrypoints/popup/` | Popup 页面 |
| `image-prompt.html/js` | `src/entrypoints/image-prompt/` | 图片提示词页面 |

### 2. Manifest 自动生成

**原方案**：手动维护 `manifest.json`

**新方案**：`wxt.config.ts` 自动生成

```typescript
// wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: '__MSG_appName__',
    default_locale: 'zh_CN',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
    host_permissions: ['https://*/*'],
  },
  // WXT 自动处理 Chrome/Firefox 差异
  browsers: ['chrome', 'firefox'],
});
```

### 3. 浏览器兼容性处理

WXT 自动处理大部分差异，需手动处理的部分：

| 功能 | Chrome (MV3) | Firefox (MV2) | 处理方案 |
|------|--------------|---------------|----------|
| Background | Service Worker | Background Page | WXT 自动转换 |
| Storage | chrome.storage | browser.storage | 使用 WXT 封装 `storage` |
| Scripting | chrome.scripting | 直接注入 | 条件判断或 WXT polyfill |
| Side Panel | ✅ 支持 | ❌ 不支持 | 运行时检测，Firefox 回退到 Popup |

### 4. 关键代码改造

#### Storage 封装（跨浏览器兼容）

```typescript
// src/composables/useStorage.ts
import { storage } from 'wxt/storage';

// WXT 自动处理 Chrome/Firefox API 差异
export const promptStorage = {
  async getAll(): Promise<Prompt[]> {
    return storage.getItem<Prompt[]>('local:prompts') || [];
  },
  async save(prompt: Prompt): Promise<void> {
    const prompts = await this.getAll();
    prompts.push(prompt);
    await storage.setItem('local:prompts', prompts);
  },
};
```

#### Content Script 平台适配器

```typescript
// src/content/platforms/chatgpt.ts
export const chatgptAdapter: PlatformAdapter = {
  name: 'chatgpt',
  urlPattern: /chatgpt\.com|chat\.openai\.com/,
  
  findInput(): HTMLElement | null {
    return document.querySelector('#prompt-textarea, div[contenteditable="true"].ProseMirror');
  },
  
  inject(text: string, element: HTMLElement): boolean {
    // 平台特定的注入逻辑
    if (element.isContentEditable) {
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }
};

// src/content/index.ts
import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const platform = detectPlatform();
    const adapter = getAdapter(platform);
    
    // 初始化 Prompt Ark UI
    initializePromptPicker(adapter);
    initializeQuickActions(adapter);
    initializeSelectionToolbar();
  },
});
```

#### Message Passing 类型安全

```typescript
// src/types/message.ts
export interface MessageMap {
  'GET_PROMPTS': { response: Prompt[] };
  'SAVE_PROMPT': { payload: Prompt; response: { success: boolean } };
  'INJECT_PROMPT': { payload: string; response: { success: boolean } };
  // ... 其他消息类型
}

// src/entrypoints/background.ts
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_PROMPTS':
        handleGetPrompts().then(sendResponse);
        return true;
      // ...
    }
  });
});
```

---

## 功能复刻对照表

| 功能模块 | 原文件 | 新实现 | 说明 |
|----------|--------|--------|------|
| **Prompt 管理** | `lib/storage.js` | `src/composables/usePrompts.ts` | 组合式函数封装 |
| **变量解析** | `lib/variables.js` | `src/utils/variables.ts` | 纯函数，可直接迁移 |
| **平台检测** | `content.js` 内联 | `src/composables/usePlatform.ts` | 提取为可复用逻辑 |
| **Prompt 选择器** | `content.js` 内联 | `src/components/PromptPicker.ts` | 组件化封装 |
| **快捷操作** | `content.js` 内联 | `src/components/QuickActions.ts` | 组件化封装 |
| **AI Provider** | `lib/ai/*.js` | `src/api/*.ts` | 统一 API 层 |
| **右键菜单** | `lib/context-menu.js` | `src/entrypoints/background.ts` | 合并到 background |
| **GitHub 同步** | `lib/github-client.js` | `src/api/github.ts` | 类改造为函数 |
| **国际化** | `i18n-manager.js` | `src/composables/useI18n.ts` | 使用浏览器 i18n API |

---

## 开发工作流

```bash
# 1. 安装依赖
pnpm install

# 2. 开发模式（支持 HMR）
pnpm dev          # Chrome 开发
pnpm dev:firefox  # Firefox 开发

# 3. 构建
pnpm build          # 生产构建 Chrome
pnpm build:firefox  # 生产构建 Firefox

# 4. 测试
pnpm test        # 单元测试
pnpm test:e2e    # E2E 测试
pnpm lint        # 代码检查

# 5. 打包发布
pnpm zip          # 生成 chrome.zip
pnpm zip:firefox  # 生成 firefox.zip
```

---

## Firefox 特定适配

### 1. Manifest 差异

```json
// Firefox MV2 自动生成的 manifest
{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"],  // 不是 service worker
    "persistent": false
  },
  "browser_action": {  // 不是 action
    "default_popup": "popup.html"
  }
}
```

### 2. API 差异处理

```typescript
// src/utils/browser.ts
export const isFirefox = typeof browser !== 'undefined' && 
  browser.runtime?.getBrowserInfo !== undefined;

// 特定功能的 polyfill
export async function executeScript(tabId: number, code: string) {
  if (isFirefox) {
    // Firefox 使用旧版 API
    return browser.tabs.executeScript(tabId, { code });
  } else {
    // Chrome MV3
    return chrome.scripting.executeScript({
      target: { tabId },
      func: (code) => eval(code),
      args: [code]
    });
  }
}
```

### 3. Side Panel 回退

```typescript
// src/composables/useSidePanel.ts
export function openPanel() {
  if (chrome.sidePanel) {
    // Chrome Side Panel
    chrome.sidePanel.open();
  } else {
    // Firefox 打开 Popup
    browser.browserAction.openPopup();
  }
}
```

---

## 迁移步骤

### Phase 1: 项目初始化
1. 初始化 WXT 项目 `pnpm create wxt@latest`
2. 安装依赖（Tailwind, Biome, Vitest）
3. 配置 WXT 双浏览器支持
4. 迁移静态资源（icons, _locales）

### Phase 2: 核心模块迁移
1. 迁移 `lib/` 工具函数到 `src/utils/`
2. 迁移 Storage 层到 `src/composables/useStorage.ts`
3. 实现类型定义 `src/types/`
4. 迁移 AI Provider 到 `src/api/`

### Phase 3: 入口点迁移
1. 迁移 Background Script
2. 迁移 Content Script + 平台适配器
3. 迁移 Popup 页面
4. 迁移 Options 页面

### Phase 4: 测试验证
1. Chrome 功能完整测试
2. Firefox 功能完整测试
3. 编写核心单元测试
4. 修复兼容性问题

---

## 预期收益

1. **开发效率**：TypeScript + HMR，开发体验大幅提升
2. **代码质量**：类型检查 + 代码规范，减少运行时错误
3. **跨浏览器**：一套代码同时支持 Chrome/Firefox
4. **维护成本**：模块化架构，功能边界清晰
5. **构建优化**：自动代码分割、Tree Shaking、资源压缩

---

## 参考资源

- [WXT 文档](https://wxt.dev/)
- [WebExtension API 兼容性](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)
- [Chrome/Firefox 扩展差异](https://extensionworkshop.com/documentation/develop/porting-a-google-chrome-extension/)
