# Interface Contracts: Prompt Ark v2

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Overview

本文档定义 Prompt Ark v2 的内部和外部接口契约，包括：
- Background ↔ Content Script 消息协议
- Storage API 接口
- AI Provider 接口
- Platform Adapter 接口

---

## 1. Message Protocol (背景脚本通信)

### Message Types

```typescript
// contracts/messages.ts

export type MessageDirection = 
  | 'popup→background' 
  | 'background→popup' 
  | 'content→background' 
  | 'background→content';

export type ExtensionMessage =
  | PromptMessages
  | SettingsMessages
  | AIMessages
  | SyncMessages
  | ContextMessages;

// ==================== Prompt Messages ====================

export interface GetPromptsMessage {
  type: 'GET_PROMPTS';
  direction: 'popup→background';
  payload?: {
    filter?: PromptFilter;
    sort?: PromptSort;
    page?: number;
    pageSize?: number;
  };
}

export interface GetPromptsResponse {
  success: true;
  data: {
    prompts: Prompt[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface SavePromptMessage {
  type: 'SAVE_PROMPT';
  direction: 'popup→background' | 'content→background';
  payload: {
    prompt: CreatePromptDTO;
  };
}

export interface SavePromptResponse {
  success: true;
  data: Prompt;
}

export interface UpdatePromptMessage {
  type: 'UPDATE_PROMPT';
  direction: 'popup→background';
  payload: {
    id: string;
    updates: UpdatePromptDTO;
  };
}

export interface DeletePromptMessage {
  type: 'DELETE_PROMPT';
  direction: 'popup→background';
  payload: {
    id: string;
  };
}

export interface InsertPromptMessage {
  type: 'INSERT_PROMPT';
  direction: 'popup→background';
  payload: {
    promptId: string;
    variables?: Record<string, string>;
    targetTabId: number;
  };
}

export interface InsertPromptResponse {
  success: boolean;
  error?: string;
}

// ==================== Settings Messages ====================

export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
  direction: 'popup→background';
}

export interface UpdateSettingsMessage {
  type: 'UPDATE_SETTINGS';
  direction: 'popup→background';
  payload: {
    settings: Partial<Settings>;
  };
}

// ==================== AI Messages ====================

export interface OptimizePromptMessage {
  type: 'OPTIMIZE_PROMPT';
  direction: 'popup→background';
  payload: {
    content: string;
    providerId: string;
    variant: 'concise' | 'enhanced' | 'professional';
  };
}

export interface OptimizePromptResponse {
  success: true;
  data: {
    original: string;
    optimized: string;
    variant: string;
  };
}

export interface TranslatePromptMessage {
  type: 'TRANSLATE_PROMPT';
  direction: 'popup→background';
  payload: {
    promptId: string;
    targetLanguage: string;
    providerId: string;
  };
}

export interface SmartConvertMessage {
  type: 'SMART_CONVERT';
  direction: 'content→background';
  payload: {
    text: string;
    pageUrl: string;
    pageTitle: string;
  };
}

export interface SmartConvertResponse {
  success: true;
  data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  };
}

// ==================== Sync Messages ====================

export interface SyncNowMessage {
  type: 'SYNC_NOW';
  direction: 'popup→background';
  payload: {
    engine: 'chrome' | 'gist' | 'webdav' | 'obsidian';
  };
}

export interface SyncStatusMessage {
  type: 'SYNC_STATUS';
  direction: 'background→popup';
  payload: {
    status: 'syncing' | 'synced' | 'error';
    engine: string;
    lastSyncAt?: number;
    error?: string;
  };
}

// ==================== Context Messages ====================

export interface GrabContextMessage {
  type: 'GRAB_CONTEXT';
  direction: 'content→background';
  payload: {
    pageTitle: string;
    pageUrl: string;
    selection?: string;
    pageText?: string;
  };
}

export interface GetContextMessage {
  type: 'GET_CONTEXT';
  direction: 'popup→background';
}

export interface GetContextResponse {
  success: true;
  data: ContextSnapshot | null;
}

// ==================== Error Response ====================

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// Union type for all responses
export type ExtensionResponse = 
  | GetPromptsResponse
  | SavePromptResponse
  | OptimizePromptResponse
  | SmartConvertResponse
  | GetContextResponse
  | ErrorResponse;
```

### Message Validation Rules

1. **所有消息必须包含 `type` 字段**
2. **方向必须是枚举值之一**
3. **payload 必须符合对应接口定义**
4. **响应必须在 30 秒内返回，否则超时**

### Error Codes

