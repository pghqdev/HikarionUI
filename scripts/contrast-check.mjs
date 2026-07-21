// Contrast gate: every theme scope must define all 13 Tier-1 colour tokens and
// clear WCAG 4.5:1 for tone/-content pairs and for body text pairs
// (fg/bg, fg/surface, muted/bg, muted/surface).
//
//   bun run check                       # shipped: tokens.css + src/themes/*
//   bun run check path/to/theme.css     # a candidate theme (a contributor PR)
//
// Candidate mode reads only the given file, so it also asserts what shipped
// mode gets for free from tokens.css: the palette really is declared under
// [data-theme="name"]. A file declaring nothing would otherwise pass by having
// no scopes to fail. See docs/theming.md.
import { readFileSync, readdirSync } from "node:fs";
import { checkContrastPairs, checkThemeVocabulary, parseThemeScopes } from "./lib/contrast.mjs";

const candidate = process.argv[2];
const themesDir = new URL("../src/themes/", import.meta.url);

const sources = candidate
  ? [{ name: candidate, css: readFileSync(candidate, "utf8") }]
  : [
      { name: "tokens.css", css: readFileSync(new URL("../src/base/tokens.css", import.meta.url), "utf8") },
      ...readdirSync(themesDir)
        .filter((f) => f.endsWith(".css"))
        .map((f) => ({
          name: f,
          css: readFileSync(new URL(f, themesDir), "utf8"),
        })),
    ];

let scopes = parseThemeScopes(sources);

if (candidate) {
  const named = new Set([...sources[0].css.matchAll(/\[data-theme="([\w-]+)"\]/g)].map((m) => m[1]));
  if (!named.size) {
    console.error(`✗ ${candidate}: no [data-theme="name"] scope — a theme must namespace its palette`);
    process.exit(1);
  }
  // Seed every named scope, then filter to them. Without the seed a scope that
  // parsed no colour at all (only hex, or no colour tokens) is absent from
  // `scopes`, so both checks iterate nothing and the gate passes the very file
  // it exists to reject.
  scopes = Object.fromEntries([...named].map((name) => [name, scopes[name] ?? {}]));
}

const vocabulary = checkThemeVocabulary(scopes);
for (const r of vocabulary.results) {
  if (!r.ok) console.error(`✗ ${r.scope}: --${r.token} missing (Tier-1, required)`);
}

const { failed, results } = checkContrastPairs(scopes);

for (const r of results) {
  if (r.missing) {
    console.error(`✗ ${r.scope}: --${r.pair.replace("/", " / --")} missing`);
    continue;
  }
  console.log(`${r.ok ? "✓" : "✗"} ${r.scope} --${r.pair.replace("/", " on --")}: ${r.ratio.toFixed(2)}:1 (≥ ${r.min})`);
}

process.exit(failed || vocabulary.failed ? 1 : 0);
