# Tickets: HikarionUI production readiness

Tracer-bullet tickets from [HikarionUI-Production-Handoff.md](HikarionUI-Production-Handoff.md). Work the **frontier**: any ticket whose blockers are all done.

Out of scope for 1.0 is still ticketed as post-1.0 work (tickets 39–43) so it is tracked, not forgotten.

---

## Freeze public vocabulary & versioning hygiene

**What to build:** Consumers and agents can rely on a declared public surface: Semantic Versioning, a Keep a Changelog `CHANGELOG`, and a deprecation policy (warn for one minor, remove in next major). Tier-1 token names and public `data-*` hooks are frozen; internal derived tokens may still change freely.

**Blocked by:** None — can start immediately.

- [x] Semver policy is documented and any change to public `data-*` vocabulary or Tier-1 names is treated as major
- [x] `CHANGELOG.md` exists in Keep a Changelog format and is usable for the next release
- [x] Deprecation policy is written (warn one minor, remove next major)
- [x] Public Tier-1 + hook surface is enumerated so agents/humans know what is safe to depend on

## Production CI quality gates

**What to build:** Every release candidate fails CI if contrast, Stylelint (including bans on utility-class patterns), bundle-size budget, or automated accessibility checks on the kitchen-sink regress.

**Blocked by:** None — can start immediately.

- [x] Contrast check remains required and expanded to more pairs
- [x] Stylelint runs with modern rules plus custom rules that ban utility-class patterns
- [x] Bundle-size gate fails when minified core CSS exceeds the declared budget (target band ≤ 18–22 kB gzipped)
- [x] axe-core (or equivalent) runs against the kitchen-sink and fails the build on violations
- [x] JS surface is type-checked (TypeScript or JSDoc + tsc)

## Community & maintenance hygiene

**What to build:** New contributors and theme authors know how to participate: Code of Conduct, Contributing guide, issue templates, and an RFC path before expanding the public vocabulary.

**Blocked by:** None — can start immediately.

- [x] Code of Conduct is published
- [x] Contributing guide covers local build, checks, and design/vocabulary expectations
- [x] Issue templates exist for bug, feature, and design proposal
- [x] RFC / ownership process for new `data-*` attributes and Tier-1 tokens is documented

## Ship Crisp / Compact density as first-class

**What to build:** Density is a first-class theme concern. `data-density="crisp|compact"` (or equivalent Tier-1 token set) drives product-like Crisp (default) and high-information Compact across the existing component set, with both modes designed and contrast-checked—not bolted on later.

**Blocked by:** Freeze public vocabulary & versioning hygiene

- [x] Density mechanism is public, documented in agent rules, and available in the kitchen-sink
- [x] Existing components respond coherently in both Crisp and Compact
- [x] Contrast gate covers both density modes
- [x] CHANGELOG records the new public density surface

## Packaging & distribution polish

**What to build:** Installing and pinning Hikarion in production is trustworthy: documented CDN integrity hashes, GitHub Releases with minified artifacts and CSS source maps, and ESM/CSS exports that keep optional JS separate. Optional critical/layer-based import only if size pressure justifies it.

**Blocked by:** Freeze public vocabulary & versioning hygiene

- [x] CDN usage docs include integrity hashes
- [x] GitHub Releases ship minified artifacts and CSS source maps
- [x] Optional JS remains a separate entry and core styling never depends on it
- [x] Critical/layer subset is either shipped with a clear rationale or explicitly deferred with size budget still green

## Accessibility & progressive-enhancement contract for the existing set

**What to build:** The current interactive set meets WCAG 2.2 AA expectations and a clear PE contract: usable and readable without JavaScript except pure enhancements (toasts, interactive tabs, chip removal, drag-and-drop feedback, advanced motion). Focus order, focus traps, and live regions are correct and documented.

**Blocked by:** Production CI quality gates

- [x] Full keyboard support and visible focus for every existing interactive pattern
- [x] Custom patterns (tabs, chips, etc.) follow ARIA Authoring Practices where not native
- [x] `prefers-reduced-motion`, `prefers-contrast`, and forced-colors are respected
- [x] Dialog focus traps and expected focus order are documented
- [x] Toasts / dynamic status use appropriate `aria-live` regions
- [x] Kitchen-sink passes the automated a11y gate; manual keyboard audit notes exist for each interactive pattern
- [x] PE contract is documented and verified: core usable with JS disabled

## Visual regression baseline

