# Visual regression

`kitchen-sink.html` is the baseline page. `scripts/visual-check.mjs` screenshots it
across the full matrix of shipped themes × density modes and compares each shot to a
committed PNG in `tests/visual/`.

The matrix is generated, not enumerated: themes are `light`, `dark` plus every file in
`src/themes/`, densities are `crisp` and `compact`. Adding a theme adds two snapshots
with no edit to the script.

```
bun run check:visual            # gate (part of bun run ci)
bun run check:visual --update   # re-baseline, then commit tests/visual/
```

A missing baseline is a **failure**, never an auto-accept — a snapshot that writes
itself on first run is not a gate. The failing run writes the capture as
`<name>.actual.png` and CI uploads it as the `visual-diffs` artifact, so the first
baselines are produced by committing that artifact.

## Updating baselines intentionally

1. Make the CSS change and `bun run build`.
2. `bun run check:visual` — read the failure. It writes `tests/visual/<name>.actual.png`
   (gitignored) beside the baseline so you can eyeball the two.
3. If the difference is what you meant, `bun run check:visual --update`.
4. Commit `tests/visual/` **in the same commit as the CSS change**. A baseline update
   with no style change in the diff is the review smell to look for.

## How machine-dependence is handled

Screenshots are not portable: font rasterisation, GPU compositing and driver versions
all move pixels. Rather than fight that with a large tolerance, the capture is pinned:

- **Containerised run.** Every capture — the committed baselines, your local check, and
  CI — happens inside `mcr.microsoft.com/playwright:v1.61.1-noble`. On a host, the
  script re-invokes itself through `docker run` with the repo mounted; in CI the `visual`
  job *is* that container. Same fonts, same browser build, same freetype.
- **Fixed viewport** 1280×900, `deviceScaleFactor: 1`, `colorScheme: light` (the theme is
  set explicitly on `<html>`, so the OS preference must not leak in), full-page shot.
- **Animations disabled** via `reducedMotion: "reduce"` plus Playwright's
  `animations: "disabled"`, and `caret: "hide"`.
- **Threshold** 0.02% of pixels, where a pixel counts as different only if a channel
  moves by more than 12/255. Calibrated against measurements, not guessed: repeated runs
  of an unchanged build differ by at most 0.002%, while bumping `--radius` moved
  0.22–0.26% of pixels. The threshold sits ~10x above the noise and ~10x below that. Byte-identical images short-circuit before any decoding. The
  comparison itself runs in the browser via `OffscreenCanvas` — no image-diff dependency.

### Known ceiling

- **The container is the only supported capture environment.** If Docker is missing, or
  the image is not already pulled, the gate *skips with a notice* rather than failing:
  a baseline captured on a bare macOS or Windows host would be wrong for everyone else,
  and pulling ~2 GB in the middle of `bun run ci` is worse than skipping. A contributor
  without the image therefore gets no visual coverage locally — CI is the backstop. Opt
  in with `docker pull --platform linux/amd64 mcr.microsoft.com/playwright:v1.61.1-noble`.
- **Arm hosts emulate.** The run is pinned to `--platform linux/amd64` because CI is
  amd64. On an Apple-silicon machine that means Rosetta/QEMU emulation: correct pixels,
  but a slow first run (the image is ~2 GB and the capture takes minutes).
- **The threshold still hides very small changes.** A one-pixel shift on a single control
  inside a ~1280×9000 full-page screenshot can fall under 0.02%. This gate catches layout
  and colour regressions, not sub-pixel ones; the contrast and a11y gates cover what it cannot see.
- **One page, one width.** No responsive breakpoints, no hover/focus/open states beyond
  whatever the kitchen sink renders at rest.
- **~6.7 MB of PNGs in git**, and a re-baseline rewrites all ten. Acceptable once; if
  updates become frequent, narrow the capture before widening the repo.
- **Baseline PNGs are binary in git.** They do not diff in review — the `.actual.png`
  artifact uploaded by the failing CI job is how you inspect a regression.
