// Pixel fonts for "Super Jasmin World 3: A New Magic".
// Two hand-drawn bitmap fonts, rendered once into canvas textures and registered
// as Phaser BitmapText fonts. One font pixel == one game pixel.
//
//   "px"     small: cap 7, x-height 5, 2 px descenders. Fill rows are y=1..7
//            (caps), 8..9 (descenders) inside a 11 px tall cell.
//            Baseline (bottom edge of the cap fill) is at y = 8 from the text top.
//   "px-big" titles: caps only, cap 10, 2 px strokes. Fill rows y=1..10, baseline
//            at y = 11 from the text top, cell 12 px tall.
//
// Every glyph is white (#ffffff) with a baked 1 px #141012 outline on all 8
// neighbours. Cells include the outline (xOffset -1) and the advance is
// fillWidth + 1, so letters keep exactly 1 px of gap between fills; the outlines
// of neighbours share that gap column.

export const FONTS = { small: "px", big: "px-big" };
export const LINE = { small: 12, big: 14 };

const OUTLINE = "#141012";
const SPACE = { small: 3, big: 5 };
const HEIGHT = { small: 9, big: 10 }; // fill rows in a cell (without outline)

// Each entry: rows joined by "," ; optional "N:" prefix = first row index (default 0).
const SMALL = {
  A: ".XX.,X..X,X..X,XXXX,X..X,X..X,X..X",
  B: "XXX.,X..X,X..X,XXX.,X..X,X..X,XXX.",
  C: ".XXX,X...,X...,X...,X...,X...,.XXX",
  D: "XXX.,X..X,X..X,X..X,X..X,X..X,XXX.",
  E: "XXXX,X...,X...,XXX.,X...,X...,XXXX",
  F: "XXXX,X...,X...,XXX.,X...,X...,X...",
  G: ".XXX,X...,X...,X.XX,X..X,X..X,.XXX",
  H: "X..X,X..X,X..X,XXXX,X..X,X..X,X..X",
  I: "XXX,.X.,.X.,.X.,.X.,.X.,XXX",
  J: "...X,...X,...X,...X,X..X,X..X,.XX.",
  K: "X..X,X..X,X.X.,XX..,X.X.,X..X,X..X",
  L: "X...,X...,X...,X...,X...,X...,XXXX",
  M: "X...X,XX.XX,X.X.X,X.X.X,X...X,X...X,X...X",
  N: "X..X,XX.X,XX.X,X.XX,X.XX,X..X,X..X",
  O: ".XX.,X..X,X..X,X..X,X..X,X..X,.XX.",
  P: "XXX.,X..X,X..X,XXX.,X...,X...,X...",
  Q: ".XX.,X..X,X..X,X..X,X.XX,X..X,.XXX",
  R: "XXX.,X..X,X..X,XXX.,X.X.,X..X,X..X",
  S: ".XXX,X...,X...,.XX.,...X,...X,XXX.",
  T: "XXXXX,..X..,..X..,..X..,..X..,..X..,..X..",
  U: "X..X,X..X,X..X,X..X,X..X,X..X,.XX.",
  V: "X...X,X...X,X...X,X...X,.X.X.,.X.X.,..X..",
  W: "X...X,X...X,X...X,X.X.X,X.X.X,XX.XX,X...X",
  X: "X..X,X..X,.XX.,.XX.,.XX.,X..X,X..X",
  Y: "X...X,X...X,.X.X.,..X..,..X..,..X..,..X..",
  Z: "XXXX,...X,...X,.XX.,X...,X...,XXXX",
  a: "2:.XX.,...X,.XXX,X..X,.XXX",
  b: "X...,X...,XXX.,X..X,X..X,X..X,XXX.",
  c: "2:.XXX,X...,X...,X...,.XXX",
  d: "...X,...X,.XXX,X..X,X..X,X..X,.XXX",
  e: "2:.XX.,X..X,XXXX,X...,.XXX",
  f: ".XX,X..,XXX,X..,X..,X..,X..",
  g: "2:.XXX,X..X,X..X,X..X,.XXX,...X,XXX.",
  h: "X...,X...,XXX.,X..X,X..X,X..X,X..X",
  i: "X,.,X,X,X,X,X",
  j: "..X,...,..X,..X,..X,..X,..X,..X,XX.",
  k: "X...,X...,X..X,X.X.,XX..,X.X.,X..X",
  l: "X,X,X,X,X,X,X",
  m: "2:XXXX.,X.X.X,X.X.X,X.X.X,X.X.X",
  n: "2:XXX.,X..X,X..X,X..X,X..X",
  o: "2:.XX.,X..X,X..X,X..X,.XX.",
  p: "2:XXX.,X..X,X..X,X..X,XXX.,X...,X...",
  q: "2:.XXX,X..X,X..X,X..X,.XXX,...X,...X",
  r: "2:X.XX,XX..,X...,X...,X...",
  s: "2:.XXX,X...,.XX.,...X,XXX.",
  t: "1:.X.,XXX,.X.,.X.,.X.,.XX",
  u: "2:X..X,X..X,X..X,X..X,.XXX",
  v: "2:X...X,X...X,.X.X.,.X.X.,..X..",
  w: "2:X...X,X...X,X.X.X,X.X.X,.X.X.",
  x: "2:X..X,X..X,.XX.,X..X,X..X",
  y: "2:X..X,X..X,X..X,X..X,.XXX,...X,XXX.",
  z: "2:XXXX,...X,.XX.,X...,XXXX",
  0: ".XX.,X..X,X.XX,XX.X,X..X,X..X,.XX.",
  1: ".X.,XX.,.X.,.X.,.X.,.X.,XXX",
  2: ".XX.,X..X,...X,..X.,.X..,X...,XXXX",
  3: "XXX.,...X,...X,.XX.,...X,...X,XXX.",
  4: "...X,..XX,.X.X,X..X,XXXX,...X,...X",
  5: "XXXX,X...,XXX.,...X,...X,X..X,.XX.",
  6: ".XX.,X...,X...,XXX.,X..X,X..X,.XX.",
  7: "XXXX,...X,...X,..X.,.X..,.X..,.X..",
  8: ".XX.,X..X,X..X,.XX.,X..X,X..X,.XX.",
  9: ".XX.,X..X,X..X,.XXX,...X,...X,.XX.",
  "!": "X,X,X,X,X,.,X",
  '"': "X.X,X.X",
  "#": ".X.X.,.X.X.,XXXXX,.X.X.,XXXXX,.X.X.,.X.X.",
  $: "..X..,.XXXX,X.X..,.XXX.,..X.X,XXXX.,..X..",
  "%": "XX..X,XX.X.,...X.,..X..,.X...,.X.XX,X..XX",
  "&": ".XX..,X..X.,X..X.,.XX..,X.X.X,X..X.,.XX.X",
  "'": "X,X",
  "(": ".X,X.,X.,X.,X.,X.,X.,X.,.X",
  ")": "X.,.X,.X,.X,.X,.X,.X,.X,X.",
  "*": "1:X.X,.X.,X.X",
  "+": "3:.X.,XXX,.X.",
  ",": "6:.X,.X,X.",
  "-": "4:XXX",
  ".": "6:X",
  "/": "..X,..X,.X.,.X.,.X.,X..,X..",
  ":": "3:X,.,.,X",
  ";": "3:.X,..,..,.X,.X,X.",
  "<": "2:..X,.X.,X..,.X.,..X",
  "=": "3:XXX,...,XXX",
  ">": "2:X..,.X.,..X,.X.,X..",
  "?": ".XX.,X..X,...X,..X.,.X..,....,.X..",
  "@": ".XXX.,X...X,X.XXX,X.X.X,X.XXX,X....,.XXXX",
  "[": "XX,X.,X.,X.,X.,X.,X.,X.,XX",
  "\\": "X..,X..,.X.,.X.,.X.,..X,..X",
  "]": "XX,.X,.X,.X,.X,.X,.X,.X,XX",
  "^": ".X.,X.X",
  _: "8:XXXXX",
  "`": "X.,.X",
  "{": "..X,.X.,.X.,.X.,X..,.X.,.X.,.X.,..X",
  "|": "X,X,X,X,X,X,X,X,X",
  "}": "X..,.X.,.X.,.X.,..X,.X.,.X.,.X.,X..",
  "~": "3:.XX.X,X.XX.",
  "✕": "1:X...X,.X.X.,..X..,.X.X.,X...X", // cross
  "□": "1:XXXXX,X...X,X...X,X...X,XXXXX", // square
  "○": "1:.XXX.,X...X,X...X,X...X,.XXX.", // circle
  "⌫": "1:..XXXXXX,.X..X.XX,X....X.X,.X..X.XX,..XXXXXX", // delete
  "♪": "..XXX,..X.X,..X..,..X..,.XX..,XXX..,.XX..", // note
  "…": "6:X.X.X",
  "·": "4:X",
};

