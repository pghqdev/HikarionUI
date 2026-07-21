# Hikarion UI — rules for coding agents

Hikarion is a class-light CSS framework for semantic HTML. Bare tags look great with
no classes; a small `data-*` vocabulary adds variants; a `data-theme` container
swaps the whole palette. This file is the single source of truth — `llms.txt`,
the consumer `AGENTS.md`, and the installable Skill all derive from it.

## Prime directive

Write bare, correct semantic HTML. Reach for the right element first
(`<button>`, `<dialog>`, `<details>`, `<article>`, `<nav>`, a real `<label>`),
and add a **documented** `data-*` attribute only when a variant needs it.

**Never freestyle utility classes for styling.** No Tailwind, no
`class="flex gap-2 rounded-lg bg-…"`. That is the "AI slop" Hikarion exists to
replace. If you're writing a class to style something, stop — either the bare
tag already handles it, or there's a `data-*` hook below, or it's layout you
own (see "Your own CSS").

## Rules

- **Semantic tag before wrapper.** A button is `<button>`, not `<div role="button">`. A card is `<article>`. Navigation is `<nav>`. Let the element carry the meaning; Hikarion styles it.
- **Only the hooks below exist.** Do not invent `data-*` attributes — an undocumented hook does nothing. The vocabulary is closed and small on purpose.
- **Theme with Tier-1 tokens only.** Restyle by setting the ~20 Tier-1 tokens on a `[data-theme]` container. Never touch Tier-2 (internal, derived) tokens.
- **No `!important`, ever.** Hikarion lives in `@layer hikarion`; any unlayered CSS you write already wins the cascade. If you're reaching for `!important`, you don't need it.
- **Tones are `accent` `success` `warning` `danger`.** There is no `info` tone. Tone names mirror the token names.
- **Don't add another CSS framework.** No Bootstrap, no Tailwind reset, no second design system. Hikarion is the whole surface.

## Component vocabulary

Every hook is a bare `data-*` attribute (no modifiers) or a native element.
Variants come from `data-variant`, which uses **one grammar everywhere**:

```
data-variant="<tone> [solid]"   tone ∈ accent | success | warning | danger
```

`solid` (opt-in) fills with the tone and uses its readable `-content` pair as
text. Without `solid`, a toned component is **soft**: a translucent tint of the
tone over its background. Omit `data-variant` for the neutral default.

### Buttons
```html
<button>Default</button>
<button data-variant="solid">Primary action</button>       <!-- accent fill -->
<button data-variant="danger solid">Delete</button>        <!-- destructive -->
```
Buttons take a tone **only** with `solid`; there is no soft toned button.
Reserve the one solid primary for a view's single main action.

### Card
```html
<article>
  <h3>Title</h3>
  <p>A quiet raised surface with a hairline. No classes.</p>
</article>
```
Every `<article>` is also a **query container**. Anything nested in a card adapts
to the card's own width instead of the viewport, so the same markup is a media
card in a wide column and a stacked card in a narrow one. There is no size
variant and nothing to set — put the card in the layout you want and it reads it.

A leading `<figure>` is the card's media slot: stacked and full width by default,
floated into a leading column once the card is at least 26rem wide. Under 20rem,
buttons in a `<footer>` take the full column instead of splitting into slivers.
```html
<article>
  <figure><img src="cover.jpg" alt=""></figure>
  <h3>Title</h3>
  <p>Body copy.</p>
  <footer data-form-row>
    <button data-variant="solid">Open</button>
    <button>Share</button>
  </footer>
</article>
```
The wide layout is the enhancement, not the baseline: a browser without container
queries gets the stacked card, which is usable at any width. Density needs no
thought — Compact shrinks the card's padding, so the content box is wider and the
media column arrives a little sooner. Caveat: containment means a card used as an
*auto-sized flex item* no longer contributes its content's width. Give such a card
a width, or put it in a grid track.

### Nav
Bare `<nav>` — links inside are muted, underline-free until hover.
```html
<nav>
  <a href="/">Home</a> · <a href="/docs">Docs</a> · <a href="/themes">Themes</a>
</nav>
```
`<nav data-nav>` is the primary link run: horizontal by default, a vertical
rail with `data-nav="sidebar"`. Those are the only two values (`top` is the
spelled-out default, for markup that would rather be explicit; it carries no
styling of its own and does not undo a `sidebar` ancestor). Items may be direct `<a>` children or wrapped in a `<ul>`/`<ol>` —
prefer the list, since assistive tech announces the item count. Mark the active
destination with `aria-current="page"`; there is no Hikarion attribute for it.
A `<button>` in the nav keeps normal button chrome, so a header CTA still looks
like a CTA. For a labelled group inside a rail, nest a second `<nav>` with its
own `aria-label` rather than reaching for a heading — a heading here jumps the
document's heading order in almost every page that isn't already six deep.
```html
<nav data-nav aria-label="Primary">
  <a href="/" aria-current="page">Overview</a>
  <a href="/components">Components</a>
</nav>

<nav data-nav="sidebar" aria-label="Sections">
  <ul>
    <li><a href="/install" aria-current="page">Install</a></li>
    <li><a href="/tokens">Tokens</a></li>
  </ul>
</nav>
```
The current item is marked with geometry as well as colour — a 2px underline on
top, an inline-start edge in the rail. There is no collapse-to-drawer: a top nav
wraps on a narrow viewport. Build an off-canvas menu from `<dialog>` + `command`
if you need one.

