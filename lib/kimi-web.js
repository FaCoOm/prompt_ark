/**
 * Kimi Web Driver — calls Kimi via browser session (no API key needed).
 * User must be logged in to kimi.com or moonshot.cn.
 *
 * Protocol: Connect-RPC via /apiv2/kimi.gateway.chat.v1.ChatService/Chat
 * Auth: kimi-auth cookie OR access_token from localStorage
 */

// --- Credential Cache ---
let _credentialCache = null;
let _credentialTimestamp = 0;
const CREDENTIAL_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- Utilities ---

/**
 * Get Kimi access token from content script (localStorage).
 * This is the primary auth method as Kimi stores tokens in localStorage, not cookies.
 */
async function getKimiTokenFromContentScript() {
    try {
        // Query for active kimi.com tab
        const tabs = await chrome.tabs.query({ url: 'https://www.kimi.com/*' });
        if (tabs.length === 0) {
            console.log('[Kimi Web] No kimi.com tab found');
            return null;
        }
        
        // Try to get token from the first available kimi tab
        for (const tab of tabs) {
            if (!tab.id) continue;
            try {
                console.log(`[Kimi Web] Requesting token from tab ${tab.id}...`);
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_KIMI_TOKEN' });
                if (response?.success && response.accessToken) {
                    console.log('[Kimi Web] Got access_token from localStorage');
                    return {
                        accessToken: response.accessToken,
                        refreshToken: response.refreshToken,
                        baseUrl: response.baseUrl || 'https://www.kimi.com'
                    };
                }
            } catch (e) {
                console.warn(`[Kimi Web] Failed to get token from tab ${tab.id}:`, e.message);
            }
        }
        return null;
    } catch (e) {
        console.error('[Kimi Web] Error querying tabs:', e);
        return null;
    }
}

/** Build cookie header from chrome.cookies API (fallback method) */
async function getKimiCookieHeader() {
    try {
        if (!chrome?.cookies?.getAll) {
            console.log('[Kimi Web] chrome.cookies API not available');
            return '';
        }
        
        // Try both domains
        console.log('[Kimi Web] Fetching cookies for kimi.com...');
        const cookiesKimi = await chrome.cookies.getAll({ domain: '.kimi.com', url: 'https://www.kimi.com' });
        console.log(`[Kimi Web] Found ${cookiesKimi.length} cookies for kimi.com:`, cookiesKimi.map(c => c.name));
        
        console.log('[Kimi Web] Fetching cookies for moonshot.cn...');
        const cookiesMoonshot = await chrome.cookies.getAll({ domain: '.moonshot.cn', url: 'https://www.moonshot.cn' });
        console.log(`[Kimi Web] Found ${cookiesMoonshot.length} cookies for moonshot.cn:`, cookiesMoonshot.map(c => c.name));
        
        const allCookies = [...cookiesKimi, ...cookiesMoonshot];
        if (!allCookies.length) {
            console.warn('[Kimi Web] No cookies found for either domain');
            return '';
        }
        
        const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('[Kimi Web] Cookie string built, length:', cookieString.length);
        return cookieString;
    } catch (e) {
        console.error('[Kimi Web] Error getting cookies:', e);
        return '';
    }
}

/** Extract specific cookie value from cookie string */
function extractCookieValue(cookieString, name) {
    if (!cookieString) return null;
    const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
    return match?.[1] || null;
}

/** Fetch with cookies attached explicitly */
async function fetchWithCookies(url, options = {}, timeoutMs = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const cookieHeader = await getKimiCookieHeader();
        if (cookieHeader) {
            options.headers = { ...(options.headers || {}), 'Cookie': cookieHeader };
        }
        options.credentials = 'include';
        options.signal = controller.signal;
        return await fetch(url, options);
    } finally {
        clearTimeout(timer);
    }
}

// --- Credential Fetching ---

/**
 * Check if user is logged in to Kimi and extract credentials.
 * Returns { authToken, baseUrl } where authToken is the Bearer token.
 * Throws 'NOT_LOGGED_IN' if user is not signed in.
 */
