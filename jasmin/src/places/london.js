// London: place module (see src/places/index.js).
// Scenery: red phone box, pillar box, black cab, zebra crossing with beacons, a tube station
// stair (generic red/blue plate, no logo), chimney pots, pigeons, puddles, a market stall,
// "Mind the gap" plates. Mechanics: the market awning bounces her up to the rooftops, and
// the tube trench breathes out a warm gust that carries her up (the gap in the roofs).
//
// Markers (map 1-1):  m phone box   x pillar box   y black cab   z tube stair   s market stall
//                     j puddle      d pigeon       q zebra       v gap plate    W chimney pots
import { mk } from "../props.js";
import { sfx } from "../audio.js";
import { fontSafe, measure, drawPlain } from "../font.js";

const T = 16;
const RED = "#d62f3a", RED_DARK = "#8e1822", RED_LIGHT = "#f2605e", INK = "#1c1824";
const GLASS = "#cfe6f0", BRICK = "#a8453d", BRICK_DARK = "#7a2f2c", POT = "#c8703c", POT_DARK = "#8a4a28";
const GREY = "#6f7480", GREY_DARK = "#4a4f5c", WHITE = "#f8f6f0", AMBER = "#ffb52e";
const GAP_TEXT = "MIND THE GAP";

// Trench gust (tube station breathing out): columns 66-68 of the trench in map 1-1.
const GUST = { x0: 66 * T, x1: 69 * T, top: 100, bot: 224, period: 5, wind: 1.0, blow: 2.3 };
const BOUNCE = -380;

export class London {
  constructor(level) {
    this.L = level;
    this.t = 0;
    this.stalls = [];
    this.pigeons = [];
    this.puddles = [];
    this.papers = [];
    this.pool = [];
    this.bcool = 0;
    this.scool = 0;
    this.gustOn = false;
    this.makeTextures();
    const dec = (x, y, key, depth = 3, ox = 0.5) => level.add.image(x, y, key).setOrigin(ox, 1).setDepth(depth);
    this.markers = {
      m: (x, y) => dec(x, y, "deco-phonebox"),
      x: (x, y) => dec(x, y, "deco-postbox"),
      y: (x, y) => dec(x, y, "deco-cab"),
      z: (x, y) => {
        dec(x + 12, y, "deco-tube", 3);
      },
      s: (x, y) => {
        const img = dec(x, y, "deco-stall", 3);
        this.stalls.push({ img, x0: x - 36, x1: x + 36, top: y - 32 });
      },
      j: (x, y) => {
        const img = dec(x, y, "deco-puddle", 3);
        this.puddles.push({ x, y, x0: x - 8, x1: x + 8, img });
      },
      d: (x, y) => this.addPigeon(x, y),
      q: (x, y) => this.addZebra(x, y),
      v: (x, y) => dec(x, y, "deco-gap", 3),
      W: (x, y) => dec(x, y, "deco-chimney", 3),
    };
  }

