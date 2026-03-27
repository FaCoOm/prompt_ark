/**
 * @fileoverview YAML Frontmatter parser/serializer for Obsidian Vault integration.
 * 
 * Handles round-trip conversion between .md files (with YAML frontmatter) and prompt objects.
 * Zero external dependencies — uses simple line-based parsing for the subset of YAML we need.
 * 
 * Supported YAML features:
 * - Strings (quoted and unquoted)
 * - Booleans (true/false)
 * - Numbers (integers and floats)
 * - Arrays (inline [a, b] and multi-line - items)
 * 
 * @module utils/frontmatter
 */

import type { Prompt, VariableDefinition } from '../types';

/**
 * Result of parsing a Markdown file with frontmatter.
 */
export interface ParsedFrontmatter {
  /** Parsed metadata object from YAML frontmatter */
  meta: Record<string, unknown>;
  /** The body content after the frontmatter */
  body: string;
}

/**
 * Parse a Markdown string with YAML frontmatter into { meta, body }.
 * 
 * Supports:
 * - Strings, booleans, numbers
 * - Arrays (both inline [a, b] and multi-line - items)
 * 
 * @param markdown - Full .md file content
 * @returns Object containing parsed metadata and body content
 * 
 * @example
 * ```typescript
 * const { meta, body } = parseFrontmatter(`---
title: My Prompt
tags: [writing, creative]
---
Write about {{topic}}.`);
 * // meta: { title: 'My Prompt', tags: ['writing', 'creative'] }
 * // body: 'Write about {{topic}}.'
 * ```
 */
export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  if (!markdown || typeof markdown !== 'string') {
    return { meta: {}, body: markdown || '' };
  }

  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith('---')) {
    return { meta: {}, body: markdown };
  }

  // Find closing --- (must be on its own line)
  const endIndex = trimmed.indexOf('\n---', 3);
  if (endIndex === -1) {
    return { meta: {}, body: markdown };
  }

  const yamlBlock = trimmed.slice(4, endIndex).trim(); // skip opening ---\n
  // Handle the case where there's no newline after opening ---
  const bodyStart = trimmed.indexOf('---', 3) + 3;
  const body = trimmed.slice(bodyStart).replace(/^\n/, ''); // skip closing ---\n
  const meta = parseSimpleYaml(yamlBlock);
  return { meta, body };
}

/**
 * Serialize meta object + body string back into a full .md file with frontmatter.
 * 
 * @param meta - Frontmatter key-value pairs
 * @param body - Prompt content (Markdown body)
 * @returns Full .md file content
 * 
 * @example
 * ```typescript
 * const markdown = serializeFrontmatter(
 *   { title: 'My Prompt', tags: ['writing'] },
 *   'Write about {{topic}}.'
 * );
 * // Returns: '---\ntitle: My Prompt\ntags: [writing]\n---\nWrite about {{topic}}.'
 * ```
 */
export function serializeFrontmatter(meta: Record<string, unknown>, body: string): string {
  const yamlLines: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null || value === '') continue;
    yamlLines.push(serializeYamlValue(key, value));
  }

  const frontmatter = yamlLines.length > 0
    ? `---\n${yamlLines.join('\n')}\n---\n`
    : '';

  return frontmatter + body;
}

/**
 * Convert a Prompt Ark prompt object to a Markdown string with frontmatter.
 * 
 * Maps prompt fields to YAML frontmatter:
 * - title → title
 * - category → category
 * - tags → tags
 * - favorite → favorite (boolean)
 * - shortcut → shortcut
 * - variables → variables (array)
 * - id → prompt_ark_id
 * 
 * @param prompt - Prompt object from PromptStorage
 * @returns Full .md file content
 * 
 * @example
 * ```typescript
 * const markdown = promptToMarkdown({
 *   id: '123',
 *   title: 'Email Writer',
 *   content: 'Write an email about {{topic}}.',
 *   category: 'Writing',
 *   tags: ['email', 'business'],
 *   favorite: true,
 *   shortcut: 'email'
 * } as Prompt);
 * ```
 */
export function promptToMarkdown(prompt: Prompt): string {
  const meta: Record<string, unknown> = {};
  if (prompt.title) meta.title = prompt.title;
  if (prompt.category) meta.category = prompt.category;
  if (prompt.tags?.length) meta.tags = prompt.tags;
  if (prompt.favorite) meta.favorite = true;
  if (prompt.shortcut) meta.shortcut = prompt.shortcut;
  if (prompt.variables?.length) meta.variables = prompt.variables;
  if (prompt.id) meta.prompt_ark_id = prompt.id;

  return serializeFrontmatter(meta, prompt.content || '');
}

/**
 * Convert a Markdown string (with frontmatter) to a Prompt Ark prompt object.
 * 
 * Derives title from: frontmatter > filename without extension > first line
 * 
 * @param markdown - Full .md file content
 * @param filename - Original filename (used as fallback title)
 * @returns Prompt object compatible with PromptStorage
 * 
 * @example
 * ```typescript
 * const prompt = markdownToPrompt(`---
title: Email Writer
category: Writing
---
Write an email.`, 'email-writer.md');
 * // Returns: { id: null, title: 'Email Writer', category: 'Writing', ... }
 * ```
 */
