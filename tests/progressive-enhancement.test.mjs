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

  test("no menu roles are claimed without the script", async () => {
    await withPage({ blockHikarionJs: true }, async (page) => {
      expect(await page.getAttribute("#menu-demo", "role")).toBe(null);
    });
  });
});

describe("keyboard contract", () => {
  // The APG model and role="menu" ship together — a menu that announces itself
  // as one but does not answer arrow keys is worse than the plain disclosure.
  test("[data-menu] upgrades to an APG menu and arrow keys move between rows", async () => {
    await withPage({}, async (page) => {
      await page.click('[popovertarget="menu-demo"]');
      expect(await page.getAttribute("#menu-demo", "role")).toBe("menu");
      const focused = () => page.evaluate(() => document.activeElement.textContent.trim());
      // `toggle` fires in a later task than the click, so focus lands on the
      // first row a tick after the panel opens — wait for it, don't sleep.
      await page.waitForFunction(() => document.activeElement?.role === "menuitem");
      expect(await focused()).toContain("Rename");
      await page.keyboard.press("ArrowDown");
      expect(await focused()).toContain("Duplicate");
      await page.keyboard.press("End");
      expect(await focused()).toContain("Delete");
      await page.keyboard.press("ArrowDown"); // wraps
      expect(await focused()).toContain("Rename");
      await page.keyboard.press("d"); // typeahead
      expect(await focused()).toContain("Duplicate");
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => document.getElementById("menu-demo").matches(":popover-open"))).toBe(false);
      // APG: Tab leaves the menu entirely — past the trigger, not back onto it.
      expect(
        await page.evaluate(() => document.activeElement.getAttribute("popovertarget")),
      ).not.toBe("menu-demo");
    });
  });

  test("activating a link row closes the menu", async () => {
    await withPage({}, async (page) => {
      await page.click('[popovertarget="menu-demo"]');
      await page.waitForFunction(() => document.activeElement?.role === "menuitem");
      await page.keyboard.press("o"); // typeahead to "Open in new tab"
      await page.keyboard.press("Enter");
      expect(await page.evaluate(() => document.getElementById("menu-demo").matches(":popover-open"))).toBe(false);
    });
  });

  // The comment in hikarion.js tells apps to re-run init() after injecting rows;
  // that has to actually adopt them, or role="menu" ends up owning a plain button.
  test("re-running init() adopts rows injected into an upgraded [data-menu]", async () => {
    await withPage({}, async (page) => {
      const state = await page.evaluate(() => {
        const panel = document.getElementById("menu-demo");
        const row = document.createElement("button");
        row.textContent = "Archive";
        panel.appendChild(row);
        window.Hikarion.init(panel);
        const rows = [...panel.querySelectorAll("button, a")];
        return {
          role: row.getAttribute("role"),
          tabStops: rows.filter((r) => r.tabIndex === 0).length,
        };
      });
      expect(state.role).toBe("menuitem");
      expect(state.tabStops).toBe(1);
    });
  });

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

describe("pointer contract", () => {
  test("WCAG 1.4.13 hoverable: the tooltip survives the pointer crossing the gap", async () => {
    // Regression: only opacity carried the hide delay, so `pointer-events`
    // reverted to `none` the instant the pointer left the trigger for the
    // 0.5rem gap — the still-visible bubble became un-pointable and faded out
    // under the cursor.
    await withPage({}, async (page) => {
      const trigger = page.locator("button[data-tooltip]").first();
      await trigger.scrollIntoViewIfNeeded();
      const box = await trigger.boundingBox();
      const x = box.x + box.width / 2;
      await page.mouse.move(x, box.y + box.height / 2);
      await page.waitForTimeout(600);

      // Into the bubble: up through the gap, then onto the bubble itself.
      await page.mouse.move(x, box.y - 20, { steps: 20 });
      const state = await trigger.evaluate((el) => {
        const s = getComputedStyle(el, "::after");
        return { opacity: s.opacity, pointerEvents: s.pointerEvents };
      });
      expect(state).toEqual({ opacity: "1", pointerEvents: "auto" });
    });
  });
});

describe("toast stack stays reachable", () => {
  test("the region evicts past the cap instead of clipping tabbable toasts", async () => {
    // Regression: the region caps at the viewport and clips the overflow, but a
    // clipped toast is still in the DOM — its ✕ kept its place in the tab order,
    // focusable and invisible. Every toast the user can tab to must be on screen.
    await withPage({}, async (page) => {
      await page.evaluate(() => {
        for (let i = 0; i < 30; i++) window.Hikarion.toast(`toast ${i}`, { duration: 0 });
      });
      await page.waitForTimeout(100);

      const region = page.locator("[data-toast-region]");
      const regionBox = await region.boundingBox();
      const closes = page.locator("[data-toast]:not([data-closing]) [data-toast-close]");
      expect(await closes.count()).toBeGreaterThan(0);

      for (const close of await closes.all()) {
        const box = await close.boundingBox();
        expect(box).not.toBeNull();
        // Inside the region's painted area, not clipped above its top edge.
        expect(box.y).toBeGreaterThanOrEqual(regionBox.y - 1);
        expect(box.y + box.height).toBeLessThanOrEqual(regionBox.y + regionBox.height + 1);
      }
    });
  });
});
