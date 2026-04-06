/**
 * Qwen International Web Driver
 * Domain: chat.qwen.ai
 * Auth: Cookie (session, token) + Bearer Token
 * Protocol: SSE streaming
 * Special: Need to create chat session first
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
const BASE_URL = 'https://chat.qwen.ai';

async function fetchQwenCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('qwen.ai', BASE_URL);
    const sessionToken = extractCookieValue(cookieHeader, 'session');
    const token = extractCookieValue(cookieHeader, 'token') || extractCookieValue(cookieHeader, 'auth');
    
    // Check for any session-related cookie
    const hasSession = sessionToken || token || cookieHeader.includes('session') || cookieHeader.includes('auth');
    
    if (!hasSession) {
        throw new Error('NOT_LOGGED_IN');
    }

    const creds = { sessionToken, token, cookieHeader };
    credentialCache.set(creds);
    return creds;
}

/**
 * Create a new chat session to get chat_id
 * This is required before sending messages to Qwen
 */
async function createChatSession(creds) {
    const bearerToken = creds.token || creds.sessionToken;
    
    const response = await fetchWithTimeout(
        `${BASE_URL}/api/v2/chats/new`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken ? `Bearer ${bearerToken}` : '',
                'Cookie': creds.cookieHeader,
                'Accept': 'application/json',
            },
            body: JSON.stringify({}),
        },
        30000
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }
        throw new Error(`Qwen create chat error: ${response.status}`);
    }

    const data = await response.json();
    const chatId = data.data?.id ?? data.chat_id ?? data.id ?? data.chatId;
    
    if (!chatId) {
        throw new Error('Failed to create Qwen chat: No chat_id in response');
    }
    
    return chatId;
}

export async function callQwenWeb(prompt, model = 'qwen3.5-plus') {
    return _callQwenWebInner(prompt, model, false);
}

async function _callQwenWebInner(prompt, model, _retrying) {
    const creds = await fetchQwenCredentials();
    
    // Step 1: Create chat session to get chat_id
    const chatId = await createChatSession(creds);
    
    const bearerToken = creds.token || creds.sessionToken;
    const fid = crypto.randomUUID();
    
    // Step 2: Send message using the chat_id
    const response = await fetchWithTimeout(
        `${BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken ? `Bearer ${bearerToken}` : '',
                'Accept': 'text/event-stream',
                'Cookie': creds.cookieHeader,
            },
            body: JSON.stringify({
                stream: true,
                version: '2.1',
                incremental_output: true,
                chat_id: chatId,
                chat_mode: 'normal',
                model: model,
                parent_id: null,
                messages: [
                    {
                        fid,
                        parentId: null,
                        childrenIds: [],
                        role: 'user',
                        content: prompt,
                        user_action: 'chat',
                        files: [],
                        timestamp: Math.floor(Date.now() / 1000),
                        models: [model],
                        chat_type: 't2t',
                        feature_config: { thinking_enabled: true, output_schema: 'phase' },
                    },
                ],
            }),
        },
        300000 // 5 minute timeout for streaming
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }
        throw new Error(`Qwen API error: ${response.status}`);
    }

    // Parse SSE stream for OpenAI-compatible format
    let fullText = '';
    for await (const event of parseSSEStream(response)) {
        if (event.data) {
            try {
                // Try to parse as JSON (OpenAI-compatible format)
                const data = JSON.parse(event.data);
                // Extract content from different possible formats
                const content = 
                    data.choices?.[0]?.delta?.content ||
                    data.choices?.[0]?.message?.content ||
                    data.content ||
                    data.delta?.content ||
                    data.text ||
                    '';
                if (content) {
                    fullText += content;
                }
            } catch (e) {
                // Not JSON, treat as plain text
                if (event.data.trim() && !event.data.startsWith('data:')) {
                    fullText += event.data;
                }
            }
        }
    }

    // Retry once if we got no content
    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callQwenWebInner(prompt, model, true);
    }

    return fullText;
}

export async function isQwenWebAvailable() {
    try {
        await fetchQwenCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
