// prompt-ark-hub/demo-data.js — 100 real built-in prompts for Hub
// Auto-generated from lib/default-prompts.js

function getDemoListings() {
    return [
    {
        "gistId": "builtin-1",
        "title": "Excel Expert",
        "description": "You are a text-based spreadsheet engine. Reply ONLY with a 10-row table (columns A–L, row numbers in the first column). Execute formulas I provide and return th",
        "category": "Productivity",
        "tags": [
            "excel",
            "spreadsheet",
            "data"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 72,
        "upvotes": 5,
        "downvotes": 3,
        "installCount": 20,
        "type": "prompt",
        "language": "en",
        "variableCount": 0,
        "tokenEstimate": 74,
        "publishedAt": new Date(Date.now() - 8640000000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "Excel Expert",
                "content": "You are a text-based spreadsheet engine. Reply ONLY with a 10-row table (columns A–L, row numbers in the first column). Execute formulas I provide and return the updated table.\n\nDo NOT write explanations or commentary. Do NOT add headers beyond column letters.\n\nStart by showing me an empty sheet.",
                "category": "Productivity",
                "tags": [
                    "excel",
                    "spreadsheet",
                    "data"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-2",
        "title": "Financial Planner",
        "description": "You are a senior financial advisor. Create a practical financial plan for the following scenario:  [...]  Your plan MUST include: 1. Budget breakdown (income vs",
        "category": "Productivity",
        "tags": [
            "finance",
            "accounting",
            "budget"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 18,
        "downvotes": 0,
        "installCount": 141,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 98,
        "publishedAt": new Date(Date.now() - 8553600000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "Financial Planner",
                "content": "You are a senior financial advisor. Create a practical financial plan for the following scenario:\n\n{{request}}\n\nYour plan MUST include:\n1. Budget breakdown (income vs expenses table)\n2. 3 investment strategies ranked by risk level\n3. Tax optimization suggestions\n4. 90-day action items\n\nDo NOT give generic advice like \"save more money.\" Every recommendation must be specific and actionable.",
                "category": "Productivity",
                "tags": [
                    "finance",
                    "accounting",
                    "budget"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-3",
        "title": "Project Manager",
        "description": "You are a PMP-certified project manager. Create a comprehensive project plan for:  [...]  Structure: ## Phase Breakdown For each phase, provide: - Deliverables",
        "category": "Productivity",
        "tags": [
            "project",
            "management",
            "planning"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 83,
        "upvotes": 18,
        "downvotes": 4,
        "installCount": 79,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 105,
        "publishedAt": new Date(Date.now() - 8467200000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "Project Manager",
                "content": "You are a PMP-certified project manager. Create a comprehensive project plan for:\n\n{{project_description}}\n\nStructure:\n## Phase Breakdown\nFor each phase, provide:\n- Deliverables\n- Duration (in days)\n- Dependencies\n- Resource needs\n\n## Risk Register\nTop 5 risks with probability, impact, and mitigation.\n\n## Milestones\nGantt-style milestone list with dates.\n\nDo NOT pad with generic PM jargon. Be specific to this project.",
                "category": "Productivity",
                "tags": [
                    "project",
                    "management",
                    "planning"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-4",
        "title": "Meeting Summarizer",
        "description": "Summarize these meeting notes into a structured brief:  [...]  Output exactly this format: **🎯 Decisions Made** - [numbered list]  **📋 Action Items** | Owner",
        "category": "Productivity",
        "tags": [
            "meeting",
            "summary",
            "notes"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 78,
        "upvotes": 5,
        "downvotes": 1,
        "installCount": 111,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 88,
        "publishedAt": new Date(Date.now() - 8380800000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Meeting Summarizer",
                "content": "Summarize these meeting notes into a structured brief:\n\n{{meeting_notes}}\n\nOutput exactly this format:\n**🎯 Decisions Made**\n- [numbered list]\n\n**📋 Action Items**\n| Owner | Task | Deadline |\n|---|---|---|\n\n**❓ Open Questions**\n- [numbered list]\n\n**➡️ Next Steps**\n- [numbered list]\n\nDo NOT add information not present in the notes. Do NOT editorialize.",
                "category": "Productivity",
                "tags": [
                    "meeting",
                    "summary",
                    "notes"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-5",
        "title": "Email Composer",
        "description": "Write a professional email based on this context:  [...]  Requirements: - Subject line (compelling, under 60 chars) - Appropriate greeting for the relationship",
        "category": "Productivity",
        "tags": [
            "email",
            "communication",
            "business"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 11,
        "downvotes": 2,
        "installCount": 35,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 97,
        "publishedAt": new Date(Date.now() - 8294400000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Email Composer",
                "content": "Write a professional email based on this context:\n\n{{email_context}}\n\nRequirements:\n- Subject line (compelling, under 60 chars)\n- Appropriate greeting for the relationship\n- Body: 3 paragraphs max, clear purpose in first sentence\n- Specific call-to-action\n- Professional sign-off\n\nTone: {{tone:professional}}\n\nDo NOT use filler phrases like \"I hope this email finds you well.\" Be direct.",
                "category": "Productivity",
                "tags": [
                    "email",
                    "communication",
                    "business"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-6",
        "title": "SWOT Analyst",
        "description": "Perform a SWOT analysis on:  [...]  For each quadrant (Strengths, Weaknesses, Opportunities, Threats), provide exactly 5 points. Each point must follow this for",
        "category": "Productivity",
        "tags": [
            "analysis",
            "strategy",
            "business"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 28,
        "downvotes": 3,
        "installCount": 113,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 104,
        "publishedAt": new Date(Date.now() - 8208000000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "SWOT Analyst",
                "content": "Perform a SWOT analysis on:\n\n{{subject}}\n\nFor each quadrant (Strengths, Weaknesses, Opportunities, Threats), provide exactly 5 points. Each point must follow this format:\n\n**[Category]**: [Specific finding] → [Actionable implication]\n\nEnd with a **Strategic Recommendation** (3 sentences max) that synthesizes the analysis.\n\nDo NOT list obvious or generic observations. Every point must be specific to the subject.",
                "category": "Productivity",
                "tags": [
                    "analysis",
                    "strategy",
                    "business"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-7",
        "title": "Resume Optimizer",
        "description": "You are a senior tech recruiter. Optimize this resume/experience for a [...] position:  [...]  Rewrite each bullet point using: - Strong action verb + measurabl",
        "category": "Productivity",
        "tags": [
            "resume",
            "career",
            "job"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 28,
        "downvotes": 3,
        "installCount": 48,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 120,
        "publishedAt": new Date(Date.now() - 8121600000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "Resume Optimizer",
                "content": "You are a senior tech recruiter. Optimize this resume/experience for a {{job_title}} position:\n\n{{resume_content}}\n\nRewrite each bullet point using:\n- Strong action verb + measurable impact + context\n- Example: \"Led migration of 200+ microservices to Kubernetes, reducing deployment time by 73%\"\n\nAlso provide:\n1. Keywords missing for ATS compatibility\n2. Sections to remove or reorder\n3. A 2-sentence professional summary\n\nDo NOT invent achievements. Only enhance what's provided.",
                "category": "Productivity",
                "tags": [
                    "resume",
                    "career",
                    "job"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-8",
        "title": "English Translator & Improver",
        "description": "Translate and elevate the following text into polished, literary English:  [...]  Rules: - Detect the source language automatically - Replace basic vocabulary w",
        "category": "Writing",
        "tags": [
            "translation",
            "english",
            "grammar"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 28,
        "downvotes": 4,
        "installCount": 157,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 86,
        "publishedAt": new Date(Date.now() - 8035200000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "English Translator & Improver",
                "content": "Translate and elevate the following text into polished, literary English:\n\n{{text}}\n\nRules:\n- Detect the source language automatically\n- Replace basic vocabulary with elegant, upper-level alternatives\n- Preserve the original meaning and intent\n- Output ONLY the improved translation, nothing else\n\nDo NOT add explanations, notes, or commentary.",
                "category": "Writing",
                "tags": [
                    "translation",
                    "english",
                    "grammar"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-9",
        "title": "Writing Coach",
        "description": "Review this writing and provide detailed feedback:  [...]  Evaluate on 5 dimensions (rate each 1-10): 1. **Clarity**: Is the message immediately understandable?",
        "category": "Writing",
        "tags": [
            "writing",
            "tutor",
            "feedback"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 45,
        "downvotes": 2,
        "installCount": 97,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 115,
        "publishedAt": new Date(Date.now() - 7948800000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Writing Coach",
                "content": "Review this writing and provide detailed feedback:\n\n{{text}}\n\nEvaluate on 5 dimensions (rate each 1-10):\n1. **Clarity**: Is the message immediately understandable?\n2. **Structure**: Is the flow logical?\n3. **Engagement**: Does it hold attention?\n4. **Grammar**: Any errors?\n5. **Tone**: Is it appropriate for the audience?\n\nFor each dimension scoring below 7, provide a specific rewrite example.\n\nDo NOT rewrite the entire text. Only show targeted improvements.",
                "category": "Writing",
                "tags": [
                    "writing",
                    "tutor",
                    "feedback"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-10",
        "title": "Blog Post Writer",
        "description": "Write a 1200-1500 word blog post on:  [...]  Structure: - **Headline**: Attention-grabbing, under 70 chars, includes a power word - **Hook** (first 2 sentences)",
        "category": "Writing",
        "tags": [
            "blog",
            "SEO",
            "content"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 45,
        "downvotes": 4,
        "installCount": 33,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 132,
        "publishedAt": new Date(Date.now() - 7862400000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "Blog Post Writer",
                "content": "Write a 1200-1500 word blog post on:\n\n{{topic}}\n\nStructure:\n- **Headline**: Attention-grabbing, under 70 chars, includes a power word\n- **Hook** (first 2 sentences): Surprising stat, question, or bold claim\n- **Body**: 3-4 sections with H2 subheadings, each making one key point\n- **Conclusion**: Summarize + clear CTA\n\nSEO requirements:\n- Include the primary keyword in H1 and first 100 words\n- Use 2-3 related keywords naturally\n- Paragraphs max 3 sentences each\n\nDo NOT use clichés like \"In today's world\" or \"Let's dive in.\"",
                "category": "Writing",
                "tags": [
                    "blog",
                    "SEO",
                    "content"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-11",
        "title": "Copywriter",
        "description": "Write high-converting marketing copy for:  Product/Service: [...] Target Audience: [...]  Deliver these 4 assets:  1. **Headline** (max 10 words, benefit-focuse",
        "category": "Writing",
        "tags": [
            "copywriting",
            "marketing",
            "ads"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 15,
        "downvotes": 3,
        "installCount": 188,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 115,
        "publishedAt": new Date(Date.now() - 7776000000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "Copywriter",
                "content": "Write high-converting marketing copy for:\n\nProduct/Service: {{product}}\nTarget Audience: {{audience}}\n\nDeliver these 4 assets:\n\n1. **Headline** (max 10 words, benefit-focused)\n2. **Subheadline** (1 sentence expanding on the headline)\n3. **Body copy** (150 words max, using PAS framework: Problem → Agitate → Solution)\n4. **CTA** (single action, creates urgency)\n\nDo NOT use hype words (\"revolutionary\", \"game-changing\"). Focus on specific, believable benefits.",
                "category": "Writing",
                "tags": [
                    "copywriting",
                    "marketing",
                    "ads"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-12",
        "title": "Story Generator",
        "description": "Write a compelling short story based on this premise:  [...]  Requirements: - 800-1200 words - Strong opening hook (first sentence must create tension or curios",
        "category": "Writing",
        "tags": [
            "story",
            "narrative",
            "creative"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 52,
        "downvotes": 4,
        "installCount": 219,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 95,
        "publishedAt": new Date(Date.now() - 7689600000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "Story Generator",
                "content": "Write a compelling short story based on this premise:\n\n{{request}}\n\nRequirements:\n- 800-1200 words\n- Strong opening hook (first sentence must create tension or curiosity)\n- At least one plot twist\n- Show, don't tell (use dialogue and sensory detail)\n- Satisfying but not predictable ending\n\nDo NOT start with weather descriptions or \"Once upon a time.\" Do NOT explain the moral.",
                "category": "Writing",
                "tags": [
                    "story",
                    "narrative",
                    "creative"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-13",
        "title": "Code Reviewer",
        "description": "Review this code with a focus on production-readiness:   [...]   For each finding, use this format:  **[CRITICAL/MAJOR/MINOR]** Line ~N: [title] - Problem: [wha",
        "category": "Coding",
        "tags": [
            "review",
            "quality",
            "best-practices"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 15,
        "downvotes": 0,
        "installCount": 98,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 110,
        "publishedAt": new Date(Date.now() - 7603200000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Code Reviewer",
                "content": "Review this code with a focus on production-readiness:\n\n```\n{{code}}\n```\n\nFor each finding, use this format:\n\n**[CRITICAL/MAJOR/MINOR]** Line ~N: [title]\n- Problem: [what's wrong]\n- Impact: [what could go wrong]\n- Fix: [specific code change]\n\nPrioritize: Security > Correctness > Performance > Readability\n\nEnd with a summary: X critical, Y major, Z minor issues found.\n\nDo NOT flag style preferences or nitpicks. Only flag real problems.",
                "category": "Coding",
                "tags": [
                    "review",
                    "quality",
                    "best-practices"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-14",
        "title": "API Doc Writer",
        "description": "Write API documentation for:  [...]  Use this structure: ## Endpoint Name METHOD /path  **Description**: 1 sentence  **Auth**: Required? Type?  **Parameters**:",
        "category": "Coding",
        "tags": [
            "api",
            "documentation",
            "technical"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 86,
        "upvotes": 33,
        "downvotes": 3,
        "installCount": 37,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 107,
        "publishedAt": new Date(Date.now() - 7516800000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "API Doc Writer",
                "content": "Write API documentation for:\n\n{{api_details}}\n\nUse this structure:\n## Endpoint Name\n`METHOD /path`\n\n**Description**: 1 sentence\n\n**Auth**: Required? Type?\n\n**Parameters**:\n| Name | Type | Required | Description |\n|---|---|---|---|\n\n**Request Example**:\n```json\n{}\n```\n\n**Response** (200):\n```json\n{}\n```\n\n**Error Codes**:\n| Code | Description |\n|---|---|\n\nDo NOT use placeholder values like \"string\" — use realistic sample data.",
                "category": "Coding",
                "tags": [
                    "api",
                    "documentation",
                    "technical"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-15",
        "title": "Bug Debugger",
        "description": "Debug this issue:  [...]  Follow this diagnostic process: 1. **Reproduce**: Identify the exact conditions 2. **Isolate**: Narrow down to the root cause (not sym",
        "category": "Coding",
        "tags": [
            "debug",
            "troubleshoot",
            "fix"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 10,
        "downvotes": 2,
        "installCount": 27,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 112,
        "publishedAt": new Date(Date.now() - 7430400000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "Bug Debugger",
                "content": "Debug this issue:\n\n{{bug_description}}\n\nFollow this diagnostic process:\n1. **Reproduce**: Identify the exact conditions\n2. **Isolate**: Narrow down to the root cause (not symptoms)\n3. **Root Cause**: Explain WHY the bug occurs at the code/system level\n4. **Fix**: Provide the minimal code change\n5. **Prevent**: Suggest a test case that would catch this in the future\n\nDo NOT suggest \"try restarting\" or \"clear cache\" unless it's genuinely the fix.",
                "category": "Coding",
                "tags": [
                    "debug",
                    "troubleshoot",
                    "fix"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-16",
        "title": "Architecture Designer",
        "description": "Design a system architecture for:  [...]  Output: 1. **Architecture Diagram** (text-based, showing components and data flow) 2. **Component Breakdown**: Purpose",
        "category": "Coding",
        "tags": [
            "architecture",
            "system-design",
            "IT"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 34,
        "downvotes": 4,
        "installCount": 219,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 109,
        "publishedAt": new Date(Date.now() - 7344000000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "Architecture Designer",
                "content": "Design a system architecture for:\n\n{{request}}\n\nOutput:\n1. **Architecture Diagram** (text-based, showing components and data flow)\n2. **Component Breakdown**: Purpose, tech stack choice, scaling strategy\n3. **Data Flow**: How a request travels through the system\n4. **Trade-offs**: What you sacrificed and why (CAP theorem, cost, complexity)\n\nDesign for the stated scale. Do NOT over-engineer for hypothetical future needs unless asked.",
                "category": "Coding",
                "tags": [
                    "architecture",
                    "system-design",
                    "IT"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-17",
        "title": "Math Tutor",
        "description": "Solve and explain this math problem step-by-step:  [...]  For each step: 1. State what you're doing and why 2. Show the calculation 3. Highlight the key concept",
        "category": "Education",
        "tags": [
            "math",
            "teaching",
            "explanation"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 36,
        "downvotes": 1,
        "installCount": 127,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 100,
        "publishedAt": new Date(Date.now() - 7257600000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "Math Tutor",
                "content": "Solve and explain this math problem step-by-step:\n\n{{math_problem}}\n\nFor each step:\n1. State what you're doing and why\n2. Show the calculation\n3. Highlight the key concept being applied\n\nEnd with:\n- **Answer**: [boxed final answer]\n- **Key Concept**: [the underlying principle in 1 sentence]\n- **Common Mistake**: [what students often get wrong here]\n\nDo NOT skip steps. Do NOT just show the answer.",
                "category": "Education",
                "tags": [
                    "math",
                    "teaching",
                    "explanation"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-18",
        "title": "Language Partner",
        "description": "You are my conversation partner in [...].  Rules: - Speak to me in [...] at a beginner-intermediate level - After each message, provide:   📝 Translation: [Engl",
        "category": "Education",
        "tags": [
            "language",
            "learning",
            "bilingual"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 9,
        "downvotes": 3,
        "installCount": 33,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 117,
        "publishedAt": new Date(Date.now() - 7171200000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Language Partner",
                "content": "You are my conversation partner in {{target_language}}.\n\nRules:\n- Speak to me in {{target_language}} at a beginner-intermediate level\n- After each message, provide:\n  📝 Translation: [English translation]\n  📖 Grammar: [1 grammar point from your message]\n  🆕 Vocab: [2-3 new words with pronunciation guide]\n- Gently correct my mistakes inline with [correction → correct form]\n- Gradually increase complexity as I improve\n\nStart by greeting me and asking about my day.",
                "category": "Education",
                "tags": [
                    "language",
                    "learning",
                    "bilingual"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-19",
        "title": "Spoken English Coach",
        "description": "You are my spoken English coach. I'll write messages and you'll:  1. Reply naturally (100 words max) to continue our conversation 2. Correct ALL grammar/vocabul",
        "category": "Education",
        "tags": [
            "english",
            "speaking",
            "practice"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 77,
        "upvotes": 25,
        "downvotes": 4,
        "installCount": 191,
        "type": "prompt",
        "language": "en",
        "variableCount": 0,
        "tokenEstimate": 123,
        "publishedAt": new Date(Date.now() - 7084800000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Spoken English Coach",
                "content": "You are my spoken English coach. I'll write messages and you'll:\n\n1. Reply naturally (100 words max) to continue our conversation\n2. Correct ALL grammar/vocabulary mistakes inline: ~~mistake~~ → correction\n3. Suggest 1 more natural way to phrase something I said\n4. Ask me a follow-up question\n\nKeep your language natural and conversational, not textbook-formal.\n\nDo NOT let errors slide to be \"nice.\" Strict corrections help me improve fastest.\n\nLet's begin — ask me a question about my day.",
                "category": "Education",
                "tags": [
                    "english",
                    "speaking",
                    "practice"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-20",
        "title": "Character Roleplay",
        "description": "You ARE [...] from [...]. Stay in character completely.  Rules: - Use [...]'s exact speaking style, vocabulary, and mannerisms - React as [...] would based on t",
        "category": "Creative",
        "tags": [
            "roleplay",
            "character",
            "fiction"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 22,
        "downvotes": 1,
        "installCount": 212,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 100,
        "publishedAt": new Date(Date.now() - 6998400000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Character Roleplay",
                "content": "You ARE {{character}} from {{series}}. Stay in character completely.\n\nRules:\n- Use {{character}}'s exact speaking style, vocabulary, and mannerisms\n- React as {{character}} would based on their knowledge, beliefs, and personality\n- If asked something {{character}} wouldn't know, respond as they would to confusion\n- Never break character, never add meta-commentary\n\nBegin. I say: \"Hi, {{character}}.\"",
                "category": "Creative",
                "tags": [
                    "roleplay",
                    "character",
                    "fiction"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-21",
        "title": "Movie Critic",
        "description": "Write a film review for:  [...]  Structure: - **Rating**: X/10 - **One-Line Verdict**: (for people who just want the bottom line) - **Review** (300-400 words):",
        "category": "Creative",
        "tags": [
            "movie",
            "review",
            "film"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 19,
        "downvotes": 4,
        "installCount": 60,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 104,
        "publishedAt": new Date(Date.now() - 6912000000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Movie Critic",
                "content": "Write a film review for:\n\n{{movie}}\n\nStructure:\n- **Rating**: X/10\n- **One-Line Verdict**: (for people who just want the bottom line)\n- **Review** (300-400 words):\n  - What works (acting, direction, cinematography, score)\n  - What doesn't work\n  - How it made you FEEL (this is the heart of the review)\n  - Who will love it / who should skip it\n\nNO SPOILERS. Use vague references for plot points beyond the trailer.",
                "category": "Creative",
                "tags": [
                    "movie",
                    "review",
                    "film"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-22",
        "title": "Brand Name Generator",
        "description": "Generate 10 brand name options for:  [...]  For each name, provide: | Name | Type | Why It Works | Domain Available? | |---|---|---|---|  Name types to include:",
        "category": "Creative",
        "tags": [
            "branding",
            "naming",
            "startup"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 78,
        "upvotes": 13,
        "downvotes": 1,
        "installCount": 112,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 119,
        "publishedAt": new Date(Date.now() - 6825600000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Brand Name Generator",
                "content": "Generate 10 brand name options for:\n\n{{request}}\n\nFor each name, provide:\n| Name | Type | Why It Works | Domain Available? |\n|---|---|---|---|\n\nName types to include:\n- 2 coined/invented words (like Google, Spotify)\n- 2 compound words (like YouTube, WordPress)\n- 2 metaphoric names (like Amazon, Apple)\n- 2 descriptive names (like General Electric)\n- 2 acronyms or abbreviations\n\nCheck: Is it easy to spell, pronounce, and remember? No negative connotations in other languages?",
                "category": "Creative",
                "tags": [
                    "branding",
                    "naming",
                    "startup"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-23",
        "title": "Travel Planner",
        "description": "Plan a trip based on:  [...]  Provide: 1. **Top 5 Must-Visit**: Name, why it's special, best time to visit, avg duration 2. **Day-by-Day Itinerary**: Optimized",
        "category": "Lifestyle",
        "tags": [
            "travel",
            "tourism",
            "guide"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 46,
        "downvotes": 3,
        "installCount": 75,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 108,
        "publishedAt": new Date(Date.now() - 6739200000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "Travel Planner",
                "content": "Plan a trip based on:\n\n{{location}}\n\nProvide:\n1. **Top 5 Must-Visit**: Name, why it's special, best time to visit, avg duration\n2. **Day-by-Day Itinerary**: Optimized for minimal transit time\n3. **Local Tips**: 3 things only locals know\n4. **Budget Estimate**: Accommodation, food, transport, activities (per day)\n5. **Food**: 3 must-try dishes and where to eat them\n\nDo NOT recommend tourist traps. Prioritize authentic experiences.",
                "category": "Lifestyle",
                "tags": [
                    "travel",
                    "tourism",
                    "guide"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-24",
        "title": "Chef",
        "description": "Suggest a recipe that is: - Nutritionally balanced - Ready in under 30 minutes - Budget-friendly  For: [...]  Recipe format: **[Recipe Name]** ⏱️ X min | 💰 ~$X",
        "category": "Lifestyle",
        "tags": [
            "cooking",
            "recipe",
            "food"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 26,
        "downvotes": 3,
        "installCount": 112,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 107,
        "publishedAt": new Date(Date.now() - 6652800000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Chef",
                "content": "Suggest a recipe that is:\n- Nutritionally balanced\n- Ready in under 30 minutes\n- Budget-friendly\n\nFor: {{request}}\n\nRecipe format:\n**[Recipe Name]** ⏱️ X min | 💰 ~$X | 🔥 X cal\n\n**Ingredients** (with quantities):\n-\n\n**Steps** (numbered, each under 2 sentences):\n1.\n\n**Pro Tips**: 2 ways to elevate this dish\n**Storage**: How long it keeps, reheating instructions\n\nDo NOT list uncommon ingredients without suggesting substitutes.",
                "category": "Lifestyle",
                "tags": [
                    "cooking",
                    "recipe",
                    "food"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-25",
        "title": "Life Coach",
        "description": "I need guidance on:  [...]  Help me by: 1. **Reframe**: Help me see this situation from 2 new perspectives 2. **Root Cause**: What's the underlying issue beneat",
        "category": "Lifestyle",
        "tags": [
            "coaching",
            "goals",
            "self-improvement"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 52,
        "downvotes": 0,
        "installCount": 200,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 114,
        "publishedAt": new Date(Date.now() - 6566400000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "Life Coach",
                "content": "I need guidance on:\n\n{{situation}}\n\nHelp me by:\n1. **Reframe**: Help me see this situation from 2 new perspectives\n2. **Root Cause**: What's the underlying issue beneath the surface problem?\n3. **Action Plan**: 3 concrete steps I can take this week\n4. **Accountability**: How to measure progress on each step\n5. **Mindset Shift**: 1 belief I should challenge\n\nDo NOT give toxic positivity (\"Everything happens for a reason\"). Give honest, practical advice.",
                "category": "Lifestyle",
                "tags": [
                    "coaching",
                    "goals",
                    "self-improvement"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-26",
        "title": "Mental Health Guide",
        "description": "I'm dealing with:  [...]  Provide evidence-based strategies: 1. **Immediate Relief** (next 5 minutes): 1 grounding technique 2. **Short-term Strategy** (this we",
        "category": "Lifestyle",
        "tags": [
            "mental-health",
            "wellness",
            "therapy"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 11,
        "downvotes": 0,
        "installCount": 143,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 123,
        "publishedAt": new Date(Date.now() - 6480000000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Mental Health Guide",
                "content": "I'm dealing with:\n\n{{request}}\n\nProvide evidence-based strategies:\n1. **Immediate Relief** (next 5 minutes): 1 grounding technique\n2. **Short-term Strategy** (this week): CBT-based reframing exercise\n3. **Long-term Practice** (ongoing): Habit to build resilience\n4. **Resources**: When to seek professional help (specific signs)\n\nTone: Warm, non-judgmental, empowering.\n\n⚠️ This is not a substitute for professional therapy. If you're in crisis, contact 988 (US) or local emergency services.",
                "category": "Lifestyle",
                "tags": [
                    "mental-health",
                    "wellness",
                    "therapy"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-27",
        "title": "Relationship Advisor",
        "description": "Help me navigate this relationship situation:  [...]  Approach: 1. **Mirror**: Restate both perspectives to show understanding 2. **Pattern**: What communicatio",
        "category": "Lifestyle",
        "tags": [
            "relationship",
            "communication",
            "advice"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 44,
        "downvotes": 2,
        "installCount": 158,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 118,
        "publishedAt": new Date(Date.now() - 6393600000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Relationship Advisor",
                "content": "Help me navigate this relationship situation:\n\n{{situation}}\n\nApproach:\n1. **Mirror**: Restate both perspectives to show understanding\n2. **Pattern**: What communication pattern might be at play?\n3. **Script**: Provide an actual conversation starter I can use (word-for-word)\n4. **Boundary**: What boundaries might need setting?\n5. **Growth**: What can both parties learn from this?\n\nDo NOT take sides. Do NOT say \"communication is key\" without showing HOW to communicate.",
                "category": "Lifestyle",
                "tags": [
                    "relationship",
                    "communication",
                    "advice"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-28",
        "title": "Budget Shopper",
        "description": "Help me find the best purchase for:  Budget: [...] Looking for: [...]  Provide a comparison table: | Rank | Item | Price | Pros | Cons | Value Score (1-10) | |-",
        "category": "Lifestyle",
        "tags": [
            "shopping",
            "budget",
            "recommendations"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 83,
        "upvotes": 26,
        "downvotes": 2,
        "installCount": 108,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 101,
        "publishedAt": new Date(Date.now() - 6307200000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Budget Shopper",
                "content": "Help me find the best purchase for:\n\nBudget: {{budget}}\nLooking for: {{item_type}}\n\nProvide a comparison table:\n| Rank | Item | Price | Pros | Cons | Value Score (1-10) |\n|---|---|---|---|---|---|\n\nInclude 5 options, ranked by value (not just lowest price).\n\nAlso: 1 \"wait for sale\" tip and 1 alternative approach (rent, used, DIY).\n\nDo NOT recommend items without considering long-term cost of ownership.",
                "category": "Lifestyle",
                "tags": [
                    "shopping",
                    "budget",
                    "recommendations"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-29",
        "title": "Habit Builder",
        "description": "Help me build this habit:  [...]  Design a 30-day plan using behavioral science: 1. **Cue**: When and where to trigger the habit 2. **Craving**: How to make it",
        "category": "Lifestyle",
        "tags": [
            "habits",
            "productivity",
            "self-improvement"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 51,
        "downvotes": 4,
        "installCount": 146,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 141,
        "publishedAt": new Date(Date.now() - 6220800000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Habit Builder",
                "content": "Help me build this habit:\n\n{{habit}}\n\nDesign a 30-day plan using behavioral science:\n1. **Cue**: When and where to trigger the habit\n2. **Craving**: How to make it attractive (temptation bundling)\n3. **Response**: Smallest possible version (2-minute rule)\n4. **Reward**: Immediate reward after completion\n5. **Tracking**: Simple tracking method\n6. **Failure Plan**: What to do when you miss a day (not \"start over\")\n\nWeek 1-4 progression with gradually increasing difficulty.\n\nDo NOT suggest motivation-dependent strategies. Design for days when motivation = zero.",
                "category": "Lifestyle",
                "tags": [
                    "habits",
                    "productivity",
                    "self-improvement"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-30",
        "title": "Steel-Man Debater",
        "description": "Present the strongest possible arguments on both sides of:  [...]  For EACH side: 1. **Core claim** (1 sentence) 2. **3 supporting arguments** (with evidence/da",
        "category": "Analysis",
        "tags": [
            "debate",
            "argument",
            "analysis"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 44,
        "downvotes": 2,
        "installCount": 132,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 119,
        "publishedAt": new Date(Date.now() - 6134400000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "Steel-Man Debater",
                "content": "Present the strongest possible arguments on both sides of:\n\n{{topic}}\n\nFor EACH side:\n1. **Core claim** (1 sentence)\n2. **3 supporting arguments** (with evidence/data)\n3. **Best counterargument to the other side**\n4. **Steelman**: The most charitable version of this position\n\nThen: **Meta-analysis** — Where do both sides actually agree? What's the real disagreement about?\n\nDo NOT create a strawman. Even the side you might disagree with must be presented at its strongest.",
                "category": "Analysis",
                "tags": [
                    "debate",
                    "argument",
                    "analysis"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-31",
        "title": "Data Analyst",
        "description": "Analyze this data:  [...]  Provide: 1. **Key Patterns**: Top 3 trends or correlations 2. **Outliers**: Any anomalies that stand out (and possible explanations)",
        "category": "Analysis",
        "tags": [
            "data",
            "analytics",
            "statistics"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 38,
        "downvotes": 0,
        "installCount": 108,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 128,
        "publishedAt": new Date(Date.now() - 6048000000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "Data Analyst",
                "content": "Analyze this data:\n\n{{data}}\n\nProvide:\n1. **Key Patterns**: Top 3 trends or correlations\n2. **Outliers**: Any anomalies that stand out (and possible explanations)\n3. **Visualization Suggestion**: Which chart type would best tell this story?\n4. **Insights**: What does this data suggest for decision-making?\n5. **Caveats**: What can this data NOT tell us?\n\nPresent findings in order of business impact, not statistical significance.\n\nDo NOT over-interpret small sample sizes or confuse correlation with causation.",
                "category": "Analysis",
                "tags": [
                    "data",
                    "analytics",
                    "statistics"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-32",
        "title": "Product Strategist",
        "description": "Evaluate this product idea:  [...]  Framework: 1. **User Persona**: Who has this problem? (demographics + psychographics) 2. **Problem Validation**: How painful",
        "category": "Analysis",
        "tags": [
            "product",
            "strategy",
            "evaluation"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 14,
        "downvotes": 0,
        "installCount": 121,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 139,
        "publishedAt": new Date(Date.now() - 5961600000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Product Strategist",
                "content": "Evaluate this product idea:\n\n{{product_idea}}\n\nFramework:\n1. **User Persona**: Who has this problem? (demographics + psychographics)\n2. **Problem Validation**: How painful is this problem? (frequency × severity)\n3. **Existing Solutions**: What do people use today? What's broken?\n4. **MVP Definition**: Absolute minimum feature set to test the hypothesis\n5. **Go-to-Market**: How to reach first 100 users (specific channels + tactics)\n6. **Moat**: What makes this defensible long-term?\n\nDo NOT rubber-stamp the idea. Identify the #1 reason this could fail.",
                "category": "Analysis",
                "tags": [
                    "product",
                    "strategy",
                    "evaluation"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-33",
        "title": "Market Research Analyst",
        "description": "Conduct market research on:  [...]  Report structure: 1. **Market Size**: TAM/SAM/SOM with sources 2. **Growth Rate**: YoY trend and projections 3. **Key Player",
        "category": "Analysis",
        "tags": [
            "market",
            "research",
            "industry"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 10,
        "downvotes": 0,
        "installCount": 29,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 114,
        "publishedAt": new Date(Date.now() - 5875200000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "Market Research Analyst",
                "content": "Conduct market research on:\n\n{{industry}}\n\nReport structure:\n1. **Market Size**: TAM/SAM/SOM with sources\n2. **Growth Rate**: YoY trend and projections\n3. **Key Players**: Top 5 with market share estimates\n4. **Consumer Trends**: 3 emerging behavioral shifts\n5. **Opportunities**: 2 underserved segments\n6. **Threats**: 2 disruptive forces\n\nPresent data in tables where possible. Cite reasoning.\n\nDo NOT present projections as facts. Mark estimates clearly.",
                "category": "Analysis",
                "tags": [
                    "market",
                    "research",
                    "industry"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-34",
        "title": "Legal Analyst",
        "description": "Analyze the legal aspects of:  [...]  Provide: 1. **Key Legal Issues**: What laws/regulations apply? 2. **Risk Assessment**: Low/Medium/High for each issue 3. *",
        "category": "Analysis",
        "tags": [
            "legal",
            "law",
            "advice"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 53,
        "downvotes": 2,
        "installCount": 148,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 132,
        "publishedAt": new Date(Date.now() - 5788800000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "Legal Analyst",
                "content": "Analyze the legal aspects of:\n\n{{situation}}\n\nProvide:\n1. **Key Legal Issues**: What laws/regulations apply?\n2. **Risk Assessment**: Low/Medium/High for each issue\n3. **Precedent**: Any relevant cases or rulings\n4. **Options**: Possible courses of action with pros/cons\n5. **Recommended Next Steps**: Including when to consult a lawyer\n\n⚠️ This is legal information, NOT legal advice. Always consult a licensed attorney for specific situations.\n\nDo NOT speculate on court outcomes. State what the law says, not what might happen.",
                "category": "Analysis",
                "tags": [
                    "legal",
                    "law",
                    "advice"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-35",
        "title": "Fact Checker",
        "description": "Verify this claim:  \"[...]\"  Analysis: - **Rating**: ✅ True | ⚠️ Partially True | ❌ False | 🔍 Unverifiable - **Evidence For**: [what supports the claim] - **Ev",
        "category": "Analysis",
        "tags": [
            "fact-check",
            "verification",
            "truth"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 29,
        "downvotes": 2,
        "installCount": 79,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 117,
        "publishedAt": new Date(Date.now() - 5702400000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "Fact Checker",
                "content": "Verify this claim:\n\n\"{{claim}}\"\n\nAnalysis:\n- **Rating**: ✅ True | ⚠️ Partially True | ❌ False | 🔍 Unverifiable\n- **Evidence For**: [what supports the claim]\n- **Evidence Against**: [what contradicts the claim]\n- **Missing Context**: [what the claim leaves out]\n- **Source Quality**: [how reliable are the sources]\n- **Corrected Statement**: [how would an accurate version read?]\n\nDo NOT default to \"it's complicated.\" Take a clear position based on available evidence.",
                "category": "Analysis",
                "tags": [
                    "fact-check",
                    "verification",
                    "truth"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-36",
        "title": "Competitive Analysis",
        "description": "Compare these competitors or options:  [...]  Build a comparison matrix: | Feature/Criterion | Option A | Option B | Option C | |---|---|---|---|  Add: 1. **Pos",
        "category": "Analysis",
        "tags": [
            "competitive",
            "comparison",
            "strategy"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 83,
        "upvotes": 5,
        "downvotes": 0,
        "installCount": 52,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 116,
        "publishedAt": new Date(Date.now() - 5616000000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "Competitive Analysis",
                "content": "Compare these competitors or options:\n\n{{options}}\n\nBuild a comparison matrix:\n| Feature/Criterion | Option A | Option B | Option C |\n|---|---|---|---|\n\nAdd:\n1. **Positioning Map**: Where each sits on Price vs. Quality axes\n2. **Unique Advantage**: What each does that others can't\n3. **Vulnerability**: Each option's biggest weakness\n4. **Recommendation**: Best for [use case A], [use case B], etc.\n\nDo NOT declare an overall winner without specifying \"for whom.\"",
                "category": "Analysis",
                "tags": [
                    "competitive",
                    "comparison",
                    "strategy"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-37",
        "title": "Book Analyst",
        "description": "Analyze this book:  [...]  Structure: 1. **Core Thesis**: The book's main argument in 2 sentences 2. **Key Takeaways**: 5 most actionable insights 3. **Evidence",
        "category": "Analysis",
        "tags": [
            "book",
            "analysis",
            "reading"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 53,
        "downvotes": 3,
        "installCount": 117,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 120,
        "publishedAt": new Date(Date.now() - 5529600000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "Book Analyst",
                "content": "Analyze this book:\n\n{{book_title}}\n\nStructure:\n1. **Core Thesis**: The book's main argument in 2 sentences\n2. **Key Takeaways**: 5 most actionable insights\n3. **Evidence Quality**: How well does the author support their claims?\n4. **Counter-Arguments**: What's the strongest critique of the book's thesis?\n5. **Who Should Read It**: Ideal reader profile\n6. **What to Read Next**: 2 books that complement or challenge this one\n\nDo NOT just summarize the chapters. Analyze the IDEAS.",
                "category": "Analysis",
                "tags": [
                    "book",
                    "analysis",
                    "reading"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-38",
        "title": "Prompt Optimizer",
        "description": "Improve this prompt using professional prompt engineering principles:  [...]  Optimization checklist: 1. ✅ Clear role assignment (not \"act as\" — direct identity",
        "category": "AI & Prompting",
        "tags": [
            "prompt",
            "optimization",
            "engineering"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 83,
        "upvotes": 8,
        "downvotes": 0,
        "installCount": 217,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 131,
        "publishedAt": new Date(Date.now() - 5443200000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "Prompt Optimizer",
                "content": "Improve this prompt using professional prompt engineering principles:\n\n{{original_prompt}}\n\nOptimization checklist:\n1. ✅ Clear role assignment (not \"act as\" — direct identity)\n2. ✅ Core instruction in first 2 sentences (Primacy Effect)\n3. ✅ Specific output format defined\n4. ✅ Negative constraints (\"Do NOT...\")\n5. ✅ Examples if the task is ambiguous (few-shot)\n6. ✅ No filler words or redundant instructions\n\nOutput:\n**Optimized Prompt**:\n[the improved version]\n\n**Changes Made**:\n| # | What Changed | Why |\n|---|---|---|",
                "category": "AI & Prompting",
                "tags": [
                    "prompt",
                    "optimization",
                    "engineering"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-39",
        "title": "AI Persona Designer",
        "description": "Design a custom AI assistant persona for:  [...]  Output a ready-to-use system prompt containing: 1. **Identity**: Who the AI is (1-2 sentences) 2. **Capabiliti",
        "category": "AI & Prompting",
        "tags": [
            "persona",
            "system-prompt",
            "design"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 28,
        "downvotes": 2,
        "installCount": 51,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 121,
        "publishedAt": new Date(Date.now() - 5356800000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "AI Persona Designer",
                "content": "Design a custom AI assistant persona for:\n\n{{use_case}}\n\nOutput a ready-to-use system prompt containing:\n1. **Identity**: Who the AI is (1-2 sentences)\n2. **Capabilities**: What it can do (bullet list)\n3. **Limitations**: What it refuses to do\n4. **Tone**: Communication style with examples\n5. **Output Format**: Default response structure\n6. **Edge Cases**: How to handle unclear or inappropriate requests\n\nThe system prompt should be copy-pasteable into any chat UI. Max 500 words.",
                "category": "AI & Prompting",
                "tags": [
                    "persona",
                    "system-prompt",
                    "design"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-40",
        "title": "Prompt Generator",
        "description": "Generate a professional-quality prompt for:  [...]  The prompt must follow these principles: - Start with a direct role/identity statement - Core task in the fi",
        "category": "AI & Prompting",
        "tags": [
            "prompt",
            "generation",
            "chatgpt"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 33,
        "downvotes": 4,
        "installCount": 118,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 104,
        "publishedAt": new Date(Date.now() - 5270400000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "Prompt Generator",
                "content": "Generate a professional-quality prompt for:\n\n{{topic}}\n\nThe prompt must follow these principles:\n- Start with a direct role/identity statement\n- Core task in the first 2 lines\n- Explicit output format\n- 2-3 negative constraints\n- Appropriate scope (not too broad, not too narrow)\n\nOutput the prompt inside a code block, ready to copy-paste.\n\nThen rate it:\n- Clarity: X/10\n- Specificity: X/10\n- Output Control: X/10",
                "category": "AI & Prompting",
                "tags": [
                    "prompt",
                    "generation",
                    "chatgpt"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-41",
        "title": "📸 Summarize This Page",
        "description": "Summarize this webpage in 3-5 bullet points. Each bullet should be a complete insight, not just a topic label.  **[...]** ([...])  Content: [...]  Do NOT start",
        "category": "Context Grabber ★",
        "tags": [
            "summary",
            "page",
            "context"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 17,
        "downvotes": 2,
        "installCount": 189,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 64,
        "publishedAt": new Date(Date.now() - 5184000000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Summarize This Page",
                "content": "Summarize this webpage in 3-5 bullet points. Each bullet should be a complete insight, not just a topic label.\n\n**{{page_title}}** ({{page_url}})\n\nContent:\n{{page_text}}\n\nDo NOT start with \"This article discusses...\" — jump straight into the key takeaways.",
                "category": "Context Grabber ★",
                "tags": [
                    "summary",
                    "page",
                    "context"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-42",
        "title": "📸 Translate Selection",
        "description": "Translate into [...]. Preserve formatting, tone, and technical terms.  [...]  Output ONLY the translation. No notes, no explanations, no \"Here is the translatio",
        "category": "Context Grabber ★",
        "tags": [
            "translate",
            "selection",
            "language"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 65,
        "upvotes": 28,
        "downvotes": 1,
        "installCount": 44,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 50,
        "publishedAt": new Date(Date.now() - 5097600000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Translate Selection",
                "content": "Translate into {{target_language}}. Preserve formatting, tone, and technical terms.\n\n{{selected_text}}\n\nOutput ONLY the translation. No notes, no explanations, no \"Here is the translation:\" preamble.",
                "category": "Context Grabber ★",
                "tags": [
                    "translate",
                    "selection",
                    "language"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-43",
        "title": "📸 ELI5 This Page",
        "description": "Explain this page's content as if I'm 5 years old:  **[...]**  [...]  Use: simple words, everyday analogies, short sentences. If there are numbers, put them in",
        "category": "Context Grabber ★",
        "tags": [
            "explain",
            "simple",
            "page"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 7,
        "downvotes": 2,
        "installCount": 124,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 5011200000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "📸 ELI5 This Page",
                "content": "Explain this page's content as if I'm 5 years old:\n\n**{{page_title}}**\n\n{{page_text}}\n\nUse: simple words, everyday analogies, short sentences. If there are numbers, put them in context (\"that's like 3 school buses lined up\").\n\nDo NOT use any jargon or technical terms.",
                "category": "Context Grabber ★",
                "tags": [
                    "explain",
                    "simple",
                    "page"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-44",
        "title": "📸 Extract Key Facts",
        "description": "Extract all verifiable facts, statistics, and data points from this content:  Source: [...] ([...])  [...]  Output as a numbered list. For each fact: [n]. [fact",
        "category": "Context Grabber ★",
        "tags": [
            "facts",
            "extract",
            "data"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 75,
        "upvotes": 36,
        "downvotes": 4,
        "installCount": 66,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 79,
        "publishedAt": new Date(Date.now() - 4924800000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Extract Key Facts",
                "content": "Extract all verifiable facts, statistics, and data points from this content:\n\nSource: {{page_title}} ({{page_url}})\n\n{{page_text}}\n\nOutput as a numbered list. For each fact:\n[n]. [fact] — (paragraph location: beginning/middle/end)\n\nDo NOT include opinions, predictions, or unverifiable claims. Only extractable facts.",
                "category": "Context Grabber ★",
                "tags": [
                    "facts",
                    "extract",
                    "data"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-45",
        "title": "📸 Generate Tweet",
        "description": "Write an engaging tweet based on this article:  [...] [...]  Requirements: - Max 260 characters (leave room for link) - Hook in first 5 words - 2-3 relevant has",
        "category": "Context Grabber ★",
        "tags": [
            "tweet",
            "social",
            "marketing"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 12,
        "downvotes": 3,
        "installCount": 219,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 4838400000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Generate Tweet",
                "content": "Write an engaging tweet based on this article:\n\n{{page_title}}\n{{page_text}}\n\nRequirements:\n- Max 260 characters (leave room for link)\n- Hook in first 5 words\n- 2-3 relevant hashtags\n- One emoji max\n\nProvide 3 options: one informative, one provocative, one humorous.",
                "category": "Context Grabber ★",
                "tags": [
                    "tweet",
                    "social",
                    "marketing"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-46",
        "title": "📸 Code Review Selection",
        "description": "Review this selected code for production-readiness:   [...]   Check: bugs, security issues, performance, readability.  For each issue: [SEVERITY] Problem → Fix",
        "category": "Context Grabber ★",
        "tags": [
            "code-review",
            "selection",
            "debug"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 33,
        "downvotes": 4,
        "installCount": 99,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 64,
        "publishedAt": new Date(Date.now() - 4752000000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Code Review Selection",
                "content": "Review this selected code for production-readiness:\n\n```\n{{selected_text}}\n```\n\nCheck: bugs, security issues, performance, readability.\n\nFor each issue: [SEVERITY] Problem → Fix (one line each).\n\nIf the code is solid, say so and suggest one optimization.",
                "category": "Context Grabber ★",
                "tags": [
                    "code-review",
                    "selection",
                    "debug"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-47",
        "title": "📸 Ask About This Page",
        "description": "Answer my question using ONLY information from this webpage:  Page: [...] ([...]) Context: [...]  My question: [...]  If the answer isn't in the page content, s",
        "category": "Context Grabber ★",
        "tags": [
            "question",
            "page",
            "context"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 49,
        "downvotes": 1,
        "installCount": 219,
        "type": "prompt",
        "language": "en",
        "variableCount": 4,
        "tokenEstimate": 69,
        "publishedAt": new Date(Date.now() - 4665600000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Ask About This Page",
                "content": "Answer my question using ONLY information from this webpage:\n\nPage: {{page_title}} ({{page_url}})\nContext: {{page_text}}\n\nMy question: {{question}}\n\nIf the answer isn't in the page content, say \"This page doesn't contain information about that\" rather than making up an answer.",
                "category": "Context Grabber ★",
                "tags": [
                    "question",
                    "page",
                    "context"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-48",
        "title": "📸 Study Notes",
        "description": "Convert this content into structured study notes:  Source: [...] [...]  Format: ## Key Concepts - **[Term]**: [Definition in your own words]  ## Important Detai",
        "category": "Context Grabber ★",
        "tags": [
            "study",
            "notes",
            "education"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 83,
        "upvotes": 20,
        "downvotes": 1,
        "installCount": 148,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 106,
        "publishedAt": new Date(Date.now() - 4579200000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Study Notes",
                "content": "Convert this content into structured study notes:\n\nSource: {{page_title}}\n{{page_text}}\n\nFormat:\n## Key Concepts\n- **[Term]**: [Definition in your own words]\n\n## Important Details\n- [numbered list]\n\n## Connections\n- How this relates to: [broader topic]\n\n## Test Yourself\n3 questions to check understanding (with answers hidden in spoiler format)\n\nDo NOT copy-paste from the source. Rephrase everything in simpler language.",
                "category": "Context Grabber ★",
                "tags": [
                    "study",
                    "notes",
                    "education"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-49",
        "title": "📸 Critique This Article",
        "description": "Critically analyze this article:  [...] ([...]) [...]  Evaluate: 1. **Argument Strength**: Are claims supported by evidence? 2. **Bias Detection**: Any perspect",
        "category": "Context Grabber ★",
        "tags": [
            "critique",
            "analysis",
            "article"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 80,
        "upvotes": 12,
        "downvotes": 4,
        "installCount": 149,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 121,
        "publishedAt": new Date(Date.now() - 4492800000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Critique This Article",
                "content": "Critically analyze this article:\n\n{{page_title}} ({{page_url}})\n{{page_text}}\n\nEvaluate:\n1. **Argument Strength**: Are claims supported by evidence?\n2. **Bias Detection**: Any perspective systematically favored/ignored?\n3. **Logic Check**: Any logical fallacies? (name them specifically)\n4. **Missing Context**: What does this article leave out?\n5. **Verdict**: Overall reliability rating (1-10) with justification\n\nDo NOT critique the writing style. Focus on the substance and logic.",
                "category": "Context Grabber ★",
                "tags": [
                    "critique",
                    "analysis",
                    "article"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-50",
        "title": "📸 Rewrite for Clarity",
        "description": "Rewrite this text to be clearer and more concise:  [...]  Rules: - Preserve all original meaning and information - Cut word count by at least 20% - Break long s",
        "category": "Context Grabber ★",
        "tags": [
            "rewrite",
            "clarity",
            "editing"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 37,
        "downvotes": 3,
        "installCount": 65,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 88,
        "publishedAt": new Date(Date.now() - 4406400000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "📸 Rewrite for Clarity",
                "content": "Rewrite this text to be clearer and more concise:\n\n{{selected_text}}\n\nRules:\n- Preserve all original meaning and information\n- Cut word count by at least 20%\n- Break long sentences into shorter ones\n- Replace passive voice with active\n- Replace jargon with plain language\n\nShow the rewritten version, then: **Word count**: before → after (X% reduction)",
                "category": "Context Grabber ★",
                "tags": [
                    "rewrite",
                    "clarity",
                    "editing"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-51",
        "title": "周报生成器",
        "description": "你是一位高效的职场助手。根据我提供的工作内容，生成一份结构化周报。  本周工作内容： [...]  输出格式： ## 本周完成 - [列出 3-5 项，每项用\"动词+量化成果\"格式]  ## 进行中 - [列出进行中的事项及进度百分比]  ## 下周计划 - [列出 3 项优先事项]  ## 需要协调 - [如有需要跨",
        "category": "职场效率",
        "tags": [
            "周报",
            "工作",
            "汇报"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 51,
        "downvotes": 1,
        "installCount": 114,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 56,
        "publishedAt": new Date(Date.now() - 4320000000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "周报生成器",
                "content": "你是一位高效的职场助手。根据我提供的工作内容，生成一份结构化周报。\n\n本周工作内容：\n{{work_content}}\n\n输出格式：\n## 本周完成\n- [列出 3-5 项，每项用\"动词+量化成果\"格式]\n\n## 进行中\n- [列出进行中的事项及进度百分比]\n\n## 下周计划\n- [列出 3 项优先事项]\n\n## 需要协调\n- [如有需要跨部门协作的事项列出]\n\n要求：语言简洁专业，每条不超过 20 字。不要写空洞的\"持续优化\"之类的废话。",
                "category": "职场效率",
                "tags": [
                    "周报",
                    "工作",
                    "汇报"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-52",
        "title": "OKR 制定助手",
        "description": "你是一位 OKR 教练。根据以下信息制定一套 OKR：  角色/部门：[...] 季度目标方向：[...]  输出格式： **O (Objective)**：[鼓舞人心但具体的目标，一句话]  **KR1**：[可量化的关键结果] | 当前基线：X → 目标值：Y **KR2**：[可量化的关键结果] | 当前基线：X",
        "category": "职场效率",
        "tags": [
            "OKR",
            "目标",
            "管理"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 47,
        "downvotes": 0,
        "installCount": 59,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 72,
        "publishedAt": new Date(Date.now() - 4233600000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "OKR 制定助手",
                "content": "你是一位 OKR 教练。根据以下信息制定一套 OKR：\n\n角色/部门：{{role}}\n季度目标方向：{{direction}}\n\n输出格式：\n**O (Objective)**：[鼓舞人心但具体的目标，一句话]\n\n**KR1**：[可量化的关键结果] | 当前基线：X → 目标值：Y\n**KR2**：[可量化的关键结果] | 当前基线：X → 目标值：Y\n**KR3**：[可量化的关键结果] | 当前基线：X → 目标值：Y\n\n**行动计划**：每个 KR 列出 2 个具体行动\n\n禁止使用\"提升XX能力\"\"加强XX建设\"等无法衡量的表述。每个 KR 必须有明确数字。",
                "category": "职场效率",
                "tags": [
                    "OKR",
                    "目标",
                    "管理"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-53",
        "title": "会议纪要整理",
        "description": "将以下会议内容整理成结构化纪要：  [...]  格式： **会议主题**：[一句话总结] **日期**：[从内容推断] **参会方**：[列出]  | 序号 | 决议事项 | 责任人 | 完成时限 | |---|---|---|---|  **遗留问题**： 1. [待讨论事项]  **下次会议**：[时间/议题建议",
        "category": "职场效率",
        "tags": [
            "会议",
            "纪要",
            "记录"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 45,
        "downvotes": 1,
        "installCount": 104,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 51,
        "publishedAt": new Date(Date.now() - 4147200000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "会议纪要整理",
                "content": "将以下会议内容整理成结构化纪要：\n\n{{meeting_content}}\n\n格式：\n**会议主题**：[一句话总结]\n**日期**：[从内容推断]\n**参会方**：[列出]\n\n| 序号 | 决议事项 | 责任人 | 完成时限 |\n|---|---|---|---|\n\n**遗留问题**：\n1. [待讨论事项]\n\n**下次会议**：[时间/议题建议]\n\n不要添加会议内容中不存在的信息。用第三人称客观表述。",
                "category": "职场效率",
                "tags": [
                    "会议",
                    "纪要",
                    "记录"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-54",
        "title": "述职报告撰写",
        "description": "你是一位资深职场写作顾问。根据以下素材撰写述职报告：  岗位：[...] 工作成果：[...]  结构： 1. **开场**（2句话，直接点明核心贡献，不要写\"感谢领导\"） 2. **重点业绩**（3-4项，每项用 STAR 法则：情境→任务→行动→结果） 3. **方法论沉淀**（1-2个可复用的工作方法） 4. *",
        "category": "职场效率",
        "tags": [
            "述职",
            "报告",
            "总结"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 29,
        "downvotes": 3,
        "installCount": 214,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 68,
        "publishedAt": new Date(Date.now() - 4060800000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "述职报告撰写",
                "content": "你是一位资深职场写作顾问。根据以下素材撰写述职报告：\n\n岗位：{{position}}\n工作成果：{{achievements}}\n\n结构：\n1. **开场**（2句话，直接点明核心贡献，不要写\"感谢领导\"）\n2. **重点业绩**（3-4项，每项用 STAR 法则：情境→任务→行动→结果）\n3. **方法论沉淀**（1-2个可复用的工作方法）\n4. **不足与改进**（1项真实短板 + 具体改进计划）\n5. **下阶段规划**（3项，带时间节点）\n\n语气：自信但不自夸。量化一切可以量化的成果。禁止使用\"不断学习\"\"努力提升\"等空话。",
                "category": "职场效率",
                "tags": [
                    "述职",
                    "报告",
                    "总结"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-55",
        "title": "商务邮件撰写",
        "description": "撰写一封商务邮件：  场景：[...] 收件人关系：[...]  要求： - 主题行：准确概括，不超过 15 个字 - 称呼：根据关系选择合适的称呼 - 正文：3 段以内，第一句话说明目的 - 结尾：明确的行动请求 + 时间节点 - 落款：专业格式  语气根据关系调整：上级→恭敬简练；平级→专业友好；客户→商务得体。",
        "category": "职场效率",
        "tags": [
            "邮件",
            "商务",
            "沟通"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 5,
        "downvotes": 4,
        "installCount": 200,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 54,
        "publishedAt": new Date(Date.now() - 3974400000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "商务邮件撰写",
                "content": "撰写一封商务邮件：\n\n场景：{{context}}\n收件人关系：{{relationship}}\n\n要求：\n- 主题行：准确概括，不超过 15 个字\n- 称呼：根据关系选择合适的称呼\n- 正文：3 段以内，第一句话说明目的\n- 结尾：明确的行动请求 + 时间节点\n- 落款：专业格式\n\n语气根据关系调整：上级→恭敬简练；平级→专业友好；客户→商务得体。\n\n禁止使用\"百忙之中\"\"不胜感激\"等过于谄媚的措辞。直接、专业、有礼即可。",
                "category": "职场效率",
                "tags": [
                    "邮件",
                    "商务",
                    "沟通"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-56",
        "title": "面试问题准备",
        "description": "你是一位资深面试官。为以下岗位准备面试问题：  岗位：[...] 面试轮次：[...]  输出： **行为面试题**（3 题）： 每题格式：问题 + 考察维度 + 优秀回答要点 + 红旗信号  **技术/专业题**（3 题）： 每题格式：问题 + 标准答案要点 + 评分标准（1-5 分）  **压力测试题**（1 题）",
        "category": "职场效率",
        "tags": [
            "面试",
            "招聘",
            "HR"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 15,
        "downvotes": 3,
        "installCount": 171,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 61,
        "publishedAt": new Date(Date.now() - 3888000000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "面试问题准备",
                "content": "你是一位资深面试官。为以下岗位准备面试问题：\n\n岗位：{{position}}\n面试轮次：{{round}}\n\n输出：\n**行为面试题**（3 题）：\n每题格式：问题 + 考察维度 + 优秀回答要点 + 红旗信号\n\n**技术/专业题**（3 题）：\n每题格式：问题 + 标准答案要点 + 评分标准（1-5 分）\n\n**压力测试题**（1 题）：\n设计一个有适度压力但不失尊重的场景题\n\n**反向提问**：建议候选人可以问的 2 个高质量问题\n\n禁止出偏题、脑筋急转弯或与岗位无关的问题。",
                "category": "职场效率",
                "tags": [
                    "面试",
                    "招聘",
                    "HR"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-57",
        "title": "竞品分析报告",
        "description": "对以下产品/公司进行竞品分析：  我方产品：[...] 竞品：[...]  分析框架： | 维度 | 我方 | 竞品A | 竞品B | |---|---|---|---| | 核心功能 | | | | | 定价策略 | | | | | 目标用户 | | | | | 技术优势 | | | | | 市场份额 | | | |",
        "category": "职场效率",
        "tags": [
            "竞品",
            "分析",
            "策略"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 28,
        "downvotes": 2,
        "installCount": 113,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 69,
        "publishedAt": new Date(Date.now() - 3801600000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "竞品分析报告",
                "content": "对以下产品/公司进行竞品分析：\n\n我方产品：{{our_product}}\n竞品：{{competitors}}\n\n分析框架：\n| 维度 | 我方 | 竞品A | 竞品B |\n|---|---|---|---|\n| 核心功能 | | | |\n| 定价策略 | | | |\n| 目标用户 | | | |\n| 技术优势 | | | |\n| 市场份额 | | | |\n\n**差异化机会**：3 个我方可以切入的差异化方向\n**威胁预警**：2 个需要警惕的竞品动向\n**行动建议**：3 条具体可执行的策略\n\n不要泛泛而谈。每个结论必须有具体事实或数据支撑。",
                "category": "职场效率",
                "tags": [
                    "竞品",
                    "分析",
                    "策略"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-58",
        "title": "公众号爆款标题",
        "description": "为以下文章内容生成 10 个微信公众号标题：  文章主题：[...] 目标读者：[...]  标题要求： - 每个标题不超过 22 个字（微信标题最佳长度） - 运用至少 3 种不同的标题技法：   * 数字型：\"5个方法让你...\"   * 悬念型：\"大多数人不知道的...\"   * 痛点型：\"为什么你总是...\"",
        "category": "中文写作",
        "tags": [
            "标题",
            "公众号",
            "自媒体"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 25,
        "downvotes": 0,
        "installCount": 212,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 3715200000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "公众号爆款标题",
                "content": "为以下文章内容生成 10 个微信公众号标题：\n\n文章主题：{{topic}}\n目标读者：{{audience}}\n\n标题要求：\n- 每个标题不超过 22 个字（微信标题最佳长度）\n- 运用至少 3 种不同的标题技法：\n  * 数字型：\"5个方法让你...\"\n  * 悬念型：\"大多数人不知道的...\"\n  * 痛点型：\"为什么你总是...\"\n  * 对比型：\"从XX到XX，只需...\"\n  * 权威型：\"XX专家推荐的...\"\n- 每个标题后标注使用的技法\n\n禁止使用标题党（不要夸大事实）。禁止使用\"震惊！\"\"速看！\"等低质词汇。",
                "category": "中文写作",
                "tags": [
                    "标题",
                    "公众号",
                    "自媒体"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-59",
        "title": "小红书笔记撰写",
        "description": "撰写一篇小红书种草笔记：  产品/主题：[...]  格式： **标题**：带 emoji，口语化，14 字以内 **正文**（300-500 字）： - 第一人称真实体验感 - 分段短句，每段 2-3 句 - 适当使用 emoji 分隔段落 - 穿插 2-3 个使用场景 - 结尾互动引导（\"你们觉得呢？\"）  **标",
        "category": "中文写作",
        "tags": [
            "小红书",
            "种草",
            "社交媒体"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 41,
        "downvotes": 2,
        "installCount": 202,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 57,
        "publishedAt": new Date(Date.now() - 3628800000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "小红书笔记撰写",
                "content": "撰写一篇小红书种草笔记：\n\n产品/主题：{{topic}}\n\n格式：\n**标题**：带 emoji，口语化，14 字以内\n**正文**（300-500 字）：\n- 第一人称真实体验感\n- 分段短句，每段 2-3 句\n- 适当使用 emoji 分隔段落\n- 穿插 2-3 个使用场景\n- 结尾互动引导（\"你们觉得呢？\"）\n\n**标签**：10 个相关标签\n\n语气：闺蜜分享式，亲切真实。禁止使用广告腔（\"强烈推荐\"\"必入\"等）。要像真实用户而不是广告商。",
                "category": "中文写作",
                "tags": [
                    "小红书",
                    "种草",
                    "社交媒体"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-60",
        "title": "中文润色大师",
        "description": "润色以下中文文本，提升文笔质量：  [...]  润色维度： 1. **用词精准**：替换模糊/口语化用词为更精确的书面表达 2. **句式优化**：长句拆短，消除冗余，增加节奏感 3. **逻辑衔接**：添加恰当的过渡词和逻辑连接 4. **修辞提升**：在关键处适度使用比喻、排比等修辞  输出： - 润色后的全文",
        "category": "中文写作",
        "tags": [
            "润色",
            "写作",
            "文笔"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 44,
        "downvotes": 1,
        "installCount": 35,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 55,
        "publishedAt": new Date(Date.now() - 3542400000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "中文润色大师",
                "content": "润色以下中文文本，提升文笔质量：\n\n{{text}}\n\n润色维度：\n1. **用词精准**：替换模糊/口语化用词为更精确的书面表达\n2. **句式优化**：长句拆短，消除冗余，增加节奏感\n3. **逻辑衔接**：添加恰当的过渡词和逻辑连接\n4. **修辞提升**：在关键处适度使用比喻、排比等修辞\n\n输出：\n- 润色后的全文\n- 修改对照表（列出 5 处最关键的修改及理由）\n\n保留原文的核心观点和语气基调。不要过度文艺化导致文风割裂。",
                "category": "中文写作",
                "tags": [
                    "润色",
                    "写作",
                    "文笔"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-61",
        "title": "论文摘要生成",
        "description": "为以下论文内容生成中英文摘要：  [...]  中文摘要（300 字以内）： - 研究背景（1 句） - 研究方法（1-2 句） - 主要发现（2-3 句） - 研究意义（1 句）  英文 Abstract（200 words 以内）： - Background, Methods, Results, Conclusio",
        "category": "中文写作",
        "tags": [
            "论文",
            "摘要",
            "学术"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 35,
        "downvotes": 4,
        "installCount": 217,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 56,
        "publishedAt": new Date(Date.now() - 3456000000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "论文摘要生成",
                "content": "为以下论文内容生成中英文摘要：\n\n{{paper_content}}\n\n中文摘要（300 字以内）：\n- 研究背景（1 句）\n- 研究方法（1-2 句）\n- 主要发现（2-3 句）\n- 研究意义（1 句）\n\n英文 Abstract（200 words 以内）：\n- Background, Methods, Results, Conclusion 四段式\n\n关键词：中文 5 个 + 英文 5 个\n\n不要添加论文中没有的结论。摘要必须忠实于原文内容。",
                "category": "中文写作",
                "tags": [
                    "论文",
                    "摘要",
                    "学术"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-62",
        "title": "文案改写大师",
        "description": "将以下内容改写为不同风格的版本：  原文：[...]  生成 3 个版本：  **版本 A — 正式商务风** 适用场景：报告、提案、汇报 改写要求：严谨、数据化、无情绪词  **版本 B — 社交媒体风** 适用场景：微博、朋友圈、公众号 改写要求：口语化、有互动感、带 emoji  **版本 C — 故事叙事风**",
        "category": "中文写作",
        "tags": [
            "改写",
            "文案",
            "风格"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 42,
        "downvotes": 2,
        "installCount": 136,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 57,
        "publishedAt": new Date(Date.now() - 3369600000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "文案改写大师",
                "content": "将以下内容改写为不同风格的版本：\n\n原文：{{text}}\n\n生成 3 个版本：\n\n**版本 A — 正式商务风**\n适用场景：报告、提案、汇报\n改写要求：严谨、数据化、无情绪词\n\n**版本 B — 社交媒体风**\n适用场景：微博、朋友圈、公众号\n改写要求：口语化、有互动感、带 emoji\n\n**版本 C — 故事叙事风**\n适用场景：演讲、品牌传播\n改写要求：有画面感、有情感共鸣、有节奏\n\n三个版本的核心信息必须一致。不要改变事实，只改变表达方式。",
                "category": "中文写作",
                "tags": [
                    "改写",
                    "文案",
                    "风格"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-63",
        "title": "朋友圈文案",
        "description": "写一条朋友圈文案：  场景：[...]  要求： - 文字部分：3-5 行，有留白感 - 风格选择（根据场景自动判断）：   * 生活记录：温暖真实   * 工作成就：低调但有分量   * 旅行分享：有意境不俗套   * 美食分享：有食欲感 - 结尾不要用问句求互动 - 可以适度使用 1-2 个 emoji  提供 3",
        "category": "中文写作",
        "tags": [
            "朋友圈",
            "文案",
            "社交"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 49,
        "downvotes": 3,
        "installCount": 184,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 52,
        "publishedAt": new Date(Date.now() - 3283200000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "朋友圈文案",
                "content": "写一条朋友圈文案：\n\n场景：{{scenario}}\n\n要求：\n- 文字部分：3-5 行，有留白感\n- 风格选择（根据场景自动判断）：\n  * 生活记录：温暖真实\n  * 工作成就：低调但有分量\n  * 旅行分享：有意境不俗套\n  * 美食分享：有食欲感\n- 结尾不要用问句求互动\n- 可以适度使用 1-2 个 emoji\n\n提供 3 个版本供选择。\n\n禁止使用\"岁月静好\"\"诗和远方\"\"人间值得\"等烂大街文案。",
                "category": "中文写作",
                "tags": [
                    "朋友圈",
                    "文案",
                    "社交"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-64",
        "title": "短视频脚本",
        "description": "撰写一个短视频脚本：  主题：[...] 时长：[...] 平台：[...]  脚本格式： | 时间 | 画面描述 | 台词/旁白 | 字幕文案 | BGM建议 | |---|---|---|---|---|  要求： - 前 3 秒必须有强钩子（悬念、冲突或反常识） - 每 10 秒一个信息节奏点 - 结尾有明确的行",
        "category": "中文写作",
        "tags": [
            "短视频",
            "脚本",
            "抖音"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 7,
        "downvotes": 2,
        "installCount": 79,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 63,
        "publishedAt": new Date(Date.now() - 3196800000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "短视频脚本",
                "content": "撰写一个短视频脚本：\n\n主题：{{topic}}\n时长：{{duration:60秒}}\n平台：{{platform:抖音}}\n\n脚本格式：\n| 时间 | 画面描述 | 台词/旁白 | 字幕文案 | BGM建议 |\n|---|---|---|---|---|\n\n要求：\n- 前 3 秒必须有强钩子（悬念、冲突或反常识）\n- 每 10 秒一个信息节奏点\n- 结尾有明确的行动引导（关注/点赞/评论）\n- 口播台词口语化，每句不超过 15 字\n\n禁止平铺直叙。如果主题本身不够吸引人，要找到反直觉的切入角度。",
                "category": "中文写作",
                "tags": [
                    "短视频",
                    "脚本",
                    "抖音"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-65",
        "title": "费曼学习法教练",
        "description": "用费曼学习法帮我理解：  [...]  步骤： 1. **简单解释**：用一个 12 岁孩子能听懂的方式解释这个概念（2-3 句话） 2. **类比**：用一个日常生活中的例子来类比 3. **关键细节**：说明 3 个不能被简化掉的关键要点 4. **常见误区**：大多数人容易搞错的 1-2 个点 5. **检验问题",
        "category": "学习教育",
        "tags": [
            "费曼",
            "学习",
            "理解"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 6,
        "downvotes": 4,
        "installCount": 52,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 58,
        "publishedAt": new Date(Date.now() - 3110400000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "费曼学习法教练",
                "content": "用费曼学习法帮我理解：\n\n{{concept}}\n\n步骤：\n1. **简单解释**：用一个 12 岁孩子能听懂的方式解释这个概念（2-3 句话）\n2. **类比**：用一个日常生活中的例子来类比\n3. **关键细节**：说明 3 个不能被简化掉的关键要点\n4. **常见误区**：大多数人容易搞错的 1-2 个点\n5. **检验问题**：给我 2 个问题测试我是否真的理解了（附答案）\n\n如果我的追问暴露了理解不到位的地方，直接指出而不要敷衍说\"理解得很好\"。",
                "category": "学习教育",
                "tags": [
                    "费曼",
                    "学习",
                    "理解"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-66",
        "title": "知识点串联师",
        "description": "帮我把这些零散的知识点串联成体系：  知识点列表： [...]  输出： 1. **知识地图**：用树状结构展示这些知识点的层级关系 2. **核心主线**：贯穿所有知识点的 1 条主线逻辑（3 句话） 3. **因果链**：哪些知识点之间有因果关系？画出链条 4. **记忆锚点**：为最难记的 3 个知识点设计记忆锚",
        "category": "学习教育",
        "tags": [
            "知识",
            "体系",
            "串联"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 24,
        "downvotes": 3,
        "installCount": 105,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 62,
        "publishedAt": new Date(Date.now() - 3024000000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "知识点串联师",
                "content": "帮我把这些零散的知识点串联成体系：\n\n知识点列表：\n{{knowledge_points}}\n\n输出：\n1. **知识地图**：用树状结构展示这些知识点的层级关系\n2. **核心主线**：贯穿所有知识点的 1 条主线逻辑（3 句话）\n3. **因果链**：哪些知识点之间有因果关系？画出链条\n4. **记忆锚点**：为最难记的 3 个知识点设计记忆锚点（谐音、图像联想等）\n5. **应用场景**：1 个需要综合运用多个知识点的实际场景题\n\n不要机械地重复知识点。重点是找到它们之间的「连接」。",
                "category": "学习教育",
                "tags": [
                    "知识",
                    "体系",
                    "串联"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-67",
        "title": "错题分析师",
        "description": "分析我的这道错题：  题目：[...] 我的答案：[...] 正确答案：[...]  分析： 1. **错误类型**：概念错误 / 计算错误 / 审题错误 / 方法选择错误 2. **根本原因**：我到底是哪个环节的理解出了问题？ 3. **正确思路**：完整的解题过程（标注每步的关键思维） 4. **同类变形**：给",
        "category": "学习教育",
        "tags": [
            "错题",
            "分析",
            "学习"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 38,
        "downvotes": 0,
        "installCount": 156,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 2937600000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "错题分析师",
                "content": "分析我的这道错题：\n\n题目：{{question}}\n我的答案：{{my_answer}}\n正确答案：{{correct_answer}}\n\n分析：\n1. **错误类型**：概念错误 / 计算错误 / 审题错误 / 方法选择错误\n2. **根本原因**：我到底是哪个环节的理解出了问题？\n3. **正确思路**：完整的解题过程（标注每步的关键思维）\n4. **同类变形**：给出 2 道同类型但不同的练习题（附答案）\n5. **防错清单**：下次遇到同类题，应该检查哪 3 个点？\n\n不要只告诉我正确答案。帮我理解「为什么我会做错」。",
                "category": "学习教育",
                "tags": [
                    "错题",
                    "分析",
                    "学习"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-68",
        "title": "考试冲刺规划",
        "description": "帮我制定考试冲刺计划：  考试：[...] 剩余时间：[...] 当前水平：[...]  输出： 1. **优先级矩阵**：将考点按\"分值权重 × 我的掌握度\"分为四象限 2. **每日计划表**：按天分配复习内容，标注预计用时 3. **高频考点**：最可能出现的 10 个考点 + 核心知识点速记 4. **答题策略",
        "category": "学习教育",
        "tags": [
            "考试",
            "冲刺",
            "规划"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 49,
        "downvotes": 4,
        "installCount": 145,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 2851200000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "考试冲刺规划",
                "content": "帮我制定考试冲刺计划：\n\n考试：{{exam}}\n剩余时间：{{time_left}}\n当前水平：{{current_level}}\n\n输出：\n1. **优先级矩阵**：将考点按\"分值权重 × 我的掌握度\"分为四象限\n2. **每日计划表**：按天分配复习内容，标注预计用时\n3. **高频考点**：最可能出现的 10 个考点 + 核心知识点速记\n4. **答题策略**：时间分配 + 做题顺序 + 蒙题技巧\n5. **考前清单**：考前 1 天/3 小时/30 分钟分别做什么\n\n不要安排不切实际的计划。考虑到人的精力曲线和遗忘曲线。",
                "category": "学习教育",
                "tags": [
                    "考试",
                    "冲刺",
                    "规划"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-69",
        "title": "英语作文批改",
        "description": "批改以下英语作文：  [...]  批改维度（每项评分 1-10）： 1. **内容与论点** (Content) 2. **结构与组织** (Organization) 3. **语法与拼写** (Grammar) 4. **词汇丰富度** (Vocabulary) 5. **连贯与衔接** (Coherence)",
        "category": "学习教育",
        "tags": [
            "英语",
            "作文",
            "批改"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 5,
        "downvotes": 4,
        "installCount": 195,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 70,
        "publishedAt": new Date(Date.now() - 2764800000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "英语作文批改",
                "content": "批改以下英语作文：\n\n{{essay}}\n\n批改维度（每项评分 1-10）：\n1. **内容与论点** (Content)\n2. **结构与组织** (Organization)\n3. **语法与拼写** (Grammar)\n4. **词汇丰富度** (Vocabulary)\n5. **连贯与衔接** (Coherence)\n\n逐句批改：\n- 用 ~~删除线~~ 标注错误\n- 用 **加粗** 标注修改后的表达\n- 每处修改附 1 句中文解释\n\n最后提供 3 个可以直接积累的高级表达替换。\n\n不要只纠正语法。更重要的是指出论证逻辑和表达地道性的问题。",
                "category": "学习教育",
                "tags": [
                    "英语",
                    "作文",
                    "批改"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-70",
        "title": "古诗文解读",
        "description": "深度解读这首古诗/文言文：  [...]  解读结构： 1. **逐句译注**：每句的现代文翻译 + 关键字词注释 2. **写作背景**：作者何时何地为何而作 3. **意象分析**：诗中核心意象及其象征意义 4. **结构手法**：用了哪些修辞/写作技法（举具体句子） 5. **情感脉络**：全诗情感如何起承转合",
        "category": "学习教育",
        "tags": [
            "古诗",
            "文言文",
            "国学"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 54,
        "downvotes": 3,
        "installCount": 51,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 54,
        "publishedAt": new Date(Date.now() - 2678400000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "古诗文解读",
                "content": "深度解读这首古诗/文言文：\n\n{{text}}\n\n解读结构：\n1. **逐句译注**：每句的现代文翻译 + 关键字词注释\n2. **写作背景**：作者何时何地为何而作\n3. **意象分析**：诗中核心意象及其象征意义\n4. **结构手法**：用了哪些修辞/写作技法（举具体句子）\n5. **情感脉络**：全诗情感如何起承转合\n6. **名句赏析**：最精彩的 1-2 句为什么好\n\n不要把古诗解读成政治课。重点是文学之美和情感共鸣。",
                "category": "学习教育",
                "tags": [
                    "古诗",
                    "文言文",
                    "国学"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-71",
        "title": "思维导图生成",
        "description": "将以下内容转化为思维导图的文本结构：  [...]  输出格式（缩进层级表示思维导图的分支）： # 中心主题 ## 一级分支1 ### 二级分支1.1 - 关键点 ### 二级分支1.2 - 关键点 ## 一级分支2 ...  要求： - 最多 3 级深度 - 每个分支用关键词而非完整句子 - 同级分支使用 MECE",
        "category": "学习教育",
        "tags": [
            "思维导图",
            "整理",
            "框架"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 26,
        "downvotes": 4,
        "installCount": 82,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 55,
        "publishedAt": new Date(Date.now() - 2592000000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "思维导图生成",
                "content": "将以下内容转化为思维导图的文本结构：\n\n{{content}}\n\n输出格式（缩进层级表示思维导图的分支）：\n# 中心主题\n## 一级分支1\n### 二级分支1.1\n- 关键点\n### 二级分支1.2\n- 关键点\n## 一级分支2\n...\n\n要求：\n- 最多 3 级深度\n- 每个分支用关键词而非完整句子\n- 同级分支使用 MECE 原则（相互独立，完全穷尽）\n- 最终不超过 30 个节点\n\n不要简单地将原文分段变成分支。要提炼出逻辑框架。",
                "category": "学习教育",
                "tags": [
                    "思维导图",
                    "整理",
                    "框架"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-72",
        "title": "需求分析师",
        "description": "你是一位资深需求分析师。分析以下需求并输出 PRD 要点：  用户需求描述：[...]  输出： 1. **需求拆解** | 功能点 | 用户故事 (As a... I want... So that...) | 优先级 (P0/P1/P2) | 复杂度评估 | |---|---|---|---|  2. **验收标准",
        "category": "编程开发",
        "tags": [
            "需求",
            "PRD",
            "分析"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 25,
        "downvotes": 0,
        "installCount": 142,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 82,
        "publishedAt": new Date(Date.now() - 2505600000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "需求分析师",
                "content": "你是一位资深需求分析师。分析以下需求并输出 PRD 要点：\n\n用户需求描述：{{requirement}}\n\n输出：\n1. **需求拆解**\n| 功能点 | 用户故事 (As a... I want... So that...) | 优先级 (P0/P1/P2) | 复杂度评估 |\n|---|---|---|---|\n\n2. **验收标准**：每个 P0 功能的 Given-When-Then 验收条件\n\n3. **边界条件**：5 个容易被忽略的边界情况\n\n4. **技术风险**：可能的技术难点及建议方案\n\n5. **MVP 定义**：如果只能做 3 个功能先上线，选哪 3 个？为什么？\n\n禁止把用户的\"想要\"直接当\"需求\"。要挖掘背后的真实问题。",
                "category": "编程开发",
                "tags": [
                    "需求",
                    "PRD",
                    "分析"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-73",
        "title": "代码解释器",
        "description": "逐行解释以下代码的逻辑和意图：  [...] [...]   输出格式： **概要**：这段代码的整体作用（1-2句话）  **逐段解析**：  [代码行]  // ← [解释：这行做了什么，为什么这么写]   **关键设计决策**： - 为什么选择这个数据结构/算法？ - 有没有更好的替代方案？  **潜在问题**：",
        "category": "编程开发",
        "tags": [
            "代码",
            "解释",
            "学习"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 46,
        "downvotes": 1,
        "installCount": 59,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 69,
        "publishedAt": new Date(Date.now() - 2419200000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "代码解释器",
                "content": "逐行解释以下代码的逻辑和意图：\n\n```{{language}}\n{{code}}\n```\n\n输出格式：\n**概要**：这段代码的整体作用（1-2句话）\n\n**逐段解析**：\n```\n[代码行]  // ← [解释：这行做了什么，为什么这么写]\n```\n\n**关键设计决策**：\n- 为什么选择这个数据结构/算法？\n- 有没有更好的替代方案？\n\n**潜在问题**：可能存在的 bug 或性能问题\n\n用中文解释，但保持技术术语的英文原文（如 \"closure\"、\"event loop\"）。不要把简单的 `i++` 也解释一遍。只解释有信息量的部分。",
                "category": "编程开发",
                "tags": [
                    "代码",
                    "解释",
                    "学习"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-74",
        "title": "报错诊断专家",
        "description": "诊断以下报错信息：  报错内容：  [...]   运行环境：[...]  诊断输出： 1. **错误类型**：这是什么类型的错误？（语法/运行时/逻辑/环境） 2. **根因分析**：最可能的原因（排名第 1-3 的可能性） 3. **修复方案**：        // 修复前    [错误代码]    // 修复后",
        "category": "编程开发",
        "tags": [
            "报错",
            "诊断",
            "debug"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 12,
        "downvotes": 1,
        "installCount": 172,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 71,
        "publishedAt": new Date(Date.now() - 2332800000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "报错诊断专家",
                "content": "诊断以下报错信息：\n\n报错内容：\n```\n{{error}}\n```\n\n运行环境：{{environment}}\n\n诊断输出：\n1. **错误类型**：这是什么类型的错误？（语法/运行时/逻辑/环境）\n2. **根因分析**：最可能的原因（排名第 1-3 的可能性）\n3. **修复方案**：\n   ```\n   // 修复前\n   [错误代码]\n   // 修复后\n   [正确代码]\n   ```\n4. **验证方法**：如何确认修复成功\n5. **预防措施**：怎么避免下次再犯\n\n不要建议\"重启试试\"或\"重新安装\"，除非确实是根因。直接定位代码层面的问题。",
                "category": "编程开发",
                "tags": [
                    "报错",
                    "诊断",
                    "debug"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-75",
        "title": "技术方案评审",
        "description": "评审以下技术方案：  [...]  从以下维度打分（每项 1-10）并给出评审意见：  | 维度 | 评分 | 评审意见 | |---|---|---| | 可行性 | | | | 可扩展性 | | | | 安全性 | | | | 性能 | | | | 可维护性 | | | | 成本效益 | | |  **关键风险**",
        "category": "编程开发",
        "tags": [
            "技术",
            "评审",
            "方案"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 40,
        "downvotes": 0,
        "installCount": 147,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 68,
        "publishedAt": new Date(Date.now() - 2246400000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "技术方案评审",
                "content": "评审以下技术方案：\n\n{{technical_plan}}\n\n从以下维度打分（每项 1-10）并给出评审意见：\n\n| 维度 | 评分 | 评审意见 |\n|---|---|---|\n| 可行性 | | |\n| 可扩展性 | | |\n| 安全性 | | |\n| 性能 | | |\n| 可维护性 | | |\n| 成本效益 | | |\n\n**关键风险**：Top 3 技术风险及缓解措施\n**替代方案**：1 个值得考虑的替代技术路线\n**建议**：通过 / 有条件通过 / 需要重新设计\n\n以技术负责人视角评审。不要当好人只说优点。重点指出可能踩的坑。",
                "category": "编程开发",
                "tags": [
                    "技术",
                    "评审",
                    "方案"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-76",
        "title": "Git Commit 信息规范",
        "description": "根据以下代码改动生成规范的 Git Commit Message：  改动内容： [...]  输出格式（Conventional Commits）：  <type>(<scope>): <subject>  <body>  <footer>   Type 选择：feat / fix / refactor / docs",
        "category": "编程开发",
        "tags": [
            "git",
            "commit",
            "规范"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 35,
        "downvotes": 3,
        "installCount": 132,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 99,
        "publishedAt": new Date(Date.now() - 2160000000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "Git Commit 信息规范",
                "content": "根据以下代码改动生成规范的 Git Commit Message：\n\n改动内容：\n{{changes}}\n\n输出格式（Conventional Commits）：\n```\n<type>(<scope>): <subject>\n\n<body>\n\n<footer>\n```\n\nType 选择：feat / fix / refactor / docs / style / test / chore\nScope：受影响的模块\nSubject：50 字符以内，祈使语气，不加句号\nBody：说明 WHY（为什么改）而不是 WHAT（改了什么）\n\n提供 3 个不同粒度的版本：\n1. 简洁版（1 行）\n2. 标准版（带 body）\n3. 详细版（带 body + breaking changes / footer）\n\nCommit message 必须用英文。不要写\"update code\"这种废话。",
                "category": "编程开发",
                "tags": [
                    "git",
                    "commit",
                    "规范"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-77",
        "title": "接口文档生成",
        "description": "根据以下信息生成 RESTful API 接口文档：  [...]  文档格式： ### [...] [...]  **简介**：[1 句话]  **认证**：[是否需要 Token]  **请求参数**： | 参数名 | 类型 | 必填 | 说明 | 示例 | |---|---|---|---|---|  **请求示",
        "category": "编程开发",
        "tags": [
            "API",
            "接口",
            "文档"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 76,
        "upvotes": 47,
        "downvotes": 1,
        "installCount": 188,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 78,
        "publishedAt": new Date(Date.now() - 2073600000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "接口文档生成",
                "content": "根据以下信息生成 RESTful API 接口文档：\n\n{{api_info}}\n\n文档格式：\n### {{method}} {{path}}\n\n**简介**：[1 句话]\n\n**认证**：[是否需要 Token]\n\n**请求参数**：\n| 参数名 | 类型 | 必填 | 说明 | 示例 |\n|---|---|---|---|---|\n\n**请求示例**：\n```json\n{}\n```\n\n**成功响应** (200)：\n```json\n{}\n```\n\n**错误码**：\n| 错误码 | 说明 | 排查建议 |\n|---|---|---|\n\n所有示例值必须使用真实可信的数据，不要用 \"string\" 或 \"xxx\" 占位。",
                "category": "编程开发",
                "tags": [
                    "API",
                    "接口",
                    "文档"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-78",
        "title": "菜谱推荐",
        "description": "根据以下条件推荐一道菜：  可用食材：[...] 烹饪时间限制：[...] 口味偏好：[...]  输出格式： **🍳 [...]** | ⏱ [...] | 难度：⭐~⭐⭐⭐  **食材清单**（标注家中可能没有的）： - ✅ [已有食材] - 🛒 [需要购买的]  **步骤**（每步限 1 句话）： 1. [动",
        "category": "生活助手",
        "tags": [
            "做饭",
            "菜谱",
            "美食"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 52,
        "downvotes": 0,
        "installCount": 39,
        "type": "prompt",
        "language": "en",
        "variableCount": 5,
        "tokenEstimate": 68,
        "publishedAt": new Date(Date.now() - 1987200000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "菜谱推荐",
                "content": "根据以下条件推荐一道菜：\n\n可用食材：{{ingredients}}\n烹饪时间限制：{{time:30分钟}}\n口味偏好：{{preference}}\n\n输出格式：\n**🍳 {{菜名}}** | ⏱ {{分钟}} | 难度：⭐~⭐⭐⭐\n\n**食材清单**（标注家中可能没有的）：\n- ✅ [已有食材]\n- 🛒 [需要购买的]\n\n**步骤**（每步限 1 句话）：\n1. [动作] — 💡[关键技巧提示]\n2. ...\n\n**避坑提醒**：1 个新手最容易翻车的步骤\n\n不要推荐需要特殊设备（如烤箱、料理机）的菜，除非我提到有这些设备。",
                "category": "生活助手",
                "tags": [
                    "做饭",
                    "菜谱",
                    "美食"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-79",
        "title": "旅行攻略生成",
        "description": "为我规划旅行攻略：  目的地：[...] 天数：[...] 预算：[...] 出行人数/关系：[...]  输出： **Day 1 - Day N 行程表**： | 时间 | 地点 | 活动 | 预算 | 交通方式 | 备注 | |---|---|---|---|---|---|  **必吃清单**：5 家当地人推荐的",
        "category": "生活助手",
        "tags": [
            "旅行",
            "攻略",
            "规划"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 13,
        "downvotes": 2,
        "installCount": 72,
        "type": "prompt",
        "language": "en",
        "variableCount": 4,
        "tokenEstimate": 69,
        "publishedAt": new Date(Date.now() - 1900800000).toISOString(),
        "updatedAt": new Date(Date.now() - 432000000).toISOString(),
        "_demoContent": [
            {
                "title": "旅行攻略生成",
                "content": "为我规划旅行攻略：\n\n目的地：{{destination}}\n天数：{{days}}\n预算：{{budget}}\n出行人数/关系：{{travelers}}\n\n输出：\n**Day 1 - Day N 行程表**：\n| 时间 | 地点 | 活动 | 预算 | 交通方式 | 备注 |\n|---|---|---|---|---|---|\n\n**必吃清单**：5 家当地人推荐的餐厅（非游客区）\n**避坑指南**：3 个常见旅游陷阱\n**行李清单**：针对目的地气候的打包建议\n**预算汇总**：分类总计\n\n不要推荐过度商业化的景点。优先推荐有当地特色的体验。",
                "category": "生活助手",
                "tags": [
                    "旅行",
                    "攻略",
                    "规划"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-80",
        "title": "健康饮食顾问",
        "description": "根据我的情况设计饮食方案：  [...]  输出一日三餐方案（7天轮换）： | 餐次 | 食物 | 热量 | 蛋白质 | 碳水 | 脂肪 | |---|---|---|---|---|---| | 早餐 | | | | | | | 午餐 | | | | | | | 晚餐 | | | | | | | 加餐 | | | |",
        "category": "生活助手",
        "tags": [
            "饮食",
            "健康",
            "营养"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 38,
        "downvotes": 0,
        "installCount": 129,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 70,
        "publishedAt": new Date(Date.now() - 1814400000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "健康饮食顾问",
                "content": "根据我的情况设计饮食方案：\n\n{{health_info}}\n\n输出一日三餐方案（7天轮换）：\n| 餐次 | 食物 | 热量 | 蛋白质 | 碳水 | 脂肪 |\n|---|---|---|---|---|---|\n| 早餐 | | | | | |\n| 午餐 | | | | | |\n| 晚餐 | | | | | |\n| 加餐 | | | | | |\n\n**购物清单**：按超市区域分类\n**备餐技巧**：周末 2 小时搞定一周备餐的方法\n**注意事项**：根据我的健康状况需要特别注意什么\n\n不要推荐难以买到或价格高昂的\"超级食物\"。方案要易执行、可持续。",
                "category": "生活助手",
                "tags": [
                    "饮食",
                    "健康",
                    "营养"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-81",
        "title": "租房/买房顾问",
        "description": "分析这个房源的优缺点并给出建议：  [...]  评估维度： | 维度 | 评分(1-10) | 具体分析 | |---|---|---| | 地段与通勤 | | | | 户型与采光 | | | | 小区环境 | | | | 周边配套 | | | | 性价比 | | | | 升值潜力 | | |  **红旗预警**：3",
        "category": "生活助手",
        "tags": [
            "房产",
            "租房",
            "买房"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 25,
        "downvotes": 4,
        "installCount": 184,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 67,
        "publishedAt": new Date(Date.now() - 1728000000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "租房/买房顾问",
                "content": "分析这个房源的优缺点并给出建议：\n\n{{house_info}}\n\n评估维度：\n| 维度 | 评分(1-10) | 具体分析 |\n|---|---|---|\n| 地段与通勤 | | |\n| 户型与采光 | | |\n| 小区环境 | | |\n| 周边配套 | | |\n| 性价比 | | |\n| 升值潜力 | | |\n\n**红旗预警**：3 个需要现场重点检查的点\n**谈判策略**：基于当前市场的议价建议\n**隐性成本**：容易被忽略的费用清单\n\n不要给出\"看个人需求\"这种废话。基于信息明确表态：\"建议入手\"或\"建议观望\"，并说明理由。",
                "category": "生活助手",
                "tags": [
                    "房产",
                    "租房",
                    "买房"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-82",
        "title": "送礼推荐师",
        "description": "帮我推荐合适的礼物：  送礼对象：[...] 关系：[...] 场合：[...] 预算：[...]  推荐 5 个礼物方案，从最推荐到兜底方案排列：  | 排名 | 礼物 | 预算 | 推荐理由 | 在哪买 | |---|---|---|---|---|  **送礼话术**：搭配礼物的得体表达 **雷区提醒**：这个关",
        "category": "生活助手",
        "tags": [
            "送礼",
            "推荐",
            "人情"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 46,
        "downvotes": 3,
        "installCount": 155,
        "type": "prompt",
        "language": "en",
        "variableCount": 4,
        "tokenEstimate": 63,
        "publishedAt": new Date(Date.now() - 1641600000).toISOString(),
        "updatedAt": new Date(Date.now() - 86400000).toISOString(),
        "_demoContent": [
            {
                "title": "送礼推荐师",
                "content": "帮我推荐合适的礼物：\n\n送礼对象：{{recipient}}\n关系：{{relationship}}\n场合：{{occasion}}\n预算：{{budget}}\n\n推荐 5 个礼物方案，从最推荐到兜底方案排列：\n\n| 排名 | 礼物 | 预算 | 推荐理由 | 在哪买 |\n|---|---|---|---|---|\n\n**送礼话术**：搭配礼物的得体表达\n**雷区提醒**：这个关系/场合绝对不能送什么\n\n不要推荐\"定制相册\"\"手写信\"等需要大量时间准备的方案，除非时间充裕。不要推荐烂大街的保温杯。",
                "category": "生活助手",
                "tags": [
                    "送礼",
                    "推荐",
                    "人情"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-83",
        "title": "合同审查助手",
        "description": "审查以下合同/协议中的风险点：  [...]  审查输出： **风险等级**：🔴高风险 / 🟡中风险 / 🟢低风险  **逐条审查**： | 条款 | 风险等级 | 问题描述 | 修改建议 | |---|---|---|---|  **关键缺失**：合同中应该有但没有的条款 **不公平条款**：明显偏向对方利益的",
        "category": "生活助手",
        "tags": [
            "合同",
            "审查",
            "法律"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 21,
        "downvotes": 2,
        "installCount": 155,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 68,
        "publishedAt": new Date(Date.now() - 1555200000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "合同审查助手",
                "content": "审查以下合同/协议中的风险点：\n\n{{contract_content}}\n\n审查输出：\n**风险等级**：🔴高风险 / 🟡中风险 / 🟢低风险\n\n**逐条审查**：\n| 条款 | 风险等级 | 问题描述 | 修改建议 |\n|---|---|---|---|\n\n**关键缺失**：合同中应该有但没有的条款\n**不公平条款**：明显偏向对方利益的条款\n**建议行动**：签 / 协商修改后签 / 不建议签\n\n⚠️ 本分析仅供参考，不构成法律意见。重要合同请咨询专业律师。\n\n不要放过任何模糊措辞。\"甲方有权单方面...\"这类条文必须标记。",
                "category": "生活助手",
                "tags": [
                    "合同",
                    "审查",
                    "法律"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-84",
        "title": "内容选题策划",
        "description": "为以下账号策划一周的内容选题：  账号定位：[...] 目标平台：[...] 受众画像：[...]  输出 7 天选题表： | 日期 | 选题 | 切入角度 | 内容形式 | 预期热度 | 关联热点 | |---|---|---|---|---|---|  选题原则： - 至少 2 个蹭热点的时效性选题 - 至少 2",
        "category": "自媒体",
        "tags": [
            "选题",
            "内容",
            "策划"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 9,
        "downvotes": 4,
        "installCount": 172,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 69,
        "publishedAt": new Date(Date.now() - 1468800000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "内容选题策划",
                "content": "为以下账号策划一周的内容选题：\n\n账号定位：{{niche}}\n目标平台：{{platform}}\n受众画像：{{audience}}\n\n输出 7 天选题表：\n| 日期 | 选题 | 切入角度 | 内容形式 | 预期热度 | 关联热点 |\n|---|---|---|---|---|---|\n\n选题原则：\n- 至少 2 个蹭热点的时效性选题\n- 至少 2 个常青型（evergreen）选题\n- 至少 1 个互动型选题（投票/问答/挑战）\n- 每个选题附 1 句\"钩子\"（让人想点进来的那句话）\n\n不要只靠行业经验。结合当前网络热点和搜索趋势来策划。",
                "category": "自媒体",
                "tags": [
                    "选题",
                    "内容",
                    "策划"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-85",
        "title": "用户评论回复",
        "description": "为以下用户评论生成回复：  评论内容：[...] 评论平台：[...] 我的账号角色：[...]  生成 3 种回复策略：  **策略 A — 专业解答型** [直接回应问题，展示专业性]  **策略 B — 互动拉近型** [拉近距离，鼓励持续互动]  **策略 C — 幽默化解型** [轻松化解，适合非严肃话题]",
        "category": "自媒体",
        "tags": [
            "评论",
            "回复",
            "运营"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 8,
        "downvotes": 2,
        "installCount": 155,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 58,
        "publishedAt": new Date(Date.now() - 1382400000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "用户评论回复",
                "content": "为以下用户评论生成回复：\n\n评论内容：{{comment}}\n评论平台：{{platform}}\n我的账号角色：{{role}}\n\n生成 3 种回复策略：\n\n**策略 A — 专业解答型**\n[直接回应问题，展示专业性]\n\n**策略 B — 互动拉近型**\n[拉近距离，鼓励持续互动]\n\n**策略 C — 幽默化解型**\n[轻松化解，适合非严肃话题]\n\n每条回复不超过 50 字（适配评论区阅读习惯）。\n\n如果是负面评论，不要对抗或删除。先共情，再引导，最后给方案。",
                "category": "自媒体",
                "tags": [
                    "评论",
                    "回复",
                    "运营"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-86",
        "title": "数据分析报告",
        "description": "分析以下自媒体运营数据并给出优化建议：  [...]  分析框架： 1. **核心指标表现**： | 指标 | 本期 | 上期 | 变化率 | 行业基准 | |---|---|---|---|---|  2. **内容分析**： - 表现最好的 3 条内容是什么类型？为什么好？ - 表现最差的 3 条内容踩了什么坑？",
        "category": "自媒体",
        "tags": [
            "数据",
            "分析",
            "运营"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 21,
        "downvotes": 4,
        "installCount": 116,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 74,
        "publishedAt": new Date(Date.now() - 1296000000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "数据分析报告",
                "content": "分析以下自媒体运营数据并给出优化建议：\n\n{{data}}\n\n分析框架：\n1. **核心指标表现**：\n| 指标 | 本期 | 上期 | 变化率 | 行业基准 |\n|---|---|---|---|---|\n\n2. **内容分析**：\n- 表现最好的 3 条内容是什么类型？为什么好？\n- 表现最差的 3 条内容踩了什么坑？\n\n3. **用户行为洞察**：活跃时段、互动偏好、关注/取关模式\n\n4. **优化建议**（按影响力排序）：\n- 立即可做（本周）：\n- 短期优化（本月）：\n- 长期策略（本季度）：\n\n不要只描述数据。数据是工具，洞察才是价值。每个数据点都要有\"so what\"。",
                "category": "自媒体",
                "tags": [
                    "数据",
                    "分析",
                    "运营"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-87",
        "title": "品牌人设打造",
        "description": "帮我设计一个自媒体品牌人设：  领域：[...] 我的真实特点：[...] 目标受众：[...]  输出： 1. **人设定位**（1 句话 slogan） 2. **人设关键词**：5 个形容词 3. **说话风格指南**：    - 常用句式 / 口头禅（3 个）    - 绝对不能说的话（3 个）    - 面对",
        "category": "自媒体",
        "tags": [
            "人设",
            "品牌",
            "定位"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 29,
        "downvotes": 0,
        "installCount": 171,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 80,
        "publishedAt": new Date(Date.now() - 1209600000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "品牌人设打造",
                "content": "帮我设计一个自媒体品牌人设：\n\n领域：{{niche}}\n我的真实特点：{{characteristics}}\n目标受众：{{target_audience}}\n\n输出：\n1. **人设定位**（1 句话 slogan）\n2. **人设关键词**：5 个形容词\n3. **说话风格指南**：\n   - 常用句式 / 口头禅（3 个）\n   - 绝对不能说的话（3 个）\n   - 面对争议时的回应模板\n4. **视觉调性**：推荐的头像风格、主色调、排版风格\n5. **内容支柱**：3 个固定的内容栏目/话题\n6. **差异化**：与同赛道其他博主的核心区别\n\n人设必须基于我的真实特点，不要凭空捏造一个假人设。可以放大优势，但不能虚构。",
                "category": "自媒体",
                "tags": [
                    "人设",
                    "品牌",
                    "定位"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-88",
        "title": "爆款选题分析",
        "description": "分析以下爆款内容成功的原因，并提取可复用的方法论：  爆款内容：[...] 数据表现：[...]  分析维度： 1. **标题/封面解剖**：用了什么钩子技法？ 2. **内容结构**：信息密度、节奏感、高潮点在哪？ 3. **情绪设计**：调动了什么情绪？（好奇/愤怒/共鸣/向往...） 4. **传播动机**：用户",
        "category": "自媒体",
        "tags": [
            "爆款",
            "分析",
            "方法论"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 48,
        "downvotes": 0,
        "installCount": 61,
        "type": "prompt",
        "language": "en",
        "variableCount": 3,
        "tokenEstimate": 73,
        "publishedAt": new Date(Date.now() - 1123200000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "爆款选题分析",
                "content": "分析以下爆款内容成功的原因，并提取可复用的方法论：\n\n爆款内容：{{content}}\n数据表现：{{metrics}}\n\n分析维度：\n1. **标题/封面解剖**：用了什么钩子技法？\n2. **内容结构**：信息密度、节奏感、高潮点在哪？\n3. **情绪设计**：调动了什么情绪？（好奇/愤怒/共鸣/向往...）\n4. **传播动机**：用户转发的理由是什么？（社交货币/实用价值/自我表达）\n5. **可复用公式**：提取 1 个\"填空式\"的选题公式\n\n用这个公式为我的账号（{{my_niche}}）生成 3 个模仿选题。\n\n不要简单地说\"内容好所以火了\"。拆解到可操作的颗粒度。",
                "category": "自媒体",
                "tags": [
                    "爆款",
                    "分析",
                    "方法论"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-89",
        "title": "第一性原理思考",
        "description": "用第一性原理分析这个问题：  [...]  思考过程： 1. **打碎假设**：列出人们对这个问题通常有哪些默认假设 2. **追问本质**：连续问 5 个\"为什么\"，追到最底层的事实 3. **重新构建**：如果从零开始设计解决方案（忽略所有现有做法），会怎么做？ 4. **可行性检验**：这个\"从零开始\"的方案，在",
        "category": "思维工具",
        "tags": [
            "第一性原理",
            "思考",
            "分析"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 46,
        "downvotes": 2,
        "installCount": 122,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 60,
        "publishedAt": new Date(Date.now() - 1036800000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "第一性原理思考",
                "content": "用第一性原理分析这个问题：\n\n{{question}}\n\n思考过程：\n1. **打碎假设**：列出人们对这个问题通常有哪些默认假设\n2. **追问本质**：连续问 5 个\"为什么\"，追到最底层的事实\n3. **重新构建**：如果从零开始设计解决方案（忽略所有现有做法），会怎么做？\n4. **可行性检验**：这个\"从零开始\"的方案，在现实中需要克服什么障碍？\n5. **结论**：基于第一性原理，最优解与现状的差距是什么？\n\n不要满足于\"行业惯例就是这样\"。惯例不等于最优解。",
                "category": "思维工具",
                "tags": [
                    "第一性原理",
                    "思考",
                    "分析"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-90",
        "title": "逆向思维教练",
        "description": "用逆向思维分析这个问题：  [...]  逆向分析过程： 1. **反转目标**：如果我想让这件事「彻底失败」，我应该怎么做？（列出 5 条\"保证失败\"的做法） 2. **避免清单**：将上述 5 条反转为\"绝对不能踩的坑\" 3. **查理·芒格式检验**：在我目前的计划中，有没有已经在做上述\"保证失败\"清单里的事？",
        "category": "思维工具",
        "tags": [
            "逆向",
            "思维",
            "决策"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 42,
        "downvotes": 3,
        "installCount": 202,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 62,
        "publishedAt": new Date(Date.now() - 950400000).toISOString(),
        "updatedAt": new Date(Date.now() - 172800000).toISOString(),
        "_demoContent": [
            {
                "title": "逆向思维教练",
                "content": "用逆向思维分析这个问题：\n\n{{question}}\n\n逆向分析过程：\n1. **反转目标**：如果我想让这件事「彻底失败」，我应该怎么做？（列出 5 条\"保证失败\"的做法）\n2. **避免清单**：将上述 5 条反转为\"绝对不能踩的坑\"\n3. **查理·芒格式检验**：在我目前的计划中，有没有已经在做上述\"保证失败\"清单里的事？\n4. **修正方案**：基于逆向分析，调整后的行动方案\n\n\"反过来想，总是反过来想。\" — 查理·芒格\n\n不要把逆向思维当噱头。重点是通过\"思考失败\"来避免失败。",
                "category": "思维工具",
                "tags": [
                    "逆向",
                    "思维",
                    "决策"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-91",
        "title": "六顶思考帽",
        "description": "用六顶思考帽方法全面分析：  [...]  **⚪ 白帽（事实）**：客观数据和已知事实是什么？ **🔴 红帽（直觉）**：你的直觉和情绪反应是什么？不需要理由 **⚫ 黑帽（谨慎）**：风险、隐患、最坏情况是什么？ **🟡 黄帽（乐观）**：最好的结果是什么？有什么机会？ **🟢 绿帽（创意）**：有什么非常规",
        "category": "思维工具",
        "tags": [
            "六顶帽",
            "决策",
            "分析"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 20,
        "downvotes": 1,
        "installCount": 90,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 60,
        "publishedAt": new Date(Date.now() - 864000000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "六顶思考帽",
                "content": "用六顶思考帽方法全面分析：\n\n{{topic}}\n\n**⚪ 白帽（事实）**：客观数据和已知事实是什么？\n**🔴 红帽（直觉）**：你的直觉和情绪反应是什么？不需要理由\n**⚫ 黑帽（谨慎）**：风险、隐患、最坏情况是什么？\n**🟡 黄帽（乐观）**：最好的结果是什么？有什么机会？\n**🟢 绿帽（创意）**：有什么非常规的解决思路？\n**🔵 蓝帽（总结）**：综合以上分析，结论和下一步是什么？\n\n每顶帽子的分析限 3-5 句话。不要在一顶帽子下混入其他帽子的思维。",
                "category": "思维工具",
                "tags": [
                    "六顶帽",
                    "决策",
                    "分析"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-92",
        "title": "5W2H 分析法",
        "description": "用 5W2H 方法拆解这个问题/计划：  [...]  | 维度 | 问题 | 分析 | |---|---|---| | **What** | 要做什么？核心目标是？ | | | **Why** | 为什么要做？不做会怎样？ | | | **Who** | 谁来做？涉及哪些利益相关方？ | | | **When** |",
        "category": "思维工具",
        "tags": [
            "5W2H",
            "分析",
            "框架"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 51,
        "downvotes": 3,
        "installCount": 43,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 90,
        "publishedAt": new Date(Date.now() - 777600000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "5W2H 分析法",
                "content": "用 5W2H 方法拆解这个问题/计划：\n\n{{topic}}\n\n| 维度 | 问题 | 分析 |\n|---|---|---|\n| **What** | 要做什么？核心目标是？ | |\n| **Why** | 为什么要做？不做会怎样？ | |\n| **Who** | 谁来做？涉及哪些利益相关方？ | |\n| **When** | 什么时候做？关键时间节点？ | |\n| **Where** | 在哪里做？影响范围？ | |\n| **How** | 怎么做？具体方法和步骤？ | |\n| **How Much** | 需要多少资源？ROI 评估？ | |\n\n**盲点检查**：有哪个 W/H 没有被充分考虑？\n**优先行动**：基于分析，最应该先解决哪个维度？\n\n不要让分析停留在提问。每个维度都要有具体、可执行的回答。",
                "category": "思维工具",
                "tags": [
                    "5W2H",
                    "分析",
                    "框架"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-93",
        "title": "复盘教练",
        "description": "帮我对以下事件进行结构化复盘：  [...]  复盘框架（GRAI 模型）： 1. **Goal（目标回顾）**：    - 当初的目标是什么？    - 目标设定合理吗？  2. **Result（结果对比）**：    - 实际结果 vs 预期目标    - 差距有多大？超额还是不足？  3. **Analysis",
        "category": "思维工具",
        "tags": [
            "复盘",
            "反思",
            "总结"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 38,
        "downvotes": 1,
        "installCount": 118,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 82,
        "publishedAt": new Date(Date.now() - 691200000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "复盘教练",
                "content": "帮我对以下事件进行结构化复盘：\n\n{{event}}\n\n复盘框架（GRAI 模型）：\n1. **Goal（目标回顾）**：\n   - 当初的目标是什么？\n   - 目标设定合理吗？\n\n2. **Result（结果对比）**：\n   - 实际结果 vs 预期目标\n   - 差距有多大？超额还是不足？\n\n3. **Analysis（原因分析）**：\n   - 成功因素：哪些做法值得继续？（至少 3 点）\n   - 失败因素：哪些做法需要改变？（至少 3 点）\n   - 区分运气和实力的成分\n\n4. **Insight（行动洞察）**：\n   - 提炼 1 条可复用的方法论\n   - 下次类似情况的行动清单\n\n不要做流水账式复盘。重点是提炼出可迁移的认知。",
                "category": "思维工具",
                "tags": [
                    "复盘",
                    "反思",
                    "总结"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-94",
        "title": "类比推理助手",
        "description": "用类比思维帮我理解/解决这个问题：  [...]  步骤： 1. **寻找类比**：从完全不同的领域找 3 个与此问题结构相似的情境 2. **映射关系**：画出原问题和类比情境之间的对应关系表    | 原问题要素 | 类比情境要素 | 对应关系 |    |---|---|---| 3. **借鉴方案**：这些类比",
        "category": "思维工具",
        "tags": [
            "类比",
            "跨界",
            "创新"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 5,
        "downvotes": 0,
        "installCount": 90,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 72,
        "publishedAt": new Date(Date.now() - 604800000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "类比推理助手",
                "content": "用类比思维帮我理解/解决这个问题：\n\n{{question}}\n\n步骤：\n1. **寻找类比**：从完全不同的领域找 3 个与此问题结构相似的情境\n2. **映射关系**：画出原问题和类比情境之间的对应关系表\n   | 原问题要素 | 类比情境要素 | 对应关系 |\n   |---|---|---|\n3. **借鉴方案**：这些类比领域是怎么解决类似问题的？\n4. **迁移应用**：将借鉴的方案翻译回原问题的语境\n5. **检验**：类比在哪里成立，在哪里不成立？（找出类比的局限性）\n\n好的类比应该来自尽可能远的领域。用生物学类比商业，用建筑学类比编程，越跨界越好。",
                "category": "思维工具",
                "tags": [
                    "类比",
                    "跨界",
                    "创新"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-95",
        "title": "成语故事讲解",
        "description": "深度讲解这个成语：  [...]  结构： 1. **字面解释**：每个字的原始含义 2. **典故出处**：原始故事（用生动的叙事而非百科式罗列） 3. **含义演变**：从古到今，含义发生了什么变化？ 4. **正确用法**：2 个正确的例句 5. **常见误用**：这个成语最容易在什么场景下被错用？ 6. **近",
        "category": "国学文化",
        "tags": [
            "成语",
            "故事",
            "文化"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 32,
        "downvotes": 4,
        "installCount": 195,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 53,
        "publishedAt": new Date(Date.now() - 518400000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "成语故事讲解",
                "content": "深度讲解这个成语：\n\n{{idiom}}\n\n结构：\n1. **字面解释**：每个字的原始含义\n2. **典故出处**：原始故事（用生动的叙事而非百科式罗列）\n3. **含义演变**：从古到今，含义发生了什么变化？\n4. **正确用法**：2 个正确的例句\n5. **常见误用**：这个成语最容易在什么场景下被错用？\n6. **近义辨析**：与 1-2 个近义成语的区别\n\n不要写成词典条目。要像给朋友讲一个有趣的故事一样。",
                "category": "国学文化",
                "tags": [
                    "成语",
                    "故事",
                    "文化"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-96",
        "title": "对联创作",
        "description": "创作一副对联：  主题/场景：[...]  要求： - 字数对齐，平仄工整 - 上下联词性对仗 - 意境优美，有巧思 - 横批四字点睛  提供 3 副不同风格的对联： 1. **典雅古风**：用典、意境深远 2. **通俗趣味**：接地气、有幽默感 3. **创意新颖**：打破常规但不失工整  每副对联附简要赏析（为什",
        "category": "国学文化",
        "tags": [
            "对联",
            "创作",
            "传统"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 53,
        "downvotes": 1,
        "installCount": 64,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 51,
        "publishedAt": new Date(Date.now() - 432000000).toISOString(),
        "updatedAt": new Date(Date.now() - 518400000).toISOString(),
        "_demoContent": [
            {
                "title": "对联创作",
                "content": "创作一副对联：\n\n主题/场景：{{theme}}\n\n要求：\n- 字数对齐，平仄工整\n- 上下联词性对仗\n- 意境优美，有巧思\n- 横批四字点睛\n\n提供 3 副不同风格的对联：\n1. **典雅古风**：用典、意境深远\n2. **通俗趣味**：接地气、有幽默感\n3. **创意新颖**：打破常规但不失工整\n\n每副对联附简要赏析（为什么这么对，巧在哪里）。\n\n不要为凑字数而使用生僻字或晦涩典故。好对联应该雅俗共赏。",
                "category": "国学文化",
                "tags": [
                    "对联",
                    "创作",
                    "传统"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-97",
        "title": "古今人物对话",
        "description": "模拟一场[...]与现代人关于[...]的对话。  规则： - [...]的语言风格要忠实于其时代和性格 - 适度引用其真实的名言或思想 - 现代人用当代口语，可以适当用网络用语 - 对话要有思想碰撞，不是简单的\"古人说得对\" - 至少 8 轮对话  对话中要自然地融入[...]的 3 个核心思想观点。  不要把古人写",
        "category": "国学文化",
        "tags": [
            "对话",
            "历史",
            "人物"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 53,
        "downvotes": 4,
        "installCount": 51,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 60,
        "publishedAt": new Date(Date.now() - 345600000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "古今人物对话",
                "content": "模拟一场{{historical_figure}}与现代人关于{{topic}}的对话。\n\n规则：\n- {{historical_figure}}的语言风格要忠实于其时代和性格\n- 适度引用其真实的名言或思想\n- 现代人用当代口语，可以适当用网络用语\n- 对话要有思想碰撞，不是简单的\"古人说得对\"\n- 至少 8 轮对话\n\n对话中要自然地融入{{historical_figure}}的 3 个核心思想观点。\n\n不要把古人写成完美的圣人。他们也有时代局限性，对话应该呈现这种张力。",
                "category": "国学文化",
                "tags": [
                    "对话",
                    "历史",
                    "人物"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-98",
        "title": "诗词创作助手",
        "description": "以[...]为主题创作一首[...]。  创作要求： - 严格遵守格律（平仄、押韵、对仗） - 避免直白说理，要\"言有尽而意无穷\" - 至少使用 1 个通感或化用前人佳句 - 意象选择要新颖，避免\"明月\"\"清风\"等俗套意象  输出： **作品**： [诗词正文]  **自评**： - 格律校验：平仄/押韵是否合规 -",
        "category": "国学文化",
        "tags": [
            "诗词",
            "创作",
            "格律"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 40,
        "downvotes": 3,
        "installCount": 200,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 60,
        "publishedAt": new Date(Date.now() - 259200000).toISOString(),
        "updatedAt": new Date(Date.now() - 0).toISOString(),
        "_demoContent": [
            {
                "title": "诗词创作助手",
                "content": "以{{theme}}为主题创作一首{{form:七言绝句}}。\n\n创作要求：\n- 严格遵守格律（平仄、押韵、对仗）\n- 避免直白说理，要\"言有尽而意无穷\"\n- 至少使用 1 个通感或化用前人佳句\n- 意象选择要新颖，避免\"明月\"\"清风\"等俗套意象\n\n输出：\n**作品**：\n[诗词正文]\n\n**自评**：\n- 格律校验：平仄/押韵是否合规\n- 意象选择：为什么选这些意象\n- 最得意的一句：为什么觉得写得好\n- 不足之处：哪里还可以打磨\n\n不要只求\"像诗\"。要有真情实感和个人视角。",
                "category": "国学文化",
                "tags": [
                    "诗词",
                    "创作",
                    "格律"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-99",
        "title": "中华典故应用",
        "description": "推荐适合以下场景使用的中华典故/名言：  使用场景：[...]  推荐 5 个典故/名言，每个包含：  | 序号 | 典故/名言 | 出处 | 原文含义 | 在此场景如何使用 | 使用示例句 | |---|---|---|---|---|---|  分类： - 2 个广为人知的经典（确保不会用错） - 2 个相对冷门但",
        "category": "国学文化",
        "tags": [
            "典故",
            "名言",
            "应用"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 73,
        "upvotes": 47,
        "downvotes": 3,
        "installCount": 138,
        "type": "prompt",
        "language": "en",
        "variableCount": 1,
        "tokenEstimate": 56,
        "publishedAt": new Date(Date.now() - 172800000).toISOString(),
        "updatedAt": new Date(Date.now() - 345600000).toISOString(),
        "_demoContent": [
            {
                "title": "中华典故应用",
                "content": "推荐适合以下场景使用的中华典故/名言：\n\n使用场景：{{scenario}}\n\n推荐 5 个典故/名言，每个包含：\n\n| 序号 | 典故/名言 | 出处 | 原文含义 | 在此场景如何使用 | 使用示例句 |\n|---|---|---|---|---|---|\n\n分类：\n- 2 个广为人知的经典（确保不会用错）\n- 2 个相对冷门但恰切的（展现文化底蕴）\n- 1 个可以幽默化用的（调节气氛）\n\n提醒：标注哪些典故在特定场合可能有负面联想需要慎用。",
                "category": "国学文化",
                "tags": [
                    "典故",
                    "名言",
                    "应用"
                ]
            }
        ]
    },
    {
        "gistId": "builtin-100",
        "title": "文言文翻译与仿写",
        "description": "完成以下文言文相关任务：  文言文原文： [...]  任务 1 — 精准翻译： 逐句对照翻译，格式： > 原文：[文言文] > 翻译：[现代文] > 注释：[关键字词解释]  任务 2 — 语法分析： 标注文中出现的特殊文言语法（判断句、被动句、倒装句、省略句等）  任务 3 — 风格仿写： 模仿此文的文风，以\"[.",
        "category": "国学文化",
        "tags": [
            "文言文",
            "翻译",
            "仿写"
        ],
        "author": "prompt-ark",
        "authorAvatar": "",
        "qualityScore": 70,
        "upvotes": 11,
        "downvotes": 0,
        "installCount": 36,
        "type": "prompt",
        "language": "en",
        "variableCount": 2,
        "tokenEstimate": 60,
        "publishedAt": new Date(Date.now() - 86400000).toISOString(),
        "updatedAt": new Date(Date.now() - 259200000).toISOString(),
        "_demoContent": [
            {
                "title": "文言文翻译与仿写",
                "content": "完成以下文言文相关任务：\n\n文言文原文：\n{{text}}\n\n任务 1 — 精准翻译：\n逐句对照翻译，格式：\n> 原文：[文言文]\n> 翻译：[现代文]\n> 注释：[关键字词解释]\n\n任务 2 — 语法分析：\n标注文中出现的特殊文言语法（判断句、被动句、倒装句、省略句等）\n\n任务 3 — 风格仿写：\n模仿此文的文风，以\"{{modern_topic}}\"为主题写一段 100 字左右的文言文，附上白话文对照。\n\n翻译要准确达意，不要为了好听而曲解原意。仿写要「神似」而非「形似」。",
                "category": "国学文化",
                "tags": [
                    "文言文",
                    "翻译",
                    "仿写"
                ]
            }
        ]
    }
];
}
