/**
 * DeepSeek Web Driver — calls DeepSeek via browser session (no API key needed).
 * User must be logged in to chat.deepseek.com.
 *
 * Protocol: REST API with SHA256 Proof of Work (PoW) challenge
 * Auth: Cookie (d_id, ds_session_id) + Bearer token
 * Special: Requires solving SHA256 PoW challenge before each API call
 */

import { fetchWithTimeout } from './web-provider-utils.js';

// --- Credential Cache ---
let _credentialCache = null;
let _credentialTimestamp = 0;
const CREDENTIAL_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- Constants ---
const BASE_URL = 'https://chat.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

// --- Utilities ---

/**
 * Get DeepSeek cookies from chrome.cookies API.
 * Looks for d_id and ds_session_id cookies.
 */
async function getDeepSeekCookieHeader() {
    try {
        if (!chrome?.cookies?.getAll) {
            console.log('[DeepSeek Web] chrome.cookies API not available');
            return '';
        }

        console.log('[DeepSeek Web] Fetching cookies for deepseek.com...');
        const cookies = await chrome.cookies.getAll({ domain: '.deepseek.com', url: BASE_URL });
        console.log(`[DeepSeek Web] Found ${cookies.length} cookies:`, cookies.map(c => c.name));

        if (!cookies.length) {
            console.warn('[DeepSeek Web] No cookies found');
            return '';
        }

        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('[DeepSeek Web] Cookie string built, length:', cookieString.length);
        return cookieString;
    } catch (e) {
        console.error('[DeepSeek Web] Error getting cookies:', e);
        return '';
    }
}

/**
 * Build standard headers for DeepSeek API requests.
 */
