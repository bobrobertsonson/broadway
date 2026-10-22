// Procedural logo for "Super Jasmin World 3: A New Magic".
// Original pixel lettering: 5-7 px wide stroke-heavy glyphs, scaled up, rounded,
// with a bouncy baseline and a flat gold outline (no shadows or highlights).

const BIG = {
  S: [".XXXX", "XX..X", "XX...", ".XXX.", "...XX", "X..XX", "XXXX."],
  U: ["XX.XX", "XX.XX", "XX.XX", "XX.XX", "XX.XX", "XXXXX", ".XXX."],
  P: ["XXXX.", "XXXXX", "XX.XX", "XXXXX", "XXXX.", "XX...", "XX..."],
  E: ["XXXXX", "XX...", "XX...", "XXXX.", "XX...", "XX...", "XXXXX"],
  R: ["XXXX.", "XXXXX", "XX.XX", "XXXX.", "XXXX.", "XX.XX", "XX.XX"],
  J: ["..XXX", "...XX", "...XX", "...XX", "XX.XX", "XXXXX", ".XXX."],
  A: [".XXX.", "XXXXX", "XX.XX", "XXXXX", "XXXXX", "XX.XX", "XX.XX"],
  M: ["XX...XX", "XXX.XXX", "XXXXXXX", "XXXXXXX", "XX.X.XX", "XX...XX", "XX...XX"],
  I: ["XXXX", ".XX.", ".XX.", ".XX.", ".XX.", ".XX.", "XXXX"],
  N: ["XX..XX", "XXX.XX", "XXXXXX", "XXXXXX", "XX.XXX", "XX..XX", "XX..XX"],
  W: ["XX...XX", "XX...XX", "XX.X.XX", "XXXXXXX", "XXXXXXX", "XXX.XXX", "XX...XX"],
  O: [".XXX.", "XXXXX", "XX.XX", "XX.XX", "XX.XX", "XXXXX", ".XXX."],
  L: ["XX...", "XX...", "XX...", "XX...", "XX...", "XXXXX", "XXXXX"],
  D: ["XXXX.", "XXXXX", "XX.XX", "XX.XX", "XX.XX", "XXXXX", "XXXX."],
  "3": ["XXXX.", "XXXXX", "...XX", ".XXX.", "...XX", "XXXXX", "XXXX."],
  ":": ["..", "XX", "XX", "..", "XX", "XX", ".."],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};

// Small slanted script face: 9 rows, baseline on row 6, descenders rows 7-8.
const SCRIPT = {
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X", "", ""],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X", "", ""],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X", "", ""],
  e: ["", "", ".XX.", "X..X", "XXXX", "X...", ".XXX", "", ""],
  w: ["", "", "X...X", "X...X", "X.X.X", "XX.XX", "X...X", "", ""],
  a: ["", "", ".XXX", "...X", ".XXX", "X..X", ".XXX", "", ""],
  g: ["", "", ".XXX", "X..X", "X..X", ".XXX", "...X", "...X", "XXX."],
  i: ["X", "", "X", "X", "X", "X", "X", "", ""],
  c: ["", "", ".XXX", "X...", "X...", "X...", ".XXX", "", ""],
  " ": ["", "", "", "", "", "", "", "", ""],
};

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];

class Buf {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.mask = new Uint8Array(w * h);
  }
  get(x, y) {
    return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.mask[y * this.w + x];
  }
  set(x, y) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.mask[y * this.w + x] = 1;
  }
  // Glyph rows -> mask. slant shifts upper rows right (italic).
  glyph(rows, x, y, s, slant) {
    for (let r = 0; r < rows.length; r++) {
      const sh = slant ? slant(r) : 0;
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] !== "X") continue;
        for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) this.set(x + (c + sh) * s + dx, y + r * s + dy);
      }
    }
  }
  // Round the outer corners of blocky shapes by one pixel.
  round() {
    const out = this.mask.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.get(x, y)) continue;
        const l = !this.get(x - 1, y), r = !this.get(x + 1, y), u = !this.get(x, y - 1), d = !this.get(x, y + 1);
        if ((l && u) || (r && u) || (l && d) || (r && d)) out[y * this.w + x] = 0;
      }
    }
    this.mask = out;
  }
  // Distance (Chebyshev-ish, corners trimmed) ring map: returns Uint8Array of min dist up to n.
  dist(n) {
    const d = new Uint8Array(this.w * this.h).fill(255);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (!this.mask[y * this.w + x]) continue;
        for (let dy = -n; dy <= n; dy++) {
          for (let dx = -n; dx <= n; dx++) {
            const dd = Math.abs(dx) + Math.abs(dy) > n + 1 ? 99 : Math.max(Math.abs(dx), Math.abs(dy));
            if (dd > n) continue;
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) continue;
            if (dd < d[yy * this.w + xx]) d[yy * this.w + xx] = dd;
          }
        }
      }
    }
    return d;
  }
}

function layout(text, font, scale, gap) {
  const items = [];
  let x = 0;
  for (const ch of text) {
    const g = font[ch];
    const w = Math.max(...g.map((r) => r.length));
    items.push({ g, x, w });
    x += w * scale + gap;
  }
  return { items, width: x - gap };
}

