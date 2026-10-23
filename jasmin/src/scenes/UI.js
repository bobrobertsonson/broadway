import { state, KEYS, KEY_COLS, ui } from "../ui.js";
import { FONTS, makeFonts, fontSafe } from "../font.js";
import { controls } from "../controls.js";

// Overlay scene: all text, HUD and buttons, drawn in pixels at the game's own scale.
// It runs for the whole game and renders on top (it is last in the scene list).
// It only reads `state` from ui.js; game code never talks to it directly.

const INK = 0x141012;
const GOLD = 0xe0a43a;
const CREAM = 0xf4f1ea;
const KEY_GLYPH = { space: "_", del: "⌫", ok: "OK" };

export class UI extends Phaser.Scene {
  constructor() { super("UI"); }

  create() {
    makeFonts(this);
    this.makeButtonIcons();
    this.seen = {};
    this.labelPool = new Map();
    this.layers = {};
    for (const [name, depth] of [["labels", 0], ["hud", 10], ["meter", 12], ["caption", 20], ["banner", 30], ["name", 40], ["buttons", 50]]) {
      this.layers[name] = this.add.container(0, 0).setDepth(depth);
    }
    this.fadeRect = this.add.rectangle(0, 0, 10, 10, INK, 1).setOrigin(0).setDepth(100).setAlpha(0);
    this.rotate = this.add.container(0, 0).setDepth(200);
    this.scale.on("resize", () => { this.seen = {}; });
    this.input.on("pointerdown", (p) => this.onPointer(p));
  }

  // ---------- helpers ----------

  get W() { return this.scale.width; }
  get H() { return this.scale.height; }
  get safe() { return { x: Math.max(4, Math.round(this.W * 0.03)), y: Math.max(4, Math.round(this.H * 0.035)) }; }

  text(str, which = "small", tint = 0xffffff) {
    const t = this.add.bitmapText(0, 0, FONTS[which], fontSafe(str, which));
    if (tint !== 0xffffff) t.setTint(tint);
    return t;
  }