const BIG = {
  A: "..XXX..,.XXXXX.,XX...XX,XX...XX,XX...XX,XXXXXXX,XXXXXXX,XX...XX,XX...XX,XX...XX",
  B: "XXXXXX.,XXXXXXX,XX...XX,XX...XX,XXXXXX.,XXXXXX.,XX...XX,XX...XX,XXXXXXX,XXXXXX.",
  C: ".XXXXX.,XXXXXXX,XX...XX,XX.....,XX.....,XX.....,XX.....,XX...XX,XXXXXXX,.XXXXX.",
  D: "XXXXXX.,XXXXXXX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XXXXXXX,XXXXXX.",
  E: "XXXXXX,XXXXXX,XX....,XX....,XXXXX.,XXXXX.,XX....,XX....,XXXXXX,XXXXXX",
  F: "XXXXXX,XXXXXX,XX....,XX....,XXXXX.,XXXXX.,XX....,XX....,XX....,XX....",
  G: ".XXXXX.,XXXXXXX,XX...XX,XX.....,XX.XXXX,XX.XXXX,XX...XX,XX...XX,XXXXXXX,.XXXXX.",
  H: "XX...XX,XX...XX,XX...XX,XX...XX,XXXXXXX,XXXXXXX,XX...XX,XX...XX,XX...XX,XX...XX",
  I: "XXXXXX,XXXXXX,..XX..,..XX..,..XX..,..XX..,..XX..,..XX..,XXXXXX,XXXXXX",
  J: "....XX,....XX,....XX,....XX,....XX,....XX,....XX,XX..XX,XXXXXX,.XXXX.",
  K: "XX...XX,XX...XX,XX..XX.,XX.XX..,XXXX...,XXXX...,XX.XX..,XX..XX.,XX...XX,XX...XX",
  L: "XX....,XX....,XX....,XX....,XX....,XX....,XX....,XX....,XXXXXX,XXXXXX",
  M: "XXX...XXX,XXXX.XXXX,XXXXXXXXX,XX.XXX.XX,XX..X..XX,XX.....XX,XX.....XX,XX.....XX,XX.....XX,XX.....XX",
  N: "XXX..XX,XXXX.XX,XXXXXXX,XX.XXXX,XX..XXX,XX..XXX,XX...XX,XX...XX,XX...XX,XX...XX",
  O: ".XXXXX.,XXXXXXX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XXXXXXX,.XXXXX.",
  P: "XXXXXX.,XXXXXXX,XX...XX,XX...XX,XXXXXXX,XXXXXX.,XX.....,XX.....,XX.....,XX.....",
  Q: ".XXXXX.,XXXXXXX,XX...XX,XX...XX,XX...XX,XX...XX,XX.X.XX,XX.XXXX,XXXXXX.,.XXX.XX",
  R: "XXXXXX.,XXXXXXX,XX...XX,XX...XX,XXXXXXX,XXXXXX.,XX..XX.,XX...XX,XX...XX,XX...XX",
  S: ".XXXXX.,XXXXXXX,XX.....,XXXXXX.,.XXXXXX,.....XX,.....XX,XX...XX,XXXXXXX,.XXXXX.",
  T: "XXXXXX,XXXXXX,..XX..,..XX..,..XX..,..XX..,..XX..,..XX..,..XX..,..XX..",
  U: "XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XXXXXXX,.XXXXX.",
  V: "XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,XX...XX,.XX.XX.,.XX.XX.,..XXX..,..XXX..",
  W: "XX.....XX,XX.....XX,XX.....XX,XX.....XX,XX.....XX,XX..X..XX,XX.XXX.XX,XXXXXXXXX,XXXX.XXXX,XXX...XXX",
  X: "XX...XX,XX...XX,XXX.XXX,.XXXXX.,..XXX..,..XXX..,.XXXXX.,XXX.XXX,XX...XX,XX...XX",
  Y: "XX...XX,XX...XX,XX...XX,XXX.XXX,.XXXXX.,..XXX..,..XXX..,..XXX..,..XXX..,..XXX..",
  Z: "XXXXXXX,XXXXXXX,.....XX,....XXX,...XXX.,..XXX..,.XXX...,XXX....,XXXXXXX,XXXXXXX",
  0: ".XXXX.,XXXXXX,XX..XX,XX..XX,XX..XX,XX..XX,XX..XX,XX..XX,XXXXXX,.XXXX.",
  1: "..XX..,.XXX..,XXXX..,..XX..,..XX..,..XX..,..XX..,..XX..,XXXXXX,XXXXXX",
  2: ".XXXXX.,XXXXXXX,XX...XX,.....XX,....XXX,..XXXX.,.XXX...,XXX....,XXXXXXX,XXXXXXX",
  3: "XXXXXX.,XXXXXXX,.....XX,.....XX,..XXXX.,..XXXX.,.....XX,.....XX,XXXXXXX,XXXXXX.",
  4: "....XXX,...XXXX,..XXXXX,.XX.XXX,XX..XXX,XXXXXXX,XXXXXXX,....XXX,....XXX,....XXX",
  5: "XXXXXXX,XXXXXXX,XX.....,XXXXXX.,XXXXXXX,.....XX,.....XX,XX...XX,XXXXXXX,.XXXXX.",
  6: ".XXXXX.,XXXXXXX,XX.....,XX.....,XXXXXX.,XXXXXXX,XX...XX,XX...XX,XXXXXXX,.XXXXX.",
  7: "XXXXXXX,XXXXXXX,.....XX,....XXX,....XX.,...XX..,..XXX..,..XX...,..XX...,..XX...",
  8: ".XXXXX.,XXXXXXX,XX...XX,XX...XX,.XXXXX.,.XXXXX.,XX...XX,XX...XX,XXXXXXX,.XXXXX.",
  9: ".XXXXX.,XXXXXXX,XX...XX,XX...XX,XXXXXXX,.XXXXXX,.....XX,.....XX,XXXXXXX,.XXXXX.",
  ".": "8:XX,XX",
  ",": "7:XX,XX,X.",
  ":": "2:XX,XX,..,..,..,..,XX,XX",
  ";": "2:XX,XX,..,..,..,XX,XX,X.",
  "!": "XX,XX,XX,XX,XX,XX,XX,..,XX,XX",
  "?": ".XXXXX.,XXXXXXX,XX...XX,.....XX,...XXX.,..XXX..,..XX...,.......,..XX...,..XX...",
  "'": "XX,XX,X.",
  '"': "XX.XX,XX.XX,X..X.",
  "-": "4:XXXXX,XXXXX",
  "+": "2:..XX..,..XX..,XXXXXX,XXXXXX,..XX..,..XX..",
  "&": "..XXXX..,.XXXXXX.,.XX..XX.,..XXXX..,.XXXX.XX,XXXXXXX.,XX.XXXX.,XX..XXX.,XXXXXXXX,.XXXX.XX",
  "/": "....XX,....XX,...XX.,...XX.,..XX..,..XX..,.XX...,.XX...,XX....,XX....",
  "(": "..XX,.XX.,XX..,XX..,XX..,XX..,XX..,XX..,.XX.,..XX",
  ")": "XX..,.XX.,..XX,..XX,..XX,..XX,..XX,..XX,.XX.,XX..",
  "#": ".XX..XX.,.XX..XX.,XXXXXXXX,XXXXXXXX,.XX..XX.,.XX..XX.,XXXXXXXX,XXXXXXXX,.XX..XX.,.XX..XX.",
  "%": "XXX....XX,XXX...XX.,XXX..XX..,.....XX..,....XX...,...XX....,..XX..XXX,.XX...XXX,XX....XXX,XX.......",
};

