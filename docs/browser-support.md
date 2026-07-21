# Browser support

**Policy: modern-first, graceful fallback.** Hikarion targets evergreen browsers
and ships no legacy polyfills. Where a feature is newer than the baseline, the
*absence* of it is designed as a real state — not a broken one — and this page
says exactly what you get instead.

Version numbers are from [MDN browser-compat-data][bcd], checked 2026-07. They
are a snapshot; the "what you get instead" column is the durable part, and it is
verified against `src/`.

[bcd]: https://github.com/mdn/browser-compat-data

## Required — no fallback

Below these, Hikarion does not render as designed. There is no polyfill path and
none is planned; this is the trade for zero-config taste.

| Feature | Chrome | Safari | Firefox | Used for |
|---|---|---|---|---|
| `@layer` | 99 | 15.4 | 97 | The entire override model ([overrides.md](./overrides.md)) |
| `oklch()` | 111 | 15.4 | 113 | Every colour in every theme |
| `color-mix()` | 111 | 16.2 | 113 | Tints, hairlines, shadow ink, all Tier-2 colour |
| Custom properties, `:is()`, `:where()`, logical properties | — | — | — | Everywhere |

Effective floor: **Chrome 111, Safari 16.2, Firefox 113** — spring 2023.

Without `@layer` in particular the failure is quiet rather than visual: Hikarion's
rules stop losing to your unlayered CSS, so overrides start needing specificity.

## Enhanced — degrades on purpose

| Feature | Chrome | Safari | Firefox | Where | Without it |
|---|---|---|---|---|---|
| Container queries | 105 | 16 | 110 | Card media layout, `[data-nav]` stacking | Stacked card and a wrapping horizontal nav — the mobile-first baseline, usable at any width. No `@supports` guard because the fallback *is* the default branch. |
| `:has()` | 105 | 15.4 | 121 | Card, stepper, table, button group, dropdown trigger | Contextual refinements (trigger chevron, group seams) are skipped; base component styling holds. |
| Popover API | 114 | 17 | 125 | `[data-menu]`, toast region, hint tooltips | `@supports not selector(:popover-open)` drops `[data-menu]` back into flow as an inline panel under its trigger. Every row still works. |
| `popover="hint"` | 150 | ✗ | 153 | The conforming, Esc-dismissible tooltip | The attribute selector still matches, so it looks right — but an unknown `popover` value falls back to the **manual** state: `[popovertarget]` still toggles it open and shut (so it is dismissible from the trigger without moving focus), but it is *not* light-dismissed or Esc-closed. Don't promise Esc from CSS alone — but `hikarion.js` detects the fallback (the reflected `popover` IDL reads back `"manual"`) and adds `Esc` plus outside-click dismissal, so *dismissible* holds anywhere the Popover API exists. |
| `@starting-style`, `transition-behavior: allow-discrete` | 117 | 17.5 | 129 | Dialog / menu / toast pop-in | Overlays appear and disappear instantly. Nothing moves, nothing breaks. |
| CSS anchor positioning | 125¹ | 26 | 147 | `[data-menu]` and `popover="hint"` placement | Gated behind `@supports (anchor-name: --x)`. Outside the gate the browser's own centred popover placement is used: detached from the trigger, undramatic, fully usable — every row, Esc, light-dismiss and focus return are the browser's, not ours. |
| `linear()` easing | 113 | 17.4 | 112 | `--ease-spring` on the switch thumb | Gated behind `@supports (transition-timing-function: linear(0, 1))`; the token stays `--ease-out` and the thumb simply travels without the overshoot. |
| View Transitions (same-document) | 111 | 18 | 144 | Theme and density cross-fade | The change applies instantly. `Hikarion.setTheme()` feature-detects; no style depends on the API. |
| Scroll-driven animations (`animation-timeline: scroll()`) | 115 | 26 | ✗² | `[data-scroll-progress]` | Gated behind `@supports`. The bar is **absent**, not stuck or full — that is the point of the guard. |
| `command` / `commandfor` invokers | 135 | 26.2 | 144 | Opening `<dialog>` from a button; a `[data-menu]` action row closing its own menu | Detected separately from the Popover API — invokers shipped roughly three years later, so a browser can own `popover` fully and still ignore `command`. `hikarion.js` polyfills the invoker click. With neither native support nor the script, a dialog cannot be opened and a menu row does not close its menu (`Esc` and light-dismiss still do) — the one place where no-JS and an old browser compound. Opening a popover never depends on this: `[popovertarget]` is the recommended form and needs neither. |
| `appearance: base-select`, `::picker(select)` | 135 | 27 | ✗³ | Styled `<select>` and `<datalist>` drop-downs | The native OS popup, unstyled. Fully functional, just not themed. |
| `prefers-contrast: more` | 96 | 14.1 | 101 | Automatic high-contrast retune | Standard palette. No hook to miss. |
| `forced-colors: active` | 89 | 16 | 89 | Windows High Contrast restatement | Only *becomes active* where the OS exposes a forced palette — in practice Windows High Contrast. Everywhere else the query is supported and simply never matches. |

¹ `anchor-name` shipped in Chrome 125, but `position-try-fallbacks` and
`position-area` only in 128 and 129 (both were renamed late in the spec). Chrome
125–128 therefore enter the `@supports (anchor-name: --x)` branch without
honouring the placement inside it. Those versions are from mid-2024 and long past
their auto-update horizon; the gate is not tightened for them.

² Firefox has scroll-driven animations behind a preference, not shipped.

³ Firefox 149 behind `dom.select.customizable_select.enabled`.

## What this means in practice

- **The oldest browser that renders Hikarion correctly** is roughly two and a
  half years old. Everything newer than that is polish.
- **Nothing in the enhanced table is load-bearing for content.** Every fallback
  above leaves the markup readable, operable and keyboard-navigable. The two
  states you should actually design around are the hint-tooltip dismissal on
  Safari *without* `hikarion.js` (the script supplies `Esc` and outside-click
  there) and the invoker gap on pre-2025 browsers with JS disabled.
- **Progressive enhancement is tested, not assumed.**
  `tests/progressive-enhancement.test.mjs` drives a real browser with JS off,
  with `hikarion.js` blocked, and under forced colours.
  [accessibility.md](./accessibility.md) lists exactly what degrades without
  JavaScript.

## What is not covered

`bun run check:a11y` and `bun run check:visual` run **Chromium only**. Firefox
and Safari behaviour — including `:-moz-meter-*` styling and Safari's
`::-webkit-date-and-time-value` — rests on spec reading and the table above, not
on a green check. Same for real screen readers and actual Windows High Contrast;
see the "Not verified here" section of [accessibility.md](./accessibility.md).

## Mobile

The same engines: Chrome/WebView Android and Safari iOS track their desktop
versions in the table above (iOS Safari is the binding constraint, since every
iOS browser uses it). Nothing in Hikarion is pointer-only — hover-revealed
affordances (`<pre>` copy buttons, tooltips) are also revealed by
`:focus-visible`, and every target is checked against WCAG 2.2 §2.5.8 in both
densities.
