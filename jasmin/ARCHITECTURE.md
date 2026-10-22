# Architecture (contract between modules)

Spec: `CLAUDE.md`. Progress log: `PROGRESS.md`.

No build step. `index.html` loads Phaser 3.80.1 from jsDelivr with a local fallback (`vendor/phaser.min.js`), then `src/main.js` as an ES module. Serve over http: `npx http-server jasmin`.

## Files

| File | Purpose |
|---|---|
| `src/sprites.js` | Andrew's pixel data + palette. Only additions: `Ol`, `Kc`, `Kh` slots. |
| `src/frames.js` | Animation frames per character (pure data, no Phaser). |
| `src/art.js` | Frames to Phaser textures + anims; PNG swap point (`ART_OVERRIDES`). |
| `src/tiles.js` | Per-theme environment: tiles, sky, background layers. |
| `src/props.js` | Theme-independent textures: items, props, NPC props, enemies, boss, fx. |
| `src/logo.js` | Title logo texture. |
| `src/font.js` | Pixel fonts (`px` small, `px-big` titles), white with baked outline, tintable. |
| `src/ui.js` | UI state + API (captions, banners, HUD, labels, name entry). No drawing. |
| `src/scenes/UI.js` | Overlay scene that draws `ui.js` state in pixels at game scale; always on top. |
| `src/audio.js` | WebAudio sfx + music. |
| `src/maps.js` | ASCII level layouts. |
| `src/content.js` | Reads `levels.json` (captions may be strings or `{text, draft}`). |
| `src/scenes/*.js` | Boot, Title, Intro (Nairobi), WorldMap, Level, Boss, Ending, Credits. |

## Units and physics

Tile 16 px. Gravity 900. Run 130 px/s. Jump 330 (about 3.7 tiles high, 5 tiles across comfortably). Andrew boost x1.3 (about 6 tiles high, only from a standstill with Andrew huddled next to her). Rupert x1.15. Charm (after Chinatown) one mid-air jump x1.5 per level. Glide caps fall at 45 px/s. Ice (Minneapolis): low traction.

## Characters (frames.js)

`buildFrames(name)` -> `{ w, h, frames: Grid[], anims: { name: { frames, rate, repeat } } }`. Grid = rows of PALETTE slot names or null.

| name | anims |
|---|---|
| jasmin, jasminHat | idle 2, run 4, jump 1, fall 1, glide 2, hurt 1, wave 2, write 2 |
| jasminCloak (ghost cloak: drab hooded cloak, slots `Kc`/`Kh`, covers hair and outfit, face visible) | idle 2, run 4, jump 1, fall 1, hurt 1 |
| andrew, isaac, aya, nube | idle 2, run 4, jump 1 |
| rupert | idle 2, hop 3 |
| tim | idle 2, wave 2 |

## Map legend (maps.js)

Each map: `{ theme, music, rows, ice?, segments? }`. Rows: at least 15, all maps same height within one level, walking surface usually 3 rows above the bottom.

```
.  air            #  ground          =  brick           -  one-way platform     w  water (swim)
h  hidden block (solid once Isaac/Jennifer is near)
*  collectible slot (filled in order from levels.json collectibles)
$  passport stamp slot (South America: one per segment, filled in segment order)
H  witch hat      p  pen pickup (+3)      k  checkpoint     S  spawn     F  goal pennant
G  garden gate    r  the other rabbit (send-off yard)
i  inbox   t  subway   l  laundry   a  alarm   e  germ   f  bad food   n  cold snap    (enemies)
g  binocular ghost (Minneapolis)   b  hiding spot   X  exit sign (ghosts end here)
P  lake picnic (Andrew joins, level turns to night)
R  Rupert joins   I  Isaac joins   Y  Aya joins   N  Nube joins
u  bus moving platform   o  tortoise moving platform   L  sea lion (decor)   Q  iguana (decor)
c  cop (Mexico, Andrew pays)   T  Tim (waves)   C  candlelit hut (proposal cutscene)
B  boss door (end of 7-1, starts the fire boss)
Boss arena only:  V  valve (hidden until Isaac is near)   Z  fire boss
```

`segments: [{ col, theme, country }]` switches theme (sky, background, tint) when Jasmin passes `col`.

## Themes (tiles.js)

`THEMES[name]`: `{ sky:[top,bottom], ground, groundTop, brick, accent, hills, hills2, clouds, bg }` where `bg` picks the background silhouette style. `makeEnvironmentTextures(scene, themeOrName)` (re)creates: `tile-ground`, `tile-ground-top`, `tile-brick`, `tile-oneway`, `tile-hidden`, `tile-water`, `bg-hills` (256x64), `bg-clouds` (128x32), plus `bg-far` (256x96, a farther silhouette layer). Per-theme textures only; never characters.

Theme names: nairobi, london, minneapolis, minneapolisNight, chicago, chinatown, garden, mexico, panama, colombia, galapagos, chile, argentina, brazil, brooklyn, building, fire (plus the older day, dusk, night, city, home).

## Props (props.js)

`makePropTextures(scene)` creates once (theme independent). Keys listed in the props brief inside the file header.
