// DOM overlay for all text: HUD, captions, banners, menus, world-space labels.
// Text lives in HTML so it stays crisp at any zoom on a phone.

const root = document.createElement("div");
root.id = "ui";
document.body.appendChild(root);
root.innerHTML = `
  <div id="hud"></div>
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
    this.hideCaption();
    this.hideBanner();
    this.clearLabels();
  },

  onHome(fn) { $("#btn-home").onclick = fn; },
  onMute(fn) { $("#btn-mute").onclick = fn; },
  setMuted(m) { $("#btn-mute").classList.toggle("off", m); },
  showHome(v) { $("#btn-home").style.display = v ? "" : "none"; },
};

// Small pixel icon as an <img>, from a Phaser texture key.
export function icon(game, key, scale = 2, frame) {
  const url = iconCache(game, key, frame);
  if (!url) return "";
  const f = game.textures.getFrame(key, frame);
  return `<img class="icon" src="${url}" style="width:${f.width * scale}px;height:${f.height * scale}px">`;
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
