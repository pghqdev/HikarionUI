import { defineConfig } from "astro/config";

// Zero-JS by default; the only client script is the token playground, inlined
// on the page. Asset links use import.meta.env.BASE_URL, so this builds the same
// whether deployed at a domain root or a project subpath (set `base` then).
// BASE_PATH lets the Pages workflow deploy under a project subpath
// (/HikarionUI/) while a custom-domain deploy uses the default root ("/").
export default defineConfig({
  // Absolute origin for canonical URLs, Open Graph and the sitemap. SITE_URL
  // overrides it for a custom domain, the same way BASE_PATH overrides the base.
  site: process.env.SITE_URL || "https://pghqdev.github.io",
  base: process.env.BASE_PATH || "/",
  build: { inlineStylesheets: "never" },
});
