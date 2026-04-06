// lib/ai/share.js — Share content generation + social platform definitions
import { fetchWithTimeout, getActiveProvider } from './provider.js';
import { callGeminiWeb } from '../gemini-web.js';
import { callKimiWeb } from '../kimi-web.js';
import { callXiaomimoWeb } from '../xiaomimo-web.js';
import { callQwenWeb } from '../qwen-web.js';
import { callQwenCNWeb } from '../qwen-cn-web.js';
import { callGrokWeb } from '../grok-web.js';
import { callGlmWeb } from '../glm-web.js';
import { callGlmIntlWeb } from '../glm-intl-web.js';
import { loadPrompt } from '../prompt-loader.js';

export const SHARE_PLATFORM_NAMES = ['twitter', 'reddit', 'zhihu', 'wechat', 'xiaohongshu', 'linkedin'];

const WECHAT_ROOT_URL = 'https://mp.weixin.qq.com/';

function buildWechatEditorUrl(token) {
    return `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&lang=zh_CN&token=${encodeURIComponent(token)}`;
}

function resolveWechatEditorState(currentUrl) {
    if (!currentUrl) return { ready: false };

    try {
        const parsed = new URL(currentUrl);
        if (parsed.hostname !== 'mp.weixin.qq.com') {
            return { ready: false };
        }

        const token = parsed.searchParams.get('token');
        if (!token) {
            return { ready: false };
        }

        const isEditorPage = parsed.pathname === '/cgi-bin/appmsg'
            && parsed.searchParams.get('t') === 'media/appmsg_edit_v2'
            && parsed.searchParams.get('action') === 'edit'
            && parsed.searchParams.get('isNew') === '1'
            && parsed.searchParams.get('type') === '77'
            && parsed.searchParams.get('createType') === '0';

        if (isEditorPage) {
            return { ready: true };
        }

        return {
            ready: false,
            redirectUrl: buildWechatEditorUrl(token),
        };
    } catch (e) {
        return { ready: false };
    }
}

// Social platform editor configs for auto-inject (verified via browser inspection)
export const SOCIAL_EDITORS = {
    zhihu: {
        url: 'https://zhuanlan.zhihu.com/write',
        titleSelectors: ['textarea.WriteIndex-titleInput', 'textarea[placeholder*="标题"]'],
        contentSelectors: ['.public-DraftEditor-content', '.Editable-content', '[contenteditable="true"]'],
        publishSelector: 'button.PublishPanel-stepOneButton, button[data-tooltip="发布"]',
    },
    wechat: {
        url: WECHAT_ROOT_URL,
        titleSelectors: ['textarea#title', 'textarea.js_title', 'textarea[placeholder*="标题"]'],
        contentSelectors: ['div.ProseMirror', '[contenteditable="true"]'],
        abstractSelectors: ['textarea#js_description'],
        publishSelector: 'button#js_send, a.preview_send_btn',
    },
    xiaohongshu: {
        url: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
        preClickSelector: 'button.new-btn', // Must click "新的创作" first
        titleSelectors: ['textarea.d-text[placeholder="输入标题"]', 'textarea[placeholder*="标题"]'],
        contentSelectors: ['.tiptap.ProseMirror', '.ProseMirror', '[contenteditable="true"]'],
        publishSelector: 'button.el-button--primary, button:has(.publishBtn)',
    },
    linkedin: {
        url: 'https://www.linkedin.com/feed/?shareActive=true',
        preClickSelector: 'button[data-control-name="share.start"], .share-box__trigger, button.artdeco-button--primary, button.artdeco-button',
        titleSelectors: [],
        contentSelectors: [
            '.ql-editor[contenteditable="true"]',
            '.artdeco-modal .ql-editor',
            '.share-box-for .ql-editor',
            '.ql-container .ql-editor',
            '[contenteditable="true"].ql-editor',
            '[role="textbox"][aria-multiline="true"]',
            '[contenteditable="true"]'
        ],
        publishSelector: 'button.share-actions__primary-action, button.share-box-scaffold__primary-btn, button.artdeco-button--primary',
    },
};

// Variant labels for UI
export const VARIANT_LABELS = ['concise', 'contract', 'full-spec'];

