// Procedural placeholder environment art. No asset files: every texture is drawn
// pixel by pixel onto a canvas texture. Environment colors live in THEMES;
// item/enemy/prop colors live in the named constants below (they never change by theme).

// NOTE: the spec asks for a recolored Kenney (CC0) tileset, but kenney.nl is not
// reachable from the build machine, so everything below is still drawn procedurally.
// Swap the tile drawing for recolored Kenney PNGs later; THEMES stays the contract.
//
// Theme fields: sky [top,bottom], ground, groundTop, brick, accent, hills, hills2, clouds,
//   bg        background silhouette style for `bg-hills` (near) and `bg-far` (far layer):
//             hills skyline london minneapolis lake chicago chinatown jungle sea houses
//             mountains beach loft interior fire savanna
//   snow      true: snow-capped ground top and icy bricks
//   rain      true: flag for the scene (London) to add rain; no texture effect
//   stars     true: stars in bg-clouds
//   brickStyle 'choc' makes the brick tile a chocolate bar
//   seed      optional number that varies the random layout of the background
export const THEMES = {
  // ---- original themes ----
  day: {
    sky: ['#7cc8f0', '#d6f0fb'], ground: '#9a6b44', groundTop: '#5fb04a', brick: '#d9884e',
    accent: '#ef5f7a', hills: '#7fcf86', hills2: '#5eb872', clouds: '#ffffff', stars: false, skyline: false, bg: 'hills',
  },
  dusk: {
    sky: ['#4c3a8a', '#f4a26b'], ground: '#7a4e50', groundTop: '#9a7a4e', brick: '#c0675a',
    accent: '#ffcf5a', hills: '#7a5aa0', hills2: '#5e4688', clouds: '#f9c4a0', stars: false, skyline: false, bg: 'hills',
  },
  night: {
    sky: ['#0f1030', '#2b2d63'], ground: '#3d3a5c', groundTop: '#4f6e8a', brick: '#6a5a96',
    accent: '#ffe27a', hills: '#26305a', hills2: '#1b2347', clouds: '#4a4f86', stars: true, skyline: false, bg: 'hills',
  },
  city: {
    sky: ['#9fb4c8', '#dfe6ea'], ground: '#6b7078', groundTop: '#9aa0a8', brick: '#b5654a',
    accent: '#f2b43a', hills: '#8b97a6', hills2: '#6f7b8b', clouds: '#f2f4f6', stars: false, skyline: true, bg: 'skyline',
  },
  garden: {
    sky: ['#8fd8f5', '#fdf3c8'], ground: '#a87650', groundTop: '#78c850', brick: '#e29a5c',
    accent: '#ff8fb3', hills: '#9bdc8a', hills2: '#74c670', clouds: '#ffffff', stars: false, skyline: false, bg: 'hills',
  },
  home: {
    sky: ['#f0a878', '#fbe0b0'], ground: '#8a5a3c', groundTop: '#c88a52', brick: '#c9704a',
    accent: '#ffd36b', hills: '#d9966a', hills2: '#bf7a58', clouds: '#fff0d6', stars: false, skyline: false, bg: 'hills',
  },

  // ---- world themes ----
  nairobi: { // savanna sunset: purple to gold, red earth
    sky: ['#4a2a6e', '#ffb04a'], ground: '#9a4a28', groundTop: '#d2a23a', brick: '#c2552e',
    accent: '#ffd23a', hills: '#7a3a62', hills2: '#4a2650', clouds: '#ffa070', bg: 'savanna',
  },
  london: { // gray-blue rain, red accent
    sky: ['#7d8ca0', '#c4ccd6'], ground: '#4a4f5c', groundTop: '#6f8088', brick: '#a8453d',
    accent: '#d62f3a', hills: '#7a889a', hills2: '#566478', clouds: '#a8b0ba', bg: 'london', rain: true,
  },
  minneapolis: { // icy gray, snowy ground top, pale blue ice bricks
    sky: ['#aab6c4', '#e8edf2'], ground: '#74808e', groundTop: '#f4f8fc', brick: '#a8d4ee',
    accent: '#ff6f59', hills: '#9aa8b8', hills2: '#7c8a9c', clouds: '#d6dce3', bg: 'minneapolis', snow: true,
  },
  minneapolisNight: { // deep blue night by the lake
    sky: ['#060a22', '#1d2c62'], ground: '#36425e', groundTop: '#dbe6f4', brick: '#6a9cc8',
    accent: '#ffd86b', hills: '#1c2850', hills2: '#121a3c', clouds: '#2c3a70', stars: true, bg: 'lake', snow: true,
  },
  chicago: { // warm and bright: oranges, teal, sun
    sky: ['#2aa0e8', '#ffe6a0'], ground: '#d9772f', groundTop: '#2fb8a4', brick: '#f2a03d',
    accent: '#14a8a0', hills: '#e88a3c', hills2: '#c65a2e', clouds: '#ffffff', bg: 'chicago',
  },
  chinatown: { // red and gold evening
    sky: ['#4a0e22', '#f08a2c'], ground: '#4e2124', groundTop: '#d6a82e', brick: '#b3262d',
    accent: '#ffd23a', hills: '#7a1d2c', hills2: '#4a1020', clouds: '#f2a05a', bg: 'chinatown',
  },
  mexico: { // turquoise sky, terracotta, pink flowers
    sky: ['#25b4cc', '#c8f4dc'], ground: '#8a6a3a', groundTop: '#3fb04a', brick: '#e0773a',
    accent: '#ff4f9a', hills: '#2f9a4e', hills2: '#1c6c3c', clouds: '#ffffff', bg: 'jungle', seed: 1,
  },
  panama: { // deep tropical green, yellow bricks
    sky: ['#2f86d0', '#bfe8d0'], ground: '#5e4226', groundTop: '#1f9a5a', brick: '#e8c23a',
    accent: '#e8403a', hills: '#157a5a', hills2: '#0c5446', clouds: '#f2fff4', bg: 'jungle', seed: 2,
  },
  colombia: { // yellow-lime sky, bright greens
    sky: ['#f6d044', '#e4f4a4'], ground: '#7a5a2a', groundTop: '#86d02c', brick: '#e04a3a',
    accent: '#2a5bd6', hills: '#58aa2c', hills2: '#34802a', clouds: '#fffbd0', bg: 'jungle', seed: 3,
  },
  galapagos: { // black volcanic rock, turquoise sea sky
    sky: ['#12b0c8', '#a8f2e4'], ground: '#1f1d26', groundTop: '#47424f', brick: '#8a3e2c',
    accent: '#ff7a2a', hills: '#1f94aa', hills2: '#177088', clouds: '#ffffff', bg: 'sea',
  },
  chile: { // bright pastel Valparaiso
    sky: ['#9ad4ff', '#ffe4f2'], ground: '#d9a284', groundTop: '#a4e29c', brick: '#ff9fc4',
    accent: '#ffcf3e', hills: '#c4a4ec', hills2: '#98c4f2', clouds: '#ffffff', bg: 'houses',
  },
  argentina: { // cold blue-gray, wine-purple accent, Andes and vineyards
    sky: ['#56688a', '#c4d0de'], ground: '#454c60', groundTop: '#7a88a0', brick: '#8e9db6',
    accent: '#a02a62', hills: '#6a7c98', hills2: '#4a5c7e', clouds: '#9aa8bc', bg: 'mountains',
  },
  brazil: { // warm sunset beach, sand ground
    sky: ['#ff6a5a', '#ffd890'], ground: '#e4c488', groundTop: '#f8e6ac', brick: '#ee8a4a',
    accent: '#22c4a0', hills: '#b84a64', hills2: '#7a3058', clouds: '#ffb494', bg: 'beach',
  },
  brooklyn: { // red brick, chocolate-bar bricks
    sky: ['#7aa4d0', '#ecdccb'], ground: '#8a3a2a', groundTop: '#b0623c', brick: '#5a3220',
    accent: '#f5c542', hills: '#a8644e', hills2: '#82443a', clouds: '#f6ece2', bg: 'loft', brickStyle: 'choc',
  },
  building: { // interior gray and cream
    sky: ['#d6d0c0', '#efe9d6'], ground: '#84848c', groundTop: '#ebe3cb', brick: '#b8b09a',
    accent: '#4a7a9a', hills: '#bdb6a2', hills2: '#9c9686', clouds: '#f4efe0', bg: 'interior',
  },
  fire: { // dark, smoky orange
    sky: ['#140808', '#8a300e'], ground: '#2a1c1a', groundTop: '#5e3a2a', brick: '#6e2c1c',
    accent: '#ff8a2a', hills: '#3c201c', hills2: '#241210', clouds: '#4c2c24', bg: 'fire',
  },
};

// ---- item / enemy / prop colors (theme independent) ----
const INK = '#2a2038';        // outlines
const WHITE = '#fffaf0';
const HAT = '#3b2a5c';        // matches sprites.js hat
const HAT_LIGHT = '#5a4488';
const HAT_BAND = '#e0a43a';   // matches sprites.js hat band
const PEN_BODY = '#2d3a8c';
const PEN_LIGHT = '#5a6ad0';
const GOLD = '#e0a43a';
const GOLD_LIGHT = '#fff0a0';
const HEART = '#ff5c8a';
const HEART_LIGHT = '#ffc0d4';
const CHARM = '#f4e4f0';
const CHARM_SHADE = '#c8a8c8';
const INK_LINE = '#2b2a6b';
const POST = '#8a6a4a';
const FLAG_OFF = '#a09cae';
const GATE = '#f6f1e6';
const GATE_SHADE = '#cfc6b4';
const DOOR = '#c8703c';
const DOOR_DARK = '#8c4a28';
const DOOR_LIGHT = '#e89a5c';
const ENV = '#fff6e0';
const ENV_SHADE = '#d8c8a8';
const ENV_RED = '#e0485a';
const WING = '#bfe6ff';
const TRAIN = '#4f86c0';
const TRAIN_DARK = '#34608f';
const TRAIN_STRIPE = '#ffd04a';
const SOCK_A = '#ff8fb3';
const CLOTH_A = '#6fb3e0';
const CLOTH_B = '#f0c050';
const CLOTH_C = '#a8d878';
const ALARM = '#e8504a';
const ALARM_DARK = '#a8302e';
const BELL = '#ffd04a';

// ---- helpers ----
function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
// f in -1..1 : negative darkens toward black, positive lightens toward white
function shade(c, f) {
  const [r, g, b] = hex(c);
  const t = f < 0 ? 0 : 255, a = Math.abs(f);
  return toHex(r + (t - r) * a, g + (t - g) * a, b + (t - b) * a);
}
function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
// deterministic pseudo random 0..1
function rnd(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function makeCanvas(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const R = (x, y, ww, hh, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, ww, hh); };
  const P = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };
  const D = (cx, cy, r, c) => { // filled pixel disc
    ctx.fillStyle = c;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r * 0.6) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  };
  // ASCII art: rows of chars, palette map, '.' transparent
  const A = (rows, pal, ox = 0, oy = 0) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = pal[row[x]];
        if (c) P(ox + x, oy + y, c);
      }
    });
  };
  draw({ ctx, R, P, D, A, w, h });
  tex.refresh();
}

// ---- background silhouettes ----
// Every style has {far, near}. far -> `bg-far` (256x96), near -> `bg-hills` (256x64).
// Both are horizontally seamless (all x goes through a wrapping helper) and transparent
// above the silhouette. Colors derive from the theme so palettes stay distinct.
const BG_W = 256;
const TAU = Math.PI * 2;
const lum = (c) => { const [r, g, b] = hex(c); return 0.3 * r + 0.59 * g + 0.11 * b; };

function bgSetup(T) {
  const sd = T.seed || 0;
  const n1 = T.hills, n2 = T.hills2 || shade(T.hills, -0.15);
  const sk = T.sky[1];
  const dark = lum(T.sky[1]) < 90;
  return {
    T, sd, n1, n2, sk, dark,
    fc: mix(sk, n1, 0.42), fc2: mix(sk, n1, 0.62), // far layer colors (hazy)
    lit: dark ? '#ffd877' : mix(sk, '#ffffff', 0.55), // lit/pale windows
    r: (x, y, s = 0) => rnd(x, y, s + sd * 13),
  };
}

