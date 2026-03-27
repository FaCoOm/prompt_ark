import type { VariableDefinition } from '../../types';
import type { ParsedPrompt, LegacyPromptObject } from './types';

function detectJsonFormat(json: unknown): 'prompt-ark' | 'array' | 'object' | 'unknown' {
  if (typeof json === 'object' && json !== null) {
    const obj = json as Record<string, unknown>;
    if (obj.format === 'prompt-ark' && Array.isArray(obj.prompts)) {
      return 'prompt-ark';
    }
    if (Array.isArray(json)) {
      return 'array';
    }
    return 'object';
  }
  return 'unknown';
}

export function parseJson(json: unknown): ParsedPrompt[] {
  const format = detectJsonFormat(json);

  switch (format) {
    case 'prompt-ark':
      return parsePromptArkFormat(json as Record<string, unknown>);
    case 'array':
      return parseArrayFormat(json as unknown[]);
    case 'object':
      return parseObjectFormat(json as Record<string, unknown>);
    default:
      return [];
  }
}

function parsePromptArkFormat(json: Record<string, unknown>): ParsedPrompt[] {
  const prompts = json.prompts as Array<{
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    variables?: VariableDefinition[];
    shortcut?: string;
  }>;

  return prompts
    .map((p) => ({
      act: p.title || 'Untitled',
      prompt: p.content || '',
      category: p.category || '',
      tags: p.tags || [],
      variables: (Array.isArray(p.variables) ? p.variables : []) as VariableDefinition[],
      shortcut: p.shortcut || '',
    }))
    .filter((p) => p.prompt);
}

function parseArrayFormat(items: unknown[]): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];

  for (const item of items) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const obj = item as LegacyPromptObject;
    const prompt = obj.prompt || obj.content || obj.text || '';
    if (!prompt) continue;

    results.push({
      act: obj.act || obj.title || obj.cmd || 'Untitled',
      prompt,
      category: obj.category || '',
      tags: obj.tags || [],
      shortcut: obj.shortcut || '',
      favorite: obj.favorite || false,
      variables: obj.variables || [],
    });
  }

  return results;
}

function parseObjectFormat(json: Record<string, unknown>): ParsedPrompt[] {
  const results: ParsedPrompt[] = [];

  for (const [key, value] of Object.entries(json)) {
    if (typeof value === 'string') {
      if (value) {
        results.push({
          act: key,
          prompt: value,
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      const obj = value as LegacyPromptObject;
      const prompt = obj.prompt || obj.content || obj.text || '';
      if (prompt) {
        results.push({
          act: obj.act || obj.title || key,
          prompt,
          category: obj.category || '',
          tags: obj.tags || [],
          shortcut: obj.shortcut || '',
          favorite: obj.favorite || false,
          variables: obj.variables || [],
        });
      }
    }
  }

  return results;
}