export function markdownToPrompt(markdown: string, filename = ''): Partial<Prompt> {
  const { meta, body } = parseFrontmatter(markdown);

  // Derive title: frontmatter > filename without extension > first line
  const fallbackTitle = filename
    ? filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ')
    : (body.split('\n')[0] || '').replace(/^#+ /, '').slice(0, 60) || 'Untitled';

  // Parse tags from meta
  let tags: string[] = [];
  if (meta.tags) {
    if (Array.isArray(meta.tags)) {
      tags = meta.tags as string[];
    } else if (typeof meta.tags === 'string') {
      tags = [meta.tags];
    }
  }

  // Parse variables from meta
  let variables: VariableDefinition[] = [];
  if (meta.variables && Array.isArray(meta.variables)) {
    variables = meta.variables as VariableDefinition[];
  }

  // Parse favorite
  const favorite = meta.favorite === true || meta.favorite === 'true';

  return {
    id: (meta.prompt_ark_id as string) || null as unknown as string, // null = new prompt, needs ID assignment
    title: (meta.title as string) || fallbackTitle,
    content: body.trim(),
    category: (meta.category as string) || '',
    tags,
    favorite,
    isFavorite: favorite,
    shortcut: (meta.shortcut as string) || '',
    variables,
  };
}

/**
 * Generate a safe filename from a prompt title.
 * 
 * Sanitization rules:
 * - Converts to lowercase
 * - Replaces special characters with hyphens
 * - Preserves CJK characters (Chinese, Japanese, Korean)
 * - Trims leading/trailing hyphens
 * - Limits to 60 characters
 * 
 * @param prompt - Prompt object with title or id
 * @returns Sanitized filename with .md extension
 * 
 * @example
 * ```typescript
 * promptToFilename({ title: 'My Great Prompt!', id: '123' } as Prompt);
 * // Returns: 'my-great-prompt.md'
 * 
 * promptToFilename({ id: 'abc123' } as Prompt);
 * // Returns: 'abc123.md'
 * ```
 */
export function promptToFilename(prompt: Prompt): string {
  const base = (prompt.title || prompt.id || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+/g, '-') // keep CJK chars
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}.md`;
}

// --- Internal: Simple YAML parser (subset) ---

/**
 * Parse a simple YAML string into a JavaScript object.
 * Supports a subset of YAML: strings, booleans, numbers, arrays.
 * 
 * @param yamlStr - YAML content without delimiters
 * @returns Parsed object
 */
function parseSimpleYaml(yamlStr: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yamlStr.split('\n');
  let currentKey: string | null = null;
  let currentArray: unknown[] | null = null;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;

    // Multi-line array item: "  - value"
    const arrayItemMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayItemMatch && currentKey && currentArray) {
      currentArray.push(parseYamlScalar(arrayItemMatch[1].trim()));
      continue;
    }

    // If we were collecting array items, save them
    if (currentKey && currentArray) {
      result[currentKey] = currentArray;
      currentKey = null;
      currentArray = null;
    }

    // Key-value pair: "key: value" or "key:"
    const kvMatch = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1];
    const rawValue = kvMatch[2].trim();

    if (rawValue === '') {
      // Could be start of a multi-line array
      currentKey = key;
      currentArray = [];
      continue;
    }

    // Inline array: [a, b, c]
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      const inner = rawValue.slice(1, -1);
      result[key] = inner
        ? inner.split(',').map(s => parseYamlScalar(s.trim()))
        : [];
      continue;
    }

    // Scalar value
    result[key] = parseYamlScalar(rawValue);
  }

  // Flush trailing array
  if (currentKey && currentArray) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Parse a single YAML scalar value.
 * 
 * @param str - Raw YAML value string
 * @returns Parsed value (boolean, number, or string)
 */
function parseYamlScalar(str: string): unknown {
  if (str === 'true') return true;
  if (str === 'false') return false;
  if (str === 'null' || str === '~') return null;

  // Quoted string
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }

  // Number (integers and floats)
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }

  return str;
}

/**
 * Serialize a key-value pair to YAML format.
 * 
 * @param key - The property key
 * @param value - The value to serialize
 * @returns YAML line
 */
function serializeYamlValue(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`;
    const items = value.map(v => quoteIfNeeded(String(v)));
    return `${key}: [${items.join(', ')}]`;
  }
  if (typeof value === 'boolean') return `${key}: ${value}`;
  if (typeof value === 'number') return `${key}: ${value}`;
  return `${key}: ${quoteIfNeeded(String(value))}`;
}

/**
 * Quote a string if it contains YAML-special characters.
 * 
 * @param str - The string to quote
 * @returns Quoted string if needed
 */
function quoteIfNeeded(str: string): string {
  // Quote strings that contain YAML-special characters
  if (/[:{}\[\],&#*?|>!%@`]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
