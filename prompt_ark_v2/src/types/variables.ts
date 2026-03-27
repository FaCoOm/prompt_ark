/**
 * @fileoverview Variable type definitions for Prompt Ark v2
 * 
 * Based on v1 data structures from lib/variables.js
 * Contains variable parsing and resolution types
 */

/**
 * Variable type - determines how the variable is handled
 * - text: Free-text input field
 * - enum: Dropdown selection with predefined options
 * - default: Pre-filled text that can be edited
 * - context: Auto-filled from page context (e.g., {{@page_title}})
 */
export type VariableType = 'text' | 'enum' | 'default' | 'context';

/**
 * Variable definition parsed from prompt content
 * Variables use syntax like {{name}}, {{name:opt1|opt2}}, or {{@context_var}}
 */
export interface VariableDefinition {
  /** Variable name (the key used in templates) */
  name: string;
  /** How this variable should be rendered and handled */
  type: VariableType;
  /** For 'default' type: the pre-filled value */
  default?: string;
  /** For 'enum' type: the list of selectable options */
  options?: string[];
  /** The raw variable spec as it appeared in the content (e.g., "lang:EN|ZH") */
  raw: string;
}

/**
 * Resolved variable value after user input or context resolution
 */
export interface VariableValue {
  /** Variable name */
  name: string;
  /** The resolved value */
  value: string;
  /** Whether this came from context (auto-filled) or user input */
  source: 'user' | 'context' | 'default';
}

/**
 * Classification result separating context vars from user vars
 */
export interface ClassifiedVariables {
  /** Context variables that auto-fill from page state */
  context: VariableDefinition[];
  /** User variables requiring manual input */
  user: VariableDefinition[];
}

/**
 * Context variable names supported by the system
 * These auto-fill from the current browser tab/page
 */
export type ContextVariableName =
  | '@clipboard'    // Clipboard content (requires permission)
  | '@selection'    // Currently selected text on the page
  | '@page_url'     // Current page URL
  | '@page_title'   // Current page title
  | '@page_text'    // Full page text content (truncated)
  | '@date'         // Current date in ISO format (YYYY-MM-DD)
  | '@lang';        // Current browser language setting

/**
 * Map of context variable values after resolution
 */
export type ContextVariableMap = Partial<Record<ContextVariableName, string>>;

/**
 * Result of resolving context variables in content
 */
export interface ContextResolutionResult {
  /** Content with context variables replaced */
  resolved: string;
  /** Map of resolved variable names to values */
  resolvedMap: Record<string, string>;
}

/**
 * Variable specification parser result
 * Internal type used during parsing of {{var}} syntax
 */
export interface ParsedVariableSpec {
  name: string;
  type: VariableType;
  default: string | null;
  options: string[] | undefined;
  raw: string;
}
