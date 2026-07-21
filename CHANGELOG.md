# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Public surface and deprecation rules: [`docs/versioning.md`](docs/versioning.md),
[`docs/public-surface.md`](docs/public-surface.md).

## [Unreleased]

### Added

- **`data-palette`** — command palette on a modal `<dialog>`: a search field and
  a list of commands, opened with the native `command="show-modal"` invoker so
  `Esc`, the backdrop, the focus trap and focus return stay the browser's. Rows
  are exactly menu rows (`data-variant`, `aria-disabled`, trailing `<kbd>`,
  `<hr>`), so nothing new was invented for them. `hikarion.js` adds substring
  filtering and the APG combobox keys — `↑`/`↓` walk the visible rows and wrap,
  `Enter` runs the active one, focus stays in the input and the active row is
  named by `aria-activedescendant`. Without the script every command is still
  listed, readable and clickable
- Versioning and deprecation policy (`docs/versioning.md`)
- Enumerated public Tier-1 + `data-*` surface (`docs/public-surface.md`)
- Visual regression gate — `kitchen-sink.html` snapshotted across the generated
  theme × density matrix, compared against committed baselines in `tests/visual/`,
  run inside the pinned Playwright container so pixels are reproducible
  ([docs/visual-regression.md](docs/visual-regression.md))
- Contributor Covenant Code of Conduct
- Contributing guide, issue templates, and RFC path for vocabulary changes
- CI quality gates: expanded contrast pairs, Stylelint (utility-class bans),
  gzip size budget, axe-core kitchen-sink check, and JSDoc typecheck
- **Public `data-density="crisp|compact"`** — nestable, CSS-only density that
  retunes the spacing scale and control metrics. Crisp is the default and needs
  no attribute; kitchen-sink demos both, and the axe gate runs against each
  ([RFC 0001](docs/rfcs/0001-data-density.md))
- a11y gate enables axe's `target-size` rule (WCAG 2.2 AA 2.5.8), the rule
  Compact density can regress
- **Avatar** — `[data-avatar]` holding an `<img>` or its own text as initials,
  with tone variants and `[data-avatar-group]` for overlapping stacks. CSS-only,
  density-aware, no size vocabulary
- **Empty state** — `[data-empty]`, a frameless centred zero-state column that
  composes inside a card, table cell, or tab panel
- **Skeleton** — `[data-skeleton]`, a pure-CSS placeholder that takes its shape
  from the element it sits on (no sizing API). Flattens to a static tint under
  `prefers-reduced-motion` and outlines under `forced-colors`
- **Form layout** — `<form>`, `<fieldset>` and a `<p>` per field now carry the
  whole vertical rhythm with no hook, and `<legend>` keeps cutting the fieldset
  border. New `[data-form-row]` groups fields side by side
  (`<footer data-form-row>` for actions); density tightens the gaps but not the
  ~12rem wrap threshold
- Circular progress — `[data-spinner]` with `role="progressbar"` and the new
  author-set `--hk-value` (0–100) renders a determinate ring. No new hook, no JS
- `data-variant` tones the native `<progress>` fill, and the track follows density
- Type scale (`src/base/type.css`): escalating heading hierarchy with a fluid
  `h1`, and `h5`/`h6` styled as label and eyebrow instead of falling through to
  UA defaults. Density-independent by design
- Elevation ladder (`src/base/elevation.css`): `--elevation-0` … `--elevation-4`,
  crisp contact-plus-ambient shadows inked per theme, with a `prefers-contrast:
  more` step-up
- Motion tokens `--dur-fast` and `--dur-slow` beside the existing `--dur`
- **CDN usage docs** (`docs/cdn.md`) with real SRI integrity hashes generated
  from `dist/` by `bun run build`. The table is generated, never hand-copied, and
  CI + the release workflow fail on a stale one (`git diff --exit-code docs/cdn.md`)
- Build emits CSS source maps (`dist/hikarion.css.map`, `dist/hikarion.min.css.map`)
- **Release workflow** (`.github/workflows/release.yml`): on a `v*` tag, runs the
  full `bun run ci` gate and publishes minified artifacts, unminified CSS, source
  maps, the optional JS, and the theme files to a GitHub Release
