/**
 * App Controller Module
 * Manages application state, real-time comparison, and modal interactions
 */
const App = {
  /**
   * Application state
   */
  state: {
    originalText: '',
    revisedText: '',
    diffResult: null,
    displayMode: 'visible',
    debounceTimer: null,
    debounceDelay: 300, // ms to wait after typing stops
    activeModal: null
  },

  /**
   * DOM element references
   */
  elements: {
    originalText: null,
    revisedText: null,
    originalWordCount: null,
    revisedWordCount: null,
    comparisonOutput: null,
    statsBar: null,
    modalOverlay: null,
    modalWindow: null,
    modalTitle: null,
    modalBody: null,
    modalClose: null
  },

  /**
   * Initialize the application
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.updateWordCounts();
  },

  /**
   * Cache DOM element references
   */
  cacheElements() {
    this.elements.originalText = document.getElementById('originalText');
    this.elements.revisedText = document.getElementById('revisedText');
    this.elements.originalWordCount = document.getElementById('originalWordCount');
    this.elements.revisedWordCount = document.getElementById('revisedWordCount');
    this.elements.comparisonOutput = document.getElementById('comparisonOutput');
    this.elements.statsBar = document.getElementById('statsBar');
    this.elements.modalOverlay = document.getElementById('modalOverlay');
    this.elements.modalWindow = document.getElementById('modalWindow');
    this.elements.modalTitle = document.getElementById('modalTitle');
    this.elements.modalBody = document.getElementById('modalBody');
    this.elements.modalClose = document.getElementById('modalClose');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Real-time comparison on input with debouncing
    this.elements.originalText.addEventListener('input', () => {
      this.updateWordCounts();
      this.debouncedCompare();
    });

    this.elements.revisedText.addEventListener('input', () => {
      this.updateWordCounts();
      this.debouncedCompare();
    });

    // Toggle buttons for display mode
    document.querySelectorAll('.comparison-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setDisplayMode(e.target.dataset.mode));
    });

    // Maximize buttons
    document.querySelectorAll('.traffic-light.maximize[data-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        this.openModal(target);
      });
    });

    // Modal close
    this.elements.modalClose.addEventListener('click', () => this.closeModal());

    // Close modal on overlay click
    this.elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.elements.modalOverlay) {
        this.closeModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.activeModal) {
        this.closeModal();
      }
    });
  },

  /**
   * Debounced comparison - waits for typing to stop
   */
  debouncedCompare() {
    // Clear existing timer
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer);
    }

    // Set new timer
    this.state.debounceTimer = setTimeout(() => {
      this.runComparison();
    }, this.state.debounceDelay);
  },

  /**
   * Update word count displays
   */
  updateWordCounts() {
    const original = this.elements.originalText.value;
    const revised = this.elements.revisedText.value;

    const origCount = Tokenizer.countWords(original);
    const revCount = Tokenizer.countWords(revised);

    this.elements.originalWordCount.textContent =
      `${origCount} word${origCount !== 1 ? 's' : ''}`;
    this.elements.revisedWordCount.textContent =
      `${revCount} word${revCount !== 1 ? 's' : ''}`;
  },

  /**
   * Run the comparison
   */
  runComparison() {
    const original = this.elements.originalText.value;
    const revised = this.elements.revisedText.value;

    // Check if both have content
    if (!original.trim() || !revised.trim()) {
      this.state.diffResult = null;
      this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(null, this.state.displayMode);
      this.elements.comparisonOutput.className = `comparison-output diff-${this.state.displayMode}`;
      this.elements.statsBar.innerHTML = '';
      return;
    }

    // Run comparison
    this.state.diffResult = DiffEngine.compare(original, revised);

    // Render results
    this.elements.statsBar.innerHTML = Renderer.renderStats(this.state.diffResult.stats);
    this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(this.state.diffResult, this.state.displayMode);
    this.elements.comparisonOutput.className = `comparison-output diff-${this.state.displayMode}`;
  },

  /**
   * Set display mode (visible/hidden)
   * @param {string} mode - 'visible' or 'hidden'
   */
  setDisplayMode(mode) {
    this.state.displayMode = mode;

    // Update toggle buttons
    document.querySelectorAll('.comparison-toggle .toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Re-render comparison
    if (this.state.diffResult) {
      this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(this.state.diffResult, mode);
      this.elements.comparisonOutput.className = `comparison-output diff-${mode}`;
    }
  },

  /**
   * Open maximize modal
   * @param {string} target - 'original', 'revised', or 'comparison'
   */
  openModal(target) {
    this.state.activeModal = target;

    // Set modal title
    const titles = {
      original: 'Original',
      revised: 'Revised',
      comparison: 'Comparison'
    };
    this.elements.modalTitle.textContent = titles[target] || 'Window';

    // Clone content into modal
    this.elements.modalBody.innerHTML = '';

    if (target === 'original' || target === 'revised') {
      // Create textarea for text panels
      const textarea = document.createElement('textarea');
      textarea.className = 'text-input';
      textarea.spellcheck = false;
      textarea.placeholder = target === 'original'
        ? 'Paste your original text here...'
        : 'Paste your revised text here...';

      // Get current value
      const sourceTextarea = target === 'original'
        ? this.elements.originalText
        : this.elements.revisedText;
      textarea.value = sourceTextarea.value;

      // Sync changes back
      textarea.addEventListener('input', () => {
        sourceTextarea.value = textarea.value;
        sourceTextarea.dispatchEvent(new Event('input'));
      });

      this.elements.modalBody.appendChild(textarea);
    } else if (target === 'comparison') {
      // Clone comparison output
      const outputDiv = document.createElement('div');
      outputDiv.className = this.elements.comparisonOutput.className;
      outputDiv.innerHTML = this.elements.comparisonOutput.innerHTML;
      this.elements.modalBody.appendChild(outputDiv);
    }

    // Show modal with animation
    this.elements.modalOverlay.classList.add('active');
    this.elements.modalWindow.classList.add('animating-in');

    // Remove animation class after completion
    setTimeout(() => {
      this.elements.modalWindow.classList.remove('animating-in');
    }, 400);

    // Focus textarea if applicable
    const textarea = this.elements.modalBody.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      // Move cursor to end
      textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
    }
  },

  /**
   * Close maximize modal
   */
  closeModal() {
    if (!this.state.activeModal) return;

    // Animate out
    this.elements.modalWindow.classList.add('animating-out');

    setTimeout(() => {
      this.elements.modalOverlay.classList.remove('active');
      this.elements.modalWindow.classList.remove('animating-out');
      this.elements.modalBody.innerHTML = '';
      this.state.activeModal = null;
    }, 300);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
