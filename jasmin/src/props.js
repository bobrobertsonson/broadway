// Theme-independent prop / item / enemy / boss / fx textures, drawn with fillRect on
// canvas textures (same approach as tiles.js). Call makePropTextures(scene) once; keys that
// already exist are skipped, so calling again is cheap.
//
// KEYS (width x height)
//  Collectibles 12x12: item-record, item-message, item-crowd, item-dumpling, item-backpack, item-stamp,
//                      item-chicken, item-nandos
//  London: prop-chickenshop 56x48 (decor)
//  Hiding spots: prop-hide-snowbank 32x20, prop-hide-shelter 32x32, prop-hide-door 20x32
//  prop-exit 24x32, prop-picnic 40x12, prop-hut 56x44, prop-candle-0/-1 3x7,
//  prop-lantern-0/-1 8x12, prop-sign-0/-1/-2 24x12, prop-valve-0 (closed)/-1 (open) 16x16,
//  prop-window 16x24, prop-school 64x48
//  Platforms: plat-bus 48x24, plat-tortoise-0/-1 32x14, tile-chocolate 16x16
//  Decor: deco-sealion-0/-1 24x14, deco-iguana-0/-1 16x8
//  NPC: npc-cop-0/-1 16x28
//  Enemies: enemy-ghost-0/-1 16x24, enemy-germ-0/-1 14x14, enemy-food-0/-1 16x14, enemy-cold-0/-1 16x16
//  Boss/fx: boss-fire-0/-1/-2 64x64, boss-ember 6x6, fx-cloud 32x16, fx-rain 2x5,
//           fx-glow 16x16, fx-sparkle-0/-1 5x5, fx-heart 7x6

// ---- named colors ----
const INK = '#2a2038';
const WHITE = '#fffaf0';
const SNOW = '#f4faff', SNOW_SHADE = '#c4dcf0', SNOW_DEEP = '#9cbfe0';
const GOLD = '#e0a43a', GOLD_LIGHT = '#fff0a0', GOLD_DARK = '#a8741e';
const HEART = '#ff5c8a', HEART_LIGHT = '#ffc0d4';
const VINYL = '#2a2438', VINYL_LIGHT = '#5a5078', LABEL = '#ff7a5c';
const BUBBLE = '#fffaf0', BUBBLE_SHADE = '#d8d0e8';
const CITY1 = '#5a74b0', CITY2 = '#8aa2d4', CITY3 = '#3f5490', WINDOW_LIT = '#ffe27a';
const DOUGH = '#fff4e0', DOUGH_SHADE = '#e6cfae';
const PACK = '#2fb5a8', PACK_DARK = '#1d7f7a', PACK_POCKET = '#ffcf4a', PACK_STRAP = '#d84a5a';
const STAMP_INK = '#3b4fa8', STAMP_LIGHT = '#6a7fd8';
const SHELTER_ROOF = '#3d7f8a', SHELTER_ROOF_LIGHT = '#6ab4c0', GLASS = '#bfe8f4', GLASS_LIGHT = '#effbff', METAL = '#7a8498', METAL_DARK = '#4e5568';
const BENCH = '#b07a48';
const STONE = '#b8a8a0', STONE_DARK = '#8a7a78', STONE_LIGHT = '#d8ccc4', DOORWAY = '#241a30', DOORWAY_MID = '#3c2c4c', DOOR_WOOD = '#8c5a38';
const EXIT_GREEN = '#1fae5c', EXIT_DARK = '#0e7a3e', EXIT_LIGHT = '#6ff0a0', POST = '#8a6a4a', POST_DARK = '#5e4630';
const BLANKET = '#e0485a', BLANKET_LIGHT = '#fff0e8', BLANKET_DARK = '#a82e44';
const WINE = '#4a8a46', WINE_DARK = '#2c5a2e', WINE_LABEL = '#fff0d0', BREAD = '#d8964a', BREAD_DARK = '#a8662a', BREAD_LIGHT = '#f0c078';
const WOOD = '#a8743c', WOOD_DARK = '#7a4e28', WOOD_LIGHT = '#c8945a', ROOF_HUT = '#8c3a3a', ROOF_HUT_LIGHT = '#b85a4a', ROOF_HUT_DARK = '#5e2428';
const GLOW = '#ffd35a', GLOW_LIGHT = '#fff4b8', GLOW_ORANGE = '#ff9a3a', CANDLE_WAX = '#fff4e0', CANDLE_SHADE = '#e0c8a8';
const LANTERN = '#e8383c', LANTERN_LIGHT = '#ff7a60', LANTERN_DARK = '#a02028';
const SIGN_PINK = '#ff6fa0', SIGN_TEAL = '#2fc0b8', SIGN_YELLOW = '#ffd23c', SIGN_BLUE = '#4a6ad8', SIGN_PURPLE = '#7a4ab8', SIGN_FRAME = '#3a2c48';
const VALVE_RED = '#e0383c', VALVE_RED_LIGHT = '#ff7a70', VALVE_RED_DARK = '#9a2028', PIPE = '#8a94a8', PIPE_LIGHT = '#c0c8d8', PIPE_DARK = '#5a6478', WATER = '#5ab8f0', WATER_LIGHT = '#c0ecff';
const WIN_FRAME = '#f4ecd8', WIN_FRAME_DARK = '#b8a888', WIN_SKY = '#8fd0f0', WIN_SKY_LIGHT = '#d8f4ff';
const SCH_WALL = '#a8788a', SCH_WALL_DARK = '#8a5a70', SCH_ROOF = '#5a4a78', SCH_ROOF_LIGHT = '#7a6a98', SCH_WIN = '#e8d890', SCH_DOOR = '#5e3a50', SCH_TRIM = '#e8d8c8';
const BUS = '#e23a3a', BUS_LIGHT = '#ff7060', BUS_DARK = '#a02030', BUS_ROOF = '#f0e4d0', BUS_ROOF_DARK = '#c8b8a0', BUS_WINDOW = '#9fdcf0', BUS_WINDOW_DARK = '#5a9cc0', TIRE = '#2a2a34', HUB = '#c8ccd8';
const TORT_SHELL = '#6a9a48', TORT_SHELL_DARK = '#46703a', TORT_SHELL_LIGHT = '#98c868', TORT_SKIN = '#c8b070', TORT_SKIN_DARK = '#9a8450';
const CHOC = '#7a4a2e', CHOC_LIGHT = '#a8704a', CHOC_DARK = '#4e2c1a';
const SEAL = '#8c6a58', SEAL_LIGHT = '#b89480', SEAL_DARK = '#5e443a', SEAL_BELLY = '#d8bca4';
const IGUANA = '#2e2e3e', IGUANA_LIGHT = '#585874', IGUANA_SPIKE = '#7a7a9c';
const COP_CAP = '#46586e', COP_CAP_LIGHT = '#6a7e96', COP_SHIRT = '#8cb4d0', COP_SHIRT_DARK = '#6a90b0', COP_PANTS = '#3c4a64', COP_SKIN = '#f0c09a', COP_SKIN_DARK = '#d89c78', COP_BELT = '#2a2a34', COP_MUSTACHE = '#4a3020', COP_BADGE = '#ffd23c';
const GHOST = '#26222e', GHOST_LIGHT = '#4a4460', GHOST_FACE = '#0c0a12', EYE = '#fffaf0', BINO = '#555a72', BINO_LIGHT = '#8a90b0', LENS = '#7ae0ff';
const GERM = '#6cc84a', GERM_LIGHT = '#a4ee78', GERM_DARK = '#3e8c32', GERM_SPOT = '#2e6a28';
const EMP = '#d8a050', EMP_LIGHT = '#f0c878', EMP_DARK = '#9a6428', STINK = '#8ac040', STINK_DARK = '#5a8a28', TEAR = '#6ac0f0';
const COLD = '#d8ecf8', COLD_LIGHT = '#ffffff', COLD_DARK = '#9cc0dc', FLAKE = '#5aa0e0';
const FIRE_OUT = '#c0281c', FIRE_MID = '#ff7a1c', FIRE_IN = '#ffd23c', FIRE_CORE = '#fff4b0', FIRE_DARK = '#7a1810', MOUTH = '#6a1020', TONGUE = '#ff7a8c';
const CLOUD = '#fafcff', CLOUD_SHADE = '#c4d4ec', RAIN = '#5ab8f0', RAIN_LIGHT = '#b8e6ff';
const GLOW_PURPLE = [150, 90, 220], GLOW_GOLD = [255, 220, 110];
const SPARKLE = '#fff6b0', SPARKLE_CORE = '#ffffff';

