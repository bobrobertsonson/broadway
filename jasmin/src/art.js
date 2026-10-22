// Turns character frames into Phaser textures and animations.
//
// Gameplay only ever uses texture keys from charKey() and anim keys from animKey(),
// so any character can be swapped for a PNG sprite sheet by adding an entry to
// ART_OVERRIDES. Example (Aseprite export, frames in one row):
//
//   andrew: { url: "assets/andrew.png", frameWidth: 24, frameHeight: 31,
//             anims: { idle: { frames: [0, 1], rate: 3, repeat: -1 },
//                      run: { frames: [2, 3, 4, 5], rate: 10, repeat: -1 },
//                      jump: { frames: [6], rate: 1, repeat: 0 } } },
//
// For "jasmin" and "jasminHat" an override replaces every outfit (no palette swap).

import { PALETTE, OUTFITS } from "./sprites.js";
import { buildFrames } from "./frames.js";

export const ART_OVERRIDES = {};

const COMPANIONS = ["andrew", "rabbit", "son", "daughter", "sonFree"];

// Derived characters: built from another character's frames with some slots removed.
const DERIVED = {
  sonFree: { from: "son", drop: ["L", "l", "A"] }, // the son after the egg hatches
};

function framesFor(name) {
  const d = DERIVED[name];
  if (!d) return buildFrames(name);
  const f = buildFrames(d.from);
  return { ...f, frames: f.frames.map((g) => g.map((row) => row.map((c) => (d.drop.includes(c) ? null : c)))) };
}

export function charKey(name, { outfit = "black", outline = false } = {}) {
  const base = name === "jasmin" || name === "jasminHat" ? `char-${name}-${outfit}` : `char-${name}`;
  return outline ? `${base}-o` : base;
}

export function animKey(texKey, anim) {
  return `${texKey}:${anim}`;
}

// Called from Boot.preload.
export function preloadArtOverrides(scene) {
  for (const [name, o] of Object.entries(ART_OVERRIDES)) {
    scene.load.spritesheet(`override-${name}`, o.url, { frameWidth: o.frameWidth, frameHeight: o.frameHeight });
  }
}

// outfits: { name: paletteOverride }. Builds every character, plain and outlined.
export function buildCharacterArt(scene, outfits) {
  for (const name of COMPANIONS) {
    buildOne(scene, name, PALETTE, charKey(name), false);
    buildOne(scene, name, PALETTE, charKey(name, { outline: true }), true);
  }
  for (const [outfit, pal] of Object.entries(outfits)) {
    const palette = { ...PALETTE, ...pal };
    for (const name of ["jasmin", "jasminHat"]) {
      buildOne(scene, name, palette, charKey(name, { outfit }), false);
      buildOne(scene, name, palette, charKey(name, { outfit, outline: true }), true);
    }
  }
}

// Merges outfits from sprites.js with the ones unlocked in levels.json.
export function collectOutfits(content) {
  const out = {};
  for (const [name, pal] of Object.entries(OUTFITS)) out[name] = pal;
  for (const w of content.worlds || []) {
    const u = w.outfitUnlock;
    if (u && u.name) out[u.name] = { ...(OUTFITS[u.name] || OUTFITS.black), ...(u.palette || {}) };
  }
  return out;
}

function buildOne(scene, name, palette, key, outline) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const o = ART_OVERRIDES[name];
  if (o && scene.textures.exists(`override-${name}`)) {
    // Reuse the loaded sheet under this key (outline is skipped for hand-made art).
    const src = scene.textures.get(`override-${name}`).getSourceImage();
    scene.textures.addSpriteSheet(key, src, { frameWidth: o.frameWidth, frameHeight: o.frameHeight });
    registerAnims(scene, key, o.anims);
    return;
  }

  const { w, h, frames, anims } = framesFor(name);
  const pad = outline ? 1 : 0;
  const fw = w + pad * 2, fh = h + pad * 2;
  const tex = scene.textures.createCanvas(key, fw * frames.length, fh);
  const ctx = tex.getContext();
  frames.forEach((grid, i) => {
    const ox = i * fw + pad, oy = pad;
    if (outline) drawOutline(ctx, grid, ox, oy, palette.Ol);
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const slot = row[x];
        if (!slot) continue;
        ctx.fillStyle = palette[slot];
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
    tex.add(i, 0, i * fw, 0, fw, fh);
  });
  tex.refresh();
  registerAnims(scene, key, anims);
}

function drawOutline(ctx, grid, ox, oy, color) {
  ctx.fillStyle = color;
  const filled = (x, y) => y >= 0 && y < grid.length && x >= 0 && x < grid[y].length && !!grid[y][x];
  for (let y = -1; y <= grid.length; y++) {
    for (let x = -1; x <= (grid[0]?.length ?? 0); x++) {
      if (filled(x, y)) continue;
      if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
        ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    }
  }
}

function registerAnims(scene, key, anims) {
  for (const [anim, a] of Object.entries(anims)) {
    const k = animKey(key, anim);
    if (scene.anims.exists(k)) scene.anims.remove(k);
    scene.anims.create({
      key: k,
      frames: a.frames.map((f) => ({ key, frame: f })),
      frameRate: a.rate,
      repeat: a.repeat,
    });
  }
}
