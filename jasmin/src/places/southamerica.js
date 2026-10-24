// South America: place module (see src/places/index.js). One long level, seven countries.
//
// Power: the Bullshitometer (!), picked up early in Mexico. The spirit of the level is
// tourist traps and scams: fake balconies, catwalks and coffee-tour decks (~ _) and bait
// "souvenirs" (?) that the needle twitches at. Every fake sits where falling is harmless.
//
// Per segment, decor plus at most one small mechanic:
//   Mexico    papel picado banners that sway, agave, colorful walls, macaws that scatter
//   Panama    rainforest, a big ship and lock gates in the background; a ridable lock raft
//   Colombia  coffee bushes, brightly painted house bases
//   Galapagos cacti, scuttling crabs; the tortoise platforms sweep a short stretch so
//             there is never a long wait
//   Chile     Valparaiso hillside of colorful houses; the ascensor, a vertical ridable car
//   Argentina sparse poplars and vines, a condor, cold wind gusts (never near the hut)
//   Brazil    wavy black and white mosaic pavement, palms, kiosks, bouncy beach umbrellas
// No people, no religious symbols.
import { mk } from "../props.js";

const T = 16;

// ---------- drawing helpers ----------
const line = (ctx, x0, y0, x1, y1, c) => {
  ctx.fillStyle = c;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 > -dy) { e -= dy; x0 += sx; }
    if (e2 < dx) { e += dx; y0 += sy; }
  }
};
const ell = (ctx, cx, cy, rx, ry, c) => {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx + 0.3) + (y * y) / (ry * ry + 0.3) <= 1) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
};

const WALLS = [
  { body: "#f06a9a", dark: "#c84478", band: "#2fc0b8", trim: "#fff0f4", shut: "#ffd23c" },
  { body: "#ffd23c", dark: "#d8a81c", band: "#e0483c", trim: "#fff6d0", shut: "#2fa8d8" },
  { body: "#5aa8e8", dark: "#3a80c0", band: "#ff8a2a", trim: "#f0f8ff", shut: "#ff5fa2" },
];
const HOUSES = [
  { wall: "#fff0c8", base: "#e8483a", roof: "#c85a3a", door: "#2f86d0", trim: "#ffd23c" },
  { wall: "#c8f0d8", base: "#ff9a2a", roof: "#b84a3a", door: "#e8483a", trim: "#2fa8d8" },
  { wall: "#f8c8e0", base: "#2fb8d0", roof: "#c85a3a", door: "#ffd23c", trim: "#ff5fa2" },
];
const HILL_COLORS = ["#ff9fc4", "#ffcf3e", "#7fd0f0", "#a4e29c", "#ff8a5a", "#c4a4ec", "#fff0b0", "#5ad0c0", "#ff6f6f"];

export class Southamerica {
  constructor(level) {
    this.L = level;
    this.markers = {};
    this.lifts = [];
    this.birds = [];
    this.umbrellas = [];
    this.papel = [];
    this.bgItems = [];
    this.streaks = [];
    this.gust = { t: 3, on: 0 };
    this.makeTextures();
  }

