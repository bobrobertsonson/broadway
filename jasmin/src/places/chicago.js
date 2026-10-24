// Chicago: place module (see src/places/index.js).
// Scenery and mechanics: the lift (bascule) bridge, the L train car and water taxi that
// carry her across the river, Windy City gusts, seagulls, a deep-dish pizza stand, a big
// mirror bean and the lakefront.
//
// Markers (this map only):
//   D pizza stand   M mirror bean   J street lamp   U beach umbrella   E gulls   O sailboat
//   d lift bridge (left hinge, row above the river)       2 leaves of 4 tiles each
//   j water taxi start  q water taxi end (left edge of the boat)
//   x L car start       y L car end      (left edge of the car; wheels on the row's floor line)
import { mk } from "../props.js";
import { drawPlain } from "../font.js";
import { sfx } from "../audio.js";

const T = 16;
const INK = "#2a2038", WHITE = "#fffaf0";
const BR_W = 68, BR_H = 76, BR_HX = 2, BR_HY = 66, BR_LEN = 64;
const BR_ANGLES = [0, 0.75, 1.38];

// Gust zones in tiles: x0..x1, y0..y1, push direction and speed in px/s (while airborne only).
const WIND = [
  { x0: 105, x1: 118, y0: 2, y1: 12, dir: -1, str: 26, n: 5 },
  { x0: 135, x1: 160, y0: 1, y1: 12, dir: 1, str: 44, n: 8 },
];

function ease(s) { return (1 - Math.cos(Math.PI * s)) / 2; }

// A platform that shuttles between two x positions with a pause at each end.
class Shuttle {
  constructor(level, group, sprite, x0, x1, travel, dwell) {
    this.s = sprite; this.x0 = x0; this.x1 = x1; this.travel = travel; this.dwell = dwell;
    this.t = Math.random() * 0; this.group = group;
    this.cycle = 2 * (travel + dwell);
  }
  target() {
    const u = this.t % this.cycle;
    const a = this.dwell, b = a + this.travel, c = b + this.dwell;
    let f = 0;
    if (u < a) f = 0;
    else if (u < b) f = ease((u - a) / this.travel);
    else if (u < c) f = 1;
    else f = 1 - ease((u - c) / this.travel);
    return this.x0 + (this.x1 - this.x0) * f;
  }
}

