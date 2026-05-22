/**
 * ChatGPT Web Driver (Experimental)
 * Domain: chatgpt.com
 * Auth: Cookie (session token) + Sentinel anti-bot
 * Special: Extremely high complexity, Cloudflare protection
 * 
 * WARNING: This provider is EXPERIMENTAL due to ChatGPT's advanced anti-bot protection.
 * It uses DOM simulation to bypass Sentinel/Cloudflare when API calls fail.
 */

import { 
    getCookieHeader, 
    fetchWithTimeout,
    createCredentialCache,
    extractCookieValue,
    parseSSEStream,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes - shorter due to session volatility
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://chatgpt.com';

// Model mapping
const CHATGPT_MODELS = {
    'gpt-4': 'gpt-4',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o1': 'o1',
    'o3-mini': 'o3-mini',
};

/**
 * Fetch credentials from chatgpt.com
 * Extracts session token and device ID from cookies and page
 */
async function fetchChatGPTCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    // Get cookies for chatgpt.com
    const cookieHeader = await getCookieHeader('.chatgpt.com', BASE_URL);
    
    // Look for session token (may be split into .0 and .1 parts)
    let sessionToken = extractCookieValue(cookieHeader, '__Secure-next-auth.session-token');
    
    // Handle split session tokens (.0 and .1)
    if (!sessionToken) {
        const token0 = extractCookieValue(cookieHeader, '__Secure-next-auth.session-token.0');
        const token1 = extractCookieValue(cookieHeader, '__Secure-next-auth.session-token.1');
        if (token0 && token1) {
            sessionToken = token0 + token1;
        }
    }
    
    if (!sessionToken) {
        throw new Error('NOT_LOGGED_IN');
    }

    // Fetch the main page to get additional tokens
    const response = await fetchWithTimeout(
        `${BASE_URL}/`,
        {
            method: 'GET',
            headers: {
                'Cookie': cookieHeader,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        },
        30000
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('CLOUDFLARE_BLOCKED');
        }
        throw new Error(`Failed to fetch ChatGPT page: ${response.status}`);
    }

    const html = await response.text();
    
    // Check for login redirect
    if (html.includes('accounts.google.com') || html.includes('Sign in') || html.includes('login')) {
        throw new Error('NOT_LOGGED_IN');
    }

    // Extract device ID from page if available
    const deviceIdMatch = html.match(/"deviceId"\s*:\s*"([^"]+)"/);
    const deviceId = deviceIdMatch?.[1] || generateDeviceId();

    const creds = { 
        sessionToken, 
        cookieHeader, 
        deviceId,
        experimental: true,
    };
    
    credentialCache.set(creds);
    return creds;
}

/**
 * Generate a device ID for ChatGPT
 */
function generateDeviceId() {
    return crypto.randomUUID();
}

/**
 * Call ChatGPT backend API with Sentinel warmup
 * This attempts the direct API approach first
 */
async function callChatGPTAPI(prompt, model, creds) {
    const conversationId = generateUUID();
    const messageId = generateUUID();
    const parentMessageId = generateUUID();

    const body = {
        action: 'next',
        messages: [
            {
                id: messageId,
                author: { role: 'user' },
                content: {
                    content_type: 'text',
                    parts: [prompt],
                },
            },
        ],
        parent_message_id: parentMessageId,
        model: CHATGPT_MODELS[model] || model || 'gpt-4',
        timezone_offset_min: new Date().getTimezoneOffset(),
        conversation_id: conversationId,
        history_and_training_disabled: false,
        conversation_mode: { kind: 'primary_assistant', plugin_ids: null },
        force_paragen: false,
        force_paragen_model_slug: '',
        force_rate_limit: false,
        reset_rate_limits: false,
        force_use_sse: true,
    };

    // Try the backend API
    const response = await fetchWithTimeout(
        `${BASE_URL}/backend-api/conversation`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cookie': creds.cookieHeader,
                'Oai-Device-Id': creds.deviceId,
                'Oai-Language': 'en-US',
                'Referer': `${BASE_URL}/`,
                'Origin': BASE_URL,
            },
            body: JSON.stringify(body),
        },
        60000
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error('API_BLOCKED'); // Signal to use DOM fallback
        }
        throw new Error(`ChatGPT API error: ${response.status}`);
    }

    // Parse SSE stream
    let fullText = '';
    let responseMessageId = null;
    
    for await (const event of parseSSEStream(response)) {
        if (event.data === '[DONE]') break;
        
        try {
            const data = JSON.parse(event.data);
            
            // Extract message content
            if (data.message?.content?.parts?.[0]) {
                fullText = data.message.content.parts[0];
                responseMessageId = data.message.id;
            }
            
            // Alternative format
            if (data.v?.message?.content?.parts?.[0]) {
                fullText = data.v.message.content.parts[0];
            }
        } catch {
            // Skip malformed events
        }
    }

    return fullText;
}