**What to build:** Visual regressions across themes and densities cannot ship unnoticed. A kitchen-sink baseline is screenshot-gated (Playwright or Chromatic) for all themes and both density modes.

**Blocked by:** Ship Crisp / Compact density as first-class

- [x] Kitchen-sink is the visual regression baseline
- [x] Snapshots (or Chromatic equivalents) cover all shipped themes
- [x] Both Crisp and Compact density modes are covered
- [x] CI fails on unexpected visual diffs

## Design-language foundations (type, motion, elevation)

**What to build:** The system gains sharper craft foundations without a forced rewrite of every component: a more dramatic type scale and hierarchy, expressive-but-disciplined motion tokens (with reduced-motion), and an intentional elevation scale (0–4). Components can adopt these tokens incrementally (expand beside current tokens).

**Blocked by:** Ship Crisp / Compact density as first-class

- [x] Typography scale/hierarchy tokens land and read as product-like, not neutral-default
- [x] Motion tokens support short, confident, distinctive easing; decorative motion disables under `prefers-reduced-motion`
- [x] Elevation 0–4 has clear material meaning; shadows/borders feel crisp rather than soft-diffused by default
- [x] Existing components still render correctly; no big-bang rewrite required for CI to stay green

## Empty states + skeleton loaders

**What to build:** Empty/zero states and loading skeletons are first-class, class-light patterns: consistent empty presentation and pure-CSS, token-driven skeletons that respect reduced motion—demoable in the kitchen-sink and documented for agents.

**Blocked by:** Ship Crisp / Compact density as first-class

- [x] Consistent empty/zero-state pattern with minimal public vocabulary (ideally ≤ 1–2 new hooks)
- [x] Skeleton loaders are pure CSS, token-driven, and respect `prefers-reduced-motion`
- [x] Kitchen-sink demonstrates both patterns in Crisp and Compact
- [x] Agent rules document the markup contracts

## Avatar + progress (linear & circular)

**What to build:** Avatars (image / initials fallback, optional group) and progress (native linear `<progress>` plus CSS circular expansion) are polished, density-aware, and agent-documented.

**Blocked by:** Ship Crisp / Compact density as first-class

- [x] Avatar pattern supports image and initials fallback; group pattern is usable
- [x] Linear progress uses native `<progress>` styled to the system
- [x] Circular progress expands the spinner vocabulary without heavy JS
- [x] Kitchen-sink + agent rules cover both densities

## Form layout helpers

**What to build:** Forms can be composed with minimal attributes: fieldset, form groups, and horizontal/vertical stacks that respect Crisp/Compact rhythm—without utility classes.

**Blocked by:** Ship Crisp / Compact density as first-class

- [x] Fieldset / group / stack patterns exist with a closed, minimal `data-*` surface
- [x] Layouts respect both density modes
- [x] Kitchen-sink shows common form layouts
- [x] Agent rules document the contracts

## High-contrast / forced-colors theme support

**What to build:** High-contrast and forced-colors are first-class: a high-contrast token set and/or automatic adjustment, verified against the a11y/PE contract, so decisive accent usage never sacrifices readability.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] High-contrast support is available (dedicated token set and/or automatic adjustment)
- [x] Forced-colors mode is verified for interactive patterns
- [x] Contrast gate covers high-contrast presentation
- [x] Docs/rules describe when and how to use it

## Data table

**What to build:** A focused data table on native `<table>`: density via `data-table` (or equivalent), sticky header, and row selection via `aria-selected`—not a virtualized grid. Demoable, density-aware, keyboard/accessible, agent-documented.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Native `<table>` styling with minimal hook surface
- [x] Sticky header works in the kitchen-sink demo
- [x] Row selection uses `aria-selected` correctly
- [x] Works in Crisp and Compact; passes a11y expectations
- [x] Agent rules document the markup contract

## Navigation (sidebar + top)

**What to build:** Semantic `<nav>` patterns for sidebar and top navigation with clear active states, density-aware spacing, and keyboard clarity—without fighting native mobile patterns.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Sidebar and top nav compositions are styled and documented
- [x] Active/current states are unambiguous
- [x] Both density modes look intentional
- [x] Kitchen-sink + agent rules cover the patterns

## Select / searchable combobox

**What to build:** Native `<select>` looks excellent by default; an optional progressive-enhancement searchable combobox exists for richer UX without making the native path depend on JS.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Native `<select>` styling matches the system and is usable without JS
- [x] Searchable combobox PE path is keyboard-accessible and APG-correct
- [x] Vocabulary stays closed (minimal new hooks)
- [x] Kitchen-sink + agent rules document both paths

