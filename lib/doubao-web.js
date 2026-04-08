/**
 * Doubao Web Driver - calls Doubao via browser session (no API key needed).
 * User must be logged in to doubao.com.
 *
 * Auth: Cookie-based (sessionid, ttwid, s_v_web_id)
 * Dynamic tokens: msToken, a_bogus (captured from URL params via content script)
 * Protocol: SSE (Server-Sent Events) via /samantha/chat/completion
 */

import { getCookieHeader, extractCookieValue, createCredentialCache } from './web-provider-utils.js';

// --- Credential Cache ---
const _credentialCache = createCredentialCache(5 * 60 * 1000);

// --- Constants ---
const DOUBAO_API_BASE = 'https://www.doubao.com';
const USE_SAMANTHA_API = true;

// --- Token Management ---

/**
 * Get dynamic tokens (msToken, a_bogus) from content script.
 * These tokens are captured from URL params during fetch/XHR interception.
 */
async function getDynamicTokensFromContentScript() {
    try {
        const tabs = await chrome.tabs.query({ url: 'https://www.doubao.com/*' });
        if (tabs.length === 0) {
            console.log('[Doubao Web] No doubao.com tab found');
            return null;
        }

        for (const tab of tabs) {
            if (!tab.id) continue;
            try {
                console.log(`[Doubao Web] Requesting tokens from tab ${tab.id}...`);
                const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_DOUBAO_TOKENS' });
                if (response?.success && (response.msToken || response.a_bogus)) {
                    console.log('[Doubao Web] Got dynamic tokens from content script');
                    return {
                        msToken: response.msToken,
                        a_bogus: response.a_bogus,
                        fp: response.fp,
                        tea_uuid: response.tea_uuid,
                        device_id: response.device_id,
                        web_tab_id: response.web_tab_id,
                        aid: response.aid,
                        version_code: response.version_code,
                        pc_version: response.pc_version,
                        region: response.region,
                        language: response.language,
                    };
                }
            } catch (e) {
                console.warn(`[Doubao Web] Failed to get tokens from tab ${tab.id}:`, e.message);
            }
        }
        return null;
    } catch (e) {
        console.error('[Doubao Web] Error querying tabs:', e);
        return null;
    }
}

/**
 * Get Doubao cookies (sessionid, ttwid, s_v_web_id)
 */
async function getDoubaoCookies() {
    const cookieHeader = await getCookieHeader('.doubao.com', 'https://www.doubao.com');
    if (!cookieHeader) {
        console.log('[Doubao Web] No cookies found');
        return null;
    }

    const sessionid = extractCookieValue(cookieHeader, 'sessionid');
    const ttwid = extractCookieValue(cookieHeader, 'ttwid');
    const fp = extractCookieValue(cookieHeader, 's_v_web_id');

    if (!sessionid) {
        console.log('[Doubao Web] No sessionid cookie found');
        return null;
    }

    return { sessionid, ttwid, fp, cookieHeader };
}

// --- Credential Fetching ---

/**
 * Check if user is logged in to Doubao and extract credentials.
 * Returns auth tokens and dynamic parameters.
 * Throws 'NOT_LOGGED_IN' if user is not signed in.
 */
export async function fetchDoubaoWebCredentials(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = _credentialCache.get();
        if (cached) {
            console.log('[Doubao Web] Using cached credentials');
            return cached;
        }
    }

    console.log('[Doubao Web] Checking credentials...');

    // Get cookies
    const cookies = await getDoubaoCookies();
    if (!cookies) {
        console.error('[Doubao Web] No auth cookies found - user not logged in');
        throw new Error('NOT_LOGGED_IN');
    }

    // Get dynamic tokens
    const dynamicTokens = await getDynamicTokensFromContentScript();

    const credentials = {
        ...cookies,
        ...dynamicTokens,
        userAgent: navigator.userAgent,
    };

    _credentialCache.set(credentials);
    console.log('[Doubao Web] Credentials acquired');
    return credentials;
}

// --- Request Building ---

function buildHeaders(creds) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': creds.userAgent || navigator.userAgent,
        'Referer': 'https://www.doubao.com/chat/',
        'Origin': 'https://www.doubao.com',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
    };

    const cookieParts = [`sessionid=${creds.sessionid}`];
    if (creds.ttwid) {
        cookieParts.push(`ttwid=${decodeURIComponent(creds.ttwid)}`);
    }
    if (creds.fp) {
        cookieParts.push(`s_v_web_id=${creds.fp}`);
    }
    headers['Cookie'] = cookieParts.join('; ');

    return headers;
}

