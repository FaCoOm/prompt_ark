export function detectLanguageHeuristic(text: string): 'zh' | 'en' {
  if (!text) return 'en';
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g) || []).length;
  const total = text.replace(/\s/g, '').length;
  return total > 0 && cjk / total > 0.3 ? 'zh' : 'en';
}

export async function detectLanguage(text: string): Promise<'zh' | 'en'> {
  const heuristic = detectLanguageHeuristic(text);

  try {
    const avail = await (window as unknown as { LanguageDetector?: { availability(): Promise<string> } }).LanguageDetector?.availability?.();
    if (avail === 'unavailable') return heuristic;

    const detector = await (window as unknown as { LanguageDetector?: { create(): Promise<{ detect(text: string): Promise<Array<{ detectedLanguage: string; confidence: number }>>; destroy(): void }> } }).LanguageDetector?.create?.();
    if (!detector) return heuristic;
    
    const results = await detector.detect(text);
    detector.destroy();

    if (results && results.length > 0 && results[0].confidence > 0.5) {
      const top = results[0].detectedLanguage;
      return top.startsWith('zh') || top === 'ja' ? 'zh' : 'en';
    }
  } catch {
    return heuristic;
  }
  return heuristic;
}

interface CategoryRule {
  zh: string;
  en: string;
  keywords: string[];
}

export const CATEGORY_RULES: CategoryRule[] = [
  { zh: '开发', en: 'Dev', keywords: ['code', 'bug', 'debug', 'review', 'refactor', 'api', 'function', 'class', 'error', 'test', '代码', '调试', '审查', '重构', '函数', '接口', '报错', '测试'] },
  { zh: '写作', en: 'Writing', keywords: ['write', 'essay', 'article', 'blog', 'email', 'letter', 'report', 'summary', '写', '文章', '邮件', '报告', '摘要', '总结', '博客', '信'] },
  { zh: '翻译', en: 'Translate', keywords: ['translate', 'translation', 'language', 'chinese', 'english', 'japanese', '翻译', '中文', '英文', '日文', '语言'] },
  { zh: '分析', en: 'Analysis', keywords: ['analyze', 'analysis', 'compare', 'evaluate', 'assess', 'data', '分析', '比较', '评估', '数据', '对比'] },
  { zh: '创意', en: 'Creative', keywords: ['creative', 'idea', 'brainstorm', 'story', 'design', 'slogan', '创意', '故事', '设计', '口号', '点子', '灵感'] },
  { zh: '学习', en: 'Learning', keywords: ['explain', 'learn', 'teach', 'tutorial', 'concept', 'understand', '解释', '学习', '教程', '概念', '理解', '知识'] },
];

export function extractTitleHeuristic(text: string): string {
  if (!text) return '';

  const headingMatch = text.match(/^#{1,3}\s+(.+)/m);
  if (headingMatch) {
    const h = headingMatch[1].trim();
    if (h.length <= 50) return h;
    return `${h.substring(0, 47)  }...`;
  }

  const firstLine = text.split(/[\n\r]/)[0].trim();
  if (firstLine.length > 0 && firstLine.length <= 50) return firstLine;

  const sentenceMatch = text.match(/^(.+?[.。！？!?])/s);
  if (sentenceMatch) {
    const s = sentenceMatch[1].trim();
    if (s.length <= 50) return s;
  }

  if (text.length <= 30) return text;
  const truncated = text.substring(0, 30);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated  }...`;
}

export function matchCategory(text: string, lang: 'zh' | 'en'): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  let bestMatch: { name: string; score: number } = { name: '', score: 0 };

  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { name: rule[lang] || rule.zh, score };
    }
  }
  return bestMatch.score >= 1 ? bestMatch.name : '';
}

interface ExtractResult {
  title: string;
  category: string;
  tags: string[];
  lang: 'zh' | 'en';
}

export async function extractTitleAndCategory(
  text: string,
  getActiveProviderFn: () => Promise<{ type: string } | null>,
  callCloudAPIFn: (text: string, lang: string) => Promise<{ title?: string; category?: string; tags?: string[] } | null>
): Promise<ExtractResult> {
  const lang = await detectLanguage(text);
  const provider = await getActiveProviderFn();

  if (provider?.type === 'gemini' || provider?.type === 'openai' || provider?.type === 'gemini-web') {
    try {
      const result = await callCloudAPIFn(text, lang);
      if (result?.title) {
        return { title: result.title, category: result.category || '', tags: result.tags || [], lang };
      }
    } catch (e) {
      console.error('Cloud API error, falling back:', e);
    }
    return {
      title: extractTitleHeuristic(text),
      category: matchCategory(text, lang),
      tags: [],
      lang,
    };
  }

  const title = extractTitleHeuristic(text);
  const category = matchCategory(text, lang);

  return { title, category, tags: [], lang };
}