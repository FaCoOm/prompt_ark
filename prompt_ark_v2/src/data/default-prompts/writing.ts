import type { Prompt } from '@/types/prompt';

export const writingPrompts: Prompt[] = [
  {
    id: 'writing-001',
    title: 'English Translator & Improver',
    content: `Translate and elevate the following text into polished, literary English:

{{text}}

Rules:
- Detect the source language automatically
- Replace basic vocabulary with elegant, upper-level alternatives
- Preserve the original meaning and intent
- Output ONLY the improved translation, nothing else

Do NOT add explanations, notes, or commentary.`,
    category: 'Writing',
    tags: ['translation', 'english', 'grammar'],
    shortcut: 'trans',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-002',
    title: 'Writing Coach',
    content: `Review this writing and provide detailed feedback:

{{text}}

Evaluate on 5 dimensions (rate each 1-10):
1. **Clarity**: Is the message immediately understandable?
2. **Structure**: Is the flow logical?
3. **Engagement**: Does it hold attention?
4. **Grammar**: Any errors?
5. **Tone**: Is it appropriate for the audience?

For each dimension scoring below 7, provide a specific rewrite example.

Do NOT rewrite the entire text. Only show targeted improvements.`,
    category: 'Writing',
    tags: ['writing', 'tutor', 'feedback'],
    shortcut: 'coach',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-003',
    title: 'Blog Post Writer',
    content: `Write a 1200-1500 word blog post on:

{{topic}}

Structure:
- **Headline**: Attention-grabbing, under 70 chars, includes a power word
- **Hook** (first 2 sentences): Surprising stat, question, or bold claim
- **Body**: 3-4 sections with H2 subheadings, each making one key point
- **Conclusion**: Summarize + clear CTA

SEO requirements:
- Include the primary keyword in H1 and first 100 words
- Use 2-3 related keywords naturally
- Paragraphs max 3 sentences each

Do NOT use clichés like "In today's world" or "Let's dive in."`,
    category: 'Writing',
    tags: ['blog', 'SEO', 'content'],
    shortcut: 'blog',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-004',
    title: 'Copywriter',
    content: `Write high-converting marketing copy for:

Product/Service: {{product}}
Target Audience: {{audience}}

Deliver these 4 assets:

1. **Headline** (max 10 words, benefit-focused)
2. **Subheadline** (1 sentence expanding on the headline)
3. **Body copy** (150 words max, using PAS framework: Problem → Agitate → Solution)
4. **CTA** (single action, creates urgency)

Do NOT use hype words ("revolutionary", "game-changing"). Focus on specific, believable benefits.`,
    category: 'Writing',
    tags: ['copywriting', 'marketing', 'ads'],
    shortcut: 'copy',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-005',
    title: 'Story Generator',
    content: `Write a compelling short story based on this premise:

{{request}}

Requirements:
- 800-1200 words
- Strong opening hook (first sentence must create tension or curiosity)
- At least one plot twist
- Show, don't tell (use dialogue and sensory detail)
- Satisfying but not predictable ending

Do NOT start with weather descriptions or "Once upon a time." Do NOT explain the moral.`,
    category: 'Writing',
    tags: ['story', 'narrative', 'creative'],
    shortcut: 'story',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-006',
    title: '公众号爆款标题',
    content: `为以下文章内容生成 10 个微信公众号标题：

文章主题：{{topic}}
目标读者：{{audience}}

标题要求：
- 每个标题不超过 22 个字（微信标题最佳长度）
- 运用至少 3 种不同的标题技法：
  * 数字型："5个方法让你..."
  * 悬念型："大多数人不知道的..."
  * 痛点型："为什么你总是..."
  * 对比型："从XX到XX，只需..."
  * 权威型："XX专家推荐的..."
- 每个标题后标注使用的技法

禁止使用标题党（不要夸大事实）。禁止使用"震惊！""速看！"等低质词汇。`,
    category: 'Writing',
    tags: ['标题', '公众号', '自媒体'],
    shortcut: 'title',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-007',
    title: '小红书笔记撰写',
    content: `撰写一篇小红书种草笔记：

产品/主题：{{topic}}

格式：
**标题**：带 emoji，口语化，14 字以内
**正文**（300-500 字）：
- 第一人称真实体验感
- 分段短句，每段 2-3 句
- 适当使用 emoji 分隔段落
- 穿插 2-3 个使用场景
- 结尾互动引导（"你们觉得呢？"）

**标签**：10 个相关标签

语气：闺蜜分享式，亲切真实。禁止使用广告腔（"强烈推荐""必入"等）。要像真实用户而不是广告商。`,
    category: 'Writing',
    tags: ['小红书', '种草', '社交媒体'],
    shortcut: 'xhs',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-008',
    title: '中文润色大师',
    content: `润色以下中文文本，提升文笔质量：

{{text}}

润色维度：
1. **用词精准**：替换模糊/口语化用词为更精确的书面表达
2. **句式优化**：长句拆短，消除冗余，增加节奏感
3. **逻辑衔接**：添加恰当的过渡词和逻辑连接
4. **修辞提升**：在关键处适度使用比喻、排比等修辞

输出：
- 润色后的全文
- 修改对照表（列出 5 处最关键的修改及理由）

保留原文的核心观点和语气基调。不要过度文艺化导致文风割裂。`,
    category: 'Writing',
    tags: ['润色', '写作', '文笔'],
    shortcut: 'polish',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-009',
    title: '论文摘要生成',
    content: `为以下论文内容生成中英文摘要：

{{paper_content}}

中文摘要（300 字以内）：
- 研究背景（1 句）
- 研究方法（1-2 句）
- 主要发现（2-3 句）
- 研究意义（1 句）

英文 Abstract（200 words 以内）：
- Background, Methods, Results, Conclusion 四段式

关键词：中文 5 个 + 英文 5 个

不要添加论文中没有的结论。摘要必须忠实于原文内容。`,
    category: 'Writing',
    tags: ['论文', '摘要', '学术'],
    shortcut: 'abstract',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-010',
    title: '文案改写大师',
    content: `将以下内容改写为不同风格的版本：

原文：{{text}}

生成 3 个版本：

**版本 A — 正式商务风**
适用场景：报告、提案、汇报
改写要求：严谨、数据化、无情绪词

**版本 B — 社交媒体风**
适用场景：微博、朋友圈、公众号
改写要求：口语化、有互动感、带 emoji

**版本 C — 故事叙事风**
适用场景：演讲、品牌传播
改写要求：有画面感、有情感共鸣、有节奏

三个版本的核心信息必须一致。不要改变事实，只改变表达方式。`,
    category: 'Writing',
    tags: ['改写', '文案', '风格'],
    shortcut: 'rewrite',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-011',
    title: '朋友圈文案',
    content: `写一条朋友圈文案：

场景：{{scenario}}

要求：
- 文字部分：3-5 行，有留白感
- 风格选择（根据场景自动判断）：
  * 生活记录：温暖真实
  * 工作成就：低调但有分量
  * 旅行分享：有意境不俗套
  * 美食分享：有食欲感
- 结尾不要用问句求互动
- 可以适度使用 1-2 个 emoji

提供 3 个版本供选择。

禁止使用"岁月静好""诗和远方""人间值得"等烂大街文案。`,
    category: 'Writing',
    tags: ['朋友圈', '文案', '社交'],
    shortcut: 'moment',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-012',
    title: '短视频脚本',
    content: `撰写一个短视频脚本：

主题：{{topic}}
时长：{{duration:60秒}}
平台：{{platform:抖音}}

脚本格式：
| 时间 | 画面描述 | 台词/旁白 | 字幕文案 | BGM建议 |
|---|---|---|---|---|

要求：
- 前 3 秒必须有强钩子（悬念、冲突或反常识）
- 每 10 秒一个信息节奏点
- 结尾有明确的行动引导（关注/点赞/评论）
- 口播台词口语化，每句不超过 15 字

禁止平铺直叙。如果主题本身不够吸引人，要找到反直觉的切入角度。`,
    category: 'Writing',
    tags: ['短视频', '脚本', '抖音'],
    shortcut: 'video',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-013',
    title: '新闻稿撰写',
    content: `撰写一篇新闻稿：

事件：{{event}}
发布方：{{organization}}

结构：
1. **标题**：简洁有力，概括核心事件
2. **导语**：5W1H 要素齐全（Who, What, When, Where, Why, How）
3. **正文**：按重要性倒金字塔排列
4. **引言**：插入 1-2 条关键人物引言
5. **背景**：简要说明事件背景
6. **结尾**：联系方式和更多信息

风格：客观、事实导向、避免宣传腔。`,
    category: 'Writing',
    tags: ['新闻稿', 'PR', '媒体'],
    shortcut: 'pr',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-014',
    title: '演讲稿撰写',
    content: `撰写一篇演讲稿：

主题：{{topic}}
时长：{{duration:10分钟}}
听众：{{audience}}

结构：
1. **开场**：钩子（故事、问题、数据）
2. **主体**：3 个核心论点，每个配一个案例
3. **转折**：指出常见误区或提出反常识观点
4. **升华**：将主题提升到更高层次
5. **结尾**：金句 + 行动号召

语言风格：口语化、有节奏感、适合朗读。每段不超过 3 句话。`,
    category: 'Writing',
    tags: ['演讲', '演讲稿', '公众'],
    shortcut: 'speech',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-015',
    title: '产品说明书',
    content: `撰写产品说明书：

产品：{{product}}
目标用户：{{user}}

结构：
1. **产品概述**：一句话描述核心价值
2. **功能特点**：列出 5-7 个核心功能
3. **使用步骤**：编号列表，每步配简短说明
4. **注意事项**：安全提示和常见问题
5. **规格参数**：技术规格表格

风格：简洁明了、避免术语、用户导向。`,
    category: 'Writing',
    tags: ['产品', '说明书', '文档'],
    shortcut: 'manual',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-016',
    title: '求职信撰写',
    content: `撰写一封求职信（Cover Letter）：

目标岗位：{{job}}
公司：{{company}}
我的亮点：{{highlights}}

结构：
1. **开头**：说明应聘岗位和获知渠道
2. **匹配度**：我的哪些经验与该岗位匹配
3. **差异化**：我能带来什么独特价值
4. **公司理解**：为什么选这家公司
5. **结尾**：明确表达面试意愿

长度：300-400 字。语气自信但不傲慢。`,
    category: 'Writing',
    tags: ['求职', '求职信', 'cover-letter'],
    shortcut: 'cover',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-017',
    title: '社交媒体推文',
    content: `撰写社交媒体推文：

平台：{{platform:Twitter}}
主题：{{topic}}
目的：{{goal:engagement}}

要求：
- 符合平台调性和字数限制
- 包含相关话题标签
- 有互动性（提问、投票、号召）
- 考虑视觉排版（换行、emoji）

生成 3 个不同角度的版本供选择。`,
    category: 'Writing',
    tags: ['推文', '社交', '媒体'],
    shortcut: 'tweet',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-018',
    title: '技术文档撰写',
    content: `撰写技术文档：

主题：{{topic}}
读者水平：{{level:中级}}

结构：
1. **概述**：这是什么？解决什么问题？
2. **前置条件**：需要什么知识/环境？
3. **详细步骤**：编号步骤，每步包含代码/命令
4. **示例**：完整可运行的例子
5. **常见问题**：3-5 个 FAQ
6. **参考链接**：相关资源

要求：准确、完整、可验证。`,
    category: 'Writing',
    tags: ['技术', '文档', '说明'],
    shortcut: 'techdoc',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-019',
    title: '邮件主题优化',
    content: `优化以下邮件主题行：

原始主题：{{subject}}
邮件目的：{{purpose}}
收件人：{{recipient}}

优化维度：
1. **吸引力**：能否吸引打开？
2. **清晰度**：能否一眼看出内容？
3. **紧迫性**：是否需要立即处理？
4. **长度**：是否在移动设备上完整显示？

生成 5 个优化版本，从保守到创新排列。`,
    category: 'Writing',
    tags: ['邮件', '主题', '优化'],
    shortcut: 'subject',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'writing-020',
    title: '品牌故事撰写',
    content: `撰写品牌故事：

品牌：{{brand}}
创始人/历史：{{founder_story}}
核心价值：{{values}}

结构：
1. **起点**：创始人为什么开始？
2. **挑战**：遇到过什么困难？
3. **转折**：关键转折点是什么？
4. **使命**：为什么继续？
5. **愿景**：未来想成为什么？

风格：真实、情感化、避免营销腔。让读者产生共鸣。`,
    category: 'Writing',
    tags: ['品牌', '故事', '营销'],
    shortcut: 'brand',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