function bgCanvas(mk, key, h, fn, S) {
  mk(key, BG_W, h, (api) => {
    const { R, P } = api;
    const wx = (x) => ((Math.round(x) % BG_W) + BG_W) % BG_W;
    const RW = (x, y, w, hh, c) => {
      x = wx(x); w = Math.round(w); y = Math.round(y); hh = Math.round(hh);
      if (w <= 0 || hh <= 0) return;
      R(x, y, w, hh, c);
      if (x + w > BG_W) R(x - BG_W, y, w, hh, c);
    };
    const PW = (x, y, c) => P(wx(x), Math.round(y), c);
    const DW = (cx, cy, r, c) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + r * 0.6) PW(cx + x, cy + y, c);
      }
    };
    const LW = (x0, y0, x1, y1, c) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) PW(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
    };
    // fill a column silhouette: yf(x) -> top y, down to the bottom, 1px highlight on top
    const ridge = (yf, c, hi) => {
      for (let x = 0; x < BG_W; x++) {
        const y = Math.round(yf(x));
        R(x, y, 1, h - y, c);
        if (hi) P(x, y, hi);
      }
    };
    // windows grid on a block
    const wins = (x, w, top, bot, col, sx = 5, sy = 6, p = 0.45, seed = 0, ww = 1, wh = 2) => {
      for (let wy = top; wy < bot; wy += sy) for (let wxx = x + 2; wxx < x + w - 2; wxx += sx) {
        if (S.r(wxx, wy, seed) > p) RW(wxx, wy, ww, wh, col);
      }
    };
    fn({ ...api, RW, PW, DW, LW, ridge, wins, h });
  }, S);
}

// leaning palm: trunk from (cx,base) curving to the crown at (cx+lean, top)
function palm(a, S, cx, base, top, lean, col, col2, fr = 11) {
  const { RW, PW, LW } = a;
  const trunk = shade(col, -0.2);
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = cx + lean * t * t, y = base + (top - base) * t;
    RW(x, y, 2, 2, trunk);
  }
  const hx = cx + lean, hy = top;
  for (let k = 0; k < 8; k++) {
    const ang = Math.PI * (1.05 + k * 0.127); // sweep over the top
    const L = fr * (0.8 + 0.4 * S.r(cx, k, 5));
    const cs = Math.cos(ang), sn = Math.sin(ang);
    for (let t = 0; t <= L; t++) {
      const x = hx + cs * t, y = hy + sn * t * 0.55 + (t * t) / (L * 2.2);
      PW(x, y, k % 2 ? col : col2); PW(x, y + 1, col);
      if (t % 3 === 1) PW(x, y + 2, k % 2 ? col2 : col);
    }
  }
  RW(hx - 1, hy, 3, 2, shade(col, -0.3)); // coconuts
}

// acacia: thin trunk, forked, flat umbrella canopy
function acacia(a, S, cx, base, ty, wd, col) {
  const { RW, LW } = a;
  LW(cx, base, cx, ty + 4, col); LW(cx + 1, base, cx + 1, ty + 4, col);
  LW(cx, ty + 6, cx - wd * 0.35, ty + 1, col); LW(cx + 1, ty + 6, cx + wd * 0.35, ty + 1, col);
  for (let dy = 0; dy < 7; dy++) {
    const half = Math.round(wd * Math.sqrt(1 - Math.pow((dy - 3) / 3.6, 2)) * (dy > 3 ? 0.9 : 1));
    if (half > 0) RW(cx - half, ty + dy - 3, half * 2 + 1, 1, col);
  }
}

function bareTree(a, S, x, base, ht, col) {
  const { LW } = a;
  LW(x, base, x, base - ht, col);
  const bh = (f) => base - ht * f;
  LW(x, bh(0.5), x - 5, bh(0.5) - 6, col); LW(x, bh(0.6), x + 5, bh(0.6) - 7, col);
  LW(x, bh(0.85), x - 3, bh(0.85) - 5, col); LW(x, bh(0.9), x + 3, bh(0.9) - 5, col);
  LW(x - 5, bh(0.5) - 6, x - 7, bh(0.5) - 7, col); LW(x + 5, bh(0.6) - 7, x + 8, bh(0.6) - 7, col);
}

const BG = {};

// ---------- hills ----------
BG.hills = {
  far(a, S) {
    const { ridge, P } = a;
    ridge((x) => 62 - 11 * Math.sin(TAU * 2 * x / 256 + 0.6) - 5 * Math.sin(TAU * 5 * x / 256 + 1.2), S.fc, shade(S.fc, 0.15));
  },
  near(a, S) {
    const { R, P } = a;
    const far = S.T.hills, near = S.n2;
    const col = (amp, k, ph, y0) => {
      const out = [];
      for (let x = 0; x < 256; x++) {
        out.push(Math.round(y0 - amp * Math.sin(TAU * k * x / 256 + ph) - amp * 0.45 * Math.sin(TAU * (k * 3) * x / 256 + ph * 2)));
      }
      return out;
    };
    const f = col(9, 2, 0.6, 30), n = col(7, 3, 2.2, 42);
    for (let x = 0; x < 256; x++) {
      R(x, f[x], 1, 64 - f[x], far);
      if (x > 0 && (f[x] < f[x - 1])) P(x, f[x], shade(far, 0.22)); else P(x, f[x], shade(far, 0.1));
      R(x, n[x], 1, 64 - n[x], near);
      P(x, n[x], shade(near, 0.18));
    }
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rnd(i, 1, 9) * 250) + 3, y = n[x];
      R(x - 1, y - 3, 3, 3, shade(near, -0.18)); P(x, y - 4, shade(near, -0.18));
    }
  },
};

// ---------- skyline (generic city blocks) ----------
BG.skyline = {
  far(a, S) {
    const { RW, PW, wins } = a;
    const bw = [20, 14, 26, 18, 30, 16, 24, 20, 28, 24, 36];
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 36 + Math.floor(S.r(i, 2, 3) * 44);
      const c = i % 2 ? S.fc : S.fc2;
      RW(x, 96 - hh, w - 1, hh, c);
      wins(x, w, 96 - hh + 3, 94, shade(c, 0.16), 4, 5, 0.55, 4);
      if (i % 3 === 0) { RW(x + w / 2, 96 - hh - 6, 1, 6, c); }
      x += w;
    });
  },
  near(a, S) {
    const { R, P } = a;
    const far = S.T.hills, near = S.n2;
    const bw = [24, 16, 32, 20, 28, 16, 24, 20, 32, 24, 20];
    [[far, 0], [near, 1]].forEach(([col, layer]) => {
      let x = layer ? 8 : 0;
      for (let i = 0; i < bw.length; i++) {
        const w = bw[(i + layer * 3) % bw.length];
        const h = 20 + Math.floor(rnd(i, layer, 3) * 28) - layer * 6;
        for (let k = 0; k < w - 2; k++) R((x + k) % 256, 64 - h, 1, h, col);
        for (let wy = 64 - h + 4; wy < 60; wy += 6) for (let wx = x + 3; wx < x + w - 5; wx += 5) {
          if (rnd(wx, wy, layer) > 0.45) P(wx % 256, wy, shade(col, 0.28));
        }
        x += w;
      }
    });
  },
};

// ---------- london: terraced houses, clock tower, chimneys ----------
BG.london = {
  far(a, S) {
    const { RW, PW, DW, LW, ridge, wins } = a;
    const c = shade(S.fc2, -0.22), c2 = shade(S.fc, -0.08);
    // low rooftops with chimneys
    for (let x = 0; x < 256; x += 16) {
      const top = 82 - Math.floor(S.r(x, 1) * 4);
      RW(x, top, 16, 96 - top, c2);
      for (let k = 0; k < 4; k++) RW(x + k * 4 + ((x / 16) % 2), top - 2 - (k % 2), 2, 3, c2);
    }
    // clock tower at x=190
    const tx = 190;
    RW(tx - 5, 24, 11, 72, c);                 // shaft
    RW(tx - 7, 14, 15, 18, c);                 // clock stage
    RW(tx - 8, 12, 17, 2, shade(c, -0.1));
    for (let i = 0; i < 12; i++) RW(tx - 6 + i / 2 + 0, 12 - i, 13 - i, 1, c); // spire
    for (let i = 0; i < 10; i++) RW(tx - 1, 0, 1, 1, c);
    RW(tx - 7, 12, 1, -4, c);
    RW(tx - 8, 8, 2, 4, c); RW(tx + 7, 8, 2, 4, c); // corner pinnacles
    DW(tx, 22, 5, S.lit); DW(tx, 22, 4, mix(S.lit, '#ffffff', 0.4)); // clock face
    PW(tx, 19, shade(c, -0.5)); PW(tx, 20, shade(c, -0.5)); PW(tx, 22, shade(c, -0.5)); PW(tx + 1, 22, shade(c, -0.5)); PW(tx, 23, shade(c, -0.5));
    for (let y = 36; y < 80; y += 8) { RW(tx - 2, y, 1, 4, shade(c, -0.25)); RW(tx + 2, y, 1, 4, shade(c, -0.25)); }
    // dome with lantern at x=70
    const dx = 70;
    for (let y = 0; y < 16; y++) {
      const half = Math.round(15 * Math.sqrt(1 - Math.pow((15 - y) / 15, 2)));
      RW(dx - half, 52 + y - 14, half * 2 + 1, 1, c);
    }
    RW(dx - 16, 54, 33, 42, c); RW(dx - 2, 32, 5, 8, c); RW(dx, 28, 1, 4, c); RW(dx - 1, 26, 3, 2, c); // ball finial (no cross)
    RW(dx - 14, 58, 29, 1, shade(c, 0.12));
    for (let x = dx - 12; x < dx + 12; x += 4) RW(x, 62, 2, 10, shade(c, -0.18));
  },
  near(a, S) {
    const { RW, PW, DW } = a;
    const hb = mix(S.T.brick, S.n2, 0.5);
    for (let i = 0; i < 16; i++) {
      const x = i * 16;
      const body = i % 2 ? hb : shade(hb, -0.12);
      const roofH = 6;
      const bt = 64 - (26 + (i % 3) * 3);
      RW(x, bt, 15, 64 - bt, body);
      RW(x + 15, bt, 1, 64 - bt, shade(body, -0.35)); // party wall
      // slate roof (pitched)
      for (let r = 0; r < roofH; r++) RW(x + r, bt - 1 - r, 15 - r * 2, 1, shade(body, -0.4 + r * 0.03));
      // chimney stack and pots
      RW(x + 10, bt - 9, 3, 7, shade(body, -0.2)); RW(x + 9, bt - 10, 5, 1, shade(body, -0.4));
      RW(x + 10, bt - 12, 1, 2, shade(body, -0.45)); RW(x + 12, bt - 12, 1, 2, shade(body, -0.45));
      // sash windows: two floors
      for (let f = 0; f < 2; f++) {
        const wy = bt + 3 + f * 9;
        [2, 9].forEach((ox) => {
          RW(x + ox, wy, 4, 6, shade(body, -0.4));
          RW(x + ox + 1, wy + 1, 2, 4, S.r(i, f + ox) > 0.5 ? S.lit : shade(S.lit, -0.25));
          RW(x + ox + 1, wy + 3, 2, 1, shade(body, -0.4));
          RW(x + ox - 1, wy + 6, 6, 1, shade(body, 0.25)); // sill
        });
      }
      RW(x + 6, 64 - 9, 3, 9, shade(S.T.accent, -0.2)); PW(x + 6, 64 - 10, shade(S.T.accent, -0.2)); // red door
    }
  },
};

