import type {
  ParsedPrompt,
  ParseOptions,
  ParseResult,
  ImportFormat,
  Parser,
} from './types';
import { parseJson } from './json';
import { parseCsv } from './csv';
import { parseMarkdownTable, parseMarkdownHeadings } from './markdown';
import { parseFrontmatter, hasFrontmatter } from './frontmatter';

/**
 * Main PromptParser class for auto-detecting and parsing various import formats
 * 
 * Supports:
 * - JSON: Prompt Ark native, array, and object formats
 * - CSV: Standard CSV with header detection
 * - Markdown Table: | delimited tables with headers
 * - Markdown Headings: # heading based structure
 * - YAML Frontmatter: Obsidian-compatible Markdown files
 */
export class PromptParser implements Parser {
  readonly name = 'PromptParser';
  readonly extensions = ['.json', '.csv', '.md', '.txt'];

  /**
   * Main parse method with auto-format detection
   * Tries parsers in order: JSON → CSV → Markdown Table → Markdown Headings
   */
  static parse(content: string, filename = ''): ParsedPrompt[] {
    if (!content) return [];

    const options: ParseOptions = { filename };
    const result = this.parseWithResult(content, options);
    return result.prompts;
  }

  /**
   * Parse with full result including detected format
   */
  static parseWithResult(content: string, options: ParseOptions = {}): ParseResult {
    if (!content) {
      return { prompts: [], format: 'unknown' };
    }

    const { filename = '', format } = options;

    // If format is specified, use it directly
    if (format) {
      return this.parseWithFormat(content, format);
    }

    // Try auto-detection
    return this.autoDetectAndParse(content, filename);
  }

  /**
   * Auto-detect format and parse
   */
  private static autoDetectAndParse(
    content: string,
    filename: string
  ): ParseResult {
    const errors: string[] = [];

    // 1. Try JSON
    try {
      const json = JSON.parse(content);
      const prompts = parseJson(json);
      if (prompts.length > 0) {
        return { prompts, format: 'json' };
      }
    } catch {
      // Not JSON, continue
    }

    // 2. Try CSV
    const firstLine = content.split('\n')[0].toLowerCase();
    if (
      firstLine.includes(',') &&
      (firstLine.includes('act') ||
        firstLine.includes('prompt') ||
        firstLine.includes('cmd'))
    ) {
      try {
        const prompts = parseCsv(content);
        if (prompts.length > 0) {
          return { prompts, format: 'csv' };
        }
      } catch (e) {
        errors.push(`CSV parse error: ${e}`);
      }
    }

    // 3. Try Markdown Table
    if (content.includes('|') && (content.includes('---') || content.includes(':---'))) {
      try {
        const prompts = parseMarkdownTable(content);
        if (prompts.length > 0) {
          return { prompts, format: 'markdown-table' };
        }
      } catch (e) {
        errors.push(`Markdown table parse error: ${e}`);
      }
    }

    // 4. Try YAML Frontmatter (for .md files)
    if (hasFrontmatter(content) || filename.endsWith('.md')) {
      try {
        const prompts = parseFrontmatter(content, filename);
        if (prompts.length > 0) {
          return { prompts, format: 'frontmatter' };
        }
      } catch (e) {
        errors.push(`Frontmatter parse error: ${e}`);
      }
    }

    // 5. Try Markdown Headings (last resort for structured text)
    if (content.includes('# ')) {
      try {
        const prompts = parseMarkdownHeadings(content);
        if (prompts.length > 0) {
          return { prompts, format: 'markdown-headings' };
        }
      } catch (e) {
        errors.push(`Markdown headings parse error: ${e}`);
      }
    }

    return { prompts: [], format: 'unknown', errors };
  }

  /**
   * Parse with a specific format
   */
  private static parseWithFormat(
    content: string,
    format: ImportFormat
  ): ParseResult {
    try {
      switch (format) {
        case 'json':
          return {
            prompts: parseJson(JSON.parse(content)),
            format: 'json',
          };
        case 'csv':
          return { prompts: parseCsv(content), format: 'csv' };
        case 'markdown-table':
          return {
            prompts: parseMarkdownTable(content),
            format: 'markdown-table',
          };
        case 'markdown-headings':
          return {
            prompts: parseMarkdownHeadings(content),
            format: 'markdown-headings',
          };
        case 'frontmatter':
          return { prompts: parseFrontmatter(content), format: 'frontmatter' };
        default:
          return { prompts: [], format: 'unknown' };
      }
    } catch (e) {
      return {
        prompts: [],
        format: 'unknown',
        errors: [`${format} parse error: ${e}`],
      };
    }
  }

  /**
   * Check if this parser can handle the content
   */
  canParse(content: string, _filename?: string): boolean {
    if (!content) return false;

    // Try JSON
    try {
      const json = JSON.parse(content);
      const prompts = parseJson(json);
      if (prompts.length > 0) return true;
    } catch {
      // Not JSON
    }

    // Try CSV
    const firstLine = content.split('\n')[0].toLowerCase();
    if (
      firstLine.includes(',') &&
      (firstLine.includes('act') || firstLine.includes('prompt'))
    ) {
      return true;
    }

    // Try Markdown
    if (content.includes('|') && content.includes('---')) return true;
    if (content.includes('# ')) return true;
    if (hasFrontmatter(content)) return true;

    return false;
  }

  /**
   * Parse content into prompts
   */
  parse(content: string): ParsedPrompt[] {
    return PromptParser.parse(content);
  }
}

// Re-export individual parsers for direct use
export { parseJson, parseCsv, parseMarkdownTable, parseMarkdownHeadings };
export { parseFrontmatter, hasFrontmatter } from './frontmatter';
export type {
  ParsedPrompt,
  ParseOptions,
  ParseResult,
  ImportFormat,
  Parser,
} from './types';
