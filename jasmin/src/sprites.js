// Pixel data for Jasmin's Game.
// Segments are [row, colStart, colEnd, slot]. Each slot maps to a color in PALETTE.
// Later segments draw over earlier ones. Sprites face right.
// Rabbit uses row strings instead (one char per pixel, "." is transparent).

export const PALETTE = {
  // Jasmin
  H: "#141012", h: "#45373e",            // hair, hair highlight
  S: "#8a5a3c", s: "#74482f",            // skin, skin shadow
  G: "#121212", W: "#f4f1ea", E: "#2a1a14", M: "#8a3e3a", // glasses, eye white, iris, lips
  C: "#2a262e", c: "#4a4552",            // dress, dress rim (outfit slots)
  P: "#e0a43a",                          // belt and hat band (outfit slot)
  K: "#3b2a5c",                          // witch hat (outfit slot)
  B: "#1a1a1a",                          // boots
  // Andrew
  D: "#3b2618", d: "#5c3d27",            // hair, highlight
  F: "#ecc8ac", f: "#d2a88c", m: "#b8766a", // skin, shadow, mouth
  T: "#1d1d20", w: "#f0f0f0",            // band shirt, shirt logo
  I: "#3a4a5e",                          // tattoo ink
  Q: "#141416", p: "#2e2e36",            // pants, pants seam
  o: "#3a3a3a",                          // shoe sole
  // Kids
  Y: "#5a3a22", y: "#7a5233",            // hair, highlight
  N: "#b98a69", n: "#a07457",            // skin, shadow
  R: "#2f8f8a", U: "#3e5a84", Z: "#d64b3a", // son shirt, shorts, sneakers
  L: "#7b4fbf", l: "#5e3a96", A: "#f5d342", // egg, egg shade, egg dots
  O: "#f2c94c", j: "#d9ad35",            // daughter onesie, onesie shade
  X: "#e8607a", x: "#b8405a",            // bow, bow knot
  // Nube
  Nk: "#c99c7a", Nk2: "#ad8060", Nm: "#a8665c", // skin, shadow, mouth
  Nu: "#e8607a",                         // hair tie
  Nt: "#4a90c2", Nt2: "#3a73a0",         // top, top shade (placeholder until her signature item is chosen)
  Nj: "#2e3f5c", Nz: "#ececec",          // jeans, sneakers
  Nb: "#d8c8a8", Nb2: "#a8946c",         // tote bag, tote strap
  // Tim (Galapagos cameo): white skin, medium brown beard.
  Tk: "#ecc8ac", Tb: "#7a5233", Tb2: "#9a6c45", Tt: "#33333a", Ti: "#3a4a5e", Tj: "#2b3a52",
  // Rabbit
  Rd: "#4e3220", Ro: "#b0682f", Rt: "#c99a63", Rm: "#e2c393", Rk: "#0d0a08", Rn: "#d98a8a",
  // Added by Claude Code (engine needs): outline for dark levels, ghost cloak worn by Jasmin when seen.
  Ol: "#f4f1ea",
  Kc: "#1c1a20", Kh: "#34313b", Kr: "#5c5866",
};

// Outfit palettes: override only the slots that change.
export const OUTFITS = {
  black:  { C: "#2a262e", c: "#4a4552", P: "#e0a43a", K: "#3b2a5c" },
  purple: { C: "#6b44a0", c: "#4a2f72", P: "#e0a43a", K: "#3b2a5c" },
};

