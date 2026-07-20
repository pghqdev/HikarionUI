// axe-core against kitchen-sink.html. Fails the build on violations.
// Run after build: bun run check:a11y
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { serveRoot } from "./lib/serve.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const sink = join(root, "kitchen-sink.html");
const distCss = join(root, "dist/hikarion.css");

if (!existsSync(sink) || !existsSync(distCss)) {
  console.error("✗ kitchen-sink.html and dist/hikarion.css are required (run bun run build)");
  process.exit(1);
}

const server = await serveRoot(root);
const url = `${server.origin}/kitchen-sink.html`;

const browser = await chromium.launch({ headless: true });
// Reduced motion so entrance animations are settled before axe samples colours —
// mid-animation opacity made the contrast check flake.
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });

// Both density modes are gated: Compact changes spacing and control metrics, so
// contrast and target-size findings can differ from Crisp.
let failed = false;
/** @type {Record<string, number>} */
const buttonPad = {};
for (const density of ["crisp", "compact"]) {
  await page.evaluate((d) => {
    document.documentElement.dataset.density = d;
  }, density);
  // A throwaway bare button, not a demo one — the kitchen-sink's page-local CSS
  // overrides padding on some of its buttons.
  buttonPad[density] = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement("button"));
    const pad = parseFloat(getComputedStyle(probe).paddingBlockStart);
    probe.remove();
    return pad;
  });

  // target-size (WCAG 2.2 AA 2.5.8) is off by default and is the rule Compact
  // actually endangers — shrinking controls is the whole point of the mode.
  const { violations } = await new AxeBuilder({ page })
    .options({ rules: { "target-size": { enabled: true } } })
    .analyze();
  if (!violations.length) {
    console.log(`✓ axe-core: no violations on kitchen-sink.html (${density})`);
    continue;
  }

  failed = true;
  console.error(`✗ axe-core (${density}): ${violations.length} violation group(s)`);
  for (const v of violations) {
    console.error(`\n${v.id} (${v.impact}): ${v.help}`);
    for (const node of v.nodes.slice(0, 5)) {
      console.error(`  - ${node.target.join(" ")}`);
      if (node.failureSummary) console.error(`    ${node.failureSummary.split("\n")[0]}`);
    }
  }
}

await context.close();
await browser.close();
server.close();

// Guard the density mechanism itself: without this the loop above would still
// pass if data-density stopped doing anything at all.
if (!(buttonPad.compact < buttonPad.crisp)) {
  console.error(
    `✗ data-density is inert: button padding ${buttonPad.crisp}px crisp vs ${buttonPad.compact}px compact`
  );
  failed = true;
} else {
  console.log(`✓ density: button padding ${buttonPad.crisp}px crisp → ${buttonPad.compact}px compact`);
}

process.exit(failed ? 1 : 0);
