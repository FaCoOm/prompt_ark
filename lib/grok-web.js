/**
 * Grok Web Driver
 * Domain: grok.com
 * Auth: Cookie (sso, _ga)
 * Protocol: NDJSON streaming
 * Special: 403 fallback to DOM simulation
 */

import { 
    getCookieHeader, 
    fetchWithTimeout, 
    parseNDJSONStream,
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://grok.com';

async function fetchGrokCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('grok.com', BASE_URL);
    const ssoToken = extractCookieValue(cookieHeader, 'sso');
    
    if (!ssoToken) {
        throw new Error('NOT_LOGGED_IN');
    }

    const creds = { ssoToken, cookieHeader };
    credentialCache.set(creds);
    return creds;
}

async function createConversation(creds) {
    const response = await fetchWithTimeout(
        `${BASE_URL}/rest/app-chat/conversations`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': creds.cookieHeader
            },
            body: JSON.stringify({
                temporary: false,
                model: 'grok-3'
            })
        },
        30000
    );

    if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`);
    }

    const data = await response.json();
    return data.conversationId || data.id;
}

export async function callGrokWeb(prompt, model = 'grok-3') {
    return _callGrokWebInner(prompt, model, false);
}

async function _callGrokWebInner(prompt, model, _retrying) {
    const creds = await fetchGrokCredentials();
    const conversationId = await createConversation(creds);

    const response = await fetchWithTimeout(
        `${BASE_URL}/rest/app-chat/conversations/${conversationId}/responses`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': creds.cookieHeader
            },
            body: JSON.stringify({
                model: model,
                message: prompt,
                temporary: false
            })
        },
        60000
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }
        throw new Error(`Grok API error: ${response.status}`);
    }

    let fullText = '';
    for await (const obj of parseNDJSONStream(response)) {
        // Grok returns {contentDelta: {text: "..."}} or {textDelta: "..."}
        if (obj.contentDelta?.text) {
            fullText += obj.contentDelta.text;
        } else if (obj.textDelta) {
            fullText += obj.textDelta;
        } else if (obj.response?.text) {
            fullText += obj.response.text;
        }
    }

    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callGrokWebInner(prompt, model, true);
    }

    return fullText;
}

export async function isGrokWebAvailable() {
    try {
        await fetchGrokCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