/**
 * DOM Simulation fallback
 * When API is blocked (403), we simulate DOM interaction
 * This is the recommended approach for ChatGPT due to Sentinel
 */
async function callChatGPTViaDOM(prompt, _model) {
    // DOM simulation requires content script injection
    // This is a simplified version that sends a message to content script
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('DOM simulation timeout'));
        }, 120000);

        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (!tabs[0]) {
                clearTimeout(timeout);
                reject(new Error('No active tab'));
                return;
            }

            try {
                // First, ensure we're on ChatGPT
                if (!tabs[0].url?.includes('chatgpt.com')) {
                    // Open ChatGPT in a new tab
                    const newTab = await chrome.tabs.create({ url: 'https://chatgpt.com', active: false });
                    
                    // Wait for page load
                    await new Promise(r => setTimeout(r, 5000));
                    
                    // Send DOM simulation message to the new tab
                    chrome.tabs.sendMessage(newTab.id, {
                        type: 'CHATGPT_DOM_SIMULATION',
                        prompt: prompt,
                    }, (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            reject(new Error(`DOM simulation failed: ${chrome.runtime.lastError.message}`));
                        } else if (response?.success) {
                            resolve(response.text);
                        } else {
                            reject(new Error(response?.error || 'DOM simulation failed'));
                        }
                    });
                } else {
                    // Use current tab
                    chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'CHATGPT_DOM_SIMULATION',
                        prompt: prompt,
                    }, (response) => {
                        clearTimeout(timeout);
                        if (chrome.runtime.lastError) {
                            reject(new Error(`DOM simulation failed: ${chrome.runtime.lastError.message}`));
                        } else if (response?.success) {
                            resolve(response.text);
                        } else {
                            reject(new Error(response?.error || 'DOM simulation failed'));
                        }
                    });
                }
            } catch (e) {
                clearTimeout(timeout);
                reject(e);
            }
        });
    });
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    return crypto.randomUUID();
}
// ============================================================================

/**
 * Call ChatGPT Web and return the full text response
 * @param {string} prompt
 * @param {string} [model]
 * @returns {Promise<string>}
 */
export async function callChatGPTWeb(prompt, model = 'gpt-4') {
    return _callChatGPTWebInner(prompt, model, false);
}

async function _callChatGPTWebInner(prompt, model, _retrying) {
    let creds;
    try {
        creds = await fetchChatGPTCredentials();
    } catch (e) {
        if (e.message === 'CLOUDFLARE_BLOCKED') {
            console.log('[ChatGPT Web] Cloudflare detected, using DOM simulation');
            return callChatGPTViaDOM(prompt, model);
        }
        throw e;
    }

    try {
        // Try API first
        return await callChatGPTAPI(prompt, model, creds);
    } catch (e) {
        if (e.message === 'API_BLOCKED' && !_retrying) {
            console.log('[ChatGPT Web] API blocked by Sentinel, trying DOM simulation fallback');
            return callChatGPTViaDOM(prompt, model);
        }
        throw e;
    }
}

/**
 * Check if ChatGPT Web session is active
 * @returns {Promise<boolean>}
 */
export async function isChatGPTWebAvailable() {
    try {
        await fetchChatGPTCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}

/**
 * Get provider info including experimental status
 */
export function getChatGPTWebInfo() {
    return {
        id: 'chatgpt-web',
        name: 'ChatGPT Web (Experimental)',
        description: 'Uses browser session from chatgpt.com. Highly experimental due to Sentinel anti-bot protection.',
        experimental: true,
        domain: 'chatgpt.com',
        models: Object.keys(CHATGPT_MODELS),
    };
}
