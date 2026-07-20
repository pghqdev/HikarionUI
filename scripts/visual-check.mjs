// Visual regression gate: kitchen-sink.html screenshotted across the theme ×
// density matrix and compared to the committed baselines in tests/visual/.
// Run after build: bun run check:visual   (add --update to re-baseline)
//
// Pixels are machine-dependent, so the capture always happens inside the pinned
// Playwright container — see docs/visual-regression.md. Outside it, this script
// re-invokes itself through docker.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";
import { serveRoot } from "./lib/serve.mjs";

const IMAGE = "mcr.microsoft.com/playwright:v1.61.1-noble";
// Above this share of differing pixels the run fails. Non-zero only to absorb
// anti-aliasing jitter between container runs. Calibrated, not guessed: repeat runs
// of an unchanged build measured 0.002% at worst, and a --radius change measured
// 0.22–0.26%, so 0.02% sits ~10x above the noise and ~10x below a real regression.
const THRESHOLD = 0.0002;
// Per-channel delta below which two pixels count as equal.
const CHANNEL_TOLERANCE = 12;

const root = fileURLToPath(new URL("..", import.meta.url));
const baselineDir = join(root, "tests/visual");
const update = process.argv.includes("--update");

if (!process.env.HIKARION_VISUAL_IN_CONTAINER) {
  // ponytail: skip rather than fail when the image isn't available locally — CI
  // runs this gate *inside* the image, so it is never skipped where it counts.
  // Pulling ~2 GB unasked in the middle of `bun run ci` would be worse.
  const has = (...cmd) => spawnSync(cmd[0], cmd.slice(1), { encoding: "utf8" });
  if (has("docker", "info").status !== 0) {
    console.log("• visual: docker unavailable, skipping (CI runs this gate in the container)");
    process.exit(0);
  }
  if (!has("docker", "images", "-q", IMAGE).stdout?.trim()) {
    console.log(`• visual: skipping — image not present. docker pull --platform linux/amd64 ${IMAGE}`);
    process.exit(0);
  }
  // The image already carries node + the matching browsers; it only needs the
  // repo mounted. No bun, no bun install — this script is plain node.
  // linux/amd64 is pinned, not left to the host: CI runs amd64, so an arm64 Mac
  // must emulate it or the baselines it writes would be for the wrong architecture.
  const args = ["run", "--rm", "--ipc=host", "--platform", "linux/amd64",
    "-v", `${root}:/w`, "-w", "/w",
    "-e", "HIKARION_VISUAL_IN_CONTAINER=1", IMAGE, "node", "scripts/visual-check.mjs"];
  if (update) args.push("--update");
  process.exit(spawnSync("docker", args, { stdio: "inherit" }).status ?? 1);
}

if (!existsSync(join(root, "dist/hikarion.css"))) {
  console.error("✗ dist/hikarion.css is required (run bun run build)");
  process.exit(1);
}

const themes = ["light", "dark", ...readdirSync(join(root, "src/themes")).filter((f) => f.endsWith(".css")).map((f) => f.replace(/\.css$/, ""))];
const densities = ["crisp", "compact"];

mkdirSync(baselineDir, { recursive: true });
const server = await serveRoot(root);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
  colorScheme: "light",
});
const page = await context.newPage();
const differ = await context.newPage();
await differ.goto("about:blank");

/** Share of pixels differing by more than CHANNEL_TOLERANCE on any channel. */
const diffRatio = (a, b) =>
  differ.evaluate(async ([ax, bx, tol]) => {
    const load = (b64) =>
      new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = "data:image/png;base64," + b64;
      });
    const [ia, ib] = await Promise.all([load(ax), load(bx)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return 1;
    const px = (img) => {
      const c = new OffscreenCanvas(img.width, img.height);
      c.getContext("2d").drawImage(img, 0, 0);
      return c.getContext("2d").getImageData(0, 0, img.width, img.height).data;
    };
    const da = px(ia), db = px(ib);
    let bad = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (
        Math.abs(da[i] - db[i]) > tol ||
        Math.abs(da[i + 1] - db[i + 1]) > tol ||
        Math.abs(da[i + 2] - db[i + 2]) > tol
      )
        bad++;
    }
    return bad / (da.length / 4);
  }, [a.toString("base64"), b.toString("base64"), CHANNEL_TOLERANCE]);

let failed = false;
let written = 0;
for (const theme of themes) {
  for (const density of densities) {
    const name = `${theme}-${density}.png`;
    await page.goto(`${server.origin}/kitchen-sink.html`, { waitUntil: "networkidle" });
    if (!["light", "dark"].includes(theme)) {
      await page.addStyleTag({ path: join(root, `dist/themes/${theme}.css`) });
    }
    await page.evaluate(([t, d]) => {
      document.documentElement.dataset.theme = t;
      document.documentElement.dataset.density = d;
    }, [theme, density]);
    const shot = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });

    const file = join(baselineDir, name);
    if (update) {
      writeFileSync(file, shot);
      written++;
      console.log(`↻ ${name} (written)`);
      continue;
    }
    if (!existsSync(file)) {
      // Never auto-accept: a baseline that writes itself on first run is not a gate.
      failed = true;
      writeFileSync(join(baselineDir, `${theme}-${density}.actual.png`), shot);
      console.error(`✗ ${name}: no committed baseline — commit the uploaded ${theme}-${density}.actual.png as ${name}`);
      continue;
    }
    const baseline = readFileSync(file);
    if (baseline.equals(shot)) {
      console.log(`✓ ${name}`);
      continue;
    }
    const ratio = await diffRatio(baseline, shot);
    if (ratio <= THRESHOLD) {
      console.log(`✓ ${name} (${(ratio * 100).toFixed(3)}% differing, within threshold)`);
      continue;
    }
    failed = true;
    writeFileSync(join(baselineDir, `${theme}-${density}.actual.png`), shot);
    console.error(`✗ ${name}: ${(ratio * 100).toFixed(3)}% of pixels differ — wrote ${theme}-${density}.actual.png`);
  }
}

await context.close();
await browser.close();
server.close();

if (failed) {
  console.error("\nIf the change is intentional: bun run check:visual -- --update, then commit tests/visual/.");
  process.exit(1);
}
console.log(`✓ visual: ${themes.length * densities.length} snapshots${written ? ` (${written} written)` : " matched"}`);