// ---------- minneapolis: low gray buildings, bare trees, snowy roofs ----------
BG.minneapolis = {
  far(a, S) {
    const { RW, PW, wins, LW } = a;
    const snow = mix(S.fc, '#ffffff', 0.75);
    const bw = [22, 18, 26, 16, 24, 20, 30, 18, 22, 20, 40];
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 20 + Math.floor(S.r(i, 6) * 14);
      const c = i % 2 ? S.fc : S.fc2;
      RW(x, 96 - hh, w - 1, hh, c); RW(x, 96 - hh - 1, w - 1, 2, snow);
      wins(x, w, 96 - hh + 4, 94, shade(c, 0.18), 4, 6, 0.5, 8);
      x += w;
    });
    // tall tower with stepped crown and snow caps
    const tx = 150, c = S.fc2;
    RW(tx - 8, 30, 17, 66, c); RW(tx - 6, 20, 13, 10, c); RW(tx - 3, 12, 7, 8, c); RW(tx, 4, 1, 8, c);
    RW(tx - 8, 29, 17, 2, snow); RW(tx - 6, 19, 13, 2, snow); RW(tx - 3, 11, 7, 2, snow);
    for (let y = 34; y < 90; y += 5) for (let k = -6; k < 7; k += 3) if (S.r(k, y, 2) > 0.4) RW(tx + k, y, 1, 2, shade(c, 0.2));
    // bare trees along the bottom
    for (let i = 0; i < 14; i++) bareTree(a, S, 8 + i * 18 + Math.floor(S.r(i, 3) * 6), 96, 12 + Math.floor(S.r(i, 4) * 8), shade(S.fc2, -0.2));
  },
  near(a, S) {
    const { RW, PW, wins, LW } = a;
    const snow = '#f4f8fc';
    const bw = [28, 20, 24, 30, 22, 26, 18, 24, 22, 22, 20];
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 18 + Math.floor(S.r(i, 7) * 18);
      const c = i % 2 ? S.n1 : S.n2;
      RW(x, 64 - hh, w, hh, c);
      RW(x - 1, 64 - hh - 2, w + 2, 2, snow); RW(x, 64 - hh, w, 1, mix(c, '#9ab4d0', 0.5));
      // snow drips and lumps
      for (let k = 2; k < w - 2; k += 5) RW(x + k, 64 - hh - 3, 3, 1, snow);
      wins(x, w, 64 - hh + 4, 60, mix(c, '#cfe6ff', 0.5), 5, 6, 0.4, 9, 2, 3);
      x += w;
    });
    for (let i = 0; i < 7; i++) bareTree(a, S, 10 + i * 38 + Math.floor(S.r(i, 5) * 10), 64, 16 + Math.floor(S.r(i, 6) * 8), shade(S.n2, -0.55));
  },
};

// ---------- lake: night shoreline, trees, reflections ----------
BG.lake = {
  far(a, S) {
    const { RW, PW, wins, ridge } = a;
    const wc = mix(S.sk, S.n2, 0.3);
    // skyline on the far shore
    const bw = [18, 14, 22, 16, 26, 14, 20, 24, 18, 16, 20, 14, 14, 20];
    let sum = bw.reduce((p, c) => p + c, 0);
    bw[bw.length - 1] += 256 - sum;
    let x = 0;
    const tops = new Array(256).fill(64);
    bw.forEach((w, i) => {
      const hh = 12 + Math.floor(S.r(i, 8) * 30);
      const c = i % 2 ? S.fc : S.fc2;
      RW(x, 64 - hh, w - 1, hh, shade(c, -0.2));
      for (let k = 0; k < w - 1; k++) tops[(x + k) % 256] = 64 - hh;
      wins(x, w, 64 - hh + 3, 62, S.lit, 3, 4, 0.5, 10);
      x += w;
    });
    // water with broken reflections
    RW(0, 64, 256, 32, wc);
    for (let xx = 0; xx < 256; xx++) {
      const hgt = 64 - tops[xx];
      for (let y = 65; y < 65 + hgt * 0.9 && y < 96; y++) {
        if ((y + xx) % 3 !== 0) PW(xx, y, S.r(xx, y, 11) > 0.55 ? mix(S.lit, wc, 0.55) : shade(wc, -0.25));
      }
    }
    for (let i = 0; i < 40; i++) {
      const xx = Math.floor(S.r(i, 1, 12) * 256), yy = 66 + Math.floor(S.r(i, 2, 12) * 28);
      RW(xx, yy, 3 + (i % 5), 1, shade(wc, 0.25));
    }
    RW(0, 64, 256, 1, shade(wc, 0.3));
  },
  near(a, S) {
    const { RW, PW } = a;
    const wc = mix(S.sk, S.n2, 0.45), tc = shade(S.n2, -0.45);
    const top = new Array(256).fill(36);
    const trees = [];
    for (let c = 6; c < 256; c += 15 + Math.floor(S.r(c, 1, 13) * 8)) trees.push({ c, h: 14 + Math.floor(S.r(c, 2, 13) * 14), pine: S.r(c, 3, 13) > 0.5, w: 7 });
    trees.forEach((t) => {
      for (let dx = -t.w; dx <= t.w; dx++) {
        const x = ((t.c + dx) % 256 + 256) % 256;
        const f = t.pine ? 1 - Math.abs(dx) / t.w : Math.sqrt(Math.max(0, 1 - Math.pow(dx / t.w, 2)));
        const y = 36 - Math.round(t.h * f * (t.pine ? 1 : 0.7)) - (t.pine ? 0 : 3);
        if (y < top[x]) top[x] = y;
      }
    });
    // pine tiers: notch the sides
    for (let x = 0; x < 256; x++) {
      RW(x, top[x], 1, 37 - top[x], tc);
      if (top[x] < 34 && (x * 3 + top[x]) % 5 === 0) PW(x, top[x] + 3, shade(tc, 0.08));
    }
    // lake
    RW(0, 37, 256, 27, wc);
    RW(0, 37, 256, 1, shade(wc, -0.3));
    for (let x = 0; x < 256; x++) {
      const hgt = 36 - top[x];
      for (let y = 38; y < 38 + hgt * 0.8 && y < 64; y++) {
        if ((y + x) % 3 !== 0) PW(x, y, shade(wc, -0.3));
      }
    }
    // moon/lamp glitter column
    for (let y = 40; y < 64; y += 2) {
      const wdt = 2 + Math.floor(S.r(y, 1, 14) * 6) + Math.floor((y - 40) / 6);
      RW(196 - wdt / 2, y, wdt, 1, mix(S.T.accent, wc, 0.35));
    }
    for (let i = 0; i < 40; i++) {
      const xx = Math.floor(S.r(i, 1, 15) * 256), yy = 40 + Math.floor(S.r(i, 2, 15) * 22);
      RW(xx, yy, 3 + (i % 4), 1, shade(wc, 0.22));
    }
  },
};

// ---------- chicago: tall towers, elevated train trestle ----------
BG.chicago = {
  far(a, S) {
    const { RW, PW, wins } = a;
    const bw = [20, 16, 22, 18, 24, 14, 22, 20, 26, 22, 18, 14, 20];
    const sum = bw.reduce((p, c) => p + c, 0); bw[bw.length - 1] += 256 - sum;
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 30 + Math.floor(S.r(i, 3, 2) * 36);
      const c = i % 2 ? S.fc : S.fc2;
      RW(x, 96 - hh, w - 1, hh, c);
      for (let xx = x + 2; xx < x + w - 2; xx += 3) RW(xx, 96 - hh + 3, 1, hh - 6, shade(c, 0.1));
      if (i % 4 === 1) RW(x + w / 2, 96 - hh - 7, 1, 7, c);
      x += w;
    });
    // tapered tower with twin antennas
    const hx = 50, c = shade(S.fc2, -0.1);
    for (let y = 0; y < 82; y++) { const half = Math.round(7 + (y / 82) * 4); RW(hx - half, 14 + y, half * 2, 1, c); }
    RW(hx - 6, 7, 1, 7, c); RW(hx + 5, 7, 1, 7, c);
    for (let y = 18; y < 90; y += 6) RW(hx - 8, y, 16, 1, shade(c, 0.12));
    // bundled-tube tower
    const wx = 150, c3 = shade(S.fc2, -0.06);
    [[-8, 56], [-2, 76], [4, 90], [10, 62]].forEach(([dx, hh]) => RW(wx + dx, 96 - hh, 6, hh, c3));
    RW(wx - 6, 96 - 90 - 7, 1, 7, c3); RW(wx + 8, 96 - 90 - 7, 1, 7, c3);
    for (let y = 10; y < 90; y += 6) RW(wx - 8, y, 24, 1, shade(c3, 0.14));
  },
  near(a, S) {
    const { RW, PW, LW } = a;
    const bw = [26, 20, 30, 22, 28, 18, 24, 26, 22, 20, 20];
    const hs = [44, 56, 60, 38, 52, 34, 58, 46, 62, 40, 50];
    let x = 0;
    bw.forEach((w, i) => {
      const c = i % 2 ? S.n1 : S.n2, hh = hs[i];
      RW(x, 64 - hh, w - 1, hh, c);
      RW(x + 2, 64 - hh - 5, w - 5, 5, c);
      if (hh > 55) { RW(x + 5, 64 - hh - 10, w - 11, 5, c); RW(x + w / 2 - 1, 64 - hh - 17, 1, 7, c); }
      for (let xx = x + 2; xx < x + w - 2; xx += 3) RW(xx, 64 - hh + 2, 1, hh - 4, shade(c, i % 2 ? 0.18 : 0.22));
      RW(x, 64 - hh, w - 1, 1, shade(c, 0.3));
      x += w;
    });
    // elevated train trestle
    const steel = shade(S.n2, -0.55), rail = shade(S.n2, -0.35);
    RW(0, 44, 256, 3, steel); RW(0, 43, 256, 1, rail);
    for (let px = 0; px < 256; px += 16) {
      RW(px, 47, 2, 17, steel);
      LW(px + 2, 48, px + 15, 62, steel); LW(px + 15, 48, px + 2, 62, steel);
    }
    // train
    for (let c = 0; c < 2; c++) {
      const tx = 60 + c * 31, tc = c ? shade(S.T.accent, -0.1) : S.T.accent;
      RW(tx, 33, 29, 10, tc); RW(tx, 33, 29, 1, shade(tc, 0.3)); RW(tx, 40, 29, 1, shade(tc, -0.3));
      for (let k = 0; k < 4; k++) RW(tx + 2 + k * 7, 35, 5, 4, mix(S.sk, '#ffffff', 0.4));
    }
    PW(60, 38, S.lit); PW(60, 39, S.lit);
  },
};

