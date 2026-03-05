# 我是如何在 Chrome 插件里"白嫖" Gemini API 的（无需 API Key）

> **本文适合人群**：对 Chrome 扩展开发、AI 产品集成、或 Web 协议逆向有兴趣的朋友。代码语言：JavaScript。

---

## 起因：API 费用是个门槛

我在开发一款 Chrome 插件 [Prompt Ark](https://github.com/keyonzeng/prompt_ark)，它的核心功能是帮用户管理、优化和翻译 AI Prompt（提示词）。

其中有一个功能：**用 AI 把 Prompt 的标题、内容和标签翻译成目标语言**。

如果接入 Gemini API 或 OpenAI，需要用户自己申请 API Key 并充值，对普通用户来说门槛较高。

但我注意到一件事：**只要用户有 Google 账号，他们就已经能在 gemini.google.com 免费使用 Gemini 了**。那么，插件能否直接复用这个浏览器 session，调用 Gemini Web 的内部接口呢？

答案是可以的——但这条路并不平坦。

---

## 原理：Session 复用 + 协议复现

### 第一步：从页面 HTML 拿到认证凭证

Gemini 的 Web 端基于 Google 的 **WIZ 框架**（一种在 HTML 中内嵌全局配置的机制）。访问 `gemini.google.com/app` 时，页面 HTML 里会包含几个关键的鉴权 token：

```javascript
function extractWizValue(key, html) {
  const match = new RegExp(`"${key}":"([^"]+)"`).exec(html);
  return match?.[1] || null;
}

const atValue = extractWizValue('SNlM0e', html); // XSRF 防伪造 token，放在 POST body 里
const blValue = extractWizValue('cfb2h',  html); // Build Label，放在 URL 的 ?bl= 参数里
const fSid    = extractWizValue('FdrFJe', html); // Session ID，放在 URL 的 ?f.sid= 参数里
```

这三个值分别用在不同的地方，少一个都会导致请求失败。

---

### 第二步：构造"同步双写"的请求

这里有一个坑，让我排查了整整一个晚上。

Google 的接口要求两个**随机标识符**必须**同时出现在 HTTP 请求头和 POST body 里，且值完全一致**，否则直接返回 `400 Bad Request`：

```javascript
// 每次请求生成新的随机值
const traceId   = randomHex16();               // 16 位小写十六进制字符串
const requestId = crypto.randomUUID().toUpperCase(); // 标准 UUID 大写

// 注入请求头（x-goog-ext 系列是 Google 内部的 gRPC 扩展头）
headers['x-goog-ext-525001261-jspb'] = `[1,null,null,null,"${MODEL_ID}",null,null,0,[4],null,null,2]`;
headers['x-goog-ext-525005358-jspb'] = `["${requestId}",1]`;
```

同时，POST body 里的 `f.req` 参数也必须在对应位置包含这两个值：

```javascript
// f.req 的内层是一个 68 个元素的稀疏数组，大部分为 null
const inner = new Array(68).fill(null);
inner[0]  = [prompt, 0, null, null, null, null, 0]; // 用户消息
inner[1]  = ['en'];                                  // 语言
inner[4]  = traceId;    // ← 必须和 x-goog-ext-525001261-jspb[4] 一致
inner[59] = requestId;  // ← 必须和 x-goog-ext-525005358-jspb[0] 一致
```

这是一种**客户端侧反伪造机制**——两处不同步，请求即被拒。

---

### 第三步：POST 到 BardChatUi 接口

最终的请求结构如下：

```
POST https://gemini.google.com/u/0/_/BardChatUi/data/
         assistant.lamda.BardFrontendService/StreamGenerate
  ?bl=boq_assistant-bard-web-server_20260301.05_p0
  &f.sid=-6592644896404939235
  &hl=zh-CN
  &_reqid=582341
  &rt=c

Body（application/x-www-form-urlencoded）:
  at=<SNlM0e XSRF token>
  &f.req=<上面构造的 JSON 数组>
