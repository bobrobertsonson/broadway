// The new building (map 7-1): a tense climb. They just moved in, so the platforms are moving
// boxes and furniture (drawn over the map's = tiles), with a stairwell, an elevator, cracked
// plaster walls (%) for the magic spark, extinguisher cabinets, exit signs, sprinklers, and a few
// smoke wisps near the top (a hint of the fire, no hazard).
// Markers: U elevator (bottom stop), x exit sign, q extinguisher cabinet, v sprinkler, s smoke wisp.
// Mechanic: the elevator, a vertical platform she can ride (and a boxy stair route beside it).
import { mk } from "../props.js";

const T = 16;
const INK = "#2a2038";
const CARD = "#c89a5e", CARD_LIGHT = "#e0b878", CARD_DARK = "#8e6a3c", TAPE = "#e8d8a8";
const SOFA = "#4a7a9a", SOFA_LIGHT = "#6a9aba", SOFA_DARK = "#2e5470";
const DRESS = "#8a5a36", DRESS_LIGHT = "#b07a48", DRESS_DARK = "#5e3a22", KNOB = "#e0c060";
const EXITG = "#1fae5c", EXITG_L = "#6ff0a0", EXITG_D = "#0e7a3e";
const RED = "#d8382c", RED_L = "#ff7a68", RED_D = "#8e2018", METAL = "#9aa0b0", METAL_D = "#5a6070", METAL_L = "#d0d4e0";
const SMOKE = "#6a6470", SMOKE_L = "#8e8896";

function makeTextures(s) {
  const M = (key, w, h, fn) => mk(s, key, w, h, fn);
  M("bld-box-0", 16, 16, ({ R }) => {
    R(0, 0, 16, 16, CARD_DARK); R(1, 1, 14, 14, CARD); R(1, 1, 14, 2, CARD_LIGHT);
    R(7, 0, 3, 16, TAPE); R(7, 0, 1, 16, CARD_LIGHT); R(2, 10, 4, 3, CARD_DARK); R(2, 10, 4, 1, CARD_LIGHT);
  });
  M("bld-box-1", 16, 16, ({ R }) => {
    R(0, 0, 16, 16, CARD_DARK); R(1, 1, 14, 14, CARD_LIGHT); R(1, 1, 14, 2, "#f0cc90");
    R(0, 6, 16, 3, TAPE); R(0, 6, 16, 1, "#f8ecc4"); R(10, 11, 4, 2, CARD_DARK); R(3, 11, 5, 1, CARD);
    R(0, 0, 16, 1, INK); R(0, 15, 16, 1, INK);
  });
  M("bld-sofa", 48, 16, ({ R }) => {
    R(0, 0, 48, 16, SOFA_DARK); R(1, 1, 46, 3, SOFA_LIGHT); R(0, 4, 6, 12, SOFA); R(42, 4, 6, 12, SOFA);
    R(6, 5, 15, 8, SOFA_LIGHT); R(22, 5, 20, 8, SOFA_LIGHT); R(6, 5, 36, 1, SOFA); R(21, 5, 1, 8, SOFA_DARK);
    R(6, 13, 36, 3, SOFA); R(2, 14, 3, 2, INK); R(43, 14, 3, 2, INK);
  });
  M("bld-dresser", 32, 16, ({ R }) => {
    R(0, 0, 32, 16, DRESS_DARK); R(1, 1, 30, 14, DRESS); R(1, 1, 30, 2, DRESS_LIGHT);
    R(15, 3, 2, 12, DRESS_DARK); R(1, 8, 30, 1, DRESS_DARK); R(6, 5, 3, 1, KNOB); R(23, 5, 3, 1, KNOB); R(6, 11, 3, 1, KNOB); R(23, 11, 3, 1, KNOB);
  });
  M("bld-exit", 24, 10, ({ R, A }) => {
    R(0, 0, 24, 10, INK); R(1, 1, 22, 8, EXITG); R(1, 1, 22, 1, EXITG_L); R(1, 8, 22, 1, EXITG_D);
    const W = "#ffffff";
    A(["###", "#..", "##.", "#..", "###"], { "#": W }, 3, 3);
    A(["#.#", "#.#", ".#.", "#.#", "#.#"], { "#": W }, 7, 3);
    A(["###", ".#.", ".#.", ".#.", "###"], { "#": W }, 11, 3);
    A(["###", ".#.", ".#.", ".#.", ".#."], { "#": W }, 15, 3);
    R(20, 4, 2, 3, EXITG_L);
  });
  M("bld-cabinet", 12, 16, ({ R }) => {
    R(0, 0, 12, 16, RED_D); R(1, 1, 10, 14, RED); R(1, 1, 10, 1, RED_L);
    R(3, 3, 6, 10, "#f4ecd8"); R(4, 4, 4, 8, "#c8e4f0");
    R(5, 6, 2, 5, RED); R(5, 5, 3, 1, METAL_D); R(2, 14, 8, 1, RED_D);
  });
  M("bld-sprinkler", 8, 12, ({ R, P }) => {
    R(0, 0, 8, 2, METAL_D); R(3, 2, 2, 4, METAL); R(2, 6, 4, 2, METAL_L); R(3, 8, 2, 2, RED); P(1, 9, METAL); P(6, 9, METAL);
  });
  M("bld-smoke", 14, 14, ({ R }) => {
    R(3, 5, 8, 6, SMOKE); R(5, 3, 5, 3, SMOKE); R(2, 7, 10, 3, SMOKE_L); R(6, 10, 6, 3, SMOKE); R(5, 2, 2, 2, SMOKE_L);
  });
  M("bld-elev", 48, 8, ({ R }) => {
    R(0, 0, 48, 8, METAL_D); R(0, 0, 48, 2, METAL_L); R(0, 2, 48, 1, METAL); R(2, 3, 44, 2, METAL);
    for (let x = 4; x < 46; x += 6) R(x, 3, 3, 2, METAL_D);
    R(0, 7, 48, 1, INK); R(20, 0, 8, 1, "#ffe27a");
  });
  M("bld-shaft", 48, 112, ({ R }) => {
    R(0, 0, 48, 112, "#3a3644"); R(2, 0, 44, 112, "#2a2632");
    R(0, 0, 3, 112, METAL_D); R(45, 0, 3, 112, METAL_D); R(0, 0, 1, 112, METAL);
    for (let y = 6; y < 112; y += 16) { R(0, y, 5, 2, METAL); R(43, y, 5, 2, METAL); }
    R(4, 0, 40, 3, METAL_D);
  });
  M("bld-rail", 64, 64, ({ R }) => {
    // stairwell handrail: slopes up to the right
    for (let x = 0; x < 64; x++) R(x, 46 - Math.floor(x * 0.75), 1, 2, METAL_L);
    for (const x of [2, 18, 34, 50]) R(x, 47 - Math.floor(x * 0.75), 2, 16 + Math.floor(x * 0.75 / 3), METAL_D);
  });
  M("bld-cable", 2, 2, ({ R }) => R(0, 0, 2, 2, METAL));
}