// ---------- chinatown: dense tenements, fire escapes, lantern lines ----------
BG.chinatown = {
  far(a, S) {
    const { RW, PW, DW, LW } = a;
    // The Brooklyn and Manhattan bridges over the East River, hazy behind the tenements.
    const haze = mix(S.fc, S.sk, 0.45), hi = mix(haze, S.sk, 0.4), gap = shade(haze, -0.4);
    const DECK = 66;
    // Main cable: from tower top to tower top with a sag, and down to the deck past each tower.
    const cables = (t0, t1, top, ends) => {
      const span = t1 - t0;
      for (let k = 0; k <= span; k++) {
        const y = Math.round(top + (DECK - 4 - top) * 0.85 * Math.sin(Math.PI * k / span));
        PW(t0 + k, y, haze);
        if (k % 4 === 2 && y < DECK) RW(t0 + k, y + 1, 1, DECK - y - 1, hi); // suspenders
      }
      for (const [tx, dir] of [[t0, -1], [t1, 1]]) for (let k = 0; k <= ends; k++) PW(tx + dir * k, Math.round(top + (DECK - top) * (k / ends) ** 1.4), haze);
      RW(t0 - ends, DECK, span + ends * 2, 2, haze); RW(t0 - ends, DECK, span + ends * 2, 1, hi);
    };
    // Brooklyn Bridge: granite towers with two pointed Gothic arches each.
    const stone = (tx) => {
      RW(tx - 7, 18, 15, DECK - 18 + 6, haze); RW(tx - 8, 18, 17, 2, hi); RW(tx - 7, 22, 15, 1, hi);
      for (const ax of [tx - 5, tx + 2]) {
        RW(ax, 30, 4, 18, gap); RW(ax + 1, 28, 2, 2, gap); // tall opening with a pointed top
      }
    };
    // Manhattan Bridge: steel towers, X-braced, with little finials on top.
    const steel = (tx) => {
      for (const lx of [tx - 5, tx + 4]) { RW(lx, 14, 2, DECK - 14 + 6, haze); PW(lx, 12, hi); PW(lx + 1, 13, haze); RW(lx, 11, 2, 1, haze); }
      RW(tx - 5, 14, 11, 2, haze);
      for (let y = 20; y < DECK - 4; y += 10) { LW(tx - 3, y, tx + 3, y + 8, haze); LW(tx + 3, y, tx - 3, y + 8, haze); RW(tx - 5, y, 11, 1, haze); }
    };
    cables(40, 104, 20, 30); stone(40); stone(104);
    cables(164, 226, 16, 30); steel(164); steel(226);
    const bw = [20, 16, 22, 18, 24, 16, 20, 22, 18, 24, 20, 16, 20];
    const sum = bw.reduce((p, c) => p + c, 0); bw[bw.length - 1] += 256 - sum;
    let x = 0;
    bw.forEach((w, i) => {
      // Lower than they used to be so the bridge towers show above the rooftops.
      const hh = 26 + Math.floor(S.r(i, 4, 3) * 26);
      const c = [S.fc, S.fc2, mix(S.fc, S.fc2, 0.5)][i % 3];
      RW(x, 96 - hh, w - 1, hh, c); RW(x, 96 - hh, w - 1, 1, shade(c, 0.2));
      for (let wy = 96 - hh + 4; wy < 92; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        RW(wx, wy, 2, 2, S.r(wx, wy, 5) > 0.55 ? '#ffc94a' : shade(c, -0.25));
      }
      if (i % 4 === 2) { // rooftop water tank
        const tx = x + w / 2 - 3, ty = 96 - hh;
        RW(tx, ty - 8, 7, 6, shade(c, -0.3)); RW(tx + 1, ty - 11, 5, 3, shade(c, -0.35)); RW(tx + 1, ty - 2, 1, 2, shade(c, -0.4)); RW(tx + 5, ty - 2, 1, 2, shade(c, -0.4));
      }
      x += w;
    });
    for (let xx = 0; xx < 256; xx += 32) {
      for (let k = 0; k < 32; k++) PW(xx + k, 60 + Math.round(3 * Math.sin(Math.PI * k / 32)), shade(S.fc2, -0.4));
      for (let k = 4; k < 32; k += 8) RW(xx + k, 63 + Math.round(3 * Math.sin(Math.PI * k / 32)) - 3, 2, 2, k % 16 === 4 ? '#ff4a3a' : '#ffcf3a');
    }
  },
  near(a, S) {
    const { RW, PW, DW, LW } = a;
    const bw = [22, 18, 24, 20, 22, 18, 26, 20, 22, 20, 24, 20];
    const sum = bw.reduce((p, c) => p + c, 0); bw[bw.length - 1] += 256 - sum;
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 40 + Math.floor(S.r(i, 5, 3) * 18);
      const c = [S.n1, S.n2, mix(S.n1, S.n2, 0.5)][i % 3];
      const ink = shade(c, -0.55);
      RW(x, 64 - hh, w - 1, hh, c); RW(x, 64 - hh, w - 1, 2, shade(c, -0.3)); RW(x, 64 - hh + 2, w - 1, 1, shade(c, 0.2));
      for (let wy = 64 - hh + 5; wy < 60; wy += 7) for (let wx = x + 2; wx < x + w - 4; wx += 5) {
        RW(wx, wy, 3, 4, S.r(wx, wy, 6) > 0.55 ? '#ffd45a' : shade(c, -0.5));
      }
      // fire escape: platforms + zigzag stairs
      if (i % 2 === 0) {
        const fx = x + 2, fw = w - 5;
        for (let py = 64 - hh + 9, k = 0; py < 56; py += 14, k++) {
          RW(fx, py, fw, 1, ink); RW(fx, py - 2, 1, 3, ink); RW(fx + fw - 1, py - 2, 1, 3, ink);
          LW(k % 2 ? fx + 1 : fx + fw - 2, py + 1, k % 2 ? fx + fw - 2 : fx + 1, py + 13, ink);
        }
      }
      x += w;
    });
    // strung lanterns on catenary lines
    [[22, 0], [36, 16]].forEach(([y0, off]) => {
      for (let xx = 0; xx < 256; xx += 32) for (let k = 0; k < 32; k++) PW(xx + k, y0 + Math.round(5 * Math.sin(Math.PI * k / 32)), '#2a1018');
      for (let xx = 0; xx < 256; xx += (off ? 16 : 8)) {
        const px = xx + off % 8, k = (px % 32);
        const ly = y0 + Math.round(5 * Math.sin(Math.PI * k / 32)) + 1;
        const red = (xx / 8) % 2 === 0;
        RW(px - 1, ly, 3, 1, '#ffcf3a'); RW(px - 2, ly + 1, 5, 4, red ? '#e8302f' : '#f2a02a');
        RW(px - 1, ly + 2, 1, 1, red ? '#ff8a6a' : '#ffe27a'); RW(px - 1, ly + 5, 3, 1, '#ffcf3a'); PW(px, ly + 6, '#ffcf3a');
      }
    });
  },
};

// ---------- jungle: palms and vines ----------
BG.jungle = {
  far(a, S) {
    const { RW, PW, DW, ridge } = a;
    const mist = mix(S.sk, S.fc, 0.5);
    ridge((x) => 54 - 12 * Math.sin(TAU * 2 * x / 256 + 1 + S.sd) - 4 * Math.sin(TAU * 6 * x / 256), mist, shade(mist, 0.2));
    // canopy of overlapping crowns
    for (let c = 0; c < 256; c += 9) {
      const y = 62 + Math.round(5 * Math.sin(c * 0.37 + S.sd) + S.r(c, 1, 3) * 6);
      DW(c, y, 7 + (c % 3), S.fc);
    }
    RW(0, 72, 256, 24, S.fc);
    for (let c = 4; c < 256; c += 9) DW(c, 70 + Math.round(S.r(c, 2, 3) * 3), 5, shade(S.fc, 0.1));
    // emergent crowns and palms
    for (let i = 0; i < 6; i++) {
      const cx = 14 + i * 42 + Math.floor(S.r(i, 4, 3) * 14), ty = 36 + Math.floor(S.r(i, 5, 3) * 14);
      RW(cx, ty, 2, 96 - ty, shade(S.fc, -0.1));
      if (i % 2) DW(cx, ty, 9, shade(S.fc, -0.05)); else palm(a, S, cx, 80, ty, 3, S.fc2, shade(S.fc2, -0.12), 12);
    }
  },
  near(a, S) {
    const { RW, PW, DW, LW } = a;
    // low bushes
    for (let c = 0; c < 256; c += 10) DW(c + 3, 58 + Math.floor(S.r(c, 1, 4) * 4), 6 + (c % 3), S.n2);
    RW(0, 60, 256, 4, S.n2);
    // palms
    for (let i = 0; i < 5; i++) {
      const cx = 12 + i * 50 + Math.floor(S.r(i, 2, 4) * 20);
      palm(a, S, cx, 62, 14 + Math.floor(S.r(i, 3, 4) * 14), (i % 2 ? 5 : -5) + Math.floor(S.r(i, 4, 4) * 4), S.n1, shade(S.n1, -0.2), 13);
    }
    // hanging vines
    for (let i = 0; i < 18; i++) {
      const vx = Math.floor(S.r(i, 5, 4) * 256), vy = 22 + Math.floor(S.r(i, 6, 4) * 12), len = 8 + Math.floor(S.r(i, 7, 4) * 14);
      for (let k = 0; k < len; k++) PW(vx + Math.round(Math.sin(k * 0.6 + i)), vy + k, shade(S.n2, -0.1));
    }
    // flowers
    for (let i = 0; i < 26; i++) {
      const fx = Math.floor(S.r(i, 8, 4) * 256), fy = 52 + Math.floor(S.r(i, 9, 4) * 10);
      PW(fx, fy, S.T.accent); PW(fx + 1, fy, shade(S.T.accent, 0.3));
    }
  },
};

// ---------- sea: ocean horizon, volcanic rocks ----------
BG.sea = {
  far(a, S) {
    const { RW, PW, ridge } = a;
    const wc = mix(S.sk, S.n1, 0.55);
    // volcano island at x=80
    const vx = 80, rc = shade(S.n2, -0.3);
    for (let dx = -50; dx <= 50; dx++) {
      const y = 62 - Math.round((1 - Math.abs(dx) / 50) * 32) + (Math.abs(dx) < 6 ? 3 - Math.abs(dx) / 2 : 0) + Math.round(S.r(dx, 1, 5) * 2);
      RW(vx + dx, y, 1, 70 - y, rc);
      if (dx < 0) PW(vx + dx, y, shade(rc, 0.22));
    }
    // small islet
    for (let dx = -18; dx <= 18; dx++) {
      const y = 66 - Math.round((1 - Math.abs(dx) / 18) * 6) + Math.round(S.r(dx, 2, 5) * 2);
      RW(190 + dx, y, 1, 4, rc);
    }
    // sea
    RW(0, 66, 256, 30, wc); RW(0, 66, 256, 1, shade(wc, 0.35));
    for (let y = 68; y < 96; y += 3) for (let i = 0; i < 8; i++) {
      const x = Math.floor(S.r(i, y, 6) * 256);
      RW(x, y, 4 + (y % 5), 1, shade(wc, 0.2 + (y - 68) / 150));
    }
    RW(0, 78, 256, 18, mix(wc, S.n2, 0.25));
    for (let y = 80; y < 96; y += 3) for (let i = 0; i < 8; i++) RW(Math.floor(S.r(i, y, 7) * 256), y, 5, 1, shade(wc, 0.25));
  },
  near(a, S) {
    const { RW, PW } = a;
    const wc = mix(S.sk, S.n1, 0.8), wc2 = S.n1, wc3 = S.n2;
    RW(0, 18, 256, 14, wc); RW(0, 32, 256, 16, wc2); RW(0, 48, 256, 16, wc3);
    RW(0, 18, 256, 1, shade(wc, 0.4));
    for (let y = 20; y < 64; y += 3) for (let i = 0; i < 7; i++) {
      const x = Math.floor(S.r(i, y, 8) * 256);
      RW(x, y, 5 + (y % 4), 1, shade(y < 32 ? wc : y < 48 ? wc2 : wc3, 0.3));
    }
    // black lava rocks
    const rock = '#26232c', rockHi = '#4a4654';
    [[30, 26, 16], [88, 34, 20], [150, 22, 14], [208, 30, 18], [248, 20, 12]].forEach(([c, hh, wd], k) => {
      for (let dx = -wd; dx <= wd; dx++) {
        const f = Math.pow(1 - Math.abs(dx) / wd, 0.8);
        const y = 60 - Math.round(hh * f) - Math.round(S.r(dx + c, k, 9) * 3);
        RW(c + dx, y, 1, 64 - y, rock);
        if (dx < -wd / 4) PW(c + dx, y, rockHi); else if (S.r(dx, k, 10) > 0.8) PW(c + dx, y + 1, rockHi);
      }
      RW(c - wd - 2, 60, wd * 2 + 5, 1, '#e8f6f8'); RW(c - wd, 61, wd * 2 + 1, 1, shade('#e8f6f8', -0.15));
    });
  },
};