A `[data-nav]` run stacks itself into a column when the nearest query container —
a card, today — is narrower than 22rem. That is context, not viewport: the same
nav is a bar in a page header and a rail inside a narrow card. With no container
ancestor, or in a browser without container queries, it stays the wrapping
horizontal bar.

### Breadcrumbs
A trail to the current page — `<nav data-breadcrumbs>` wrapping an `<ol>`.
Ancestors are muted links; the last item carries `aria-current="page"` and is
the trail's one emphasis (full `--fg`, label weight, no underline, no pointer).
```html
<nav data-breadcrumbs aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><span aria-current="page">Tokens</span></li>
  </ol>
</nav>
```
The current item may stay an `<a href>` if it must remain linkable — the styling
is keyed off `aria-current`, not off the tag. Items are separated by the shared
chevron, rotated to point inline and mirrored under `:dir(rtl)`.

### Pagination
Page navigation — `<nav data-pagination>` of links and buttons. Three states,
three channels: the current page carries `aria-current="page"` (accent ring,
never a fill); the ends of the range carry `aria-disabled="true"` (dim,
pointer-inert); an elided range is a bare `<span aria-hidden="true">…</span>`
that keeps the slot but takes no pill, no hover and no pointer.
```html
<nav data-pagination aria-label="Pagination">
  <button aria-disabled="true">Prev</button>
  <a href="?p=1">1</a>
  <a href="?p=2" aria-current="page">2</a>
  <span aria-hidden="true">…</span>
  <a href="?p=9">9</a>
  <button>Next</button>
</nav>
```
Use `aria-disabled="true"`, not the native `disabled`, so the ends stay in the
tab order and the a11y tree — that is a presentational inertness only, so a
disabled `<button>` must still no-op its own handler. The first and last items
size to their text label; every other item is a square pill, above the WCAG 2.2
§2.5.8 target-size floor in both densities.

### Definition list
Bare `<dl>` — terms are muted, small-capped; definitions indent under their term.
```html
<dl>
  <dt>Token</dt>
  <dd>A CSS custom property a theme author sets to restyle the framework.</dd>
  <dt>Hook</dt>
  <dd>A bare <code>data-*</code> attribute that identifies an element as a component.</dd>
</dl>
```

### Badge
```html
<span data-badge>Neutral</span>
<span data-badge data-variant="success">Passing</span>     <!-- soft -->
<span data-badge data-variant="danger solid">3 errors</span>
```

### Chip
A filter/input token. Chips carry **selection, not tone** — no `data-variant`.
```html
<button data-chip aria-pressed="true">All</button>         <!-- selectable filter -->
<button data-chip aria-pressed="false">Components</button>
<span data-chip>filter.css <button data-chip-remove aria-label="Remove">✕</button></span>
```
With `hikarion.js`, clicking a filter chip toggles `aria-pressed`; a
`data-chip-remove` button removes its chip.

### Avatar
A round identity token — `[data-avatar]`. Holds an `<img>`, or its own text as
initials when there is no image. No JS.
```html
<span data-avatar>AL</span>
<span data-avatar><img src="ada.jpg" alt="Ada Lovelace"></span>
<span data-avatar data-variant="success">+3</span>
```
Neutral by default; `data-variant="<tone> [solid]"` tints or fills it, same
grammar as a badge. There is no image-load fallback: if you have no picture,
omit the `<img>` and the initials show.

Stack avatars with `[data-avatar-group]`:
```html
<div data-avatar-group>
  <span data-avatar><img src="ada.jpg" alt="Ada Lovelace"></span>
  <span data-avatar>GH</span>
  <span data-avatar data-variant="accent">+3</span>
</div>
```
They overlap by a third of their diameter and ring themselves in `--bg`, so the
overlap retunes with density along with the circle. There is no size knob — the
framework has no size vocabulary; restyle with your own CSS if you need one.

### Alert
A callout. The ARIA role is an independent a11y choice from the tone.
```html
<div role="status" data-variant="success"><strong>Saved</strong> — changes are live.</div>
<div role="alert" data-variant="danger"><strong>Failed</strong> — couldn't reach the server.</div>
<div role="alert" data-variant="danger solid">Deleted — the record is gone.</div>
```
Use `role="alert"` for errors, `role="status"` for confirmations.

### Toast (JS)
Transient feedback, via `hikarion.js`. No markup — call the helper:
```js
Hikarion.toast("Changes saved");
Hikarion.toast("Couldn't reach the server", { variant: "danger" });
Hikarion.toast("Undo available", { duration: 8000, closable: true });
```
Returns a `dismiss()` that closes the toast early. Toasts stack bottom-end,
newest last; the stack is capped at the viewport and clips its oldest members.
The region is a `popover="manual"`, so toasts render in the top layer and stay
visible over an open modal `<dialog>` — but top-layer order is insertion order,
so a dialog opened *after* the region still covers it.

The auto-dismiss timer pauses while a toast is hovered or holds focus, and
restarts when the pointer or focus leaves (WCAG 2.2.1). `duration: 0` keeps the
toast until it is dismissed. `variant: "danger"` sets the region to
`aria-live="assertive"`; every other tone is `polite`. Do not put `role="alert"`
on a toast — the alert component styles that role and would repaint it as a
callout.

