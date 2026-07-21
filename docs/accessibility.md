# Accessibility & progressive-enhancement contract

What Hikarion guarantees for keyboard, assistive tech, user preferences, and a
page whose JavaScript never runs. Audited 2026-07-19 against `kitchen-sink.html`;
the rows added on 2026-07-21 (nav, data table, button group, select, date/time)
are reasoned from native element behaviour and covered by the axe gate, **not**
yet driven by hand.

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
| `prefers-reduced-motion` | `base/reset.css`, `base/motion.css`, `base/view-transitions.css` | One global killswitch clamps every duration/animation with `!important`, so no component has to remember. Two things it structurally cannot reach, each restated where it lives: a **scroll-driven** animation ignores `animation-duration`, so `[data-scroll-progress]` is authored inside `@media (prefers-reduced-motion: no-preference)` and is absent — not slowed — under `reduce`; and the `::view-transition-*` pseudo tree is not matched by `*`, so the root cross-fade is nulled with `animation: none !important`, which makes the transition finish on its first frame (a hard cut). `Hikarion.setTheme` also skips its View Transition. |
| `prefers-contrast: more` | `base/high-contrast.css`, `base/elevation.css`, `components/skeleton.css` | Automatic, no hook. `--muted` collapses into `--fg` and `--border` becomes a full-strength line (`--line` stays lighter, so inner rules still read as inner rules); soft tone edges go solid; the focus ring goes 2px → 3px and the field's inset edge 1px → 2px. `--accent` is unchanged and gated at 4.5:1 on `--bg`/`--surface`. The elevation ladder re-inks (same geometry, denser shadow); the skeleton tint deepens. |
| `forced-colors: active` | `base/forced-colors.css`, `base/elements.css`, `components/progress.css`, `components/skeleton.css`, `components/table.css` | Selected/on states become `Highlight`/`HighlightText`; the determinate spinner falls back from a conic gradient to an outlined circle; skeletons gain an outline so the shape survives. A live dropzone, a selected table row and the range thumb become `Highlight`; the tooltip bubble and solid alerts regain a `CanvasText` edge, since their box was drawn by a fill the forced palette removes. |

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
| Toasts | `[data-toast-region]` with `aria-live` — `assertive` for `variant: "danger"`, `polite` otherwise, set immediately before the deferred append | Transient and non-blocking. Focus is deliberately **not** moved to a toast. The region is created on first use and appended to before the toast is inserted **on the next task** — a live region must already be in the DOM when its content changes, or the insertion is never announced. |
| Alerts | `role="alert"` / `role="status"` on the author's own element | Hikarion styles the roles rather than inventing a hook, so the author picks assertive vs polite where they know the urgency. |
| Determinate spinner | `role="progressbar"` + `aria-valuenow` | The value reaches AT through ARIA even when the conic-gradient ring is stripped by forced colours. |
| Loading regions | `aria-busy="true"` on the container | Skeletons are presentational; the container announces the state. |

Severity picks the politeness. An error toast is feedback on an action the user
just performed, and waiting for a pause can leave them acting on a failed
operation, so `variant: "danger"` announces `assertive`; a confirmation or
progress note is not worth interrupting a sentence for, so everything else stays
`polite`. Do **not** put `role="alert"` on a toast — `alert.css` styles that role
at the same specificity and imports later, so it would repaint the toast as a
callout. Politeness lives on the region; the toast element stays role-less.

## Manual keyboard audit

Every interactive pattern in `kitchen-sink.html`, driven from the keyboard.

