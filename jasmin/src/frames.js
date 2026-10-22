// Animation frames for Jasmin's Game. Pure data: no Phaser, no DOM.
// Every frame is a Grid: h rows of w PALETTE slot names (or null). Frames are
// derived from the base sprites in sprites.js by moving existing pixels around.

import { SPRITES } from "./sprites.js";

export const CHARACTERS = ["jasmin", "jasminHat", "andrew", "son", "daughter", "rabbit"];

// ---------- grid helpers ----------

const blank = (w, h) => Array.from({ length: h }, () => new Array(w).fill(null));
const clone = (g) => g.map((r) => r.slice());
const W = (g) => g[0].length;

function rasterize(spr) {
  const g = blank(spr.w, spr.h);
  if (spr.rows) {
    spr.rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const slot = spr.key[ch];
        if (slot) g[y][x] = slot;
      });
    });
    return g;
  }
  for (const [r, a, b, slot] of spr.segs) for (let c = a; c <= b; c++) g[r][c] = slot;
  return g;
}

// Pads a grid with empty rows/columns (top, left), keeping the bottom-right as is.
function pad(g, top, left) {
  const w = W(g) + left;
  const out = blank(w, g.length + top);
  for (let r = 0; r < g.length; r++) for (let c = 0; c < W(g); c++) out[r + top][c + left] = g[r][c];
  return out;
}

// Shifts whole rows [r0, r1] horizontally by dx (cells pushed off the edge are dropped).
function shiftRows(g, r0, r1, dx) {
  const w = W(g);
  for (let r = Math.max(0, r0); r <= Math.min(g.length - 1, r1); r++) {
    const row = g[r].slice();
    g[r] = new Array(w).fill(null);
    for (let c = 0; c < w; c++) {
      const n = c + dx;
      if (row[c] && n >= 0 && n < w) g[r][n] = row[c];
    }
  }
  return g;
}

// Removes row `at` and inserts an empty row on top, so everything above `at` drops 1px.
function squash(g, at) {
  g.splice(at, 1);
  g.unshift(new Array(W(g)).fill(null));
  return g;
}

// Duplicates row `at` n times and removes n empty rows from the top (taller body, same height).
function stretchRows(g, at, n) {
  for (let i = 0; i < n; i++) {
    if (g[0].some(Boolean)) break;
    g.shift();
    g.splice(at - 1, 0, g[at - 1].slice());
  }
  return g;
}

function setPx(g, r, c, slot) {
  if (r >= 0 && r < g.length && c >= 0 && c < W(g)) g[r][c] = slot;
}

// Two legs, split at column `split` (left leg: c <= split). Rows [r0, r1] are the leg rows.
// Each leg is sheared sideways (0 at the hip, dx at the foot) and can be lifted by clearing
// its bottom `lift` rows (the foot then ends higher up).
function legs(g, r0, r1, split, dxL, dxR, liftL = 0, liftR = 0) {
  const w = W(g);
  const n = r1 - r0 + 1;
  const grab = (cLo, cHi) => {
    const cells = [];
    for (let r = r0; r <= r1; r++)
      for (let c = cLo; c <= cHi; c++) if (g[r][c]) { cells.push([r, c, g[r][c]]); g[r][c] = null; }
    return cells;
  };
  const left = grab(0, split);
  const right = grab(split + 1, w - 1);
  const put = (cells, dx, lift) => {
    for (const [r, c, s] of cells) {
      if (r > r1 - lift) continue;
      const nc = c + Math.round((dx * (r - r0 + 1)) / n);
      if (nc >= 0 && nc < w) g[r][nc] = s;
    }
  };
  put(left, dxL, liftL);
  put(right, dxR, liftR);
  return g;
}

const isHair = (s) => s === "H" || s === "h";

// Moves the trailing hair (hair pixels at cols <= cMax, rows >= rMin) column by column.
// shiftFn(c) > 0 moves a column down (gap at the top filled with its first pixel so the
// hair stays connected), < 0 moves it up.
function hairShift(g, shiftFn, cMax = 12, rMin = 9) {
  for (let c = 0; c <= cMax; c++) {
    const s = shiftFn(c);
    if (!s) continue;
    const cells = [];
    for (let r = rMin; r < g.length; r++) if (isHair(g[r][c])) { cells.push([r, g[r][c]]); g[r][c] = null; }
    if (!cells.length) continue;
    const put = (r, slot) => {
      if (r >= 0 && r < g.length && g[r][c] === null) g[r][c] = slot;
    };
    for (const [r, slot] of cells) put(r + s, slot);
    if (s > 0) for (let k = 0; k < s; k++) put(cells[0][0] + k, cells[0][1]);
  }
  return g;
}

