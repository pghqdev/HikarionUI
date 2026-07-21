// Single source of truth for site navigation. `sync-assets.mjs` reads DOC_NAV
// to know which repo docs to publish; the sidebar renders the same list, so a
// doc can never appear in one and not the other.

export const TABS = [
  { href: "", label: "Home" },
  { href: "docs/installation", label: "Docs", match: "docs/" },
  { href: "components", label: "Components" },
  { href: "playground", label: "Playground" },
  { href: "examples", label: "Examples" },
  { href: "agents", label: "Agents" },
];

export const DOC_NAV = [
  {
    group: "Getting started",
    items: [
      { slug: "installation", label: "Installation" },
      { slug: "cdn", label: "CDN & pinning" },
    ],
  },
  {
    group: "Core",
    items: [
      { slug: "tokens", label: "Tokens" },
      { slug: "theming", label: "Theming" },
      { slug: "overrides", label: "Overrides & adoption" },
      { slug: "public-surface", label: "Public surface" },
      { slug: "versioning", label: "Versioning" },
    ],
  },
  {
    group: "Guides",
    items: [
      { slug: "accessibility", label: "Accessibility" },
      { slug: "browser-support", label: "Browser support" },
    ],
  },
  {
    // Maintainer-facing, but published: "read the source on GitHub" is a worse
    // answer than a page, and these are the docs that say how the project
    // holds itself to its own contract.
    group: "Project",
    items: [
      { slug: "production-readiness", label: "Production readiness" },
      { slug: "visual-regression", label: "Visual regression" },
      { slug: "rfc", label: "RFC process" },
    ],
  },
];

export const DOC_SLUGS = DOC_NAV.flatMap((g) => g.items.map((i) => i.slug));