async function buildHeaders(cookieHeader, bearerToken = '') {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/`,
        'User-Agent': navigator.userAgent,
        'x-client-platform': 'web',
        'x-client-version': '1.7.0',
        'x-app-version': '20241129.1',
        'x-client-locale': 'zh_CN',
        'x-client-timezone-offset': String(-(new Date().getTimezoneOffset())),
    };

    if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
    }

    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    return headers;
}

// --- SHA256 PoW Solver ---

/**
 * Solve SHA256 PoW challenge.
 * Finds a nonce such that SHA256(salt + challenge + nonce) has required leading zero bits.
 * 
 * @param {string} salt - Salt from challenge
 * @param {string} challenge - Challenge string
 * @param {number} difficulty - Required number of leading zero bits
 * @returns {Promise<number>} The nonce that solves the challenge
 */
async function solveSha256Pow(salt, challenge, difficulty) {
    console.log(`[DeepSeek Web] Solving SHA256 PoW (difficulty: ${difficulty})...`);
    const start = Date.now();
    
    let nonce = 0;
    const maxNonce = 10000000; // Safety limit
    
    // Convert difficulty from DeepSeek's format to zero bits
    // DeepSeek uses difficulty as a power of 2, so difficulty=1024 means 10 bits
    const targetZeroBits = difficulty > 1000 ? Math.floor(Math.log2(difficulty)) : difficulty;
    
    while (nonce < maxNonce) {
        const input = salt + challenge + nonce;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
        const hashArray = new Uint8Array(hashBuffer);
        
        // Count leading zero bits
        let zeroBits = 0;
        for (let i = 0; i < hashArray.length; i++) {
            const byte = hashArray[i];
            if (byte === 0) {
                zeroBits += 8;
            } else {
                // Count leading zeros in this byte
                zeroBits += Math.clz32(byte) - 24;
                break;
            }
        }
        
        if (zeroBits >= targetZeroBits) {
            const hexHash = Array.from(hashArray)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            console.log(`[DeepSeek Web] SHA256 PoW solved in ${Date.now() - start}ms, nonce: ${nonce}`);
            console.log(`[DeepSeek Web] Hash: ${hexHash.substring(0, 16)}... (${zeroBits} zero bits)`);
            return nonce;
        }
        
        nonce++;
        
        // Yield to event loop every 10000 iterations to prevent blocking
        if (nonce % 10000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    throw new Error(`SHA256 PoW timeout: Could not find solution after ${maxNonce} attempts`);
}

// --- Credential Fetching ---

/**
 * Check if user is logged in to DeepSeek and extract credentials.
 * Returns { cookieHeader, bearerToken }.
 * Throws 'NOT_LOGGED_IN' if user is not signed in.
 */
export async function fetchDeepSeekWebCredentials(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && _credentialCache && (now - _credentialTimestamp) < CREDENTIAL_TTL_MS) {
        console.log('[DeepSeek Web] Using cached credentials');
        return _credentialCache;
    }

    console.log('[DeepSeek Web] Checking credentials...');

    const cookieHeader = await getDeepSeekCookieHeader();
    
    // Check for required cookies
    const hasDeviceId = cookieHeader.includes('d_id=');
    const hasSessionId = cookieHeader.includes('ds_session_id=');
    const hasSessionInfo = cookieHeader.includes('HWSID=') || cookieHeader.includes('uuid=');
    
    if (!cookieHeader || (!hasDeviceId && !hasSessionId && !hasSessionInfo)) {
        console.error('[DeepSeek Web] No valid session cookies found');
        throw new Error('NOT_LOGGED_IN');
    }

    // Try to fetch bearer token from user endpoint
    let bearerToken = '';
    try {
        const headers = await buildHeaders(cookieHeader);
        const response = await fetchWithTimeout(`${BASE_URL}/api/v0/users/current`, {
            method: 'GET',
            headers,
        }, 10000);
        
        if (response.ok) {
            const data = await response.json();
            bearerToken = data?.data?.biz_data?.token || '';
            if (bearerToken) {
                console.log('[DeepSeek Web] Bearer token acquired from users/current');
            }
        }
    } catch (e) {
        console.warn('[DeepSeek Web] Could not fetch bearer token:', e.message);
    }

    console.log(`[DeepSeek Web] Credentials: d_id=${hasDeviceId}, ds_session_id=${hasSessionId}, bearer=${!!bearerToken}`);

    _credentialCache = { cookieHeader, bearerToken };
    _credentialTimestamp = now;

    return _credentialCache;
}

// --- PoW Challenge ---

/**
 * Create a PoW challenge for the target API path.
 * DeepSeek requires a PoW challenge for protected endpoints like /api/v0/chat/completion.
 * 
 * @param {string} targetPath - The API path (e.g., '/api/v0/chat/completion')
 * @param {string} cookieHeader - Cookie header for authentication
 * @param {string} bearerToken - Bearer token (optional)
 * @returns {Promise<Object>} The challenge object with algorithm, challenge, salt, difficulty, signature
 */
async function createPowChallenge(targetPath, cookieHeader, bearerToken) {
    console.log(`[DeepSeek Web] Creating PoW challenge for ${targetPath}...`);
    
    const headers = await buildHeaders(cookieHeader, bearerToken);
    
    const response = await fetchWithTimeout(`${BASE_URL}/api/v0/chat/create_pow_challenge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ target_path: targetPath }),
    }, 30000);

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[DeepSeek Web] Failed to create PoW challenge: ${response.status}`, errorText);
        throw new Error(`Failed to create PoW challenge: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[DeepSeek Web] PoW challenge response:', JSON.stringify(data, null, 2));

    // Extract challenge from response
    const challenge = data?.data?.biz_data?.challenge || data?.data?.challenge || data?.challenge;
    
    if (!challenge) {
        console.error('[DeepSeek Web] PoW challenge missing in response. Keys:', Object.keys(data));
        throw new Error('PoW challenge missing in response');
    }

    console.log(`[DeepSeek Web] Challenge extracted: algorithm=${challenge.algorithm}, difficulty=${challenge.difficulty}`);
    return challenge;
}

/**
 * Solve PoW challenge based on algorithm type.
 * 
 * @param {Object} challenge - The challenge object
 * @returns {Promise<number>} The answer (nonce)
 */
