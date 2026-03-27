import { providerManager } from '../provider';
import { safeParseJSON } from '../provider';
import { callGeminiWeb } from '../providers/gemini-web';
import type { RuntimeProvider } from '../types';

export const SHARE_PLATFORM_NAMES = ['twitter', 'reddit', 'zhihu', 'wechat', 'xiaohongshu', 'linkedin'] as const;
export type SharePlatform = (typeof SHARE_PLATFORM_NAMES)[number];

export interface ShareEditorConfig {
  url: string;
  titleSelectors: string[];
  contentSelectors: string[];
  publishSelector?: string;
  preClickSelector?: string;
  abstractSelectors?: string[];
}

export const SOCIAL_EDITORS: Record<SharePlatform, ShareEditorConfig> = {
  zhihu: {
    url: 'https://zhuanlan.zhihu.com/write',
    titleSelectors: ['textarea.WriteIndex-titleInput', 'textarea[placeholder*="标题"]'],
    contentSelectors: ['.public-DraftEditor-content', '.Editable-content', '[contenteditable="true"]'],
    publishSelector: 'button.PublishPanel-stepOneButton, button[data-tooltip="发布"]',
  },
  wechat: {
    url: 'https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0',
    titleSelectors: ['textarea#title', 'textarea.js_title', 'textarea[placeholder*="标题"]'],
    contentSelectors: ['div.ProseMirror', '[contenteditable="true"]'],
    abstractSelectors: ['textarea#js_description'],
    publishSelector: 'button#js_send, a.preview_send_btn',
  },
  xiaohongshu: {
    url: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
    preClickSelector: 'button.new-btn',
    titleSelectors: ['textarea.d-text[placeholder="输入标题"]', 'textarea[placeholder*="标题"]'],
    contentSelectors: ['.tiptap.ProseMirror', '.ProseMirror', '[contenteditable="true"]'],
    publishSelector: 'button.el-button--primary, button:has(.publishBtn)',
  },
  linkedin: {
    url: 'https://www.linkedin.com/feed/?shareActive=true',
    titleSelectors: [],
    contentSelectors: ['div.ql-editor[contenteditable="true"]', '[role="textbox"][aria-multiline="true"]', '[contenteditable="true"]'],
    publishSelector: 'button.share-actions__primary-action, button.share-box-scaffold__primary-btn',
  },
  twitter: {
    url: 'https://twitter.com/compose/tweet',
    titleSelectors: [],
    contentSelectors: ['[data-testid="tweetTextarea_0"]', '[contenteditable="true"]'],
  },
  reddit: {
    url: 'https://www.reddit.com/submit',
    titleSelectors: ['textarea[placeholder*="Title"]'],
    contentSelectors: ['[role="textbox"]', '[contenteditable="true"]'],
  },
};

export const VARIANT_LABELS = ['concise', 'contract', 'full-spec'] as const;

export interface ArticleSharePlatformConfig {
  promptName: string;
  lang: string;
}

export const ARTICLE_SHARE_PLATFORMS: Record<SharePlatform, ArticleSharePlatformConfig> = {
  zhihu: { promptName: 'share-article-zhihu', lang: 'zh' },
  reddit: { promptName: 'share-article-reddit', lang: 'en' },
  wechat: { promptName: 'share-article-wechat', lang: 'zh' },
  linkedin: { promptName: 'share-article-linkedin', lang: 'en' },
  xiaohongshu: { promptName: 'share-article-xiaohongshu', lang: 'zh' },
  twitter: { promptName: 'share-article-twitter', lang: 'en' },
};

export interface ShareTextResult {
  text: string;
  title?: string;
}

export interface ArticleShareResult {
  title?: string;
  body: string;
}

