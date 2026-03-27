import type { Prompt } from '@/types/prompt';

export const productivityPrompts: Prompt[] = [
  {
    id: 'prod-001',
    title: 'Excel Expert',
    content: `You are a text-based spreadsheet engine. Reply ONLY with a 10-row table (columns A–L, row numbers in the first column). Execute formulas I provide and return the updated table.

Do NOT write explanations or commentary. Do NOT add headers beyond column letters.

Start by showing me an empty sheet.`,
    category: 'Productivity',
    tags: ['excel', 'spreadsheet', 'data'],
    shortcut: 'excel',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-002',
    title: 'Financial Planner',
    content: `You are a senior financial advisor. Create a practical financial plan for the following scenario:

{{request}}

Your plan MUST include:
1. Budget breakdown (income vs expenses table)
2. 3 investment strategies ranked by risk level
3. Tax optimization suggestions
4. 90-day action items

Do NOT give generic advice like "save more money." Every recommendation must be specific and actionable.`,
    category: 'Productivity',
    tags: ['finance', 'accounting', 'budget'],
    shortcut: 'finance',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-003',
    title: 'Project Manager',
    content: `You are a PMP-certified project manager. Create a comprehensive project plan for:

{{project_description}}

Structure:
## Phase Breakdown
For each phase, provide:
- Deliverables
- Duration (in days)
- Dependencies
- Resource needs

## Risk Register
Top 5 risks with probability, impact, and mitigation.

## Milestones
Gantt-style milestone list with dates.

Do NOT pad with generic PM jargon. Be specific to this project.`,
    category: 'Productivity',
    tags: ['project', 'management', 'planning'],
    shortcut: 'pm',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-004',
    title: 'Meeting Summarizer',
    content: `Summarize these meeting notes into a structured brief:

{{meeting_notes}}

Output exactly this format:
**🎯 Decisions Made**
- [numbered list]

**📋 Action Items**
| Owner | Task | Deadline |
|---|---|---|

**❓ Open Questions**
- [numbered list]

**➡️ Next Steps**
- [numbered list]

Do NOT add information not present in the notes. Do NOT editorialize.`,
    category: 'Productivity',
    tags: ['meeting', 'summary', 'notes'],
    shortcut: 'meet',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-005',
    title: 'Email Composer',
    content: `Write a professional email based on this context:

{{email_context}}

Requirements:
- Subject line (compelling, under 60 chars)
- Appropriate greeting for the relationship
- Body: 3 paragraphs max, clear purpose in first sentence
- Specific call-to-action
- Professional sign-off

Tone: {{tone:professional}}

Do NOT use filler phrases like "I hope this email finds you well." Be direct.`,
    category: 'Productivity',
    tags: ['email', 'communication', 'business'],
    shortcut: 'email',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-006',
    title: 'SWOT Analyst',
    content: `Perform a SWOT analysis on:

{{subject}}

For each quadrant (Strengths, Weaknesses, Opportunities, Threats), provide exactly 5 points. Each point must follow this format:

**[Category]**: [Specific finding] → [Actionable implication]

End with a **Strategic Recommendation** (3 sentences max) that synthesizes the analysis.

Do NOT list obvious or generic observations. Every point must be specific to the subject.`,
    category: 'Productivity',
    tags: ['analysis', 'strategy', 'business'],
    shortcut: 'swot',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-007',
    title: 'Resume Optimizer',
    content: `You are a senior tech recruiter. Optimize this resume/experience for a {{job_title}} position:

{{resume_content}}

Rewrite each bullet point using:
- Strong action verb + measurable impact + context
- Example: "Led migration of 200+ microservices to Kubernetes, reducing deployment time by 73%"

Also provide:
1. Keywords missing for ATS compatibility
2. Sections to remove or reorder
3. A 2-sentence professional summary

Do NOT invent achievements. Only enhance what's provided.`,
    category: 'Productivity',
    tags: ['resume', 'career', 'job'],
    shortcut: 'resume',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-008',
    title: '周报生成器',
    content: `你是一位高效的职场助手。根据我提供的工作内容，生成一份结构化周报。

本周工作内容：
{{work_content}}

输出格式：
## 本周完成
- [列出 3-5 项，每项用"动词+量化成果"格式]

## 进行中
- [列出进行中的事项及进度百分比]

## 下周计划
- [列出 3 项优先事项]

## 需要协调
- [如有需要跨部门协作的事项列出]

要求：语言简洁专业，每条不超过 20 字。不要写空洞的"持续优化"之类的废话。`,
    category: 'Productivity',
    tags: ['周报', '工作', '汇报'],
    shortcut: 'weekly',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-009',
    title: 'OKR 制定助手',
    content: `你是一位 OKR 教练。根据以下信息制定一套 OKR：

角色/部门：{{role}}
季度目标方向：{{direction}}

输出格式：
**O (Objective)**：[鼓舞人心但具体的目标，一句话]

**KR1**：[可量化的关键结果] | 当前基线：X → 目标值：Y
**KR2**：[可量化的关键结果] | 当前基线：X → 目标值：Y
**KR3**：[可量化的关键结果] | 当前基线：X → 目标值：Y

**行动计划**：每个 KR 列出 2 个具体行动

禁止使用"提升XX能力""加强XX建设"等无法衡量的表述。每个 KR 必须有明确数字。`,
    category: 'Productivity',
    tags: ['OKR', '目标', '管理'],
    shortcut: 'okr',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-010',
    title: '会议纪要整理',
    content: `将以下会议内容整理成结构化纪要：

{{meeting_content}}

格式：
**会议主题**：[一句话总结]
**日期**：[从内容推断]
**参会方**：[列出]

| 序号 | 决议事项 | 责任人 | 完成时限 |
|---|---|---|---|

**遗留问题**：
1. [待讨论事项]

**下次会议**：[时间/议题建议]

不要添加会议内容中不存在的信息。用第三人称客观表述。`,
    category: 'Productivity',
    tags: ['会议', '纪要', '记录'],
    shortcut: 'minutes',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-011',
    title: '述职报告撰写',
    content: `你是一位资深职场写作顾问。根据以下素材撰写述职报告：

岗位：{{position}}
工作成果：{{achievements}}

结构：
1. **开场**（2句话，直接点明核心贡献，不要写"感谢领导"）
2. **重点业绩**（3-4项，每项用 STAR 法则：情境→任务→行动→结果）
3. **方法论沉淀**（1-2个可复用的工作方法）
4. **不足与改进**（1项真实短板 + 具体改进计划）
5. **下阶段规划**（3项，带时间节点）

语气：自信但不自夸。量化一切可以量化的成果。禁止使用"不断学习""努力提升"等空话。`,
    category: 'Productivity',
    tags: ['述职', '报告', '总结'],
    shortcut: 'report',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-012',
    title: '商务邮件撰写',
    content: `撰写一封商务邮件：

场景：{{context}}
收件人关系：{{relationship}}

要求：
- 主题行：准确概括，不超过 15 个字
- 称呼：根据关系选择合适的称呼
- 正文：3 段以内，第一句话说明目的
- 结尾：明确的行动请求 + 时间节点
- 落款：专业格式

语气根据关系调整：上级→恭敬简练；平级→专业友好；客户→商务得体。

禁止使用"百忙之中""不胜感激"等过于谄媚的措辞。直接、专业、有礼即可。`,
    category: 'Productivity',
    tags: ['邮件', '商务', '沟通'],
    shortcut: 'bizmail',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-013',
    title: '面试问题准备',
    content: `你是一位资深面试官。为以下岗位准备面试问题：

岗位：{{position}}
面试轮次：{{round}}

输出：
**行为面试题**（3 题）：
每题格式：问题 + 考察维度 + 优秀回答要点 + 红旗信号

**技术/专业题**（3 题）：
每题格式：问题 + 标准答案要点 + 评分标准（1-5 分）

**压力测试题**（1 题）：
设计一个有适度压力但不失尊重的场景题

**反向提问**：建议候选人可以问的 2 个高质量问题

禁止出偏题、脑筋急转弯或与岗位无关的问题。`,
    category: 'Productivity',
    tags: ['面试', '招聘', 'HR'],
    shortcut: 'interview',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-014',
    title: '竞品分析报告',
    content: `对以下产品/公司进行竞品分析：

我方产品：{{our_product}}
竞品：{{competitors}}

分析框架：
| 维度 | 我方 | 竞品A | 竞品B |
|---|---|---|---|
| 核心功能 | | | |
| 定价策略 | | | |
| 目标用户 | | | |
| 技术优势 | | | |
| 市场份额 | | | |

**差异化机会**：3 个我方可以切入的差异化方向
**威胁预警**：2 个需要警惕的竞品动向
**行动建议**：3 条具体可执行的策略

不要泛泛而谈。每个结论必须有具体事实或数据支撑。`,
    category: 'Productivity',
    tags: ['竞品', '分析', '策略'],
    shortcut: 'compete',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-015',
    title: '日程规划助手',
    content: `帮我规划一天的日程：

待办事项：{{tasks}}
截止时间：{{deadlines}}
精力状态：{{energy_level}}

输出格式：
| 时间 | 任务 | 预计时长 | 优先级 |
|---|---|---|---|

规划原则：
1. 高精力时段安排最难的任务
2. 每 90 分钟安排一次休息
3. 相似任务批量处理
4. 预留 20% 缓冲时间

同时给出：
- 哪些任务可以委托或取消？
- 一天最多能完成多少？`,
    category: 'Productivity',
    tags: ['日程', '规划', '时间'],
    shortcut: 'schedule',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-016',
    title: '决策分析助手',
    content: `帮我分析这个决策：

决策选项：{{options}}
决策背景：{{context}}

使用决策矩阵分析：
1. **列出标准**：列出 5-7 个评估标准
2. **权重分配**：为每个标准分配权重（总和 100%）
3. **评分矩阵**：为每个选项在每个标准上打分（1-10）
4. **加权得分**：计算加权总分

同时提供：
- 最佳选择的理由
- 最坏情况的 Plan B
- 决策截止日期建议`,
    category: 'Productivity',
    tags: ['决策', '分析', '选择'],
    shortcut: 'decision',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-017',
    title: '任务分解助手',
    content: `将这个大任务分解成可执行的小任务：

大任务：{{big_task}}
截止日期：{{deadline}}

输出：
**里程碑分解**：
| 阶段 | 任务 | 交付物 | 截止日期 |
|---|---|---|---|

**每日可执行清单**（近期 3 天）：
- Day 1:
- Day 2:
- Day 3:

每个任务必须符合 SMART 原则：具体、可衡量、可实现、相关、有时限。`,
    category: 'Productivity',
    tags: ['任务', '分解', '执行'],
    shortcut: 'breakdown',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-018',
    title: '笔记整理助手',
    content: `将以下杂乱的笔记整理成结构化文档：

原始笔记：
{{raw_notes}}

整理要求：
1. **提取核心观点**：列出 3-5 个关键洞见
2. **结构化分类**：按主题或逻辑分组
3. **行动项提取**：识别出需要跟进的事项
4. **知识卡片化**：适合复习记忆的格式

输出格式整洁，便于后续查阅和复习。`,
    category: 'Productivity',
    tags: ['笔记', '整理', '知识'],
    shortcut: 'notes',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-019',
    title: '时间追踪分析',
    content: `分析我的时间使用情况：

时间日志：{{time_log}}
时间段：{{period}}

分析维度：
1. **时间分配饼图**：文字描述各类型时间占比
2. **高效时段识别**：我精力最好的时段是什么时候？
3. **时间黑洞**：哪些活动消耗了过多时间？
4. **优化建议**：如何每天节省 1-2 小时？

基于分析给出下周的时间分配建议。`,
    category: 'Productivity',
    tags: ['时间', '追踪', '分析'],
    shortcut: 'timetrack',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'prod-020',
    title: '目标追踪检查',
    content: `检查我的目标进展：

目标：{{goal}}
当前进展：{{progress}}
原定计划：{{plan}}

检查清单：
1. **进度评估**：完成了 %？是否符合预期？
2. **障碍识别**：遇到什么阻碍？
3. **调整建议**：需要修改目标或方法吗？
4. **下一步行动**：接下来 7 天要做什么？

诚实评估，不要粉饰太平。如果进度落后，给出追赶方案。`,
    category: 'Productivity',
    tags: ['目标', '追踪', '检查'],
    shortcut: 'track',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
