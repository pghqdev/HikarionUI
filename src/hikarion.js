// hikarion.js — optional, dependency-free progressive enhancement.
// Helpers: copy buttons on <pre>, tabs wiring, a command-invoker fallback for
// <dialog>, theme switch + persistence, toast, and chip toggle/remove.
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

  // --- Dialog: native `command`/`commandfor` invokers do the work where
  // supported. Only polyfill the click when the browser lacks them. ---
  function dialogFallback() {
    if ("command" in HTMLButtonElement.prototype) return;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[commandfor]");
      if (!btn) return;
      const target = document.getElementById(btn.getAttribute("commandfor"));
      if (!target) return;
      const cmd = btn.getAttribute("command");
      if (cmd === "show-modal") target.showModal?.();
      else if (cmd === "close") target.close?.();
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
      document.body.appendChild(region);
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
    setTimeout(() => {
      if (!removed) region.appendChild(el);
    });
    if (duration > 0) timer = setTimeout(dismiss, duration);
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

  // --- Init: wire the per-element helpers inside `root`. Idempotent, so call
  // it again on any container you've injected markup into. ---
  /** @param {ParentNode} [root] */
  function init(root = document) {
    const q = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];
    q("pre").forEach(decorate);
    q("[data-tabs]").forEach(tabs);
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
    dialogFallback();
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
