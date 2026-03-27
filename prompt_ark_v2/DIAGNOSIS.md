# Prompt Ark v2 功能问题诊断报告

## 发现的问题

### 1. 设置保存不工作 ❌

**问题位置**: `entrypoints/sidepanel/pages/Settings.tsx:30-32`

**问题描述**:
```typescript
const updateSettings = (updates: Partial<Settings>) => {
  setSettings((prev) => prev ? { ...prev, ...updates } : null);
};
```

这个函数**只更新本地状态**，没有调用 `settingsStore.updateSettings()` 来保存到 storage。用户点击设置项时，状态变了但没有保存。

**修复方案**:
让 `updateSettings` 直接调用 store 的保存方法，或者添加自动保存逻辑。

---

### 2. 快捷键/上下文抓取不工作 ❌

**问题位置**: 
- `entrypoints/background/commands/index.ts:53` - 发送 `{ type: 'GRAB_CONTEXT' }`
- `entrypoints/content.ts:20-27` - content script 只监听 `INSERT_PROMPT_CONTENT` 和 `OPEN_PICKER`

**问题描述**:
Commands 发送 `GRAB_CONTEXT` 消息到 content script，但 content script 中没有监听这个类型的消息。

**修复方案**:
在 content script 中添加对 `GRAB_CONTEXT` 消息的监听。

---

### 3. DOM 注入/快捷插入 ⚠️

**潜在问题**:
- 平台适配器的选择器可能需要更新（ChatGPT 等网站经常变更 DOM 结构）
- 需要检查按钮是否正确注入到页面

---

## 修复清单

### 修复1: Settings.tsx - 自动保存设置
**文件**: `entrypoints/sidepanel/pages/Settings.tsx`

修改 `updateSettings` 函数以自动保存：
```typescript
const updateSettings = async (updates: Partial<Settings>) => {
  const newSettings = { ...settings()!, ...updates };
  setSettings(newSettings);
  await settingsStore.updateSettings(updates);
};
```

### 修复2: content.ts - 添加 GRAB_CONTEXT 监听
**文件**: `entrypoints/content.ts`

在消息监听器中添加 `GRAB_CONTEXT` 处理：
```typescript
browser.runtime.onMessage.addListener((message: { type: string; payload?: unknown }) => {
  if (message.type === 'INSERT_PROMPT_CONTENT') {
    const payload = message.payload as { content: string; variables?: Record<string, string> };
    adapter.insertPrompt(payload.content, payload.variables);
  } else if (message.type === 'OPEN_PICKER') {
    window.postMessage({ type: 'PROMPT_ARK_OPEN' }, '*');
  } else if (message.type === 'GRAB_CONTEXT') {
    // 添加上下文抓取处理
    const selection = window.getSelection()?.toString() ?? '';
    browser.runtime.sendMessage({
      type: 'GRAB_CONTEXT',
      payload: {
        pageTitle: document.title,
        pageUrl: window.location.href,
        selection,
        pageText: document.body.innerText.slice(0, 5000),
      },
    });
  }
});
```

### 修复3: 检查消息类型匹配
**文件**: `entrypoints/background/messaging/index.ts`

确保消息类型匹配：
- `INSERT_PROMPT` (background handler) → `INSERT_PROMPT_CONTENT` (content script listener) ✅ 已匹配
- `GRAB_CONTEXT` (commands) → 需要添加 content script 监听

### 修复4: 检查 wxt/storage 配置
**文件**: `src/shared/storage.ts`

当前使用 `wxt/utils/storage`，它应该能自动工作，但需要验证：
- `sync:prompts` - 存储提示词
- `sync:settings` - 存储设置

确保 WXT 的 storage 模块已正确配置。

---

## 调试建议

1. **打开浏览器开发者工具** → Console 查看是否有错误
2. **检查 content script 是否注入**:
   - 打开 ChatGPT/Claude 等网站
   - 查看 Console 是否有 "Prompt Ark content script loaded" 日志
3. **检查消息传递**:
   - 在 background script 和 content script 中添加 console.log
4. **检查 storage**:
   - 打开扩展的 Storage 面板查看数据是否正确存储

---

## 优先级

1. 🔴 **高**: 修复设置保存 (Settings.tsx)
2. 🔴 **高**: 添加快捷键上下文抓取 (content.ts)
3. 🟡 **中**: 验证平台适配器选择器
4. 🟢 **低**: 添加更多调试日志