// ---- canvas helper ----
function mk(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
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
  const A = (rows, pal, ox = 0, oy = 0) => { // ASCII art, '.' transparent
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) { const c = pal[row[x]]; if (c) P(ox + x, oy + y, c); }
    });
  };
  draw({ ctx, R, P, D, A, w, h });
  tex.refresh();
}

export function makePropTextures(scene) {
  const M = (key, w, h, fn) => mk(scene, key, w, h, fn);

  // ================= collectibles 12x12 =================
  M('item-record', 12, 12, ({ A }) => A([
    '...oooooo...',
    '..oKKKKKKo..',
    '.oKKhhKKKKo.',
    'oKKhKKKKKKKo',
    'oKhKKLLKKKKo',
    'oKKKLLwLKKKo',
    'oKKKLLLLKKKo',
    'oKKKKLLKKKhK'.slice(0, 12),
    'oKKKKKKKKhKo',
    '.oKKKKKKhKo.',
    '..oKKKKKKo..',
    '...oooooo...',
  ], { o: INK, K: VINYL, h: VINYL_LIGHT, L: LABEL, w: WHITE }));

  M('item-message', 12, 12, ({ A }) => A([
    '.oooooooooo.',
    'oBBBBBBBBBBo',
    'oBBHHBBHHBBo',
    'oBHHHHHHHHBo',
    'oBHHHHHHHHBo',
    'oBBHHHHHHBBo',
    'oBBBHHHHBBBo',
    'oBBBBHHBBBBo',
    '.oBBBBBBBBo.',
    '..oooBBoooo.',
    '....oBBo....',
    '.....oo.....',
  ].map((r, i) => i === 2 ? 'oBBHHBBHHBBo' : r), { o: INK, B: BUBBLE, H: HEART }));

  M('item-crowd', 12, 12, ({ A, R, P }) => {
    A([
      '..hh.hh.....',
      '.hHHhHHh....',
      '.hHHHHHh....',
      '..hHHHh.....',
      '...hHh......',
      '....h.......',
    ].map(r => r), { h: INK, H: HEART }, 3, 0);
    // skyline
    R(0, 8, 3, 4, CITY1); R(3, 6, 3, 6, CITY3); R(6, 7, 3, 5, CITY2); R(9, 9, 3, 3, CITY1);
    P(1, 9, WINDOW_LIT); P(1, 11, WINDOW_LIT); P(4, 7, WINDOW_LIT); P(4, 9, WINDOW_LIT); P(4, 11, WINDOW_LIT);
    P(7, 8, WINDOW_LIT); P(7, 10, WINDOW_LIT); P(10, 10, WINDOW_LIT); P(5, 5, INK); P(4, 5, CITY3);
  });
  // (crowd heart drawn above is clearer re-done on top)

  M('item-dumpling', 12, 12, ({ A }) => A([
    '............',
    '....oooo....',
    '..ooWWWWoo..',
    '.oWWWsWWWWo.',
    'oWWsWWsWWWWo'.slice(0, 12),
    'oWWWsWWsWWWo',
    'oWsWWsWWsWWo',
    'oWWWWWWWWWWo',
    '.oSWWWWWWSo.',
    '..ooSSSSoo..',
    '....oooo....',
    '............',
  ], { o: INK, W: DOUGH, s: DOUGH_SHADE, S: DOUGH_SHADE }));

  M('item-backpack', 12, 12, ({ A }) => A([
    '....oooo....',
    '...o....o...',
    '..oooooooo..',
    '.oPPPPPPPPo.',
    '.oPPPPPPPPo.',
    '.oPPPPPPPPo.',
    '.oDPyyyyPDo.',
    '.oDPyyyyPDo.',
    '.oDPyyyyPDo.',
    '.oDPPPPPPDo.',
    '.oDDDDDDDDo.',
    '..oooooooo..',
  ].map((r, i) => i === 8 ? '.oDPyooyPDo.' : r), { o: INK, P: PACK, D: PACK_DARK, y: PACK_POCKET }));

  M('item-stamp', 12, 12, ({ A, P }) => {
    A([
      '...ssssss...',
      '..s......s..',
      '.s..s..s..s.',
      's....ss....s',
      's...ssss...s',
      's.sssssssss.'.slice(0, 12),
      's...ssss...s',
      's...s..s...s',
      '.s.s....s.s.',
      '..s......s..',
      '...sss.sss..',
      '............',
    ], { s: STAMP_INK });
    P(1, 3, STAMP_LIGHT); P(10, 8, STAMP_LIGHT); P(5, 0, STAMP_LIGHT);
  });

  // ================= hiding spots =================
  M('prop-hide-snowbank', 32, 20, ({ R, P }) => {
    const hs = [];
    for (let x = 0; x < 32; x++) {
      const t = (x - 15.5) / 16;
      hs.push(Math.max(2, Math.round(17 * Math.pow(Math.max(0, 1 - t * t), 0.7)) + (x % 5 === 0 ? 1 : 0)));
    }
    hs.forEach((hgt, x) => {
      const top = 20 - hgt;
      R(x, top, 1, hgt, SNOW);
      R(x, 17, 1, 3, SNOW_SHADE);
      P(x, top, '#ffffff');
      if (x > 0 && hs[x - 1] < hgt) P(x, top + 1, SNOW_SHADE);
    });
    // drift shading and sparkles
    for (let x = 10; x < 28; x++) P(x, 20 - hs[x] + 4 + (x % 3), SNOW_SHADE);
    R(18, 9, 3, 1, SNOW_DEEP); R(7, 13, 3, 1, SNOW_DEEP); R(23, 12, 2, 1, SNOW_DEEP);
    P(12, 6, '#ffffff'); P(13, 5, '#ffffff'); P(20, 8, '#ffffff');
    R(0, 19, 32, 1, SNOW_DEEP);
  });

  M('prop-hide-shelter', 32, 32, ({ R, P }) => {
    R(0, 0, 32, 4, SHELTER_ROOF); R(0, 0, 32, 1, SHELTER_ROOF_LIGHT); R(0, 3, 32, 1, INK);
    R(1, 4, 30, 1, METAL_DARK);
    // glass back and side
    R(2, 5, 28, 22, GLASS);
    for (let i = 0; i < 6; i++) { P(4 + i * 2, 6 + i * 2, GLASS_LIGHT); P(5 + i * 2, 6 + i * 2, GLASS_LIGHT); }
    for (let i = 0; i < 4; i++) { P(17 + i * 2, 6 + i * 2, GLASS_LIGHT); P(18 + i * 2, 6 + i * 2, GLASS_LIGHT); }
    // frame posts
    R(0, 4, 3, 28, METAL); R(29, 4, 3, 28, METAL); R(0, 4, 1, 28, PIPE_LIGHT); R(2, 4, 1, 28, METAL_DARK); R(29, 4, 1, 28, METAL_DARK);
    R(3, 27, 26, 1, METAL_DARK);
    // advert panel
    R(18, 8, 8, 12, '#fff0c8'); R(18, 8, 8, 1, INK); R(18, 19, 8, 1, INK); R(18, 8, 1, 12, INK); R(25, 8, 1, 12, INK);
    R(20, 10, 4, 4, SIGN_PINK); R(20, 15, 4, 1, SIGN_TEAL); R(20, 17, 3, 1, SIGN_BLUE);
    // bench
    R(5, 22, 12, 2, BENCH); R(5, 22, 12, 1, '#d89a62'); R(6, 24, 1, 5, WOOD_DARK); R(15, 24, 1, 5, WOOD_DARK);
    R(0, 31, 32, 1, METAL_DARK); R(0, 30, 32, 1, STONE);
  });

  M('prop-hide-door', 20, 32, ({ R, P }) => {
    R(0, 0, 20, 32, STONE); R(0, 0, 20, 2, STONE_LIGHT); R(0, 0, 1, 32, STONE_LIGHT); R(19, 0, 1, 32, STONE_DARK);
    // brick marks on frame
    for (let y = 4; y < 30; y += 4) { R(0, y, 3, 1, STONE_DARK); R(17, y + 2, 3, 1, STONE_DARK); }
    // recess
    R(3, 3, 14, 27, DOORWAY); R(3, 3, 14, 1, INK);
    R(4, 4, 1, 26, DOORWAY_MID); R(15, 4, 1, 26, '#150e1e');
    // shadowy door standing ajar in recess
    R(5, 6, 8, 22, DOOR_WOOD); R(5, 6, 8, 1, WOOD_LIGHT); R(5, 6, 1, 22, WOOD_LIGHT);
    R(6, 8, 6, 8, WOOD_DARK); R(6, 18, 6, 8, WOOD_DARK);
    P(11, 17, GOLD); P(11, 16, GOLD_LIGHT);
    R(13, 6, 2, 22, '#150e1e');
    // fanlight
    R(6, 4, 6, 1, GOLD_LIGHT);
    // step
    R(1, 30, 18, 2, STONE_DARK); R(1, 30, 18, 1, STONE_LIGHT);
  });

  M('prop-exit', 24, 32, ({ R, P, A }) => {
    R(10, 11, 4, 21, POST); R(10, 11, 1, 21, '#b08a64'); R(13, 11, 1, 21, POST_DARK);
    R(7, 29, 10, 3, POST_DARK); R(7, 29, 10, 1, POST);
    R(0, 0, 24, 11, INK); R(1, 1, 22, 9, EXIT_GREEN); R(1, 1, 22, 1, EXIT_LIGHT); R(1, 9, 22, 1, EXIT_DARK);
    const L = {
      E: ['###', '#..', '##.', '#..', '###'],
      X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
      I: ['###', '.#.', '.#.', '.#.', '###'],
      T: ['###', '.#.', '.#.', '.#.', '.#.'],
    };
    // 5 rows tall would not fit between border rows (rows 3..7 = 5 rows): ok
    [['E', 5], ['X', 9], ['I', 13], ['T', 17]].forEach(([c, x0]) => {
      L[c].forEach((row, y) => { for (let x = 0; x < 3; x++) if (row[x] === '#') P(x0 + x, 3 + y, WHITE); });
    });
  });

  M('prop-picnic', 40, 12, ({ R, P, A }) => {
    // blanket in perspective
    for (let y = 5; y < 12; y++) {
      const inset = Math.round((11 - y) * 0.9);
      for (let x = inset; x < 40 - inset; x++) {
        const chk = (Math.floor((x - inset) / 4) + Math.floor((y - 5) / 2)) % 2 === 0;
        P(x, y, chk ? BLANKET : BLANKET_LIGHT);
      }
    }
    R(2, 11, 36, 1, BLANKET_DARK);
    // wine bottle
    R(7, 0, 2, 3, WINE_DARK); R(6, 3, 4, 7, WINE); R(6, 3, 1, 7, '#6cb066'); R(6, 6, 4, 2, WINE_LABEL);
    R(7, 0, 2, 1, GOLD); R(6, 9, 4, 1, WINE_DARK);
    // bread loaf
    R(22, 4, 12, 6, BREAD); R(23, 3, 10, 1, BREAD); R(21, 5, 1, 4, BREAD_DARK); R(34, 5, 1, 4, BREAD_DARK);
    R(23, 3, 10, 1, BREAD_LIGHT); R(22, 9, 12, 1, BREAD_DARK);
    for (let i = 0; i < 3; i++) { P(25 + i * 3, 4, BREAD_DARK); P(26 + i * 3, 5, BREAD_DARK); P(25 + i * 3, 6, BREAD_LIGHT); }
    // grapes? small cup
    R(14, 7, 3, 3, WHITE); R(14, 7, 3, 1, SNOW_SHADE);
  });

  // candle (3x7)
  const candle = (frame) => ({ A }) => A(frame === 0 ? [
    '.y.', 'yOy', '.o.', 'WWs', 'WWs', 'WWs', 'WWs'.slice(0, 3),
  ] : [
    '..y', '.Oy', '.o.', 'WWs', 'WWs', 'WWs', 'WWs',
  ], { y: GLOW_LIGHT, O: GLOW_ORANGE, o: INK, W: CANDLE_WAX, s: CANDLE_SHADE });
  M('prop-candle-0', 3, 7, candle(0));
  M('prop-candle-1', 3, 7, candle(1));

  M('prop-hut', 56, 44, ({ R, P, D }) => {
    // soft window glow behind
    // roof
    for (let i = 0; i < 16; i++) {
      const half = 10 + i * 1.6;
      const x0 = Math.round(28 - half), x1 = Math.round(28 + half);
      R(x0, i, x1 - x0, 1, i % 4 === 0 ? ROOF_HUT_DARK : (i % 4 === 2 ? ROOF_HUT_LIGHT : ROOF_HUT));
    }
    for (let i = 0; i < 16; i++) { const half = 10 + i * 1.6; P(Math.round(28 - half), i, ROOF_HUT_DARK); P(Math.round(28 + half) - 1, i, ROOF_HUT_DARK); }
    R(1, 15, 54, 2, ROOF_HUT_DARK); // eaves
    // chimney
    R(40, 2, 6, 8, STONE_DARK); R(39, 1, 8, 2, STONE); R(40, 2, 1, 8, STONE);
    // walls
    R(4, 17, 48, 27, WOOD);
    for (let y = 17; y < 44; y += 4) { R(4, y, 48, 1, WOOD_DARK); }
    for (let y = 19; y < 44; y += 4) for (let x = 6 + (y % 8); x < 52; x += 9) P(x, y, WOOD_DARK);
    R(4, 17, 2, 27, WOOD_DARK); R(50, 17, 2, 27, WOOD_DARK);
    R(4, 17, 1, 27, WOOD_LIGHT);
    // door
    R(10, 26, 11, 18, WOOD_DARK); R(11, 27, 9, 17, DOOR_WOOD); R(11, 27, 1, 17, WOOD_LIGHT);
    R(14, 29, 4, 7, WOOD_DARK); R(15, 30, 2, 5, DOOR_WOOD);
    P(18, 36, GOLD); P(18, 35, GOLD_LIGHT);
    // window (warm glow)
    R(28, 22, 20, 15, INK);
    R(29, 23, 18, 13, GLOW); R(30, 24, 16, 11, GLOW_LIGHT);
    R(29, 23, 18, 2, GLOW_ORANGE);
    R(37, 23, 2, 13, INK); R(29, 29, 18, 1, INK);
    // candles inside (two, with flames)
    const cndl = (x, y, h) => { R(x, y, 3, h, CANDLE_WAX); R(x + 2, y, 1, h, CANDLE_SHADE); P(x + 1, y - 2, GLOW_ORANGE); P(x + 1, y - 3, GOLD); P(x + 1, y - 4, GOLD_LIGHT); };
    cndl(32, 29, 6); cndl(42, 30, 5);
    R(31, 35, 6, 1, WOOD_DARK); R(41, 35, 6, 1, WOOD_DARK);
    R(26, 37, 24, 3, WOOD_DARK); R(27, 37, 22, 1, WOOD_LIGHT); // sill
    // glow spill on ground
    R(28, 40, 20, 4, WOOD);
    R(30, 41, 16, 1, GLOW_ORANGE);
    // shutter flowers
    P(30, 39, HEART); P(34, 39, SIGN_YELLOW); P(44, 39, HEART); P(40, 39, WHITE);
    // base stones
    for (let x = 4; x < 52; x += 6) R(x, 43, 4, 1, STONE_DARK);
  });

  // lanterns (8x12) swaying
  M('prop-lantern-0', 8, 12, ({ R, P }) => {
    R(3, 0, 2, 1, INK); R(1, 1, 6, 1, GOLD);
    R(0, 2, 8, 7, LANTERN); R(0, 2, 8, 1, LANTERN_DARK); R(0, 8, 8, 1, LANTERN_DARK);
    R(0, 3, 1, 5, LANTERN_DARK); R(7, 3, 1, 5, LANTERN_DARK);
    R(3, 2, 1, 7, LANTERN_LIGHT); R(5, 3, 1, 5, LANTERN_DARK); R(1, 3, 1, 2, LANTERN_LIGHT);
    R(1, 9, 6, 1, GOLD); R(3, 10, 2, 1, GOLD); P(3, 11, GOLD_DARK); P(4, 11, GOLD);
  });
  M('prop-lantern-1', 8, 12, ({ ctx, R, P }) => {
    // draw frame-0 style narrower (6 wide) shifted by 1 with tassel swing
    R(3, 0, 2, 1, INK);
    R(2, 1, 5, 1, GOLD);
    R(1, 2, 6, 7, LANTERN); R(1, 2, 6, 1, LANTERN_DARK); R(1, 8, 6, 1, LANTERN_DARK);
    R(1, 3, 1, 5, LANTERN_DARK); R(6, 3, 1, 5, LANTERN_DARK);
    R(3, 2, 1, 7, LANTERN_LIGHT); R(2, 3, 1, 2, LANTERN_LIGHT);
    R(2, 9, 5, 1, GOLD);
    R(5, 10, 1, 1, GOLD); R(5, 11, 2, 1, GOLD_DARK);
  });

  // signs 24x12
  const signFrame = (R, P, bg) => {
    R(0, 0, 24, 12, SIGN_FRAME); R(1, 1, 22, 10, bg);
    for (let x = 2; x < 23; x += 4) { P(x, 0, GOLD_LIGHT); P(x, 11, GOLD_LIGHT); }
  };
  M('prop-sign-0', 24, 12, ({ R, P, D }) => {
    signFrame(R, P, SIGN_PINK);
    D(7, 6, 3, SIGN_YELLOW); P(6, 5, WHITE);
    R(13, 3, 8, 2, SIGN_TEAL); R(13, 7, 8, 2, SIGN_TEAL); R(16, 5, 5, 2, WHITE);
  });
  M('prop-sign-1', 24, 12, ({ R, P }) => {
    signFrame(R, P, SIGN_TEAL);
    for (let i = 0; i < 6; i++) { R(3 + i * 3, 3 + (i % 2) * 4, 3, 2, SIGN_YELLOW); R(3 + i * 3, 4 + (i % 2) * 4, 1, 1, SIGN_YELLOW); }
    for (let i = 0; i < 5; i++) P(4 + i * 4, 6, WHITE);
    R(3, 9, 18, 1, SIGN_BLUE);
  });
  M('prop-sign-2', 24, 12, ({ R, P }) => {
    signFrame(R, P, SIGN_YELLOW);
    R(3, 3, 6, 6, SIGN_BLUE); R(4, 4, 2, 2, WHITE);
    for (let i = 0; i < 4; i++) R(11 + i, 8 - i * 2, 6 - i * 2 > 0 ? 6 - i * 2 : 1, 2, SIGN_PURPLE);
    R(19, 3, 3, 3, HEART); R(19, 7, 3, 2, SIGN_TEAL);
  });

  // valves
  const pipe = (R, P) => {
    R(0, 11, 16, 4, PIPE); R(0, 11, 16, 1, PIPE_LIGHT); R(0, 14, 16, 1, PIPE_DARK);
    R(6, 10, 4, 1, PIPE_DARK); R(5, 11, 6, 4, PIPE); R(5, 11, 1, 4, PIPE_LIGHT); R(10, 11, 1, 4, PIPE_DARK);
    R(1, 10, 2, 6, PIPE_DARK); R(13, 10, 2, 6, PIPE_DARK);
    R(7, 8, 2, 3, METAL_DARK);
  };
  M('prop-valve-0', 16, 16, ({ R, P, D }) => {
    pipe(R, P);
    // wheel: ring at (8,4) r4 + cross
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      const dx = x - 4, dy = y - 4, d = dx * dx + dy * dy;
      if (d <= 19 && d >= 11) P(4 + x, y, VALVE_RED);
    }
    R(8, 0, 1, 9, VALVE_RED); R(4, 4, 9, 1, VALVE_RED);
    R(7, 3, 3, 3, VALVE_RED_DARK); P(8, 4, VALVE_RED_LIGHT); P(6, 1, VALVE_RED_LIGHT); P(7, 1, VALVE_RED_LIGHT);
  });
  M('prop-valve-1', 16, 16, ({ R, P, D }) => {
    pipe(R, P);
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
      const dx = x - 4, dy = y - 4, d = dx * dx + dy * dy;
      if (d <= 19 && d >= 11) P(4 + x, y, VALVE_RED_LIGHT);
    }
    for (let i = 0; i < 9; i++) { P(4 + i, i, VALVE_RED); P(12 - i, i, VALVE_RED); P(4 + i, i + 0, VALVE_RED); }
    R(7, 3, 2, 2, VALVE_RED_DARK);
    // spin blur arcs
    P(3, 2, WATER_LIGHT); P(13, 6, WATER_LIGHT); P(2, 5, WATER_LIGHT);
    // water spray from joint
    P(11, 9, WATER); P(12, 8, WATER_LIGHT); P(13, 7, WATER); P(14, 9, WATER_LIGHT); P(15, 8, WATER);
    P(10, 9, WATER_LIGHT); P(1, 9, WATER); P(2, 8, WATER_LIGHT); P(0, 10, WATER);
    P(14, 5, WATER); P(15, 3, WATER_LIGHT);
  });

  M('prop-window', 16, 24, ({ R, P }) => {
    R(0, 0, 16, 24, WIN_FRAME_DARK); R(1, 1, 14, 22, WIN_FRAME);
    R(3, 3, 10, 18, INK); R(4, 4, 8, 16, WIN_SKY);
    R(4, 4, 8, 3, WIN_SKY_LIGHT);
    R(4, 11, 8, 1, WIN_FRAME); R(7, 4, 2, 16, WIN_FRAME);
    R(5, 6, 2, 1, WHITE); R(10, 14, 1, 1, WHITE); P(5, 7, WHITE);
    R(0, 21, 16, 3, WIN_FRAME_DARK); R(0, 21, 16, 1, WIN_FRAME); R(1, 23, 14, 1, INK);
    R(0, 0, 16, 1, WIN_FRAME);
  });

  M('prop-school', 64, 48, ({ R, P, D }) => {
    // wings
    R(0, 20, 64, 28, SCH_WALL); R(0, 20, 64, 2, SCH_TRIM);
    R(0, 20, 64, 1, SCH_ROOF); R(0, 47, 64, 1, SCH_WALL_DARK);
    // flat roof edge
    R(0, 17, 22, 3, SCH_ROOF); R(42, 17, 22, 3, SCH_ROOF); R(0, 17, 22, 1, SCH_ROOF_LIGHT); R(42, 17, 22, 1, SCH_ROOF_LIGHT);
    // central block + tower
    R(20, 14, 24, 34, SCH_WALL); R(20, 14, 24, 2, SCH_TRIM);
    R(25, 3, 14, 12, SCH_WALL_DARK); R(24, 12, 16, 3, SCH_TRIM);
    // tower roof
    for (let i = 0; i < 7; i++) R(32 - 2 - i, 3 - 0, 0, 0, SCH_ROOF);
    for (let i = 0; i < 6; i++) R(27 + 0 - i * 0 + (i === 0 ? 0 : 0), 0, 0, 0, SCH_ROOF);
    for (let i = 0; i < 4; i++) R(27 - i, 3 - 0 - 0, 0, 0, SCH_ROOF);
    // pointed roof triangle
    for (let i = 0; i < 6; i++) { const half = 2 + i * 1.8; R(Math.round(32 - half), i, Math.round(half * 2), 1, i < 2 ? SCH_ROOF_LIGHT : SCH_ROOF); }
    // arch and bell
    R(28, 7, 8, 5, INK); R(29, 6, 6, 1, INK);
    D(32, 9, 2, GOLD); P(31, 8, GOLD_LIGHT); P(32, 11, GOLD_DARK);
    P(32, 0, GOLD_LIGHT); // finial ball
    // windows, left & right wings
    const win = (x, y) => { R(x, y, 6, 8, INK); R(x + 1, y + 1, 4, 6, SCH_WIN); R(x + 3, y + 1, 1, 6, INK); R(x + 1, y + 4, 4, 1, INK); };
    [3, 11].forEach(x => { win(x, 26); win(x + 41 + 0, 26); });
    win(3, 26); win(50, 26);
    [2, 10, 50, 56].forEach(x => { R(x, 40, 6, 1, SCH_WALL_DARK); });
    // upper floor center windows
    [23, 29, 35].forEach(x => win(x, 20));
    // door
    R(27, 34, 10, 14, INK); R(28, 35, 8, 13, SCH_DOOR); R(31, 35, 2, 13, INK); P(30, 42, GOLD); P(33, 42, GOLD);
    R(25, 32, 14, 2, SCH_TRIM); R(24, 47, 16, 1, SCH_TRIM);
    // flag-less clock circle above door
    D(32, 28, 2, SCH_TRIM); P(32, 27, INK); P(32, 28, INK); P(33, 28, INK);
    // steps
    R(24, 46, 16, 2, STONE_LIGHT);
  });

  // ================= platforms =================
  M('plat-bus', 48, 24, ({ R, P, D }) => {
    // flat roof slab (walkable top)
    R(0, 0, 48, 3, BUS_ROOF); R(0, 0, 48, 1, WHITE); R(0, 2, 48, 1, BUS_ROOF_DARK);
    // body
    R(0, 3, 48, 18, BUS); R(0, 3, 48, 1, BUS_DARK);
    R(0, 12, 48, 1, WHITE); R(0, 13, 48, 1, BUS_DARK);
    R(0, 20, 48, 1, BUS_DARK);
    R(0, 3, 1, 18, BUS_DARK); R(47, 3, 1, 18, BUS_DARK);
    // upper windows
    for (let i = 0; i < 6; i++) { const x = 3 + i * 7; R(x, 5, 5, 5, INK); R(x + 1, 6, 3, 3, BUS_WINDOW); P(x + 1, 6, WHITE); }
    // passengers (tiny heads)
    P(5, 8, HEART_LIGHT); P(19, 8, GOLD); P(33, 8, '#c0a0f0');
    // lower windows & door
    for (let i = 0; i < 4; i++) { const x = 3 + i * 7; R(x, 15, 5, 4, INK); R(x + 1, 16, 3, 2, BUS_WINDOW); P(x + 1, 16, WHITE); }
    R(31, 14, 7, 7, INK); R(32, 15, 2, 6, BUS_WINDOW_DARK); R(35, 15, 2, 6, BUS_WINDOW_DARK);
    // front (right): windscreen, lamp, destination board
    R(39, 15, 7, 4, INK); R(40, 16, 5, 2, BUS_WINDOW); R(39, 5, 8, 5, INK); R(40, 6, 6, 3, WINDOW_LIT);
    R(41, 7, 1, 1, INK); R(43, 7, 1, 1, INK); R(44, 6, 1, 1, INK);
    R(46, 19, 2, 2, GLOW_LIGHT);
    // wheels
    [[9, 20], [38, 20]].forEach(([cx, cy]) => { D(cx, cy, 3, TIRE); D(cx, cy, 1, HUB); });
    R(0, 21, 48, 0, TIRE);
    // heart sticker
  });

  const tort = (alt) => ({ R, P, D }) => {
    // legs (draw first)
    const leg = (x, up) => { R(x, 10, 4, up ? 2 : 4, TORT_SKIN); R(x, up ? 11 : 13, 4, 1, TORT_SKIN_DARK); };
    leg(6, alt); leg(12, !alt); leg(18, alt); leg(23, !alt);
    // shell dome with flat-ish top
    const rows = [[6, 22], [3, 25], [2, 26], [1, 27], [1, 27], [1, 27], [1, 27], [1, 27], [2, 26], [3, 25]];
    rows.forEach(([a, b], i) => R(a, i, b - a + 1 - 1, 1, TORT_SHELL));
    R(5, 0, 18, 1, TORT_SHELL_LIGHT); R(3, 1, 2, 1, TORT_SHELL_LIGHT);
    R(2, 9, 24, 1, TORT_SHELL_DARK); R(3, 8, 1, 1, TORT_SHELL_DARK);
    // hex pattern
    [[8, 3], [14, 3], [20, 3], [11, 6], [17, 6]].forEach(([x, y]) => { R(x, y, 4, 2, TORT_SHELL_DARK); P(x + 1, y - 0, TORT_SHELL_LIGHT); });
    // head
    R(26, 5, 5, 5, TORT_SKIN); R(30, 6, 1, 3, TORT_SKIN); R(26, 9, 5, 1, TORT_SKIN_DARK);
    P(29, 6, INK); P(30, 7, HEART_LIGHT); R(28, 8, 2, 1, INK);
    // tail
    R(0, 8, 2, 2, TORT_SKIN); P(0, 9, TORT_SKIN_DARK);
  };
  M('plat-tortoise-0', 32, 14, tort(false));
  M('plat-tortoise-1', 32, 14, tort(true));

  M('tile-chocolate', 16, 16, ({ R, P }) => {
    R(0, 0, 16, 16, CHOC_DARK);
    [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(([x, y]) => {
      R(x + 1, y + 1, 7, 7, CHOC); R(x + 1, y + 1, 7, 1, CHOC_LIGHT); R(x + 1, y + 1, 1, 7, CHOC_LIGHT);
      R(x + 7, y + 2, 1, 6, CHOC_DARK); R(x + 2, y + 7, 6, 1, CHOC_DARK);
      R(x + 3, y + 3, 3, 3, '#8c5636'); P(x + 3, y + 3, CHOC_LIGHT);
    });
    R(0, 0, 16, 1, CHOC_LIGHT); R(0, 0, 1, 16, CHOC_LIGHT);
    P(12, 3, GOLD_LIGHT); P(4, 11, GOLD_LIGHT);
  });

  // ================= decor =================
  const seal = (wave) => ({ R, P, D }) => {
    // tail flukes
    R(0, 10, 3, 2, SEAL_DARK); P(0, 9, SEAL_DARK); P(1, 12, SEAL_DARK);
    // body: slanted lying
    const body = [[3, 7, 16], [2, 8, 17], [2, 9, 18], [2, 10, 18], [3, 11, 17], [4, 12, 15]];
    body.forEach(([a, y, b]) => R(a, y, b - a + 1, 1, y >= 11 ? SEAL_DARK : SEAL));
    R(5, 8, 11, 1, SEAL_LIGHT); R(6, 9, 8, 1, SEAL_LIGHT);
    R(7, 11, 8, 1, SEAL_BELLY);
    R(3, 13, 14, 1, SEAL_DARK);
    // neck + head
    R(14, 4, 5, 7, SEAL); R(15, 3, 6, 2, SEAL); R(14, 4, 1, 4, SEAL_LIGHT);
    R(16, 2, 4, 1, SEAL); R(17, 1, 2, 1, SEAL_LIGHT);
    R(19, 5, 4, 4, SEAL); R(20, 4, 3, 1, SEAL); R(22, 6, 2, 3, SEAL_LIGHT);
    P(23, 6, INK); P(23, 5, INK); // nose
    P(18, 4, INK); P(19, 4, INK); // closed happy eye
    P(18, 3, INK);
    P(20, 8, INK); P(21, 8, HEART_LIGHT);
    // whiskers
    P(23, 8, WHITE); P(23, 9, WHITE); P(22, 9, WHITE);
    // front flipper
    if (!wave) { R(11, 9, 5, 2, SEAL_DARK); P(10, 10, SEAL_DARK); }
    else { R(12, 5, 2, 5, SEAL_DARK); R(11, 3, 2, 3, SEAL_DARK); P(11, 2, SEAL_DARK); }
  };
  M('deco-sealion-0', 24, 14, seal(false));
  M('deco-sealion-1', 24, 14, seal(true));

  const iguana = (bob) => ({ R, P }) => {
    const hy = bob ? 0 : 1;
    // tail
    R(0, 6, 4, 1, IGUANA); R(3, 5, 4, 2, IGUANA); P(0, 7, IGUANA);
    // body
    R(5, 3, 7, 4, IGUANA); R(6, 2, 5, 1, IGUANA_LIGHT);
    for (let x = 5; x < 11; x += 2) P(x, 1, IGUANA_SPIKE);
    P(6, 2, IGUANA_SPIKE); P(8, 2, IGUANA_SPIKE); P(10, 2, IGUANA_SPIKE);
    // legs
    R(6, 7, 2, 1, IGUANA); R(10, 7, 2, 1, IGUANA); P(5, 7, IGUANA_LIGHT); P(12, 7, IGUANA_LIGHT);
    // head
    R(11, 3 + hy - 1, 5, 4, IGUANA); R(12, 2 + hy - 1, 3, 1, IGUANA_LIGHT);
    P(13, 3 + hy - 1, WHITE); P(14, 3 + hy - 1, INK);
    P(15, 5 + hy - 1, IGUANA_LIGHT); P(13, 6 + hy - 1, IGUANA_LIGHT); // chin
    R(11, 6 + hy - 1, 1, 1, IGUANA_SPIKE);
  };
  M('deco-iguana-0', 16, 8, iguana(false));
  M('deco-iguana-1', 16, 8, iguana(true));

  // ================= NPC cop =================
  const cop = (hand) => ({ R, P }) => {
    // cap
    R(3, 0, 10, 3, COP_CAP); R(3, 0, 10, 1, COP_CAP_LIGHT); R(2, 3, 12, 2, COP_CAP); R(1, 4, 3, 1, INK); R(2, 4, 12, 1, INK);
    P(7, 1, COP_BADGE); P(8, 1, COP_BADGE); P(7, 2, GOLD_DARK);
    // head
    R(3, 5, 10, 7, COP_SKIN); R(3, 5, 1, 7, COP_SKIN_DARK); R(12, 6, 1, 6, COP_SKIN_DARK);
    R(5, 7, 1, 2, INK); R(10, 7, 1, 2, INK); P(5, 7, WHITE); P(10, 7, WHITE);
    R(7, 8, 2, 2, COP_SKIN_DARK);
    // mustache
    R(3, 10, 4, 2, COP_MUSTACHE); R(9, 10, 4, 2, COP_MUSTACHE); R(6, 10, 4, 1, COP_MUSTACHE); P(2, 11, COP_MUSTACHE); P(13, 11, COP_MUSTACHE);
    P(8, 12, COP_SKIN_DARK);
    // torso
    R(3, 13, 10, 8, COP_SHIRT); R(3, 13, 1, 8, COP_SHIRT_DARK); R(12, 13, 1, 8, COP_SHIRT_DARK);
    R(7, 13, 2, 1, WHITE);
    for (let y = 15; y < 21; y += 2) P(8, y, GOLD);
    R(4, 15, 2, 2, COP_BADGE); // chest badge
    R(3, 20, 10, 2, COP_BELT); P(8, 20, GOLD);
    // arms
    R(1, 14, 2, 7, COP_SHIRT); P(1, 21, COP_SKIN);
    if (!hand) { R(13, 14, 2, 7, COP_SHIRT); P(14, 21, COP_SKIN); P(13, 21, COP_SKIN); }
    else { R(13, 15, 3, 2, COP_SHIRT); R(15, 14, 1, 4, COP_SKIN); R(14, 17, 2, 1, COP_SKIN); P(15, 13, COP_SKIN); P(13, 14, COP_SHIRT); }
    // legs
    R(4, 22, 3, 5, COP_PANTS); R(9, 22, 3, 5, COP_PANTS); R(7, 22, 2, 2, COP_PANTS);
    R(3, 26, 4, 2, INK); R(9, 26, 4, 2, INK);
  };
  M('npc-cop-0', 16, 28, cop(false));
  M('npc-cop-1', 16, 28, cop(true));

  // ================= enemies =================
  const ghost = (f) => ({ R, P, D }) => {
    // hooded cloak
    const rows = [[5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14], [1, 14]];
    rows.forEach(([a, b], y) => R(a, y, b - a + 1, 1, GHOST));
    R(5, 0, 6, 1, GHOST_LIGHT); R(3, 1, 3, 1, GHOST_LIGHT); R(2, 2, 2, 1, GHOST_LIGHT);
    for (let y = 3; y < 17; y += 4) P(1, y + 4, GHOST_LIGHT);
    // wavy hem
    const hem = f ? [0, 1, 0, 1, 0, 1, 0, 1] : [1, 0, 1, 0, 1, 0, 1, 0];
    for (let i = 0; i < 8; i++) { R(1 + i * 2, 18, 2, 3 + hem[i], GHOST); if (hem[i]) P(1 + i * 2, 20 + 1, GHOST_LIGHT); }
    R(1, 18, 14, 1, GHOST);
    // face hole
    R(3, 4, 10, 8, GHOST_FACE); R(4, 3, 8, 1, GHOST_FACE); R(4, 12, 8, 1, GHOST_FACE);
    // oversized eyes
    D(5, 8, 3, EYE); D(10, 8, 3, EYE);
    // binoculars barrels
    R(2, 6, 7, 5, BINO); R(7, 6, 7, 5, BINO); R(1, 7, 1, 3, BINO); R(14, 7, 1, 3, BINO);
    R(2, 6, 5, 1, BINO_LIGHT); R(9, 6, 5, 1, BINO_LIGHT);
    R(7, 8, 2, 1, INK); // bridge
    R(3, 7, 3, 3, LENS); R(10, 7, 3, 3, LENS);
    P(3, 7, WHITE); P(10, 7, WHITE);
    P(4, 8, INK); P(5, 8, INK); P(11, 8, INK); P(12, 8, INK);
    // brows (curious)
    R(3, 4, 4, 1, GHOST_LIGHT); R(9, f ? 3 : 4, 4, 1, GHOST_LIGHT);
    // hands holding binoculars
    R(2, 12, 3, 2, GHOST_LIGHT); R(11, 12, 3, 2, GHOST_LIGHT);
  };
  M('enemy-ghost-0', 16, 24, ghost(false));
  M('enemy-ghost-1', 16, 24, ghost(true));

  const germ = (f) => ({ R, P }) => {
    const sq = f ? 1 : 0;
    // blob with bumps
    const rows = [[4, 9], [2, 11], [1, 12], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13], [1, 12], [2, 11]];
    rows.forEach(([a, b], i) => R(a - (f && i > 3 ? 0 : 0), 1 + i + sq, b - a + 1, 1, GERM));
    R(5, 1 + sq, 4, 1, GERM_LIGHT); R(2, 3 + sq, 2, 1, GERM_LIGHT);
    // spikes
    P(2, 1 + sq, GERM); P(11, 1 + sq, GERM); P(0, 3 + sq, GERM_DARK); P(13, 3 + sq, GERM_DARK);
    R(2, 12 + sq - sq, 3, 1 + (f ? 0 : 1), GERM_DARK); R(9, 12, 3, 1 + (f ? 0 : 1), GERM_DARK);
    R(3, 11 + sq, 8, 1, GERM_DARK);
    // spots
    R(2, 6 + sq, 2, 2, GERM_SPOT); R(10, 8 + sq, 2, 2, GERM_SPOT); R(9, 3 + sq, 1, 1, GERM_SPOT); R(6, 10 + sq, 2, 1, GERM_SPOT);
    // face grumpy
    R(3, 5 + sq, 3, 3, WHITE); R(8, 5 + sq, 3, 3, WHITE);
    R(4, 6 + sq, 2, 2, INK); R(8, 6 + sq, 2, 2, INK);
    R(3, 4 + sq, 3, 1, INK); P(5, 5 + sq, INK); R(8, 4 + sq, 3, 1, INK); P(8, 5 + sq, INK);
    R(5, 9 + sq, 4, 1, INK); P(4, 10 + sq, INK); P(9, 10 + sq, INK);
  };
  M('enemy-germ-0', 14, 14, germ(false));
  M('enemy-germ-1', 14, 14, germ(true));

  const food = (f) => ({ R, P }) => {
    const y0 = f ? 4 : 3;
    // stink lines
    const wav = (x, off) => { for (let i = 0; i < 4; i++) P(x + ((i + off) % 2), i, i % 2 ? STINK : STINK_DARK); };
    wav(4, f ? 1 : 0); wav(8, f ? 0 : 1); wav(12, f ? 1 : 0);
    // empanada half-moon
    const rows = [[3, 12], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [3, 12]];
    rows.forEach(([a, b], i) => R(a, y0 + i, b - a + 1, 1, EMP));
    R(3, y0, 10, 1, EMP_LIGHT); R(1, y0 + 1, 2, 1, EMP_LIGHT);
    R(1, y0 + 7, 14, 1, EMP_DARK); R(3, y0 + 8, 10, 1, EMP_DARK);
    // crimp
    for (let x = 2; x < 15; x += 2) P(x, y0 + 7, EMP_LIGHT);
    // sad face
    R(4, y0 + 2, 2, 2, INK); R(10, y0 + 2, 2, 2, INK); P(4, y0 + 2, WHITE); P(10, y0 + 2, WHITE);
    R(3, y0 + 1, 3, 1, EMP_DARK); R(10, y0 + 1, 3, 1, EMP_DARK);
    R(6, y0 + 5, 4, 1, INK); P(5, y0 + 6, INK); P(10, y0 + 6, INK);
    P(5, y0 + 4, TEAR); P(5, y0 + 5, TEAR);
    R(12, y0 + 4, 1, 1, EMP_DARK);
  };
  M('enemy-food-0', 16, 14, food(false));
  M('enemy-food-1', 16, 14, food(true));

  const cold = (f) => ({ R, P }) => {
    const y = f ? 1 : 0;
    const rows = [[5, 10], [3, 12], [1, 14], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [1, 14], [3, 12]];
    // puffy cloud body
    R(3, 3 + y, 4, 2, COLD); R(8, 2 + y, 5, 3, COLD); R(5, 1 + y, 5, 2, COLD);
    rows.forEach(([a, b], i) => R(a, 3 + y + i, b - a + 1, 1, COLD));
    R(5, 1 + y, 4, 1, COLD_LIGHT); R(2, 4 + y, 2, 1, COLD_LIGHT); R(10, 3 + y, 2, 1, COLD_LIGHT);
    R(2, 12 + y, 12, 1, COLD_DARK); R(4, 13 + y, 8, 1, COLD_DARK); R(0, 10 + y, 1, 2, COLD_DARK); R(15, 10 + y, 1, 2, COLD_DARK);
    // snowflake on forehead
    const sx = 8, sy = 3 + y;
    P(sx, sy, FLAKE); P(sx, sy + 4, FLAKE); P(sx - 2, sy + 2, FLAKE); P(sx + 2, sy + 2, FLAKE);
    P(sx, sy + 1, FLAKE); P(sx, sy + 3, FLAKE); P(sx - 1, sy + 2, FLAKE); P(sx + 1, sy + 2, FLAKE); P(sx, sy + 2, '#ffffff');
    // grumpy face
    R(3, 7 + y, 3, 3, INK); R(10, 7 + y, 3, 3, INK); P(4, 7 + y, WHITE); P(11, 7 + y, WHITE);
    P(2, 6 + y, INK); P(3, 6 + y, INK); P(4, 6 + y, COLD_DARK); P(12, 6 + y, INK); P(13, 6 + y, INK);
    R(6, 11 + y, 4, 1, INK); P(5, 12 + y, INK); P(10, 12 + y, INK);
    R(1, 9 + y, 1, 1, '#ffb0c0'); R(14, 9 + y, 1, 1, '#ffb0c0');
  };
  M('enemy-cold-0', 16, 16, cold(false));
  M('enemy-cold-1', 16, 16, cold(true));

  // ================= boss: living fire =================
  const fireFrame = (variant) => ({ ctx, R, P }) => {
    const tongues = [
      // cx, tip y, half-base, lean
      [[14, 14, 7, -2], [25, 3, 8, -1], [37, 0, 8, 1], [48, 9, 7, 2], [32, 8, 10, 0]],
      [[13, 10, 7, -2], [24, 6, 8, 1], [38, 3, 8, -1], [49, 14, 7, 2], [32, 2, 10, 1]],
      [[15, 16, 7, -1], [27, 0, 8, -2], [36, 6, 8, 2], [47, 6, 7, 1], [31, 6, 10, -1]],
    ][variant];
    const inside = (x, y, s) => {
      const cx = 32, cy = 42;
      const px = cx + (x - cx) / s, py = cy + (y - cy) / s;
      const dx = px - 32, dy = py - 41;
      if (dx * dx + dy * dy <= 22 * 22) return true;
      for (const [tx, ty, hb, lean] of tongues) {
        if (py < ty || py > 36) continue;
        const t = (py - ty) / (36 - ty);
        const half = hb * Math.pow(t, 0.85);
        const c = tx + lean * (1 - t) * 3;
        if (Math.abs(px - c) <= half) return true;
      }
      return false;
    };
    const wob = (variant === 1 ? 1 : 0);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      if (!inside(x, y, 1)) continue;
      let col = FIRE_OUT;
      if (inside(x, y, 0.8)) col = FIRE_MID;
      if (inside(x, y + 4, 0.52)) col = FIRE_IN;
      // outline
      if (!inside(x - 1, y, 1) || !inside(x + 1, y, 1) || !inside(x, y - 1, 1) || !inside(x, y + 1, 1)) col = FIRE_DARK;
      P(x, y, col);
    }
    // face
    // eyes
    const ey = 36 + (variant === 2 ? 1 : 0);
    R(19, ey - 2, 11, 12, '#ffffff'); R(34, ey - 2, 11, 12, '#ffffff');
    R(20, ey - 3, 9, 1, '#ffffff'); R(35, ey - 3, 9, 1, '#ffffff');
    R(20, ey + 10, 9, 1, '#ffffff'); R(35, ey + 10, 9, 1, '#ffffff');
    const pu = variant === 1 ? 1 : 0;
    R(23 + pu, ey + 2, 5, 6, INK); R(38 + pu, ey + 2, 5, 6, INK);
    R(24 + pu, ey + 3, 2, 2, '#ffffff'); R(39 + pu, ey + 3, 2, 2, '#ffffff');
    // brows (comic angry, tilted)
    for (let i = 0; i < 7; i++) { R(19 + i, ey - 6 + Math.floor(i / 2), 1, 2, FIRE_DARK); R(44 - i, ey - 6 + Math.floor(i / 2), 1, 2, FIRE_DARK); }
    // open mouth
    R(24, 51, 16, 7, MOUTH); R(26, 58, 12, 1, MOUTH); R(23, 50, 18, 1, MOUTH);
    R(24, 51, 16, 1, '#ffffff'); R(27, 52, 2, 1, '#ffffff'); R(35, 52, 2, 1, '#ffffff');
    R(28, 55, 8, 3, TONGUE); R(29, 54, 6, 1, TONGUE); R(31, 56, 2, 1, '#d84a60');
    // cheeks
    R(15, 46, 3, 2, '#ff9a8a'); R(46, 46, 3, 2, '#ff9a8a');
    // sparks
    P(6, 20 + wob * 2, FIRE_IN); P(58, 26 - wob * 3, FIRE_IN); P(8, 16, FIRE_MID); P(56, 30 + wob, FIRE_MID);
  };
  M('boss-fire-0', 64, 64, fireFrame(0));
  M('boss-fire-1', 64, 64, fireFrame(1));
  M('boss-fire-2', 64, 64, fireFrame(2));

  M('boss-ember', 6, 6, ({ A }) => A([
    '..oo..', '.oYYo.', 'oYWWYo', 'oYWYOo', '.oOOo.', '..oo..',
  ], { o: FIRE_DARK, Y: FIRE_IN, W: FIRE_CORE, O: FIRE_MID }));

  M('fx-cloud', 32, 16, ({ R, P, D }) => {
    D(9, 10, 4, CLOUD); D(16, 7, 6, CLOUD); D(24, 10, 5, CLOUD); R(6, 10, 22, 5, CLOUD);
    R(5, 13, 24, 2, CLOUD_SHADE); R(7, 15, 20, 1, CLOUD_SHADE);
    R(12, 2, 5, 1, WHITE); P(5, 8, WHITE);
    R(11, 9, 2, 3, INK); R(19, 9, 2, 3, INK); P(11, 9, WHITE); P(19, 9, WHITE);
    R(14, 12, 4, 1, INK); P(13, 11, INK); P(18, 11, INK);
    R(8, 12, 2, 1, '#ffb0c0'); R(22, 12, 2, 1, '#ffb0c0');
  });

  M('fx-rain', 2, 5, ({ R, P }) => { P(1, 0, RAIN_LIGHT); R(0, 1, 2, 3, RAIN); P(0, 1, RAIN_LIGHT); P(1, 4, RAIN); });

  M('fx-glow', 16, 16, ({ ctx }) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5) / 8;
      if (d >= 1) continue;
      const a = Math.pow(1 - d, 1.3);
      const t = Math.min(1, d * 1.4);
      const c = GLOW_GOLD.map((g, i) => Math.round(g * (1 - t) + GLOW_PURPLE[i] * t));
      const q = Math.round(a * 4) / 4; // pixel-art banded alpha
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(q * 0.9).toFixed(2)})`;
      ctx.fillRect(x, y, 1, 1);
    }
  });

  M('fx-sparkle-0', 5, 5, ({ R, P }) => { R(2, 0, 1, 5, SPARKLE); R(0, 2, 5, 1, SPARKLE); P(2, 2, SPARKLE_CORE); });
  M('fx-sparkle-1', 5, 5, ({ P }) => {
    [[0, 0], [4, 0], [0, 4], [4, 4], [1, 1], [3, 1], [1, 3], [3, 3]].forEach(([x, y]) => P(x, y, SPARKLE)); P(2, 2, SPARKLE_CORE);
    P(2, 0, SPARKLE_CORE); P(2, 4, SPARKLE_CORE); P(0, 2, SPARKLE_CORE); P(4, 2, SPARKLE_CORE);
  });

  M('fx-heart', 7, 6, ({ A }) => A([
    '.hh.hh.', 'hHHhHHh', 'hHHHHHh', '.hHHHh.', '..hHh..', '...h...',
  ], { h: INK, H: HEART }));

  // ================= London (Andrew: she grew up in London) =================
  // Chicken shop box: red and white striped carton with a drumstick.
  M('item-chicken', 12, 12, ({ A }) => A([
    '.......oo...',
    '......oDDo..',
    '.....oDdDo..',
    '..ooooDDoooo',
    '.oRWRWoBoRWo',
    '.oRWRWRWRWRo'.slice(0, 12),
    '.oRWRWRWRWRo',
    '.oRWRWRWRWRo',
    '.oRWRWRWRWRo',
    '.ooooooooooo',
    '............',
    '............',
  ], { o: INK, R: '#e23a3a', W: WHITE, D: '#c8823c', d: '#e8a85a', B: '#f0d8b0' }));

  // Peri-peri: a red chilli with a green stem (generic, no restaurant branding).
  M('item-nandos', 12, 12, ({ A }) => A([
    '.......oo...',
    '......oGGo..',
    '.....oGGo...',
    '....oRRo....',
    '...oRrRRo...',
    '..oRrRRRo...',
    '..oRRRRRo...',
    '.oRRRRRo....',
    '.oRRRRo.....',
    'oRRRo.......',
    'ooo.........',
    '............',
  ], { o: INK, R: '#e0302c', r: '#ff7a6a', G: '#4caa3c' }));

  // A London chicken shop front (background decor; the sign text is drawn by the level).
  M('prop-chickenshop', 56, 48, ({ R, P }) => {
    const BRICK = '#8a4a3a', BRICK_D = '#6e3a2e', SIGN = '#d8262a', SIGN_D = '#a01c20';
    const AWN = '#ffffff', AWN_R = '#e23a3a', WIN = '#ffe9a8', WIN_D = '#f0c860', FRAME = '#2a2038';
    R(0, 0, 56, 48, BRICK);
    for (let y = 2; y < 48; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 56; x += 8) R(x, y, 1, 3, BRICK_D);
    for (let y = 1; y < 48; y += 4) R(0, y, 56, 1, BRICK_D);
    // sign board
    R(2, 3, 52, 11, FRAME); R(3, 4, 50, 9, SIGN); R(3, 12, 50, 1, SIGN_D);
    // striped awning
    for (let x = 0; x < 56; x++) R(x, 15, 1, 5, Math.floor(x / 4) % 2 ? AWN : AWN_R);
    for (let x = 0; x < 56; x += 4) R(x + 1, 20, 2, 1, Math.floor(x / 4) % 2 ? AWN : AWN_R);
    // lit window and door
    R(3, 23, 32, 22, FRAME); R(4, 24, 30, 20, WIN); R(4, 36, 30, 8, WIN_D);
    R(18, 24, 1, 20, FRAME);
    R(38, 23, 15, 25, FRAME); R(39, 24, 13, 24, '#5a2e2a'); R(40, 26, 11, 9, WIN); P(49, 38, WIN_D);
    // counter silhouette in the window
    R(5, 38, 28, 2, '#c8823c');
  });
}
