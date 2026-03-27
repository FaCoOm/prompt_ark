import type { Prompt } from '@/types/prompt';

export const educationPrompts: Prompt[] = [
  {
    id: 'edu-001',
    title: 'Math Tutor',
    content: `Solve and explain this math problem step-by-step:

{{math_problem}}

For each step:
1. State what you're doing and why
2. Show the calculation
3. Highlight the key concept being applied

End with:
- **Answer**: [boxed final answer]
- **Key Concept**: [the underlying principle in 1 sentence]
- **Common Mistake**: [what students often get wrong here]

Do NOT skip steps. Do NOT just show the answer.`,
    category: 'Education',
    tags: ['math', 'teaching', 'explanation'],
    shortcut: 'math',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-002',
    title: 'Language Partner',
    content: `You are my conversation partner in {{target_language}}.

Rules:
- Speak to me in {{target_language}} at a beginner-intermediate level
- After each message, provide:
  📝 Translation: [English translation]
  📖 Grammar: [1 grammar point from your message]
  🆕 Vocab: [2-3 new words with pronunciation guide]
- Gently correct my mistakes inline with [correction → correct form]
- Gradually increase complexity as I improve

Start by greeting me and asking about my day.`,
    category: 'Education',
    tags: ['language', 'learning', 'bilingual'],
    shortcut: 'lang',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-003',
    title: 'Spoken English Coach',
    content: `You are my spoken English coach. I'll write messages and you'll:

1. Reply naturally (100 words max) to continue our conversation
2. Correct ALL grammar/vocabulary mistakes inline: ~~mistake~~ → correction
3. Suggest 1 more natural way to phrase something I said
4. Ask me a follow-up question

Keep your language natural and conversational, not textbook-formal.

Do NOT let errors slide to be "nice." Strict corrections help me improve fastest.

Let's begin — ask me a question about my day.`,
    category: 'Education',
    tags: ['english', 'speaking', 'practice'],
    shortcut: 'speak',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-004',
    title: '费曼学习法教练',
    content: `用费曼学习法帮我理解：

{{concept}}

步骤：
1. **简单解释**：用一个 12 岁孩子能听懂的方式解释这个概念（2-3 句话）
2. **类比**：用一个日常生活中的例子来类比
3. **关键细节**：说明 3 个不能被简化掉的关键要点
4. **常见误区**：大多数人容易搞错的 1-2 个点
5. **检验问题**：给我 2 个问题测试我是否真的理解了（附答案）

如果我的追问暴露了理解不到位的地方，直接指出而不要敷衍说"理解得很好"。`,
    category: 'Education',
    tags: ['费曼', '学习', '理解'],
    shortcut: 'feynman',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-005',
    title: '知识点串联师',
    content: `帮我把这些零散的知识点串联成体系：

知识点列表：
{{knowledge_points}}

输出：
1. **知识地图**：用树状结构展示这些知识点的层级关系
2. **核心主线**：贯穿所有知识点的 1 条主线逻辑（3 句话）
3. **因果链**：哪些知识点之间有因果关系？画出链条
4. **记忆锚点**：为最难记的 3 个知识点设计记忆锚点（谐音、图像联想等）
5. **应用场景**：1 个需要综合运用多个知识点的实际场景题

不要机械地重复知识点。重点是找到它们之间的「连接」。`,
    category: 'Education',
    tags: ['知识', '体系', '串联'],
    shortcut: 'connect',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-006',
    title: '错题分析师',
    content: `分析我的这道错题：

题目：{{question}}
我的答案：{{my_answer}}
正确答案：{{correct_answer}}

分析：
1. **错误类型**：概念错误 / 计算错误 / 审题错误 / 方法选择错误
2. **根本原因**：我到底是哪个环节的理解出了问题？
3. **正确思路**：完整的解题过程（标注每步的关键思维）
4. **同类变形**：给出 2 道同类型但不同的练习题（附答案）
5. **防错清单**：下次遇到同类题，应该检查哪 3 个点？

不要只告诉我正确答案。帮我理解「为什么我会做错」。`,
    category: 'Education',
    tags: ['错题', '分析', '学习'],
    shortcut: 'mistake',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-007',
    title: '考试冲刺规划',
    content: `帮我制定考试冲刺计划：

考试：{{exam}}
剩余时间：{{time_left}}
当前水平：{{current_level}}

输出：
1. **优先级矩阵**：将考点按"分值权重 × 我的掌握度"分为四象限
2. **每日计划表**：按天分配复习内容，标注预计用时
3. **高频考点**：最可能出现的 10 个考点 + 核心知识点速记
4. **答题策略**：时间分配 + 做题顺序 + 蒙题技巧
5. **考前清单**：考前 1 天/3 小时/30 分钟分别做什么

不要安排不切实际的计划。考虑到人的精力曲线和遗忘曲线。`,
    category: 'Education',
    tags: ['考试', '冲刺', '规划'],
    shortcut: 'exam',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-008',
    title: '英语作文批改',
    content: `批改以下英语作文：

{{essay}}

批改维度（每项评分 1-10）：
1. **内容与论点** (Content)
2. **结构与组织** (Organization)
3. **语法与拼写** (Grammar)
4. **词汇丰富度** (Vocabulary)
5. **连贯与衔接** (Coherence)

逐句批改：
- 用 ~~删除线~~ 标注错误
- 用 **加粗** 标注修改后的表达
- 每处修改附 1 句中文解释

最后提供 3 个可以直接积累的高级表达替换。

不要只纠正语法。更重要的是指出论证逻辑和表达地道性的问题。`,
    category: 'Education',
    tags: ['英语', '作文', '批改'],
    shortcut: 'essay',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-009',
    title: '古诗文解读',
    content: `深度解读这首古诗/文言文：

{{text}}

解读结构：
1. **逐句译注**：每句的现代文翻译 + 关键字词注释
2. **写作背景**：作者何时何地为何而作
3. **意象分析**：诗中核心意象及其象征意义
4. **结构手法**：用了哪些修辞/写作技法（举具体句子）
5. **情感脉络**：全诗情感如何起承转合
6. **名句赏析**：最精彩的 1-2 句为什么好

不要把古诗解读成政治课。重点是文学之美和情感共鸣。`,
    category: 'Education',
    tags: ['古诗', '文言文', '国学'],
    shortcut: 'poem',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
  {
    id: 'edu-010',
    title: '思维导图生成',
    content: `将以下内容转化为思维导图的文本结构：

{{content}}

输出格式（缩进层级表示思维导图的分支）：
# 中心主题
## 一级分支1
### 二级分支1.1
- 关键点
### 二级分支1.2
- 关键点
## 一级分支2
...

要求：
- 最多 3 级深度
- 每个分支用关键词而非完整句子
- 同级分支使用 MECE 原则（相互独立，完全穷尽）
- 最终不超过 30 个节点

不要简单地将原文分段变成分支。要提炼出逻辑框架。`,
    category: 'Education',
    tags: ['思维导图', '整理', '框架'],
    shortcut: 'mindmap',
    variables: [],
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [],
    useCount: 0,
  },
];
