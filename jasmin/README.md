# Super Jasmin World 3: A New Magic

## Play it locally

```
npx http-server jasmin -p 8080 -c-1
```

Open http://localhost:8080. On a phone on the same Wi-Fi: `http://<your-computer-ip>:8080`.

Test shortcuts: `?level=5-1` jumps into a level, `?level=7-1&map=7-boss` into the fire boss, `?scene=Ending` or `?scene=Credits` into those scenes.

Controls:
- **Keyboard:** arrows or A/D to move, Space/Up/Z to jump (hold to glide with the hat), X or Shift for the pen, Enter or P to pause, Esc for the map, M to mute.
- **Gamepad** (any standard-mapping pad, through Phaser's gamepad plugin): d-pad or left stick to move, A to jump (hold to glide), X for the pen, Start to pause (and to confirm in menus), B for the map while paused. When naming World 9, an on-screen letter grid appears: d-pad to move, A to type, X to delete, Start to finish. Browsers only expose a pad after one of its buttons has been pressed on the page.
- **Phone:** on-screen buttons appear automatically.

On a TV or any big screen the game picks the largest whole-number zoom in real screen pixels, so pixels stay square and sharp: a 1920x1080 screen shows 320x180 game pixels at exactly 6x. Captions and menus scale up with the screen. For a true full screen on a TV browser, use the browser's own full-screen mode.

Progress is saved in the browser. Reset: run `localStorage.clear()` in the browser console.

## Put it online (GitHub Pages)

Repo Settings > Pages > Deploy from a branch > pick the branch and `/ (root)`. The game is then at `https://<user>.github.io/<repo>/jasmin/`.

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