| Pattern | Keys | Result |
|---------|------|--------|
| Buttons / links | `Tab`, `Enter`/`Space` | ✅ Native. Accent ring on `:focus-visible`. |
| Dialog | `Enter` on invoker, `Tab`, `Esc` | ✅ See the focus-order table above. |
| Command palette | `Enter` on invoker, type, `↑`/`↓`, `Enter`, `Esc` | ✅ APG combobox shape: DOM focus stays in the `<input>` (the user is still typing), the active row is named by `aria-activedescendant` and marked `aria-selected`. `↑`/`↓` walk only the rows left visible by the filter and wrap at both ends. Inert rows (`aria-disabled`) are walked — so a keyboard user learns the command exists — but `Enter` refuses to fire them. `Esc`, the backdrop, the focus trap and focus return are the native `<dialog>`'s. Without `hikarion.js` the filter and the arrow keys are absent; every command stays visible, tabbable and clickable. |
| Tabs | `Tab` to the tablist, `←` `→` `↑` `↓` `Home` `End`, `Tab` into the panel | ✅ APG tablist: roving `tabindex` (one stop for the whole list), automatic activation, panel is `tabindex="0"` so its content is reachable. |
| Accordion | `Tab`, `Enter`/`Space` | ✅ Native `<summary>`; inset focus ring so it stays inside the rounded box. |
| Dropdown / action menu | `Enter`/`↓` on trigger, `↑` `↓` `Home` `End`, typeahead, `Tab`, `Esc` | ✅ With `hikarion.js` it is an APG menu button: the script stamps `role="menu"`/`role="menuitem"` and a roving tabindex, opening moves focus to the first row, `↑`/`↓` wrap, `Home`/`End` jump, a printable character jumps to the next row starting with it, `Esc` and light-dismiss close it and return focus to the trigger; `Tab` closes it and moves on to the next element after the trigger, per APG. Without the script (or without the Popover API) no roles are stamped and it stays the honest Tab-driven disclosure. An action row carries `command="hide-popover"`, so activating it closes the menu, no script needed. Inert rows use `aria-disabled`, so they keep their place in the menu and stay announced. |
| Button group / split button | `Tab`, `Enter`/`Space` | ✅ Plain tab order — every child is a real `<button>`, nothing roving, nothing trapped. The focused button is raised above its overlapping neighbour so the ring is never clipped. The chevron-only menu half renders with no text and **must** carry its own `aria-label`. |
| Nav | `Tab`, `Enter` | ✅ Native links only. The current item is `aria-current="page"` and is marked by geometry (underline / inline-start edge) as well as colour. |
| Data table | `Tab`, `Space` | ✅ Selection is a native checkbox per row, so it is keyboard-operable, submittable and announced as a real checked state. Each needs an author-supplied `aria-label` naming its row — documented, not enforceable in CSS. |
| Select / combobox | `Tab`, arrows, type-ahead | ✅ Entirely native: `<select>`, `select[multiple]` and `input[list]` + `<datalist>` keep the browser's own combobox/listbox roles and keyboard model. |
| Date & time fields | `Tab`, arrows, digits | ✅ Native segment editing and the platform picker; Hikarion restyles the picker button only. |
| Tooltip | `Tab` to the trigger, `Esc` | ✅ on focusable triggers. The `popover="hint"` shape adds a real button trigger that toggles the bubble. `Esc` and light-dismiss are the browser's where `popover="hint"` is implemented, and `hikarion.js` supplies both where it is not — so the popover shape is dismissible on every browser with the Popover API. `[data-tooltip]` (CSS-only) still has no `Esc` — see limitations. |
| Toast | `Tab` to the ✕ | ✅ Reachable while shown, including over a modal `<dialog>`: the top layer does *not* escape inertness, so while a modal is open the region is parked inside that dialog (and handed back to `<body>` on close) — otherwise a toast over a modal would paint but be unfocusable and unclickable; `aria-live` announces without stealing focus. The timer pauses while the toast is hovered or holds focus, and the ✕ is 24px in both densities. |
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

- **CSS tooltips cannot be Esc-dismissed.** `[data-tooltip]` renders through
  `::after`, and CSS cannot observe a keypress — there is no selector for it. It
  *is* persistent and hoverable (WCAG 2.2 1.4.13 — the bubble is hit-testable
  while shown and a hide delay keeps it alive while the pointer crosses to it),
  and it is revealed by `:focus-visible` on any focusable trigger, but on a
  non-focusable element such as `<span data-badge data-tooltip>` a keyboard user
  still cannot reveal it. Use `popover="hint"` with a `[popovertarget]` button
  when the trigger must be keyboard-reachable: the button toggles the bubble, so
  it is dismissible without moving focus. Esc and light-dismiss are the browser's
  where `popover="hint"` is implemented (no shipping Safari today; elsewhere the
  invalid-value default is the **manual** state, not `auto`). `hikarion.js`
  closes that gap: where `hint` is unimplemented it adds `Esc` and outside-click
  dismissal to open `[popover="hint"]` elements, so WCAG 2.2 1.4.13
  *dismissible* holds on every browser with the Popover API. It does not rewrite
  the attribute to `auto` — that selector is the bubble's entire skin, and `auto`
  would close any open menu. Without the script and without `hint`, the trigger
  is the only dismissal. Neither shape is reliably announced — give the trigger a
  real accessible name.
- **`[data-menu]` is only an APG menu with JS.** The markup is a native popover
  containing ordinary buttons and links. `hikarion.js` upgrades it in place —
  `role="menu"`/`role="menuitem"`, roving tabindex, `↑`/`↓`/`Home`/`End`,
  first-character typeahead, `Tab` to close — because roles and the keyboard
  model have to arrive together; menu roles without menu keys are worse than
  neither. With no script, or on a browser without the Popover API (where the
  panel drops into flow), nothing is stamped and `Tab` navigates a disclosure.
  That is a real difference in what a screen reader announces, and it is the
  price of not lying in the markup.