```typescript
enum ErrorCode {
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  TIMEOUT = 'TIMEOUT',
  
  // Prompt 相关
  PROMPT_NOT_FOUND = 'PROMPT_NOT_FOUND',
  PROMPT_VALIDATION_FAILED = 'PROMPT_VALIDATION_FAILED',
  PROMPT_INSERT_FAILED = 'PROMPT_INSERT_FAILED',
  
  // AI 相关
  AI_PROVIDER_NOT_FOUND = 'AI_PROVIDER_NOT_FOUND',
  AI_REQUEST_FAILED = 'AI_REQUEST_FAILED',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',
  
  // Sync 相关
  SYNC_NOT_ENABLED = 'SYNC_NOT_ENABLED',
  SYNC_AUTH_FAILED = 'SYNC_AUTH_FAILED',
  SYNC_NETWORK_ERROR = 'SYNC_NETWORK_ERROR',
  
  // Context 相关
  CONTEXT_EXPIRED = 'CONTEXT_EXPIRED',
  CONTEXT_NOT_FOUND = 'CONTEXT_NOT_FOUND',
}
```

---

## 2. Storage API Contract

```typescript
// contracts/storage.ts

export interface StorageAPI {
  // ==================== Prompt Operations ====================
  
  /** 获取所有提示词 */
  getPrompts(filter?: PromptFilter): Promise<Prompt[]>;
  
  /** 根据 ID 获取提示词 */
  getPromptById(id: string): Promise<Prompt | null>;
  
  /** 创建提示词 */
  createPrompt(data: CreatePromptDTO): Promise<Prompt>;
  
  /** 更新提示词 */
  updatePrompt(id: string, data: UpdatePromptDTO): Promise<Prompt>;
  
  /** 删除提示词 */
  deletePrompt(id: string): Promise<void>;
  
  /** 批量导入 */
  importPrompts(prompts: CreatePromptDTO[]): Promise<Prompt[]>;
  
  /** 批量导出 */
  exportPrompts(filter?: PromptFilter): Promise<Prompt[]>;
  
  // ==================== Settings Operations ====================
  
  /** 获取设置 */
  getSettings(): Promise<Settings>;
  
  /** 更新设置 */
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
  
  /** 重置设置为默认值 */
  resetSettings(): Promise<Settings>;
  
  // ==================== Category Operations ====================
  
  /** 获取所有分类 */
  getCategories(): Promise<Category[]>;
  
  /** 创建分类 */
  createCategory(data: Omit<Category, 'createdAt'>): Promise<Category>;
  
  /** 更新分类 */
  updateCategory(name: string, data: Partial<Category>): Promise<Category>;
  
  /** 删除分类 */
  deleteCategory(name: string): Promise<void>;
  
  /** 重命名分类（同时更新所有关联的 prompt） */
  renameCategory(oldName: string, newName: string): Promise<void>;
  
  // ==================== History Operations ====================
  
  /** 记录使用历史 */
  recordHistory(data: Omit<PromptHistory, 'id' | 'usedAt'>): Promise<PromptHistory>;
  
  /** 获取历史记录 */
  getHistory(options?: { limit?: number; promptId?: string }): Promise<PromptHistory[]>;
  
  /** 清理历史记录 */
  clearHistory(before?: number): Promise<void>;
  
  // ==================== Context Operations ====================
  
  /** 保存上下文快照 */
  saveContext(data: Omit<ContextSnapshot, 'id' | 'capturedAt'>): Promise<ContextSnapshot>;
  
  /** 获取最新的上下文快照 */
  getLatestContext(): Promise<ContextSnapshot | null>;
  
  /** 清理过期的上下文快照 */
  cleanupExpiredContexts(): Promise<void>;
}

// Storage 实现契约
export interface StorageBackend {
  name: string;
  
  /** 读取数据 */
  get<T>(key: string): Promise<T | null>;
  
  /** 批量读取 */
  getMany<T extends Record<string, any>>(keys: string[]): Promise<Partial<T>>;
  
  /** 写入数据 */
  set<T>(key: string, value: T): Promise<void>;
  
  /** 批量写入 */
  setMany<T extends Record<string, any>>(data: T): Promise<void>;
  
  /** 删除数据 */
  remove(key: string): Promise<void>;
  
  /** 批量删除 */
  removeMany(keys: string[]): Promise<void>;
  
  /** 清空所有数据 */
  clear(): Promise<void>;
  
  /** 监听变化 */
  onChanged(callback: (changes: Record<string, { oldValue?: any; newValue?: any }>) => void): () => void;
}
```

---

