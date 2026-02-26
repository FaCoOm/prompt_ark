/**
 * Gemini Web Driver — calls Gemini via browser session (no API key needed).
 * User must be logged in to gemini.google.com.
 *
 * Inspired by gemini-nexus architecture, but written from scratch.
 */

// --- Model Registry ---
const GEMINI_WEB_MODELS = {
    'gemini-3-flash': '[1,null,null,null,"9ec249fc9ad08861",null,null,0,[4]]',
    'gemini-3-flash-thinking': '[1,null,null,null,"4af6c7f5da75d65d",null,null,0,[4]]',
    'gemini-3-pro': '[1,null,null,null,"9d8ca3786ebdfbea",null,null,0,[4]]',
};

const DEFAULT_WEB_MODEL = 'gemini-3-flash';

// --- Credential Cache ---
let _credentialCache = null;
let _credentialTimestamp = 0;
const CREDENTIAL_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Extract a WIZ data value from Gemini page HTML.
 * Looks for patterns like "SNlM0e":"<value>" in the page source.
 */
function extractWizValue(key, html) {
    const regex = new RegExp(`"${key}":"([^"]+)"`);
    const match = regex.exec(html);
    return match?.[1] || null;
}

/**
 * Build a Cookie header string from chrome.cookies API.
 * Required for Edge where service worker fetch doesn't auto-attach cookies.
 * Falls back gracefully if chrome.cookies is unavailable.
 */
async function getGeminiCookieHeader() {
    try {
        if (!chrome?.cookies?.getAll) return '';
        const cookies = await chrome.cookies.getAll({ domain: '.google.com', url: 'https://gemini.google.com' });
        if (!cookies.length) return '';
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    } catch {
        return '';
    }
}

/**
 * Fetch with explicit cookies attached (Edge compatibility).
 * Chrome auto-attaches cookies; Edge doesn't for service worker fetches.
 */
async function fetchWithCookies(url, options = {}) {
    const cookieHeader = await getGeminiCookieHeader();
    if (cookieHeader) {
        options.headers = {
            ...(options.headers || {}),
            'Cookie': cookieHeader,
        };
    }
    // credentials: 'include' helps Chrome; Cookie header helps Edge
    options.credentials = 'include';
    return fetch(url, options);
}

/**
 * Fetch authentication credentials from gemini.google.com.
 * Returns { atValue, blValue, authUser }.
 * Throws if user is not logged in.
 */
export async function fetchGeminiWebCredentials(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _credentialCache && (now - _credentialTimestamp) < CREDENTIAL_TTL_MS) {
        return _credentialCache;
    }

    console.log('[Gemini Web] Fetching credentials from gemini.google.com...');

    const resp = await fetchWithCookies('https://gemini.google.com/app', { method: 'GET' });
    if (!resp.ok) {
        throw new Error(`Failed to reach gemini.google.com: ${resp.status}`);
    }

    const html = await resp.text();

    const atValue = extractWizValue('SNlM0e', html);
    const blValue = extractWizValue('cfb2h', html);

    if (!atValue) {
        throw new Error('NOT_LOGGED_IN');
    }

    _credentialCache = { atValue, blValue, authUser: '0' };
    _credentialTimestamp = now;

    console.log('[Gemini Web] Credentials obtained successfully');
    return _credentialCache;
}

/**
 * Parse a single response line from the StreamGenerate endpoint.
 * Returns { text, thoughts, ids } or null if line is not parseable.
 */