- **Tabs need JS.** They are the only pattern that does. With no JS the roles
  are absent and every panel is visible and readable — content is never lost,
  but it is also not a tablist.
- **`aria-disabled` links stay activatable by keyboard.** `pointer-events: none`
  stops the mouse only. Use `<button aria-disabled>` for pagination ends, as the
  markup contract shows, not `<a aria-disabled href>`.
- **A `<dialog>` opened after the toast region still covers it.** The region is
  a `popover="manual"`, so it is in the top layer and clears a modal opened
  before it — but top-layer order is insertion order, so a dialog opened later
  wins. Fixing it means re-`showPopover()`ing on every toast, which would also
  restack the region above any popover-based menu.
- **`prefers-contrast: more` is gated at the token level only.** The contrast
  check verifies the palette (see below), but neither `check:a11y` nor
  `check:visual` sets the media feature, so the *rendered* high-contrast result
  is unverified by CI. Playwright supports `contrast: "more"` as a context
  option; a third axe pass is the cheap fix when someone wants it.
- **Disabled states stay opacity-based** (`0.4`–`0.5` across button, range,
  pagination, menu), and stay dim under `prefers-contrast: more`. WCAG 1.4.3
  exempts disabled controls, so raising them would mean a cross-component
  selector list in a base file for no conformance gain. A decision, not an
  oversight.

## What actually degrades without JavaScript

Verified in Chromium with `javaScriptEnabled: false`, and again with only
`dist/hikarion.js` blocked. Both are asserted in
`tests/progressive-enhancement.test.mjs`.

**Works unchanged** — all styling and theming; `<dialog>` open/close (native
`command` invokers); `[data-menu]` open, light-dismiss and `Esc` (native
popover — but menu roles and arrow-key navigation need `hikarion.js`); a
`[data-menu]` action row closing its own menu (a native
`command="hide-popover"` invoker); `popover="hint"` open and toggle-to-close;
the split button; `<select>`, `select[multiple]` and the
`input[list]` + `<datalist>` combobox; date/time fields and their platform
picker; `<details>` disclosure; the dropzone's picker, preview slots and keyboard access;
form validation (`:user-invalid`); tooltips; spinners; progress and meter;
the `[data-scroll-progress]` reading bar (CSS scroll-driven, no script);
switch, badge, chip,
avatar, stepper, breadcrumbs, pagination, skeleton, empty state — every one of
these is presentational or native.

**Degrades, gracefully:**

| Feature | Without JS |
|---------|-----------|
| Tabs | All three panels visible and stacked, no ARIA roles. Readable; not a tablist. |
| `[data-menu]` roles & arrow keys | No `role="menu"` is stamped; the panel stays a Tab-driven disclosure. Open, `Esc` and light-dismiss are native and unaffected. |
| `popover="hint"` on Safari without the script | The bubble falls back to the manual popover state: it toggles from its trigger, but `Esc` and outside-click do nothing. Loading `hikarion.js` restores both. |
| Chip toggle / remove | Chips render and focus; `aria-pressed` does not flip and ✕ does not remove. |
| Dropzone drag highlight & filename | No accent highlight, and the prompt text does not change to the chosen filename. A native `input[type="file"]` accepts a dropped file itself, so the drop *should* still select the file with no JS — that follows from the input now covering the card, but a synthetic drop event cannot set `input.files`, so it is **untested here** and rests on spec behaviour alone. |
| Theme switcher | `[data-set-theme]` buttons do nothing; the page uses the OS `prefers-color-scheme`. |
| `<pre>` copy buttons | Absent. The code block is unaffected. |
| Toasts | `Hikarion.toast()` does not exist; nothing renders. There is no no-JS toast. |
| `command`/`commandfor` on old browsers | The polyfill is the JS, so on a browser lacking native invokers *and* without the script, the dialog cannot be opened and a `[data-menu]` action row does not close its own menu (the menu still light-dismisses and closes on `Esc`). Current Chromium, Safari and Firefox all support invokers natively. |

Density is **not** in this list: `data-density` is a CSS attribute with zero JS
behind it. The kitchen sink's toggle is a demo of the attribute, not part of the
framework.

**Not verified here:** real screen-reader output (NVDA/JAWS/VoiceOver), Windows
High Contrast on actual Windows (the forced-colours checks are Chromium's
emulation), Safari and Firefox behaviour for all of the above, and touch/mobile
gestures. axe-core is a static check — it catches roughly a third of WCAG
issues, and passing it is a floor, not a proof.
