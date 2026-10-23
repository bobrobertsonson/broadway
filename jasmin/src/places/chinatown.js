// NYC Chinatown: place module (see src/places/index.js).
// Strings of lanterns that light up when a spark passes, shop awnings that bounce her,
// steam updrafts from street vents, pigeons, fire escape rails and ladders, and generic
// storefronts (DUMPLINGS, BAKERY, TEA, FRUIT).
//
// Markers (this map only):
//   s / q  a lantern string from its left end (s) to its right end (q), same row
//   W      shop awning that bounces her (its top is 12 px above the bottom of the cell)
//   v      steam vent in the street (gentle updraft, on and off)
//   z      pigeons      D dumpling shop   A bakery   E tea shop   U fruit stand
import { mk } from "../props.js";
import { drawPlain, measure } from "../font.js";
import { sfx } from "../audio.js";

const T = 16;
const INK = "#2a2038", WHITE = "#fffaf0";
const BOUNCE = -450;
const LIGHT_R = 24;
const VENT_H = 84, VENT_UP = -92, VENT_ACC = 1500;

export class Chinatown {
  constructor(level) {
    this.L = level;
    this.t = 0;
    this.strings = [];
    this.lanterns = [];
    this.awnings = [];
    this.vents = [];
    this.pigeons = [];
    this.starts = [];
    this.ends = [];
    this.cool = 0;
    this.makeTextures(level);
    const front = (key) => (wx, wy) => level.add.image(wx, wy, key).setOrigin(0.5, 1).setDepth(6);
    this.markers = {
      D: front("ct-dumpling"), A: front("ct-bakery"), E: front("ct-tea"), U: front("ct-fruit"),
      s: (wx, wy) => this.starts.push([wx - 8, wy - 8]),
      q: (wx, wy) => this.ends.push([wx - 8, wy - 8]),
      W: (wx, wy) => this.addAwning(wx, wy - 12),
      v: (wx, wy) => this.addVent(wx, wy),
      z: (wx, wy) => this.addPigeons(wx, wy),
    };
  }

