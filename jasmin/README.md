# Jasmin's Game

## Play it locally

```
npx http-server jasmin -p 8080 -c-1
```

Then open http://localhost:8080. To test on your phone, it must be on the same Wi-Fi: open `http://<your-computer-ip>:8080`.

Shortcut for testing: `?level=3-2` jumps straight into a level.

Controls: arrows or A/D to move, Space/Up/Z to jump (hold to glide with the hat), X or Shift for the pen, Esc for the map, M to mute. On a phone, on-screen buttons appear automatically.

Progress is saved in the browser. To reset it, run `localStorage.clear()` in the browser console.

## Put it online (GitHub Pages)

Repo Settings > Pages > Deploy from a branch > pick the branch and `/ (root)`. The game is then at `https://<user>.github.io/<repo>/jasmin/`.

## What to edit

| You want to change | Edit |
|---|---|
| Captions, titles, names, credits, outfit names/colors, what the egg hatches into | `levels.json` |
| Level layouts | `src/maps.js` (legend in `ARCHITECTURE.md`) |
| Character pixels and palette | `src/sprites.js` |
| Swap a character for a hand-drawn Aseprite sheet | add an entry to `ART_OVERRIDES` in `src/art.js` (example in the comment there) |
| Swap placeholder tiles for a Kenney tileset | `src/tiles.js` (all environment art is created in `makeEnvironmentTextures`) |
| Jump height, speed, glide | `PHYS` in `src/player.js` |

Search `levels.json` for `TODO` to find every placeholder that still needs real content. Any text left as `TODO` shows up in the game exactly like that, so nothing gets invented.

### Collectibles

Each `*` in a map is a collectible slot. The collectibles in `levels.json` fill those slots in order. To place one at an exact tile instead, give it a non-zero `x` (column) and `y` (row).
