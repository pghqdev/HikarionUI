# Contributing a theme

A Hikarion theme is a palette and nothing else: the thirteen Tier-1 colour
tokens under one `[data-theme="name"]` scope. Non-colour Tier-1 (`--radius`,
`--space`, `--dur`, `--ease-hikarion`, `--font`, `--mono`) and every Tier-2
token inherit from core — a theme that sets them is not a theme, it is a fork.

If you are theming *your own app*, read [overrides.md](./overrides.md) instead;
this page is the bar for a theme shipped in `src/themes/`.

## The gate

```sh
bun scripts/contrast-check.mjs src/themes/your-theme.css
```

Exit 0 or the theme is not accepted. It fails on three things:

1. **No `[data-theme="name"]` scope.** A theme must namespace its palette.
   Setting tokens on `:root` makes it the default for everyone.
2. **A missing Tier-1 colour token.** All thirteen, listed below. Omitting one
   looks fine at the top level (it inherits core) and breaks the moment the
   theme is nested inside another one, where the inherited value belongs to the
   wrong palette.
3. **A pair under the ratio.** WCAG 2.2 AA is 4.5:1 for body text; two pairs
   carry a 7:1 floor because `prefers-contrast: more` aliases `--muted` and
   `--border` onto `--fg`, and "more contrast" has to measure as more.

| Pair | Floor | Why |
|---|---|---|
| `--fg` on `--bg` | **7:1** | also the `prefers-contrast` floor |
| `--fg` on `--surface` | **7:1** | same |
| `--muted` on `--bg`, on `--surface` | 4.5:1 | secondary text is still text |
| `--accent` on `--bg`, on `--surface` | 4.5:1 | accent is a link and a border, not only a fill |
| each `<tone>` on `<tone>-content` | 4.5:1 | text on a solid `data-variant="… solid"` fill |

`bun run check` (no argument) runs the same checks over `src/base/tokens.css`
and every theme already in `src/themes/`, and runs in CI.

## The thirteen

All six status tokens are Tier-1, not optional extras — components read
`--success`/`--warning`/`--danger` unconditionally, and
[ADR 0002](./adr/0002-no-info-tone.md) fixes the tone list at four, so there is
no fifth pair to add either.

| | |
|---|---|
| Surfaces | `--bg` `--surface` |
| Text | `--fg` `--muted` |
| Line | `--border` |
| Tones | `--accent` `--accent-content` `--success` `--success-content` `--warning` `--warning-content` `--danger` `--danger-content` |

Write them in `oklch()` — the gate parses `oklch()` and only `oklch()`, so a
hex value reads as *missing*. It also keeps a palette adjustable by lightness
alone, which is how most contrast failures get fixed.

## Shape

```css
/* Nord — an arctic, north-bluish palette. Opt in with one extra <link> and
   data-theme="nord". Palette only: the non-colour Tier-1 (radius, space, motion,
   fonts) and all Tier-2 tokens inherit from core. */
@layer hikarion {
  [data-theme="nord"] {
    color-scheme: dark;

    --bg: oklch(32.4% 0.023 264.2);
    /* … */
  }
}
```

- `@layer hikarion` — shipped themes are layered so consumer CSS still wins
  without `!important`. (A theme in *your* app should be unlayered; see
  [overrides.md](./overrides.md).)
- `color-scheme` — set it, or form controls and scrollbars keep the OS default.
- Comment any value that had to leave the source palette to clear the gate.
  Nord's aurora red is the worked example: a mid-tone that cannot clear 4.5:1
  against either light or dark text, so it was deepened.

## Submitting

1. `src/themes/<name>.css`, one file, no imports.
2. `bun scripts/contrast-check.mjs src/themes/<name>.css` passes.
3. `bun run build` regenerates `dist/themes/<name>.css`.
4. Add the theme to the kitchen-sink theme control and to the `data-theme` row
   in [public-surface.md](./public-surface.md); the visual gate needs a
   baseline (`bun run check:visual --update`).

A theme is a **minor** version bump ([versioning.md](./versioning.md)) — it adds
a `data-theme` value and nothing else.
