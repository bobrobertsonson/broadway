# Super Jasmin World 3: A New Magic

## Play it locally

```
npx http-server jasmin -p 8080 -c-1
```

Open http://localhost:8080. On a phone on the same Wi-Fi: `http://<your-computer-ip>:8080`.

Test shortcuts: `?level=5-1` jumps into a level, `?level=7-1&map=7-boss` into the fire boss, `?scene=Ending` or `?scene=Credits` into those scenes.

Controls: arrows or A/D to move, Space/Up/Z to jump (hold to glide with the hat), X or Shift for the pen, Esc for the map, M to mute. On a phone the buttons appear automatically.

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
