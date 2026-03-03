# Prompt 外部化与加载器模式

> 日期：2026-03-03 | 涵盖：LLM Prompt 抽取到 Markdown 文件 + 预加载器 + Service Worker 资源访问

---

## 1. 把 Prompt 从代码中剥离出来

### 背景

`background.js` 里有大段大段的 LLM 指令文本（system prompt），用 JS 模板字符串写死在代码里。比如一个 `OPTIMIZE_SYSTEM_PROMPT` 常量就占了 46 行。这造成两个问题：

- **改 prompt 容易误伤逻辑**：模板字符串里改一个反引号就语法错误
- **prompt 和代码耦合**：想让非程序员（比如产品经理）调整 prompt 措辞？他得打开一个 2000 行的 JS 文件

### 方案

把每个 prompt 抽成独立 `.md` 文件，运行时动态加载：

```
prompts/
├── metadata-extract-zh.md    ← 中文元数据提取指令
├── metadata-extract-en.md    ← 英文元数据提取指令
├── optimize.md               ← Prompt 优化器（3 变体输出）
├── smart-convert.md          ← 网页选中文字 → 转为 prompt
├── share-twitter.md          ← Twitter 分享文案生成
├── share-reddit.md
├── share-zhihu.md
├── share-wechat.md
└── share-xiaohongshu.md
```

代码端变成一行：
```javascript
const systemPrompt = await loadPrompt('optimize');
```

### 教训

**配置即代码 (Config as Code) 的反面也成立：有些 "代码" 本质上是配置**。LLM prompt 就是典型——它更像一段配置文本而非程序逻辑。把它放在 JS 模板字符串里是错误的抽象层级。判断标准：**如果一段文本的修改频率和修改者跟代码不同，它就应该独立出去。**

---

## 2. 缓存 + 预加载：两级性能优化

### 问题

把 prompt 从硬编码改成文件加载后，每次 AI 调用前都多了一次 `fetch`。虽然是本地文件（扩展包内），但仍然是异步 I/O，在关键路径上增加延迟。

### 优雅解法

```javascript
// prompt-loader.js — 整个模块只有一个 Map 和两个函数

const cache = new Map();

export async function loadPrompt(name) {
  if (cache.has(name)) return cache.get(name);          // ← 命中缓存：0ms
  const url = chrome.runtime.getURL(`prompts/${name}.md`);
  const text = (await (await fetch(url)).text()).trim();
  cache.set(name, text);                                 // ← 写入缓存
  return text;
}
```

这是经典的**读穿型缓存 (Read-Through Cache)** 模式——调用方不需要知道数据来自缓存还是文件，`loadPrompt` 透明处理。

但单靠缓存还不够：**第一次调用仍然有延迟**。所以加了第二层——预加载：

```javascript
export async function preloadAllPrompts() {
  const results = await Promise.allSettled(
    ALL_PROMPTS.map(name => loadPrompt(name))
  );
  // ... 错误日志
}
```

在 `background.js` 启动时立即调用：

```javascript
// Service Worker 启动时一次性并行加载所有 prompt 到内存
preloadAllPrompts();
```

注意这里**不用 `await`**！预加载是 fire-and-forget（发射后不管），不阻塞 service worker 的后续初始化。等用户真正触发 AI 功能时（通常是几秒后），prompt 早已在缓存里了。

### 教训

**性能优化有两个层次：减少重复开销（缓存）和消除首次开销（预加载）**。很多人做了第一层就停了，但首次调用的体验同样重要。

---

## 3. `Promise.allSettled` vs `Promise.all` — 容错的选择

### 问题

预加载 9 个文件，如果其中 1 个文件缺失或损坏：
- `Promise.all` → 整体 reject，其他 8 个文件的加载结果丢失
- `Promise.allSettled` → 返回全部 9 个结果，每个单独标记成功或失败

### 优雅解法

```javascript
const results = await Promise.allSettled(ALL_PROMPTS.map(name => loadPrompt(name)));
const failed = results.filter(r => r.status === 'rejected');
if (failed.length > 0) {
  console.warn(`[PromptLoader] ${failed.length}/${ALL_PROMPTS.length} prompts failed to preload:`,
    failed.map(r => r.reason?.message));
}
```

### 教训

**选 `all` 还是 `allSettled`，取决于任务之间是否有依赖**：
| 场景 | 选择 | 原因 |
|---|---|---|
| 并行请求多个独立 API → 全部结果拼装成页面 | `Promise.all` | 缺一不可 |
| 预加载多个独立资源 → 各自独立使用 | `Promise.allSettled` | 部分失败不影响其他 |
| 批量写入数据库 → 需要事务语义 | `Promise.all` + rollback | 要么全成功要么全回滚 |

---

## 4. `web_accessible_resources` ≠ 扩展内部访问

### 错误

把 prompt 文件通过 `manifest.json` 的 `web_accessible_resources` 暴露了：

```json
"web_accessible_resources": [{
  "resources": ["prompts/*.md"],
  "matches": ["<all_urls>"]
}]
```

这意味着**任何网页**都可以通过 `chrome-extension://<id>/prompts/optimize.md` 读取你的 prompt 文件。

### 真相

Chrome Extension MV3 中，**Service Worker 和扩展页面（popup/options）天然可以访问扩展包内的所有文件**，无需任何额外配置。`chrome.runtime.getURL()` + `fetch` 就行。

`web_accessible_resources` 的唯一用途是让**外部网页**或 **content script** 能访问扩展资源。

### 教训

**知道一个 API "能用" 不等于知道它 "该用"**。`web_accessible_resources` 能让 fetch 正常工作，但它同时打开了一个你不需要的安全口子。Chrome 的权限模型是 **deny by default, allow explicitly**——只在确实需要外部访问时才添加。

---

## 5. 动态 Prompt 名拼接 — 数据驱动替代硬编码分支

### 问题

原来的分享功能用一个 JS 对象存 5 个平台的 prompt：

```javascript
// 旧代码 — 5 个 prompt 硬编码在一个对象里
const SHARE_PROMPTS = {
  twitter: `You generate a single tweet...`,
  reddit: `You write a Reddit self-post...`,
  zhihu: `你是一位活跃在知乎的...`,
  // ...
};
const systemPrompt = SHARE_PROMPTS[platform];
```

### 优雅解法

```javascript
// 新代码 — 文件名即 key，零硬编码
const SHARE_PLATFORM_NAMES = ['twitter', 'reddit', 'zhihu', 'wechat', 'xiaohongshu'];

async function generateShareText(promptContent, title, url, platform) {
  if (!SHARE_PLATFORM_NAMES.includes(platform)) return null;
  const systemPrompt = await loadPrompt(`share-${platform}`);
  // ...
}
```

文件名就是路由 key：`share-${platform}` → `prompts/share-twitter.md`。添加新平台只需要：
1. 创建 `prompts/share-linkedin.md`
2. 在 `SHARE_PLATFORM_NAMES` 数组加一个字符串

**零功能代码修改。**

### 教训

**文件系统本身就是一种注册表**。当多个同类配置项需要管理时，与其用一个大对象，不如用命名约定 + 目录结构。这样每个配置项独立存在、独立版本控制、独立编辑，而代码端只需要知道命名规则。
