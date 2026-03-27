/**
 * @fileoverview Type validation tests for Prompt Ark v2
 * 
 * These tests validate type correctness at compile time.
 * Runtime assertions ensure type structures match expectations.
 */

import { describe, it, expect } from 'vitest';
import type {
  Prompt,
  PromptVersion,
  PromptSource,
  CreatePromptDTO,
  UpdatePromptDTO,
  Category,
  Tag,
  SlimPrompt,
  PromptFilter,
  PromptSort,
  SortBy,
  SortOrder,
  ListView,
  PaginatedResult,
  VariableDefinition,
  VariableValue,
  VariableType,
  ClassifiedVariables,
  ContextVariableName,
  ContextResolutionResult,
  AIProvider,
  AIProviderType,
  AIModel,
  ModelCapabilities,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatStreamChunk,
  MetadataExtractionResult,
  PromptOptimizationResult,
  Settings,
  OutputRules,
  UserPreferences,
  ChromeSyncConfig,
  GistSyncConfig,
  WebDAVSyncConfig,
  ObsidianSyncConfig,
  ObsidianLocalConfig,
  ContextSnapshot,
  PromptHistory,
  StorageSchema,
  StorageKey,
  SyncBackend,
  SyncState,
  SyncStatus,
  SyncResult,
  SyncPayload,
  SyncConflict,
  SyncErrorCode,
  SyncEngineAdapter,
  SyncConfig,
  SupportedPlatform,
  PlatformConfig,
  PlatformAdapter,
  PlatformMessage,
  GenerationStatus,
  InsertionResult,
  InsertionErrorCode,
  PlatformDetectionResult,
  MessageType,
  ExtensionMessage,
  ExtensionResponse,
} from '../../src/types';
import { ErrorCode } from '../../src/types';

