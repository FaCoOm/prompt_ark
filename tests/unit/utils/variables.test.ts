import { describe, it, expect } from 'vitest';
import { extractVariables, parseVariableSpec } from '@/shared/utils/variables';

describe('variables', () => {
  describe('parseVariableSpec', () => {
    it('should parse simple variable', () => {
      const result = parseVariableSpec('name');
      expect(result.name).toBe('name');
      expect(result.type).toBe('text');
    });

    it('should parse enum variable', () => {
      const result = parseVariableSpec('lang:EN|ZH|JP');
      expect(result.name).toBe('lang');
      expect(result.type).toBe('enum');
      expect(result.options).toEqual(['EN', 'ZH', 'JP']);
    });

    it('should parse context variable', () => {
      const result = parseVariableSpec('@page_title');
      expect(result.type).toBe('context');
    });
  });

  describe('extractVariables', () => {
    it('should extract double bracket variables', () => {
      const content = 'Hello {{name}}, welcome to {{place}}';
      const result = extractVariables(content);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('name');
      expect(result[1].name).toBe('place');
    });

    it('should deduplicate variables', () => {
      const content = 'Hello {{name}} and {{name}}';
      const result = extractVariables(content);
      expect(result).toHaveLength(1);
    });
  });
});
