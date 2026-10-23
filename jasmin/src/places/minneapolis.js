// Minneapolis: place module (see src/places/index.js).
// Mood: gray, heavy, quiet. Falling snow, a gray wash over everything, bare trees, steam
// vents, a parked snow plow, frozen fountains, ice fishing shanties on the lake by the
// picnic, and a giant spoon with a cherry on it (an original nod to a sculpture garden).
// Mechanic: skyways, glass walkways between buildings, raised optional routes. Standing
// inside one counts as hidden from the ghosts (level.ghosts hides).
//
// Markers (map 2-1): U snow plow   D frozen fountain   O ice fishing shanty   J spoon and cherry
import { mk } from "../props.js";

const T = 16;
const INK = "#2a2630", SNOW = "#f4faff", SNOW_SHADE = "#c4dcf0", SNOW_DEEP = "#9cbfe0";
const BARK = "#3c3a44", BARK_LIGHT = "#5a5864";
const BRICK = "#7a6a66", BRICK_DARK = "#5a4c4a", BRICK_LIGHT = "#968480", WIN_DIM = "#3a4252", WIN_LIT = "#d8c070";
const GLASS = "#bfe0ee", FRAME = "#5c6878", FRAME_DARK = "#3c4654";
const WOOD = "#8a6444", WOOD_DARK = "#5e422c", WOOD_LIGHT = "#a8805a";
const PLOW = "#e8a632", PLOW_DARK = "#a8741e", STEEL = "#8a909c";
const ICE = "#a8d8ee", ICE_LIGHT = "#e0f4ff", ICE_DARK = "#6aa8cc";

// Skyways in map 2-1: floor tiles `-` on row 7 from col a to col b.
const SKYWAYS = [{ a: 49, b: 71 }, { a: 137, b: 160 }];
const FLOOR_Y = 7 * T;
const VENTS = [11, 58, 82, 94, 140, 170, 194];
const TREES = [4, 9, 17, 26, 37, 45, 57, 66, 78, 84, 95, 101, 111, 131, 139, 146, 157, 166, 176, 186, 198, 203];
const DRIFTS = [15, 27, 111, 187, 199, 204];
const ICE_SHEETS = [[107, 119], [123, 135]];

export class Minneapolis {
  constructor(level) {
    this.L = level;
    this.t = 0;
    this.steam = [];
    this.flakes = [];
    this.makeTextures();
    const dec = (x, y, key, depth = 3) => level.add.image(x, y, key).setOrigin(0.5, 1).setDepth(depth);
    this.markers = {
      U: (x, y) => {
        dec(x, y, "deco-plow");
        const g = level.add.image(x - 14, y - 19, "fx-beacon-amber").setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
        level.tweens.add({ targets: g, alpha: { from: 1, to: 0.1 }, duration: 480, yoyo: true, repeat: -1 });
      },
      D: (x, y) => dec(x, y, "deco-fountain"),
      O: (x, y) => dec(x, y, "deco-shanty"),
      J: (x, y) => dec(x, y, "deco-spoon", 3),
    };
  }

