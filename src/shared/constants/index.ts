import type { Prompt } from '../types/prompt';

export const DEFAULT_PROMPTS: Array<Omit<Prompt, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'favorite' | 'versions'>> = [];

export const CATEGORY_RULES = [
  { zh: '开发', en: 'Dev', keywords: ['code', 'bug', 'debug', 'review', 'refactor', 'api', 'function', 'class', 'error', 'test', '代码', '调试', '审查', '重构', '函数', '接口', '报错', '测试'] },
  { zh: '写作', en: 'Writing', keywords: ['write', 'essay', 'article', 'blog', 'email', 'letter', 'report', 'summary', '写', '文章', '邮件', '报告', '摘要', '总结', '博客', '信'] },
  { zh: '翻译', en: 'Translate', keywords: ['translate', 'translation', 'language', 'chinese', 'english', 'japanese', '翻译', '中文', '英文', '日文', '语言'] },
  { zh: '分析', en: 'Analysis', keywords: ['analyze', 'analysis', 'compare', 'evaluate', 'assess', 'data', '分析', '比较', '评估', '数据', '对比'] },
  { zh: '创意', en: 'Creative', keywords: ['creative', 'idea', 'brainstorm', 'story', 'design', 'slogan', '创意', '故事', '设计', '口号', '点子', '灵感'] },
  { zh: '学习', en: 'Learning', keywords: ['explain', 'learn', 'teach', 'tutorial', 'concept', 'understand', '解释', '学习', '教程', '概念', '理解', '知识'] },
] as const;