const DEFAULT_SHARE_PROMPTS: Record<SharePlatform, string> = {
  twitter: `Write a tweet sharing an AI prompt template. Max 280 characters. Make someone stop scrolling because of a concrete claim.

Input: JSON with title (prompt name), content (full prompt text), url (install link).
Output: JSON {"text":"..."}

Rules:
- Lead with a specific claim — number, comparison, concrete outcome
- Sound like a person, not a press release
- 1 emoji max, at start
- End with install URL + 1-2 hashtags
- Match prompt language

Banned: "amazing", "incredible", "game-changer", "must-have", "🔥🔥🔥", "Did you know...?", "check out"`,

  reddit: `Write a Reddit self-post sharing an AI prompt template. Reader should think "this is genuinely useful" — not feel like they're reading a product pitch.

Input: JSON with title, content, url.
Output: JSON {"title":"...","body":"..."}

Rules:
- Title (≤120 chars): [Category] concrete benefit. No clickbait.
- Show the prompt — blockquote 2-3 interesting lines, follow with 1-2 sentences explaining the design
- Include a before/after: one-line prompt vs this template → concrete difference
- End with install link + genuine discussion question
- Body must have ≥2 ## headers and ≥3 paragraphs

Voice: Use "I". Casual transitions. Imperfect phrasing is OK.
Banned: "amazing", "incredible", "game-changer", "check out my tool", "delve", "landscape", "leverage"`,

  zhihu: `为一个 AI prompt 模板写知乎专栏风格的拆解文章。读者看完觉得"学到了 prompt 设计的底层逻辑"。

输入: JSON 包含 title、content、url
输出: JSON {"text":"..."}

开头模式（3选1）:
- 对比开场: "用 ChatGPT 写催款邮件，一句话 prompt 出来的像模板——加了两个约束后..."
- 具体问题开场: "大多数人用 AI 写邮件，prompt 就一句话..."
- 数字开场: "同一个任务，一句话 prompt 需要改 3 轮，这个模板一次过。"

禁止: "你有没有遇到过"、"今天给大家分享"、"在 AI 时代"、"很多人还在"

品质标准:
1. 用 > 引用 prompt 关键片段（≤3段），每段后紧跟1-2句拆解
2. 至少1个对比：用这个prompt vs 一句话直接问
3. 至少1个独立判断
4. 结尾：安装链接自然嵌入

text 必须包含完整 markdown：## 标题、> 引用、**加粗**、分段
必须有 ≥3 个 ## 和 ≥3 个 \\n\\n
800-1200字`,

  wechat: `为一个 AI prompt 模板写微信公众号风格的实用文章。读者通勤时看，3-5分钟注意力。看完觉得"学到了一招"。

输入: JSON 包含 title、content、url
输出: JSON {"text":"..."}

开头模式（3选1）:
- 场景开场: "上周帮同事改他的市场分析 prompt..."
- 数字开场: "同一个任务，加两个约束后，从改 3 轮变成一次过。"
- 反常识开场: "给 AI 的指令越短，你花的总时间反而越长。"

禁止: "你是不是也遇到过"、"今天给大家分享"、"关注收藏"

品质标准:
1. 标题: 具体场景 + 结果
2. 至少2/3篇幅是通用知识
3. 用 > 引用 prompt 关键片段，紧跟拆解
4. 结尾：安装链接自然嵌入

text 必须包含 markdown：##、>、**加粗**、分段
必须有 ≥3 个 ## 和 ≥3 个 \\n\\n
800-1200字`,

  xiaohongshu: `为一个 AI prompt 模板写小红书干货笔记。3秒抓住注意力，读完觉得"收藏了下次用"。

输入: JSON 包含 title、content、url
输出: JSON {"text":"..."}

开头模式（2选1）:
- 操作开场: "1 个 prompt 让写周报从 2 小时变 10 分钟——关键是加了这句话"
- 对比开场: "直接让 AI 写 vs 用这个模板写，差距不是一点半点"

禁止: "家人们"、"你有没有发现"、"今天分享"

品质标准:
1. 标题: 数字 + 具体结果 + 1 emoji
2. 每个技巧必须可操作
3. 尾部固定: "💬 完整 prompt 模板 → 链接见评论区"

text 必须有 \\n\\n 分段、**加粗**
每段1-3句，禁止超过3句的文字块
emoji段首锚点，总数 ≤6
步骤用数字编号
必须有 ≥3 个 \\n\\n
250-350字`,

  linkedin: `Write a LinkedIn post sharing an AI prompt template. First-person, professional but human.

Input: JSON with title, content, url.
Output: JSON {"text":"..."}

Opening patterns:
- Data opening: "📊 I tracked 30 AI-assisted tasks — half with one-line prompts, half with this template..."
- Discovery opening: "💡 The biggest quality jump came from one line in this prompt..."
- Honest admission: "I used to think structured prompts were overkill. Then I measured."

Never: "Excited to share", "Thrilled to announce", "AI is transforming."

Quality criteria:
1. First 2 lines contain a concrete detail
2. Show 1 design choice from the prompt and explain why it matters
3. Include a before/after comparison
4. Each paragraph: 1-2 sentences
5. End with: specific discussion question + "Link in first comment 👇"
6. Hashtags: 3-4, separate final line

Banned: "game-changer", "revolutionary", "excited to share", "thrilled", "delve", "incredible", "leverage"

Formatting: \\n\\n between every paragraph, **bold** for key phrases, max 2 bold per post, 2-3 emoji max`,
};

