/**
 * @fileoverview Data compression utilities using LZ-String.
 *
 * Provides compression/decompression for sync data to reduce storage size.
 * Uses LZString.compressToUTF16 and decompressFromUTF16 for optimal
 * compression ratio and UTF-16 storage compatibility.
 *
 * Features:
 * - Efficient string compression using LZ-String algorithm
 * - UTF-16 encoding for browser storage compatibility
 * - Detection of compressed data format
 * - Graceful handling of empty/invalid input
 *
 * @module utils/compression
 */

import LZString from 'lz-string';

/**
 * Compress a string using LZ-String algorithm.
 *
 * Uses compressToUTF16 for optimal browser storage compatibility.
 * Returns empty string for empty/null/undefined input.
 *
 * @param data - The string to compress
 * @returns Compressed string in UTF-16 format
 *
 * @example
 * ```typescript
 * const compressed = compress('Hello World');
 * // Returns: 'က崊䀀ൄ軋 世爮'
 * ```
 */
export function compress(data: string): string {
  if (!data || typeof data !== 'string') {
    return '';
  }
  return LZString.compressToUTF16(data);
}

/**
 * Check if data contains high Unicode characters (typical of compressed UTF-16).
 */
function hasHighUnicode(data: string): boolean {
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    if (data.charCodeAt(i) > 127) {
      return true;
    }
  }
  return false;
}

/**
 * Decompress a LZ-String compressed string.
 *
 * Expects data compressed with compressToUTF16.
 * Returns empty string for empty/null/undefined input or on failure.
 *
 * @param compressed - The compressed string to decompress
 * @returns Original decompressed string, or empty string on failure
 *
 * @example
 * ```typescript
 * const original = decompress('က崊䀀ൄ軋 世爮');
 * // Returns: 'Hello World'
 * ```
 */
export function decompress(data: string): string {
  if (!data || typeof data !== 'string') {
    return '';
  }
  if (!isCompressed(data)) {
    return '';
  }
  try {
    const result = LZString.decompressFromUTF16(data);
    return result === null ? '' : result;
  } catch (e) {
    console.warn('[compression] Decompression failed:', (e as Error).message);
    return '';
  }
}

/**
 * Detect if a string is LZ-String compressed data.
 *
 * Compressed UTF-16 data contains high Unicode characters.
 * Plain ASCII text won't have these characters.
 *
 * @param data - The string to check
 * @returns True if the data appears to be compressed
 *
 * @example
 * ```typescript
 * isCompressed('Hello World'); // false (plain text)
 * isCompressed('က崊䀀ൄ軋 世爮'); // true (compressed)
 * ```
 */
export function isCompressed(data: string): boolean {
  if (!data || typeof data !== 'string') {
    return false;
  }

  if (data.length < 2) {
    return false;
  }

  if (!hasHighUnicode(data)) {
    return false;
  }

  try {
    const decompressed = LZString.decompressFromUTF16(data);
    return decompressed !== null && decompressed !== data;
  } catch {
    return false;
  }
}
