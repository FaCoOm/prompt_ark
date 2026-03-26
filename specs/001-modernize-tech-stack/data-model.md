# Data Model: Prompt Ark v2

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-03-26

## Overview

本文档定义 Prompt Ark v2 的核心数据模型和实体关系。基于 v1 项目的用户数据结构，设计 TypeScript 类型定义，确保数据向后兼容。

## Entities

### 1. Prompt (提示词)

核心实体，表示用户保存的提示词。

```typescript
interface Prompt {
  /** 唯一标识符 */
  id: string;                    // UUID v4
  
  /** 提示词标题 */
  title: string;
  
  /** 提示词内容 */
  content: string;
  
  /** 分类名称 */
  category: string;
  
  /** 标签数组 */
  tags: string[];
  
  /** 快捷命令 (如 "/email") */
  shortcut: string;
  
  /** 创建时间 */
  createdAt: number;             // Unix timestamp (ms)
  
  /** 更新时间 */
  updatedAt: number;             // Unix timestamp (ms)
  
  /** 使用次数统计 */
  useCount: number;
  
  /** 是否收藏 */
  isFavorite: boolean;
  
  /** 最后使用时间 */
  lastUsedAt?: number;           // Unix timestamp (ms)
  
  /** 语言代码 */
  language: string;              // 'zh-CN', 'en', etc.
  
  /** 来源信息 */
  source?: {
    type: 'manual' | 'smart-convert' | 'import' | 'shared';
    url?: string;
    title?: string;
  };
  
  /** 关联的上下文变量 */
  contextVars?: string[];        // ['@page_title', '@selection', ...]
  
  /** 版本历史 */
  versions?: PromptVersion[];
}

interface PromptVersion {
  id: string;
  content: string;
  createdAt: number;
  note?: string;
}
```

**Validation Rules**:
- `id`: 必须是非空字符串，UUID v4 格式
- `title`: 1-200 字符
- `content`: 非空，最大 10000 字符
- `category`: 1-50 字符
- `tags`: 最多 10 个标签，每个标签 1-30 字符
- `shortcut`: 可选，格式为 /^[a-z0-9-]+$/，1-50 字符

### 2. Settings (设置)

用户配置和偏好设置。

```typescript
interface Settings {
  /** 界面语言 */
  language: 'zh-CN' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
  
  /** 主题模式 */
  theme: 'auto' | 'light' | 'dark';
  
  /** 同步引擎配置 */
  syncEngine: 'none' | 'chrome' | 'gist' | 'webdav' | 'obsidian' | 'obsidian-local';
  
  /** Chrome Sync 配置 */
  chromeSync?: {
    enabled: boolean;
    lastSyncAt?: number;
  };
  
  /** GitHub Gist 配置 */
  gistSync?: {
    enabled: boolean;
    token?: string;
    gistId?: string;
    lastSyncAt?: number;
  };
  
  /** WebDAV 配置 */
  webdavSync?: {
    enabled: boolean;
    url?: string;
    username?: string;
    password?: string;            // 加密存储
    folder?: string;
    lastSyncAt?: number;
  };
  
  /** Obsidian Vault 配置 */
  obsidianSync?: {
    enabled: boolean;
    webdavUrl?: string;
    username?: string;
    password?: string;
    folder?: string;
    lastSyncAt?: number;
  };
  
  /** Obsidian Local 配置 */
  obsidianLocal?: {
    enabled: boolean;
    port?: number;
    apiKey?: string;
    lastSyncAt?: number;
  };
  
  /** 默认 AI 提供商 ID */
  defaultProviderId?: string;
  
  /** 图片提示词功能开关 */
  imagePromptEnabled: boolean;
  
  /** 默认输出规则配置 */
  defaultOutputRules?: OutputRules;
  
  /** 用户偏好 */
  preferences: {
    /** 列表视图模式 */
    listView: 'grid' | 'list';
    /** 每页显示数量 */
    pageSize: number;
    /** 默认排序方式 */
    sortBy: 'created' | 'updated' | 'used' | 'title';
    /** 默认排序方向 */
    sortOrder: 'asc' | 'desc';
  };
}

interface OutputRules {
  format: 'auto' | 'markdown' | 'json' | 'table' | 'text' | 'code';
  maxLength?: number;
  tone: 'default' | 'professional' | 'concise' | 'creative';
  exclusions: string[];
}
```

### 3. AI Provider (AI 提供商)

配置的外部 AI 服务提供商。

```typescript
interface AIProvider {
  /** 唯一标识符 */
  id: string;
  
  /** 显示名称 */
  name: string;
  
  /** 提供商类型 */
  type: 'openai-compatible' | 'gemini-web' | 'gemini-api' | 'azure-openai';
  
  /** API 基础 URL */
  baseUrl?: string;
  
  /** API 密钥 */
  apiKey?: string;                // 加密存储
  
  /** 使用的模型 */
  model: string;
  
  /** 模型能力 */
  capabilities: {
    chat: boolean;
    vision: boolean;
    json: boolean;
  };
  
  /** 请求参数默认值 */
  defaults?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  
  /** 是否启用 */
  enabled: boolean;
  
  /** 创建时间 */
  createdAt: number;
}

/** Gemini Web 特殊配置 */
interface GeminiWebProvider extends AIProvider {
  type: 'gemini-web';
  // Gemini Web 使用浏览器 Cookie，无需 API Key
}
```

### 4. Category (分类)

提示词分类。

```typescript
interface Category {
  /** 分类名称 (唯一标识) */
  name: string;
  
  /** 显示名称 */
  displayName: string;
  
  /** 排序权重 */
  order: number;
  
  /** 图标 */
  icon?: string;
  
  /** 颜色 */
  color?: string;
  
  /** 是否是系统预设 */
  isSystem: boolean;
  
  /** 创建时间 */
  createdAt: number;
}
```