// ---------- houses: colorful stacked hillside (Valparaiso) ----------
BG.houses = {
  far(a, S) {
    const { RW, PW, ridge } = a;
    ridge((x) => 54 - 10 * Math.sin(TAU * 2 * x / 256 + 0.4) - 4 * Math.sin(TAU * 5 * x / 256), mix(S.sk, S.n1, 0.4));
    ridge((x) => 70 - 7 * Math.sin(TAU * 3 * x / 256 + 2), S.fc);
    const pal = ['#ff8fa3', '#ffd166', '#6ec6ca', '#9ad66f', '#ff9f5a', '#8fb4ff', '#e58fff', '#f7f0a0'];
    for (let band = 0; band < 3; band++) for (let x = 0; x < 256; x += 6) {
      if (S.r(x, band, 12) < 0.3) continue;
      const yTop = band === 0 ? 54 - 10 * Math.sin(TAU * 2 * x / 256 + 0.4) - 4 * Math.sin(TAU * 5 * x / 256) + 4 : 72 + band * 6;
      RW(x, yTop + band * 4, 4, 4, mix(pal[(x / 6 + band) % 8 | 0], S.sk, 0.45));
    }
  },
  near(a, S) {
    const { RW, PW, ridge } = a;
    const pal = ['#ff7a96', '#ffd24a', '#4cc0c8', '#8ed05a', '#ff8a3c', '#74a0ff', '#d878ff', '#f4ec78', '#ff5a5a', '#58d8a0'];
    ridge((x) => 22 + 5 * Math.sin(TAU * 2 * x / 256 + 1) + 2 * Math.sin(TAU * 7 * x / 256), S.n2, shade(S.n2, 0.2));
    [[34, 0.55], [49, 0.25], [64, 0]].forEach(([base, dim], row) => {
      let x = (row * 7) % 11;
      let i = 0;
      const ws = [];
      let acc = 0;
      while (acc < 256) { const w = 10 + Math.floor(S.r(i + row * 40, 1, 21) * 7); ws.push(w); acc += w; i++; }
      ws[ws.length - 1] -= acc - 256;
      if (ws[ws.length - 1] < 6) ws[ws.length - 2] += ws.pop();
      ws.forEach((w, k) => {
        const hh = 11 + Math.floor(S.r(k, row, 22) * 6);
        const c = mix(pal[Math.floor(S.r(k, row, 23) * pal.length)], S.sk, dim * 0.5);
        RW(x, base - hh, w - 1, hh, c);
        RW(x, base - hh, w - 1, 1, shade(c, 0.3)); RW(x + w - 2, base - hh, 1, hh, shade(c, -0.18));
        // corrugated roof edge
        RW(x - 1, base - hh - 1, w + 1, 2, shade(c, -0.35));
        // windows with frames
        for (let wxx = x + 2; wxx < x + w - 4; wxx += 5) {
          RW(wxx, base - hh + 3, 3, 4, '#fffaf0'); RW(wxx + 1, base - hh + 4, 2, 3, S.r(wxx, row, 24) > 0.5 ? '#ffd877' : '#3a4a6a');
        }
        if (hh > 13) RW(x + 2, base - 5, 3, 5, shade(c, -0.4));
        x += w;
      });
    });
  },
};

// ---------- mountains: snowy Andes, vineyard rows ----------
BG.mountains = {
  far(a, S) {
    const { RW, PW } = a;
    const pk = [[0, 78], [22, 52], [40, 66], [64, 88], [88, 56], [112, 70], [140, 90], [162, 60], [190, 76], [214, 54], [236, 66], [256, 78]];
    const hgt = (x) => {
      for (let i = 0; i < pk.length - 1; i++) {
        if (x >= pk[i][0] && x <= pk[i + 1][0]) {
          const t = (x - pk[i][0]) / (pk[i + 1][0] - pk[i][0]);
          const k = Math.floor(x / 5), f = (x % 5) / 5;
          return pk[i][1] + (pk[i + 1][1] - pk[i][1]) * t + (S.r(k, 1, 31) * (1 - f) + S.r(k + 1, 1, 31) * f) * 7 - 3;
        }
      }
      return 60;
    };
    const rock = mix(S.sk, S.n2, 0.55), shd = shade(rock, -0.25);
    let prev = hgt(0);
    for (let x = 0; x < 256; x++) {
      const hh = Math.round(hgt(x)), y = 96 - hh;
      const lit = hgt(x + 2) >= hgt(x - 2);
      RW(x, y, 1, hh, lit ? rock : shd);
      const snowY = 96 - 54 + Math.round((S.r(Math.floor(x / 3), 2, 31)) * 6);
      for (let yy = y; yy < Math.min(snowY, 96); yy++) PW(x, yy, lit ? '#ffffff' : '#c4d4ec');
      prev = hh;
    }
    // foothills
    for (let x = 0; x < 256; x++) RW(x, 86 - Math.round(4 * Math.sin(TAU * 3 * x / 256 + 1)), 1, 12, mix(S.n1, S.sk, 0.3));
  },
  near(a, S) {
    const { RW, PW, ridge } = a;
    const yf = (x) => 28 + 7 * Math.sin(TAU * 2 * x / 256 + 0.8) + 3 * Math.sin(TAU * 5 * x / 256);
    const g = mix(S.n1, '#4a7a58', 0.45), g2 = shade(g, -0.2);
    ridge(yf, g, shade(g, 0.25));
    for (let off = 5; off < 40; off += 4) for (let x = 0; x < 256; x++) {
      const y = Math.round(yf(x) + off + off * 0.12 * Math.sin(TAU * 2 * x / 256));
      if (y < 64 && x % 5 !== 4) PW(x, y, off % 8 === 1 ? g2 : shade(g, -0.1));
    }
    // poplars and a bodega
    [20, 58, 96, 172, 214].forEach((px, k) => {
      const y = Math.round(yf(px));
      RW(px, y - 10, 2, 11, shade(S.n2, -0.35)); RW(px - 1, y - 8, 4, 7, shade(S.n2, -0.35));
    });
    const bx = 130, by = Math.round(yf(bx)) + 1;
    RW(bx, by - 8, 14, 9, '#d8d0c4'); RW(bx - 1, by - 11, 16, 3, S.T.accent); RW(bx + 2, by - 11 + 3, 3, 3, shade(S.T.accent, -0.4));
    RW(bx + 6, by - 4, 3, 5, shade(S.n2, -0.5));
  },
};

// ---------- beach: palms, sand, big rock mountain ----------
BG.beach = {
  far(a, S) {
    const { RW, PW, ridge } = a;
    const rock = mix(S.sk, S.n2, 0.6);
    // small hill and big granite dome
    [[40, 34, 38], [150, 78, 40]].forEach(([c, hh, wd]) => {
      for (let dx = -wd; dx <= wd; dx++) {
        const f = Math.pow(1 - Math.pow(Math.abs(dx) / wd, 2.2), 0.55);
        const y = 86 - Math.round(hh * f);
        RW(c + dx, y, 1, 90 - y, dx < wd * 0.5 ? rock : shade(rock, -0.2));
        if (dx < -wd * 0.3 && f > 0.2) PW(c + dx, y, shade(rock, 0.3));
        if (S.r(dx + c, 1, 41) > 0.82 && f > 0.3) RW(c + dx, y + 3, 1, Math.floor(hh * f * 0.5), shade(rock, -0.22));
      }
    });
    // green scrub at the base
    for (let x = 0; x < 256; x++) RW(x, 82 + Math.round(2 * Math.sin(x * 0.5)), 1, 6, mix(S.n1, '#2a6a4a', 0.5));
    // sea strip
    const wc = mix(S.sk, '#38c0c8', 0.55);
    RW(0, 88, 256, 8, wc); RW(0, 88, 256, 1, shade(wc, 0.4));
    for (let i = 0; i < 30; i++) RW(Math.floor(S.r(i, 1, 42) * 256), 90 + (i % 6), 5, 1, shade(wc, 0.3));
  },
  near(a, S) {
    const { RW, PW } = a;
    const sea = mix(S.sk, '#2cb8c0', 0.6), sand = S.T.groundTop;
    RW(0, 30, 256, 18, sea); RW(0, 30, 256, 1, shade(sea, 0.35));
    for (let y = 32; y < 46; y += 3) for (let i = 0; i < 6; i++) RW(Math.floor(S.r(i, y, 43) * 256), y, 6, 1, shade(sea, 0.3));
    RW(0, 48, 256, 16, sand);
    for (let x = 0; x < 256; x++) {
      const fy = 46 + Math.round(1.5 * Math.sin(TAU * 8 * x / 256));
      RW(x, fy, 1, 3, '#fffaf0'); PW(x, fy + 3, mix(sand, '#8a6a4a', 0.2));
    }
    // umbrellas
    [[40, S.T.accent], [92, '#ff5a5a'], [204, '#ffd24a']].forEach(([ux, uc]) => {
      RW(ux, 52, 1, 9, '#6a4a3a');
      RW(ux - 5, 49, 11, 1, uc); RW(ux - 4, 48, 9, 1, uc); RW(ux - 2, 47, 5, 1, uc);
      RW(ux - 3, 49, 2, 1, '#fffaf0'); RW(ux + 1, 48, 2, 1, '#fffaf0');
    });
    for (let i = 0; i < 6; i++) palm(a, S, 14 + i * 44 + Math.floor(S.r(i, 1, 44) * 12), 64, 20 + Math.floor(S.r(i, 2, 44) * 12), i % 2 ? 6 : -6, shade(S.n2, -0.25), shade(S.n2, -0.4), 12);
  },
};

// ---------- loft: brick factory lofts, big windows, water tower ----------
BG.loft = {
  far(a, S) {
    const { RW, PW, LW, wins } = a;
    const bw = [34, 28, 38, 30, 36, 30, 30, 30];
    let x = 0;
    bw.forEach((w, i) => {
      const hh = 34 + Math.floor(S.r(i, 6, 3) * 18);
      const c = i % 2 ? S.fc : S.fc2;
      RW(x, 96 - hh, w - 1, hh, c);
      for (let wy = 96 - hh + 4; wy < 90; wy += 8) for (let wxx = x + 2; wxx < x + w - 5; wxx += 6) RW(wxx, wy, 4, 5, shade(c, 0.16));
      if (i === 2) { // water tower
        const tx = x + 12, ty = 96 - hh;
        RW(tx, ty - 5, 1, 5, shade(c, -0.4)); RW(tx + 7, ty - 5, 1, 5, shade(c, -0.4));
        RW(tx - 1, ty - 14, 10, 9, shade(c, -0.3)); for (let k = 0; k < 4; k++) RW(tx + 1 + k, ty - 18 + k, 6 - k * 2, 1, shade(c, -0.35));
      }
      x += w;
    });
    // suspension bridge towers with cables, drawn in front of far lofts
    const bc = shade(S.fc2, -0.25);
    [64, 192].forEach((tx) => {
      RW(tx - 8, 28, 4, 56, bc); RW(tx + 5, 28, 4, 56, bc);
      RW(tx - 8, 28, 17, 4, bc); RW(tx - 8, 46, 17, 3, bc);
      for (let i = 0; i < 6; i++) { RW(tx - 4 + 0, 32 + i, 9 - 0, 1, bc); }
      RW(tx - 4, 32, 9, 14, bc);
      // arch cutout approximated by lit gap
      RW(tx - 2, 36, 5, 10, mix(S.sk, S.fc, 0.5));
      RW(tx - 1, 34, 3, 2, mix(S.sk, S.fc, 0.5));
    });
    for (let seg = 0; seg < 2; seg++) {
      const x0 = seg ? 192 : 64, x1 = seg ? 64 + 256 : 192;
      for (let k = 0; k <= 128; k++) {
        const t = k / 128;
        PW(x0 + k, 30 + 40 * Math.pow(Math.sin(Math.PI * t), 1.2) * 0.8, bc);
      }
    }
    RW(0, 78, 256, 2, bc);
  },
  near(a, S) {
    const { RW, PW, LW } = a;
    const bc = mix(S.T.brick, S.n2, 0.35);
    const bw = [44, 36, 48, 40, 44, 44];
    const hs = [44, 50, 40, 52, 46, 42];
    let x = 0;
    bw.forEach((w, i) => {
      const hh = hs[i], c = i % 2 ? bc : shade(bc, -0.12);
      RW(x, 64 - hh, w - 1, hh, c);
      RW(x, 64 - hh, w - 1, 2, shade(c, 0.28)); RW(x, 64 - hh + 2, w - 1, 1, shade(c, -0.3));
      for (let k = 2; k < w - 3; k += 3) RW(x + k, 64 - hh - 1, 2, 1, shade(c, -0.2)); // dentils
      for (let wy = 64 - hh + 6; wy < 56; wy += 15) for (let wxx = x + 3; wxx < x + w - 8; wxx += 11) {
        RW(wxx - 1, wy - 1, 10, 13, shade(c, -0.45));
        const glass = S.r(wxx, wy, 7) > 0.5 ? mix(S.sk, '#ffffff', 0.35) : '#ffd877';
        RW(wxx, wy, 8, 11, glass);
        RW(wxx + 3, wy, 1, 11, shade(c, -0.45)); RW(wxx, wy + 4, 8, 1, shade(c, -0.45));
        RW(wxx - 1, wy + 11, 10, 1, shade(c, 0.3));
      }
      x += w;
    });
    // smokestack
    RW(98, 4, 7, 22, shade(bc, -0.2)); RW(97, 3, 9, 2, shade(bc, -0.4)); for (let y = 8; y < 24; y += 5) RW(98, y, 7, 1, shade(bc, 0.1));
    // wood water tower on the roof of building 2
    const tx = 150, ty = 64 - hs[2] - 1 + 1;
    const wood = '#7a4a2e';
    RW(tx, ty - 7, 1, 7, '#3a2a28'); RW(tx + 12, ty - 7, 1, 7, '#3a2a28'); LW(tx, ty - 7, tx + 12, ty, '#3a2a28'); LW(tx + 12, ty - 7, tx, ty, '#3a2a28');
    RW(tx - 2, ty - 18, 17, 11, wood); RW(tx - 2, ty - 18, 17, 1, shade(wood, 0.2));
    for (let k = 0; k < 4; k++) RW(tx - 2, ty - 16 + k * 3, 17, 1, '#2a2020');
    for (let k = 0; k < 6; k++) RW(tx + k, ty - 24 + k, 15 - k * 2, 1, shade(wood, -0.3));
  },
};

