import type { ParsedPrompt } from './types';

/**
 * Parse Markdown table format into parsed prompts
 * 
 * Detects tables with headers containing "act", "prompt", "title", or "content"
 * Expects standard Markdown table format with | delimiters and --- separator
 * 
 * @param content - Markdown table content
 * @returns Array of parsed prompts
 */
export function parseMarkdownTable(content: string): ParsedPrompt[] {
  const lines = content.split(/\r?\n/);
  let headerLine = -1;

  // Find header line containing relevant keywords
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (
      lines[i].includes('|') &&
      (lineLower.includes('act') || lineLower.includes('prompt'))
    ) {
      headerLine = i;
      break;
    }
  }

  if (headerLine === -1) return [];

  // Check for delimiter line (--- separator)
  if (
    headerLine + 1 >= lines.length ||
    !lines[headerLine + 1].includes('---')
  ) {
    return [];
  }

  const headers = lines[headerLine]
    .split('|')
    .map((h) => h.trim().toLowerCase())
    .filter((h) => h);

  const actIndex = headers.findIndex(
    (h) => h.includes('act') || h.includes('title') || h.includes('cmd')
  );
  const promptIndex = headers.findIndex(
    (h) => h.includes('prompt') || h.includes('content')
  );

  if (promptIndex === -1) return [];

  const results: ParsedPrompt[] = [];

  for (let i = headerLine + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;

    const cleanCols = extractTableColumns(line);

    if (cleanCols.length > promptIndex) {
      results.push({
        act:
          actIndex !== -1 && cleanCols[actIndex]
            ? cleanCols[actIndex]
            : 'Untitled',
        prompt: cleanCols[promptIndex],
      });
    }
  }

  return results;
}

/**
 * Extract columns from a Markdown table row
 */
function extractTableColumns(line: string): string[] {
  const rawCols = line.split('|');

  // Remove first and last if they are empty (common in Markdown tables)
  if (line.startsWith('|')) rawCols.shift();
  if (line.endsWith('|')) rawCols.pop();

  return rawCols.map((c) => c.trim());
}

/**
 * Parse Markdown headings format into parsed prompts
 * 
 * Each # Heading becomes the act/title, content until next heading becomes the prompt
 * 
 * @param content - Markdown content with headings
 * @returns Array of parsed prompts
 */
export function parseMarkdownHeadings(content: string): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];
  const lines = content.split(/\r?\n/);

  let currentAct = '';
  let currentPrompt: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      // New section - save previous if exists
      if (currentAct && currentPrompt.length > 0) {
        results.push({
          act: currentAct,
          prompt: currentPrompt.join('\n').trim(),
        });
      }
      // Remove # and trim for new act
      currentAct = line.replace(/^#+\s*/, '').trim();
      currentPrompt = [];
    } else {
      if (currentAct) {
        currentPrompt.push(line);
      }
    }
  }

  // Push last one
  if (currentAct && currentPrompt.length > 0) {
    results.push({
      act: currentAct,
      prompt: currentPrompt.join('\n').trim(),
    });
  }

  return results;
}