// Article sharing platforms and their language config
export const ARTICLE_SHARE_PLATFORMS = {
    zhihu: { promptName: 'share-article-zhihu', lang: 'zh' },
    reddit: { promptName: 'share-article-reddit', lang: 'en' },
    wechat: { promptName: 'share-article-wechat', lang: 'zh' },
    linkedin: { promptName: 'share-article-linkedin', lang: 'en' },
    xiaohongshu: { promptName: 'share-article-xiaohongshu', lang: 'zh' },
    twitter: { promptName: 'share-article-twitter', lang: 'en' },
};

export function buildFallbackText(platform, title, url, prompt = {}) {
    if (platform === 'zhihu') {
        const content = prompt.content || '';
        const preview = content.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 150);
        const varCount = (content.match(/\{\{([^}]+)\}\}/g) || []).length;
        
        return `# ${title}

很多人用AI的效果不好，核心原因往往不是AI不行，而是prompt写得太随意。

一个好的prompt通常包含三个要素：**角色设定**、**任务约束**、**输出格式**。

${preview.length > 20 ? `\n以这个prompt为例：\n\n> ${preview}...\n` : ''}
${varCount > 0 ? `它还设计了${varCount}个变量插槽，可以根据不同场景快速填入。\n` : ''}
---
完整prompt模板：${url}`;
    }
    
    if (platform === 'wechat') {
        const category = prompt.category || 'AI';
        
        return `## 用AI提效，关键不在工具，在方法

你有没有遇到过这种情况：同样用ChatGPT，别人几分钟搞定的事，你来回改了半小时还不满意？

差距不在AI，在于怎么跟它"说话"。今天分享3个立刻能用的技巧：

## 技巧一：先给AI一个身份

与其说"帮我写个方案"，不如说"你是一位有10年经验的${category}专家"。给AI角色设定，输出质量会有质的提升。

## 技巧二：约束输出格式

直接说"用markdown表格对比3个方案的优劣势"，比"分析一下"清晰100倍。AI最怕模糊指令。

## 技巧三：用现成的好模板

「${title}」就是一个设计好的prompt模板，把上面两个技巧都融入了结构里，填入变量就能直接用。

---

完整prompt模板 → ${url}`;
    }
    
    if (platform === 'xiaohongshu') {
        const category = prompt.category || 'AI';
        
        return `3个让${category}效率翻倍的AI使用技巧 🔥

📌 技巧1：给AI一个专业身份
不要 说"帮我写"，而是说"你是XX领域专家"
效果立刻不一样！

💡 技巧2：指定输出格式
"用表格对比" > "分析一下"
AI最怕你说得不清楚

✅ 技巧3：用好prompt模板
「${title}」就是一个现成的好模板
角色+约束+格式都设计好了

⚡ 这3个方法不管用哪个AI都有效
ChatGPT / Gemini / Claude 通吃

💬 完整prompt模板：${url}`;
    }
    
    if (platform === 'twitter') {
        const content = prompt.content || '';
        const firstLines = content.split(/\r?\n/).filter(l => l.trim()).slice(0, 2).join(' ');
        const preview = firstLines.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 100);
        
        const lines = [`🧠 "${title}"`];
        if (preview.length > 0) lines.push(`\n\n💬 "${preview}${content.length > 100 ? '...' : ''}"`);
        
        const varMatches = content.match(/\{\{([^}]+)\}\}/g) || [];
        if (varMatches.length > 0) lines.push(`\n\n⚡ ${varMatches.length} variable${varMatches.length > 1 ? 's' : ''} · customizable`);
        
        lines.push(`\n\n🔗 One-click install → ${url}`);
        lines.push(`\n#PromptEngineering #AI`);
        
        return lines.join('');
    }
    
    if (platform === 'reddit') {
        const content = prompt.content || '';
        const preview = content
            .replace(/\{\{@[^}]+\}\}/g, '[auto-filled]')
            .replace(/\{\{([^}:]+):[^}]*\|[^}]*\}\}/g, '[choose: $1]')
            .replace(/\{\{([^}:]+):[^}]+\}\}/g, '[$1]')
            .replace(/\{\{([^}]+)\}\}/g, '[$1]')
            .substring(0, 300);
        
        return `**Prompt preview:**\n\n> ${preview}${content.length > 300 ? '...' : ''}\n\n---\n\n🔗 **[One-click install with Prompt Ark](${url})**`;
    }
    
    if (platform === 'linkedin') {
        const content = prompt.content || '';
        const category = prompt.category || 'AI';
        const varCount = (content.match(/\{\{([^}]+)\}\}/g) || []).length;
        
        const lines = [`I spent way too long on ${category.toLowerCase()} tasks last week.`];
        lines.push(`\nThen I found a structured prompt template that cut the time in half.\n`);
        lines.push(`Here's what makes "${title}" different:\n`);
        if (varCount > 0) lines.push(`📊 ${varCount} customizable variable${varCount > 1 ? 's' : ''} — adapts to your specific context`);
        lines.push(`\nThe key insight: good AI output is 80% prompt structure, 20% the model itself.`);
        lines.push(`\nTemplate: ${url}`);
        
        return lines.join('\n');
    }
    
    return '';
}

