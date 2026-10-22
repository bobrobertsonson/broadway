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
| 7. Credits, polish, sound | Done as a first pass: the credits roll with Rupert in his yard, every scene has music and sound effects, and the touch buttons only show during play and on the map. A tap-only run from the title through the intro and map into London works. |

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
- **Palettes written into levels.json:** the palette TODOs were addressed to me, so the chosen colors now live in `levels.json`, each with a `paletteNote`. `levels.json` has no TODOs left. 57 captions are still `"draft": true` (London's start caption is approved: "London. Where it all really started.").
- **Minneapolis:** I filled a 2-wide pit 13 tiles from the start. On ice it killed every test run.
- **No religious symbols anywhere:** removed a cross from the London dome silhouette.

## After the overnight run: gamepad and TV

- **Gamepad:**
  - Read through Phaser's gamepad plugin (`input.gamepad: true`) in `src/controls.js`, merged with keyboard and touch.
  - Controls: d-pad or left stick moves (stick press past 0.5, release under 0.3), A jumps and glides, X writes with the pen, Start pauses (and confirms in menus), B goes to the map while paused.
  - Hints follow the last device used ("press A", "tap", "press jump").
- **Pause:** a new feature, since there was none. It freezes physics, tweens, timers and animations under a dimmed "Paused" banner. Keyboard: Enter or P.
- **World 9 naming:** gamepad players get an on-screen letter grid. Without it, a TV player with only a pad would be stuck at the very end.
- **Scaling:**
  - The whole-number zoom is now chosen in device pixels, then divided by `devicePixelRatio` for Phaser.
  - Checked at 1920x1080 @1x, 1280x720 @1.5x, 960x540 @2x and 844x390 @3x: every game pixel is exactly 6x6 device pixels, and the canvas fills the screen.
  - Before this, a 1.5x screen got uneven pixels.
  - DOM text scales with screen height (`--ui`, 1x to 2x).
- **Tested with a mocked standard gamepad** behind `navigator.getGamepads()`, which drives Phaser's real gamepad plugin. Not tested with a physical controller.
- **Audio unlock with a pad:** if the browser doesn't count a pad press as a user gesture, music stays off until a key, click or tap. [Guessing] that most TV browsers behave this way.

## Mac + HDMI TV + controller

- **Button names follow the controller:** Xbox (A/X/Menu/B), PlayStation (✕/□/Options/○), Switch (B/Y/+/A). The family is detected from the pad id, and the actions are position-based per the standard mapping.
- **Full screen:** a corner button and the F key, since a pad button isn't allowed to request full screen. The title screen shows "F for full screen". In full screen, Esc only exits full screen.
- **Screen Wake Lock** while the game is visible, so the Mac and TV don't sleep mid-cutscene.
- **Mouse pointer** hides after 2 seconds without moving.
- **Auto-pause** when the window loses focus.
- **HUD and corner buttons** keep a 3.5% margin on large screens against TV overscan.
- **Mac setup steps** are in the README (extend instead of mirror, TV "Just Scan", sound output, pairing).
- **Tested** with mocked PlayStation, Switch and Xbox pad ids, a window blur event, the F key and the idle pointer, at 1920x1080. Not tested on a real Mac, TV or controller.
- **Uncertain:** Safari's ids for Switch controllers, and whether Safari maps Switch buttons by position or by label. [Guessing]: by position, the same as Chrome.

## Content from Andrew

- **London (she grew up there):**
  - New collectibles "Chicken shop" (a chicken box) and "Nando's" (a generic peri-peri chilli; no Nando's branding is drawn).
  - A London chicken-shop storefront stands in the level, with a pixel "CHICKEN" sign. Map marker `K`.
  - Pickup order, left to right: Warpaint, Chicken shop, Bloc Party, Nando's.
  - The alarm-clock enemy by the shop was removed so the area stays calm.
  - An EALING street sign near the start marks her neighborhood (from Andrew). It is London style: white plate, black capitals, red stripe, on a post. Signs are a reusable map option, `signs: [{ col, text }]`, lettered with the pixel font's glyphs without the outline (`drawPlain` in `font.js`).
  - Both captions are drafts written by Claude Code from Andrew's one-line answer: "You grew up on London chicken shops." and "Nando's. Extra hot?"

## Logo (Andrew's feedback)

- **Flattened:** no drop shadow, highlight bands or glints. The letters are flat purple with a 1 px gold outline and a 1 px dark rim, the hat is flat-colored, and the subtitle is flat cream-gold.
- **Smaller:** about 30% smaller than before. JASMIN is 3x (was 4x), WORLD 3: is 2x (was 3x) and SUPER stays at 2x. The hat was redrawn to fit the smaller J.
- **Hat:** larger (about as tall as the JASMIN letters) and worn by the J. The brim's center rests on the J's top bar, covering the letter's outline, with a jaunty tilt of about 12 degrees. SUPER moved right to clear the cone. It is drawn upright, rotated with nearest sampling, then outlined, so the pixels stay clean.
- **Overrides `CLAUDE.md`:** its "soft drop shadow" line is superseded by Andrew's request.

## Pixel text and the Mac launcher

- **All on-screen text is drawn in pixels at the game's own scale.** That covers captions, banners, the HUD, labels, the pause screen, the world map, the inventory, World 9 naming and the portrait-phone notice.
  - Two pixel fonts live in `src/font.js`: `px`, a proportional 5x7 font with descenders, and `px-big`, an uppercase title font. Both are white with a baked 1 px dark outline, so they read on any background and can be tinted.
  - A Phaser overlay scene (`src/scenes/UI.js`) draws the state recorded by `src/ui.js`. The HTML text overlay is gone, so text now scales exactly like the art: 6x on a 1080p TV, 2x on a phone.
  - The touch buttons stay as HTML because they're controls, but their symbols are now pixel icons.
- **World 9 naming:** a pixel letter grid works with taps, clicks and the gamepad, and a keyboard can type directly. The phone's own keyboard is no longer used.
- **Fog map:** it zooms out in whole steps (3x, 2x, 1x) instead of a smooth zoom down to 0.55x, which broke the pixel grid.
- **Still not on the pixel grid:** the fire boss grows smoothly (1x to 1.7x), and the intro's glow effect scales smoothly.
- **Keyboard M (mute)** was listed in the README but never wired up. It is fixed.
- **`Play on TV.command`** (Mac): double-click it to serve the game and open Chrome in kiosk mode (full screen) with sound allowed, so no key press is needed before the controller works. It needs Python 3 or Node, or an `ONLINE_URL`. Untested on a Mac.
- **Native Mac app:** decided against for now (see the chat). The launcher gives the same experience without code signing, a build step or a heavy runtime.

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

- **Not played end to end by a human.** Every set piece passed scripted tests in a headless browser, but no one has played a whole level for feel and difficulty. The ice and the ghosts need a human pass most.
- **Untested on a real phone.** iOS audio unlock and the safe-area notch are the risks.
- **Sound never heard.** All sound is synthesized and was only checked for errors, not listened to.
- **Art:**
  - The ghost cloak is dark on dark: it reads as a hood and cloak, but her glasses get lost.
  - All art is procedural placeholder (no Kenney: unreachable from here).
- **Layouts:** levels were designed against a validator, not playtested. Expect a few awkward jumps.
- **Boss fairness:** the valves need Andrew's boost. If she can't figure out "stand still, then jump", she'll be stuck. Isaac's glow plus the "boost!" label over Andrew are the only hints.
- **Credits:** the first line is the game title; the credits screen shows plain text, not the logo.

## Questions for Andrew

1. Are the outfit colors right for each city? (`levels.json`, `palette` per world)
2. The bribe cop: is "grumble grumble" over Andrew's head OK, or do you want a specific line?
3. The boss needs Andrew's boost jump (stand still until he's beside you, then jump). Too hidden? I can add a hint caption.
4. Should the "Nairobi" intro show anything of her as a baby? Right now it's a star settling over the savanna. I didn't want to invent that.
5. Do you want a real Kenney tileset dropped in, or keep the drawn placeholders?
6. All 56 captions are still drafts. Which should I change before you approve them?
