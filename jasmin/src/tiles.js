// Procedural placeholder environment art. No asset files: every texture is drawn
// pixel by pixel onto a canvas texture. Environment colors live in THEMES;
// item/enemy/prop colors live in the named constants below (they never change by theme).

export const THEMES = {
  day: {
    sky: ['#7cc8f0', '#d6f0fb'], ground: '#9a6b44', groundTop: '#5fb04a', brick: '#d9884e',
    accent: '#ef5f7a', hills: '#7fcf86', hills2: '#5eb872', clouds: '#ffffff', stars: false, skyline: false,
  },
  dusk: {
    sky: ['#4c3a8a', '#f4a26b'], ground: '#7a4e50', groundTop: '#9a7a4e', brick: '#c0675a',
    accent: '#ffcf5a', hills: '#7a5aa0', hills2: '#5e4688', clouds: '#f9c4a0', stars: false, skyline: false,
  },
  night: {
    sky: ['#0f1030', '#2b2d63'], ground: '#3d3a5c', groundTop: '#4f6e8a', brick: '#6a5a96',
    accent: '#ffe27a', hills: '#26305a', hills2: '#1b2347', clouds: '#4a4f86', stars: true, skyline: false,
  },
  city: {
    sky: ['#9fb4c8', '#dfe6ea'], ground: '#6b7078', groundTop: '#9aa0a8', brick: '#b5654a',
    accent: '#f2b43a', hills: '#8b97a6', hills2: '#6f7b8b', clouds: '#f2f4f6', stars: false, skyline: true,
  },
  garden: {
    sky: ['#8fd8f5', '#fdf3c8'], ground: '#a87650', groundTop: '#78c850', brick: '#e29a5c',
    accent: '#ff8fb3', hills: '#9bdc8a', hills2: '#74c670', clouds: '#ffffff', stars: false, skyline: false,
  },
  home: {
    sky: ['#f0a878', '#fbe0b0'], ground: '#8a5a3c', groundTop: '#c88a52', brick: '#c9704a',
    accent: '#ffd36b', hills: '#d9966a', hills2: '#bf7a58', clouds: '#fff0d6', stars: false, skyline: false,
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

// ---- main entry ----
export function makeEnvironmentTextures(scene, theme) {
  const T = typeof theme === 'string' ? THEMES[theme] : theme || THEMES.day;
  const mk = (key, w, h, fn) => makeCanvas(scene, key, w, h, fn);

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
  mk('tile-ground', 16, 16, ({ R, P, w, h }) => { dirt(R, P, w, h, 0); });
  mk('tile-ground-top', 16, 16, ({ R, P, w, h }) => {
    dirt(R, P, w, h, 0);
    const g = T.groundTop, gd = shade(g, -0.25), gl = shade(g, 0.28);
    R(0, 0, 16, 4, g);
    R(0, 0, 16, 1, gl);
    // wavy lip hanging into the dirt
    for (let x = 0; x < 16; x++) {
      const drop = [0, 1, 1, 2, 1, 0, 1, 2, 2, 1, 0, 1, 1, 2, 1, 0][x];
      R(x, 4, 1, drop, g);
      P(x, 4 + drop, gd);
    }
    // grass tufts
    P(2, 1, gl); P(6, 2, gd); P(10, 1, gl); P(13, 2, gd);
  });
  mk('tile-brick', 16, 16, ({ R, P }) => {
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
  const TAU = Math.PI * 2;
  mk('bg-hills', 256, 64, ({ R, P }) => {
    const far = T.hills, near = T.hills2 || shade(T.hills, -0.15);
    if (T.skyline) {
      // city skyline: buildings (seamless: widths sum to 256)
      const bw = [24, 16, 32, 20, 28, 16, 24, 20, 32, 24, 20];
      const layers = [[far, 0], [near, 1]];
      layers.forEach(([col, layer]) => {
        let x = layer ? 8 : 0;
        for (let i = 0; i < bw.length; i++) {
          const w = bw[(i + layer * 3) % bw.length];
          const h = 20 + Math.floor(rnd(i, layer, 3) * 28) - layer * 6;
          for (let k = 0; k < w - 2; k++) R((x + k) % 256, 64 - h, 1, h, col);
          // windows
          for (let wy = 64 - h + 4; wy < 60; wy += 6) for (let wx = x + 3; wx < x + w - 5; wx += 5) {
            if (rnd(wx, wy, layer) > 0.45) P(wx % 256, wy, shade(col, 0.28));
          }
          x += w;
        }
      });
      return;
    }
    const col = (base, amp, k, ph, y0) => {
      const out = [];
      for (let x = 0; x < 256; x++) {
        out.push(Math.round(y0 - amp * Math.sin(TAU * k * x / 256 + ph) - amp * 0.45 * Math.sin(TAU * (k * 3) * x / 256 + ph * 2)));
      }
      return out;
    };
    const f = col(far, 9, 2, 0.6, 30), n = col(near, 7, 3, 2.2, 42);
    for (let x = 0; x < 256; x++) {
      R(x, f[x], 1, 64 - f[x], far);
      if (x > 0 && (f[x] < f[x - 1])) P(x, f[x], shade(far, 0.22)); else P(x, f[x], shade(far, 0.1));
      R(x, n[x], 1, 64 - n[x], near);
      P(x, n[x], shade(near, 0.18));
    }
    // tiny bushes / trees on the near layer
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rnd(i, 1, 9) * 250) + 3, y = n[x];
      R(x - 1, y - 3, 3, 3, shade(near, -0.18)); P(x, y - 4, shade(near, -0.18));
    }
  });

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
