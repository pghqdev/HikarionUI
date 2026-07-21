# Token reference

Every custom property Hikarion declares, what it computes to, and who owns it.
Verified against `src/` — if this file and `src/` disagree, `src/` is right and
this is a bug.

**Which of these you may depend on** is a separate question, answered by
[`public-surface.md`](./public-surface.md). Tier-1 and the handful of derived
tokens listed there are frozen surface. Everything else on this page is
*documented but internal*: read it to understand the system, don't build on it.

## Tier-1 — the theme

Nineteen tokens. Set them on `:root` or any `[data-theme]` container and the
whole framework re-lights. A theme sets all of them and nothing else.
Declared in `src/base/tokens.css`.

| Token | Role | Light default |
|-------|------|---------------|
| `--bg` | Page canvas | `oklch(99% 0.004 250)` |
| `--fg` | Primary text | `oklch(24% 0.02 260)` |
| `--surface` | Raised surface | `oklch(97% 0.006 250)` |
| `--muted` | Secondary text | `oklch(44% 0.02 260)` |
| `--border` | Hairline / control edge | `oklch(90% 0.008 260)` |
| `--accent` | Brand / primary tone | `oklch(48% 0.2 258)` |
| `--accent-content` | Text on solid accent | `oklch(99% 0.01 258)` |
| `--success` | Success tone | `oklch(46% 0.14 150)` |
| `--success-content` | Text on solid success | `oklch(99% 0.02 150)` |
| `--warning` | Warning tone | `oklch(72% 0.15 78)` |
| `--warning-content` | Text on solid warning | `oklch(28% 0.05 78)` |
| `--danger` | Danger tone | `oklch(50% 0.2 27)` |
| `--danger-content` | Text on solid danger | `oklch(99% 0.02 27)` |
| `--radius` | Base corner radius | `0.875rem` |
| `--space` | Base spacing unit | `0.5rem` |
| `--ease-hikarion` | Default easing | `cubic-bezier(0.2, 0, 0, 1)` |
| `--dur` | Default duration | `0.16s` |
| `--font` | UI sans stack | `system-ui, -apple-system, "Segoe UI", sans-serif` |
| `--mono` | Monospace stack | `ui-monospace, "SF Mono", "Cascadia Code", monospace` |

Six status tokens, three pairs plus accent: each `<tone>` / `<tone>-content`
pair must clear 4.5:1, and `bun run check` fails the build if a theme drifts.
`--accent` additionally has to clear 4.5:1 on both `--bg` and `--surface`,
because it is used as link colour and as a border, not only as a fill.

`--space` and `--radius` are **base units, never used raw** by components. They
feed the scales below, which is why changing one of them moves the whole page
coherently instead of one padding somewhere.

## Tier-2 — derived

You never set these. They are listed so you can read the CSS and predict what a
Tier-1 change will do.

### Scales — recomputed per theme *and* per density container

Declared on `:root, [data-theme], [data-density]` in `src/base/tokens.css`.
`[data-density]` is in that selector list on purpose: a density container has to
recompute the scale rather than inherit the enclosing container's already-computed
steps.