## 3. AI Provider Contract

```typescript
// contracts/ai-provider.ts

export interface AIProviderAPI {
  /** 提供商唯一标识 */
  readonly id: string;
  
  /** 提供商显示名称 */
  readonly name: string;
  
  /** 提供商类型 */
  readonly type: AIProviderType;
  
  /** 是否已配置并可用 */
  isAvailable(): Promise<boolean>;
  
  /** 获取可用模型列表 */
  listModels(): Promise<AIModel[]>;
  
  /** 发送聊天消息 */
  chat(options: ChatOptions): Promise<ChatResponse>;
  
  /** 流式聊天 */
  chatStream(options: ChatOptions): AsyncIterable<ChatStreamChunk>;
  
  /** 验证配置 */
  validateConfig(): Promise<{ valid: boolean; error?: string }>;
}

export type AIProviderType = 
  | 'openai-compatible' 
  | 'gemini-web' 
  | 'gemini-api' 
  | 'azure-openai';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapabilities;
  contextWindow: number;
}

export interface ModelCapabilities {
  chat: boolean;
  vision: boolean;
  json: boolean;
  streaming: boolean;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 encoded images for vision models
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatStreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// 特殊功能：Prompt 优化
export interface PromptOptimizer {
  optimize(options: OptimizeOptions): Promise<OptimizeResult>;
}

export interface OptimizeOptions {
  content: string;
  variant: 'concise' | 'enhanced' | 'professional';
  providerId: string;
}

export interface OptimizeResult {
  original: string;
  optimized: string;
  variant: string;
  explanation?: string;
}

// 特殊功能：Prompt 翻译
export interface PromptTranslator {
  translate(options: TranslateOptions): Promise<TranslateResult>;
}

export interface TranslateOptions {
  content: string;
  title: string;
  category: string;
  tags: string[];
  targetLanguage: string;
  providerId: string;
}

export interface TranslateResult {
  content: string;
  title: string;
  category: string;
  tags: string[];
  language: string;
}

// 特殊功能：智能转换
export interface SmartConverter {
  convert(options: SmartConvertOptions): Promise<SmartConvertResult>;
}

export interface SmartConvertOptions {
  text: string;
  pageContext?: {
    url: string;
    title: string;
  };
  providerId: string;
}

export interface SmartConvertResult {
  title: string;
  content: string;
  category: string;
  tags: string[];
  variables: string[];
}
```

---

## 4. Platform Adapter Contract