async function loadSharePrompt(platform: SharePlatform): Promise<string> {
  return DEFAULT_SHARE_PROMPTS[platform];
}

export async function generateShareText(
  promptContent: string,
  title: string,
  url: string,
  platform: SharePlatform,
  providerOverride?: RuntimeProvider
): Promise<ShareTextResult | null> {
  if (!SHARE_PLATFORM_NAMES.includes(platform)) return null;

  const provider = providerOverride ?? (await providerManager.getActiveProvider());
  if (!provider) return null;

  const systemPrompt = await loadSharePrompt(platform);
  const userContent = JSON.stringify({
    title,
    content: promptContent.substring(0, 800),
    url,
  });

  const isReddit = platform === 'reddit';

  try {
    return await executeShareGeneration(
      systemPrompt,
      userContent,
      provider,
      isReddit
    );
  } catch {
    return null;
  }
}

async function executeShareGeneration(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider,
  isReddit: boolean
): Promise<ShareTextResult | null> {
  switch (provider.type) {
    case 'gemini':
      return shareWithGeminiAPI(systemPrompt, userContent, provider, isReddit);
    case 'openai':
    case 'openai-compatible':
      return shareWithOpenAI(systemPrompt, userContent, provider, isReddit);
    case 'gemini-web':
      return shareWithGeminiWeb(systemPrompt, userContent, isReddit);
    default:
      return null;
  }
}

async function shareWithGeminiAPI(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider,
  isReddit: boolean
): Promise<ShareTextResult | null> {
  const model = provider.model || 'gemini-2.0-flash';
  const apiKey = provider.apiKey;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const schemaProps = isReddit
    ? {
        title: { type: 'string', description: 'Reddit post title' },
        body: { type: 'string', description: 'Reddit post body in markdown' },
      }
    : { text: { type: 'string', description: 'Generated share content' } };

  const schemaRequired = isReddit ? ['title', 'body'] : ['text'];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: {
          responseModalities: ['TEXT'],
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: schemaProps,
            required: schemaRequired,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API ${response.status}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return raw ? (JSON.parse(raw) as ShareTextResult) : null;
}

async function shareWithOpenAI(
  systemPrompt: string,
  userContent: string,
  provider: RuntimeProvider,
  isReddit: boolean
): Promise<ShareTextResult | null> {
  const apiKey = provider.apiKey;
  const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
  const model = provider.model || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const jsonHint = isReddit
    ? 'Return JSON only: {"title":"...","body":"..."}'
    : 'Return JSON only: {"text":"..."}';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt + '\n\n' + jsonHint },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API ${response.status}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) return null;

  const parsed = JSON.parse(raw);
  return isReddit
    ? { text: parsed.body, title: parsed.title }
    : { text: parsed.text };
}

