/**
 * Xiaomi MiMo Web Driver
 * Domain: aistudio.xiaomimimo.com
 * Auth: Cookie (serviceToken, xiaomichatbot_ph)
 */

import {
    getCookieHeader,
    fetchWithTimeout,
    parseSSEStream,
    createCredentialCache,
    extractCookieValue,
} from "./web-provider-utils.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const credentialCache = createCredentialCache(CACHE_TTL_MS);
const BASE_URL = "https://aistudio.xiaomimimo.com";

async function fetchXiaomimoCredentials() {
    const cached = credentialCache.get();
    if (cached) return cached;

    console.log("[XiaomiMiMo] Fetching credentials...");

    let cookieHeader = await getCookieHeader(".xiaomimimo.com", BASE_URL);

    if (!cookieHeader || !extractCookieValue(cookieHeader, "serviceToken")) {
        console.log("[XiaomiMiMo] Trying account.xiaomi.com...");
        const accountCookies = await getCookieHeader(
            ".account.xiaomi.com",
            "https://account.xiaomi.com",
        );
        if (accountCookies) {
            cookieHeader = accountCookies;
        }
    }

    console.log(
        "[XiaomiMiMo] Cookie header length:",
        cookieHeader?.length || 0,
    );

    let serviceToken = extractCookieValue(cookieHeader, "serviceToken");
    let botPh = extractCookieValue(cookieHeader, "xiaomichatbot_ph");

    if (!serviceToken) {
        const passToken = extractCookieValue(cookieHeader, "passToken");
        if (passToken) {
            console.log("[XiaomiMiMo] Using passToken as serviceToken");
            serviceToken = passToken;
        }
    }

    if (serviceToken) {
        serviceToken = serviceToken.replace(/^"|"$/g, "");
    }
    if (botPh) {
        botPh = botPh.replace(/^"|"$/g, "");
    }

    console.log("[XiaomiMiMo] serviceToken exists:", !!serviceToken);
    console.log("[XiaomiMiMo] botPh exists:", !!botPh);
    console.log(
        "[XiaomiMiMo] Cookie names found:",
        cookieHeader?.match(/[^=;]+(?==)/g)?.slice(0, 10),
    );

    if (!serviceToken) {
        throw new Error("NOT_LOGGED_IN");
    }

    const creds = { serviceToken, botPh, cookieHeader };
    credentialCache.set(creds);
    return creds;
}

export async function callXiaomimoWeb(prompt, model = "mimo-v2-flash-studio") {
    return _callXiaomimoWebInner(prompt, model, false);
}

async function _callXiaomimoWebInner(prompt, model, _retrying) {
    const creds = await fetchXiaomimoCredentials();

    const url = `${BASE_URL}/open-apis/bot/chat?xiaomichatbot_ph=${encodeURIComponent(creds.botPh || "")}`;

    const response = await fetchWithTimeout(
        url,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${creds.serviceToken}`,
                bot_ph: creds.botPh || "",
                Accept: "text/event-stream",
                Cookie: creds.cookieHeader,
                Referer: `${BASE_URL}/`,
                Origin: BASE_URL,
                "x-timezone": "Asia/Shanghai",
            },
            body: JSON.stringify({
                msgId: crypto.randomUUID(),
                conversationId: "0",
                query: prompt,
                isEditedQuery: false,
                modelConfig: {
                    model: model,
                    enableThinking: false,
                    webSearchStatus: "disabled",
                    temperature: 0.8,
                    topP: 0.95,
                },
                multiMedias: [],
            }),
        },
        60000,
    );

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            credentialCache.clear();
            throw new Error("NOT_LOGGED_IN");
        }
        throw new Error(`Xiaomi MiMo API error: ${response.status}`);
    }

    let fullText = "";
    let isInThinkingBlock = false;

    for await (const event of parseSSEStream(response)) {
        if (!event.data) continue;

        try {
            const data = JSON.parse(event.data);

            if (data.type === "text" && typeof data.content === "string") {
                let content = data.content;

                content = content.replace(/\u0000/g, "");

                if (content.includes("<thinking>")) {
                    isInThinkingBlock = true;
                    content = content.split("<thinking>")[0];
                }

                if (content.includes("</thinking>")) {
                    isInThinkingBlock = false;
                    content = content.split("</thinking>")[1] || "";
                }

                if (isInThinkingBlock) {
                    continue;
                }

                fullText += content;
            }
        } catch (e) {
            console.log(
                "[XiaomiMiMo] Failed to parse SSE data:",
                event.data.slice(0, 100),
            );
        }
    }

    if (!fullText && !_retrying) {
        credentialCache.clear();
        return _callXiaomimoWebInner(prompt, model, true);
    }

    console.log("[XiaomiMiMo] Final text length:", fullText.length);
    console.log("[XiaomiMiMo] Final text last 1000 chars:", fullText.slice(-1000));
    
    let braceCount = 0;
    let jsonStart = -1;
    let jsonEnd = -1;
    
    for (let i = fullText.length - 1; i >= 0; i--) {
        const char = fullText[i];
        if (char === '}') {
            if (braceCount === 0) {
                jsonEnd = i + 1;
            }
            braceCount++;
        } else if (char === '{') {
            braceCount--;
            if (braceCount === 0 && jsonEnd !== -1) {
                jsonStart = i;
                break;
            }
        }
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = fullText.slice(jsonStart, jsonEnd);
        try {
            JSON.parse(jsonStr);
            console.log("[XiaomiMiMo] Extracted JSON from position", jsonStart, "to", jsonEnd);
            return jsonStr;
        } catch (e) {
            console.log("[XiaomiMiMo] Found braces but not valid JSON:", e.message);
        }
    }
    
    console.log("[XiaomiMiMo] No valid JSON found, returning full text");
    return fullText;
}

export async function isXiaomimoWebAvailable() {
    try {
        await fetchXiaomimoCredentials();
        return true;
    } catch (error) {
        if (error.message === "NOT_LOGGED_IN") {
            return false;
        }
        return false;
    }
}