function buildQueryParams(creds) {
    const params = new URLSearchParams();

    // Static parameters
    params.append('aid', creds.aid || '497858');
    params.append('device_platform', 'web');
    params.append('language', creds.language || 'zh');
    params.append('pkg_type', 'release_version');
    params.append('real_aid', creds.aid || '497858');
    params.append('region', creds.region || 'CN');
    params.append('samantha_web', '1');
    params.append('sys_region', creds.region || 'CN');
    params.append('use_olympus_account', '1');
    params.append('version_code', creds.version_code || '20800');

    // Dynamic parameters (if available)
    if (creds.fp) params.append('fp', creds.fp);
    if (creds.tea_uuid) params.append('tea_uuid', creds.tea_uuid);
    if (creds.device_id) params.append('device_id', creds.device_id);
    if (creds.web_tab_id) params.append('web_tab_id', creds.web_tab_id);
    if (creds.web_id) params.append('web_id', creds.web_id);
    if (creds.pc_version) params.append('pc_version', creds.pc_version);

    // Critical anti-bot tokens
    if (creds.msToken) params.append('msToken', creds.msToken);
    if (creds.a_bogus) params.append('a_bogus', creds.a_bogus);

    return params.toString();
}

/**
 * Merge messages into samantha format (im_start/im_end style)
 */
function mergeMessagesForSamantha(messages) {
    return messages
        .map((m) => {
            const role = m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system';
            return `<|im_start|>${role}\n${m.content}\n`;
        })
        .join('') + '<|im_end|>';
}

// --- Response Parsing ---

/**
 * Parse single line SSE format: id: 123 event: XXX data: {...}
 */
function parseSingleLineSSE(line) {
    const match = line.match(/id:\s*\d+\s+event:\s*(\S+)\s+data:\s*(.+)/);
    if (!match) return null;
    return { event: match[1].trim(), data: match[2].trim() };
}

/**
 * Parse samantha API line format (event_type, event_data)
 */
function extractTextFromSamanthaLine(line) {
    const chunks = [];
    try {
        const raw = JSON.parse(line);
        if (raw.code != null && raw.code !== 0) return chunks;
      if (raw.event_type === 2003) return chunks;
      if (raw.event_type !== 2001 || !raw.event_data) return chunks;

        const result = JSON.parse(raw.event_data);
        if (result.is_finish) return chunks;

        const message = result.message;
        const contentType = message?.content_type;
        if (!message || contentType === undefined || ![2001, 2008].includes(contentType) || !message.content) {
            return chunks;
        }

        const content = JSON.parse(message.content);
        if (content.text) {
            chunks.push(content.text);
        }
    } catch {
      return chunks;
    }
    return chunks;
}

/**
 * Extract text from SSE event
 */
function extractTextFromEvent(event) {
    const chunks = [];
    if (!event.event || !event.data) return chunks;

    try {
        const data = JSON.parse(event.data);

        switch (event.event) {
            case 'CHUNK_DELTA':
                if (data.text) chunks.push(data.text);
                break;
            case 'STREAM_CHUNK':
                if (data.patch_op) {
                    for (const patch of data.patch_op) {
                        if (patch.patch_value?.tts_content) {
                            chunks.push(patch.patch_value.tts_content);
                        }
                    }
                }
                break;
            case 'STREAM_MSG_NOTIFY':
                if (data.content?.content_block) {
                    for (const block of data.content.content_block) {
                        if (block.content?.text_block?.text) {
                            chunks.push(block.content.text_block.text);
                        }
                    }
                }
                break;
            case 'STREAM_ERROR':
                console.error('[Doubao Web] Stream error:', data);
                if (data.error_code === 710022004) {
                    // Show user notification about rate limit / verification required
                    const errorMsg = data.error_msg || 'Doubao rate limit: Please complete verification on doubao.com';
                    if (typeof chrome !== 'undefined' && chrome.notifications) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon128.png',
                            title: '豆包 (Doubao) 需要验证',
                            message: '请在 doubao.com 网站完成滑动验证后重试。Please complete the verification on doubao.com.',
                            priority: 2
                        });
                    }
                    throw new Error(`Doubao rate limit: ${errorMsg}`);
                } else {
                    throw new Error(`Doubao API error: ${data.error_msg} (code: ${data.error_code})`);
                }
            case 'SSE_REPLY_END':
                console.log('[Doubao Web] Stream ended');
                break;
            case 'SSE_HEARTBEAT':
            case 'SSE_ACK':
                // Ignore keepalive and acknowledgment events
                break;
        }
    } catch (e) {
      if (e.message?.includes('rate limit') || e.message?.includes('API error')) throw e;
    }

    return chunks;
}

// --- Stream Parsing ---

