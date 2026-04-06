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

async function fetchQwenCNCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('.qianwen.com', BASE_URL);

    const tongyiTicket = extractCookieValue(cookieHeader, 'tongyi_sso_ticket');
    const aliyunidTicket = extractCookieValue(cookieHeader, 'login_aliyunid_ticket');

    if (!tongyiTicket && !aliyunidTicket) {
        throw new Error('NOT_LOGGED_IN');
    }

    const xsrfToken = extractCookieValue(cookieHeader, 'XSRF-TOKEN');
    const ut = extractCookieValue(cookieHeader, 'b-user-id');
    const deviceId = ut || `web-${crypto.randomUUID()}`;

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

    if (!creds.xsrfToken) {
        try {
            const tabs = await chrome.tabs.query({ url: 'https://*.qianwen.com/*' });
            if (tabs.length > 0) {
                const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_QWEN_CN_XSRF' });
                if (response?.xsrfToken) {
                    creds.xsrfToken = response.xsrfToken;
                }
            }
        } catch (e) {
            console.log('[QwenCNWeb] Could not get XSRF from content script:', e);
        }
    }

    const sessionId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).slice(2);

    const url = new URL(`${BASE_URL}/api/v2/chat`);
    url.searchParams.set('biz_id', 'ai_qwen');
    url.searchParams.set('chat_client', 'h5');
    url.searchParams.set('device', 'pc');
    url.searchParams.set('fr', 'pc');
    url.searchParams.set('pr', 'qwen');
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('timestamp', timestamp.toString());
    url.searchParams.set('ut', creds.ut || '');

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

    if (creds.cookieHeader) {
        headers['Cookie'] = creds.cookieHeader;
    }

    const response = await fetchWithTimeout(
        url.toString(),
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

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
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

    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callQwenCNWebInner(prompt, model, true);
    }

    return fullText;
}

function parseQwenCNResponse(line) {
    if (!line || !line.trim()) return '';

    try {
        const data = JSON.parse(line);

        const content =
            data.choices?.[0]?.delta?.content ||
            data.choices?.[0]?.message?.content ||
            data.content ||
            data.delta?.content ||
            data.text ||
            data.data?.content ||
            data.data?.choices?.[0]?.delta?.content ||
            '';

        return content || '';
    } catch {
        const trimmed = line.trim();

        if (trimmed.startsWith('data:')) {
            return parseQwenCNResponse(trimmed.slice(5).trim());
        }
        if (trimmed.startsWith('event:') || trimmed.startsWith('id:')) {
            return '';
        }

        if (trimmed && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            return trimmed;
        }

        return '';
    }
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