// ---------- Jasmin (24 x 32) ----------
const JASMIN_CROWN = [[5,13,17,"H"],[6,11,19,"H"],[7,10,20,"H"],[7,14,15,"h"]];
const JASMIN_HAT = [[0,6,7,"K"],[1,6,9,"K"],[2,8,11,"K"],[3,10,14,"K"],[4,11,16,"K"],[5,11,17,"K"],[6,11,18,"P"],[7,7,22,"K"]];
const JASMIN_BASE_SHORT = [
  [8,9,20,"H"],[8,12,13,"h"],[9,8,12,"H"],[10,6,12,"H"],[11,5,12,"H"],[12,4,12,"H"],[13,4,12,"H"],[14,5,12,"H"],[15,6,13,"H"],[16,6,14,"H"],[17,6,11,"H"],[18,5,10,"H"],[19,4,9,"H"],[20,3,8,"H"],[21,2,6,"H"],[22,1,4,"H"],[23,1,2,"H"],
  [10,9,9,"h"],[11,8,8,"h"],[12,7,7,"h"],[13,7,7,"h"],[14,8,8,"h"],[15,9,9,"h"],[16,9,9,"h"],[17,8,8,"h"],[18,7,7,"h"],[19,6,6,"h"],[20,5,5,"h"],[21,4,4,"h"],[13,10,10,"h"],[19,8,8,"h"],
  [9,13,19,"S"],[9,20,20,"G"],[10,13,16,"G"],[10,17,17,"S"],[10,18,19,"G"],[11,13,19,"S"],[11,14,14,"W"],[11,15,15,"E"],[11,18,18,"E"],[11,20,20,"S"],[12,13,19,"S"],[12,14,14,"W"],[12,15,15,"E"],[12,18,18,"E"],[12,20,20,"S"],[13,13,19,"S"],[13,13,13,"s"],[14,13,19,"S"],[14,13,13,"s"],[14,17,18,"M"],[15,14,18,"S"],[15,14,14,"s"],[16,15,16,"S"],
  [17,12,18,"C"],[17,12,12,"c"],[18,12,19,"C"],[18,12,12,"c"],[19,13,19,"C"],[19,13,13,"c"],[19,20,20,"S"],[20,13,17,"C"],[20,13,13,"c"],[21,13,17,"P"],[22,12,18,"C"],[22,12,12,"c"],[23,11,19,"C"],[23,11,11,"c"],[24,10,20,"C"],[24,10,10,"c"],[25,9,21,"C"],[25,9,9,"c"],[26,9,21,"c"],[27,13,14,"B"],[27,17,18,"B"],[28,12,14,"B"],[28,17,19,"B"],
];

// Stretches the base 3 rows taller so Jasmin stands just shorter than Andrew.
function stretchJasmin(segs) {
  const out = [];
  for (const [r, a, b, ch] of segs) {
    const n = r + (r >= 21 ? 1 : 0) + (r >= 25 ? 1 : 0) + (r >= 27 ? 1 : 0);
    out.push([n, a, b, ch]);
    if (r === 20) out.push([21, a, b, ch]);
    if (r === 24) out.push([26, a, b, ch]);
  }
  out.push([29, 13, 14, "S"], [29, 17, 18, "S"]);
  const isHair = (s) => s[3] === "H" || s[3] === "h";
  return out.sort((p, q) => (isHair(p) ? 0 : 1) - (isHair(q) ? 0 : 1));
}

const JASMIN_BASE = stretchJasmin(JASMIN_BASE_SHORT);

// ---------- Andrew (24 x 31) ----------
const ANDREW = [
  [3,13,18,"D"],[4,12,19,"D"],[5,11,19,"D"],[5,14,15,"d"],[6,11,13,"D"],[6,14,20,"F"],[7,11,12,"D"],[7,13,13,"F"],[7,14,20,"G"],[8,11,11,"D"],[8,12,13,"F"],[8,14,14,"G"],[8,15,15,"W"],[8,16,16,"E"],[8,17,17,"G"],[8,18,18,"F"],[8,19,19,"E"],[8,20,20,"G"],[8,21,21,"F"],[9,12,13,"F"],[9,14,17,"G"],[9,18,18,"F"],[9,19,20,"G"],[9,21,21,"F"],[10,12,20,"F"],[10,12,12,"f"],[10,18,19,"m"],[11,13,19,"F"],[11,13,13,"f"],[12,15,17,"F"],
  [13,12,19,"T"],[14,12,19,"T"],[15,13,18,"T"],[16,13,18,"T"],[17,13,18,"T"],[18,13,18,"T"],[19,13,18,"T"],[20,13,18,"T"],[15,15,17,"w"],[16,16,16,"w"],[17,15,15,"w"],[17,17,17,"w"],
  [15,12,12,"I"],[16,12,12,"F"],[17,12,12,"I"],[18,12,12,"F"],[19,12,12,"F"],[15,19,19,"I"],[15,20,20,"F"],[16,19,19,"F"],[16,20,20,"I"],[17,19,19,"I"],[17,20,20,"F"],[18,19,19,"F"],[18,20,20,"I"],[19,19,20,"F"],
  [21,13,18,"Q"],[22,13,18,"Q"],[23,13,14,"Q"],[23,16,18,"Q"],[24,12,14,"Q"],[24,17,19,"Q"],[25,11,13,"Q"],[25,17,19,"Q"],[26,11,13,"Q"],[26,18,20,"Q"],[27,10,12,"Q"],[27,18,20,"Q"],[28,10,12,"Q"],[28,18,20,"Q"],[22,13,13,"p"],[24,12,12,"p"],[26,11,11,"p"],[28,10,10,"p"],
  [29,9,12,"B"],[29,18,21,"B"],[30,9,12,"o"],[30,18,21,"o"],
];

