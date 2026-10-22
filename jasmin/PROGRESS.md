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
| 6. Ghosts, send-off, fire boss, ending | Done. Every set piece verified in-engine with scripted input (see below). |
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
- **Bribe cop speech:** Andrew shows "grumble grumble" (the spec says he grumbles). That is the only flavor text I added, and it is not personal content.
- **Ghost sight:** a ghost that sees her stops to stare. Otherwise its drifting cone slid off her before the meter could fill.
- **Send-off yard:** the scene turns to the sunny garden theme as Rupert reaches the gate.
- **Boss:** one arena screen after the 7-1 climb, entered through a door (`B`). Embers and touching the fire hurt like enemies do (they knock the hat off, then restart her). The fire grows slowly, and each open valve shrinks it.
- **Jennifer in the ending:** Isaac holds a larger egg drawn from the egg's palette slots (L, l, A).
- **No religious symbols anywhere:** removed a cross from the London dome silhouette.

## Step 6 verification (headless Chromium, 844x390, scripted input)

- **Minneapolis:** a ghost that sees her stops and stares, the meter fills, and she gets the cloak. Standing on a hiding spot hides her, and the cloak comes off after 5 s out of sight. At the picnic the level turns to night and Andrew joins. If a ghost sees them together, Andrew is sent back to the checkpoint and the goal waits until she fetches him. The exit sign ends the ghosts.
- **Chicago:** the hand-in-hand walk plays at the start, then Rupert joins at his marker.
- **Chinatown:** Isaac joins mid-level. At the send-off the light turns to a sunny yard, Rupert hops through the gate and turns back once, the gate closes, Jasmin waves, the caption shows, and the charm message follows.
- **South America:**
  - The palette changes per country.
  - The stamps fill left to right; the first version had them out of order.
  - She swims through the cenote, and Andrew pays the cop ("grumble grumble").
  - She rides the tortoises (moving platforms now carry her), and Tim waves.
  - The candlelit hut proposal plays with its caption.
- **Brooklyn:** Aya slows her to 0.85 speed and doubles collectibles. Nube removes the slowdown, and Nube's cloud catches one pit fall per level.
- **Fire boss:**
  - A boosted jump from a standstill reaches a valve ledge, and a normal running jump cannot.
  - Isaac reveals each valve; opening one brings Nube's rain cloud and shrinks the fire.
  - Jennifer blocks embers when Isaac is next to Jasmin.
  - Three valves put the fire out, and the Ending scene follows.
- **Ending:**
  1. The inventory of skills, then the fog map zooms out with question marks.
  2. She names World 9 through the pen and a text input (max 24 characters, saved to `localStorage` as `jg-world9`), and the name appears as a node in the fog.
  3. Jennifer wobbles with flickers of light, the family leans in, and her caption shows. The credits follow.
- **Cutscenes:** every one can be skipped with a tap or jump. Each `finish()` puts the scene in its end state.

## Broken or weak

- Ghost cloak sprite is dark on dark: reads as a hood and cloak, but glasses get lost.
- Sound has never been listened to by a human.
- Nothing tested on a real phone yet.

## Questions for Andrew

- Are the outfit colors right for each city?
