// hikarion.js — optional, dependency-free progressive enhancement.
// Helpers: copy buttons on <pre>, tabs wiring, APG menu keys on [data-menu],
// Esc/light-dismiss for hint tooltips where `popover="hint"` is unimplemented,
// a command-invoker fallback for <dialog> and popovers, theme switch +
// persistence, toast, chip toggle/remove.
// Hikarion.init(root) re-wires injected markup; it is idempotent. Every helper
// is also documented as paste-it-yourself vanilla, so the file stays optional.
//
// No-FOUC snippet — paste inline in <head>, BEFORE the stylesheet. It applies
// the saved theme before first paint; it cannot be deferred, so it can't live
// in this file:
//   <script>try{var t=localStorage.getItem("hikarion-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
(() => {
  let uid = 0;
  const THEME_KEY = "hikarion-theme";
  const STACK_MAX = 4;                       // most toasts the region will hold
  /** @type {WeakMap<Element, () => void>} */
  const dismissers = new WeakMap();          // toast → its own dismiss()

  // --- Copy buttons ---
  function decorate(pre) {
    if (pre.querySelector(".hk-copy")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hk-copy";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", async () => {
      const source = pre.querySelector("code") ?? pre;
      try {
        await navigator.clipboard.writeText(source.innerText.trimEnd());
        btn.textContent = "Copied";
        btn.dataset.copied = "";
        setTimeout(() => {
          btn.textContent = "Copy";
          delete btn.dataset.copied;
        }, 1400);
      } catch {
        btn.textContent = "Error";
        setTimeout(() => (btn.textContent = "Copy"), 1400);
      }
    });
    pre.appendChild(btn);
  }

  // --- Tabs: wire ARIA + roving arrow-key nav; toggle panel visibility.
  // No-JS leaves every panel visible, so this only ever hides. ---
  function tabs(root) {
    if ("hkTabs" in root.dataset) return;   // idempotent: init() may re-visit
    const list = root.querySelector("[data-tab-list]");
    if (!list) return;
    root.dataset.hkTabs = "";
    const tabs = [...list.querySelectorAll("button")];
    const panels = [...root.querySelectorAll("[data-tab-panel]")];
    // ponytail: 1:1 tabs↔panels, no nested [data-tabs]. Bail if it doesn't hold.
    if (!tabs.length || tabs.length !== panels.length) return;

    const group = uid++;
    list.setAttribute("role", "tablist");
    tabs.forEach((tab, i) => {
      const panel = panels[i];
      tab.setAttribute("role", "tab");
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("tabindex", "0");
      if (!tab.id) tab.id = `hk-tab-${group}-${i}`;
      if (!panel.id) panel.id = `hk-panel-${group}-${i}`;
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
      tab.addEventListener("click", () => select(i));
      tab.addEventListener("keydown", (e) => {
        const map = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        const next = (map[e.key] + tabs.length) % tabs.length;
        select(next);
        tabs[next].focus();
      });
    });

    function select(active) {
      tabs.forEach((tab, i) => {
        const on = i === active;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[i].hidden = !on;
      });
    }

    // Honour a pre-marked [aria-selected="true"] tab, else the first.
    select(Math.max(0, tabs.findIndex((t) => t.getAttribute("aria-selected") === "true")));
  }

  // --- Menus: upgrade a [data-menu] disclosure to an APG menu button.
  // The roles and the keyboard model ship together or not at all — role="menu"
  // without ↑/↓ lies to a screen reader, so both live here and no-JS keeps the
  // honest Tab-driven disclosure it already was. Gated on the Popover API too:
  // without it the panel is static, in flow and permanently visible (see the
  // @supports fallback in dropdown.css), which is a list of links, not a menu.
  // ponytail: rows are scanned live on every key, so appended rows just work;
  // Re-run Hikarion.init() after injecting rows to stamp their roles.
  function menu(panel) {
    if (!("togglePopover" in HTMLElement.prototype)) return;
    const rows = () => [...panel.querySelectorAll("button, a")];
    const list = rows();
    if (!list.length) return;
    // Stamped on every visit, not just the first: init() is the documented way
    // to adopt injected rows, and a role="menu" may own only menuitems. The
    // roving tab stop stays where it is — an appended row (default tabIndex 0)
    // must not become a second tab stop.
    const stop = list.find((r) => r.getAttribute("role") === "menuitem" && r.tabIndex === 0) ?? list[0];
    list.forEach((row) => {
      row.setAttribute("role", "menuitem");
      row.tabIndex = row === stop ? 0 : -1;
    });
    if ("hkMenu" in panel.dataset) return;    // listeners bind once
    panel.dataset.hkMenu = "";
    panel.setAttribute("role", "menu");
    // The trigger is the [popovertarget] button immediately before the panel —
    // the same relationship dropdown.css draws the chevron from.
    const trigger = panel.previousElementSibling?.closest?.("[popovertarget]");
    if (trigger) {
      trigger.setAttribute("aria-haspopup", "menu");
      // Enter/Space already open it (it's a button); APG adds the arrows.
      trigger.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
        e.preventDefault();
        panel.showPopover();
      });
    }

    const focusRow = (row) => {
      if (!row) return;
      rows().forEach((r) => (r.tabIndex = r === row ? 0 : -1));
      row.focus();
    };

    // Opening a menu moves focus into it — that is what makes it a menu rather
    // than a popover you have to Tab into. Esc, light-dismiss and focus return
    // stay the browser's.
    panel.addEventListener("toggle", (e) => {
      if (e.newState === "open") focusRow(rows()[0]);
    });

    // APG: activating a row closes the menu. The `command="hide-popover"` rows
    // already do it themselves without the script; links and plain buttons have
    // no native equivalent, and a click inside a popover is not a light-dismiss,
    // so a link row would navigate with the menu still hanging open. An
    // aria-disabled row is inert: it is focusable and announced, not activated.
    panel.addEventListener("click", (e) => {
      const row = e.target.closest?.("button, a");
      if (row && panel.contains(row) && row.getAttribute("aria-disabled") !== "true") panel.hidePopover();
    });

    panel.addEventListener("keydown", (e) => {
      // APG: Tab closes the menu and moves focus to the next element in the tab
      // sequence. The popover's own focus restore lands on the trigger first,
      // then the un-prevented default tab move continues from there — so focus
      // ends up after the trigger, which is exactly the APG contract. (Esc
      // differs: it stops at the trigger.) Not preventDefault'd: nothing is
      // gained by trapping a key whose whole job is to leave.
      if (e.key === "Tab") return void panel.hidePopover();
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const list = rows();
      const i = list.indexOf(document.activeElement);
      const step = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: list.length - 1 }[e.key];
      if (step !== undefined) {
        e.preventDefault();
        return focusRow(list[(step + list.length) % list.length]);
      }
      // Typeahead: one printable character jumps to the next row starting with
      // it, wrapping. ponytail: single character, no multi-key buffer — menu
      // labels here are short and distinct. Add a timed buffer if they aren't.
      if (e.key.length !== 1 || e.key === " ") return;
      const from = i < 0 ? 0 : i + 1;
      const match = list
        .slice(from)
        .concat(list.slice(0, from))
        .find((r) => r.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));
      if (match) {
        e.preventDefault();
        focusRow(match);
      }
    });
  }

  // --- Hint tooltips: give `popover="hint"` its Esc and light-dismiss where
  // the value itself is unimplemented. An unknown `popover` value falls back to
  // the *manual* state — visible, toggleable from its invoker, but never
  // light-dismissed or Esc-closed, which leaves WCAG 2.2 1.4.13 *dismissible*
  // unmet on every browser without `hint` (no shipping Safari today).
  // The attribute is not rewritten to "auto": `[popover="hint"]` is the
  // selector the whole bubble skin is keyed on, and `auto` would also close any
  // open menu. Two listeners instead of a mutation.
  function hints() {
    const probe = document.createElement("div");
    probe.popover = "hint";
    // Reflected enumerated attribute: unsupported values read back as "manual".
    if (probe.popover === "hint" || !("togglePopover" in HTMLElement.prototype)) return;
    const open = () => [...document.querySelectorAll('[popover="hint"]:popover-open')];
    document.addEventListener("keydown", (e) => {
      // No preventDefault: a hint is supplementary, and swallowing Esc would
      // stop it reaching the <dialog> or menu the user actually meant.
      if (e.key === "Escape") open().forEach((el) => el.hidePopover());
    });
    document.addEventListener("click", (e) => {
      for (const el of open()) {
        // Leave the invoker's own click alone — hiding here would race the
        // native toggle and reopen the bubble the user just dismissed.
        if (el.contains(e.target) || e.target.closest?.("[popovertarget]")?.popoverTargetElement === el) continue;
        el.hidePopover();
      }
    });
  }

  // --- Invoker commands: native `command`/`commandfor` buttons do the work
  // where supported; this only polyfills the click when the browser lacks them.
  // Popover shipped ~3 years before invoker commands, so the two are detected
  // separately — a browser can own `popover` fully and still ignore
  // `command="toggle-popover"`. Where the Popover API itself is missing there
  // is nothing to fall back to, and `[popovertarget]` (wider support, no JS at
  // all) stays the recommended declarative form for popovers.
  // ponytail: `request-close` degrades to close() — the fallback path skips the
  // cancellable `cancel` event. Ceiling: a listener that vetoes the close won't
  // be consulted pre-invokers. Upgrade = dispatch a cancelable `cancel` first.
  function invokerFallback() {
    if ("command" in HTMLButtonElement.prototype) return;
    const canPopover = "togglePopover" in HTMLElement.prototype;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button[commandfor][command]");
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("commandfor"));
      if (!target) return;
      const cmd = btn.getAttribute("command");
      if (cmd === "show-modal") target.showModal?.();
      else if (cmd === "close") target.close?.();
      else if (cmd === "request-close") (target.requestClose ?? target.close)?.call(target);
      else if (!canPopover || !cmd.endsWith("-popover")) return;
      else if (cmd === "toggle-popover") target.togglePopover();
      else if (cmd === "show-popover") target.showPopover();
      else if (cmd === "hide-popover") target.hidePopover();
    });
  }

  // --- Theme: set/persist the palette and reflect the active control. "auto"
  // (or null) clears the override and falls back to the OS preference. The swap
  // crossfades via a View Transition where supported, off under reduced-motion.
  /** @param {string} theme */
  function setTheme(theme) {
    const root = document.documentElement;
    const apply = () => {
      if (theme && theme !== "auto") root.dataset.theme = theme;
      else delete root.dataset.theme;
      try {
        if (theme && theme !== "auto") localStorage.setItem(THEME_KEY, theme);
        else localStorage.removeItem(THEME_KEY);
      } catch {}
      reflect();
    };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A transition skipped by a rapid re-switch rejects its promises; swallow.
    if (document.startViewTransition && !reduce) {
      const t = document.startViewTransition(apply);
      t.ready.catch(() => {});
      t.finished.catch(() => {});
    } else apply();
  }

  // Mark the [data-set-theme] control matching the active theme as pressed.
  function reflect() {
    const current = document.documentElement.dataset.theme || "auto";
    document.querySelectorAll("[data-set-theme]").forEach((el) => {
      const value = el.dataset.setTheme || "auto";
      el.setAttribute("aria-pressed", String(value === current));
    });
  }

  // Wire a declarative [data-set-theme] control (once — init() may re-visit).
  function themeControl(el) {
    if ("hkTheme" in el.dataset) return;
    el.dataset.hkTheme = "";
    el.addEventListener("click", () => setTheme(el.dataset.setTheme || "auto"));
  }

  // --- Toast: append a [data-toast] to a single live-region stack, created on
  // first use. Auto-dismisses after `duration` ms (0 keeps it until closed).
  // Returns a dismiss() to close it early. ---
  function toastRegion() {
    let region = document.querySelector("[data-toast-region]");
    if (!region) {
      region = document.createElement("div");
      region.setAttribute("data-toast-region", "");
      // aria-live only, no role="status" — the alert component styles bare
      // [role="status"], and the region must stay an unstyled positioning box.
      region.setAttribute("aria-live", "polite");
      // Manual popover → top layer, so a toast paints over an open modal
      // <dialog>. Manual, not auto: Esc and light-dismiss must not wipe the
      // stack, and it must not close other popovers. Browsers without the API
      // keep the z-index layer from toast.css.
      region.setAttribute("popover", "manual");
    }
    // The top layer does not escape inertness: a modal <dialog> makes every
    // element outside its own subtree inert, popovers included, so a toast
    // parked on <body> would be visible but unfocusable and unclickable.
    // Park it inside the open modal instead and hand it back on close.
    // ponytail: last :modal in DOM order, not true top-layer order — stacked
    // modals would need a real stack, and nothing here opens two.
    const host = [...document.querySelectorAll("dialog:modal")].pop() || document.body;
    if (region.parentNode !== host) {
      host.appendChild(region);            // re-parenting drops it from the top layer
      try { region.showPopover(); } catch { /* no Popover API — z-index it is */ }
      if (host !== document.body) host.addEventListener("close", () => {
        if (region.isConnected) toastRegion();   // still live → re-home on <body>
      }, { once: true });
    }
    return region;
  }

  /**
   * @param {string} message
   * @param {{ duration?: number, closable?: boolean, variant?: "accent" | "success" | "warning" | "danger" }} [options]
   * @returns {() => void}
   */
  function toast(message, { duration = 4000, closable = true, variant } = {}) {
    const region = toastRegion();
    const el = document.createElement("div");
    el.setAttribute("data-toast", "");
    // Passed through verbatim — the tone grammar lives in CSS (base/tone.css).
    if (variant) el.setAttribute("data-variant", variant);
    const text = document.createElement("span");
    text.textContent = message;
    el.appendChild(text);

    let timer, removed = false;
    dismissers.set(el, () => dismiss());
    // Remove the toast, and the region with it once it holds no more toasts —
    // an empty region left behind reads as a stray shell.
    const remove = () => {
      if (removed) return;
      removed = true;
      el.remove();
      if (!region.querySelector("[data-toast]")) region.remove();
    };
    const dismiss = () => {
      if ("closing" in el.dataset) return;     // already leaving
      clearTimeout(timer);
      el.dataset.closing = "";
      el.addEventListener("animationend", remove, { once: true });
      setTimeout(remove, 300);                 // fallback if animationend is missed
    };

    if (closable) {
      const close = document.createElement("button");
      close.type = "button";
      close.setAttribute("data-toast-close", "");
      close.setAttribute("aria-label", "Dismiss");
      close.textContent = "✕";
      close.addEventListener("click", dismiss);
      el.appendChild(close);
    }

    // Announce, don't just insert: a live region has to be in the DOM *before*
    // its content changes or the insertion is never announced. The region is
    // created on first use (and torn down when the last toast leaves), so on
    // any given call it may be one statement old — hand the append to the next
    // task so the region is registered first. `removed` guards a dismiss()
    // that beat the append.
    // Severity picks the politeness: an error is feedback on something the user
    // just did, and waiting for a pause can leave them acting on a failed
    // operation; anything else is not worth interrupting a sentence for.
    // aria-live is read when the content changes, so setting it now applies to
    // this toast.
    region.setAttribute("aria-live", variant === "danger" ? "assertive" : "polite");
    setTimeout(() => {
      if (removed) return;
      // The region clips at the viewport, and a clipped toast is still in the
      // DOM — its ✕ keeps its place in the tab order, focusable but invisible.
      // Evict the oldest so nothing is ever only visually gone. Runs here, not
      // at call time: the append is deferred, so a synchronous burst of
      // toast() calls would all read the same empty region and evict nothing.
      // ponytail: a flat count, not a measured fit — four is already more
      // feedback than anyone reads at once. Measure if a caller disagrees.
      const live = [...region.querySelectorAll("[data-toast]:not([data-closing])")];
      for (const old of live.slice(0, live.length - (STACK_MAX - 1))) dismissers.get(old)?.();
      region.appendChild(el);
    });
    // WCAG 2.2.1 — a toast must not expire while it is being read or while its
    // ✕ holds focus. Leaving re-arms the full duration.
    if (duration > 0) {
      // Re-arm on leaving — but not while the ✕ still holds focus, or a mouse
      // drifting off a toast a keyboard user is sitting on restarts its clock.
      const arm = () => {
        clearTimeout(timer);
        if (el.contains(document.activeElement)) return;
        timer = setTimeout(dismiss, duration);
      };
      const hold = () => clearTimeout(timer);
      el.addEventListener("pointerenter", hold);
      el.addEventListener("focusin", hold);
      el.addEventListener("pointerleave", arm);
      el.addEventListener("focusout", arm);
      arm();
    }
    return dismiss;
  }

  // --- Chips: delegated, so dynamically added chips just work. A filter chip
  // opts in by pre-setting aria-pressed; [data-chip-remove] removes its chip.
  function chips() {
    document.addEventListener("click", (e) => {
      const rm = e.target.closest("[data-chip-remove]");
      if (rm) return void rm.closest("[data-chip]")?.remove();
      const chip = e.target.closest("button[data-chip][aria-pressed]");
      if (chip) chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
    });
  }

  // --- Dropzones: delegated drag/drop + filename display for
  // `label[data-dropzone]` wrapping a hidden `input[type=file]`. Toggles
  // [data-dragover] for the highlight and writes the chosen filename into a
  // [data-dropzone-filename] slot, marking the label [data-chosen]. ---
  function dropzones() {
    document.addEventListener("dragenter", (e) => {
      const zone = e.target.closest("[data-dropzone]");
      if (zone) zone.dataset.dragover = "";
    });
    document.addEventListener("dragover", (e) => {
      const zone = e.target.closest("[data-dropzone]");
      if (zone) e.preventDefault();
    });
    document.addEventListener("dragleave", (e) => {
      const zone = e.target.closest("[data-dropzone]");
      if (zone && !zone.contains(e.relatedTarget)) delete zone.dataset.dragover;
    });
    document.addEventListener("drop", (e) => {
      const zone = e.target.closest("[data-dropzone]");
      if (!zone) return;
      e.preventDefault();
      delete zone.dataset.dragover;
      const input = zone.querySelector("input[type=file]");
      if (!input) return;
      const files = e.dataTransfer?.files;
      if (files && files.length) {
        input.files = files;
        reflectDropzone(zone, input);
      }
    });
    document.addEventListener("change", (e) => {
      const input = e.target.closest("input[type=file]");
      if (!input) return;
      const zone = input.closest("[data-dropzone]");
      if (zone) reflectDropzone(zone, input);
    });
  }

  // Write the selected filename(s) into the slot, or a count for multiples.
  function reflectDropzone(zone, input) {
    const slot = zone.querySelector("[data-dropzone-filename]");
    const files = input.files;
    if (slot && files.length) {
      slot.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
      zone.dataset.chosen = "";
    }
  }

  // --- Command palette: filter a [data-palette] dialog's command list as the
  // user types, and drive it from the keyboard.
  //
  // The APG combobox shape, not a menu: DOM focus never leaves the input (you
  // are still typing), so the active row is named by aria-activedescendant and
  // marked with aria-selected — which is also the only thing palette.css has to
  // draw the highlight from. Rows are role="option" in a role="listbox".
  //
  // Filtering is the enhancement and the list is the feature: with this script
  // absent every command is still visible, readable and clickable, and the
  // empty state stays `hidden` because nothing can filter it into view.
  // ponytail: substring match, no fuzzy scoring. A palette a human typed the
  // commands into is not a search index.
  function palette(dialog) {
    const input = dialog.querySelector("input");
    const list = dialog.querySelector("[role=listbox]") ?? input?.nextElementSibling;
    if (!input || !list) return;

    const group = "hkPaletteId" in dialog.dataset ? dialog.dataset.hkPaletteId : (dialog.dataset.hkPaletteId = String(uid++));
    list.setAttribute("role", "listbox");
    if (!list.id) list.id = `hk-palette-list-${group}`;
    // A listbox announces as a bare "list box" without one, and the dialog's own
    // label does not reach it.
    if (!list.hasAttribute("aria-label") && !list.hasAttribute("aria-labelledby"))
      list.setAttribute("aria-label", input.getAttribute("aria-label") || "Results");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", list.id);
    input.setAttribute("aria-expanded", "true");
    // Tells AT that typing narrows the list, which is the whole interaction.
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("autocomplete", "off");
    const empty = dialog.querySelector("[data-empty]");

    const rows = () => [...list.querySelectorAll("button, a")];
    // Stamped on every visit, not just the first: init() is the documented way
    // to adopt injected rows, and an unstamped row has no id for
    // aria-activedescendant to name, no role for the highlight to match, and a
    // default tabIndex that makes it a stray tab stop inside the modal.
    rows().forEach((row, i) => {
      row.setAttribute("role", "option");
      if (!row.id) row.id = `hk-palette-${group}-${i}`;
      // A row is not a tab stop: ↑/↓ from the input is the whole navigation
      // model, and Tab must leave the palette rather than walk 40 commands.
      row.tabIndex = -1;
    });
    // role="listbox" may own only options and groups, so the decorative rules
    // have to leave the tree. Stamped here, not asked of the author: the role
    // that makes them invalid is one this function added.
    list.querySelectorAll("hr").forEach((hr) => hr.setAttribute("role", "presentation"));

    if ("hkPalette" in dialog.dataset) return;   // listeners bind once
    dialog.dataset.hkPalette = "";

    // Inert rows stay in the walk. `aria-disabled` means announced-but-inert
    // everywhere else in the system (dropdown.css, pagination), so skipping
    // them here would hide from a keyboard user a command a mouse user can see.
    // Enter refuses to fire them instead.
    const shown = () => rows().filter((r) => !r.hidden);
    // `scroll` is false on the pointer path: scrolling a row into view moves a
    // different row under a stationary cursor, whose pointermove then selects
    // it — the list walks itself.
    const select = (row, scroll = true) => {
      if (row && row.getAttribute("aria-selected") === "true") return;
      rows().forEach((r) => r.setAttribute("aria-selected", String(r === row)));
      if (!row) return void input.removeAttribute("aria-activedescendant");
      input.setAttribute("aria-activedescendant", row.id);
      if (scroll) row.scrollIntoView({ block: "nearest" });
    };

    const filter = () => {
      const q = input.value.trim().toLowerCase();
      for (const row of rows()) row.hidden = q !== "" && !row.textContent.toLowerCase().includes(q);
      // A separator needs a visible row on BOTH sides. Looking only forward
      // leaves it stranded as the first visible thing in the list whenever the
      // query matches nothing above it.
      const liveSide = (hr, dir) => {
        let el = hr[dir];
        while (el && el.tagName !== "HR") {
          if (el.matches("button, a") && !el.hidden) return true;
          el = el[dir];
        }
        return false;
      };
      for (const hr of list.querySelectorAll("hr"))
        hr.hidden = !(liveSide(hr, "nextElementSibling") && liveSide(hr, "previousElementSibling"));
      const visible = shown();
      if (empty) empty.hidden = visible.length > 0;
      select(visible[0]);
    };

    input.addEventListener("input", filter);
    input.addEventListener("keydown", (e) => {
      const visible = shown();
      if (e.key === "Enter") {
        // The first visible row is preselected from the moment the palette
        // opens, so Enter on an untouched palette runs it — that is the point
        // of a palette, not an accident. Enter with nothing matched does
        // nothing, and an inert row refuses to fire.
        const active = visible.find((r) => r.getAttribute("aria-selected") === "true");
        if (!active || active.getAttribute("aria-disabled") === "true") return;
        e.preventDefault();
        active.click();
        return;
      }
      const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (!step || !visible.length) return;
      e.preventDefault();
      const i = visible.findIndex((r) => r.getAttribute("aria-selected") === "true");
      select(visible[(i + step + visible.length) % visible.length]);
    });

    // Pointer and keyboard must agree on which row is active, or hovering one
    // row and pressing Enter runs another.
    list.addEventListener("pointermove", (e) => {
      const row = e.target.closest?.("button, a");
      if (row && !row.hidden) select(row, false);
    });
    // A command that ran is done: close the dialog so the page is usable again.
    list.addEventListener("click", (e) => {
      if (e.target.closest?.("button, a")) dialog.close();
    });
    // Reopening starts fresh — a stale query from last time reads as a bug.
    dialog.addEventListener("close", () => { input.value = ""; filter(); });
    filter();
  }

  // --- Init: wire the per-element helpers inside `root`. Idempotent, so call
  // it again on any container you've injected markup into. ---
  /** @param {ParentNode} [root] */
  function init(root = document) {
    const q = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];
    q("pre").forEach(decorate);
    q("[data-tabs]").forEach(tabs);
    q("[data-menu]").forEach(menu);
    q("dialog[data-palette]").forEach(palette);
    q("[data-set-theme]").forEach(themeControl);
    reflect();
  }

  function run() {
    // Apply the saved theme — fallback for when the inline no-FOUC snippet
    // wasn't installed.
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && !document.documentElement.dataset.theme)
        document.documentElement.dataset.theme = saved;
    } catch {}
    invokerFallback();
    hints();
    chips();
    dropzones();
    init();
  }

  window.Hikarion = Object.assign(window.Hikarion || {}, { setTheme, toast, init });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