```typescript
// contracts/platform-adapter.ts

export interface PlatformAdapter {
  /** 平台配置 */
  readonly config: PlatformConfig;
  
  /** 
   * 检测当前页面是否匹配该平台
   * 基于 URL 和 DOM 特征
   */
  detect(): boolean;
  
  /** 
   * 等待页面完全加载
   * 返回 Promise，解析后表示平台已就绪
   */
  waitForReady(): Promise<void>;
  
  // ==================== DOM 查询 ====================
  
  /** 查找消息容器 */
  findMessageContainer(): HTMLElement | null;
  
  /** 查找输入区域 */
  findInputArea(): HTMLElement | null;
  
  /** 查找发送按钮 */
  findSendButton(): HTMLElement | null;
  
  /** 检测生成状态 */
  detectGenerationStatus(): GenerationStatus;
  
  // ==================== 消息操作 ====================
  
  /** 获取所有消息 */
  getMessages(): PlatformMessage[];
  
  /** 获取最后一条消息 */
  getLastMessage(): PlatformMessage | null;
  
  // ==================== 输入操作 ====================
  
  /** 
   * 设置输入框内容
   * 需要触发 input 事件以激活发送按钮
   */
  setInputContent(content: string): void;
  
  /** 
   * 发送消息
   * 触发发送按钮点击或键盘事件
   */
  sendMessage(content: string): Promise<boolean>;
  
  /** 
   * 插入 Prompt（含变量替换）
   * 将 Prompt 内容填入输入框并触发发送
   */
  insertPrompt(prompt: Prompt, variables?: Record<string, string>): Promise<boolean>;
  
  // ==================== UI 注入 ====================
  
  /** 
   * 注入 Prompt Ark 按钮
   * 返回注入的容器元素
   */
  injectPromptButton(container: HTMLElement): HTMLElement | null;
  
  /** 
   * 移除注入的 UI
   */
  removeInjectedUI(): void;
  
  // ==================== 事件监听 ====================
  
  /** 
   * 监听消息变化
   * 用于观察对话更新
   */
  onMessagesChange(callback: (messages: PlatformMessage[]) => void): () => void;
  
  /** 
   * 监听生成状态变化
   */
  onGenerationStatusChange(callback: (status: GenerationStatus) => void): () => void;
}

export interface PlatformConfig {
  /** 平台唯一标识 */
  name: string;
  
  /** 
   * URL 匹配模式
   * 用于 manifest.json 和运行时检测
   */
  matches: string[];
  
  /** DOM 选择器配置 */
  selectors: PlatformSelectors;
  
  /** 平台特性 */
  features: PlatformFeatures;
}

export interface PlatformSelectors {
  /** 消息容器选择器（按优先级排序） */
  messageContainer: string[];
  
  /** 输入框选择器 */
  inputArea: string[];
  
  /** 发送按钮选择器 */
  sendButton: string[];
  
  /** 生成状态指示器选择器 */
  generatingIndicator: string[];
  
  /** 消息元素选择器 */
  message: string[];
  
  /** 用户角色标识 */
  userRoleIndicator: string[];
  
  /** AI 角色标识 */
  assistantRoleIndicator: string[];
}

export interface PlatformFeatures {
  /** 是否支持多轮对话 */
  supportsMultiTurn: boolean;
  
  /** 是否支持文件上传 */
  supportsFileUpload: boolean;
  
  /** 是否支持图片输入 */
  supportsVision: boolean;
  
  /** 是否需要特殊发送方式 */
  requiresSpecialSend: boolean;
  
  /** 输入框类型 */
  inputType: 'textarea' | 'contenteditable' | 'custom';
}

export interface PlatformMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface GenerationStatus {
  isGenerating: boolean;
  progress?: number;
  model?: string;
}

// 平台适配器工厂
export interface PlatformAdapterFactory {
  createAdapter(platform: string): PlatformAdapter;
  registerAdapter(adapter: PlatformAdapter): void;
  detectPlatform(url: string): PlatformAdapter | null;
}

// 平台列表（v2 支持的平台）
export const SUPPORTED_PLATFORMS = [
  'chatgpt',
  'claude',
  'gemini',
  'deepseek',
  'kimi',
  'doubao',
  'qwen',
  'chatglm',
  'hailuoai',
  'hunyuan',
  'grok',
  'notebooklm',
  'aistudio',
  'yiyan',
  'tongyi',
  'perplexity',
] as const;

export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];
```

---

## 5. Sync Engine Contract

```typescript
// contracts/sync.ts

export interface SyncEngine {
  readonly name: string;
  readonly displayName: string;
  
  /** 检查是否已配置 */
  isConfigured(): Promise<boolean>;
  
  /** 测试连接 */
  testConnection(): Promise<{ success: boolean; error?: string }>;
  
  /** 拉取数据 */
  pull(): Promise<SyncResult>;
  
  /** 推送数据 */
  push(data: SyncPayload): Promise<SyncResult>;
  
  /** 双向同步 */
  sync(localData: SyncPayload): Promise<SyncResult>;
}

export interface SyncPayload {
  prompts: Prompt[];
  settings: Settings;
  categories: Category[];
  version: number;
  exportedAt: number;
}

export interface SyncResult {
  success: boolean;
  action: 'pulled' | 'pushed' | 'merged' | 'none';
  data?: SyncPayload;
  conflict?: SyncConflict[];
  error?: string;
}

export interface SyncConflict {
  type: 'prompt' | 'setting' | 'category';
  id: string;
  localVersion: any;
  remoteVersion: any;
  resolution?: 'local' | 'remote' | 'manual';
}

// 具体同步引擎
export interface ChromeSyncEngine extends SyncEngine {
  name: 'chrome';
}

export interface GistSyncEngine extends SyncEngine {
  name: 'gist';
  createGist(): Promise<string>; // 返回 Gist ID
}

export interface WebDAVSyncEngine extends SyncEngine {
  name: 'webdav';
  ensureFolder(): Promise<void>;
}

export interface ObsidianSyncEngine extends SyncEngine {
  name: 'obsidian';
  parseMarkdownFiles(files: string[]): Prompt[];
  generateMarkdown(prompt: Prompt): string;
}
```

---

## Contract Versioning

- **Version**: 1.0.0
- **Compatibility**: Prompt Ark v2.0.0+
- **Breaking Changes**: 所有破坏性变更需在 major version 升级时记录

## Testing Contracts

所有接口契约必须提供：
1. TypeScript 类型定义（编译时检查）
2. 运行时验证（Zod 或类似库）
3. 单元测试（覆盖所有消息类型）
4. Mock 实现（用于开发和测试）
