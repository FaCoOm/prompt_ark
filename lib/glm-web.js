/**
 * GLM China Web Driver — calls ChatGLM (智谱清言) via browser session (no API key needed).
 * Domain: chatglm.cn
 * Auth: Cookie (chatglm_token, chatglm_refresh_token)
 * Protocol: REST API with MD5 signature
 * Sign Algorithm: MD5(`${timestamp}-${nonce}-${SIGN_SECRET}`)
 */

import {
    getCookieHeader,
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://chatglm.cn';

const SIGN_SECRET = '8a1317a7468aa3ad86e997d08f3f31cb';

/** Model ID -> ChatGLM assistant_id mapping */
const ASSISTANT_ID_MAP = {
    'glm-4-plus': '65940acff94777010aa6b796',
    'glm-4': '65940acff94777010aa6b796',
    'glm-4-think': '676411c38945bbc58a905d31',
    'glm-4-zero': '676411c38945bbc58a905d31',
};

const DEFAULT_ASSISTANT_ID = '65940acff94777010aa6b796';

const X_EXP_GROUPS =
    'na_android_config:exp:NA,na_4o_config:exp:4o_A,tts_config:exp:tts_config_a,' +
    'na_glm4plus_config:exp:open,mainchat_server_app:exp:A,mobile_history_daycheck:exp:a,' +
    'desktop_toolbar:exp:A,chat_drawing_server:exp:A,drawing_server_cogview:exp:cogview4,' +
    'app_welcome_v2:exp:A,chat_drawing_streamv2:exp:A,mainchat_rm_fc:exp:add,' +
    'mainchat_dr:exp:open,chat_auto_entrance:exp:A,drawing_server_hi_dream:control:A,' +
    'homepage_square:exp:close,assistant_recommend_prompt:exp:3,app_home_regular_user:exp:A,' +
    'memory_common:exp:enable,mainchat_moe:exp:300,assistant_greet_user:exp:greet_user,' +
    'app_welcome_personalize:exp:A,assistant_model_exp_group:exp:glm4.5,' +
    'ai_wallet:exp:ai_wallet_enable';

// ============================================================================
// MD5 Implementation
// ============================================================================

/**
 * Simple MD5 implementation for browser extension context.
 * Based on RFC 1321.
 */
function md5(input) {
    const utf8 = new TextEncoder().encode(input);
    const bytes = new Uint8Array(utf8);

    // Initialize variables
    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;

    // Pre-processing: add padding
    const originalLength = bytes.length;
    const paddedLength = Math.ceil((originalLength + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);
    padded[originalLength] = 0x80;

    // Append length in bits as 64-bit little-endian
    const bitsLength = originalLength * 8;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, bitsLength & 0xffffffff, true);
    view.setUint32(paddedLength - 4, Math.floor(bitsLength / 0x100000000), true);

    // Process in 512-bit chunks
    for (let i = 0; i < paddedLength; i += 64) {
        const w = new Uint32Array(16);
        for (let j = 0; j < 16; j++) {
            w[j] = view.getUint32(i + j * 4, true);
        }

        let a = h0;
        let b = h1;
        let c = h2;
        let d = h3;

        for (let j = 0; j < 64; j++) {
            let f, g;

            if (j < 16) {
                f = (b & c) | (~b & d);
                g = j;
            } else if (j < 32) {
                f = (d & b) | (~d & c);
                g = (5 * j + 1) & 0x0f;
            } else if (j < 48) {
                f = b ^ c ^ d;
                g = (3 * j + 5) & 0x0f;
            } else {
                f = c ^ (b | ~d);
                g = (7 * j) & 0x0f;
            }

            const temp = d;
            d = c;
            c = b;
            b = b + leftRotate(a + f + K[j] + w[g], S[j]);
            a = temp;
        }

        h0 += a;
        h1 += b;
        h2 += c;
        h3 += d;
    }

    // Convert to hex string
    const result = new Uint8Array(16);
    const resultView = new DataView(result.buffer);
    resultView.setUint32(0, h0, true);
    resultView.setUint32(4, h1, true);
    resultView.setUint32(8, h2, true);
    resultView.setUint32(12, h3, true);

    return Array.from(result)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

function leftRotate(x, c) {
    return (x << c) | (x >>> (32 - c));
}

// ============================================================================
// Sign Generation
// ============================================================================

/**
 * Generate X-Sign, X-Nonce, X-Timestamp headers required by chatglm.cn
 * Sign algorithm: MD5(`${timestamp}-${nonce}-${SIGN_SECRET}`)
 */
function generateSign() {
    // Generate timestamp with special digit manipulation (from reference)
    const e = Date.now();
    const A = e.toString();
    const t = A.length;
    const o = A.split('').map(c => Number(c));
    const i = o.reduce((acc, v) => acc + v, 0) - o[t - 2];
    const a = i % 10;
    const timestamp = A.substring(0, t - 2) + a + A.substring(t - 1, t);

    // Generate nonce (32-char hex without dashes)
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Generate sign: MD5(`${timestamp}-${nonce}-${SIGN_SECRET}`)
    const sign = md5(`${timestamp}-${nonce}-${SIGN_SECRET}`);

    return { timestamp, nonce, sign };
}

function generateDeviceId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ============================================================================
// Credential Management
// ============================================================================

async function fetchGlmWebCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('.chatglm.cn', BASE_URL);

    const refreshToken = extractCookieValue(cookieHeader, 'chatglm_refresh_token');
    const accessToken = extractCookieValue(cookieHeader, 'chatglm_token');

    if (!refreshToken && !accessToken) {
        throw new Error('NOT_LOGGED_IN');
    }

    const deviceId = generateDeviceId();
    const creds = { refreshToken, accessToken, cookieHeader, deviceId };
    credentialCache.set(creds);
    return creds;
}

async function refreshAccessToken(creds) {
    if (!creds.refreshToken) {
        console.warn('[GLM Web] No refresh token available');
        return creds.accessToken || null;
    }

    const sign = generateSign();
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    try {
        const response = await fetch(`${BASE_URL}/chatglm/user-api/user/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${creds.refreshToken}`,
                'App-Name': 'chatglm',
                'X-App-Platform': 'pc',
                'X-App-Version': '0.0.1',
                'X-Device-Id': creds.deviceId,
                'X-Request-Id': requestId,
                'X-Sign': sign.sign,
                'X-Nonce': sign.nonce,
                'X-Timestamp': sign.timestamp,
                'Cookie': creds.cookieHeader,
            },
            credentials: 'include',
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            console.warn('[GLM Web] Token refresh failed:', response.status);
            return creds.accessToken || null;
        }

        const data = await response.json();
        const newAccessToken = data?.result?.access_token ?? data?.result?.accessToken ?? data?.accessToken;

        if (newAccessToken) {
            console.log('[GLM Web] Access token refreshed successfully');
            return newAccessToken;
        }
    } catch (e) {
        console.warn('[GLM Web] Token refresh error:', e.message);
    }

    return creds.accessToken || null;
}