### Tabs
Minimal markup; `hikarion.js` wires ARIA roles, roving arrow-key nav, and panel
visibility. With no JS every panel stays visible (nothing is hidden).
```html
<div data-tabs>
  <div data-tab-list>
    <button aria-selected="true">Overview</button>
    <button>Details</button>
  </div>
  <div data-tab-panel>…</div>
  <div data-tab-panel>…</div>
</div>
```
Panels map 1:1 to the buttons, in order.

### Accordion
Native disclosure — no JS, no hook.
```html
<details>
  <summary>What is Hikarion?</summary>
  <p>Bare details/summary; the chevron rotates on open.</p>
</details>
```

### Dialog (modal)
Native `<dialog>`, opened with native command invokers. `hikarion.js` polyfills
invokers only where the browser lacks them.
```html
<button commandfor="confirm" command="show-modal">Open</button>
<dialog id="confirm">
  <h3>Confirm</h3>
  <button commandfor="confirm" command="close">Close</button>
</dialog>
```

### Overlays: invokers before JavaScript
Every overlay in Hikarion opens, closes and dismisses from markup. Reach for a
click handler only when no declarative form exists — not because one is shorter
to type.

| Markup | Use for |
|--------|---------|
| `popovertarget="id"` | The **default** way to open a popover. Widest support, gives the button `aria-expanded` for free |
| `command="show-modal\|close\|request-close" commandfor="id"` | `<dialog>` |
| `command="toggle-popover\|show-popover\|hide-popover" commandfor="id"` | A popover opened or closed from somewhere other than its own trigger |

`request-close` is the polite close: it fires a cancellable `cancel` event first,
so an unsaved-changes guard gets a say. `close` is unconditional.

Invoker commands shipped roughly three years after the Popover API, so a browser
can support `popover` fully and still ignore `command`. They are feature-detected
separately (`"command" in HTMLButtonElement.prototype`). `hikarion.js` polyfills
the invoker *click* where it is missing; without the script too, a
`[popovertarget]` button still works and a dialog invoker does not.

### Dropdown menu
Native Popover API. The button opens the menu; the browser owns toggle,
light-dismiss, and focus.

Load `hikarion.js` and the panel becomes a real APG menu: it stamps
`role="menu"` and `role="menuitem"`, opening moves focus to the first row, and
`↑` `↓` `Home` `End` plus first-character typeahead move between rows; `Tab` or
`Esc` closes it. You write nothing extra — the markup below is the whole
contract. Without the script no roles are claimed and `Tab` walks the rows, so
the no-JS page is a disclosure, not a broken menu.
```html
<button popovertarget="menu">Actions</button>
<div id="menu" popover data-menu>
  <button>Edit</button>
  <a href="/share">Share</a>
  <hr>
  <button>Delete</button>
</div>
```
A `[popovertarget]` button placed immediately before its `[data-menu]` gets a
chevron that flips on open.

Rows inside a `[data-menu]` are plain `<button>`/`<a>`. Three states are free,
all reusing vocabulary you already know:
```html
<div id="file-menu" popover data-menu>
  <button commandfor="file-menu" command="hide-popover">Rename <kbd>⌘R</kbd></button>
  <button aria-disabled="true">Move to…</button>
  <hr>
  <button commandfor="file-menu" command="hide-popover" data-variant="danger">Delete</button>
</div>
```
Light dismiss only fires for clicks *outside* the popover, so a row that runs an
action has to close the menu itself — that is the `command="hide-popover"` pair,
not a click handler. It is inert on the row's own semantics (no `aria-expanded`
is added) and composes with whatever else the button does. Skip it on rows that
navigate: leaving the page closes the menu anyway.
- `data-variant="danger"` (or any tone) inks the row and tints its hover. Do
  **not** add `solid` inside a menu — a filled row is a button, not a menu item.
- `aria-disabled="true"` dims the row and blocks pointer input while keeping it
  focusable and in the accessibility tree. Do not use the native `disabled`.
- A trailing `<kbd>` is pushed to the end of the row as a shortcut hint. It is
  decoration: bind the real shortcut yourself.

Placement is CSS anchor positioning against the popover's implicit anchor (its
invoker), so there is no `anchor-name` wiring per instance. Two fallbacks, both
usable: without anchor positioning the panel takes the browser's own centred
popover placement — detached from the trigger, but rows, `Esc`, light-dismiss
and focus return all keep working, and no JavaScript positions anything. Where
the Popover API is missing entirely, the panel drops into flow as an inline
panel under its trigger.

### Command palette
`[data-palette]` on a modal `<dialog>` makes a command palette: a search
`<input>` flush at the top edge, then a list of commands. Open it with the
native invoker — `command="show-modal" commandfor="…"`. `Esc`, the backdrop, the
focus trap and focus return are the browser's; nothing is bound for them.

```html
<button command="show-modal" commandfor="palette">Search <kbd>⌘K</kbd></button>

<dialog id="palette" data-palette aria-label="Command palette">
  <input type="search" placeholder="Type a command…" aria-label="Search commands">
  <div>
    <button>Open file <kbd>⌘O</kbd></button>
    <a href="/docs">Go to documentation</a>
    <button aria-disabled="true">Publish (needs an account)</button>
    <hr>
    <button data-variant="danger">Delete project</button>
  </div>
  <p data-empty hidden>No commands match.</p>
</dialog>
```

