export interface TextAnalysisResult {
  wordCount: number;
  charCount: number;
  lineCount: number;
  estimatedTokens: number;
  language: string;
}

export class TextAnalyzer {
  static analyze(text: string): TextAnalysisResult {
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const charCount = text.length;
    const lineCount = text.split(/\r?\n/).length;
    const estimatedTokens = Math.ceil(charCount / 4);

    return {
      wordCount,
      charCount,
      lineCount,
      estimatedTokens,
      language: this.detectLanguage(text),
    };
  }

  static detectLanguage(text: string): string {
    const charCode = text.charCodeAt(0);

    if (charCode >= 0x4e00 && charCode <= 0x9fff) {
      return 'zh';
    }
    if (charCode >= 0x3040 && charCode <= 0x309f) {
      return 'ja';
    }
    if (charCode >= 0xac00 && charCode <= 0xd7af) {
      return 'ko';
    }

    return 'en';
  }

  static truncate(text: string, maxLength: number, suffix = '...'): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  static extractKeywords(text: string, maxKeywords = 5): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }
}
