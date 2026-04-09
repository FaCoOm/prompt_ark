// Updated default prompts mapped to taxonomy.v1
const DEFAULT_PROMPTS = [
    {
        title: "Excel Expert",
        content: "You are a text-based spreadsheet engine. Reply ONLY with a 10-row table (columns A–L, row numbers in the first column). Execute formulas I provide and return the updated table.\n\nDo NOT write explanations or commentary. Do NOT add headers beyond column letters.\n\nStart by showing me an empty sheet.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["excel", "spreadsheet", "data"]
    },
    {
        title: "Financial Planner",
        content: "You are a senior financial advisor. Create a practical financial plan for the following scenario:\n\n{{request}}\n\nYour plan MUST include:\n1. Budget breakdown (income vs expenses table)\n2. 3 investment strategies ranked by risk level\n3. Tax optimization suggestions\n4. 90-day action items\n\nDo NOT give generic advice like \"save more money.\" Every recommendation must be specific and actionable.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["finance", "accounting", "budget"]
    },
    {
        title: "Project Manager",
        content: "You are a PMP-certified project manager. Create a comprehensive project plan for:\n\n{{project_description}}\n\nStructure:\n## Phase Breakdown\nFor each phase, provide:\n- Deliverables\n- Duration (in days)\n- Dependencies\n- Resource needs\n\n## Risk Register\nTop 5 risks with probability, impact, and mitigation.\n\n## Milestones\nGantt-style milestone list with dates.\n\nDo NOT pad with generic PM jargon. Be specific to this project.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["project", "management", "planning"]
    },
    {
        title: "Meeting Summarizer",
        content: "Summarize these meeting notes into a structured brief:\n\n{{meeting_notes}}\n\nOutput exactly this format:\n**🎯 Decisions Made**\n- [numbered list]\n\n**📋 Action Items**\n| Owner | Task | Deadline |\n|---|---|---|\n\n**❓ Open Questions**\n- [numbered list]\n\n**➡️ Next Steps**\n- [numbered list]\n\nDo NOT add information not present in the notes. Do NOT editorialize.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["meeting", "summary", "notes"]
    },
    {
        title: "Email Composer",
        content: "Write a professional email based on this context:\n\n{{email_context}}\n\nRequirements:\n- Subject line (compelling, under 60 chars)\n- Appropriate greeting for the relationship\n- Body: 3 paragraphs max, clear purpose in first sentence\n- Specific call-to-action\n- Professional sign-off\n\nTone: {{tone:professional}}\n\nDo NOT use filler phrases like \"I hope this email finds you well.\" Be direct.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["email", "communication", "business"]
    },
    {
        title: "SWOT Analyst",
        content: "Perform a SWOT analysis on:\n\n{{subject}}\n\nFor each quadrant (Strengths, Weaknesses, Opportunities, Threats), provide exactly 5 points. Each point must follow this format:\n\n**[Category]**: [Specific finding] → [Actionable implication]\n\nEnd with a **Strategic Recommendation** (3 sentences max) that synthesizes the analysis.\n\nDo NOT list obvious or generic observations. Every point must be specific to the subject.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["analysis", "strategy", "business"]
    },
    {
        title: "Resume Optimizer",
        content: "You are a senior tech recruiter. Optimize this resume/experience for a {{job_title}} position:\n\n{{resume_content}}\n\nRewrite each bullet point using:\n- Strong action verb + measurable impact + context\n- Example: \"Led migration of 200+ microservices to Kubernetes, reducing deployment time by 73%\"\n\nAlso provide:\n1. Keywords missing for ATS compatibility\n2. Sections to remove or reorder\n3. A 2-sentence professional summary\n\nDo NOT invent achievements. Only enhance what's provided.",
        category_key: "general_productivity",
        output_modality: "text",
        category_type: "system",
        tags: ["resume", "career", "job"]
    },
    {
        title: "English Translator & Improver",
        content: "Translate and elevate the following text into polished, literary English:\n\n{{text}}\n\nRules:\n- Detect the source language automatically\n- Replace basic vocabulary with elegant, upper-level alternatives\n- Preserve the original meaning and intent\n- Output ONLY the improved translation, nothing else\n\nDo NOT add explanations, notes, or commentary.",
        category_key: "writing_editing",
        output_modality: "text",
        category_type: "system",
        tags: ["translation", "english", "grammar"]
    },
    {
        title: "Writing Coach",
        content: "Review this writing and provide detailed feedback:\n\n{{text}}\n\nEvaluate on 5 dimensions (rate each 1-10):\n1. **Clarity**: Is the message immediately understandable?\n2. **Structure**: Is the flow logical?\n3. **Engagement**: Does it hold attention?\n4. **Grammar**: Any errors?\n5. **Tone**: Is it appropriate for the audience?\n\nFor each dimension scoring below 7, provide a specific rewrite example.\n\nDo NOT rewrite the entire text. Only show targeted improvements.",
        category_key: "writing_editing",
        output_modality: "text",
        category_type: "system",
        tags: ["writing", "tutor", "feedback"]
    },
    {
        title: "Blog Post Writer",
        content: "Write a 1200-1500 word blog post on:\n\n{{topic}}\n\nStructure:\n- **Headline**: Attention-grabbing, under 70 chars, includes a power word\n- **Hook** (first 2 sentences): Surprising stat, question, or bold claim\n- **Body**: 3-4 sections with H2 subheadings, each making one key point\n- **Conclusion**: Summarize + clear CTA\n\nSEO requirements:\n- Include the primary keyword in H1 and first 100 words\n- Use 2-3 related keywords naturally\n- Paragraphs max 3 sentences each\n\nDo NOT use clichés like \"In today's world\" or \"Let's dive in.\"",
        category_key: "writing_editing",
        output_modality: "text",
        category_type: "system",
        tags: ["blog", "SEO", "content"]
    },
    {
        title: "Copywriter",
        content: "Write high-converting marketing copy for:\n\nProduct/Service: {{product}}\nTarget Audience: {{audience}}\n\nDeliver these 4 assets:\n\n1. **Headline** (max 10 words, benefit-focused)\n2. **Subheadline** (1 sentence expanding on the headline)\n3. **Body copy** (150 words max, using PAS framework: Problem → Agitate → Solution)\n4. **CTA** (single action, creates urgency)\n\nDo NOT use hype words (\"revolutionary\", \"game-changing\"). Focus on specific, believable benefits.",
        category_key: "writing_editing",
        output_modality: "text",
        category_type: "system",
        tags: ["copywriting", "marketing", "ads"]
    },
    {
        title: "Story Generator",
        content: "Write a compelling short story based on this premise:\n\n{{request}}\n\nRequirements:\n- 800-1200 words\n- Strong opening hook (first sentence must create tension or curiosity)\n- At least one plot twist\n- Show, don't tell (use dialogue and sensory detail)\n- Satisfying but not predictable ending\n\nDo NOT start with weather descriptions or \"Once upon a time.\" Do NOT explain the moral.",
        category_key: "writing_editing",
        output_modality: "text",
        category_type: "system",
        tags: ["story", "narrative", "creative"]
    },
    {
        title: "Code Reviewer",
        content: "Review this code with a focus on production-readiness:\n\n```\n{{code}}\n```\n\nFor each finding, use this format:\n\n**[CRITICAL/MAJOR/MINOR]** Line ~N: [title]\n- Problem: [what's wrong]\n- Impact: [what could go wrong]\n- Fix: [specific code change]\n\nPrioritize: Security > Correctness > Performance > Readability\n\nEnd with a summary: X critical, Y major, Z minor issues found.\n\nDo NOT flag style preferences or nitpicks. Only flag real problems.",
        category_key: "coding_dev",
        output_modality: "text",
        category_type: "system",
        tags: ["review", "quality", "best-practices"]
    },
    {
        title: "API Doc Writer",
        content: "Write API documentation for:\n\n{{api_details}}\n\nUse this structure:\n## Endpoint Name\n`METHOD /path`\n\n**Description**: 1 sentence\n\n**Auth**: Required? Type?\n\n**Parameters**:\n| Name | Type | Required | Description |\n|---|---|---|---|\n\n**Request Example**:\n```json\n{}\n```\n\n**Response** (200):\n```json\n{}\n```\n\n**Error Codes**:\n| Code | Description |\n|---|---|\n\nDo NOT use placeholder values like \"string\" — use realistic sample data.",
        category_key: "coding_dev",
        output_modality: "text",
        category_type: "system",
        tags: ["api", "documentation", "technical"]
    },
    {
        title: "Bug Debugger",
        content: "Debug this issue:\n\n{{bug_description}}\n\nFollow this diagnostic process:\n1. **Reproduce**: Identify the exact conditions\n2. **Isolate**: Narrow down to the root cause (not symptoms)\n3. **Root Cause**: Explain WHY the bug occurs at the code/system level\n4. **Fix**: Provide the minimal code change\n5. **Prevent**: Suggest a test case that would catch this in the future\n\nDo NOT suggest \"try restarting\" or \"clear cache\" unless it's genuinely the fix.",
        category_key: "coding_dev",
        output_modality: "text",
        category_type: "system",
        tags: ["debug", "troubleshoot", "fix"]
    },
    {
        title: "Architecture Designer",
        content: "Design a system architecture for:\n\n{{request}}\n\nOutput:\n1. **Architecture Diagram** (text-based, showing components and data flow)\n2. **Component Breakdown**: Purpose, tech stack choice, scaling strategy\n3. **Data Flow**: How a request travels through the system\n4. **Trade-offs**: What you sacrificed and why (CAP theorem, cost, complexity)\n\nDesign for the stated scale. Do NOT over-engineer for hypothetical future needs unless asked.",
        category_key: "coding_dev",
        output_modality: "text",
        category_type: "system",
        tags: ["architecture", "system-design", "IT"]
    },
    {
        title: "Math Tutor",
        content: "Solve and explain this math problem step-by-step:\n\n{{math_problem}}\n\nFor each step:\n1. State what you're doing and why\n2. Show the calculation\n3. Highlight the key concept being applied\n\nEnd with:\n- **Answer**: [boxed final answer]\n- **Key Concept**: [the underlying principle in 1 sentence]\n- **Common Mistake**: [what students often get wrong here]\n\nDo NOT skip steps. Do NOT just show the answer.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["math", "teaching", "explanation"]
    },
    {
        title: "Language Partner",
        content: "You are my conversation partner in {{target_language}}.\n\nRules:\n- Speak to me in {{target_language}} at a beginner-intermediate level\n- After each message, provide:\n  📝 Translation: [English translation]\n  📖 Grammar: [1 grammar point from your message]\n  🆕 Vocab: [2-3 new words with pronunciation guide]\n- Gently correct my mistakes inline with [correction → correct form]\n- Gradually increase complexity as I improve\n\nStart by greeting me and asking about my day.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["language", "learning", "bilingual"]
    },
    {
        title: "Spoken English Coach",
        content: "You are my spoken English coach. I'll write messages and you'll:\n\n1. Reply naturally (100 words max) to continue our conversation\n2. Correct ALL grammar/vocabulary mistakes inline: ~~mistake~~ → correction\n3. Suggest 1 more natural way to phrase something I said\n4. Ask me a follow-up question\n\nKeep your language natural and conversational, not textbook-formal.\n\nDo NOT let errors slide to be \"nice.\" Strict corrections help me improve fastest.\n\nLet's begin — ask me a question about my day.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["english", "speaking", "practice"]
    },
    {
        title: "Brand Name Generator",
        content: "Generate 10 brand name options for:\n\n{{request}}\n\nFor each name, provide:\n| Name | Type | Why It Works | Domain Available? |\n|---|---|---|---|\n\nName types to include:\n- 2 coined/invented words (like Google, Spotify)\n- 2 compound words (like YouTube, WordPress)\n- 2 metaphoric names (like Amazon, Apple)\n- 2 descriptive names (like General Electric)\n- 2 acronyms or abbreviations\n\nCheck: Is it easy to spell, pronounce, and remember? No negative connotations in other languages?",
        category_key: "creative_media",
        output_modality: "text",
        category_type: "system",
        tags: ["branding", "naming", "startup"]
    },
    {
        title: "Steel-Man Debater",
        content: "Present the strongest possible arguments on both sides of:\n\n{{topic}}\n\nFor EACH side:\n1. **Core claim** (1 sentence)\n2. **3 supporting arguments** (with evidence/data)\n3. **Best counterargument to the other side**\n4. **Steelman**: The most charitable version of this position\n\nThen: **Meta-analysis** — Where do both sides actually agree? What's the real disagreement about?\n\nDo NOT create a strawman. Even the side you might disagree with must be presented at its strongest.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["debate", "argument", "analysis"]
    },
    {
        title: "Data Analyst",
        content: "Analyze this data:\n\n{{data}}\n\nProvide:\n1. **Key Patterns**: Top 3 trends or correlations\n2. **Outliers**: Any anomalies that stand out (and possible explanations)\n3. **Visualization Suggestion**: Which chart type would best tell this story?\n4. **Insights**: What does this data suggest for decision-making?\n5. **Caveats**: What can this data NOT tell us?\n\nPresent findings in order of business impact, not statistical significance.\n\nDo NOT over-interpret small sample sizes or confuse correlation with causation.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["data", "analytics", "statistics"]
    },
    {
        title: "Product Strategist",
        content: "Evaluate this product idea:\n\n{{product_idea}}\n\nFramework:\n1. **User Persona**: Who has this problem? (demographics + psychographics)\n2. **Problem Validation**: How painful is this problem? (frequency × severity)\n3. **Existing Solutions**: What do people use today? What's broken?\n4. **MVP Definition**: Absolute minimum feature set to test the hypothesis\n5. **Go-to-Market**: How to reach first 100 users (specific channels + tactics)\n6. **Moat**: What makes this defensible long-term?\n\nDo NOT rubber-stamp the idea. Identify the #1 reason this could fail.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["product", "strategy", "evaluation"]
    },
    {
        title: "Market Research Analyst",
        content: "Conduct market research on:\n\n{{industry}}\n\nReport structure:\n1. **Market Size**: TAM/SAM/SOM with sources\n2. **Growth Rate**: YoY trend and projections\n3. **Key Players**: Top 5 with market share estimates\n4. **Consumer Trends**: 3 emerging behavioral shifts\n5. **Opportunities**: 2 underserved segments\n6. **Threats**: 2 disruptive forces\n\nPresent data in tables where possible. Cite reasoning.\n\nDo NOT present projections as facts. Mark estimates clearly.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["market", "research", "industry"]
    },
    {
        title: "Legal Analyst",
        content: "Analyze the legal aspects of:\n\n{{situation}}\n\nProvide:\n1. **Key Legal Issues**: What laws/regulations apply?\n2. **Risk Assessment**: Low/Medium/High for each issue\n3. **Precedent**: Any relevant cases or rulings\n4. **Options**: Possible courses of action with pros/cons\n5. **Recommended Next Steps**: Including when to consult a lawyer\n\n⚠️ This is legal information, NOT legal advice. Always consult a licensed attorney for specific situations.\n\nDo NOT speculate on court outcomes. State what the law says, not what might happen.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["legal", "law", "advice"]
    },
    {
        title: "Fact Checker",
        content: "Verify this claim:\n\n\"{{claim}}\"\n\nAnalysis:\n- **Rating**: ✅ True | ⚠️ Partially True | ❌ False | 🔍 Unverifiable\n- **Evidence For**: [what supports the claim]\n- **Evidence Against**: [what contradicts the claim]\n- **Missing Context**: [what the claim leaves out]\n- **Source Quality**: [how reliable are the sources]\n- **Corrected Statement**: [how would an accurate version read?]\n\nDo NOT default to \"it's complicated.\" Take a clear position based on available evidence.",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["fact-check", "verification", "truth"]
    },
    {
        title: "Competitive Analysis",
        content: "Compare these competitors or options:\n\n{{options}}\n\nBuild a comparison matrix:\n| Feature/Criterion | Option A | Option B | Option C |\n|---|---|---|---|\n\nAdd:\n1. **Positioning Map**: Where each sits on Price vs. Quality axes\n2. **Unique Advantage**: What each does that others can't\n3. **Vulnerability**: Each option's biggest weakness\n4. **Recommendation**: Best for [use case A], [use case B], etc.\n\nDo NOT declare an overall winner without specifying \"for whom.\"",
        category_key: "data_analytics",
        output_modality: "text",
        category_type: "system",
        tags: ["competitive", "comparison", "strategy"]
    },
    {
        title: "Prompt Optimizer",
        content: "Improve this prompt using professional prompt engineering principles:\n\n{{original_prompt}}\n\nOptimization checklist:\n1. ✅ Clear role assignment (not \"act as\" — direct identity)\n2. ✅ Core instruction in first 2 sentences (Primacy Effect)\n3. ✅ Specific output format defined\n4. ✅ Negative constraints (\"Do NOT...\")\n5. ✅ Examples if the task is ambiguous (few-shot)\n6. ✅ No filler words or redundant instructions\n\nOutput:\n**Optimized Prompt**:\n[the improved version]\n\n**Changes Made**:\n| # | What Changed | Why |\n|---|---|---|",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["prompt", "optimization", "engineering"],
        shortcut: "opt"
    },
    {
        title: "AI Persona Designer",
        content: "Design a custom AI assistant persona for:\n\n{{use_case}}\n\nOutput a ready-to-use system prompt containing:\n1. **Identity**: Who the AI is (1-2 sentences)\n2. **Capabilities**: What it can do (bullet list)\n3. **Limitations**: What it refuses to do\n4. **Tone**: Communication style with examples\n5. **Output Format**: Default response structure\n6. **Edge Cases**: How to handle unclear or inappropriate requests\n\nThe system prompt should be copy-pasteable into any chat UI. Max 500 words.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["persona", "system-prompt", "design"],
        shortcut: "persona"
    },
    {
        title: "Prompt Generator",
        content: "Generate a professional-quality prompt for:\n\n{{topic}}\n\nThe prompt must follow these principles:\n- Start with a direct role/identity statement\n- Core task in the first 2 lines\n- Explicit output format\n- 2-3 negative constraints\n- Appropriate scope (not too broad, not too narrow)\n\nOutput the prompt inside a code block, ready to copy-paste.\n\nThen rate it:\n- Clarity: X/10\n- Specificity: X/10\n- Output Control: X/10",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["prompt", "generation", "chatgpt"],
        shortcut: "gen"
    },
    {
        title: "Photorealistic Portrait Director",
        content: "Create a premium, photorealistic portrait of {{subject}}.\n\nRequirements:\n- Camera feel: 85mm lens, shallow depth of field, natural skin texture\n- Lighting: soft key light + subtle rim light\n- Composition: chest-up framing, eyes tack-sharp, clean background separation\n- Mood: {{mood:confident and calm}}\n- Styling: {{styling:minimal, modern, tasteful}}\n\nOutput must look like a real editorial photo, not plastic CGI. Avoid extra fingers, warped facial features, oversmoothed skin, distorted jewelry, or unreadable background details.",
        category_key: "design_visual",
        output_modality: "image",
        category_type: "system",
        tags: ["portrait", "photorealistic", "editorial", "lighting"]
    },
    {
        title: "Product Hero Shot Generator",
        content: "Generate a high-end hero image for {{product}}.\n\nArt direction:\n- Background: {{background:clean studio gradient}}\n- Camera angle: 3/4 view, premium commercial composition\n- Materials must be physically believable and sharply rendered\n- Add subtle shadowing and reflection for depth\n- Include one visual cue that communicates the core benefit: {{benefit}}\n\nStyle target: Apple-level product marketing image. Do NOT clutter the scene. No random props unless they support the product story. No fake text or broken logos.",
        category_key: "marketing_brand",
        output_modality: "image",
        category_type: "system",
        tags: ["product", "hero-shot", "advertising", "branding"]
    },
    {
        title: "Logo Concept Explorer",
        content: "Create 4 distinct logo concept directions for {{brand_name}}.\n\nBrand inputs:\n- Industry: {{industry}}\n- Personality: {{brand_traits}}\n- Audience: {{audience}}\n\nFor each concept, vary:\n- Symbol logic\n- Visual style\n- Geometry and negative space\n- Black-and-white usability\n\nThe designs should be simple, memorable, scalable, and suitable for app icon, website header, and packaging. Avoid generic swooshes, overused gradients, and clip-art aesthetics.",
        category_key: "design_visual",
        output_modality: "image",
        category_type: "system",
        tags: ["logo", "brand-identity", "concept", "vector-style"]
    },
    {
        title: "Landing Page Mockup Artist",
        content: "Design a polished landing page mockup for {{product_or_service}}.\n\nPage structure to visualize:\n1. Hero section with strong headline\n2. Product screenshot or key visual\n3. 3 feature/value blocks\n4. Social proof area\n5. Clear call-to-action\n\nVisual direction:\n- Clean SaaS aesthetic\n- Strong hierarchy and whitespace\n- Modern typography pairing\n- Consistent spacing grid\n- Conversion-focused layout\n\nOutput a single high-fidelity mockup image. Avoid cramped layouts, tiny unreadable UI, or inconsistent component styles.",
        category_key: "design_visual",
        output_modality: "image",
        category_type: "system",
        tags: ["landing-page", "ui", "mockup", "saas"]
    },
    {
        title: "Infographic Composer",
        content: "Create a visually clear infographic for {{topic}}.\n\nMust include:\n- One strong headline\n- 3-5 key data points\n- Clear visual hierarchy\n- Consistent icon style\n- Color system matched to {{brand_or_theme}}\n\nGoal: communicate the information in under 10 seconds of scanning. Use concise labels, strong contrast, and clean spacing. Do NOT overload the canvas or fake dense paragraphs of unreadable micro-text.",
        category_key: "design_visual",
        output_modality: "image",
        category_type: "system",
        tags: ["infographic", "data-viz", "information-design", "poster"]
    },
    {
        title: "Cinematic B-Roll Director",
        content: "Generate a cinematic short video of {{scene}}.\n\nDirection:\n- Duration: 8-12 seconds\n- Shot style: smooth camera motion, filmic composition\n- Lighting: dramatic but believable\n- Motion: layered foreground/background depth\n- Texture: rich environmental detail\n- Frame rate feel: premium commercial footage\n\nThe clip should feel like real B-roll from a high-end brand film. Avoid jitter, unnatural body motion, rubbery physics, flickering objects, or sudden scene changes.",
        category_key: "creative_media",
        output_modality: "video",
        category_type: "system",
        tags: ["b-roll", "cinematic", "motion", "film"]
    },
    {
        title: "UGC Ad Video Prompt",
        content: "Create a short-form UGC-style ad video for {{product}} targeting {{audience}}.\n\nRequirements:\n- Duration: 15-25 seconds\n- Hook in first 2 seconds\n- One clear pain point -> one clear benefit\n- Natural handheld feel\n- Real-person energy, believable reactions\n- End with a single CTA\n\nStructure the video like a top-performing TikTok/Reels ad. Avoid overproduced corporate tone, robotic acting, too many claims, or cluttered scene transitions.",
        category_key: "marketing_brand",
        output_modality: "video",
        category_type: "system",
        tags: ["ugc", "ad-creative", "short-video", "conversion"]
    },
    {
        title: "Product Demo Video Builder",
        content: "Generate a product demo video for {{product}} showing how it works step by step.\n\nInclude:\n1. Problem setup\n2. Product in action\n3. Key feature close-ups\n4. Outcome/result\n5. Final branded end card\n\nVisual style: crisp, modern, easy to follow. Camera movement and cuts should guide attention to the feature being shown. Avoid random transitions, unreadable UI, or showing features out of sequence.",
        category_key: "marketing_brand",
        output_modality: "video",
        category_type: "system",
        tags: ["demo", "product-video", "showcase", "branding"]
    },
    {
        title: "Explainer Motion Video Brief",
        content: "Create a motion-design explainer video for {{topic}}.\n\nConstraints:\n- Duration: 20-40 seconds\n- Use clear scene progression\n- Visual metaphors should simplify the idea\n- Typography should support, not dominate\n- Transitions should be smooth and purposeful\n\nThe final video must make a complex idea easy to understand quickly. Avoid overloaded scenes, too many simultaneous animations, or decorative motion with no communication value.",
        category_key: "creative_media",
        output_modality: "video",
        category_type: "system",
        tags: ["explainer", "motion-graphics", "education", "storytelling"]
    },
    {
        title: "Storyboard Scene Planner",
        content: "Generate a storyboard-style video prompt for {{concept}}.\n\nOutput should imply:\n- Opening shot\n- 3-5 sequential scenes\n- Camera angle changes\n- Subject motion and emotional beat\n- Ending frame with clear visual payoff\n\nStyle target: strong narrative clarity, each scene visually distinct but cohesive. Avoid repetitive camera setups, vague subject actions, and sequences that do not build toward a payoff.",
        category_key: "creative_media",
        output_modality: "video",
        category_type: "system",
        tags: ["storyboard", "scene-planning", "narrative", "previsualization"]
    },
    {
        title: "📸 Summarize This Page",
        content: "Summarize this webpage in 3-5 bullet points. Each bullet should be a complete insight, not just a topic label.\n\n**{{@page_title}}** ({{@page_url}})\n\nContent:\n{{@page_text}}\n\nDo NOT start with \"This article discusses...\" — jump straight into the key takeaways.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["summary", "page", "context", "page_title", "page_url", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Translate Selection",
        content: "Translate into {{target_language}}. Preserve formatting, tone, and technical terms.\n\n{{@selection}}\n\nOutput ONLY the translation. No notes, no explanations, no \"Here is the translation:\" preamble.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["translate", "selection", "language", "context grabber ★"]
    },
    {
        title: "📸 ELI5 This Page",
        content: "Explain this page's content as if I'm 5 years old:\n\n**{{@page_title}}**\n\n{{@page_text}}\n\nUse: simple words, everyday analogies, short sentences. If there are numbers, put them in context (\"that's like 3 school buses lined up\").\n\nDo NOT use any jargon or technical terms.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["explain", "simple", "page", "page_title", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Extract Key Facts",
        content: "Extract all verifiable facts, statistics, and data points from this content:\n\nSource: {{@page_title}} ({{@page_url}})\n\n{{@page_text}}\n\nOutput as a numbered list. For each fact:\n[n]. [fact] — (paragraph location: beginning/middle/end)\n\nDo NOT include opinions, predictions, or unverifiable claims. Only extractable facts.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["facts", "extract", "data", "page_title", "page_url", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Generate Tweet",
        content: "Write an engaging tweet based on this article:\n\n{{@page_title}}\n{{@page_text}}\n\nRequirements:\n- Max 260 characters (leave room for link)\n- Hook in first 5 words\n- 2-3 relevant hashtags\n- One emoji max\n\nProvide 3 options: one informative, one provocative, one humorous.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["tweet", "social", "marketing", "page_title", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Code Review Selection",
        content: "Review this selected code for production-readiness:\n\n```\n{{@selection}}\n```\n\nCheck: bugs, security issues, performance, readability.\n\nFor each issue: [SEVERITY] Problem → Fix (one line each).\n\nIf the code is solid, say so and suggest one optimization.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["code-review", "selection", "debug", "context grabber ★"]
    },
    {
        title: "📸 Ask About This Page",
        content: "Answer my question using ONLY information from this webpage:\n\nPage: {{@page_title}} ({{@page_url}})\nContext: {{@page_text}}\n\nMy question: {{question}}\n\nIf the answer isn't in the page content, say \"This page doesn't contain information about that\" rather than making up an answer.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["question", "page", "context", "page_title", "page_url", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Study Notes",
        content: "Convert this content into structured study notes:\n\nSource: {{@page_title}}\n{{@page_text}}\n\nFormat:\n## Key Concepts\n- **[Term]**: [Definition in your own words]\n\n## Important Details\n- [numbered list]\n\n## Connections\n- How this relates to: [broader topic]\n\n## Test Yourself\n3 questions to check understanding (with answers hidden in spoiler format)\n\nDo NOT copy-paste from the source. Rephrase everything in simpler language.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["study", "notes", "education", "page_title", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Critique This Article",
        content: "Critically analyze this article:\n\n{{@page_title}} ({{@page_url}})\n{{@page_text}}\n\nEvaluate:\n1. **Argument Strength**: Are claims supported by evidence?\n2. **Bias Detection**: Any perspective systematically favored/ignored?\n3. **Logic Check**: Any logical fallacies? (name them specifically)\n4. **Missing Context**: What does this article leave out?\n5. **Verdict**: Overall reliability rating (1-10) with justification\n\nDo NOT critique the writing style. Focus on the substance and logic.",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["critique", "analysis", "article", "page_title", "page_url", "page_text", "context grabber ★"]
    },
    {
        title: "📸 Rewrite for Clarity",
        content: "Rewrite this text to be clearer and more concise:\n\n{{@selection}}\n\nRules:\n- Preserve all original meaning and information\n- Cut word count by at least 20%\n- Break long sentences into shorter ones\n- Replace passive voice with active\n- Replace jargon with plain language\n\nShow the rewritten version, then: **Word count**: before → after (X% reduction)",
        category_key: "research_learning",
        output_modality: "text",
        category_type: "system",
        tags: ["rewrite", "clarity", "editing", "selection", "context grabber ★"]
    }
];

export { DEFAULT_PROMPTS };