The structure is fixed and positional: the `<input>` first, then one element
holding the rows, then an optional `[data-empty]` carrying the `hidden`
attribute. Rows are exactly menu rows — `data-variant` inks a destructive one,
`aria-disabled` makes one inert-but-announced, a trailing `<kbd>` is a shortcut
hint, `<hr>` separates groups. Do not put `data-menu` on the list: that hook
means *popover panel*, and this list is a listbox inside a dialog.

`hikarion.js` supplies the filtering and the keys: typing narrows the list by
substring, `↑`/`↓` walk the visible rows and wrap, `Enter` runs the active one.
Focus stays in the input the whole time — the active row is named with
`aria-activedescendant` and marked with `aria-selected`, which is also what the
highlight is drawn from. Inert rows are walked but refuse to fire.

Without the script the dialog still opens and every command is visible,
readable and clickable — the list is the feature, filtering is the enhancement.
The `[data-empty]` element stays hidden, because nothing can filter it into
view. Keep the command list short enough to read unfiltered, and it degrades to
a perfectly good menu.

### Button group / split button
`[data-button-group]` fuses adjacent `<button>`s into one control — squared
seams, rounded outer corners, one hairline where two borders meet. Children must
be `<button>`; links are not styled as group members. The group is a single row
and does not wrap: more actions than fit means more groups, not a taller group.
The hook carries appearance only — add `role="group"` and an `aria-label`
yourself, and keep each button's own label. A toggle group marks state with
`aria-pressed`.

A split button is the same group with a `[popovertarget]` half. Everything
menu-shaped — the chevron, the panel, open/close, light-dismiss, focus return —
comes from `[data-menu]` and the native Popover API. The panel must be the
toggle button's immediate next sibling (that adjacency is what draws the
chevron), so it lives inside the group; being a top-layer popover it takes no
part in the row's layout.
```html
<div data-button-group role="group" aria-label="Text style">
  <button aria-pressed="true">Bold</button>
  <button>Italic</button>
</div>

<div data-button-group role="group" aria-label="Save">
  <button data-variant="accent solid">Save</button>
  <button data-variant="accent solid" popovertarget="save-more"
          aria-label="More save options"></button>
  <div popover id="save-more" data-menu>
    <button commandfor="save-more" command="hide-popover">Save as…</button>
  </div>
</div>
```
The menu half renders as a bare chevron, so its `aria-label` is mandatory.

### Tooltip
Two shapes. `[data-tooltip]` is the CSS hint: the attribute text appears on
hover or keyboard focus. It shows after `--hk-tooltip-delay` (0.4s) and hides
after `--hk-tooltip-delay-out` (`--dur-slow`); both are read with fallbacks and
never declared, so set either on any ancestor or on one trigger. The hide delay
is load-bearing — it keeps the bubble alive while the pointer crosses the gap
onto it, which is what makes it *hoverable* under WCAG 2.2 1.4.13. It is **not**
Esc-dismissible, and it cannot be revealed from the keyboard on a non-focusable
element such as a `<span>`.
```html
<button data-tooltip="Copied to clipboard" aria-label="Copy">Copy</button>
```
When the trigger must be keyboard-reachable, use a native hint popover instead.
The trigger is a real button that toggles the bubble, so it is dismissible
without moving focus. No JS required. Esc, light-dismiss and focus return are
the browser's where `popover="hint"` is implemented — no shipping Safari has it
today, and the invalid-value default is the **manual** state (see
docs/browser-support.md). Loading `hikarion.js` adds Esc and outside-click
dismissal exactly there, so the hint shape is dismissible everywhere the Popover
API exists.
```html
<button popovertarget="tip-webhook" aria-label="What is a webhook?">?</button>
<span popover="hint" id="tip-webhook">A URL we POST to when the event fires</span>
```
The hint sits above its trigger through anchor positioning; without it the
browser's centred popover placement takes over — detached, but readable and
still toggled by its trigger. `[data-tooltip]` uses plain absolute positioning and is
unaffected: a pseudo-element is not in the top layer, so anchor positioning
would not fix the clipping it is actually prone to. Near a scroll-container or
viewport edge, use the popover shape.
Neither shape is reliably announced on its own — always give the trigger a real
accessible name (visible text or `aria-label`) and treat the tooltip as
supplementary, **never** as the accessible name.

### Forms
Bare fields. Wire `<label for>` to the field's `id`.
```html
<label for="email">Email</label>
<input id="email" type="email" required placeholder="you@example.com">
```
Validation is native: `:user-invalid` styles the field's edge in `--danger`
after the user interacts (never on pristine load). For JS-driven validation with
no native constraint, set `aria-invalid="true"`.

