// The PE and forced-colours contract, exercised in a real browser against
// kitchen-sink.html + dist/hikarion.css. Documented in docs/accessibility.md.
//
// These are the assertions that would have caught the three defects this suite
// was written for: a dropzone input carrying `hidden` (mouse-only), state that
// only exists as an accent colour (invisible in forced colours), and core
// patterns that quietly stop working when hikarion.js does not load.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

let server, browser, url;

beforeAll(async () => {
  if (!existsSync(join(root, "dist/hikarion.css"))) throw new Error("run `bun run build` first");
  server = createServer((req, res) => {
    const p = normalize(join(root, decodeURIComponent((req.url || "/").split("?")[0])));
    if (!p.startsWith(root) || !existsSync(p)) return res.writeHead(404).end("not found");
    res.writeHead(200, { "Content-Type": mime[extname(p)] || "application/octet-stream" });
    res.end(readFileSync(p));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${server.address().port}/kitchen-sink.html`;
  browser = await chromium.launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

/** Open kitchen-sink.html in a fresh context and hand the page to `fn`. */
async function withPage(options, fn) {
  const ctx = await browser.newContext({ reducedMotion: "reduce", ...options });
  if (options.blockHikarionJs) await ctx.route("**/dist/hikarion.js", (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  try {
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

describe("progressive enhancement — JavaScript disabled entirely", () => {
  test("nothing is hidden and the native patterns still open", async () => {
    await withPage({ javaScriptEnabled: false }, async (page) => {
      // Tabs are the one JS-dependent pattern; with no JS every panel must stay
      // visible, because the wiring only ever *hides*.
      const panels = page.locator("[data-tab-panel]");
      expect(await panels.count()).toBe(3);
      for (let i = 0; i < 3; i++) expect(await panels.nth(i).isVisible()).toBe(true);

      // <dialog> opens on the native command invoker, no polyfill involved.
      await page.click('button[commandfor="demo-dialog"]');
      expect(await page.locator("#demo-dialog").evaluate((d) => d.open)).toBe(true);
      await page.keyboard.press("Escape");

      // Dropdown is a native popover; disclosure is a native <details>.
      await page.click('button[popovertarget="menu-demo"]');
      expect(await page.locator("#menu-demo").evaluate((m) => m.matches(":popover-open"))).toBe(true);
      await page.keyboard.press("Escape");
      await page.click("details:nth-of-type(2) summary");
      expect(await page.evaluate(() => document.querySelectorAll("details")[1].open)).toBe(true);
    });
  });

  test("the dropzone input is a real, focusable control", async () => {
    // Regression: `hidden` on this input took it out of the tab order and the
    // a11y tree, leaving the dropzone reachable by mouse only.
    await withPage({ javaScriptEnabled: false }, async (page) => {
      const focused = await page.evaluate(() => {
        const input = document.querySelector("[data-dropzone] input[type=file]");
        input.focus();
        return document.activeElement === input && !input.hasAttribute("hidden");
      });
      expect(focused).toBe(true);
    });
  });
});

describe("progressive enhancement — hikarion.js fails to load", () => {
  test("core CSS never depended on it: page still renders themed", async () => {
    await withPage({ blockHikarionJs: true }, async (page) => {
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).not.toBe("rgba(0, 0, 0, 0)");
      // Copy buttons are injected by the JS; their absence must not break <pre>.
      expect(await page.locator(".hk-copy").count()).toBe(0);
      expect(await page.locator("pre").first().isVisible()).toBe(true);
    });
  });
});

describe("keyboard contract", () => {
  test("modal dialog traps focus and returns it to the invoker", async () => {
    await withPage({}, async (page) => {
      await page.focus('button[commandfor="demo-dialog"]');
      await page.keyboard.press("Enter");
      for (let i = 0; i < 4; i++) {
        await page.keyboard.press("Tab");
        const inside = await page.evaluate(() => {
          const d = document.getElementById("demo-dialog");
          return d.contains(document.activeElement) || document.activeElement === document.body;
        });
        expect(inside).toBe(true);
      }
      await page.keyboard.press("Escape");
      const returned = await page.evaluate(
        () => document.activeElement === document.querySelector('button[commandfor="demo-dialog"]')
      );
      expect(returned).toBe(true);
    });
  });

  test("tabs are a roving tablist driven by the arrow keys", async () => {
    await withPage({}, async (page) => {
      await page.focus("[data-tab-list] button");
      await page.keyboard.press("ArrowRight");
      const state = await page.evaluate(() => ({
        selected: [...document.querySelectorAll("[data-tab-list] button")].map((b) =>
          b.getAttribute("aria-selected")
        ),
        tabIndexes: [...document.querySelectorAll("[data-tab-list] button")].map((b) => b.tabIndex),
        hidden: [...document.querySelectorAll("[data-tab-panel]")].map((p) => p.hidden),
      }));
      expect(state.selected).toEqual(["false", "true", "false"]);
      expect(state.tabIndexes).toEqual([-1, 0, -1]);
      expect(state.hidden).toEqual([true, false, true]);
    });
  });
});

describe("forced colours keep state legible", () => {
  // Every one of these states is an accent fill, tint, or edge in the normal
  // palette — all three collapse into the resting state when the palette is
  // replaced, unless base/forced-colors.css restates them as system colours.
  test("selected/on states differ from their resting state", async () => {
    await withPage({ forcedColors: "active" }, async (page) => {
      const pairs = await page.evaluate(() => {
        const bg = (sel, pseudo) => {
          const el = document.querySelector(sel);
          return el ? getComputedStyle(el, pseudo).backgroundColor : null;
        };
        return {
          switch: [bg("[data-switch]:checked"), bg("[data-switch]:not(:checked)")],
          chip: [
            bg('button[data-chip][aria-pressed="true"]'),
            bg('button[data-chip][aria-pressed="false"]'),
          ],
          pagination: [
            bg('[data-pagination] [aria-current="page"]'),
            bg("[data-pagination] a:not([aria-current])"),
          ],
          stepper: [
            bg('[data-stepper] li[aria-current="step"]', "::after"),
            bg("[data-stepper] li:last-child", "::after"),
          ],
          tabUnderline: [
            getComputedStyle(
              document.querySelector('[data-tab-list] button[aria-selected="true"]')
            ).borderBlockEndColor,
            getComputedStyle(
              document.querySelector('[data-tab-list] button[aria-selected="false"]')
            ).borderBlockEndColor,
          ],
        };
      });
      for (const [name, [on, off]] of Object.entries(pairs)) {
        expect(on, `${name}: selected and resting render identically`).not.toBe(off);
      }
    });
  });
});
