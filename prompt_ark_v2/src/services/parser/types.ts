/**
 * @fileoverview Parser type definitions for v2 import service
 * 
 * Based on v1 parsers.js and frontmatter.js
 * Defines the structure for parsed prompt data and parser interfaces
 */

import type { VariableDefinition } from '../../types';

/**
 * Result of parsing a prompt from various import formats
 * This is the unified output format for all parsers
 */
export interface ParsedPrompt {
  /** Display title/act of the prompt */
  act: string;
  /** The prompt content/text */
  prompt: string;
  /** Category for organization */
  category?: string;
  /** Tags for filtering */
  tags?: string[];
  /** Shortcut keyword for slash expansion */
  shortcut?: string;
  /** Whether marked as favorite */
  favorite?: boolean;
  /** Variable definitions */
  variables?: VariableDefinition[];
}

/**
 * Supported import formats for auto-detection
 */
export type ImportFormat = 'json' | 'csv' | 'markdown-table' | 'markdown-headings' | 'frontmatter' | 'unknown';

/**
 * Options for parsing content
 */
export interface ParseOptions {
  /** Optional filename to help with type detection */
  filename?: string;
  /** Expected format (if known) - skips auto-detection */
  format?: ImportFormat;
  /** Whether to be strict about parsing errors */
  strict?: boolean;
}

/**
 * Result of a parse operation
 */
export interface ParseResult {
  /** Successfully parsed prompts */
  prompts: ParsedPrompt[];
  /** Detected format */
  format: ImportFormat;
  /** Any warnings or errors during parsing */
  errors?: string[];
}

/**
 * Parser interface for implementing custom parsers
 */
export interface Parser {
  /** Unique parser identifier */
  readonly name: string;
  /** File extensions this parser supports */
  readonly extensions: string[];
  /** 
   * Check if this parser can handle the content
   * @param content - Raw content to check
   * @param filename - Optional filename hint
   */
  canParse(content: string, filename?: string): boolean;
  /**
   * Parse the content into parsed prompts
   * @param content - Raw content to parse
   * @returns Array of parsed prompts
   */
  parse(content: string): ParsedPrompt[];
}

/**
 * JSON import formats supported
 */
export type JsonFormat = 
  | 'prompt-ark'      // Native Prompt Ark format: { format: "prompt-ark", prompts: [...] }
  | 'array'           // Array of prompt objects
  | 'object'          // Object with key-value pairs
  | 'chatgpt-prompts' // ChatGPT prompts format
  | 'unknown';

/**
 * Raw JSON data structures that can be imported
 */
export interface PromptArkJsonFormat {
  format: 'prompt-ark';
  prompts: Array<{
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    variables?: VariableDefinition[];
    shortcut?: string;
  }>;
}

/**
 * Legacy prompt object format (from various sources)
 */
export interface LegacyPromptObject {
  act?: string;
  title?: string;
  cmd?: string;
  name?: string;
  prompt?: string;
  content?: string;
  text?: string;
  category?: string;
  tags?: string[];
  shortcut?: string;
  favorite?: boolean;
  variables?: VariableDefinition[];
}
