<div align="center">

# Hikarion UI

**Bare HTML, quietly tasteful.**

A class-light CSS framework for semantic HTML. Bare tags look great with no
classes; a small `data-*` vocabulary adds variants; a `data-theme` container
re-lights the whole page — shadows and all — from ~20 tokens.

*Minimalistic. Tasteful. Snappy.*

[Docs & live playground](https://pghqdev.github.io/HikarionUI/) · [Agent rules](rules/hikarion-rules.md) · [npm](https://www.npmjs.com/package/hikarion-ui)

</div>

---

## Why

Developers — increasingly AI coding agents at the keyboard — need UI that looks
good without styling work. Models write excellent semantic HTML but freestyle
inconsistent utility classes, and every result looks like the same AI slop.
Classless frameworks (Pico, Water) are too minimal to build real UIs;
class-heavy ones (Bootstrap, DaisyUI) trade away the semantic-HTML identity.

Hikarion makes **bare semantic HTML** genuinely tasteful by default, themes
beautifully from a tiny token set, and ships an [agent-adoption
layer](#for-coding-agents) so an agent told to "use Hikarion" inherits taste
instead of freestyling.

## Quick start

One `<link>` is the whole install:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.min.css">
<script src="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.js" defer></script>
```

Pin a version and add `integrity` for subresource verification — hashes and
unpkg/theme URLs are in [docs/cdn.md](docs/cdn.md).

Or via npm:

```sh
npm install hikarion-ui
```
```js
import "hikarion-ui";          // hikarion.css
import "hikarion-ui/js";       // optional progressive enhancement
```

Then just write HTML — no classes:

```html
<button>Just works</button>
<button data-variant="solid">Primary</button>
<article>
  <h3>A card</h3>
  <p>Bare &lt;article&gt; — a quiet surface with a hairline.</p>
</article>
```

## How it works

- **Class-light.** Bare semantic tags are styled by default. Variants come from
  native attributes and a small `data-*` vocabulary — never utility classes.
- **~20 tokens are a theme.** Tier-1 is a hard-capped set of tokens that *are* a
  theme (`--bg --fg --surface --accent --accent-content --radius --space …`).
  Tier-2 (spacing scale, radius scale, shadows, tints) derives from Tier-1 via
  OKLCH `color-mix()` — you never touch it. Switch the accent and the shadows
  re-tint for free.
- **`data-theme` swaps everything.** Set it on any container; themes nest. Dark
  mode is automatic from the OS, overridable per-region.
- **`data-density` retunes the rhythm.** `crisp` (default) for product UI,
  `compact` for dense views. CSS-only, and it nests like `data-theme`.
- **Your overrides always win.** Everything is wrapped in `@layer hikarion`, so
  any unlayered CSS you write beats it — no `!important` needed.

## Components

Buttons · card (`<article>`) · badge · chip · alert · toast · tabs · accordion
(`<details>`) · dialog (native `<dialog>`) · dropdown (native popover) · tooltip
· styled forms with native `:user-invalid` validation. Every one is bare
semantic HTML plus, at most, one `data-*` hook. See the [full
vocabulary](rules/hikarion-rules.md).

The one variant grammar, everywhere:

```html
<span data-badge data-variant="success">Passing</span>
<div role="alert" data-variant="danger">Something failed</div>
<button data-variant="danger solid">Delete</button>
```
`data-variant="<tone> [solid]"`, tone ∈ `accent` `success` `warning` `danger`.

## Themes

Ships light and dark; opt into more with one extra `<link>` and `data-theme`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/themes/nord.min.css">
<body data-theme="nord">…</body>
```

Included: **nord**, **dracula**, **catppuccin**. A theme is ~13 colour tokens
and nothing else; every `accent`/`success`/`warning`/`danger` pairs with a
readable `-content` token, gated at 4.5:1 contrast by `bun run check`.

## For coding agents

Point your agent at the canonical rules and it writes tasteful Hikarion markup
instead of utility-class slop. Install the Claude Code Skill:

```sh
curl -fsSL https://raw.githubusercontent.com/pghqdev/HikarionUI/main/skills.sh | sh
```

All three surfaces derive from one source ([`rules/hikarion-rules.md`](rules/hikarion-rules.md)):

- **Skill** — `skills.sh` above (add `-s -- --global` for user scope).
- **`AGENTS.md`** — drop into a consuming repo as project rules.
- **`llms.txt`** — served at the docs domain root for doc-fetchers.

## Browser support

Modern evergreen browsers. Hikarion uses OKLCH, `color-mix()`, `@layer`, `:has()`,
native popover and `<dialog>` — no legacy fallbacks, by design.

## Development

```sh
bun install
bun run build       # bundle CSS + themes, generate agent surfaces (Lightning CSS)
bun run check       # contrast gate: tone pairs + body text pairs ≥ 4.5:1
bun test            # unit tests for check scripts
bun run typecheck   # JSDoc check on the optional JS surface
bun run lint:css    # Stylelint + utility-class bans
bun run check:size  # gzip budget for dist/hikarion.min.css (after build)
bun run check:a11y  # axe-core against kitchen-sink.html (after build)
bun run ci          # full quality gate
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for vocabulary/RFC expectations,
[docs/versioning.md](docs/versioning.md) for SemVer + deprecation policy, and
[docs/accessibility.md](docs/accessibility.md) for the keyboard, ARIA and
no-JavaScript contract (including what genuinely degrades without JS).
[docs/visual-regression.md](docs/visual-regression.md) covers the screenshot
baselines and how to update them.

The framework is authored in plain modern CSS partials under `src/`; Lightning
CSS is the only runtime build dependency and the shipped artifact is
runtime-dependency-free. The docs site lives in `site/` (Astro).

## What Hikarion deliberately doesn't do

No utility classes. No JS framework. No build step for you. It styles pages you
own and yields to any pre-existing site CSS — that's the trade for zero-config
taste, not an oversight.

## License

[MIT](LICENSE)