// ---------- interior: walls, windows, pipes ----------
BG.interior = {
  far(a, S) {
    const { RW, PW } = a;
    const wall = mix(S.sk, S.n1, 0.5), dk = shade(wall, -0.18);
    RW(0, 6, 256, 90, wall);
    RW(0, 4, 256, 3, shade(wall, 0.25)); RW(0, 7, 256, 1, dk); // cornice
    // tall windows
    for (let x = 0; x < 256; x += 64) {
      RW(x + 16, 14, 32, 58, dk);
      RW(x + 18, 16, 28, 54, mix(S.T.sky[0], '#ffffff', 0.5));
      RW(x + 18, 16, 28, 20, mix(S.T.sky[0], '#ffffff', 0.35));
      RW(x + 31, 16, 2, 54, dk); RW(x + 18, 38, 28, 2, dk);
      RW(x + 14, 72, 36, 3, shade(wall, 0.3));
    }
    // vertical pipes between windows
    for (let x = 0; x < 256; x += 64) {
      RW(x + 4, 8, 4, 88, shade(wall, -0.3)); RW(x + 4, 8, 1, 88, shade(wall, 0.1));
      for (let y = 20; y < 96; y += 24) RW(x + 3, y, 6, 3, shade(wall, -0.4));
    }
    RW(0, 88, 256, 8, dk);
  },
  near(a, S) {
    const { RW, PW } = a;
    const wall = S.n1, dado = S.n2;
    RW(0, 8, 256, 56, wall); RW(0, 8, 256, 2, shade(wall, 0.3)); RW(0, 10, 256, 1, shade(wall, -0.3));
    RW(0, 40, 256, 24, dado); RW(0, 40, 256, 2, shade(dado, 0.25)); RW(0, 42, 256, 1, shade(dado, -0.3));
    for (let x = 0; x < 256; x += 8) RW(x, 43, 1, 21, shade(dado, -0.15));
    // windows
    for (let x = 0; x < 256; x += 64) {
      RW(x + 24, 14, 22, 24, shade(wall, -0.45));
      RW(x + 26, 16, 18, 20, mix(S.T.sky[0], '#ffffff', 0.55));
      RW(x + 34, 16, 2, 20, shade(wall, -0.45)); RW(x + 26, 25, 18, 2, shade(wall, -0.45));
      RW(x + 22, 38, 26, 2, shade(wall, 0.35));
    }
    // horizontal pipes with flanges
    const pipe = shade(wall, -0.35), pipeHi = shade(wall, 0.05);
    RW(0, 20, 256, 4, pipe); RW(0, 20, 256, 1, pipeHi);
    RW(0, 50, 256, 3, shade(dado, -0.35)); RW(0, 50, 256, 1, shade(dado, 0.05));
    for (let x = 8; x < 256; x += 32) { RW(x, 18, 3, 8, shade(pipe, -0.2)); }
    for (let x = 20; x < 256; x += 64) { RW(x, 24, 3, 26, pipe); RW(x - 1, 49, 5, 5, shade(pipe, -0.2)); }
    RW(0, 60, 256, 4, shade(dado, -0.35));
  },
};

// ---------- fire: smoky interior, orange glow ----------
BG.fire = {
  far(a, S) {
    const { RW, PW, DW, ctx } = a;
    RW(0, 6, 256, 90, mix(S.sk, S.n2, 0.5));
    // glow from below
    ctx.globalAlpha = 0.1;
    for (let r = 70; r > 6; r -= 7) { for (let cx = 20; cx < 256; cx += 64) DW(cx, 100, r, '#ff7a1a'); }
    ctx.globalAlpha = 1;
    // charred posts
    for (let x = 6; x < 256; x += 42) { RW(x, 6, 6, 90, shade(S.n2, -0.5)); RW(x + 5, 6, 1, 90, '#8a3a1a'); }
    // smoke blobs
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 16; i++) DW(Math.floor(S.r(i, 1, 51) * 256), 8 + Math.floor(S.r(i, 2, 51) * 36), 9 + (i % 3) * 3, '#1a0e0e');
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 10; i++) DW(Math.floor(S.r(i, 3, 51) * 256), 30 + Math.floor(S.r(i, 4, 51) * 30), 8, '#6a5048');
    ctx.globalAlpha = 1;
    // glowing window openings
    for (let x = 24; x < 256; x += 64) {
      RW(x, 28, 20, 34, '#2a0e08'); RW(x + 2, 30, 16, 30, '#ff8a2a'); RW(x + 2, 46, 16, 14, '#ffc83a'); RW(x + 9, 30, 2, 30, '#2a0e08');
    }
  },
  near(a, S) {
    const { RW, PW, ctx } = a;
    const ch = '#1a0c0a';
    // charred wall remnants and beams
    for (let x = 10; x < 256; x += 56) { RW(x, 22, 8, 42, ch); RW(x + 7, 22, 1, 42, '#7a3418'); }
    RW(0, 22, 256, 3, ch); for (let x = 0; x < 256; x += 8) PW(x, 25, '#7a3418');
    // flames
    const cols = ['#e03a12', '#ff7a1c', '#ffc23a', '#fff0a0'];
    for (let i = 0; i < 20; i++) {
      const cx = i * 13 + 5, hh = 14 + Math.floor(S.r(i, 1, 52) * 18);
      for (let k = 0; k < 4; k++) {
        const hk = Math.round(hh * (1 - k * 0.22)), wk = Math.max(1, 6 - k * 2);
        for (let y = 0; y < hk; y++) {
          const half = Math.round(wk * Math.sin(Math.PI * Math.min(1, (y + 3) / (hk + 3)) * 0.5 + 0.7) * (1 - y / hk * 0.9));
          RW(cx - half, 64 - y - 1, half * 2 + 1, 1, cols[k]);
        }
      }
    }
    // embers
    for (let i = 0; i < 24; i++) PW(Math.floor(S.r(i, 5, 53) * 256), 6 + Math.floor(S.r(i, 6, 53) * 40), i % 3 ? '#ff9a2a' : '#ffe070');
  },
};

// ---------- savanna: acacias, Nairobi sunset ----------
BG.savanna = {
  far(a, S) {
    const { RW, PW, DW, ridge, ctx } = a;
    // sun half set behind the ridge with halo
    ctx.globalAlpha = 0.18;
    for (let r = 44; r > 18; r -= 6) DW(176, 66, r, S.T.accent);
    ctx.globalAlpha = 1;
    DW(176, 66, 17, mix(S.T.accent, '#ffffff', 0.25)); DW(176, 66, 14, mix(S.T.accent, '#ffffff', 0.6));
    // flat topped mountain (Kilimanjaro-ish) at x=64
    const mc = mix(S.sk, S.n1, 0.65);
    for (let dx = -56; dx <= 56; dx++) {
      const f = Math.min(1, (1 - Math.abs(dx) / 56) * 2.2);
      const y = 70 - Math.round(36 * f) + Math.round(S.r(dx, 1, 61) * 2);
      RW(64 + dx, y, 1, 30, mc);
      if (y < 40) PW(64 + dx, y, '#fff0e0');
    }
    ridge((x) => 70 - 5 * Math.sin(TAU * 2 * x / 256 + 2) - 3 * Math.sin(TAU * 7 * x / 256), S.fc2, shade(S.fc2, 0.12));
    ridge((x) => 80 - 3 * Math.sin(TAU * 3 * x / 256 + 1), S.fc);
    for (let i = 0; i < 5; i++) acacia(a, S, 20 + i * 52 + Math.floor(S.r(i, 2, 62) * 14), 82, 62 + Math.floor(S.r(i, 3, 62) * 6), 6, shade(S.n2, -0.1));
  },
  near(a, S) {
    const { RW, PW, ridge } = a;
    const dk = shade(S.n2, -0.4);
    ridge((x) => 54 + 3 * Math.sin(TAU * 3 * x / 256 + 0.5) + 2 * Math.sin(TAU * 9 * x / 256), S.n2, shade(S.n2, 0.2));
    [[30, 14, 12], [96, 8, 15], [150, 16, 10], [214, 10, 14]].forEach(([c, ty, wd]) => acacia(a, S, c, 60, ty + 20, wd, dk));
    for (let x = 0; x < 256; x += 3) {
      const y = 54 + Math.round(3 * Math.sin(TAU * 3 * x / 256 + 0.5) + 2 * Math.sin(TAU * 9 * x / 256));
      if (S.r(x, 1, 63) > 0.4) RW(x, y - 2, 1, 3, S.n2);
    }
  },
};

