# Frontend Design Skill

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

## Anti-Patterns to Avoid

NEVER use generic AI-generated aesthetics like:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

## Implementation Notes

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

---

**Workflow**: When editing UI files, always update this skill file and the UI output together to maintain consistency.

---

## Current Project: Text Compare Tool

### File Structure
```
text-tracking/
├── index.html              # Main HTML (structure only)
├── css/
│   └── styles.css          # All styles + design tokens
└── js/
    ├── tokenizer.js        # Text parsing module
    ├── diff-engine.js      # Myers diff algorithm
    ├── renderer.js         # HTML output generation
    └── app.js              # App controller + real-time comparison
```

### Aesthetic Direction
**macOS-inspired Editorial Minimalism** - Dark grey window headers, traffic light buttons, smooth animations, paper-like warmth.

### Layout
```
┌─────────────────────────────────────────────────────┐
│              Text Compare (header)                  │
│     Word-level comparison with change tracking      │
├─────────────────────┬───────────────────────────────┤
│   Original (top)    │                               │
│   [macOS window]    │    Comparison                 │
├─────────────────────┤    [macOS window]             │
│   Revised (bottom)  │                               │
│   [macOS window]    │                               │
├─────────────────────┴───────────────────────────────┤
│              (footer)                               │
└─────────────────────────────────────────────────────┘
```

### Design Tokens (in css/styles.css)
```css
/* Colors */
--color-bg-primary: #FAFAF8          /* Warm off-white */
--color-bg-window: #FFFFFF           /* Window background */
--color-text-primary: #1A1A1A        /* Near-black */
--color-deleted: #C53030             /* Warm red */
--color-inserted: #2563EB            /* Clear blue */
--color-moved: #7C3AED               /* Purple */

/* Window header - DARK GREY */
--window-header-bg: linear-gradient(180deg, #4A4A4A 0%, #3A3A3A 100%)
--window-header-text: #FFFFFF

/* macOS traffic lights */
--color-traffic-close: #FF5F57
--color-traffic-minimize: #FFBD2E
--color-traffic-maximize: #28C840

/* Typography */
--font-serif: 'Crimson Pro'          /* Body text, textareas */
--font-mono: 'JetBrains Mono'        /* Labels, stats, counts */
--font-system: -apple-system, ...    /* Window titles (white on dark) */
```

### Key Features
- **App header/footer**: Title "Text Compare" and subtitle at top, footer at bottom
- **macOS-style windows**: Dark grey headers, traffic lights, white title text
- **Word count on RIGHT**: Displayed on right side of window header
- **Real-time comparison**: Debounced (300ms) - no Compare button needed
- **Maximize modal**: Green button opens full-screen popup with smooth animations
- **Legend with stats**: Footer shows `-X Removed`, `+X Added`, `X Moved paragraphs` with colors

### Component Structure
- **Header**: App title + subtitle
- **Left Panel**: Original (top) + Revised (bottom) stacked
- **Right Panel**: Comparison window (full height)
- **Footer**: App footer
- **Each window has**:
  - Dark grey header with traffic lights
  - Window title (centered, white)
  - Word count (right side, muted white)
- **Comparison window has**:
  - Show/Hide toggle in header
  - Legend with stats in footer

### Legend Format (in footer)
```
-5 Removed  |  +3 Added  |  2 Moved paragraphs
```
Stats have matching colors (red, blue, purple), labels are capitalized (first letter only).

### Display Modes
1. **Visible (Show)**: Red strikethrough for deleted, blue for inserted, purple border + badge for moved
2. **Hidden (Hide)**: Clean final text, red dot markers for deletions, bold for insertions

### Moved Paragraph Indicator
```html
<span class="moved-indicator">
  <span class="moved-indicator-icon"></span>
  Moved paragraph — was at position X
</span>
```
Note: "Moved paragraph" not all caps, just first letter capitalized.

### JavaScript Modules
| File | Exports | Purpose |
|------|---------|---------|
| `tokenizer.js` | `Tokenizer` | splitParagraphs, tokenizeWords, fingerprint, countWords |
| `diff-engine.js` | `DiffEngine` | Myers diff, paragraph alignment, move detection |
| `renderer.js` | `Renderer` | renderDiff, renderLegend (with stats) |
| `app.js` | `App` | Real-time comparison, modal maximize, display mode toggle |

### Animations
- **Modal open**: scale(0.9) → scale(1), opacity 0→1, 400ms ease-out
- **Modal close**: Uses `.closing` class, scale(1) → scale(0.9), opacity 1→0, 300ms
- **Overlay**: backdrop-filter blur(4px), opacity fade with visibility transition
