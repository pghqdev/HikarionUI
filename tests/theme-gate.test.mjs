// The community-theme acceptance gate (docs/theming.md). A theme is a palette
// contract, so the gate has to reject two distinct defects a contributor can
// ship: a *missing* Tier-1 colour token (the theme silently inherits core and
// looks fine until someone nests it), and a *present but unreadable* pair.
// Written before the gate existed — a gate with no failing fixture is decoration.
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  REQUIRED_COLOR_TOKENS,
  checkContrastPairs,
  checkThemeVocabulary,
  parseThemeScopes,
} from "../scripts/lib/contrast.mjs";

/** A theme that passes: dark-ish, every Tier-1 colour present and readable. */
const VALID = `
  [data-theme="fixture"] {
    --bg: oklch(20% 0.015 260);
    --fg: oklch(93% 0.01 260);
    --surface: oklch(24% 0.018 260);
    --muted: oklch(72% 0.018 260);
    --border: oklch(32% 0.02 260);
    --accent: oklch(72% 0.16 255);
    --accent-content: oklch(20% 0.03 260);
    --success: oklch(74% 0.15 150);
    --success-content: oklch(22% 0.04 150);
    --warning: oklch(80% 0.15 82);
    --warning-content: oklch(26% 0.05 82);
    --danger: oklch(70% 0.17 25);
    --danger-content: oklch(22% 0.05 25);
  }
`;

const scopesOf = (css) => parseThemeScopes([{ name: "fixture.css", css }]);

describe("theme vocabulary", () => {
  test("all six status tokens are required", () => {
    for (const token of [
      "success",
      "success-content",
      "warning",
      "warning-content",
      "danger",
      "danger-content",
    ]) {
      expect(REQUIRED_COLOR_TOKENS).toContain(token);
    }
    // --border carries no contrast pair, so only the vocabulary check can catch it.
    expect(REQUIRED_COLOR_TOKENS).toContain("border");
  });

  test("accepts a complete theme", () => {
    expect(checkThemeVocabulary(scopesOf(VALID)).failed).toBe(false);
  });

  test("rejects a theme missing a Tier-1 token", () => {
    const css = VALID.replace(/\s*--warning-content:[^;]+;/, "");
    const { failed, results } = checkThemeVocabulary(scopesOf(css));
    expect(failed).toBe(true);
    expect(results.some((r) => !r.ok && r.token === "warning-content")).toBe(true);
  });
});

describe("theme contrast", () => {
  test("accepts a complete theme", () => {
    expect(checkContrastPairs(scopesOf(VALID)).failed).toBe(false);
  });

  test("rejects a sub-4.5 tone pair", () => {
    // Mid-grey danger on near-black content: present, plausible-looking, unreadable.
    const css = VALID.replace(/--danger: [^;]+;/, "--danger: oklch(40% 0.17 25);");
    const { failed, results } = checkContrastPairs(scopesOf(css));
    expect(failed).toBe(true);
    expect(results.some((r) => !r.ok && r.pair === "danger/danger-content")).toBe(true);
  });
});

describe("contrast-check.mjs candidate mode", () => {
  const run = (...args) =>
    spawnSync("bun", [new URL("../scripts/contrast-check.mjs", import.meta.url).pathname, ...args], {
      encoding: "utf8",
    });

  /** @param {string} css */
  const candidate = (css) => {
    const file = join(mkdtempSync(join(tmpdir(), "hikarion-theme-")), "fixture.css");
    writeFileSync(file, css);
    return file;
  };

  test("accepts a valid candidate theme file", () => {
    expect(run(candidate(VALID)).status).toBe(0);
  });

  test("rejects a candidate missing a Tier-1 token", () => {
    const r = run(candidate(VALID.replace(/\s*--border:[^;]+;/, "")));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("border");
  });

  test("rejects a candidate with a sub-4.5 pair", () => {
    const r = run(candidate(VALID.replace(/--muted: [^;]+;/, "--muted: oklch(40% 0.018 260);")));
    expect(r.status).toBe(1);
  });

  // A scope the parser reads no colour out of must still fail: hex is not a
  // parseable palette, and "no colour tokens at all" is the emptiest theme there is.
  test("rejects a scope with no parseable colour tokens", () => {
    const r = run(candidate('[data-theme="evil"] { --radius-md: 4px; }'));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("--bg missing");
  });

  test("rejects an all-hex palette", () => {
    const r = run(candidate('@layer hikarion { [data-theme="hexy"] { --bg: #000; --fg: #fff; } }'));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("hexy");
  });

  test("rejects a file with no [data-theme] scope", () => {
    const r = run(candidate(":root { --bg: oklch(99% 0.004 250); }"));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("data-theme");
  });
});
