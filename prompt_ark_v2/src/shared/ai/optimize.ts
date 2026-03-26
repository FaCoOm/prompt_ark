import { aiManager } from './provider';

export interface OptimizeOptions {
  content: string;
  variant: 'concise' | 'enhanced' | 'professional';
  providerId: string;
}

export interface OptimizeResult {
  original: string;
  optimized: string;
  variant: string;
  explanation?: string;
}

const optimizePrompts: Record<
  OptimizeOptions['variant'],
  (content: string) => string
> = {
  concise: (content) =>
    `Please make the following prompt more concise and to the point, removing any unnecessary words while keeping the core meaning:

${content}

Provide only the optimized prompt, no explanations.`,
  enhanced: (content) =>
    `Please enhance the following prompt to make it more effective and detailed. Add more context, specificity, and structure while keeping it clear:

${content}

Provide only the enhanced prompt, no explanations.`,
  professional: (content) =>
    `Please rewrite the following prompt in a more professional and formal tone. Use industry-standard terminology and structure:

${content}

Provide only the professional version, no explanations.`,
};

export async function optimizePrompt(
  options: OptimizeOptions
): Promise<OptimizeResult> {
  const provider = aiManager.getProvider(options.providerId);
  if (!provider) {
    throw new Error('AI provider not found');
  }

  const systemPrompt =
    'You are a prompt engineering expert. Your task is to optimize prompts for better results with AI systems.';
  const userPrompt = optimizePrompts[options.variant](options.content);

  const response = await provider.chat({
    model: 'default',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  return {
    original: options.content,
    optimized: response.content.trim(),
    variant: options.variant,
    explanation: `Optimized using ${provider.name} with ${options.variant} variant`,
  };
}

export interface TranslateOptions {
  content: string;
  title: string;
  category: string;
  tags: string[];
  targetLanguage: string;
  providerId: string;
}

export interface TranslateResult {
  content: string;
  title: string;
  category: string;
  tags: string[];
  language: string;
}

export async function translatePrompt(
  options: TranslateOptions
): Promise<TranslateResult> {
  const provider = aiManager.getProvider(options.providerId);
  if (!provider) {
    throw new Error('AI provider not found');
  }

  const systemPrompt = `You are a professional translator. Translate the following prompt and its metadata to ${options.targetLanguage}. Maintain the meaning, tone, and formatting.`;

  const contentToTranslate = `Title: ${options.title}
Category: ${options.category}
Tags: ${options.tags.join(', ')}
Content:
${options.content}`;

  const response = await provider.chat({
    model: 'default',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contentToTranslate },
    ],
    temperature: 0.3,
  });

  // Parse the response to extract translated parts
  const result = response.content;
  const titleMatch = result.match(/Title:\s*(.+)/i);
  const categoryMatch = result.match(/Category:\s*(.+)/i);
  const tagsMatch = result.match(/Tags:\s*(.+)/i);
  const contentMatch = result.match(/Content:\s*([\s\S]+)/i);

  return {
    title: titleMatch?.[1]?.trim() ?? options.title,
    category: categoryMatch?.[1]?.trim() ?? options.category,
    tags: tagsMatch?.[1]?.split(',').map((t) => t.trim()) ?? options.tags,
    content: contentMatch?.[1]?.trim() ?? options.content,
    language: options.targetLanguage,
  };
}

export interface SmartConvertOptions {
  text: string;
  pageContext?: {
    url: string;
    title: string;
  };
  providerId: string;
}

export interface SmartConvertResult {
  title: string;
  content: string;
  category: string;
  tags: string[];
  variables: string[];
}

export async function smartConvert(
  options: SmartConvertOptions
): Promise<SmartConvertResult> {
  const provider = aiManager.getProvider(options.providerId);
  if (!provider) {
    throw new Error('AI provider not found');
  }

  const systemPrompt = `You are a prompt engineering expert. Convert the user's text into a well-structured, reusable prompt.

Analyze the text and create:
1. A clear title for the prompt
2. An appropriate category
3. Relevant tags (max 5)
4. The main content as a reusable prompt with {{variables}} for dynamic parts
5. A list of variable names used

Respond in this exact format:
Title: [title]
Category: [category]
Tags: [tag1, tag2, tag3]
Variables: [var1, var2]
Content:
[the prompt content with {{variables}}]`;

  let userContent = options.text;
  if (options.pageContext) {
    userContent += `\n\nContext: Found on "${options.pageContext.title}" (${options.pageContext.url})`;
  }

  const response = await provider.chat({
    model: 'default',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
  });

  const result = response.content;

  const titleMatch = result.match(/Title:\s*(.+)/i);
  const categoryMatch = result.match(/Category:\s*(.+)/i);
  const tagsMatch = result.match(/Tags:\s*(.+)/i);
  const variablesMatch = result.match(/Variables:\s*(.+)/i);
  const contentMatch = result.match(/Content:\s*([\s\S]+)/i);

  return {
    title: titleMatch?.[1]?.trim() ?? 'Untitled',
    category: categoryMatch?.[1]?.trim() ?? 'General',
    tags: tagsMatch?.[1]?.split(',').map((t) => t.trim()) ?? [],
    variables:
      variablesMatch?.[1]?.split(',').map((v) => v.trim().replace(/[{}]/g, '')) ?? [],
    content: contentMatch?.[1]?.trim() ?? options.text,
  };
}
