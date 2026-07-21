// The public markup vocabulary, read out of docs/public-surface.md, and a lint
// that holds a page to it.
//
// ponytail: this is a regex lint over tags, not an HTML parser. It sees
// attributes on elements and nothing about structure, which is exactly the
// class of drift it exists to catch — an invented hook or a utility class. If
// it ever needs to know about nesting, that is the moment to reach for a parser.
import { utilityPattern } from "../stylelint-ban-utility-classes.mjs";

/**
 * Derive the vocabulary from the contract doc rather than hand-listing it — a
 * hand-list rots the day a hook ships. Throws if the doc stops being parseable,
 * because an empty vocabulary would silently pass everything.
 * @param {string} markdown contents of docs/public-surface.md
 * @returns {{ hooks: Set<string>, tones: Set<string>, has: (name: string) => boolean }}
 */
export function readVocabulary(markdown) {
  // Every attribute the contract names, wherever it names it: the hooks table,
  // the theme containers, and the optional-JS toast trio in prose.
  const hooks = new Set([...markdown.matchAll(/`(data-[a-z-]+)`/g)].map((m) => m[1]));
  hooks.add("data-variant");

  const toneLine = markdown.match(/^tone ∈ (.+)$/m);
  const tones = new Set(toneLine ? toneLine[1].split("|").map((t) => t.trim()) : []);

  if (hooks.size < 20 || tones.size === 0) {
    throw new Error("public-surface.md is no longer parseable — the hooks table or variant grammar moved");
  }
  return { hooks, tones, has: (name) => hooks.has(name) };
}

// A tag runs to the first `>` that is not inside an attribute value, so a
// `title="a > b"` does not hide every attribute after it. Quoted runs are
// matched whole and the fallback excludes quotes, which keeps this linear.
const TAG = /<[a-zA-Z](?:"[^"]*"|'[^']*'|[^>"'])*>/g;
// Values may be double-quoted, single-quoted or bare — all three are HTML, and
// a utility stack written `class='flex gap-4'` is exactly the drift to catch.
const ATTR = /(?:^|\s)([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]*)))?/g;
const STRIP = /<!--[\s\S]*?-->|<(style|script)\b[\s\S]*?<\/\1>/gi;

/**
 * @param {string} html
 * @param {ReturnType<typeof readVocabulary>} vocabulary
 * @returns {{ line: number, message: string }[]}
 */
export function validateMarkup(html, vocabulary) {
  // Blank out comments and the bodies of <style>/<script>, preserving offsets so
  // line numbers stay true. Page-local layout CSS is allowed to use classes;
  // the markup is what must stay class-light.
  const scanned = html.replace(STRIP, (m) => m.replace(/[^\n]/g, " "));
  const findings = [];
  const lineAt = (index) => scanned.slice(0, index).split("\n").length;

  for (const tag of scanned.matchAll(TAG)) {
    const line = lineAt(tag.index);
    const report = (message) => findings.push({ line, message });

    for (const [, name, dq, sq, bare] of tag[0].slice(1, -1).matchAll(ATTR)) {
      const value = dq ?? sq ?? bare ?? "";
      if (name === "class") {
        for (const token of value.split(/\s+/).filter(Boolean)) {
          if (token.startsWith("hk-")) continue;
          report(
            utilityPattern.test(`.${token}`) || /\/\d+$/.test(token)
              ? `Utility-shaped class "${token}" — Hikarion styles semantics, not utilities`
              : `Unexpected class "${token}" — compositions are the class-light proof; style the tag or the hook`,
          );
        }
        continue;
      }
      if (!name.startsWith("data-")) continue;
      if (!vocabulary.has(name)) {
        report(`Unknown hook "${name}" — not in docs/public-surface.md`);
        continue;
      }
      if (name === "data-variant") {
        for (const word of value.split(/\s+/).filter(Boolean)) {
          if (word !== "solid" && !vocabulary.tones.has(word)) {
            report(`Unknown tone "${word}" in data-variant — tones are ${[...vocabulary.tones].join(", ")}`);
          }
        }
      }
    }
  }
  return findings;
}