function buildLogo() {
  const M = 6;
  const W = 240;
  const H = 112;
  const px = new Uint8ClampedArray(W * H * 4);
  const over = (x, y, c, a = 1) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    const da = px[i + 3] / 255;
    const oa = a + da * (1 - a);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) px[i + k] = (c[k] * a + px[i + k] * da * (1 - a)) / oa;
    px[i + 3] = oa * 255;
  };

  const main = new Buf(W, H);
  const sub = new Buf(W, H);
  const hat = new Buf(W, H);
  const hatCol = new Map();

  const bounce = [0, -1, 1, 0, 1, 0];
  const l1 = layout("SUPER", BIG, 2, 3);
  const l2 = layout("JASMIN", BIG, 3, 5);
  const l3 = layout("WORLD 3:", BIG, 2, 4);
  const sc = (r) => (8 - r) >> 3;
  const l4 = layout("A New Magic", SCRIPT, 2, 4);

  const cx = Math.floor(W / 2);
  const y1 = M;
  const y2 = y1 + 7 * 2 + 5;
  const y3 = y2 + 7 * 3 + 6;
  const y4 = y3 + 7 * 2 + 5;

  // JASMIN
  const x2 = cx - Math.floor(l2.width / 2);
  l2.items.forEach((it, i) => main.glyph(it.g, x2 + it.x, y2 + bounce[i], 3));
  // SUPER, perched to the right of the hat
  const x1 = x2 + 16 + Math.floor((l2.width - 16 - l1.width) / 2);
  l1.items.forEach((it, i) => main.glyph(it.g, x1 + it.x, y1, 2));
  // WORLD 3:
  const x3 = cx - Math.floor(l3.width / 2);
  l3.items.forEach((it, i) => main.glyph(it.g, x3 + it.x, y3 + [0, 1, 0, 1, 0, 0, 1, 0][i], 2));
  main.round();

  // Subtitle (italic script, scale 2)
  const x4 = cx - Math.floor((l4.width + 3) / 2);
  l4.items.forEach((it, i) => sub.glyph(it.g, x4 + it.x, y4 + [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0][i], 2, sc));

  // Witch hat bitmap, leaning left, placed on the J
  const HAT = [
    "..OO.........",
    "..OPOO.......",
    "...OPPO......",
    "...OPPPO.....",
    "...OPPPPO....",
    "..OPPPPPPO...",
    "..OGGGGGGGO..",
    "..OGGGGGGGO..",
    "OOOOOOOOOOOOO",
    "OBBBBBBBBBBBO",
    ".OOOOOOOOOOO.",
  ];
  const hx = x2 - 1;
  const hy = y2 - 8 + bounce[0];
  const hc = { O: "#1e1236", P: "#3b2a5c", B: "#3b2a5c", G: "#e0a43a" };
  HAT.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      hat.set(hx + c, hy + r);
      const col = hc[ch];
      hatCol.set((hy + r) * W + hx + c, col);
    }
  });

  // ---- Compose ----
  const dMain = main.dist(2);
  const dSub = sub.dist(1);
  const dHat = hat.dist(0);

  // main outline: flat 1px gold with a 1px dark rim
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (dMain[i] === 2) over(x, y, hex("#3a1d63"));
      else if (dMain[i] === 1) over(x, y, hex("#e0a43a"));
    }
  }
  // subtitle outline
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (dSub[i] === 1) over(x, y, hex("#3a1d63"));
    }
  }
  // flat letter fills
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (main.get(x, y)) over(x, y, hex("#5a2d91"));
      else if (sub.get(x, y)) over(x, y, hex("#f6cf6f"));
    }
  }
  // hat (flat colors)
  hatCol.forEach((c, i) => over(i % W, (i / W) | 0, hex(c)));

  // measure subtitle bbox
  let minx = W, miny = H, maxx = 0, maxy = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sub.get(x, y)) {
    if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
  }
  // overall bounds to crop
  let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 0) {
    if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y;
  }
  return { px, W, H, bx0, by0, bx1, by1, sub: { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 } };
}

export function makeLogoTexture(scene) {
  const built = buildLogo();
  const pad = 1;
  const x0 = Math.max(0, built.bx0 - pad), y0 = Math.max(0, built.by0 - pad);
  const w = Math.min(built.W, built.bx1 + pad + 1) - x0;
  const h = Math.min(built.H, built.by1 + pad + 1) - y0;
  if (scene.textures.exists("logo")) scene.textures.remove("logo");
  const tex = scene.textures.createCanvas("logo", w, h);
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((y + y0) * built.W + x + x0) * 4;
      const d = (y * w + x) * 4;
      for (let k = 0; k < 4; k++) img.data[d + k] = built.px[s + k];
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return {
    width: w,
    height: h,
    subtitle: { x: built.sub.x - x0, y: built.sub.y - y0, w: built.sub.w, h: built.sub.h },
  };
}

export function makeSparkleTextures(scene) {
  const frames = [
    [
      "..W..",
      "..Y..",
      "WYWYW",
      "..Y..",
      "..W..",
    ],
    [
      "W...W",
      ".Y.Y.",
      "..W..",
      ".Y.Y.",
      "W...W",
    ],
  ];
  const cols = { W: "#ffffff", Y: "#ffd966" };
  frames.forEach((rows, n) => {
    const key = "logo-sparkle-" + n;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, 5, 5);
    const ctx = tex.getContext();
    rows.forEach((row, y) => {
      for (let x = 0; x < 5; x++) {
        if (row[x] === ".") continue;
        ctx.fillStyle = cols[row[x]];
        ctx.fillRect(x, y, 1, 1);
      }
    });
    tex.refresh();
  });
}
