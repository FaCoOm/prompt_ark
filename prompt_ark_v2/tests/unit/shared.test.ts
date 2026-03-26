import { describe, it, expect, beforeEach } from 'vitest';
import { VariableResolver } from '../../src/shared/variables';
import { TextAnalyzer } from '../../src/shared/text-analysis';
import { DataMigrator } from '../../src/shared/migration';
import type { V1Prompt } from '../../src/shared/migration';

describe('VariableResolver', () => {
  it('should extract simple variables', () => {
    const content = 'Hello {{name}}';
    const variables = VariableResolver.extractVariables(content);
    expect(variables).toHaveLength(1);
    expect(variables[0].name).toBe('name');
    expect(variables[0].type).toBe('text');
  });

  it('should extract enum variables', () => {
    const content = 'Language: {{lang:EN|ZH|JP}}';
    const variables = VariableResolver.extractVariables(content);
    expect(variables).toHaveLength(1);
    expect(variables[0].type).toBe('enum');
    expect(variables[0].options).toEqual(['EN', 'ZH', 'JP']);
  });

  it('should extract default variables', () => {
    const content = 'Style: {{style:formal}}';
    const variables = VariableResolver.extractVariables(content);
    expect(variables).toHaveLength(1);
    expect(variables[0].type).toBe('default');
    expect(variables[0].defaultValue).toBe('formal');
  });

  it('should fill variables correctly', () => {
    const content = 'Hello {{name}}';
    const filled = VariableResolver.fillVariables(content, { name: 'World' });
    expect(filled).toBe('Hello World');
  });
});

describe('TextAnalyzer', () => {
  it('should analyze text correctly', () => {
    const text = 'Hello world this is a test';
    const analysis = TextAnalyzer.analyze(text);
    expect(analysis.wordCount).toBe(6);
    expect(analysis.charCount).toBe(26);
  });

  it('should detect Chinese language', () => {
    const text = '你好世界';
    const lang = TextAnalyzer.detectLanguage(text);
    expect(lang).toBe('zh');
  });

  it('should detect English language', () => {
    const text = 'Hello world';
    const lang = TextAnalyzer.detectLanguage(text);
    expect(lang).toBe('en');
  });
});

describe('DataMigrator', () => {
  it('should migrate v1 prompt correctly', () => {
    const v1Prompt: V1Prompt = {
      id: 'test-id',
      title: 'Test',
      content: 'Content',
      category: 'General',
      tags: 'tag1, tag2',
      shortcut: 'test',
      createdAt: 1234567890,
      updatedAt: 1234567890,
      useCount: 5,
      isFavorite: true,
    };

    const migrated = DataMigrator.migratePrompt(v1Prompt);
    expect(migrated.id).toBe(v1Prompt.id);
    expect(migrated.tags).toEqual(['tag1', 'tag2']);
    expect(migrated.language).toBe('en');
    expect(migrated.versions).toEqual([]);
  });

  it('should handle empty tags', () => {
    const v1Prompt: V1Prompt = {
      id: 'test-id',
      title: 'Test',
      content: 'Content',
      category: 'General',
      tags: '',
      shortcut: '',
      createdAt: 1234567890,
      updatedAt: 1234567890,
      useCount: 0,
      isFavorite: false,
    };

    const migrated = DataMigrator.migratePrompt(v1Prompt);
    expect(migrated.tags).toEqual([]);
  });

  it('should validate prompt correctly', () => {
    const validPrompt = {
      id: '1',
      title: 'Test',
      content: 'Content',
    } as unknown as import('../../src/types').Prompt;
    expect(DataMigrator.validatePrompt(validPrompt)).toBe(true);

    const invalidPrompt = {
      id: '1',
      title: '',
      content: '',
    } as unknown as import('../../src/types').Prompt;
    expect(DataMigrator.validatePrompt(invalidPrompt)).toBe(false);
  });
});
