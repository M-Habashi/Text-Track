/**
 * Diff Engine Module
 * Implements Myers diff algorithm with paragraph alignment and move detection
 */
const DiffEngine = {
  /**
   * Myers diff algorithm - finds shortest edit script
   * @param {Array} oldTokens - Original word tokens
   * @param {Array} newTokens - Revised word tokens
   * @returns {Array} Array of diff operations
   */
  myersDiff(oldTokens, newTokens) {
    const N = oldTokens.length;
    const M = newTokens.length;
    const MAX = N + M;

    if (MAX === 0) return [];

    const V = new Map();
    V.set(1, 0);
    const trace = [];

    // Forward phase
    outer:
    for (let D = 0; D <= MAX; D++) {
      trace.push(new Map(V));

      for (let k = -D; k <= D; k += 2) {
        let x;

        if (k === -D || (k !== D && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
          x = V.get(k + 1) || 0;
        } else {
          x = (V.get(k - 1) || 0) + 1;
        }

        let y = x - k;

        while (x < N && y < M && oldTokens[x].text === newTokens[y].text) {
          x++;
          y++;
        }

        V.set(k, x);

        if (x >= N && y >= M) {
          break outer;
        }
      }
    }

    return this.backtrack(trace, oldTokens, newTokens);
  },

  /**
   * Backtrack through trace to build operations
   * @param {Array} trace - Trace from forward phase
   * @param {Array} oldTokens - Original tokens
   * @param {Array} newTokens - Revised tokens
   * @returns {Array} Diff operations
   */
  backtrack(trace, oldTokens, newTokens) {
    const operations = [];
    let x = oldTokens.length;
    let y = newTokens.length;

    for (let d = trace.length - 1; d >= 0; d--) {
      const V = trace[d];
      const k = x - y;

      let prevK;
      if (k === -d || (k !== d && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = V.get(prevK) || 0;
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        x--;
        y--;
        operations.unshift({
          type: 'equal',
          word: oldTokens[x]
        });
      }

      if (d > 0) {
        if (x === prevX) {
          y--;
          operations.unshift({
            type: 'insert',
            word: newTokens[y]
          });
        } else {
          x--;
          operations.unshift({
            type: 'delete',
            word: oldTokens[x]
          });
        }
      }
    }

    return operations;
  },

  /**
   * Detect moved paragraphs by comparing fingerprints
   * @param {string[]} originalParas - Original paragraphs
   * @param {string[]} revisedParas - Revised paragraphs
   * @returns {Array} Array of move objects
   */
  detectMovedParagraphs(originalParas, revisedParas) {
    const originalFP = originalParas.map((p, i) => ({
      text: p,
      fingerprint: Tokenizer.fingerprint(p),
      index: i
    }));

    const revisedFP = revisedParas.map((p, i) => ({
      text: p,
      fingerprint: Tokenizer.fingerprint(p),
      index: i
    }));

    const moves = [];
    const matchedOriginal = new Set();
    const matchedRevised = new Set();

    // Find exact matches at different positions
    for (const orig of originalFP) {
      for (const rev of revisedFP) {
        if (orig.fingerprint === rev.fingerprint &&
            orig.index !== rev.index &&
            !matchedOriginal.has(orig.index) &&
            !matchedRevised.has(rev.index)) {
          moves.push({
            fromIndex: orig.index,
            toIndex: rev.index,
            fingerprint: orig.fingerprint,
            text: orig.text
          });
          matchedOriginal.add(orig.index);
          matchedRevised.add(rev.index);
        }
      }
    }

    return moves;
  },

  /**
   * Align paragraphs using LCS with move detection
   * @param {string[]} originalParas - Original paragraphs
   * @param {string[]} revisedParas - Revised paragraphs
   * @param {Array} moves - Detected moves
   * @returns {Array} Paragraph alignments
   */
  alignParagraphs(originalParas, revisedParas, moves) {
    const alignments = [];
    const movedFromIndices = new Set(moves.map(m => m.fromIndex));
    const movedToIndices = new Set(moves.map(m => m.toIndex));
    const moveMap = new Map(moves.map(m => [m.toIndex, m]));

    let origIdx = 0;
    let revIdx = 0;

    while (origIdx < originalParas.length || revIdx < revisedParas.length) {
      // Check if current revised paragraph is moved
      if (revIdx < revisedParas.length && movedToIndices.has(revIdx)) {
        const move = moveMap.get(revIdx);
        alignments.push({
          type: 'moved',
          original: move.text,
          revised: revisedParas[revIdx],
          originalIndex: move.fromIndex,
          revisedIndex: revIdx,
          movedFrom: move.fromIndex,
          movedTo: revIdx
        });
        revIdx++;
        continue;
      }

      // Skip moved original paragraphs
      if (origIdx < originalParas.length && movedFromIndices.has(origIdx)) {
        origIdx++;
        continue;
      }

      // Compare paragraphs
      if (origIdx < originalParas.length && revIdx < revisedParas.length) {
        const origFP = Tokenizer.fingerprint(originalParas[origIdx]);
        const revFP = Tokenizer.fingerprint(revisedParas[revIdx]);

        if (origFP === revFP) {
          // Unchanged
          alignments.push({
            type: 'unchanged',
            original: originalParas[origIdx],
            revised: revisedParas[revIdx],
            originalIndex: origIdx,
            revisedIndex: revIdx
          });
          origIdx++;
          revIdx++;
        } else {
          const similarity = this.paragraphSimilarity(originalParas[origIdx], revisedParas[revIdx]);

          if (similarity > 0.3) {
            alignments.push({
              type: 'modified',
              original: originalParas[origIdx],
              revised: revisedParas[revIdx],
              originalIndex: origIdx,
              revisedIndex: revIdx
            });
            origIdx++;
            revIdx++;
          } else {
            const nextOrigSim = origIdx + 1 < originalParas.length ?
              this.paragraphSimilarity(originalParas[origIdx + 1], revisedParas[revIdx]) : 0;
            const nextRevSim = revIdx + 1 < revisedParas.length ?
              this.paragraphSimilarity(originalParas[origIdx], revisedParas[revIdx + 1]) : 0;

            if (nextOrigSim > nextRevSim && nextOrigSim > 0.3) {
              alignments.push({
                type: 'deleted',
                original: originalParas[origIdx],
                revised: null,
                originalIndex: origIdx,
                revisedIndex: null
              });
              origIdx++;
            } else if (nextRevSim > 0.3) {
              alignments.push({
                type: 'added',
                original: null,
                revised: revisedParas[revIdx],
                originalIndex: null,
                revisedIndex: revIdx
              });
              revIdx++;
            } else {
              alignments.push({
                type: 'modified',
                original: originalParas[origIdx],
                revised: revisedParas[revIdx],
                originalIndex: origIdx,
                revisedIndex: revIdx
              });
              origIdx++;
              revIdx++;
            }
          }
        }
      } else if (origIdx < originalParas.length) {
        if (!movedFromIndices.has(origIdx)) {
          alignments.push({
            type: 'deleted',
            original: originalParas[origIdx],
            revised: null,
            originalIndex: origIdx,
            revisedIndex: null
          });
        }
        origIdx++;
      } else if (revIdx < revisedParas.length) {
        if (!movedToIndices.has(revIdx)) {
          alignments.push({
            type: 'added',
            original: null,
            revised: revisedParas[revIdx],
            originalIndex: null,
            revisedIndex: revIdx
          });
        }
        revIdx++;
      }
    }

    return alignments;
  },

  /**
   * Calculate Jaccard similarity between paragraphs
   * @param {string} para1 - First paragraph
   * @param {string} para2 - Second paragraph
   * @returns {number} Similarity score 0-1
   */
  paragraphSimilarity(para1, para2) {
    const words1 = new Set(para1.toLowerCase().split(/\s+/));
    const words2 = new Set(para2.toLowerCase().split(/\s+/));

    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }

    const union = words1.size + words2.size - intersection;
    return union > 0 ? intersection / union : 0;
  },

  /**
   * Main comparison function
   * @param {string} originalText - Original text
   * @param {string} revisedText - Revised text
   * @returns {Object} Diff result with paragraphs and stats
   */
  compare(originalText, revisedText) {
    const originalParas = Tokenizer.splitParagraphs(originalText);
    const revisedParas = Tokenizer.splitParagraphs(revisedText);

    // Detect moved paragraphs
    const moves = this.detectMovedParagraphs(originalParas, revisedParas);

    // Align paragraphs
    const alignments = this.alignParagraphs(originalParas, revisedParas, moves);

    // Process each alignment with word-level diff
    const paragraphResults = [];

    for (const alignment of alignments) {
      const result = {
        type: alignment.type,
        originalIndex: alignment.originalIndex,
        revisedIndex: alignment.revisedIndex,
        operations: [],
        movedFrom: alignment.movedFrom || null,
        movedTo: alignment.movedTo || null
      };

      if (alignment.type === 'modified' || alignment.type === 'moved' || alignment.type === 'unchanged') {
        const oldTokens = Tokenizer.tokenizeWords(alignment.original || '');
        const newTokens = Tokenizer.tokenizeWords(alignment.revised || '');
        result.operations = this.myersDiff(oldTokens, newTokens);
      } else if (alignment.type === 'added') {
        const newTokens = Tokenizer.tokenizeWords(alignment.revised);
        result.operations = newTokens.map(w => ({ type: 'insert', word: w }));
      } else if (alignment.type === 'deleted') {
        const oldTokens = Tokenizer.tokenizeWords(alignment.original);
        result.operations = oldTokens.map(w => ({ type: 'delete', word: w }));
      }

      paragraphResults.push(result);
    }

    return {
      paragraphs: paragraphResults,
      stats: this.calculateStats(paragraphResults)
    };
  },

  /**
   * Calculate statistics from diff result
   * @param {Array} paragraphs - Diff paragraphs
   * @returns {Object} Statistics object
   */
  calculateStats(paragraphs) {
    let wordsAdded = 0, wordsDeleted = 0, wordsUnchanged = 0;
    let paragraphsMoved = 0;

    for (const para of paragraphs) {
      if (para.movedFrom !== null || para.movedTo !== null) paragraphsMoved++;

      for (const op of para.operations) {
        if (op.type === 'insert') wordsAdded++;
        else if (op.type === 'delete') wordsDeleted++;
        else wordsUnchanged++;
      }
    }

    return {
      wordsOriginal: wordsDeleted + wordsUnchanged,
      wordsRevised: wordsAdded + wordsUnchanged,
      wordsAdded,
      wordsDeleted,
      wordsUnchanged,
      paragraphsMoved
    };
  }
};

// Export for use in other modules
window.DiffEngine = DiffEngine;
