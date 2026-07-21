# Overriding & adopting Hikarion

How to customise Hikarion without fighting it, and what happens when you drop it
into a codebase that already has CSS.

## The one mechanism

Everything Hikarion ships is inside `@layer hikarion` — with one deliberate
exception, the `prefers-contrast: more` token retune (see below). In the
cascade, **any unlayered CSS beats any layered CSS, regardless of specificity or
source order.**

```css
/* Hikarion, in the stylesheet you linked */
@layer hikarion {
  button { border-radius: var(--radius-sm); }
}

/* You, in your own stylesheet — no layer, no !important */
button { border-radius: 0; }   /* wins */
```

Three consequences worth internalising:

- **`!important` is never the answer.** If you reached for it, you had already
  won. It only makes the rule harder for the *next* person to override.
- **Link order does not matter.** Your stylesheet can load before or after
  Hikarion's; unlayered still wins. (Order matters between two unlayered rules —
  normal cascade applies there.)
- **A one-word selector beats Hikarion's most specific one.** You do not need
  `body article > h3:first-child`. `h3` is enough.

## The escalation ladder

Stop at the first rung that works.

1. **Change a Tier-1 token.** Covers most of what people call "customising a
   framework": colour, radius, spacing rhythm, type stack, motion feel. One
   declaration re-lights the whole page, shadows included.
2. **Ship a theme.** A named palette you can switch to and nest.
3. **Write a plain unlayered rule.** For a component whose *shape* you want
   different, not just its colour.
4. **Own the component.** Stop using the hook, write your own element. Hikarion
   styles nothing it has no selector for.

There is no rung 5. If you find yourself at `!important`, re-read rung 3.

### 1. Retune the tokens

```css
:root {
  --accent: oklch(62% 0.17 190);
  --radius: 0.25rem;   /* squarer */
  --space: 0.4rem;     /* tighter rhythm everywhere */
  --font: "Inter", system-ui, sans-serif;
}
```

Set Tier-1 only. Tier-2 (`--space-4`, `--radius-sm`, `--elevation-3`, …) derives
from Tier-1 and is recomputed on every theme and density container — overwrite a
Tier-2 token on `:root` and it will be recomputed back out from under you inside
any `[data-theme]` or `[data-density]` subtree. See
[tokens.md](./tokens.md) for the full list and the formulas.

### 2. Ship a theme

A theme is Tier-1 and nothing else. Declare it unlayered and it wins over the
built-ins; nest it anywhere.

```css
[data-theme="brand"] {
  color-scheme: dark;
  --bg: oklch(18% 0.02 280);
  --fg: oklch(95% 0.01 280);
  --surface: oklch(22% 0.025 280);
  --muted: oklch(72% 0.02 280);
  --border: oklch(32% 0.02 280);
  --accent: oklch(74% 0.16 300);
  --accent-content: oklch(18% 0.03 280);
  /* …plus the six status tokens; all thirteen or the theme is incomplete */
}
```

```html
<body data-theme="brand">
  <aside data-theme="light">A light island in a dark page.</aside>
</body>
```

Two rules a theme must hold up, both machine-checked by `bun run check` on the
built-in themes and worth checking on yours:

- every `<tone>` / `<tone>-content` pair clears 4.5:1;
- `--accent` clears 4.5:1 on **both** `--bg` and `--surface`, since it is a link
  colour and a border, not only a fill.

Point the gate at your own file to check it: `bun scripts/contrast-check.mjs
path/to/theme.css`. If you want the theme shipped with Hikarion, the full bar is
[theming.md](./theming.md).

`prefers-contrast: more` and `forced-colors: active` are handled for you: the
contrast pass is written in terms of *your* `--fg`. It is the one unlayered
block in Hikarion, and it has to be: your theme is unlayered too, and unlayered
beats layered at any specificity — layered, the retune would be dead for every
theme but the built-ins. Unlayered, its doubled `[data-theme][data-theme]`
selector sits one step above your `[data-theme="…"]` scope and wins on
specificity. It touches only `--muted` and `--border`; to opt out, override at
(0,3,0). If you want a permanently high-contrast look
regardless of the OS setting, ship it as a theme — that is what themes are for.