  // Pixel box with clipped corners: fill plus optional 1px border.
  box(g, x, y, w, h, fill = INK, alpha = 0.85, border = null) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (border != null) {
      g.fillStyle(border, 1);
      g.fillRect(x + 1, y, w - 2, 1).fillRect(x + 1, y + h - 1, w - 2, 1).fillRect(x, y + 1, 1, h - 2).fillRect(x + w - 1, y + 1, 1, h - 2);
      g.fillStyle(fill, alpha).fillRect(x + 1, y + 1, w - 2, h - 2);
    } else {
      g.fillStyle(fill, alpha).fillRect(x + 1, y, w - 2, h).fillRect(x, y + 1, w, h - 2);
    }
    return g;
  }

  // Empty a layer, stopping tweens on anything inside it first.
  clear(layer) {
    this.tweens.killTweensOf(layer);
    this.tweens.killTweensOf(layer.list);
    return layer.removeAll(true);
  }

  changed(key, v) {
    if (this.seen[key] === v) return false;
    this.seen[key] = v;
    return true;
  }

  // ---------- frame ----------

  update() {
    const { W, H } = this;
    if (this.changed("hud", state.hud.v)) this.drawHud();
    if (this.changed("banner", state.banner.v)) { this.drawBanner(); this.seen.caption = null; }
    if (this.changed("meterOn", state.meter.value != null)) this.seen.caption = null;
    if (this.changed("caption", state.caption.v)) this.drawCaption();
    if (this.changed("name", state.name.v)) this.drawName();
    this.drawMeter();
    this.drawLabels();
    this.drawButtons();
    this.drawRotate();
    // Fade
    this.fadeRect.setSize(W, H);
    if (this.changed("fade", state.fade.v)) {
      this.tweens.killTweensOf(this.fadeRect);
      this.tweens.add({ targets: this.fadeRect, alpha: state.fade.on ? 1 : 0, duration: state.fade.ms });
    }
  }

  // ---------- HUD ----------

  drawHud() {
    const c = this.clear(this.layers.hud);
    const s = this.safe;
    let x = s.x;
    const cy = s.y + 6;
    for (const it of state.hud.items) {
      const alpha = it.dim ? 0.35 : 1;
      if (it.icon && this.textures.exists(it.icon)) {
        const img = this.add.image(x, cy, it.icon).setOrigin(0, 0.5).setAlpha(alpha);
        c.add(img);
        x += img.width + 2;
      }
      if (it.text) {
        const t = this.text(it.text).setOrigin(0, 0.5).setPosition(x, cy).setAlpha(alpha);
        if (it.tip) {
          const g = this.add.graphics();
          this.box(g, x - 3, cy - Math.ceil(t.height / 2) - 2, t.width + 6, t.height + 3, INK, 0.6);
          c.add(g);
        }
        c.add(t);
        x += t.width + 2;
      }
      x += 6;
    }
  }

  // ---------- caption ----------

  drawCaption() {
    const c = this.clear(this.layers.caption);
    const cap = state.caption;
    if (!cap.show) return;
    const s = this.safe;
    const maxW = Math.min(this.W - s.x * 2, 300);
    const parts = [];
    if (cap.label) parts.push(this.text(cap.label.toUpperCase(), "small", GOLD));
    const body = this.text(cap.text).setMaxWidth(maxW - 12).setCenterAlign();
    parts.push(body);
    const w = Math.min(maxW, Math.max(...parts.map((p) => p.width)) + 12);
    let h = 5;
    for (const p of parts) h += p.height + 2;
    // Below a top banner if one is showing, otherwise just under the HUD row.
    const topBanner = state.banner.show && state.banner.cls === "top" ? this.bannerBottom : 0;
    const x = Math.round((this.W - w) / 2);
    // Drop below the ghost meter when the box would reach over it.
    const underMeter = state.meter.value != null && x < s.x + 124 ? s.y + 30 : 0;
    const y = Math.max(s.y + 18, topBanner + 2, underMeter);
    c.add(this.box(this.add.graphics(), x, y, w, h + 2, INK, 0.85, GOLD));
    let ty = y + 4;
    for (const p of parts) {
      p.setOrigin(0.5, 0).setPosition(Math.round(this.W / 2), ty);
      ty += p.height + 2;
      c.add(p);
    }
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
  }

  // ---------- banner (titles, menus, pause, inventory) ----------

  drawBanner() {
    const c = this.clear(this.layers.banner);
    const b = state.banner;
    if (!b.show) return;
    const { W, H } = this;
    if (b.cls === "dim") c.add(this.add.rectangle(0, 0, W, H, INK, 0.6).setOrigin(0));
    const items = [];
    if (b.title) items.push(this.text(b.title, "big").setMaxWidth(W - 24).setCenterAlign());
    if (b.sub) items.push(this.text(b.sub).setMaxWidth(Math.round(W * 0.8)).setCenterAlign());
    if (b.rows) items.push(this.rowsBlock(b.rows));
    let hint = null;
    if (b.hint) {
      hint = this.text(b.hint, "small", b.cls === "dim" ? 0xffffff : CREAM).setMaxWidth(W - 24).setCenterAlign();
      items.push(hint);
    }
    const gap = 5;
    const total = items.reduce((a, it) => a + it.height, 0) + gap * (items.length - 1);
    let y;
    if (b.cls === "top") y = this.safe.y + 18; // under the HUD row and corner buttons
    else if (b.cls === "bottom") y = H - 13; // on the ground strip, below Jasmin
    else y = Math.round((H - total) / 2);
    for (const it of items) {
      it.setPosition(Math.round((W - it.width) / 2), Math.round(y));
      if (it.setOrigin) it.setOrigin(0, 0);
      y += it.height + gap;
      c.add(it);
    }
    if (hint && b.cls !== "dim") {
      if (b.cls === "bottom") {
        const g = this.add.graphics();
        this.box(g, hint.x - 5, hint.y - 2, hint.width + 10, hint.height + 3, INK, 0.55);
        c.addAt(g, 0);
      } else this.tweens.add({ targets: hint, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    }
    this.bannerBottom = b.cls === "top" ? Math.round(y) : 0;
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 250 });
  }

  // Two columns: gold left, white right (the ending's inventory).
  rowsBlock(rows) {
    const cont = this.add.container(0, 0);
    const lefts = rows.map(([a]) => this.text(a, "small", GOLD));
    const rights = rows.map(([, b]) => this.text(b));
    const lw = Math.max(...lefts.map((t) => t.width)) + 8;
    const rw = Math.max(...rights.map((t) => t.width));
    let y = 0;
    rows.forEach((_, i) => {
      lefts[i].setPosition(0, y);
      rights[i].setPosition(lw, y);
      cont.add([lefts[i], rights[i]]);
      y += Math.max(lefts[i].height, rights[i].height) + 2;
    });
    cont.setSize(lw + rw, y - 2);
    return cont;
  }

  // ---------- world labels ----------

  drawLabels() {
    const live = new Set();
    for (const [id, L] of state.labels) {
      live.add(id);
      let e = this.labelPool.get(id);
      if (!e || e.text !== L.text || e.cls !== L.cls) {
        e?.cont.destroy();
        const cont = this.add.container(0, 0);
        const t = this.text(L.text, "small", L.cls === "small" ? 0xd8d4e0 : 0xffffff).setOrigin(0.5, 1);
        if (L.cls === "" || L.cls === "sel") {
          const g = this.add.graphics();
          this.box(g, -Math.ceil(t.width / 2) - 3, -t.height - 2, t.width + 6, t.height + 3, INK, 0.65, L.cls === "sel" ? GOLD : null);
          cont.add(g);
        }
        cont.add(t);
        this.layers.labels.add(cont);
        e = { text: L.text, cls: L.cls, cont };
        this.labelPool.set(id, e);
      }
      e.cont.setPosition(L.x, L.y);
    }
    for (const [id, e] of this.labelPool) {
      if (!live.has(id)) { e.cont.destroy(); this.labelPool.delete(id); }
    }
  }

  // ---------- ghost meter ----------

  drawMeter() {
    const m = state.meter;
    const key = m.value == null ? "none" : `${Math.round(m.value * 40)}|${m.cloaked}`;
    if (!this.changed("meterKey", key)) return;
    const c = this.clear(this.layers.meter);
    if (m.value == null) return;
    const s = this.safe;
    const y = s.y + 16;
    const t = this.text(m.cloaked ? "seen (cloaked)" : "seen").setPosition(s.x, y);
    const bx = s.x + t.width + 4;
    const g = this.add.graphics();
    this.box(g, bx, y + 1, 44, 7, INK, 0.6, CREAM);
    g.fillStyle(0xff6a5a, 1).fillRect(bx + 2, y + 3, Math.round(40 * m.value), 3);
    c.add([g, t]);
  }

  // ---------- naming World 9 ----------

  drawName() {
    const c = this.clear(this.layers.name);
    const n = state.name;
    state.name.gridRect = null;
    if (!n.active) return;
    const { W, H } = this;
    const cw = 14, ch = 12;
    const gridW = KEY_COLS * cw, rows = Math.ceil(KEYS.length / KEY_COLS);
    const prompt = this.text(n.prompt);
    const hint = n.hint ? this.text(n.hint, "small", 0xd8d4e0) : null;
    const boxW = Math.max(gridW, prompt.width, hint?.width || 0, 130) + 16;
    const boxH = 4 + prompt.height + 4 + 14 + 4 + rows * ch + (hint ? hint.height + 4 : 0) + 6;
    const x = Math.round((W - boxW) / 2);
    const y = Math.max(2, Math.round(H - boxH - 6));
    c.add(this.box(this.add.graphics(), x, y, boxW, boxH, INK, 0.9, GOLD));
    let cy = y + 4;
    prompt.setPosition(Math.round(W / 2 - prompt.width / 2), cy);
    c.add(prompt);
    cy += prompt.height + 4;
    // The name field with a blinking cursor.
    const fieldW = Math.min(boxW - 12, 150);
    const fx = Math.round(W / 2 - fieldW / 2);
    c.add(this.box(this.add.graphics(), fx, cy, fieldW, 13, 0x2a2438, 1, CREAM));
    const val = this.text(n.value || " ");
    val.setPosition(Math.round(W / 2 - val.width / 2), cy + 2);
    c.add(val);
    const cursor = this.add.rectangle(val.x + (n.value ? val.width : 0) + 1, cy + 3, 1, 8, CREAM).setOrigin(0);
    this.tweens.add({ targets: cursor, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
    c.add(cursor);
    cy += 13 + 4;
    // Letter grid.
    const gx = Math.round(W / 2 - gridW / 2);
    state.name.gridRect = { x: gx, y: cy, w: gridW, h: rows * ch };
    KEYS.forEach((k, i) => {
      const kx = gx + (i % KEY_COLS) * cw, ky = cy + Math.floor(i / KEY_COLS) * ch;
      const sel = i === n.sel;
      const g = this.add.graphics();
      this.box(g, kx, ky, cw - 1, ch - 1, sel ? GOLD : 0x3b2a5c, sel ? 1 : 0.8);
      const t = this.text(KEY_GLYPH[k] || k, "small", sel ? INK : 0xffffff);
      t.setPosition(Math.round(kx + (cw - 1) / 2 - t.width / 2), ky + 1);
      c.add([g, t]);
    });
    cy += rows * ch + 4;
    if (hint) {
      hint.setPosition(Math.round(W / 2 - hint.width / 2), cy);
      c.add(hint);
    }
  }

  // ---------- corner buttons ----------

  makeButtonIcons() {
    const icons = {
      "ui-mute": ["...##....", "...###...", "...#.##..", "...#..#..", "...#.....", ".###.....", "####.....", ".##......"],
      "ui-home": ["....#....", "...###...", "..#####..", ".#######.", "..#...#..", "..#.#.#..", "..#.#.#..", "..#####.."],
      "ui-full": ["###...###", "##.....##", "#.#...#.#", ".........", ".........", "#.#...#.#", "##.....##", "###...###"],
    };
    for (const [key, rows] of Object.entries(icons)) {
      if (this.textures.exists(key)) continue;
      const tex = this.textures.createCanvas(key, rows[0].length, rows.length);
      const ctx = tex.getContext();
      ctx.fillStyle = "#f4f1ea";
      rows.forEach((r, y) => [...r].forEach((ch, x) => ch === "#" && ctx.fillRect(x, y, 1, 1)));
      tex.refresh();
    }
  }

  drawButtons() {
    const b = state.buttons;
    const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const list = [];
    if (b.full && !full) list.push({ id: "full", icon: "ui-full" });
    if (b.home) list.push({ id: "home", icon: "ui-home" });
    list.push({ id: "mute", icon: "ui-mute", off: b.muted });
    const key = `${this.W}|${list.map((l) => l.id + (l.off ? "x" : "")).join(",")}`;
    if (!this.changed("buttons", key)) return;
    const c = this.clear(this.layers.buttons);
    const s = this.safe;
    const size = 15;
    b.rects = [];
    list.forEach((l, i) => {
      const x = this.W - s.x - size - i * (size + 3), y = s.y - 2;
      c.add(this.box(this.add.graphics(), x, y, size, size, INK, 0.45, 0x8a8494));
      const img = this.add.image(x + Math.floor(size / 2), y + Math.floor(size / 2), l.icon).setAlpha(l.off ? 0.35 : 1);
      c.add(img);
      if (l.off) c.add(this.add.rectangle(x + 3, y + 7, size - 6, 1, 0xff6a5a).setOrigin(0));
      b.rects.push({ id: l.id, x, y, w: size, h: size });
    });
  }

  onPointer(p) {
    for (const r of state.buttons.rects) {
      if (p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h) return state.handlers[r.id]?.();
    }
    const g = state.name.gridRect;
    if (state.name.active && g && p.x >= g.x && p.x < g.x + g.w && p.y >= g.y && p.y < g.y + g.h) {
      const i = Math.floor((p.y - g.y) / 12) * KEY_COLS + Math.floor((p.x - g.x) / 14);
      if (KEYS[i]) { state.name.sel = i; ui.namePress(); }
    }
  }

  // ---------- portrait phones ----------

  drawRotate() {
    const show = controls.isTouch && this.H > this.W;
    if (!this.changed("rotate", `${show}|${this.W}`)) return;
    this.rotate.removeAll(true);
    if (!show) return;
    this.rotate.add(this.add.rectangle(0, 0, this.W, this.H, INK, 1).setOrigin(0));
    const t = this.text("Turn your phone sideways to play").setMaxWidth(this.W - 20).setCenterAlign();
    t.setPosition(Math.round((this.W - t.width) / 2), Math.round((this.H - t.height) / 2));
    this.rotate.add(t);
  }
}
