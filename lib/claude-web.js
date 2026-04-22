/**
 * Claude Web Driver
 * Domain: claude.ai
 * Auth: Cookie (sessionKey)
 * Special: Cloudflare protection, Organization ID discovery
 * Protocol: SSE streaming via /api/organizations/{orgId}/chat_conversations/{convId}/completion
 */

import {
    getCookieHeader,
    fetchWithTimeout,
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://claude.ai';
const API_BASE = 'https://claude.ai/api';

function generateDeviceId() {
    return crypto.randomUUID();
}

async function extractSessionKey(cookieHeader) {
    const sessionKey = extractCookieValue(cookieHeader, 'sessionKey');
    if (sessionKey && (sessionKey.startsWith('sk-ant-sid01-') || sessionKey.startsWith('sk-ant-sid02-'))) {
        return sessionKey;
    }

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const value = cookie.split('=')[1]?.trim();
        if (value && (value.startsWith('sk-ant-sid01-') || value.startsWith('sk-ant-sid02-'))) {
            return value;
        }
    }

    return null;
}

async function fetchClaudeCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    console.log('[Claude Web] Fetching credentials from claude.ai...');

    const cookieHeader = await getCookieHeader('.claude.ai', BASE_URL);
    if (!cookieHeader) {
        throw new Error('NOT_LOGGED_IN');
    }

    const sessionKey = await extractSessionKey(cookieHeader);
    if (!sessionKey) {
        throw new Error('NOT_LOGGED_IN');
    }

    let deviceId = extractCookieValue(cookieHeader, 'anthropic-device-id');
    if (!deviceId) {
        deviceId = generateDeviceId();
    }

    const creds = {
        sessionKey,
        cookieHeader,
        deviceId,
        organizationId: null
    };

    credentialCache.set(creds);
    console.log('[Claude Web] Session key acquired, device ID:', deviceId.slice(0, 8) + '...');
    return creds;
}

async function discoverOrganizationId(creds) {
    if (creds.organizationId) {
        return creds.organizationId;
    }

    try {
        const headers = await buildHeaders(creds);
        const response = await fetchWithTimeout(
            `${API_BASE}/organizations`,
            {
                method: 'GET',
                headers,
            },
            30000
        );

        if (!response.ok) {
            console.warn(`[Claude Web] Failed to fetch organizations: ${response.status}`);
            return null;
        }

        const orgs = await response.json();
        if (Array.isArray(orgs) && orgs.length > 0 && orgs[0].uuid) {
            creds.organizationId = orgs[0].uuid;
            console.log(`[Claude Web] Discovered organization ID: ${creds.organizationId}`);
            return creds.organizationId;
        }
    } catch (e) {
        console.warn(`[Claude Web] Failed to discover organization: ${String(e)}`);
    }

    return null;
}

async function buildHeaders(creds) {
    return {
        'Content-Type': 'application/json',
        'Cookie': creds.cookieHeader,
        'Accept': 'text/event-stream',
        'Referer': 'https://claude.ai/',
        'Origin': 'https://claude.ai',
        'anthropic-client-platform': 'web_claude_ai',
        'anthropic-device-id': creds.deviceId,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
    };
}

async function createConversation(creds) {
    const headers = await buildHeaders(creds);
    const orgId = await discoverOrganizationId(creds);

    const url = orgId
        ? `${API_BASE}/organizations/${orgId}/chat_conversations`
        : `${API_BASE}/chat_conversations`;

    console.log(`[Claude Web] Creating conversation at: ${url}`);

    const response = await fetchWithTimeout(
        url,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Conversation ${new Date().toISOString()}`,
                uuid: crypto.randomUUID(),
            }),
        },
        30000
    );

    console.log(`[Claude Web] Create conversation response: ${response.status}`);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[Claude Web] Create conversation failed: ${response.status} - ${errorText}`);
        throw new Error(`Failed to create conversation: ${response.status}`);
    }

    const data = await response.json();
    return data.uuid || data.id;
}

async function* parseClaudeStream(response) {
    if (!response.body) {
        throw new Error('No response body from Claude API');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') return;

                    try {
                        const event = JSON.parse(data);
                        yield event;
                    } catch {}
                } else if (line.trim()) {
                    try {
                        const event = JSON.parse(line.trim());
                        yield event;
                    } catch {}
                }
            }
        }

        if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6).trim();
                if (data !== '[DONE]') {
                    try {
                        yield JSON.parse(data);
                    } catch {}
                }
            } else {
                try {
                    yield JSON.parse(trimmed);
                } catch {}
            }
        }
    } finally {
        reader.releaseLock();
    }
}

function extractTextFromEvent(event) {
    if (!event) return '';

    if (event.type === 'content_block_delta' && event.delta?.text) {
        return event.delta.text;
    }

    if (event.completion) {
        return event.completion;
    }

    if (event.delta?.text) {
        return event.delta.text;
    }

    if (typeof event.text === 'string') {
        return event.text;
    }

    return '';
}

export async function callClaudeWeb(prompt, model = 'claude-sonnet-4-6') {
    return _callClaudeWebInner(prompt, model, false);
}

async function _callClaudeWebInner(prompt, model, _retrying) {
    const creds = await fetchClaudeCredentials();
    const conversationId = await createConversation(creds);

    const headers = await buildHeaders(creds);
    const orgId = creds.organizationId;

    const url = orgId
        ? `${API_BASE}/organizations/${orgId}/chat_conversations/${conversationId}/completion`
        : `${API_BASE}/chat_conversations/${conversationId}/completion`;

    console.log(`[Claude Web] Sending message to: ${url}`);
    console.log(`[Claude Web] Conversation ID: ${conversationId}`);
    console.log(`[Claude Web] Model: ${model}`);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = {
        prompt,
        parent_message_uuid: '00000000-0000-4000-8000-000000000000',
        model: model,
        timezone,
        rendering_mode: 'messages',
        attachments: [],
        files: [],
        locale: 'en-US',
        personalized_styles: [],
        sync_sources: [],
        tools: [],
    };

    const response = await fetchWithTimeout(
        url,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        },
        120000
    );

    console.log(`[Claude Web] Message response: ${response.status}`);

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[Claude Web] Message failed: ${response.status} - ${errorText}`);

        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }

        if (response.status === 403 && errorText.includes('cf-')) {
            console.warn('[Claude Web] Cloudflare challenge detected');
            if (!_retrying) {
                await new Promise(r => setTimeout(r, 2000));
                credentialCache.clear();
                return _callClaudeWebInner(prompt, model, true);
            }
        }

        throw new Error(`Claude API error: ${response.status}`);
    }

    let fullText = '';
    try {
        for await (const event of parseClaudeStream(response)) {
            const text = extractTextFromEvent(event);
            if (text) {
                fullText += text;
            }
        }
    } catch (e) {
        console.error('[Claude Web] Stream parsing error:', e);
        throw e;
    }

    if (!fullText && !_retrying) {
        console.warn('[Claude Web] Empty response — retrying with fresh credentials...');
        credentialCache.clear();
        return _callClaudeWebInner(prompt, model, true);
    }

    console.log(`[Claude Web] Response: ${fullText.length} chars`);
    return fullText;
}

export async function isClaudeWebAvailable() {
    try {
        await fetchClaudeCredentials();
        console.log('[Claude Web] Availability check: SUCCESS');
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            console.warn('[Claude Web] Availability check: NOT_LOGGED_IN');
        } else {
            console.warn('[Claude Web] Availability check: FAILED -', error.message);
        }
        return false;
    }
}