// ---- main entry ----
// opts.themeOnly: rebuild only theme-dependent textures (tiles, backgrounds) and keep
// items/props/enemies, so objects already in the scene keep valid textures (mid-level
// theme switches: South America segments, Minneapolis night).
export function makeEnvironmentTextures(scene, theme, opts = {}) {
  const T = typeof theme === 'string' ? THEMES[theme] : theme || THEMES.day;
  const themed = (key) => key.startsWith('tile-') || key.startsWith('bg-');
  const mk = (key, w, h, fn) => {
    if (opts.themeOnly && !themed(key) && scene.textures.exists(key)) return;
    makeCanvas(scene, key, w, h, fn);
  };

  // ===== tiles =====
  const dirt = (R, P, w, h, y0) => {
    R(0, y0, w, h - y0, T.ground);
    const dk = shade(T.ground, -0.22), lt = shade(T.ground, 0.16);
    for (let y = y0; y < h; y++) for (let x = 0; x < w; x++) {
      const r = rnd(x, y, 7);
      if (r < 0.07) P(x, y, dk); else if (r > 0.95) P(x, y, lt);
    }
    // a couple of pebbles
    P(3, y0 + 6, dk); P(4, y0 + 6, dk); P(4, y0 + 7, dk);
    P(11, y0 + 2, lt); P(12, y0 + 2, lt);
  };
  // Indoors (interior style): solid ground reads as the building's cross-section,
  // a plastered wall with a baseboard line and panel seams, under wood floorboards.
  const wall = (R, P, y0) => {
    const g = T.ground, dk = shade(g, -0.18), lt = shade(g, 0.12);
    R(0, y0, 16, 16 - y0, g);
    R(0, y0, 16, 1, dk);
    R(3, y0 + 3, 10, 9 - y0 > 0 ? 9 - y0 + 3 : 0, lt);
    R(3, y0 + 3, 10, 1, dk); R(3, y0 + 3, 1, Math.max(0, 9 - y0 + 3), dk);
    R(0, 15, 16, 1, dk); P(15, y0 + 1, dk); P(0, 8, lt);
  };
  mk('tile-ground', 16, 16, ({ R, P, w, h }) => { if (T.bg === 'interior') wall(R, P, 0); else dirt(R, P, w, h, 0); });
  mk('tile-ground-top', 16, 16, ({ R, P, w, h }) => {
    if (T.bg === 'interior') {
      // wood floorboards on top of the wall cross-section
      wall(R, P, 5);
      const wd = '#a8794a', wdk = shade(wd, -0.3), wlt = shade(wd, 0.25);
      R(0, 0, 16, 4, wd); R(0, 0, 16, 1, wlt); R(0, 4, 16, 1, wdk);
      P(5, 1, wdk); P(5, 2, wdk); P(12, 2, wdk); P(12, 3, wdk); P(9, 1, wlt);
      return;
    }
    dirt(R, P, w, h, 0);
    const g = T.groundTop, gd = T.snow ? mix(g, '#8fb0d8', 0.65) : shade(g, -0.25), gl = T.snow ? '#ffffff' : shade(g, 0.28);
    R(0, 0, 16, T.snow ? 5 : 4, g);
    R(0, 0, 16, 1, gl);
    // wavy lip hanging into the dirt
    for (let x = 0; x < 16; x++) {
      const drop = [0, 1, 1, 2, 1, 0, 1, 2, 2, 1, 0, 1, 1, 2, 1, 0][x];
      R(x, 4, 1, drop, g);
      P(x, 4 + drop, gd);
    }
    // grass tufts (or snow sparkle and drift shadows)
    P(2, 1, gl); P(6, 2, gd); P(10, 1, gl); P(13, 2, gd);
    if (T.snow) { R(3, 3, 3, 1, gd); R(9, 4, 4, 1, gd); P(7, 1, '#cfe6ff'); P(14, 1, '#cfe6ff'); }
  });
  mk('tile-brick', 16, 16, ({ R, P }) => {
    if (T.brickStyle === 'choc') {
      // chocolate bar: 2x2 beveled squares, foil edge
      const b = T.brick, dk = shade(b, -0.5), lt = shade(b, 0.3), md = shade(b, -0.18);
      R(0, 0, 16, 16, dk);
      [[1, 1], [9, 1], [1, 9], [9, 9]].forEach(([x, y]) => {
        R(x, y, 6, 6, b); R(x, y, 6, 1, lt); R(x, y, 1, 6, lt);
        R(x + 5, y, 1, 6, md); R(x, y + 5, 6, 1, md);
        R(x + 1, y + 1, 4, 4, shade(b, -0.07)); R(x + 2, y + 2, 2, 1, lt);
      });
      R(7, 0, 2, 16, shade(b, -0.35)); R(0, 7, 16, 2, shade(b, -0.35));
      P(0, 0, lt); P(15, 15, dk);
      return;
    }
    const b = T.brick, dk = shade(b, -0.35), lt = shade(b, 0.28), md = shade(b, -0.12);
    R(0, 0, 16, 16, b);
    // mortar
    R(0, 0, 16, 1, dk); R(0, 5, 16, 1, dk); R(0, 10, 16, 1, dk); R(0, 15, 16, 1, dk);
    R(0, 0, 1, 16, dk); R(15, 0, 1, 16, dk);
    R(7, 1, 1, 4, dk); R(3, 6, 1, 4, dk); R(11, 6, 1, 4, dk); R(7, 11, 1, 4, dk);
    // lit top edges per brick, shaded bottoms
    R(1, 1, 6, 1, lt); R(8, 1, 7, 1, lt); R(1, 6, 2, 1, lt); R(4, 6, 7, 1, lt); R(12, 6, 3, 1, lt);
    R(1, 11, 6, 1, lt); R(8, 11, 7, 1, lt);
    R(1, 4, 6, 1, md); R(8, 4, 7, 1, md); R(4, 9, 7, 1, md); R(1, 9, 2, 1, md); R(12, 9, 3, 1, md);
    R(1, 14, 6, 1, md); R(8, 14, 7, 1, md);
    P(0, 0, lt); P(15, 15, dk);
    if (T.snow) { P(3, 2, '#ffffff'); P(4, 3, '#ffffff'); P(11, 7, '#ffffff'); P(12, 8, '#ffffff'); P(5, 12, '#ffffff'); }
  });
  mk('tile-water', 16, 16, ({ ctx }) => {
    // translucent water: light surface line, a few sparkles
    ctx.fillStyle = 'rgba(46,120,214,0.55)'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = 'rgba(30,90,190,0.35)'; ctx.fillRect(0, 8, 16, 8);
    ctx.fillStyle = 'rgba(200,240,255,0.9)'; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = 'rgba(160,220,255,0.6)'; ctx.fillRect(0, 1, 16, 1);
    ctx.fillStyle = 'rgba(220,248,255,0.8)';
    [[2, 5], [9, 7], [13, 11], [5, 13]].forEach(([x, y]) => ctx.fillRect(x, y, 2, 1));
  });
  mk('tile-oneway', 16, 6, ({ R, P }) => {
    const b = T.brick, dk = shade(b, -0.4), lt = shade(b, 0.3);
    R(0, 0, 16, 4, b);
    R(0, 0, 16, 1, lt);
    R(0, 3, 16, 1, shade(b, -0.15));
    R(0, 4, 16, 1, dk);
    // little supports / rivets
    R(1, 5, 2, 1, dk); R(13, 5, 2, 1, dk);
    P(3, 2, dk); P(8, 2, dk); P(12, 2, dk);
    R(0, 0, 1, 5, dk); R(15, 0, 1, 5, dk);
  });
  mk('tile-hidden', 16, 16, ({ ctx, R }) => {
    // faint dashed outline of a block, mostly transparent
    ctx.globalAlpha = 0.5;
    const c = mix(T.brick, '#ffffff', 0.55);
    for (let i = 0; i < 16; i += 4) {
      R(i, 0, 2, 1, c); R(i + 2, 15, 2, 1, c);
      R(0, i + 2, 1, 2, c); R(15, i, 1, 2, c);
    }
    ctx.globalAlpha = 0.18;
    R(1, 1, 14, 14, c);
    ctx.globalAlpha = 0.6;
    R(7, 6, 2, 2, c); R(7, 9, 2, 1, c); // faint hint mark
    ctx.globalAlpha = 1;
  });

  // ===== items =====
  mk('item-hat', 16, 16, ({ A }) => {
    A([
      '.......PP.......',
      '......PPP.......',
      '......PPPp......',
      '.....PPPPp......',
      '.....PPPPPP.....',
      '....PPPPPPp.....',
      '....PPPPPPPP....',
      '...BBBBBBBBBB...',
      '...BYBBBBBBBB...',
      '..PPPPPPPPPPPP..',
      '.PPPPPPPPPPPPPP.',
      'PPPPPPPPPPPPPPPP',
      '.dddddddddddddd.',
    ], { P: HAT, p: HAT_LIGHT, B: HAT_BAND, Y: GOLD_LIGHT, d: shade(HAT, -0.4) }, 0, 2);
  });
  mk('item-pen', 16, 16, ({ P, R }) => {
    // diagonal fountain pen, nib bottom-left, cap top-right
    const px = (x, y, c) => { P(x, y, c); };
    for (let i = 0; i < 9; i++) { // body
      const x = 5 + i, y = 11 - i;
      px(x, y, PEN_BODY); px(x + 1, y, PEN_BODY); px(x, y - 1, PEN_LIGHT);
      px(x + 1, y + 1, shade(PEN_BODY, -0.35));
    }
    // gold clip rings
    px(11, 5, GOLD); px(12, 5, GOLD); px(12, 4, GOLD); px(10, 6, GOLD); px(11, 6, GOLD);
    px(13, 3, GOLD); px(14, 3, GOLD); px(14, 2, GOLD);
    // grip + nib
    px(4, 12, GOLD); px(5, 12, GOLD); px(4, 11, GOLD_LIGHT);
    px(3, 13, INK); px(4, 13, '#d8d8e8'); px(2, 14, INK); px(3, 14, '#d8d8e8'); px(1, 15, INK); px(2, 15, INK);
    px(2, 13, INK); px(3, 12, INK);
    // ink drop
    px(0, 14, PEN_LIGHT); px(0, 15, PEN_BODY);
  });
  mk('item-collectible', 12, 12, ({ A, ctx, R }) => {
    ctx.globalAlpha = 0.28;
    R(0, 1, 12, 10, HEART_LIGHT);
    R(1, 0, 10, 12, HEART_LIGHT);
    ctx.globalAlpha = 1;
    A([
      '..HH..HH..',
      '.HLHHHHHH.',
      'HLHHHHHHHH',
      'HHHHHHHHHH',
      'HHHHHHHHHD',
      '.HHHHHHHD.',
      '..HHHHHD..',
      '...HHHD...',
      '....HD....',
    ], { H: HEART, L: '#ffffff', D: shade(HEART, -0.3) }, 1, 1);
  });
  mk('item-charm', 10, 10, ({ A }) => {
    A([
      '.EE....EE.',
      'EeE....EeE',
      'EeE....EeE',
      'EeE.RR.EeE',
      '.EEERRREE.',
      '..EREERE..',
      '...RRRR...',
      '....GG....',
      '....GG....',
    ], { E: CHARM, e: '#ffb0cc', R: CHARM_SHADE, G: GOLD }, 0, 0);
  });

  // ===== props =====
  const checkpoint = (on) => ({ R, P, A }) => {
    // post
    R(7, 4, 2, 28, POST);
    R(7, 4, 1, 28, shade(POST, 0.25));
    R(5, 30, 6, 2, shade(POST, -0.3));
    R(6, 29, 4, 1, POST);
    R(6, 2, 4, 3, on ? GOLD : FLAG_OFF); // knob
    P(7, 2, on ? GOLD_LIGHT : '#d4d0de');
    if (on) {
      const c = T.accent;
      // raised scalloped pennant flowing right
      A([
        'CCCCCCC',
        'CcCCCCCC',
        'CcCCCCCCC',
        'CCCCCCCC',
        'CCCCCCC',
        'CCCCC',
        'C.C',
      ], { C: c, c: shade(c, 0.4) }, 9, 5);
      R(9, 6, 1, 6, shade(c, -0.25));
    } else {
      // limp flag hanging down from the top of the post
      R(9, 5, 5, 6, FLAG_OFF);
      R(9, 5, 5, 1, shade(FLAG_OFF, 0.25));
      R(10, 11, 3, 3, FLAG_OFF);
      R(11, 14, 1, 2, shade(FLAG_OFF, -0.2));
      R(9, 5, 1, 6, shade(FLAG_OFF, -0.2));
    }
  };
  mk('prop-checkpoint-off', 16, 32, checkpoint(false));
  mk('prop-checkpoint-on', 16, 32, checkpoint(true));

  mk('prop-goal', 16, 48, ({ R, P, A }) => {
    // tall pole with ball finial, crossbar and a hanging scalloped bunting banner
    R(2, 0, 4, 4, GOLD); R(3, 0, 2, 1, GOLD_LIGHT); P(3, 1, GOLD_LIGHT);
    R(3, 4, 2, 44, '#d8d4e0');
    R(3, 4, 1, 44, '#ffffff');
    R(1, 44, 6, 4, POST); R(2, 43, 4, 1, POST);
    R(3, 7, 12, 2, POST); // crossbar
    const c = T.accent, c2 = shade(c, -0.25), cl = shade(c, 0.4);
    // banner hanging off the crossbar, scalloped bottom
    R(5, 9, 10, 15, c);
    R(5, 9, 1, 15, cl);
    R(14, 9, 1, 15, c2);
    // scallops
    for (let i = 0; i < 5; i++) { R(5 + i * 2, 24, 2, 1, c); }
    R(5, 25, 2, 1, c); R(9, 25, 2, 1, c); R(13, 25, 2, 1, c);
    P(5, 26, c2); P(9, 26, c2); P(13, 26, c2);
    // little tassels / stripe
    R(5, 13, 10, 2, WHITE);
    // heart emblem
    A(['.H.H.', 'HHHHH', '.HHH.', '..H..'], { H: WHITE }, 7, 16);
    // bunting triangles on the rope left of the pole
    P(2, 7, POST);
  });

  const gate = (open) => ({ R, P, w }) => {
    const rail = GATE_SHADE;
    const picket = (x, top) => {
      R(x, top + 2, 4, 32 - top - 2 - 2, GATE);
      R(x + 1, top, 2, 2, GATE);
      R(x, top + 2, 1, 32 - top - 4, GATE_SHADE);
    };
    if (!open) {
      // posts
      R(0, 4, 4, 28, GATE); R(0, 2, 4, 2, GATE_SHADE); R(1, 0, 2, 2, GATE);
      R(28, 4, 4, 28, GATE); R(28, 2, 4, 2, GATE_SHADE); R(29, 0, 2, 2, GATE);
      [5, 10, 15, 20, 24].forEach((x) => {
        R(x, 10, 3, 20, GATE); R(x, 9, 3, 1, GATE); R(x + 1, 8, 1, 1, GATE);
        R(x, 10, 1, 20, GATE_SHADE);
      });
      R(4, 14, 24, 2, rail); R(4, 14, 24, 1, '#ffffff');
      R(4, 24, 24, 2, rail); R(4, 24, 24, 1, '#ffffff');
      // latch
      R(15, 19, 3, 3, GOLD);
    } else {
      // posts with swung open leaves folded against them
      R(0, 4, 4, 28, GATE); R(0, 2, 4, 2, GATE_SHADE); R(1, 0, 2, 2, GATE);
      R(28, 4, 4, 28, GATE); R(28, 2, 4, 2, GATE_SHADE); R(29, 0, 2, 2, GATE);
      [[4, 7], [24, 27]].forEach(([a, b]) => {
        for (let x = a; x <= b; x += 2) {
          R(x, 12, 2, 18, x % 4 === 0 ? GATE : GATE_SHADE); R(x, 11, 2, 1, GATE);
        }
        R(a, 16, 4, 1, rail); R(a, 24, 4, 1, rail);
      });
    }
    // grass at the base
    R(0, 30, 32, 2, '#78c850'); R(0, 30, 32, 1, '#a0e078');
    for (let x = 2; x < 32; x += 5) P(x, 29, '#78c850');
  };
  mk('prop-gate-closed', 32, 32, gate(false));
  mk('prop-gate-open', 32, 32, gate(true));

  mk('prop-door', 24, 40, ({ R, P, A }) => {
    R(0, 0, 24, 40, shade(DOOR_DARK, -0.2));          // frame
    R(1, 1, 22, 39, DOOR_DARK);
    R(2, 2, 20, 38, DOOR);
    R(2, 2, 20, 1, DOOR_LIGHT);
    R(2, 2, 1, 38, DOOR_LIGHT);
    // window
    R(6, 5, 12, 11, DOOR_DARK);
    R(7, 6, 10, 9, '#ffe9a0');
    R(7, 6, 10, 3, '#fff6c8');
    R(11, 6, 2, 9, DOOR_DARK); R(7, 10, 10, 1, DOOR_DARK);
    // panels
    R(6, 19, 12, 7, DOOR_DARK); R(7, 20, 10, 5, shade(DOOR, -0.08));
    R(6, 29, 12, 9, DOOR_DARK); R(7, 30, 10, 7, shade(DOOR, -0.08));
    R(7, 20, 10, 1, DOOR); R(7, 30, 10, 1, DOOR);
    // knob
    R(18, 24, 3, 3, GOLD); P(18, 24, GOLD_LIGHT);
    R(19, 27, 1, 1, shade(GOLD, -0.4));
    // sill
    R(0, 39, 24, 1, shade(DOOR_DARK, -0.4));
  });

  mk('prop-pen-line', 16, 4, ({ R }) => {
    const wob = [1, 1, 1, 0, 0, 1, 2, 2, 1, 1, 0, 0, 1, 2, 2, 1];
    for (let x = 0; x < 16; x++) {
      R(x, wob[x], 1, 2, INK_LINE);
      if (x % 5 === 2) R(x, wob[x] - 1 < 0 ? 0 : wob[x] - 1, 1, 1, shade(INK_LINE, 0.4));
    }
  });

  // ===== enemies =====
  // inbox: angry envelope with flapping wings (16x12)
  const inbox = (f) => ({ R, P }) => {
    // wings
    const up = f === 0;
    const wy = up ? 0 : 4;
    R(0, wy, 3, 3, WING); R(1, wy + 3, 3, 2, WING);
    R(13, wy, 3, 3, WING); R(12, wy + 3, 3, 2, WING);
    P(0, wy, '#ffffff'); P(15, wy, '#ffffff');
    if (!up) { P(0, wy + 3, WING); P(15, wy + 3, WING); }
    // body
    const by = 2 + (up ? 0 : 1);
    R(3, by, 10, 8, INK);
    R(4, by + 1, 8, 6, ENV);
    R(4, by + 6, 8, 1, ENV_SHADE);
    // flap V
    P(5, by + 1, ENV_SHADE); P(6, by + 2, ENV_SHADE); P(7, by + 3, ENV_SHADE);
    P(10, by + 1, ENV_SHADE); P(9, by + 2, ENV_SHADE); P(8, by + 3, ENV_SHADE);
    // angry eyes + brows
    P(5, by + 3, INK); P(10, by + 3, INK);
    P(5, by + 2, INK); P(6, by + 2, INK); P(9, by + 2, INK); P(10, by + 2, INK);
    // red stamp
    R(7, by + 5, 2, 1, ENV_RED);
    P(6, by + 4, ENV_RED); P(9, by + 4, ENV_RED);
  };
  mk('enemy-inbox-0', 16, 12, inbox(0));
  mk('enemy-inbox-1', 16, 12, inbox(1));

  // subway: small train car with a clock (24x16)
  const subway = (f) => ({ R, P, D }) => {
    const oy = f === 0 ? 0 : 1;
    R(1, 2 + oy, 22, 11, INK);
    R(2, 3 + oy, 20, 9, TRAIN);
    R(2, 3 + oy, 20, 1, shade(TRAIN, 0.3));
    R(2, 9 + oy, 20, 1, TRAIN_STRIPE);
    R(2, 10 + oy, 20, 2, TRAIN_DARK);
    // windows
    R(4, 5 + oy, 4, 3, '#cfeaff'); R(9, 5 + oy, 4, 3, '#cfeaff');
    P(4, 5 + oy, '#ffffff'); P(9, 5 + oy, '#ffffff');
    // front clock face (it is late!)
    D(18, 7 + oy, 3, INK); D(18, 7 + oy, 2, WHITE);
    P(18, 6 + oy, INK); P(18, 7 + oy, INK); P(19, 7 + oy, INK); // hands
    P(18, 8 + oy, f === 0 ? INK : WHITE);
    // grumpy brow
    P(16, 3 + oy, INK); P(17, 3 + oy, INK); P(20, 3 + oy, INK);
    // roof bump
    R(8, 1 + oy, 8, 1, INK); R(9, 0 + oy, 6, 1, INK);
    // wheels
    const wy = 13;
    D(6, wy + 1, 2, INK); D(17, wy + 1, 2, INK);
    P(f === 0 ? 6 : 7, wy + 1, '#c8c8d8'); P(f === 0 ? 17 : 18, wy + 1, '#c8c8d8');
  };
  mk('enemy-subway-0', 24, 16, subway(0));
  mk('enemy-subway-1', 24, 16, subway(1));

  // laundry: pile of clothes with a sock (16x16)
  const laundry = (f) => ({ R, P, D }) => {
    const sq = f === 0 ? 0 : 1; // squash
    D(8, 11 + sq, 5, INK);
    R(2, 10 + sq, 12, 6 - sq, INK);
    // clothes lumps
    R(3, 11 + sq, 5, 4 - sq, CLOTH_A);
    R(8, 10 + sq, 5, 5 - sq, CLOTH_B);
    R(5, 8 + sq, 6, 4, CLOTH_C);
    R(5, 8 + sq, 6, 1, shade(CLOTH_C, 0.3));
    R(3, 11 + sq, 5, 1, shade(CLOTH_A, 0.3));
    R(8, 10 + sq, 5, 1, shade(CLOTH_B, 0.3));
    // face
    P(6, 10 + sq, INK); P(9, 10 + sq, INK);
    P(7, 12 + sq, INK); P(8, 12 + sq, INK);
    // sock dangling on top, wiggles
    const sx = f === 0 ? 8 : 9;
    R(sx, 3, 3, 5, WHITE); R(sx, 3, 3, 1, SOCK_A); R(sx, 4, 3, 1, SOCK_A);
    R(sx + (f === 0 ? 1 : -1), 8, 3, 1, WHITE);
    P(sx, 3, SOCK_A);
    R(sx - 1, 2, 5, 1, INK);
    R(sx - 1, 3, 1, 6, INK); R(sx + 3, 3, 1, 5, INK);
    // outline cleanup at the bottom
    R(2, 15, 12, 1, INK);
  };
  mk('enemy-laundry-0', 16, 16, laundry(0));
  mk('enemy-laundry-1', 16, 16, laundry(1));

  // alarm: twin-bell clock that shakes (16x16)
  const alarm = (f) => ({ R, P, D }) => {
    const sx = f === 0 ? -1 : 1; // shake
    const bx = (x) => x + sx;
    // legs
    R(bx(4), 14, 2, 2, INK); R(bx(10), 14, 2, 2, INK);
    // bells (twin, bounce)
    const by = f === 0 ? 0 : 1;
    D(bx(4), 3 + by, 3, INK); D(bx(4), 3 + by, 2, BELL);
    D(bx(11), 3 + by, 3, INK); D(bx(11), 3 + by, 2, BELL);
    P(bx(3), 2 + by, WHITE);
    R(bx(7), 1 + by, 2, 3, INK); // hammer
    // body
    D(bx(8), 9, 6, INK);
    D(bx(8), 9, 5, ALARM);
    P(bx(5), 6, shade(ALARM, 0.4)); P(bx(6), 5, shade(ALARM, 0.4));
    // face
    D(bx(8), 9, 4, WHITE);
    // clock hands: six o'clock
    R(bx(8), 9, 1, 3, INK); R(bx(8), 9, 2, 1, INK);
    // silly eyes
    P(bx(6), 8, INK); P(bx(10), 8, INK);
    P(bx(6), 7, INK); P(bx(10), 7, INK);
    // shake marks
    P(f === 0 ? 15 : 0, 8, INK); P(f === 0 ? 15 : 0, 11, INK);
    P(f === 0 ? 0 : 15, 6, INK);
  };
  mk('enemy-alarm-0', 16, 16, alarm(0));
  mk('enemy-alarm-1', 16, 16, alarm(1));

  // ===== backgrounds =====
  const bgStyle = T.bg || (T.skyline ? 'skyline' : 'hills');
  const bgDef = BG[bgStyle] || BG.hills;
  const S = bgSetup(T);
  bgCanvas(mk, 'bg-far', 96, (a) => bgDef.far(a, S), S);
  bgCanvas(mk, 'bg-hills', 64, (a) => bgDef.near(a, S), S);

  mk('bg-clouds', 128, 32, ({ R, P, D }) => {
    const c = T.clouds, sh = shade(c, -0.12), hi = shade(c, 0.5);
    const cloud = (x, y, s) => {
      D(x, y, 5 * s, sh); D(x + 7 * s, y - 2 * s, 6 * s, sh); D(x + 14 * s, y, 5 * s, sh);
      R(x - 5 * s, y, 24 * s, 5 * s, sh);
      const u = 1;
      D(x, y - u, 5 * s, c); D(x + 7 * s, y - 2 * s - u, 6 * s, c); D(x + 14 * s, y - u, 5 * s, c);
      R(x - 5 * s, y - u, 24 * s, 4 * s, c);
      R(x - 4 * s, y + 4 * s - u, 22 * s, 1, sh);
      P(x + 5 * s, y - 6 * s, hi); P(x + 6 * s, y - 6 * s, hi);
    };
    if (T.bg === 'interior') {
      // indoors: ceiling lights on short stems instead of clouds
      const lamp = shade(T.accent, -0.2), glow = '#fff6c8';
      [[18, 0], [82, 0]].forEach(([x]) => { R(x, 0, 1, 6, lamp); R(x - 5, 6, 11, 3, lamp); R(x - 4, 9, 9, 1, glow); R(x - 2, 10, 5, 1, glow); });
      return;
    }
    cloud(10, 18, 1.4 | 0 || 1);
    cloud(68, 11, 1);
    cloud(100, 24, 1);
    if (T.stars) {
      const st = shade(T.accent, 0.2);
      [[4, 4], [44, 6], [58, 28], [92, 4], [120, 14], [30, 28], [80, 18]].forEach(([x, y]) => {
        P(x, y, st); if ((x + y) % 3 === 0) { P(x - 1, y, st); P(x + 1, y, st); P(x, y - 1, st); P(x, y + 1, st); }
      });
    }
  });
}