  // ---------- textures ----------
  makeTextures() {
    const L = this.L;
    const M = (key, w, h, fn) => mk(L, key, w, h, fn);

    // Mexico
    M("sa-papel", 48, 14, ({ R, P, ctx }) => {
      const cols = ["#ff5fa2", "#ffd23c", "#2fd0c0", "#ff8a2a", "#9a5ae0", "#4ac860"];
      for (let x = 0; x < 48; x++) P(x, Math.round(2 * Math.sin((Math.PI * (x % 16)) / 16)), "#4a3a28");
      for (let i = 0; i < 6; i++) {
        const x0 = i * 8 + 1, sag = Math.round(2 * Math.sin((Math.PI * ((x0 + 3) % 16)) / 16));
        R(x0, sag + 1, 6, 6, cols[i]); R(x0 + 1, sag + 7, 4, 1, cols[i]); R(x0 + 2, sag + 8, 2, 1, cols[i]);
        ctx.clearRect(x0 + 2, sag + 2, 2, 1); ctx.clearRect(x0 + 1, sag + 3, 1, 1); ctx.clearRect(x0 + 4, sag + 3, 1, 1); ctx.clearRect(x0 + 2, sag + 4, 2, 1);
      }
    });
    M("sa-agave", 24, 18, ({ ctx }) => {
      const tips = [[1, 9], [23, 9], [4, 4], [20, 4], [6, 11], [18, 11], [8, 1], [16, 1], [12, 0]];
      tips.forEach(([x, y], i) => {
        line(ctx, 12, 17, x, y, i < 6 ? "#2f6a64" : "#4f9a8a");
        line(ctx, 12, 16, x, y + 1, i < 6 ? "#4f9a8a" : "#7fcab4");
        ctx.fillStyle = "#3a3a28"; ctx.fillRect(x, y, 1, 1);
      });
      ctx.fillStyle = "#2f6a64"; ctx.fillRect(10, 16, 4, 2);
    });
    M("sa-agave2", 16, 40, ({ R, P, ctx }) => {
      R(7, 8, 2, 30, "#a89a54"); R(7, 8, 1, 30, "#c8ba70");
      [[5, 6], [10, 5], [4, 10], [11, 9], [6, 3], [9, 2], [5, 14], [11, 13]].forEach(([x, y]) => { R(x, y, 2, 2, "#ffd23c"); P(x, y, "#fff0a0"); });
      [[1, 36], [15, 36], [3, 31], [13, 31], [5, 38], [11, 38], [8, 29]].forEach(([x, y], i) => {
        line(ctx, 8, 39, x, y, i < 4 ? "#2f6a64" : "#4f9a8a");
        line(ctx, 8, 38, x, y + 1, i < 4 ? "#4f9a8a" : "#7fcab4");
      });
    });
    WALLS.forEach((c, i) => M(`sa-wall-${i}`, 48, 40, ({ R, P }) => {
      R(0, 6, 48, 34, c.body); R(0, 2, 48, 4, c.trim);
      for (let x = 0; x < 48; x += 8) R(x + 2, 0, 4, 3, c.trim);
      R(0, 6, 48, 1, c.dark);
      R(0, 32, 48, 8, c.band);
      for (let x = 2; x < 48; x += 6) { R(x, 34, 2, 2, c.trim); }
      // arched window with shutters
      R(6, 13, 12, 15, "#2a2038"); R(7, 12, 10, 1, "#2a2038"); R(8, 11, 8, 1, "#2a2038");
      R(8, 14, 8, 12, "#ffe9a8"); R(8, 14, 8, 1, "#fff6d0"); R(11, 14, 2, 12, "#2a2038");
      R(4, 13, 2, 15, c.shut); R(18, 13, 2, 15, c.shut);
      R(5, 28, 14, 2, c.dark);
      for (const x of [6, 10, 14]) { R(x, 26, 2, 2, "#ff5fa2"); P(x, 25, "#4ac860"); }
      // door
      R(29, 17, 12, 15, "#2a2038"); R(30, 15, 10, 2, "#2a2038"); R(31, 14, 8, 1, "#2a2038");
      R(30, 18, 10, 14, "#8c5a38"); R(30, 15, 10, 3, "#8c5a38"); R(34, 15, 2, 17, "#5e3a24"); R(31, 20, 1, 10, "#a8743c"); R(38, 20, 1, 10, "#a8743c");
      P(37, 25, "#ffd23c");
    }));

    // Panama
    M("sa-leaf", 28, 22, ({ ctx }) => {
      [[8, 13, 8, 5, "#14703c"], [20, 12, 8, 5, "#14703c"], [14, 8, 6, 7, "#1f9a4a"], [6, 15, 5, 4, "#2fb55a"], [22, 15, 5, 4, "#2fb55a"]].forEach(([x, y, rx, ry, c]) => {
        ell(ctx, x, y, rx, ry, c);
      });
      line(ctx, 14, 21, 14, 3, "#0e5430"); line(ctx, 14, 21, 3, 12, "#0e5430"); line(ctx, 14, 21, 25, 12, "#0e5430");
      ctx.clearRect(11, 6, 1, 2); ctx.clearRect(17, 8, 1, 2); ctx.clearRect(4, 14, 1, 2); ctx.clearRect(23, 14, 1, 2);
    });
    M("sa-heliconia", 16, 24, ({ ctx, R }) => {
      line(ctx, 8, 23, 8, 6, "#2f8a3c");
      [[8, 17], [6, 12], [9, 8], [7, 4]].forEach(([x, y], i) => {
        ell(ctx, x, y, 3, 2, "#e8283c"); R(x - 2, y + 1, 4, 1, "#ff6a5a"); R(x, y - 2, 2, 1, "#ffd23c");
      });
      ell(ctx, 3, 21, 3, 2, "#1f9a4a"); ell(ctx, 13, 20, 3, 2, "#2fb55a");
    });
    M("sa-jtree", 36, 84, ({ R, ctx }) => {
      R(14, 30, 8, 54, "#5a3e24"); R(14, 30, 2, 54, "#7a5634"); R(10, 78, 16, 6, "#5a3e24"); R(8, 80, 20, 4, "#5a3e24");
      ell(ctx, 18, 22, 17, 13, "#14703c"); ell(ctx, 10, 28, 9, 7, "#1f9a4a"); ell(ctx, 27, 26, 9, 7, "#1f9a4a"); ell(ctx, 18, 14, 11, 7, "#2fb55a");
      for (const x of [9, 26, 19]) R(x, 32, 1, 18 + (x % 3) * 6, "#2f8a3c");
    });
    M("sa-ship", 120, 46, ({ R, P }) => {
      R(0, 40, 120, 6, "#2a6ab8"); for (let x = 0; x < 120; x += 6) R(x, 41, 3, 1, "#8ac8f0");
      R(2, 30, 112, 9, "#26324a"); R(2, 37, 112, 3, "#b8382c"); R(0, 30, 4, 6, "#26324a");
      for (let x = 4; x < 112; x += 8) P(x, 33, "#e8e8f0");
      const cols = ["#d8483a", "#3a6ad8", "#e8923a", "#3aa86a", "#e8e8f0", "#9a5ae0"];
      for (let r = 0; r < 3; r++) for (let i = 0; i < 7 - r; i++) {
        const c = cols[(i * 2 + r * 3) % cols.length], x = 6 + i * 12 + r * 3, y = 23 - r * 7;
        R(x, y, 11, 7, c); R(x, y, 11, 1, "rgba(255,255,255,0.35)"); for (let k = 2; k < 11; k += 3) R(x + k, y + 1, 1, 6, "rgba(0,0,0,0.25)");
      }
      R(92, 12, 22, 18, "#f0eee8"); R(92, 12, 22, 2, "#c8c8d0"); R(94, 16, 18, 3, "#4a90c8"); R(94, 22, 18, 2, "#4a90c8"); R(94, 26, 18, 2, "#4a90c8");
      R(100, 4, 8, 8, "#e8923a"); R(100, 4, 8, 2, "#2a2038"); R(103, 0, 2, 4, "#8a8a9a");
    });
    M("sa-lockgate", 20, 56, ({ R, P }) => {
      R(0, 6, 20, 50, "#8a949c"); R(0, 6, 3, 50, "#6a747c"); R(17, 6, 3, 50, "#6a747c");
      R(0, 22, 20, 2, "#5a646c"); R(0, 40, 20, 2, "#5a646c");
      for (const y of [10, 28, 46]) for (const x of [5, 10, 15]) P(x, y, "#c8d0d8");
      for (let x = 0; x < 20; x += 4) { R(x, 0, 2, 6, "#ffd23c"); R(x + 2, 0, 2, 6, "#2a2038"); }
      R(0, 0, 20, 1, "#fff0a0");
    });
    M("sa-bird-0", 10, 10, ({ A }) => A([
      "...oooo...",
      "..oRRRRo..",
      "..oWWRRo..",
      "..oWoRRo..",
      "...oYYYo..",
      "..oRRBBYo.",
      ".oRRRBBYo.",
      ".oRRRBBYo.",
      "..oRRoYo..",
      "...oo.oo..",
    ], { o: "#2a2038", R: "#e8283c", W: "#fffaf0", Y: "#ffd23c", B: "#2f7ad8" }));
    M("sa-bird-1", 10, 10, ({ A }) => A([
      "oo......oo",
      "oBYo..oYBo",
      ".oBYoRoYBo",
      "..oBRRRBo.",
      "...oRWRo..",
      "...oRRRo..",
      "....oRo...",
      "...oRRRo..",
      "...oYYYo..",
      "....ooo...",
    ], { o: "#2a2038", R: "#e8283c", W: "#fffaf0", Y: "#ffd23c", B: "#2f7ad8" }));
    M("sa-raft", 48, 10, ({ R }) => {
      R(0, 0, 48, 2, "#c8945a"); R(0, 2, 48, 6, "#a8743c"); R(0, 8, 48, 2, "#5e3a24");
      for (let x = 6; x < 48; x += 8) R(x, 2, 1, 6, "#7a4e28");
      R(0, 0, 4, 10, "#ffd23c"); R(2, 0, 2, 10, "#2a2038"); R(44, 0, 4, 10, "#ffd23c"); R(44, 0, 2, 10, "#2a2038");
      R(14, 0, 4, 3, "#7a828c"); R(30, 0, 4, 3, "#7a828c");
    });

    // Colombia
    M("sa-coffee", 20, 20, ({ ctx, P }) => {
      ell(ctx, 10, 12, 9, 7, "#1f7a3a"); ell(ctx, 6, 9, 5, 4, "#2fa04a"); ell(ctx, 14, 9, 5, 4, "#2fa04a"); ell(ctx, 10, 6, 4, 3, "#46c060");
      [[5, 11], [9, 14], [14, 12], [12, 8], [7, 7], [16, 10], [3, 13]].forEach(([x, y]) => { P(x, y, "#e8283c"); P(x + 1, y, "#ff6a5a"); });
      ctx.fillStyle = "#5e3a24"; ctx.fillRect(9, 17, 2, 3);
    });
    HOUSES.forEach((c, i) => M(`sa-house-${i}`, 48, 44, ({ R, P }) => {
      R(2, 4, 44, 10, c.roof); R(0, 12, 48, 3, "#7a3a2a");
      for (let x = 2; x < 46; x += 4) R(x, 6, 1, 7, "rgba(0,0,0,0.25)");
      R(3, 15, 42, 29, c.wall); R(3, 15, 42, 1, "rgba(0,0,0,0.12)");
      R(3, 34, 42, 10, c.base);
      for (let x = 3; x < 45; x += 6) { R(x + 1, 36, 4, 1, "#fffaf0"); R(x + 2, 37, 2, 1, "#fffaf0"); R(x + 2, 40, 2, 1, c.trim); }
      R(19, 24, 10, 20, "#2a2038"); R(20, 22, 8, 2, "#2a2038"); R(20, 25, 8, 19, c.door); R(23, 25, 2, 19, "rgba(0,0,0,0.25)"); P(27, 35, "#ffd23c");
      for (const x of [7, 33]) {
        R(x, 20, 8, 9, "#2a2038"); R(x + 1, 21, 6, 7, "#ffe9a8"); R(x + 3, 21, 1, 7, "#2a2038");
        R(x - 1, 29, 10, 3, c.trim); for (const k of [0, 3, 6]) { P(x + k, 28, "#ff5fa2"); P(x + k + 1, 27, "#4ac860"); }
      }
    }));

    // Chile
    M("sa-funi", 48, 36, ({ R, P }) => {
      R(0, 0, 48, 4, "#d8283c"); R(0, 0, 48, 1, "#ff6a5a"); R(6, 4, 36, 1, "rgba(0,0,0,0.25)");
      R(1, 4, 2, 26, "#2a2038"); R(45, 4, 2, 26, "#2a2038");
      R(3, 5, 42, 24, "rgba(190,230,250,0.28)");
      R(22, 5, 2, 24, "rgba(42,32,56,0.55)");
      for (const x of [6, 28]) { R(x, 7, 12, 1, "rgba(255,255,255,0.5)"); }
      R(0, 30, 48, 6, "#ffd23c"); R(0, 30, 48, 1, "#fff0a0"); R(0, 35, 48, 1, "#a8741e");
      for (let x = 2; x < 46; x += 8) { R(x, 31, 4, 4, "#2a2038"); }
      P(23, 2, "#fffaf0");
    });
    M("sa-rail", 6, 16, ({ R }) => { R(0, 0, 2, 16, "#4e5568"); R(4, 0, 2, 16, "#4e5568"); R(0, 0, 1, 16, "#8a94a8"); R(4, 0, 1, 16, "#8a94a8"); R(0, 6, 6, 2, "#7a4e28"); });
    M("sa-station", 72, 40, ({ R, P }) => {
      R(0, 14, 72, 26, "#ff8a5a"); R(0, 10, 72, 5, "#2fb8d0"); R(0, 10, 72, 1, "#8ae8f0");
      for (let x = 2; x < 70; x += 6) R(x, 8, 4, 2, "#2fb8d0");
      R(6, 20, 14, 12, "#2a2038"); R(7, 21, 12, 10, "#ffe9a8"); R(12, 21, 2, 10, "#2a2038");
      R(52, 20, 14, 12, "#2a2038"); R(53, 21, 12, 10, "#ffe9a8"); R(58, 21, 2, 10, "#2a2038");
      R(34, 4, 4, 10, "#5e3a24"); R(30, 0, 12, 5, "#fff0a0"); R(31, 1, 10, 3, "#ffd23c"); P(36, 2, "#fffaf0");
    });
    M("sa-tophome", 60, 48, ({ R, P }) => {
      R(2, 8, 56, 40, "#2fc0b8"); R(2, 8, 56, 3, "#1c8a86"); R(0, 4, 60, 5, "#ffd23c"); R(0, 4, 60, 1, "#fff0a0");
      for (let x = 2; x < 58; x += 6) R(x, 2, 3, 3, "#ffd23c");
      R(8, 18, 20, 16, "#2a2038"); R(9, 19, 18, 14, "#ffe27a"); R(17, 19, 2, 14, "#2a2038"); R(9, 25, 18, 2, "#2a2038");
      R(34, 22, 14, 26, "#2a2038"); R(35, 23, 12, 25, "#e8483a"); R(40, 23, 2, 25, "rgba(0,0,0,0.25)"); P(45, 36, "#ffd23c");
      R(6, 35, 24, 3, "#ff8a5a"); for (const x of [8, 13, 18, 23, 28]) { P(x, 34, "#ff5fa2"); P(x + 1, 33, "#4ac860"); }
      for (let x = 4; x < 58; x += 7) { P(x, 12, "#ffd23c"); P(x + 3, 13, "#ff5fa2"); }
    });
    ["#ff9fc4", "#ffcf3e", "#7fd0f0", "#a4e29c"].forEach((wall, i) => M(`sa-chouse-${i}`, 32, 40, ({ R, P }) => {
      R(0, 8, 32, 32, wall); R(0, 8, 32, 2, "rgba(0,0,0,0.15)"); R(0, 4, 32, 5, ["#e8483a", "#2fb8d0", "#ff8a2a", "#9a5ae0"][i]);
      R(0, 4, 32, 1, "rgba(255,255,255,0.4)");
      R(5, 15, 8, 9, "#2a2038"); R(6, 16, 6, 7, "#ffe9a8"); R(8, 16, 1, 7, "#2a2038");
      R(19, 15, 8, 9, "#2a2038"); R(20, 16, 6, 7, "#ffe9a8"); R(22, 16, 1, 7, "#2a2038");
      R(12, 28, 8, 12, "#2a2038"); R(13, 29, 6, 11, ["#2f86d0", "#e8483a", "#ffd23c", "#ff5fa2"][i]); P(18, 35, "#ffd23c");
      R(0, 38, 32, 2, "rgba(0,0,0,0.2)");
    }));

    // Argentina
    M("sa-poplar", 14, 60, ({ R, ctx }) => {
      R(6, 52, 2, 8, "#5a4a3a"); ell(ctx, 7, 28, 6, 26, "#8a8a4a"); ell(ctx, 7, 26, 4, 22, "#b0a858"); ell(ctx, 6, 20, 2, 14, "#c8c070");
    });
    M("sa-vinerow", 48, 14, ({ R, P }) => {
      for (const x of [0, 23, 46]) R(x, 2, 2, 12, "#6a4e34");
      R(0, 3, 48, 1, "#9a8a70"); R(0, 7, 48, 1, "#9a8a70");
      for (let x = 2; x < 46; x += 4) { R(x, 3, 3, 4, ["#a05a3a", "#c8803a", "#8a4a5a"][(x >> 2) % 3]); P(x + 1, 8, "#6a2a62"); P(x + 2, 9, "#6a2a62"); P(x + 1, 10, "#8a3a7a"); }
    });
    M("sa-condor", 44, 16, ({ ctx, R }) => {
      line(ctx, 22, 8, 2, 4, "#1c1824"); line(ctx, 22, 8, 42, 4, "#1c1824"); line(ctx, 22, 9, 2, 7, "#1c1824"); line(ctx, 22, 9, 42, 7, "#1c1824");
      for (const x of [2, 5, 8, 36, 39, 42]) R(x, 3, 1, 5, "#1c1824");
      ell(ctx, 22, 9, 4, 2, "#1c1824"); R(18, 7, 8, 1, "#fffaf0"); R(25, 10, 3, 1, "#e8a0a0"); R(21, 11, 2, 4, "#1c1824");
    });
    M("sa-gust", 28, 3, ({ R }) => { R(0, 1, 28, 1, "rgba(255,255,255,0.75)"); R(8, 0, 14, 1, "rgba(255,255,255,0.45)"); R(4, 2, 10, 1, "rgba(255,255,255,0.45)"); });
    M("sa-tuft", 14, 12, ({ ctx }) => {
      [[2, 2], [5, 0], [8, 1], [11, 3], [7, 5]].forEach(([x, y]) => { line(ctx, 7, 11, x, y, "#a89c78"); line(ctx, 7, 11, x + 1, y + 1, "#d8cca0"); ctx.fillStyle = "#f4ecd0"; ctx.fillRect(x - 1, y - 1, 3, 2); });
    });

    // Galapagos
    M("sa-cactus-0", 22, 30, ({ ctx, P }) => {
      ell(ctx, 11, 25, 6, 4, "#3f8a4c"); ell(ctx, 6, 16, 4, 5, "#4c9a5a"); ell(ctx, 16, 15, 4, 5, "#4c9a5a"); ell(ctx, 11, 7, 4, 5, "#5cb06a");
      ctx.fillStyle = "#6a4a30"; ctx.fillRect(10, 27, 2, 3);
      [[11, 24], [8, 26], [14, 26], [6, 15], [16, 14], [11, 6], [9, 8], [13, 9]].forEach(([x, y]) => P(x, y, "#fff0a0"));
      P(11, 2, "#ffd23c"); P(12, 2, "#ff8a2a"); P(6, 11, "#ffd23c"); P(16, 10, "#ffd23c");
    });
    M("sa-cactus-1", 14, 34, ({ R, P }) => {
      R(5, 12, 4, 22, "#3f8a4c"); R(5, 12, 1, 22, "#5cb06a"); R(1, 18, 4, 3, "#3f8a4c"); R(1, 8, 3, 12, "#4c9a5a"); R(1, 8, 1, 12, "#5cb06a");
      R(9, 16, 4, 3, "#3f8a4c"); R(10, 10, 3, 8, "#4c9a5a"); R(10, 10, 1, 8, "#5cb06a");
      for (const [x, y] of [[7, 14], [7, 20], [7, 26], [2, 10], [11, 12]]) P(x, y, "#fff0a0");
    });
    ["sa-crab-0", "sa-crab-1"].forEach((k, i) => M(k, 10, 8, ({ A }) => A(i ? [
      "..o....o..",
      ".oRo..oRo.",
      "..oR..Ro..",
      "..ooRRoo..",
      ".oRWRRWRo.",
      ".oRRRRRRo.",
      "o.oRooRo.o",
      "..o....o..",
    ] : [
      ".oRo..oRo.",
      ".oRRo.Ro..",
      "..ooRRoo..",
      "..oWRRWo..",
      ".oRRRRRRo.",
      "oo.RooR.oo",
      "o.o....o.o",
      "..........",
    ], { o: "#2a2038", R: "#e8483a", W: "#fffaf0" })));

    // Brazil
    M("sa-palm", 32, 72, ({ ctx, R, P }) => {
      for (let y = 71; y >= 16; y--) {
        const t = (71 - y) / 55, x = Math.round(13 + t * t * 4 + t * 2);
        R(x, y, 3, 1, y % 5 === 0 ? "#6a4a2e" : "#8a6a44");
      }
      const fronds = [[2, 22], [6, 10], [14, 4], [24, 10], [30, 22], [4, 30], [28, 30], [16, 8]];
      fronds.forEach(([x, y], i) => {
        line(ctx, 17, 16, x, y, "#1f7a3c");
        line(ctx, 17, 17, x, y + 2, "#2fa04a");
        line(ctx, 17, 15, x, y - 1, "#46c060");
      });
      ell(ctx, 17, 17, 3, 3, "#2fa04a"); P(15, 19, "#6a3a1e"); P(19, 19, "#6a3a1e"); P(17, 20, "#6a3a1e");
    });
    M("sa-palm2", 26, 50, ({ ctx, R, P }) => {
      for (let y = 49; y >= 14; y--) { const t = (49 - y) / 35, x = Math.round(10 - t * 3); R(x, y, 3, 1, y % 5 === 0 ? "#6a4a2e" : "#8a6a44"); }
      [[1, 20], [5, 8], [12, 3], [20, 9], [25, 20], [3, 26], [23, 27]].forEach(([x, y]) => {
        line(ctx, 8, 14, x, y, "#1f7a3c"); line(ctx, 8, 15, x, y + 2, "#2fa04a"); line(ctx, 8, 13, x, y - 1, "#46c060");
      });
      ell(ctx, 8, 15, 3, 3, "#2fa04a"); P(7, 17, "#6a3a1e"); P(9, 17, "#6a3a1e");
    });
    M("sa-umbrella", 36, 32, ({ R, ctx }) => {
      R(17, 8, 2, 24, "#8a6a44"); R(17, 8, 1, 24, "#b08a58");
      for (let y = 0; y < 12; y++) {
        const half = Math.round(17 * Math.sqrt(Math.max(0, 1 - ((11 - y) / 11) ** 2) * 0.9 + 0.1));
        for (let x = -half; x <= half; x++) {
          const stripe = Math.floor((x + 40) / 5) % 2;
          R(18 + x, 1 + y, 1, 1, stripe ? "#fffaf0" : "#ff5a4a");
        }
      }
      ctx.clearRect(0, 12, 36, 2);
      for (let x = 2; x < 34; x += 5) R(x, 12, 3, 2, Math.floor((x + 40) / 5) % 2 ? "#fffaf0" : "#ff5a4a");
      R(16, 0, 4, 2, "#ffd23c");
    });
    M("sa-kiosk", 44, 38, ({ R }) => {
      R(2, 16, 40, 22, "#fff0c8"); R(2, 30, 40, 8, "#2fc0b8"); R(2, 30, 40, 1, "#1c8a86");
      R(4, 22, 36, 8, "#7a4e28"); R(4, 22, 36, 2, "#a8743c");
      for (const x of [8, 14, 20, 30, 35]) { R(x, 17, 3, 5, ["#ff8a2a", "#e8283c", "#2fa04a", "#ffd23c", "#9a5ae0"][x % 5]); R(x, 17, 3, 1, "rgba(255,255,255,0.5)"); }
      for (let x = 0; x < 44; x += 4) { R(x, 10, 4, 6, (x >> 2) % 2 ? "#fffaf0" : "#ff5a4a"); R(x + 1, 16, 2, 2, (x >> 2) % 2 ? "#fffaf0" : "#ff5a4a"); }
      R(0, 6, 44, 5, "#d8a840"); R(4, 2, 36, 5, "#e8c060"); R(10, 0, 24, 3, "#f0d078");
      for (let x = 2; x < 44; x += 5) R(x, 8, 1, 3, "#a87828");
      R(4, 16, 2, 22, "#8a6a44"); R(38, 16, 2, 22, "#8a6a44");
    });
    // Black and white wave mosaic pavement. One tile = the top row of ground.
    M("sa-mosaic", 64, 16, ({ R }) => {
      for (let x = 0; x < 64; x++) {
        const wave = Math.round(3 * Math.sin((x / 32) * Math.PI * 2));
        for (let y = 0; y < 16; y++) {
          const band = Math.floor((y + wave + 16) / 4) % 2;
          R(x, y, 1, 1, band ? "#1c1824" : "#fff8f0");
        }
      }
      for (let x = 0; x < 64; x += 4) R(x, 0, 1, 16, "rgba(120,110,120,0.35)");
      for (let y = 0; y < 16; y += 4) R(0, y, 64, 1, "rgba(120,110,120,0.35)");
      R(0, 0, 64, 1, "rgba(255,255,255,0.5)");
    });
  }

