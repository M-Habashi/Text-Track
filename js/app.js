/**
 * App Controller Module
 * Manages application state and user interactions
 */
const App = {
  /**
   * Application state
   */
  state: {
    originalText: '',
    revisedText: '',
    diffResult: null,
    displayMode: 'visible'
  },

  /**
   * DOM element references (cached on init)
   */
  elements: {
    originalText: null,
    revisedText: null,
    originalWordCount: null,
    revisedWordCount: null,
    compareBtn: null,
    outputSection: null,
    outputStats: null,
    outputContent: null,
    toggleVisible: null,
    toggleHidden: null
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
   * Cache DOM element references for performance
   */
  cacheElements() {
    this.elements.originalText = document.getElementById('originalText');
    this.elements.revisedText = document.getElementById('revisedText');
    this.elements.originalWordCount = document.getElementById('originalWordCount');
    this.elements.revisedWordCount = document.getElementById('revisedWordCount');
    this.elements.compareBtn = document.getElementById('compareBtn');
    this.elements.outputSection = document.getElementById('outputSection');
    this.elements.outputStats = document.getElementById('outputStats');
    this.elements.outputContent = document.getElementById('outputContent');
    this.elements.toggleVisible = document.getElementById('toggleVisible');
    this.elements.toggleHidden = document.getElementById('toggleHidden');
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Textarea input handlers
    this.elements.originalText.addEventListener('input', () => this.updateWordCounts());
    this.elements.revisedText.addEventListener('input', () => this.updateWordCounts());

    // Compare button
    this.elements.compareBtn.addEventListener('click', () => this.handleCompare());

    // Toggle buttons
    this.elements.toggleVisible.addEventListener('click', () => this.setDisplayMode('visible'));
    this.elements.toggleHidden.addEventListener('click', () => this.setDisplayMode('hidden'));

    // Keyboard shortcut: Ctrl/Cmd + Enter to compare
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        this.handleCompare();
      }
    });
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
   * Handle compare button click
   */
  handleCompare() {
    const original = this.elements.originalText.value;
    const revised = this.elements.revisedText.value;

    if (!original.trim() && !revised.trim()) {
      return;
    }

    // Run comparison
    this.state.diffResult = DiffEngine.compare(original, revised);

    // Render results
    this.elements.outputStats.innerHTML = Renderer.renderStats(this.state.diffResult.stats);
    this.elements.outputContent.innerHTML = Renderer.renderDiff(this.state.diffResult, this.state.displayMode);
    this.elements.outputContent.className = `output-content diff-${this.state.displayMode}`;

    this.elements.outputSection.classList.remove('hidden');

    // Smooth scroll to results
    setTimeout(() => {
      this.elements.outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  /**
   * Set display mode (visible/hidden)
   * @param {string} mode - 'visible' or 'hidden'
   */
  setDisplayMode(mode) {
    this.state.displayMode = mode;

    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Re-render if we have results
    if (this.state.diffResult) {
      this.elements.outputContent.innerHTML = Renderer.renderDiff(this.state.diffResult, mode);
      this.elements.outputContent.className = `output-content diff-${mode}`;
    }
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
