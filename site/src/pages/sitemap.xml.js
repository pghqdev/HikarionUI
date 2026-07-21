// Hand-rolled rather than @astrojs/sitemap: the site is a fixed handful of
// routes, so the dependency would buy nothing a map() doesn't.
import { DOC_SLUGS } from "../nav.mjs";

const ROUTES = ["", "components", "playground", "examples", "agents", ...DOC_SLUGS.map((s) => `docs/${s}`)];

export function GET({ site }) {
  const base = import.meta.env.BASE_URL;
  const urls = ROUTES.map((r) => {
    const loc = new URL(base + r, site).href.replace(/([^/])$/, "$1/");
    return `  <url><loc>${loc}</loc></url>`;
  }).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml" },
  });
}
