# Accessibility & progressive-enhancement contract

What Hikarion guarantees for keyboard, assistive tech, user preferences, and a
page whose JavaScript never runs. Audited 2026-07-19 against `kitchen-sink.html`.

Automated gates: `bun run check:a11y` (axe-core over the kitchen sink in both
densities, `target-size` explicitly enabled) and `bun test`
(`tests/progressive-enhancement.test.mjs` — a real browser with JS off, with
`hikarion.js` blocked, and under forced colours).

## The contract

1. **Core is CSS.** Every visual component styles itself with no script. If
   `hikarion.js` 404s, the page still renders themed and every native control
   still works.
2. **JS only ever adds.** No helper hides content to reveal it later; the tabs
   wiring is the only thing that hides anything at all, and only after it has
   run. No-JS therefore degrades to *more* content visible, never less.
3. **Native first.** `<dialog>`, `popover`, `<details>`, `<progress>`,
   `<meter>`, `command`/`commandfor` — the browser owns focus, dismissal and
   semantics wherever it can, so there is nothing for us to get wrong.
4. **Visible focus everywhere.** One 2px accent ring (`:focus-visible`,
   `base/elements.css`); fields and the switch use a flush inset edge plus a
   transparent outline so a focus indicator survives forced colours.
5. **State is never colour alone.** Every selected/current/on state also carries
   an ARIA attribute, and `base/forced-colors.css` restates it in system colours
   when the palette is taken away.
6. **User preferences are honoured**, and honoured globally rather than
   per-component — see below.

## User preferences

| Preference | Where | Behaviour |
|-----------|-------|-----------|
| `prefers-reduced-motion` | `base/reset.css` | One global killswitch clamps every duration/animation with `!important`, so no component has to remember. `Hikarion.setTheme` also skips its View Transition. |
| `prefers-contrast: more` | `base/elevation.css`, `components/skeleton.css` | The elevation ladder re-inks (same geometry, denser shadow); the skeleton tint deepens. The focus ring is already a solid 2px accent and needs no variant. |
| `forced-colors: active` | `base/forced-colors.css`, `components/progress.css`, `components/skeleton.css` | Selected/on states become `Highlight`/`HighlightText`; the determinate spinner falls back from a conic gradient to an outlined circle; skeletons gain an outline so the shape survives. |

`base/forced-colors.css` is one file rather than a block per component on
purpose: the failure has a single cause (accent-as-state), so the audit for it
should be readable in one place.

## Dialog focus order

`<dialog>` opened as a **modal** (`command="show-modal"`, or `showModal()`).
Everything here is the browser's native behaviour — Hikarion adds no trap.

| Step | Behaviour | Verified |
|------|-----------|----------|
| Open | Focus moves to the first focusable descendant, or the dialog itself if there is none. Add `autofocus` to choose. | ✅ lands on *Cancel* |
| Tab | Cycles within the dialog; the rest of the page is inert. | ✅ Cancel → Confirm → (UA chrome) → Cancel |
| `Esc` | Closes. Cancellable via the `cancel` event. | ✅ |
| Close | Focus returns to the element that was focused before opening. | ✅ back on *Open dialog* |

`hikarion.js` polyfills only the *invoker click* on browsers without
`command`/`commandfor`; it never touches focus.

## Live regions

| Surface | Markup | Why |
|---------|--------|-----|
| Toasts | `[data-toast-region]` with `aria-live="polite"` | Transient and non-blocking. Focus is deliberately **not** moved to a toast. The region is created on first use and appended to before the toast is inserted **on the next task** — a live region must already be in the DOM when its content changes, or the insertion is never announced. |
| Alerts | `role="alert"` / `role="status"` on the author's own element | Hikarion styles the roles rather than inventing a hook, so the author picks assertive vs polite where they know the urgency. |
| Determinate spinner | `role="progressbar"` + `aria-valuenow` | The value reaches AT through ARIA even when the conic-gradient ring is stripped by forced colours. |
| Loading regions | `aria-busy="true"` on the container | Skeletons are presentational; the container announces the state. |

Toasts stay `polite` even at `variant: "danger"`. Interrupting a screen-reader
mid-sentence for feedback the user did not request is its own accessibility
harm; use `role="alert"` on a real alert when the message must interrupt.

## Manual keyboard audit

Every interactive pattern in `kitchen-sink.html`, driven from the keyboard.

