# Architecture (contract between modules)

No build step. `index.html` loads `vendor/phaser.min.js` (global `Phaser`, v3.80.1) then `src/main.js` as an ES module. Serve over http (modules do not load from file://): `npx http-server jasmin`.

## Files

| File | Owner | Purpose |
|---|---|---|
| `src/sprites.js` | Andrew | Pixel data + palette. Do not change its exports. |
| `src/frames.js` | art | Builds animation frames for every character from `sprites.js`. Pure data, no Phaser. |
| `src/art.js` | core | Turns frames into Phaser textures + anims. The PNG swap point (`ART_OVERRIDES`). |
| `src/tiles.js` | art | Procedural placeholder textures: tiles, items, enemies, props, backgrounds. |
| `src/audio.js` | audio | WebAudio sfx + music, no asset files. |
| `src/controls.js` | core | Unified keyboard + touch input. |
| `src/maps.js` | levels | ASCII level layouts keyed by level id. |
| `src/scenes/*.js` | core | Boot, Title, WorldMap, Level, Sendoff, Credits. |
| `levels.json` | Andrew | All personal content. |

## Units and physics

- Tile size 16 px. Maps are 15 rows tall. Internal resolution is dynamic: height about 180 to 220 px, width fills the screen, integer zoom.
- Gravity 900 px/s^2. Run speed 130 px/s. Jump velocity 330 (about 3.7 tiles high, about 6 tiles across a flat gap at full speed). Releasing jump early cuts the jump.
- Andrew boost x1.3 (about 6 tiles high). Rabbit hop x1.15 (about 5 tiles). Charm jump (mid-air, once per level, after World 3) x1.5.
- Glide (hat, hold jump while falling): fall speed capped at 45 px/s.

## frames.js contract

```js
// Every frame is a Grid: an array of h rows, each an array of w slot names (or null for transparent).
// Slot names are PALETTE keys from sprites.js ("H", "S", "Rd", ...). Never hex colors.
export function buildFrames(name) // name: "jasmin" | "jasminHat" | "andrew" | "son" | "daughter" | "rabbit"
  -> { w, h, frames: Grid[], anims: { [animName]: { frames: number[], rate: number, repeat: -1|0 } } }
```

Required anims (frame indices into `frames`):
- jasmin, jasminHat: idle(2) run(4) jump(1) fall(1) glide(2) hurt(1) wave(2)
- andrew, son, daughter: idle(2) run(4) jump(1)
- rabbit: idle(2) hop(3)

All frames of one character share the same w and h, sprites face right, feet on the bottom row. Frame sizes may grow by a few px over the base sprite if an animation needs it (e.g. hat lag), but keep the feet on the last row.

## tiles.js contract

```js
export function makeEnvironmentTextures(scene, theme) // creates textures listed below via scene.textures.createCanvas / generateTexture
export const THEMES = { day, dusk, night, city, garden, home } // each: { sky:[top,bottom], ground, groundTop, brick, accent, hills } colors
```
Texture keys (all 16x16 unless noted): `tile-ground`, `tile-ground-top`, `tile-brick`, `tile-oneway` (16x6), `tile-hidden` (outlined ghost of brick), `item-hat`, `item-pen`, `item-collectible` (a small glowing heart/star, 12x12), `item-charm` (10x10), `prop-checkpoint` (16x32, two frames: down/up as separate keys `prop-checkpoint-off`, `prop-checkpoint-on`), `prop-goal` (16x48 pennant on pole, no Nintendo look), `prop-gate-open`, `prop-gate-closed` (32x32 garden gate), `prop-door` (24x40 front door; text drawn separately), `prop-pen-line` (16x4 ink platform), `bg-hills` (256x64 tileable silhouette), `bg-clouds` (128x32).
Enemies, each as a 2 frame strip in separate keys `<name>-0`, `<name>-1`: `enemy-inbox` (flying envelope, 16x12), `enemy-subway` (little delayed train car, 24x16), `enemy-laundry` (laundry pile with sock, 16x16), `enemy-alarm` (6am alarm clock, 16x16).
Colors for environment live in `THEMES` only. Character colors never live here.

## audio.js contract

```js
export const sfx = { jump(), boost(), land(), collect(), hat(), hit(), stomp(), pen(), checkpoint(), win(), gate(), hatch() }
export function startMusic(track) // track: "map" | "level" | "night" | "sendoff" | "credits"
export function stopMusic()
export function unlockAudio() // call on first user gesture
export function setMuted(bool)
```
All original, synthesized with WebAudio. Nothing resembling any Nintendo melody or sound.

## Map legend (maps.js)

```
.  air            #  ground           =  brick (solid)       -  one-way platform
h  hidden block (solid only after the son reveals it)
*  collectible slot (filled in order from levels.json)       H  witch hat
p  pen pickup (+3 pen uses)      k  checkpoint     S  spawn   F  goal pennant
G  garden gate (send-off)        D  "next level" door        E  egg hatch spot
i  inbox enemy (flies, patrols)  t  subway enemy (walks)     l  laundry (hops)   a  alarm (hops)
r  the other rabbit (send-off yard)
```

## Content

`levels.json` collectibles: if `x`/`y` are both 0 the collectible goes in the next `*` slot of the map, otherwise it is placed at tile `(x, y)`. Missing text shows `TODO: caption`. Never invent personal content.
