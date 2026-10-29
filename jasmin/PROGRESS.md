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
  - Both captions are drafts written by Claude Code from Andrew's one-line answer: Chicken shop is now Andrew's "The REAL Chicken Shop Connoisseur." (approved); "Nando's. Extra hot?" is still a draft.

## Gallery and gameplay clips

- **`gallery.html`** shows every character, outfit, enemy and NPC animating, using the game's own art pipeline.
- **Gameplay GIFs** of each set piece were recorded from the real game with scripted input (London, ghosts, picnic, Chicago, send-off, tortoise, cop, proposal, the full family, the boss).
- **Bug found while recording:** if Jasmin was ever far past the bribe cop without having triggered him (for example after a teleport), the cop scene started anyway and Andrew walked back for up to a minute. Now the cop only triggers when she is near him, and otherwise just leaves. Scripted walks in cutscenes are also capped at 2.5 seconds.

## On-screen copy placement (Andrew's feedback)

- **Titles at the top:** the level start, level complete and Nairobi intro titles now sit at the top of the screen, under the HUD row, instead of in the middle over the action.
- **Captions stack below:** a caption that arrives while a top title is showing is placed under it, then moves back up once the title goes.
- **Still centered** where nothing is happening behind them: pause (dimmed), the ending inventory and the credits.

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
  - Fixed: the ghost cloak now has a lighter rim where the hood meets her face, so her glasses stay readable.
  - All art is procedural placeholder (no Kenney: unreachable from here).
- **Layouts:** levels were designed against a validator, not playtested. Expect a few awkward jumps.
- **Boss fairness:** the valves need Andrew's boost. If she can't figure out "stand still, then jump", she'll be stuck. Isaac's glow plus the "boost!" label over Andrew are the only hints.
- **Credits:** fixed. The title line now shows the logo itself, bobbing, then fades.
- **Visual QA sweep (helper, screenshots of every level):** fixed pits that looked like solid floor (Chinatown's sunset orange, Brooklyn's beige; every pit now has a dark void) and the Mexico bunting running through the HUD buttons. Left as is: segment fades in South America and the Minneapolis night switch dim the HUD for a moment; `?level=7-boss` (a test URL, not reachable in play) throws because 7-boss is a map, not a level id.

## Reachability audit (helper, frame-accurate physics port plus in-engine checks)

Plain jump: 3.6 tiles high, 7-tile gap max (3 px slack). Boost: 6.2 tiles high. Every map's goal and every collectible is reachable. Fixed from the audit:
- 1-1: a second hat after the checkpoint (col 92), so a death past it can't leave her hatless with no ink before the 8-tile pit.
- 5-1: any upward stroke through the water surface now hops her out (before, jump had to be held at the exact moment or she bobbed forever). Removed an unreachable floating platform (cols 378-380).
- 7-1: added a checkpoint (col 60); moved the inbox off head height before the boss door.
- Boss: the third valve ledge moved left of the fire (cols 21-23). It used to sit behind the fire, which grows too big to jump after about 15 seconds.
Left as is (minor): several patrol enemies reach the takeoff edge of a pit; the bus and tortoise gaps can mean a few seconds' wait.

## Caption sign-off (Andrew, via the review page)

