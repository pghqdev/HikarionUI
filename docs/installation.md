# Installation

Hikarion is one stylesheet. There is no build step, no config file, and no
component library to import — you write semantic HTML and it looks right.

## CDN

The fastest path, and the one to use if you are trying it out. Pin the version;
see [CDN & pinning](./cdn.md) for integrity hashes.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.min.css">
```

That is the whole install. `<button>`, `<table>`, `<dialog>` and the rest are
styled from here on.

## npm

```bash
bun add hikarion-ui   # or npm / pnpm / yarn
```

Then import the CSS from your entry point:

```js
import "hikarion-ui";        // dist/hikarion.css
import "hikarion-ui/min";    // or the minified build
```

Bundler-less setups can link the file directly:

```html
<link rel="stylesheet" href="/node_modules/hikarion-ui/dist/hikarion.min.css">
```

## Optional JavaScript

Nothing about the styling needs JS. One small script adds the behaviours the
platform does not have yet — toasts, tooltip delay, scroll progress. Load it
only if you use them:

```html
<script src="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.js" defer></script>
```

```js
import "hikarion-ui/js";
```

## A theme

Themes are opt-in stylesheets that set the 19 Tier-1 tokens. Link one and name
it on any container:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/themes/nord.min.css">
<body data-theme="nord">…</body>
```

Light and dark are built in and follow the system by default. Writing your own
theme is 19 custom properties — see [Theming](./theming.md).

## Density

`data-density="compact"` on any container tightens chrome for
information-dense screens. It nests, so a compact table can live inside a crisp
page.

```html
<section data-density="compact">…</section>
```

## For coding agents

Point your agent at the canonical vocabulary file so it generates on-vocabulary
markup instead of guessing:

```bash
curl -o AGENTS.md https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/rules/hikarion-rules.md
```

`llms.txt` and an installable agent skill ship alongside it — see the Agents
page.

## Verify

Drop this in a blank page. If the button has a filled accent and the card has a
soft accent-tinted shadow, you are installed.

```html
<article>
  <h3>It works</h3>
  <p>Bare HTML, no classes.</p>
  <button data-variant="solid">Primary</button>
</article>
```