export async function fetchKimiWebCredentials(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _credentialCache && (now - _credentialTimestamp) < CREDENTIAL_TTL_MS) {
        console.log('[Kimi Web] Using cached credentials');
        return _credentialCache;
    }

    console.log('[Kimi Web] Checking credentials...');

    // Priority 1: Try to get token from content script (localStorage) - primary method
    const tokenFromContentScript = await getKimiTokenFromContentScript();
    if (tokenFromContentScript?.accessToken) {
        console.log('[Kimi Web] Using access_token from localStorage');
        _credentialCache = { 
            authToken: tokenFromContentScript.accessToken, 
            baseUrl: tokenFromContentScript.baseUrl || 'https://www.kimi.com',
            cookieHeader: ''
        };
        _credentialTimestamp = now;
        console.log('[Kimi Web] Credentials acquired from localStorage for', _credentialCache.baseUrl);
        return _credentialCache;
    }

    // Priority 2: Fallback to cookies
    console.log('[Kimi Web] Falling back to cookie-based auth...');
    const cookieHeader = await getKimiCookieHeader();
    const kimiAuthCookie = extractCookieValue(cookieHeader, 'kimi-auth');
    const accessTokenCookie = extractCookieValue(cookieHeader, 'access_token');
    
    let authToken = accessTokenCookie || kimiAuthCookie;
    
    if (!authToken) {
        console.error('[Kimi Web] No auth token found - user not logged in');
        throw new Error('NOT_LOGGED_IN');
    }

    console.log('[Kimi Web] Using token from cookies:', accessTokenCookie ? 'access_token' : 'kimi-auth');
    
    _credentialCache = { authToken, baseUrl: 'https://www.kimi.com', cookieHeader };
    _credentialTimestamp = now;

    console.log('[Kimi Web] Credentials acquired from cookies');
    return _credentialCache;
}

// --- Response Parsing ---

/**
 * Parse Kimi Connect-RPC response.
 * Kimi uses length-prefixed JSON messages:
 * - 1 byte: flags (0x00 for normal message)
 * - 4 bytes: message length (big-endian uint32)
 * - N bytes: JSON payload
 */
function parseConnectRpcResponse(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer);
    const texts = [];
    let offset = 0;

    while (offset + 5 <= u8.length) {
        // const flags = u8[offset]; // Usually 0x00
        const msgLen = new DataView(u8.buffer, u8.byteOffset + offset + 1, 4).getUint32(0, false);
        
        if (offset + 5 + msgLen > u8.length) break;
        
        const chunk = u8.slice(offset + 5, offset + 5 + msgLen);
        try {
            const obj = JSON.parse(new TextDecoder().decode(chunk));
            
            // Check for errors
            if (obj.error) {
                throw new Error(obj.error.message || obj.error.code || JSON.stringify(obj.error));
            }
            
            // Extract text from response
            // "append" or "set" ops on assistant response blocks
            const op = obj.op || '';
            if (obj.block?.text?.content && (op === 'append' || op === 'set')) {
                texts.push(obj.block.text.content);
            } else if (obj.text?.content && (op === 'append' || op === 'set')) {
                texts.push(obj.text.content);
            }
            // If no op field but there's a message with role=assistant
            else if (!op && obj.message?.role === 'assistant' && obj.message?.blocks) {
                for (const blk of obj.message.blocks) {
                    if (blk.text?.content) {
                        texts.push(blk.text.content);
                    }
                }
            }
            
            if (obj.done) break;
        } catch (e) {
            if (e.message?.includes('error')) throw e;
            // Ignore parse errors for non-JSON chunks
        }
        
        offset += 5 + msgLen;
    }

    return texts.join('');
}

// --- Public API ---

/**
 * Call Kimi Web API and return the full text response.
 * @param {string} prompt
 * @param {string} [model] - Model ID (e.g., 'moonshot-v1-32k', 'kimi-k1')
 * @returns {Promise<string>}
 */