## Menu (context & action)

**What to build:** Context and action menus expand the native Popover + `data-menu` direction already started—keyboard-correct, PE-friendly, and density-aware.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [ ] Context and action menu patterns work via native Popover + minimal hooks
- [x] Keyboard and focus behavior match expectations for menus
- [x] Usable fallback exists when advanced APIs are missing
- [x] Kitchen-sink + agent rules cover the patterns

_Remaining: right-click context-menu invocation. Action menus, split buttons and
the full APG keyboard model (roles, roving tabindex, arrows/Home/End/typeahead,
Tab-to-close) ship; the roles are stamped by `hikarion.js` so the no-JS page
stays an honest disclosure. Right-click was declined, not deferred by accident:
it needs a new permanent `data-*` hook days before the 1.0 vocabulary freeze, has
no no-JS path at all, and must suppress the browser's own context menu to work._

## Toast / notification stack

**What to build:** Toasts stack, position, and dismiss reliably as optional enhancement—readable without JS where possible, with correct live regions when JS is present.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Positioning and stacking behave predictably for multiple toasts
- [x] Dismissal is clear and accessible
- [x] `aria-live` (or equivalent) behavior is correct when JS-enhanced
- [x] JS remains optional; core styling does not require it
- [x] Kitchen-sink + agent rules updated

_Note: `Hikarion.toast()` caps the stack at 4 and evicts the oldest, so nothing is left focusable-but-invisible. A hand-authored region with more toasts than fit still clips them and keeps them tabbable — cap it yourself._

## Date / time inputs (native-first)

**What to build:** Date and time inputs are styled natively first—tasteful, accessible, density-aware—without a heavy custom calendar unless clearly necessary later.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Native date/time inputs match the system visually and in density modes
- [x] Keyboard and platform pickers remain usable
- [x] No heavy custom calendar ships in this ticket
- [x] Kitchen-sink + agent rules cover the patterns

## Tooltip (accessible + delay-controlled)

**What to build:** Tooltips are accessible, delay-controlled, and consistent with the overlay PE story—present today, hardened to production bar.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Tooltips meet accessibility expectations (trigger, timing, dismiss)
- [x] Delay/show/hide behavior is controlled and documented
- [x] Works with keyboard focus, not hover-only
- [x] Kitchen-sink + agent rules updated

_`[popover="hint"]` is dismissible on every browser with the Popover API:
native where `hint` is implemented, `Esc` + outside-click from `hikarion.js`
where it is not. `[data-tooltip]` remains CSS-only and cannot observe `Esc` —
a permanent, documented limitation; use the popover shape when dismissal matters._

## Split button / button group

**What to build:** Split buttons and button groups compose primary actions with menus/adjacent actions using the existing button + menu vocabulary where possible.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Button group and split-button patterns are styled and keyboard-correct
- [x] Minimal new vocabulary; reuses button/menu contracts where possible
- [x] Kitchen-sink + agent rules document usage

## File upload with preview slots

**What to build:** File upload (building on dropzone direction) supports clear preview slots and accessible feedback without making upload depend on heavy custom UI.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set

- [x] Upload/dropzone pattern supports preview slots
- [x] Keyboard and screen-reader feedback is acceptable
- [x] PE: core flow remains understandable without advanced JS feedback
- [x] Kitchen-sink + agent rules updated

## Meter and range polish

**What to build:** `<meter>` and range controls feel precise and product-like in both densities, with confident focus/active states.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Meter and range match the craft bar of other form controls
- [x] Both density modes are intentional
- [x] Keyboard and focus states are high-visibility
- [x] Kitchen-sink + agent rules updated

## Pagination polish

**What to build:** Pagination (already sketched) is polished to production: clear current page, density-aware, accessible navigation.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Pagination pattern is visually and interaction-polished
- [x] Current/disabled/ellipsis states are unambiguous
- [x] Both density modes work
- [x] Kitchen-sink + agent rules updated

## Breadcrumbs polish

**What to build:** Breadcrumbs (already sketched) are polished to production: semantic, density-aware, accessible.

**Blocked by:** Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Breadcrumb pattern is polished and semantic
- [x] Current page presentation is clear
- [x] Both density modes work
- [x] Kitchen-sink + agent rules updated

## Component reference & override docs