// ---------- Jasmin ----------

const JASMIN_LEG = { r0: 29, r1: 31, split: 15 };
const RIPPLE = [0, 1, 2, 1];

// Rippling S-curve: amplitude grows toward the tip (low columns), phase travels along it.
function ripple(frame) {
  return (c) => {
    const amp = c <= 5 ? 2 : c <= 8 ? 1.5 : 1;
    const ph = Math.floor((12 - c) / 3);
    const v = RIPPLE[(frame + ph) % 4];
    return Math.round((v * amp) / 2);
  };
}

function jasminLegs(g, dxL, dxR, liftL = 0, liftR = 0) {
  const { r0, r1, split } = JASMIN_LEG;
  return legs(g, r0, r1, split, dxL, dxR, liftL, liftR);
}

function buildJasmin(name) {
  const base = rasterize(SPRITES[name]);
  const hat = name === "jasminHat";
  const frames = [];
  const add = (g) => frames.push(g) - 1;
  const mk = () => clone(base);

  // idle: breathing bob + hair tips sway down a pixel
  add(mk());
  {
    const g = mk();
    hairShift(g, (c) => (c <= 6 ? 1 : 0));
    squash(g, 26);
    add(g);
  }

  // run
  const legPose = [
    [-2, 2, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0, 0],
    [0, 0, 1, 0],
  ];
  for (let f = 0; f < 4; f++) {
    const g = mk();
    if (hat && (f === 1 || f === 3)) shiftRows(g, 0, 2, -1); // hat tip lags
    hairShift(g, ripple(f));
    const [a, b, la, lb] = legPose[f];
    jasminLegs(g, a, b, la, lb);
    if (f % 2 === 0) squash(g, 26);
    add(g);
  }

  // jump: legs tucked, hair lifted a little
  {
    const g = mk();
    hairShift(g, (c) => (c <= 6 ? -1 : 0));
    jasminLegs(g, -2, 1, 1, 0);
    add(g);
  }

  // fall: hair raised behind her
  const fallHair = (c) => (c <= 6 ? -2 : -1);
  {
    const g = mk();
    hairShift(g, fallHair);
    jasminLegs(g, -1, 1);
    add(g);
  }

  // glide: like fall, arms and skirt flared, hair flutters
  const flare = (g) => {
    for (const r of [26, 27, 28]) {
      const row = g[r];
      const first = row.findIndex(Boolean);
      const last = row.length - 1 - [...row].reverse().findIndex(Boolean);
      if (first > 0 && r > 26) row[first - 1] = r === 28 ? "c" : "C";
      if (last < row.length - 1) row[last + 1] = r === 28 ? "c" : "C";
    }
    for (const c of [21, 22]) setPx(g, 19, c, "S");
    setPx(g, 18, 23, "S");
    setPx(g, 20, 10, "s");
    setPx(g, 20, 11, "s");
  };
  {
    const g = mk();
    hairShift(g, fallHair);
    flare(g);
    jasminLegs(g, -1, 1);
    add(g);
  }
  {
    const g = mk();
    hairShift(g, (c) => (c <= 6 ? -1 : c <= 9 ? -2 : -1));
    flare(g);
    jasminLegs(g, -1, 1);
    squash(g, 26);
    add(g);
  }

  // hurt: eyes shut, body tilted back, hair thrown up
  {
    const g = mk();
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < W(g); c++) {
        if (g[r][c] === "W") g[r][c] = r === 12 ? "E" : "S";
        else if (g[r][c] === "E" && r !== 12 && c < 16) g[r][c] = "S";
      }
    setPx(g, 12, 18, "E");
    setPx(g, 11, 18, "S");
    setPx(g, 14, 17, "M");
    setPx(g, 14, 18, "M");
    hairShift(g, (c) => (c <= 6 ? -2 : -1));
    // tilt: head shifts back (left), shear fades toward the feet
    shiftRows(g, 0, 16, -1);
    shiftRows(g, 17, 22, -1);
    jasminLegs(g, -1, 1);
    add(g);
  }

  // wave: raised hand, two positions
  const waveA = [[18, 21], [17, 21], [16, 22], [15, 22], [14, 22], [14, 23], [13, 22], [13, 23]];
  const waveB = [[18, 21], [17, 22], [16, 22], [15, 23], [14, 23], [13, 23], [13, 22], [12, 23]];
  for (const px of [waveA, waveB]) {
    const g = mk();
    for (const [r, c] of px) setPx(g, r, c, "S");
    if (px === waveB) hairShift(g, (c) => (c <= 5 ? 1 : 0));
    add(g);
  }

  return {
    w: 24,
    h: 32,
    frames,
    anims: {
      idle: { frames: [0, 1], rate: 3, repeat: -1 },
      run: { frames: [2, 3, 4, 5], rate: 10, repeat: -1 },
      jump: { frames: [6], rate: 1, repeat: 0 },
      fall: { frames: [7], rate: 1, repeat: 0 },
      glide: { frames: [8, 9], rate: 6, repeat: -1 },
      hurt: { frames: [10], rate: 1, repeat: 0 },
      wave: { frames: [11, 12], rate: 4, repeat: -1 },
    },
  };
}

