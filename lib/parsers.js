/**
 * Parser library for importing prompts from various formats.
 */

export class PromptParser {
    /**
     * Tries to parse content using available strategies.
     * @param {string} content - The raw content to parse.
     * @param {string} [filename] - Optional filename to help with type detection.
     * @returns {Array<{act: string, prompt: string}>} - Array of parsed prompts.
     */
    static parse(content, filename = '') {
        if (!content) return [];
        const text = String(content).trim();
        if (!text) return [];

        // 1. Try JSON
        try {
            const json = JSON.parse(text);
            const parsedJson = this.parseJson(json);
            if (parsedJson.length > 0) return parsedJson;
        } catch (e) {
            // Not JSON, continue
        }

        // 2. Try CSV (simple detection: looks for comma separated values in first line)
        // Checking for "act" or "prompt" headers is a good heuristic
        const firstLine = text.split('\n')[0].toLowerCase();
        if (firstLine.includes(',') && (firstLine.includes('act') || firstLine.includes('prompt') || firstLine.includes('cmd'))) {
            const parsedCsv = this.parseCsv(text);
            if (parsedCsv.length > 0) return parsedCsv;
        }

        // 3. Try Markdown Table
        if (text.includes('|') && (text.includes('---') || text.includes(':---'))) {
            const parsedTable = this.parseMarkdownTable(text);
            if (parsedTable.length > 0) return parsedTable;
        }

        // 4. Try Markdown Headings (last resort for structured text)
        if (text.includes('# ')) {
            const parsedHeadings = this.parseMarkdownHeadings(text);
            if (parsedHeadings.length > 0) return parsedHeadings;
        }

        // 5. Fallback: treat pasted/raw text as a single prompt.
        // This makes the "paste text" import mode work for ordinary prompt content.
        return this.parsePlainText(text, filename);
    }

    static parseJson(json) {
        // Prompt Ark native format: { format: "prompt-ark", prompts: [...] }
        if (json.format === 'prompt-ark' && Array.isArray(json.prompts)) {
            return json.prompts.map(p => ({
                act: p.title || 'Untitled',
                prompt: p.content || '',
                category: p.category || '',
                tags: p.tags || [],
                variables: p.variables || [],
                shortcut: p.shortcut || '',
            })).filter(p => p.prompt);
        }

        if (Array.isArray(json)) {
            return json.map(item => ({
                act: item.act || item.title || item.cmd || 'Untitled',
                prompt: item.prompt || item.content || item.text || '',
                category: item.category || '',
                tags: item.tags || [],
                shortcut: item.shortcut || '',
                favorite: item.favorite || false,
                variables: item.variables || [],
            })).filter(p => p.prompt);
        } else if (typeof json === 'object' && json !== null) {
            // Handles { "act": "prompt", ... } format
            return Object.entries(json).map(([key, value]) => {
                if (typeof value === 'string') {
                    return { act: key, prompt: value };
                }
                return {
                    act: value.act || key,
                    prompt: value.prompt || ''
                }
            }).filter(p => p.prompt);
        }
        return [];
    }

