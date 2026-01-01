/**
 * Tokenizer Module
 * Handles text parsing: paragraphs, words, fingerprinting
 */
const Tokenizer = {
  /**
   * Split text into paragraphs (double newline separator)
   * @param {string} text - Input text
   * @returns {string[]} Array of paragraph strings
   */
  splitParagraphs(text) {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  },

  /**
   * Tokenize paragraph into words with trailing whitespace
   * @param {string} paragraph - Paragraph text
   * @returns {Array<{text: string, index: number, trailingSpace: string}>}
   */
  tokenizeWords(paragraph) {
    const tokens = [];
    const regex = /(\S+)(\s*)/gu;
    let match;
    let index = 0;

    while ((match = regex.exec(paragraph)) !== null) {
      tokens.push({
        text: match[1],
        index: index++,
        trailingSpace: match[2] || ' '
      });
    }
    return tokens;
  },

  /**
   * Create fingerprint hash for paragraph (for move detection)
   * Uses djb2 hash algorithm on normalized text
   * @param {string} text - Paragraph text
   * @returns {number} Hash value
   */
  fingerprint(text) {
    const normalized = text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    // djb2 hash
    let hash = 5381;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) + hash) + normalized.charCodeAt(i);
    }
    return hash >>> 0;
  },

  /**
   * Count words in text
   * @param {string} text - Input text
   * @returns {number} Word count
   */
  countWords(text) {
    if (!text.trim()) return 0;
    // Only count tokens that contain at least one letter or number
    return text.trim().split(/\s+/).filter(token => /[\p{L}\p{N}]/u.test(token)).length;
  }
};

// Export for use in other modules
window.Tokenizer = Tokenizer;
