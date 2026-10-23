// Brooklyn, Chocolate Factory Lofts (map 6-1): DUMBO cobbles, brownstone stoops, lofts with
// tall windows, a rooftop route with a water tower, a fire escape, a little school with a flag,
// stray cats, and two mechanics:
//   conveyor belts  ({ moves left, } moves right) that carry her along (dash against them)
//   chocolate drips (d) from pipes under an overhang: a bulge forms, a shadow warns, then a drop
//                   falls. It hurts like an enemy, but only the half second it is falling.
// Other markers: m stray cat, W water tower, E fire escape, s school (with flag).
import { mk } from "../props.js";

const T = 16;
const BELT = 46;                       // px/s the belts carry her
const DRIP_PERIOD = 2.6, DRIP_FALL_AT = 1.2, DRIP_LAND_AT = 1.5, DRIP_END = 1.9;
const SOLID = "#=-%";

const INK = "#2a2038";
const CHOC = "#7a4a2e", CHOC_LIGHT = "#a8704a", CHOC_DARK = "#4e2c1a", CHOC_HOT = "#5a3220";
const PIPE = "#8a94a8", PIPE_DARK = "#5a6478", PIPE_LIGHT = "#c0c8d8";
const BRICK = "#8e4a38", BRICK_DARK = "#6e3628", BRICK_LIGHT = "#a65c46", MORTAR = "#b88a74";
const GLASS = "#8fc4e0", GLASS_LIGHT = "#d8f0fa", GLASS_LIT = "#ffe27a", SILL = "#d8c8b0";
const WOOD = "#8a5a36", WOOD_DARK = "#5e3a22", WOOD_LIGHT = "#b07a48", HOOP = "#2a2020";
const IRON = "#2e2a38", IRON_LIGHT = "#4a4658";
const CAT = "#8a8a98", CAT_DARK = "#5e5e70", CAT_LIGHT = "#bcbccc", CAT_EYE = "#f0e060", PINKNOSE = "#e890a0";
const COBBLE = "#9a8a86", COBBLE_DARK = "#6a5a58", COBBLE_LIGHT = "#bcaea8";

