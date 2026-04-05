// frontmatter.js - YAML Frontmatter parser/serializer for Obsidian Vault integration
// Handles round-trip conversion between .md files (with YAML frontmatter) and prompt objects.
// Zero external dependencies — uses simple line-based parsing for the subset of YAML we need.
import { derivePromptCategory } from './taxonomy.js';

/**
 * Parse a Markdown string with YAML frontmatter into { meta, body }.
 * Supports: strings, booleans, numbers, arrays (both inline [a, b] and multi-line - items).
 * @param {string} markdown - Full .md file content
 * @returns {{ meta: Object, body: string }}
 */
export function parseFrontmatter(markdown) {
  if (!markdown || typeof markdown !== 'string') return { meta: {}, body: markdown || '' };

  const trimmed = markdown.trimStart();
  if (!trimmed.startsWith('---')) return { meta: {}, body: markdown };

  // Find closing --- (must be on its own line)
  const endIndex = trimmed.indexOf('\n---', 3);
  if (endIndex === -1) return { meta: {}, body: markdown };

  const yamlBlock = trimmed.slice(4, endIndex).trim(); // skip opening ---\n
  const body = trimmed.slice(endIndex + 4).replace(/^\n/, ''); // skip closing ---\n

  const meta = parseSimpleYaml(yamlBlock);
  return { meta, body };
}

/**
 * Serialize meta object + body string back into a full .md file with frontmatter.
 * @param {Object} meta - Frontmatter key-value pairs
 * @param {string} body - Prompt content (Markdown body)
 * @returns {string} Full .md file content
 */
export function serializeFrontmatter(meta, body) {
  const yamlLines = [];
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
 * @param {Object} prompt - Prompt object from PromptStorage
 * @returns {string} Full .md file content
 */
export async function promptToMarkdown(prompt, locale = 'zh_CN') {
  const meta = {};
  if (prompt.title) meta.title = prompt.title;
  const displayCategory = await derivePromptCategory(prompt, locale);
  if (displayCategory) meta.category = displayCategory;
  if (prompt.output_modality) meta.output_modality = prompt.output_modality;
  if (prompt.output_modality_locked) meta.output_modality_locked = true;
  if (prompt.category_type) meta.category_type = prompt.category_type;
  if (prompt.category_key) meta.category_key = prompt.category_key;
  if (prompt.ai_category_type) meta.ai_category_type = prompt.ai_category_type;
  if (prompt.ai_category_key) meta.ai_category_key = prompt.ai_category_key;
  if (prompt.ai_category_confidence !== undefined && prompt.ai_category_confidence !== null) {
    meta.ai_category_confidence = prompt.ai_category_confidence;
  }
  if (prompt.classification_confidence !== undefined && prompt.classification_confidence !== null) {
    meta.classification_confidence = prompt.classification_confidence;
  }
  if (prompt.needs_category_review) meta.needs_category_review = true;
  if (prompt.needs_output_modality_review) meta.needs_output_modality_review = true;
  if (prompt.skip_async_enrich) meta.skip_async_enrich = true;
  if (prompt.tags?.length) meta.tags = prompt.tags;
  if (prompt.favorite) meta.favorite = true;
  if (prompt.shortcut) meta.shortcut = prompt.shortcut;
  if (prompt.variables?.length) meta.variables = prompt.variables;
  if (prompt.id) meta.prompt_ark_id = prompt.id;

  return serializeFrontmatter(meta, prompt.content || '');
}

/**
 * Convert a Markdown string (with frontmatter) to a Prompt Ark prompt object.
 * @param {string} markdown - Full .md file content
 * @param {string} filename - Original filename (used as fallback title)
 * @returns {Object} Prompt object compatible with PromptStorage
 */
export function markdownToPrompt(markdown, filename = '') {
  const { meta, body } = parseFrontmatter(markdown);

  // Derive title: frontmatter > filename without extension > first line
  const fallbackTitle = filename
    ? filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ')
    : (body.split('\n')[0] || '').replace(/^#+ /, '').slice(0, 60) || 'Untitled';

  return {
    id: meta.prompt_ark_id || null, // null = new prompt, needs ID assignment
    title: meta.title || fallbackTitle,
    content: body.trim(),
    category: meta.category || '',
    output_modality: meta.output_modality || '',
    output_modality_locked: meta.output_modality_locked === true || meta.output_modality_locked === 'true',
    category_type: meta.category_type || '',
    category_key: meta.category_key || '',
    ai_category_type: meta.ai_category_type || '',
    ai_category_key: meta.ai_category_key || '',
    ai_category_confidence: meta.ai_category_confidence,
    classification_confidence: meta.classification_confidence,
    needs_category_review: meta.needs_category_review === true || meta.needs_category_review === 'true',
    needs_output_modality_review: meta.needs_output_modality_review === true || meta.needs_output_modality_review === 'true',
    skip_async_enrich: meta.skip_async_enrich === true || meta.skip_async_enrich === 'true',
    tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
    favorite: meta.favorite === true || meta.favorite === 'true',
    shortcut: meta.shortcut || '',
    variables: Array.isArray(meta.variables) ? meta.variables : [],
  };
}

/**
 * Generate a safe filename from a prompt title.
 * @param {Object} prompt - Prompt object
 * @returns {string} Sanitized filename with .md extension
 */
export function promptToFilename(prompt) {
  const base = (prompt.title || prompt.id || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]+/g, '-') // keep CJK chars
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}.md`;
}


// --- Internal: Simple YAML parser (subset) ---

function parseSimpleYaml(yamlStr) {
  const result = {};
  const lines = yamlStr.split('\n');
  let currentKey = null;
  let currentArray = null;

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

function parseYamlScalar(str) {
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

function serializeYamlValue(key, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`;
    const items = value.map(v => quoteIfNeeded(String(v)));
    return `${key}: [${items.join(', ')}]`;
  }
  if (typeof value === 'boolean') return `${key}: ${value}`;
  if (typeof value === 'number') return `${key}: ${value}`;
  return `${key}: ${quoteIfNeeded(String(value))}`;
}

function quoteIfNeeded(str) {
  // Quote strings that contain YAML-special characters
  if (/[:{}\[\],&#*?|>!%@`]/.test(str) || str.includes('\n')) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return str;
}