```

---

### 第四步：解析流式响应

响应是逐行的 JSON 流，每行以 `)]}'\n` 开头（Google 防止 XSSI 攻击的惯用前缀），需要层层解套：

```javascript
function parseStreamLine(line) {
  const clean = line.replace(/^\)\]\}'/, '').trim();
  const envelope = JSON.parse(clean);
  const payload  = JSON.parse(envelope[0][2]);   // 第3个字段是内层 JSON 字符串
  const text     = payload[4][0][1][0];           // 深层嵌套取出文本
  return text;
}
```

取最后一个有效响应行即为完整回复。

---

## 踩过的坑：协议悄悄变了

这套方法我最初实现时是正常的，后来某天突然开始报错。原因是 **Google 在没有任何公告的情况下更新了内部协议**。

通过在 Gemini 页面注入 `fetch` 拦截器、对比真实请求和我代码发出的请求，逐步定位到了以下变化：

| 字段 | 旧行为 | 新行为 |
|---|---|---|
| `at` XSRF Token | 在 POST body 中发送 | 仍然必须发送（我误以为已移除）|
| `x-goog-ext-525001261-jspb` | 只含 Model ID | 增加 `traceId`，必须与 `f.req inner[4]` 一致 |
| `x-goog-ext-525005358-jspb` | 不存在 | 新增，随机 UUID 必须与 `f.req inner[59]` 一致 |
| `f.req` 内层结构 | 3 个元素 | 扩展为 68 个元素的稀疏数组 |
| URL 参数 | 只有 `bl` + `_reqid` | 新增 `f.sid`（session ID）和 `hl`（语言）|

**调试方法**：在 Gemini 页面执行以下 JS，拦截真实请求：

```javascript
window.fetch = new Proxy(window.fetch, {
  apply(target, thisArg, args) {
    const [url, opts] = args;
    if (url?.includes?.('StreamGenerate')) {
      console.log('[CAPTURED]', url);
      console.log('[BODY]', opts?.body?.toString?.());
    }
    return Reflect.apply(target, thisArg, args);
  }
});
```

然后在浏览器里发一条消息，控制台就会打出完整的原始请求。和自己的代码对比，差异一目了然。

---

## 另一个小坑：响应里的 JSON 被 Markdown 包裹了

当我让 Gemini 输出 JSON 格式的翻译结果时，它经常会额外加上 Markdown 代码块：

```
```json
{"title": "...", "content": "..."}
```
```

直接用正则 `/\{[\s\S]*\}/` 有时候会匹配失败。完整的处理方式：

```javascript
// 去掉首尾代码块标记
result = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
// 根据第一个 { 和最后一个 } 提取，避免贪婪匹配踩坑
return JSON.parse(result.slice(result.indexOf('{'), result.lastIndexOf('}') + 1));
```

---

## 这样做"合规"吗？

客观回答：**灰色地带**。

- 你访问的是自己账号的 Gemini 会话，没有爬取他人数据
- 调用频率和正常用网页一样，不构成滥用
- 是否违反 Google ToS：取决于对"自动化访问"条款的解读

实际上 Gemini 的这个内部接口自 Bard 时代（2023 年）就一直存在，Google 对个人工具的使用态度相对宽松。

---

## 这样做的价值是什么？

**对用户**：
- 零配置 — 已登录 Gemini 就能直接用，不需要申请任何 Key
- 零费用 — 利用 Gemini 免费额度，对低频 AI 功能完全够用
- 同等质量 — 和网页版完全相同的模型

**对开发者**：
- 深度理解 Google 现代 Web 应用的认证与通信机制
- `fetch` 拦截器调试技术适用于任何黑盒 Web API

---

## 完整代码

完整的 `gemini-web.js` Driver 开源在 [Prompt Ark](https://github.com/keyonzeng/prompt_ark/blob/main/lib/gemini-web.js)，欢迎 Star 或 PR（协议下次更新求告知 🙏）。

---

**标签**：`Chrome插件` `Gemini` `JavaScript` `前端开发` `AI工具` `逆向工程`