  // ---------- helpers ----------
  // First solid ground row of a column (-1 over pits and water).
  gy(col) {
    const L = this.L;
    let y = L.rowsN - 1;
    if (L.cell(col, y) !== "#") return -1;
    while (y >= 0 && L.cell(col, y) === "#") y--;
    if (L.cell(col, y) === "w") return -1;
    return y + 1;
  }

  img(key, x, bottom, depth = 1) {
    return this.L.add.image(Math.round(x), Math.round(bottom), key).setOrigin(0.5, 1).setDepth(depth);
  }

  at(key, col, depth = 1, dx = 0, dy = 0) {
    const g = this.gy(col);
    if (g < 0) return null;
    return this.img(key, col * T + 8 + dx, g * T + dy, depth);
  }

  bird(col, x, y) {
    const sp = this.L.add.image(x, y, "sa-bird-0").setOrigin(0.5, 1).setDepth(3);
    this.birds.push({ sp, x, flown: false });
    return sp;
  }

  bgItem(key, wx, f, dy, drift = 0, depth = -7) {
    const L = this.L;
    const sp = L.add.image(0, 0, key).setOrigin(0.5, 1).setScrollFactor(0).setDepth(depth);
    this.bgItems.push({ sp, wx, f, dy, drift, ph: Math.random() * 6 });
    return sp;
  }

