---
description: "Rules for the prompt optimization engine (OPTIMIZE_SYSTEM_PROMPT, Smart Convert, and prompt enhancement features)."
globs: ["background.js", "popup.js", "popup.html"]
---

# Prompt Optimization Engine Rules

These rules govern how Prompt Ark's AI-powered features (Optimize, Smart Convert, AI Enrichment) design and modify prompts.

## OPTIMIZE_SYSTEM_PROMPT Design

The `OPTIMIZE_SYSTEM_PROMPT` constant in `background.js` drives the 3-Variant optimization. When modifying it:

### Variant Guidelines (2026 Best Practices)
- **Variant 1 (Concise Declarative)**: Strip to essential instruction. Rewrite in declarative style — describe the desired output, not the reasoning process. Remove all CoT scaffolding, verbose instructions, and meta-commentary.
- **Variant 2 (Contract-Enhanced)**: Add an Output Contract section: output format, length constraint, required sections, exclusion list. Use the GOLDEN framework (Goal, Output, Limits, Data, Evaluation, Negatives).
- **Variant 3 (Full-Spec)**: Add structured constraints (XML/Markdown delimiters separating instructions from data), confidence calibration requests, and self-evaluation criteria. Do **NOT** add "thinking scaffolds" or CoT instructions — these harm reasoning models.

### Universal Principles
- **Preserve `{{variable}}` placeholders** exactly as-is in all variants.
- **Keep original language** — Chinese input → Chinese output, English → English.
- **Front-load core instruction** — models weight early tokens most.
- **Never inject CoT for reasoning models**: "Let's think step by step", "First...then...finally..." scaffolds interfere with o1/o3/R1/Gemini Thinking's internal reasoning.
- **Concrete criteria over vague wishes**: Replace "make it better" with measurable output specs.

## Smart Convert (`smartConvertWithAI`)

When converting raw text/notes to prompts:
- The system prompt should produce a **declarative prompt** — describing the desired output, not instructing a thinking process.
- Auto-inject an Output Contract (format + constraints) when the source text lacks explicit output requirements.
- Do NOT inject CoT-style scaffolding ("First analyze X, then...") — the user's target model may be a reasoning model.
- Preserve the user's domain context and intent. Don't over-generalize.

## AI Enrichment (`asyncEnrichPrompt`)

When generating title/category/tags for a saved prompt:
- Use minimal system instructions — this is a classification task, not a creative task.
- Prefer structured JSON output with hard-constrained enum values for `category`.
- Batch multiple prompts in a single API call when possible (see LLM Batch Strategy in global rules).

## Model-Aware Strategy (Future)

When the user's configured model is known:
- **Reasoning models** (o1, o3, DeepSeek-R1, Gemini Thinking): Pure declarative + Output Contract. No CoT injection. No few-shot for reasoning guidance.
- **Standard models** (GPT-4o, Claude Sonnet, Gemini Flash): May include lightweight CoT if the task is multi-step. Output Contract remains primary.
- **Fast/mini models** (GPT-4o-mini, Flash Lite): Ultra-concise declarative. Strict length constraints to minimize token waste.

## UI Principles for Prompt Enhancement

When building UI features to help users write better prompts (e.g., adding constraints or styles):
- **Prefer Structured Builders over Rigid Menus**: Do not use "blind" 6-option dropdowns with hardcoded text. Instead, use interactive forms (e.g., Output Contract Builder) where users can pick parameterized values (e.g., "Max words: [INPUT]", "Format: [Markdown/JSON]", "Tone: [Professional/Creative]").
- **Avoid Overlap with AI Optimize**: If the AI 'Optimize' feature (Variant 2) already intelligently infers and injects context-aware constraints, manual UI tools should focus on *precise, user-driven overrides* rather than generic guessing.
- **Speak the User's Language**: Avoid prompt engineering jargon ("Confidence Tags", "Few-Shot") in the UI. Translate these into user-centric outcomes ("Highlight unverified info", "Add examples").