async function solvePowChallenge(challenge) {
    const { algorithm, challenge: challengeStr, salt, difficulty } = challenge;
    
    if (algorithm === 'sha256') {
        return solveSha256Pow(salt, challengeStr, difficulty);
    }
    
    // DeepSeekHashV1 would require WASM - for now we only support SHA256
    // If the server returns DeepSeekHashV1, we'll need to implement WASM support
    if (algorithm === 'DeepSeekHashV1') {
        console.warn('[DeepSeek Web] DeepSeekHashV1 algorithm detected - falling back to basic implementation');
        // For now, attempt SHA256 as fallback (this may not work)
        return solveSha256Pow(salt, challengeStr, difficulty);
    }
    
    throw new Error(`Unsupported PoW algorithm: ${algorithm}`);
}

/**
 * Build the x-ds-pow-response header value.
 * 
 * @param {Object} challenge - The original challenge
 * @param {number} answer - The solved nonce
 * @param {string} targetPath - The target API path
 * @returns {string} Base64-encoded PoW response
 */
function buildPowResponse(challenge, answer, targetPath) {
    const powResponse = {
        ...challenge,
        answer,
        target_path: targetPath,
    };
    
    return btoa(JSON.stringify(powResponse));
}

// --- Response Parsing ---

/**
 * Parse DeepSeek SSE (Server-Sent Events) stream response.
 * DeepSeek returns events with data containing JSON chunks.
 */