| Token | Formula |
|-------|---------|
| `--space-1` … `--space-8` | `--space × {0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4} × --_density` |
| `--control-py` | `0.5rem × --_density` |
| `--control-px` | `0.95rem × --_density` |
| `--field-py` | `0.6rem × --_density` |
| `--field-px` | `0.85rem × --_density` |
| `--control-fz` | `0.9375rem × --_density-type` |
| `--control-fz-sm` | `0.875rem × --_density-type` |
| `--radius-sm` | `--radius − 0.25rem` |
| `--radius-xs` | `--radius − 0.375rem` |
| `--radius-pill` | `999px` |
| `--surface-2` | `--surface` mixed with 5% `--fg` |
| `--hover` | same recipe as `--surface-2` |
| `--line` | `--border` at 65% alpha — the inner hairline, lighter than an outer edge |
| `--shadow-color` | 30% `--accent` in `oklch(18% 0.01 260)` — why a theme swap re-lights shadows |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` — entrances |
| `--dur-enter` / `--dur-exit` | `0.13s` / `0.11s` — the overlay pop recipe |
| `--chevron` | The one chevron SVG: select arrow, dropdown trigger, accordion marker |

`--_density` (`1` / `0.75`) and `--_density-type` (`1` / `0.9375`) are private.
They are declared on `:root` and `[data-density]` **only**, never on
`[data-theme]` — otherwise a themed region nested inside a Compact container
would silently reset itself to Crisp.

### Elevation — recomputed per theme

`src/base/elevation.css`, declared on `:root, [data-theme]`.

| Token | Meaning | Typical use |
|-------|---------|-------------|
| `--elevation-0` | flush — in the page | bordered blocks |
| `--elevation-1` | raised — attached | cards, fields, resting buttons |
| `--elevation-2` | lifted — under the pointer | hover |
| `--elevation-3` | floating — off the page | dropdowns, tooltips |
| `--elevation-4` | overlay — above everything | dialogs, toasts |
| `--shadow-sm` / `--shadow` / `--shadow-lg` | aliases for rungs 1, 2 and 4 | legacy names, still supported |

Every rung is one tight contact layer plus one ambient layer, both inked from
`--shadow-color`. Under `prefers-contrast: more` the two inks densify and the
rungs recompute — same geometry, more ink.

Elevation is deliberately **not** redeclared on `[data-density]`. Doing so would
re-declare the old values inside every Compact region and beat the inherited
aliases locally, so shadows would revert.

### Type — `:root` only

`src/base/type.css`. Static values, so there is nothing to recompute per theme.

| Token | Value | Used by |
|-------|-------|---------|
| `--text-1` | `clamp(2.5rem, 1.85rem + 2.6vw, 3.375rem)` | `h1` (the only fluid step) |
| `--text-2` | `2rem` | `h2` |
| `--text-3` | `1.4375rem` | `h3` |
| `--text-4` | `1.0625rem` | `h4` |
| `--text-label` | `0.9375rem` | `h5`, small bold run-ins |
| `--text-eyebrow` | `0.75rem` | `h6`, tracked-out eyebrows |

Type is density-invariant. Density tightens chrome, not reading matter.

### Motion — `:root` only

`src/base/motion.css`.

| Token | Value | When |
|-------|-------|------|
| `--dur-fast` | `0.09s` | a state flip that must feel instantaneous |
| `--dur-slow` | `0.24s` | travel far enough that instant reads as a teleport |
| `--ease-spring` | damped `linear()`, ~6% overshoot | small direct-manipulation travel — the switch thumb. Overshoot on a dialog-sized surface reads as wobble, so overlays keep `--ease-hikarion`. Falls back to `--ease-out` where `linear()` is unsupported |

`--dur` and `--ease-hikarion` (Tier-1) remain the default pairing. All of it is
neutralised globally under `prefers-reduced-motion` — see
[`accessibility.md`](./accessibility.md) for the two cases a global killswitch
structurally cannot reach.

## Tokens you set on an element

Three, all `--hk-` prefixed. These are the only custom properties Hikarion asks
an author to write, and each has a fallback so omitting it is safe.

| Token | On | Default | Effect |
|-------|----|---------|--------|
| `--hk-value` | `[data-spinner][role="progressbar"]` | `0` | Ring fill, `0`–`100`. CSS cannot read `aria-valuenow`, so the number has to arrive twice. |
| `--hk-tooltip-delay` | `[data-tooltip]` | `0.4s` | Show delay |
| `--hk-tooltip-delay-out` | `[data-tooltip]` | `--dur-slow` | Hide delay. Load-bearing: at `0` the bubble stops being hoverable, which fails WCAG 2.2 §1.4.13. |

```html
<span data-spinner role="progressbar" aria-valuenow="62"
      aria-valuemin="0" aria-valuemax="100" style="--hk-value: 62"></span>
```

## Density

`data-density` is a container attribute exactly like `data-theme`: two values,
`crisp` (default) and `compact`, nestable, pure CSS with no JS behind it. The
author-facing contract — where to put it, why there is no per-component size
variant — is in
[the rules file](../rules/hikarion-rules.md#density).

What it actually moves is the two multipliers above, and therefore: every
`--space-*` step, control and field padding, control type, field `<label>`s and
`<thead>` column headers. Every shipped component sits on that scale or states
in its file header why it does not — density is the framework's second axis
beside `data-theme`, not a polish pass over a comfortable default.

What it deliberately does **not** move, and why:

| Untouched | Why |
|-----------|-----|
| `[data-badge]`, `[data-spinner]` | Sized in `em`. They take density from the type of whatever hosts them; reading a control step too would scale them twice, and a badge in an `<h2>` would render at form-control size. |
| `--text-1` … `--text-eyebrow`, body copy, code blocks | Dense ≠ harder to read. Compact is for more rows on screen, not smaller prose. |
| The switch track (24px) | WCAG 2.2 §2.5.8 target size. Compact has no room to shrink it. |
| Pagination pills, the toast close button | Same floor. Both are verified at both densities by `bun run check:a11y`. |
| `[data-scroll-progress]` (3px) | Already the thinnest honest hairline. |
| The elevation ladder | Depth is a material property, not a spacing one — and redeclaring it per density would break the aliases (see above). |
| `select[multiple]` row height | `size="N"` reserves height for N *unstyled* rows; density reaches those rows through the inline inset only. |

Compact is a 0.75× chrome scale, not a different design. If a layout only works
in one of the two densities, that is a bug in the layout — both are gated by the
axe and visual checks.

## Playground

The [docs site](https://pghqdev.github.io/HikarionUI/) drives `--accent`,
`--radius`, `--space` and `data-density` live, so you can watch Tier-2 re-derive
from Tier-1 rather than take this page's word for it.
