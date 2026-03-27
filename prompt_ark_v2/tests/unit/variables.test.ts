/**
 * Unit tests for VariableResolver class
 * Tests variable parsing, extraction, and replacement functionality
 */

import { describe, it, expect } from 'vitest';
import {
  VariableResolver,
  parseVariableSpec,
  extractVariables,
  extractContextVariables,
  fillVariables,
  fillContextVariables,
  hasVariables,
  hasContextVariables,
} from '../../src/core/variables';

describe('VariableResolver', () => {
  describe('parseVariableSpec', () => {
    it('should parse plain text variable', () => {
      const spec = VariableResolver.parseVariableSpec('name');
      expect(spec).toEqual({
        name: 'name',
        type: 'text',
        default: null,
        raw: 'name',
      });
    });

    it('should parse variable with default value', () => {
      const spec = VariableResolver.parseVariableSpec('name:defaultValue');
      expect(spec).toEqual({
        name: 'name',
        type: 'default',
        default: 'defaultValue',
        raw: 'name:defaultValue',
      });
    });

    it('should parse enum variable with options', () => {
      const spec = VariableResolver.parseVariableSpec('color:red|green|blue');
      expect(spec).toEqual({
        name: 'color',
        type: 'enum',
        options: ['red', 'green', 'blue'],
        default: 'red',
        raw: 'color:red|green|blue',
      });
    });

    it('should parse context variable', () => {
      const spec = VariableResolver.parseVariableSpec('@page_title');
      expect(spec).toEqual({
        name: '@page_title',
        type: 'context',
        raw: '@page_title',
      });
    });

    it('should handle variable name with spaces', () => {
      const spec = VariableResolver.parseVariableSpec('  name  ');
      expect(spec.name).toBe('name');
    });

    it('should handle default value with spaces', () => {
      const spec = VariableResolver.parseVariableSpec('greeting: Hello World');
      expect(spec).toEqual({
        name: 'greeting',
        type: 'default',
        default: 'Hello World',
        raw: 'greeting: Hello World',
      });
    });

    it('should handle enum with spaced options', () => {
      const spec = VariableResolver.parseVariableSpec('lang: EN | ZH | JP');
      expect(spec).toEqual({
        name: 'lang',
        type: 'enum',
        options: ['EN', 'ZH', 'JP'],
        default: 'EN',
        raw: 'lang: EN | ZH | JP',
      });
    });

    it('should treat single option after colon as default, not enum', () => {
      const spec = VariableResolver.parseVariableSpec('name:single');
      expect(spec.type).toBe('default');
      expect(spec.default).toBe('single');
    });

    it('should treat empty value after colon as plain text', () => {
      const spec = VariableResolver.parseVariableSpec('name:');
      expect(spec.type).toBe('text');
      expect(spec.default).toBeNull();
    });

    it('should parse all supported context variables', () => {
      const contextVars = ['@page_title', '@page_url', '@selection', '@date', '@clipboard', '@page_text', '@lang'];
      for (const varName of contextVars) {
        const spec = VariableResolver.parseVariableSpec(varName);
        expect(spec.type).toBe('context');
        expect(spec.name).toBe(varName);
      }
    });
  });

  describe('extractVariables', () => {
    it('should extract single variable', () => {
      const specs = VariableResolver.extractVariables('Hello {{name}}');
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        name: 'name',
        type: 'text',
      });
    });

    it('should extract multiple variables', () => {
      const specs = VariableResolver.extractVariables('{{greeting}} {{name}}!');
      expect(specs).toHaveLength(2);
      expect(specs[0].name).toBe('greeting');
      expect(specs[1].name).toBe('name');
    });

    it('should extract default variables', () => {
      const specs = VariableResolver.extractVariables('{{topic:AI}}');
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        name: 'topic',
        type: 'default',
        default: 'AI',
      });
    });

    it('should extract enum variables', () => {
      const specs = VariableResolver.extractVariables('{{style:formal|casual}}');
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        name: 'style',
        type: 'enum',
        options: ['formal', 'casual'],
        default: 'formal',
      });
    });

    it('should deduplicate repeated variables', () => {
      const specs = VariableResolver.extractVariables('{{name}} and {{name}}');
      expect(specs).toHaveLength(1);
      expect(specs[0].name).toBe('name');
    });

    it('should not extract context variables', () => {
      const specs = VariableResolver.extractVariables('{{@page_title}}');
      expect(specs).toHaveLength(0);
    });

    it('should handle mixed variables', () => {
      const specs = VariableResolver.extractVariables('{{name}} at {{@page_url}} using {{tool}}');
      expect(specs).toHaveLength(2);
      expect(specs.map(s => s.name)).toContain('name');
      expect(specs.map(s => s.name)).toContain('tool');
      expect(specs.map(s => s.name)).not.toContain('@page_url');
    });

    it('should return empty array for content without variables', () => {
      const specs = VariableResolver.extractVariables('Hello world');
      expect(specs).toEqual([]);
    });

    it('should handle variables with special characters in content', () => {
      const specs = VariableResolver.extractVariables('{{name:opt1|opt2}} and {{simple}}');
      expect(specs).toHaveLength(2);
      expect(specs[0].type).toBe('enum');
      expect(specs[1].type).toBe('text');
    });
  });

  describe('extractContextVariables', () => {
    it('should extract single context variable', () => {
      const specs = VariableResolver.extractContextVariables('Page: {{@page_title}}');
      expect(specs).toHaveLength(1);
      expect(specs[0]).toMatchObject({
        name: '@page_title',
        type: 'context',
      });
    });

    it('should extract multiple context variables', () => {
      const specs = VariableResolver.extractContextVariables('{{@page_title}} at {{@page_url}}');
      expect(specs).toHaveLength(2);
      expect(specs[0].name).toBe('@page_title');
      expect(specs[1].name).toBe('@page_url');
    });

    it('should deduplicate repeated context variables', () => {
      const specs = VariableResolver.extractContextVariables('{{@page_title}} and {{@page_title}}');
      expect(specs).toHaveLength(1);
    });

    it('should not extract regular variables', () => {
      const specs = VariableResolver.extractContextVariables('Hello {{name}}');
      expect(specs).toHaveLength(0);
    });

    it('should handle mixed variables', () => {
      const specs = VariableResolver.extractContextVariables('{{name}} at {{@page_url}}');
      expect(specs).toHaveLength(1);
      expect(specs[0].name).toBe('@page_url');
    });

    it('should extract all supported context variables', () => {
      const content = '{{@page_title}} {{@page_url}} {{@selection}} {{@date}} {{@clipboard}}';
      const specs = VariableResolver.extractContextVariables(content);
      expect(specs).toHaveLength(5);
    });

    it('should return empty array for content without context variables', () => {
      const specs = VariableResolver.extractContextVariables('Hello {{name}}');
      expect(specs).toEqual([]);
    });
  });

  describe('fillVariables', () => {
    it('should replace single variable', () => {
      const result = VariableResolver.fillVariables('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should replace multiple variables', () => {
      const result = VariableResolver.fillVariables('{{greeting}} {{name}}!', {
        greeting: 'Hi',
        name: 'Alice',
      });
      expect(result).toBe('Hi Alice!');
    });

    it('should replace repeated variables', () => {
      const result = VariableResolver.fillVariables('{{name}} and {{name}}', { name: 'Bob' });
      expect(result).toBe('Bob and Bob');
    });

    it('should handle default variables', () => {
      const result = VariableResolver.fillVariables('Topic: {{topic:AI}}', { topic: 'ML' });
      expect(result).toBe('Topic: ML');
    });

    it('should handle enum variables', () => {
      const result = VariableResolver.fillVariables('Style: {{style:formal|casual}}', {
        style: 'casual',
      });
      expect(result).toBe('Style: casual');
    });

    it('should use empty string for missing values', () => {
      const result = VariableResolver.fillVariables('Hello {{name}}', {});
      expect(result).toBe('Hello ');
    });

    it('should not affect context variables', () => {
      const result = VariableResolver.fillVariables('{{@page_title}} and {{name}}', {
        name: 'Test',
      });
      expect(result).toBe('{{@page_title}} and Test');
    });

    it('should handle empty content', () => {
      const result = VariableResolver.fillVariables('', { name: 'Test' });
      expect(result).toBe('');
    });

    it('should handle content without variables', () => {
      const result = VariableResolver.fillVariables('Hello world', { name: 'Test' });
      expect(result).toBe('Hello world');
    });
  });

  describe('fillContextVariables', () => {
    it('should replace single context variable', () => {
      const result = VariableResolver.fillContextVariables('Page: {{@page_title}}', {
        '@page_title': 'Google',
      });
      expect(result).toBe('Page: Google');
    });

    it('should replace multiple context variables', () => {
      const result = VariableResolver.fillContextVariables('{{@page_title}} at {{@page_url}}', {
        '@page_title': 'Example',
        '@page_url': 'https://example.com',
      });
      expect(result).toBe('Example at https://example.com');
    });

    it('should replace repeated context variables', () => {
      const result = VariableResolver.fillContextVariables('{{@date}} and {{@date}}', {
        '@date': '2024-01-15',
      });
      expect(result).toBe('2024-01-15 and 2024-01-15');
    });

    it('should use empty string for missing context values', () => {
      const result = VariableResolver.fillContextVariables('Page: {{@page_title}}', {});
      expect(result).toBe('Page: ');
    });

    it('should not affect regular variables', () => {
      const result = VariableResolver.fillContextVariables('{{name}} at {{@page_url}}', {
        '@page_url': 'https://test.com',
      });
      expect(result).toBe('{{name}} at https://test.com');
    });

    it('should handle all supported context variables', () => {
      const content = '{{@page_title}} {{@page_url}} {{@selection}} {{@date}} {{@clipboard}} {{@page_text}} {{@lang}}';
      const context = {
        '@page_title': 'Title',
        '@page_url': 'URL',
        '@selection': 'Selection',
        '@date': 'Date',
        '@clipboard': 'Clipboard',
        '@page_text': 'Text',
        '@lang': 'en',
      };
      const result = VariableResolver.fillContextVariables(content, context);
      expect(result).toBe('Title URL Selection Date Clipboard Text en');
    });

    it('should handle empty content', () => {
      const result = VariableResolver.fillContextVariables('', { '@page_title': 'Test' });
      expect(result).toBe('');
    });
  });

  describe('hasVariables', () => {
    it('should return true for regular variables', () => {
      expect(VariableResolver.hasVariables('Hello {{name}}')).toBe(true);
    });

    it('should return true for default variables', () => {
      expect(VariableResolver.hasVariables('{{topic:AI}}')).toBe(true);
    });

    it('should return true for enum variables', () => {
      expect(VariableResolver.hasVariables('{{style:a|b}}')).toBe(true);
    });

    it('should return false for context variables only', () => {
      expect(VariableResolver.hasVariables('{{@page_title}}')).toBe(false);
    });

    it('should return true when mixed with context variables', () => {
      expect(VariableResolver.hasVariables('{{name}} at {{@page_url}}')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(VariableResolver.hasVariables('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(VariableResolver.hasVariables('')).toBe(false);
    });

    it('should return false for malformed brackets', () => {
      expect(VariableResolver.hasVariables('{{}')).toBe(false);
    });
  });

  describe('hasContextVariables', () => {
    it('should return true for context variables', () => {
      expect(VariableResolver.hasContextVariables('{{@page_title}}')).toBe(true);
    });

    it('should return true for multiple context variables', () => {
      expect(VariableResolver.hasContextVariables('{{@page_title}} {{@page_url}}')).toBe(true);
    });

    it('should return false for regular variables only', () => {
      expect(VariableResolver.hasContextVariables('{{name}}')).toBe(false);
    });

    it('should return true when mixed with regular variables', () => {
      expect(VariableResolver.hasContextVariables('{{name}} at {{@page_url}}')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(VariableResolver.hasContextVariables('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(VariableResolver.hasContextVariables('')).toBe(false);
    });
  });

  describe('hasAnyVariables', () => {
    it('should return true for regular variables', () => {
      expect(VariableResolver.hasAnyVariables('{{name}}')).toBe(true);
    });

    it('should return true for context variables', () => {
      expect(VariableResolver.hasAnyVariables('{{@page_title}}')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(VariableResolver.hasAnyVariables('Hello world')).toBe(false);
    });
  });

  describe('getAllVariableNames', () => {
    it('should return all variable names', () => {
      const names = VariableResolver.getAllVariableNames('{{name}} at {{@page_url}}');
      expect(names).toContain('name');
      expect(names).toContain('@page_url');
    });

    it('should deduplicate variable names', () => {
      const names = VariableResolver.getAllVariableNames('{{name}} and {{name}}');
      expect(names).toEqual(['name']);
    });

    it('should return empty array for no variables', () => {
      const names = VariableResolver.getAllVariableNames('Hello world');
      expect(names).toEqual([]);
    });
  });
});

describe('Legacy function exports', () => {
  it('parseVariableSpec should work as standalone function', () => {
    const spec = parseVariableSpec('name:value');
    expect(spec.type).toBe('default');
  });

  it('extractVariables should work as standalone function', () => {
    const specs = extractVariables('{{name}}');
    expect(specs).toHaveLength(1);
  });

  it('extractContextVariables should work as standalone function', () => {
    const specs = extractContextVariables('{{@page_title}}');
    expect(specs).toHaveLength(1);
  });

  it('fillVariables should work as standalone function', () => {
    const result = fillVariables('{{name}}', { name: 'Test' });
    expect(result).toBe('Test');
  });

  it('fillContextVariables should work as standalone function', () => {
    const result = fillContextVariables('{{@page_title}}', { '@page_title': 'Test' });
    expect(result).toBe('Test');
  });

  it('hasVariables should work as standalone function', () => {
    expect(hasVariables('{{name}}')).toBe(true);
  });

  it('hasContextVariables should work as standalone function', () => {
    expect(hasContextVariables('{{@page_title}}')).toBe(true);
  });
});