async function shareWithGeminiWeb(
  systemPrompt: string,
  userContent: string,
  isReddit: boolean
): Promise<ShareTextResult | null> {
  const jsonHint = isReddit
    ? 'Return JSON only: {"title":"...","body":"..."}'
    : 'Return JSON only: {"text":"..."}';

  const webPrompt = `${systemPrompt}

${jsonHint}

Prompt data:
\`\`\`
${userContent}
\`\`\``;

  let result = await callGeminiWeb(webPrompt);
  result = result
    .replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '')
    .trim();

  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  return isReddit
    ? { text: parsed.body, title: parsed.title }
    : { text: parsed.text };
}

export async function generateArticleShareText(
  sourceText: string,
  platform: SharePlatform,
  providerOverride?: RuntimeProvider
): Promise<ArticleShareResult | null> {
  const platformConfig = ARTICLE_SHARE_PLATFORMS[platform];
  if (!platformConfig) return null;

  const provider = providerOverride ?? (await providerManager.getActiveProvider());
  if (!provider) return null;

  const userContent = sourceText.substring(0, 8000);

  try {
    return await executeArticleShare(
      platformConfig,
      userContent,
      provider
    );
  } catch {
    return null;
  }
}

async function executeArticleShare(
  config: ArticleSharePlatformConfig,
  userContent: string,
  provider: RuntimeProvider
): Promise<ArticleShareResult | null> {
  const schemaProps = {
    title: { type: 'string', description: 'Article title' },
    body: { type: 'string', description: 'Article body' },
  };

  switch (provider.type) {
    case 'gemini': {
      const model = provider.model || 'gemini-2.0-flash';
      const apiKey = provider.apiKey;

      if (!apiKey) throw new Error('Gemini API key not configured');

      const systemPrompt = await loadSharePrompt(config.promptName as SharePlatform);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userContent }] }],
            generationConfig: {
              responseModalities: ['TEXT'],
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'object',
                properties: schemaProps,
                required: ['body'],
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API ${response.status}`);
      }

      const data = await response.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return raw ? (JSON.parse(raw) as ArticleShareResult) : null;
    }

    case 'openai':
    case 'openai-compatible': {
      const apiKey = provider.apiKey;
      const baseUrl = provider.baseUrl || 'https://api.openai.com/v1';
      const model = provider.model || 'gpt-4o-mini';

      if (!apiKey) throw new Error('OpenAI API key not configured');

      const systemPrompt = await loadSharePrompt(config.promptName as SharePlatform);
      const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt + '\n\n' + jsonHint },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API ${response.status}`);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      return raw ? (JSON.parse(raw) as ArticleShareResult) : null;
    }

    case 'gemini-web': {
      const systemPrompt = await loadSharePrompt(config.promptName as SharePlatform);
      const jsonHint = 'Return JSON only: {"title":"...","body":"..."}';
      const webPrompt = `${systemPrompt}

${jsonHint}

Source content to rewrite:
\`\`\`
${userContent}
\`\`\``;

      let result = await callGeminiWeb(webPrompt);
      result = result
        .replace(/https?:\/\/[^\s]*googleusercontent\.com\/image_generation_content[^\s]*/g, '')
        .trim();
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      return jsonMatch ? safeParseJSON<ArticleShareResult>(jsonMatch[0]) : null;
    }

    default:
      return null;
  }
}

