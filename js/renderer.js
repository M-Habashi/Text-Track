/**
 * Renderer Module
 * Handles HTML rendering for diff output and statistics
 */
const Renderer = {
  /**
   * Escape HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Render diff result to HTML
   * @param {Object} diffResult - Diff result from DiffEngine
   * @param {string} mode - Display mode: 'visible' or 'hidden'
   * @returns {string} HTML string
   */
  renderDiff(diffResult, mode = 'visible') {
    if (diffResult.paragraphs.length === 0) {
      return '<div class="no-changes">No text to compare</div>';
    }

    // Check if there are any changes
    const hasChanges = diffResult.paragraphs.some(para =>
      para.operations.some(op => op.type !== 'equal') ||
      para.movedFrom !== null
    );

    if (!hasChanges) {
      return '<div class="no-changes">No changes detected - texts are identical</div>';
    }

    let html = '';

    for (const para of diffResult.paragraphs) {
      let paraClass = 'diff-paragraph';
      let movedIndicator = '';

      if (para.movedFrom !== null) {
        paraClass += ' paragraph-moved';
        movedIndicator = `<span class="moved-indicator">Moved from position ${para.movedFrom + 1}</span>`;
      }

      let content = movedIndicator;

      // Track consecutive deletions for hidden mode
      let pendingDeletions = 0;

      for (const op of para.operations) {
        if (mode === 'hidden' && op.type === 'delete') {
          pendingDeletions++;
          continue;
        }

        // Add deletion marker if we have pending deletions
        if (mode === 'hidden' && pendingDeletions > 0) {
          content += '<span class="deletion-marker" aria-label="Text was removed here"></span>';
          pendingDeletions = 0;
        }

        const escapedText = this.escapeHtml(op.word.text);
        const space = this.escapeHtml(op.word.trailingSpace);

        if (op.type === 'insert') {
          content += `<span class="word-inserted">${escapedText}</span>${space}`;
        } else if (op.type === 'delete') {
          content += `<span class="word-deleted">${escapedText}</span>${space}`;
        } else {
          content += `<span class="word-equal">${escapedText}</span>${space}`;
        }
      }

      // Handle trailing deletions
      if (mode === 'hidden' && pendingDeletions > 0) {
        content += '<span class="deletion-marker" aria-label="Text was removed here"></span>';
      }

      html += `<p class="${paraClass}">${content}</p>`;
    }

    return html;
  },

  /**
   * Render statistics grid
   * @param {Object} stats - Statistics from DiffEngine
   * @returns {string} HTML string
   */
  renderStats(stats) {
    let html = '<div class="stats-grid">';

    html += `
      <div class="stat-item">
        <span class="stat-value">${stats.wordsOriginal}</span>
        <span class="stat-label">Original</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${stats.wordsRevised}</span>
        <span class="stat-label">Revised</span>
      </div>
      <div class="stat-item stat-deleted">
        <span class="stat-value">-${stats.wordsDeleted}</span>
        <span class="stat-label">Removed</span>
      </div>
      <div class="stat-item stat-inserted">
        <span class="stat-value">+${stats.wordsAdded}</span>
        <span class="stat-label">Added</span>
      </div>
    `;

    if (stats.paragraphsMoved > 0) {
      html += `
        <div class="stat-item stat-moved">
          <span class="stat-value">${stats.paragraphsMoved}</span>
          <span class="stat-label">Moved</span>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }
};

// Export for use in other modules
window.Renderer = Renderer;
