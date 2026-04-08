// lib/ai/translate.js — Prompt translation
import { fetchWithTimeout, getActiveProvider } from './provider.js';
import { callGeminiWeb } from '../gemini-web.js';
import { loadPrompt } from '../prompt-loader.js';

function buildTranslationPayload(promptData = {}, targetLanguage = '') {
    return JSON.stringify({
        title: promptData.title || '',
        tags: promptData.tags || '',
        content: promptData.content || '',
        targetLanguage,
    }, null, 2);
}

function mergePreservedMetadata(result = {}, promptData = {}) {
    return {
        ...result,
        category: promptData.category || '',
        output_modality: promptData.output_modality || '',
    };
}

export async function translatePromptWithAI(promptData, targetLanguage) {
    const provider = await getActiveProvider();
    if (!provider) throw new Error('No active AI provider configured. Please check your settings.');

    const systemInstruction = await loadPrompt('translate-prompt');
    const userContent = buildTranslationPayload(promptData, targetLanguage);

    if (provider.type === 'gemini') {
        const model = provider.model || 'gemini-2.0-flash';
        const requestBody = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: userContent }] }],
            generationConfig: {
                responseModalities: ['TEXT'],
                responseMimeType: 'application/json',
            },
        };
        const resp = await fetchWithTimeout(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
                body: JSON.stringify(requestBody),
            }
        );
        if (!resp.ok) {
            const errText = await resp.text();
            console.error('[TranslatePrompt] Gemini API error:', resp.status, errText);
            throw new Error(`Gemini API ${resp.status}: ${errText}`);
        }
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Gemini returned empty response');
        return mergePreservedMetadata(JSON.parse(text), promptData);
    }

    if (provider.type === 'openai') {
        const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
            body: JSON.stringify({
                model: provider.model || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: userContent },
                ],
                response_format: { type: 'json_object' },
            }),
        });
        if (!resp.ok) throw new Error(`OpenAI API ${resp.status}`);
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error('OpenAI returned empty response');
        return mergePreservedMetadata(JSON.parse(text), promptData);
    }

    if (provider.type === 'gemini-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Do NOT translate or rewrite category/modality metadata outside the JSON input below.
Output schema: {"title":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callGeminiWeb(compactPrompt);
        if (!result) throw new Error('Gemini Web returned empty response. Please ensure you are logged in at gemini.google.com and try again.');
        console.log('[translatePromptWithAI] Raw Gemini Web result:', result.substring(0, 500));
        result = result.replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '').trim();
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Gemini Web response');
        return mergePreservedMetadata(JSON.parse(result.slice(jsonStart, jsonEnd + 1)), promptData);
    }

    throw new Error('Unsupported AI provider type or model missing feature');
}
