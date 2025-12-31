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
    debounceDelay: 300,
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
    comparisonFooter: null,
    modalOverlay: null,
    modalWindow: null,
    modalTitle: null,
    modalBody: null,
    modalClose: null,
    modalWordCount: null,
    modalToggle: null,
    modalFooter: null
  },

  /**
   * Initialize the application
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.updateWordCounts();
    this.renderDefaultLegend();
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
    this.elements.comparisonFooter = document.getElementById('comparisonFooter');
    this.elements.modalOverlay = document.getElementById('modalOverlay');
    this.elements.modalWindow = document.getElementById('modalWindow');
    this.elements.modalTitle = document.getElementById('modalTitle');
    this.elements.modalBody = document.getElementById('modalBody');
    this.elements.modalClose = document.getElementById('modalClose');
    this.elements.modalWordCount = document.getElementById('modalWordCount');
    this.elements.modalToggle = document.getElementById('modalToggle');
    this.elements.modalFooter = document.getElementById('modalFooter');
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

    // Toggle buttons for display mode (main window)
    document.querySelectorAll('#comparisonWindow .comparison-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setDisplayMode(e.target.dataset.mode));
    });

    // Toggle buttons for display mode (modal)
    this.elements.modalToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setDisplayMode(e.target.dataset.mode, true));
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
   * Render default legend (without stats)
   */
  renderDefaultLegend() {
    this.elements.comparisonFooter.innerHTML = Renderer.renderLegend(null);
  },

  /**
   * Debounced comparison - waits for typing to stop
   */
  debouncedCompare() {
    if (this.state.debounceTimer) {
      clearTimeout(this.state.debounceTimer);
    }

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

    // Update modal word count if open
    if (this.state.activeModal === 'original') {
      this.elements.modalWordCount.textContent = `${origCount} word${origCount !== 1 ? 's' : ''}`;
    } else if (this.state.activeModal === 'revised') {
      this.elements.modalWordCount.textContent = `${revCount} word${revCount !== 1 ? 's' : ''}`;
    }
  },

  /**
   * Run the comparison
   */
  runComparison() {
    const original = this.elements.originalText.value;
    const revised = this.elements.revisedText.value;

    if (!original.trim() || !revised.trim()) {
      this.state.diffResult = null;
      this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(null, this.state.displayMode);
      this.elements.comparisonOutput.className = `comparison-output diff-${this.state.displayMode}`;
      this.elements.comparisonFooter.innerHTML = Renderer.renderLegend(null);

      // Update modal if comparison is open
      if (this.state.activeModal === 'comparison') {
        this.updateModalComparison();
      }
      return;
    }

    this.state.diffResult = DiffEngine.compare(original, revised);

    // Render main window
    this.elements.comparisonFooter.innerHTML = Renderer.renderLegend(this.state.diffResult.stats);
    this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(this.state.diffResult, this.state.displayMode);
    this.elements.comparisonOutput.className = `comparison-output diff-${this.state.displayMode}`;

    // Update modal if comparison is open
    if (this.state.activeModal === 'comparison') {
      this.updateModalComparison();
    }
  },

  /**
   * Update modal comparison content
   */
  updateModalComparison() {
    const outputDiv = this.elements.modalBody.querySelector('.comparison-output');
    if (outputDiv) {
      outputDiv.innerHTML = Renderer.renderDiff(this.state.diffResult, this.state.displayMode);
      outputDiv.className = `comparison-output diff-${this.state.displayMode}`;
    }

    // Update footer stats
    if (this.state.diffResult) {
      this.elements.modalFooter.innerHTML = Renderer.renderLegend(this.state.diffResult.stats);
    } else {
      this.elements.modalFooter.innerHTML = Renderer.renderLegend(null);
    }
  },

  /**
   * Set display mode (visible/hidden)
   * @param {string} mode - 'visible' or 'hidden'
   * @param {boolean} fromModal - Whether called from modal toggle
   */
  setDisplayMode(mode, fromModal = false) {
    this.state.displayMode = mode;

    // Update main window toggle buttons
    document.querySelectorAll('#comparisonWindow .comparison-toggle .toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update modal toggle buttons
    this.elements.modalToggle.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Re-render main comparison
    if (this.state.diffResult) {
      this.elements.comparisonOutput.innerHTML = Renderer.renderDiff(this.state.diffResult, mode);
      this.elements.comparisonOutput.className = `comparison-output diff-${mode}`;
    }

    // Re-render modal comparison if open
    if (this.state.activeModal === 'comparison') {
      this.updateModalComparison();
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

    // Reset header elements visibility
    this.elements.modalWordCount.style.display = 'none';
    this.elements.modalToggle.style.display = 'none';
    this.elements.modalFooter.style.display = 'none';

    // Clear modal body
    this.elements.modalBody.innerHTML = '';

    if (target === 'original' || target === 'revised') {
      // Show word count
      this.elements.modalWordCount.style.display = '';
      const sourceTextarea = target === 'original'
        ? this.elements.originalText
        : this.elements.revisedText;
      const count = Tokenizer.countWords(sourceTextarea.value);
      this.elements.modalWordCount.textContent = `${count} word${count !== 1 ? 's' : ''}`;

      // Create textarea
      const textarea = document.createElement('textarea');
      textarea.className = 'text-input';
      textarea.spellcheck = false;
      textarea.placeholder = target === 'original'
        ? 'Paste your original text here...'
        : 'Paste your revised text here...';
      textarea.value = sourceTextarea.value;

      // Sync changes back and update word count
      textarea.addEventListener('input', () => {
        sourceTextarea.value = textarea.value;
        sourceTextarea.dispatchEvent(new Event('input'));
      });

      this.elements.modalBody.appendChild(textarea);

    } else if (target === 'comparison') {
      // Show toggle and footer
      this.elements.modalToggle.style.display = '';
      this.elements.modalFooter.style.display = '';

      // Sync toggle state
      this.elements.modalToggle.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === this.state.displayMode);
      });

      // Create comparison output
      const outputDiv = document.createElement('div');
      outputDiv.className = `comparison-output diff-${this.state.displayMode}`;
      outputDiv.innerHTML = Renderer.renderDiff(this.state.diffResult, this.state.displayMode);
      this.elements.modalBody.appendChild(outputDiv);

      // Render footer stats
      if (this.state.diffResult) {
        this.elements.modalFooter.innerHTML = Renderer.renderLegend(this.state.diffResult.stats);
      } else {
        this.elements.modalFooter.innerHTML = Renderer.renderLegend(null);
      }
    }

    // Show modal
    this.elements.modalOverlay.classList.remove('closing');
    this.elements.modalOverlay.classList.add('active');

    // Focus textarea if applicable
    const textarea = this.elements.modalBody.querySelector('textarea');
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }, 100);
    }
  },

  /**
   * Close maximize modal
   */
  closeModal() {
    if (!this.state.activeModal) return;

    this.elements.modalOverlay.classList.add('closing');
    this.elements.modalOverlay.classList.remove('active');

    setTimeout(() => {
      this.elements.modalOverlay.classList.remove('closing');
      this.elements.modalBody.innerHTML = '';
      this.elements.modalWordCount.style.display = 'none';
      this.elements.modalToggle.style.display = 'none';
      this.elements.modalFooter.style.display = 'none';
      this.state.activeModal = null;
    }, 300);
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