    static parseCsv(content) {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const actIndex = headers.findIndex(h => h === 'act' || h === 'title' || h === 'cmd' || h === 'name');
        const promptIndex = headers.findIndex(h => h === 'prompt' || h === 'content' || h === 'text');

        if (promptIndex === -1) return [];

        const results = [];
        // Simple CSV parser - doesn't handle escaped commas inside quotes perfectly but works for standard exports
        // For robust CSV parsing, a library is better, but this suffices for simple "act,prompt" format
        for (let i = 1; i < lines.length; i++) {
            // Handle quoted strings which might contain commas
            const row = [];
            let current = '';
            let inQuote = false;
            for (let char of lines[i]) {
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                    current = '';
                } else {
                    current += char;
                }
            }
            row.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            if (row.length > promptIndex) {
                results.push({
                    act: actIndex !== -1 ? row[actIndex] : 'Untitled',
                    prompt: row[promptIndex]
                });
            }
        }
        return results;
    }

    static parseMarkdownTable(content) {
        const lines = content.split(/\r?\n/);
        let headerLine = -1;

        // Find header
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('|') && (lines[i].toLowerCase().includes('act') || lines[i].toLowerCase().includes('prompt'))) {
                headerLine = i;
                break;
            }
        }

        if (headerLine === -1) return [];

        // Check delimiter line
        if (headerLine + 1 >= lines.length || !lines[headerLine + 1].includes('---')) return [];

        const headers = lines[headerLine].split('|').map(h => h.trim().toLowerCase()).filter(h => h);
        const actIndex = headers.findIndex(h => h.includes('act') || h.includes('title') || h.includes('cmd'));
        const promptIndex = headers.findIndex(h => h.includes('prompt') || h.includes('content'));

        if (promptIndex === -1) return [];

        const results = [];
        for (let i = headerLine + 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || !line.startsWith('|')) continue;

            const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

            // Handle cases where split might include empty strings at start/end due to | border |
            // Robust split:
            const rawCols = line.split('|');
            // Remove first and last if they are empty (common in Markdown tables)
            if (line.startsWith('|')) rawCols.shift();
            if (line.endsWith('|')) rawCols.pop();

            const cleanCols = rawCols.map(c => c.trim());

            if (cleanCols.length > promptIndex) {
                results.push({
                    act: actIndex !== -1 && cleanCols[actIndex] ? cleanCols[actIndex] : 'Untitled',
                    prompt: cleanCols[promptIndex]
                });
            }
        }
        return results;
    }

    static parseMarkdownHeadings(content) {
        const lines = content.split(/\r?\n/);
        const headings = lines
            .map((line, index) => {
                const match = line.match(/^(#{1,6})\s+(.*)$/);
                if (!match) return null;
                return {
                    index,
                    level: match[1].length,
                    title: match[2].trim()
                };
            })
            .filter(Boolean);

        if (headings.length === 0) return [];

        const topLevel = Math.min(...headings.map(h => h.level));
        const rootHeadings = headings.filter(h => h.level === topLevel);

        // A markdown document with a single top-level heading is usually one prompt
        // with nested sections like "Requirements" or "Output Format".
        if (rootHeadings.length === 1) {
            const root = rootHeadings[0];
            const body = lines.slice(root.index + 1).join('\n').trim();
            if (!body) return [];
            return [{
                act: root.title || 'Untitled',
                prompt: body
            }];
        }

        const results = [];
        for (let i = 0; i < rootHeadings.length; i++) {
            const current = rootHeadings[i];
            const next = rootHeadings[i + 1];
            const bodyStart = current.index + 1;
            const bodyEnd = next ? next.index : lines.length;
            const body = lines.slice(bodyStart, bodyEnd).join('\n').trim();

            if (!body) continue;
            results.push({
                act: current.title || 'Untitled',
                prompt: body
            });
        }

        return results;
    }

    static parsePlainText(content, filename = '') {
        const text = String(content || '').trim();
        if (!text) return [];

        return [{
            act: this.extractPlainTextTitle(text, filename),
            prompt: text
        }];
    }

    static extractPlainTextTitle(content, filename = '') {
        const lines = String(content || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        const firstContentLine = lines.find(line =>
            !/^---$/.test(line) &&
            !/^#{1,6}\s*$/.test(line) &&
            !/^```/.test(line)
        ) || '';

        let title = firstContentLine
            .replace(/^#{1,6}\s*/, '')
            .replace(/^[-*+]\s+/, '')
            .replace(/^\d+\.\s+/, '')
            .replace(/`+/g, '')
            .trim();

        if (!title && filename) {
            title = filename.split('/').pop().replace(/\.[^.]+$/, '');
        }

        if (!title) return 'Imported Prompt';
        if (title.length > 48) return title.slice(0, 48).trim() + '...';
        return title;
    }
}
