import type { Prompt } from '@/types/prompt';

export const creativePrompts: Prompt[] = [
  {
    id: 'creative-001',
    title: 'Character Roleplay',
    content: `You ARE {{character}} from {{series}}. Stay in character completely.

Rules:
- Use {{character}}'s exact speaking style, vocabulary, and mannerisms
- React as {{character}} would based on their knowledge, beliefs, and personality
- If asked something {{character}} wouldn't know, respond as they would to confusion
- Never break character, never add meta-commentary

Begin. I say: "Hi, {{character}}."`,
    category: 'Creative',
    tags: ['roleplay', 'character', 'fiction'],
    shortcut: 'rp',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-002',
    title: 'Movie Critic',
    content: `Write a film review for:

{{movie}}

Structure:
- **Rating**: X/10
- **One-Line Verdict**: (for people who just want the bottom line)
- **Review** (300-400 words):
  - What works (acting, direction, cinematography, score)
  - What doesn't work
  - How it made you FEEL (this is the heart of the review)
  - Who will love it / who should skip it

NO SPOILERS. Use vague references for plot points beyond the trailer.`,
    category: 'Creative',
    tags: ['movie', 'review', 'film'],
    shortcut: 'movie',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-003',
    title: 'Brand Name Generator',
    content: `Generate 10 brand name options for:

{{request}}

For each name, provide:
| Name | Type | Why It Works | Domain Available? |
|---|---|---|---|

Name types to include:
- 2 coined/invented words (like Google, Spotify)
- 2 compound words (like YouTube, WordPress)
- 2 metaphoric names (like Amazon, Apple)
- 2 descriptive names (like General Electric)
- 2 acronyms or abbreviations

Check: Is it easy to spell, pronounce, and remember? No negative connotations in other languages?`,
    category: 'Creative',
    tags: ['branding', 'naming', 'startup'],
    shortcut: 'brand',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-004',
    title: 'Travel Planner',
    content: `Plan a trip based on:

{{location}}

Provide:
1. **Top 5 Must-Visit**: Name, why it's special, best time to visit, avg duration
2. **Day-by-Day Itinerary**: Optimized for minimal transit time
3. **Local Tips**: 3 things only locals know
4. **Budget Estimate**: Accommodation, food, transport, activities (per day)
5. **Food**: 3 must-try dishes and where to eat them

Do NOT recommend tourist traps. Prioritize authentic experiences.`,
    category: 'Creative',
    tags: ['travel', 'tourism', 'guide'],
    shortcut: 'travel',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-005',
    title: 'Chef',
    content: `Suggest a recipe that is:
- Nutritionally balanced
- Ready in under 30 minutes
- Budget-friendly

For: {{request}}

Recipe format:
**[Recipe Name]** ⏱️ X min | 💰 ~$X | 🔥 X cal

**Ingredients** (with quantities):
-

**Steps** (numbered, each under 2 sentences):
1.

**Pro Tips**: 2 ways to elevate this dish
**Storage**: How long it keeps, reheating instructions

Do NOT list uncommon ingredients without suggesting substitutes.`,
    category: 'Creative',
    tags: ['cooking', 'recipe', 'food'],
    shortcut: 'recipe',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-006',
    title: 'Life Coach',
    content: `I need guidance on:

{{situation}}

Help me by:
1. **Reframe**: Help me see this situation from 2 new perspectives
2. **Root Cause**: What's the underlying issue beneath the surface problem?
3. **Action Plan**: 3 concrete steps I can take this week
4. **Accountability**: How to measure progress on each step
5. **Mindset Shift**: 1 belief I should challenge

Do NOT give toxic positivity ("Everything happens for a reason"). Give honest, practical advice.`,
    category: 'Creative',
    tags: ['coaching', 'goals', 'self-improvement'],
    shortcut: 'coach',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-007',
    title: 'Mental Health Guide',
    content: `I'm dealing with:

{{request}}

Provide evidence-based strategies:
1. **Immediate Relief** (next 5 minutes): 1 grounding technique
2. **Short-term Strategy** (this week): CBT-based reframing exercise
3. **Long-term Practice** (ongoing): Habit to build resilience
4. **Resources**: When to seek professional help (specific signs)

Tone: Warm, non-judgmental, empowering.

⚠️ This is not a substitute for professional therapy. If you're in crisis, contact 988 (US) or local emergency services.`,
    category: 'Creative',
    tags: ['mental-health', 'wellness', 'therapy'],
    shortcut: 'mental',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-008',
    title: 'Habit Builder',
    content: `Help me build this habit:

{{habit}}

Design a 30-day plan using behavioral science:
1. **Cue**: When and where to trigger the habit
2. **Craving**: How to make it attractive (temptation bundling)
3. **Response**: Smallest possible version (2-minute rule)
4. **Reward**: Immediate reward after completion
5. **Tracking**: Simple tracking method
6. **Failure Plan**: What to do when you miss a day (not "start over")

Week 1-4 progression with gradually increasing difficulty.

Do NOT suggest motivation-dependent strategies. Design for days when motivation = zero.`,
    category: 'Creative',
    tags: ['habits', 'productivity', 'self-improvement'],
    shortcut: 'habit',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-009',
    title: '菜谱推荐',
    content: `根据以下条件推荐一道菜：

可用食材：{{ingredients}}
烹饪时间限制：{{time:30分钟}}
口味偏好：{{preference}}

输出格式：
**🍳 {{菜名}}** | ⏱ {{分钟}} | 难度：⭐~⭐⭐⭐

**食材清单**（标注家中可能没有的）：
- ✅ [已有食材]
- 🛒 [需要购买的]

**步骤**（每步限 1 句话）：
1. [动作] — 💡[关键技巧提示]
2. ...

**避坑提醒**：1 个新手最容易翻车的步骤

不要推荐需要特殊设备（如烤箱、料理机）的菜，除非我提到有这些设备。`,
    category: 'Creative',
    tags: ['做饭', '菜谱', '美食'],
    shortcut: 'cook',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-010',
    title: '旅行攻略生成',
    content: `为我规划旅行攻略：

目的地：{{destination}}
天数：{{days}}
预算：{{budget}}
出行人数/关系：{{travelers}}

输出：
**Day 1 - Day N 行程表**：
| 时间 | 地点 | 活动 | 预算 | 交通方式 | 备注 |
|---|---|---|---|---|---|

**必吃清单**：5 家当地人推荐的餐厅（非游客区）
**避坑指南**：3 个常见旅游陷阱
**行李清单**：针对目的地气候的打包建议
**预算汇总**：分类总计

不要推荐过度商业化的景点。优先推荐有当地特色的体验。`,
    category: 'Creative',
    tags: ['旅行', '攻略', '规划'],
    shortcut: 'trip',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-011',
    title: '送礼推荐师',
    content: `帮我推荐合适的礼物：

送礼对象：{{recipient}}
关系：{{relationship}}
场合：{{occasion}}
预算：{{budget}}

推荐 5 个礼物方案，从最推荐到兜底方案排列：

| 排名 | 礼物 | 预算 | 推荐理由 | 在哪买 |
|---|---|---|---|---|

**送礼话术**：搭配礼物的得体表达
**雷区提醒**：这个关系/场合绝对不能送什么

不要推荐"定制相册""手写信"等需要大量时间准备的方案，除非时间充裕。不要推荐烂大街的保温杯。`,
    category: 'Creative',
    tags: ['送礼', '推荐', '人情'],
    shortcut: 'gift',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-012',
    title: '点子生成器',
    content: `帮我 brainstorm 关于 {{topic}} 的点子。

我需要 {{number:10}} 个创意点子。

要求：
1. 点子之间要有差异性，不要雷同
2. 每个点子包含：标题 + 一句话描述 + 可行性评估（高/中/低）
3. 至少有 2 个看似疯狂但可能有效的点子
4. 至少有 2 个低成本快速验证的点子

用表格格式输出，便于对比筛选。`,
    category: 'Creative',
    tags: ['点子', '头脑风暴', '创意'],
    shortcut: 'idea',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-013',
    title: '角色设计师',
    content: `帮我设计一个虚构角色：

角色类型：{{type}}
世界观：{{setting}}

设计维度：
1. **基础信息**：姓名、年龄、外貌特征
2. **性格特质**：3 个核心性格 + 1 个矛盾点
3. **背景故事**：关键经历如何塑造了 TA
4. **动机与恐惧**：想要什么？害怕什么？
5. **语言风格**：说话方式、口头禅
6. **人际关系**：与故事中其他角色的关系

让角色有层次感，避免脸谱化。`,
    category: 'Creative',
    tags: ['角色', '设计', '小说'],
    shortcut: 'character',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-014',
    title: '场景描述师',
    content: `描述一个场景：

场景设定：{{setting}}
氛围要求：{{mood}}

要求：
- 调动五感：视觉、听觉、嗅觉、触觉、味觉
- 有层次感：远景 → 中景 → 近景
- 有动态元素：不仅仅是静态描述
- 暗示情绪：通过环境描写传达情感

200-300 字，像小说开头一样引人入胜。`,
    category: 'Creative',
    tags: ['场景', '描写', '写作'],
    shortcut: 'scene',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'creative-015',
    title: '对话生成器',
    content: `生成一段对话：

参与者：{{characters}}
场景：{{context}}
冲突/目标：{{conflict}}

要求：
1. 每个人说话方式符合其性格
2. 对话有潜台词，不只是表面意思
3. 包含 1-2 个转折或揭示
4. 通过对话展现人物关系
5. 长度：15-20 句对话

格式：
角色A："..."
角色B："..."`,
    category: 'Creative',
    tags: ['对话', '写作', '剧本'],
    shortcut: 'dialogue',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
