/**
 * @fileoverview Frontmatter parser service for importing Obsidian-compatible Markdown files
 * 
 * Re-exports and extends utils/frontmatter.ts for use as a parser service.
 * Wraps frontmatter utilities to conform to the Parser interface.
 */

import {
  serializeFrontmatter as serializeFm,
  promptToMarkdown as p2m,
  markdownToPrompt as m2p,
  promptToFilename as p2f,
  type ParsedFrontmatter,
} from '../../utils/frontmatter';
import type { Prompt } from '../../types';
import type { ParsedPrompt } from './types';

export type { ParsedFrontmatter };

export {
  serializeFm as serializeFrontmatter,
  p2m as promptToMarkdown,
  p2f as promptToFilename,
};

/**
 * Parse Markdown with YAML frontmatter into a ParsedPrompt
 * Wraps the utility function to return the parser service format
 */
export function parseFrontmatterToPrompt(
  markdown: string,
  filename = ''
): ParsedPrompt | null {
  const prompt = m2p(markdown, filename);

  if (!prompt.content) return null;

  return {
    act: prompt.title || filename.replace(/\.md$/i, '') || 'Untitled',
    prompt: prompt.content,
    category: prompt.category,
    tags: prompt.tags,
    shortcut: prompt.shortcut,
    favorite: prompt.favorite,
    variables: prompt.variables,
  };
}

/**
 * Parse frontmatter content (wrapper for Parser interface compatibility)
 */
export function parseFrontmatter(content: string, filename = ''): ParsedPrompt[] {
  const prompt = parseFrontmatterToPrompt(content, filename);
  return prompt ? [prompt] : [];
}

/**
 * Convert ParsedPrompt to full Prompt object with defaults
 */
export function parsedPromptToFullPrompt(
  parsed: ParsedPrompt,
  id?: string
): Prompt {
  const now = Date.now();
  return {
    id: id || crypto.randomUUID(),
    title: parsed.act,
    content: parsed.prompt,
    category: parsed.category || '',
    tags: parsed.tags || [],
    shortcut: parsed.shortcut || '',
    variables: parsed.variables || [],
    isFavorite: parsed.favorite || false,
    favorite: parsed.favorite || false,
    createdAt: now,
    updatedAt: now,
    versions: [],
    useCount: 0,
  };
}

/**
 * Check if content has YAML frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trimStart();
  return trimmed.startsWith('---');
}