export async function callKimiWeb(prompt, model = 'moonshot-v1-32k') {
    console.log(`[Kimi Web] callKimiWeb called with model=${model}, prompt length=${prompt.length}`);
    return _callKimiWebInner(prompt, model, false);
}

async function _callKimiWebInner(prompt, model, _retrying) {
    console.log(`[Kimi Web] _callKimiWebInner called, retrying=${_retrying}`);
    const creds = await fetchKimiWebCredentials();
    console.log(`[Kimi Web] Credentials obtained, baseUrl=${creds.baseUrl}, authToken length=${creds.authToken?.length || 0}`);

    // Determine scenario based on model
    let scenario = 'SCENARIO_K2';
    if (model.includes('search')) {
        scenario = 'SCENARIO_SEARCH';
    } else if (model.includes('research')) {
        scenario = 'SCENARIO_RESEARCH';
    } else if (model.includes('k1')) {
        scenario = 'SCENARIO_K1';
    }

    // Build Connect-RPC request body
    const requestBody = {
        scenario,
        message: {
            role: 'user',
            blocks: [{ message_id: '', text: { content: prompt } }],
            scenario,
        },
        options: { thinking: model.includes('thinking') || model.includes('k1') },
    };

    // Encode request in Connect-RPC format
    const enc = new TextEncoder().encode(JSON.stringify(requestBody));
    const buf = new ArrayBuffer(5 + enc.byteLength);
    const dv = new DataView(buf);
    dv.setUint8(0, 0x00); // flags
    dv.setUint32(1, enc.byteLength, false); // length (big-endian)
    new Uint8Array(buf, 5).set(enc);

    console.log(`[Kimi Web] Sending request to ${creds.baseUrl}, model=${model}, scenario=${scenario}, body size=${buf.byteLength} bytes`);

    const response = await fetchWithCookies(
        `${creds.baseUrl}/apiv2/kimi.gateway.chat.v1.ChatService/Chat`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/connect+json',
                'Connect-Protocol-Version': '1',
                'Accept': '*/*',
                'Origin': creds.baseUrl,
                'Referer': `${creds.baseUrl}/`,
                'X-Language': 'zh-CN',
                'X-Msh-Platform': 'web',
                'Authorization': `Bearer ${creds.authToken}`,
            },
            body: buf,
        }
    );

    console.log(`[Kimi Web] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        console.error(`[Kimi Web] HTTP error: ${response.status}`);
        if (response.status === 401 || response.status === 403) {
            _credentialCache = null;
            throw new Error('NOT_LOGGED_IN');
        }
        const errorText = await response.text();
        console.error(`[Kimi Web] Error response body:`, errorText.slice(0, 500));
        throw new Error(`Kimi Web API error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`[Kimi Web] Response body size: ${arrayBuffer?.byteLength || 0} bytes`);
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        if (!_retrying) {
            console.warn('[Kimi Web] Empty response — retrying with fresh credentials...');
            _credentialCache = null;
            return _callKimiWebInner(prompt, model, true);
        }
        throw new Error('Empty response from Kimi Web');
    }

    try {
        const text = parseConnectRpcResponse(arrayBuffer);
        console.log(`[Kimi Web] Parsed response: ${text.length} chars`);
        return text;
    } catch (e) {
        console.error('[Kimi Web] Parse error:', e.message);
        if (e.message === 'NOT_LOGGED_IN') throw e;
        if (!_retrying) {
            console.warn('[Kimi Web] Parse error — retrying:', e.message);
            _credentialCache = null;
            return _callKimiWebInner(prompt, model, true);
        }
        throw e;
    }
}

/**
 * Check if Kimi Web session is active.
 * @returns {Promise<boolean>}
 */
export async function isKimiWebAvailable() {
    console.log('[Kimi Web] Checking availability...');
    try {
        const creds = await fetchKimiWebCredentials();
        console.log('[Kimi Web] Availability check: SUCCESS', { baseUrl: creds.baseUrl, hasAuthToken: !!creds.authToken });
        return true;
    } catch (e) {
        console.warn('[Kimi Web] Availability check: FAILED -', e.message);
        return false;
    }
}