  lift(cfg) {
    const L = this.L;
    const sp = L.physics.add.image(cfg.x, cfg.y, cfg.key).setOrigin(0, 0).setDepth(cfg.depth || 4);
    sp.body.setAllowGravity(false).setImmovable(true);
    sp.body.setSize(cfg.bw, cfg.bh).setOffset(0, cfg.boy || 0);
    sp.body.checkCollision.down = false;
    sp.body.checkCollision.left = false;
    sp.body.checkCollision.right = false;
    L.physics.add.collider(L.player.sprite, sp);
    const l = { sp, axis: cfg.axis, a: cfg.a, b: cfg.b, speed: cfg.speed, pause: cfg.pause, dir: 1, wait: cfg.wait || 0 };
    this.lifts.push(l);
    return l;
  }

  // ---------- build ----------
  create() {
    const L = this.L;
    this.tortoises();
    this.mexico();
    this.panama();
    this.colombia();
    this.galapagos();
    this.chile();
    this.argentina();
    this.brazil();
    this.hutX = L.hut ? L.hut.x : 99999;
    L.events.on("update", this.tick, this);
    L.events.once("shutdown", () => L.events.off("update", this.tick, this));
  }

  // The tortoise platforms sweep a short stretch centered in each gap, so one is always
  // within an easy jump: no long waits.
  tortoises() {
    for (const m of this.L.movers.getChildren()) {
      if (!m.texture.key.startsWith("plat-tortoise")) continue;
      m.range = 24;
      m.speed = 20;
      m.body.setVelocityX(m.speed);
    }
  }