  makeTextures(s) {
    const M = (k, w, h, f) => mk(s, k, w, h, f);

    M("ct-lantern-dim", 8, 12, ({ R, P }) => {
      R(3, 0, 2, 1, INK); R(1, 1, 6, 1, "#6a5a40");
      R(0, 2, 8, 7, "#6a2a30"); R(0, 2, 8, 1, "#4a1a20"); R(0, 8, 8, 1, "#4a1a20");
      R(0, 3, 1, 5, "#4a1a20"); R(7, 3, 1, 5, "#4a1a20"); R(3, 2, 1, 7, "#7a3a40"); R(5, 3, 1, 5, "#4a1a20");
      R(1, 9, 6, 1, "#6a5a40"); R(3, 10, 2, 1, "#6a5a40"); P(3, 11, "#4a3a28"); P(4, 11, "#6a5a40");
    });

    // A shopfront: dark frame, warm window, door, a lettered sign board.
    const front = (key, label, board, boardText, glass, door) => M(key, 60, 52, ({ R, P, ctx }) => {
      R(2, 10, 56, 42, "#3a2a30"); R(2, 10, 56, 2, "#5a3a40");
      R(5, 15, 50, 3, "#2a1a20");
      R(8, 22, 26, 24, glass); R(8, 22, 26, 1, "#ffffff"); R(20, 22, 1, 24, "#3a2a30"); R(8, 34, 26, 1, "#3a2a30");
      for (let i = 0; i < 4; i++) R(10 + i * 6, 38 + (i % 2), 4, 3, "#fff4e0");
      R(38, 24, 14, 28, door); R(38, 24, 14, 1, "#2a1a20"); R(40, 28, 10, 12, glass); R(48, 38, 2, 2, "#ffd23c");
      // sign board
      R(4, 0, 52, 11, INK); R(5, 1, 50, 9, board);
      const w = measure(label);
      drawPlain(ctx, label, Math.round(30 - w / 2), 2, boardText);
      // little lanterns on the board
      R(1, 3, 3, 4, "#e8383c"); R(56, 3, 3, 4, "#e8383c"); P(2, 2, "#ffd23c"); P(57, 2, "#ffd23c");
      R(2, 51, 56, 1, "#1a1018");
    });
    front("ct-dumpling", "DUMPLINGS", "#e8383c", "#ffe27a", "#ffd88a", "#7a3a28");
    front("ct-bakery", "BAKERY", "#ff8fb0", "#6a1a38", "#ffe8c0", "#5a3a48");
    front("ct-tea", "TEA", "#2f8a5a", "#f4f0c8", "#d8ecb0", "#3a4a3a");

    M("ct-fruit", 52, 34, ({ R, P, ctx }) => {
      R(2, 0, 2, 34, "#7a4e28"); R(48, 0, 2, 34, "#7a4e28");
      for (let i = 0; i < 52; i += 8) { R(i, 0, 4, 7, "#3fa860"); R(i + 4, 0, 4, 7, "#fffaf0"); }
      R(0, 7, 52, 1, "#2a6a40");
      R(10, 9, 32, 8, INK); R(11, 10, 30, 6, "#ffd23c");
      const w = measure("FRUIT"); drawPlain(ctx, "FRUIT", Math.round(26 - w / 2), 10, "#2a6a40");
      // crates
      for (const [x, c1] of [[4, "#ff8a3a"], [20, "#ff4a4a"], [36, "#9ad84a"]]) {
        R(x, 20, 14, 14, "#a8743c"); R(x, 20, 14, 2, "#c8945a"); R(x, 26, 14, 1, "#7a4e28"); R(x, 33, 14, 1, "#7a4e28");
        for (let k = 0; k < 4; k++) { R(x + 1 + k * 3, 17 + (k % 2), 3, 3, c1); P(x + 2 + k * 3, 17 + (k % 2), "#ffffff"); }
      }
    });

    M("ct-awning", 44, 16, ({ R }) => {
      for (let i = 0; i < 44; i += 8) { R(i, 2, 4, 9, "#e8383c"); R(i + 4, 2, 4, 9, WHITE); }
      R(0, 0, 44, 2, "#a82028"); R(0, 2, 44, 1, "#ff7a6a");
      for (let i = 0; i < 44; i += 8) { R(i, 11, 4, 3, "#e8383c"); R(i + 4, 11, 4, 3, WHITE); }
      R(0, 14, 44, 1, "#6a1018");
    });
    M("ct-vent", 20, 5, ({ R }) => {
      R(0, 2, 20, 3, "#3a3a46"); R(1, 1, 18, 2, "#5a5a68"); R(2, 0, 16, 1, "#7a7a88");
      for (let i = 3; i < 17; i += 3) R(i, 1, 1, 3, "#1a1a22");
    });
    M("ct-steam", 8, 8, ({ D }) => { D(3.5, 3.5, 3, "rgba(255,255,255,0.8)"); });
    const pig = (flap) => ({ R, P }) => {
      R(2, 3, 5, 3, "#8a90a4"); R(6, 2, 2, 2, "#6a7088"); P(8, 3, "#ffb030"); P(7, 2, "#ffffff");
      R(3, 3, 3, 2, "#a8aec0"); P(6, 3, "#4a9a7a"); P(5, 3, "#a04a9a");
      R(0, 4, 2, 1, "#6a7088");
      if (flap) { R(3, 1, 3, 2, "#6a7088"); P(4, 0, "#6a7088"); } else { P(3, 6, "#ffb030"); P(5, 6, "#ffb030"); }
    };
    M("ct-pigeon-0", 10, 8, pig(false));
    M("ct-pigeon-1", 10, 8, pig(true));
    M("ct-rail", 16, 9, ({ R }) => {
      R(0, 0, 16, 1, "#2a2a34"); R(0, 1, 16, 1, "#4a4a58");
      for (let x = 1; x < 16; x += 5) R(x, 1, 1, 8, "#2a2a34");
      R(0, 5, 16, 1, "#3a3a46");
    });
    M("ct-ladder", 9, 36, ({ R }) => {
      R(0, 0, 1, 36, "#2a2a34"); R(8, 0, 1, 36, "#2a2a34"); R(1, 0, 1, 36, "#5a5a68"); R(7, 0, 1, 36, "#5a5a68");
      for (let y = 3; y < 36; y += 5) R(1, y, 7, 1, "#3a3a46");
    });
  }

