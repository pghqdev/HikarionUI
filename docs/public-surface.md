# Public surface (v0.1)

Consumers and agents may depend on the names below. Anything not listed here —
including Tier-2 derived tokens and undocumented `data-*` attributes — is
**internal** and may change without a major version.

Canonical markup contracts live in [`rules/hikarion-rules.md`](../rules/hikarion-rules.md).
Versioning rules live in [`versioning.md`](./versioning.md).

## Tier-1 tokens

Set these on `:root` or a `[data-theme]` container. Every theme must define all
of them.

| Token | Role |
|-------|------|
| `--bg` | Page / canvas background |
| `--fg` | Primary text |
| `--surface` | Raised surface background |
| `--muted` | Secondary text |
| `--border` | Hairline / control border |
| `--accent` | Brand / primary action tone |
| `--accent-content` | Text on solid accent |
| `--success` | Success tone |
| `--success-content` | Text on solid success |
| `--warning` | Warning tone |
| `--warning-content` | Text on solid warning |
| `--danger` | Danger tone |
| `--danger-content` | Text on solid danger |
| `--radius` | Base corner radius |
| `--space` | Base spacing unit |
| `--ease-hikarion` | Default easing |
| `--dur` | Default duration |
| `--font` | UI sans stack |
| `--mono` | Monospace stack |

## Public derived tokens

Tier-2 tokens are normally internal, but these are named in the agent rules as
things authors read or set, so they are frozen surface too.

| Token | Role | Direction |
|-------|------|-----------|
| `--elevation-0` … `--elevation-4` | The material ladder: flush, raised, lifted, floating, overlay | Read |
| `--shadow-sm` / `--shadow` / `--shadow-lg` | Aliases for rungs 1, 2 and 4 | Read |
| `--dur-fast` / `--dur-slow` | Durations beside the Tier-1 `--dur` | Read |
| `--hk-value` | Fill percentage (0–100) of a `[data-spinner][role="progressbar"]` | Set by the author |

Everything else derived — `--space-*`, `--control-*`, `--text-*`, `--_`-prefixed
privates — stays internal.

## Theme containers

| Attribute | Values | Notes |
|-----------|--------|-------|
| `data-theme` | `light`, `dark`, plus shipped theme names (`nord`, `dracula`, `catppuccin`, …) | Nestable; swaps the Tier-1 palette |
| `data-density` | `crisp` (default), `compact` | Nestable; retunes the spacing scale and control metrics. CSS-only |

## Variant grammar

```
data-variant="<tone> [solid]"
tone ∈ accent | success | warning | danger
```

There is no `info` tone. Soft (default) vs solid appearance is part of this
grammar, not a separate attribute.

## Public `data-*` hooks

| Hook | Role |
|------|------|
| `data-badge` | Badge |
| `data-avatar` | Avatar (image or initials) |
| `data-avatar-group` | Overlapping avatar stack |
| `data-chip` | Chip (selection, not tone) |
| `data-chip-remove` | Nested remove control for a chip |
| `data-tabs` | Tabs root |
| `data-tab-list` | Tab list container |
| `data-tab-panel` | Tab panel |
| `data-menu` | Dropdown menu (with native `popover`) |
| `data-tooltip` | CSS tooltip text |
| `data-dropzone` | File dropzone on a `<label>` |
| `data-dropzone-filename` | Filename / prompt slot inside a dropzone |
| `data-switch` | Switch appearance on a checkbox |
| `data-spinner` | Loading spinner (with `role="progressbar"`, a determinate ring) |
| `data-empty` | Empty / zero state |
| `data-skeleton` | Loading placeholder |
| `data-form-row` | Side-by-side form field / action row |
| `data-stepper` | Multi-step flow on `<ol>` |
| `data-breadcrumbs` | Breadcrumb nav |
| `data-pagination` | Pagination nav |
| `data-set-theme` | Theme control value (`light` / `dark` / `auto` / theme name) |

Toasts are created by optional JS (`Hikarion.toast`); the runtime uses
`data-toast`, `data-toast-region`, and `data-toast-close`. Treat those as part of
the optional JS surface, not markup authors invent.

## Public JS API (optional entry `hikarion-ui/js`)

| API | Role |
|-----|------|
| `Hikarion.init(root?)` | Wire progressive enhancement in a subtree (idempotent) |
| `Hikarion.toast(message, options?)` | Transient feedback |
| `Hikarion.setTheme(name)` | Persist and apply a theme |

Core CSS never depends on this entry.

## Package exports

| Export | Artifact |
|--------|----------|
| `hikarion-ui` / `.` | `dist/hikarion.css` |
| `hikarion-ui/min` | `dist/hikarion.min.css` |
| `hikarion-ui/js` | `dist/hikarion.js` |
| `hikarion-ui/themes/*` | `dist/themes/*.css` |
| `hikarion-ui/rules` | `rules/hikarion-rules.md` |
