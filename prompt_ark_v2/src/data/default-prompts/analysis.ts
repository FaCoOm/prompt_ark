import type { Prompt } from '@/types/prompt';

export const analysisPrompts: Prompt[] = [
  {
    id: 'analysis-001',
    title: 'Data Analyst',
    content: `Analyze this dataset and provide insights:

{{data}}

Analysis requirements:
1. **Key Metrics**: Calculate 3-5 most important metrics
2. **Trends**: Identify upward/downward patterns over time
3. **Anomalies**: Flag any unusual data points with explanations
4. **Correlations**: Find relationships between variables
5. **Actionable Insights**: 3 specific recommendations based on the data

Format: Use tables for metrics, bullet points for insights. Do NOT just describe what the data shows—explain what it MEANS.`,
    category: 'Analysis',
    tags: ['data', 'analytics', 'statistics'],
    shortcut: 'data',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-002',
    title: 'Competitor Analyzer',
    content: `Analyze the competitive landscape for:

{{product/service}}

Provide:
1. **Competitor Map**: 4-6 key players with positioning (use 2x2 matrix description)
2. **Feature Comparison**: Table comparing core features across competitors
3. **Pricing Analysis**: Tier comparison and value positioning
4. **Strengths & Gaps**: What each competitor does well / misses
5. **Market Opportunity**: 2-3 underserved niches or differentiation angles

Be specific. Use real company names if you know them, or representative examples.`,
    category: 'Analysis',
    tags: ['competitor', 'market', 'strategy'],
    shortcut: 'compete',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-003',
    title: 'Code Reviewer',
    content: `Review this code for quality and best practices:

\`\`\`
{{code}}
\`\`\`

Review dimensions:
1. **Correctness**: Logic errors, edge cases, potential bugs
2. **Performance**: Algorithmic complexity, unnecessary operations
3. **Maintainability**: Readability, naming, organization
4. **Security**: Injection risks, input validation, sensitive data handling
5. **Testing**: What's missing, testability

For each issue found:
- Severity: [Critical/Major/Minor]
- Location: Line number or function
- Issue: What's wrong
- Fix: Specific code suggestion

End with overall score (1-10) and top 3 priorities.`,
    category: 'Analysis',
    tags: ['code', 'review', 'quality'],
    shortcut: 'codereview',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-004',
    title: 'Sentiment Analyzer',
    content: `Analyze the sentiment and emotional tone of:

{{text}}

Analysis:
1. **Overall Sentiment**: Positive/Negative/Neutral (with confidence %)
2. **Emotional Profile**: Primary and secondary emotions detected
3. **Key Phrases**: 3-5 phrases driving the sentiment
4. **Intensity**: Mild/Moderate/Strong emotional expression
5. **Target Analysis**: What/Who is the sentiment directed at?
6. **Nuance**: Any sarcasm, irony, or mixed signals?

Provide specific evidence from the text for each claim.`,
    category: 'Analysis',
    tags: ['sentiment', 'emotion', 'NLP'],
    shortcut: 'sentiment',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-005',
    title: 'Risk Assessor',
    content: `Conduct a risk assessment for:

{{project/situation}}

Risk Matrix:
| Risk | Probability (1-5) | Impact (1-5) | Risk Score | Mitigation Strategy |
|---|---|---|---|---|

Include:
1. **Technical Risks**: Implementation challenges
2. **Business Risks**: Market, competition, revenue
3. **Operational Risks**: Team, resources, timeline
4. **External Risks**: Regulations, dependencies

Top 3 risks require detailed contingency plans. Total risk exposure calculation at the end.`,
    category: 'Analysis',
    tags: ['risk', 'assessment', 'planning'],
    shortcut: 'risk',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-006',
    title: '财务数据分析',
    content: `分析以下财务数据：

{{financial_data}}

分析维度：
1. **关键指标**：计算并解读 5 个核心财务指标
2. **趋势分析**：收入/成本/利润的变化趋势
3. **健康度评估**：现金流、负债、盈利能力分析
4. **异常预警**：指出需要关注的异常数据
5. **改进建议**：3 条具体的财务优化建议

使用表格展示对比数据，用中文解读业务含义，不只是数字罗列。`,
    category: 'Analysis',
    tags: ['财务', '分析', '报表'],
    shortcut: 'finance',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-007',
    title: '用户行为分析',
    content: `分析以下用户行为数据：

{{behavior_data}}

分析框架：
1. **用户旅程**：关键转化节点及流失率
2. **行为模式**：高频行为 vs 低频行为
3. **细分对比**：不同用户群体的行为差异
4. **痛点识别**：用户可能遇到的阻碍
5. **优化机会**：基于数据的产品改进建议

每个结论都要有数据支撑，不要拍脑袋猜测。`,
    category: 'Analysis',
    tags: ['用户', '行为', '数据'],
    shortcut: 'user',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-008',
    title: '市场趋势分析',
    content: `分析 {{industry}} 的市场趋势：

分析内容：
1. **宏观趋势**：3-5 个影响该行业的关键因素
2. **技术变革**：可能颠覆行业的技术动向
3. **竞争格局**：主要玩家及市场份额变化
4. **消费者洞察**：需求变化及新兴细分市场
5. **未来预测**：未来 1-3 年的趋势预判

每个趋势都要说明：对行业的影响程度 + 对企业的具体建议。`,
    category: 'Analysis',
    tags: ['市场', '趋势', '行业'],
    shortcut: 'trend',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-009',
    title: '问卷结果分析',
    content: `分析以下问卷调查结果：

{{survey_results}}

分析要求：
1. **样本概况**：样本量、代表性分析
2. **核心发现**：3-5 个最重要的结论
3. **交叉分析**：不同群体的回答差异
4. **开放题归类**：主要观点分类统计
5. **置信区间**：关键数据的统计显著性
6. **行动建议**：基于数据的决策建议

避免过度解读，区分相关性和因果关系。`,
    category: 'Analysis',
    tags: ['问卷', '调研', '统计'],
    shortcut: 'survey',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-010',
    title: '文案效果分析',
    content: `分析以下文案的效果：

{{copy_content}}

目标受众：{{audience}}
投放渠道：{{channel}}

分析维度：
1. **吸引力**：标题/开头是否抓人眼球
2. **说服力**：论据是否充分，逻辑是否清晰
3. **行动引导**：CTA 是否明确有力
4. **受众匹配度**：是否符合目标受众的语言习惯
5. **渠道适配**：是否适合该渠道的传播特点
6. **改进版本**：重写 2 个优化版本

给出具体的 CTR/CVR 提升建议。`,
    category: 'Analysis',
    tags: ['文案', '营销', '转化'],
    shortcut: 'copy',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-011',
    title: '技术选型分析',
    content: `对以下技术选型进行深度分析：

候选技术：{{options}}
项目背景：{{context}}

分析框架：
| 维度 | 权重 | 技术A | 技术B | 技术C |
|---|---|---|---|---|
| 成熟度 | | | | |
| 性能 | | | | |
| 生态 | | | | |
| 学习成本 | | | | |
| 维护成本 | | | | |
| 社区活跃度 | | | | |

附加分析：
- 技术债务风险
- 团队适配度
- 长期演进路线

给出明确的推荐及理由。`,
    category: 'Analysis',
    tags: ['技术', '选型', '架构'],
    shortcut: 'tech',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-012',
    title: '舆情分析助手',
    content: `分析以下舆情信息：

{{public_opinion_data}}

分析维度：
1. **声量统计**：讨论量及趋势
2. **情感分布**：正面/负面/中性比例
3. **热点话题**：Top 5 讨论焦点
4. **KOL 观点**：关键意见领袖态度
5. **传播路径**：信息是如何扩散的
6. **潜在风险**：可能发酵的负面点
7. **应对建议**：公关策略建议

区分事实与情绪，识别核心矛盾点。`,
    category: 'Analysis',
    tags: ['舆情', '公关', '品牌'],
    shortcut: 'pr',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-013',
    title: '效率分析专家',
    content: `分析以下工作流程/系统的效率：

{{workflow}}

分析内容：
1. **流程映射**：绘制当前流程步骤
2. **瓶颈识别**：找出效率最低的环节
3. **时间分析**：各步骤耗时占比
4. **资源利用率**：人/财/物使用效率
5. **浪费识别**：7大浪费（等待、过度加工等）
6. **优化方案**：具体的改进建议及预期收益

用数据说话，给出量化的改进潜力。`,
    category: 'Analysis',
    tags: ['效率', '流程', '优化'],
    shortcut: 'efficiency',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-014',
    title: '用户体验评估',
    content: `评估以下产品/页面的用户体验：

{{product/page_description}}

评估维度（1-10 分）：
| 维度 | 评分 | 问题描述 | 改进建议 |
|---|---|---|---|
| 可用性 | | | |
| 可发现性 | | | |
| 效率 | | | |
| 满意度 | | | |
| 容错性 | | | |

深度分析：
- 用户旅程中的痛点
- 认知负荷评估
- 情感设计分析
- 竞品对比

提供优先级排序的改进清单。`,
    category: 'Analysis',
    tags: ['UX', '体验', '评估'],
    shortcut: 'ux',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'analysis-015',
    title: '根因分析专家',
    content: `对以下问题进行根因分析：

问题描述：{{problem}}
已发生的影响：{{impact}}

分析方法：5 Whys + 鱼骨图逻辑

输出：
1. **问题界定**：准确的问题陈述
2. **5 Whys 分析**：连续追问 5 层为什么
3. **根因分类**：人/机/料/法/环/测各维度分析
4. **验证方法**：如何确认找到的是真因
5. **纠正措施**：针对根因的解决方案
6. **预防措施**：如何避免类似问题再次发生

避免停留在表面原因，深挖系统性问题。`,
    category: 'Analysis',
    tags: ['根因', '问题', '质量'],
    shortcut: 'rootcause',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