  addAwning(wx, y) {
    const L = this.L;
    const img = L.add.image(wx, y - 2, "ct-awning").setOrigin(0.5, 0).setDepth(9);
    this.awnings.push({ img, x: wx, y, squash: 0 });
  }

  addVent(wx, wy) {
    const L = this.L;
    L.add.image(wx, wy, "ct-vent").setOrigin(0.5, 1).setDepth(2);
    const puffs = [];
    for (let i = 0; i < 4; i++) puffs.push({ s: L.add.image(wx, wy - 4, "ct-steam").setDepth(7).setAlpha(0), p: i / 4 });
    this.vents.push({ x: wx, y: wy - 4, puffs, off: Math.random() * 5, on: false });
  }

  addPigeons(wx, wy) {
    const L = this.L;
    if (!L.anims.exists("ct-pigeon")) L.anims.create({ key: "ct-pigeon", frames: [{ key: "ct-pigeon-0" }, { key: "ct-pigeon-1" }], frameRate: 9, repeat: -1 });
    for (const dx of [-7, 6]) {
      const flip = dx < 0;
      const s = L.add.sprite(wx + dx, wy, "ct-pigeon-0").setOrigin(0.5, 1).setDepth(4).setFlipX(flip);
      this.pigeons.push({ s, x: wx + dx, y: wy, away: false, t: 0, flip });
    }
  }

  create() {
    const L = this.L;
    // Lantern strings from s..q pairs (same row, sorted left to right).
    this.starts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (const [x0, y0] of this.starts) {
      const end = this.ends.filter((e) => e[1] === y0 && e[0] > x0).sort((a, b) => a[0] - b[0])[0];
      if (end) this.addString(x0 + 8, y0 + 8, end[0] + 8);
    }
    // Tenement facades over the tall solid towers (decor; the tiles stay as they are).
    let fx = 0;
    while (fx < L.colsN) {
      if (L.cell(fx, 6) !== "#" || L.cell(fx, 11) !== "#") { fx++; continue; }
      let fx1 = fx;
      while (L.cell(fx1 + 1, 6) === "#" && L.cell(fx1 + 1, 11) === "#") fx1++;
      let top = 0;
      while (top < L.rowsN && !"#=".includes(L.cell(fx, top))) top++;
      const label = fx < 80 ? "NOODLES" : "GROCERY";
      this.addFacade(fx, fx1 - fx + 1, top + 1, label);
      fx = fx1 + 1;
    }
    // Fire escapes: rails along the one-way runs, ladders from the street to the lowest ones.
    for (let y = 2; y < L.rowsN - 3; y++) {
      let x = 0;
      while (x < L.colsN) {
        if (L.cell(x, y) !== "-") { x++; continue; }
        let x1 = x;
        while (L.cell(x1 + 1, y) === "-") x1++;
        if (x1 - x >= 2) {
          L.add.tileSprite(x * T, y * T - 8, (x1 - x + 1) * T, 9, "ct-rail").setOrigin(0, 0).setDepth(3);
          if (y === 10) L.add.image(x * T + 6, 12 * T, "ct-ladder").setOrigin(0.5, 1).setDepth(1);
        }
        x = x1 + 1;
      }
    }
  }

