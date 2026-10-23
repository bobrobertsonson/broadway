// Outfit shapes. An outfit in levels.json may name a `style`; it reshapes Jasmin's
// clothes in every animation frame (after the frames are built, so running, jumping
// and gliding all keep working). Colors still come from the outfit's palette slots:
//   C main color, c its shade, P accent, C2 a second color (default cream),
//   Tw / Tg sneaker white and sole, Bp / Bp2 backpack.
//
//   puffy     a big round quilted parka, puffy sleeve, fur collar (C2), past the hips
//   jeans     a jacket with a center placket over jeans (the skirt becomes two legs)
//   twotone   a top in C2 over the skirt in C
//   cardigan  an open cardigan (C) over a C2 top
//   scarf     a chunky scarf in P wrapped at the neck, long tail flying behind
//   trainers  white sneakers with a stripe instead of boots, and a big travel backpack
//
// Frame layout (24 x 32, see frames.js): torso above the belt row (P), skirt below it,
// a skin row for legs, then two rows of boots (B).

export const STYLE_DEFAULTS = { C2: "#f4f1ea", Tw: "#f6f6f2", Tg: "#b8b8c0", Bp: "#4f7a3a", Bp2: "#33532a" };

const isCloth = (s) => s === "C" || s === "c" || s === "P";

function layout(g) {
  const rowHas = (y, f) => g[y].some(f);
  // The belt is the lowest accent (P) row with clothes right below it; the hat band
  // uses the same slot, so searching from the top would find the hat.
  let belt = -1;
  for (let y = g.length - 2; y >= 0; y--) if (g[y].includes("P") && g[y + 1].some((s) => s === "C" || s === "c")) { belt = y; break; }
  if (belt < 0) return null;
  let top = belt;
  while (top > 0 && rowHas(top - 1, (s) => s === "C" || s === "c")) top--;
  let leg = belt + 1;
  while (leg < g.length && !rowHas(leg, (s) => s === "S" || s === "B")) leg++;
  return { belt, top, leg };
}

// [min, max] columns of cells matching f in row y, or null.
function span(row, f) {
  let a = -1, b = -1;
  row.forEach((s, x) => { if (f(s)) { if (a < 0) a = x; b = x; } });
  return a < 0 ? null : [a, b];
}

// Runs of leg pixels in a row: [[a, b], ...].
function runs(row, f) {
  const out = [];
  row.forEach((s, x) => {
    if (!f(s)) return;
    const last = out[out.length - 1];
    if (last && last[1] === x - 1) last[1] = x; else out.push([x, x]);
  });
  return out;
}

const set = (g, x, y, s) => { if (y >= 0 && y < g.length && x >= 0 && x < g[y].length) g[y][x] = s; };

