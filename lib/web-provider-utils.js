/**
 * Shared utilities for web provider drivers.
 * Extracted from kimi-web.js and gemini-web.js for reuse across providers.
 */

// ============================================================================
// Cookie Utilities
// ============================================================================

/**
 * Get cookie header for a specific domain.
 * Uses chrome.cookies API to fetch all cookies for the given domain/URL.
 * 
 * @param {string} domain - Domain to get cookies for (e.g., '.google.com')
 * @param {string} url - URL to scope the cookie request (e.g., 'https://gemini.google.com')
 * @returns {Promise<string>} Cookie header string (e.g., "cookie1=value1; cookie2=value2")
 */
export async function getCookieHeader(domain, url) {
    try {
        if (!chrome?.cookies?.getAll) {
            console.log('[WebProviderUtils] chrome.cookies API not available');
            return '';
        }
        
        console.log(`[WebProviderUtils] Fetching cookies for ${domain}...`);
        const cookies = await chrome.cookies.getAll({ domain, url });
        console.log(`[WebProviderUtils] Found ${cookies.length} cookies for ${domain}:`, cookies.map(c => c.name));
        
        if (!cookies.length) {
            return '';
        }
        
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        console.log('[WebProviderUtils] Cookie string built, length:', cookieString.length);
        return cookieString;
    } catch (e) {
        console.error(`[WebProviderUtils] Error getting cookies for ${domain}:`, e);
        return '';
    }
}

/**
 * Extract a specific cookie value from a cookie header string.
 * 
 * @param {string} cookieString - The cookie header string
 * @param {string} name - Name of the cookie to extract
 * @returns {string|null} The cookie value or null if not found
 */
export function extractCookieValue(cookieString, name) {
    if (!cookieString) return null;
    const match = cookieString.match(new RegExp(`${name}=([^;]+)`));
    return match?.[1] || null;
}

// ============================================================================
// Fetch Utilities
// ============================================================================

/**
 * Fetch with timeout using AbortController.
 * Automatically attaches cookies if available via chrome.cookies API.
 * 
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        options.signal = controller.signal;
        return await fetch(url, options);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Fetch with explicit cookie header (for Edge/non-Chrome environments).
 * Fetches cookies via chrome.cookies API and attaches them to the request.
 * 
 * @param {string} url - URL to fetch
 * @param {string} cookieHeader - Cookie header string to attach
 * @param {Object} options - Fetch options
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithCookies(url, cookieHeader, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
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

// ============================================================================
// Stream Parsing Utilities
// ============================================================================

/**
 * Parse a Server-Sent Events (SSE) stream response.
 * Returns an async generator that yields parsed SSE events.
 * 
 * SSE format:
 *   event: eventName
 *   data: {JSON or text}
 *   id: eventId
 *   retry: 5000
 * 
 * @param {Response} response - Fetch Response object with readable stream
 * @returns {AsyncGenerator<{event?: string, data: string, id?: string}, void, unknown>}
 */
export async function* parseSSEStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('[WebProviderUtils] Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete events (separated by double newline)
            let lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Keep incomplete event in buffer

            for (const chunk of lines) {
                const event = parseSSEChunk(chunk);
                if (event) yield event;
            }
        }

        // Process any remaining data
        if (buffer.trim()) {
            const event = parseSSEChunk(buffer);
            if (event) yield event;
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Parse a single SSE chunk into an event object.
 * @param {string} chunk - SSE chunk text
 * @returns {{event?: string, data: string, id?: string}|null}
 */
function parseSSEChunk(chunk) {
    const lines = chunk.split('\n');
    const event = {};
    let dataLines = [];

    for (const line of lines) {
        if (line.startsWith('event:')) {
            event.event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trim());
        } else if (line.startsWith('id:')) {
            event.id = line.slice(3).trim();
        } else if (line.startsWith('retry:')) {
            event.retry = parseInt(line.slice(6).trim(), 10);
        }
    }

    if (dataLines.length === 0) return null;
    
    event.data = dataLines.join('\n');
    return event;
}

/**
 * Parse a Newline-Delimited JSON (NDJSON) stream response.
 * Returns an async generator that yields parsed JSON objects.
 * 
 * NDJSON format: One JSON object per line
 *   {"key": "value1"}
 *   {"key": "value2"}
 * 
 * @param {Response} response - Fetch Response object with readable stream
 * @returns {AsyncGenerator<Object, void, unknown>}
 */
export async function* parseNDJSONStream(response) {
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('[WebProviderUtils] Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            let lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                
                try {
                    const obj = JSON.parse(trimmed);
                    yield obj;
                } catch (e) {
                    console.warn('[WebProviderUtils] Failed to parse NDJSON line:', trimmed.slice(0, 100));
                    // Skip malformed lines
                }
            }
        }

        // Process any remaining data
        if (buffer.trim()) {
            try {
                const obj = JSON.parse(buffer.trim());
                yield obj;
            } catch (e) {
                console.warn('[WebProviderUtils] Failed to parse final NDJSON line:', buffer.slice(0, 100));
            }
        }
    } finally {
        reader.releaseLock();
    }
}

// ============================================================================
// Credential Caching
// ============================================================================

