// DOM overlay for all text: HUD, captions, banners, menus, world-space labels.
// Text lives in HTML so it stays crisp at any zoom on a phone.

const root = document.createElement("div");
root.id = "ui";
document.body.appendChild(root);
root.innerHTML = `
  <div id="hud"></div>
  <div id="meter"><span class="eye">seen</span><div class="bar"><div class="fill"></div></div></div>
  <div id="namebox"><div class="prompt"></div><input maxlength="24" autocomplete="off" spellcheck="false"><button>OK</button><div class="keys"></div></div>
  <div id="corner">
    <button id="btn-mute" aria-label="sound">&#9834;</button>
    <button id="btn-home" aria-label="map">&#8962;</button>
  </div>
  <div id="caption"><div class="label"></div><div class="text"></div></div>
  <div id="banner"><div class="title"></div><div class="sub"></div><div class="hint"></div></div>
  <div id="labels"></div>
  <div id="fade"></div>
`;

const $ = (sel) => root.querySelector(sel);
const hud = $("#hud");
const caption = $("#caption");
const banner = $("#banner");
const labels = $("#labels");
const fadeEl = $("#fade");
let captionTimer = 0;

// Removes em dashes from any on-screen string (spec rule), even if content has them.
export function esc(s) {
  return clean(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

export function clean(s) {
  return String(s ?? "").replace(/—/g, ", ").replace(/–/g, "-");
}

export const ui = {
  root,

  setHud(html) {
    hud.innerHTML = html;
  },

  caption(label, text, ms = 3800) {
    caption.querySelector(".label").textContent = clean(label);
    caption.querySelector(".text").textContent = clean(text);
    caption.classList.add("show");
    clearTimeout(captionTimer);
    if (ms > 0) captionTimer = setTimeout(() => caption.classList.remove("show"), ms);
  },

  hideCaption() {
    clearTimeout(captionTimer);
    caption.classList.remove("show");
  },

  banner(title, sub = "", hint = "", cls = "") {
    banner.className = cls;
    banner.querySelector(".title").textContent = clean(title);
    banner.querySelector(".sub").textContent = clean(sub);
    banner.querySelector(".hint").textContent = clean(hint);
    void banner.offsetWidth;
    banner.classList.add("show");
  },

  // Banner whose body is trusted HTML built by the game (strings inside must be escaped).
  panel(title, html, hint = "") {
    this.banner(title, "", hint);
    banner.querySelector(".sub").innerHTML = html;
  },

  hideBanner() {
    banner.classList.remove("show");
  },

  // World-space label. Call every frame with screen coords in CSS px.
  label(id, text, sx, sy, cls = "") {
    let el = labels.querySelector(`[data-id="${id}"]`);
    if (!el) {
      el = document.createElement("div");
      el.dataset.id = id;
      labels.appendChild(el);
    }
    el.className = `wlabel ${cls}`;
    el.style.display = text ? "" : "none";
    if (el.textContent !== clean(text)) el.textContent = clean(text);
    el.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  },

  clearLabels() {
    labels.innerHTML = "";
  },

  fade(on, ms = 400) {
    fadeEl.style.transitionDuration = `${ms}ms`;
    fadeEl.classList.toggle("on", on);
    return new Promise((r) => setTimeout(r, ms));
  },

  clearAll() {
    this.setHud("");
    this.meter(null);
    this.hideCaption();
    this.hideBanner();
    this.clearLabels();
  },

  // Ghost "seen" meter. value null hides it.
  meter(value, cloaked = false) {
    const m = $("#meter");
    m.style.display = value == null ? "none" : "flex";
    if (value == null) return;
    m.querySelector(".fill").style.width = `${Math.round(value * 100)}%`;
    m.classList.toggle("cloaked", cloaked);
  },

  // Text input for naming World 9. Resolves with the trimmed name.
  // opts.picker shows an on-screen letter grid for gamepads (no OS keyboard on a TV).
  askName(prompt, opts = {}) {
    const box = $("#namebox");
    const input = box.querySelector("input");
    box.querySelector(".prompt").textContent = clean(prompt);
    input.value = "";
    box.classList.add("show");
    buildKeys();
    this.namePicker(!!opts.picker);
    if (!opts.picker) setTimeout(() => input.focus(), 50);
    return new Promise((resolve) => {
      const done = () => {
        const v = input.value.replace(/\u2014/g, " ").trim().slice(0, 24);
        if (!v) return;
        box.classList.remove("show");
        input.blur();
        resolve(v);
      };
      nameDone = done;
      box.querySelector("button").onclick = done;
      input.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") done(); };
      input.onkeyup = (e) => e.stopPropagation();
    });
  },

  // Letter grid: show/hide, move the highlight, press the highlighted key.
  namePicker(on) {
    const keys = $("#namebox .keys");
    keys.classList.toggle("show", on);
    if (on) { $("#namebox input").blur(); highlight(); }
  },
  nameNav(dx, dy) {
    const n = KEYS.length;
    if (dx) keySel = (keySel + dx + n) % n;
    if (dy) keySel = (keySel + dy * KEY_COLS + n) % n;
    highlight();
  },
  namePress() { pressKey(KEYS[keySel]); },
  nameDelete() { pressKey("del"); },
  nameSubmit() { nameDone?.(); },

  onHome(fn) { $("#btn-home").onclick = fn; },
  onMute(fn) { $("#btn-mute").onclick = fn; },
  setMuted(m) { $("#btn-mute").classList.toggle("off", m); },
  showHome(v) { $("#btn-home").style.display = v ? "" : "none"; },
};

// ---------- World 9 letter grid ----------
const KEY_COLS = 10;
const KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "'", "space", "del", "ok"];
const KEY_LABEL = { space: "space", del: "\u232B", ok: "OK" };
let keySel = 0;
let nameDone = null;

function buildKeys() {
  const wrap = $("#namebox .keys");
  if (wrap.childElementCount) return;
  KEYS.forEach((k, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = KEY_LABEL[k] || k;
    b.onclick = () => { keySel = i; highlight(); pressKey(k); };
    wrap.appendChild(b);
  });
}

function highlight() {
  $("#namebox .keys").querySelectorAll("button").forEach((b, i) => b.classList.toggle("sel", i === keySel));
}

// Letters are capitalized at the start of each word, lowercase otherwise.
function pressKey(k) {
  const input = $("#namebox input");
  let v = input.value;
  if (k === "ok") return nameDone?.();
  if (k === "del") v = v.slice(0, -1);
  else if (v.length < 24) {
    const ch = k === "space" ? " " : k;
    const startOfWord = v === "" || v.endsWith(" ");
    v += /[A-Z]/.test(ch) && !startOfWord ? ch.toLowerCase() : ch;
  }
  input.value = v;
}

// Small pixel icon as an <img>, from a Phaser texture key.
export function icon(game, key, scale = 2, frame) {
  const url = iconCache(game, key, frame);
  if (!url) return "";
  const f = game.textures.getFrame(key, frame);
  return `<img class="icon" src="${url}" style="width:calc(${f.width * scale}px * var(--ui, 1));height:calc(${f.height * scale}px * var(--ui, 1))">`;
}

const cache = new Map();
function iconCache(game, key, frame) {
  const ck = `${key}|${frame ?? ""}`;
  if (cache.has(ck)) return cache.get(ck);
  if (!game.textures.exists(key)) return null;
  const f = game.textures.getFrame(key, frame);
  const c = document.createElement("canvas");
  c.width = f.width; c.height = f.height;
  c.getContext("2d").drawImage(f.source.image, f.cutX, f.cutY, f.width, f.height, 0, 0, f.width, f.height);
  const url = c.toDataURL();
  cache.set(ck, url);
  return url;
}

export function clearIconCache() {
  cache.clear();
}