// ---------- Son (24 x 17), holding purple egg ----------
const SON = [
  [0,12,17,"Y"],[1,10,19,"Y"],[1,13,14,"y"],[2,9,19,"Y"],[2,15,15,"y"],[3,9,13,"Y"],[3,14,19,"N"],[3,16,16,"Y"],[4,9,12,"Y"],[4,13,20,"N"],[4,17,17,"E"],[5,9,11,"Y"],[5,12,20,"N"],[5,12,12,"n"],[5,17,17,"E"],[6,10,11,"Y"],[6,12,20,"N"],[6,18,19,"m"],[7,11,11,"Y"],[7,13,19,"N"],[7,13,13,"n"],[8,15,16,"N"],
  [9,13,18,"R"],[10,13,19,"R"],[11,13,18,"R"],[12,13,18,"R"],[11,20,20,"N"],
  [7,21,22,"L"],[8,20,23,"L"],[9,20,23,"L"],[10,20,23,"L"],[11,21,22,"L"],[8,20,20,"l"],[9,20,20,"l"],[10,20,20,"l"],[11,21,21,"l"],[8,22,22,"A"],[9,21,21,"A"],[9,23,23,"A"],[10,22,22,"A"],
  [13,13,18,"U"],[14,13,14,"U"],[14,17,18,"U"],[15,13,14,"N"],[15,17,18,"N"],[16,12,14,"Z"],[16,17,19,"Z"],
];

// ---------- Daughter (24 x 14) ----------
const DAUGHTER = [
  [0,13,17,"Y"],[1,12,18,"Y"],[2,11,18,"Y"],[2,14,14,"y"],[3,11,17,"Y"],[3,18,19,"N"],[4,11,13,"Y"],[4,14,19,"N"],[4,17,17,"E"],[5,11,13,"Y"],[5,14,19,"N"],[5,17,17,"E"],[6,11,12,"Y"],[6,13,19,"N"],[6,18,18,"m"],[7,12,12,"Y"],[7,14,18,"N"],[7,14,14,"n"],
  [0,17,17,"X"],[0,19,19,"X"],[1,17,19,"X"],[1,18,18,"x"],
  [8,14,18,"O"],[9,13,18,"O"],[9,19,19,"N"],[10,13,18,"O"],[10,13,13,"j"],[11,13,18,"O"],[12,13,14,"O"],[12,17,18,"O"],[13,13,14,"j"],[13,17,18,"j"],
];

// ---------- Nube (24 x 22) ----------
const NUBE = [
  [0,13,17,"H"],[1,11,19,"H"],[1,14,15,"h"],[2,10,19,"H"],[3,7,9,"H"],[3,10,10,"Nu"],[3,11,13,"H"],[3,14,19,"Nk"],[4,6,8,"H"],[4,11,12,"H"],[4,13,20,"Nk"],[5,6,8,"H"],[5,11,12,"H"],[5,13,20,"Nk"],[5,16,16,"W"],[5,17,17,"E"],[6,6,7,"H"],[6,12,12,"H"],[6,13,21,"Nk"],[7,7,8,"H"],[7,13,20,"Nk"],[7,18,19,"Nm"],[8,7,7,"H"],[8,13,19,"Nk"],[8,13,13,"Nk2"],[9,14,18,"Nk"],[9,14,14,"Nk2"],[10,15,17,"Nk"],
  [11,11,20,"Nt"],[12,11,20,"Nt"],[13,11,20,"Nt"],[14,11,20,"Nt"],[15,11,20,"Nt"],[11,11,11,"Nt2"],[12,11,11,"Nt2"],[13,11,11,"Nt2"],[14,11,11,"Nt2"],[15,11,11,"Nt2"],[14,21,21,"Nk"],[15,21,21,"Nk"],
  [16,12,19,"Nj"],[17,12,19,"Nj"],[18,12,14,"Nj"],[18,17,19,"Nj"],[19,12,14,"Nj"],[19,17,19,"Nj"],[20,12,14,"Nj"],[20,17,19,"Nj"],[21,11,14,"Nz"],[21,17,20,"Nz"],
  [11,12,12,"Nb2"],[11,11,11,"Nb2"],[12,10,10,"Nb2"],[13,8,10,"Nb"],[14,8,10,"Nb"],[15,8,10,"Nb"],[16,8,10,"Nb"],[16,8,8,"Nb2"],
];