// ============================================================================
// Stream Parsing
// ============================================================================

/**
 * Parse SSE stream data from ChatGLM
 */
function parseGlmStream(text) {
    const lines = text.split('\n');
    const parts = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (!data) continue;

        try {
            const obj = JSON.parse(data);

            // Extract text from various response formats
            if (obj.parts) {
                for (const part of obj.parts) {
                    if (part.content?.[0]?.text) {
                        parts.push(part.content[0].text);
                    }
                }
            }

            if (obj.content?.text) {
                parts.push(obj.content.text);
            }

            if (obj.choices?.[0]?.delta?.content) {
                parts.push(obj.choices[0].delta.content);
            }
        } catch {
            // Not JSON, might be plain text
            if (data !== '[DONE]') {
                parts.push(data);
            }
        }
    }

    return parts.join('');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Call ChatGLM Web API and return the full text response.
 * @param {string} prompt
 * @param {string} [model] - Model ID (e.g., 'glm-4-plus', 'glm-4')
 * @returns {Promise<string>}
 */
export async function callGlmWeb(prompt, model = 'glm-4-plus') {
    return _callGlmWebInner(prompt, model, false);
}

async function _callGlmWebInner(prompt, model, _retrying) {
    const creds = await fetchGlmWebCredentials();

    let accessToken = creds.accessToken;
    if (!accessToken) {
        accessToken = await refreshAccessToken(creds);
    }

    const assistantId = ASSISTANT_ID_MAP[model] ?? DEFAULT_ASSISTANT_ID;
    const deviceId = creds.deviceId;

    console.log(`[GLM Web] Sending request... model=${model} assistantId=${assistantId}`);

    const sign = generateSign();
    const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const body = {
        assistant_id: assistantId,
        conversation_id: '',
        project_id: '',
        chat_type: 'user_chat',
        meta_data: {
            cogview: { rm_label_watermark: false },
            is_test: false,
            input_question_type: 'xxxx',
            channel: '',
            draft_id: '',
            chat_mode: 'zero',
            is_networking: false,
            quote_log_id: '',
            platform: 'pc',
        },
        messages: [
            {
                role: 'user',
                content: [{ type: 'text', text: prompt }],
            },
        ],
    };

    const fetchTimeoutMs = 120000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'App-Name': 'chatglm',
            'Origin': 'https://chatglm.cn',
            'Referer': 'https://chatglm.cn/',
            'X-App-Platform': 'pc',
            'X-App-Version': '0.0.1',
            'X-App-fr': 'default',
            'X-Device-Brand': '',
            'X-Device-Id': deviceId,
            'X-Device-Model': '',
            'X-Exp-Groups': X_EXP_GROUPS,
            'X-Lang': 'zh',
            'X-Nonce': sign.nonce,
            'X-Request-Id': requestId,
            'X-Sign': sign.sign,
            'X-Timestamp': sign.timestamp,
            'Cookie': creds.cookieHeader,
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${BASE_URL}/chatglm/backend-api/assistant/stream`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        clearTimeout(timer);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('[GLM Web] Access token expired, refreshing...');
                credentialCache.clear();
                if (!_retrying) {
                    return _callGlmWebInner(prompt, model, true);
                }
            }

            const errorText = await response.text();
            throw new Error(`ChatGLM API error: ${response.status} - ${errorText.slice(0, 200)}`);
        }

        const responseText = await response.text();
        console.log(`[GLM Web] Response received: ${responseText.length} bytes`);

        const parsedText = parseGlmStream(responseText);

        if (!parsedText && !_retrying) {
            console.warn('[GLM Web] Empty response - retrying with fresh credentials...');
            credentialCache.clear();
            return _callGlmWebInner(prompt, model, true);
        }

        return parsedText || '';
    } catch (e) {
        clearTimeout(timer);

        if (e.name === 'AbortError') {
            throw new Error(`ChatGLM API request timed out after ${fetchTimeoutMs}ms`);
        }

        if (!_retrying && (e.message?.includes('token') || e.message?.includes('auth'))) {
            console.warn('[GLM Web] Auth error - retrying:', e.message);
            credentialCache.clear();
            return _callGlmWebInner(prompt, model, true);
        }

        throw e;
    }
}

/**
 * Check if ChatGLM Web session is active.
 * @returns {Promise<boolean>}
 */
export async function isGlmWebAvailable() {
    try {
        const creds = await fetchGlmWebCredentials();
        return !!(creds.refreshToken || creds.accessToken);
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