export async function generateShareText(promptContent, title, url, platform) {
    const provider = await getActiveProvider();
    if (!provider) return null;

    if (!SHARE_PLATFORM_NAMES.includes(platform)) return null;
    const systemPrompt = await loadPrompt(`share-${platform}`);

    const userContent = JSON.stringify({
        title,
        content: promptContent.substring(0, 800),
        url,
    });

    // Determine expected output schema based on platform
    const isReddit = platform === 'reddit';
    const schemaProps = isReddit
        ? {
            title: { type: 'string', description: 'Reddit post title' },
            body: { type: 'string', description: 'Reddit post body in markdown' },
        }
        : { text: { type: 'string', description: 'Generated share content' } };
    const schemaRequired = isReddit ? ['title', 'body'] : ['text'];

    try {
        if (provider.type === 'gemini') {
            const model = provider.model || 'gemini-2.0-flash';
            const resp = await fetchWithTimeout(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ parts: [{ text: userContent }] }],
                        generationConfig: {
                            responseModalities: ['TEXT'],
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: 'object',
                                properties: schemaProps,
                                required: schemaRequired,
                            },
                        },
                    }),
                }
            );
            if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);
            const data = await resp.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return raw ? JSON.parse(raw) : null;
        }

        if (provider.type === 'openai') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify({
                    model: provider.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt + '\n\n' + jsonHint },
                        { role: 'user', content: userContent },
                    ],
                    response_format: { type: 'json_object' },
                }),
            });
            if (!resp.ok) throw new Error(`OpenAI API ${resp.status}`);
            const data = await resp.json();
            const raw = data.choices?.[0]?.message?.content;
            return raw ? JSON.parse(raw) : null;
        }

        if (provider.type === 'gemini-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGeminiWeb(webPrompt);
            result = result.replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '').trim();
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'kimi-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callKimiWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'xiaomimo-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callXiaomimoWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'qwen-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callQwenWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'qwen-cn-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callQwenCNWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'grok-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGrokWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'glm-intl-web') {
            const jsonHint = isReddit
                ? 'Return JSON only: {"title":"...","body":"..."}'
                : 'Return JSON only: {"text":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nPrompt data:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGlmIntlWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }
    } catch (e) {
        console.error('[generateShareText] Error:', e);
        return null;
    }

    return null;
}

/**
 * Generate article share text by rewriting source content for a social platform.
 * Uses platform-specific prompt with embedded humanization rules.
 * @param {string} sourceText - Raw text from page selection or body
 * @param {string} platform - One of ARTICLE_SHARE_PLATFORMS keys
 * @returns {Promise<{title?: string, body: string} | null>}
 */
export async function generateArticleShareText(sourceText, platform) {
    const platformConfig = ARTICLE_SHARE_PLATFORMS[platform];
    if (!platformConfig) return null;

    const provider = await getActiveProvider();
    if (!provider) return null;

    const systemPrompt = await loadPrompt(platformConfig.promptName);
    // Truncate source text to avoid exceeding context limits
    const userContent = sourceText.substring(0, 8000);




    const schemaProps = {
        title: { type: 'string', description: 'Article title' },
        body: { type: 'string', description: 'Article body' },
    };

    try {
        if (provider.type === 'gemini') {
            const model = provider.model || 'gemini-2.0-flash';
            const resp = await fetchWithTimeout(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ parts: [{ text: userContent }] }],
                        generationConfig: {
                            responseModalities: ['TEXT'],
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: 'object',
                                properties: schemaProps,
                                required: ['body'],
                            },
                        },
                    }),
                }
            );
            if (!resp.ok) throw new Error(`Gemini API ${resp.status}`);
            const data = await resp.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return raw ? JSON.parse(raw) : null;
        }

        if (provider.type === 'openai') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
                body: JSON.stringify({
                    model: provider.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt + '\n\n' + jsonHint },
                        { role: 'user', content: userContent },
                    ],
                    response_format: { type: 'json_object' },
                }),
            });
            if (!resp.ok) throw new Error(`OpenAI API ${resp.status}`);
            const data = await resp.json();
            const raw = data.choices?.[0]?.message?.content;
            return raw ? JSON.parse(raw) : null;
        }

        if (provider.type === 'gemini-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGeminiWeb(webPrompt);
            result = result.replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '').trim();
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'kimi-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callKimiWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'xiaomimo-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callXiaomimoWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'qwen-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callQwenWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'grok-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGrokWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'qwen-cn-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callQwenCNWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }

        if (provider.type === 'glm-intl-web') {
            const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
            const webPrompt = `${systemPrompt}\n\n${jsonHint}\n\nSource content to rewrite:\n\`\`\`\n${userContent}\n\`\`\``;
            let result = await callGlmIntlWeb(webPrompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        }
    } catch (e) {
        console.error('[generateArticleShareText] Error:', e);
        return null;
    }

    return null;
}