  mexico() {
    const L = this.L;
    const bannerAt = (c0, c1, row) => {
      const ts = L.add.tileSprite(c0 * T, row * T, (c1 - c0) * T, 14, "sa-papel").setOrigin(0, 0).setDepth(3);
      this.papel.push({ ts, ph: this.papel.length * 1.7 });
    };
    // Rows 9-10: higher up they ran through the HUD at phone size.
    bannerAt(4, 31, 10); bannerAt(44, 76, 9); bannerAt(78, 96, 10);
    [[12, 0], [24, 1], [46, 2], [53, 0], [69, 2], [82, 0], [90, 1]].forEach(([c, v]) => this.at(`sa-wall-${v}`, c - 1, 0.6, 8));
    [6, 17, 21, 29, 47, 57, 73, 78, 88].forEach((c) => this.at("sa-agave", c, 1));
    [11, 52, 67, 93].forEach((c) => this.at("sa-agave2", c, 1));
    // Macaws perched on the walls, who fly off when she runs close.
    [24, 53, 90].forEach((c) => { const g = this.gy(c); if (g > 0) this.bird(c, c * T + 8, g * T - 39); });
  }

  panama() {
    const L = this.L;
    this.bgItem("sa-ship", 116 * T, 0.5, -2, 0, -7).drift = 0;
    this.shipSp = this.bgItems[this.bgItems.length - 1];
    L.add.image(110 * T + 2, 17 * T + 4, "sa-lockgate").setOrigin(0, 1).setDepth(0.6);
    L.add.image(121 * T - 6, 17 * T + 4, "sa-lockgate").setOrigin(0, 1).setDepth(0.6);
    [[97, 0.4, "sa-jtree"], [104, 0.4, "sa-jtree"], [133, 0.4, "sa-jtree"], [141, 0.4, "sa-jtree"], [148, 0.4, "sa-jtree"]]
      .forEach(([c, _, k]) => this.at(k, c, 0.4));
    [100, 103, 124, 130, 136, 139, 144, 149].forEach((c) => this.at("sa-leaf", c, 1));
    [99, 106, 126, 129, 138, 146].forEach((c) => this.at("sa-heliconia", c, 1));
    this.bird(0, 110 * T + 12, 17 * T + 4 - 55);
    this.bird(0, 121 * T - 2, 17 * T + 4 - 55);
    // The lock raft: ridable across the chamber, flush with the banks.
    this.lift({ key: "sa-raft", x: 110 * T, y: 15 * T, axis: "x", a: 110 * T, b: 122 * T - 48, bw: 48, bh: 6, speed: 36, pause: 0.9, depth: 5 });
  }

