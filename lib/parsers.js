/**
 * Parser library for importing prompts from various formats.
 */
import { markdownToPrompt } from './frontmatter.js';

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
            const parsedHeadings = this.parseMarkdownHeadings(text, filename);
            if (parsedHeadings.length > 0) return parsedHeadings;
        }

        // 5. Fallback: treat pasted/raw text as a single prompt.
        // This makes the "paste text" import mode work for ordinary prompt content.
        return this.parsePlainText(text, filename);
    }

    static parseJson(json) {
        // Prompt Ark native format: { format: "prompt-ark", prompts: [...] }
        if (json.format === 'prompt-ark' && Array.isArray(json.prompts)) {
            return json.prompts
                .map(p => this.normalizePromptEntry(p, p?.title))
                .filter(p => p.prompt);
        }

        if (Array.isArray(json)) {
            return json
                .map(item => this.normalizePromptEntry(item))
                .filter(p => p.prompt);
        } else if (typeof json === 'object' && json !== null) {
            // Treat a single prompt-shaped object as one prompt entry instead of
            // exploding each property into a separate imported prompt.
            const normalized = this.normalizePromptEntry(json);
            if (normalized.prompt) {
                return [normalized];
            }
            // Handles { "act": "prompt", ... } format
            return Object.entries(json)
                .map(([key, value]) => this.normalizePromptEntry(value, key))
                .filter(p => p.prompt);
        }
        return [];
    }

    static isSinglePromptObject(json) {
        return json && typeof json === 'object' && !Array.isArray(json) && (
            Object.prototype.hasOwnProperty.call(json, 'prompt')
            || Object.prototype.hasOwnProperty.call(json, 'content')
            || Object.prototype.hasOwnProperty.call(json, 'text')
            || Object.prototype.hasOwnProperty.call(json, 'act')
            || Object.prototype.hasOwnProperty.call(json, 'title')
            || Object.prototype.hasOwnProperty.call(json, 'cmd')
        );
    }

    static parseImportContent(content, filename = '') {
        const text = String(content || '').trim();
        if (!text) return [];

        try {
            const json = JSON.parse(text);
            const isPromptArkFormat = json?.format === 'prompt-ark' && Array.isArray(json.prompts);
            const isPromptArray = Array.isArray(json);
            if (isPromptArkFormat || isPromptArray || this.isSinglePromptObject(json)) {
                return this.parseJson(json);
            }
        } catch (e) {
            // Not JSON, continue with other import formats.
        }

        if (this.looksLikeCsv(text)) {
            return this.parseCsv(text);
        }

        return this.parseSinglePromptDocument(text, filename);
    }

    static parseUrlImportContent(content, filename = '') {
        const text = String(content || '').trim();
        if (!text) return [];

        const extension = this.getFileExtension(filename);

        if (extension === 'json') {
            const json = JSON.parse(text);
            return this.parseJson(json);
        }

        if (extension === 'csv') {
            return this.parseCsv(text);
        }

        return this.parseSinglePromptDocument(text, filename);
    }

    static parseCsv(content) {
        const rows = this.parseCsvRows(content);
        if (rows.length < 2) return [];

        const headers = rows[0].map(h => String(h || '').trim().toLowerCase().replace(/"/g, ''));
        const actIndex = headers.findIndex(h => h === 'act' || h === 'title' || h === 'cmd' || h === 'name');
        const promptIndex = headers.findIndex(h => h === 'prompt' || h === 'content' || h === 'text');
        const categoryIndex = headers.findIndex(h => h === 'category');
        const tagsIndex = headers.findIndex(h => h === 'tags');
        const shortcutIndex = headers.findIndex(h => h === 'shortcut');

        if (promptIndex === -1) return [];

        const results = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length > promptIndex) {
                results.push({
                    act: actIndex !== -1 ? row[actIndex] : 'Untitled',
                    prompt: row[promptIndex],
                    category: categoryIndex !== -1 ? row[categoryIndex] || '' : '',
                    tags: tagsIndex !== -1 ? this.parseTagList(row[tagsIndex]) : [],
                    shortcut: shortcutIndex !== -1 ? row[shortcutIndex] || '' : ''
                });
            }
        }
        return results;
    }

    static looksLikeCsv(content) {
        const text = String(content || '').trim();
        if (!text) return false;
        const firstLine = text.split('\n')[0].toLowerCase();
        return firstLine.includes(',')
            && (firstLine.includes('act') || firstLine.includes('prompt') || firstLine.includes('cmd') || firstLine.includes('title') || firstLine.includes('content'));
    }

    static getFileExtension(filename = '') {
        const base = String(filename || '').split('/').pop() || '';
        const parts = base.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : '';
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

        const headers = this.splitMarkdownTableRow(lines[headerLine]).map(h => h.trim().toLowerCase());
        const actIndex = headers.findIndex(h => h.includes('act') || h.includes('title') || h.includes('cmd'));
        const promptIndex = headers.findIndex(h => h.includes('prompt') || h.includes('content'));
        const categoryIndex = headers.findIndex(h => h.includes('category'));
        const tagsIndex = headers.findIndex(h => h.includes('tag'));
        const shortcutIndex = headers.findIndex(h => h.includes('shortcut'));

        if (promptIndex === -1) return [];

        const results = [];
        for (let i = headerLine + 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || !line.startsWith('|')) continue;
            const cleanCols = this.splitMarkdownTableRow(line);

            if (cleanCols.length > promptIndex) {
                results.push({
                    act: actIndex !== -1 && cleanCols[actIndex] ? cleanCols[actIndex] : 'Untitled',
                    prompt: cleanCols[promptIndex],
                    category: categoryIndex !== -1 ? cleanCols[categoryIndex] || '' : '',
                    tags: tagsIndex !== -1 ? this.parseTagList(cleanCols[tagsIndex]) : [],
                    shortcut: shortcutIndex !== -1 ? cleanCols[shortcutIndex] || '' : ''
                });
            }
        }
        return results;
    }

    static parseMarkdownHeadings(content, filename = '') {
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

        // Many prompt files use multiple top-level headings for sections like
        // "IDENTITY", "STEPS", "OUTPUT", and "INPUT". Those should stay as a
        // single prompt instead of being exploded into separate imports.
        if (this.shouldTreatHeadingDocumentAsSinglePrompt(rootHeadings, filename)) {
            return [{
                act: this.extractPlainTextTitle(content, filename),
                prompt: content.trim()
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

    static shouldTreatHeadingDocumentAsSinglePrompt(rootHeadings, filename = '') {
        if (!Array.isArray(rootHeadings) || rootHeadings.length === 0) return false;

        const normalizedTitles = rootHeadings.map(h => this.normalizeHeadingTitle(h.title));
        const sectionPatterns = [
            /^(identity|identity and purpose|purpose|role|system|persona)$/,
            /^(steps|step|method|workflow|process|approach)$/,
            /^(instructions|instruction|rules|requirements|constraints|guidelines)$/,
            /^(output|output instructions|output format|format|response format)$/,
            /^(input|context|examples|example|notes?)$/
        ];

        const matches = normalizedTitles.filter(title =>
            sectionPatterns.some(pattern => pattern.test(title))
        ).length;

        const hasIdentityLike = normalizedTitles.some(title =>
            /^(identity|identity and purpose|purpose|role|system|persona)$/.test(title)
        );
        const hasOutputLike = normalizedTitles.some(title =>
            /^(output|output instructions|output format|format|response format)$/.test(title)
        );
        const hasInputLike = normalizedTitles.some(title =>
            /^(input|context|examples|example|notes?)$/.test(title)
        );
        const hasStepsLike = normalizedTitles.some(title =>
            /^(steps|step|method|workflow|process|approach)$/.test(title)
        );

        const mostlyInstructionSections = matches >= Math.max(2, Math.ceil(rootHeadings.length * 0.6));
        const classicPromptSections = hasIdentityLike && hasOutputLike && (hasInputLike || hasStepsLike);
        const markdownFile = /\.(md|markdown)$/i.test(filename || '');

        return classicPromptSections || (markdownFile && rootHeadings.length <= 8 && mostlyInstructionSections);
    }

    static normalizeHeadingTitle(title) {
        return String(title || '')
            .toLowerCase()
            .replace(/[`*_~:]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    static parsePlainText(content, filename = '') {
        const text = String(content || '').trim();
        if (!text) return [];

        return [{
            act: this.extractPlainTextTitle(text, filename),
            prompt: text
        }];
    }

    static parseSinglePromptDocument(content, filename = '') {
        const text = String(content || '').trim();
        if (!text) return [];

        const hasFrontmatter = /^---\s*[\r\n]/.test(text);
        const looksLikeMarkdown = /\.(md|markdown)$/i.test(filename || '')
            || hasFrontmatter
            || /^#{1,6}\s+\S+/m.test(text);

        if (looksLikeMarkdown) {
            const parsed = markdownToPrompt(text, filename);
            const prompt = hasFrontmatter
                ? String(parsed.content || '').trim()
                : this.stripLeadingTitleHeading(String(parsed.content || '').trim());
            if (prompt) {
                return [{
                    act: parsed.title || 'Untitled',
                    prompt,
                    category: parsed.category || '',
                    category_type: parsed.category_type || '',
                    category_key: parsed.category_key || '',
                    output_modality: parsed.output_modality || '',
                    classification_confidence: parsed.classification_confidence,
                    tags: parsed.tags || [],
                    shortcut: parsed.shortcut || '',
                    favorite: parsed.favorite || false,
                    variables: parsed.variables || []
                }];
            }
        }

        return this.parsePlainText(text, filename);
    }

    static stripLeadingTitleHeading(content) {
        return String(content || '')
            .replace(/^\s*#{1,6}\s+.+?(?:\r?\n)+/, '')
            .trim();
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

        if (!title) return '';
        if (title.length > 48) return title.slice(0, 48).trim() + '...';
        return title;
    }

    static normalizePromptEntry(entry, fallbackTitle = '') {
        if (typeof entry === 'string') {
            return {
                act: fallbackTitle || 'Untitled',
                prompt: entry
            };
        }

        const item = entry && typeof entry === 'object' ? entry : {};
        return {
            act: item.act || item.title || item.cmd || fallbackTitle || 'Untitled',
            prompt: item.prompt || item.content || item.text || '',
            category: item.category || '',
            category_type: item.category_type || '',
            category_key: item.category_key || '',
            output_modality: item.output_modality || '',
            classification_confidence: item.classification_confidence,
            tags: Array.isArray(item.tags) ? item.tags : this.parseTagList(item.tags),
            shortcut: item.shortcut || '',
            favorite: item.favorite || false,
            variables: item.variables || []
        };
    }

    static parseTagList(value) {
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value !== 'string') return [];
        return value
            .split(/[,\n，、]/)
            .map(tag => tag.trim())
            .filter(Boolean);
    }

    static parseCsvRows(content) {
        const rows = [];
        let row = [];
        let current = '';
        let inQuote = false;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const next = content[i + 1];

            if (char === '"') {
                if (inQuote && next === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
                continue;
            }

            if (char === ',' && !inQuote) {
                row.push(current.trim());
                current = '';
                continue;
            }

            if ((char === '\n' || char === '\r') && !inQuote) {
                if (char === '\r' && next === '\n') i++;
                row.push(current.trim());
                current = '';
                if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
                row = [];
                continue;
            }

            current += char;
        }

        row.push(current.trim());
        if (row.some(cell => String(cell).trim() !== '')) rows.push(row);
        return rows;
    }

    static splitMarkdownTableRow(line) {
        let text = String(line || '').trim();
        if (text.startsWith('|')) text = text.slice(1);
        if (text.endsWith('|')) text = text.slice(0, -1);

        const cells = [];
        let current = '';
        let escaped = false;

        for (const char of text) {
            if (escaped) {
                current += char;
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === '|') {
                cells.push(current.trim());
                current = '';
                continue;
            }

            current += char;
        }

        cells.push(current.trim());
        return cells;
    }
}
