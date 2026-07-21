// Hold the reference compositions to the published vocabulary.
// Run: bun run check:markup   (or pass files: bun scripts/validate-markup.mjs page.html)
//
// Only compositions/ is gated by default. kitchen-sink.html deliberately carries
// page-local classes for its showcase choreography; the compositions are the
// pages an agent copies, so they carry none.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readVocabulary, validateMarkup } from "./lib/markup-vocabulary.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const dir = join(root, "compositions");
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => join(dir, f));

const vocabulary = readVocabulary(readFileSync(join(root, "docs/public-surface.md"), "utf8"));

let failed = false;
for (const file of files) {
  if (!existsSync(file)) {
    console.error(`✗ ${file} not found`);
    process.exit(1);
  }
  const findings = validateMarkup(readFileSync(file, "utf8"), vocabulary);
  const rel = file.replace(root, "");
  for (const { line, message } of findings) console.error(`✗ ${rel}:${line} ${message}`);
  failed ||= findings.length > 0;
}

if (!failed) console.log(`✓ markup: ${files.length} page(s) on-vocabulary (${vocabulary.hooks.size} known attributes)`);
process.exit(failed ? 1 : 0);
