# Progress log (overnight run)

Game lives in `jasmin/` on branch `jasmin-game`. Run: `npx http-server jasmin -c-1`, open http://localhost:8080. Test shortcuts: `?level=2-1`, `?level=7-1&map=7-boss`, `?scene=Ending`.

## Status by build step

| Step | State |
|---|---|
| 1. Flat level, run, jump, touch | Done (earlier session). Multitouch verified with CDP touch events. |
| 2. Hat, glide, hits, checkpoints | Done (earlier session). |
| 3. Companion trail with Andrew | Done. Trail now supports mid-level joins, leaving and rejoining. |
| 4. levels.json, collectibles, outfit swaps | Done. See decisions. |
| 5. World map and every level (rough) | Done. 8 maps + Nairobi intro scene; every level loads and plays at 844x390 with no page errors. |
| 6. Ghosts, send-off, fire boss, ending | Code written, testing pending |
| 7. Credits, polish, sound | Partly done (credits, synthesized sound exist) |

## Decisions (and why)

- **Repo:** stays in `bobrobertsonson/broadway` under `jasmin/` (the only repo this session can reach). A dedicated repo would give a cleaner Pages URL.
- **Phaser from CDN:** `index.html` loads Phaser 3.80.1 from jsDelivr and falls back to `vendor/phaser.min.js` if the CDN fails (the CDN is blocked from the build machine, so tests use the fallback).
- **Kenney tiles:** kenney.nl is unreachable from the build machine. All environment art is procedural placeholder art in `src/tiles.js` (one theme per city) and `src/props.js`. Swap later if wanted.
- **Captions:** `levels.json` captions are `{text, draft}`; drafts are shown as written. Anything missing shows as `TODO`.
- **Outfit palettes:** levels.json asked Claude Code to pick them. Chosen in `src/content.js` (`DEFAULT_OUTFIT_PALETTES`): London oxblood/mustard, Minneapolis bright red puffy coat, Chicago teal, New York berry, Travel terracotta, Brooklyn chocolate. Andrew can override with a palette object in levels.json.
- **Outfits on arrival:** entering a city's level unlocks its outfit and puts it on. Any unlocked outfit can be picked on the map (pen button / X). Minneapolis always starts in the puffy coat; Chicago puts on the Chicago look, which is how she "sheds" the coat.
- **Collectible counts:** levels.json has 1 or 2 collectibles per level (plus 7 passport stamps). I did not add filler collectibles, so the score counter stays small.
- **Palette additions in sprites.js:** `Ol` (dark-level outline), `Kc`/`Kh` (ghost cloak). Nothing else in Andrew's file changed.
- **Removed:** the old egg-hatch and "next level" door (Jennifer never hatches in this spec).
- **Level layouts** were designed by a helper agent against a validator (marker counts, gap widths, enemy distance from checkpoints/joins). I removed the boss arena's low dodge platforms: a normal jump from them could reach the valve ledges, which would make Andrew's boost unnecessary.
- **World 7 has no outfit** in levels.json, so she keeps whatever she wore last.
- **Hats:** one in every level so she can glide in every world (spec: she starts each world hatless).
- **No religious symbols anywhere:** removed a cross from the London dome silhouette.

## Broken or weak

- Ghost cloak sprite is dark on dark: reads as a hood and cloak, but glasses get lost.
- Sound has never been listened to by a human.
- Nothing tested on a real phone yet.

## Questions for Andrew

- Are the outfit colors right for each city?
