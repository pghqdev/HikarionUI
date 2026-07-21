// Social / AEO card → site/public/og.png. Built, not drawn: the card is a Hikarion
// page rendered with the built stylesheet, so it re-lights with the framework
// instead of drifting into a stale export from a design tool.
// Run after build: bun run build:og  (the site's prebuild does it)
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { serveRoot } from "./lib/serve.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
if (!existsSync(join(root, "dist/hikarion.css"))) {
  console.error("✗ dist/hikarion.css is required (run bun run build)");
  process.exit(1);
}

// Facebook, X, LinkedIn and Slack all crop to 1.91:1; 1200×630 is that at the
// size every one of them accepts without re-encoding.
const [W, H] = [1200, 630];

const card = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/dist/hikarion.css">
  <style>
    body { margin: 0; display: grid; place-items: center; block-size: ${H}px; }
    main { inline-size: 100%; padding: 0 5rem; }
    h1 { font-size: 4.5rem; line-height: 1.02; margin: 1.5rem 0 1rem; }
    p { font-size: 1.6rem; color: var(--muted); max-width: 30ch; margin: 0 0 2.5rem; }
    .row { display: flex; gap: 1rem; align-items: center; }
    .mark { font-size: 1.75rem; letter-spacing: -0.02em; }
    .mark span { color: var(--accent); }
    code { font-size: 1.35rem; }
    /* An accent wash in the corner, so the card is not a flat rectangle in a
       feed. Same token the page uses; nothing new to keep in sync. */
    body::after {
      content: ""; position: fixed; inset-block-start: -30%; inset-inline-end: -20%;
      inline-size: 60%; aspect-ratio: 1; border-radius: 50%;
      background: radial-gradient(circle, color-mix(in oklch, var(--accent) 26%, transparent), transparent 70%);
    }
  </style>
</head>
<body>
  <main>
    <!-- No button here on purpose: nothing in a static card is clickable, and
         a control that cannot be pressed is the tell of a generated image. -->
    <div class="row">
      <strong class="mark">Hikarion<span>UI</span></strong>
      <span data-badge data-variant="accent">Class-light CSS</span>
    </div>
    <h1>Bare HTML,<br>quietly tasteful.</h1>
    <p>Semantic tags look right with no classes. Nineteen tokens are a theme.</p>
    <code>&lt;link rel="stylesheet" href="…/hikarion.min.css"&gt;</code>
  </main>
</body>
</html>`;

const tmp = join(root, ".og-card.html");
writeFileSync(tmp, card);
const server = await serveRoot(root);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`${server.origin}/.og-card.html`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(root, "site/public/og.png") });
  console.log(`✓ og.png ${W}×${H} → site/public/`);
} finally {
  await browser.close();
  server.close();
  unlinkSync(tmp);
}