// ---------- Andrew, son, daughter ----------

// cfg: leg rows, split column, squash row, stride size (px at the foot), tuck lift.
const WALKERS = {
  andrew: { r0: 23, r1: 30, split: 15, sq: 19, stride: 2, tuck: 3 },
  son: { r0: 14, r1: 16, split: 15, sq: 12, stride: 2, tuck: 1 },
  daughter: { r0: 12, r1: 13, split: 15, sq: 10, stride: 1, tuck: 1 },
};

function buildWalker(name) {
  const cfg = WALKERS[name];
  const spr = SPRITES[name];
  const base = rasterize(spr);
  const frames = [];
  const mk = () => clone(base);
  const lg = (g, a, b, la = 0, lb = 0) => legs(g, cfg.r0, cfg.r1, cfg.split, a, b, la, lb);
  const s = cfg.stride;

  frames.push(mk());
  {
    const g = mk();
    squash(g, cfg.sq);
    frames.push(g);
  }

  const pose = [
    [-s, s, 0, 0, true],
    [0, 0, 0, 1, false],
    [0, 0, 0, 0, true],
    [0, 0, 1, 0, false],
  ];
  for (const [a, b, la, lb, bob] of pose) {
    const g = mk();
    lg(g, a, b, la, lb);
    if (bob) squash(g, cfg.sq);
    frames.push(g);
  }

  {
    const g = mk();
    lg(g, -Math.ceil(s / 2), Math.ceil(s / 2), cfg.tuck, Math.max(1, cfg.tuck - 1));
    frames.push(g);
  }

  return {
    w: spr.w,
    h: spr.h,
    frames,
    anims: {
      idle: { frames: [0, 1], rate: 2, repeat: -1 },
      run: { frames: [2, 3, 4, 5], rate: 10, repeat: -1 },
      jump: { frames: [6], rate: 1, repeat: 0 },
    },
  };
}

// ---------- Rabbit ----------

function buildRabbit() {
  const spr = SPRITES.rabbit;
  // padded 2 px on top and 2 px on the left to give the stretched hop room
  const base = pad(rasterize(spr), 2, 2);
  const mk = () => clone(base);
  const frames = [];

  frames.push(mk());
  {
    // ear tips twitch forward, nose/head dips
    const g = mk();
    shiftRows(g, 2, 3, 1);
    frames.push(g);
  }

  // hop 0: crouch (body shortened, ears flat-ish)
  {
    const g = mk();
    squash(g, 13);
    squash(g, 12);
    shiftRows(g, 0, 7, 0);
    frames.push(g);
  }
  // hop 1: stretched in the air, hind legs trail back
  {
    const g = mk();
    stretchRows(g, 12, 2);
    shiftRows(g, 10, 13, -1);
    shiftRows(g, 14, 15, -2);
    shiftRows(g, 0, 4, 1);
    frames.push(g);
  }
  // hop 2: landing, a slight crouch
  {
    const g = mk();
    squash(g, 12);
    frames.push(g);
  }

  return {
    w: W(base),
    h: base.length,
    frames,
    anims: {
      idle: { frames: [0, 1], rate: 2, repeat: -1 },
      hop: { frames: [2, 3, 4], rate: 10, repeat: -1 },
    },
  };
}

// ---------- public API ----------

export function buildFrames(name) {
  switch (name) {
    case "jasmin":
    case "jasminHat":
      return buildJasmin(name);
    case "andrew":
    case "son":
    case "daughter":
      return buildWalker(name);
    case "rabbit":
      return buildRabbit();
    default:
      throw new Error("buildFrames: unknown character " + name);
  }
}

// RGBA bytes for previewing a grid. `palette` maps slot name -> "#rrggbb".
export function gridToRGBA(grid, palette) {
  const h = grid.length;
  const w = grid[0].length;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const slot = grid[y][x];
      if (!slot) continue;
      const hex = palette[slot];
      const i = (y * w + x) * 4;
      out[i] = parseInt(hex.slice(1, 3), 16);
      out[i + 1] = parseInt(hex.slice(3, 5), 16);
      out[i + 2] = parseInt(hex.slice(5, 7), 16);
      out[i + 3] = 255;
    }
  return out;
}