/**
 * Create a credential cache with TTL (Time To Live).
 * Returns an object with get, set, clear, and isValid methods.
 * 
 * @param {number} ttlMs - Time to live in milliseconds
 * @returns {{
 *   get: () => any|null,
 *   set: (value: any) => void,
 *   clear: () => void,
 *   isValid: () => boolean
 * }}
 * 
 * @example
 * const cache = createCredentialCache(5 * 60 * 1000); // 5 minutes TTL
 * 
 * if (!cache.isValid()) {
 *   const creds = await fetchCredentials();
 *   cache.set(creds);
 * }
 * 
 * return cache.get();
 */
export function createCredentialCache(ttlMs) {
    let _cache = null;
    let _timestamp = 0;

    return {
        /**
         * Get cached value if valid.
         * @returns {any|null} Cached value or null
         */
        get() {
            if (this.isValid()) {
                return _cache;
            }
            return null;
        },

        /**
         * Set cache value.
         * @param {any} value - Value to cache
         */
        set(value) {
            _cache = value;
            _timestamp = Date.now();
        },

        /**
         * Clear the cache.
         */
        clear() {
            _cache = null;
            _timestamp = 0;
        },

        /**
         * Check if cache is valid (exists and not expired).
         * @returns {boolean}
         */
        isValid() {
            return _cache !== null && (Date.now() - _timestamp) < ttlMs;
        },

        /**
         * Get cache timestamp for debugging.
         * @returns {number}
         */
        getTimestamp() {
            return _timestamp;
        }
    };
}

// ============================================================================
// Text Extraction Utilities
// ============================================================================

/**
 * Extract a JSON object from text using regex patterns.
 * Useful for extracting embedded JSON from HTML or mixed content.
 * 
 * @param {string} text - Text containing JSON
 * @returns {Object|null} Parsed JSON object or null if not found/invalid
 * 
 * @example
 * const html = '<script>window.CONFIG = {"key": "value"};</script>';
 * const config = extractJSONFromText(html);
 * // Returns: { key: "value" }
 */
export function extractJSONFromText(text) {
    if (!text || typeof text !== 'string') return null;

    // Try direct JSON parse first
    try {
        return JSON.parse(text);
    } catch {
        // Continue to regex extraction
    }

    // Common patterns for embedded JSON
    const patterns = [
        // JSON in script tags: window.DATA = {...};
        /(?:window\.[A-Z_]+\s*=\s*|const\s+\w+\s*=\s*|var\s+\w+\s*=\s*)(\{[\s\S]*?\});?$/m,
        // JSON in quotes: "data": "{...}"
        /"(\{[^{}]*\})"/,
        // JSON in single quotes: 'data': '{...}'
        /'(\{[^{}]*\})'/,
        // JSON after colon in object context
        /:\s*(\{[\s\S]*?\})\s*[,;\n]/,
        // Generic object pattern (most permissive, try last)
        /(\{[\s\S]*\})/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch {
                // Try next pattern
            }
        }
    }

    return null;
}

/**
 * Extract a specific key-value pair from text using regex.
 * Similar to extractWizValue in gemini-web.js.
 * 
 * @param {string} key - Key to search for
 * @param {string} text - Text to search in
 * @param {string} [quoteType='"'] - Quote type used in the source (" or ')
 * @returns {string|null} Extracted value or null
 * 
 * @example
 * const html = '<script>var TOKEN = "abc123";</script>';
 * const token = extractValueFromText('TOKEN', html);
 * // Returns: "abc123"
 */
export function extractValueFromText(key, text, quoteType = '"') {
    const escapedQuote = quoteType === '"' ? '"' : "'";
    const regex = new RegExp(`${key}\s*[:=]\s*${escapedQuote}([^${escapedQuote}]+)${escapedQuote}`);
    const match = regex.exec(text);
    return match?.[1] || null;
}

// ============================================================================
// Additional Utilities
// ============================================================================

/**
 * Generate a random hex string of specified length.
 * @param {number} byteLength - Number of random bytes to generate
 * @returns {string} Hex string (2 characters per byte)
 */
export function randomHex(byteLength = 8) {
    return Array.from(crypto.getRandomValues(new Uint8Array(byteLength)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Check if a response indicates the user is not logged in.
 * Checks for common patterns in response body and status.
 * 
 * @param {Response} response - Fetch response
 * @param {string} [bodyText] - Optional pre-read body text
 * @returns {boolean} True if not logged in detected
 */
export function isNotLoggedIn(response, bodyText = '') {
    // Check status codes
    if (response.status === 401 || response.status === 403) {
        return true;
    }

    // Check common patterns in body
    const loginPatterns = [
        'accounts.google.com',
        'SignIn',
        'signin',
        'login',
        'NOT_LOGGED_IN',
        'Unauthorized',
        '请先登录',
        '请登录',
        '未登录'
    ];

    const textToCheck = bodyText || '';
    return loginPatterns.some(pattern => 
        textToCheck.includes(pattern) || 
        response.url?.includes(pattern)
    );
}

/**
 * Delay/promise wrapper for setTimeout.
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff.
 * @param {Function} fn - Function to retry
 * @param {number} [maxRetries=3] - Maximum retry attempts
 * @param {number} [delayMs=1000] - Initial delay between retries
 * @returns {Promise<any>}
 */
export async function retryWithBackoff(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i === maxRetries) break;
            
            const delay = delayMs * Math.pow(2, i);
            console.log(`[WebProviderUtils] Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error.message);
            await sleep(delay);
        }
    }
    
    throw lastError;
}