function parseStreamLine(line) {
    try {
        const clean = line.replace(/^\)\]\}'/, '').trim();
        if (!clean) return null;

        const envelope = JSON.parse(clean);
        if (!Array.isArray(envelope)) return null;

        for (const item of envelope) {
            if (!Array.isArray(item) || item.length < 3 || typeof item[2] !== 'string') continue;

            try {
                const payload = JSON.parse(item[2]);
                if (!Array.isArray(payload) || payload.length < 5) continue;

                const candidates = payload[4];
                if (!Array.isArray(candidates) || !candidates[0]) continue;

                const candidate = candidates[0];
                if (!Array.isArray(candidate) || candidate.length < 2) continue;

                // Extract text
                let text = '';
                const textNode = candidate[1];
                if (Array.isArray(textNode) && typeof textNode[0] === 'string') {
                    text = textNode[0];
                }

                // Extract thinking content (index 37)
                let thoughts = null;
                if (candidate[37]?.[0] && Array.isArray(candidate[37][0]) && typeof candidate[37][0][0] === 'string') {
                    thoughts = candidate[37][0][0];
                }

                return {
                    text,
                    thoughts,
                    ids: [payload[1]?.[0], payload[1]?.[1], candidate[0]],
                };
            } catch { /* skip unparseable payload */ }
        }
    } catch { /* skip non-JSON line */ }

    return null;
}

/**
 * Call Gemini Web API and return the full text response.
 * @param {string} prompt - The user's prompt text
 * @param {string} [model] - Model identifier (default: gemini-3-flash)
 * @returns {Promise<string>} The model's text response
 * @throws {Error} 'NOT_LOGGED_IN' if session expired
 */
export async function callGeminiWeb(prompt, model = DEFAULT_WEB_MODEL) {
    return _callGeminiWebInner(prompt, model, false);
}

async function _callGeminiWebInner(prompt, model, _retrying) {
    const creds = await fetchGeminiWebCredentials();

    // Build payload: [null, JSON([[prompt], null, [convId, respId, choiceId]])]
    const innerData = [[prompt], null, ['', '', '']];
    const fReq = JSON.stringify([null, JSON.stringify(innerData)]);

    const queryParams = new URLSearchParams({
        bl: creds.blValue || '',
        _reqid: String(Math.floor(Math.random() * 900000) + 100000),
        rt: 'c',
    });

    const modelHeader = GEMINI_WEB_MODELS[model] || GEMINI_WEB_MODELS[DEFAULT_WEB_MODEL];

    const endpoint = `https://gemini.google.com/u/${creds.authUser}/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${queryParams}`;

    console.log(`[Gemini Web] Requesting model: ${model}`);

    const response = await fetchWithCookies(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'X-Same-Domain': '1',
            'X-Goog-AuthUser': creds.authUser,
            'x-goog-ext-525001261-jspb': modelHeader,
            'Origin': 'https://gemini.google.com',
            'Referer': 'https://gemini.google.com/',
        },
        body: new URLSearchParams({
            at: creds.atValue,
            'f.req': fReq,
        }),
    });

    if (!response.ok) {
        // Invalidate cache on auth failure
        if (response.status === 401 || response.status === 403) {
            _credentialCache = null;
        }
        throw new Error(`Gemini Web API error: ${response.status}`);
    }

    // Read full response (not streaming — Prompt Ark needs complete JSON)
    const body = await response.text();

    // Check for login redirect
    if (body.includes('<!DOCTYPE html>') || body.includes('<html') || body.includes('Sign in')) {
        _credentialCache = null;
        throw new Error('NOT_LOGGED_IN');
    }

    // Parse line by line, keep the last valid result
    let finalResult = null;
    const lines = body.split('\n');
    for (const line of lines) {
        const parsed = parseStreamLine(line);
        if (parsed) {
            finalResult = parsed;
        }
    }

    if (!finalResult) {
        // Stale credentials are the most common cause of empty responses.
        // Force-refresh and retry once before giving up.
        if (!_retrying) {
            console.warn('[Gemini Web] Empty response, retrying with fresh credentials...');
            _credentialCache = null;
            return _callGeminiWebInner(prompt, model, true);
        }
        throw new Error('No valid response from Gemini Web');
    }

    console.log(`[Gemini Web] Response received (${finalResult.text.length} chars)`);
    return finalResult.text;
}

/**
 * Check if Gemini Web session is active (user is logged in).
 * @returns {Promise<boolean>}
 */
export async function isGeminiWebAvailable() {
    try {
        await fetchGeminiWebCredentials();
        return true;
    } catch {
        return false;
    }
}