  makeTextures() {
    const L = this.L;
    const M = (key, w, h, fn) => mk(L, key, w, h, fn);
    M("deco-tree-0", 24, 44, ({ R, P }) => {
      R(11, 18, 3, 26, BARK); R(11, 18, 1, 26, BARK_LIGHT);
      const br = [[10, 16, -1, -1], [13, 14, 1, -1], [11, 24, -1, -1], [13, 26, 1, -1], [11, 10, -1, -1], [13, 8, 1, -1]];
      for (const [x, y, dx, dy] of br) for (let i = 0; i < 7; i++) P(x + dx * i, y + dy * Math.floor(i * 0.8) - (i > 4 ? 1 : 0), BARK);
      for (const [x, y] of [[3, 9], [20, 7], [4, 19], [19, 20]]) { P(x, y, BARK); P(x + 1, y - 1, BARK); P(x + 2, y - 3, BARK); }
      R(10, 18, 5, 1, SNOW); P(8, 17, SNOW); P(16, 13, SNOW);
    });
    M("deco-tree-1", 18, 34, ({ R, P }) => {
      R(8, 12, 2, 22, BARK); R(8, 12, 1, 22, BARK_LIGHT);
      for (let i = 0; i < 6; i++) { P(7 - i, 12 - Math.floor(i * 0.9), BARK); P(10 + i, 9 - Math.floor(i * 0.8), BARK); }
      for (let i = 0; i < 5; i++) { P(7 - i, 20 - i, BARK); P(10 + i, 22 - i, BARK); }
      P(2, 6, BARK); P(1, 5, BARK); P(16, 3, BARK); P(17, 2, BARK); P(7, 11, SNOW); P(14, 6, SNOW);
    });
    M("deco-plow", 44, 22, ({ R, P }) => {
      R(10, 6, 28, 10, PLOW); R(10, 6, 28, 2, "#ffcf5a"); R(22, 2, 14, 6, PLOW); R(24, 3, 10, 4, "#a8c4d4");
      R(36, 8, 6, 8, PLOW_DARK); R(8, 15, 32, 3, "#3a3a44"); R(10, 16, 3, 1, "#fff4c0");
      // blade
      R(0, 6, 8, 12, STEEL); R(0, 6, 3, 12, "#aab0bc"); R(6, 10, 4, 3, "#6a7080");
      R(0, 6, 8, 1, SNOW);
      for (const x of [16, 33]) { R(x - 4, 16, 8, 6, "#16161c"); R(x - 1, 18, 3, 2, "#8a909c"); }
      R(6, 4, 3, 2, "#b0a070");
    });
    M("fx-beacon-amber", 7, 7, ({ R }) => { R(1, 0, 5, 7, "#ffb52e"); R(0, 1, 7, 5, "#ffb52e"); R(2, 2, 3, 3, "#fff2c0"); });
    M("deco-shanty", 26, 22, ({ R, P }) => {
      R(2, 6, 22, 14, WOOD); R(2, 6, 22, 1, WOOD_LIGHT);
      for (let x = 5; x < 24; x += 4) R(x, 7, 1, 13, WOOD_DARK);
      R(0, 4, 26, 3, "#6a7480"); R(0, 3, 26, 2, SNOW); R(2, 2, 22, 1, SNOW);
      R(9, 10, 8, 10, WOOD_DARK); R(10, 11, 6, 9, "#2a2028"); R(15, 15, 1, 1, "#c8a870");
      R(19, 0, 3, 5, STEEL); R(19, 0, 3, 1, SNOW);
      R(1, 20, 24, 2, SNOW); R(0, 19, 2, 1, SNOW); R(24, 19, 2, 1, SNOW);
      R(21, 12, 2, 2, "#d8c070");
    });
    M("deco-fountain", 28, 32, ({ R, P }) => {
      R(2, 26, 24, 6, ICE_DARK); R(1, 25, 26, 2, ICE); R(1, 25, 26, 1, ICE_LIGHT); R(0, 30, 28, 2, SNOW);
      R(12, 8, 4, 18, ICE); R(12, 8, 1, 18, ICE_LIGHT);
      R(4, 18, 20, 3, ICE); R(4, 18, 20, 1, ICE_LIGHT); R(6, 21, 16, 1, ICE_DARK);
      R(8, 8, 12, 3, ICE); R(8, 8, 12, 1, ICE_LIGHT);
      R(13, 2, 2, 6, ICE_LIGHT); R(12, 4, 4, 1, ICE_LIGHT);
      for (const x of [5, 9, 13, 17, 21]) R(x, 21, 1, 3 + (x % 3), ICE_LIGHT);
      for (const x of [9, 12, 16, 18]) R(x, 11, 1, 3 + (x % 2), ICE_LIGHT);
      P(14, 1, "#ffffff"); R(2, 24, 24, 1, SNOW);
    });
    M("deco-spoon", 40, 64, ({ R, P, D }) => {
      // a giant spoon planted in the snow, a cherry sitting in its bowl
      const steel = "#c4ccd8", steelL = "#f0f4fa", steelD = "#7a8496";
      for (let i = 0; i < 38; i++) {
        const y = 63 - i, x = 20 + Math.round(Math.sin(i / 38 * 2.2) * 3);
        R(x, y, 5, 1, steel); R(x, y, 1, 1, steelL); R(x + 4, y, 1, 1, steelD);
      }
      R(10, 25, 20, 2, steelD); R(6, 22, 28, 3, steel); R(3, 17, 34, 5, steel); R(2, 12, 36, 5, steel); R(5, 9, 30, 3, steel);
      R(3, 17, 3, 5, steelL); R(2, 12, 3, 5, steelL); R(7, 9, 8, 1, steelL); R(8, 22, 24, 1, steelD); R(30, 13, 8, 1, steelD);
      D(20, 7, 6, "#c8202c"); D(18, 5, 2, "#ff7a7a"); P(17, 4, "#ffe0e0");
      for (let i = 0; i < 9; i++) P(21 + Math.floor(i * 0.7), 1 - Math.floor(i * 0.3), "#4a7a38");
    });
    M("deco-vent", 22, 4, ({ R }) => { R(0, 1, 22, 3, "#4a525e"); R(1, 0, 20, 2, "#5e6672"); for (let i = 2; i < 20; i += 3) R(i, 2, 1, 2, "#22262e"); });
    M("fx-steam", 9, 9, ({ D }) => { D(4, 4, 4, "#e8eef4"); });
    M("deco-bldg", 56, 112, ({ R, P }) => {
      R(0, 6, 56, 106, BRICK); R(0, 6, 4, 106, BRICK_DARK); R(52, 6, 4, 106, BRICK_DARK);
      for (let y = 10; y < 112; y += 4) R(4, y, 48, 1, BRICK_DARK);
      R(0, 4, 56, 4, BRICK_LIGHT); R(0, 0, 56, 4, SNOW); R(2, 4, 8, 1, SNOW); R(30, 4, 12, 1, SNOW);
      for (let y = 14; y < 100; y += 14) for (let x = 8; x < 48; x += 14) {
        R(x, y, 8, 9, FRAME_DARK); R(x + 1, y + 1, 6, 7, ((x * 7 + y * 3) % 5 === 0) ? WIN_LIT : WIN_DIM); R(x, y + 9, 8, 1, SNOW_SHADE);
      }
      R(20, 98, 16, 14, "#2c2a34"); R(21, 99, 14, 13, "#3a3744");
    });
    M("deco-drift", 28, 9, ({ R }) => {
      for (let x = 0; x < 28; x++) { const t = (x - 13.5) / 14; const h = Math.max(1, Math.round(8 * Math.pow(Math.max(0, 1 - t * t), 0.8))); R(x, 9 - h, 1, h, SNOW); R(x, 8, 1, 1, SNOW_SHADE); }
    });
    M("fx-flake", 2, 2, ({ R }) => R(0, 0, 2, 2, "#ffffff"));
    M("fx-gray", 4, 4, ({ R }) => R(0, 0, 4, 4, "#68707e"));
    M("fx-icesheet", 32, 4, ({ R }) => {
      R(0, 0, 32, 4, "#a8d0e4"); R(0, 0, 32, 1, "#d8f0fa"); R(4, 2, 7, 1, "#82b4d0"); R(18, 1, 9, 1, "#82b4d0"); R(10, 3, 5, 1, "#82b4d0"); R(26, 2, 1, 2, "#e8f8ff");
    });
  }