async function* parseDeepSeekStream(reader) {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete events
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                
                // SSE format: data: {...}
                if (trimmed.startsWith('data:')) {
                    const data = trimmed.slice(5).trim();
                    
                    // Check for [DONE] marker
                    if (data === '[DONE]') {
                        return;
                    }
                    
                    try {
                        const parsed = JSON.parse(data);
                        yield parsed;
                    } catch (e) {
                        // Skip malformed JSON
                        console.warn('[DeepSeek Web] Failed to parse SSE data:', data.substring(0, 100));
                    }
                }
            }
        }

        // Process any remaining data
        if (buffer.trim()) {
            const trimmed = buffer.trim();
            if (trimmed.startsWith('data:')) {
                const data = trimmed.slice(5).trim();
                if (data && data !== '[DONE]') {
                    try {
                        const parsed = JSON.parse(data);
                        yield parsed;
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

// --- Public API ---

/**
 * Call DeepSeek Web API and return the full text response.
 * @param {string} prompt
 * @param {string} [model] - Model ID (e.g., 'deepseek-chat', 'deepseek-reasoner')
 * @returns {Promise<string>}
 */
export async function callDeepSeekWeb(prompt, model = DEFAULT_MODEL) {
    console.log(`[DeepSeek Web] callDeepSeekWeb called with model=${model}, prompt length=${prompt.length}`);
    return _callDeepSeekWebInner(prompt, model, false);
}

async function _callDeepSeekWebInner(prompt, model, _retrying) {
    const creds = await fetchDeepSeekWebCredentials();
    console.log(`[DeepSeek Web] Credentials obtained, hasBearer=${!!creds.bearerToken}`);

    // Step 1: Create PoW challenge for chat completion
    const targetPath = '/api/v0/chat/completion';
    const challenge = await createPowChallenge(targetPath, creds.cookieHeader, creds.bearerToken);
    
    // Step 2: Solve the PoW challenge
    const answer = await solvePowChallenge(challenge);
    
    // Step 3: Build PoW response header
    const powResponse = buildPowResponse(challenge, answer, targetPath);

    // Step 4: Create chat session first
    console.log('[DeepSeek Web] Creating chat session...');
    const sessionHeaders = await buildHeaders(creds.cookieHeader, creds.bearerToken);
    const sessionResponse = await fetchWithTimeout(`${BASE_URL}/api/v0/chat_session/create`, {
        method: 'POST',
        headers: sessionHeaders,
        body: JSON.stringify({}),
    }, 30000);

    if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error(`[DeepSeek Web] Failed to create session: ${sessionResponse.status}`, errorText);
        throw new Error(`Failed to create chat session: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionId = sessionData?.data?.biz_data?.id || sessionData?.data?.biz_data?.chat_session_id;
    
    if (!sessionId) {
        console.error('[DeepSeek Web] No session ID in response:', sessionData);
        throw new Error('Failed to get chat session ID');
    }
    
    console.log(`[DeepSeek Web] Session created: ${sessionId}`);

    // Step 5: Send chat completion request with PoW
    console.log(`[DeepSeek Web] Sending chat completion request...`);
    
    const completionHeaders = {
        ...await buildHeaders(creds.cookieHeader, creds.bearerToken),
        'x-ds-pow-response': powResponse,
    };

    const isReasoningModel = model.includes('reasoner');
    
    const response = await fetchWithTimeout(`${BASE_URL}${targetPath}`, {
        method: 'POST',
        headers: completionHeaders,
        body: JSON.stringify({
            chat_session_id: sessionId,
            parent_message_id: null,
            prompt: prompt,
            ref_file_ids: [],
            thinking_enabled: isReasoningModel, // true for reasoning models
            search_enabled: model.includes('search'),
            preempt: false,
        }),
    }, 120000); // 2 minute timeout for generation

    console.log(`[DeepSeek Web] Response status: ${response.status}`);

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            _credentialCache = null;
            throw new Error('NOT_LOGGED_IN');
        }
        
        const errorText = await response.text();
        console.error(`[DeepSeek Web] HTTP error: ${response.status}`, errorText);
        
        if (!_retrying) {
            console.warn('[DeepSeek Web] Retrying with fresh credentials...');
            _credentialCache = null;
            return _callDeepSeekWebInner(prompt, model, true);
        }
        
        throw new Error(`DeepSeek Web API error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    // Step 6: Parse streaming response
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('[DeepSeek Web] Response body is not readable');
    }

    const chunks = [];
    let reasoningContent = '';
    let finalContent = '';

    try {
        for await (const chunk of parseDeepSeekStream(reader)) {
            console.log('[DeepSeek Web] Chunk:', JSON.stringify(chunk, null, 2).substring(0, 200));
            
            // Extract content from chunk
            // DeepSeek response structure varies, try multiple paths
            const choices = chunk.choices || chunk.data?.choices;
            if (choices && choices.length > 0) {
                const choice = choices[0];
                const delta = choice.delta || choice.message;
                
                if (delta) {
                    if (delta.content) {
                        finalContent += delta.content;
                        chunks.push(delta.content);
                    }
                    if (delta.reasoning_content) {
                        reasoningContent += delta.reasoning_content;
                    }
                }
            }
            
            // Alternative: check for direct content field
            if (chunk.content && typeof chunk.content === 'string') {
                finalContent += chunk.content;
                chunks.push(chunk.content);
            }
            
            // Check for finish reason
            if (chunk.choices?.[0]?.finish_reason) {
                console.log(`[DeepSeek Web] Finish reason: ${chunk.choices[0].finish_reason}`);
            }
        }
    } catch (e) {
        console.error('[DeepSeek Web] Error parsing stream:', e);
        if (!_retrying) {
            console.warn('[DeepSeek Web] Stream parse error — retrying...');
            _credentialCache = null;
            return _callDeepSeekWebInner(prompt, model, true);
        }
        throw e;
    }

    if (!finalContent && !reasoningContent) {
        if (!_retrying) {
            console.warn('[DeepSeek Web] Empty response — retrying with fresh credentials...');
            _credentialCache = null;
            return _callDeepSeekWebInner(prompt, model, true);
        }
        throw new Error('Empty response from DeepSeek Web');
    }

    // For reasoning models, prepend reasoning if present
    let result = finalContent;
    if (isReasoningModel && reasoningContent) {
        result = `<thinking>\n${reasoningContent}\n</thinking>\n\n${finalContent}`;
    }

    console.log(`[DeepSeek Web] Response: ${result.length} chars`);
    return result;
}

/**
 * Check if DeepSeek Web session is active.
 * @returns {Promise<boolean>}
 */
export async function isDeepSeekWebAvailable() {
    console.log('[DeepSeek Web] Checking availability...');
    try {
        const creds = await fetchDeepSeekWebCredentials();
        console.log('[DeepSeek Web] Availability check: SUCCESS', { 
            hasCookie: !!creds.cookieHeader, 
            hasBearer: !!creds.bearerToken 
        });
        return true;
    } catch (e) {
        console.warn('[DeepSeek Web] Availability check: FAILED -', e.message);
        return false;
    }
}
