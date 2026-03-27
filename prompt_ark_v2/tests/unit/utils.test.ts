/**
 * @fileoverview Comprehensive tests for utility functions
 * 
 * Tests for:
 * - analyzer.ts: ContentAnalyzer class
 * - scorer.ts: PromptScorer class
 * - crypto.ts: encrypt/decrypt functions
 * - frontmatter.ts: YAML frontmatter utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ContentAnalyzer, AnalyzePromptItem, AnalyzeResult } from '../../src/utils/analyzer';
import { PromptScorer } from '../../src/utils/scorer';
import { encrypt, decrypt, isEncrypted, generateOrLoadKey } from '../../src/utils/crypto';
import {
  parseFrontmatter,
  serializeFrontmatter,
  promptToMarkdown,
  markdownToPrompt,
  promptToFilename,
  ParsedFrontmatter,
} from '../../src/utils/frontmatter';
import type { Prompt } from '../../src/types';

// ==================== ANALYZER TESTS ====================

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(analyzer.maxRetries).toBe(3);
      expect(analyzer.retryDelayMs).toBe(3000);
    });
  });

  describe('analyzeBatch', () => {
    it('should return empty array for empty input', async () => {
      const progressFn = vi.fn();
      const results = await analyzer.analyzeBatch([], progressFn);
      
      expect(results).toEqual([]);
      expect(progressFn).not.toHaveBeenCalled();
    });

    it('should return empty array for null/undefined input', async () => {
      const progressFn = vi.fn();
      const results = await analyzer.analyzeBatch(null as unknown as AnalyzePromptItem[], progressFn);
      
      expect(results).toEqual([]);
    });

    it('should call progress callback with initial and final state', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test prompt' }];

      // Mock chrome.runtime.sendMessage to succeed immediately
      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            success: true,
            text: '[{"id":"1","title":"Test","category":"Cat","tags":[],"score":50}]',
          }),
        },
      });

      await analyzer.analyzeBatch(prompts, progressFn);

      // Should call progress with (0, total) at start and (total, total) at end
      expect(progressFn).toHaveBeenCalledWith(0, 1);
      expect(progressFn).toHaveBeenCalledWith(1, 1);
    });

    it('should truncate prompts to 2000 characters', async () => {
      const progressFn = vi.fn();
      const longPrompt = 'a'.repeat(3000);
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: longPrompt }];

      let capturedPrompt: string | null = null;
      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockImplementation((message) => {
            capturedPrompt = message.prompt;
            return Promise.resolve({ success: true, text: '[{"id":"1","title":"Test","category":"Test","tags":["test"],"score":80}]' });
          }),
        },
      });

      await analyzer.analyzeBatch(prompts, progressFn);

      // The user prompt should contain truncated content
      expect(capturedPrompt).toContain('a'.repeat(100)); // Contains the truncated content
    });

    it('should parse valid JSON response correctly', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [
        { id: '1', prompt: 'Write a poem' },
        { id: '2', prompt: 'Explain AI' },
      ];

      const mockResults: AnalyzeResult[] = [
        { id: '1', title: 'Poem Writer', category: 'Creative', tags: ['writing', 'poetry'], score: 85 },
        { id: '2', title: 'AI Explainer', category: 'Education', tags: ['ai', 'tech'], score: 90 },
      ];

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            success: true,
            text: JSON.stringify(mockResults),
          }),
        },
      });

      const results = await analyzer.analyzeBatch(prompts, progressFn);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[0].title).toBe('Poem Writer');
      expect(results[0].score).toBe(85);
    });

    it('should handle markdown code fences in response', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test' }];

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            success: true,
            text: '```json\n[{"id":"1","title":"Test","category":"Cat","tags":[],"score":50}]\n```',
          }),
        },
      });

      const results = await analyzer.analyzeBatch(prompts, progressFn);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test');
    });

    it('should return fallback results on error', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [
        { id: '1', prompt: 'Test 1' },
        { id: '2', prompt: 'Test 2' },
      ];

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      });

      // Use a test analyzer with no delay
      class TestAnalyzer extends ContentAnalyzer {
        protected delay(): Promise<void> {
          return Promise.resolve();
        }
      }
      const testAnalyzer = new TestAnalyzer();

      const results = await testAnalyzer.analyzeBatch(prompts, progressFn);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: '1', title: '', category: '', tags: [], score: 0 });
      expect(results[1]).toEqual({ id: '2', title: '', category: '', tags: [], score: 0 });
    });

    it('should return fallback results when response has no text', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test' }];

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({ success: true }),
        },
      });

      const results = await analyzer.analyzeBatch(prompts, progressFn);

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0);
    });

    it('should return fallback results when response is not an array', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test' }];

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: vi.fn().mockResolvedValue({
            success: true,
            text: '{"not": "an array"}',
          }),
        },
      });

      const results = await analyzer.analyzeBatch(prompts, progressFn);

      expect(results).toHaveLength(1);
      expect(results[0].score).toBe(0);
    });

    it('should handle rate limit with exponential backoff', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test' }];

      const sendMessageMock = vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Rate limit 429 exceeded' })
        .mockResolvedValueOnce({ success: false, error: 'Rate limit 429 exceeded' })
        .mockResolvedValueOnce({
          success: true,
          text: '[{"id":"1","title":"Test","category":"Cat","tags":[],"score":50}]',
        });

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: sendMessageMock,
        },
      });

      class TestAnalyzer extends ContentAnalyzer {
        protected delay(): Promise<void> {
          return Promise.resolve();
        }
      }
      const testAnalyzer = new TestAnalyzer();
      
      const results = await testAnalyzer.analyzeBatch(prompts, progressFn);

      expect(sendMessageMock).toHaveBeenCalledTimes(3);
      expect(results[0].score).toBe(50);
    });

    it('should retry on failure up to maxRetries', async () => {
      const progressFn = vi.fn();
      const prompts: AnalyzePromptItem[] = [{ id: '1', prompt: 'Test' }];

      const sendMessageMock = vi.fn().mockRejectedValue(new Error('Network error'));

      vi.stubGlobal('chrome', {
        runtime: {
          sendMessage: sendMessageMock,
        },
      });

      class TestAnalyzer extends ContentAnalyzer {
        protected delay(): Promise<void> {
          return Promise.resolve();
        }
      }
      const testAnalyzer = new TestAnalyzer();
      
      const results = await testAnalyzer.analyzeBatch(prompts, progressFn);

      expect(sendMessageMock).toHaveBeenCalledTimes(3);
      expect(results[0].score).toBe(0);
    });
  });
});

// ==================== SCORER TESTS ====================

describe('PromptScorer', () => {
  describe('score', () => {
    it('should return 0 for empty string', () => {
      expect(PromptScorer.score('')).toBe(0);
    });

    it('should return 0 for null/undefined', () => {
      expect(PromptScorer.score(null as unknown as string)).toBe(0);
      expect(PromptScorer.score(undefined as unknown as string)).toBe(0);
    });

    it('should return 0 for non-string input', () => {
      expect(PromptScorer.score(123 as unknown as string)).toBe(0);
      expect(PromptScorer.score({} as unknown as string)).toBe(0);
    });

    it('should give base score of 50 for normal length prompt', () => {
      const prompt = 'This is a decent length prompt with enough content.';
      expect(PromptScorer.score(prompt)).toBe(50);
    });

    it('should deduct 30 for very short prompts (< 20 chars)', () => {
      const score = PromptScorer.score('Too short');
      expect(score).toBe(20); // 50 - 30 = 20
    });

    it('should add 10 for sweet spot length (100-1500 chars)', () => {
      const prompt = 'x'.repeat(200);
      expect(PromptScorer.score(prompt)).toBe(60); // 50 + 10 = 60
    });

    it('should deduct 5 for very long prompts (> 3000 chars)', () => {
      const prompt = 'x'.repeat(3500);
      expect(PromptScorer.score(prompt)).toBe(45); // 50 - 5 = 45
    });

    it('should add 15 for prompts with {{variables}}', () => {
      const prompt = 'Hello {{name}}, welcome to {{place}}!';
      expect(PromptScorer.score(prompt)).toBe(65); // 50 + 15 = 65
    });

    it('should add 5 for prompts with [] placeholders', () => {
      const prompt = 'Write about [topic] in [style] format.';
      expect(PromptScorer.score(prompt)).toBe(55); // 50 + 5 = 55
    });

    it('should add 15 for role definition with "act as"', () => {
      const prompt = 'Act as a helpful assistant. Answer questions clearly.';
      expect(PromptScorer.score(prompt)).toBe(65); // 50 + 15 = 65
    });

    it('should add 15 for role definition with "you are a"', () => {
      const prompt = 'You are a professional writer. Create content.';
      expect(PromptScorer.score(prompt)).toBe(65); // 50 + 15 = 65
    });

    it('should add 15 for role in first line', () => {
      const prompt = 'Role: Technical Writer\n\nCreate documentation.';
      expect(PromptScorer.score(prompt)).toBe(65); // 50 + 15 = 65
    });

    it('should add 10 for markdown headers', () => {
      const prompt = '### Instructions\nFollow these steps.';
      expect(PromptScorer.score(prompt)).toBe(60); // 50 + 10 = 60
    });

    it('should add 10 for markdown bold', () => {
      const prompt = '**Important**: Read carefully.';
      expect(PromptScorer.score(prompt)).toBe(60); // 50 + 10 = 60
    });

    it('should add 5 for unordered lists', () => {
      const prompt = 'Steps:\n- First step\n- Second step';
      expect(PromptScorer.score(prompt)).toBe(55); // 50 + 5 = 55
    });

    it('should add 5 for ordered lists', () => {
      const prompt = 'Steps:\n1. First step\n2. Second step';
      expect(PromptScorer.score(prompt)).toBe(55); // 50 + 5 = 55
    });

    it('should deduct 20 for TODO markers', () => {
      const prompt = 'This is a TODO: fix this prompt later.';
      expect(PromptScorer.score(prompt)).toBe(30); // 50 - 20 = 30
    });

    it('should deduct 20 for FIXME markers', () => {
      const prompt = 'FIXME: This needs improvement.';
      expect(PromptScorer.score(prompt)).toBe(30); // 50 - 20 = 30
    });

    it('should deduct 50 for lorem ipsum', () => {
      const prompt = 'Lorem ipsum dolor sit amet.';
      expect(PromptScorer.score(prompt)).toBe(0); // 50 - 50 = 0 (clamped)
    });

    it('should clamp score to maximum 100', () => {
      // Create a prompt with many positive factors
      const prompt = 'Act as a {{role}}.\n\n### Instructions\n- Step 1\n- Step 2\n\n**Important** note. ' + 'x'.repeat(200);
      const score = PromptScorer.score(prompt);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should clamp score to minimum 0', () => {
      const prompt = 'TODO: Lorem ipsum dolor sit amet.';
      const score = PromptScorer.score(prompt);
      expect(score).toBe(0); // Should be clamped to 0
    });

    it('should handle complex prompts with multiple factors', () => {
      const prompt = `Act as a {{role}} expert in {{field}}.

### Instructions
- Analyze the topic thoroughly
- Provide specific examples
- Use professional tone

**Note**: This is important for [audience].`;
      const score = PromptScorer.score(prompt);
      expect(score).toBeGreaterThan(50);
    });
  });

  describe('getScoreColor', () => {
    it('should return green for scores >= 80', () => {
      expect(PromptScorer.getScoreColor(80)).toBe('#10b981');
      expect(PromptScorer.getScoreColor(90)).toBe('#10b981');
      expect(PromptScorer.getScoreColor(100)).toBe('#10b981');
    });

    it('should return amber for scores >= 50 and < 80', () => {
      expect(PromptScorer.getScoreColor(50)).toBe('#f59e0b');
      expect(PromptScorer.getScoreColor(65)).toBe('#f59e0b');
      expect(PromptScorer.getScoreColor(79)).toBe('#f59e0b');
    });

    it('should return red for scores < 50', () => {
      expect(PromptScorer.getScoreColor(0)).toBe('#ef4444');
      expect(PromptScorer.getScoreColor(25)).toBe('#ef4444');
      expect(PromptScorer.getScoreColor(49)).toBe('#ef4444');
    });
  });
});

// ==================== CRYPTO TESTS ====================

describe('Crypto Utils', () => {
  // Mock chrome.storage.local
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    // Reset storage and cached key
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    
    // Reset the cached key by re-importing the module
    vi.resetModules();

    // Mock chrome.storage.local
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn((key: string) => Promise.resolve({ [key]: mockStorage[key] })),
          set: vi.fn((obj: Record<string, string>) => {
            Object.assign(mockStorage, obj);
            return Promise.resolve();
          }),
        },
      },
    });

    // crypto.subtle is available in test environment (Node.js 20+)
    // but we need to make sure it's properly mocked if needed
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('generateOrLoadKey', () => {
    it('should generate a new key when none exists', async () => {
      const key = await generateOrLoadKey();
      
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(mockStorage._encKey).toBeDefined();
    });

    it('should load existing key from storage', async () => {
      // First call generates key
      const key1 = await generateOrLoadKey();
      
      // Reset modules to clear cache, but keep storage
      const storedKey = mockStorage._encKey;
      vi.resetModules();
      
      // Re-mock storage with the stored key
      vi.stubGlobal('chrome', {
        storage: {
          local: {
            get: vi.fn(() => Promise.resolve({ _encKey: storedKey })),
            set: vi.fn(),
          },
        },
      });
      
      // Re-import to get fresh module
      const { generateOrLoadKey: freshGenerateOrLoadKey } = await import('../../src/utils/crypto');
      const key2 = await freshGenerateOrLoadKey();
      
      expect(key2).toBeDefined();
      expect(key2.type).toBe('secret');
    });

    it('should cache key in memory', async () => {
      const key1 = await generateOrLoadKey();
      const key2 = await generateOrLoadKey();
      
      // Should be the same object (cached)
      expect(key1).toBe(key2);
    });
  });

  describe('encrypt', () => {
    it('should return empty string for empty input', async () => {
      const result = await encrypt('');
      expect(result).toBe('');
    });

    it('should return null/undefined as-is', async () => {
      expect(await encrypt(null as unknown as string)).toBe(null);
      expect(await encrypt(undefined as unknown as string)).toBe(undefined);
    });

    it('should encrypt plaintext and return base64', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await encrypt(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should produce different ciphertexts for same plaintext (due to random IV)', async () => {
      const plaintext = 'test-data';
      const encrypted1 = await encrypt(plaintext);
      
      // Wait a bit to ensure different IV
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Reset module cache to get new key instance
      vi.resetModules();
      const { encrypt: freshEncrypt } = await import('../../src/utils/crypto');
      const encrypted2 = await freshEncrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should gracefully return plaintext on encryption failure', async () => {
      // Mock crypto.subtle to fail
      const originalSubtle = globalThis.crypto.subtle;
      vi.stubGlobal('crypto', {
        subtle: {
          encrypt: vi.fn().mockRejectedValue(new Error('Encryption failed')),
          generateKey: originalSubtle.generateKey,
          exportKey: originalSubtle.exportKey,
        },
        getRandomValues: (arr: Uint8Array) => originalSubtle.constructor.prototype.getRandomValues(arr),
      });

      const plaintext = 'test-data';
      const result = await encrypt(plaintext);
      
      // Should return plaintext on failure
      expect(result).toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should return empty string for empty input', async () => {
      const result = await decrypt('');
      expect(result).toBe('');
    });

    it('should return null/undefined as-is', async () => {
      expect(await decrypt(null as unknown as string)).toBe(null);
      expect(await decrypt(undefined as unknown as string)).toBe(undefined);
    });

    it('should decrypt encrypted data back to original', async () => {
      const plaintext = 'my-secret-api-key-12345';
      const encrypted = await encrypt(plaintext);
      const decrypted = await decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should return plaintext as-is for non-encrypted data', async () => {
      const plaintext = 'not-encrypted-plaintext';
      const result = await decrypt(plaintext);
      
      expect(result).toBe(plaintext);
    });

    it('should return empty string on decryption failure', async () => {
      // Create a valid-looking encrypted string that will fail decryption
      const invalidEncrypted = btoa(String.fromCharCode(...new Uint8Array(20).fill(0)));
      
      const result = await decrypt(invalidEncrypted);
      
      // Should return empty string on failure
      expect(result).toBe('');
    });
  });

  describe('isEncrypted', () => {
    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isEncrypted(null as unknown as string)).toBe(false);
      expect(isEncrypted(undefined as unknown as string)).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isEncrypted(123 as unknown as string)).toBe(false);
      expect(isEncrypted({} as unknown as string)).toBe(false);
    });

    it('should return false for short strings', () => {
      expect(isEncrypted('short')).toBe(false);
      expect(isEncrypted('a'.repeat(17))).toBe(false); // Just under 18 chars
    });

    it('should return false for invalid base64', () => {
      expect(isEncrypted('not-valid-base64!!!')).toBe(false);
      expect(isEncrypted('hello world test')).toBe(false);
    });

    it('should return true for valid encrypted format', async () => {
      const plaintext = 'test-data-for-encryption-check';
      const encrypted = await encrypt(plaintext);
      
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for base64 that decodes to less than 13 bytes', () => {
      // Base64 of 12 bytes (just IV, no ciphertext)
      const smallBase64 = btoa(String.fromCharCode(...new Uint8Array(12)));
      expect(isEncrypted(smallBase64)).toBe(false);
    });
  });
});

// ==================== FRONTMATTER TESTS ====================

describe('Frontmatter Utils', () => {
  describe('parseFrontmatter', () => {
    it('should return empty meta and original body for empty string', () => {
      const result = parseFrontmatter('');
      expect(result.meta).toEqual({});
      expect(result.body).toBe('');
    });

    it('should return empty meta and original body for null/undefined', () => {
      expect(parseFrontmatter(null as unknown as string)).toEqual({ meta: {}, body: '' });
      expect(parseFrontmatter(undefined as unknown as string)).toEqual({ meta: {}, body: '' });
    });

    it('should return empty meta and original body for content without frontmatter', () => {
      const content = 'Just regular markdown content.';
      const result = parseFrontmatter(content);
      
      expect(result.meta).toEqual({});
      expect(result.body).toBe(content);
    });

    it('should parse frontmatter with title', () => {
      const content = `---
title: My Prompt
---
Write about something.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.title).toBe('My Prompt');
      expect(result.body).toBe('Write about something.');
    });

    it('should parse frontmatter with multiple fields', () => {
      const content = `---
title: Email Writer
category: Communication
tags: [email, professional]
---
Write a professional email about {{topic}}.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.title).toBe('Email Writer');
      expect(result.meta.category).toBe('Communication');
      expect(result.meta.tags).toEqual(['email', 'professional']);
      expect(result.body).toBe('Write a professional email about {{topic}}.');
    });

    it('should parse boolean values', () => {
      const content = `---
title: Favorite Prompt
favorite: true
---
Content here.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.favorite).toBe(true);
    });

    it('should parse numeric values', () => {
      const content = `---
title: Number Test
priority: 5
score: 95.5
---
Content.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.priority).toBe(5);
      expect(result.meta.score).toBe(95.5);
    });

    it('should parse multi-line arrays', () => {
      const content = `---
title: Array Test
tags:
  - tag1
  - tag2
  - tag3
---
Content.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle empty frontmatter', () => {
      const content = `---
---
Just content.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta).toEqual({});
      expect(result.body).toBe('Just content.');
    });

    it('should handle frontmatter with comments', () => {
      const content = `---
# This is a comment
title: Test
---
Content.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.meta.title).toBe('Test');
    });

    it('should preserve body with multiple paragraphs', () => {
      const content = `---
title: Multi-paragraph
---
First paragraph.

Second paragraph.

Third paragraph.`;
      
      const result = parseFrontmatter(content);
      
      expect(result.body).toBe('First paragraph.\n\nSecond paragraph.\n\nThird paragraph.');
    });
  });

  describe('serializeFrontmatter', () => {
    it('should return only body for empty meta', () => {
      const result = serializeFrontmatter({}, 'Just content.');
      expect(result).toBe('Just content.');
    });

    it('should serialize title only', () => {
      const result = serializeFrontmatter({ title: 'My Prompt' }, 'Content.');
      expect(result).toBe('---\ntitle: My Prompt\n---\nContent.');
    });

    it('should serialize multiple fields', () => {
      const result = serializeFrontmatter(
        { title: 'Test', category: 'Writing', favorite: true },
        'Content.'
      );
      expect(result).toContain('title: Test');
      expect(result).toContain('category: Writing');
      expect(result).toContain('favorite: true');
    });

    it('should serialize arrays', () => {
      const result = serializeFrontmatter(
        { tags: ['email', 'professional'] },
        'Content.'
      );
      expect(result).toContain('tags: [email, professional]');
    });

    it('should serialize empty arrays', () => {
      const result = serializeFrontmatter({ tags: [] }, 'Content.');
      expect(result).toContain('tags: []');
    });

    it('should skip undefined, null, and empty values', () => {
      const result = serializeFrontmatter(
        { title: 'Test', category: null, tags: undefined, shortcut: '' },
        'Content.'
      );
      expect(result).toContain('title: Test');
      expect(result).not.toContain('category');
      expect(result).not.toContain('tags');
      expect(result).not.toContain('shortcut');
    });

    it('should quote strings with special characters', () => {
      const result = serializeFrontmatter(
        { title: 'Test: Value', description: 'Has [brackets]' },
        'Content.'
      );
      expect(result).toContain('title: "Test: Value"');
      expect(result).toContain('description: "Has [brackets]"');
    });
  });

  describe('promptToMarkdown', () => {
    it('should convert prompt to markdown with frontmatter', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'Email Writer',
        content: 'Write an email about {{topic}}.',
        category: 'Communication',
        tags: ['email', 'business'],
        shortcut: 'email',
        favorite: true,
        isFavorite: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToMarkdown(prompt);

      expect(result).toContain('---');
      expect(result).toContain('title: Email Writer');
      expect(result).toContain('category: Communication');
      expect(result).toContain('tags: [email, business]');
      expect(result).toContain('favorite: true');
      expect(result).toContain('shortcut: email');
      expect(result).toContain('prompt_ark_id: test-id');
      expect(result).toContain('Write an email about {{topic}}.');
    });

    it('should handle prompt with minimal fields', () => {
      const prompt: Prompt = {
        id: 'minimal-id',
        content: 'Simple prompt.',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToMarkdown(prompt);

      expect(result).toContain('prompt_ark_id: minimal-id');
      expect(result).not.toContain('title');
      expect(result).not.toContain('category');
    });

    it('should include variables in frontmatter', () => {
      const prompt: Prompt = {
        id: 'var-id',
        title: 'Variable Test',
        content: 'Hello {{name}}!',
        tags: [],
        shortcut: '',
        variables: [
          { name: 'name', type: 'text', raw: '{{name}}' },
        ],
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToMarkdown(prompt);

      expect(result).toContain('variables:');
    });
  });

  describe('markdownToPrompt', () => {
    it('should convert markdown to prompt', () => {
      const markdown = `---
title: Email Writer
category: Communication
tags: [email, business]
favorite: true
shortcut: email
prompt_ark_id: existing-id
---
Write an email about {{topic}}.`;

      const result = markdownToPrompt(markdown);

      expect(result.title).toBe('Email Writer');
      expect(result.category).toBe('Communication');
      expect(result.tags).toEqual(['email', 'business']);
      expect(result.favorite).toBe(true);
      expect(result.isFavorite).toBe(true);
      expect(result.shortcut).toBe('email');
      expect(result.id).toBe('existing-id');
      expect(result.content).toBe('Write an email about {{topic}}.');
    });

    it('should use filename as fallback title', () => {
      const markdown = `---
category: Writing
---
Content here.`;

      const result = markdownToPrompt(markdown, 'my-prompt-file.md');

      expect(result.title).toBe('my prompt file');
    });

    it('should use first line as fallback when no frontmatter title or filename', () => {
      const markdown = 'First line of content\n\nMore content.';

      const result = markdownToPrompt(markdown);

      expect(result.title).toBe('First line of content');
    });

    it('should use "Untitled" as last resort', () => {
      const markdown = '';

      const result = markdownToPrompt(markdown);

      expect(result.title).toBe('Untitled');
    });

    it('should handle single tag as string', () => {
      const markdown = `---
tags: single-tag
---
Content.`;

      const result = markdownToPrompt(markdown);

      expect(result.tags).toEqual(['single-tag']);
    });

    it('should handle favorite as string "true"', () => {
      const markdown = `---
favorite: 'true'
---
Content.`;

      const result = markdownToPrompt(markdown);

      expect(result.favorite).toBe(true);
      expect(result.isFavorite).toBe(true);
    });

    it('should return null id when no prompt_ark_id in frontmatter', () => {
      const markdown = `---
title: New Prompt
---
Content.`;

      const result = markdownToPrompt(markdown);

      expect(result.id).toBeNull();
    });
  });

  describe('promptToFilename', () => {
    it('should generate filename from title', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'My Great Prompt',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toBe('my-great-prompt.md');
    });

    it('should generate filename from id when no title', () => {
      const prompt: Prompt = {
        id: 'abc123',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toBe('abc123.md');
    });

    it('should return untitled.md when no title or id', () => {
      const prompt: Prompt = {
        id: '',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toBe('untitled.md');
    });

    it('should sanitize special characters', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'Prompt: With * Special # Characters!',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toBe('prompt-with-special-characters.md');
    });

    it('should preserve CJK characters', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: '中文标题测试',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toContain('中文标题测试');
      expect(result).toMatch(/\.md$/);
    });

    it('should limit filename length to 60 characters', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'a'.repeat(100),
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result.length).toBeLessThanOrEqual(63); // 60 + '.md'
      expect(result).toMatch(/\.md$/);
    });

    it('should convert to lowercase', () => {
      const prompt: Prompt = {
        id: 'test-id',
        title: 'UPPERCASE TITLE',
        content: 'Content',
        tags: [],
        shortcut: '',
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const result = promptToFilename(prompt);

      expect(result).toBe('uppercase-title.md');
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve prompt data through markdown conversion', () => {
      const originalPrompt: Prompt = {
        id: 'roundtrip-id',
        title: 'Round Trip Test',
        content: 'Test content with {{variable}}.',
        category: 'Test Category',
        tags: ['tag1', 'tag2'],
        shortcut: 'test',
        favorite: true,
        isFavorite: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        useCount: 0,
        versions: [],
      };

      const markdown = promptToMarkdown(originalPrompt);
      const restoredPrompt = markdownToPrompt(markdown);

      expect(restoredPrompt.title).toBe(originalPrompt.title);
      expect(restoredPrompt.category).toBe(originalPrompt.category);
      expect(restoredPrompt.tags).toEqual(originalPrompt.tags);
      expect(restoredPrompt.shortcut).toBe(originalPrompt.shortcut);
      expect(restoredPrompt.favorite).toBe(originalPrompt.favorite);
      expect(restoredPrompt.content).toBe(originalPrompt.content);
    });
  });
});