// ---------- Tim (24 x 22): short, bald, huge beard, heavily tattooed ----------
const TIM = [
  [0,13,18,"Tk"],[1,12,19,"Tk"],[2,12,20,"Tk"],[3,12,20,"Tk"],[3,14,14,"Ti"],[4,12,20,"Tk"],[4,17,17,"E"],[5,12,21,"Tk"],[6,12,13,"Tk"],
  [11,11,20,"Tt"],[12,11,20,"Tt"],[13,11,20,"Tt"],[14,11,20,"Tt"],[15,11,20,"Tt"],[16,11,20,"Tt"],
  [12,10,10,"Ti"],[13,10,10,"Tk"],[14,10,10,"Ti"],[15,10,10,"Ti"],[16,10,10,"Tk"],[12,21,21,"Ti"],[13,21,21,"Ti"],[14,21,21,"Tk"],[15,21,21,"Ti"],[16,21,21,"Tk"],
  [17,12,19,"Tj"],[18,12,19,"Tj"],[19,12,14,"Tj"],[19,17,19,"Tj"],[20,12,14,"Tj"],[20,17,19,"Tj"],[21,11,14,"B"],[21,17,20,"B"],
  [6,14,21,"Tb"],[7,12,21,"Tb"],[8,12,21,"Tb"],[9,12,20,"Tb"],[10,13,20,"Tb"],[11,14,19,"Tb"],[12,15,18,"Tb"],[13,16,17,"Tb"],
  [7,17,17,"Tb2"],[8,16,16,"Tb2"],[9,18,18,"Tb2"],[10,15,15,"Tb2"],[11,17,17,"Tb2"],
];

// ---------- Rupert the rabbit (18 x 14), row strings ----------
const RABBIT_ROWS = [
  "..........DD.OO...",
  ".........DDD.OOO..",
  "........MMDDDOOMM.",
  ".......MMDDDDOOOMM",
  "......MMDDDDOOKOOM",
  "......MMDDDDOOOOON",
  ".....MMMMDDDOOOOO.",
  "....MMMMMMMOOOO...",
  "..TTDDDDMMMMM.....",
  "MTTTDDDDOOOOT.....",
  ".TTTDDDDOOOOTT....",
  ".TTTDDDDOOOOTT....",
  "..TTDDDDOOOOTTT...",
  "...TT.....DD.TT...",
];
const RABBIT_KEY = { D: "Rd", O: "Ro", T: "Rt", M: "Rm", K: "Rk", N: "Rn" };

export const SPRITES = {
  jasmin:       { w: 24, h: 32, segs: [...JASMIN_CROWN, ...JASMIN_BASE] },
  jasminHat:    { w: 24, h: 32, segs: [...JASMIN_HAT, ...JASMIN_BASE] },
  andrew:       { w: 24, h: 31, segs: ANDREW },
  son:          { w: 24, h: 17, segs: SON },
  daughter:     { w: 24, h: 14, segs: DAUGHTER },
  nube:         { w: 24, h: 22, segs: NUBE },
  tim:          { w: 24, h: 22, segs: TIM },
  rupert:       { w: 18, h: 14, rows: RABBIT_ROWS, key: RABBIT_KEY },
};

// Draws a sprite into a 2D canvas context at pixel scale 1.
// Pass an outfit name to recolor Jasmin's outfit slots.
export function drawSprite(ctx, sprite, outfit) {
  const pal = { ...PALETTE, ...(outfit ? OUTFITS[outfit] : {}) };
  if (sprite.rows) {
    sprite.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      const slot = sprite.key[ch];
      if (slot) { ctx.fillStyle = pal[slot]; ctx.fillRect(x, y, 1, 1); }
    }));
    return;
  }
  for (const [r, a, b, slot] of sprite.segs) {
    ctx.fillStyle = pal[slot];
    ctx.fillRect(a, r, b - a + 1, 1);
  }
}
