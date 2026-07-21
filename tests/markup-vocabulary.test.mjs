// Unit tests for the markup validator that gates the reference compositions.
// Written before the implementation: the two rejection cases are the ones a
// composition can drift into silently — an invented data-* hook (which styles
// nothing and teaches an agent a name that does not exist) and a utility-class
// attribute (which is the philosophy the framework exists to refuse).
import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readVocabulary, validateMarkup } from "../scripts/lib/markup-vocabulary.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vocabulary = readVocabulary(readFileSync(join(root, "docs/public-surface.md"), "utf8"));

describe("readVocabulary", () => {
  test("derives the hooks from docs/public-surface.md, not a hand-list", () => {
    expect(vocabulary.has("data-badge")).toBe(true);
    expect(vocabulary.has("data-theme")).toBe(true);
    expect(vocabulary.has("data-density")).toBe(true);
    expect(vocabulary.has("data-variant")).toBe(true);
    // Runtime-only internals are documented as internal and must not be minted.
    expect(vocabulary.has("data-dragover")).toBe(false);
  });

  test("fails loudly if the doc stops being parseable", () => {
    expect(() => readVocabulary("# nothing here")).toThrow();
  });
});

describe("validateMarkup", () => {
  test("accepts markup built from the shipped vocabulary", () => {
    const html = `<main data-density="compact">
      <span data-badge data-variant="success solid">Live</span>
      <div data-table><table><tr><td>x</td></tr></table></div>
    </main>`;
    expect(validateMarkup(html, vocabulary)).toEqual([]);
  });

  test("rejects an unknown data-* hook", () => {
    const findings = validateMarkup(`<div data-panel-heading>x</div>`, vocabulary);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("data-panel-heading");
  });

  test("rejects utility-shaped classes", () => {
    const findings = validateMarkup(`<div class="flex gap-4">x</div>`, vocabulary);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].message).toContain("Utility-shaped");
  });

  test("rejects classes however they are quoted — HTML allows all three forms", () => {
    expect(validateMarkup(`<div class='flex gap-4'>x</div>`, vocabulary)).toHaveLength(2);
    expect(validateMarkup(`<div class=flex>x</div>`, vocabulary)).toHaveLength(1);
  });

  test("keeps scanning past a quoted value containing '>'", () => {
    const findings = validateMarkup(`<button title="a > b" data-panel-heading>x</button>`, vocabulary);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("data-panel-heading");
  });

  test("rejects any class at all — compositions are the class-light proof", () => {
    const findings = validateMarkup(`<div class="sidebar">x</div>`, vocabulary);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("class");
  });

  test("rejects a tone outside the variant grammar", () => {
    const findings = validateMarkup(`<span data-badge data-variant="info">x</span>`, vocabulary);
    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain("info");
  });

  test("ignores <style> and <script> bodies — this is a markup lint", () => {
    const html = `<style>.grid { display: grid }</style><script>el.dataset.madeUp = 1</script>`;
    expect(validateMarkup(html, vocabulary)).toEqual([]);
  });

  test("reports the line number so the failure is actionable", () => {
    const findings = validateMarkup(`<p>ok</p>\n<div data-nope></div>`, vocabulary);
    expect(findings[0].line).toBe(2);
  });
});

describe("the shipped compositions", () => {
  const dir = join(root, "compositions");
  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));

  test("there are some", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    test(`${file} is on-vocabulary`, () => {
      expect(validateMarkup(readFileSync(join(dir, file), "utf8"), vocabulary)).toEqual([]);
    });
  }
});
