/**
 * @fileoverview Scorer utility for evaluating prompt quality.
 * 
 * Provides algorithms to calculate quality scores based on prompt structure,
 * variable usage, formatting, and common patterns.
 * 
 * @module utils/scorer
 */

/**
 * PromptScorer class for evaluating prompt quality.
 * Uses static methods for score calculation and color mapping.
 * 
 * @example
 * ```typescript
 * const score = PromptScorer.score('Act as a helpful assistant...');
 * const color = PromptScorer.getScoreColor(score);
 * console.log(`Quality: ${score}/100`);
 * ```
 */
export class PromptScorer {
  /**
   * Calculates a quality score (0-100) for a prompt.
   * 
   * Scoring criteria:
   * - Base score: 50
   * - Length heuristics: too short (-30), sweet spot (+10), too long (-5)
   * - Variable detection: dynamic prompts with {{vars}} (+15), legacy [] placeholders (+5)
   * - Role/context definition: "act as", "you are a", "role" (+15)
   * - Structure & formatting: markdown headers/italics (+10), lists (+5)
   * - Negative patterns: todo/fixme (-20), lorem ipsum (-50)
   * 
   * @param content - The prompt text to evaluate
   * @returns Score from 0 to 100
   * 
   * @example
   * ```typescript
   * PromptScorer.score('Hello'); // 20 (too short)
   * PromptScorer.score('Act as a {{role}}. Help me with {{task}}.'); // 80
   * PromptScorer.score('Lorem ipsum...'); // 0 (negative pattern)
   * ```
   */
  static score(content: string): number {
    if (!content || typeof content !== 'string') return 0;

    let score = 50; // Base score
    const text = content.trim();

    // 1. Length Heuristics
    if (text.length < 20) score -= 30; // Too short
    else if (text.length > 100 && text.length < 1500) score += 10; // Sweet spot
    else if (text.length > 3000) score -= 5; // Too long (maybe just raw data)

    // 2. Variable Detection (Dynamic prompts are better)
    if (text.includes('{{') && text.includes('}}')) score += 15;
    if (text.includes('[') && text.includes(']')) score += 5; // Alternative placeholders

    // 3. Role/Context Definition
    const lower = text.toLowerCase();
    if (lower.startsWith('act as') || lower.includes('you are a') || lower.split('\n')[0].includes('role')) {
      score += 15;
    }

    // 4. Structure & Formatting
    if (text.includes('###') || text.includes('**')) score += 10; // Markdown usage
    if (text.includes('\n- ') || text.includes('\n1. ')) score += 5; // Lists

    // 5. Negative Patterns
    if (lower.includes('todo') || lower.includes('fixme')) score -= 20;
    if (lower.includes('lorem ipsum')) score -= 50;

    // Clamp
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Returns a color based on score for UI display.
   * 
   * Color thresholds:
   * - Green (#10b981): Score >= 80 (excellent quality)
   * - Amber (#f59e0b): Score >= 50 (acceptable quality)
   * - Red (#ef4444): Score < 50 (needs improvement)
   * 
   * @param score - The quality score (0-100)
   * @returns Hex color string
   * 
   * @example
   * ```typescript
   * PromptScorer.getScoreColor(90); // '#10b981' (green)
   * PromptScorer.getScoreColor(65); // '#f59e0b' (amber)
   * PromptScorer.getScoreColor(30); // '#ef4444' (red)
   * ```
   */
  static getScoreColor(score: number): string {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  }
}