  colombia() {
    [[152, 0], [164, 1], [180, 2], [190, 0]].forEach(([c, v]) => this.at(`sa-house-${v}`, c, 0.6, 8));
    [157, 160, 161, 167, 168, 170, 174, 176, 183, 186, 188, 192, 193].forEach((c) => this.at("sa-coffee", c, 1));
    [165, 190].forEach((c, i) => { const g = this.gy(c); if (g > 0) this.bird(c, c * T + 8 + 4, g * T - 38 + 4 - i * 0); });
  }

  galapagos() {
    const L = this.L;
    [201, 207, 222, 229, 238, 250, 254, 261, 268, 274, 280, 289].forEach((c, i) => this.at(`sa-cactus-${i % 2}`, c, 1));
    // Crabs patrol a little stretch of ground each.
    if (!L.anims.exists("sa-crab")) L.anims.create({ key: "sa-crab", frames: [{ key: "sa-crab-0" }, { key: "sa-crab-1" }], frameRate: 6, repeat: -1 });
    [211, 225, 236, 249, 259, 272, 278].forEach((c, i) => {
      const g = this.gy(c);
      if (g < 0) return;
      const sp = L.add.sprite(c * T + 8, g * T, "sa-crab-0").setOrigin(0.5, 1).setDepth(4).play("sa-crab");
      L.tweens.add({ targets: sp, x: sp.x + 28, duration: 1500 + i * 120, yoyo: true, repeat: -1, ease: "Sine.inOut", onYoyo: () => sp.setFlipX(true), onRepeat: () => sp.setFlipX(false) });
    });
  }

