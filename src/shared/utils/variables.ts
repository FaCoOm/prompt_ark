export interface VariableSpec {
  name: string;
  type: 'context' | 'text' | 'enum' | 'default';
  options?: string[];
  default?: string | null;
  raw: string;
}

export function parseVariableSpec(rawName: string): VariableSpec {
  if (rawName.startsWith('@')) {
    return { name: rawName, type: 'context', raw: rawName };
  }
  const colonIdx = rawName.indexOf(':');
  if (colonIdx === -1) {
    return { name: rawName, type: 'text', default: null, raw: rawName };
  }
  const name = rawName.substring(0, colonIdx).trim();
  const rest = rawName.substring(colonIdx + 1);
  if (rest.includes('|')) {
    const options = rest.split('|').map(o => o.trim()).filter(o => o.length > 0);
    if (options.length >= 2) {
      return { name, type: 'enum', options, default: options[0], raw: rawName };
    }
  }
  const defaultVal = rest.trim();
  if (defaultVal.length > 0) {
    return { name, type: 'default', default: defaultVal, raw: rawName };
  }
  return { name, type: 'text', default: null, raw: rawName };
}

export function extractVariables(content: string): VariableSpec[] {
  const rawMatches: string[] = [];

  const brackets = content.match(/\{\{([^}]+)\}\}/g);
  if (brackets) {
    rawMatches.push(...brackets.map(m => m.slice(2, -2).trim()));
  }

  const squares = content.match(/\[([a-zA-Z][a-zA-Z0-9_\s]*)\](?!\()/g);
  if (squares) {
    rawMatches.push(...squares.map(m => m.slice(1, -1).trim()));
  }

  const seen = new Set<string>();
  return rawMatches
    .filter(v => v.length > 0 && !seen.has(v) && seen.add(v))
    .map(parseVariableSpec);
}

export function classifyVariables(varSpecs: VariableSpec[]): { context: VariableSpec[]; user: VariableSpec[] } {
  const context = varSpecs.filter(v => v.type === 'context');
  const user = varSpecs.filter(v => v.type !== 'context');
  return { context, user };
}

interface ContextVariableResult {
  resolved: string;
  resolvedMap: Record<string, string>;
}

export async function resolveContextVariables(content: string): Promise<ContextVariableResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const resolvedMap: Record<string, string> = {};

  const used = (content.match(/\{\{@([a-zA-Z_]+)\}\}/g) || [])
    .map(m => m.slice(2, -2).trim());
  const uniqueUsed = [...new Set(used)];
  if (uniqueUsed.length === 0) return { resolved: content, resolvedMap };

  const resolvers = uniqueUsed.map(async (varName) => {
    try {
      switch (varName) {
        case '@clipboard':
          return [varName, null] as [string, string | null];
        case '@selection':
          if (tab?.id) {
            const selResp = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTION' }).catch(() => null) as { text?: string } | null;
            return [varName, selResp?.text || ''] as [string, string];
          }
          return [varName, ''] as [string, string];
        case '@page_url':
          return [varName, tab?.url || ''] as [string, string];
        case '@page_text':
          if (tab?.id) {
            const textResp = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_TEXT' }).catch(() => null) as { text?: string } | null;
            return [varName, textResp?.text || ''] as [string, string];
          }
          return [varName, ''] as [string, string];
        case '@date':
          return [varName, new Date().toISOString().split('T')[0]] as [string, string];
        case '@lang': {
          const data = await chrome.storage.sync.get({ language: 'zh_CN' }) as { language: string };
          return [varName, data.language] as [string, string];
        }
        default:
          return [varName, null] as [string, string | null];
      }
    } catch (e) {
      console.error(`[ContextVar] Failed to resolve ${varName}:`, e);
      return [varName, ''] as [string, string];
    }
  });

  const results = await Promise.all(resolvers);

  let resolved = content;
  for (const [varName, value] of results) {
    if (value === null) continue;
    resolvedMap[varName] = value;
    resolved = resolved.split(`{{${varName}}}`).join(value);
  }

  return { resolved, resolvedMap };
}

export function composePrompt(prompt: { content: string }, contentOverride: string | null = null): string {
  return contentOverride || prompt.content;
}