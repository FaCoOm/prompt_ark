# Data Schema: Chrome Storage

**Version**: v2  
**Date**: 2026-03-26

## Storage Areas

### Chrome Storage Sync (Cross-device)
- `prompts` - All prompts
- `settings` - User settings
- `providers` - AI provider configurations
- `categories` - Custom categories

### Chrome Storage Local (Device-only)
- `history` - Usage history (last 100)
- `snapshots` - Context snapshots (TTL 10min)
- `video-analyses` - Video analysis results
- `cache:*` - Various caches

## Schema Definition

```typescript
// Prompt
interface Prompt {
  id: string;              // UUID v4
  title: string;           // 1-200 chars
  content: string;         // 1-10000 chars
  category: string;        // 1-50 chars
  tags: string[];          // max 10, each 1-30 chars
  shortcut: string;        // optional, /^[a-z0-9-]+$/
  createdAt: number;       // Unix timestamp (ms)
  updatedAt: number;       // Unix timestamp (ms)
  useCount: number;
  isFavorite: boolean;
  lastUsedAt?: number;
  language: string;        // 'zh-CN', 'en', etc.
  source?: {
    type: 'manual' | 'smart-convert' | 'import' | 'shared';
    url?: string;
    title?: string;
  };
  contextVars?: string[];
  versions?: PromptVersion[];
}

interface PromptVersion {
  id: string;
  content: string;
  createdAt: number;
  note?: string;
}

// Settings
interface Settings {
  language: 'zh-CN' | 'en' | 'ja' | 'ko' | 'es' | 'fr' | 'de';
  theme: 'auto' | 'light' | 'dark';
  syncEngine: 'none' | 'chrome' | 'gist' | 'webdav' | 'obsidian' | 'obsidian-local';
  chromeSync?: { enabled: boolean; lastSyncAt?: number; };
  gistSync?: { enabled: boolean; token?: string; gistId?: string; lastSyncAt?: number; };
  webdavSync?: { enabled: boolean; url?: string; username?: string; password?: string; folder?: string; lastSyncAt?: number; };
  obsidianSync?: { enabled: boolean; webdavUrl?: string; username?: string; password?: string; folder?: string; lastSyncAt?: number; };
  obsidianLocal?: { enabled: boolean; port?: number; apiKey?: string; lastSyncAt?: number; };
  defaultProviderId?: string;
  imagePromptEnabled: boolean;
  defaultOutputRules?: OutputRules;
  preferences: {
    listView: 'grid' | 'list';
    pageSize: number;
    sortBy: 'created' | 'updated' | 'used' | 'title';
    sortOrder: 'asc' | 'desc';
  };
}

interface OutputRules {
  format: 'auto' | 'markdown' | 'json' | 'table' | 'text' | 'code';
  maxLength?: number;
  tone: 'default' | 'professional' | 'concise' | 'creative';
  exclusions: string[];
}

// AI Provider
interface AIProvider {
  id: string;
  name: string;
  type: 'openai-compatible' | 'gemini-web' | 'gemini-api' | 'azure-openai';
  baseUrl?: string;
  apiKey?: string;
  model: string;
  capabilities: { chat: boolean; vision: boolean; json: boolean; };
  defaults?: { temperature?: number; maxTokens?: number; topP?: number; };
  enabled: boolean;
  createdAt: number;
}

// Category
interface Category {
  name: string;
  displayName: string;
  order: number;
  icon?: string;
  color?: string;
  isSystem: boolean;
  createdAt: number;
}

// Prompt History
interface PromptHistory {
  id: string;
  promptId: string;
  content: string;
  variables?: Record<string, string>;
  platform?: string;
  usedAt: number;
  success: boolean;
  error?: string;
}

// Context Snapshot
interface ContextSnapshot {
  id: string;
  pageTitle: string;
  pageUrl: string;
  selection?: string;
  pageText?: string;
  capturedAt: number;
  expiresAt: number;  // TTL 10 minutes
}
```

## v1 to v2 Migration

### Changes
1. `tags`: string → string[] (split by comma)
2. Added: `language`, `versions`, `source`, `contextVars`
3. Settings structure completely redesigned
4. New: `providers`, `history`, `snapshots`

### Migration Function
```typescript
function migrateV1ToV2(v1: V1Prompt): Prompt {
  return {
    ...v1,
    tags: v1.tags ? v1.tags.split(',').map(t => t.trim()) : [],
    language: detectLanguage(v1.content),
    versions: [],
    source: { type: 'manual' },
  };
}
```

## Storage Keys

| Key | Area | Description |
|-----|------|-------------|
| `prompts` | sync | All user prompts |
| `settings` | sync | User preferences |
| `providers` | sync | AI provider configs |
| `categories` | sync | Custom categories |
| `history` | local | Usage history |
| `snapshots` | local | Context snapshots |
| `video-analyses` | local | Video analysis results |
| `cache:translations` | local | Translation cache |
| `cache:ai-responses` | local | AI response cache |