function makeTextures(s) {
  const M = (key, w, h, fn) => mk(s, key, w, h, fn);
  M("brook-belt", 16, 6, ({ R }) => {
    R(0, 0, 16, 6, "#3a2a24");
    R(0, 0, 16, 1, "#6a5040");
    for (const x of [0, 8]) { R(x, 1, 4, 3, "#8a6a50"); R(x + 4, 1, 4, 3, "#4e382c"); R(x + 1, 2, 2, 1, "#b08a6a"); }
    R(0, 4, 16, 1, "#2a1c18"); R(0, 5, 16, 1, INK);
  });
  M("brook-pipe", 16, 10, ({ R, P }) => {
    R(0, 0, 16, 4, PIPE); R(0, 0, 16, 1, PIPE_LIGHT); R(0, 3, 16, 1, PIPE_DARK);
    R(2, 0, 2, 4, PIPE_DARK); R(12, 0, 2, 4, PIPE_DARK);
    R(5, 4, 6, 3, PIPE_DARK); R(5, 4, 1, 3, PIPE); R(6, 7, 4, 2, CHOC_DARK); R(7, 8, 2, 1, CHOC);
    P(10, 5, PIPE_LIGHT);
  });
  M("brook-drop", 5, 7, ({ A }) => A([
    "..o..",
    ".oco.",
    ".oco.",
    "occho",
    "occco",
    ".occo",
    "..oo.",
  ], { o: CHOC_DARK, c: CHOC, h: CHOC_LIGHT }));
  M("brook-splat", 12, 4, ({ R, P }) => {
    R(1, 2, 10, 2, CHOC_DARK); R(2, 1, 8, 1, CHOC); R(0, 3, 12, 1, CHOC_DARK);
    P(1, 0, CHOC); P(10, 0, CHOC); P(5, 0, CHOC_LIGHT); P(6, 1, CHOC_LIGHT);
  });
  M("brook-shadow", 10, 3, ({ R }) => { R(1, 0, 8, 3, CHOC_HOT); R(0, 1, 10, 1, CHOC_HOT); });
  M("brook-tower", 32, 44, ({ R, P }) => {
    // legs
    R(4, 24, 2, 20, IRON); R(26, 24, 2, 20, IRON); R(15, 24, 2, 20, IRON_LIGHT);
    for (let k = 0; k < 4; k++) { R(6 + k * 5, 28 + k * 3, 6, 1, IRON); R(26 - k * 5, 28 + k * 3, -6, 1, IRON); }
    R(3, 40, 26, 2, IRON);
    // tank
    R(2, 8, 28, 18, WOOD); R(2, 8, 28, 2, WOOD_LIGHT); R(2, 24, 28, 2, WOOD_DARK);
    for (let x = 5; x < 29; x += 4) R(x, 10, 1, 14, WOOD_DARK);
    R(2, 12, 28, 1, HOOP); R(2, 20, 28, 1, HOOP);
    // cone roof
    for (let i = 0; i < 8; i++) R(2 + i * 1, 8 - i, 28 - i * 2, 1, i < 2 ? WOOD_LIGHT : WOOD_DARK);
    R(15, 0, 2, 2, WOOD_LIGHT);
    // spout
    R(29, 24, 2, 8, PIPE); R(28, 31, 4, 2, PIPE_DARK);
  });
  M("brook-escape", 48, 64, ({ R, P }) => {
    // platform with railing, then a zigzag stair down to the street
    R(0, 16, 48, 2, IRON); R(0, 18, 48, 1, IRON_LIGHT);
    R(0, 7, 48, 1, IRON);
    for (let x = 1; x < 48; x += 5) R(x, 7, 1, 10, IRON);
    for (let k = 0; k < 14; k++) { R(46 - k * 3, 19 + k * 3, 3, 1, IRON); R(46 - k * 3, 20 + k * 3, 1, 2, IRON_LIGHT); }
    for (let k = 0; k < 14; k++) { P(44 - k * 3, 15 + k * 3, IRON_LIGHT); P(45 - k * 3, 16 + k * 3, IRON_LIGHT); }
    R(0, 62, 48, 2, IRON);
    for (let y = 19; y < 62; y += 4) R(1, y, 1, 2, IRON_LIGHT);
  });
  M("brook-wall", 32, 32, ({ R }) => {
    R(0, 0, 32, 32, BRICK);
    for (let y = 0; y < 32; y += 4) { R(0, y + 3, 32, 1, MORTAR); for (let x = (y / 4) % 2 ? 0 : 4; x < 32; x += 8) R(x, y, 1, 4, MORTAR); }
    for (let i = 0; i < 6; i++) R((i * 11) % 30, (i * 7) % 28, 3, 2, BRICK_DARK);
    for (let k = 0; k < 2; k++) { // tall loft windows
      const x = 3 + k * 16;
      R(x - 1, 4, 12, 24, SILL); R(x, 5, 10, 21, INK);
      R(x + 1, 6, 8, 19, k ? GLASS_LIT : GLASS);
      R(x + 1, 6, 8, 3, k ? "#fff0a0" : GLASS_LIGHT);
      R(x + 4, 6, 2, 19, INK); R(x + 1, 14, 8, 1, INK); R(x + 1, 20, 8, 1, INK);
      R(x - 2, 27, 14, 2, SILL); R(x - 2, 29, 14, 1, BRICK_DARK);
    }
  });
  M("brook-cornice", 32, 8, ({ R }) => {
    R(0, 0, 32, 3, BRICK_LIGHT); R(0, 3, 32, 2, SILL); R(0, 5, 32, 1, BRICK_DARK);
    for (let x = 1; x < 32; x += 4) R(x, 6, 2, 2, SILL);
    R(0, 0, 32, 1, "#c88a70");
  });
  const cat = (s0) => ({ R, P }) => {
    R(2, 4, 8, 6, CAT); R(2, 4, 8, 1, CAT_LIGHT); R(2, 9, 8, 1, CAT_DARK);
    R(8, 1, 4, 4, CAT); P(8, 0, CAT); P(11, 0, CAT); P(9, 2, CAT_EYE); P(11, 2, CAT_EYE); P(12, 3, PINKNOSE);
    R(3, 5, 1, 4, CAT_DARK); R(5, 6, 1, 3, CAT_DARK);
    if (s0) { R(0, 3, 2, 6, CAT); P(0, 2, CAT_DARK); P(1, 2, CAT_DARK); } else { R(0, 8, 2, 2, CAT); R(0, 6, 1, 2, CAT); P(1, 6, CAT_DARK); }
  };
  M("brook-cat-0", 13, 10, cat(false));
  M("brook-cat-1", 13, 10, cat(true));
  M("brook-cobble", 16, 5, ({ R }) => {
    R(0, 0, 16, 5, COBBLE_DARK);
    for (const [x, y, w] of [[0, 0, 5], [6, 0, 5], [12, 0, 4], [3, 2, 5], [9, 2, 5], [0, 2, 2], [14, 2, 2], [0, 4, 6], [7, 4, 6]]) R(x, y, w - 1, 2, COBBLE);
    for (const [x, y] of [[1, 0], [7, 0], [4, 2], [10, 2]]) R(x, y, 2, 1, COBBLE_LIGHT);
  });
  M("brook-flag-0", 10, 8, ({ R }) => { R(0, 0, 1, 8, "#e8d8c8"); R(1, 0, 8, 4, "#e0443c"); R(1, 0, 8, 1, "#ff8a7a"); R(1, 4, 5, 1, "#a82e2c"); });
  M("brook-flag-1", 10, 8, ({ R }) => { R(0, 0, 1, 8, "#e8d8c8"); R(1, 1, 7, 3, "#e0443c"); R(1, 1, 7, 1, "#ff8a7a"); R(8, 2, 1, 2, "#e0443c"); R(1, 4, 4, 1, "#a82e2c"); });
}