const BUILT = {};

function parse(def) {
  let y0 = 0;
  const m = /^(\d):(.*)$/.exec(def);
  if (m) { y0 = +m[1]; def = m[2]; }
  const rows = def.split(",");
  const w = Math.max(...rows.map((r) => r.length));
  return { rows, w, y0 };
}

function layout(which) {
  const src = which === "big" ? BIG : SMALL;
  const H = HEIGHT[which];
  const glyphs = [];
  for (const ch of Object.keys(src)) {
    const g = parse(src[ch]);
    g.ch = ch;
    glyphs.push(g);
  }
  // pack in rows of at most 256 px width, 1 px padding
  const cellH = H + 2;
  let x = 0, y = 0;
  const maxW = 256;
  for (const g of glyphs) {
    const cw = g.w + 2;
    if (x + cw > maxW) { x = 0; y += cellH + 1; }
    g.cx = x; g.cy = y; g.cw = cw;
    x += cw + 1;
  }
  const height = y + cellH;
  return { glyphs, width: maxW, height, cellH, H };
}

function build(scene, which) {
  const key = FONTS[which];
  if (BUILT[key] && scene.textures.exists(key) && scene.cache.bitmapFont.exists(key)) return;
  const L = layout(which);
  if (!scene.textures.exists(key)) {
    const tex = scene.textures.createCanvas(key, L.width, L.height);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, L.width, L.height);
    for (const g of L.glyphs) {
      const grid = [];
      for (let yy = 0; yy < L.cellH; yy++) grid.push(new Array(g.cw).fill(false));
      g.rows.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === "X") grid[1 + g.y0 + ry][1 + rx] = true;
        }
      });
      ctx.fillStyle = OUTLINE;
      for (let yy = 0; yy < L.cellH; yy++) {
        for (let xx = 0; xx < g.cw; xx++) {
          if (grid[yy][xx]) continue;
          let near = false;
          for (let dy = -1; dy <= 1 && !near; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const r = grid[yy + dy];
              if (r && r[xx + dx]) { near = true; break; }
            }
          }
          if (near) ctx.fillRect(g.cx + xx, g.cy + yy, 1, 1);
        }
      }
      ctx.fillStyle = "#ffffff";
      for (let yy = 0; yy < L.cellH; yy++) {
        for (let xx = 0; xx < g.cw; xx++) if (grid[yy][xx]) ctx.fillRect(g.cx + xx, g.cy + yy, 1, 1);
      }
    }
    tex.refresh();
    if (tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  if (!scene.cache.bitmapFont.exists(key)) {
    const chars = {};
    const mk = (code, o) => {
      chars[code] = Object.assign({ x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0, xOffset: 0, yOffset: 0, xAdvance: 0, data: {}, kerning: {}, u0: 0, v0: 0, u1: 0, v1: 0 }, o);
    };
    for (const g of L.glyphs) {
      mk(g.ch.charCodeAt(0), {
        x: g.cx, y: g.cy, width: g.cw, height: L.cellH,
        centerX: Math.floor(g.cw / 2), centerY: Math.floor(L.cellH / 2),
        xOffset: -1, yOffset: 0, xAdvance: g.w + 1,
        u0: g.cx / L.width, v0: g.cy / L.height,
        u1: (g.cx + g.cw) / L.width, v1: (g.cy + L.cellH) / L.height,
      });
    }
    mk(32, { xAdvance: SPACE[which] });
    if (which === "big") mk(160, { xAdvance: SPACE[which] });
    scene.cache.bitmapFont.add(key, {
      data: { font: key, size: L.H, lineHeight: LINE[which], retroFont: false, chars },
      texture: key,
      frame: null,
    });
  }
  BUILT[key] = true;
}

