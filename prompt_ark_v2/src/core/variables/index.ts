/**
 * @fileoverview Variable parsing and resolution system
 * 
 * Handles extraction and replacement of template variables in prompt content.
 * Supports multiple variable types: text, default, enum, and context variables.
 */

/**
 * Variable specification parsed from template syntax
 */
export interface VariableSpec {
  /** Variable name */
  name: string;
  /** Variable type: text | default | enum | context */
  type: 'text' | 'default' | 'enum' | 'context';
  /** Raw variable string from template */
  raw: string;
  /** Default value (for default and enum types) */
  default?: string | null;
  /** Available options (for enum type) */
  options?: string[];
}

/**
 * Context variable values for replacement
 */
export interface ContextValues {
  /** Page title */
  '@page_title'?: string;
  /** Page URL */
  '@page_url'?: string;
  /** Selected text */
  '@selection'?: string;
  /** Current date (ISO format) */
  '@date'?: string;
  /** Clipboard content */
  '@clipboard'?: string;
  /** Page text content */
  '@page_text'?: string;
  /** Language setting */
  '@lang'?: string;
  /** Any other context variable */
  [key: string]: string | undefined;
}

/**
 * Variable resolver for parsing and replacing template variables
 */
export class VariableResolver {
  /**
   * Parse a single variable spec
   * @param rawName - Raw variable name from template (e.g., "name", "name:default", "name:opt1|opt2", "@var")
   * @returns Parsed variable specification
   * @example
   * parseVariableSpec('name') // { name: 'name', type: 'text', default: null, raw: 'name' }
   * parseVariableSpec('name:defaultValue') // { name: 'name', type: 'default', default: 'defaultValue', raw: 'name:defaultValue' }
   * parseVariableSpec('name:opt1|opt2|opt3') // { name: 'name', type: 'enum', options: ['opt1', 'opt2', 'opt3'], default: 'opt1', raw: 'name:opt1|opt2|opt3' }
   * parseVariableSpec('@page_title') // { name: '@page_title', type: 'context', raw: '@page_title' }
   */
  static parseVariableSpec(rawName: string): VariableSpec {
    // Context variables start with @
    if (rawName.startsWith('@')) {
      return { name: rawName, type: 'context', raw: rawName };
    }

    const colonIdx = rawName.indexOf(':');
    
    // No colon - plain text variable
    if (colonIdx === -1) {
      return { name: rawName.trim(), type: 'text', default: null, raw: rawName };
    }

    const name = rawName.substring(0, colonIdx).trim();
    const rest = rawName.substring(colonIdx + 1);

    // Check for enum pattern (contains |)
    if (rest.includes('|')) {
      const options = rest.split('|').map(o => o.trim()).filter(o => o.length > 0);
      if (options.length >= 2) {
        return { 
          name, 
          type: 'enum', 
          options, 
          default: options[0], 
          raw: rawName 
        };
      }
    }

    // Single value after colon = default value
    const defaultVal = rest.trim();
    if (defaultVal.length > 0) {
      return { name, type: 'default', default: defaultVal, raw: rawName };
    }

    // Empty after colon - treat as plain text
    return { name, type: 'text', default: null, raw: rawName };
  }

  /**
   * Extract all variables from content (excluding context variables)
   * @param content - Template content with {{variable}} patterns
   * @returns Array of parsed variable specifications
   * @example
   * extractVariables('Hello {{name}}, choose {{color:red|blue|green}}')
   * // Returns specs for 'name' (text) and 'color' (enum)
   */
  static extractVariables(content: string): VariableSpec[] {
    const rawMatches: string[] = [];

    // Match {{Variable}} or {{name:opt1|opt2}}
    const brackets = content.match(/\{\{([^}]+)\}\}/g);
    if (brackets) {
      rawMatches.push(...brackets.map(m => m.slice(2, -2).trim()));
    }

