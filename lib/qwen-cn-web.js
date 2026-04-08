/**
 * Qwen China Web Driver (qianwen.com 国内版)
 * Domain: chat2.qianwen.com
 * Auth: Cookie (tongyi_sso_ticket, login_aliyunid_ticket) + XSRF Token
 * Protocol: JSON streaming via fetch with credentials
 * Special: Requires XSRF token from meta tag or cookie, device ID, and specific headers
 */

import {
    getCookieHeader,
    fetchWithTimeout,
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://chat2.qianwen.com';
const ALT_BASE_URL = 'https://www.qianwen.com';

async function fetchQwenCNCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    let cookieHeader = await getCookieHeader('.qianwen.com', BASE_URL);
    
    let tongyiTicket = extractCookieValue(cookieHeader, 'tongyi_sso_ticket');
    let aliyunidTicket = extractCookieValue(cookieHeader, 'login_aliyunid_ticket');
    
    if (!tongyiTicket && !aliyunidTicket) {
        cookieHeader = await getCookieHeader('.qianwen.com', ALT_BASE_URL);
        tongyiTicket = extractCookieValue(cookieHeader, 'tongyi_sso_ticket');
        aliyunidTicket = extractCookieValue(cookieHeader, 'login_aliyunid_ticket');
    }

    console.log('[QwenCNWeb] Auth tickets:', { tongyiTicket: !!tongyiTicket, aliyunidTicket: !!aliyunidTicket });

    if (!tongyiTicket && !aliyunidTicket) {
        throw new Error('NOT_LOGGED_IN');
    }

    let xsrfToken = null;
    let ut = extractCookieValue(cookieHeader, 'b-user-id');
    
    if (!ut) {
        try {
            const allCookies = await chrome.cookies.getAll({ domain: '.qianwen.com' });
            const utCookie = allCookies.find(c => c.name === 'b-user-id');
            if (utCookie) {
                ut = utCookie.value;
            }
        } catch (e) {}
    }
    
    // Try to get both XSRF and ut from page
    try {
        const tabs = await chrome.tabs.query({ url: 'https://*.qianwen.com/*' });
        if (tabs.length > 0) {
            const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_QWEN_CN_XSRF' });
            if (response?.xsrfToken) {
                xsrfToken = response.xsrfToken;
                console.log('[QwenCNWeb] XSRF from page meta tag');
            }
            if (response?.ut && !ut) {
                ut = response.ut;
                console.log('[QwenCNWeb] ut from page:', ut.substring(0, 10) + '...');
            }
        }
    } catch (e) {
        console.log('[QwenCNWeb] Could not get credentials from page:', e);
    }
    
    // Fallback XSRF to cookie
    if (!xsrfToken) {
        xsrfToken = extractCookieValue(cookieHeader, 'XSRF-TOKEN');
    }
    
    if (!ut) {
        ut = `web-${crypto.randomUUID()}`;
    }
    
    const deviceId = ut;

    console.log('[QwenCNWeb] Credentials ready:', { xsrfToken: !!xsrfToken, ut: !!ut, deviceId: !!deviceId });

    const creds = {
        cookieHeader,
        xsrfToken,
        deviceId,
        ut
    };

    credentialCache.set(creds);
    return creds;
}

export async function callQwenCNWeb(prompt, model = 'Qwen3.5-Plus') {
    return _callQwenCNWebInner(prompt, model, false);
}

async function _callQwenCNWebInner(prompt, model, _retrying) {
    const creds = await fetchQwenCNCredentials();

    console.log('[QwenCNWeb] Final XSRF token present:', !!creds.xsrfToken);

    const sessionId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).slice(2);

    // Build URL exactly like zero-claw: string concatenation
    const ut = creds.ut || '';
    const url = `${BASE_URL}/api/v2/chat?biz_id=ai_qwen&chat_client=h5&device=pc&fr=pc&pr=qwen&nonce=${nonce}&timestamp=${timestamp}&ut=${ut}`;

    const body = {
        model: model,
        messages: [
            {
                content: prompt,
                mime_type: 'text/plain',
                meta_data: {
                    ori_query: prompt,
                },
            },
        ],
        session_id: sessionId,
        parent_req_id: '0',
        deep_search: '0',
        req_id: 'req-' + Math.random().toString(36).slice(2),
        scene: 'chat',
        sub_scene: 'chat',
        temporary: false,
        from: 'default',
        scene_param: 'first_turn',
        chat_client: 'h5',
        client_tm: timestamp.toString(),
        protocol_version: 'v2',
        biz_id: 'ai_qwen',
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, text/plain, */*',
        'Referer': `${BASE_URL}/`,
        'Origin': BASE_URL,
        'x-xsrf-token': creds.xsrfToken || '',
        'x-deviceid': creds.deviceId,
        'x-platform': 'pc_tongyi',
        'x-req-from': 'pc_web',
    };

    console.log('[QwenCNWeb] Request URL:', url);
    console.log('[QwenCNWeb] XSRF token length:', creds.xsrfToken?.length || 0);

    const response = await fetchWithTimeout(
        url,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            credentials: 'include',
        },
        300000
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('[QwenCNWeb] API auth error:', response.status, errorText.slice(0, 200));
            throw new Error('NOT_LOGGED_IN');
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Qwen CN API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let lineCount = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                lineCount++;
                const text = parseQwenCNResponse(line);
                if (text) {
                    fullText += text;
                }
            }
        }

        if (buffer.trim()) {
            const text = parseQwenCNResponse(buffer);
            if (text) {
                fullText += text;
            }
        }
    } finally {
        reader.releaseLock();
    }

    console.log('[QwenCNWeb] Parsed', lineCount, 'lines, final text length:', fullText.length);
    console.log('[QwenCNWeb] First 200 chars:', fullText.substring(0, 200));
    console.log('[QwenCNWeb] Last 200 chars:', fullText.substring(fullText.length - 200));

    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callQwenCNWebInner(prompt, model, true);
    }

    return fullText;
}

function parseQwenCNResponse(line) {
    if (!line || !line.trim()) return '';

    const trimmed = line.trim();
    
    // SSE format: data: {...}
    if (trimmed.startsWith('data:')) {
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') return '';
        
        try {
            const data = JSON.parse(jsonStr);
            
            // Qwen China specific format - look for multi_load/iframe content
            if (data.data?.messages && Array.isArray(data.data.messages)) {
                for (const msg of data.data.messages) {
                    if (msg.mime_type === 'multi_load/iframe' && msg.content) {
                        return msg.content;
                    }
                    // Fallback to any message with content
                    if (msg.content && typeof msg.content === 'string') {
                        return msg.content;
                    }
                }
            }
            
            // Standard OpenAI-like format fallback
            const content =
                data.choices?.[0]?.delta?.content ||
                data.choices?.[0]?.message?.content ||
                data.content ||
                data.delta?.content ||
                data.text ||
                '';

            return content || '';
        } catch (e) {
            // If not valid JSON, might be raw text
            return jsonStr;
        }
    }
    
    // Skip SSE control lines
    if (trimmed.startsWith('event:') || trimmed.startsWith('id:')) {
        return '';
    }

    // If it's already plain text (not JSON), return as-is
    if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return trimmed;
    }

    return '';
}

export async function isQwenCNWebAvailable() {
    try {
        await fetchQwenCNCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