- Documented — and verified — that core styling has no dependency on the optional
  JS entry, plus a written deferral of a critical/layer subset with the size
  budget as evidence (`docs/cdn.md`)

- **Navigation** — `[data-nav]`, a horizontal primary link run, and
  `[data-nav="sidebar"]` for the vertical rail. The active item is native
  `aria-current="page"`, marked with geometry as well as colour, so forced
  colours needs no restatement
- **Data table** — `[data-table]`, a scroll frame around a plain `<table>` with a
  `position: sticky` header and checkbox-driven row selection (`:has(:checked)`),
  no new row-level vocabulary and no JS
- **Button group / split button** — `[data-button-group]`, adjacent `<button>`s
  fused into one control with shared seams and outer-only corners. A split button
  is the same group with a `[popovertarget]` half, composing the existing
  `[data-menu]` popover for the chevron and panel. CSS only
- **Action menu rows** — `[data-menu]` rows now carry three states with no new
  vocabulary: `data-variant="<tone>"` for a destructive/toned row,
  `aria-disabled="true"` for an inert-but-announced row, and a trailing `<kbd>`
  as a shortcut hint. Focus rings are inset so they stay inside the panel
- **Select & searchable input** — no new hook: `<optgroup>` renders as an eyebrow
  heading, `select[multiple]`/`select[size]` styles as a list box with an
  accent-filled checked row, and `input[list]` + `<datalist>` gains the select
  chevron so the native searchable combobox is discoverable
- **Date and time fields** — `input[type="date"|"time"|"datetime-local"|"month"|"week"]`
  are styled natively: the picker button is repainted as the one Hikarion chevron
  (so it stays visible in dark themes), separators go muted, and Safari's value
  aligns to the inline start. No custom calendar
- **File upload previews** — a plain `<ul>` placed after a `[data-dropzone]` label
  now renders as a grid of preview slots (optional square thumbnail + filename).
  No new hook; the list is matched as a sibling
- **Tooltip delay control** — `--hk-tooltip-delay` (show, `0.4s`) and
  `--hk-tooltip-delay-out` (hide, `--dur-slow`), inherited author-settable values
- **Hint popover** — `[popover="hint"]` now takes the tooltip skin and anchors
  above its `[popovertarget]` invoker, giving a keyboard-reachable tooltip with
  no JS (Esc and light-dismiss where `popover="hint"` is implemented — see
  docs/browser-support.md)
- **Scroll progress** — `[data-scroll-progress]`, an empty element that becomes a
  hairline reading-progress bar driven by `animation-timeline: scroll(root block)`.
  Fully removed under `prefers-reduced-motion: reduce` and where `scroll()` is
  unsupported, rather than degraded
- **View transitions** — theme and density switches cross-fade over `--dur-slow`
  on `--ease-hikarion` where the browser supports the API, and hard-cut under
  `prefers-reduced-motion` or without it. Enhancement only; no new hooks
- **High contrast** — `prefers-contrast: more` is honoured automatically at the
  token seam (`base/high-contrast.css`): `--muted` collapses into `--fg`,
  `--border` becomes a full-strength line, soft tone edges go solid, and both
  focus indicators thicken. `--accent` is unchanged. No hook — a permanently
  high-contrast look is a theme, and themes are vocabulary Hikarion already has
- **Forced colours** — a live dropzone (`[data-dragover]`) now restates as
  `Highlight`/`HighlightText`; the tooltip bubble and solid alerts regain a
  `CanvasText` edge, whose box was previously drawn by a fill the forced palette
  removes
- Contrast gate locks `--accent` against `--bg` and `--surface` at 4.5:1, and
  raises `fg/bg` + `fg/surface` to 7:1 — under `prefers-contrast: more` those two
  pairs *are* the muted and border pairs, so the AAA floor is what makes "more
  contrast" mean measurably more
- **APG menu semantics for `[data-menu]`** — `hikarion.js` stamps
  `role="menu"`/`role="menuitem"`, a roving tabindex and `aria-haspopup`, moves
  focus into the panel on open, and wires `↑` `↓` `Home` `End`, first-character
  typeahead and `Tab`-to-close. No new markup and no new hook; without the
  script (or without the Popover API) the panel stays the Tab-driven disclosure
  it was, with no roles claimed
