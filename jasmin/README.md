# Super Jasmin World 3: A New Magic

## Play it locally

```
npx http-server . -p 8080 -c-1
```

Open http://localhost:8080. On a phone on the same Wi-Fi: `http://<your-computer-ip>:8080`.

Test shortcuts: `?level=5-1` jumps into a level, `?level=7-1&map=7-boss` into the fire boss, `?scene=Ending` or `?scene=Credits` into those scenes.

**Character gallery:** open `gallery.html` (e.g. http://localhost:8080/gallery.html) to see every character, outfit, enemy and NPC playing all of its animations, drawn exactly as the game draws them. Useful after editing `sprites.js` or swapping in Aseprite sheets.

Powers: every level offers one power besides the witch hat, and the action button (X, the pad's left face button, or the on-screen button) uses it. A new pickup replaces the old one; powers are kept on death.
- **Pen:** writes a short platform (limited ink).
- **Magic spark:** throws a sparkle that knocks out pests and smashes cracked bricks.
- **Dash:** a quick sideways burst, in the air too; smashes cracked bricks and bowls over pests.
- **Bullshitometer:** a needle in the top bar that rises near anything fake (floors that crumble, collectibles that bite). Press the button to call it out: fakes are marked for a few seconds.

Cracked bricks also break when she jumps into them from below. Each level hides secrets (wrapped sweets); the world map shows how many were found. `?level=1-1&map=x-test` opens a small playground with every power and trick.

Controls:
- **Keyboard:** arrows or A/D to move, Space/Up/Z to jump (hold to glide with the hat), X or Shift for the power, Enter or P to pause, Esc for the map, M to mute.
- **Gamepad** (any standard-mapping pad, through Phaser's gamepad plugin): d-pad or left stick to move, A to jump (hold to glide), X for the pen, Start to pause (and to confirm in menus), B for the map while paused. When naming World 9, an on-screen letter grid appears: d-pad to move, A to type, X to delete, Start to finish. Browsers only expose a pad after one of its buttons has been pressed on the page.
- **Phone:** on-screen buttons appear automatically.

On a TV or any big screen the game picks the largest whole-number zoom in real screen pixels, so pixels stay square and sharp: a 1920x1080 screen shows 320x180 game pixels at exactly 6x. Captions and menus scale up with the screen. For a true full screen on a TV browser, use the browser's own full-screen mode.

Progress is saved in the browser. Reset: run `localStorage.clear()` in the browser console.

## Playing on a TV from a Mac (HDMI + controller)

**Easiest: double-click `Play on TV.command`** (in the game folder). It opens `Super Jasmin World 3.html` (the whole game in one file) in Google Chrome full screen with sound allowed, so the controller works straight away with no key press. Nothing to install: no Python, no Node, no internet. Quit with Cmd+Q. Chrome opens on the Mac's main display, so first make the TV the main display: System Settings > Displays > Arrange, then drag the menu bar onto the TV. If macOS says it can't open the file, right-click it > Open once.

**Even simpler:** double-click `Super Jasmin World 3.html` itself. It opens in the default browser (Chrome is best); press F for full screen and click once so sound can start.

The single file is built from the source: after changing anything in `src/` or `levels.json`, run `node tools/build-single.mjs` to rebuild it.

Setup, once, in this order:

1. **Display: extend, don't mirror.** System Settings > Displays: use the TV as a separate display (not "Mirror"), at its native resolution ("Default for display" or 1080p). Mirroring makes macOS rescale the picture and the pixel art goes soft.
2. **TV picture size:** set the TV's HDMI input to "Just Scan", "Screen Fit", "PC" or "1:1" (the name varies by brand). Otherwise the TV crops the edges. The HUD keeps a 3.5% margin on large screens just in case.
3. **Sound to the TV:** System Settings > Sound > Output > the TV.
4. **Controller:** pair it in System Settings > Bluetooth (Xbox, PlayStation and Switch Pro controllers all work on recent macOS). On-screen button names follow the controller: A/X on Xbox, ✕/□ on PlayStation, B/Y on Switch.
5. **Browser:** Chrome or Safari. Open the game, drag the window onto the TV, then press **F** (or click the corner button) for full screen.
6. **Press one key or click once on the Mac.** Browsers don't let a controller button start sound or full screen, so the F press (or any click) does it. After that, the controller is enough.
7. **Keep the game window focused.** Clicking on the Mac's own screen can stop controller input. The game pauses itself when that happens; press Start to resume.

The game asks the browser to keep the screen awake while it's open. Esc in full screen only leaves full screen; it doesn't also quit the level.

## Put it online (GitHub Pages)

Repo Settings > Pages > Deploy from a branch > pick the branch and `/ (root)`. The game is then at `https://<user>.github.io/<repo>/`. Its pages carry a `noindex` tag so search engines skip them even if the link leaks.

## What to edit

| You want to change | Edit |
|---|---|
| Captions, titles, skills, credits, outfit names | `levels.json` (set `"draft": false` once approved) |
| Outfit colors | a `palette` object in `levels.json` (slots C, c, P, K), or `DEFAULT_OUTFIT_PALETTES` in `src/content.js` |
| Level layouts | `src/maps.js` (legend in `ARCHITECTURE.md`) |
| Character pixels and palette | `src/sprites.js` |
| Swap a character for an Aseprite sheet | `ART_OVERRIDES` in `src/art.js` (example in the comment) |
| City looks, tiles, backgrounds | `THEMES` in `src/tiles.js` |
| Items, props, enemies, the fire | `src/props.js` |
| Jump height, speed, glide, ice, swimming | `PHYS` in `src/player.js` |
| Ghost difficulty | constants at the top of `src/ghosts.js` |
| Boss difficulty | constants at the top of `src/boss.js` |

See `PROGRESS.md` for what was decided overnight and the open questions.