**What to build:** Production documentation: component reference (structured pages or equivalent), expanded token playground, density docs, migration/override guide, browser support matrix (modern-first + graceful fallback), and kitchen-sink as the living baseline. Agent rules stay the single vocabulary source of truth.

**Blocked by:** Freeze public vocabulary & versioning hygiene; Ship Crisp / Compact density as first-class; Accessibility & progressive-enhancement contract for the existing set

- [x] Each component (or equivalent structured reference) has usage + a11y notes
- [x] Token reference/playground is expanded and accurate
- [x] Density (Crisp/Compact) is documented
- [x] Migration/override guide shows how to customize without fighting `@layer hikarion`
- [x] Browser support matrix states modern-first + fallback policy
- [x] Agent rules remain synced with the public vocabulary

## Command palette / search dialog

**What to build:** A command-palette / search-dialog pattern using native dialog + listbox semantics—keyboard-first, PE-friendly, reusing menu/dialog vocabulary where possible.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set; Menu (context & action)

- [x] Dialog + listbox (or equivalent) pattern is usable from the keyboard
- [x] Vocabulary stays closed and consistent with dialog/menu
- [x] Kitchen-sink demo exists
- [x] Agent rules document the composition

## Agent reference compositions + markup validation

**What to build:** Agents can copy high-quality compositions (dashboard, settings, auth, data-table views, etc.) and optionally run a lightweight validator against generated markup so output stays on-vocabulary and intentional.

**Blocked by:** Component reference & override docs; Data table; Select / searchable combobox; Navigation (sidebar + top); Empty states + skeleton loaders; Avatar + progress (linear & circular); Form layout helpers; Menu (context & action); Toast / notification stack

- [x] A small set of reference compositions ships and looks on-brand
- [x] Compositions exercise density and real product layouts
- [x] Lightweight validation script (or equivalent) can flag off-vocabulary markup
- [x] Agent-facing docs point to compositions + validator

_`compositions/dashboard.html`, `settings.html` and `auth.html` are built only
from documented vocabulary and run in the axe gate beside the kitchen sink.
Dashboard and settings carry a `data-density="compact"` region; auth is a
single crisp card, so it is only analysed at crisp. `bun run check:markup`
derives the legal hook set from the table in `docs/public-surface.md` rather
than a hand-list. Not covered by the visual gate — that baseline is
kitchen-sink only._

## Anchor positioning for overlays

**What to build:** Tooltips, dropdowns, and menus prefer CSS anchor positioning on capable browsers, with the current Popover / JS positioning as fallback—golden rule: modern feature, usable fallback.

**Blocked by:** Menu (context & action); Tooltip (accessible + delay-controlled)

- [ ] Anchor positioning is the primary path where supported
- [ ] Fallback path remains usable without anchor positioning
- [ ] Kitchen-sink overlays still pass a11y expectations
- [ ] Reduced-motion / PE posture unchanged

## Popover & invoker-command deepening

**What to build:** Declarative native patterns (`commandfor`, `popovertarget`, and kin) are the default interaction model for overlays/actions where they fit, with graceful fallbacks.

**Blocked by:** Accessibility & progressive-enhancement contract for the existing set; Menu (context & action)

- [x] Invoker/popover patterns are used consistently for new overlay work
- [x] Fallbacks exist when APIs are missing
- [x] Docs/rules teach the preferred declarative markup
- [x] No new dependence on required JS for core affordances

_Note: an action row closes its menu via `command="hide-popover"`. Without invoker-command support the row does not close the panel; `Esc` and light-dismiss still do, and `hikarion.js` polyfills the click when present._

## Scroll-driven animations (reduced-motion safe)

**What to build:** Subtle scroll-driven progress, sticky-header, and reveal effects enrich craft on capable browsers and fully disable under `prefers-reduced-motion`.

**Blocked by:** Design-language foundations (type, motion, elevation)

- [x] At least one production-quality scroll-driven effect ships in kitchen-sink or reference compositions
- [x] Effects fully disable under `prefers-reduced-motion: reduce`
- [x] Usable fallback when scroll-driven animations are unavailable
- [x] Motion still feels purposeful, not decorative noise

## View Transitions for theme & density

**What to build:** Theme switching, density switching, and light page/section transitions can use the View Transitions API as progressive enhancement only.

**Blocked by:** Ship Crisp / Compact density as first-class; Design-language foundations (type, motion, elevation)

- [x] Theme and density switches can animate via View Transitions where supported
- [x] No functional dependence on View Transitions
- [x] Respects reduced-motion preferences
- [x] Documented as optional enhancement

