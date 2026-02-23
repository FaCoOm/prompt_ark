/**
 * Analyzer library for batch processing prompts with LLM.
 * Strategy: Send ALL prompts in a single API call to minimize request count.
 * Modern LLMs support 128k+ context, so even 200 prompts × 2000 chars fits easily.
 */
export class ContentAnalyzer {
    constructor() {
        this.maxRetries = 3;
        this.retryDelayMs = 3000;
    }

    /**
     * Analyze prompts using the extension's background LLM service.
     * Sends all prompts in a single API call to avoid rate limits.
     * @param {Array<{id: string, prompt: string}>} prompts 
     * @param {function} onProgress - Callback for updates
     * @returns {Promise<Array<{id: string, title: string, category: string, tags: string[], score: number}>>}
     */
    async analyzeBatch(prompts, onProgress) {
        if (!prompts || prompts.length === 0) return [];

        onProgress(0, prompts.length);

        const promptData = prompts.map(p => ({
            id: p.id,
            content: (p.prompt || '').substring(0, 2000)
        }));

        const userPrompt = `Analyze each prompt below. Return a JSON array where each item has: {id, title (concise, max 5 words), category (a short descriptive category), tags (1-3 short keywords for search, array of strings), score (0-100, quality based on clarity/structure/usefulness)}.
IMPORTANT: title, category and tags MUST be in the SAME language as the prompt content. For example, Chinese prompts get Chinese title, category and tags, English prompts get English ones.
Input: ${JSON.stringify(promptData)}
Return ONLY a valid JSON array, no markdown fences.`;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            console.log(`[Prompt Ark] Analyzing ${prompts.length} prompts in single call, attempt ${attempt}/${this.maxRetries}`);

            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'GENERATE_TEXT',
                    prompt: userPrompt
                });

                if (response && response.success && response.text) {
                    const cleanJson = response.text.replace(/```json|```/g, '').trim();
                    const results = JSON.parse(cleanJson);

                    if (Array.isArray(results)) {
                        console.log(`[Prompt Ark] AI returned ${results.length} results, sample:`, results[0]);
                        onProgress(prompts.length, prompts.length);
                        return results;
                    }
                }

                // Check for rate limit (429)
                const isRateLimit = response?.error?.includes('429') || response?.error?.includes('rate');
                if (isRateLimit && attempt < this.maxRetries) {
                    const backoff = this.retryDelayMs * Math.pow(2, attempt - 1);
                    console.warn(`[Prompt Ark] Rate limited, retrying in ${backoff}ms...`);
                    onProgress(0, prompts.length);
                    await new Promise(r => setTimeout(r, backoff));
                    continue;
                }

                console.warn(`[Prompt Ark] AI call failed:`, response?.error || 'no text');
                break;

            } catch (e) {
                console.error('[Prompt Ark] Analysis error:', e);
                if (attempt < this.maxRetries) {
                    await new Promise(r => setTimeout(r, this.retryDelayMs));
                    continue;
                }
                break;
            }
        }

        onProgress(prompts.length, prompts.length);
        return prompts.map(p => ({ id: p.id, score: 0 }));
    }
}
