# 添加 Web Provider 完整指南

基于 Kimi Web 的实现，以下是添加新 Web Provider（如 DeepSeek Web、Doubao Web 等）时需要修改的所有位置。

---

## 1. 核心 Provider 实现（必需）

**文件**: `lib/{name}-web.js` （新建）

实现以下导出函数：

```javascript
export async function call{name}Web(prompt, model) // 调用 API
export async function is{name}WebAvailable()        // 检查可用性
export async function fetch{name}WebCredentials()   // 获取凭证
```

**关键实现要点**：

- Cookie/Token 获取（从 `chrome.cookies` 或 Content Script 的 `localStorage`）
- 协议适配（REST/Connect-RPC/自定义）
- 响应解析
- 错误处理（`NOT_LOGGED_IN`）

**建议**：复制 `lib/kimi-web.js` 作为模板，根据目标 provider 的协议进行修改。

---

## 2. Background Script 调度（必需）

**文件**: `background.js`

### 修改位置 1: 导入

```javascript
import { call{name}Web, is{name}WebAvailable } from './lib/{name}-web.js';
```

### 修改位置 2: `callProvider` 函数

```javascript
} else if (provider.type === '{name}-web') {
    return await call{name}Web(prompt, provider.model);
}
```

---

## 3. Content Script Token 获取（如需要）

**文件**: `content.js`

在 `handleMessage` 中添加（如果从 localStorage 获取 token）：

```javascript
case 'GET_{NAME}_TOKEN': {
    const accessToken = localStorage.getItem('access_token');
    sendResponse({ success: true, accessToken });
    break;
}
```

---

## 4. AI 功能模块（全部需要添加）

每个 AI 功能文件都需要添加对新 provider 的支持：

| 文件 | 功能 | 修改内容 |
|------|------|---------|
| `lib/ai/provider.js` | 元数据提取 | `callCloudAPI` 函数中添加 `{name}-web` 分支 |
| `lib/ai/translate.js` | 翻译 | `translatePromptWithAI` 函数中添加分支 |
| `lib/ai/smart-convert.js` | 智能转换 | `smartConvertWithAI` 函数中添加分支 |
| `lib/ai/optimize.js` | Prompt 优化 | `optimizePromptWithAI` 函数中添加分支 |
| `lib/ai/share.js` | 社交分享 | `generateShareText` 和 `generateArticleShareText` 中添加分支 |
| `lib/ai/video-prompt.js` | 视频 Prompt | `generateVideoPromptWithAI` 中添加分支 |
| `lib/ai/p2s-forge.js` | Skill 生成 | `generateSkillWithAI` 中添加分支 |
| `lib/ai/image-prompt.js` | 图片 Prompt | 如支持则添加（通常 Web provider 不支持） |

**代码模板**：

```javascript
if (provider.type === '{name}-web') {
    const webPrompt = `${systemPrompt}

Input:
'''${content}'''

Return JSON only: {...}`;
    let result = await call{name}Web(webPrompt);
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}
```

---

## 5. UI 层（必需）

### 文件: `popup.html`

在 `providerTypeSelect` 下拉框中添加选项：

```html
<option value="{name}-web" data-i18n="providerType{Name}Web">{Name} Web (免 Key)</option>
```

### 文件: `popup.js`

在 `typeLabels` 映射中添加：

```javascript
const typeLabels = { 
    'gemini-web': 'Gemini', 
    'kimi-web': 'Kimi',
    '{name}-web': '{Name}',
    // ...
};
```

---

## 6. 国际化（必需）

**文件**: `locales.js`

在中文和英文翻译中添加：

```javascript
// zh_CN
providerType{Name}Web: "{Name} Web (免 Key)",

// en  
providerType{Name}Web: "{Name} Web (No Key)",
```

---

## 7. Manifest 权限（必需）

**文件**: `manifest.json`

在 `host_permissions` 中添加目标域名：

```json
"host_permissions": [
    "https://{domain}.com/*",
    "https://www.{domain}.com/*",
    // ...
]
```

---

## 8. Provider 自动检测（可选）

**文件**: `lib/ai/provider.js` 的 `getActiveProvider` 函数

添加自动检测逻辑：

```javascript
try {
    const {name}Available = await is{name}WebAvailable();
    if ({name}Available) {
        return { 
            id: '{name}-web-auto', 
            name: '{Name} Web (auto)', 
            type: '{name}-web', 
            enabled: true 
        };
    }
} catch { /* {Name} Web not available */ }
```

---

## 快速检查清单

添加新 Provider 时按以下顺序检查和修改：

- [ ] 1. 创建 `lib/{name}-web.js`（核心实现）
- [ ] 2. 修改 `background.js`（导入 + callProvider）
- [ ] 3. 修改 `content.js`（如需要从 localStorage 获取 token）
- [ ] 4. 修改 `lib/ai/provider.js`（元数据提取）
- [ ] 5. 修改 `lib/ai/translate.js`（翻译）
- [ ] 6. 修改 `lib/ai/smart-convert.js`（智能转换）
- [ ] 7. 修改 `lib/ai/optimize.js`（优化）
- [ ] 8. 修改 `lib/ai/share.js`（社交分享）
- [ ] 9. 修改 `lib/ai/video-prompt.js`（视频）
- [ ] 10. 修改 `lib/ai/p2s-forge.js`（Skill 生成）
- [ ] 11. 修改 `popup.html`（下拉选项）
- [ ] 12. 修改 `popup.js`（类型标签）
- [ ] 13. 修改 `locales.js`（i18n）
- [ ] 14. 修改 `manifest.json`（域名权限）

---

## 常见 Web Provider 参考

| Provider | 认证方式 | API 类型 | 特殊说明 |
|----------|---------|---------|---------|
| **Gemini Web** | Cookie (`SNlM0e`) | Protobuf/REST | 需从 HTML 提取 token |
| **Kimi Web** | localStorage (`access_token`) | Connect-RPC | 需 Content Script 获取 token |
| **DeepSeek Web** | Cookie/LocalStorage | REST | 待调研 |
| **Doubao Web** | Cookie | REST | 字节跳动系 |
| **Claude Web** | Cookie (`sessionKey`) | 内部 API | 有封号风险 |
| **ChatGPT Web** | Cookie | 内部 API | Cloudflare 防护强 |

---

## 调试技巧

1. **查看 Background Script 日志**：
   - 打开 `chrome://extensions`
   - 点击 **"Service Worker"** 链接
   - 查看控制台输出

2. **查看 Content Script 日志**：
   - 在目标页面按 F12
   - 切换到 Console 标签
   - 筛选 `[Prompt Ark]` 或 `[{Name} Web]`

3. **测试 Token 获取**：
   - 在 Content Script 控制台执行：
     ```javascript
     localStorage.getItem('access_token')
     ```

4. **验证 Provider 可用性**：
   - 在 Background Script 控制台执行：
     ```javascript
     (async () => {
       const { is{name}WebAvailable } = await import('./lib/{name}-web.js');
       console.log('Available:', await is{name}WebAvailable());
     })();
     ```

---

*文档生成日期: 2026-04-06*
*基于: Kimi Web Provider 实现*