export function buildFallbackText(platform: SharePlatform, title: string, url: string, prompt?: { content?: string; category?: string }): string {
  const content = prompt?.content || '';
  const category = prompt?.category || 'AI';

  switch (platform) {
    case 'zhihu': {
      const preview = content.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 150);
      const varCount = (content.match(/\{\{([^}]+)\}\}/g) || []).length;

      return `# ${title}

很多人用AI的效果不好，核心原因往往不是AI不行，而是prompt写得太随意。

一个好的prompt通常包含三个要素：**角色设定**、**任务约束**、**输出格式**。

${preview.length > 20 ? `\n以这个prompt为例：\n\n> ${preview}...\n` : ''}
${varCount > 0 ? `它还设计了${varCount}个变量插槽，可以根据不同场景快速填入。\n` : ''}
---
完整prompt模板：${url}`;
    }

    case 'wechat':
      return `## 用AI提效，关键不在工具，在方法

你有没有遇到过这种情况：同样用ChatGPT，别人几分钟搞定的事，你来回改了半小时还不满意？

差距不在AI，在于怎么跟它"说话"。今天分享3个立刻能用的技巧：

## 技巧一：先给AI一个身份

与其说"帮我写个方案"，不如说"你是一位有10年经验的${category}专家"。给AI角色设定，输出质量会有质的提升。

## 技巧二：约束输出格式

直接说"用markdown表格对比3个方案的优劣势"，比"分析一下"清晰100倍。AI最怕模糊指令。

## 技巧三：用现成的好模板

「${title}」就是一个设计好的prompt模板，把上面两个技巧都融入了结构里，填入变量就能直接用。

---

完整prompt模板 → ${url}`;

    case 'xiaohongshu':
      return `3个让${category}效率翻倍的AI使用技巧 🔥

📌 技巧1：给AI一个专业身份
不要 说"帮我写"，而是说"你是XX领域专家"
效果立刻不一样！

💡 技巧2：指定输出格式
"用表格对比" > "分析一下"
AI最怕你说得不清楚

✅ 技巧3：用好prompt模板
「${title}」就是一个现成的好模板
角色+约束+格式都设计好了

⚡ 这3个方法不管用哪个AI都有效
ChatGPT / Gemini / Claude 通吃

💬 完整prompt模板 → 链接见评论区`;

    case 'twitter': {
      const firstLines = content.split(/\r?\n/).filter(l => l.trim()).slice(0, 2).join(' ');
      const preview = firstLines.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 100);
      const varMatches = content.match(/\{\{([^}]+)\}\}/g) || [];

      const lines = [`🧠 "${title}"`];
      if (preview.length > 0) lines.push(`\n\n💬 "${preview}${content.length > 100 ? '...' : ''}"`);
      if (varMatches.length > 0) lines.push(`\n\n⚡ ${varMatches.length} variable${varMatches.length > 1 ? 's' : ''} · customizable`);
      lines.push(`\n\n🔗 One-click install → ${url}`);
      lines.push(`\n#PromptEngineering #AI`);

      return lines.join('');
    }

    case 'reddit': {
      const preview = content
        .replace(/\{\{@[^}]+\}\}/g, '[auto-filled]')
        .replace(/\{\{([^}:]+):[^}]*\|[^}]*\}\}/g, '[choose: $1]')
        .replace(/\{\{([^}:]+):[^}]+\}\}/g, '[$1]')
        .replace(/\{\{([^}]+)\}\}/g, '[$1]')
        .substring(0, 300);

      return `**Prompt preview:**\n\n> ${preview}${content.length > 300 ? '...' : ''}\n\n---\n\n🔗 **[One-click install with Prompt Ark](${url})**`;
    }

    case 'linkedin': {
      const varCount = (content.match(/\{\{([^}]+)\}\}/g) || []).length;
      const lines = [`I spent way too long on ${category.toLowerCase()} tasks last week.`];
      lines.push(`\nThen I found a structured prompt template that cut the time in half.\n`);
      lines.push(`Here's what makes "${title}" different:\n`);
      if (varCount > 0) lines.push(`📊 ${varCount} customizable variable${varCount > 1 ? 's' : ''} — adapts to your specific context`);
      lines.push(`\nThe key insight: good AI output is 80% prompt structure, 20% the model itself.`);
      lines.push(`\nLink in the first comment 👇`);

      return lines.join('\n');
    }

    default:
      return '';
  }
}
