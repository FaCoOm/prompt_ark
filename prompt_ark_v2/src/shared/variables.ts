export interface VariableDefinition {
  name: string;
  type: 'text' | 'enum' | 'default';
  defaultValue?: string;
  options?: string[];
}

export interface VariableValue {
  name: string;
  value: string;
}

export class VariableResolver {
  static extractVariables(content: string): VariableDefinition[] {
    const variables: VariableDefinition[] = [];
    const seen = new Set<string>();

    const regex = /\{\{(\w+)(?::([^}]+))?\}\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      const config = match[2];

      if (seen.has(name)) continue;
      seen.add(name);

      const definition: VariableDefinition = { name, type: 'text' };

      if (config) {
        const options = config.split('|').map((s) => s.trim());
        if (options.length > 1) {
          definition.type = 'enum';
          definition.options = options;
        } else {
          definition.type = 'default';
          definition.defaultValue = options[0];
        }
      }

      variables.push(definition);
    }

    return variables;
  }

  static extractContextVariables(content: string): string[] {
    const variables: string[] = [];
    const seen = new Set<string>();

    const regex = /\{\{@(\w+)\}\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        variables.push(name);
      }
    }

    return variables;
  }

  static fillVariables(
    content: string,
    values: Record<string, string>
  ): string {
    return content.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, name) => {
      return values[name] ?? match;
    });
  }

  static fillContextVariables(
    content: string,
    context: Record<string, string>
  ): string {
    return content.replace(/\{\{@(\w+)\}\}/g, (match, name) => {
      return context[name] ?? match;
    });
  }

  static hasVariables(content: string): boolean {
    return /\{\{\w+/.test(content);
  }

  static hasContextVariables(content: string): boolean {
    return /\{\{@\w+/.test(content);
  }
}
