# Diamond CPA — Homepage Redesign (cpadiamond.ca)

Static, dependency-free rebuild of the Diamond CPA homepage — no backend or CMS;
all interactivity (nav, carousel, form validation, counters) is client-side JS.
Content and information architecture are preserved from the live site; design
system, accessibility, motion, and performance are rebuilt to a measurable spec.

## Run it

```sh
cd cpa-diamond-local
python3 -m http.server 8000
# open http://localhost:8000
```

`index.html` loads the minified production assets (`css/styles.min.css`,
`js/script.min.js`). Editable sources: `css/styles.css`, `js/script.js`.
Re-minify after editing:

```sh
npx esbuild css/styles.css --minify --outfile=css/styles.min.css
npx esbuild js/script.js --minify --outfile=js/script.min.js
```

The consultation form validates client-side only — wire the submit handler to the
firm's real endpoint (the live site uses `/e-file/`) before production use.

---

## Design rationale

### Palette — "Violet Ledger + Amethyst on warm paper"

Research across 2026 trend reports for finance/B2B (Wix 2026 color trends,
enterprise Fortune-500 color strategy guides, finance-specific palette systems)
surfaced three viable directions: deep navy/indigo with an emerald-teal accent,
near-black charcoal with one accent (premium minimalism), and warm off-white
bases with restrained saturated accents (Pantone "Cloud Dancer" influence).
The shipped palette adapts the indigo direction into **deep violet-navy primaries
with a single amethyst accent**: deep violet keeps the gravitas and stability
signals of navy while feeling more distinctive and premium; the amethyst accent
is reserved for CTAs and key numbers (violet is 2026's rising B2B accent —
"Innovation Purple" per enterprise color-strategy reports) and reads as clarity,
wisdom, and confidence rather than urgency; the warm `#FCFBFE` paper base keeps
the firm approachable for a local Scarborough audience rather than
cold-corporate. Every text/background pair was verified programmatically at
WCAG AA (22 pairs, all passing — see contrast output below).

### Type — Fraunces (display) + Inter (body)

Fraunces, a contemporary old-style serif with wonky optical axes, carries all
headings: serif authority reads as "established professional" for a CPA-led firm
while staying distinctive enough to not feel like a template. Inter handles body
copy for its tall x-height and screen-optimized legibility. Both are fluidly
scaled with `clamp()` (e.g. H1 `clamp(2.375rem … 4rem)`), so type steps smoothly
between 375px phones and 1920px displays instead of jumping at breakpoints. Fonts
are self-hosted WOFF2 latin subsets (~85 KB total) with `font-display: swap` and
metric-matched fallback faces (`size-adjust`, ascent/descent overrides) to keep
CLS from font swapping near zero.

---

## Motion system

All motion is transform/opacity (compositor-only), rAF-coalesced, gated to
`hover + fine pointer` where cursor-dependent, and fully disabled under
`prefers-reduced-motion` (CSS guard + JS checks):

- Hero: drifting aurora glow layers, word-by-word masked headline reveal,
  shimmer underline draw-in, pulsing badge dot, floating gem watermark,
  animated scroll hint
- Cards (services + differentiators + hero card): 3D pointer tilt and a
  cursor-following spotlight gradient
- Buttons: light-sweep shine on hover
- Chrome: auto-hiding header (down = hide, up = show, never while drawer open,
  reveals on keyboard focus), scroll progress bar
- Carousel: pointer drag/swipe with snap, autoplay only while in view
- Sections: staggered IO reveals with scale-in

---

## Performance optimizations applied

