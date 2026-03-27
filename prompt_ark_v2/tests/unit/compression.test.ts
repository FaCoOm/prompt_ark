/**
 * @fileoverview Unit tests for compression utilities.
 * 
 * Tests for:
 * - compress(): String compression using LZ-String
 * - decompress(): Decompression of LZ-String data
 * - isCompressed(): Detection of compressed data format
 */

import { describe, it, expect } from 'vitest';
import { compress, decompress, isCompressed } from '../../src/utils/compression';

describe('compression', () => {
  describe('compress', () => {
    it('should compress a simple string', () => {
      const input = 'Hello World';
      const compressed = compress(input);
      
      expect(compressed).toBeDefined();
      expect(typeof compressed).toBe('string');
      expect(compressed.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty input', () => {
      expect(compress('')).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(compress(null as unknown as string)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(compress(undefined as unknown as string)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(compress(123 as unknown as string)).toBe('');
      expect(compress({} as unknown as string)).toBe('');
      expect(compress([] as unknown as string)).toBe('');
    });

    it('should compress longer text efficiently', () => {
      const input = 'This is a test string that will be compressed using LZ-String. '.repeat(10);
      const compressed = compress(input);
      
      expect(compressed.length).toBeLessThan(input.length);
    });

    it('should compress JSON data', () => {
      const input = JSON.stringify({
        name: 'Test',
        items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
      });
      const compressed = compress(input);
      
      expect(compressed).toBeDefined();
      expect(compressed.length).toBeGreaterThan(0);
    });
  });

  describe('decompress', () => {
    it('should decompress compressed data correctly', () => {
      const original = 'Hello World';
      const compressed = compress(original);
      const decompressed = decompress(compressed);
      
      expect(decompressed).toBe(original);
    });

    it('should decompress longer text correctly', () => {
      const original = 'The quick brown fox jumps over the lazy dog. '.repeat(50);
      const compressed = compress(original);
      const decompressed = decompress(compressed);
      
      expect(decompressed).toBe(original);
    });

    it('should return empty string for empty input', () => {
      expect(decompress('')).toBe('');
    });

    it('should return empty string for null input', () => {
      expect(decompress(null as unknown as string)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(decompress(undefined as unknown as string)).toBe('');
    });

    it('should return empty string for invalid compressed data', () => {
      expect(decompress('not-valid-compressed-data')).toBe('');
    });

    it('should return empty string for plain text', () => {
      expect(decompress('Hello World')).toBe('');
    });

    it('should handle special characters', () => {
      const original = 'Hello\nWorld\t!@#$%^&*()_+{}|:<>?~`-=[]\\;\",./\'';
      const compressed = compress(original);
      const decompressed = decompress(compressed);
      
      expect(decompressed).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = 'Hello 世界 🌍 Ñoño café résumé';
      const compressed = compress(original);
      const decompressed = decompress(compressed);
      
      expect(decompressed).toBe(original);
    });
  });

  describe('isCompressed', () => {
    it('should return true for compressed data', () => {
      const compressed = compress('Hello World');
      expect(isCompressed(compressed)).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isCompressed('Hello World')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCompressed('')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(isCompressed(null as unknown as string)).toBe(false);
    });

    it('should return false for undefined input', () => {
      expect(isCompressed(undefined as unknown as string)).toBe(false);
    });

    it('should return false for very short strings', () => {
      expect(isCompressed('a')).toBe(false);
      expect(isCompressed('ab')).toBe(false);
    });

    it('should return false for random invalid data', () => {
      expect(isCompressed('!!!@@@###$$$')).toBe(false);
    });

    it('should correctly identify compressed JSON', () => {
      const json = JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } });
      const compressed = compress(json);
      
      expect(isCompressed(compressed)).toBe(true);
      expect(isCompressed(json)).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('should handle compress -> decompress round-trip for various inputs', () => {
      const testCases = [
        'Simple text',
        'Text with\nnewlines\nand\ttabs',
        '',
        'Unicode: 中文日本語한국어',
        JSON.stringify({ test: 'data', number: 42 }),
        'x'.repeat(1000),
        'Special chars: !@#$%^&*()_+-=[]{}|;\':",./<>?',
      ];

      for (const input of testCases) {
        const compressed = compress(input);
        const decompressed = decompress(compressed);
        expect(decompressed).toBe(input);
      }
    });
  });
});