  // A tenement face: brick, rows of windows, an AC unit here and there, a shop at street level.
  addFacade(col, cols, row, label) {
    const L = this.L;
    const w = cols * T, h = (12 - row) * T;
    const key = `ct-facade-${cols}-${row}-${label}`;
    mk(L, key, w, h, ({ R, P, ctx }) => {
      const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
      R(0, 0, w, h, "#6a2430");
      for (let y = 3; y < h; y += 4) R(0, y, w, 1, "#5a1c28");
      for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) R(x, y, 1, 4, "#5a1c28");
      R(0, 0, w, 2, "#8a3a3e"); R(0, 2, w, 1, "#3a1018");
      R(0, 0, 1, h, "#4a1822"); R(w - 1, 0, 1, h, "#4a1822");
      const wr = Math.floor(h / T) - 2;
      for (let r = 0; r < wr; r++) for (let c = 0; c < cols; c++) {
        const x = c * T + 4, y = r * T + 4;
        const lit = hash(c + col, r + row) > 0.45;
        R(x - 1, y - 1, 10, 11, "#3a1018");
        R(x, y, 8, 9, lit ? "#ffd45a" : "#2a1420");
        if (lit) { R(x, y, 8, 2, "#fff0a0"); R(x + 3, y, 1, 9, "#c8902a"); R(x, y + 4, 8, 1, "#c8902a"); }
        else { R(x + 3, y, 1, 9, "#3a2430"); R(x, y + 4, 8, 1, "#3a2430"); }
        R(x - 2, y + 9, 12, 2, "#b8a888");
        if (hash(c * 3 + col, r * 7 + row) > 0.8) { R(x + 1, y + 11, 6, 4, "#9aa4b4"); R(x + 2, y + 12, 4, 1, "#5a6478"); }
      }
      // shop at street level
      const sy = h - 2 * T;
      R(0, sy, w, 2 * T, "#2a1420");
      R(0, sy, w, 12, "#e8383c");
      for (let x = 0; x < w; x += 8) { R(x + 4, sy, 4, 12, "#fffaf0"); }
      for (let x = 0; x < w; x += 8) { R(x, sy + 12, 4, 3, "#e8383c"); R(x + 4, sy + 12, 4, 3, "#fffaf0"); }
      R(0, sy + 15, w, 1, "#6a1018");
      const tw = measure(label);
      R(Math.round(w / 2 - tw / 2) - 3, sy + 17, tw + 6, 9, INK);
      drawPlain(ctx, label, Math.round(w / 2 - tw / 2), sy + 18, "#ffe27a");
      R(8, sy + 18, 28, 14, "#ffd88a"); R(8, sy + 18, 28, 1, "#ffffff"); R(21, sy + 18, 1, 14, "#2a1420");
      R(w - 30, sy + 17, 18, 15, "#7a3a28"); R(w - 28, sy + 20, 14, 8, "#ffd88a"); R(w - 16, sy + 26, 2, 2, "#ffd23c");
    });
    L.add.image(col * T, row * T, key).setOrigin(0, 0).setDepth(2.5);
  }

  addString(x0, y0, x1) {
    const L = this.L;
    const sag = 14 + Math.min(10, (x1 - x0) / 14);
    const yAt = (x) => y0 + Math.sin(((x - x0) / (x1 - x0)) * Math.PI) * sag;
    const g = L.add.graphics().setDepth(2);
    g.lineStyle(1, 0x2a2038, 1);
    g.beginPath();
    g.moveTo(x0, y0);
    for (let x = x0; x <= x1; x += 4) g.lineTo(x, yAt(x));
    g.lineTo(x1, y0);
    g.strokePath();
    g.fillStyle(0x2a2038, 1); g.fillRect(x0 - 1, y0 - 3, 3, 6); g.fillRect(x1 - 1, y0 - 3, 3, 6);
    const idxs = [];
    for (let x = x0 + 14; x < x1 - 8; x += 30) {
      const s = L.add.image(x, yAt(x) + 1, "ct-lantern-dim").setOrigin(0.5, 0).setDepth(5);
      const lan = { s, x, y: yAt(x) + 8, lit: false, idx: this.lanterns.length, group: this.strings.length };
      this.lanterns.push(lan);
      idxs.push(lan);
    }
    this.strings.push(idxs);
  }

  light(lan, delay = 0) {
    const L = this.L;
    if (lan.lit) return;
    lan.lit = true;
    const go = () => {
      lan.s.setTexture("prop-lantern-0");
      const glow = L.add.image(lan.x, lan.y - 2, "fx-glow").setDepth(8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setScale(1.4);
      L.tweens.add({ targets: glow, alpha: 0.75, duration: 260 });
      L.tweens.add({ targets: lan.s, angle: { from: -6, to: 6 }, duration: 1300, yoyo: true, repeat: -1, ease: "Sine.inOut", delay: Math.random() * 400 });
      L.tweens.add({ targets: glow, scale: { from: 1.3, to: 1.6 }, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      L.puff(lan.x, lan.y, 0xfff2a8, 4);
      // pass it along the string
      const grp = this.strings[lan.group];
      const i = grp.indexOf(lan);
      for (const n of [grp[i - 1], grp[i + 1]]) if (n && !n.lit) L.time.delayedCall(150, () => this.light(n));
    };
    if (delay) L.time.delayedCall(delay, go); else go();
  }

  update(dt) {
    const L = this.L;
    if (L.mode !== "play") return;
    this.t += dt;
    this.cool = Math.max(0, this.cool - dt);
    const p = L.player, ps = p.sprite, b = ps.body;

    // Lanterns: a spark (or her walking close) lights one, and it ripples along the string.
    const sparks = L.powers.sparks.getChildren();
    for (const lan of this.lanterns) {
      if (lan.lit) continue;
      for (const sp of sparks) {
        if (Math.abs(sp.x - lan.x) < LIGHT_R && Math.abs(sp.y - lan.y) < LIGHT_R) { this.light(lan); sfx.checkpoint(); break; }
      }
    }

    // Awnings: land on one from above and it springs her up.
    for (const a of this.awnings) {
      if (a.squash > 0) {
        a.squash -= dt;
        a.img.setScale(1, a.squash > 0 ? 1 - Math.sin((a.squash / 0.25) * Math.PI) * 0.35 : 1);
      }
      if (this.cool > 0 || p.dead || b.velocity.y < 0) continue;
      if (Math.abs(b.center.x - a.x) < 22 + 4 && b.bottom > a.y - 3 && b.bottom < a.y + 9) {
        b.setVelocityY(BOUNCE);
        p.cut = true;
        this.cool = 0.25;
        a.squash = 0.25;
        sfx.boost();
        L.puff(b.center.x, a.y, 0xffffff, 5);
      }
    }

    // Steam vents: on for a while, off for a while. While on, a gentle lift.
    for (const v of this.vents) {
      const ph = (this.t + v.off) % 5.4;
      const on = ph < 3.4;
      v.on = on;
      for (const q of v.puffs) {
        q.p += dt * (on ? 0.55 : 0.3);
        if (q.p >= 1) q.p -= 1;
        q.s.setPosition(v.x + Math.sin((q.p + v.off) * 9) * 3, v.y - q.p * VENT_H);
        q.s.setScale(0.5 + q.p * 0.9);
        q.s.setAlpha(on ? (1 - q.p) * 0.75 : Math.max(0, (1 - q.p * 2.5)) * 0.25);
      }
      if (on && !p.dead && Math.abs(b.center.x - v.x) < 13 && b.bottom < v.y + 8 && b.bottom > v.y - VENT_H) {
        if (b.velocity.y > VENT_UP) b.setVelocityY(Math.max(VENT_UP, b.velocity.y - VENT_ACC * dt));
      }
    }

    // Pigeons flutter off when she gets close, and come back later.
    for (const g of this.pigeons) {
      const dx = ps.x - g.x, dy = ps.y - g.y;
      if (!g.away && Math.abs(dx) < 48 && Math.abs(dy) < 36) {
        g.away = true; g.t = 0;
        const dir = dx > 0 ? -1 : 1;
        g.s.play("ct-pigeon").setFlipX(dir < 0);
        L.tweens.add({ targets: g.s, x: g.x + dir * (90 + Math.random() * 60), y: g.y - 60 - Math.random() * 30, alpha: 0, duration: 1300, ease: "Quad.out" });
      } else if (g.away) {
        g.t += dt;
        if (g.t > 5 && Math.abs(dx) > 220) {
          g.away = false; g.s.stop(); g.s.setTexture("ct-pigeon-0").setPosition(g.x, g.y).setAlpha(1).setFlipX(g.flip);
        }
      }
    }
  }
}