export class Brooklyn {
  constructor(level) {
    this.L = level;
    makeTextures(level);
    this.belts = new Map();   // "col,row" of the supporting tile -> direction
    this.runs = [];           // belt strips for drawing
    this.drips = [];
    this.cats = [];
    this.markers = {
      "{": (wx, wy, c, r) => this.belt(c, r, -1),
      "}": (wx, wy, c, r) => this.belt(c, r, 1),
      d: (wx, wy, c, r) => this.drip(wx, wy, c, r),
      m: (wx, wy, c, r) => this.cat(wx, wy, c, r),
      W: (wx, wy) => level.add.image(wx, wy, "brook-tower").setOrigin(0.5, 1).setDepth(1),
      E: (wx, wy) => level.add.image(wx + 8, wy, "brook-escape").setOrigin(0, 1).setDepth(1),
      s: (wx, wy) => this.school(wx, wy),
    };
  }

  surface(col, row) {
    while (row < this.L.rowsN && !SOLID.includes(this.L.cell(col, row))) row++;
    return row * T;
  }

  belt(c, r, dir) {
    this.belts.set(`${c},${r + 1}`, dir);
    const last = this.runs[this.runs.length - 1];
    if (last && last.row === r + 1 && last.dir === dir && last.c1 === c - 1) last.c1 = c;
    else this.runs.push({ row: r + 1, dir, c0: c, c1: c });
  }

  drip(wx, wy, c, r) {
    const L = this.L, top = wy - T;
    L.add.image(wx, top, "brook-pipe").setOrigin(0.5, 0).setDepth(4);
    const yg = this.surface(c, r);
    const d = {
      x: wx, yN: top + 9, yg, phase: this.drips.length * 0.9,
      bulge: L.add.image(wx, top + 8, "brook-drop").setOrigin(0.5, 0).setDepth(4).setVisible(false),
      drop: L.add.image(wx, top + 9, "brook-drop").setOrigin(0.5, 0.5).setDepth(9).setVisible(false),
      shadow: L.add.image(wx, yg, "brook-shadow").setOrigin(0.5, 1).setDepth(2.7).setAlpha(0),
      splat: L.add.image(wx, yg, "brook-splat").setOrigin(0.5, 1).setDepth(2.7).setVisible(false),
    };
    this.drips.push(d);
  }

  cat(wx, wy, c, r) {
    const L = this.L;
    if (!L.anims.exists("brook-cat")) L.anims.create({ key: "brook-cat", frames: [{ key: "brook-cat-0" }, { key: "brook-cat-1" }], frameRate: 2, repeat: -1 });
    const s = L.add.sprite(wx, wy, "brook-cat-0").setOrigin(0.5, 1).setDepth(4).setFlipX(true).play("brook-cat");
    this.cats.push({ s, fled: false });
  }

  school(wx, wy) {
    const L = this.L;
    L.add.image(wx, wy, "prop-school").setOrigin(0.5, 1).setDepth(1);
    if (!L.anims.exists("brook-flag")) L.anims.create({ key: "brook-flag", frames: [{ key: "brook-flag-0" }, { key: "brook-flag-1" }], frameRate: 3, repeat: -1 });
    L.add.sprite(wx, wy - 48, "brook-flag-0").setOrigin(0, 1).setDepth(1).play("brook-flag");
  }