- **`Esc` and light-dismiss for hint tooltips** — where `popover="hint"` is
  unimplemented (every shipping Safari today) the value falls back to the
  *manual* popover state, which is neither. `hikarion.js` detects that and
  supplies both, so WCAG 2.2 1.4.13 *dismissible* holds anywhere the Popover API
  exists. The attribute is not rewritten to `auto`
- `--ease-spring`: a damped-spring `linear()` easing, applied to the switch
  thumb — the one direct-manipulation control in core small enough for an
  overshoot to read as arrival rather than wobble. Falls back to `--ease-out`
  below the `linear()` floor
- `docs/theming.md`: community theme authoring guidelines — the thirteen
  required Tier-1 colour tokens, the WCAG 2.2 AA ratios (with the 7:1 floor on
  `--fg`/`--bg` and `--fg`/`--surface`), file shape and submission steps
- Theme acceptance gate: `bun scripts/contrast-check.mjs <path/to/theme.css>`
  checks a candidate theme file (a contributor PR) for a `[data-theme="name"]`
  scope, all thirteen Tier-1 colour tokens, and every gated contrast pair.
  `bun run check` with no argument keeps checking the shipped themes, now
  including the vocabulary check
- `compositions/` — three reference pages agents can copy wholesale (dashboard,
  settings, auth), built only from the documented vocabulary and gated by axe
  alongside the kitchen sink
- Markup validator: `bun run check:markup` derives the legal `data-*` set from
  the table in `docs/public-surface.md` — no hand-maintained list — and fails on
  an unknown hook or any `class` attribute that reads as a utility stack

The nine new hooks across this release (`data-avatar`, `data-avatar-group`,
`data-empty`, `data-skeleton`, `data-form-row`, `data-nav`, `data-table`,
`data-button-group`, `data-scroll-progress`) are **additive and optional** — no existing markup changes
meaning — so they are a **minor**, not a major, per
[`docs/versioning.md`](docs/versioning.md), which reserves major for renaming,
removing, or changing the contract of existing surface. The two new
`--hk-tooltip-*` custom properties are read with fallbacks and never declared,
so they are additive too.

### Changed

- Light/dark Tier-1 `--muted` / tone tokens tightened so body text, links, and
  soft components clear WCAG AA under axe-core (sRGB), not only the OKLCH gate
- Soft badges/alerts use `--_tone-ink` (tone mixed toward `--fg`) for readable
  text on tinted surfaces
- Stepper completed state prefers preceding `aria-current="step"`; `aria-checked`
  on `<li>` is deprecated (still styled this minor; remove next major)
- Nord and Dracula `--muted` tokens adjusted for AA against `--bg` and `--surface`
- `--shadow-sm`, `--shadow`, `--shadow-lg` are now aliases onto elevation rungs
  1, 2 and 4, and moved from `base/tokens.css` to `base/elevation.css`. Slightly
  denser and tighter than before; no component edits required. The move is a fix,
  not cosmetics: `tokens.css` declared them on `[data-density]` as well as
  `:root`, so a Compact container re-declared the old values locally and beat the
  inherited aliases — shadows would have silently reverted inside any dense region
- `--elevation-*`, `--dur-fast`, `--dur-slow` and `--hk-value` are enumerated in
  [`docs/public-surface.md`](docs/public-surface.md), since the agent rules now
  name them
- **Toast** — the `[data-toast-region]` stack is now a `popover="manual"`, so
  toasts render in the top layer and stay visible over an open modal `<dialog>`
  (browsers without the Popover API fall back to the existing `z-index` layer).
  The stack is capped at the viewport and clips its oldest members instead of
  running off-screen, the auto-dismiss timer pauses on hover/focus, the ✕ is
  pinned at the 24px target-size floor in both densities, and `variant: "danger"`
  announces assertively while every other tone stays polite