export class Building {
  constructor(level) {
    this.L = level;
    makeTextures(level);
    this.elev = null;
    this.markers = {
      x: (wx, wy) => level.add.image(wx, wy - 34, "bld-exit").setOrigin(0.5, 1).setDepth(1),
      q: (wx, wy) => level.add.image(wx, wy - 2, "bld-cabinet").setOrigin(0.5, 1).setDepth(1),
      v: (wx, wy) => level.add.image(wx, wy - T, "bld-sprinkler").setOrigin(0.5, 0).setDepth(1),
      s: (wx, wy, c) => this.wisp(wx, wy, c),
      U: (wx, wy) => this.makeElevator(wx, wy),
    };
  }

  wisp(wx, wy, c) {
    const L = this.L;
    const s = L.add.image(wx + ((c * 7) % 9) - 4, wy - 4, "bld-smoke").setDepth(9).setAlpha(0).setScale(0.7);
    L.tweens.add({
      targets: s, y: s.y - 40, alpha: { from: 0.8, to: 0 }, scale: 1.3,
      duration: 2800 + (c % 5) * 300, delay: (c * 331) % 2600, repeat: -1,
      onRepeat: () => { s.setAlpha(0.8).setScale(0.7); },
    });
  }

  makeElevator(wx, wy) {
    const L = this.L;
    const x = wx - 24, bottom = wy, top = wy - 4 * T;
    L.add.image(x, top - 16, "bld-shaft").setOrigin(0).setDepth(0.8);
    this.cable = L.add.image(wx, top - 14, "bld-cable").setOrigin(0.5, 0).setDepth(0.9);
    const e = L.physics.add.image(x, bottom, "bld-elev").setOrigin(0, 0).setDepth(4);
    e.body.setAllowGravity(false).setImmovable(true);
    e.body.checkCollision.down = false;
    e.body.checkCollision.left = false;
    e.body.checkCollision.right = false;
    L.physics.add.collider(L.player.sprite, e);
    this.elev = { s: e, top, bottom, dir: 1, wait: 1.5, riding: false };
  }

  create() {
    const L = this.L;
    // Moving boxes and furniture over the = tiles: runs of 3 are sofas, 2 dressers, 1 a box.
    for (let r = 0; r < L.rowsN; r++) {
      let c = 0;
      while (c < L.colsN) {
        if (L.cell(c, r) !== "=") { c++; continue; }
        let n = 0;
        while (L.cell(c + n, r) === "=") n++;
        let k = 0;
        while (k < n) {
          const left = n - k;
          const w = left >= 3 ? 3 : left;
          const key = w === 3 ? "bld-sofa" : w === 2 ? "bld-dresser" : `bld-box-${(c + k + r) % 2}`;
          L.add.image((c + k) * T, r * T, key).setOrigin(0).setDepth(2.1);
          k += w;
        }
        c += n;
      }
    }
    // Stairwell handrail over the four steps.
    L.add.image(51 * T, 8 * T, "bld-rail").setOrigin(0).setDepth(3);
  }

  update(dt) {
    const L = this.L, e = this.elev;
    if (!e) return;
    const s = e.s, b = s.body, p = L.player, pb = p.sprite.body;
    if (L.mode !== "play") { b.setVelocityY(0); return; }
    // Stops at both ends, then goes again.
    if (e.wait > 0) {
      e.wait -= dt;
      b.setVelocityY(0);
      if (e.wait <= 0) e.dir = e.dir < 0 ? 1 : -1;
      if (e.wait > 0) { this.cable.setDisplaySize(2, s.y - this.cable.y); return; }
    }
    b.setVelocityY(e.dir * 36);
    if ((e.dir < 0 && s.y <= e.top) || (e.dir > 0 && s.y >= e.bottom)) {
      s.y = e.dir < 0 ? e.top : e.bottom;
      b.reset(s.x, s.y);
      e.wait = 2.0;
    }
    // Going down, keep her glued to the platform (gravity would lag a hair behind it).
    const standing = !p.dead && Math.abs(pb.bottom - b.top) < 4 && pb.right > b.left && pb.left < b.right && pb.velocity.y >= 0;
    if (standing && e.dir > 0 && e.wait <= 0) { p.sprite.y += b.top - pb.bottom; pb.setVelocityY(0); p.coyote = 0.09; }
    this.cable.setDisplaySize(2, s.y - this.cable.y);
  }
}