### 3. Restyle a component

```css
/* Square, louder buttons — unlayered, no !important, no specificity games. */
button {
  border-radius: 0;
  font-weight: 600;
}

/* A card with no hairline in one region of your app. */
.report article {
  border: 0;
  box-shadow: var(--elevation-0);
}
```

Prefer reading a Hikarion token in your override (`var(--elevation-0)`,
`var(--space-4)`) over a magic number — then your override still follows the
theme and the density.

### 4. Opt out entirely

Hikarion styles bare tags and its own `data-*` hooks. Both are opt-outable:

```html
<div role="group">…</div>   <!-- not <article>: no card styling -->
<div id="m" popover>…</div> <!-- no data-menu: a bare native popover -->
```

There is no `data-unstyled` escape hatch and no per-component build. The
published package is one bundled stylesheet; `src/` partials are not exported,
so you cannot import `components/table.css` alone. If you need that, vendor the
repo and build it yourself with Lightning CSS — but the whole bundle is ~8.7 kB
gzipped, which is smaller than most escape hatches.

## If you already have layers

Cascade layers sort by **first declaration**, not by where the rules are. If your
own CSS uses layers, declare the order yourself so it cannot depend on which
`<link>` the browser parsed first:

```css
/* First line of your entry stylesheet. */
@layer hikarion, app;

@layer app {
  button { border-radius: 0; }   /* wins: `app` sorts after `hikarion` */
}
```

Without that line, a layer you declare in a file that loads *before* Hikarion
sorts *before* `hikarion` and loses. Unlayered CSS avoids the whole question,
which is why it is the default advice.

## Adopting into an existing codebase

Hikarion is unusually easy to add and unusually easy to be *disappointed by*, for
the same reason: it yields.

- **Your existing CSS wins.** It is unlayered, so it beats Hikarion everywhere it
  has a selector. Adding the `<link>` to a fully-styled app will change very
  little — that is the design, not a failure to apply.
- **Where it will show up** is the gaps: unstyled `<table>`s, bare form
  controls, `<details>`, `<dialog>`, `<pre>` — anything your CSS never had a rule
  for.
- **Do not add a second reset.** Hikarion includes one. A Tailwind Preflight or
  Normalize loaded unlayered will beat it and you will get neither look cleanly.
- **Do not port utility classes across.** If you're mid-migration, keep the two
  systems in separate regions of the page rather than on the same element.

A realistic order for an incremental migration:

1. Link Hikarion. Nothing should visibly break; if something does, that is your
   CSS relying on a UA default Hikarion changed.
2. Map your palette onto the thirteen Tier-1 colour tokens. Delete your own
   colour variables.
3. Take one page. Delete its wrapper classes, use the semantic element, keep only
   the layout CSS that is genuinely yours (grid, page shell, one-offs).
4. Repeat. Delete component CSS as the hooks replace it.

Layout is always yours. The rule against freestyling classes is about
*restyling Hikarion's components* with utility soup, not about you owning your
page's grid.

## What not to override

| Don't | Because |
|-------|---------|
| Tier-2 tokens | Recomputed per theme/density container; your value evaporates in any nested one. |
| `--_`-prefixed tokens | Private. Renamed without a major bump. |
| Undocumented `data-*` (`data-dragover`, `data-chosen`, `data-closing`, `data-copied`) | Runtime state written by `hikarion.js`. Not a styling surface. |
| The tone resolver (`base/tone.css`) | One seam maps a tone word to local values; every component reads it. Fork it and the tones stop agreeing. |
| Adding a third `data-density` value | Nothing derives from an unknown value — you would get Crisp. Density is two values by design. |

See [versioning.md](./versioning.md) for what is frozen and
[public-surface.md](./public-surface.md) for the exact list.