/**
 * Inject share content into a social media editor tab.
 * Encapsulates the entire multi-step MAIN world injection pipeline.
 * @returns {Promise<string>} Generated share text
 */
export async function shareToSocialPlatform({ content, title, url, platform, fallbackText, skipGenerate }, sendResponse) {
    const editor = SOCIAL_EDITORS[platform];
    if (!editor) {
        sendResponse({ success: false, error: 'Unsupported platform', tabOpened: false });
        return;
    }

    // Generate share text via LLM (skip if caller already generated content, e.g. article share)
    let shareText = fallbackText || '';
    if (!skipGenerate) {
        try {
            const result = await generateShareText(content, title, url, platform);
            if (result?.text) shareText = result.text;
        } catch (e) {
            console.warn('[SHARE_TO_PLATFORM] LLM failed, using fallback:', e);
        }
    }

    // Open the editor tab
    const newTab = await chrome.tabs.create({ url: editor.url });
    const responseMeta = { tabOpened: !!newTab?.id };
    let hasResponded = false;

    const safeSendResponse = (payload) => {
        if (hasResponded) return;
        hasResponded = true;
        sendResponse(payload);
    };

    // Multi-step injection function — runs in page's MAIN world
    const injectInMainWorld = async (tabId) => {
        const editorConfig = { ...editor, shareText, promptTitle: title };
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: (config) => {
                const delay = (ms) => new Promise(r => setTimeout(r, ms));
                const normalizeText = (value) => String(value || '')
                    .replace(/\u200B/g, '')
                    .replace(/\u00A0/g, ' ')
                    .replace(/\r/g, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                const compactText = (value) => normalizeText(value).replace(/\s+/g, ' ').trim();
                const escapeHtml = (value) => String(value || '')
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                const readText = (el) => normalizeText(
                    el?.value ?? el?.innerText ?? el?.textContent ?? ''
                );
                const hasExpectedText = (el, text) => {
                    const expected = normalizeText(text);
                    const actual = readText(el);
                    const expectedCompact = compactText(text);
                    const actualCompact = compactText(actual);
                    if (!expectedCompact) return actualCompact.length === 0;
                    if (!actualCompact) return false;
                    if (
                        actualCompact.includes(expectedCompact)
                        || expectedCompact.includes(actualCompact)
                    ) {
                        return true;
                    }

                    const lines = expected
                        .split('\n')
                        .map(line => compactText(line))
                        .filter(line => line.length >= 4);
                    const samples = [...new Set([
                        lines[0],
                        lines[Math.floor(lines.length / 2)],
                        lines[lines.length - 1],
                        expectedCompact.slice(0, 24),
                        expectedCompact.slice(-24)
                    ].filter(Boolean))];
                    const matches = samples.filter(sample => actualCompact.includes(sample)).length;
                    return matches >= Math.min(2, samples.length);
                };
                const selectContents = (el) => {
                    const selection = window.getSelection();
                    if (!selection || !el) return;
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    selection.removeAllRanges();
                    selection.addRange(range);
                };
                const buildParagraphHtml = (text) => text.split('\n')
                    .map(line => `<p>${line ? escapeHtml(line) : '<br>'}</p>`).join('');

                const findEl = (selectors) => {
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el) return el;
                        // LinkedIn: Shadow DOM traversal
                        if (location.hostname.includes('linkedin')) {
                            for (const host of document.querySelectorAll('*')) {
                                if (host.shadowRoot) {
                                    const shadowEl = host.shadowRoot.querySelector(sel);
                                    if (shadowEl) return shadowEl;
                                }
                            }
                        }
                    }
                    return null;
                };
                const waitForEl = async (selectors, timeoutMs = 8000, intervalMs = 250) => {
                    const startedAt = Date.now();
                    let el = findEl(selectors);
                    while (!el && (Date.now() - startedAt) < timeoutMs) {
                        await delay(intervalMs);
                        el = findEl(selectors);
                    }
                    return el;
                };

                const fillInput = async (el, text) => {
                    if (!el) return false;
                    el.focus();

                    // LinkedIn Quill editor: simplified injection
                    if (el.classList.contains('ql-editor') && location.hostname.includes('linkedin')) {
                        el.classList.remove('ql-blank');
                        el.innerHTML = text.split('\n').map(line => line ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>').join('');
                        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        ['keydown', 'keypress', 'keyup'].forEach(type => {
                            el.dispatchEvent(new KeyboardEvent(type, { bubbles: true, key: 'a' }));
                        });
                        await delay(300);
                        return el.innerText.trim().length > 0;
                    }

                    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                        const nativeSetter = Object.getOwnPropertyDescriptor(
                            window.HTMLTextAreaElement.prototype, 'value'
                        )?.set || Object.getOwnPropertyDescriptor(
                            window.HTMLInputElement.prototype, 'value'
                        )?.set;
                        if (nativeSetter) nativeSetter.call(el, text);
                        else el.value = text;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        await delay(120);
                        return hasExpectedText(el, text);
                    }

                    // Contenteditable (Draft.js, ProseMirror, Tiptap, etc.)
                    el.click();

                    const quill = el.__quill
                        || el.closest('.ql-container')?.__quill
                        || window.Quill?.find?.(el.closest('.ql-container') || el);

                    if (quill && typeof quill.setText === 'function') {
                        try {
                            quill.setText(text, 'user');
                        } catch (e) { /* fall through */ }
                        await delay(150);
                        if (hasExpectedText(el, text)) return true;
                    }

                    // Method 1: Simulated paste event
                    try {
                        selectContents(el);
                        const htmlText = text.replace(/\n/g, '<br>');
                        const dt = new DataTransfer();
                        dt.setData('text/plain', text);
                        dt.setData('text/html', `<p>${htmlText}</p>`);
                        el.dispatchEvent(new ClipboardEvent('paste', {
                            bubbles: true, cancelable: true, clipboardData: dt
                        }));
                    } catch (e) { /* fall through */ }

                    await delay(180);
                    if (hasExpectedText(el, text)) return true;

                    // Method 2: execCommand
                    try {
                        selectContents(el);
                        document.execCommand('insertText', false, text);
                    } catch (e) { /* fall through */ }

                    await delay(180);
                    if (hasExpectedText(el, text)) return true;

                    // Method 3: direct DOM replacement
                    el.innerHTML = buildParagraphHtml(text);
                    el.dispatchEvent(new InputEvent('beforeinput', {
                        bubbles: true, cancelable: true, inputType: 'insertText', data: text,
                    }));
                    el.dispatchEvent(new InputEvent('input', {
                        bubbles: true, inputType: 'insertText', data: text,
                    }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    await delay(180);
                    return hasExpectedText(el, text);
                };

                return (async () => {
                    const isLinkedIn = location.hostname.includes('linkedin');
                    let shadowEditor = null;

                    // Step 1: LinkedIn auto-popup or click preClick button
                    if (isLinkedIn && location.search.includes('shareActive=true')) {
                        await delay(3000);
                        const shadowStart = Date.now();
                        while (!shadowEditor && Date.now() - shadowStart < 15000) {
                            for (const host of document.querySelectorAll('*')) {
                                if (host.shadowRoot) {
                                    shadowEditor = host.shadowRoot.querySelector('.ql-editor[contenteditable="true"]');
                                    if (shadowEditor) break;
                                }
                            }
                            if (!shadowEditor) await delay(500);
                        }
                        if (shadowEditor) await delay(1000);
                    } else if (config.preClickSelector) {
                        const btn = findEl([config.preClickSelector]);
                        if (btn) {
                            btn.click();
                            await delay(2000);
                        }
                    }

                    // Step 2: Extract title
                    let titleText = config.promptTitle || '';
                    let bodyText = config.shareText;
                    const lines = config.shareText.split('\n');
                    if (lines.length > 1 && lines[0].length < 100) {
                        titleText = lines[0].replace(/^#+\s*/, '').trim();
                        bodyText = lines.slice(1).join('\n').trim();
                    }

                    // Step 3: Fill title
                    const titleEl = config.titleSelectors?.length
                        ? await waitForEl(config.titleSelectors, 5000, 250)
                        : null;
                    const titleFilled = await fillInput(titleEl, titleText);
                    if (titleFilled) await delay(500);

                    // Step 4: Fill content
                    let contentEl = shadowEditor;
                    if (!contentEl) {
                        contentEl = await waitForEl(config.contentSelectors, 8000, 250);
                    }
                    const contentText = titleFilled ? bodyText : config.shareText;
                    const contentFilled = await fillInput(contentEl, contentText);
                    await delay(500);

                    // Step 5: Highlight publish button
                    if (config.publishSelector) {
                        const pubBtn = findEl([config.publishSelector]);
                        if (pubBtn) {
                            pubBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            pubBtn.style.cssText += ';box-shadow:0 0 12px 4px rgba(59,130,246,0.7);border:2px solid #3b82f6;';
                            let on = true;
                            const pulse = setInterval(() => {
                                pubBtn.style.boxShadow = on
                                    ? '0 0 20px 6px rgba(59,130,246,0.9)'
                                    : '0 0 12px 4px rgba(59,130,246,0.5)';
                                on = !on;
                            }, 800);
                            setTimeout(() => clearInterval(pulse), 10000);
                        }
                    }

                    // Step 6: Copy to clipboard
                    try { await navigator.clipboard.writeText(config.shareText); } catch (e) { }
                    return { titleFilled, contentFilled, editorSelectorMatched: !!contentEl };
                })();
            },
            args: [editorConfig],
        });
        if (!result?.contentFilled) {
            throw new Error(result?.editorSelectorMatched
                ? 'Editor write verification failed'
                : 'Editor selector not found');
        }
        return result;
    };

    // Wait for tab to load, then inject in MAIN world
    const cleanup = () => chrome.tabs.onUpdated.removeListener(listener);
    const listener = async (tabId, changeInfo, tab) => {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
            if (platform === 'wechat') {
                const wechatState = resolveWechatEditorState(tab?.url || '');
                if (wechatState.redirectUrl) {
                    try {
                        await chrome.tabs.update(tabId, { url: wechatState.redirectUrl });
                    } catch (e) {
                        cleanup();
                        safeSendResponse({ success: false, error: 'WeChat editor redirect failed', ...responseMeta });
                    }
                    return;
                }

                if (!wechatState.ready) {
                    return;
                }
            }

            cleanup();
            // Wait for SPA hydration
            setTimeout(async () => {
                try {
                    // For LinkedIn with auto-popup (shareActive=true), skip button detection
                    if (platform === 'linkedin' && editor.url.includes('shareActive=true')) {
                        await new Promise(r => setTimeout(r, 3000));
                    }
                    await injectInMainWorld(tabId);
                    safeSendResponse({ success: true, text: shareText, injected: true, ...responseMeta });
                } catch (e) {
                    console.warn('[SHARE_TO_PLATFORM] MAIN world injection failed:', e?.message || e);
                    try {
                        await chrome.tabs.sendMessage(tabId, {
                            type: 'INSERT_SHARE_CONTENT',
                            content: shareText,
                            promptTitle: title,
                            titleSelectors: editor.titleSelectors,
                            contentSelectors: editor.contentSelectors,
                            preClickSelector: editor.preClickSelector || null,
                        });
                        safeSendResponse({ success: true, text: shareText, injected: true, ...responseMeta });
                    } catch (e2) {
                        console.error('[SHARE_TO_PLATFORM] Both injection methods failed:', e2);
                        safeSendResponse({ success: false, error: 'Injection failed', ...responseMeta });
                    }
                }
            }, 3000);
        }
    };
    chrome.tabs.onUpdated.addListener(listener);

    setTimeout(() => {
        if (hasResponded) return;
        cleanup();
        safeSendResponse({
            success: false,
            error: platform === 'wechat'
                ? 'WeChat editor load timeout'
                : 'Editor load timeout',
            ...responseMeta
        });
    }, 120000);
}