## Container + style queries for context-aware components

**What to build:** Components adapt to context (card density, button sizing, nav behavior) via container/style queries—not utility classes—with sensible fallbacks.

**Blocked by:** Ship Crisp / Compact density as first-class; Design-language foundations (type, motion, elevation)

- [x] At least two components gain meaningful container/style-query behavior
- [x] Fallbacks keep layouts usable without query support
- [x] No utility-class escape hatches introduced
- [x] Kitchen-sink demonstrates the behavior

## Advanced color pipeline (`light-dark()`, relative color, color-mix)

**What to build:** Theme derivation gets simpler and stronger via relative color, `light-dark()`, and advanced `color-mix`, while preserving AA contrast—including high-contrast paths.

**Blocked by:** Design-language foundations (type, motion, elevation); High-contrast / forced-colors theme support

- [ ] Theme tokens leverage modern color features where beneficial
- [ ] Contrast gate stays green across themes and densities
- [ ] High-contrast / forced-colors paths remain valid
- [ ] Fallbacks exist for environments lacking newer color features

## Customizable select preparation

**What to build:** Styles are prepared for the emerging customizable `<select>` appearance while keeping the native select path excellent.

**Blocked by:** Select / searchable combobox

- [ ] Customizable select styling is ready or clearly staged behind progressive support
- [ ] Native select path remains first-class
- [ ] Fallbacks documented
- [ ] Kitchen-sink covers the supported path(s)

## Expressive spring motion refinement

**What to build:** Motion language lands as springy, distinctive micro-interactions via CSS (`linear()`, custom easings) and only tiny optional JS if needed—always with reduced-motion fallbacks.

**Blocked by:** Design-language foundations (type, motion, elevation)

- [x] Distinctive easing/spring feel is present on key interactions
- [x] Decorative motion disables under reduced-motion; essential state changes remain clear
- [x] Optional JS motion is truly optional
- [ ] Kitchen-sink feels alive without playfulness-for-its-own-sake

_Answered: one spring, one caller. `--ease-spring` (damped `linear()`, ~6% overshoot)
drives the switch thumb only; the overlay pop keeps its settle-tail curve because an
overshoot on a dialog-sized surface reads as wobble. No JS. Reduced motion flattens it
via the existing reset.css killswitch — the track fill, not the travel, carries the
state. The last box is left for a human look at the rendered kitchen sink._

## Density refinement across the full component set

**What to build:** After the component set expands, Crisp and Compact are refined so density feels native everywhere—spacing, type, controls, and data-heavy views—not an afterthought.

**Blocked by:** Ship Crisp / Compact density as first-class; Data table; Select / searchable combobox; Navigation (sidebar + top); Empty states + skeleton loaders; Avatar + progress (linear & circular); Form layout helpers; Menu (context & action); Toast / notification stack; Command palette / search dialog; Date / time inputs (native-first); Pagination polish; Breadcrumbs polish; Tooltip (accessible + delay-controlled); Split button / button group; Meter and range polish; File upload with preview slots

- [x] Every shipped component has intentional Crisp and Compact presentation
- [x] Visual regression + contrast cover both modes across the set
- [x] Agent rules and docs describe density as native, not optional polish
- [x] No component looks “comfortable default with compact squeezed on”

_Command palette shipped, so the last blocker component is in: re-audited with it and it needs no density work of its own — the rows are menu rows and ride that scale, and the dialog's own chrome is the only new box._

_Audited component by component. Two components were the “squeezed on” tell and were fixed: `<label>` and `thead th` were hard-sized, so Compact shrank the field and the cells while leaving their label and header band at full size. Everything else either sits on the density scale or states in its header why it is invariant (`badge`, `switch`, `skeleton`, `spinner`, type, elevation). Target-size measured in a browser, not assumed: nothing crosses the 24px floor going Crisp → Compact. Re-open when Command palette ships — it is the one blocker component still missing, and it will need the same pass._

## Community theme guidelines + WCAG 2.2 AA acceptance gate

**What to build:** Community themes are welcome only when they meet WCAG 2.2 AA. Guidelines and an acceptance gate (process + automated checks) enforce that bar.

**Blocked by:** Production CI quality gates; High-contrast / forced-colors theme support; Community & maintenance hygiene

- [x] Theme authoring guidelines document AA + vocabulary requirements
- [x] Acceptance gate rejects themes that fail contrast/a11y checks
- [x] Existing community themes are evaluated against the gate
- [x] Contributing docs link the theme path clearly