export class Chicago {
  constructor(level) {
    this.L = level;
    this.t = 0;
    this.bridges = [];
    this.shuttles = [];
    this.pending = { j: [], q: [], x: [], y: [] };
    this.gulls = [];
    this.zones = [];
    this.wasOnBridge = false;
    this.makeTextures(level);
    this.solids = level.physics.add.group({ allowGravity: false, immovable: true });
    level.physics.add.collider(level.player.sprite, this.solids);
    const deco = (key, depth, ox = 0, oy = 0) => (wx, wy) => level.add.image(wx + ox, wy + oy, key).setOrigin(0.5, 1).setDepth(depth);
    this.markers = {
      D: (wx, wy) => this.pizza(wx, wy),
      M: deco("chi-bean", 1),
      J: deco("chi-lamp", 1),
      U: deco("chi-umbrella", 2),
      O: (wx, wy) => {
        const b = level.add.image(wx, wy, "chi-sailboat").setOrigin(0.5, 1).setDepth(3);
        level.tweens.add({ targets: b, y: wy + 2, angle: 2, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      },
      E: (wx, wy) => this.gull(wx, wy),
      d: (wx, wy) => this.addBridge(wx - 8, wy),
      j: (wx, wy) => this.pending.j.push([wx - 8, wy]),
      q: (wx, wy) => this.pending.q.push([wx - 8, wy]),
      x: (wx, wy) => this.pending.x.push([wx - 8, wy]),
      y: (wx, wy) => this.pending.y.push([wx - 8, wy]),
    };
  }

  // ---------- textures ----------
  makeTextures(s) {
    const M = (k, w, h, f) => mk(s, k, w, h, f);

    M("chi-pizza", 46, 38, ({ R, P, D, ctx }) => {
      // awning
      for (let i = 0; i < 46; i += 6) { R(i, 0, 3, 8, "#e8453c"); R(i + 3, 0, 3, 8, WHITE); }
      R(0, 8, 46, 1, "#a82e28");
      for (let i = 0; i < 46; i += 6) { R(i, 9, 3, 2, "#e8453c"); R(i + 3, 9, 3, 2, WHITE); }
      // posts + counter
      R(2, 9, 2, 29, "#7a4e28"); R(42, 9, 2, 29, "#7a4e28");
      R(2, 26, 42, 12, "#a8743c"); R(2, 26, 42, 2, "#c8945a"); R(2, 36, 42, 2, "#7a4e28");
      for (let i = 6; i < 42; i += 8) R(i, 30, 1, 6, "#7a4e28");
      // sign
      R(10, 12, 26, 9, INK); R(11, 13, 24, 7, "#ffd23c");
      drawPlain(ctx, "PIZZA", 13, 14, "#a82e28");
      // deep dish on the counter
      R(15, 21, 16, 5, "#c07a2c"); R(14, 22, 18, 4, "#d89a3c"); R(16, 20, 14, 2, "#e8453c");
      R(18, 20, 3, 1, "#fff0a0"); R(24, 20, 3, 1, "#fff0a0"); R(21, 21, 2, 1, "#3f9a4a");
      R(35, 21, 5, 5, "#f2e0c0"); R(36, 22, 3, 3, "#e8453c");
      // steam
      P(20, 17, "#ffffff"); P(25, 16, "#ffffff"); P(21, 15, "#ffffff");
    });

    M("chi-bean", 88, 46, ({ R, P }) => {
      const cx = 44, W = 42;
      const top = (x) => {
        const d = (x - cx) / W;
        if (Math.abs(d) >= 1) return 99;
        // a bean: bulging, a slight dip in the middle top
        return Math.round(41 - 34 * Math.sqrt(1 - d * d) + (Math.abs(d) < 0.25 ? 2 : 0) * (1 - Math.abs(d) / 0.25));
      };
      for (let x = 0; x < 88; x++) {
        const y0 = top(x);
        if (y0 > 40) continue;
        for (let y = y0; y <= 41; y++) {
          const k = (y - y0) / Math.max(1, 41 - y0);
          // silver, with a reflected sky, a warm skyline band and a bright streak
          let c = k < 0.45 ? "#d6e6f4" : k < 0.62 ? "#a9c4de" : k < 0.8 ? "#e8a860" : "#7f98b4";
          if (k < 0.2) c = "#f2f8ff";
          if ((x + y) % 11 === 0 && k > 0.45 && k < 0.8) c = "#c65a2e";
          if (x > 18 && x < 24 && y < 30 && y > y0 + 2) c = "#ffffff";
          if (x > 60 && x < 62 && k > 0.2 && k < 0.7) c = "#8fb0d0";
          P(x, y, c);
        }
        P(x, y0, "#5a6e8a");
      }
      // arch underneath
      for (let x = 34; x < 55; x++) {
        const d = (x - 44.5) / 10.5, h = Math.round(9 * Math.sqrt(Math.max(0, 1 - d * d)));
        for (let y = 41 - h; y <= 41; y++) P(x, y, "#3f4a64");
        if (h > 0) P(x, 41 - h, "#8fa6c0");
      }
      R(10, 42, 68, 4, "#b8a8a0"); R(10, 42, 68, 1, "#d8ccc4"); R(10, 45, 68, 1, "#8a7a78");
    });

    // Lift bridge leaf, three angles (left leaf; the right one is mirrored).
    BR_ANGLES.forEach((a, i) => M(`chi-bridge-${i}`, BR_W, BR_H, ({ P }) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      for (let py = 0; py < BR_H; py++) for (let px = 0; px < BR_W; px++) {
        const dx = px + 0.5 - BR_HX, dy = py + 0.5 - BR_HY;
        const u = dx * ca - dy * sa, w = dx * sa + dy * ca;
        if (u < 0 || u >= BR_LEN || w < 0 || w >= 9) continue;
        let c;
        if (w < 1.6) c = "#ffb04a";
        else if (w < 3) c = "#e8853a";
        else if (w >= 7.4) c = "#6e2f20";
        else c = (Math.floor(u / 4) % 2 === 0) ? "#c65a2e" : "#a8441f";
        if (w >= 3 && w < 7.4 && (Math.floor(u) % 8 === 0)) c = "#f2c070";
        if (w < 4 && u > BR_LEN - 3) c = "#fff0a0";
        P(px, py, c);
      }
    }));
    M("chi-btower", 22, 50, ({ R, P }) => {
      R(2, 4, 18, 46, "#b8503a"); R(2, 4, 18, 2, "#ffb04a"); R(0, 2, 22, 3, "#6e2f20"); R(4, 0, 14, 3, "#8a3a28");
      for (let y = 10; y < 44; y += 9) { R(5, y, 4, 5, "#ffe27a"); R(13, y, 4, 5, "#ffe27a"); R(5, y + 5, 4, 1, "#6e2f20"); R(13, y + 5, 4, 1, "#6e2f20"); }
      R(2, 4, 1, 46, "#d8704a"); R(19, 4, 1, 46, "#8a3a28");
      R(9, 40, 4, 10, "#3c2430");
      P(10, 0, "#ff3a3a"); P(11, 0, "#ff3a3a");
    });

    M("chi-lcar", 58, 28, ({ R, P }) => {
      R(2, 2, 54, 20, "#dfe6ee"); R(2, 2, 54, 2, "#ffffff"); R(2, 20, 54, 2, "#9aa8bc");
      R(0, 4, 2, 16, "#b8c4d4"); R(56, 4, 2, 16, "#b8c4d4");
      R(2, 15, 54, 3, "#14a8a0"); R(2, 18, 54, 1, "#ff6f59");
      for (let i = 0; i < 4; i++) { R(5 + i * 13, 6, 9, 7, "#6ab4d8"); R(5 + i * 13, 6, 9, 1, "#bfe8f4"); R(9 + i * 13, 6, 1, 7, "#dfe6ee"); }
      R(26, 6, 6, 13, "#9aa8bc"); R(28, 6, 2, 13, "#6ab4d8"); // doors
      R(6, 0, 10, 2, "#7a8498"); R(40, 0, 10, 2, "#7a8498"); // roof gear
      R(4, 22, 12, 4, "#3a3a48"); R(42, 22, 12, 4, "#3a3a48");
      for (const x of [6, 12, 44, 50]) R(x, 24, 3, 3, "#8a90a0");
      P(1, 14, "#ffe27a"); P(56, 14, "#ffe27a");
    });

    // Rails on a track bed (tiles horizontally), and a girder support.
    M("chi-track", 16, 7, ({ R }) => {
      R(0, 5, 16, 2, "#4e3a30");          // ties
      R(0, 3, 16, 1, "#9aa4b4"); R(0, 4, 16, 1, "#5a6478");
      R(7, 5, 2, 2, "#7a5a40");
      R(0, 0, 16, 1, "#d6b13a");          // third rail glint
      R(2, 1, 1, 2, "#7a8498"); R(10, 1, 1, 2, "#7a8498");
    });
    M("chi-pillar", 8, 16, ({ R }) => {
      R(0, 0, 8, 16, "#6a5a68"); R(0, 0, 1, 16, "#8a7a88"); R(7, 0, 1, 16, "#4a3a48");
      R(2, 0, 4, 16, "#7a6a78");
      for (let y = 2; y < 16; y += 5) { R(2, y, 4, 1, "#9a8a98"); }
      R(3, 4, 2, 2, "#c8b8c4"); R(3, 11, 2, 2, "#c8b8c4");
    });

    M("chi-taxi", 46, 22, ({ R, P }) => {
      R(2, 2, 36, 8, "#fffaf0"); R(2, 2, 36, 1, "#ffffff"); R(2, 9, 36, 1, "#cfc4b0");
      for (let i = 0; i < 4; i++) R(5 + i * 8, 4, 6, 4, "#6ab4d8");
      R(34, 4, 4, 5, "#ffd23c");
      R(0, 10, 46, 7, "#ffd23c"); R(0, 10, 46, 1, "#fff0a0"); R(0, 16, 46, 1, "#c8941e");
      R(40, 8, 6, 2, "#ffd23c");
      for (let x = 2; x < 44; x += 4) P(x, 13, "#c8941e");
      R(4, 14, 36, 1, "#1b8fb4");
      R(38, 2, 1, 8, "#7a8498"); R(41, 3, 3, 2, "#e8453c");
      // wake
      for (let x = 0; x < 46; x += 3) P(x, 18, "#ffffff");
    });

    M("chi-wind", 14, 3, ({ R }) => {
      R(0, 1, 14, 1, "rgba(255,255,255,0.75)"); R(3, 0, 6, 1, "rgba(255,255,255,0.45)"); R(5, 2, 7, 1, "rgba(255,255,255,0.45)");
    });

    const gull = (flap) => ({ R, P }) => {
      R(2, 3, 5, 2, "#f4f6fa"); P(7, 2, "#f4f6fa"); P(8, 2, "#f4f6fa"); P(9, 3, "#ffb030");
      P(8, 1, "#9aa4b4"); P(2, 2, "#c0c8d4");
      if (flap) { P(3, 2, "#c0c8d4"); P(4, 1, "#c0c8d4"); P(5, 0, "#c0c8d4"); P(4, 2, "#f4f6fa"); }
      else { P(3, 5, "#c0c8d4"); P(4, 6, "#c0c8d4"); P(5, 5, "#c0c8d4"); }
      P(1, 3, "#9aa4b4"); P(4, 5, "#ffb030");
    };
    M("chi-gull-0", 11, 8, gull(false));
    M("chi-gull-1", 11, 8, gull(true));

    M("chi-lamp", 11, 40, ({ R, P, D }) => {
      R(5, 8, 2, 30, "#3a3a48"); R(3, 36, 6, 4, "#4a4a58"); R(4, 34, 4, 2, "#4a4a58");
      R(2, 6, 8, 2, "#3a3a48");
      D(5.5, 3, 3, "#fff4b8"); D(5.5, 3, 2, "#ffffff");
      R(3, 0, 5, 1, "#3a3a48");
      P(1, 7, "#3a3a48"); P(10, 7, "#3a3a48");
    });

    M("chi-umbrella", 26, 22, ({ R, P }) => {
      for (let y = 0; y < 8; y++) {
        const half = 12 - Math.round((7 - y) * 0.9);
        for (let x = 13 - half; x <= 13 + half; x++) P(x, y + 1, Math.floor((x + 1) / 4) % 2 ? "#ff6f59" : "#fffaf0");
      }
      R(13, 9, 1, 13, "#7a4e28");
      R(4, 18, 16, 3, "#2fb8a4"); R(4, 18, 16, 1, "#7ae0d0"); R(6, 19, 2, 1, "#fffaf0"); R(12, 19, 2, 1, "#fffaf0");
    });

    M("chi-sailboat", 30, 32, ({ R, P }) => {
      for (let y = 0; y < 22; y++) { R(14 - Math.floor(y * 0.5), y + 1, 1 + Math.floor(y * 0.5), 1, "#ffffff"); }
      for (let y = 0; y < 16; y++) { R(16, y + 6, 1 + Math.floor(y * 0.7), 1, y % 5 === 4 ? "#ff6f59" : "#f4f6fa"); }
      R(15, 0, 1, 26, "#7a4e28");
      R(2, 26, 26, 4, "#2a4a88"); R(4, 30, 22, 1, "#1b2f5c"); R(2, 26, 26, 1, "#ffffff");
      P(15, 0, "#ff6f59"); P(16, 0, "#ff6f59");
    });
  }

  // ---------- scenery ----------
  pizza(wx, wy) {
    const L = this.L;
    L.add.image(wx, wy, "chi-pizza").setOrigin(0.5, 1).setDepth(1);
    // a little steam wisp over the pie
    const st = L.add.rectangle(wx - 3, wy - 20, 1, 3, 0xffffff, 0.8).setDepth(2);
    L.tweens.add({ targets: st, y: wy - 32, alpha: 0, duration: 1400, repeat: -1, ease: "Sine.out" });
  }

  gull(wx, wy) {
    const L = this.L;
    if (!L.anims.exists("chi-gull")) L.anims.create({ key: "chi-gull", frames: [{ key: "chi-gull-0" }, { key: "chi-gull-1" }], frameRate: 7, repeat: -1 });
    const s = L.add.sprite(wx, wy, "chi-gull-0").setOrigin(0.5, 1).setDepth(4);
    this.gulls.push({ s, x: wx, y: wy, away: false, t: 0, flip: Math.random() < 0.5 });
    s.setFlipX(this.gulls[this.gulls.length - 1].flip);
  }

  // Lift bridge: two leaves hinged on the banks. Flat = walkable; it lifts on a timer.
  addBridge(hx, deckY) {
    const L = this.L;
    const left = L.add.image(hx - BR_HX, deckY - BR_HY, "chi-bridge-0").setOrigin(0, 0).setDepth(13);
    const hr = hx + 8 * T;
    const right = L.add.image(hr - (BR_W - BR_HX), deckY - BR_HY, "chi-bridge-0").setOrigin(0, 0).setDepth(13).setFlipX(true);
    L.add.image(hx - 13, deckY, "chi-btower").setOrigin(0.5, 1).setDepth(1);
    L.add.image(hr + 13, deckY, "chi-btower").setOrigin(0.5, 1).setDepth(1);
    const mkBody = (x) => {
      const r = L.add.rectangle(x + 2 * T, deckY + 3, 4 * T, 6, 0x000000, 0).setDepth(0);
      L.physics.add.existing(r);
      r.body.setAllowGravity(false).setImmovable(true);
      r.body.checkCollision.down = false; r.body.checkCollision.left = false; r.body.checkCollision.right = false;
      this.solids.add(r);
      return r;
    };
    // add to the group first (add resets body flags), then set them
    const bl = mkBody(hx), br = mkBody(hx + 4 * T);
    [bl, br].forEach((r) => { r.body.setAllowGravity(false).setImmovable(true); r.body.checkCollision.down = false; r.body.checkCollision.left = false; r.body.checkCollision.right = false; });
    this.bridges.push({ hx, hr, deckY, left, right, bl, br, state: "down", timer: 7, frame: 0, bodies: [bl, br] });
  }

  setBridgeFrame(b, f) {
    if (b.frame === f) return;
    b.frame = f;
    b.left.setTexture(`chi-bridge-${f}`);
    b.right.setTexture(`chi-bridge-${f}`);
  }

  create() {
    const L = this.L;
    // shuttle platforms from the paired markers
    this.pending.x.forEach(([x, y], i) => {
      const end = this.pending.y[i];
      if (!end) return;
      const car = L.physics.add.image(x, y - 28, "chi-lcar").setOrigin(0, 0).setDepth(4);
      this.solids.add(car);
      car.body.setAllowGravity(false).setImmovable(true);
      car.body.checkCollision.down = false; car.body.checkCollision.left = false; car.body.checkCollision.right = false;
      car.body.setSize(54, 6).setOffset(2, 2);   // the roof is the platform
      car.body.updateFromGameObject();
      this.shuttles.push(new Shuttle(L, this.solids, car, x, end[0], 7, 2.6));
      this.addTrackBed(x, end[0] + 58, y);
    });
    this.pending.j.forEach(([x, y], i) => {
      const end = this.pending.q[i];
      if (!end) return;
      const boat = L.physics.add.image(x, y - 14, "chi-taxi").setOrigin(0, 0).setDepth(13);
      this.solids.add(boat);
      boat.body.setAllowGravity(false).setImmovable(true);
      boat.body.checkCollision.down = false; boat.body.checkCollision.left = false; boat.body.checkCollision.right = false;
      boat.body.setSize(42, 5).setOffset(2, 2);
      boat.body.updateFromGameObject();
      const sh = new Shuttle(L, this.solids, boat, x, end[0], 6, 2.2);
      sh.t = 3;
      this.shuttles.push(sh);
    });

    // Elevated tracks: rails over every run of one-way tiles at the L's height, with supports.
    for (let y = 0; y < L.rowsN; y++) {
      let x = 0;
      while (x < L.colsN) {
        if (L.cell(x, y) !== "-") { x++; continue; }
        let x1 = x;
        while (L.cell(x1 + 1, y) === "-") x1++;
        if (y === 8) this.addTrackBed(x * T, (x1 + 1) * T, y * T, true);
        x = x1 + 1;
      }
    }

    // Wind streaks
    for (const z of WIND) {
      const zone = { ...z, px0: z.x0 * T, px1: z.x1 * T, py0: z.y0 * T, py1: z.y1 * T, streaks: [], ph: Math.random() * 6 };
      for (let i = 0; i < z.n; i++) {
        const s = L.add.image(zone.px0 + Math.random() * (zone.px1 - zone.px0), zone.py0 + (i + Math.random()) / z.n * (zone.py1 - zone.py0), "chi-wind").setDepth(6).setAlpha(0.5);
        s.setFlipX(z.dir < 0);
        zone.streaks.push(s);
      }
      this.zones.push(zone);
    }
  }

  // Rails and supports for a track run (px). `girder` adds columns down to the street.
  addTrackBed(px0, px1, floorY, girder) {
    const L = this.L;
    L.add.tileSprite(px0, floorY - 6, px1 - px0, 7, "chi-track").setOrigin(0, 0).setDepth(3);
    if (!girder) return;
    for (let x = px0 + 8; x < px1 - 4; x += 5 * T) {
      const h = 12 * T - floorY - 2;
      if (h > 4) L.add.tileSprite(x, floorY + 3, 8, h, "chi-pillar").setOrigin(0, 0).setDepth(1);
    }
  }

  // ---------- per frame ----------
  update(dt) {
    const L = this.L;
    if (L.mode !== "play") return;
    this.t += dt;
    const p = L.player, ps = p.sprite, pb = ps.body;

    // Shuttles: placed exactly where they should be this frame, and a rider moves by the same
    // amount. (Driving them by velocity let the physics clock and the frame clock drift apart,
    // so the cars lurched back and forth every frame and flickered.)
    for (const sh of this.shuttles) {
      sh.t += dt;
      const want = sh.target(), s = sh.s;
      const dx = want - s.x;
      const riding = Math.abs(pb.bottom - s.body.top) < 3 && pb.right > s.body.left && pb.left < s.body.right && pb.velocity.y >= 0;
      s.body.reset(want, s.y);
      if (riding && !p.dead && !p.dashT) ps.x += dx;
    }

    // Lift bridges
    for (const b of this.bridges) this.tickBridge(b, dt, pb);

    // Wind: only while airborne and not swimming, gentle and gusty.
    const inWater = p.swimming;
    for (const z of this.zones) {
      const gust = 0.55 + 0.45 * Math.sin(this.t * 0.9 + z.ph);
      const sp = z.str * gust * z.dir;
      for (const s of z.streaks) {
        s.x += sp * 2.6 * dt;
        if (z.dir > 0 && s.x > z.px1) s.x = z.px0;
        if (z.dir < 0 && s.x < z.px0) s.x = z.px1;
        s.setAlpha(0.15 + gust * 0.5);
      }
      if (!p.onGround && !inWater && !p.dead && !p.dashT && ps.x > z.px0 && ps.x < z.px1 && ps.y > z.py0 && ps.y < z.py1 + 24) ps.x += sp * dt;
    }

    // Gulls scatter when she gets close, and come back later.
    for (const g of this.gulls) {
      const dx = ps.x - g.x, dy = ps.y - g.y;
      if (!g.away && Math.abs(dx) < 54 && Math.abs(dy) < 40) {
        g.away = true; g.t = 0;
        const dir = dx > 0 ? -1 : 1;
        g.s.play("chi-gull").setFlipX(dir < 0);
        L.tweens.add({ targets: g.s, x: g.x + dir * (110 + Math.random() * 60), y: g.y - 70 - Math.random() * 30, alpha: 0, duration: 1500, ease: "Quad.out" });
      } else if (g.away) {
        g.t += dt;
        if (g.t > 5 && Math.abs(dx) > 220) {
          g.away = false; g.s.stop(); g.s.setTexture("chi-gull-0").setPosition(g.x, g.y).setAlpha(1).setFlipX(g.flip);
        }
      }
    }
  }

  tickBridge(b, dt, pb) {
    const onDeck = pb.bottom > b.deckY - 3 && pb.bottom < b.deckY + 6 && pb.right > b.hx && pb.left < b.hr;
    b.timer -= dt;
    const solid = (on) => b.bodies.forEach((r) => { r.body.enable = on; });
    switch (b.state) {
      case "down":
        if (b.timer <= 0) { b.state = "warn"; b.timer = 1.4; sfx.checkpoint(); }
        break;
      case "warn": {
        const flash = Math.floor(this.t * 6) % 2 ? 0xffffff : 0xff9a8a;
        b.left.setTint(flash); b.right.setTint(flash);
        if (b.timer <= 0) {
          if (onDeck) { b.timer = 0.4; break; }   // never lift her off the deck
          b.left.clearTint(); b.right.clearTint();
          b.state = "rise"; b.timer = 0.9; solid(false); sfx.gate();
          this.setBridgeFrame(b, 1);
        }
        break;
      }
      case "rise":
        if (b.timer < 0.45) this.setBridgeFrame(b, 2);
        if (b.timer <= 0) { b.state = "up"; b.timer = 3.2; this.boatPasses(b); }
        break;
      case "up":
        if (b.timer <= 0) { b.state = "lower"; b.timer = 0.9; this.setBridgeFrame(b, 1); sfx.gate(); }
        break;
      case "lower":
        if (b.timer < 0.45) this.setBridgeFrame(b, 0);
        if (b.timer <= 0) { b.state = "down"; b.timer = 8; solid(true); }
        break;
    }
  }

  // A sailboat slips under the open bridge.
  boatPasses(b) {
    const L = this.L;
    const boat = L.add.image(b.hx - 20, b.deckY + 6, "chi-sailboat").setOrigin(0.5, 1).setDepth(3).setScale(0.8);
    L.tweens.add({ targets: boat, x: b.hr + 30, duration: 3600, ease: "Sine.inOut", onComplete: () => boat.destroy() });
  }
}