export function makeFonts(scene) {
  build(scene, "small");
  build(scene, "big");
}

const SETS = {};
function set(which) {
  if (!SETS[which]) {
    const s = new Set(Object.keys(which === "big" ? BIG : SMALL));
    s.add(" ");
    s.add("\n");
    SETS[which] = s;
  }
  return SETS[which];
}

const PRE = {
  "—": "-", "–": "-", "−": "-", "‐": "-", "‑": "-",
  "‘": "'", "’": "'", "‚": ",", "‛": "'",
  "“": '"', "”": '"', "„": '"',
  " ": " ", "\t": " ", "\r": "",
};

export function fontSafe(str, which = "small") {
  const ok = set(which);
  let s = String(str == null ? "" : str);
  if (which === "big") s = s.toUpperCase();
  let out = "";
  for (const ch of Array.from(s)) {
    if (ok.has(ch)) { out += ch; continue; }
    if (PRE[ch] !== undefined) { out += PRE[ch]; continue; }
    if (ch === "…" && which === "big") { out += "..."; continue; }
    const nf = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (nf === "" ) continue;
    let r = "";
    for (const c of Array.from(which === "big" ? nf.toUpperCase() : nf)) r += ok.has(c) ? c : "?";
    out += r.length ? r : "?";
  }
  return out;
}

// Width in px of the widest line, measured over the fill pixels (outline adds 1 px each side).
export function measure(str, which = "small") {
  const s = fontSafe(str, which);
  const src = which === "big" ? BIG : SMALL;
  let best = 0;
  for (const line of s.split("\n")) {
    let w = 0;
    for (const ch of line) {
      w += ch === " " ? SPACE[which] : parse(src[ch]).w + 1;
    }
    best = Math.max(best, line.length ? w - 1 : 0);
  }
  return best;
}

// Paints text into a 2D canvas context with fill pixels only (no outline), for
// lettering that is part of the art, like dark street-sign text on a white plate.
// Returns the drawn width. y is the top of the cap height.
export function drawPlain(ctx, str, x, y, color, which = "small") {
  const src = which === "big" ? BIG : SMALL;
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of fontSafe(str, which)) {
    if (ch === " ") { cx += SPACE[which]; continue; }
    const def = src[ch];
    if (!def) continue;
    const g = parse(def);
    g.rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) if (row[rx] === "X") ctx.fillRect(cx + rx, y + g.y0 + ry, 1, 1);
    });
    cx += g.w + 1;
  }
  return cx - x - 1;
}