_`docs/theming.md` documents the thirteen Tier-1 colour tokens and the AA ratios;
`bun scripts/contrast-check.mjs <theme.css>` is the gate (scope, vocabulary, every
contrast pair). All three shipped themes pass; narrowest margin is dracula
`--danger`/`--danger-content` at 4.53:1. The gate is contrast + vocabulary only
— it runs no axe pass on a candidate theme, because a theme changes colours, not
markup, and the axe gate already covers the markup those colours land on._

## 1.0 vocabulary freeze & release ceremony

**What to build:** Hikarion reaches 1.0 when the public vocabulary feels stable, the high-priority component set covers the large majority of common UI needs without breaking class-light philosophy, quality gates are green, and breaking-change communication is clear.

**Blocked by:** Freeze public vocabulary & versioning hygiene; Production CI quality gates; Visual regression baseline; Accessibility & progressive-enhancement contract for the existing set; Component reference & override docs; Data table; Select / searchable combobox; Navigation (sidebar + top); Empty states + skeleton loaders; Avatar + progress (linear & circular); Form layout helpers; Menu (context & action); Toast / notification stack; Agent reference compositions + markup validation; Density refinement across the full component set; Community theme guidelines + WCAG 2.2 AA acceptance gate

- [ ] Public vocabulary is explicitly frozen for 1.0
- [ ] High-priority completeness gaps from the handoff are closed
- [ ] All required quality gates are green on the release candidate
- [ ] CHANGELOG and release notes communicate 1.0 stability expectations
- [ ] Post-1.0 tickets remain clearly deferred, not mixed into the release

## Virtualized data grid

**What to build:** A full data-grid with virtualization for very large datasets—beyond the native `data-table` pattern—only if it can stay aligned with class-light, accessible, PE-friendly principles.

**Blocked by:** 1.0 vocabulary freeze & release ceremony; Data table

- [ ] Virtualization strategy and accessibility model are specified before implementation
- [ ] Grid remains class-light with a closed vocabulary
- [ ] Keyboard and screen-reader paths are acceptable for a data grid
- [ ] Kitchen-sink or dedicated demo proves scale without destroying bundle/craft goals

## Rich text editor

**What to build:** A rich text editing surface only if it can remain class-light, semantic where possible, and progressively enhanced—not a framework-shaped island that fights Hikarion’s philosophy.

**Blocked by:** 1.0 vocabulary freeze & release ceremony

- [ ] Scope and PE/accessibility constraints are written before coding
- [ ] Editor integrates with tokens, density, and focus language
- [ ] Vocabulary additions stay minimal and RFC’d
- [ ] Demo proves the editor does not force required heavy JS for basic readability of content

## Complex charts / data visualization

**What to build:** Non-trivial charting/visualization beyond simple native/`meter`-class patterns—only with a clear accessibility story and graceful non-visual fallbacks.

**Blocked by:** 1.0 vocabulary freeze & release ceremony

- [ ] Chart scope and a11y requirements (text alternatives, keyboard) are specified first
- [ ] Visual language matches Hikarion tokens and density
- [ ] Bundle and PE constraints are respected
- [ ] Demo shows charts that fail gracefully when JS/advanced rendering is unavailable

## Mobile navigation drawers (native-hostile patterns)

**What to build:** Drawer / sheet navigation that goes beyond semantic top/sidebar `<nav>`—only if it does not fight the platform and remains accessible with PE fallbacks.

**Blocked by:** 1.0 vocabulary freeze & release ceremony; Navigation (sidebar + top)

- [ ] Problem vs. native nav is justified; pattern does not fight the platform without cause
- [ ] Focus trap, dismiss, and keyboard paths are correct
- [ ] Works with density and overlay PE story
- [ ] Fallback to simpler nav remains usable

## Heavy animation systems with graceful degradation

**What to build:** A richer motion architecture than token/CSS PE micro-interactions—only if every feature path degrades cleanly, including `prefers-reduced-motion`, and never makes core UX depend on animation.

**Blocked by:** 1.0 vocabulary freeze & release ceremony; Design-language foundations (type, motion, elevation); Expressive spring motion refinement

- [ ] Motion system capabilities and hard degradation rules are specified first
- [ ] Decorative motion never blocks task completion
- [ ] Reduced-motion and no-JS/no-advanced-CSS paths remain clear
- [ ] Demo proves craft without violating the golden fallback rule