- **Meter and range** — a `<meter>` at 0 no longer reads as half-full: the empty
  track is the same hairline as `<progress>`, and the `low`/`high`/`optimum` tones
  now paint in Firefox too. The range row is pinned to 24px in both densities for
  WCAG 2.2 §2.5.8, Compact thins only the groove, and the focus ring moved from
  the whole strip to the thumb
- **Breadcrumbs** — the `aria-current="page"` item is now the trail's emphasis
  (full `--fg` at label weight) rather than the most muted thing in the row
- **Pagination** — the disabled end lifts from `opacity: 0.4` to `0.5` and pins
  `color: var(--muted)`, so it stays legible without reading as active
- **Action menu** rows adopt the same disabled treatment, so the two inert states
  in the framework are one recipe
- **Card** — every `<article>` is now a container-query container. A leading
  `<figure>` floats into a media column at ≥26rem and stacks below that;
  `<footer>` buttons take the full column under 20rem. The stacked layout is the
  no-container-query fallback. Containment caveat: a card used as an auto-sized
  flex item no longer contributes its content's width
- **Navigation** — `[data-nav]` stacks into a column when its nearest query
  container (a card) is narrower than 22rem, so the same markup is a bar in a page
  header and a rail in a narrow card. No new hook
- **Action menu** rows that run an action now close their own menu, declaratively:
  `command="hide-popover" commandfor="<panel id>"`. Light dismiss only fires for
  clicks *outside* a popover, so before this a row left the panel open. It is a
  native invoker, not a click handler — no `aria-expanded` is added to the row,
  and focus returns to the trigger exactly as on `Esc`. On a browser without
  invoker commands *and* without `hikarion.js`, the row does not close the menu;
  `Esc` and light-dismiss still do. No new hook and no JS dependency
- Agent rules gained an **overlay invoker vocabulary** table (`popovertarget` as
  the default popover opener, `show-modal`/`close`/`request-close` for `<dialog>`,
  the `*-popover` commands for remote open/close) and state plainly that invoker
  commands are feature-detected separately from the Popover API

### Fixed

- `[hidden]` is honoured again on any component that sets `display`. The UA
  rule is specificity 0,1,0, so `[data-empty] { display: flex }` silently beat
  it and `el.hidden = true` stopped hiding an empty state. The reset now carries
  a doubled-specificity `[hidden][hidden]`, still unlayered-author-overridable

- **`prefers-contrast: more` now reaches consumer themes** — the `--muted`/`--border`
  retune ships unlayered. Inside `@layer hikarion` it was silently dead for any
  theme an author declares unlayered (the documented way to ship one), since
  unlayered CSS beats layered CSS at any specificity. Built-in themes were
  unaffected, which is why CI never saw it
- **Toast** — a toast shown while a modal `<dialog>` is open is no longer hidden
  behind it
- **Overlay placement fallback** — `[data-menu]` and `[popover="hint"]` gate their
  anchor positioning behind `@supports (anchor-name: --x)`. The unconditional
  `margin: 0` was cancelling the UA sheet's `inset: 0; margin: auto`, so in
  browsers without anchor positioning both surfaces opened in the viewport's
  top-left corner instead of falling back to centred placement. Anchored browsers
  are unaffected
- **`[data-tooltip]` is hoverable** (WCAG 2.2 1.4.13) — the bubble is hit-testable
  while shown and survives the pointer travelling onto it
- **Pagination** — buttons no longer inherit the raised button chrome
  (`--shadow-sm`, hover border, `:active` press-scale), so Prev/Next sit flat
  beside the number links instead of in a card
- **Pagination** — an elided range (`<span aria-hidden="true">…</span>`) now takes
  the page-item box without a pill, hover or pointer, so it can no longer be
  mistaken for a missed target
- **Breadcrumbs** — the separator chevron now mirrors under `:dir(rtl)`; a
  rotation is not direction-aware, so RTL trails previously pointed backwards
- A disabled `<select>` now dims and shows `not-allowed`, matching `button` and
  `input`

## [0.1.0] — 2026-07-12

### Added

- Initial public release of Hikarion UI: class-light CSS for semantic HTML,
  Tier-1 theming, community themes (nord, dracula, catppuccin), optional
  progressive-enhancement JS, agent rules, and kitchen-sink demo