Native gauge and computed-value elements are styled too:
```html
<label for="vol">Volume <output for="vol">50</output></label>
<input id="vol" type="range" min="0" max="100" value="50">

<label for="upload">Upload</label>
<progress id="upload" value="62" max="100"></progress>
<progress></progress>                    <!-- indeterminate: a moving stripe -->

<label for="disk">Disk usage</label>
<meter id="disk" value="0.4" min="0" max="1" low="0.66" high="0.85" optimum="0.1"></meter>

<input type="file">                     <!-- styled as a quiet dashed surface -->
```
`<progress>` and `<meter>` fill with the accent; `data-variant` recolours a
`<progress>` fill (a bar fill is always the flat tone, so the `solid` word is
accepted and ignored). `<meter>` regions tint via the status tones
(optimum→success, low/high→warning, suboptimum→danger). `<output>` reads as a
small monospaced value. All ride the same focus and reduced-motion rules as the
other fields.

A `<meter>` at 0 reads as empty: the empty track is the same hairline as
`<progress>`, and `low`/`high`/`optimum` carry all the colour. Density thins the
meter bar and the range groove only — the slider row and its thumb are pinned,
so the drag target clears the WCAG 2.2 §2.5.8 24px floor in Compact exactly as
it does in Crisp. Do not set a `height` on a range: it is the hit target.

**Select and searchable input.** No hook. A `<select>` is already the styled
field. `<optgroup>` renders as an eyebrow heading. Adding `multiple` (or `size`
greater than 1) turns it into a list box: the chevron and its gutter are
dropped, the rows carry the padding, and the checked row fills in the accent.
The **searchable** case is `<input list>` + `<datalist>` — a native combobox.
Typed filtering, popup, keyboard model and screen-reader semantics all belong to
the browser, so it works with JavaScript off; the field gets the same chevron as
a closed select so the suggestions are discoverable. Do not build a scripted
listbox.
```html
<select>
  <optgroup label="Core"><option>Vanilla</option></optgroup>
</select>

<select multiple size="4">
  <option selected>Production</option>
  <option>Staging</option>
</select>

<input list="cities" id="city">
<datalist id="cities"><option value="Kyoto"></option></datalist>
```
List-box rows keep the browser's own height — `size="4"` reserves space for four
unstyled rows, so padding them would clip the last one. Density reaches the rows
through their inline inset only. Safari paints the list box itself and ignores
`<option>` padding entirely; if per-row control matters, use checkboxes in a
`<fieldset>`.

**Date and time.** `input[type="date"]`, `time`, `datetime-local`, `month` and
`week` take the standard field chrome; the browser's picker button is repainted
as the same chevron `<select>` uses, so it stays visible in every theme.
Hikarion ships no calendar widget — the platform picker is the picker, and
keyboard handling over the segments is the browser's.
```html
<label for="when">Start date</label>
<input id="when" type="date" value="2026-07-20">
```

### Form layout
Vertical rhythm is hook-free. A `<p>` is the field group — label, control and an
optional `<small>` hint are all phrasing content, so they are valid inside one.
`<form>` and `<fieldset>` space their groups; `<legend>` keeps cutting the
fieldset border because neither container becomes a flex box.
```html
<form>
  <p>
    <label for="email">Email</label>
    <input id="email" type="email" required>
    <small>We never share it.</small>
  </p>
  <fieldset>
    <legend>Shipping</legend>
    <div data-form-row>
      <p><label for="city">City</label><input id="city"></p>
      <p><label for="zip">ZIP</label><input id="zip"></p>
    </div>
  </fieldset>
  <footer data-form-row>
    <button type="submit" data-variant="solid">Save</button>
    <button type="reset">Reset</button>
  </footer>
</form>
```
`data-form-row` puts children side by side and wraps them when there is no room.
`<p>` groups inside it share the free inline space and drop to their own line
below ~12rem; anything else — a submit button beside an input — keeps its
intrinsic width and aligns to the row's bottom edge. Use
`<footer data-form-row>` for the action row.

Density tightens the gaps between and inside groups. It does **not** shrink the
wrap threshold: Compact fits more fields per row, it never makes a single field
narrower than it is legible.

Do not wrap a group in a `<div>` to get spacing, and do not add a hook for the
column stack — `<form>` and `<fieldset>` already are the stack.

### File dropzone
A drag-and-drop upload surface — `label[data-dropzone]` wrapping an
`input[type="file"]`. `hikarion.js` adds drag-over highlight and writes the
chosen filename into a `[data-dropzone-filename]` slot.
```html
<label data-dropzone>
  <input type="file">
  <span data-dropzone-filename>Drop files here or click to browse</span>
</label>
```
Never put `hidden` on that input — it drops out of the tab order and the a11y
tree, and the dropzone becomes mouse-only. Hikarion stretches the input over the
card and makes it invisible instead, so it stays focusable. Usable without JS:
click and keyboard both go to the native input; the JS is purely the drag-over
highlight and filename display.

**Preview slots.** Put a plain `<ul>` (or `<ol>`) immediately after the label
and each `<li>` becomes a preview slot: an optional square thumbnail plus its
filename. The list must be a *sibling*, never a child — the file input is
stretched invisibly over the whole card and would swallow clicks on anything
inside it.
```html
<label data-dropzone>
  <input type="file" multiple>
  <span data-dropzone-filename aria-live="polite">Drop files here or click to browse</span>
</label>
<ul>
  <li><img src="thumb.jpg" alt="">poster.png</li>
  <li>notes.pdf</li>
</ul>
```
Use `aria-live="polite"` on the filename slot so the selection is announced. Do
not use `role="status"` for this — that hook renders an alert box. Thumbnails
need `alt=""`: the filename beside them is the accessible name, so alt text
would double it. Slots are authored markup, so previews of already-uploaded
files render server-side with no JS.