  buildSkyway(a, b) {
    const L = this.L;
    const w = (b - a + 1) * T, h = 52, key = `deco-skyway-${a}-${b}`;
    mk(L, key, w, h, ({ R }) => {
      R(0, 0, w, h - 16, "#a8d4e8"); // glass (drawn translucent by alpha below)
      for (let x = 0; x < w; x += 32) R(x, 0, 2, h - 16, FRAME);
      R(0, 0, w, 3, FRAME_DARK); R(0, 1, w, 1, "#8a98aa"); R(0, h - 19, w, 3, FRAME);
      for (let x = 14; x < w; x += 64) { R(x, 5, 6, 2, "#fff4c0"); }
      R(0, h - 16, w, 16, "#4e5662"); R(0, h - 16, w, 2, "#7a8494"); R(0, h - 12, w, 1, "#d8c070"); R(0, h - 4, w, 4, "#363c48");
    });
    const img = L.add.image(a * T, FLOOR_Y - (h - 16), key).setOrigin(0, 0).setDepth(4).setAlpha(0.8);
    return img;
  }

  create() {
    const L = this.L;
    // Skyways: glass tubes, a building at each end, hidden-from-ghosts floor.
    for (const { a, b } of SKYWAYS) {
      L.add.image(a * T + 8, 12 * T, "deco-bldg").setOrigin(1, 1).setDepth(1);
      L.add.image((b + 1) * T - 8, 12 * T, "deco-bldg").setOrigin(0, 1).setDepth(1);
      this.buildSkyway(a, b);
      if (L.ghosts) {
        for (let x = a * T; x < (b + 1) * T; x += 64) L.ghosts.hides.push({ x: x + 32, y: FLOOR_Y, width: 76 });
      }
    }
    // Bare trees and drifts.
    const solid = (c) => "#=-".includes(L.cell(c, 12)) || L.cell(c, 12) === "_";
    TREES.forEach((c, i) => {
      if (!solid(c) || L.cell(c, 11) !== ".") return;
      L.add.image(c * T + 8, 12 * T, `deco-tree-${i % 2}`).setOrigin(0.5, 1).setDepth(1).setAlpha(0.95);
    });
    for (const c of DRIFTS) if (solid(c) && L.cell(c, 11) === ".") L.add.image(c * T + 8, 12 * T + 1, "deco-drift").setOrigin(0.5, 1).setDepth(3);
    // Frozen lake by the picnic.
    for (const [a, b] of ICE_SHEETS) L.add.tileSprite(a * T, 12 * T - 1, (b - a + 1) * T, 4, "fx-icesheet").setOrigin(0, 0).setDepth(2.5).setAlpha(0.9);
    // Steam vents.
    for (const c of VENTS) {
      if (!solid(c)) continue;
      L.add.image(c * T + 8, 12 * T, "deco-vent").setOrigin(0.5, 1).setDepth(3);
      for (let i = 0; i < 3; i++) this.steam.push({ s: L.add.image(c * T + 8, 12 * T, "fx-steam").setDepth(5).setAlpha(0), x: c * T + 8, ph: i / 3, k: (c * 7 + i) % 5 });
    }
    // Weather: gray wash over everything, snow falling.
    this.wash = L.add.image(0, 0, "fx-gray").setOrigin(0).setScrollFactor(0).setDepth(24).setAlpha(0.24);
    const { width, height } = L.scale;
    for (let i = 0; i < 38; i++) {
      this.flakes.push(L.add.image(Math.random() * width, Math.random() * height, "fx-flake").setScrollFactor(0).setDepth(26).setAlpha(0.35 + Math.random() * 0.4));
    }
  }

  update(dt) {
    const L = this.L;
    this.t += dt;
    // The wash lifts a little once night falls (the picnic).
    this.wash.setAlpha(L.dark ? 0.1 : 0.24);
    const { width, height } = L.scale;
    this.wash.setDisplaySize(width, height);
    for (let i = 0; i < this.flakes.length; i++) {
      const f = this.flakes[i];
      f.y += (22 + (i % 5) * 7) * dt;
      f.x += Math.sin(this.t * 1.3 + i) * 10 * dt - 5 * dt;
      if (f.y > height) { f.y = -4; f.x = Math.random() * width; }
      if (f.x < -4) f.x = width + 2;
    }
    for (const v of this.steam) {
      v.ph = (v.ph + dt / 2.6) % 1;
      const p = v.ph;
      v.s.setPosition(v.x + Math.sin(p * 6 + v.k) * 3, 12 * T - 4 - p * 26);
      v.s.setAlpha(0.5 * Math.sin(p * Math.PI)).setScale(0.5 + p * 0.9);
    }
  }
}
