/**
 * Renderer Module
 * Handles HTML rendering for diff output, statistics, and legend
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
    if (!diffResult || diffResult.paragraphs.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">&#8644;</div>
          <p>Enter text in both panels to see comparison</p>
        </div>
      `;
    }

    // Check if there are any changes
    const hasChanges = diffResult.paragraphs.some(para =>
      para.operations.some(op => op.type !== 'equal') ||
      para.movedFrom !== null
    );

    if (!hasChanges) {
      return '<div class="no-changes">No changes detected — texts are identical</div>';
    }

    let html = '';

    for (const para of diffResult.paragraphs) {
      let paraClass = 'diff-paragraph';
      let movedIndicator = '';

      // Create clearer moved paragraph indicator
      if (para.movedFrom !== null) {
        paraClass += ' paragraph-moved';
        movedIndicator = `
          <span class="moved-indicator">
            <span class="moved-indicator-icon"></span>
            Moved paragraph — was at position ${para.movedFrom + 1}
          </span>
        `;
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
   * Render legend with stats
   * @param {Object} stats - Statistics from DiffEngine
   * @returns {string} HTML string
   */
  renderLegend(stats) {
    if (!stats) {
      // Default legend without stats
      return `
        <div class="legend-item">
          <span class="legend-deleted">removed</span>
        </div>
        <div class="legend-item">
          <span class="legend-inserted">added</span>
        </div>
        <div class="legend-item">
          <span class="legend-moved">moved</span>
        </div>
      `;
    }

    let html = '';

    // Removed
    html += `
      <div class="legend-item">
        <span class="legend-stat stat-deleted">-${stats.wordsDeleted}</span>
        <span class="legend-deleted">Removed</span>
      </div>
    `;

    // Added
    html += `
      <div class="legend-item">
        <span class="legend-stat stat-inserted">+${stats.wordsAdded}</span>
        <span class="legend-inserted">Added</span>
      </div>
    `;

    // Moved paragraphs (only show if there are any)
    if (stats.paragraphsMoved > 0) {
      html += `
        <div class="legend-item">
          <span class="legend-stat stat-moved">${stats.paragraphsMoved}</span>
          <span class="legend-moved">Moved paragraphs</span>
        </div>
      `;
    }

    return html;
  }
};

// Export for use in other modules
window.Renderer = Renderer;