### Data table
`[data-table]` wraps a plain `<table>` in a scroll frame. The table itself needs
no attributes — a bare `<table>` is already styled. The wrapper adds two things
a layout table does not want: a scroll viewport and a header that stays put
inside it. Constrain the frame's height (inline `max-block-size`, or your own
layout CSS) to make the header stick; unconstrained it is a horizontal scroller
only.

Selection is a real checkbox in the row. Do **not** put `aria-selected` on a
`<tr>` in an ordinary table: it is only valid under grid/treegrid semantics.
```html
<div data-table style="max-block-size: 18rem">
  <table>
    <thead>
      <tr><th>Select</th><th>Name</th><th>Commits</th></tr>
    </thead>
    <tbody>
      <tr><td><input type="checkbox" aria-label="Select Ada Lovelace"></td>
          <td>Ada Lovelace</td><td>1 842</td></tr>
    </tbody>
  </table>
</div>
```
Give every selection checkbox an `aria-label` naming its row — the column header
alone does not identify it.

### Switch
A binary on/off toggle — distinct from a checkbox. `<input type="checkbox"
role="switch" data-switch>` with a `<label for>` for the accessible name.
`role="switch"` is required: without it the control is announced as a checkbox,
which is not what it looks like or means.
```html
<label for="notify"><input id="notify" type="checkbox" role="switch" data-switch checked> Notifications</label>
<label for="del"><input id="del" type="checkbox" role="switch" data-switch data-variant="danger" checked> Destructive</label>
```
`data-variant="<tone>"` retints the active track via the tone resolver.

### Spinner
CSS-only loading ring — `[data-spinner]`. No JS; reduced-motion pauses it.
```html
<span data-spinner></span>                       <!-- standalone -->
<button disabled><span data-spinner></span> Saving…</button>
```
Inline next to text or standalone; the ring is the accent (or the active tone
on a toned ancestor).

Add `role="progressbar"` and it becomes a determinate ring — same hook, no new
vocabulary, still no JS:
```html
<span data-spinner role="progressbar" aria-label="Indexing"
      aria-valuenow="62" aria-valuemin="0" aria-valuemax="100"
      style="--hk-value: 62"></span>
```
`--hk-value` is the fill percentage (0–100). CSS cannot read a number out of
`aria-valuenow`, so the value is given twice — once for assistive tech, once for
the paint. Keep them in sync. Without `role="progressbar"` it is the ordinary
indeterminate spinner. The ring is masked, so it carries no centre label; put
the number beside it if it needs to be read.

### Empty state
A zero-state slot — `[data-empty]`. A centred column: an optional glyph, a
heading, one muted line of copy, an optional action. Frameless on purpose, so it
composes inside whatever already frames it; wrap it in `<article>` for the card
frame.
```html
<div data-empty>
  <span aria-hidden="true">📭</span>
  <h3>No projects yet</h3>
  <p>Create your first project and it will show up here.</p>
  <button data-variant="accent solid">New project</button>
</div>
```
No child hooks — children are styled by tag. The glyph and the padding tighten
under Compact; the heading and copy do not.

### Skeleton
A pure-CSS loading placeholder — `[data-skeleton]` on the element that will hold
the real content. No JS, no size knobs: the placeholder keeps the element's own
box, so put the hook on a real `<h3>` / `<p>` / `<span>` holding representative
text and the bar inherits its line height, line count and wrap width. Stacked
bars get their rhythm from the elements' own margins.
```html
<article aria-busy="true">
  <h3 data-skeleton>Loading title</h3>
  <p data-skeleton>Loading two lines of body copy that wrap the way the real paragraph will wrap.</p>
</article>
```
Mark the loading region `aria-busy="true"` so assistive tech skips the filler
text. The sweep recolours per theme; `prefers-reduced-motion` pins it to a flat
tint, and `forced-colors` swaps in an outline.

### Stepper
A multi-step flow indicator — `<ol data-stepper>` of step items. No JS; state
is ARIA-driven: `aria-current="step"` on the active item. Steps before the
current one are treated as completed (check + accent connector).
```html
<ol data-stepper>
  <li><button>Account</button></li>
  <li aria-current="step"><button>Profile</button></li>
  <li><button>Confirm</button></li>
</ol>
```
Completed steps show a check and tint their connector with the accent; the
active step gets an accent ring. Stacks vertically on narrow viewports.

`aria-checked="true"` on completed `<li>` items is **deprecated** (invalid on
`<li>`): still styled for this minor; remove in the next major.

## Theming

