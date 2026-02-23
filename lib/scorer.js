/**
 * Scorer library for evaluating prompt quality.
 */
export class PromptScorer {
    /**
     * Calculates a quality score (0-100) for a prompt.
     * @param {string} content - The prompt text.
     * @returns {number} Score from 0 to 100.
     */
    static score(content) {
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
     * Returns a color based on score.
     * @param {number} score 
     */
    static getScoreColor(score) {
        if (score >= 80) return '#10b981'; // Green
        if (score >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    }
}
