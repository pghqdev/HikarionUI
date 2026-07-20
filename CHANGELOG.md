# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Public surface and deprecation rules: [`docs/versioning.md`](docs/versioning.md),
[`docs/public-surface.md`](docs/public-surface.md).

## [Unreleased]

### Added

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

All five new hooks (`data-avatar`, `data-avatar-group`, `data-empty`,
`data-skeleton`, `data-form-row`) are **additive and optional** — no existing
markup changes meaning — so they are a **minor**, not a major, per
[`docs/versioning.md`](docs/versioning.md), which reserves major for renaming,
removing, or changing the contract of existing surface.

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

## [0.1.0] — 2026-07-12

### Added

- Initial public release of Hikarion UI: class-light CSS for semantic HTML,
  Tier-1 theming, community themes (nord, dracula, catppuccin), optional
  progressive-enhancement JS, agent rules, and kitchen-sink demo
