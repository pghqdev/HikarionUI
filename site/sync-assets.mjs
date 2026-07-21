// Copy the built framework and adoption artifacts into public/, so the docs
// site serves them (and llms.txt / skills.sh at its root), and publish the repo
// docs as Astro markdown pages. Runs before dev and build. The framework is
// built by the root `bun run build` first.
//
// Docs are copied, not duplicated: `docs/*.md` and `rules/hikarion-rules.md`
// stay the single source of truth and the generated pages are gitignored.
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DOC_SLUGS } from "./src/nav.mjs";

const from = (p) => fileURLToPath(new URL("../" + p, import.meta.url));
const to = (p) => fileURLToPath(new URL("public/" + p, import.meta.url));
const page = (p) => fileURLToPath(new URL("src/pages/" + p, import.meta.url));

if (!existsSync(from("dist/hikarion.min.css"))) {
  console.error("hikarion-site: dist not built — run `bun run build` at the repo root first.");
  process.exit(1);
}

mkdirSync(to("themes"), { recursive: true });
for (const f of ["hikarion.css", "hikarion.min.css", "hikarion.js"]) cpSync(from("dist/" + f), to(f));
cpSync(from("dist/themes"), to("themes"), { recursive: true });
cpSync(from("dist/llms.txt"), to("llms.txt"));
cpSync(from("dist/hikarion-rules.md"), to("hikarion-rules.md"));
cpSync(from("skills.sh"), to("skills.sh"));
// GitHub Pages reads the custom domain from a CNAME file in the artifact.
// Generated rather than committed because public/ is entirely generated.
writeFileSync(to("CNAME"), "hikarion.dev\n");

// Live demos are served as standalone documents inside an iframe, so they keep
// their own <head> and the site chrome stays out of the way.
mkdirSync(to("demo"), { recursive: true });
cpSync(from("kitchen-sink.html"), to("demo/kitchen-sink.html"));
cpSync(from("compositions"), to("demo"), { recursive: true });

// The demos link the framework through the repo's dist/; under public/demo/ the
// same files sit one level up. Anchored to the quote so the CDN snippets the
// kitchen sink *displays* (which also contain "/dist/") are left alone.
for (const f of ["kitchen-sink.html", "dashboard.html", "settings.html", "auth.html"]) {
  const p = to("demo/" + f);
  writeFileSync(p, readFileSync(p, "utf8").replace(/(href|src)="(?:\.\.?\/)*dist\//g, '$1="../'));
}

const GITHUB = "https://github.com/pghqdev/HikarionUI/blob/main/";

// Rewrite a link between repo files into a link between site pages. Published
// docs and the vocabulary reference become routes; anything else (ADRs, RFCs,
// maintainer docs) points back at the repo rather than 404ing. Links are
// relative so the site works at a domain root and under a project subpath.
const relink = (md, depth, dir) => {
  const up = "../".repeat(depth);
  // Order matters: the directory rule matches any relative directory link, so
  // it runs before the two rules that emit `../docs/<slug>/`.
  return md
    // Directory links (`compositions/`, `docs/adr/`) have no page.
    .replace(/\]\(\.{1,2}\/((?:[\w.-]+\/)+)\)/g, (m, path) => `](${GITHUB.replace("/blob/", "/tree/")}${path})`)
    // The rules file ships standalone, so its doc links are absolute GitHub
    // URLs. On the site those docs are pages — keep the reader here.
    .replace(new RegExp(`${GITHUB}docs/([\\w-]+)\\.md`, "g"), (m, name) =>
      DOC_SLUGS.includes(name) ? `${up}docs/${name}/` : m,
    )
    .replace(/\]\((\.{0,2}\/)?((?:[\w.-]+\/)*)([\w-]+)\.md(#[^)]*)?\)/g, (m, _p, sub, name, hash = "") => {
      const path = (sub + name).replace(/^\.\//, "");
      if (name === "hikarion-rules") return `](${up}components/${hash})`;
      // A doc is addressed as `tokens.md` from inside docs/ and as
      // `docs/tokens.md` from the rules file; both are the same page.
      if ((!sub || sub === "docs/") && DOC_SLUGS.includes(name)) return `](${up}docs/${name}/${hash})`;
      return `](${GITHUB}${path.startsWith("docs/") || !dir ? path : dir + path}.md${hash})`;
    });
};

// Attributes that point at an id. Every markup example is rendered live on the
// same page, so ids have to be made unique per example or the browser resolves
// a label, a popover invoker or aria-controls to the wrong element.
const ID_ATTRS = ["id", "for", "list", "form", "headers", "popovertarget", "commandfor",
  "aria-controls", "aria-labelledby", "aria-describedby", "aria-activedescendant"];

// Render each ```html example above its own code block. The markup in the
// rules file is the contract, so the preview cannot drift from the snippet —
// it *is* the snippet.
const withPreviews = (md) => {
  let n = 0;
  return md.replace(/^```html\n([\s\S]*?)^```$/gm, (fence, code) => {
    const suffix = `-ex${++n}`;
    const live = code.replace(
      new RegExp(`\\b(${ID_ATTRS.join("|")})="([^"]+)"`, "g"),
      (m, attr, val) => `${attr}="${val.split(/\s+/).map((v) => v + suffix).join(" ")}"`,
    )
      // The examples navigate to illustrative paths (/install, /tokens) that
      // are not routes here. Only the preview copy is defanged; the code block
      // below it still shows what the snippet actually says.
      .replace(/href="(?!#)[^"]*"/g, 'href="#"');
    return `<div data-preview>\n\n${live}\n</div>\n\n${fence}`;
  });
};

// Turn a repo doc into an Astro page: strip the H1 (the layout renders it as
// the page title), and rewrite sibling `./foo.md` links to the site's routes.
const publish = (src, dest, layout, depth, dir, extra = {}, transform = (s) => s) => {
  let md = transform(readFileSync(src, "utf8"));
  const title = md.match(/^#\s+(.+)$/m)?.[1] ?? dest;
  md = md.replace(/^#\s+.+\n+/, "");
  const description = md.match(/^(?!\[|#|>|\||```)(\S.+(?:\n\S.+)*)/m)?.[1]
    .replace(/\s+/g, " ")
    .replace(/[*`_]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^(.{0,155})(\s.*)?$/s, "$1") ?? "";
  md = relink(md, depth, dir);
  const fm = { layout, title, description, ...extra };
  const yaml = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  writeFileSync(dest, `---\n${yaml}\n---\n\n${md}`);
};

rmSync(page("docs"), { recursive: true, force: true });
mkdirSync(page("docs"), { recursive: true });
for (const slug of DOC_SLUGS) {
  publish(from(`docs/${slug}.md`), page(`docs/${slug}.md`), "../../layouts/Doc.astro", 2, "docs/", { slug });
}
publish(from("rules/hikarion-rules.md"), page("components.md"), "../layouts/Reference.astro", 1, "rules/",
  { title: "Component reference" }, withPreviews);

console.log(`✓ synced framework + demos + ${DOC_SLUGS.length} docs → site/`);