A `data-theme` container swaps the whole palette — colors, depth, and glow.
Themes nest.
```html
<body>                              <!-- OS light/dark, automatic -->
  <section data-theme="dark">…</section>   <!-- forced dark region -->
</body>
```
Theme switch + persistence via `hikarion.js`:
```html
<button data-set-theme="light">Light</button>
<button data-set-theme="dark">Dark</button>
<button data-set-theme="auto">Auto</button>
```
Paste this inline in `<head>` **before** the stylesheet to prevent a theme flash
(it can't be deferred):
```html
<script>try{var t=localStorage.getItem("hikarion-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
```

## Density

`data-density` retunes spacing and control metrics. Two values, and that is the
whole vocabulary:

| Value | Use |
|-------|-----|
| `crisp` | Default. Product UI. No attribute needed. |
| `compact` | Information-dense views — tables, dashboards, admin panels. |

Pure CSS, no JS, and it nests exactly like `data-theme`, so a dense panel can
live inside a crisp page:
```html
<body data-density="crisp">
  <article data-density="compact">…</article>
</body>
```
Spell `crisp` explicitly only to opt a subtree back out of an enclosing
`compact`. Density is **not** a size variant on individual components — there is
no `data-density` on a single button. Put it on the container.

Density tightens **chrome**: spacing, control padding, control type, field
labels, and table column headers. It leaves body copy, headings, and code blocks
at full size (dense ≠ harder to read), and it leaves interactive targets at the
WCAG 2.2 §2.5.8 floor — the switch track, the pagination pills and the toast
close button are the same size in both.

Both densities are first-class. Every component either sits on the density scale
or says in its own file why it does not, and both are gated by the axe and visual
checks — so `compact` is a mode the framework was designed in, not a squeeze
applied to `crisp`. Build a dense admin view in `compact` without checking how it
looks in `crisp`, and vice versa.

## Design foundations

Mostly bare tags and framework-internal tokens. The one attribute here is
`[data-scroll-progress]`, and it is optional.

### Type

Write `h1`–`h6` and stop. The scale escalates at the top (`h1` is fluid, roughly
1.7x `h2`) and tightens toward body, so a page has one loud voice instead of six
similar ones. `h5` and `h6` are labels, not sizes: `h5` is a small bold run-in,
`h6` a tracked-out uppercase eyebrow.
```html
<h1>Page title</h1>
<h2>Section</h2>
<h6>Eyebrow</h6>
```
Type is density-independent. Never reach for a smaller heading level to get a
smaller size — pick the level the document structure calls for.

### Elevation

Five rungs, `--elevation-0` … `--elevation-4`, each meaning a material state:

| Rung | Meaning | Typical use |
|------|---------|-------------|
| 0 | flush — in the page | bordered blocks |
| 1 | raised — attached | cards, fields, resting buttons |
| 2 | lifted — under the pointer | hover |
| 3 | floating — off the page | dropdowns, tooltips |
| 4 | overlay — above everything | dialogs, toasts |

```html
<article style="box-shadow: var(--elevation-3)">Floating</article>
```
Shadows are crisp, not diffuse: a tight contact layer plus one ambient layer,
inked from the theme's accent so a theme swap re-lights them. Don't author your
own `box-shadow` — pick a rung. `--shadow-sm`, `--shadow` and `--shadow-lg`
remain as aliases for rungs 1, 2 and 4.

### Motion

`--dur` and `--ease-hikarion` are the default pairing. Beside them,
`--dur-fast` (0.09s) for state flips that must feel instantaneous, and
`--dur-slow` (0.24s) for travel far enough that instant would read as a
teleport. `--ease-spring` is a damped curve with a small overshoot, for
direct-manipulation travel only — the switch thumb uses it; a dialog-sized
surface would read as wobble. All motion is neutralised globally under
`prefers-reduced-motion`.

### Scroll progress

`[data-scroll-progress]` is an empty, presentational element that paints a 3px
reading-progress bar pinned to the top of the viewport, filled by the document's
scroll position. One per document, as an early child of `<body>`, with
`aria-hidden="true"` — it has no accessible meaning and no pointer events. It has
no content, no size API and no variants; the only thing you can change is
`--accent`, which colours it.
```html
<div data-scroll-progress aria-hidden="true"></div>
```
Density-invariant by design: 3px is already the thinnest honest hairline. The bar
is entirely **absent** under `prefers-reduced-motion: reduce` and in browsers
without `animation-timeline: scroll()` — it collapses to nothing rather than
showing a stuck or full bar. Forced colours repaint it as `Highlight`. Do not
place it inside an ancestor with `transform`, `filter` or `contain: paint`; that
would trap the fixed positioning.

### View transitions

Theme and density changes cross-fade through the View Transitions API where the
browser has it. Enhancement only: `Hikarion.setTheme()` and a plain
`root.dataset.density = "compact"` both work with the API absent, and no style
depends on it. Core retunes only the timing of the root cross-fade — `--dur-slow`
on `--ease-hikarion` — and nulls it under `prefers-reduced-motion`.

`Hikarion.setTheme()` already wraps its own apply. For density, wrap it yourself
or don't — both are correct:
```html
<button onclick="setDensity('compact')">Compact</button>
<script>
  function setDensity(value) {
    const apply = () => (document.documentElement.dataset.density = value);
    if (document.startViewTransition) document.startViewTransition(apply);
    else apply();
  }
</script>
```
Core names no `view-transition-name`. Naming an element opts it out of the root
snapshot into its own morph — a page composition decision. Set it on your own
selectors when you want one.

### High contrast & forced colours

Both are automatic. There is no hook and no opt-in.

Under `prefers-contrast: more` Hikarion retunes two Tier-1 tokens for you:
`--muted` collapses into `--fg` (secondary text stops carrying hierarchy in hue
alone) and `--border` becomes a full-strength line, so surfaces, cards and
fields keep their edges. `--line` derives from `--border`, so inner rules stay
lighter than outer edges. Soft tone edges go solid, the tint background holds,
and both focus indicators thicken. `--accent` is deliberately unchanged: it is
the decisive colour and it is already gated at 4.5:1 on `--bg` and `--surface`.

If you author a theme, you get this for free — the contrast pass is written in
terms of your `--fg`, and it ships unlayered (the one block in Hikarion that
does) so it still applies over your own unlayered theme, at a specificity above
your `[data-theme="…"]` scope. If
you want a permanently high-contrast look regardless of the OS setting, ship it
as a theme; that is what themes are for.

Under `forced-colors: active` every author colour is replaced by the user's
palette, which flattens the accent-carried states. Hikarion restates each one in
system colours. Your own markup only has to hold up one end of this: never
signal state with colour alone. Every selected/current/on state in the contracts
above also carries an ARIA attribute or `:checked`, which is exactly what these
rules key off.

## Tier-1 tokens

These ~20 tokens **are** a theme. Set them on `:root` or a `[data-theme]`
container to restyle everything. Every `accent`/`success`/`warning`/`danger`
pairs with a readable `-content` token, gated at 4.5:1 contrast for solid fills.

```
--bg  --fg  --surface  --muted  --border
--accent  --accent-content
--success  --success-content
--warning  --warning-content
--danger   --danger-content
--radius  --space
--ease-hikarion  --dur
--font  --mono
```

Colors are OKLCH. Depth and tints are mixed from `--accent`, so switching the
accent re-lights shadows for free. You never set Tier-2 tokens (spacing scale,
radius scale, shadows, tint recipe) — Hikarion derives them.

## Your own CSS

Hikarion is a starting point, not a cage. Layout that is yours to own — page grid,
one-off spacing, bespoke components Hikarion doesn't cover — is plain CSS you
write unlayered; it always wins over Hikarion with no `!important`. The rule
against freestyling is about **restyling Hikarion's components** with utility
classes, not about you owning your page's layout.

Everything Hikarion ships is inside `@layer hikarion`, and unlayered CSS beats
layered CSS regardless of specificity or source order. So a one-word selector is
enough, and `!important` is never needed:

```css
button { border-radius: 0; }              /* wins over @layer hikarion */
.report article { box-shadow: var(--elevation-0); }
```

Read Hikarion's tokens in your own rules (`var(--space-4)`, `var(--elevation-3)`)
instead of magic numbers, and your CSS follows the theme and the density too.
If your own CSS uses layers, put `@layer hikarion, app;` at the top of your entry
stylesheet so the order can't depend on load order.

Escalate in this order and stop at the first rung that works: change a Tier-1
token → ship a theme → write a plain unlayered rule → stop using the hook and own
the element outright.

## Reference compositions

Three whole pages, built only from the vocabulary above, are the ones to copy
when you need a layout rather than a component:

| Page | Shows |
|------|-------|
| [`compositions/dashboard.html`](https://github.com/pghqdev/HikarionUI/blob/main/compositions/dashboard.html) | Sidebar shell, breadcrumbs, split-button menu, stat cards, a `compact` table region, pagination, empty state |
| [`compositions/settings.html`](https://github.com/pghqdev/HikarionUI/blob/main/compositions/settings.html) | Settings rail, form layout, fieldsets, dropzone, tabs and switches in `compact`, a destructive `<dialog>` |
| [`compositions/auth.html`](https://github.com/pghqdev/HikarionUI/blob/main/compositions/auth.html) | Centred single-card flow, stepper, native validation, one solid primary action |

They carry **zero classes**. Each has a small page-local `<style>` holding the
page grid and nothing else — that is the "Your own CSS" line drawn in practice:
layout is yours, appearance is Hikarion's. Density is composed, not global: a
crisp page with a `data-density="compact"` region is the normal shape.

Check your own markup the same way the compositions are checked:

```sh
bun scripts/validate-markup.mjs my-page.html
```

It reads the vocabulary out of `docs/public-surface.md` and flags invented
`data-*` hooks, tones outside the grammar, and utility-shaped or off-vocabulary
classes.

## Install

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/hikarion-ui/dist/hikarion.min.css">
<script src="https://cdn.jsdelivr.net/npm/hikarion-ui/dist/hikarion.js" defer></script>
```
`hikarion.js` is optional (theme switch/persistence, tabs, toast, dialog polyfill,
chip toggle, copy buttons). Every helper is documented as paste-it-yourself
vanilla, so the JS stays optional. Call `Hikarion.init(root)` after injecting
markup to wire it — it's idempotent.

Targets evergreen browsers: the floor is Chrome 111 / Safari 16.2 / Firefox 113
(`@layer`, OKLCH, `color-mix()`). Newer features — container queries, anchor
positioning, View Transitions, invoker commands, scroll-driven animations — are
enhancements with designed fallbacks, never polyfills, and every fallback leaves
the markup readable and operable. Details:
[browser support](https://github.com/pghqdev/HikarionUI/blob/main/docs/browser-support.md),
[tokens](https://github.com/pghqdev/HikarionUI/blob/main/docs/tokens.md),
[accessibility](https://github.com/pghqdev/HikarionUI/blob/main/docs/accessibility.md).
