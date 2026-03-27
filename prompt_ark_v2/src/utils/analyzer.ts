/**
 * @fileoverview Analyzer utility for batch processing prompts with LLM.
 * 
 * Strategy: Send ALL prompts in a single API call to minimize request count.
 * Modern LLMs support 128k+ context, so even 200 prompts × 2000 chars fits easily.
 * 
 * @module utils/analyzer
 */

/**
 * Represents a prompt item to be analyzed
 */
export interface AnalyzePromptItem {
  /** Unique identifier for the prompt */
  id: string;
  /** The prompt content to analyze */
  prompt: string;
}

/**
 * Represents the result of analyzing a single prompt
 */
export interface AnalyzeResult {
  /** Unique identifier matching the input prompt */
  id: string;
  /** Concise title, max 5 words, in the same language as the prompt */
  title: string;
  /** Short descriptive category, in the same language as the prompt */
  category: string;
  /** 1-3 short keywords for search, in the same language as the prompt */
  tags: string[];
  /** Quality score from 0-100 based on clarity/structure/usefulness */
  score: number;
}

/**
 * Type for progress callback function
 */
export type ProgressCallback = (completed: number, total: number) => void;

/**
 * Response from the GENERATE_TEXT runtime message
 */
interface GenerateTextResponse {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * ContentAnalyzer class for batch processing prompts with AI.
 * Uses the extension's background LLM service to analyze multiple prompts
 * in a single API call to minimize rate limiting issues.
 * 
 * @example
 * ```typescript
 * const analyzer = new ContentAnalyzer();
 * const prompts = [
 *   { id: '1', prompt: 'Write a poem about nature' },
 *   { id: '2', prompt: 'Explain quantum physics' }
 * ];
 * const results = await analyzer.analyzeBatch(prompts, (done, total) => {
 *   console.log(`Progress: ${done}/${total}`);
 * });
 * ```
 */
export class ContentAnalyzer {
  /** Maximum number of retry attempts */
  readonly maxRetries: number;
  
  /** Base delay between retries in milliseconds */
  readonly retryDelayMs: number;

  /**
   * Creates a new ContentAnalyzer instance.
   */
  constructor() {
    this.maxRetries = 3;
    this.retryDelayMs = 3000;
  }

  /**
   * Analyze prompts using the extension's background LLM service.
   * Sends all prompts in a single API call to avoid rate limits.
   * 
   * @param prompts - Array of prompt items to analyze
   * @param onProgress - Callback for progress updates (completed, total)
   * @returns Promise resolving to array of analysis results
   * @throws Never throws - returns partial results or empty scores on failure
   * 
   * @example
   * ```typescript
   * const analyzer = new ContentAnalyzer();
   * const results = await analyzer.analyzeBatch(
   *   [{ id: '1', prompt: 'Hello world' }],
   *   (done, total) => console.log(`${done}/${total}`)
   * );
   * // Results: [{ id: '1', title: '...', category: '...', tags: [...], score: 85 }]
   * ```
   */
  async analyzeBatch(
    prompts: AnalyzePromptItem[],
    onProgress: ProgressCallback
  ): Promise<AnalyzeResult[]> {
    if (!prompts || prompts.length === 0) {
      return [];
    }

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
        const response = await browser.runtime.sendMessage<{
          type: 'GENERATE_TEXT';
          prompt: string;
        }, GenerateTextResponse>({
          type: 'GENERATE_TEXT',
          prompt: userPrompt
        });

        if (response && response.success && response.text) {
          const cleanJson = response.text.replace(/```json|```/g, '').trim();
          const results = JSON.parse(cleanJson) as AnalyzeResult[];

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
          await this.delay(backoff);
          continue;
        }

        console.warn(`[Prompt Ark] AI call failed:`, response?.error || 'no text');
        break;

      } catch (e) {
        console.error('[Prompt Ark] Analysis error:', e);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs);
          continue;
        }
        break;
      }
    }

    onProgress(prompts.length, prompts.length);
    // Return fallback results with zero scores
    return prompts.map(p => ({ 
      id: p.id, 
      title: '',
      category: '',
      tags: [],
      score: 0 
    }));
  }

  /**
   * Helper method to create a delay promise.
   * @param ms - Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
