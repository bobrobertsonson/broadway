// All on-screen text and HUD, drawn in pixels by the UI scene (scenes/UI.js) at the
// same scale as the game art. Game code calls this small API; it only records state,
// and the UI scene, which always renders on top, draws that state every frame.

// Removes em dashes from any on-screen string (spec rule), even if content has them.
export function clean(s) {
  return String(s ?? "").replace(/—/g, ", ").replace(/–/g, "-");
}

// World 9 letter grid.
export const KEY_COLS = 10;
export const KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "'", "space", "del", "ok"];
export const KEY_LABEL = { space: "space", del: "⌫", ok: "OK" };
const NAME_MAX = 24;

let captionTimer = 0;
let nameDone = null;

// Everything the UI scene draws. `v` counters tell it what changed.
export const state = {
  hud: { items: [], v: 0 },            // [{ icon?: textureKey, text?: string, dim?: bool, tip?: bool }]
  caption: { label: "", text: "", show: false, v: 0 },
  banner: { title: "", sub: "", hint: "", cls: "", rows: null, show: false, v: 0 },
  labels: new Map(),                   // id -> { text, x, y, cls } in game screen pixels
  meter: { value: null, cloaked: false },
  fade: { on: false, ms: 400, v: 0 },
  name: { active: false, prompt: "", value: "", sel: 0, picker: false, hint: "", v: 0 },
  buttons: { home: true, full: true, muted: false, rects: [] },
  handlers: { home: null, full: null, mute: null },
};

const bump = (o) => { o.v++; };

export const ui = {
  // items: [{ icon, text, dim, tip }]
  setHud(items = []) {
    state.hud.items = items;
    bump(state.hud);
  },

  caption(label, text, ms = 3800) {
    Object.assign(state.caption, { label: clean(label), text: clean(text), show: true });
    bump(state.caption);
    clearTimeout(captionTimer);
    // Long lines stay up long enough to read.
    if (ms > 0) captionTimer = setTimeout(() => this.hideCaption(), Math.max(ms, 1200 + (state.caption.label.length + state.caption.text.length) * 45));
  },

  hideCaption() {
    clearTimeout(captionTimer);
    if (!state.caption.show) return;
    state.caption.show = false;
    bump(state.caption);
  },

  // cls: "" (centered), "top", "bottom" (above the title screen's Jasmin), "dim" (darkened backdrop)
  banner(title, sub = "", hint = "", cls = "") {
    Object.assign(state.banner, { title: clean(title), sub: clean(sub), hint: clean(hint), cls, rows: null, show: true });
    bump(state.banner);
  },

  // Banner with a two-column list: rows = [[left, right], ...]
  panel(title, rows, hint = "") {
    this.banner(title, "", hint);
    state.banner.rows = rows.map(([a, b]) => [clean(a), clean(b)]);
    bump(state.banner);
  },

  hideBanner() {
    if (!state.banner.show) return;
    state.banner.show = false;
    bump(state.banner);
  },

  // Label anchored at its bottom center, in game screen pixels. Call every frame.
  // cls: "plain" (no box), "sel" (gold box), "small" (no box, dimmer) or "" (dark box).
  label(id, text, x, y, cls = "") {
    if (!text) { state.labels.delete(id); return; }
    state.labels.set(id, { text: clean(text), x: Math.round(x), y: Math.round(y), cls });
  },

  clearLabels() {
    state.labels.clear();
  },

  fade(on, ms = 400) {
    Object.assign(state.fade, { on, ms });
    bump(state.fade);
    return new Promise((r) => setTimeout(r, ms));
  },

  clearAll() {
    this.setHud([]);
    this.meter(null);
    this.hideCaption();
    this.hideBanner();
    this.clearLabels();
  },

  // Ghost "seen" meter. value null hides it.
  meter(value, cloaked = false) {
    state.meter.value = value;
    state.meter.cloaked = cloaked;
  },

  // Naming World 9. Typing (keyboard), tapping/clicking letters, or the gamepad
  // (nameNav/namePress/nameDelete/nameSubmit) all work. Resolves with the name.
  askName(prompt, opts = {}) {
    Object.assign(state.name, { active: true, prompt: clean(prompt), value: "", sel: 0, picker: true, hint: clean(opts.hint || "") });
    bump(state.name);
    return new Promise((resolve) => {
      nameDone = () => {
        const v = state.name.value.trim().slice(0, NAME_MAX);
        if (!v) return;
        state.name.active = false;
        bump(state.name);
        nameDone = null;
        resolve(v);
      };
    });
  },

  namePicker(on, hint = "") {
    if (state.name.hint === clean(hint)) return;
    state.name.hint = clean(hint);
    bump(state.name);
  },
  nameNav(dx, dy) {
    const n = KEYS.length;
    let s = state.name.sel;
    if (dx) s = (s + dx + n) % n;
    if (dy) s = (s + dy * KEY_COLS + n) % n;
    state.name.sel = s;
    bump(state.name);
  },
  namePress() { this.nameKey(KEYS[state.name.sel]); },
  nameDelete() { this.nameKey("del"); },
  nameSubmit() { nameDone?.(); },

  // One key of the letter grid (or a typed character).
  nameKey(k) {
    if (!state.name.active) return;
    let v = state.name.value;
    if (k === "ok") return nameDone?.();
    if (k === "del") v = v.slice(0, -1);
    else if (v.length < NAME_MAX) {
      const ch = k === "space" ? " " : k;
      // Grid letters: capital at the start of each word, lowercase otherwise.
      const startOfWord = v === "" || v.endsWith(" ");
      v += KEYS.includes(k) && /^[A-Z]$/.test(ch) && !startOfWord ? ch.toLowerCase() : ch;
    }
    state.name.value = v;
    bump(state.name);
  },

  // Corner buttons (drawn by the UI scene).
  onHome(fn) { state.handlers.home = fn; },
  onFull(fn) { state.handlers.full = fn; },
  onMute(fn) { state.handlers.mute = fn; },
  showHome(v) { state.buttons.home = v; },
  showFull(v) { state.buttons.full = v; },
  setMuted(m) { state.buttons.muted = m; },

  // True when a pointer press landed on a UI button, so scenes don't also treat it as a tap.
  hitsButton(p) {
    return state.buttons.rects.some((r) => p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h)
      || (state.name.active && !!state.name.gridRect && inRect(p, state.name.gridRect));
  },
};

function inRect(p, r) {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

// Typing a name on a keyboard.
window.addEventListener("keydown", (e) => {
  if (!state.name.active) return;
  if (e.key === "Enter") { e.preventDefault(); return nameDone?.(); }
  if (e.key === "Backspace") { e.preventDefault(); return ui.nameKey("del"); }
  if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) { e.preventDefault(); ui.nameKey(e.key); }
}, true);