  makeTextures() {
    const L = this.L;
    const M = (key, w, h, fn) => mk(L, key, w, h, fn);
    M("deco-phonebox", 14, 28, ({ R }) => {
      R(0, 0, 14, 28, RED_DARK); R(1, 1, 12, 26, RED); R(0, 0, 14, 3, RED_DARK); R(4, 1, 6, 1, WHITE);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) R(2 + i * 5, 5 + j * 5, 4, 4, GLASS);
      R(1, 25, 12, 3, RED_DARK); R(6, 5, 1, 19, RED); R(0, 27, 14, 1, INK);
    });
    M("deco-postbox", 10, 16, ({ R }) => {
      R(1, 0, 8, 2, RED_DARK); R(0, 2, 10, 14, RED_DARK); R(1, 2, 8, 13, RED); R(2, 5, 6, 2, INK); R(1, 10, 8, 1, RED_DARK);
      R(2, 3, 2, 1, RED_LIGHT); R(0, 15, 10, 1, INK);
    });
    M("deco-cab", 40, 18, ({ R, P }) => {
      R(4, 4, 26, 7, "#1c1c24"); R(8, 1, 16, 5, "#1c1c24"); R(0, 9, 40, 6, "#16161c"); R(32, 6, 6, 4, "#1c1c24");
      R(10, 2, 5, 3, "#9ec6d8"); R(16, 2, 6, 3, "#9ec6d8"); R(5, 6, 4, 2, "#9ec6d8"); R(11, 6, 8, 2, "#9ec6d8");
      R(14, -1 + 1, 4, 1, AMBER); R(13, 0, 6, 1, AMBER);
      R(37, 10, 3, 2, "#f0e8b0"); R(0, 10, 2, 2, RED);
      for (const x of [8, 29]) { R(x - 3, 13, 7, 5, "#0e0e12"); R(x - 1, 15, 3, 2, "#9aa0ac"); }
      R(20, 9, 1, 4, "#32323c"); P(30, 8, "#32323c");
    });
    M("deco-tube", 44, 44, ({ R, P }) => {
      // sign on a post, stairs going down on the right, railings
      R(21, 8, 2, 30, GREY_DARK);
      R(6, 0, 32, 11, INK); R(7, 1, 15, 9, RED); R(22, 1, 15, 9, "#2f4fb0"); R(7, 5, 30, 2, WHITE);
      for (let i = 0; i < 6; i++) { R(26 + i * 3, 36 + i * 2, 18 - i * 3, 2, i % 2 ? "#8b909c" : "#a8acb8"); }
      for (let i = 0; i < 6; i++) { P(26 + i * 3, 31 + i * 2, GREY_DARK); R(26 + i * 3, 32 + i * 2, 1, 4, GREY_DARK); P(27 + i * 3, 30 + i * 2, GREY_DARK); }
      R(2, 38, 18, 2, "#8b909c"); R(2, 40, 18, 4, GREY);
      R(3, 33, 1, 5, GREY_DARK); R(19, 33, 1, 5, GREY_DARK); R(3, 32, 17, 1, GREY_DARK);
    });
    M("deco-chimney", 12, 16, ({ R }) => {
      R(2, 5, 8, 11, BRICK); R(1, 4, 10, 2, BRICK_DARK);
      for (let y = 7; y < 15; y += 3) R(2, y, 8, 1, BRICK_DARK);
      R(2, 1, 3, 4, POT); R(2, 1, 3, 1, POT_DARK); R(7, 2, 3, 3, POT); R(7, 2, 3, 1, POT_DARK); R(5, 0, 2, 5, POT_DARK);
    });
    M("deco-pigeon-0", 8, 7, ({ A }) => A([
      "..gggg..", ".gggggg.", "gwgggbb.", "gggggbyy", ".gggggg.", "..ggg...", "..y.y...",
    ], { g: "#8a8f9c", w: "#e8ecf4", b: "#4a4f5c", y: "#d89040" }));
    M("deco-pigeon-1", 8, 7, ({ A }) => A([
      "g......g", "gg....gg", ".gg..gg.", "..gbbg..", "..gggyy.", "...gg...", "........",
    ], { g: "#8a8f9c", w: "#e8ecf4", b: "#4a4f5c", y: "#d89040" }));
    M("deco-puddle", 16, 3, ({ R }) => {
      R(2, 1, 12, 2, "#6c88a4"); R(1, 2, 14, 1, "#8aa8c4"); R(4, 1, 4, 1, "#c8dcec"); R(10, 2, 2, 1, "#c8dcec");
    });
    M("deco-stall", 64, 34, ({ R }) => {
      R(2, 10, 2, 24, "#6a4a30"); R(60, 10, 2, 24, "#6a4a30");
      for (let i = 0; i < 8; i++) { R(i * 8, 2, 8, 6, i % 2 ? WHITE : RED); R(i * 8, 8, 8, 2, i % 2 ? "#cfcac0" : RED_DARK); }
      R(0, 0, 64, 2, RED_DARK);
      R(4, 24, 56, 10, "#8a5a38"); R(4, 24, 56, 2, "#b07a48");
      for (let i = 0; i < 7; i++) { R(6 + i * 8, 19, 6, 5, i % 2 ? "#e85a3a" : "#f0b83a"); R(7 + i * 8, 20, 2, 1, "#fff4c0"); }
      R(4, 30, 56, 1, "#6a4a30");
    });
    M("deco-zebra", 56, 24, ({ R }) => {
      for (const x of [1, 52]) {
        R(x, 4, 3, 20, WHITE);
        for (let y = 6; y < 22; y += 6) R(x, y, 3, 3, INK);
        R(x - 1, 0, 5, 5, "#2a2428"); R(x, 1, 3, 3, AMBER);
      }
      for (let i = 0; i < 6; i++) R(8 + i * 8, 22, 5, 2, WHITE);
    });
    M("deco-grate", 24, 3, ({ R }) => {
      R(0, 0, 24, 3, GREY_DARK); for (let i = 1; i < 24; i += 3) R(i, 1, 1, 2, "#2a2e38");
    });
    M("fx-paper", 4, 3, ({ R }) => { R(0, 0, 4, 3, WHITE); R(0, 1, 3, 1, "#b8bcc8"); });
    M("fx-beacon", 6, 6, ({ R }) => { R(1, 0, 4, 6, "#ffd270"); R(0, 1, 6, 4, "#ffd270"); R(2, 2, 2, 2, "#ffffff"); });
    // "Mind the gap" plate, lettered with the pixel font.
    const text = fontSafe(GAP_TEXT);
    const w = measure(text) + 8;
    M("deco-gap", w, 26, ({ R, ctx }) => {
      R(Math.floor(w / 2) - 1, 12, 2, 14, GREY_DARK);
      R(0, 0, w, 12, INK); R(1, 1, w - 2, 10, "#ffd23c"); drawPlain(ctx, text, 4, 2, "#141012");
    });
  }

  addZebra(x, y) {
    const L = this.L;
    L.add.image(x, y, "deco-zebra").setOrigin(0.5, 1).setDepth(3);
    for (const dx of [-27, 26]) {
      const g = L.add.image(x + dx, y - 21, "fx-beacon").setDepth(4).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
      L.tweens.add({ targets: g, alpha: 0.85, scale: 1.4, duration: 520, yoyo: true, repeat: -1, delay: dx < 0 ? 0 : 520 });
    }
  }

  addPigeon(x, y) {
    const s = this.L.add.image(x, y, "deco-pigeon-0").setOrigin(0.5, 1).setDepth(4).setFlipX(Math.random() < 0.5);
    this.pigeons.push({ s, hx: x, hy: y, state: 0, t: 0, vx: 0, vy: 0, peck: Math.random() * 3 });
  }

  create() {
    const L = this.L;
    // The trench gust: a grate on the floor, litter that swirls up when it blows.
    L.add.image((GUST.x0 + GUST.x1) / 2, GUST.bot, "deco-grate").setOrigin(0.5, 1).setDepth(3).setScale(2, 1);
    for (let i = 0; i < 8; i++) {
      this.papers.push({ s: L.add.image(0, 0, "fx-paper").setDepth(9).setVisible(false), p: i / 8 });
    }
    // The tube station's back wall (the trench would otherwise show sky).
    L.add.rectangle(62 * T, 12 * T, 16 * T, 2 * T, 0x3c4250).setOrigin(0, 0).setDepth(0.5);
    for (let x = 62 * T; x < 78 * T; x += 32) L.add.rectangle(x, 12 * T, 1, 2 * T, 0x2c303c).setOrigin(0, 0).setDepth(0.6);
    L.add.rectangle(62 * T, 12 * T + 20, 16 * T, 2, 0xe8e4d8).setOrigin(0, 0).setDepth(0.6);
    // Splash drops, reused.
    for (let i = 0; i < 10; i++) this.pool.push({ s: L.add.image(0, 0, "spark").setTint(0xa8c8e8).setDepth(9).setVisible(false), vx: 0, vy: 0, life: 0 });
  }

  splash(x, y) {
    let n = 0;
    for (const d of this.pool) {
      if (d.life > 0) continue;
      d.s.setPosition(x + (Math.random() - 0.5) * 8, y).setVisible(true);
      d.vx = (Math.random() - 0.5) * 70; d.vy = -60 - Math.random() * 40; d.life = 0.45;
      if (++n >= 4) break;
    }
  }

  update(dt) {
    const L = this.L, p = L.player, b = p.sprite.body;
    this.t += dt;
    this.bcool = Math.max(0, this.bcool - dt);
    this.scool = Math.max(0, this.scool - dt);
    const px = b.center.x, py = b.bottom;
    const live = L.mode === "play" && !p.dead && !p.locked;

    // Awnings bounce her up (jump at the stall: she lands on the awning and springs).
    if (live && this.bcool <= 0 && b.velocity.y > 0) {
      for (const s of this.stalls) {
        if (px > s.x0 && px < s.x1 && py >= s.top - 3 && py <= s.top + 10) {
          b.setVelocityY(BOUNCE);
          p.cut = true;
          this.bcool = 0.25;
          sfx.stomp();
          L.tweens.add({ targets: s.img, scaleY: 0.86, duration: 90, yoyo: true });
          L.puff(px, s.top + 2, 0xffffff, 6);
        }
      }
    }

    // The tube breathes out: wind-up (litter stirs), then a gust that lifts her.
    const ph = this.t % GUST.period;
    const blowing = ph > GUST.wind && ph < GUST.blow;
    const winding = ph <= GUST.wind && ph > GUST.wind - 0.9;
    for (const q of this.papers) {
      const on = blowing || winding;
      if (!on) { q.s.setVisible(false); continue; }
      q.p = (q.p + dt * (blowing ? 0.9 : 0.25)) % 1;
      const h = blowing ? GUST.bot - GUST.top : 12;
      q.s.setVisible(true);
      q.s.setPosition(GUST.x0 + 4 + ((GUST.x1 - GUST.x0 - 8) * (0.5 + 0.5 * Math.sin(this.t * 5 + q.p * 9 + q.s.depth))), GUST.bot - 3 - q.p * h);
      q.s.setAngle(this.t * 300 + q.p * 400);
    }
    if (live && blowing && px > GUST.x0 && px < GUST.x1 && py > GUST.top && py <= GUST.bot + 2) {
      b.setVelocityY(Math.max(b.velocity.y - 1400 * dt, -150));
      p.cut = true;
    }

    // Pigeons flutter off when she runs near, and come back later.
    for (const g of this.pigeons) {
      const s = g.s;
      if (g.state === 0) {
        g.peck += dt;
        s.y = g.hy - (Math.sin(g.peck * 3) > 0.9 ? 1 : 0);
        if (Math.abs(px - g.hx) < 44 && Math.abs(py - g.hy) < 40) {
          g.state = 1; g.t = 0;
          const dir = px < g.hx ? 1 : -1;
          g.vx = dir * (50 + Math.random() * 30); g.vy = -95 - Math.random() * 25;
          s.setFlipX(dir < 0).setTexture("deco-pigeon-1");
        }
      } else if (g.state === 1) {
        g.t += dt;
        g.vy = Math.min(g.vy + 40 * dt, -25);
        s.x += g.vx * dt; s.y += g.vy * dt;
        s.setTexture(Math.floor(g.t * 14) % 2 ? "deco-pigeon-1" : "deco-pigeon-0");
        s.setAlpha(Math.max(0, 1 - Math.max(0, g.t - 1.1) / 0.6));
        if (g.t > 1.7) { g.state = 2; s.setVisible(false); }
      } else if (Math.abs(px - g.hx) > 200) {
        g.state = 0; s.setVisible(true).setAlpha(1).setPosition(g.hx, g.hy).setTexture("deco-pigeon-0");
      }
    }

    // Puddles splash.
    if (live && p.onGround && this.scool <= 0 && Math.abs(b.velocity.x) > 40) {
      for (const q of this.puddles) {
        if (px > q.x0 && px < q.x1 && Math.abs(py - q.y) < 3) { this.splash(px, q.y - 2); this.scool = 0.18; break; }
      }
    }
    for (const d of this.pool) {
      if (d.life <= 0) continue;
      d.life -= dt;
      d.vy += 400 * dt;
      d.s.x += d.vx * dt; d.s.y += d.vy * dt;
      if (d.life <= 0) d.s.setVisible(false);
    }
  }
}
