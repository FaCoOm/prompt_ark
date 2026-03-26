# Prompt Ark 数据结构规范

**用途**: 技术栈迁移时的数据兼容性参考
**来源**: lib/storage.js 分析
**日期**: 2026-03-26

## 核心数据模型

### Prompt 对象

```typescript
interface Prompt {
  // === 同步字段（跨设备） ===
  id: string;                    // UUID
  title: string;                 // 标题
  content: string;               // Markdown 内容
  category: string;              // 分类
  tags: string[];                // 标签数组
  shortcut: string;              // 斜杠命令快捷键
  variables: string[];           // 变量列表（从 content 提取）
  favorite: boolean;             // 是否收藏
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳

  // === 本地字段（不同步） ===
  versions: PromptVersion[];     // 历史版本
  usageCount: number;            // 使用次数
  lastUsedAt: number | null;     // 最后使用时间
}
```

### PromptVersion 对象

```typescript
interface PromptVersion {
  content: string;               // 版本内容
  timestamp: number;             // 保存时间戳
}
```

## Chrome Storage 架构

### 双层存储设计

```
chrome.storage.sync (100KB 限制)
├── prompt_{uuid}        // 精简 prompt（仅 SYNC_FIELDS）
├── prompt_{uuid}_meta   // 分块元数据（如果 >8KB）
└── prompt_{uuid}_0..N   // 内容分块（如果需要）

chrome.storage.local (无限制)
├── prompts              // 完整 prompt 数组
├── providers            // AI 提供商配置
├── sync_backend         // 同步后端类型
├── gist_id              // GitHub Gist ID
├── githubToken          // GitHub Token
├── webdavUrl/User/Password
├── obsidianWebdavUrl/User/Password
├── obsidianFolder
├── obsidianLocalPort/ApiKey
└── syncStatus           // 同步状态
```

### 存储容量限制

- **chrome.storage.sync**: 100KB 总量，8KB/键，512 键上限
- **单个 prompt 估算**: 300-500 字节（精简版）
- **分块策略**: 超过 6000 字节自动分块
- **压缩**: 使用 LZ-String 压缩（前缀 `lz::`）

## 同步配置

### SyncManager 配置

```typescript
interface SyncConfig {
  backend: 'none' | 'chrome' | 'gist' | 'webdav' | 'obsidian' | 'obsidian-local';

  // GitHub Gist
  gistId?: string;
  token?: string;

  // WebDAV
  webdavUrl?: string;
  webdavUser?: string;
  webdavPassword?: string;

  // Obsidian (WebDAV)
  obsidianWebdavUrl?: string;
  obsidianWebdavUser?: string;
  obsidianWebdavPassword?: string;
  obsidianFolder?: string;        // 默认 'prompts'

  // Obsidian (Local API)
  obsidianLocalPort?: number;     // 默认 27123
  obsidianLocalApiKey?: string;
}
```

### SyncStatus 对象

```typescript
interface SyncStatus {
  state: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime?: number;
  backend: string;
}
```

## AI 提供商配置

### Provider 对象

```typescript
interface Provider {
  id: string;                    // UUID
  name: string;                  // 显示名称
  type: 'gemini-web' | 'gemini-api' | 'openai-compatible';
  apiKey?: string;               // API 密钥（本地存储）
  baseUrl?: string;              // API 基础 URL
  model?: string;                // 模型名称
  enabled: boolean;              // 是否启用
}
```

## 变量系统

### 变量类型

```typescript
type VariableType =
  | { type: 'text'; name: string }                    // {{topic}}
  | { type: 'enum'; name: string; options: string[] } // {{lang:EN|ZH|JP}}
  | { type: 'default'; name: string; value: string }  // {{style:formal}}
  | { type: 'context'; name: string };                // {{@page_title}}
```

### 上下文变量

- `{{@page_title}}` - 页面标题
- `{{@page_url}}` - 页面 URL
- `{{@selection}}` - 选中文本
- `{{@date}}` - 当前日期
- `{{@page_text}}` - 页面全文

### 上下文抓取数据

```typescript
interface CapturedContext {
  pageTitle: string;
  pageUrl: string;
  selectedText: string;
  timestamp: number;             // TTL: 10 分钟
}
```

## 消息传递协议

### Background ↔ Content/Popup 消息类型

```typescript
type MessageType =
  | 'GET_PROMPTS'
  | 'SAVE_PROMPT'
  | 'DELETE_PROMPT'
  | 'CALL_AI_API'
  | 'EXTRACT_TITLE_CATEGORY'
  | 'GET_PROVIDERS'
  | 'SET_PROVIDERS'
  | 'OPTIMIZE_PROMPT'
  | 'TRANSLATE_PROMPT'
  | 'SYNC_STATUS_CHANGED'
  | 'GIST_AUTO_CREATED';
```

## 数据迁移注意事项

### 向后兼容性

1. **必须保留的字段**: 所有 SYNC_FIELDS
2. **可选字段**: versions, usageCount, lastUsedAt
3. **新增字段**: 使用默认值填充
4. **数据验证**: 检查必填字段存在性

### 迁移检查清单

- [ ] 读取旧版 chrome.storage.local.prompts
- [ ] 验证每个 prompt 包含所有 SYNC_FIELDS
- [ ] 保留 versions 历史（如果存在）
- [ ] 保留 usageCount 和 lastUsedAt
- [ ] 测试大数据量（1000+ prompts）
- [ ] 测试分块数据读取
- [ ] 测试压缩数据解压

