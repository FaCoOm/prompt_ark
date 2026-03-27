import type { ParsedPrompt } from './types';

/**
 * Parse CSV content into parsed prompts
 * 
 * Supports:
 * - Header detection (act, title, cmd, name for title; prompt, content, text for content)
 * - Quoted strings with escaped quotes
 * - Standard CSV format
 * 
 * @param content - CSV content to parse
 * @returns Array of parsed prompts
 */
export function parseCsv(content: string): ParsedPrompt[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  const actIndex = headers.findIndex(
    (h) => h === 'act' || h === 'title' || h === 'cmd' || h === 'name'
  );
  const promptIndex = headers.findIndex(
    (h) => h === 'prompt' || h === 'content' || h === 'text'
  );

  if (promptIndex === -1) return [];

  const results: ParsedPrompt[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);

    if (row.length > promptIndex) {
      results.push({
        act: actIndex !== -1 ? row[actIndex] : 'Untitled',
        prompt: row[promptIndex],
      });
    }
  }

  return results;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const row: string[] = [];
  let current = '';
  let inQuote = false;

  for (const char of line) {
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      row.push(cleanCsvValue(current));
      current = '';
    } else {
      current += char;
    }
  }

  row.push(cleanCsvValue(current));
  return row;
}

/**
 * Clean a CSV value by removing surrounding quotes and unescaping
 */
function cleanCsvValue(value: string): string {
  return value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/""/g, '"');
}
