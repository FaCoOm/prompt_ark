/**
 * Xiaomi MiMo Web Driver
 * Domain: aistudio.xiaomimimo.com
 * Auth: Cookie (serviceToken, xiaomichatbot_ph)
 */

import { 
    getCookieHeader, 
    fetchWithTimeout, 
    parseSSEStream,
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://aistudio.xiaomimimo.com';

async function fetchXiaomimoCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('xiaomimimo.com', BASE_URL);
    const serviceToken = extractCookieValue(cookieHeader, 'serviceToken');
    const botPh = extractCookieValue(cookieHeader, 'xiaomichatbot_ph');
    
    if (!serviceToken) {
        throw new Error('NOT_LOGGED_IN');
    }

    const creds = { serviceToken, botPh, cookieHeader };
    credentialCache.set(creds);
    return creds;
}

export async function callXiaomimoWeb(prompt, model = 'mimo-v2-flash-studio') {
    return _callXiaomimoWebInner(prompt, model, false);
}

async function _callXiaomimoWebInner(prompt, model, _retrying) {
    const creds = await fetchXiaomimoCredentials();

    const response = await fetchWithTimeout(
        `${BASE_URL}/open-apis/bot/chat`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${creds.serviceToken}`,
                'bot_ph': creds.botPh || '',
                'Accept': 'text/event-stream',
                'Cookie': creds.cookieHeader
            },
            body: JSON.stringify({
                msgId: crypto.randomUUID(),
                conversationId: '0',
                query: prompt,
                modelConfig: {
                    model: model,
                    enableThinking: false
                }
            })
        },
        60000
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }
        throw new Error(`Xiaomi MiMo API error: ${response.status}`);
    }

    let fullText = '';
    for await (const event of parseSSEStream(response)) {
        if (event.data) {
            try {
                const data = JSON.parse(event.data);
                if (data.content) {
                    fullText += data.content;
                }
            } catch (e) {
                fullText += event.data;
            }
        }
    }

    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callXiaomimoWebInner(prompt, model, true);
    }

    return fullText;
}

export async function isXiaomimoWebAvailable() {
    try {
        await fetchXiaomimoCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
