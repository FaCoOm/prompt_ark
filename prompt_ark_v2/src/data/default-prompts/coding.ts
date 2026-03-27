import type { Prompt } from '@/types/prompt';

export const codingPrompts: Prompt[] = [
  {
    id: 'code-001',
    title: 'Code Reviewer',
    content: `Review this code with a focus on production-readiness:

\`\`\`
{{code}}
\`\`\`

For each finding, use this format:

**[CRITICAL/MAJOR/MINOR]** Line ~N: [title]
- Problem: [what's wrong]
- Impact: [what could go wrong]
- Fix: [specific code change]

Prioritize: Security > Correctness > Performance > Readability

End with a summary: X critical, Y major, Z minor issues found.

Do NOT flag style preferences or nitpicks. Only flag real problems.`,
    category: 'Coding',
    tags: ['review', 'quality', 'best-practices'],
    shortcut: 'review',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-002',
    title: 'API Doc Writer',
    content: `Write API documentation for:

{{api_details}}

Use this structure:
## Endpoint Name
\`METHOD /path\`

**Description**: 1 sentence

**Auth**: Required? Type?

**Parameters**:
| Name | Type | Required | Description |
|---|---|---|---|

**Request Example**:
\`\`\`json
{}
\`\`\`

**Response** (200):
\`\`\`json
{}
\`\`\`

**Error Codes**:
| Code | Description |
|---|---|

Do NOT use placeholder values like "string" — use realistic sample data.`,
    category: 'Coding',
    tags: ['api', 'documentation', 'technical'],
    shortcut: 'apidoc',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-003',
    title: 'Bug Debugger',
    content: `Debug this issue:

{{bug_description}}

Follow this diagnostic process:
1. **Reproduce**: Identify the exact conditions
2. **Isolate**: Narrow down to the root cause (not symptoms)
3. **Root Cause**: Explain WHY the bug occurs at the code/system level
4. **Fix**: Provide the minimal code change
5. **Prevent**: Suggest a test case that would catch this in the future

Do NOT suggest "try restarting" or "clear cache" unless it's genuinely the fix.`,
    category: 'Coding',
    tags: ['debug', 'troubleshoot', 'fix'],
    shortcut: 'debug',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-004',
    title: 'Architecture Designer',
    content: `Design a system architecture for:

{{request}}

Output:
1. **Architecture Diagram** (text-based, showing components and data flow)
2. **Component Breakdown**: Purpose, tech stack choice, scaling strategy
3. **Data Flow**: How a request travels through the system
4. **Trade-offs**: What you sacrificed and why (CAP theorem, cost, complexity)

Design for the stated scale. Do NOT over-engineer for hypothetical future needs unless asked.`,
    category: 'Coding',
    tags: ['architecture', 'system-design', 'IT'],
    shortcut: 'arch',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-005',
    title: '需求分析师',
    content: `你是一位资深需求分析师。分析以下需求并输出 PRD 要点：

用户需求描述：{{requirement}}

输出：
1. **需求拆解**
| 功能点 | 用户故事 (As a... I want... So that...) | 优先级 (P0/P1/P2) | 复杂度评估 |
|---|---|---|---|

2. **验收标准**：每个 P0 功能的 Given-When-Then 验收条件

3. **边界条件**：5 个容易被忽略的边界情况

4. **技术风险**：可能的技术难点及建议方案

5. **MVP 定义**：如果只能做 3 个功能先上线，选哪 3 个？为什么？

禁止把用户的"想要"直接当"需求"。要挖掘背后的真实问题。`,
    category: 'Coding',
    tags: ['需求', 'PRD', '分析'],
    shortcut: 'prd',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-006',
    title: '代码解释器',
    content: `逐行解释以下代码的逻辑和意图：

\`\`\`{{language}}
{{code}}
\`\`\`

输出格式：
**概要**：这段代码的整体作用（1-2句话）

**逐段解析**：
\`\`\`
[代码行]  // ← [解释：这行做了什么，为什么这么写]
\`\`\`

**关键设计决策**：
- 为什么选择这个数据结构/算法？
- 有没有更好的替代方案？

**潜在问题**：可能存在的 bug 或性能问题

用中文解释，但保持技术术语的英文原文（如 "closure"、"event loop"）。不要把简单的 \`i++\` 也解释一遍。只解释有信息量的部分。`,
    category: 'Coding',
    tags: ['代码', '解释', '学习'],
    shortcut: 'explain',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-007',
    title: '报错诊断专家',
    content: `诊断以下报错信息：

报错内容：
\`\`\`
{{error}}
\`\`\`

运行环境：{{environment}}

诊断输出：
1. **错误类型**：这是什么类型的错误？（语法/运行时/逻辑/环境）
2. **根因分析**：最可能的原因（排名第 1-3 的可能性）
3. **修复方案**：
   \`\`\`
   // 修复前
   [错误代码]
   // 修复后
   [正确代码]
   \`\`\`
4. **验证方法**：如何确认修复成功
5. **预防措施**：怎么避免下次再犯

不要建议"重启试试"或"重新安装"，除非确实是根因。直接定位代码层面的问题。`,
    category: 'Coding',
    tags: ['报错', '诊断', 'debug'],
    shortcut: 'error',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-008',
    title: '技术方案评审',
    content: `评审以下技术方案：

{{technical_plan}}

从以下维度打分（每项 1-10）并给出评审意见：

| 维度 | 评分 | 评审意见 |
|---|---|---|
| 可行性 | | |
| 可扩展性 | | |
| 安全性 | | |
| 性能 | | |
| 可维护性 | | |
| 成本效益 | | |

**关键风险**：Top 3 技术风险及缓解措施
**替代方案**：1 个值得考虑的替代技术路线
**建议**：通过 / 有条件通过 / 需要重新设计

以技术负责人视角评审。不要当好人只说优点。重点指出可能踩的坑。`,
    category: 'Coding',
    tags: ['技术', '评审', '方案'],
    shortcut: 'reviewtech',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-009',
    title: 'Git Commit 信息规范',
    content: `根据以下代码改动生成规范的 Git Commit Message：

改动内容：
{{changes}}

输出格式（Conventional Commits）：
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

Type 选择：feat / fix / refactor / docs / style / test / chore
Scope：受影响的模块
Subject：50 字符以内，祈使语气，不加句号
Body：说明 WHY（为什么改）而不是 WHAT（改了什么）

提供 3 个不同粒度的版本：
1. 简洁版（1 行）
2. 标准版（带 body）
3. 详细版（带 body + breaking changes / footer）

Commit message 必须用英文。不要写"update code"这种废话。`,
    category: 'Coding',
    tags: ['git', 'commit', '规范'],
    shortcut: 'commit',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-010',
    title: '接口文档生成',
    content: `根据以下信息生成 RESTful API 接口文档：

{{api_info}}

文档格式：
### {{method}} {{path}}

**简介**：[1 句话]

**认证**：[是否需要 Token]

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|---|---|---|---|---|

**请求示例**：
\`\`\`json
{}
\`\`\`

**成功响应** (200)：
\`\`\`json
{}
\`\`\`

**错误码**：
| 错误码 | 说明 | 排查建议 |
|---|---|---|

所有示例值必须使用真实可信的数据，不要用 "string" 或 "xxx" 占位。`,
    category: 'Coding',
    tags: ['API', '接口', '文档'],
    shortcut: 'api',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-011',
    title: 'SQL 生成器',
    content: `根据以下需求生成 SQL 语句：

需求：{{requirement}}
数据库类型：{{db_type:MySQL}}
表结构：
{{schema}}

要求：
1. 生成高效、可读的 SQL
2. 复杂查询添加注释说明
3. 考虑索引优化
4. 避免 SQL 注入风险

如果是复杂查询，提供执行计划分析建议。`,
    category: 'Coding',
    tags: ['SQL', '数据库', '查询'],
    shortcut: 'sql',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-012',
    title: '正则表达式助手',
    content: `帮我编写正则表达式：

匹配目标：{{target}}
使用场景：{{context}}
编程语言：{{language:JavaScript}}

输出：
1. **正则表达式**：完整写法
2. **解释**：逐个符号解释含义
3. **测试用例**：5 个应该匹配的 + 5 个不应该匹配的
4. **代码示例**：在实际代码中的使用方式

如果需要复杂逻辑，解释为什么用正则而不是其他方法。`,
    category: 'Coding',
    tags: ['正则', 'regex', '匹配'],
    shortcut: 'regex',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-013',
    title: '代码重构助手',
    content: `重构以下代码：

原始代码：
\`\`\`
{{code}}
\`\`\`

重构目标：{{goal:提高可读性}}

输出：
1. **重构后代码**
2. **改动说明**：每处改动的理由
3. **设计模式**：是否应用了某种设计模式？
4. **潜在风险**：重构可能引入的问题

保持功能不变，只改进代码质量。`,
    category: 'Coding',
    tags: ['重构', '代码', '质量'],
    shortcut: 'refactor',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-014',
    title: '单元测试生成',
    content: `为以下代码生成单元测试：

代码：
\`\`\`
{{code}}
\`\`\`

测试框架：{{framework:Jest}}

要求：
1. 覆盖正常路径和异常路径
2. 包含边界值测试
3. 测试用例命名清晰
4. 使用 Given-When-Then 注释风格

生成完整的测试文件，可以直接运行。`,
    category: 'Coding',
    tags: ['测试', '单元测试', 'TDD'],
    shortcut: 'test',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-015',
    title: '性能优化建议',
    content: `分析以下代码的性能并提出优化方案：

代码：
\`\`\`
{{code}}
\`\`\`

运行环境：{{environment}}

分析维度：
1. **时间复杂度**：当前复杂度及优化潜力
2. **空间复杂度**：内存使用分析
3. **瓶颈识别**：最耗时的部分
4. **优化方案**：具体优化代码
5. **性能测试**：如何验证优化效果

优先优化高频执行路径。`,
    category: 'Coding',
    tags: ['性能', '优化', '算法'],
    shortcut: 'perf',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-016',
    title: 'Docker 配置助手',
    content: `生成 Docker 配置文件：

应用类型：{{app_type}}
技术栈：{{stack}}
部署要求：{{requirements}}

生成：
1. **Dockerfile**：多阶段构建，最小化镜像
2. **docker-compose.yml**：本地开发环境
3. **.dockerignore**：排除不必要文件
4. **说明**：关键指令解释和最佳实践

优化目标：镜像体积小、构建快、安全性高。`,
    category: 'Coding',
    tags: ['Docker', '容器', '部署'],
    shortcut: 'docker',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-017',
    title: '算法题解生成',
    content: `生成算法题的完整解答：

题目：{{problem}}
难度：{{difficulty}}

解答结构：
1. **思路分析**：解题思路和算法选择理由
2. **复杂度分析**：时间 + 空间复杂度
3. **代码实现**：完整可运行代码
4. **测试用例**：边界情况和常规情况
5. **优化路径**：是否还有更优解？

代码要有清晰注释，关键步骤说明。`,
    category: 'Coding',
    tags: ['算法', 'LeetCode', '面试'],
    shortcut: 'algo',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-018',
    title: 'CI/CD 配置生成',
    content: `生成 CI/CD 流水线配置：

平台：{{platform:GitHub Actions}}
项目类型：{{project_type}}
部署要求：{{requirements}}

生成：
1. **完整配置文件**
2. **流程说明**：每个步骤的作用
3. **环境变量**：需要配置哪些 secrets
4. **最佳实践**：缓存、并行化等优化建议

配置应支持：代码检查、测试、构建、部署。`,
    category: 'Coding',
    tags: ['CI/CD', 'DevOps', '自动化'],
    shortcut: 'cicd',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-019',
    title: '代码片段生成',
    content: `生成代码片段：

功能需求：{{function}}
编程语言：{{language}}
约束条件：{{constraints}}

要求：
1. 代码简洁、可读性强
2. 包含输入验证
3. 有错误处理
4. 关键步骤有注释

提供完整可运行的代码示例。`,
    category: 'Coding',
    tags: ['代码', '片段', '工具'],
    shortcut: 'snippet',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'code-020',
    title: '安全审计助手',
    content: `审计以下代码的安全问题：

代码：
\`\`\`
{{code}}
\`\`\`

应用场景：{{context}}

审计维度：
1. **注入攻击**：SQL、命令、代码注入
2. **认证授权**：身份验证、权限控制
3. **敏感数据**：密码、密钥、PII 处理
4. **输入验证**：所有外部输入是否验证
5. **依赖安全**：第三方库风险

对发现的每个问题：说明风险等级、攻击场景、修复建议。`,
    category: 'Coding',
    tags: ['安全', '审计', '漏洞'],
    shortcut: 'security',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
