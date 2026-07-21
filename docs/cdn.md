# CDN usage

One `<link>` is the whole install. Both jsDelivr and unpkg serve the published
npm package; pin the version, and add `integrity` if you want the browser to
verify the bytes.

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.min.css"
  integrity="sha384-…"
  crossorigin="anonymous">
```

unpkg is the same paths: `https://unpkg.com/hikarion-ui@0.1.0/dist/hikarion.min.css`.

An opt-in theme is one extra `<link>` plus `data-theme`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/themes/nord.min.css">
<body data-theme="nord">…</body>
```

The optional progressive-enhancement JS is a **separate** entry point and is
never required for styling — see [Optional JS](#optional-js) below:

```html
<script src="https://cdn.jsdelivr.net/npm/hikarion-ui@0.1.0/dist/hikarion.js" defer></script>
```

`integrity` is per-version: a hash below is only valid for the exact release it
was generated from. Bump the version in the URL and the hash together.

## Integrity hashes

<!-- sri:start -->
Generated for **v0.1.0** by `bun scripts/cdn-docs.mjs` (part of `bun run build`).

| File | `integrity` |
|------|-------------|
| `dist/hikarion.min.css` | `sha384-MsPz8BcWTSbHm7uSL+75zXWSFThjypVsl0kQ1PsA0+WSPJa5u6C1d99WeTeldSNi` |
| `dist/hikarion.css` | `sha384-3PbB9LlhvPjFz1wBZGXIN3P9fjGzsxyMA/tbC4NP5lhdmFJtOZfvSiX/b4t5Gie9` |
| `dist/hikarion.js` | `sha384-Izz30opAStRPoUVTCV+pSWmbh4IekPmyAtAxtLa4Ao/BcwPxEdN0h5AqQb61J5Wa` |
| `dist/themes/nord.min.css` | `sha384-zWGdcdTuFI+0oUj7gWilGuppC++uwPj6BGRRspchXuLvnERZc8eZRfX0CJOOPKr5` |
| `dist/themes/dracula.min.css` | `sha384-0nnDtePKlqxirgzDUpCSP/QUB22BNn7T2jTQIRtJYWJs2YywdbDZHxCA05t/6dh2` |
| `dist/themes/catppuccin.min.css` | `sha384-Ib1CpXG4K/pjKZ8VNwyDiJGB3Beu7uPl/pfZCCy4iOdR8UJLX7cqGU7Gmi5AU1Gi` |
<!-- sri:end -->

Regenerate them from `dist/` at any time:

```sh
bun run build          # rebuilds dist/ and rewrites the table above
bun scripts/cdn-docs.mjs   # table only, if dist/ is already current
```

The table is generated, never hand-edited. `bun run build` rewrites it, the
release workflow builds before publishing, and CI fails if the committed table
differs from the one the build produces — so it cannot silently rot.

## Source maps

`bun run build` emits `dist/hikarion.css.map` and `dist/hikarion.min.css.map`.
They ship inside `dist/`, so they reach both npm and the CDNs, and they are
attached to every GitHub Release alongside the CSS. A consumer debugging a
minified rule lands on the authoring partial in `src/`.

## Optional JS

`hikarion-ui/js` (`dist/hikarion.js`) is a separate export and a separate file.
Core styling has no dependency on it, verified rather than asserted:

- The CSS bundle is standalone — `dist/hikarion.css` contains no `url()`,
  `@import`, or reference to any script, and the package entry `.` resolves to
  the CSS alone.
- The only selectors keyed off JS-set state are for markup that **only exists
  when the JS runs** (`[data-toast]`, the `<pre>` copy button) or for transient
  enhancement states on an already-styled element (`[data-dragover]`,
  `[data-chosen]`, `[data-copied]`).
- Components that JS enhances degrade to visible content, not broken layout:
  with no JS, every `[data-tab-panel]` stays visible and stacked.

Loading the JS is a choice about behaviour, never about appearance.

## Critical / layer subset — deferred

There is no `hikarion.critical.css` or per-layer subset build, deliberately.

The whole core bundle is **~6 kB gzipped** against an 18 kB budget
(`bun run check:size` — the gate that keeps that true). A subset saves at most a
few kB of a file that is already smaller than one webfont, in exchange for a
second artifact to version, hash, document, and keep in sync with `src/`.

Revisit if `check:size` gets within reach of the budget, or if a consumer
reports a measured render-blocking cost — not before.