| Pattern | Keys | Result |
|---------|------|--------|
| Buttons / links | `Tab`, `Enter`/`Space` | ✅ Native. Accent ring on `:focus-visible`. |
| Dialog | `Enter` on invoker, `Tab`, `Esc` | ✅ See the focus-order table above. |
| Tabs | `Tab` to the tablist, `←` `→` `↑` `↓` `Home` `End`, `Tab` into the panel | ✅ APG tablist: roving `tabindex` (one stop for the whole list), automatic activation, panel is `tabindex="0"` so its content is reachable. |
| Accordion | `Tab`, `Enter`/`Space` | ✅ Native `<summary>`; inset focus ring so it stays inside the rounded box. |
| Dropdown | `Enter` on trigger, `Tab`, `Esc` | ✅ Native popover: `Tab` moves into the popover from the invoker, `Esc` light-dismisses and returns focus to the trigger. **Not** an APG menu — see limitations. |
| Tooltip | `Tab` to the trigger | ✅ on focusable triggers. ⚠️ see limitations. |
| Toast | `Tab` to the ✕ | ✅ Reachable while shown; `aria-live` announces without stealing focus. |
| Switch | `Tab`, `Space` | ✅ Native checkbox + `role="switch"`. Track is pinned at 24px in both densities (WCAG 2.2 §2.5.8) — Compact has no room to shrink it. |
| Chips | `Tab`, `Enter`/`Space` | ✅ Filter chips are `<button aria-pressed>`; the remove ✕ is its own button with an `aria-label`. |
| Dropzone | `Tab`, `Enter`/`Space` | ✅ The file input is a real focusable control stretched invisibly over the whole card, so the focus target and the click target are the card. |
| Stepper | `Tab` | ✅ Steps are buttons; the current step is `aria-current="step"`, and completed steps render a ✓ rather than a number, so progress is not colour-only. |
| Pagination | `Tab`, `Enter` | ✅ Current page is `aria-current="page"`; disabled ends use `aria-disabled` (not `disabled`), so they stay in the tab order and in the a11y tree. |
| Form fields | `Tab`, native editing | ✅ Invalid fields get a `--danger` edge **and** a heavier inset ring — weight, not just hue. `:user-invalid` only fires after interaction. |
| Range slider | `Tab`, `←` `→` `Home` `End` | ✅ Native; the thumb carries its own focus ring in both engines. |
| Copy button | `Tab` | ✅ Appears on `:focus-visible`, not hover only. |

## Known limitations

Real, deliberate, and not fixed:

- **CSS tooltips are supplementary, never labels.** `[data-tooltip]` renders
  through `::after`; it is not reliably announced, it cannot be dismissed with
  `Esc` (WCAG 1.4.13), and on a non-focusable element such as `<span data-badge
  data-tooltip>` a keyboard user cannot reveal it at all. Give the trigger a
  real accessible name and treat the tooltip as a hint. If you need a
  conforming tooltip, promote it to `popover="hint"`.
- **`[data-menu]` is a disclosure, not an APG menu.** It is a native popover
  containing ordinary buttons and links: `Tab` navigates it, not `↑`/`↓`, and
  there is no `role="menu"`. This is the honest description of what the markup
  is; adding menu roles without menu keyboard behaviour would be worse than
  neither.
- **Tabs need JS.** They are the only pattern that does. With no JS the roles
  are absent and every panel is visible and readable — content is never lost,
  but it is also not a tablist.
- **`aria-disabled` links stay activatable by keyboard.** `pointer-events: none`
  stops the mouse only. Use `<button aria-disabled>` for pagination ends, as the
  markup contract shows, not `<a aria-disabled href>`.
- **Toasts sit below an open modal `<dialog>`.** The region is a high `z-index`
  layer, not the top layer.

## What actually degrades without JavaScript

Verified in Chromium with `javaScriptEnabled: false`, and again with only
`dist/hikarion.js` blocked. Both are asserted in
`tests/progressive-enhancement.test.mjs`.

**Works unchanged** — all styling and theming; `<dialog>` open/close (native
`command` invokers); `[data-menu]` open, light-dismiss and `Esc` (native
popover); `<details>` disclosure; the dropzone's picker and keyboard access;
form validation (`:user-invalid`); tooltips; spinners; progress and meter;
switch, badge, chip,
avatar, stepper, breadcrumbs, pagination, skeleton, empty state — every one of
these is presentational or native.

**Degrades, gracefully:**

| Feature | Without JS |
|---------|-----------|
| Tabs | All three panels visible and stacked, no ARIA roles. Readable; not a tablist. |
| Chip toggle / remove | Chips render and focus; `aria-pressed` does not flip and ✕ does not remove. |
| Dropzone drag highlight & filename | No accent highlight, and the prompt text does not change to the chosen filename. A native `input[type="file"]` accepts a dropped file itself, so the drop *should* still select the file with no JS — that follows from the input now covering the card, but a synthetic drop event cannot set `input.files`, so it is **untested here** and rests on spec behaviour alone. |
| Theme switcher | `[data-set-theme]` buttons do nothing; the page uses the OS `prefers-color-scheme`. |
| `<pre>` copy buttons | Absent. The code block is unaffected. |
| Toasts | `Hikarion.toast()` does not exist; nothing renders. There is no no-JS toast. |
| `command`/`commandfor` on old browsers | The polyfill is the JS, so on a browser lacking native invokers *and* without the script, the dialog cannot be opened. Current Chromium, Safari and Firefox all support invokers natively. |

Density is **not** in this list: `data-density` is a CSS attribute with zero JS
behind it. The kitchen sink's toggle is a demo of the attribute, not part of the
framework.

**Not verified here:** real screen-reader output (NVDA/JAWS/VoiceOver), Windows
High Contrast on actual Windows (the forced-colours checks are Chromium's
emulation), Safari and Firefox behaviour for all of the above, and touch/mobile
gestures. axe-core is a static check — it catches roughly a third of WCAG
issues, and passing it is a floor, not a proof.
