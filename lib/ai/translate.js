// lib/ai/translate.js — Prompt translation
import { fetchWithTimeout, getActiveProvider } from './provider.js';
import { callGeminiWeb } from '../gemini-web.js';
import { callKimiWeb } from '../kimi-web.js';
import { callXiaomimoWeb } from '../xiaomimo-web.js';
import { callQwenWeb } from '../qwen-web.js';
import { callQwenCNWeb } from '../qwen-cn-web.js';
import { callGrokWeb } from '../grok-web.js';
import { callGlmWeb } from '../glm-web.js';
import { callGlmIntlWeb } from '../glm-intl-web.js';
import { callDeepSeekWeb } from '../deepseek-web.js';
import { callDoubaoWeb } from '../doubao-web.js';
import { callChatGPTWeb } from '../chatgpt-web.js';
import { loadPrompt } from '../prompt-loader.js';

function buildTranslationPayload(promptData = {}, targetLanguage = '') {
    return JSON.stringify({
        title: promptData.title || '',
        category: promptData.category || '',
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

    if (provider.type === 'kimi-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callKimiWeb(compactPrompt);
        if (!result) throw new Error('Kimi Web returned empty response. Please ensure you are logged in at kimi.com and try again.');
        console.log('[translatePromptWithAI] Raw Kimi Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Kimi Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'xiaomimo-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callXiaomimoWeb(compactPrompt);
        if (!result) throw new Error('Xiaomi MiMo Web returned empty response. Please ensure you are logged in at aistudio.xiaomimimo.com and try again.');
        console.log('[translatePromptWithAI] Raw Xiaomi MiMo Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Xiaomi MiMo Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'qwen-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callQwenWeb(compactPrompt);
        if (!result) throw new Error('Qwen Web returned empty response. Please ensure you are logged in at chat.qwen.ai and try again.');
        console.log('[translatePromptWithAI] Raw Qwen Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Qwen Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'qwen-cn-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callQwenCNWeb(compactPrompt);
        if (!result) throw new Error('Qwen CN Web returned empty response. Please ensure you are logged in at chat2.qianwen.com and try again.');
        console.log('[translatePromptWithAI] Raw Qwen CN Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Qwen CN Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'grok-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callGrokWeb(compactPrompt);
        if (!result) throw new Error('Grok Web returned empty response. Please ensure you are logged in at grok.com and try again.');
        console.log('[translatePromptWithAI] Raw Grok Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Grok Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'glm-intl-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callGlmIntlWeb(compactPrompt);
        if (!result) throw new Error('GLM International Web returned empty response. Please ensure you are logged in at chat.z.ai and try again.');
        console.log('[translatePromptWithAI] Raw GLM Intl Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from GLM Intl Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'doubao-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        try {
            let result = await callDoubaoWeb(compactPrompt);
            if (!result) throw new Error('Doubao Web returned empty response. Please ensure you are logged in at doubao.com and try again.');
            console.log('[translatePromptWithAI] Raw Doubao Web result:', result.substring(0, 500));
            result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
            const jsonStart = result.indexOf('{');
            const jsonEnd = result.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Doubao Web response');
            return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
        } catch (e) {
            console.error('[translate] Doubao Web error:', e);
            throw e;
        }
    }

    if (provider.type === 'chatgpt-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callChatGPTWeb(compactPrompt);
        if (!result) throw new Error('ChatGPT Web returned empty response. Please ensure you are logged in at chatgpt.com and try again.');
        console.log('[translatePromptWithAI] Raw ChatGPT Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from ChatGPT Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'deepseek-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callDeepSeekWeb(compactPrompt);
        if (!result) throw new Error('DeepSeek Web returned empty response. Please ensure you are logged in at chat.deepseek.com and try again.');
        console.log('[translatePromptWithAI] Raw DeepSeek Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from DeepSeek Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'kimi-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callKimiWeb(compactPrompt);
        if (!result) throw new Error('Kimi Web returned empty response. Please ensure you are logged in at kimi.com and try again.');
        console.log('[translatePromptWithAI] Raw Kimi Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Kimi Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'xiaomimo-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callXiaomimoWeb(compactPrompt);
        if (!result) throw new Error('Xiaomi MiMo Web returned empty response. Please ensure you are logged in at aistudio.xiaomimimo.com and try again.');
        console.log('[translatePromptWithAI] Raw Xiaomi MiMo Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Xiaomi MiMo Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'qwen-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callQwenWeb(compactPrompt);
        if (!result) throw new Error('Qwen Web returned empty response. Please ensure you are logged in at chat.qwen.ai and try again.');
        console.log('[translatePromptWithAI] Raw Qwen Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Qwen Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'qwen-cn-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callQwenCNWeb(compactPrompt);
        if (!result) throw new Error('Qwen CN Web returned empty response. Please ensure you are logged in at chat2.qianwen.com and try again.');
        console.log('[translatePromptWithAI] Raw Qwen CN Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Qwen CN Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'grok-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callGrokWeb(compactPrompt);
        if (!result) throw new Error('Grok Web returned empty response. Please ensure you are logged in at grok.com and try again.');
        console.log('[translatePromptWithAI] Raw Grok Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Grok Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'glm-intl-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callGlmIntlWeb(compactPrompt);
        if (!result) throw new Error('GLM International Web returned empty response. Please ensure you are logged in at chat.z.ai and try again.');
        console.log('[translatePromptWithAI] Raw GLM Intl Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from GLM Intl Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'doubao-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        try {
            let result = await callDoubaoWeb(compactPrompt);
            if (!result) throw new Error('Doubao Web returned empty response. Please ensure you are logged in at doubao.com and try again.');
            console.log('[translatePromptWithAI] Raw Doubao Web result:', result.substring(0, 500));
            result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
            const jsonStart = result.indexOf('{');
            const jsonEnd = result.lastIndexOf('}');
            if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from Doubao Web response');
            return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
        } catch (e) {
            console.error('[translate] Doubao Web error:', e);
            throw e;
        }
    }

    if (provider.type === 'chatgpt-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callChatGPTWeb(compactPrompt);
        if (!result) throw new Error('ChatGPT Web returned empty response. Please ensure you are logged in at chatgpt.com and try again.');
        console.log('[translatePromptWithAI] Raw ChatGPT Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from ChatGPT Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    if (provider.type === 'deepseek-web') {
        const compactPrompt = `Translate the following AI prompt metadata into ${targetLanguage}.
RULES: Preserve {{variables}}, markdown, code blocks, and technical terms exactly. Output ONLY valid JSON, no markdown wrapping.
Output schema: {"title":"...","category":"...","tags":"...","content":"..."}

INPUT JSON:
${userContent}`;
        let result = await callDeepSeekWeb(compactPrompt);
        if (!result) throw new Error('DeepSeek Web returned empty response. Please ensure you are logged in at chat.deepseek.com and try again.');
        console.log('[translatePromptWithAI] Raw DeepSeek Web result:', result.substring(0, 500));
        result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        const jsonStart = result.indexOf('{');
        const jsonEnd = result.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('Could not parse JSON from DeepSeek Web response');
        return JSON.parse(result.slice(jsonStart, jsonEnd + 1));
    }

    throw new Error('Unsupported AI provider type or model missing feature');
}