### 5. Prompt History (使用历史)

提示词使用记录。

```typescript
interface PromptHistory {
  /** 历史记录 ID */
  id: string;
  
  /** 关联的 Prompt ID */
  promptId: string;
  
  /** 使用的提示词内容（当时的版本） */
  content: string;
  
  /** 填入的变量值 */
  variables?: Record<string, string>;
  
  /** 使用的平台 */
  platform?: string;
  
  /** 使用时间 */
  usedAt: number;
  
  /** 是否成功填入 */
  success: boolean;
  
  /** 错误信息 */
  error?: string;
}
```

### 6. Context Snapshot (上下文快照)

页面上下文抓取的数据。

```typescript
interface ContextSnapshot {
  /** 快照 ID */
  id: string;
  
  /** 页面标题 */
  pageTitle: string;
  
  /** 页面 URL */
  pageUrl: string;
  
  /** 选中的文本 */
  selection?: string;
  
  /** 页面正文内容 */
  pageText?: string;
  
  /** 抓取时间 */
  capturedAt: number;
  
  /** 过期时间 (默认 10 分钟) */
  expiresAt: number;
}
```

### 7. Video Analysis (视频分析)

YouTube/视频分析结果。

```typescript
interface VideoAnalysis {
  /** 分析 ID */
  id: string;
  
  /** 视频 URL */
  videoUrl: string;
  
  /** 视频标题 */
  title: string;
  
  /** 分析类型 */
  type: 'style-transfer' | 'complete-analysis' | 'inspiration';
  
  /** 风格词典 */
  styleVocabulary?: {
    terms: Array<{
      term: string;
      definition: string;
      examples: string[];
    }>;
  };
  
  /** 完整分析结果 */
  analysis?: {
    summary: string;
    style: string;
    storyboard: Array<{
      timestamp: string;
      description: string;
      shot: string;
    }>;
  };
  
  /** 创建的 Prompt */
  generatedPrompt?: string;
  
  /** 分析时间 */
  analyzedAt: number;
}
```

## Data Relationships

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Settings     │────▶│  AIProvider[]   │     │    Category[]   │
│   (单例)         │     │   (0..n)        │     │   (0..n)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         │ 使用/配置
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Prompt      │────▶│ PromptVersion[] │     │PromptHistory[]  │
│   (0..n)        │     │   (0..n)        │     │   (0..n)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         │ 引用
         ▼
┌─────────────────┐     ┌─────────────────┐
│ContextSnapshot  │     │ VideoAnalysis   │
│   (0..n)        │     │   (0..n)        │
└─────────────────┘     └─────────────────┘
```

## Storage Schema

### Chrome Storage 键值设计

```typescript
// Chrome Storage 中的数据键
interface StorageSchema {
  // 主数据
  'prompts': Prompt[];              // 所有提示词
  'settings': Settings;             // 用户设置
  'providers': AIProvider[];        // AI 提供商配置
  'categories': Category[];         // 自定义分类
  
  // 辅助数据
  'history': PromptHistory[];       // 使用历史（最近 100 条）
  'snapshots': ContextSnapshot[];   // 上下文快照（带过期清理）
  'video-analyses': VideoAnalysis[]; // 视频分析结果
  
  // 缓存数据
  'cache:translations': Record<string, string>; // 翻译缓存
  'cache:ai-responses': Record<string, unknown>; // AI 响应缓存
}
```

### Storage Area 分配

| 数据类型 | Storage Area | 同步策略 |
|----------|--------------|----------|
| Prompts | `sync` | 跨设备同步 |
| Settings | `sync` | 跨设备同步 |
| Providers | `sync` | 跨设备同步 (API Key 本地加密) |
| Categories | `sync` | 跨设备同步 |
| History | `local` | 仅本地，定期清理 |
| Snapshots | `local` | 仅本地，TTL 10分钟 |
| Video Analyses | `local` | 仅本地 |
| Cache | `local` | 仅本地，LRU 清理 |

## Backward Compatibility

### v1 → v2 数据迁移

v1 数据结构与 v2 的映射关系：

```typescript
// v1 Prompt 结构
interface V1Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  shortcut: string;
  createdAt: number;
  updatedAt: number;
  useCount: number;
  isFavorite: boolean;
}

// 迁移函数
function migrateV1ToV2(v1: V1Prompt): Prompt {
  return {
    ...v1,
    // v1 的 tags 是逗号分隔的字符串
    tags: v1.tags ? v1.tags.split(',').map(t => t.trim()) : [],
    // 新增字段的默认值
    language: detectLanguage(v1.content),
    versions: [],
    source: { type: 'manual' },
  };
}
```

### Migration Strategy

1. **首次启动检测**: 检查是否存在 v1 数据 (`prompts` key)
2. **自动迁移**: 在 background script 中自动执行迁移
3. **数据备份**: 迁移前备份原始数据到 `prompts:v1-backup`
4. **降级支持**: v2 不兼容时，保留 v1 数据不动

## TypeScript Type Exports

```typescript
// src/types/index.ts
export type {
  Prompt,
  PromptVersion,
  Settings,
  AIProvider,
  GeminiWebProvider,
  Category,
  PromptHistory,
  ContextSnapshot,
  VideoAnalysis,
  OutputRules,
  StorageSchema,
} from './models';

export type {
  CreatePromptDTO,
  UpdatePromptDTO,
  QueryPromptsDTO,
} from './dtos';

export type {
  PromptFilter,
  PromptSort,
  PaginatedResult,
} from './queries';
```