async function* streamParser(response) {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = {};

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '') {
                    // Empty line ends multi-line event
                    if (currentEvent.event && currentEvent.data) {
                        const chunks = extractTextFromEvent(currentEvent);
                        for (const chunk of chunks) yield chunk;
                    }
                    currentEvent = {};
                    continue;
                }

                // Single line format
                const single = parseSingleLineSSE(trimmed);
                if (single) {
                    const chunks = extractTextFromEvent({ event: single.event, data: single.data });
                    for (const chunk of chunks) yield chunk;
                    currentEvent = {};
                    continue;
                }

                // Samantha format (JSON line)
                const dataLine = trimmed.startsWith('data: ') ? trimmed.slice(6).trim() : trimmed;
                const samanthaChunks = extractTextFromSamanthaLine(dataLine);
                if (samanthaChunks.length > 0) {
                    for (const chunk of samanthaChunks) yield chunk;
                    currentEvent = {};
                    continue;
                }

                // Multi-line SSE fields
                if (trimmed.startsWith('id: ')) {
                    currentEvent.id = trimmed.substring(4).trim();
                } else if (trimmed.startsWith('event: ')) {
                    currentEvent.event = trimmed.substring(7).trim();
                } else if (trimmed.startsWith('data: ')) {
                    currentEvent.data = trimmed.substring(6).trim();
                }
            }
        }

        // Process final event
        if (currentEvent.event && currentEvent.data) {
            const chunks = extractTextFromEvent(currentEvent);
            for (const chunk of chunks) yield chunk;
        }
    } finally {
        reader.releaseLock();
    }
}

// --- Public API ---

/**
 * Call Doubao Web API and return the full text response.
 * @param {string} prompt
 * @param {string} [model]
 * @returns {Promise<string>}
 */
export async function callDoubaoWeb(prompt, model = 'doubao-seed-2.0') {
    return _callDoubaoWebInner(prompt, model, false);
}

async function _callDoubaoWebInner(prompt, model, _retrying) {
    console.log(`[Doubao Web] callDoubaoWeb called with model=${model}`);

    const creds = await fetchDoubaoWebCredentials();
    const queryParams = buildQueryParams(creds);

    let url, body;

    if (USE_SAMANTHA_API) {
        url = `${DOUBAO_API_BASE}/samantha/chat/completion?${queryParams}`;
        const text = mergeMessagesForSamantha([{ role: 'user', content: prompt }]);
        body = JSON.stringify({
            messages: [{
                content: JSON.stringify({ text }),
                content_type: 2001,
                attachments: [],
                references: [],
            }],
            completion_option: {
                is_regen: false,
                with_suggest: true,
                need_create_conversation: true,
                launch_stage: 1,
                is_replace: false,
                is_delete: false,
                message_from: 0,
                event_id: '0',
            },
            conversation_id: '0',
            local_conversation_id: `local_16${Date.now().toString().slice(-14)}`,
            local_message_id: crypto.randomUUID(),
        });
    } else {
        url = `${DOUBAO_API_BASE}/chat/completion?${queryParams}`;
        body = JSON.stringify({
            client_meta: {
                local_conversation_id: `local_${Date.now()}`,
                conversation_id: '',
                bot_id: '7338286299411103781',
            },
            ext: { use_deep_think: '0', fp: creds.fp || '' },
            messages: [{ role: 'user', content: prompt }],
            option: {
                send_message_scene: '',
                create_time_ms: Date.now(),
                collect_id: '',
                is_audio: false,
            },
        });
    }

    const headers = buildHeaders(creds);
    if (USE_SAMANTHA_API) {
        headers['Referer'] = 'https://www.doubao.com/chat/';
        headers['Agw-js-conv'] = 'str';
    }

    console.log(`[Doubao Web] Sending request to: ${url.split('?')[0]}`);

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            _credentialCache.clear();
            throw new Error('NOT_LOGGED_IN');
        }
        const errorText = await response.text();
        console.error(`[Doubao Web] API error: ${response.status} - ${errorText.slice(0, 200)}`);
        throw new Error(`Doubao API error: ${response.status}`);
    }

    console.log(`[Doubao Web] Response received, parsing stream...`);

    // Parse stream and collect text
    let fullText = '';
    try {
        for await (const chunk of streamParser(response)) {
            fullText += chunk;
        }
    } catch (e) {
        if (e.message?.includes('rate limit')) throw e;
        console.error('[Doubao Web] Stream parsing error:', e);
    }

    if (!fullText && !_retrying) {
        console.warn('[Doubao Web] Empty response - retrying with fresh credentials...');
        _credentialCache.clear();
        return _callDoubaoWebInner(prompt, model, true);
    }

    console.log(`[Doubao Web] Response: ${fullText.length} chars`);
    return fullText;
}

/**
 * Check if Doubao Web session is active.
 * @returns {Promise<boolean>}
 */
export async function isDoubaoWebAvailable() {
    console.log('[Doubao Web] Checking availability...');
    try {
        await fetchDoubaoWebCredentials();
        console.log('[Doubao Web] Availability check: SUCCESS');
        return true;
    } catch (e) {
        console.warn('[Doubao Web] Availability check: FAILED -', e.message);
        return false;
    }
}
