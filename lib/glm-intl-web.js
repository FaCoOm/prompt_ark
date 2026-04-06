/**
 * GLM International Web Driver — calls GLM via browser session (no API key needed).
 * Domain: chat.z.ai
 * Auth: Cookie (chatglm_token, access_token, zai_token)
 * Protocol: DOM Simulation (no direct API available)
 */

import { 
    getCookieHeader, 
    createCredentialCache,
    extractCookieValue,
} from './web-provider-utils.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = 'https://chat.z.ai';

const TOKEN_COOKIE_NAMES = [
    'chatglm_token',
    'access_token', 
    'zai_token',
    'token',
    'auth_token',
    'chatglm_refresh_token',
    'refresh_token'
];

async function fetchGlmIntlCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    const cookieHeader = await getCookieHeader('z.ai', BASE_URL);
    
    let authToken = null;
    let tokenName = null;
    
    for (const name of TOKEN_COOKIE_NAMES) {
        const value = extractCookieValue(cookieHeader, name);
        if (value) {
            authToken = value;
            tokenName = name;
            break;
        }
    }
    
    if (!authToken) {
        throw new Error('NOT_LOGGED_IN');
    }

    const creds = { authToken, tokenName, cookieHeader };
    credentialCache.set(creds);
    return creds;
}

async function sendMessageViaContentScript(message) {
    const tabs = await chrome.tabs.query({ url: 'https://chat.z.ai/*' });
    if (tabs.length === 0) {
        await chrome.tabs.create({ url: BASE_URL, active: false });
        await new Promise(resolve => setTimeout(resolve, 3000));
        return sendMessageViaContentScript(message);
    }

    const tab = tabs[0];
    if (!tab.id) {
        throw new Error('GLM Intl Web: No valid tab found');
    }

    try {
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'GLM_INTL_SEND_MESSAGE',
            message: message
        });
        
        if (!response?.success) {
            throw new Error(response?.error || 'GLM Intl Web: Failed to send message');
        }
        
        return response.text;
    } catch (e) {
        if (e.message?.includes('Receiving end does not exist')) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: injectGlmIntlContentScript
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            return sendMessageViaContentScript(message);
        }
        throw e;
    }
}

function injectGlmIntlContentScript() {
    if (window.__glmIntlContentScriptLoaded) return;
    window.__glmIntlContentScriptLoaded = true;

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.type !== 'GLM_INTL_SEND_MESSAGE') return false;

        (async () => {
            try {
                const text = await sendMessageAndWaitForResponse(request.message);
                sendResponse({ success: true, text });
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();

        return true;
    });

    async function sendMessageAndWaitForResponse(message) {
        const beforeCount = document.querySelectorAll('.chat-assistant').length;
        let sent = false;

        const textarea = document.querySelector('textarea');
        if (textarea && !sent) {
            textarea.focus();
            textarea.value = message;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
            sent = true;
        }

        if (!sent) {
            const editable = document.querySelector('[contenteditable="true"]');
            if (editable) {
                editable.focus();
                editable.textContent = message;
                editable.dispatchEvent(new InputEvent('input', { bubbles: true }));
                const sendBtn = document.querySelector('button[type="submit"], button.send-button, button[aria-label*="send" i]');
                if (sendBtn) {
                    sendBtn.click();
                } else {
                    editable.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                }
                sent = true;
            }
        }

        if (!sent) {
            const input = document.querySelector('input[type="text"]');
            if (input) {
                input.focus();
                input.value = message;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                const sendBtn = document.querySelector('button.sendMessageButton, button[aria-label*="Send"], button:has-text("发送")');
                if (sendBtn) {
                    sendBtn.click();
                } else {
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                }
                sent = true;
            }
        }

        if (!sent) {
            throw new Error('GLM Intl: No chat input found on page');
        }

        await waitForElement(() => {
            const currentCount = document.querySelectorAll('.chat-assistant').length;
            return currentCount > beforeCount;
        }, 120000, 500);

        const deadline = Date.now() + 120000;
        let stableRounds = 0;
        let lastText = '';
        let currentText = '';

        while (Date.now() < deadline) {
            const assistantElements = document.querySelectorAll('.chat-assistant');
            const latest = assistantElements[assistantElements.length - 1];
            
            if (latest) {
                currentText = (latest.innerText || latest.textContent || '').trim();
                
                if (currentText && currentText === lastText) {
                    stableRounds++;
                } else {
                    stableRounds = 0;
                    lastText = currentText;
                }

                if (lastText && stableRounds >= 3) {
                    break;
                }
            }

            await new Promise(r => setTimeout(r, 900));
        }

        if (!lastText) {
            throw new Error('GLM Intl: Failed to capture assistant response');
        }

        return lastText;
    }

    function waitForElement(checkFn, timeoutMs = 30000, intervalMs = 500) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                if (checkFn()) {
                    resolve();
                    return;
                }
                
                if (Date.now() - startTime > timeoutMs) {
                    reject(new Error('Timeout waiting for element/condition'));
                    return;
                }
                
                setTimeout(check, intervalMs);
            };
            
            check();
        });
    }
}

export async function callGlmIntlWeb(prompt, model = 'glm-4-plus') {
    return _callGlmIntlWebInner(prompt, model, false);
}

async function _callGlmIntlWebInner(prompt, model, _retrying) {
    await fetchGlmIntlCredentials();
    
    try {
        const text = await sendMessageViaContentScript(prompt);
        
        if (!text && !_retrying) {
            credentialCache.clear();
            return _callGlmIntlWebInner(prompt, model, true);
        }
        
        return text;
    } catch (e) {
        if (e.message?.includes('NOT_LOGGED_IN') || e.message?.includes('login')) {
            throw new Error('NOT_LOGGED_IN');
        }
        
        if (!_retrying) {
            credentialCache.clear();
            return _callGlmIntlWebInner(prompt, model, true);
        }
        
        throw e;
    }
}

export async function isGlmIntlWebAvailable() {
    try {
        await fetchGlmIntlCredentials();
        return true;
    } catch (error) {
        if (error.message === 'NOT_LOGGED_IN') {
            return false;
        }
        return false;
    }
}