describe('Type Definitions', () => {
  describe('Prompt Types', () => {
    it('should have correct Prompt structure', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'Test Prompt',
        content: 'This is a {{variable}} test',
        category: 'test-category',
        tags: ['tag1', 'tag2'],
        shortcut: 'test',
        variables: [],
        favorite: false,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        versions: [],
        useCount: 0,
        lastUsedAt: null,
      };

      expect(prompt.id).toBe('test-id');
      expect(prompt.favorite).toBe(false);
      expect(prompt.useCount).toBe(0);
      expect(prompt.lastUsedAt).toBeNull();
    });

    it('should have correct PromptVersion structure', () => {
      const version: PromptVersion = {
        id: 'v1',
        content: 'Version content',
        createdAt: Date.now(),
        note: 'Initial version',
      };

      expect(version.id).toBe('v1');
      expect(version.note).toBe('Initial version');
    });

    it('should have correct PromptSource structure', () => {
      const source: PromptSource = {
        type: 'manual',
        url: 'https://example.com',
        title: 'Example',
      };

      expect(source.type).toBe('manual');
    });

    it('should accept all source type values', () => {
      const types: Array<'manual' | 'smart-convert' | 'import' | 'shared'> = [
        'manual',
        'smart-convert',
        'import',
        'shared',
      ];

      expect(types).toHaveLength(4);
    });

    it('should have correct CreatePromptDTO structure', () => {
      const dto: CreatePromptDTO = {
        content: 'Test content',
        title: 'Test',
      };

      expect(dto.content).toBe('Test content');
    });

    it('should have correct UpdatePromptDTO structure', () => {
      const dto: UpdatePromptDTO = {
        title: 'Updated Title',
        favorite: true,
      };

      expect(dto.title).toBe('Updated Title');
      expect(dto.favorite).toBe(true);
    });

    it('should have correct Category structure', () => {
      const category: Category = {
        name: 'productivity',
        displayName: 'Productivity',
        order: 1,
        isSystem: false,
        createdAt: Date.now(),
      };

      expect(category.name).toBe('productivity');
      expect(category.isSystem).toBe(false);
    });

    it('should have correct Tag structure', () => {
      const tag: Tag = {
        name: 'writing',
        count: 5,
        createdAt: Date.now(),
      };

      expect(tag.name).toBe('writing');
      expect(tag.count).toBe(5);
    });

    it('should have correct SlimPrompt structure', () => {
      const slim: SlimPrompt = {
        id: 'test',
        title: 'Test',
        content: 'Content',
        category: 'cat',
        tags: [],
        shortcut: '',
        variables: [],
        favorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(slim.id).toBe('test');
      // SlimPrompt should NOT have versions and useCount (these are local-only)
      const slimKeys = Object.keys(slim);
      expect(slimKeys).not.toContain('versions');
      expect(slimKeys).not.toContain('useCount');
    });

    it('should accept all SortBy values', () => {
      const sortBy: SortBy[] = ['created', 'updated', 'used', 'title'];
      expect(sortBy).toHaveLength(4);
    });

    it('should accept all SortOrder values', () => {
      const order: SortOrder[] = ['asc', 'desc'];
      expect(order).toHaveLength(2);
    });

    it('should accept all ListView values', () => {
      const views: ListView[] = ['grid', 'list'];
      expect(views).toHaveLength(2);
    });

    it('should have correct PaginatedResult structure', () => {
      const result: PaginatedResult<Prompt> = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      };

      expect(result.page).toBe(1);
    });
  });

  describe('Variable Types', () => {
    it('should accept all VariableType values', () => {
      const types: VariableType[] = ['text', 'enum', 'default', 'context'];
      expect(types).toHaveLength(4);
    });

    it('should have correct VariableDefinition structure', () => {
      const variable: VariableDefinition = {
        name: 'language',
        type: 'enum',
        options: ['EN', 'ZH'],
        default: 'EN',
        raw: 'language:EN|ZH',
      };

      expect(variable.type).toBe('enum');
      expect(variable.options).toHaveLength(2);
    });

    it('should have correct VariableValue structure', () => {
      const value: VariableValue = {
        name: 'topic',
        value: 'AI',
        source: 'user',
      };

      expect(value.source).toBe('user');
    });

    it('should have correct ClassifiedVariables structure', () => {
      const classified: ClassifiedVariables = {
        context: [],
        user: [],
      };

      expect(classified.context).toEqual([]);
      expect(classified.user).toEqual([]);
    });

    it('should accept all ContextVariableName values', () => {
      const vars: ContextVariableName[] = [
        '@clipboard',
        '@selection',
        '@page_url',
        '@page_title',
        '@page_text',
        '@date',
        '@lang',
      ];

      expect(vars).toHaveLength(7);
    });

    it('should have correct ContextResolutionResult structure', () => {
      const result: ContextResolutionResult = {
        resolved: 'Resolved content',
        resolvedMap: {},
      };

      expect(result.resolved).toBe('Resolved content');
    });
  });

  describe('AI Types', () => {
    it('should accept all AIProviderType values', () => {
      const types: AIProviderType[] = [
        'openai',
        'gemini',
        'gemini-web',
        'azure-openai',
      ];

      expect(types).toHaveLength(4);
    });

    it('should have correct AIProvider structure', () => {
      const provider: AIProvider = {
        id: 'test-provider',
        name: 'Test Provider',
        type: 'openai',
        baseUrl: 'https://api.example.com',
        apiKey: 'secret-key',
        model: 'gpt-4',
        capabilities: {
          chat: true,
          vision: false,
          json: true,
        },
        defaults: {
          temperature: 0.7,
          maxTokens: 2000,
        },
        enabled: true,
      };

      expect(provider.capabilities.chat).toBe(true);
      expect(provider.enabled).toBe(true);
    });

    it('should have correct AIModel structure', () => {
      const model: AIModel = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        capabilities: {
          chat: true,
          vision: true,
          json: true,
          streaming: true,
        },
        contextWindow: 8192,
      };

      expect(model.contextWindow).toBe(8192);
    });

    it('should have correct ModelCapabilities structure', () => {
      const caps: ModelCapabilities = {
        chat: true,
        vision: false,
        json: true,
        streaming: true,
      };

      expect(caps.streaming).toBe(true);
    });

    it('should have correct ChatMessage structure', () => {
      const message: ChatMessage = {
        role: 'user',
        content: 'Hello',
        images: ['base64image'],
      };

      expect(message.role).toBe('user');
    });

    it('should have correct ChatOptions structure', () => {
      const options: ChatOptions = {
        model: 'gpt-4',
        messages: [],
        temperature: 0.5,
        stream: true,
      };

      expect(options.stream).toBe(true);
    });

    it('should have correct ChatResponse structure', () => {
      const response: ChatResponse = {
        content: 'Response text',
        model: 'gpt-4',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      };

      expect(response.usage?.totalTokens).toBe(30);
    });

    it('should have correct ChatStreamChunk structure', () => {
      const chunk: ChatStreamChunk = {
        content: 'chunk',
        done: false,
      };

      expect(chunk.done).toBe(false);
    });

    it('should have correct MetadataExtractionResult structure', () => {
      const result: MetadataExtractionResult = {
        title: 'Extracted Title',
        category: 'Test',
        tags: ['tag1'],
      };

      expect(result.title).toBe('Extracted Title');
    });

    it('should have correct PromptOptimizationResult structure', () => {
      const result: PromptOptimizationResult = {
        original: 'Original prompt',
        variants: {
          concise: 'Concise version',
          enhanced: 'Enhanced version',
          professional: 'Professional version',
        },
      };

      expect(result.variants.concise).toBe('Concise version');
    });
  });

  describe('Storage Types', () => {
    it('should have correct OutputRules structure', () => {
      const rules: OutputRules = {
        format: 'markdown',
        maxLength: 1000,
        tone: 'professional',
        exclusions: ['excluded'],
      };

      expect(rules.format).toBe('markdown');
    });

    it('should have correct UserPreferences structure', () => {
      const prefs: UserPreferences = {
        listView: 'grid',
        pageSize: 20,
        sortBy: 'updated',
        sortOrder: 'desc',
      };

      expect(prefs.listView).toBe('grid');
    });

    it('should have correct ChromeSyncConfig structure', () => {
      const config: ChromeSyncConfig = {
        enabled: true,
        lastSyncAt: Date.now(),
      };

      expect(config.enabled).toBe(true);
    });

    it('should have correct GistSyncConfig structure', () => {
      const config: GistSyncConfig = {
        enabled: true,
        token: 'ghp_xxx',
        gistId: 'abc123',
      };

      expect(config.gistId).toBe('abc123');
    });

    it('should have correct WebDAVSyncConfig structure', () => {
      const config: WebDAVSyncConfig = {
        enabled: true,
        url: 'https://dav.example.com',
        username: 'user',
        password: 'pass',
        folder: 'prompts',
      };

      expect(config.url).toBe('https://dav.example.com');
    });

    it('should have correct ObsidianSyncConfig structure', () => {
      const config: ObsidianSyncConfig = {
        enabled: true,
        webdavUrl: 'https://obsidian.example.com',
        folder: 'Prompts',
      };

      expect(config.folder).toBe('Prompts');
    });

    it('should have correct ObsidianLocalConfig structure', () => {
      const config: ObsidianLocalConfig = {
        enabled: true,
        port: 27123,
        apiKey: 'secret',
      };

      expect(config.port).toBe(27123);
    });

    it('should have correct Settings structure', () => {
      const settings: Settings = {
        language: 'en',
        theme: 'auto',
        syncEngine: 'none',
        imagePromptEnabled: false,
        preferences: {
          listView: 'grid',
          pageSize: 20,
          sortBy: 'updated',
          sortOrder: 'desc',
        },
      };

      expect(settings.language).toBe('en');
      expect(settings.syncEngine).toBe('none');
    });

    it('should have correct ContextSnapshot structure', () => {
      const snapshot: ContextSnapshot = {
        id: 'snap-1',
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com',
        selection: 'selected text',
        capturedAt: Date.now(),
        expiresAt: Date.now() + 600000,
      };

      expect(snapshot.pageTitle).toBe('Test Page');
    });

    it('should have correct PromptHistory structure', () => {
      const history: PromptHistory = {
        id: 'hist-1',
        promptId: 'prompt-1',
        content: 'Used content',
        platform: 'chatgpt',
        usedAt: Date.now(),
        success: true,
      };

      expect(history.success).toBe(true);
    });

    it('should have correct StorageSchema structure', () => {
      const schema: StorageSchema = {
        prompts: [],
        settings: {
          language: 'en',
          theme: 'auto',
          syncEngine: 'none',
          imagePromptEnabled: false,
          preferences: {
            listView: 'grid',
            pageSize: 20,
            sortBy: 'updated',
            sortOrder: 'desc',
          },
        },
        providers: [],
        categories: [],
        history: [],
        snapshots: [],
        'video-analyses': [],
        'cache:translations': {},
        'cache:ai-responses': {},
      };

      expect(schema.prompts).toEqual([]);
    });

    it('should accept all StorageKey values', () => {
      const keys: StorageKey[] = [
        'prompts',
        'settings',
        'providers',
        'categories',
        'history',
        'snapshots',
        'video-analyses',
        'cache:translations',
        'cache:ai-responses',
      ];

      expect(keys).toHaveLength(9);
    });
  });

  describe('Sync Types', () => {
    it('should accept all SyncBackend values', () => {
      const backends: SyncBackend[] = [
        'none',
        'chrome',
        'gist',
        'webdav',
        'obsidian',
        'obsidian-local',
      ];

      expect(backends).toHaveLength(6);
    });

    it('should accept all SyncState values', () => {
      const states: SyncState[] = [
        'idle',
        'syncing',
        'synced',
        'failed',
        'conflict',
      ];

      expect(states).toHaveLength(5);
    });

    it('should have correct SyncStatus structure', () => {
      const status: SyncStatus = {
        state: 'synced',
        backend: 'gist',
        lastSyncTime: Date.now(),
        pendingChanges: 0,
      };

      expect(status.state).toBe('synced');
    });

    it('should have correct SyncResult structure', () => {
      const result: SyncResult = {
        success: true,
        action: 'merged',
      };

      expect(result.action).toBe('merged');
    });

    it('should have correct SyncPayload structure', () => {
      const payload: SyncPayload = {
        prompts: [],
        settings: {
          language: 'en',
          theme: 'auto',
          syncEngine: 'gist',
          imagePromptEnabled: false,
          preferences: {
            listView: 'grid',
            pageSize: 20,
            sortBy: 'updated',
            sortOrder: 'desc',
          },
        },
        categories: [],
        version: 2,
        exportedAt: Date.now(),
      };

      expect(payload.version).toBe(2);
    });

    it('should have correct SyncConflict structure', () => {
      const conflict: SyncConflict = {
        type: 'prompt',
        id: 'conflict-1',
        localVersion: {},
        remoteVersion: {},
        resolution: 'manual',
      };

      expect(conflict.resolution).toBe('manual');
    });

    it('should have correct SyncConfig structure', () => {
      const config: SyncConfig = {
        backend: 'gist',
        gistToken: 'token',
        gistId: 'id',
      };

      expect(config.backend).toBe('gist');
    });
  });

  describe('Platform Types', () => {
    it('should accept all SupportedPlatform values', () => {
      const platforms: SupportedPlatform[] = [
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
        'perplexity',
      ];

      expect(platforms).toHaveLength(15);
    });

    it('should have correct PlatformConfig structure', () => {
      const config: PlatformConfig = {
        id: 'chatgpt',
        name: 'ChatGPT',
        urlPatterns: ['https://chatgpt.com/*'],
        inputSelectors: ['textarea'],
        isRichEditor: true,
        supportsAttachments: true,
        simulateInput: true,
        waitForReady: true,
      };

      expect(config.id).toBe('chatgpt');
    });

    it('should have correct PlatformMessage structure', () => {
      const message: PlatformMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: Date.now(),
      };

      expect(message.role).toBe('user');
    });

    it('should have correct GenerationStatus structure', () => {
      const status: GenerationStatus = {
        isGenerating: true,
        progress: 50,
        model: 'gpt-4',
      };

      expect(status.isGenerating).toBe(true);
    });

    it('should have correct InsertionResult structure', () => {
      const result: InsertionResult = {
        success: true,
        platform: 'chatgpt',
        timestamp: Date.now(),
      };

      expect(result.success).toBe(true);
    });

    it('should accept all InsertionErrorCode values', () => {
      const codes: InsertionErrorCode[] = [
        'PLATFORM_NOT_DETECTED',
        'INPUT_NOT_FOUND',
        'INPUT_NOT_READY',
        'INSERTION_FAILED',
        'CHAR_LIMIT_EXCEEDED',
        'PLATFORM_NOT_SUPPORTED',
      ];

      expect(codes).toHaveLength(6);
    });

    it('should have correct PlatformDetectionResult structure', () => {
      const result: PlatformDetectionResult = {
        platform: 'chatgpt',
        confidence: 0.95,
        url: 'https://chatgpt.com/',
      };

      expect(result.confidence).toBe(0.95);
    });
  });

  describe('Message Types', () => {
    it('should accept all MessageType values', () => {
      const types: MessageType[] = [
        'GET_PROMPTS',
        'SAVE_PROMPT',
        'UPDATE_PROMPT',
        'DELETE_PROMPT',
        'INSERT_PROMPT',
        'GET_SETTINGS',
        'UPDATE_SETTINGS',
        'OPTIMIZE_PROMPT',
        'TRANSLATE_PROMPT',
        'SMART_CONVERT',
        'SYNC_NOW',
        'SYNC_STATUS',
        'GRAB_CONTEXT',
        'GET_CONTEXT',
      ];

      expect(types).toHaveLength(14);
    });

    it('should have correct ExtensionMessage structure', () => {
      const message: ExtensionMessage = {
        type: 'GET_PROMPTS',
        payload: { id: '123' },
      };

      expect(message.type).toBe('GET_PROMPTS');
    });

    it('should have correct ExtensionResponse structure', () => {
      const response: ExtensionResponse<Prompt[]> = {
        success: true,
        data: [],
        code: ErrorCode.PROMPT_NOT_FOUND,
      };

      expect(response.success).toBe(true);
    });

    it('should have correct ErrorCode enum values', () => {
      expect(ErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
      expect(ErrorCode.PROMPT_NOT_FOUND).toBe('PROMPT_NOT_FOUND');
      expect(ErrorCode.AI_REQUEST_FAILED).toBe('AI_REQUEST_FAILED');
      expect(ErrorCode.SYNC_NOT_ENABLED).toBe('SYNC_NOT_ENABLED');
    });
  });
});