  chile() {
    const L = this.L;
    // Baked hillside: colored houses packed over the dirt of the hill.
    const x0 = 300, x1 = 331, y0 = 9, y1 = 16;
    const cw = (x1 - x0 + 1) * T, ch = (y1 - y0 + 1) * T;
    const key = "sa-hill";
    if (!L.textures.exists(key)) {
      const tex = L.textures.createCanvas(key, cw, ch);
      const ctx = tex.getContext("2d");
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let cy = 0; cy < (y1 - y0 + 1) / 2 + 1; cy++) {
        for (let cx = -1; cx < (x1 - x0 + 1) / 2 + 1; cx++) {
          const ox = cx * 32 + (cy % 2) * 16, oy = cy * 32 - 0;
          const wall = HILL_COLORS[Math.floor(rnd() * HILL_COLORS.length)];
          const roof = HILL_COLORS[Math.floor(rnd() * HILL_COLORS.length)];
          ctx.fillStyle = wall; ctx.fillRect(ox, oy + 6, 32, 26);
          ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(ox, oy + 6, 32, 2); ctx.fillRect(ox + 31, oy + 6, 1, 26);
          ctx.fillStyle = roof; ctx.fillRect(ox - 1, oy + 2, 34, 5);
          ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(ox - 1, oy + 2, 34, 1);
          ctx.fillStyle = "#2a2038"; ctx.fillRect(ox + 4, oy + 12, 7, 8); ctx.fillRect(ox + 20, oy + 12, 7, 8);
          ctx.fillStyle = "#ffe9a8"; ctx.fillRect(ox + 5, oy + 13, 5, 6); ctx.fillRect(ox + 21, oy + 13, 5, 6);
          ctx.fillStyle = "#2a2038"; ctx.fillRect(ox + 7, oy + 13, 1, 6); ctx.fillRect(ox + 23, oy + 13, 1, 6);
          ctx.fillStyle = HILL_COLORS[Math.floor(rnd() * HILL_COLORS.length)]; ctx.fillRect(ox + 13, oy + 20, 6, 12);
          ctx.fillStyle = "#ffd23c"; ctx.fillRect(ox + 17, oy + 26, 1, 1);
          if (rnd() < 0.5) { ctx.fillStyle = "#4ac860"; ctx.fillRect(ox + 4, oy + 21, 7, 1); ctx.fillStyle = "#ff5fa2"; ctx.fillRect(ox + 5, oy + 20, 1, 1); ctx.fillRect(ox + 8, oy + 20, 1, 1); }
        }
      }
      // keep only the dirt tiles of the hill
      const mask = document.createElement("canvas");
      mask.width = cw; mask.height = ch;
      const mctx = mask.getContext("2d");
      mctx.fillStyle = "#fff";
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
        if (L.cell(x, y) === "#" && L.cell(x, y - 1) === "#") mctx.fillRect((x - x0) * T, (y - y0) * T, T, T);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      tex.refresh();
    }
    L.add.image(x0 * T, y0 * T, key).setOrigin(0, 0).setDepth(2.2);
    // Houses behind the flat streets, and the house at the top.
    [333, 340, 349, 357, 366, 373].forEach((c, i) => this.at(`sa-chouse-${i % 4}`, c - 1, 0.6, 8));
    this.at("sa-tophome", 315, 0.8);
    // Funicular: station behind the top, rails, and the car.
    L.add.image(297 * T - 8, 8 * T, "sa-station").setOrigin(0, 1).setDepth(0.7);
    L.add.tileSprite(298 * T + 5, 8 * T, 6, 9 * T, "sa-rail").setOrigin(0, 0).setDepth(3.5);
    this.lift({ key: "sa-funi", x: 297 * T, y: 17 * T - 30, axis: "y", a: 8 * T - 30, b: 17 * T - 30, bw: 48, bh: 6, boy: 30, speed: 42, pause: 1.2, depth: 4 });
    this.at("sa-agave", 292, 1);
    this.at("sa-chouse-2", 287, 0.6, 8);
  }

  argentina() {
    const L = this.L;
    if (!L.anims.exists("sa-none")) L.anims.create({ key: "sa-none", frames: [{ key: "sa-gust" }], frameRate: 1 });
    [384, 391, 411, 414, 424, 433, 447, 456, 463].forEach((c) => this.at("sa-poplar", c, 0.5));
    [388, 417, 441, 459, 466].forEach((c) => this.at("sa-vinerow", c, 0.6, 16));
    [394, 402, 409, 421, 430, 436, 450, 461, 468, 476].forEach((c) => this.at("sa-tuft", c, 1));
    this.condor = this.bgItem("sa-condor", 430 * T, 0.35, -150, 0, -7.5);
    // Wind streaks, only seen while a gust blows.
    for (let i = 0; i < 7; i++) {
      const sp = L.add.image(0, 0, "sa-gust").setScrollFactor(0).setDepth(25).setAlpha(0).setVisible(false);
      this.streaks.push({ sp, x: i * 60, y: 30 + (i * 37) % 120, v: 280 + i * 20 });
    }
  }

  brazil() {
    const L = this.L;
    // Mosaic pavement over the top row of the ground, following the dunes.
    let c = 506;
    while (c < L.colsN) {
      const g = this.gy(c);
      let e = c;
      while (e + 1 < L.colsN && this.gy(e + 1) === g) e++;
      if (g > 0) L.add.tileSprite(c * T, g * T, (e - c + 1) * T, T, "sa-mosaic").setOrigin(0, 0).setDepth(2.2);
      c = e + 1;
    }
    [508, 515, 523, 533, 545, 557, 563].forEach((c2, i) => this.at(i % 2 ? "sa-palm2" : "sa-palm", c2, 0.7));
    [519, 553].forEach((c2) => this.at("sa-kiosk", c2 - 1, 0.8, 8));
    [[526, 0], [547, 1], [565, 2]].forEach(([c2]) => {
      const g = this.gy(c2);
      if (g < 0) return;
      const sp = this.img("sa-umbrella", c2 * T + 8, g * T, 3);
      this.umbrellas.push({ sp, x: c2 * T + 8, top: g * T - 29, busy: 0 });
    });
  }

  // ---------- per-frame ----------
  tick(_t, deltaMs) {
    const L = this.L;
    if (L.mode === "paused") return;
    const dt = Math.min(deltaMs, 50) / 1000;
    const play = L.mode === "play";
    // Lifts: stop where they are during cutscenes.
    for (const l of this.lifts) {
      const b = l.sp.body;
      if (!play) { b.setVelocity(0, 0); continue; }
      if (l.wait > 0) { l.wait -= dt; b.setVelocity(0, 0); continue; }
      const pos = l.axis === "x" ? l.sp.x : l.sp.y, target = l.dir > 0 ? l.b : l.a;
      if ((l.dir > 0 && pos >= target) || (l.dir < 0 && pos <= target)) {
        if (l.axis === "x") l.sp.x = target; else l.sp.y = target;
        l.dir *= -1; l.wait = l.pause; b.setVelocity(0, 0);
      } else if (l.axis === "x") b.setVelocity(l.speed * l.dir, 0);
      else b.setVelocity(0, l.speed * l.dir);
    }
    this.background(dt);
  }

  background(dt) {
    const L = this.L, cam = L.cameras.main;
    const t = L.time.now / 1000;
    const mid = cam.scrollX + cam.width / 2;
    for (const it of this.bgItems) {
      const off = (it.wx - mid) * it.f;
      it.sp.x = Math.round(cam.width / 2 + off + Math.sin(t * 0.15 + it.ph) * (it.sp.texture.key === "sa-condor" ? 90 : 60));
      it.sp.y = Math.round(L.horizon - cam.scrollY * 0.9 + it.dy + (it.sp.texture.key === "sa-condor" ? Math.sin(t * 0.4 + it.ph) * 10 : 0));
      it.sp.setVisible(Math.abs(off) < cam.width * 0.9);
    }
    for (const p of this.papel) p.ts.tilePositionX = Math.sin(t * 1.6 + p.ph) * 1.6;
  }

  update(dt) {
    const L = this.L, p = L.player, b = p.sprite.body;
    if (p.dead) return;
    const px = b.center.x, t = L.time.now;

    // Macaws fly off when she comes close.
    for (const bd of this.birds) {
      if (bd.flown || Math.abs(bd.x - px) > 56) continue;
      bd.flown = true;
      const dir = px < bd.x ? 1 : -1, sp = bd.sp;
      sp.setTexture("sa-bird-1");
      L.tweens.add({ targets: sp, x: sp.x + dir * 90, y: sp.y - 70, duration: 1500, ease: "Quad.out" });
      L.tweens.add({ targets: sp, alpha: 0, delay: 900, duration: 600, onComplete: () => sp.destroy() });
      L.tweens.add({ targets: sp, scaleY: { from: 1, to: 0.7 }, duration: 110, yoyo: true, repeat: 6, onRepeat: () => sp.setTexture(Math.random() < 0.5 ? "sa-bird-0" : "sa-bird-1") });
    }

    // Beach umbrellas: land on the canopy and bounce.
    for (const u of this.umbrellas) {
      if (u.busy > 0) { u.busy -= dt; continue; }
      if (Math.abs(px - u.x) < 15 && b.velocity.y > 40 && b.bottom > u.top - 2 && b.bottom < u.top + 9) {
        u.busy = 0.25;
        b.setVelocityY(-385);
        p.cut = true;
        L.puff(u.x, u.top, 0xfffaf0, 6);
        L.tweens.add({ targets: u.sp, scaleY: 0.82, duration: 90, yoyo: true });
        import("../audio.js").then((m) => m.sfx.boost?.());
      }
    }

    // Argentina: a cold gust now and then pushes against her in the air. Never at the hut.
    const col = px / T;
    const windy = col > 395 && col < 480 && px < this.hutX - 160;
    const g = this.gust;
    g.t -= dt;
    if (g.t <= 0) { g.on = g.on ? 0 : 2.2; g.t = g.on ? 2.2 : 5 + Math.random() * 3; }
    const blowing = windy && g.on > 0;
    if (blowing && !p.onGround && !p.locked) p.sprite.x -= 20 * dt;
    for (const s of this.streaks) {
      s.sp.setVisible(blowing);
      if (!blowing) { s.sp.setAlpha(0); continue; }
      s.sp.setAlpha(0.8);
      s.x += s.v * dt;
      if (s.x > L.cameras.main.width + 30) s.x = -30;
      s.sp.setPosition(L.cameras.main.width - s.x, s.y);
    }
  }
}