const STYLES = {
  puffy(g, L) {
    // A round parka: widest in the middle, puffy sleeve, fur collar, down past the hips.
    const bottom = L.belt + 4, n = bottom - L.top;
    for (let y = L.top; y <= bottom; y++) {
      const sp = span(g[y], (s) => isCloth(s) || (y > L.top && y < L.belt && s === "S"));
      if (!sp) continue;
      const k = y - L.top;
      const e = k === 0 ? 1 : k === 1 || k === n ? 2 : 3;
      const a = sp[0] - e, b = Math.min(g[y].length - 2, sp[1] + e - (y > L.belt ? 1 : 0));
      for (let x = a; x <= b; x++) set(g, x, y, "C");
      if (k % 2 === 1 && k > 1 && k < n) for (let x = a + 1; x < b; x++) set(g, x, y, "c");
      set(g, a, y, "c"); set(g, b, y, "c");
    }
    // puffy sleeve reaching forward, mitten at the end
    const arm = L.top + 2;
    const asp = span(g[arm], (s) => s === "C" || s === "c");
    if (asp) { for (let x = asp[1]; x <= asp[1] + 2; x++) { set(g, x, arm, "C"); set(g, x, arm + 1, "c"); } set(g, asp[1] + 3, arm, "P"); set(g, asp[1] + 3, arm + 1, "P"); }
    // fur collar (cream) hugging the neck and chin
    const neck = span(g[L.top - 1], (s) => s === "S" || s === "s");
    if (neck) for (let y = L.top - 1; y <= L.top; y++) for (let x = neck[0] - 2; x <= neck[1] + 2; x++) set(g, x, y, "C2");
  },
  jeans(g, L) {
    // jacket: a center placket and darker collar tips
    for (let y = L.top; y < L.belt; y++) {
      const sp = span(g[y], (s) => s === "C" || s === "c");
      if (sp) set(g, Math.round((sp[0] + sp[1]) / 2) + 1, y, "c");
    }
    const legs = runs(g[L.leg], (s) => s === "S" || s === "B");
    if (!legs.length) return;
    const lo = legs[0][0] - 1, hi = legs[legs.length - 1][1] + 1;
    for (let y = L.belt + 1; y <= L.leg; y++) {
      for (let x = 0; x < g[y].length; x++) if (isCloth(g[y][x]) || (y === L.leg && g[y][x] === "S")) g[y][x] = null;
      if (y <= L.belt + 2) { for (let x = lo; x <= hi; x++) set(g, x, y, "C"); continue; }
      legs.forEach(([a, b], i) => {
        for (let x = a - (i === 0 ? 1 : 0); x <= b + (i === legs.length - 1 ? 1 : 0); x++) set(g, x, y, "C");
        set(g, i === 0 ? b : a, y, "c"); // inner seam
      });
    }
  },
  twotone(g, L) {
    for (let y = L.top; y < L.belt; y++) g[y] = g[y].map((s) => (s === "C" ? "C2" : s));
  },
  cardigan(g, L) {
    for (let y = L.top; y <= L.belt + 2; y++) {
      const sp = span(g[y], isCloth);
      if (!sp) continue;
      for (let x = sp[0]; x <= sp[1]; x++) {
        const outer = x <= sp[0] + 1 || x >= sp[1] - 1;
        if (y < L.belt) g[y][x] = outer ? "C" : "C2";
        else if (outer) g[y][x] = "c";
      }
    }
  },
  scarf(g, L) {
    // a chunky scarf: two rows around the neck, a long tail flying behind
    const neck = span(g[L.top - 1], (s) => s === "S" || s === "s");
    if (!neck) return;
    for (let y = L.top - 1; y <= L.top; y++) for (let x = neck[0] - 2; x <= neck[1] + 2; x++) set(g, x, y, y === L.top ? "P" : "P");
    for (let x = neck[0] - 2; x <= neck[1] + 2; x += 2) set(g, x, L.top, "c");
    const tx = neck[0] - 3;
    [[0, 1], [-1, 2], [-2, 3], [-3, 4], [-4, 5], [-5, 6]].forEach(([dx, dy]) => {
      for (let w = 0; w < 3; w++) set(g, tx + dx + w, L.top - 1 + dy, "P");
    });
    set(g, tx - 6, L.top + 6, "c"); set(g, tx - 4, L.top + 6, "c"); // fringe
  },
  trainers(g, L) {
    const rows = g.map((r, y) => (r.includes("B") ? y : -1)).filter((y) => y >= 0);
    const last = rows[rows.length - 1];
    for (const y of rows) {
      g[y] = g[y].map((s) => (s === "B" ? (y === last ? "Tg" : "Tw") : s));
      if (y !== last) for (const [a, b] of runs(g[y], (s) => s === "Tw")) set(g, Math.round((a + b) / 2), y, "C");
    }
    if (!L) return;
    // a big travel backpack on her back, with a shoulder strap and a rolled mat on top
    const sp = span(g[L.top + 1], isCloth);
    if (!sp) return;
    const x1 = sp[0] - 1, x0 = x1 - 4;
    for (let y = L.top - 1; y <= L.belt + 2; y++) for (let x = x0; x <= x1; x++) set(g, x, y, x === x0 || y === L.belt + 2 ? "Bp2" : "Bp");
    for (let x = x0 + 1; x < x1; x++) set(g, x, L.top + 3, "Bp2");
    for (let x = x0; x <= x1 + 1; x++) { set(g, x, L.top - 2, "C2"); set(g, x, L.top - 3, "C2"); }
    for (let y = L.top; y < L.belt; y++) set(g, sp[0] + 1, y, "Bp2");
  },
};

// Returns new frames with the style applied (frames without a belt are left alone).
export function styleFrames(frames, style) {
  const fn = STYLES[style];
  if (!fn) return frames;
  return frames.map((grid) => {
    const g = grid.map((r) => r.slice());
    const L = layout(g);
    if (L || style === "trainers") fn(g, L);
    return g;
  });
}
