import { describe, it, expect } from 'vitest';
import {
  PromptParser,
  parseJson,
  parseCsv,
  parseMarkdownTable,
  parseMarkdownHeadings,
  parseFrontmatter,
  hasFrontmatter,
} from '../src/services/parser';
import type { ParsedPrompt } from '../src/services/parser/types';

describe('PromptParser', () => {
  describe('JSON parsing', () => {
    it('parses Prompt Ark native format', () => {
      const content = JSON.stringify({
        format: 'prompt-ark',
        prompts: [
          {
            title: 'Test Prompt',
            content: 'This is a test',
            category: 'Test',
            tags: ['test'],
            shortcut: 'test',
          },
        ],
      });

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Test Prompt');
      expect(result[0].prompt).toBe('This is a test');
      expect(result[0].category).toBe('Test');
      expect(result[0].tags).toEqual(['test']);
      expect(result[0].shortcut).toBe('test');
    });

    it('parses array format', () => {
      const content = JSON.stringify([
        { act: 'Act 1', prompt: 'Prompt 1' },
        { title: 'Title 2', content: 'Content 2' },
        { cmd: 'Cmd 3', text: 'Text 3' },
      ]);

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(3);
      expect(result[0].act).toBe('Act 1');
      expect(result[0].prompt).toBe('Prompt 1');
      expect(result[1].act).toBe('Title 2');
      expect(result[2].act).toBe('Cmd 3');
    });

    it('parses object format with string values', () => {
      const content = JSON.stringify({
        'Key 1': 'Value 1',
        'Key 2': 'Value 2',
      });

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].act).toBe('Key 1');
      expect(result[0].prompt).toBe('Value 1');
    });

    it('parses object format with nested objects', () => {
      const content = JSON.stringify({
        item1: { act: 'Act 1', prompt: 'Prompt 1' },
        item2: { title: 'Title 2', content: 'Content 2', favorite: true },
      });

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].favorite).toBeFalsy();
      expect(result[1].favorite).toBe(true);
    });

    it('filters out items without prompt content', () => {
      const content = JSON.stringify([
        { act: 'Has Prompt', prompt: 'Content' },
        { act: 'No Prompt', content: '' },
        { act: 'Undefined Prompt' },
      ]);

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Has Prompt');
    });

    it('returns empty array for invalid JSON', () => {
      const result = PromptParser.parse('not valid json');
      expect(result).toEqual([]);
    });
  });

  describe('CSV parsing', () => {
    it('parses CSV with act,prompt headers', () => {
      const content = 'act,prompt\nTest 1,Content 1\nTest 2,Content 2';
      const result = PromptParser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].act).toBe('Test 1');
      expect(result[0].prompt).toBe('Content 1');
    });

    it('parses CSV with title,content headers', () => {
      const content = 'title,content,category\nTitle 1,Body 1,Cat 1';
      const result = parseCsv(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Title 1');
      expect(result[0].prompt).toBe('Body 1');
    });

    it('parses CSV with quoted values containing commas', () => {
      const content = 'act,prompt\n"Title, with comma","Content, with comma"';
      const result = parseCsv(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Title, with comma');
      expect(result[0].prompt).toBe('Content, with comma');
    });

    it('parses CSV with cmd,text headers', () => {
      const content = 'cmd,text\nCommand,Text body';
      const result = PromptParser.parse(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Command');
    });

    it('returns Untitled when act column missing', () => {
      const content = 'prompt\nJust content';
      const result = parseCsv(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Untitled');
    });

    it('returns empty array when no prompt column', () => {
      const content = 'foo,bar\na,b';
      const result = parseCsv(content);
      expect(result).toEqual([]);
    });
  });

  describe('Markdown Table parsing', () => {
    it('parses standard markdown table', () => {
      const content = `| act | prompt |
|-----|--------|
| Act 1 | Content 1 |
| Act 2 | Content 2 |`;

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].act).toBe('Act 1');
      expect(result[0].prompt).toBe('Content 1');
    });

    it('parses table with title,content headers', () => {
      const content = `| act | prompt |
|-----|--------|
| Title | Body |`;

      const result = parseMarkdownTable(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('Title');
    });

    it('ignores non-table content', () => {
      const content = `Some text without tables`;
      const result = parseMarkdownTable(content);
      expect(result).toEqual([]);
    });

    it('requires delimiter line', () => {
      const content = `| act | prompt |
| Act 1 | Content 1 |`;

      const result = parseMarkdownTable(content);
      expect(result).toEqual([]);
    });

    it('handles extra whitespace', () => {
      const content = `|  act  |  prompt  |
|-------|----------|
|  A 1  |  C 1  |`;

      const result = parseMarkdownTable(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('A 1');
    });
  });

  describe('Markdown Headings parsing', () => {
    it('parses headings as prompts', () => {
      const content = `# Heading 1
Content for heading 1
More content

# Heading 2
Content for heading 2`;

      const result = PromptParser.parse(content);
      expect(result).toHaveLength(2);
      expect(result[0].act).toBe('Heading 1');
      expect(result[0].prompt).toBe('Content for heading 1\nMore content');
      expect(result[1].act).toBe('Heading 2');
    });

    it('handles different heading levels', () => {
      const content = `## Level 2
Content
### Level 3
More content`;

      const result = parseMarkdownHeadings(content);
      expect(result).toHaveLength(2);
      expect(result[0].act).toBe('Level 2');
      expect(result[1].act).toBe('Level 3');
    });

    it('returns empty array when no headings', () => {
      const content = 'Just plain text\nwithout any headings';
      const result = parseMarkdownHeadings(content);
      expect(result).toEqual([]);
    });

    it('ignores content before first heading', () => {
      const content = `Some intro text
# First Heading
Content here`;

      const result = parseMarkdownHeadings(content);
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('First Heading');
    });
  });

  describe('Frontmatter parsing', () => {
    it('detects frontmatter', () => {
      expect(hasFrontmatter('---\ntitle: Test\n---\nContent')).toBe(true);
      expect(hasFrontmatter('No frontmatter here')).toBe(false);
      expect(hasFrontmatter('')).toBe(false);
    });

    it('parses frontmatter with title and content', () => {
      const content = `---
title: My Prompt
category: Writing
tags: [test, example]
---
This is the prompt content.`;

      const result = parseFrontmatter(content, 'test.md');
      expect(result).toHaveLength(1);
      expect(result[0].act).toBe('My Prompt');
      expect(result[0].prompt).toBe('This is the prompt content.');
      expect(result[0].category).toBe('Writing');
      expect(result[0].tags).toEqual(['test', 'example']);
    });

    it('uses filename as fallback title', () => {
      const content = `---
category: Test
---
Content here`;

      const result = parseFrontmatter(content, 'my-prompt.md');
      expect(result[0].act).toBe('my prompt');
    });

    it('handles boolean favorite', () => {
      const content = `---
title: Fav Prompt
favorite: true
---
Content`;

      const result = parseFrontmatter(content);
      expect(result[0].favorite).toBe(true);
    });
  });

  describe('Auto-detection', () => {
    it('detects JSON format', () => {
      const content = JSON.stringify([{ act: 'Test', prompt: 'Content' }]);
      const result = PromptParser.parseWithResult(content);
      expect(result.format).toBe('json');
      expect(result.prompts).toHaveLength(1);
    });

    it('detects CSV format', () => {
      const content = 'act,prompt\nTest,Content';
      const result = PromptParser.parseWithResult(content);
      expect(result.format).toBe('csv');
    });

    it('detects markdown table format', () => {
      const content = `| act | prompt |
|---|---|
| Test | Content |`;
      const result = PromptParser.parseWithResult(content);
      expect(result.format).toBe('markdown-table');
    });

    it('detects frontmatter for .md files', () => {
      const content = `---
title: Test
---
Content`;
      const result = PromptParser.parseWithResult(content, 'test.md');
      expect(result.format).toBe('frontmatter');
    });

    it('detects markdown headings', () => {
      const content = '# Heading\nContent';
      const result = PromptParser.parseWithResult(content);
      expect(result.format).toBe('markdown-headings');
    });

    it('returns unknown for unparseable content', () => {
      const result = PromptParser.parseWithResult('random text');
      expect(result.format).toBe('unknown');
      expect(result.prompts).toEqual([]);
    });
  });

  describe('Edge cases', () => {
    it('handles empty content', () => {
      expect(PromptParser.parse('')).toEqual([]);
      expect(PromptParser.parse('   ')).toEqual([]);
    });

    it('handles null/undefined via type safety', () => {
      const parser = new PromptParser();
      expect(parser.parse('')).toEqual([]);
    });

    it('canParse identifies supported formats', () => {
      const parser = new PromptParser();
      expect(parser.canParse('[{"act":"test","prompt":"content"}]')).toBe(true);
      expect(parser.canParse('act,prompt\ntest,content')).toBe(true);
      expect(parser.canParse('# Heading')).toBe(true);
      expect(parser.canParse('random')).toBe(false);
    });
  });
});