  create() {
    const L = this.L;
    // Brownstone and loft fronts: behind the stoops and under each rooftop.
    const front = (c0, c1, top, h) => {
      const w = (c1 - c0 + 1) * T;
      L.add.tileSprite(c0 * T, top - 8, w, 8, "brook-cornice").setOrigin(0).setDepth(0.6);
      L.add.tileSprite(c0 * T, top, w, h, "brook-wall").setOrigin(0).setDepth(0.5);
    };
    front(12, 20, 112, 80);
    front(62, 68, 112, 80);
    front(104, 111, 112, 80);
    front(115, 125, 96, 96);
    front(132, 139, 112, 80);
    front(173, 178, 112, 80);
    front(186, 197, 112, 80);
    // Cobblestones (DUMBO) over the street in a few stretches.
    const zones = [[0, 34], [140, 157], [175, 202]];
    for (const [z0, z1] of zones) {
      let start = -1;
      for (let c = z0; c <= z1 + 1; c++) {
        const ok = c <= z1 && L.cell(c, 12) === "#" && !SOLID.includes(L.cell(c, 11)) && !this.belts.has(`${c},12`);
        if (ok && start < 0) start = c;
        if (!ok && start >= 0) { L.add.tileSprite(start * T, 12 * T, (c - start) * T, 5, "brook-cobble").setOrigin(0).setDepth(2.5); start = -1; }
      }
    }
    // Belts.
    for (const r of this.runs) r.sprite = L.add.tileSprite(r.c0 * T, r.row * T, (r.c1 - r.c0 + 1) * T, 6, "brook-belt").setOrigin(0).setDepth(2.6);
  }

  update(dt) {
    const L = this.L, p = L.player, b = p.sprite.body, now = L.time.now / 1000;
    for (const r of this.runs) r.sprite.tilePositionX -= r.dir * BELT * dt;
    for (const d of this.drips) this.tickDrip(d, now);
    if (L.mode !== "play" || p.dead) return;

    // Belts carry her while she stands on one.
    if (p.onGround && !(p.dashT > 0)) {
      const dir = this.belts.get(`${Math.floor(b.center.x / T)},${Math.floor((b.bottom + 1) / T)}`);
      if (dir) p.sprite.x += dir * BELT * dt;
    }

    // Drops hurt only while falling.
    for (const d of this.drips) {
      if (!d.drop.visible) continue;
      if (Math.abs(d.x - b.center.x) < 7 && d.drop.y > b.top - 3 && d.drop.y < b.bottom + 3) {
        d.hit = true;
        L.hurtPlayer(d.x);
      }
    }

    // Stray cats trot off when she gets close.
    for (const c of this.cats) {
      if (c.fled) continue;
      const s = c.s;
      if (Math.abs(s.x - b.center.x) < 44 && Math.abs(s.y - b.center.y) < 40) {
        c.fled = true;
        const dir = s.x >= b.center.x ? 1 : -1;
        const nx = s.x + dir * 36, ny = this.surface(Math.floor(nx / T), Math.floor((s.y - 2) / T));
        s.setFlipX(dir > 0);
        L.tweens.add({ targets: s, x: nx, duration: 520, ease: "Sine.inOut" });
        L.tweens.add({ targets: s, y: { value: s.y - 14, duration: 180, yoyo: true, ease: "Quad.out" } });
        L.tweens.add({ targets: s, y: ny, delay: 360, duration: 160, ease: "Quad.in" });
      }
    }
  }

  tickDrip(d, now) {
    const t = (now + d.phase) % DRIP_PERIOD;
    if (t < DRIP_FALL_AT) {
      const k = t / DRIP_FALL_AT;
      d.bulge.setVisible(true).setScale(0.35 + 0.65 * k).y = d.yN - 2 + 2 * k + Math.sin(now * 14) * (k > 0.6 ? 0.6 : 0);
      d.drop.setVisible(false);
      d.splat.setVisible(false);
      d.shadow.setAlpha(t > 0.4 ? Math.min(0.7, (t - 0.4) * 0.9) : 0);
    } else if (t < DRIP_LAND_AT) {
      const k = (t - DRIP_FALL_AT) / (DRIP_LAND_AT - DRIP_FALL_AT);
      d.bulge.setVisible(false);
      d.drop.setVisible(true).y = d.yN + 3 + (d.yg - d.yN - 8) * k * k;
      d.shadow.setAlpha(0.7);
    } else if (t < DRIP_END) {
      d.drop.setVisible(false);
      d.bulge.setVisible(false);
      d.splat.setVisible(true);
      d.shadow.setAlpha(0);
    } else {
      d.splat.setVisible(false);
      d.shadow.setAlpha(0);
    }
  }
}
