// Regenerate the CDN integrity table in docs/cdn.md from the real dist/ bytes.
// Hashes are never hand-copied: `bun run build` runs this, and CI fails on a
// dirty docs/cdn.md, so a stale table cannot survive a release.
// Run: bun scripts/cdn-docs.mjs
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const { version } = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

// Only files a consumer <link>s or <script>s from a CDN.
const files = [
  "hikarion.min.css",
  "hikarion.css",
  "hikarion.js",
  "themes/nord.min.css",
  "themes/dracula.min.css",
  "themes/catppuccin.min.css",
];

const sri = (bytes) => `sha384-${createHash("sha384").update(bytes).digest("base64")}`;

const rows = files.map((f) => {
  const bytes = readFileSync(new URL(`dist/${f}`, root));
  return `| \`dist/${f}\` | \`${sri(bytes)}\` |`;
});

const table = [
  `Generated for **v${version}** by \`bun scripts/cdn-docs.mjs\` (part of \`bun run build\`).`,
  "",
  "| File | `integrity` |",
  "|------|-------------|",
  ...rows,
].join("\n");

const doc = fileURLToPath(new URL("docs/cdn.md", root));
const before = readFileSync(doc, "utf8");
const after = before.replace(
  /(<!-- sri:start -->)[\s\S]*?(<!-- sri:end -->)/,
  () => `<!-- sri:start -->\n${table}\n<!-- sri:end -->`,
);
if (!after.includes("sha384-")) {
  console.error("✗ docs/cdn.md: could not write the table — check the sri:start/sri:end markers");
  process.exit(1);
}
writeFileSync(doc, after);
console.log(`✓ ${rows.length} integrity hashes → docs/cdn.md (v${version})`);
