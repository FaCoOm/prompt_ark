var content = (function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b;
  function defineContentScript(definition2) {
    return definition2;
  }
  const PLATFORM_CONFIGS = {
    chatgpt: {
      name: "chatgpt",
      hostname: ["chatgpt.com", "chat.openai.com"],
      selectors: {
        input: ["#prompt-textarea", 'div[contenteditable="true"].ProseMirror']
      }
    },
    claude: {
      name: "claude",
      hostname: ["claude.ai"],
      selectors: {
        input: ['div[contenteditable="true"].ProseMirror', 'div[enterkeyhint="enter"][contenteditable="true"]']
      }
    },
    gemini: {
      name: "gemini",
      hostname: ["gemini.google.com"],
      selectors: {
        input: ['rich-textarea div[contenteditable="true"]', 'div[role="textbox"]', ".ql-editor"]
      }
    },
    notebooklm: {
      name: "notebooklm",
      hostname: ["notebooklm.google.com"],
      selectors: {
        input: ["textarea[placeholder]", "textarea.mat-input-element"]
      }
    },
    aistudio: {
      name: "aistudio",
      hostname: ["aistudio.google.com"],
      selectors: {
        input: ["textarea[placeholder]", ".code-block textarea", 'div[contenteditable="true"]']
      }
    },
    grok: {
      name: "grok",
      hostname: ["grok.com"],
      selectors: {
        input: ["textarea[placeholder]", 'div[contenteditable="true"]']
      }
    },
    deepseek: {
      name: "deepseek",
      hostname: ["chat.deepseek.com"],
      selectors: {
        input: ["textarea#chat-input", "textarea[placeholder]"]
      }
    },
    kimi: {
      name: "kimi",
      hostname: ["kimi.com", "kimi.moonshot.cn"],
      selectors: {
        input: ['div[contenteditable="true"][class*="editor"]', 'div[contenteditable="true"].ProseMirror']
      }
    },
    zhipu: {
      name: "zhipu",
      hostname: ["chatglm.cn"],
      selectors: {
        input: ["textarea.ant-input"]
      }
    },
    doubao: {
      name: "doubao",
      hostname: ["doubao.com", "www.doubao.com"],
      selectors: {
        input: ['div[data-slate-editor="true"]', 'div[contenteditable="true"][role="textbox"]']
      }
    },
    wenxin: {
      name: "wenxin",
      hostname: ["yiyan.baidu.com"],
      selectors: {
        input: ['div[contenteditable="true"]', "textarea[placeholder]"]
      }
    },
    qwen: {
      name: "qwen",
      hostname: ["tongyi.aliyun.com", "qwen.ai"],
      selectors: {
        input: ['div[contenteditable="true"][class*="editor"]']
      }
    },
    minimax: {
      name: "minimax",
      hostname: ["hailuoai.com", "www.hailuoai.com"],
      selectors: {
        input: ["textarea[placeholder]", 'div[contenteditable="true"]']
      }
    },
    hunyuan: {
      name: "hunyuan",
      hostname: ["hunyuan.tencent.com"],
      selectors: {
        input: ["textarea[placeholder]", 'div[contenteditable="true"]']
      }
    },
    generic: {
      name: "generic",
      hostname: [],
      selectors: {
        input: ["textarea", 'div[contenteditable="true"]']
      }
    }
  };
  function detectPlatform() {
    const h = window.location.hostname;
    if (h.includes("chatgpt.com") || h.includes("chat.openai.com")) return "chatgpt";
    if (h.includes("claude.ai")) return "claude";
    if (h.includes("gemini.google.com")) return "gemini";
    if (h.includes("notebooklm.google.com")) return "notebooklm";
    if (h.includes("aistudio.google.com")) return "aistudio";
    if (h.includes("grok.com")) return "grok";
    if (h.includes("chat.deepseek.com")) return "deepseek";
    if (h.includes("kimi.com") || h.includes("kimi.moonshot.cn")) return "kimi";
    if (h.includes("chatglm.cn")) return "zhipu";
    if (h.includes("doubao.com")) return "doubao";
    if (h.includes("yiyan.baidu.com")) return "wenxin";
    if (h.includes("tongyi.aliyun.com") || h.includes("qwen.ai")) return "qwen";
    if (h.includes("hailuoai.com")) return "minimax";
    if (h.includes("hunyuan.tencent.com")) return "hunyuan";
    return "generic";
  }
  function createPlatformAdapter(platform) {
    const config = PLATFORM_CONFIGS[platform];
    return {
      ...config,
      findInput() {
        for (const selector of config.selectors.input) {
          const el = document.querySelector(selector);
          if (el && isVisible(el)) {
            return el;
          }
        }
        const genericSelectors = ["textarea", 'div[contenteditable="true"]'];
        for (const selector of genericSelectors) {
          const el = document.querySelector(selector);
          if (el && isVisible(el)) {
            return el;
          }
        }
        return null;
      },
      async injectText(input, text) {
        var _a2, _b2;
        input.focus();
        await new Promise((r) => setTimeout(r, 50));
        let success = false;
        if (input.classList.contains("ProseMirror") || input.isContentEditable) {
          try {
            success = document.execCommand("insertText", false, text);
          } catch {
          }
        }
        if (!success) {
          if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
            const inputEl = input;
            const valueSetter = (_a2 = Object.getOwnPropertyDescriptor(inputEl, "value")) == null ? void 0 : _a2.set;
            const protoSetter = (_b2 = Object.getOwnPropertyDescriptor(
              Object.getPrototypeOf(inputEl),
              "value"
            )) == null ? void 0 : _b2.set;
            const finalSetter = valueSetter || protoSetter;
            if (finalSetter) {
              finalSetter.call(inputEl, text);
            } else {
              inputEl.value = text;
            }
            const tracker = inputEl._valueTracker;
            if (tracker) tracker.setValue("");
            success = true;
          } else {
            input.textContent = text;
            success = true;
          }
        }
        const events = [
          new Event("input", { bubbles: true }),
          new Event("change", { bubbles: true }),
          new KeyboardEvent("keydown", { bubbles: true, key: " " }),
          new KeyboardEvent("keyup", { bubbles: true, key: " " })
        ];
        for (const e of events) {
          input.dispatchEvent(e);
        }
        return success;
      },
      isReady() {
        return this.findInput() !== null;
      }
    };
  }
  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getBoundingClientRect().height > 0;
  }
  content;
  content;
  const definition = defineContentScript({
    matches: ["<all_urls>"],
    main() {
      const platform = detectPlatform();
      const adapter = createPlatformAdapter(platform);
      console.log("[Content] Platform detected:", platform);
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        handleMessage(message, adapter, sendResponse).catch((err) => {
          console.error("[Content] Error:", err);
          sendResponse({ success: false, error: err.message });
        });
        return true;
      });
      if (platform !== "generic") {
        initializePlatformUI(adapter);
      }
    }
  });
  async function handleMessage(message, adapter, sendResponse) {
    var _a2, _b2;
    switch (message.type) {
      case "INSERT_PROMPT": {
        const { content: content2 } = message;
        const input = adapter.findInput();
        if (!input) {
          sendResponse({ success: false, error: "No input found" });
          return;
        }
        const success = await adapter.injectText(input, content2);
        sendResponse({ success });
        break;
      }
      case "GET_SELECTION": {
        const selection = ((_a2 = window.getSelection()) == null ? void 0 : _a2.toString()) || "";
        sendResponse({ text: selection });
        break;
      }
      case "GET_PAGE_TEXT": {
        const text = ((_b2 = document.body.innerText) == null ? void 0 : _b2.replace(/\s+/g, " ").trim().substring(0, 5e3)) || "";
        sendResponse({ text });
        break;
      }
      case "GET_PLATFORM": {
        sendResponse({ platform: adapter.name });
        break;
      }
      case "COPY_TO_CLIPBOARD": {
        const { text } = message;
        navigator.clipboard.writeText(text).catch(() => {
        });
        sendResponse({ success: true });
        break;
      }
      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
  }
  function initializePlatformUI(adapter) {
    const checkInterval = setInterval(() => {
      if (adapter.isReady()) {
        clearInterval(checkInterval);
        console.log("[Content] Platform ready, injecting UI...");
      }
    }, 1e3);
    setTimeout(() => clearInterval(checkInterval), 3e4);
  }
  content;
  const browser = (
    // @ts-expect-error
    ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) == null ? globalThis.chrome : (
      // @ts-expect-error
      globalThis.browser
    )
  );
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  const _WxtLocationChangeEvent = class _WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(_WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  __publicField(_WxtLocationChangeEvent, "EVENT_NAME", getUniqueEventName("wxt:locationchange"));
  let WxtLocationChangeEvent = _WxtLocationChangeEvent;
  function getUniqueEventName(eventName) {
    var _a2;
    return `${(_a2 = browser == null ? void 0 : browser.runtime) == null ? void 0 : _a2.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  const _ContentScriptContext = class _ContentScriptContext {
    constructor(contentScriptName, options) {
      __publicField(this, "isTopFrame", window.self === window.top);
      __publicField(this, "abortController");
      __publicField(this, "locationWatcher", createLocationWatcher(this));
      __publicField(this, "receivedMessageIds", /* @__PURE__ */ new Set());
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      var _a2;
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      (_a2 = target.addEventListener) == null ? void 0 : _a2.call(
        target,
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: Math.random().toString(36).slice(2)
        },
        "*"
      );
    }
    verifyScriptStartedEvent(event) {
      var _a2, _b2, _c;
      const isScriptStartedEvent = ((_a2 = event.data) == null ? void 0 : _a2.type) === _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE;
      const isSameContentScript = ((_b2 = event.data) == null ? void 0 : _b2.contentScriptName) === this.contentScriptName;
      const isNotDuplicate = !this.receivedMessageIds.has((_c = event.data) == null ? void 0 : _c.messageId);
      return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        if (this.verifyScriptStartedEvent(event)) {
          this.receivedMessageIds.add(event.data.messageId);
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && (options == null ? void 0 : options.ignoreFirstEvent)) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  };
  __publicField(_ContentScriptContext, "SCRIPT_STARTED_MESSAGE_TYPE", getUniqueEventName(
    "wxt:content-script-started"
  ));
  let ContentScriptContext = _ContentScriptContext;
  const nullKey = Symbol("null");
  let keyCounter = 0;
  class ManyKeysMap extends Map {
    constructor() {
      super();
      this._objectHashes = /* @__PURE__ */ new WeakMap();
      this._symbolHashes = /* @__PURE__ */ new Map();
      this._publicKeys = /* @__PURE__ */ new Map();
      const [pairs] = arguments;
      if (pairs === null || pairs === void 0) {
        return;
      }
      if (typeof pairs[Symbol.iterator] !== "function") {
        throw new TypeError(typeof pairs + " is not iterable (cannot read property Symbol(Symbol.iterator))");
      }
      for (const [keys, value] of pairs) {
        this.set(keys, value);
      }
    }
    _getPublicKeys(keys, create = false) {
      if (!Array.isArray(keys)) {
        throw new TypeError("The keys parameter must be an array");
      }
      const privateKey = this._getPrivateKey(keys, create);
      let publicKey;
      if (privateKey && this._publicKeys.has(privateKey)) {
        publicKey = this._publicKeys.get(privateKey);
      } else if (create) {
        publicKey = [...keys];
        this._publicKeys.set(privateKey, publicKey);
      }
      return { privateKey, publicKey };
    }
    _getPrivateKey(keys, create = false) {
      const privateKeys = [];
      for (let key of keys) {
        if (key === null) {
          key = nullKey;
        }
        const hashes = typeof key === "object" || typeof key === "function" ? "_objectHashes" : typeof key === "symbol" ? "_symbolHashes" : false;
        if (!hashes) {
          privateKeys.push(key);
        } else if (this[hashes].has(key)) {
          privateKeys.push(this[hashes].get(key));
        } else if (create) {
          const privateKey = `@@mkm-ref-${keyCounter++}@@`;
          this[hashes].set(key, privateKey);
          privateKeys.push(privateKey);
        } else {
          return false;
        }
      }
      return JSON.stringify(privateKeys);
    }
    set(keys, value) {
      const { publicKey } = this._getPublicKeys(keys, true);
      return super.set(publicKey, value);
    }
    get(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.get(publicKey);
    }
    has(keys) {
      const { publicKey } = this._getPublicKeys(keys);
      return super.has(publicKey);
    }
    delete(keys) {
      const { publicKey, privateKey } = this._getPublicKeys(keys);
      return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
    }
    clear() {
      super.clear();
      this._symbolHashes.clear();
      this._publicKeys.clear();
    }
    get [Symbol.toStringTag]() {
      return "ManyKeysMap";
    }
    get size() {
      return super.size;
    }
  }
  new ManyKeysMap();
  function initPlugins() {
  }
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
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
})();
content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI1LjUuMF9yb2xsdXBANC42MC4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3NhbmRib3gvZGVmaW5lLWNvbnRlbnQtc2NyaXB0Lm1qcyIsIi4uLy4uLy4uL3NyYy9wbGF0Zm9ybXMvYmFzZS50cyIsIi4uLy4uLy4uL3NyYy9lbnRyeXBvaW50cy9jb250ZW50LnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI1LjUuMF9yb2xsdXBANC42MC4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIvY2hyb21lLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNS41LjBfcm9sbHVwQDQuNjAuMF95YW1sQDIuOC4zL25vZGVfbW9kdWxlcy93eHQvZGlzdC9zYW5kYm94L3V0aWxzL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMTkuMjlfQHR5cGVzK25vZGVAMjUuNS4wX3JvbGx1cEA0LjYwLjBfeWFtbEAyLjguMy9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvY2xpZW50L2NvbnRlbnQtc2NyaXB0cy9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4xOS4yOV9AdHlwZXMrbm9kZUAyNS41LjBfcm9sbHVwQDQuNjAuMF95YW1sQDIuOC4zL25vZGVfbW9kdWxlcy93eHQvZGlzdC9jbGllbnQvY29udGVudC1zY3JpcHRzL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjE5LjI5X0B0eXBlcytub2RlQDI1LjUuMF9yb2xsdXBANC42MC4wX3lhbWxAMi44LjMvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2NsaWVudC9jb250ZW50LXNjcmlwdHMvY29udGVudC1zY3JpcHQtY29udGV4dC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vbWFueS1rZXlzLW1hcEAyLjAuMS9ub2RlX21vZHVsZXMvbWFueS1rZXlzLW1hcC9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9AMW5hdHN1K3dhaXQtZWxlbWVudEA0LjEuMi9ub2RlX21vZHVsZXMvQDFuYXRzdS93YWl0LWVsZW1lbnQvZGlzdC9pbmRleC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUNvbnRlbnRTY3JpcHQoZGVmaW5pdGlvbikge1xuICByZXR1cm4gZGVmaW5pdGlvbjtcbn1cbiIsImV4cG9ydCB0eXBlIFBsYXRmb3JtID0gXG4gIHwgJ2NoYXRncHQnXG4gIHwgJ2NsYXVkZSdcbiAgfCAnZ2VtaW5pJ1xuICB8ICdub3RlYm9va2xtJ1xuICB8ICdhaXN0dWRpbydcbiAgfCAnZ3JvaydcbiAgfCAnZGVlcHNlZWsnXG4gIHwgJ2tpbWknXG4gIHwgJ3poaXB1J1xuICB8ICdkb3ViYW8nXG4gIHwgJ3dlbnhpbidcbiAgfCAncXdlbidcbiAgfCAnbWluaW1heCdcbiAgfCAnaHVueXVhbidcbiAgfCAnZ2VuZXJpYyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGxhdGZvcm1BZGFwdGVyIHtcbiAgbmFtZTogUGxhdGZvcm07XG4gIGhvc3RuYW1lOiBzdHJpbmdbXTtcbiAgc2VsZWN0b3JzOiB7XG4gICAgaW5wdXQ6IHN0cmluZ1tdO1xuICAgIHNlbmRCdXR0b24/OiBzdHJpbmdbXTtcbiAgfTtcbiAgZmluZElucHV0KCk6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaW5qZWN0VGV4dChpbnB1dDogSFRNTEVsZW1lbnQsIHRleHQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj47XG4gIGlzUmVhZHkoKTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNvbnN0IFBMQVRGT1JNX0NPTkZJR1M6IFJlY29yZDxQbGF0Zm9ybSwgT21pdDxQbGF0Zm9ybUFkYXB0ZXIsICdmaW5kSW5wdXQnIHwgJ2luamVjdFRleHQnIHwgJ2lzUmVhZHknPj4gPSB7XG4gIGNoYXRncHQ6IHtcbiAgICBuYW1lOiAnY2hhdGdwdCcsXG4gICAgaG9zdG5hbWU6IFsnY2hhdGdwdC5jb20nLCAnY2hhdC5vcGVuYWkuY29tJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWycjcHJvbXB0LXRleHRhcmVhJywgJ2Rpdltjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJdLlByb3NlTWlycm9yJ10sXG4gICAgfSxcbiAgfSxcbiAgY2xhdWRlOiB7XG4gICAgbmFtZTogJ2NsYXVkZScsXG4gICAgaG9zdG5hbWU6IFsnY2xhdWRlLmFpJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWydkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXS5Qcm9zZU1pcnJvcicsICdkaXZbZW50ZXJrZXloaW50PVwiZW50ZXJcIl1bY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXSddLFxuICAgIH0sXG4gIH0sXG4gIGdlbWluaToge1xuICAgIG5hbWU6ICdnZW1pbmknLFxuICAgIGhvc3RuYW1lOiBbJ2dlbWluaS5nb29nbGUuY29tJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWydyaWNoLXRleHRhcmVhIGRpdltjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJdJywgJ2Rpdltyb2xlPVwidGV4dGJveFwiXScsICcucWwtZWRpdG9yJ10sXG4gICAgfSxcbiAgfSxcbiAgbm90ZWJvb2tsbToge1xuICAgIG5hbWU6ICdub3RlYm9va2xtJyxcbiAgICBob3N0bmFtZTogWydub3RlYm9va2xtLmdvb2dsZS5jb20nXSxcbiAgICBzZWxlY3RvcnM6IHtcbiAgICAgIGlucHV0OiBbJ3RleHRhcmVhW3BsYWNlaG9sZGVyXScsICd0ZXh0YXJlYS5tYXQtaW5wdXQtZWxlbWVudCddLFxuICAgIH0sXG4gIH0sXG4gIGFpc3R1ZGlvOiB7XG4gICAgbmFtZTogJ2Fpc3R1ZGlvJyxcbiAgICBob3N0bmFtZTogWydhaXN0dWRpby5nb29nbGUuY29tJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWyd0ZXh0YXJlYVtwbGFjZWhvbGRlcl0nLCAnLmNvZGUtYmxvY2sgdGV4dGFyZWEnLCAnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nXSxcbiAgICB9LFxuICB9LFxuICBncm9rOiB7XG4gICAgbmFtZTogJ2dyb2snLFxuICAgIGhvc3RuYW1lOiBbJ2dyb2suY29tJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWyd0ZXh0YXJlYVtwbGFjZWhvbGRlcl0nLCAnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nXSxcbiAgICB9LFxuICB9LFxuICBkZWVwc2Vlazoge1xuICAgIG5hbWU6ICdkZWVwc2VlaycsXG4gICAgaG9zdG5hbWU6IFsnY2hhdC5kZWVwc2Vlay5jb20nXSxcbiAgICBzZWxlY3RvcnM6IHtcbiAgICAgIGlucHV0OiBbJ3RleHRhcmVhI2NoYXQtaW5wdXQnLCAndGV4dGFyZWFbcGxhY2Vob2xkZXJdJ10sXG4gICAgfSxcbiAgfSxcbiAga2ltaToge1xuICAgIG5hbWU6ICdraW1pJyxcbiAgICBob3N0bmFtZTogWydraW1pLmNvbScsICdraW1pLm1vb25zaG90LmNuJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWydkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXVtjbGFzcyo9XCJlZGl0b3JcIl0nLCAnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0uUHJvc2VNaXJyb3InXSxcbiAgICB9LFxuICB9LFxuICB6aGlwdToge1xuICAgIG5hbWU6ICd6aGlwdScsXG4gICAgaG9zdG5hbWU6IFsnY2hhdGdsbS5jbiddLFxuICAgIHNlbGVjdG9yczoge1xuICAgICAgaW5wdXQ6IFsndGV4dGFyZWEuYW50LWlucHV0J10sXG4gICAgfSxcbiAgfSxcbiAgZG91YmFvOiB7XG4gICAgbmFtZTogJ2RvdWJhbycsXG4gICAgaG9zdG5hbWU6IFsnZG91YmFvLmNvbScsICd3d3cuZG91YmFvLmNvbSddLFxuICAgIHNlbGVjdG9yczoge1xuICAgICAgaW5wdXQ6IFsnZGl2W2RhdGEtc2xhdGUtZWRpdG9yPVwidHJ1ZVwiXScsICdkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXVtyb2xlPVwidGV4dGJveFwiXSddLFxuICAgIH0sXG4gIH0sXG4gIHdlbnhpbjoge1xuICAgIG5hbWU6ICd3ZW54aW4nLFxuICAgIGhvc3RuYW1lOiBbJ3lpeWFuLmJhaWR1LmNvbSddLFxuICAgIHNlbGVjdG9yczoge1xuICAgICAgaW5wdXQ6IFsnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nLCAndGV4dGFyZWFbcGxhY2Vob2xkZXJdJ10sXG4gICAgfSxcbiAgfSxcbiAgcXdlbjoge1xuICAgIG5hbWU6ICdxd2VuJyxcbiAgICBob3N0bmFtZTogWyd0b25neWkuYWxpeXVuLmNvbScsICdxd2VuLmFpJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWydkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXVtjbGFzcyo9XCJlZGl0b3JcIl0nXSxcbiAgICB9LFxuICB9LFxuICBtaW5pbWF4OiB7XG4gICAgbmFtZTogJ21pbmltYXgnLFxuICAgIGhvc3RuYW1lOiBbJ2hhaWx1b2FpLmNvbScsICd3d3cuaGFpbHVvYWkuY29tJ10sXG4gICAgc2VsZWN0b3JzOiB7XG4gICAgICBpbnB1dDogWyd0ZXh0YXJlYVtwbGFjZWhvbGRlcl0nLCAnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nXSxcbiAgICB9LFxuICB9LFxuICBodW55dWFuOiB7XG4gICAgbmFtZTogJ2h1bnl1YW4nLFxuICAgIGhvc3RuYW1lOiBbJ2h1bnl1YW4udGVuY2VudC5jb20nXSxcbiAgICBzZWxlY3RvcnM6IHtcbiAgICAgIGlucHV0OiBbJ3RleHRhcmVhW3BsYWNlaG9sZGVyXScsICdkaXZbY29udGVudGVkaXRhYmxlPVwidHJ1ZVwiXSddLFxuICAgIH0sXG4gIH0sXG4gIGdlbmVyaWM6IHtcbiAgICBuYW1lOiAnZ2VuZXJpYycsXG4gICAgaG9zdG5hbWU6IFtdLFxuICAgIHNlbGVjdG9yczoge1xuICAgICAgaW5wdXQ6IFsndGV4dGFyZWEnLCAnZGl2W2NvbnRlbnRlZGl0YWJsZT1cInRydWVcIl0nXSxcbiAgICB9LFxuICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdFBsYXRmb3JtKCk6IFBsYXRmb3JtIHtcbiAgY29uc3QgaCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgaWYgKGguaW5jbHVkZXMoJ2NoYXRncHQuY29tJykgfHwgaC5pbmNsdWRlcygnY2hhdC5vcGVuYWkuY29tJykpIHJldHVybiAnY2hhdGdwdCc7XG4gIGlmIChoLmluY2x1ZGVzKCdjbGF1ZGUuYWknKSkgcmV0dXJuICdjbGF1ZGUnO1xuICBpZiAoaC5pbmNsdWRlcygnZ2VtaW5pLmdvb2dsZS5jb20nKSkgcmV0dXJuICdnZW1pbmknO1xuICBpZiAoaC5pbmNsdWRlcygnbm90ZWJvb2tsbS5nb29nbGUuY29tJykpIHJldHVybiAnbm90ZWJvb2tsbSc7XG4gIGlmIChoLmluY2x1ZGVzKCdhaXN0dWRpby5nb29nbGUuY29tJykpIHJldHVybiAnYWlzdHVkaW8nO1xuICBpZiAoaC5pbmNsdWRlcygnZ3Jvay5jb20nKSkgcmV0dXJuICdncm9rJztcbiAgaWYgKGguaW5jbHVkZXMoJ2NoYXQuZGVlcHNlZWsuY29tJykpIHJldHVybiAnZGVlcHNlZWsnO1xuICBpZiAoaC5pbmNsdWRlcygna2ltaS5jb20nKSB8fCBoLmluY2x1ZGVzKCdraW1pLm1vb25zaG90LmNuJykpIHJldHVybiAna2ltaSc7XG4gIGlmIChoLmluY2x1ZGVzKCdjaGF0Z2xtLmNuJykpIHJldHVybiAnemhpcHUnO1xuICBpZiAoaC5pbmNsdWRlcygnZG91YmFvLmNvbScpKSByZXR1cm4gJ2RvdWJhbyc7XG4gIGlmIChoLmluY2x1ZGVzKCd5aXlhbi5iYWlkdS5jb20nKSkgcmV0dXJuICd3ZW54aW4nO1xuICBpZiAoaC5pbmNsdWRlcygndG9uZ3lpLmFsaXl1bi5jb20nKSB8fCBoLmluY2x1ZGVzKCdxd2VuLmFpJykpIHJldHVybiAncXdlbic7XG4gIGlmIChoLmluY2x1ZGVzKCdoYWlsdW9haS5jb20nKSkgcmV0dXJuICdtaW5pbWF4JztcbiAgaWYgKGguaW5jbHVkZXMoJ2h1bnl1YW4udGVuY2VudC5jb20nKSkgcmV0dXJuICdodW55dWFuJztcbiAgcmV0dXJuICdnZW5lcmljJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBsYXRmb3JtQWRhcHRlcihwbGF0Zm9ybTogUGxhdGZvcm0pOiBQbGF0Zm9ybUFkYXB0ZXIge1xuICBjb25zdCBjb25maWcgPSBQTEFURk9STV9DT05GSUdTW3BsYXRmb3JtXTtcbiAgXG4gIHJldHVybiB7XG4gICAgLi4uY29uZmlnLFxuICAgIFxuICAgIGZpbmRJbnB1dCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBjb25maWcuc2VsZWN0b3JzLmlucHV0KSB7XG4gICAgICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIGlmIChlbCAmJiBpc1Zpc2libGUoZWwgYXMgSFRNTEVsZW1lbnQpKSB7XG4gICAgICAgICAgcmV0dXJuIGVsIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnN0IGdlbmVyaWNTZWxlY3RvcnMgPSBbJ3RleHRhcmVhJywgJ2Rpdltjb250ZW50ZWRpdGFibGU9XCJ0cnVlXCJdJ107XG4gICAgICBmb3IgKGNvbnN0IHNlbGVjdG9yIG9mIGdlbmVyaWNTZWxlY3RvcnMpIHtcbiAgICAgICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgaWYgKGVsICYmIGlzVmlzaWJsZShlbCBhcyBIVE1MRWxlbWVudCkpIHtcbiAgICAgICAgICByZXR1cm4gZWwgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBcbiAgICBhc3luYyBpbmplY3RUZXh0KGlucHV0OiBIVE1MRWxlbWVudCwgdGV4dDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDUwKSk7XG4gICAgICBcbiAgICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XG4gICAgICBcbiAgICAgIGlmIChpbnB1dC5jbGFzc0xpc3QuY29udGFpbnMoJ1Byb3NlTWlycm9yJykgfHwgaW5wdXQuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzdWNjZXNzID0gZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2luc2VydFRleHQnLCBmYWxzZSwgdGV4dCk7XG4gICAgICAgIH0gY2F0Y2ggeyB9XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmICghc3VjY2Vzcykge1xuICAgICAgICBpZiAoaW5wdXQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyB8fCBpbnB1dC50YWdOYW1lID09PSAnSU5QVVQnKSB7XG4gICAgICAgICAgY29uc3QgaW5wdXRFbCA9IGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQgfCBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgICAgICAgIGNvbnN0IHZhbHVlU2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihpbnB1dEVsLCAndmFsdWUnKT8uc2V0O1xuICAgICAgICAgIGNvbnN0IHByb3RvU2V0dGVyID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihcbiAgICAgICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZihpbnB1dEVsKSwgJ3ZhbHVlJ1xuICAgICAgICAgICk/LnNldDtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBmaW5hbFNldHRlciA9IHZhbHVlU2V0dGVyIHx8IHByb3RvU2V0dGVyO1xuICAgICAgICAgIGlmIChmaW5hbFNldHRlcikge1xuICAgICAgICAgICAgZmluYWxTZXR0ZXIuY2FsbChpbnB1dEVsLCB0ZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5wdXRFbC52YWx1ZSA9IHRleHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IHRyYWNrZXIgPSAoaW5wdXRFbCBhcyB1bmtub3duIGFzIHsgX3ZhbHVlVHJhY2tlcj86IHsgc2V0VmFsdWUodjogc3RyaW5nKTogdm9pZCB9IH0pLl92YWx1ZVRyYWNrZXI7XG4gICAgICAgICAgaWYgKHRyYWNrZXIpIHRyYWNrZXIuc2V0VmFsdWUoJycpO1xuICAgICAgICAgIFxuICAgICAgICAgIHN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlucHV0LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCBldmVudHMgPSBbXG4gICAgICAgIG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSksXG4gICAgICAgIG5ldyBFdmVudCgnY2hhbmdlJywgeyBidWJibGVzOiB0cnVlIH0pLFxuICAgICAgICBuZXcgS2V5Ym9hcmRFdmVudCgna2V5ZG93bicsIHsgYnViYmxlczogdHJ1ZSwga2V5OiAnICcgfSksXG4gICAgICAgIG5ldyBLZXlib2FyZEV2ZW50KCdrZXl1cCcsIHsgYnViYmxlczogdHJ1ZSwga2V5OiAnICcgfSlcbiAgICAgIF07XG4gICAgICBmb3IgKGNvbnN0IGUgb2YgZXZlbnRzKSB7XG4gICAgICAgIGlucHV0LmRpc3BhdGNoRXZlbnQoZSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBzdWNjZXNzO1xuICAgIH0sXG4gICAgXG4gICAgaXNSZWFkeSgpOiBib29sZWFuIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmRJbnB1dCgpICE9PSBudWxsO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gaXNWaXNpYmxlKGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmICghZWxlbWVudCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpO1xuICByZXR1cm4gc3R5bGUuZGlzcGxheSAhPT0gJ25vbmUnICYmXG4gICAgc3R5bGUudmlzaWJpbGl0eSAhPT0gJ2hpZGRlbicgJiZcbiAgICBzdHlsZS5vcGFjaXR5ICE9PSAnMCcgJiZcbiAgICBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCA+IDA7XG59IiwiaW1wb3J0IHsgZGVmaW5lQ29udGVudFNjcmlwdCB9IGZyb20gJ3d4dC9zYW5kYm94JztcbmltcG9ydCB7IGRldGVjdFBsYXRmb3JtLCBjcmVhdGVQbGF0Zm9ybUFkYXB0ZXIgfSBmcm9tICdAcGxhdGZvcm1zL2Jhc2UnO1xuaW1wb3J0IHsgZXh0cmFjdFZhcmlhYmxlcyB9IGZyb20gJ0BzaGFyZWQvdXRpbHMvdmFyaWFibGVzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29udGVudFNjcmlwdCh7XG4gIG1hdGNoZXM6IFsnPGFsbF91cmxzPiddLFxuICBtYWluKCkge1xuICAgIGNvbnN0IHBsYXRmb3JtID0gZGV0ZWN0UGxhdGZvcm0oKTtcbiAgICBjb25zdCBhZGFwdGVyID0gY3JlYXRlUGxhdGZvcm1BZGFwdGVyKHBsYXRmb3JtKTtcblxuICAgIGNvbnNvbGUubG9nKCdbQ29udGVudF0gUGxhdGZvcm0gZGV0ZWN0ZWQ6JywgcGxhdGZvcm0pO1xuXG4gICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xuICAgICAgaGFuZGxlTWVzc2FnZShtZXNzYWdlLCBhZGFwdGVyLCBzZW5kUmVzcG9uc2UpLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tDb250ZW50XSBFcnJvcjonLCBlcnIpO1xuICAgICAgICBzZW5kUmVzcG9uc2UoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIGlmIChwbGF0Zm9ybSAhPT0gJ2dlbmVyaWMnKSB7XG4gICAgICBpbml0aWFsaXplUGxhdGZvcm1VSShhZGFwdGVyKTtcbiAgICB9XG4gIH0sXG59KTtcblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShcbiAgbWVzc2FnZTogeyB0eXBlOiBzdHJpbmc7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcbiAgYWRhcHRlcjogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlUGxhdGZvcm1BZGFwdGVyPixcbiAgc2VuZFJlc3BvbnNlOiAocmVzcG9uc2U6IHVua25vd24pID0+IHZvaWRcbik6IFByb21pc2U8dm9pZD4ge1xuICBzd2l0Y2ggKG1lc3NhZ2UudHlwZSkge1xuICAgIGNhc2UgJ0lOU0VSVF9QUk9NUFQnOiB7XG4gICAgICBjb25zdCB7IGNvbnRlbnQgfSA9IG1lc3NhZ2UgYXMgeyBjb250ZW50OiBzdHJpbmcgfTtcbiAgICAgIGNvbnN0IGlucHV0ID0gYWRhcHRlci5maW5kSW5wdXQoKTtcbiAgICAgIGlmICghaW5wdXQpIHtcbiAgICAgICAgc2VuZFJlc3BvbnNlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnTm8gaW5wdXQgZm91bmQnIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBzdWNjZXNzID0gYXdhaXQgYWRhcHRlci5pbmplY3RUZXh0KGlucHV0LCBjb250ZW50KTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3MgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgY2FzZSAnR0VUX1NFTEVDVElPTic6IHtcbiAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKT8udG9TdHJpbmcoKSB8fCAnJztcbiAgICAgIHNlbmRSZXNwb25zZSh7IHRleHQ6IHNlbGVjdGlvbiB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdHRVRfUEFHRV9URVhUJzoge1xuICAgICAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0Py5yZXBsYWNlKC9cXHMrL2csICcgJykudHJpbSgpLnN1YnN0cmluZygwLCA1MDAwKSB8fCAnJztcbiAgICAgIHNlbmRSZXNwb25zZSh7IHRleHQgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgY2FzZSAnR0VUX1BMQVRGT1JNJzoge1xuICAgICAgc2VuZFJlc3BvbnNlKHsgcGxhdGZvcm06IGFkYXB0ZXIubmFtZSB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBcbiAgICBjYXNlICdDT1BZX1RPX0NMSVBCT0FSRCc6IHtcbiAgICAgIGNvbnN0IHsgdGV4dCB9ID0gbWVzc2FnZSBhcyB7IHRleHQ6IHN0cmluZyB9O1xuICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCkuY2F0Y2goKCkgPT4geyB9KTtcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IHRydWUgfSk7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgXG4gICAgZGVmYXVsdDpcbiAgICAgIHNlbmRSZXNwb25zZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogJ1Vua25vd24gbWVzc2FnZSB0eXBlJyB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbml0aWFsaXplUGxhdGZvcm1VSShhZGFwdGVyOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVQbGF0Zm9ybUFkYXB0ZXI+KTogdm9pZCB7XG4gIGNvbnN0IGNoZWNrSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgaWYgKGFkYXB0ZXIuaXNSZWFkeSgpKSB7XG4gICAgICBjbGVhckludGVydmFsKGNoZWNrSW50ZXJ2YWwpO1xuICAgICAgY29uc29sZS5sb2coJ1tDb250ZW50XSBQbGF0Zm9ybSByZWFkeSwgaW5qZWN0aW5nIFVJLi4uJyk7XG4gICAgfVxuICB9LCAxMDAwKTtcbiAgXG4gIHNldFRpbWVvdXQoKCkgPT4gY2xlYXJJbnRlcnZhbChjaGVja0ludGVydmFsKSwgMzAwMDApO1xufSIsImV4cG9ydCBjb25zdCBicm93c2VyID0gKFxuICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gIGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWQgPT0gbnVsbCA/IGdsb2JhbFRoaXMuY2hyb21lIDogKFxuICAgIC8vIEB0cy1leHBlY3QtZXJyb3JcbiAgICBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgKVxuKTtcbiIsImZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG4gIGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG4gIGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcbiAgd2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG4gIGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5leHBvcnQgY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgY29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcbiAgICBzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcbiAgICB0aGlzLm5ld1VybCA9IG5ld1VybDtcbiAgICB0aGlzLm9sZFVybCA9IG9sZFVybDtcbiAgfVxuICBzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG4gIHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcbiAgbGV0IGludGVydmFsO1xuICBsZXQgb2xkVXJsO1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgbG9jYXRpb24gd2F0Y2hlciBpcyBhY3RpdmVseSBsb29raW5nIGZvciBVUkwgY2hhbmdlcy4gSWYgaXQncyBhbHJlYWR5IHdhdGNoaW5nLFxuICAgICAqIHRoaXMgaXMgYSBub29wLlxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgIGlmIChpbnRlcnZhbCAhPSBudWxsKSByZXR1cm47XG4gICAgICBvbGRVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgaW50ZXJ2YWwgPSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBsZXQgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgaWYgKG5ld1VybC5ocmVmICE9PSBvbGRVcmwuaHJlZikge1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgb2xkVXJsKSk7XG4gICAgICAgICAgb2xkVXJsID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9LCAxZTMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi8uLi9zYW5kYm94L3V0aWxzL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuZXhwb3J0IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcbiAgICB0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBpZiAodGhpcy5pc1RvcEZyYW1lKSB7XG4gICAgICB0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cyh7IGlnbm9yZUZpcnN0RXZlbnQ6IHRydWUgfSk7XG4gICAgICB0aGlzLnN0b3BPbGRTY3JpcHRzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG4gICAgfVxuICB9XG4gIHN0YXRpYyBTQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXG4gICAgXCJ3eHQ6Y29udGVudC1zY3JpcHQtc3RhcnRlZFwiXG4gICk7XG4gIGlzVG9wRnJhbWUgPSB3aW5kb3cuc2VsZiA9PT0gd2luZG93LnRvcDtcbiAgYWJvcnRDb250cm9sbGVyO1xuICBsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG4gIHJlY2VpdmVkTWVzc2FnZUlkcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG4gIGdldCBzaWduYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcbiAgfVxuICBhYm9ydChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcbiAgfVxuICBnZXQgaXNJbnZhbGlkKCkge1xuICAgIGlmIChicm93c2VyLnJ1bnRpbWUuaWQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcbiAgfVxuICBnZXQgaXNWYWxpZCgpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuICB9XG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciB0aGF0IGlzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IHNjcmlwdCdzIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG4gICAqIGNvbnN0IHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIgPSBjdHgub25JbnZhbGlkYXRlZCgoKSA9PiB7XG4gICAqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG4gICAqIH0pXG4gICAqIC8vIC4uLlxuICAgKiByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG4gICAqL1xuICBvbkludmFsaWRhdGVkKGNiKSB7XG4gICAgdGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgICByZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcbiAgfVxuICAvKipcbiAgICogUmV0dXJuIGEgcHJvbWlzZSB0aGF0IG5ldmVyIHJlc29sdmVzLiBVc2VmdWwgaWYgeW91IGhhdmUgYW4gYXN5bmMgZnVuY3Rpb24gdGhhdCBzaG91bGRuJ3QgcnVuXG4gICAqIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG4gICAqICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcbiAgICpcbiAgICogICAvLyAuLi5cbiAgICogfVxuICAgKi9cbiAgYmxvY2soKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCgpID0+IHtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWwgd2hlbiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKi9cbiAgc2V0VGltZW91dChoYW5kbGVyLCB0aW1lb3V0KSB7XG4gICAgY29uc3QgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJUaW1lb3V0KGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShjYWxsYmFjaykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCguLi5hcmdzKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9KTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsQW5pbWF0aW9uRnJhbWUoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlIHJlcXVlc3Qgd2hlblxuICAgKiBpbnZhbGlkYXRlZC5cbiAgICovXG4gIHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcbiAgICBjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG4gICAgfSwgb3B0aW9ucyk7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICBhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuICAgIGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG4gICAgICBpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcbiAgICB9XG4gICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/LihcbiAgICAgIHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLFxuICAgICAgaGFuZGxlcixcbiAgICAgIHtcbiAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgc2lnbmFsOiB0aGlzLnNpZ25hbFxuICAgICAgfVxuICAgICk7XG4gIH1cbiAgLyoqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cbiAgICovXG4gIG5vdGlmeUludmFsaWRhdGVkKCkge1xuICAgIHRoaXMuYWJvcnQoXCJDb250ZW50IHNjcmlwdCBjb250ZXh0IGludmFsaWRhdGVkXCIpO1xuICAgIGxvZ2dlci5kZWJ1ZyhcbiAgICAgIGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYFxuICAgICk7XG4gIH1cbiAgc3RvcE9sZFNjcmlwdHMoKSB7XG4gICAgd2luZG93LnBvc3RNZXNzYWdlKFxuICAgICAge1xuICAgICAgICB0eXBlOiBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsXG4gICAgICAgIGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuICAgICAgICBtZXNzYWdlSWQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpXG4gICAgICB9LFxuICAgICAgXCIqXCJcbiAgICApO1xuICB9XG4gIHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuICAgIGNvbnN0IGlzU2NyaXB0U3RhcnRlZEV2ZW50ID0gZXZlbnQuZGF0YT8udHlwZSA9PT0gQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFO1xuICAgIGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kYXRhPy5jb250ZW50U2NyaXB0TmFtZSA9PT0gdGhpcy5jb250ZW50U2NyaXB0TmFtZTtcbiAgICBjb25zdCBpc05vdER1cGxpY2F0ZSA9ICF0aGlzLnJlY2VpdmVkTWVzc2FnZUlkcy5oYXMoZXZlbnQuZGF0YT8ubWVzc2FnZUlkKTtcbiAgICByZXR1cm4gaXNTY3JpcHRTdGFydGVkRXZlbnQgJiYgaXNTYW1lQ29udGVudFNjcmlwdCAmJiBpc05vdER1cGxpY2F0ZTtcbiAgfVxuICBsaXN0ZW5Gb3JOZXdlclNjcmlwdHMob3B0aW9ucykge1xuICAgIGxldCBpc0ZpcnN0ID0gdHJ1ZTtcbiAgICBjb25zdCBjYiA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkge1xuICAgICAgICB0aGlzLnJlY2VpdmVkTWVzc2FnZUlkcy5hZGQoZXZlbnQuZGF0YS5tZXNzYWdlSWQpO1xuICAgICAgICBjb25zdCB3YXNGaXJzdCA9IGlzRmlyc3Q7XG4gICAgICAgIGlzRmlyc3QgPSBmYWxzZTtcbiAgICAgICAgaWYgKHdhc0ZpcnN0ICYmIG9wdGlvbnM/Lmlnbm9yZUZpcnN0RXZlbnQpIHJldHVybjtcbiAgICAgICAgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuICAgICAgfVxuICAgIH07XG4gICAgYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgY2IpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiByZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYikpO1xuICB9XG59XG4iLCJjb25zdCBudWxsS2V5ID0gU3ltYm9sKCdudWxsJyk7IC8vIGBvYmplY3RIYXNoZXNgIGtleSBmb3IgbnVsbFxuXG5sZXQga2V5Q291bnRlciA9IDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1hbnlLZXlzTWFwIGV4dGVuZHMgTWFwIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuX29iamVjdEhhc2hlcyA9IG5ldyBXZWFrTWFwKCk7XG5cdFx0dGhpcy5fc3ltYm9sSGFzaGVzID0gbmV3IE1hcCgpOyAvLyBodHRwczovL2dpdGh1Yi5jb20vdGMzOS9lY21hMjYyL2lzc3Vlcy8xMTk0XG5cdFx0dGhpcy5fcHVibGljS2V5cyA9IG5ldyBNYXAoKTtcblxuXHRcdGNvbnN0IFtwYWlyc10gPSBhcmd1bWVudHM7IC8vIE1hcCBjb21wYXRcblx0XHRpZiAocGFpcnMgPT09IG51bGwgfHwgcGFpcnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgcGFpcnNbU3ltYm9sLml0ZXJhdG9yXSAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcih0eXBlb2YgcGFpcnMgKyAnIGlzIG5vdCBpdGVyYWJsZSAoY2Fubm90IHJlYWQgcHJvcGVydHkgU3ltYm9sKFN5bWJvbC5pdGVyYXRvcikpJyk7XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBba2V5cywgdmFsdWVdIG9mIHBhaXJzKSB7XG5cdFx0XHR0aGlzLnNldChrZXlzLCB2YWx1ZSk7XG5cdFx0fVxuXHR9XG5cblx0X2dldFB1YmxpY0tleXMoa2V5cywgY3JlYXRlID0gZmFsc2UpIHtcblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoa2V5cykpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBrZXlzIHBhcmFtZXRlciBtdXN0IGJlIGFuIGFycmF5Jyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcHJpdmF0ZUtleSA9IHRoaXMuX2dldFByaXZhdGVLZXkoa2V5cywgY3JlYXRlKTtcblxuXHRcdGxldCBwdWJsaWNLZXk7XG5cdFx0aWYgKHByaXZhdGVLZXkgJiYgdGhpcy5fcHVibGljS2V5cy5oYXMocHJpdmF0ZUtleSkpIHtcblx0XHRcdHB1YmxpY0tleSA9IHRoaXMuX3B1YmxpY0tleXMuZ2V0KHByaXZhdGVLZXkpO1xuXHRcdH0gZWxzZSBpZiAoY3JlYXRlKSB7XG5cdFx0XHRwdWJsaWNLZXkgPSBbLi4ua2V5c107IC8vIFJlZ2VuZXJhdGUga2V5cyBhcnJheSB0byBhdm9pZCBleHRlcm5hbCBpbnRlcmFjdGlvblxuXHRcdFx0dGhpcy5fcHVibGljS2V5cy5zZXQocHJpdmF0ZUtleSwgcHVibGljS2V5KTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge3ByaXZhdGVLZXksIHB1YmxpY0tleX07XG5cdH1cblxuXHRfZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGNvbnN0IHByaXZhdGVLZXlzID0gW107XG5cdFx0Zm9yIChsZXQga2V5IG9mIGtleXMpIHtcblx0XHRcdGlmIChrZXkgPT09IG51bGwpIHtcblx0XHRcdFx0a2V5ID0gbnVsbEtleTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgaGFzaGVzID0gdHlwZW9mIGtleSA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGtleSA9PT0gJ2Z1bmN0aW9uJyA/ICdfb2JqZWN0SGFzaGVzJyA6ICh0eXBlb2Yga2V5ID09PSAnc3ltYm9sJyA/ICdfc3ltYm9sSGFzaGVzJyA6IGZhbHNlKTtcblxuXHRcdFx0aWYgKCFoYXNoZXMpIHtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaChrZXkpO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzW2hhc2hlc10uaGFzKGtleSkpIHtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaCh0aGlzW2hhc2hlc10uZ2V0KGtleSkpO1xuXHRcdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdFx0Y29uc3QgcHJpdmF0ZUtleSA9IGBAQG1rbS1yZWYtJHtrZXlDb3VudGVyKyt9QEBgO1xuXHRcdFx0XHR0aGlzW2hhc2hlc10uc2V0KGtleSwgcHJpdmF0ZUtleSk7XG5cdFx0XHRcdHByaXZhdGVLZXlzLnB1c2gocHJpdmF0ZUtleSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHByaXZhdGVLZXlzKTtcblx0fVxuXG5cdHNldChrZXlzLCB2YWx1ZSkge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzLCB0cnVlKTtcblx0XHRyZXR1cm4gc3VwZXIuc2V0KHB1YmxpY0tleSwgdmFsdWUpO1xuXHR9XG5cblx0Z2V0KGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIHN1cGVyLmdldChwdWJsaWNLZXkpO1xuXHR9XG5cblx0aGFzKGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIHN1cGVyLmhhcyhwdWJsaWNLZXkpO1xuXHR9XG5cblx0ZGVsZXRlKGtleXMpIHtcblx0XHRjb25zdCB7cHVibGljS2V5LCBwcml2YXRlS2V5fSA9IHRoaXMuX2dldFB1YmxpY0tleXMoa2V5cyk7XG5cdFx0cmV0dXJuIEJvb2xlYW4ocHVibGljS2V5ICYmIHN1cGVyLmRlbGV0ZShwdWJsaWNLZXkpICYmIHRoaXMuX3B1YmxpY0tleXMuZGVsZXRlKHByaXZhdGVLZXkpKTtcblx0fVxuXG5cdGNsZWFyKCkge1xuXHRcdHN1cGVyLmNsZWFyKCk7XG5cdFx0dGhpcy5fc3ltYm9sSGFzaGVzLmNsZWFyKCk7XG5cdFx0dGhpcy5fcHVibGljS2V5cy5jbGVhcigpO1xuXHR9XG5cblx0Z2V0IFtTeW1ib2wudG9TdHJpbmdUYWddKCkge1xuXHRcdHJldHVybiAnTWFueUtleXNNYXAnO1xuXHR9XG5cblx0Z2V0IHNpemUoKSB7XG5cdFx0cmV0dXJuIHN1cGVyLnNpemU7XG5cdH1cbn1cbiIsImltcG9ydCBNYW55S2V5c01hcCBmcm9tICdtYW55LWtleXMtbWFwJztcbmltcG9ydCB7IGRlZnUgfSBmcm9tICdkZWZ1JztcbmltcG9ydCB7IGlzRXhpc3QgfSBmcm9tICcuL2RldGVjdG9ycy5tanMnO1xuXG5jb25zdCBnZXREZWZhdWx0T3B0aW9ucyA9ICgpID0+ICh7XG4gIHRhcmdldDogZ2xvYmFsVGhpcy5kb2N1bWVudCxcbiAgdW5pZnlQcm9jZXNzOiB0cnVlLFxuICBkZXRlY3RvcjogaXNFeGlzdCxcbiAgb2JzZXJ2ZUNvbmZpZ3M6IHtcbiAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgc3VidHJlZTogdHJ1ZSxcbiAgICBhdHRyaWJ1dGVzOiB0cnVlXG4gIH0sXG4gIHNpZ25hbDogdm9pZCAwLFxuICBjdXN0b21NYXRjaGVyOiB2b2lkIDBcbn0pO1xuY29uc3QgbWVyZ2VPcHRpb25zID0gKHVzZXJTaWRlT3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpID0+IHtcbiAgcmV0dXJuIGRlZnUodXNlclNpZGVPcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG59O1xuXG5jb25zdCB1bmlmeUNhY2hlID0gbmV3IE1hbnlLZXlzTWFwKCk7XG5mdW5jdGlvbiBjcmVhdGVXYWl0RWxlbWVudChpbnN0YW5jZU9wdGlvbnMpIHtcbiAgY29uc3QgeyBkZWZhdWx0T3B0aW9ucyB9ID0gaW5zdGFuY2VPcHRpb25zO1xuICByZXR1cm4gKHNlbGVjdG9yLCBvcHRpb25zKSA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgdGFyZ2V0LFxuICAgICAgdW5pZnlQcm9jZXNzLFxuICAgICAgb2JzZXJ2ZUNvbmZpZ3MsXG4gICAgICBkZXRlY3RvcixcbiAgICAgIHNpZ25hbCxcbiAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICB9ID0gbWVyZ2VPcHRpb25zKG9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbiAgICBjb25zdCB1bmlmeVByb21pc2VLZXkgPSBbXG4gICAgICBzZWxlY3RvcixcbiAgICAgIHRhcmdldCxcbiAgICAgIHVuaWZ5UHJvY2VzcyxcbiAgICAgIG9ic2VydmVDb25maWdzLFxuICAgICAgZGV0ZWN0b3IsXG4gICAgICBzaWduYWwsXG4gICAgICBjdXN0b21NYXRjaGVyXG4gICAgXTtcbiAgICBjb25zdCBjYWNoZWRQcm9taXNlID0gdW5pZnlDYWNoZS5nZXQodW5pZnlQcm9taXNlS2V5KTtcbiAgICBpZiAodW5pZnlQcm9jZXNzICYmIGNhY2hlZFByb21pc2UpIHtcbiAgICAgIHJldHVybiBjYWNoZWRQcm9taXNlO1xuICAgIH1cbiAgICBjb25zdCBkZXRlY3RQcm9taXNlID0gbmV3IFByb21pc2UoXG4gICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vQXN5bmNQcm9taXNlRXhlY3V0b3I6IGF2b2lkIG5lc3RpbmcgcHJvbWlzZVxuICAgICAgYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChzaWduYWwucmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKFxuICAgICAgICAgIGFzeW5jIChtdXRhdGlvbnMpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgXyBvZiBtdXRhdGlvbnMpIHtcbiAgICAgICAgICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zdCBkZXRlY3RSZXN1bHQyID0gYXdhaXQgZGV0ZWN0RWxlbWVudCh7XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgICAgICAgIGRldGVjdG9yLFxuICAgICAgICAgICAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGlmIChkZXRlY3RSZXN1bHQyLmlzRGV0ZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkZXRlY3RSZXN1bHQyLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNpZ25hbD8uYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICBcImFib3J0XCIsXG4gICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChzaWduYWwucmVhc29uKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgb25jZTogdHJ1ZSB9XG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGRldGVjdFJlc3VsdCA9IGF3YWl0IGRldGVjdEVsZW1lbnQoe1xuICAgICAgICAgIHNlbGVjdG9yLFxuICAgICAgICAgIHRhcmdldCxcbiAgICAgICAgICBkZXRlY3RvcixcbiAgICAgICAgICBjdXN0b21NYXRjaGVyXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoZGV0ZWN0UmVzdWx0LmlzRGV0ZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVzb2x2ZShkZXRlY3RSZXN1bHQucmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKHRhcmdldCwgb2JzZXJ2ZUNvbmZpZ3MpO1xuICAgICAgfVxuICAgICkuZmluYWxseSgoKSA9PiB7XG4gICAgICB1bmlmeUNhY2hlLmRlbGV0ZSh1bmlmeVByb21pc2VLZXkpO1xuICAgIH0pO1xuICAgIHVuaWZ5Q2FjaGUuc2V0KHVuaWZ5UHJvbWlzZUtleSwgZGV0ZWN0UHJvbWlzZSk7XG4gICAgcmV0dXJuIGRldGVjdFByb21pc2U7XG4gIH07XG59XG5hc3luYyBmdW5jdGlvbiBkZXRlY3RFbGVtZW50KHtcbiAgdGFyZ2V0LFxuICBzZWxlY3RvcixcbiAgZGV0ZWN0b3IsXG4gIGN1c3RvbU1hdGNoZXJcbn0pIHtcbiAgY29uc3QgZWxlbWVudCA9IGN1c3RvbU1hdGNoZXIgPyBjdXN0b21NYXRjaGVyKHNlbGVjdG9yKSA6IHRhcmdldC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgcmV0dXJuIGF3YWl0IGRldGVjdG9yKGVsZW1lbnQpO1xufVxuY29uc3Qgd2FpdEVsZW1lbnQgPSBjcmVhdGVXYWl0RWxlbWVudCh7XG4gIGRlZmF1bHRPcHRpb25zOiBnZXREZWZhdWx0T3B0aW9ucygpXG59KTtcblxuZXhwb3J0IHsgY3JlYXRlV2FpdEVsZW1lbnQsIGdldERlZmF1bHRPcHRpb25zLCB3YWl0RWxlbWVudCB9O1xuIl0sIm5hbWVzIjpbImRlZmluaXRpb24iLCJfYSIsIl9iIiwiY29udGVudCIsInByaW50IiwibG9nZ2VyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBTyxXQUFTLG9CQUFvQkEsYUFBWTtBQUM5QyxXQUFPQTtBQUFBLEVBQ1Q7QUMyQk8sUUFBTSxtQkFBb0c7QUFBQSxJQUMvRyxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixVQUFVLENBQUMsZUFBZSxpQkFBaUI7QUFBQSxNQUMzQyxXQUFXO0FBQUEsUUFDVCxPQUFPLENBQUMsb0JBQW9CLHlDQUF5QztBQUFBLE1BQUE7QUFBQSxJQUN2RTtBQUFBLElBRUYsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sVUFBVSxDQUFDLFdBQVc7QUFBQSxNQUN0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