    // Dedupe by raw string, parse each, and filter out context vars
    const seen = new Set<string>();
    return rawMatches
      .filter(v => v.length > 0 && !seen.has(v) && seen.add(v))
      .map(this.parseVariableSpec)
      .filter(spec => spec.type !== 'context');
  }

  /**
   * Extract context variables from content ({{@var}} patterns)
   * @param content - Template content with {{@variable}} patterns
   * @returns Array of parsed context variable specifications
   * @example
   * extractContextVariables('Current page: {{@page_title}} at {{@page_url}}')
   * // Returns specs for '@page_title' and '@page_url'
   */
  static extractContextVariables(content: string): VariableSpec[] {
    const rawMatches: string[] = [];

    // Match {{@Variable}} context variables
    const contextVars = content.match(/\{\{@([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
    if (contextVars) {
      rawMatches.push(...contextVars.map(m => m.slice(2, -2).trim()));
    }

    // Dedupe by raw string, parse each
    const seen = new Set<string>();
    return rawMatches
      .filter(v => v.length > 0 && !seen.has(v) && seen.add(v))
      .map(this.parseVariableSpec);
  }

  /**
   * Replace regular variables with values
   * @param content - Template content with {{variable}} patterns
   * @param values - Object mapping variable names to their values
   * @returns Content with variables replaced
   * @example
   * fillVariables('Hello {{name}}', { name: 'World' }) // 'Hello World'
   */
  static fillVariables(content: string, values: Record<string, string>): string {
    let result = content;
    const variables = this.extractVariables(content);

    for (const spec of variables) {
      const pattern = new RegExp(`\\{\\{${this.escapeRegex(spec.raw)}\\}\\}`, 'g');
      const value = values[spec.name] ?? '';
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Replace context variables with values
   * @param content - Template content with {{@variable}} patterns
   * @param context - Context values for replacement
   * @returns Content with context variables replaced
   * @example
   * fillContextVariables('Page: {{@page_title}}', { '@page_title': 'Google' }) // 'Page: Google'
   */
  static fillContextVariables(content: string, context: ContextValues): string {
    let result = content;
    const contextVars = this.extractContextVariables(content);

    for (const spec of contextVars) {
      const pattern = new RegExp(`\\{\\{${this.escapeRegex(spec.name)}\\}\\}`, 'g');
      const value = context[spec.name] ?? '';
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Check if content contains regular variables (non-context)
   * @param content - Content to check
   * @returns True if content has {{variable}} patterns (excluding {{@context}})
   * @example
   * hasVariables('Hello {{name}}') // true
   * hasVariables('Hello {{@page_title}}') // false
   * hasVariables('Hello world') // false
   */
  static hasVariables(content: string): boolean {
    // Match {{...}} but not {{@...}}
    const match = content.match(/\{\{([^}@][^}]*)\}\}/);
    return match !== null;
  }

  /**
   * Check if content contains context variables
   * @param content - Content to check
   * @returns True if content has {{@variable}} patterns
   * @example
   * hasContextVariables('Page: {{@page_title}}') // true
   * hasContextVariables('Hello {{name}}') // false
   * hasContextVariables('Hello world') // false
   */
  static hasContextVariables(content: string): boolean {
    const match = content.match(/\{\{@([a-zA-Z_][a-zA-Z0-9_]*)\}\}/);
    return match !== null;
  }

  /**
   * Check if content contains any variables (regular or context)
   * @param content - Content to check
   * @returns True if content has any {{variable}} patterns
   */
  static hasAnyVariables(content: string): boolean {
    return this.hasVariables(content) || this.hasContextVariables(content);
  }

  /**
   * Get all variable names from content (both regular and context)
   * @param content - Content to parse
   * @returns Array of unique variable names
   */
  static getAllVariableNames(content: string): string[] {
    const regular = this.extractVariables(content).map(v => v.name);
    const context = this.extractContextVariables(content).map(v => v.name);
    return [...new Set([...regular, ...context])];
  }

  /**
   * Escape special regex characters in a string
   * @param str - String to escape
   * @returns Escaped string safe for use in regex
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

/**
 * Legacy function: Parse a single variable spec
 * @deprecated Use VariableResolver.parseVariableSpec instead
 */
export function parseVariableSpec(rawName: string): VariableSpec {
  return VariableResolver.parseVariableSpec(rawName);
}

/**
 * Legacy function: Extract variables from content
 * @deprecated Use VariableResolver.extractVariables instead
 */
export function extractVariables(content: string): VariableSpec[] {
  return VariableResolver.extractVariables(content);
}

/**
 * Legacy function: Extract context variables from content
 * @deprecated Use VariableResolver.extractContextVariables instead
 */
export function extractContextVariables(content: string): VariableSpec[] {
  return VariableResolver.extractContextVariables(content);
}

/**
 * Legacy function: Fill variables with values
 * @deprecated Use VariableResolver.fillVariables instead
 */
export function fillVariables(content: string, values: Record<string, string>): string {
  return VariableResolver.fillVariables(content, values);
}

/**
 * Legacy function: Fill context variables with values
 * @deprecated Use VariableResolver.fillContextVariables instead
 */
export function fillContextVariables(content: string, context: ContextValues): string {
  return VariableResolver.fillContextVariables(content, context);
}

/**
 * Legacy function: Check if content has variables
 * @deprecated Use VariableResolver.hasVariables instead
 */
export function hasVariables(content: string): boolean {
  return VariableResolver.hasVariables(content);
}

/**
 * Legacy function: Check if content has context variables
 * @deprecated Use VariableResolver.hasContextVariables instead
 */
export function hasContextVariables(content: string): boolean {
  return VariableResolver.hasContextVariables(content);
}

// Default export
export default VariableResolver;
