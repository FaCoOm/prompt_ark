import { providerManager } from '../provider';
import { callGeminiWeb } from '../providers/gemini-web';
import type { RuntimeProvider } from '../types';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nameLocal: 'English' },
  { code: 'zh', name: 'Chinese', nameLocal: '中文' },
  { code: 'jp', name: 'Japanese', nameLocal: '日本語' },
  { code: 'ko', name: 'Korean', nameLocal: '한국어' },
  { code: 'es', name: 'Spanish', nameLocal: 'Español' },
  { code: 'fr', name: 'French', nameLocal: 'Français' },
  { code: 'de', name: 'German', nameLocal: 'Deutsch' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export interface PromptData {
  title: string;
  category: string;
  tags: string;
  content: string;
}

export interface TranslationResult {
  title: string;
  category: string;
  tags: string;
  content: string;
}

const DEFAULT_TRANSLATE_PROMPT = `You are an expert technical translator specializing in AI Prompt Engineering. Your task is to translate an existing AI prompt into the user's specified Target Language while perfectly preserving its underlying logic, structure, variables, and system instructions.

Input Parameters:
- title: The title/name of the prompt.
- category: The category the prompt belongs to.
- tags: A comma-separated list of tags.
- content: The actual prompt content which may contain variables and markdown formatting.
- targetLanguage: The language you must translate the text into.

CRITICAL RULES:
1. Preserve Variables: ANY text enclosed in {{ }} or [ ] (e.g., {{topic}}, {{tone:formal|casual}}, [Target Audience]) MUST be kept exactly as is. DO NOT translate the variable names or syntax.
2. Preserve Markdown: Keep all markdown structures (bold, italics, headers, lists, code blocks) intact.
3. Preserve Code Blocks: Content inside code fences must NOT be translated.
4. Preserve XML/HTML Tags: Keep <tags>, </tags>, and HTML elements exactly as-is.
5. Preserve Emoji: Keep all emoji characters in their original positions.
6. Preserve Technical Jargon: Words like "system prompt", "JSON", "API", or specific programming languages should remain in English if that is standard practice in the target language.
7. Natural Tone: The translation should sound natural and professional for an AI user in the target language.

targetLanguage accepts ISO language names: "Chinese", "Japanese", "Spanish", "French", etc.

You MUST respond with a strict JSON object matching this schema WITHOUT any markdown wrapping or comments.

Output JSON Schema:
{
  "title": "translated title",
  "category": "translated category",
  "tags": "translated comma-separated tags",
  "content": "translated prompt content"
}`;

async function loadTranslatePrompt(): Promise<string> {
  return DEFAULT_TRANSLATE_PROMPT;
}

export async function translatePrompt(
  promptData: PromptData,
  targetLanguage: LanguageCode,
  providerOverride?: RuntimeProvider
): Promise<TranslationResult> {
  const provider = providerOverride ?? (await providerManager.getActiveProvider());
  if (!provider) {
    throw new Error('No active AI provider configured. Please check your settings.');
  }

  const systemPrompt = await loadTranslatePrompt();
  const userContent = JSON.stringify(
    {
      title: promptData.title || '',
      category: promptData.category || '',
      tags: promptData.tags || '',
      content: promptData.content || '',
      targetLanguage: getLanguageName(targetLanguage),
    },
    null,
    2
  );

  return executeTranslation(systemPrompt, userContent, provider);
}

function getLanguageName(code: LanguageCode): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || code;
}

async function executeTranslation(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider
): Promise<TranslationResult> {
  switch (provider.type) {
    case 'gemini':
      return translateWithGeminiAPI(systemPrompt, userContent, provider);
    case 'openai':
    case 'openai-compatible':
      return translateWithOpenAI(systemPrompt, userContent, provider);
    case 'gemini-web':
      return translateWithGeminiWeb(userContent);
    default:
      throw new Error('Unsupported AI provider type');
  }
}

async function translateWithGeminiAPI(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider
): Promise<TranslationResult> {
  const model = provider.model || 'gemini-2.0-flash';
  const apiKey = provider.apiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ parts: [{ text: userContent }] }],
    generationConfig: {
      responseModalities: ['TEXT'],
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return JSON.parse(text);
}

async function translateWithOpenAI(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider
): Promise<TranslationResult> {
  const apiKey = provider.apiKey;
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const model = provider.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('OpenAI returned empty response');
  }

  return JSON.parse(text);
}

async function translateWithGeminiWeb(userContent: string): Promise<TranslationResult> {
  const targetLang = extractTargetLanguage(userContent);
  const compactPrompt = `Translate the following AI prompt metadata into ${targetLang}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;

  let result = await callGeminiWeb(compactPrompt);

  if (!result) {
    throw new Error(
      'Gemini Web returned empty response. Please ensure you are logged in at gemini.google.com and try again.'
    );
  }

  result = result
    .replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '')
    .trim();
  result = result.replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`\s*$/i, '').trim();

  const jsonStart = result.indexOf('{');
  const jsonEnd = result.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not parse JSON from Gemini Web response');
  }

  return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
}

function extractTargetLanguage(userContent: string): string {
  try {
    const parsed = JSON.parse(userContent);
    return parsed.targetLanguage || 'English';
  } catch {
    return 'English';
  }
}