Andrew reviews captions on a private page; answers are synced into `levels.json` with a script (approved keeps the text, rewrite replaces it, both set `draft: false`). First sync: 34 applied, 2 held for questions (London skill, South America start), 20 not reviewed yet. Two typos fixed while applying: "Where is all" became "Where it all", "deswrved" became "deserved". London outfit is "Double Jeans" (Andrew, in chat; overrides the page's "London leggings").
Longer captions now stay up longer (about 45 ms per character), and captions drop below the ghost meter instead of covering it.

## Minneapolis fixes (Andrew's playtest, Chrome on Mac)

- Andrew's walk: on ice his speed hovered at the run/idle threshold, so the run cycle kept restarting on its first frame (frozen legs). Followers now keep running through brief slow frames. A jump in place no longer drags followers onto Jasmin (it used to make Andrew jump inside her), and huddled followers stand at her ground height instead of hanging on the tail of a fall. The path is reset when Andrew joins at the picnic (he briefly floated before).
- "Level reset": falling in a pit returns to the last checkpoint, and the last one was col 114 with 75 icy tiles and a 2-tile gap before the flag. Added checkpoints at col 152 (mid gauntlet) and col 184 (just past the exit sign).

## Music per level, map labels (Andrew's feedback)

- Every level has its own synthesized track (`TRACKS` in `src/audio.js`, picked by `music` in `src/maps.js`): London indie (E minor, drums), Minneapolis a slow D minor lament (bass sinking by half steps, a ghostly high voice a half step off, heartbeat kick), Chicago warm F major, Chinatown pentatonic with woodblock, South America tresillo bass and shaker, Brooklyn bouncy C major, the building a tense rising E minor, the boss a comic C minor oom-pah. After the picnic Minneapolis still switches to the quieter night track. The engine gained optional drums, a second voice, and per-bar bass patterns. Not heard by a human yet.
- World map: names only for places already reached, set right next to their circles; the selected place is named in the banner only. Clicking the map pulls keyboard focus back into the game.
- Reported freeze on the map after Minneapolis: not reproduced (keyboard, Enter, X, arrows all worked with Andrew's save).

## Real songs as chiptunes (Andrew: the game is only for the two of them)

Pipeline for real songs: a MIDI file of the song goes through `tools/midi2song.mjs` (`--list` shows the parts; it picks lead, harmony, bass and drums, makes each one monophonic like a chip channel, and can cut to a range of bars). It writes `src/songs/<key>.js`; register it in `src/songs/index.js` and set a map's `music` to the key. Songs play on NES-style pulse waves (12.5% and 25% duty), a triangle bass and noise drums, and loop.
Songs in the game so far: London plays "Helicopter" (Bloc Party; guitar riff as the lead, no vocal part in the MIDI); Chicago plays "New Song" (Warpaint); South America plays Shakira x Bizarrap, Vol. 53, with a generated house beat (`--beat house`; Andrew preferred it to the hip hop version). Jukebox page with every track live plus recorded previews; `tools/render-song.cjs` renders a song to WAV.
The lake meeting and Minneapolis night play "Boom, Boom, Boom, Boom!!" (Vengaboys; map `meetMusic`, starts when the picnic scene begins; vocal line leads with the chorus hook filling its gaps). Converter gained part merging (`--lead 3,12`), voice volumes, and trims empty leading bars.
NYC Chinatown plays "Ride On Time" (Black Box), starting at bar 24 where the groove kicks in. In the slots Claude suggested (Andrew sent the MIDIs; swap freely): Rasputin (fire boss), Daddy Cool (Brooklyn), Scatman (title screen and world map), Le Freak (credits), C'est La Vie (ending). Still original tracks: Nairobi intro, Minneapolis before the lake, the new building, Rupert's send-off, and the Argentina proposal, which now has its own original theme ("Candlelight": tender D major over a habanera bass) instead of reusing the send-off tune.
**Post-game jukebox (Andrew's request).** Finishing the game (end of the ending scene) saves `beaten`; the credits then return to the title, which shows "New: The jukebox is open" once and from then on offers Play / Jukebox (left/right or tap a side). `src/scenes/Jukebox.js`: every song in story order (`JUKEBOX` in `src/songs/index.js`: the 10 real songs plus the 4 original tracks still in use), title, artist and where it plays; the whole cast dances on the beat under stage lights; songs move on to the next when they end; left/right, jump to play or stop, back or the home button for the title. The world map's back button (Esc, pad back) and home button now return to the title too, so the jukebox is reachable without reloading.
**Song refinement pass** (scripted audit of every song: bars without melody, harmony crossing above the melody, doubled parts, loudness from note data). Fixed: Scatman cut the scat verse the MIDI has no melody for (24 bars of bass and drums), and the high synth hook leads; New Song leads with the vocal plus the clean guitar in its gaps (the guitar used to double it as "harmony"); Ride On Time uses the real chord stabs (accordion and e-piano, an octave under the tune) instead of a mostly silent piano part, and drops the bass-only intro and the 20-bar drums-only outro; Daddy Cool, Helicopter, Boom and C'est La Vie keep the harmony under the melody; Helicopter's guitar carries its two instrumental breaks; C'est La Vie's three melody gaps are filled; Le Freak (+3 dB) and C'est La Vie (+1.5 dB) now match the others' loudness. Converter: `--cut`, per-voice `--lead-shift/--harm-shift/--bass-shift`, `--gain`. `tools/songs.sh <midi folder>` rebuilds every song exactly.
Minneapolis before the lake plays Röyksopp's "What Else Is There?" (Andrew's pick; the MIDI has only melody and chords, so the chords split into harmony and bass, plus a house beat). The pixel font gained an ö for the jukebox. New building plays AC/DC's "Thunderstruck" (vocal leads, the riff fills and runs under it). Bonus tracks in the jukebox until Andrew places them: "Wannabe" (Spice Girls), "Love Is a Battlefield" (Pat Benatar; its MIDI had a never-ending note, cut at bar 246, drum-only breaks removed), "What Is Love" (Haddaway). **Still open:** the Argentina proposal is the most important slot still on an original track ("Candlelight").

Why MIDI: Claude can't listen to audio and doesn't know these songs note for note, so a from-memory version would come out wrong. First request: "New Song" by Warpaint for Chicago. Waiting on a MIDI from Andrew.

## Second overnight: powers, bricks, richer cities (Andrew asleep)

Asked: more varied levels with real environmental things from each place, a power beyond the hat in every level, breakable bricks, "make it very verbose" (read as dense with place detail, not more text).

**Engine (src/powers.js, places/):**
- Powers, one per level, on the action button; a new pickup replaces the old one; kept on death.
  - Pen: London.
  - Bullshitometer: Minneapolis and South America.
  - Dash: Chicago and Brooklyn.
  - Magic spark: Chinatown and the new building.
- Cut on purpose: ground pound and bubble shield (Andrew picked all options; argued in chat they duplicate the spark and the hat). Easy to add later if he still wants them.
- Bullshitometer: HUD needle rises near fakes; the button marks them for 6 s and Jasmin says "Nope."
- Fakes: `~` fake brick and `_` fake ground crumble a moment after she stands on them and come back on respawn. `?` mimics look like collectibles and bite; she can stomp them.
- Cracked bricks `%`: they break from below, from a spark (one spark opens the whole cracked column) or from a dash.
- Secrets `+`: hidden sweets, 3 per level (5 in South America). The world map shows "Secrets n of N" and the level's power. The pause screen names the current power and its button.
- Place modules, `src/places/<city>.js`: each city's scenery, markers and mechanics, kept out of Level.js. Four Sonnet helpers each built cities in their own worktree; all merged.
  - London: phone and post boxes, black cab, zebra crossing, pigeons, puddles, tube gusts to a rooftop route, a bouncy market awning.
  - Minneapolis: skyways that hide her from ghosts, thin ice and fake stairs for the Bullshitometer, snow, plow, fountains, ice-fishing shanties, a giant spoon and cherry by the picnic.
  - Chicago: lift bridge, L train and water taxi rides, wind over the river and lake, a mirror bean, deep-dish stand, street signs.
  - Chinatown: lantern strings that light when a spark passes, bounce awnings, steam vents, storefronts, Henry St sign; the send-off ending untouched.
  - South America: tourist traps for the Bullshitometer, plus one thing per country.
    - Mexico: papel picado and macaws.
    - Panama: a canal lock raft.
    - Colombia: coffee terraces.
    - Galapagos: crabs, with shorter tortoise waits.
    - Chile: Valparaiso hillside and funicular.
    - Argentina: gusts.
    - Brazil: wave pavement and bouncy umbrellas.
  - Brooklyn: chocolate conveyors, telegraphed chocolate drips, stoops, cats, water towers, a school with a flag.
  - New building: elevator, furniture platforms, plaster closets with secrets, floorboards over a wall cross-section, ceiling lights.
- Nairobi intro: the skyline beyond the savanna, giraffes, acacias, birds.
- Balanced line breaks for all captions and banners.
- Real songs as chiptunes: MIDI converter and song player (see above), waiting on files.

**Bug found by a full-game run:** Phaser reuses each scene object, so per-visit flags carried over. This was the "map froze after Minneapolis" report: the map ignored the start button on every visit after the first. Nube's once-per-level cloud stayed spent and secret counts kept adding up. Fix: `src/scenes/fresh.js` clears per-visit state at the start of every visit.

**Checks:**
- No errors in any level at phone and TV size.
- Every secret can be picked up.
- 60 fps with the CPU throttled 4x in every level.
- All cutscenes run to the end (each helper ran its own; the proposal and cop in South America; picnic; paired walk; send-off).
- Reachability checked with the physics sim per level.

**Full-game run (headless, scripted):** title, Nairobi, then every level from London to the new building through the world map, the fire boss, the ending (inventory, fog, naming World 9, Jennifer), all credits and back to the map. Zero errors.

**Not checked:** a human playing it. That is the most useful next step.

## Outfits change shape, not just color (Andrew: "the puffy jacket needs to be big")

An outfit in `levels.json` can name a `style` (`src/outfits.js`). The style reshapes her clothes in every animation frame, with the hat on or off:
- London `jeans`: jacket and jeans; the skirt becomes two legs.
- Minneapolis `puffy`: a big round quilted parka, puffy sleeve with a mitten, cream fur collar, down past the hips.
- Chicago `twotone`: white top over the skirt.
- New York `scarf`: a chunky scarf with a long tail flying behind.
- South America `trainers`: white sneakers and a big green travel backpack with a rolled mat.
- Brooklyn `cardigan`: an open cardigan over a cream top.

Colors still come from each outfit's palette (new slots: C2 for a second color, Tw/Tg sneakers, Bp/Bp2 backpack).

## Questions for Andrew

1. Are the outfit colors right for each city? (`levels.json`, `palette` per world)
2. The bribe cop: is "grumble grumble" over Andrew's head OK, or do you want a specific line?
3. Boss hint: done. "boost!" over Andrew now shows only when a ledge nearby needs it, and if no valve opens for 30 seconds the boss shows "Stand still next to Andrew, then jump" (at most 3 times).
4. Should the "Nairobi" intro show anything of her as a baby? Right now it's a star settling over the savanna. I didn't want to invent that.
5. Do you want a real Kenney tileset dropped in, or keep the drawn placeholders?
6. All 56 captions are still drafts. Which should I change before you approve them?

## Finish line (Oct 29, Andrew asleep)

**How she plays it:** download the repo (branch `jasmin-game`) as a zip, open the `jasmin` folder on the Mac, double-click `Play on TV.command` (or `Super Jasmin World 3.html` itself). `Super Jasmin World 3.html` is the whole game in one 2.7 MB file (Phaser, code, levels, styles, songs), built by `node tools/build-single.mjs`. It opens from Finder (file://), offline, with no web server, Python or Node. The launcher opens it in Chrome kiosk mode with sound allowed, so the controller works with no key press. Rebuild the file after any change to `src/` or `levels.json`.

**Checked on the single file** (headless Chromium, 1920x1080, simulated controllers):
- Xbox pad: title, intro, map, London; stick and d-pad move; A jumps, holding A glides with the hat; Start pauses (and the stick does nothing while paused) and resumes; B from pause goes to the map; B on the map goes to the title.
- X fires every power: pen (draws a platform), Bullshitometer, dash, spark.
- World 9 naming with the pad's letter grid: typed and saved.
- PlayStation pad: Play / Jukebox menu on the title, the jukebox (choose, stop, back), hints use ✕ / ○.
- Window blur pauses; F goes full screen; the mouse pointer hides when idle.
- Full scripted run: title, Nairobi, every level, the fire boss, the ending, the credits, back to the title (jukebox unlocked). Zero errors.

**Not checked:** a real Bluetooth controller on a real Mac and TV. Do one full test run on the actual setup before the 30th.

**Songs:** Scatman has Andrew's cuts from the song cutter (bars 56-60 and 70-84 out). Shakira saved with no cuts (unchanged).

**Still Andrew's call (the game works as is):**
- Five lines still marked draft, shown as written: London skill "An eye for style", outfit names "Chicago look" and "New York look", South America start "One year. Seven countries. One baby.", credits "Special guest: Tim, all the way from Seattle."
- Where Wannabe, Love Is a Battlefield and What Is Love go (jukebox bonus tracks for now).
- A real song for the Argentina proposal (original "Candlelight" for now).