| Optimization | Detail |
|---|---|
| Inline critical CSS | Header, hero, buttons, tokens (~7.5 KB gzipped-able) are in `<head>`; the full sheet loads via non-blocking `preload` + `rel` swap with `<noscript>` fallback |
| Self-hosted fonts | 2 variable WOFF2 files (latin subset), preloaded, `font-display: swap`, metric-compatible fallbacks — zero external font requests |
| Zero render-blocking JS | Single deferred script; all behavior is progressive enhancement |
| No raster images | Hero art is CSS gradients + masked dot-grid + inline SVG watermark; LCP element is styled text — no image fetches, no CLS |
| `content-visibility: auto` | All below-the-fold sections skip initial layout/paint cost |
| IntersectionObserver everywhere | Scroll reveals (unobserved after firing), scroll-spy, carousel autoplay gating, count-up triggers — no scroll listeners |
| Compositor-only animation | Only `transform`/`opacity` animate; no `will-change` abuse |
| Minified assets | 22.0 KB CSS / 5.8 KB JS shipped; readable sources kept alongside |
| Tabular numerals | `font-variant-numeric: tabular-nums` on stats/counters prevents width jitter |
| Fixed header height token | `--header-h` + `scroll-padding-top` keeps anchors stable, no shift |

Targets: **LCP** = styled hero headline on inline-painted background (< 1 s on
any connection realistically); **CLS** ≈ 0 (no images, sized SVGs, metric-tuned
fonts); **INP** < 200 ms (no long tasks; IO-driven work is O(1) per event).

## Accessibility

- Skip link, landmark structure, visible `:focus-visible` rings site-wide
  (amethyst-600 on light / amethyst-400 on dark, both ≥ 3:1 non-text)
- Mobile drawer: focus trap inside header, Escape closes + restores focus,
  scrim click closes, auto-close at desktop widths
- Dropdown menus: real `<button aria-expanded aria-controls>`, close on outside
  click / Escape / focus-out
- Carousel: labelled prev/next, 48px controls, dots with 44px hit areas,
  autoplay only while visible, paused on hover/focus, disabled under reduced motion
- Form: visible labels, `aria-describedby` errors, `aria-invalid`, first invalid
  field focused on submit, success panel receives focus (`role="status"` region)
- Touch targets ≥ 44px (nav links 52px in drawer, buttons ≥ 48px)

## Breakpoints

Mobile-first: base ≤ 767px → `48em` (768) → `64em` (1024) → `90em` (1440);
container caps at `1280px` so 1920px+ renders centered with generous whitespace.
No fixed-width elements exceed the viewport; `overflow-x: clip` guards against
stray overflow.

## Acceptance criteria

- [x] No layout breaks at 375 / 768 / 1024 / 1440 / 1920 (fluid grid + clamps + capped container)
- [x] WCAG AA contrast verified programmatically — 21/21 pairs pass (body ≥ 4.5:1, non-text ≥ 3:1)
- [x] Visible focus states on every interactive element (`:focus-visible`)
- [x] Animations respect `prefers-reduced-motion` (CSS guard + JS checks for count-up/carousel)
- [x] No render-blocking resources (critical CSS inline; CSS preload-swap; JS defer)
- [x] Palette documented as reusable tokens (`--primary-*`, `--accent-*`, `--neutral-*`, semantic `--success/--error`, 8px spacing scale `--space-*`)

## Contrast verification (programmatic)

```
PASS 17.07:1  Body ink on surface              PASS 11.25:1  Accent-400 on primary-950
PASS  7.02:1  Muted text on surface            PASS 10.30:1  On-dark muted (.72 white)
PASS  6.51:1  Muted text on tint               PASS 11.63:1  Trust strip (.78 white)
PASS  6.77:1  Eyebrow amethyst-700 on surface  PASS  8.89:1  Card body on dark card
PASS  6.28:1  Num-list amethyst-700 on tint    PASS 13.19:1  Nav links on header
PASS 17.36:1  White heading on primary-800     PASS  7.75:1  Footer text (.62 white)
PASS 18.95:1  White heading on primary-900     PASS  6.22:1  Footer bottom (.55 white)
PASS  6.19:1  Btn label on accent-500          PASS  5.03:1  Btn label on accent-600
PASS  4.76:1  Success text on success bg       PASS  5.91:1  Error text on error bg
PASS 11.26:1  Field error text on input bg     PASS  3.84:1  Focus ring on light (3:1 non-text)
PASS  3.56:1  Active carousel dot (3:1)        PASS 11.15:1  Focus ring on dark (3:1 non-text)
```
