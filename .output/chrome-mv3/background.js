var background = (function() {
  "use strict";
  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  const PromptStorage = {
    async get() {
      const result2 = await chrome.storage.local.get("prompts");
      return result2.prompts || [];
    },
    async set(prompts) {
      await chrome.storage.local.set({ prompts });
    },
    async save(prompt) {
      const prompts = await this.get();
      const existingIndex = prompts.findIndex((p) => p.id === prompt.id);
      if (existingIndex >= 0) {
        prompts[existingIndex] = prompt;
      } else {
        prompts.push(prompt);
      }
      await this.set(prompts);
    },
    async update(prompt) {
      await this.save(prompt);
    },
    async delete(id) {
      const prompts = await this.get();
      const filtered = prompts.filter((p) => p.id !== id);
      await this.set(filtered);
    },
    async bulkSet(prompts) {
      await this.set(prompts);
    }
  };
  const LocalStorage = {
    async get(key) {
      const result2 = await chrome.storage.local.get(key);
      return result2[key] ?? null;
    },
    async set(key, value) {
      await chrome.storage.local.set({ [key]: value });
    },
    async remove(key) {
      await chrome.storage.local.remove(key);
    }
  };
  background;
  function safeParseJSON(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      const fixed = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
      return JSON.parse(fixed);
    }
  }
  function fetchWithTimeout(url, options = {}, timeoutMs = 3e4) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
  }
  async function getProviders() {
    const providers = await LocalStorage.get("providers");
    return providers || [{ id: "gemini-web-default", name: "Gemini Web", type: "gemini-web", enabled: true }];
  }
  async function setProviders(providers) {
    await LocalStorage.set("providers", providers);
  }
  async function getActiveProvider() {
    const providers = await LocalStorage.get("providers");
    const activeProviderId = await LocalStorage.get("activeProviderId");
    const list = providers || [];
    if (activeProviderId) {
      const found = list.find((p) => p.id === activeProviderId);
      if (found) return found;
    }
    const enabled = list.find((p) => p.enabled);
    if (enabled) return enabled;
    return null;
  }
  async function callCloudAPI(text, lang) {
    const provider = await getActiveProvider();
    if (!provider) return null;
    const userContent = text.substring(0, 500);
    if (provider.type === "gemini") {
      return callGeminiAPI(provider, userContent, lang);
    } else if (provider.type === "openai") {
      return callOpenAIAPI(provider, userContent, lang);
    }
    return null;
  }
  async function callGeminiAPI(provider, userContent, lang) {
    var _a2, _b2, _c, _d, _e;
    const model = provider.model || "gemini-2.0-flash";
    const systemPrompt = lang === "zh" ? "Extract title, category, and tags from the following prompt content. Return as JSON." : "Extract title, category, and tags from the following prompt content. Return as JSON.";
    const resp = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": provider.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userContent }] }],
          generationConfig: {
            responseModalities: ["TEXT"],
            responseMimeType: "application/json"
          }
        })
      }
    );
    if (!resp.ok) {
      throw new Error(`Gemini API ${resp.status}`);
    }
    const data = await resp.json();
    const rawText = (_e = (_d = (_c = (_b2 = (_a2 = data.candidates) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.content) == null ? void 0 : _c.parts) == null ? void 0 : _d[0]) == null ? void 0 : _e.text;
    if (!rawText) return null;
    try {
      return safeParseJSON(rawText);
    } catch {
      return null;
    }
  }
  async function callOpenAIAPI(provider, userContent, lang) {
    var _a2, _b2, _c;
    const systemPrompt = lang === "zh" ? "Extract title, category, and tags from the following prompt content. Return as JSON with fields: title, category, tags." : "Extract title, category, and tags from the following prompt content. Return as JSON with fields: title, category, tags.";
    const resp = await fetchWithTimeout(`${provider.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        response_format: { type: "json_object" }
      })
    });
    if (!resp.ok) {
      throw new Error(`OpenAI API ${resp.status}`);
    }
    const data = await resp.json();
    const rawText = (_c = (_b2 = (_a2 = data.choices) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.message) == null ? void 0 : _c.content;
    if (!rawText) return null;
    try {
      return safeParseJSON(rawText);
    } catch {
      return null;
    }
  }
  background;
  function detectLanguageHeuristic(text) {
    if (!text) return "en";
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/g) || []).length;
    const total = text.replace(/\s/g, "").length;
    return total > 0 && cjk / total > 0.3 ? "zh" : "en";
  }
  async function detectLanguage(text) {
    var _a2, _b2, _c, _d;
    const heuristic = detectLanguageHeuristic(text);
    try {
      const avail = await ((_b2 = (_a2 = window.LanguageDetector) == null ? void 0 : _a2.availability) == null ? void 0 : _b2.call(_a2));
      if (avail === "unavailable") return heuristic;
      const detector = await ((_d = (_c = window.LanguageDetector) == null ? void 0 : _c.create) == null ? void 0 : _d.call(_c));
      if (!detector) return heuristic;
      const results = await detector.detect(text);
      detector.destroy();
      if (results && results.length > 0 && results[0].confidence > 0.5) {
        const top = results[0].detectedLanguage;
        return top.startsWith("zh") || top === "ja" ? "zh" : "en";
      }
    } catch {
      return heuristic;
    }
    return heuristic;
  }
  const CATEGORY_RULES = [
    { zh: "开发", en: "Dev", keywords: ["code", "bug", "debug", "review", "refactor", "api", "function", "class", "error", "test", "代码", "调试", "审查", "重构", "函数", "接口", "报错", "测试"] },
    { zh: "写作", en: "Writing", keywords: ["write", "essay", "article", "blog", "email", "letter", "report", "summary", "写", "文章", "邮件", "报告", "摘要", "总结", "博客", "信"] },
    { zh: "翻译", en: "Translate", keywords: ["translate", "translation", "language", "chinese", "english", "japanese", "翻译", "中文", "英文", "日文", "语言"] },
    { zh: "分析", en: "Analysis", keywords: ["analyze", "analysis", "compare", "evaluate", "assess", "data", "分析", "比较", "评估", "数据", "对比"] },
    { zh: "创意", en: "Creative", keywords: ["creative", "idea", "brainstorm", "story", "design", "slogan", "创意", "故事", "设计", "口号", "点子", "灵感"] },
    { zh: "学习", en: "Learning", keywords: ["explain", "learn", "teach", "tutorial", "concept", "understand", "解释", "学习", "教程", "概念", "理解", "知识"] }
  ];
  function extractTitleHeuristic(text) {
    if (!text) return "";
    const headingMatch = text.match(/^#{1,3}\s+(.+)/m);
    if (headingMatch) {
      const h = headingMatch[1].trim();
      if (h.length <= 50) return h;
      return h.substring(0, 47) + "...";
    }
    const firstLine = text.split(/[\n\r]/)[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 50) return firstLine;
    const sentenceMatch = text.match(/^(.+?[.。！？!?])/s);
    if (sentenceMatch) {
      const s = sentenceMatch[1].trim();
      if (s.length <= 50) return s;
    }
    if (text.length <= 30) return text;
    const truncated = text.substring(0, 30);
    const lastSpace = truncated.lastIndexOf(" ");
    return (lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  function matchCategory(text, lang) {
    if (!text) return "";
    const lower = text.toLowerCase();
    let bestMatch = { name: "", score: 0 };
    for (const rule of CATEGORY_RULES) {
      const score = rule.keywords.filter((kw) => lower.includes(kw)).length;
      if (score > bestMatch.score) {
        bestMatch = { name: rule[lang] || rule.zh, score };
      }
    }
    return bestMatch.score >= 1 ? bestMatch.name : "";
  }
  async function extractTitleAndCategory(text, getActiveProviderFn, callCloudAPIFn) {
    const lang = await detectLanguage(text);
    const provider = await getActiveProviderFn();
    if ((provider == null ? void 0 : provider.type) === "gemini" || (provider == null ? void 0 : provider.type) === "openai" || (provider == null ? void 0 : provider.type) === "gemini-web") {
      try {
        const result2 = await callCloudAPIFn(text, lang);
        if (result2 == null ? void 0 : result2.title) {
          return { title: result2.title, category: result2.category || "", tags: result2.tags || [], lang };
        }
      } catch (e) {
        console.error("Cloud API error, falling back:", e);
      }
      return {
        title: extractTitleHeuristic(text),
        category: matchCategory(text, lang),
        tags: [],
        lang
      };
    }
    const title = extractTitleHeuristic(text);
    const category = matchCategory(text, lang);
    return { title, category, tags: [], lang };
  }
  background;
  function parseVariableSpec(rawName) {
    if (rawName.startsWith("@")) {
      return { name: rawName, type: "context", raw: rawName };
    }
    const colonIdx = rawName.indexOf(":");
    if (colonIdx === -1) {
      return { name: rawName, type: "text", default: null, raw: rawName };
    }
    const name = rawName.substring(0, colonIdx).trim();
    const rest = rawName.substring(colonIdx + 1);
    if (rest.includes("|")) {
      const options = rest.split("|").map((o) => o.trim()).filter((o) => o.length > 0);
      if (options.length >= 2) {
        return { name, type: "enum", options, default: options[0], raw: rawName };
      }
    }
    const defaultVal = rest.trim();
    if (defaultVal.length > 0) {
      return { name, type: "default", default: defaultVal, raw: rawName };
    }
    return { name, type: "text", default: null, raw: rawName };
  }
  function extractVariables(content) {
    const rawMatches = [];
    const brackets = content.match(/\{\{([^}]+)\}\}/g);
    if (brackets) {
      rawMatches.push(...brackets.map((m) => m.slice(2, -2).trim()));
    }
    const squares = content.match(/\[([a-zA-Z][a-zA-Z0-9_\s]*)\](?!\()/g);
    if (squares) {
      rawMatches.push(...squares.map((m) => m.slice(1, -1).trim()));
    }
    const seen = /* @__PURE__ */ new Set();
    return rawMatches.filter((v) => v.length > 0 && !seen.has(v) && seen.add(v)).map(parseVariableSpec);
  }
  function composePrompt(prompt, contentOverride = null) {
    return contentOverride || prompt.content;
  }
  background;
  const definition = defineBackground(() => {
    console.log(`🔥 [background.ts] v${chrome.runtime.getManifest().version} loaded`);
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error("Side panel setup failed:", error));
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleMessage(message, sendResponse).catch((err) => {
        console.error("[Background] Error handling message:", err);
        sendResponse({ success: false, error: err.message });
      });
      return true;
    });
    chrome.runtime.onInstalled.addListener(async () => {
      console.log("[Background] Extension installed/updated");
    });
  });
  async function handleMessage(message, sendResponse) {
    switch (message.type) {
      case "GET_PROMPTS": {
        const prompts = await PromptStorage.get();
        sendResponse({ success: true, prompts });
        break;
      }
      case "SAVE_PROMPT": {
        const promptData = message.prompt;
        const newPrompt = {
          ...promptData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          usageCount: 0,
          lastUsedAt: null,
          favorite: false,
          versions: [],
          variables: extractVariables(promptData.content)
        };
        await PromptStorage.save(newPrompt);
        sendResponse({ success: true, prompt: newPrompt });
        if (!newPrompt.title || newPrompt.title.endsWith("...")) {
          await enrichPrompt(newPrompt.id, newPrompt.content);
        }
        break;
      }
      case "UPDATE_PROMPT": {
        const { id, updates } = message;
        const prompts = await PromptStorage.get();
        const existing = prompts.find((p) => p.id === id);
        if (!existing) {
          sendResponse({ success: false, error: "Prompt not found" });
          return;
        }
        const updated = {
          ...existing,
          ...updates,
          updatedAt: Date.now()
        };
        if (updates.content) {
          updated.variables = extractVariables(updates.content);
          const newVersion = {
            versionId: crypto.randomUUID(),
            content: existing.content,
            timestamp: Date.now()
          };
          updated.versions = [newVersion, ...existing.versions || []].slice(0, 20);
        }
        await PromptStorage.update(updated);
        sendResponse({ success: true, prompt: updated });
        break;
      }
      case "DELETE_PROMPT": {
        const { id } = message;
        await PromptStorage.delete(id);
        sendResponse({ success: true });
        break;
      }
      case "TOGGLE_FAVORITE": {
        const { id } = message;
        const prompts = await PromptStorage.get();
        const prompt = prompts.find((p) => p.id === id);
        if (prompt) {
          prompt.favorite = !prompt.favorite;
          await PromptStorage.update(prompt);
        }
        sendResponse({ success: true });
        break;
      }
      case "TRACK_USAGE": {
        const { id } = message;
        const prompts = await PromptStorage.get();
        const prompt = prompts.find((p) => p.id === id);
        if (prompt) {
          prompt.usageCount = (prompt.usageCount || 0) + 1;
          prompt.lastUsedAt = Date.now();
          await PromptStorage.update(prompt);
        }
        sendResponse({ success: true });
        break;
      }
      case "GET_PROVIDERS": {
        const providers = await getProviders();
        const activeProviderId = (await chrome.storage.local.get("activeProviderId")).activeProviderId;
        sendResponse({ success: true, providers, activeProviderId });
        break;
      }
      case "SAVE_PROVIDERS": {
        const { providers, activeProviderId } = message;
        await setProviders(providers);
        if (activeProviderId) {
          await chrome.storage.local.set({ activeProviderId });
        }
        sendResponse({ success: true });
        break;
      }
      case "COMPOSE_PROMPT": {
        const { prompt, contentOverride } = message;
        const composed = composePrompt(prompt, contentOverride || null);
        const variables = extractVariables(composed).filter((v) => v.type !== "context");
        sendResponse({
          success: true,
          composed,
          variables: variables.map((v) => v.name)
        });
        break;
      }
      case "AUTO_EXTRACT": {
        const { content } = message;
        const result2 = await extractTitleAndCategory(
          content,
          async () => {
            const providers = await getProviders();
            const activeId = (await chrome.storage.local.get("activeProviderId")).activeProviderId;
            return providers.find((p) => p.id === activeId) || providers[0] || null;
          },
          callCloudAPI
        );
        sendResponse({ success: true, ...result2 });
        break;
      }
      case "GET_PAGE_CONTEXT": {
        sendResponse({ success: false });
        break;
      }
      case "CAPTURE_PAGE_CONTEXT": {
        sendResponse({ success: true });
        break;
      }
      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
  }
  async function enrichPrompt(id, content) {
    try {
      const result2 = await extractTitleAndCategory(
        content,
        async () => {
          const providers = await getProviders();
          const activeId = (await chrome.storage.local.get("activeProviderId")).activeProviderId;
          return providers.find((p) => p.id === activeId) || providers[0] || null;
        },
        callCloudAPI
      );
      if (result2.title) {
        const prompts = await PromptStorage.get();
        const prompt = prompts.find((p) => p.id === id);
        if (prompt) {
          prompt.title = result2.title;
          prompt.category = result2.category || prompt.category;
          await PromptStorage.update(prompt);
        }
      }
    } catch (err) {
      console.error("[Background] Failed to enrich prompt:", err);
    }
  }
  background;
  function initPlugins() {
  }
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = `${"ws:"}//${"localhost"}:${3e3}`;
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
})();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI1LjUuMF9yb2xsdXBANC42MC4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWJhY2tncm91bmQubWpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3ZWJleHQtY29yZSttYXRjaC1wYXR0ZXJuc0AxLjAuMy9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyIsIi4uLy4uL3NyYy9zaGFyZWQvYXBpL3N0b3JhZ2UudHMiLCIuLi8uLi9zcmMvc2hhcmVkL2FwaS9haS50cyIsIi4uLy4uL3NyYy9zaGFyZWQvdXRpbHMvdGV4dC1hbmFseXNpcy50cyIsIi4uLy4uL3NyYy9zaGFyZWQvdXRpbHMvdmFyaWFibGVzLnRzIiwiLi4vLi4vc3JjL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMTkuMjlfQHR5cGVzK25vZGVAMjUuNS4wX3JvbGx1cEA0LjYwLjBfeWFtbEAyLjguMy9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci9jaHJvbWUubWpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVCYWNrZ3JvdW5kKGFyZykge1xuICBpZiAoYXJnID09IG51bGwgfHwgdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4geyBtYWluOiBhcmcgfTtcbiAgcmV0dXJuIGFyZztcbn1cbiIsIi8vIHNyYy9pbmRleC50c1xudmFyIF9NYXRjaFBhdHRlcm4gPSBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybikge1xuICAgIGlmIChtYXRjaFBhdHRlcm4gPT09IFwiPGFsbF91cmxzPlwiKSB7XG4gICAgICB0aGlzLmlzQWxsVXJscyA9IHRydWU7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IFsuLi5fTWF0Y2hQYXR0ZXJuLlBST1RPQ09MU107XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBncm91cHMgPSAvKC4qKTpcXC9cXC8oLio/KShcXC8uKikvLmV4ZWMobWF0Y2hQYXR0ZXJuKTtcbiAgICAgIGlmIChncm91cHMgPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBcIkluY29ycmVjdCBmb3JtYXRcIik7XG4gICAgICBjb25zdCBbXywgcHJvdG9jb2wsIGhvc3RuYW1lLCBwYXRobmFtZV0gPSBncm91cHM7XG4gICAgICB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpO1xuICAgICAgdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKTtcbiAgICAgIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSk7XG4gICAgICB0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG4gICAgICB0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcbiAgICAgIHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuICAgIH1cbiAgfVxuICBpbmNsdWRlcyh1cmwpIHtcbiAgICBpZiAodGhpcy5pc0FsbFVybHMpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG4gICAgcmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZ0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcInVyblwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuICAgIH0pO1xuICB9XG4gIGlzSHR0cE1hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSHR0cHNNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIb3N0UGF0aE1hdGNoKHVybCkge1xuICAgIGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgaG9zdG5hbWVNYXRjaFJlZ2V4cyA9IFtcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gucmVwbGFjZSgvXlxcKlxcLi8sIFwiXCIpKVxuICAgIF07XG4gICAgY29uc3QgcGF0aG5hbWVNYXRjaFJlZ2V4ID0gdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5wYXRobmFtZU1hdGNoKTtcbiAgICByZXR1cm4gISFob3N0bmFtZU1hdGNoUmVnZXhzLmZpbmQoKHJlZ2V4KSA9PiByZWdleC50ZXN0KHVybC5ob3N0bmFtZSkpICYmIHBhdGhuYW1lTWF0Y2hSZWdleC50ZXN0KHVybC5wYXRobmFtZSk7XG4gIH1cbiAgaXNGaWxlTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZpbGU6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzRnRwTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNVcm5NYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogdXJuOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBjb252ZXJ0UGF0dGVyblRvUmVnZXgocGF0dGVybikge1xuICAgIGNvbnN0IGVzY2FwZWQgPSB0aGlzLmVzY2FwZUZvclJlZ2V4KHBhdHRlcm4pO1xuICAgIGNvbnN0IHN0YXJzUmVwbGFjZWQgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXCovZywgXCIuKlwiKTtcbiAgICByZXR1cm4gUmVnRXhwKGBeJHtzdGFyc1JlcGxhY2VkfSRgKTtcbiAgfVxuICBlc2NhcGVGb3JSZWdleChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbiAgfVxufTtcbnZhciBNYXRjaFBhdHRlcm4gPSBfTWF0Y2hQYXR0ZXJuO1xuTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUyA9IFtcImh0dHBcIiwgXCJodHRwc1wiLCBcImZpbGVcIiwgXCJmdHBcIiwgXCJ1cm5cIl07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG4gIH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcbiAgaWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgJHtwcm90b2NvbH0gbm90IGEgdmFsaWQgcHJvdG9jb2wgKCR7TWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5qb2luKFwiLCBcIil9KWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVIb3N0bmFtZShtYXRjaFBhdHRlcm4sIGhvc3RuYW1lKSB7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIjpcIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4obWF0Y2hQYXR0ZXJuLCBgSG9zdG5hbWUgY2Fubm90IGluY2x1ZGUgYSBwb3J0YCk7XG4gIGlmIChob3N0bmFtZS5pbmNsdWRlcyhcIipcIikgJiYgaG9zdG5hbWUubGVuZ3RoID4gMSAmJiAhaG9zdG5hbWUuc3RhcnRzV2l0aChcIiouXCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlUGF0aG5hbWUobWF0Y2hQYXR0ZXJuLCBwYXRobmFtZSkge1xuICByZXR1cm47XG59XG5leHBvcnQge1xuICBJbnZhbGlkTWF0Y2hQYXR0ZXJuLFxuICBNYXRjaFBhdHRlcm5cbn07XG4iLCJpbXBvcnQgdHlwZSB7IFByb21wdCB9IGZyb20gJy4uL3R5cGVzL3Byb21wdCc7XG5cbmNvbnN0IE1BWF9DSFVOS19CWVRFUyA9IDYwMDA7XG5jb25zdCBERUJPVU5DRV9NUyA9IDUwMDtcbmNvbnN0IFNZTkNfRklFTERTOiAoa2V5b2YgUHJvbXB0KVtdID0gWydpZCcsICd0aXRsZScsICdjb250ZW50JywgJ2NhdGVnb3J5JywgJ3RhZ3MnLCAnc2hvcnRjdXQnLCAndmFyaWFibGVzJywgJ2Zhdm9yaXRlJywgJ2NyZWF0ZWRBdCcsICd1cGRhdGVkQXQnXTtcblxuY29uc3QgX2RlYm91bmNlVGltZXJzOiBSZWNvcmQ8c3RyaW5nLCBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pj4gPSB7fTtcblxuZnVuY3Rpb24gZGVib3VuY2U8VD4oa2V5OiBzdHJpbmcsIGZuOiAoKSA9PiBQcm9taXNlPFQ+LCBtcyA9IERFQk9VTkNFX01TKTogUHJvbWlzZTxUPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KF9kZWJvdW5jZVRpbWVyc1trZXldKTtcbiAgICBfZGVib3VuY2VUaW1lcnNba2V5XSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgZm4oKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gICAgfSwgbXMpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9TbGltUHJvbXB0KHByb21wdDogUHJvbXB0KTogUGFydGlhbDxQcm9tcHQ+IHtcbiAgY29uc3Qgc2xpbTogUGFydGlhbDxQcm9tcHQ+ID0ge307XG4gIFNZTkNfRklFTERTLmZvckVhY2goZmllbGQgPT4ge1xuICAgIChzbGltIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtmaWVsZF0gPSBwcm9tcHRbZmllbGRdO1xuICB9KTtcbiAgcmV0dXJuIHNsaW07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUFkYXB0ZXI8VD4ge1xuICBnZXQoKTogUHJvbWlzZTxUPjtcbiAgc2V0KHZhbHVlOiBUKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlKCk6IFByb21pc2U8dm9pZD47XG59XG5cbmV4cG9ydCBjb25zdCBQcm9tcHRTdG9yYWdlID0ge1xuICBhc3luYyBnZXQoKTogUHJvbWlzZTxQcm9tcHRbXT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgncHJvbXB0cycpO1xuICAgIHJldHVybiByZXN1bHQucHJvbXB0cyB8fCBbXTtcbiAgfSxcblxuICBhc3luYyBzZXQocHJvbXB0czogUHJvbXB0W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBwcm9tcHRzIH0pO1xuICB9LFxuXG4gIGFzeW5jIHNhdmUocHJvbXB0OiBQcm9tcHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwcm9tcHRzID0gYXdhaXQgdGhpcy5nZXQoKTtcbiAgICBjb25zdCBleGlzdGluZ0luZGV4ID0gcHJvbXB0cy5maW5kSW5kZXgocCA9PiBwLmlkID09PSBwcm9tcHQuaWQpO1xuICAgIGlmIChleGlzdGluZ0luZGV4ID49IDApIHtcbiAgICAgIHByb21wdHNbZXhpc3RpbmdJbmRleF0gPSBwcm9tcHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb21wdHMucHVzaChwcm9tcHQpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnNldChwcm9tcHRzKTtcbiAgfSxcblxuICBhc3luYyB1cGRhdGUocHJvbXB0OiBQcm9tcHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNhdmUocHJvbXB0KTtcbiAgfSxcblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHByb21wdHMgPSBhd2FpdCB0aGlzLmdldCgpO1xuICAgIGNvbnN0IGZpbHRlcmVkID0gcHJvbXB0cy5maWx0ZXIocCA9PiBwLmlkICE9PSBpZCk7XG4gICAgYXdhaXQgdGhpcy5zZXQoZmlsdGVyZWQpO1xuICB9LFxuXG4gIGFzeW5jIGJ1bGtTZXQocHJvbXB0czogUHJvbXB0W10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldChwcm9tcHRzKTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IExvY2FsU3RvcmFnZSA9IHtcbiAgYXN5bmMgZ2V0PFQ+KGtleTogc3RyaW5nKTogUHJvbWlzZTxUIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChrZXkpO1xuICAgIHJldHVybiByZXN1bHRba2V5XSA/PyBudWxsO1xuICB9LFxuXG4gIGFzeW5jIHNldDxUPihrZXk6IHN0cmluZywgdmFsdWU6IFQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdmFsdWUgfSk7XG4gIH0sXG5cbiAgYXN5bmMgcmVtb3ZlKGtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwucmVtb3ZlKGtleSk7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBTeW5jU3RvcmFnZSA9IHtcbiAgYXN5bmMgZ2V0VXNhZ2UoKTogUHJvbWlzZTx7IHVzZWQ6IG51bWJlcjsgdG90YWw6IG51bWJlcjsgcGVyY2VudGFnZTogbnVtYmVyIH0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQobnVsbCk7XG4gICAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0KTtcbiAgICAgIGNvbnN0IHVzZWQgPSBuZXcgQmxvYihbanNvbl0pLnNpemU7XG4gICAgICBjb25zdCB0b3RhbCA9IDEwMjQwMDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVzZWQsXG4gICAgICAgIHRvdGFsLFxuICAgICAgICBwZXJjZW50YWdlOiBNYXRoLnJvdW5kKCh1c2VkIC8gdG90YWwpICogMTAwKVxuICAgICAgfTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiB7IHVzZWQ6IDAsIHRvdGFsOiAxMDI0MDAsIHBlcmNlbnRhZ2U6IDAgfTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlTG9jYWxUb1N5bmMoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGxvY2FsID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdwcm9tcHRzJyk7XG4gIGlmIChsb2NhbC5wcm9tcHRzKSB7XG4gICAgY29uc3Qgc3luY1Byb21wdHMgPSBsb2NhbC5wcm9tcHRzLm1hcCgocDogUHJvbXB0KSA9PiB0b1NsaW1Qcm9tcHQocCkpO1xuICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgcHJvbXB0czogc3luY1Byb21wdHMgfSk7XG4gIH1cbn0iLCJpbXBvcnQgdHlwZSB7IFByb3ZpZGVyLCBHZW1pbmlQcm92aWRlciwgT3BlbkFJUHJvdmlkZXIsIEdlbWluaVdlYlByb3ZpZGVyIH0gZnJvbSAnLi4vdHlwZXMvcHJvdmlkZXInO1xuaW1wb3J0IHsgTG9jYWxTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNhZmVQYXJzZUpTT048VD4ocmF3OiBzdHJpbmcpOiBUIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyYXcpIGFzIFQ7XG4gIH0gY2F0Y2gge1xuICAgIGNvbnN0IGZpeGVkID0gcmF3LnJlcGxhY2UoL1xcXFwoPyFbXCJcXFxcL2JmbnJ0dV0pL2csICdcXFxcXFxcXCcpO1xuICAgIHJldHVybiBKU09OLnBhcnNlKGZpeGVkKSBhcyBUO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmZXRjaFdpdGhUaW1lb3V0KHVybDogc3RyaW5nLCBvcHRpb25zOiBSZXF1ZXN0SW5pdCA9IHt9LCB0aW1lb3V0TXMgPSAzMDAwMCk6IFByb21pc2U8UmVzcG9uc2U+IHtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGltZW91dE1zKTtcbiAgcmV0dXJuIGZldGNoKHVybCwgeyAuLi5vcHRpb25zLCBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pLmZpbmFsbHkoKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBrZWVwQWxpdmUoKTogKCkgPT4gdm9pZCB7XG4gIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGNocm9tZS5ydW50aW1lLmdldFBsYXRmb3JtSW5mbygpLmNhdGNoKCgpID0+IHsgfSk7XG4gIH0sIDI1MDAwKTtcbiAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJvdmlkZXJzKCk6IFByb21pc2U8UHJvdmlkZXJbXT4ge1xuICBjb25zdCBwcm92aWRlcnMgPSBhd2FpdCBMb2NhbFN0b3JhZ2UuZ2V0PFByb3ZpZGVyW10+KCdwcm92aWRlcnMnKTtcbiAgcmV0dXJuIHByb3ZpZGVycyB8fCBbeyBpZDogJ2dlbWluaS13ZWItZGVmYXVsdCcsIG5hbWU6ICdHZW1pbmkgV2ViJywgdHlwZTogJ2dlbWluaS13ZWInLCBlbmFibGVkOiB0cnVlIH1dO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0UHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBMb2NhbFN0b3JhZ2Uuc2V0KCdwcm92aWRlcnMnLCBwcm92aWRlcnMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWN0aXZlUHJvdmlkZXIoKTogUHJvbWlzZTxQcm92aWRlciB8IG51bGw+IHtcbiAgY29uc3QgcHJvdmlkZXJzID0gYXdhaXQgTG9jYWxTdG9yYWdlLmdldDxQcm92aWRlcltdPigncHJvdmlkZXJzJyk7XG4gIGNvbnN0IGFjdGl2ZVByb3ZpZGVySWQgPSBhd2FpdCBMb2NhbFN0b3JhZ2UuZ2V0PHN0cmluZz4oJ2FjdGl2ZVByb3ZpZGVySWQnKTtcbiAgY29uc3QgbGlzdCA9IHByb3ZpZGVycyB8fCBbXTtcbiAgXG4gIGlmIChhY3RpdmVQcm92aWRlcklkKSB7XG4gICAgY29uc3QgZm91bmQgPSBsaXN0LmZpbmQocCA9PiBwLmlkID09PSBhY3RpdmVQcm92aWRlcklkKTtcbiAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgfVxuICBcbiAgY29uc3QgZW5hYmxlZCA9IGxpc3QuZmluZChwID0+IHAuZW5hYmxlZCk7XG4gIGlmIChlbmFibGVkKSByZXR1cm4gZW5hYmxlZDtcbiAgXG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZVByb3ZpZGVyU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG9sZEtleXMgPSBbJ2FpUHJvdmlkZXInLCAnZ2VtaW5pQXBpS2V5JywgJ29wZW5haUFwaVVybCcsICdvcGVuYWlBcGlLZXknLCAnb3BlbmFpTW9kZWwnLCAncHJvdmlkZXJzJ107XG4gIGNvbnN0IG9sZCA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChvbGRLZXlzKSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBcbiAgaWYgKG9sZC5wcm92aWRlcnMpIHJldHVybjtcbiAgXG4gIGlmICghb2xkLmFpUHJvdmlkZXIgfHwgb2xkLmFpUHJvdmlkZXIgPT09ICduYW5vJykge1xuICAgIGF3YWl0IExvY2FsU3RvcmFnZS5zZXQoJ3Byb3ZpZGVycycsIFt7IGlkOiAnZ2VtaW5pLXdlYi1kZWZhdWx0JywgbmFtZTogJ0dlbWluaSBXZWInLCB0eXBlOiAnZ2VtaW5pLXdlYicsIGVuYWJsZWQ6IHRydWUgfV0pO1xuICAgIGF3YWl0IExvY2FsU3RvcmFnZS5zZXQoJ2FjdGl2ZVByb3ZpZGVySWQnLCAnZ2VtaW5pLXdlYi1kZWZhdWx0Jyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcHJvdmlkZXJzOiBQcm92aWRlcltdID0gW107XG4gICAgbGV0IGFjdGl2ZUlkID0gJyc7XG4gICAgXG4gICAgaWYgKG9sZC5haVByb3ZpZGVyID09PSAnZ2VtaW5pJyAmJiBvbGQuZ2VtaW5pQXBpS2V5KSB7XG4gICAgICBjb25zdCBpZCA9ICdtaWdyYXRlZC1nZW1pbmknO1xuICAgICAgcHJvdmlkZXJzLnB1c2goeyBcbiAgICAgICAgaWQsIFxuICAgICAgICBuYW1lOiAnR2VtaW5pIEFQSScsIFxuICAgICAgICB0eXBlOiAnZ2VtaW5pJywgXG4gICAgICAgIGFwaUtleTogb2xkLmdlbWluaUFwaUtleSwgXG4gICAgICAgIG1vZGVsOiAnZ2VtaW5pLTIuMC1mbGFzaCcsIFxuICAgICAgICBlbmFibGVkOiB0cnVlIFxuICAgICAgfSk7XG4gICAgICBhY3RpdmVJZCA9IGlkO1xuICAgIH1cbiAgICBcbiAgICBpZiAob2xkLmFpUHJvdmlkZXIgPT09ICdvcGVuYWknICYmIG9sZC5vcGVuYWlBcGlLZXkpIHtcbiAgICAgIGNvbnN0IGlkID0gJ21pZ3JhdGVkLW9wZW5haSc7XG4gICAgICBwcm92aWRlcnMucHVzaCh7IFxuICAgICAgICBpZCwgXG4gICAgICAgIG5hbWU6ICdPcGVuQUknLCBcbiAgICAgICAgdHlwZTogJ29wZW5haScsIFxuICAgICAgICBhcGlVcmw6IG9sZC5vcGVuYWlBcGlVcmwgfHwgJ2h0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEnLCBcbiAgICAgICAgYXBpS2V5OiBvbGQub3BlbmFpQXBpS2V5LCBcbiAgICAgICAgbW9kZWw6IG9sZC5vcGVuYWlNb2RlbCB8fCAnZ3B0LTRvLW1pbmknLCBcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSBcbiAgICAgIH0pO1xuICAgICAgYWN0aXZlSWQgPSBpZDtcbiAgICB9XG4gICAgXG4gICAgYXdhaXQgTG9jYWxTdG9yYWdlLnNldCgncHJvdmlkZXJzJywgcHJvdmlkZXJzKTtcbiAgICBhd2FpdCBMb2NhbFN0b3JhZ2Uuc2V0KCdhY3RpdmVQcm92aWRlcklkJywgYWN0aXZlSWQpO1xuICB9XG4gIFxuICBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5yZW1vdmUob2xkS2V5cyk7XG59XG5cbmludGVyZmFjZSBNZXRhZGF0YVJlc3VsdCB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGNhdGVnb3J5OiBzdHJpbmc7XG4gIHRhZ3M/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGxDbG91ZEFQSSh0ZXh0OiBzdHJpbmcsIGxhbmc6ICd6aCcgfCAnZW4nKTogUHJvbWlzZTxNZXRhZGF0YVJlc3VsdCB8IG51bGw+IHtcbiAgY29uc3QgcHJvdmlkZXIgPSBhd2FpdCBnZXRBY3RpdmVQcm92aWRlcigpO1xuICBpZiAoIXByb3ZpZGVyKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCB1c2VyQ29udGVudCA9IHRleHQuc3Vic3RyaW5nKDAsIDUwMCk7XG5cbiAgaWYgKHByb3ZpZGVyLnR5cGUgPT09ICdnZW1pbmknKSB7XG4gICAgcmV0dXJuIGNhbGxHZW1pbmlBUEkocHJvdmlkZXIsIHVzZXJDb250ZW50LCBsYW5nKTtcbiAgfSBlbHNlIGlmIChwcm92aWRlci50eXBlID09PSAnb3BlbmFpJykge1xuICAgIHJldHVybiBjYWxsT3BlbkFJQVBJKHByb3ZpZGVyLCB1c2VyQ29udGVudCwgbGFuZyk7XG4gIH1cbiAgXG4gIHJldHVybiBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjYWxsR2VtaW5pQVBJKHByb3ZpZGVyOiBHZW1pbmlQcm92aWRlciwgdXNlckNvbnRlbnQ6IHN0cmluZywgbGFuZzogJ3poJyB8ICdlbicpOiBQcm9taXNlPE1ldGFkYXRhUmVzdWx0IHwgbnVsbD4ge1xuICBjb25zdCBtb2RlbCA9IHByb3ZpZGVyLm1vZGVsIHx8ICdnZW1pbmktMi4wLWZsYXNoJztcbiAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gbGFuZyA9PT0gJ3poJyBcbiAgICA/ICdFeHRyYWN0IHRpdGxlLCBjYXRlZ29yeSwgYW5kIHRhZ3MgZnJvbSB0aGUgZm9sbG93aW5nIHByb21wdCBjb250ZW50LiBSZXR1cm4gYXMgSlNPTi4nXG4gICAgOiAnRXh0cmFjdCB0aXRsZSwgY2F0ZWdvcnksIGFuZCB0YWdzIGZyb20gdGhlIGZvbGxvd2luZyBwcm9tcHQgY29udGVudC4gUmV0dXJuIGFzIEpTT04uJztcbiAgICBcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoV2l0aFRpbWVvdXQoXG4gICAgYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxYmV0YS9tb2RlbHMvJHttb2RlbH06Z2VuZXJhdGVDb250ZW50YCxcbiAgICB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ3gtZ29vZy1hcGkta2V5JzogcHJvdmlkZXIuYXBpS2V5IH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIHN5c3RlbUluc3RydWN0aW9uOiB7IHBhcnRzOiBbeyB0ZXh0OiBzeXN0ZW1Qcm9tcHQgfV0gfSxcbiAgICAgICAgY29udGVudHM6IFt7IHBhcnRzOiBbeyB0ZXh0OiB1c2VyQ29udGVudCB9XSB9XSxcbiAgICAgICAgZ2VuZXJhdGlvbkNvbmZpZzoge1xuICAgICAgICAgIHJlc3BvbnNlTW9kYWxpdGllczogWydURVhUJ10sXG4gICAgICAgICAgcmVzcG9uc2VNaW1lVHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgfVxuICApO1xuICBcbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBHZW1pbmkgQVBJICR7cmVzcC5zdGF0dXN9YCk7XG4gIH1cbiAgXG4gIGludGVyZmFjZSBHZW1pbmlSZXNwb25zZSB7XG4gICAgY2FuZGlkYXRlcz86IEFycmF5PHtcbiAgICAgIGNvbnRlbnQ/OiB7XG4gICAgICAgIHBhcnRzPzogQXJyYXk8eyB0ZXh0Pzogc3RyaW5nIH0+O1xuICAgICAgfTtcbiAgICB9PjtcbiAgfVxuICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcC5qc29uKCkgYXMgR2VtaW5pUmVzcG9uc2U7XG4gIGNvbnN0IHJhd1RleHQgPSBkYXRhLmNhbmRpZGF0ZXM/LlswXT8uY29udGVudD8ucGFydHM/LlswXT8udGV4dDtcbiAgXG4gIGlmICghcmF3VGV4dCkgcmV0dXJuIG51bGw7XG4gIFxuICB0cnkge1xuICAgIHJldHVybiBzYWZlUGFyc2VKU09OPE1ldGFkYXRhUmVzdWx0PihyYXdUZXh0KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FsbE9wZW5BSUFQSShwcm92aWRlcjogT3BlbkFJUHJvdmlkZXIsIHVzZXJDb250ZW50OiBzdHJpbmcsIGxhbmc6ICd6aCcgfCAnZW4nKTogUHJvbWlzZTxNZXRhZGF0YVJlc3VsdCB8IG51bGw+IHtcbiAgY29uc3Qgc3lzdGVtUHJvbXB0ID0gbGFuZyA9PT0gJ3poJyBcbiAgICA/ICdFeHRyYWN0IHRpdGxlLCBjYXRlZ29yeSwgYW5kIHRhZ3MgZnJvbSB0aGUgZm9sbG93aW5nIHByb21wdCBjb250ZW50LiBSZXR1cm4gYXMgSlNPTiB3aXRoIGZpZWxkczogdGl0bGUsIGNhdGVnb3J5LCB0YWdzLidcbiAgICA6ICdFeHRyYWN0IHRpdGxlLCBjYXRlZ29yeSwgYW5kIHRhZ3MgZnJvbSB0aGUgZm9sbG93aW5nIHByb21wdCBjb250ZW50LiBSZXR1cm4gYXMgSlNPTiB3aXRoIGZpZWxkczogdGl0bGUsIGNhdGVnb3J5LCB0YWdzLic7XG4gICAgXG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaFdpdGhUaW1lb3V0KGAke3Byb3ZpZGVyLmFwaVVybH0vY2hhdC9jb21wbGV0aW9uc2AsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7IFxuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgXG4gICAgICAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtwcm92aWRlci5hcGlLZXl9YCBcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIG1vZGVsOiBwcm92aWRlci5tb2RlbCB8fCAnZ3B0LTRvLW1pbmknLFxuICAgICAgbWVzc2FnZXM6IFtcbiAgICAgICAgeyByb2xlOiAnc3lzdGVtJywgY29udGVudDogc3lzdGVtUHJvbXB0IH0sXG4gICAgICAgIHsgcm9sZTogJ3VzZXInLCBjb250ZW50OiB1c2VyQ29udGVudCB9XG4gICAgICBdLFxuICAgICAgcmVzcG9uc2VfZm9ybWF0OiB7IHR5cGU6ICdqc29uX29iamVjdCcgfSxcbiAgICB9KSxcbiAgfSk7XG4gIFxuICBpZiAoIXJlc3Aub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9wZW5BSSBBUEkgJHtyZXNwLnN0YXR1c31gKTtcbiAgfVxuICBcbiAgaW50ZXJmYWNlIE9wZW5BSVJlc3BvbnNlIHtcbiAgICBjaG9pY2VzPzogQXJyYXk8e1xuICAgICAgbWVzc2FnZT86IHtcbiAgICAgICAgY29udGVudD86IHN0cmluZztcbiAgICAgIH07XG4gICAgfT47XG4gIH1cbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3AuanNvbigpIGFzIE9wZW5BSVJlc3BvbnNlO1xuICBjb25zdCByYXdUZXh0ID0gZGF0YS5jaG9pY2VzPy5bMF0/Lm1lc3NhZ2U/LmNvbnRlbnQ7XG4gIFxuICBpZiAoIXJhd1RleHQpIHJldHVybiBudWxsO1xuICBcbiAgdHJ5IHtcbiAgICByZXR1cm4gc2FmZVBhcnNlSlNPTjxNZXRhZGF0YVJlc3VsdD4ocmF3VGV4dCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59IiwiZXhwb3J0IGZ1bmN0aW9uIGRldGVjdExhbmd1YWdlSGV1cmlzdGljKHRleHQ6IHN0cmluZyk6ICd6aCcgfCAnZW4nIHtcbiAgaWYgKCF0ZXh0KSByZXR1cm4gJ2VuJztcbiAgY29uc3QgY2prID0gKHRleHQubWF0Y2goL1tcXHU0ZTAwLVxcdTlmZmZcXHUzNDAwLVxcdTRkYmZcXHUzMDAwLVxcdTMwM2ZcXHVmZjAwLVxcdWZmZWZdL2cpIHx8IFtdKS5sZW5ndGg7XG4gIGNvbnN0IHRvdGFsID0gdGV4dC5yZXBsYWNlKC9cXHMvZywgJycpLmxlbmd0aDtcbiAgcmV0dXJuIHRvdGFsID4gMCAmJiBjamsgLyB0b3RhbCA+IDAuMyA/ICd6aCcgOiAnZW4nO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGV0ZWN0TGFuZ3VhZ2UodGV4dDogc3RyaW5nKTogUHJvbWlzZTwnemgnIHwgJ2VuJz4ge1xuICBjb25zdCBoZXVyaXN0aWMgPSBkZXRlY3RMYW5ndWFnZUhldXJpc3RpYyh0ZXh0KTtcblxuICB0cnkge1xuICAgIGNvbnN0IGF2YWlsID0gYXdhaXQgKHdpbmRvdyBhcyB1bmtub3duIGFzIHsgTGFuZ3VhZ2VEZXRlY3Rvcj86IHsgYXZhaWxhYmlsaXR5KCk6IFByb21pc2U8c3RyaW5nPiB9IH0pLkxhbmd1YWdlRGV0ZWN0b3I/LmF2YWlsYWJpbGl0eT8uKCk7XG4gICAgaWYgKGF2YWlsID09PSAndW5hdmFpbGFibGUnKSByZXR1cm4gaGV1cmlzdGljO1xuXG4gICAgY29uc3QgZGV0ZWN0b3IgPSBhd2FpdCAod2luZG93IGFzIHVua25vd24gYXMgeyBMYW5ndWFnZURldGVjdG9yPzogeyBjcmVhdGUoKTogUHJvbWlzZTx7IGRldGVjdCh0ZXh0OiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PHsgZGV0ZWN0ZWRMYW5ndWFnZTogc3RyaW5nOyBjb25maWRlbmNlOiBudW1iZXIgfT4+OyBkZXN0cm95KCk6IHZvaWQgfT4gfSB9KS5MYW5ndWFnZURldGVjdG9yPy5jcmVhdGU/LigpO1xuICAgIGlmICghZGV0ZWN0b3IpIHJldHVybiBoZXVyaXN0aWM7XG4gICAgXG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IGRldGVjdG9yLmRldGVjdCh0ZXh0KTtcbiAgICBkZXRlY3Rvci5kZXN0cm95KCk7XG5cbiAgICBpZiAocmVzdWx0cyAmJiByZXN1bHRzLmxlbmd0aCA+IDAgJiYgcmVzdWx0c1swXS5jb25maWRlbmNlID4gMC41KSB7XG4gICAgICBjb25zdCB0b3AgPSByZXN1bHRzWzBdLmRldGVjdGVkTGFuZ3VhZ2U7XG4gICAgICByZXR1cm4gdG9wLnN0YXJ0c1dpdGgoJ3poJykgfHwgdG9wID09PSAnamEnID8gJ3poJyA6ICdlbic7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gaGV1cmlzdGljO1xuICB9XG4gIHJldHVybiBoZXVyaXN0aWM7XG59XG5cbmludGVyZmFjZSBDYXRlZ29yeVJ1bGUge1xuICB6aDogc3RyaW5nO1xuICBlbjogc3RyaW5nO1xuICBrZXl3b3Jkczogc3RyaW5nW107XG59XG5cbmV4cG9ydCBjb25zdCBDQVRFR09SWV9SVUxFUzogQ2F0ZWdvcnlSdWxlW10gPSBbXG4gIHsgemg6ICflvIDlj5EnLCBlbjogJ0RldicsIGtleXdvcmRzOiBbJ2NvZGUnLCAnYnVnJywgJ2RlYnVnJywgJ3JldmlldycsICdyZWZhY3RvcicsICdhcGknLCAnZnVuY3Rpb24nLCAnY2xhc3MnLCAnZXJyb3InLCAndGVzdCcsICfku6PnoIEnLCAn6LCD6K+VJywgJ+WuoeafpScsICfph43mnoQnLCAn5Ye95pWwJywgJ+aOpeWPoycsICfmiqXplJknLCAn5rWL6K+VJ10gfSxcbiAgeyB6aDogJ+WGmeS9nCcsIGVuOiAnV3JpdGluZycsIGtleXdvcmRzOiBbJ3dyaXRlJywgJ2Vzc2F5JywgJ2FydGljbGUnLCAnYmxvZycsICdlbWFpbCcsICdsZXR0ZXInLCAncmVwb3J0JywgJ3N1bW1hcnknLCAn5YaZJywgJ+aWh+eroCcsICfpgq7ku7YnLCAn5oql5ZGKJywgJ+aRmOimgScsICfmgLvnu5MnLCAn5Y2a5a6iJywgJ+S/oSddIH0sXG4gIHsgemg6ICfnv7vor5EnLCBlbjogJ1RyYW5zbGF0ZScsIGtleXdvcmRzOiBbJ3RyYW5zbGF0ZScsICd0cmFuc2xhdGlvbicsICdsYW5ndWFnZScsICdjaGluZXNlJywgJ2VuZ2xpc2gnLCAnamFwYW5lc2UnLCAn57+76K+RJywgJ+S4reaWhycsICfoi7HmlocnLCAn5pel5paHJywgJ+ivreiogCddIH0sXG4gIHsgemg6ICfliIbmnpAnLCBlbjogJ0FuYWx5c2lzJywga2V5d29yZHM6IFsnYW5hbHl6ZScsICdhbmFseXNpcycsICdjb21wYXJlJywgJ2V2YWx1YXRlJywgJ2Fzc2VzcycsICdkYXRhJywgJ+WIhuaekCcsICfmr5TovoMnLCAn6K+E5LywJywgJ+aVsOaNricsICflr7nmr5QnXSB9LFxuICB7IHpoOiAn5Yib5oSPJywgZW46ICdDcmVhdGl2ZScsIGtleXdvcmRzOiBbJ2NyZWF0aXZlJywgJ2lkZWEnLCAnYnJhaW5zdG9ybScsICdzdG9yeScsICdkZXNpZ24nLCAnc2xvZ2FuJywgJ+WIm+aEjycsICfmlYXkuosnLCAn6K6+6K6hJywgJ+WPo+WPtycsICfngrnlrZAnLCAn54G15oSfJ10gfSxcbiAgeyB6aDogJ+WtpuS5oCcsIGVuOiAnTGVhcm5pbmcnLCBrZXl3b3JkczogWydleHBsYWluJywgJ2xlYXJuJywgJ3RlYWNoJywgJ3R1dG9yaWFsJywgJ2NvbmNlcHQnLCAndW5kZXJzdGFuZCcsICfop6Pph4onLCAn5a2m5LmgJywgJ+aVmeeoiycsICfmpoLlv7UnLCAn55CG6KejJywgJ+efpeivhiddIH0sXG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdFRpdGxlSGV1cmlzdGljKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghdGV4dCkgcmV0dXJuICcnO1xuXG4gIGNvbnN0IGhlYWRpbmdNYXRjaCA9IHRleHQubWF0Y2goL14jezEsM31cXHMrKC4rKS9tKTtcbiAgaWYgKGhlYWRpbmdNYXRjaCkge1xuICAgIGNvbnN0IGggPSBoZWFkaW5nTWF0Y2hbMV0udHJpbSgpO1xuICAgIGlmIChoLmxlbmd0aCA8PSA1MCkgcmV0dXJuIGg7XG4gICAgcmV0dXJuIGguc3Vic3RyaW5nKDAsIDQ3KSArICcuLi4nO1xuICB9XG5cbiAgY29uc3QgZmlyc3RMaW5lID0gdGV4dC5zcGxpdCgvW1xcblxccl0vKVswXS50cmltKCk7XG4gIGlmIChmaXJzdExpbmUubGVuZ3RoID4gMCAmJiBmaXJzdExpbmUubGVuZ3RoIDw9IDUwKSByZXR1cm4gZmlyc3RMaW5lO1xuXG4gIGNvbnN0IHNlbnRlbmNlTWF0Y2ggPSB0ZXh0Lm1hdGNoKC9eKC4rP1su44CC77yB77yfIT9dKS9zKTtcbiAgaWYgKHNlbnRlbmNlTWF0Y2gpIHtcbiAgICBjb25zdCBzID0gc2VudGVuY2VNYXRjaFsxXS50cmltKCk7XG4gICAgaWYgKHMubGVuZ3RoIDw9IDUwKSByZXR1cm4gcztcbiAgfVxuXG4gIGlmICh0ZXh0Lmxlbmd0aCA8PSAzMCkgcmV0dXJuIHRleHQ7XG4gIGNvbnN0IHRydW5jYXRlZCA9IHRleHQuc3Vic3RyaW5nKDAsIDMwKTtcbiAgY29uc3QgbGFzdFNwYWNlID0gdHJ1bmNhdGVkLmxhc3RJbmRleE9mKCcgJyk7XG4gIHJldHVybiAobGFzdFNwYWNlID4gMTUgPyB0cnVuY2F0ZWQuc3Vic3RyaW5nKDAsIGxhc3RTcGFjZSkgOiB0cnVuY2F0ZWQpICsgJy4uLic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaENhdGVnb3J5KHRleHQ6IHN0cmluZywgbGFuZzogJ3poJyB8ICdlbicpOiBzdHJpbmcge1xuICBpZiAoIXRleHQpIHJldHVybiAnJztcbiAgY29uc3QgbG93ZXIgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gIGxldCBiZXN0TWF0Y2g6IHsgbmFtZTogc3RyaW5nOyBzY29yZTogbnVtYmVyIH0gPSB7IG5hbWU6ICcnLCBzY29yZTogMCB9O1xuXG4gIGZvciAoY29uc3QgcnVsZSBvZiBDQVRFR09SWV9SVUxFUykge1xuICAgIGNvbnN0IHNjb3JlID0gcnVsZS5rZXl3b3Jkcy5maWx0ZXIoa3cgPT4gbG93ZXIuaW5jbHVkZXMoa3cpKS5sZW5ndGg7XG4gICAgaWYgKHNjb3JlID4gYmVzdE1hdGNoLnNjb3JlKSB7XG4gICAgICBiZXN0TWF0Y2ggPSB7IG5hbWU6IHJ1bGVbbGFuZ10gfHwgcnVsZS56aCwgc2NvcmUgfTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGJlc3RNYXRjaC5zY29yZSA+PSAxID8gYmVzdE1hdGNoLm5hbWUgOiAnJztcbn1cblxuaW50ZXJmYWNlIEV4dHJhY3RSZXN1bHQge1xuICB0aXRsZTogc3RyaW5nO1xuICBjYXRlZ29yeTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgbGFuZzogJ3poJyB8ICdlbic7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0VGl0bGVBbmRDYXRlZ29yeShcbiAgdGV4dDogc3RyaW5nLFxuICBnZXRBY3RpdmVQcm92aWRlckZuOiAoKSA9PiBQcm9taXNlPHsgdHlwZTogc3RyaW5nIH0gfCBudWxsPixcbiAgY2FsbENsb3VkQVBJRm46ICh0ZXh0OiBzdHJpbmcsIGxhbmc6IHN0cmluZykgPT4gUHJvbWlzZTx7IHRpdGxlPzogc3RyaW5nOyBjYXRlZ29yeT86IHN0cmluZzsgdGFncz86IHN0cmluZ1tdIH0gfCBudWxsPlxuKTogUHJvbWlzZTxFeHRyYWN0UmVzdWx0PiB7XG4gIGNvbnN0IGxhbmcgPSBhd2FpdCBkZXRlY3RMYW5ndWFnZSh0ZXh0KTtcbiAgY29uc3QgcHJvdmlkZXIgPSBhd2FpdCBnZXRBY3RpdmVQcm92aWRlckZuKCk7XG5cbiAgaWYgKHByb3ZpZGVyPy50eXBlID09PSAnZ2VtaW5pJyB8fCBwcm92aWRlcj8udHlwZSA9PT0gJ29wZW5haScgfHwgcHJvdmlkZXI/LnR5cGUgPT09ICdnZW1pbmktd2ViJykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjYWxsQ2xvdWRBUElGbih0ZXh0LCBsYW5nKTtcbiAgICAgIGlmIChyZXN1bHQ/LnRpdGxlKSB7XG4gICAgICAgIHJldHVybiB7IHRpdGxlOiByZXN1bHQudGl0bGUsIGNhdGVnb3J5OiByZXN1bHQuY2F0ZWdvcnkgfHwgJycsIHRhZ3M6IHJlc3VsdC50YWdzIHx8IFtdLCBsYW5nIH07XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignQ2xvdWQgQVBJIGVycm9yLCBmYWxsaW5nIGJhY2s6JywgZSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB0aXRsZTogZXh0cmFjdFRpdGxlSGV1cmlzdGljKHRleHQpLFxuICAgICAgY2F0ZWdvcnk6IG1hdGNoQ2F0ZWdvcnkodGV4dCwgbGFuZyksXG4gICAgICB0YWdzOiBbXSxcbiAgICAgIGxhbmcsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHRpdGxlID0gZXh0cmFjdFRpdGxlSGV1cmlzdGljKHRleHQpO1xuICBjb25zdCBjYXRlZ29yeSA9IG1hdGNoQ2F0ZWdvcnkodGV4dCwgbGFuZyk7XG5cbiAgcmV0dXJuIHsgdGl0bGUsIGNhdGVnb3J5LCB0YWdzOiBbXSwgbGFuZyB9O1xufSIsImV4cG9ydCBpbnRlcmZhY2UgVmFyaWFibGVTcGVjIHtcbiAgbmFtZTogc3RyaW5nO1xuICB0eXBlOiAnY29udGV4dCcgfCAndGV4dCcgfCAnZW51bScgfCAnZGVmYXVsdCc7XG4gIG9wdGlvbnM/OiBzdHJpbmdbXTtcbiAgZGVmYXVsdD86IHN0cmluZyB8IG51bGw7XG4gIHJhdzogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VWYXJpYWJsZVNwZWMocmF3TmFtZTogc3RyaW5nKTogVmFyaWFibGVTcGVjIHtcbiAgaWYgKHJhd05hbWUuc3RhcnRzV2l0aCgnQCcpKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogcmF3TmFtZSwgdHlwZTogJ2NvbnRleHQnLCByYXc6IHJhd05hbWUgfTtcbiAgfVxuICBjb25zdCBjb2xvbklkeCA9IHJhd05hbWUuaW5kZXhPZignOicpO1xuICBpZiAoY29sb25JZHggPT09IC0xKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogcmF3TmFtZSwgdHlwZTogJ3RleHQnLCBkZWZhdWx0OiBudWxsLCByYXc6IHJhd05hbWUgfTtcbiAgfVxuICBjb25zdCBuYW1lID0gcmF3TmFtZS5zdWJzdHJpbmcoMCwgY29sb25JZHgpLnRyaW0oKTtcbiAgY29uc3QgcmVzdCA9IHJhd05hbWUuc3Vic3RyaW5nKGNvbG9uSWR4ICsgMSk7XG4gIGlmIChyZXN0LmluY2x1ZGVzKCd8JykpIHtcbiAgICBjb25zdCBvcHRpb25zID0gcmVzdC5zcGxpdCgnfCcpLm1hcChvID0+IG8udHJpbSgpKS5maWx0ZXIobyA9PiBvLmxlbmd0aCA+IDApO1xuICAgIGlmIChvcHRpb25zLmxlbmd0aCA+PSAyKSB7XG4gICAgICByZXR1cm4geyBuYW1lLCB0eXBlOiAnZW51bScsIG9wdGlvbnMsIGRlZmF1bHQ6IG9wdGlvbnNbMF0sIHJhdzogcmF3TmFtZSB9O1xuICAgIH1cbiAgfVxuICBjb25zdCBkZWZhdWx0VmFsID0gcmVzdC50cmltKCk7XG4gIGlmIChkZWZhdWx0VmFsLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBuYW1lLCB0eXBlOiAnZGVmYXVsdCcsIGRlZmF1bHQ6IGRlZmF1bHRWYWwsIHJhdzogcmF3TmFtZSB9O1xuICB9XG4gIHJldHVybiB7IG5hbWUsIHR5cGU6ICd0ZXh0JywgZGVmYXVsdDogbnVsbCwgcmF3OiByYXdOYW1lIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VmFyaWFibGVzKGNvbnRlbnQ6IHN0cmluZyk6IFZhcmlhYmxlU3BlY1tdIHtcbiAgY29uc3QgcmF3TWF0Y2hlczogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdCBicmFja2V0cyA9IGNvbnRlbnQubWF0Y2goL1xce1xceyhbXn1dKylcXH1cXH0vZyk7XG4gIGlmIChicmFja2V0cykge1xuICAgIHJhd01hdGNoZXMucHVzaCguLi5icmFja2V0cy5tYXAobSA9PiBtLnNsaWNlKDIsIC0yKS50cmltKCkpKTtcbiAgfVxuXG4gIGNvbnN0IHNxdWFyZXMgPSBjb250ZW50Lm1hdGNoKC9cXFsoW2EtekEtWl1bYS16QS1aMC05X1xcc10qKVxcXSg/IVxcKCkvZyk7XG4gIGlmIChzcXVhcmVzKSB7XG4gICAgcmF3TWF0Y2hlcy5wdXNoKC4uLnNxdWFyZXMubWFwKG0gPT4gbS5zbGljZSgxLCAtMSkudHJpbSgpKSk7XG4gIH1cblxuICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIHJldHVybiByYXdNYXRjaGVzXG4gICAgLmZpbHRlcih2ID0+IHYubGVuZ3RoID4gMCAmJiAhc2Vlbi5oYXModikgJiYgc2Vlbi5hZGQodikpXG4gICAgLm1hcChwYXJzZVZhcmlhYmxlU3BlYyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFzc2lmeVZhcmlhYmxlcyh2YXJTcGVjczogVmFyaWFibGVTcGVjW10pOiB7IGNvbnRleHQ6IFZhcmlhYmxlU3BlY1tdOyB1c2VyOiBWYXJpYWJsZVNwZWNbXSB9IHtcbiAgY29uc3QgY29udGV4dCA9IHZhclNwZWNzLmZpbHRlcih2ID0+IHYudHlwZSA9PT0gJ2NvbnRleHQnKTtcbiAgY29uc3QgdXNlciA9IHZhclNwZWNzLmZpbHRlcih2ID0+IHYudHlwZSAhPT0gJ2NvbnRleHQnKTtcbiAgcmV0dXJuIHsgY29udGV4dCwgdXNlciB9O1xufVxuXG5pbnRlcmZhY2UgQ29udGV4dFZhcmlhYmxlUmVzdWx0IHtcbiAgcmVzb2x2ZWQ6IHN0cmluZztcbiAgcmVzb2x2ZWRNYXA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXNvbHZlQ29udGV4dFZhcmlhYmxlcyhjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPENvbnRleHRWYXJpYWJsZVJlc3VsdD4ge1xuICBjb25zdCBbdGFiXSA9IGF3YWl0IGNocm9tZS50YWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pO1xuICBjb25zdCByZXNvbHZlZE1hcDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gIGNvbnN0IHVzZWQgPSAoY29udGVudC5tYXRjaCgvXFx7XFx7QChbYS16QS1aX10rKVxcfVxcfS9nKSB8fCBbXSlcbiAgICAubWFwKG0gPT4gbS5zbGljZSgyLCAtMikudHJpbSgpKTtcbiAgY29uc3QgdW5pcXVlVXNlZCA9IFsuLi5uZXcgU2V0KHVzZWQpXTtcbiAgaWYgKHVuaXF1ZVVzZWQubGVuZ3RoID09PSAwKSByZXR1cm4geyByZXNvbHZlZDogY29udGVudCwgcmVzb2x2ZWRNYXAgfTtcblxuICBjb25zdCByZXNvbHZlcnMgPSB1bmlxdWVVc2VkLm1hcChhc3luYyAodmFyTmFtZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBzd2l0Y2ggKHZhck5hbWUpIHtcbiAgICAgICAgY2FzZSAnQGNsaXBib2FyZCc6XG4gICAgICAgICAgcmV0dXJuIFt2YXJOYW1lLCBudWxsXSBhcyBbc3RyaW5nLCBzdHJpbmcgfCBudWxsXTtcbiAgICAgICAgY2FzZSAnQHNlbGVjdGlvbic6XG4gICAgICAgICAgaWYgKHRhYj8uaWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbFJlc3AgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHsgdHlwZTogJ0dFVF9TRUxFQ1RJT04nIH0pLmNhdGNoKCgpID0+IG51bGwpIGFzIHsgdGV4dD86IHN0cmluZyB9IHwgbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBbdmFyTmFtZSwgc2VsUmVzcD8udGV4dCB8fCAnJ10gYXMgW3N0cmluZywgc3RyaW5nXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFt2YXJOYW1lLCAnJ10gYXMgW3N0cmluZywgc3RyaW5nXTtcbiAgICAgICAgY2FzZSAnQHBhZ2VfdXJsJzpcbiAgICAgICAgICByZXR1cm4gW3Zhck5hbWUsIHRhYj8udXJsIHx8ICcnXSBhcyBbc3RyaW5nLCBzdHJpbmddO1xuICAgICAgICBjYXNlICdAcGFnZV90ZXh0JzpcbiAgICAgICAgICBpZiAodGFiPy5pZCkge1xuICAgICAgICAgICAgY29uc3QgdGV4dFJlc3AgPSBhd2FpdCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWIuaWQsIHsgdHlwZTogJ0dFVF9QQUdFX1RFWFQnIH0pLmNhdGNoKCgpID0+IG51bGwpIGFzIHsgdGV4dD86IHN0cmluZyB9IHwgbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBbdmFyTmFtZSwgdGV4dFJlc3A/LnRleHQgfHwgJyddIGFzIFtzdHJpbmcsIHN0cmluZ107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBbdmFyTmFtZSwgJyddIGFzIFtzdHJpbmcsIHN0cmluZ107XG4gICAgICAgIGNhc2UgJ0BkYXRlJzpcbiAgICAgICAgICByZXR1cm4gW3Zhck5hbWUsIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdXSBhcyBbc3RyaW5nLCBzdHJpbmddO1xuICAgICAgICBjYXNlICdAbGFuZyc6IHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoeyBsYW5ndWFnZTogJ3poX0NOJyB9KSBhcyB7IGxhbmd1YWdlOiBzdHJpbmcgfTtcbiAgICAgICAgICByZXR1cm4gW3Zhck5hbWUsIGRhdGEubGFuZ3VhZ2VdIGFzIFtzdHJpbmcsIHN0cmluZ107XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gW3Zhck5hbWUsIG51bGxdIGFzIFtzdHJpbmcsIHN0cmluZyB8IG51bGxdO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtDb250ZXh0VmFyXSBGYWlsZWQgdG8gcmVzb2x2ZSAke3Zhck5hbWV9OmAsIGUpO1xuICAgICAgcmV0dXJuIFt2YXJOYW1lLCAnJ10gYXMgW3N0cmluZywgc3RyaW5nXTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChyZXNvbHZlcnMpO1xuXG4gIGxldCByZXNvbHZlZCA9IGNvbnRlbnQ7XG4gIGZvciAoY29uc3QgW3Zhck5hbWUsIHZhbHVlXSBvZiByZXN1bHRzKSB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsKSBjb250aW51ZTtcbiAgICByZXNvbHZlZE1hcFt2YXJOYW1lXSA9IHZhbHVlO1xuICAgIHJlc29sdmVkID0gcmVzb2x2ZWQuc3BsaXQoYHt7JHt2YXJOYW1lfX19YCkuam9pbih2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4geyByZXNvbHZlZCwgcmVzb2x2ZWRNYXAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2VQcm9tcHQocHJvbXB0OiB7IGNvbnRlbnQ6IHN0cmluZyB9LCBjb250ZW50T3ZlcnJpZGU6IHN0cmluZyB8IG51bGwgPSBudWxsKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbnRlbnRPdmVycmlkZSB8fCBwcm9tcHQuY29udGVudDtcbn0iLCJpbXBvcnQgeyBkZWZpbmVCYWNrZ3JvdW5kIH0gZnJvbSAnd3h0L3NhbmRib3gnO1xuaW1wb3J0IHsgUHJvbXB0U3RvcmFnZSB9IGZyb20gJ0BzaGFyZWQvYXBpL3N0b3JhZ2UnO1xuaW1wb3J0IHsgZ2V0UHJvdmlkZXJzLCBzZXRQcm92aWRlcnMsIGNhbGxDbG91ZEFQSSB9IGZyb20gJ0BzaGFyZWQvYXBpL2FpJztcbmltcG9ydCB7IGV4dHJhY3RUaXRsZUFuZENhdGVnb3J5IH0gZnJvbSAnQHNoYXJlZC91dGlscy90ZXh0LWFuYWx5c2lzJztcbmltcG9ydCB7IGV4dHJhY3RWYXJpYWJsZXMsIGNvbXBvc2VQcm9tcHQgfSBmcm9tICdAc2hhcmVkL3V0aWxzL3ZhcmlhYmxlcyc7XG5pbXBvcnQgdHlwZSB7IFByb21wdCB9IGZyb20gJ0BzaGFyZWQvdHlwZXMvcHJvbXB0JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGNvbnNvbGUubG9nKGDwn5SlIFtiYWNrZ3JvdW5kLnRzXSB2JHtjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb259IGxvYWRlZGApO1xuICBcbiAgY2hyb21lLnNpZGVQYW5lbFxuICAgIC5zZXRQYW5lbEJlaGF2aW9yKHsgb3BlblBhbmVsT25BY3Rpb25DbGljazogdHJ1ZSB9KVxuICAgIC5jYXRjaCgoZXJyb3IpID0+IGNvbnNvbGUuZXJyb3IoJ1NpZGUgcGFuZWwgc2V0dXAgZmFpbGVkOicsIGVycm9yKSk7XG4gIFxuICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgaGFuZGxlTWVzc2FnZShtZXNzYWdlLCBzZW5kUmVzcG9uc2UpLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbQmFja2dyb3VuZF0gRXJyb3IgaGFuZGxpbmcgbWVzc2FnZTonLCBlcnIpO1xuICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSk7XG4gIFxuICBjaHJvbWUucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcihhc3luYyAoKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ1tCYWNrZ3JvdW5kXSBFeHRlbnNpb24gaW5zdGFsbGVkL3VwZGF0ZWQnKTtcbiAgfSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShtZXNzYWdlOiB7IHR5cGU6IHN0cmluZzsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LCBzZW5kUmVzcG9uc2U6IChyZXNwb25zZTogdW5rbm93bikgPT4gdm9pZCk6IFByb21pc2U8dm9pZD4ge1xuICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgIGNhc2UgJ0dFVF9QUk9NUFRTJzoge1xuICAgICAgY29uc3QgcHJvbXB0cyA9IGF3YWl0IFByb21wdFN0b3JhZ2UuZ2V0KCk7XG4gICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBwcm9tcHRzIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIGNhc2UgJ1NBVkVfUFJPTVBUJzoge1xuICAgICAgY29uc3QgcHJvbXB0RGF0YSA9IG1lc3NhZ2UucHJvbXB0IGFzIE9taXQ8UHJvbXB0LCAnaWQnIHwgJ2NyZWF0ZWRBdCc+O1xuICAgICAgY29uc3QgbmV3UHJvbXB0OiBQcm9tcHQgPSB7XG4gICAgICAgIC4uLnByb21wdERhdGEsXG4gICAgICAgIGlkOiBjcnlwdG8ucmFuZG9tVVVJRCgpLFxuICAgICAgICBjcmVhdGVkQXQ6IERhdGUubm93KCksXG4gICAgICAgIHVzYWdlQ291bnQ6IDAsXG4gICAgICAgIGxhc3RVc2VkQXQ6IG51bGwsXG4gICAgICAgIGZhdm9yaXRlOiBmYWxzZSxcbiAgICAgICAgdmVyc2lvbnM6IFtdLFxuICAgICAgICB2YXJpYWJsZXM6IGV4dHJhY3RWYXJpYWJsZXMocHJvbXB0RGF0YS5jb250ZW50KSxcbiAgICAgIH07XG4gICAgICBhd2FpdCBQcm9tcHRTdG9yYWdlLnNhdmUobmV3UHJvbXB0KTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIHByb21wdDogbmV3UHJvbXB0IH0pO1xuICAgICAgXG4gICAgICBpZiAoIW5ld1Byb21wdC50aXRsZSB8fCBuZXdQcm9tcHQudGl0bGUuZW5kc1dpdGgoJy4uLicpKSB7XG4gICAgICAgIGF3YWl0IGVucmljaFByb21wdChuZXdQcm9tcHQuaWQsIG5ld1Byb21wdC5jb250ZW50KTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdVUERBVEVfUFJPTVBUJzoge1xuICAgICAgY29uc3QgeyBpZCwgdXBkYXRlcyB9ID0gbWVzc2FnZSBhcyB7IGlkOiBzdHJpbmc7IHVwZGF0ZXM6IFBhcnRpYWw8UHJvbXB0PiB9O1xuICAgICAgY29uc3QgcHJvbXB0cyA9IGF3YWl0IFByb21wdFN0b3JhZ2UuZ2V0KCk7XG4gICAgICBjb25zdCBleGlzdGluZyA9IHByb21wdHMuZmluZChwID0+IHAuaWQgPT09IGlkKTtcbiAgICAgIGlmICghZXhpc3RpbmcpIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnUHJvbXB0IG5vdCBmb3VuZCcgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc3QgdXBkYXRlZDogUHJvbXB0ID0ge1xuICAgICAgICAuLi5leGlzdGluZyxcbiAgICAgICAgLi4udXBkYXRlcyxcbiAgICAgICAgdXBkYXRlZEF0OiBEYXRlLm5vdygpLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgaWYgKHVwZGF0ZXMuY29udGVudCkge1xuICAgICAgICB1cGRhdGVkLnZhcmlhYmxlcyA9IGV4dHJhY3RWYXJpYWJsZXModXBkYXRlcy5jb250ZW50KTtcbiAgICAgICAgY29uc3QgbmV3VmVyc2lvbiA9IHtcbiAgICAgICAgICB2ZXJzaW9uSWQ6IGNyeXB0by5yYW5kb21VVUlEKCksXG4gICAgICAgICAgY29udGVudDogZXhpc3RpbmcuY29udGVudCxcbiAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXG4gICAgICAgIH07XG4gICAgICAgIHVwZGF0ZWQudmVyc2lvbnMgPSBbbmV3VmVyc2lvbiwgLi4uKGV4aXN0aW5nLnZlcnNpb25zIHx8IFtdKV0uc2xpY2UoMCwgMjApO1xuICAgICAgfVxuICAgICAgXG4gICAgICBhd2FpdCBQcm9tcHRTdG9yYWdlLnVwZGF0ZSh1cGRhdGVkKTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUsIHByb21wdDogdXBkYXRlZCB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdERUxFVEVfUFJPTVBUJzoge1xuICAgICAgY29uc3QgeyBpZCB9ID0gbWVzc2FnZSBhcyB7IGlkOiBzdHJpbmcgfTtcbiAgICAgIGF3YWl0IFByb21wdFN0b3JhZ2UuZGVsZXRlKGlkKTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgY2FzZSAnVE9HR0xFX0ZBVk9SSVRFJzoge1xuICAgICAgY29uc3QgeyBpZCB9ID0gbWVzc2FnZSBhcyB7IGlkOiBzdHJpbmcgfTtcbiAgICAgIGNvbnN0IHByb21wdHMgPSBhd2FpdCBQcm9tcHRTdG9yYWdlLmdldCgpO1xuICAgICAgY29uc3QgcHJvbXB0ID0gcHJvbXB0cy5maW5kKHAgPT4gcC5pZCA9PT0gaWQpO1xuICAgICAgaWYgKHByb21wdCkge1xuICAgICAgICBwcm9tcHQuZmF2b3JpdGUgPSAhcHJvbXB0LmZhdm9yaXRlO1xuICAgICAgICBhd2FpdCBQcm9tcHRTdG9yYWdlLnVwZGF0ZShwcm9tcHQpO1xuICAgICAgfVxuICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdUUkFDS19VU0FHRSc6IHtcbiAgICAgIGNvbnN0IHsgaWQgfSA9IG1lc3NhZ2UgYXMgeyBpZDogc3RyaW5nIH07XG4gICAgICBjb25zdCBwcm9tcHRzID0gYXdhaXQgUHJvbXB0U3RvcmFnZS5nZXQoKTtcbiAgICAgIGNvbnN0IHByb21wdCA9IHByb21wdHMuZmluZChwID0+IHAuaWQgPT09IGlkKTtcbiAgICAgIGlmIChwcm9tcHQpIHtcbiAgICAgICAgcHJvbXB0LnVzYWdlQ291bnQgPSAocHJvbXB0LnVzYWdlQ291bnQgfHwgMCkgKyAxO1xuICAgICAgICBwcm9tcHQubGFzdFVzZWRBdCA9IERhdGUubm93KCk7XG4gICAgICAgIGF3YWl0IFByb21wdFN0b3JhZ2UudXBkYXRlKHByb21wdCk7XG4gICAgICB9XG4gICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIGNhc2UgJ0dFVF9QUk9WSURFUlMnOiB7XG4gICAgICBjb25zdCBwcm92aWRlcnMgPSBhd2FpdCBnZXRQcm92aWRlcnMoKTtcbiAgICAgIGNvbnN0IGFjdGl2ZVByb3ZpZGVySWQgPSAoYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdhY3RpdmVQcm92aWRlcklkJykpLmFjdGl2ZVByb3ZpZGVySWQ7XG4gICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCBwcm92aWRlcnMsIGFjdGl2ZVByb3ZpZGVySWQgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgY2FzZSAnU0FWRV9QUk9WSURFUlMnOiB7XG4gICAgICBjb25zdCB7IHByb3ZpZGVycywgYWN0aXZlUHJvdmlkZXJJZCB9ID0gbWVzc2FnZSBhcyB7IHByb3ZpZGVyczogdW5rbm93bltdOyBhY3RpdmVQcm92aWRlcklkPzogc3RyaW5nIH07XG4gICAgICBhd2FpdCBzZXRQcm92aWRlcnMocHJvdmlkZXJzKTtcbiAgICAgIGlmIChhY3RpdmVQcm92aWRlcklkKSB7XG4gICAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IGFjdGl2ZVByb3ZpZGVySWQgfSk7XG4gICAgICB9XG4gICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIGNhc2UgJ0NPTVBPU0VfUFJPTVBUJzoge1xuICAgICAgY29uc3QgeyBwcm9tcHQsIGNvbnRlbnRPdmVycmlkZSB9ID0gbWVzc2FnZSBhcyB7IHByb21wdDogUHJvbXB0OyBjb250ZW50T3ZlcnJpZGU/OiBzdHJpbmcgfTtcbiAgICAgIGNvbnN0IGNvbXBvc2VkID0gY29tcG9zZVByb21wdChwcm9tcHQsIGNvbnRlbnRPdmVycmlkZSB8fCBudWxsKTtcbiAgICAgIGNvbnN0IHZhcmlhYmxlcyA9IGV4dHJhY3RWYXJpYWJsZXMoY29tcG9zZWQpLmZpbHRlcih2ID0+IHYudHlwZSAhPT0gJ2NvbnRleHQnKTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IFxuICAgICAgICBzdWNjZXNzOiB0cnVlLCBcbiAgICAgICAgY29tcG9zZWQsIFxuICAgICAgICB2YXJpYWJsZXM6IHZhcmlhYmxlcy5tYXAodiA9PiB2Lm5hbWUpXG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdBVVRPX0VYVFJBQ1QnOiB7XG4gICAgICBjb25zdCB7IGNvbnRlbnQgfSA9IG1lc3NhZ2UgYXMgeyBjb250ZW50OiBzdHJpbmcgfTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4dHJhY3RUaXRsZUFuZENhdGVnb3J5KFxuICAgICAgICBjb250ZW50LFxuICAgICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgcHJvdmlkZXJzID0gYXdhaXQgZ2V0UHJvdmlkZXJzKCk7XG4gICAgICAgICAgY29uc3QgYWN0aXZlSWQgPSAoYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdhY3RpdmVQcm92aWRlcklkJykpLmFjdGl2ZVByb3ZpZGVySWQ7XG4gICAgICAgICAgcmV0dXJuIHByb3ZpZGVycy5maW5kKHAgPT4gcC5pZCA9PT0gYWN0aXZlSWQpIHx8IHByb3ZpZGVyc1swXSB8fCBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBjYWxsQ2xvdWRBUElcbiAgICAgICk7XG4gICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiB0cnVlLCAuLi5yZXN1bHQgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgY2FzZSAnR0VUX1BBR0VfQ09OVEVYVCc6IHtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIFxuICAgIGNhc2UgJ0NBUFRVUkVfUEFHRV9DT05URVhUJzoge1xuICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogdHJ1ZSB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBkZWZhdWx0OlxuICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnVW5rbm93biBtZXNzYWdlIHR5cGUnIH0pO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVucmljaFByb21wdChpZDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBleHRyYWN0VGl0bGVBbmRDYXRlZ29yeShcbiAgICAgIGNvbnRlbnQsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVycyA9IGF3YWl0IGdldFByb3ZpZGVycygpO1xuICAgICAgICBjb25zdCBhY3RpdmVJZCA9IChhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ2FjdGl2ZVByb3ZpZGVySWQnKSkuYWN0aXZlUHJvdmlkZXJJZDtcbiAgICAgICAgcmV0dXJuIHByb3ZpZGVycy5maW5kKHAgPT4gcC5pZCA9PT0gYWN0aXZlSWQpIHx8IHByb3ZpZGVyc1swXSB8fCBudWxsO1xuICAgICAgfSxcbiAgICAgIGNhbGxDbG91ZEFQSVxuICAgICk7XG4gICAgXG4gICAgaWYgKHJlc3VsdC50aXRsZSkge1xuICAgICAgY29uc3QgcHJvbXB0cyA9IGF3YWl0IFByb21wdFN0b3JhZ2UuZ2V0KCk7XG4gICAgICBjb25zdCBwcm9tcHQgPSBwcm9tcHRzLmZpbmQocCA9PiBwLmlkID09PSBpZCk7XG4gICAgICBpZiAocHJvbXB0KSB7XG4gICAgICAgIHByb21wdC50aXRsZSA9IHJlc3VsdC50aXRsZTtcbiAgICAgICAgcHJvbXB0LmNhdGVnb3J5ID0gcmVzdWx0LmNhdGVnb3J5IHx8IHByb21wdC5jYXRlZ29yeTtcbiAgICAgICAgYXdhaXQgUHJvbXB0U3RvcmFnZS51cGRhdGUocHJvbXB0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1tCYWNrZ3JvdW5kXSBGYWlsZWQgdG8gZW5yaWNoIHByb21wdDonLCBlcnIpO1xuICB9XG59IiwiZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSAoXG4gIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZCA9PSBudWxsID8gZ2xvYmFsVGhpcy5jaHJvbWUgOiAoXG4gICAgLy8gQHRzLWV4cGVjdC1lcnJvclxuICAgIGdsb2JhbFRoaXMuYnJvd3NlclxuICApXG4pO1xuIl0sIm5hbWVzIjpbInJlc3VsdCIsIl9iIiwiX2EiXSwibWFwcGluZ3MiOiI7OztBQUFPLFdBQVMsaUJBQWlCLEtBQUs7QUFDcEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBRztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQ0ZBLE1BQUksZ0JBQWdCLE1BQU07QUFBQSxJQUN4QixZQUFZLGNBQWM7QUFDeEIsVUFBSSxpQkFBaUIsY0FBYztBQUNqQyxhQUFLLFlBQVk7QUFDakIsYUFBSyxrQkFBa0IsQ0FBQyxHQUFHLGNBQWMsU0FBUztBQUNsRCxhQUFLLGdCQUFnQjtBQUNyQixhQUFLLGdCQUFnQjtBQUFBLE1BQ3ZCLE9BQU87QUFDTCxjQUFNLFNBQVMsdUJBQXVCLEtBQUssWUFBWTtBQUN2RCxZQUFJLFVBQVU7QUFDWixnQkFBTSxJQUFJLG9CQUFvQixjQUFjLGtCQUFrQjtBQUNoRSxjQUFNLENBQUMsR0FBRyxVQUFVLFVBQVUsUUFBUSxJQUFJO0FBQzFDLHlCQUFpQixjQUFjLFFBQVE7QUFDdkMseUJBQWlCLGNBQWMsUUFBUTtBQUV2QyxhQUFLLGtCQUFrQixhQUFhLE1BQU0sQ0FBQyxRQUFRLE9BQU8sSUFBSSxDQUFDLFFBQVE7QUFDdkUsYUFBSyxnQkFBZ0I7QUFDckIsYUFBSyxnQkFBZ0I7QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVMsS0FBSztBQUNaLFVBQUksS0FBSztBQUNQLGVBQU87QUFDVCxZQUFNLElBQUksT0FBTyxRQUFRLFdBQVcsSUFBSSxJQUFJLEdBQUcsSUFBSSxlQUFlLFdBQVcsSUFB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QUFTLE1BQU07QUFBQSxVQUNuQjtBQUFBLFVBQ0EsWUFBWTtBQUNWLGtCQUFNLFlBQVksTUFBTSxhQUFBO0FBQ3hCLGtCQUFNLFlBQVksTUFBTSxPQUFPLFFBQVEsTUFBTSxJQUFJLGtCQUFrQixHQUFHO0FBQ3RFLG1CQUFPLFVBQVUsS0FBSyxDQUFBLE1BQUssRUFBRSxPQUFPLFFBQVEsS0FBSyxVQUFVLENBQUMsS0FBSztBQUFBLFVBQ25FO0FBQUEsVUFDQTtBQUFBLFFBQUE7QUFFRixxQkFBYSxFQUFFLFNBQVMsTUFBTSxHQUFHQSxTQUFRO0FBQ3pDO0FBQUEsTUFDRjtBQUFBLE1BRUEsS0FBSyxvQkFBb0I7QUFDdkIscUJBQWEsRUFBRSxTQUFTLE9BQU87QUFDL0I7QUFBQSxNQUNGO0FBQUEsTUFFQSxLQUFLLHdCQUF3QjtBQUMzQixxQkFBYSxFQUFFLFNBQVMsTUFBTTtBQUM5QjtBQUFBLE1BQ0Y7QUFBQSxNQUVBO0FBQ0UscUJBQWEsRUFBRSxTQUFTLE9BQU8sT0FBTyx3QkFBd0I7QUFBQSxJQUFBO0FBQUEsRUFFcEU7QUFFQSxpQkFBZSxhQUFhLElBQVksU0FBZ0M7QUFDdEUsUUFBSTtBQUNGLFlBQU1BLFVBQVMsTUFBTTtBQUFBLFFBQ25CO0FBQUEsUUFDQSxZQUFZO0FBQ1YsZ0JBQU0sWUFBWSxNQUFNLGFBQUE7QUFDeEIsZ0JBQU0sWUFBWSxNQUFNLE9BQU8sUUFBUSxNQUFNLElBQUksa0JBQWtCLEdBQUc7QUFDdEUsaUJBQU8sVUFBVSxLQUFLLENBQUEsTUFBSyxFQUFFLE9BQU8sUUFBUSxLQUFLLFVBQVUsQ0FBQyxLQUFLO0FBQUEsUUFDbkU7QUFBQSxRQUNBO0FBQUEsTUFBQTtBQUdGLFVBQUlBLFFBQU8sT0FBTztBQUNoQixjQUFNLFVBQVUsTUFBTSxjQUFjLElBQUE7QUFDcEMsY0FBTSxTQUFTLFFBQVEsS0FBSyxDQUFBLE1BQUssRUFBRSxPQUFPLEVBQUU7QUFDNUMsWUFBSSxRQUFRO0FBQ1YsaUJBQU8sUUFBUUEsUUFBTztBQUN0QixpQkFBTyxXQUFXQSxRQUFPLFlBQVksT0FBTztBQUM1QyxnQkFBTSxjQUFjLE9BQU8sTUFBTTtBQUFBLFFBQ25DO0FBQUEsTUFDRjtBQUFBLElBQ0YsU0FBUyxLQUFLO0FBQ1osY0FBUSxNQUFNLHlDQUF5QyxHQUFHO0FBQUEsSUFDNUQ7QUFBQSxFQUNGOzs7O0FDek1PLFFBQU07QUFBQTtBQUFBLE1BRVgsc0JBQVcsWUFBWCxtQkFBb0IsWUFBcEIsbUJBQTZCLE9BQU0sT0FBTyxXQUFXO0FBQUE7QUFBQSxNQUVuRCxXQUFXO0FBQUE7QUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzsiLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbMCwxLDddfQ==
