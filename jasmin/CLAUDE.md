# Super Jasmin World 3: A New Magic

A short Mario-style side-scrolling platformer about Jasmin's life, made by Andrew as a birthday gift.

**Deadline: playable by October 30.** Scope is the main risk. When in doubt, cut features, not polish.

## Overnight run (read this first)
Andrew has handed this off and gone to sleep. Get as far as possible without him.
- Work through the Build order below, step by step, without stopping to ask questions. When something is ambiguous, pick the simplest reasonable option and note it.
- Skip the content interview tonight. Use every caption in `levels.json` as written, drafts included. Leave TODOs as visible placeholder text in game.
- Keep a running log in `PROGRESS.md`: what is done, what you decided and why, what is broken, and a short "Questions for Andrew" list at the bottom.
- Use git. Commit after each finished build step with a clear message, so any step can be rolled back.
- Test after every step: serve the folder locally and check it in a headless browser at a phone landscape size (for example 844 x 390). Save a screenshot per step in `screenshots/`. Fix errors in the console before moving on.
- If a step is blocked for more than a reasonable effort, stub it, log it, and move to the next step. A rough complete game beats a polished half game.
- Do not add frameworks, bundlers, or backends. Plain HTML, JS modules, and Phaser 3 from a CDN.

## Title and logo
- On-screen title: **Super Jasmin World 3: A New Magic** (colon, never a dash). "A New Magic" matters to Jasmin; keep it exact.
- The logo is an original design. Do not imitate any existing game logo's letterforms, outline, or color scheme.
- Direction: chunky, rounded, bouncy pixel lettering in her palette (deep purple letters, gold outline, a soft drop shadow). A small witch hat tilted on the J, and a few twinkling sparkles around "A New Magic", which sits underneath in smaller script-like pixel text. Gentle bob animation on the title screen.
- Title screen: logo over a sky background with Jasmin standing below it, "Tap to start" blinking.

## Platform

- Phaser 3, one static web page, no build step if possible. Must run from GitHub Pages or any static host.
- Plays on her phone first. Touch controls from day one: left, right, jump (hold to glide when she has the hat), and one action button (pen). Keyboard controls on desktop too.
- Landscape orientation, pixel-perfect scaling (nearest-neighbor, `pixelArt: true`), integer zoom.
- No Nintendo or Namco assets, sounds, characters, or names anywhere. "Mario-style" means the feel, not the content. All enemies are original designs.

## Art

- All character sprites are defined as pixel data in `sprites.js`. Render them to textures at load time.
- Structure the code so any sprite can later be swapped for a hand-made PNG sprite sheet from Aseprite with no gameplay changes. Andrew will refine faces by hand.
- Environment tiles: use a free CC0 tileset (Kenney) as placeholder, recolored per world.
- Every character uses **named color slots**, never hardcoded colors in game logic. Palette lives in `sprites.js`.
- Dark levels: add a 1px light outline around characters, applied in code, only for levels flagged `dark: true`.

### Animations needed (per character)

- Jasmin: idle (2), run (4), jump (1), fall (1), glide (2), hurt (1), wave (2), write (2). Hair rippling: on run frames, shift the S curve of the hair down 1 to 2 rows per frame so it waves. Hat tip lags 1px behind on run.
- Andrew, Isaac, Aya, Nube: idle (2), run (4), jump (1). Generate simple frames by shifting legs and bobbing 1px.
- Rupert: idle (2), hop (3).
- Tim (Galapagos cameo): short, bald, huge beard, heavily tattooed. Sprite is in `sprites.js`. Simple NPC, idle only, waves when Jasmin passes.
- Cutscenes: lake picnic (Minneapolis), garden gate (Chinatown), candlelit hut proposal (Argentina). Keep each under 15 seconds, skippable with a tap.
- Andrew and Jasmin holding hands: a paired walk used at the start of Chicago.

## Characters

### Jasmin (player)
- Long black hair in an S curve flowing behind her, cat-eye glasses, big eyes, dress with belt.
- **Outfits:** palette swaps of the dress, rim, belt, hat, and hat band slots. One outfit per city, unlocked on arrival. Default is black. In Minneapolis she wears a bright puffy coat (needed so the ghost outfit swap is obvious), which she sheds when leaving.
- **Hat power-up:** she starts each world hatless. Picking up the witch hat unlocks glide (hold jump to float slowly). Getting hit knocks the hat off, like losing a mushroom. Hit again without the hat: restart from checkpoint.
- **Pen power-up:** writes a short platform across a gap. Limited uses per level. Returns for the ending.

### Companions
Companions follow Jasmin in a trail using a position history buffer: each one replays the leader's position from N frames earlier (Yoshi's-egg style). They cannot die and do not block her.

| Companion | Joins | Leaves | Ability while present |
|---|---|---|---|
| Andrew | Minneapolis, mid-level | Never | Boost jump when he is next to her |
| Rupert (harlequin lionhead rabbit) | Chicago | End of NYC Chinatown | Higher bunny hop |
| Isaac (holds Jennifer, a purple egg with yellow dots) | NYC Chinatown, mid-level | Never | Jennifer glows near hidden blocks and secret paths, revealing them |
| Aya (toddler, onesie, bow) | Brooklyn Chocolate Factory | Never | Jasmin moves slightly slower, every collectible counts double |
| Nube (nanny) | Brooklyn Chocolate Factory, after Aya | Never | Removes Aya's slowdown (she carries Aya). A small cloud catches Jasmin once per level if she falls into a pit. Key to the fire boss. |

- **Rabbit keepsake:** after he leaves, Jasmin keeps a charm that gives one extra-high jump per level for the rest of the game.
- **Jennifer (Isaac's egg):** he carries her everywhere. She is more powerful as an egg and never hatches. She is indestructible: in the fire boss, Isaac holds her up as a shield that blocks embers for the family.
- Isaac and the rabbit overlap briefly in Chinatown before the send-off.

## Enemies

- **Binocular ghosts (Minneapolis only):** original design. Black-clad ghosts holding binoculars, oversized eyes, slow drifting patrols. No religious symbols of any kind.
  - Each ghost has a sight cone. While Jasmin is inside a cone, a "seen" meter fills.
  - Meter full: her outfit is replaced with the ghosts' outfit (a drab black hooded cloak that covers her hair and coat) until she breaks line of sight for 5 seconds. While cloaked she cannot glide.
  - **Seen together:** once Andrew has joined, if a ghost sees both of them at once, the meter fills twice as fast, nearby ghosts converge, and Andrew is sent back to wait at the last checkpoint until she returns for him.
  - Hiding spots: snowbanks, bus shelters, doorways. Standing behind one hides her.
  - Ghosts cannot cross the Minneapolis exit. They never appear again.
- **Everyday annoyances (all other worlds):** inbox swarms, subway delays, laundry piles, 6am alarms, and similar. Simple patrol and hop behaviors only. Never people.
- **Fire boss (final level):** see World 8.

## World structure
Each place is exactly one level unless noted. Content and captions come from `levels.json`.

0. **Nairobi:** 20 second intro. She is born, camera pans north toward London. Can be a still scene if time is short.
1. **London:** teaches run, jump, hat, pen. Indie music and fashion. First record collectible.
2. **Minneapolis:** ice world. Slippery ground, gray sky, binocular ghosts. Andrew joins mid-level at a night picnic by a lake (wine and bread); the level switches to night from there (they met online; he had just come back from a year in Malaysia). Exit sign ends the ghosts for good.
3. **Chicago:** the savior. Warm, bright colors after the gray. Opens with Jasmin and Andrew walking hand in hand, out in the open, no ghosts anywhere. Rabbit joins. More forgiving level.
4. **NYC Chinatown:** strung lanterns, fire escapes, storefront signs, dense Manhattan Chinatown look. Isaac joins mid-level. Ends with the rabbit send-off.
5. **South America:** one long level, digital nomad year, Isaac is 1. Background and palette change per segment, in order: Mexico, Panama, Colombia, Ecuador (Galapagos), Chile, Argentina, Brazil. One passport stamp collectible per segment. Segment details are in `levels.json`. Set pieces, in priority order:
   1. Argentina: candlelit hut cutscene where Andrew proposes again. Highest priority in the whole world.
   2. Galapagos: tortoise platforms, sea lions, black iguanas, Tim cameo.
   3. Brazil: warm relief after Argentina.
   4. Chile: Valparaiso hillside climb.
   5. Mexico: cenote swim and the bribe cop. Andrew is the one who deals with the cop: when Jasmin reaches him, Andrew steps forward, pays, grumbles, and the cop steps aside. Short and automatic.
   Cut line if short on time: Panama and Colombia become background swaps with a stamp, then Mexico and Chile do too. Never cut the Argentina proposal.
6. **Brooklyn, Chocolate Factory Lofts:** chocolate bar platforms, loft windows. Isaac starts school here (backpack collectible, school in the background). Aya arrives, then Nube joins.
7. **Brooklyn, the new building:** short climb through the building, leading to the boss.
8. **Fire boss:** the building catches fire again. A living fire that grows and spits embers. It needs the whole family to beat:
   - Andrew's boost jump reaches the high windows.
   - Isaac reveals the hidden valves.
   - Nube's cloud rains on the fire each time a valve is opened.
   - Jennifer blocks embers while Isaac stands near the family.
   - Three valves opened = fire out. Tone is comic, not scary.

### The rabbit send-off (end of NYC Chinatown)
- The goal is a garden gate instead of a flag. Beyond it: a big sunny yard, another rabbit.
- No enemies on this final screen. The rabbit hops ahead through the gate, turns back once, the gate closes. Jasmin waves automatically. One caption appears.
- He returns in the end credits, happy in his new yard.

## Ending
After the fire boss, three beats. Tone: capable and open, never promising outcomes. No mention of jobs or work anywhere.

1. **Inventory screen:** everything she gathered, shown as skills, one per world (text from `levels.json`).
2. **Fogged map:** the world map zooms out past Brooklyn into unexplored fog with question marks. One caption.
3. **She names World 9:** the pen appears. She types a name (text input, max 24 characters). Save it in localStorage, show it as a new labeled node in the fog. Then Jennifer wobbles, cracks of light flicker, everyone leans in, and she settles back down, still an egg. One caption. Roll credits.

## Content lives in data, not code
All personal content is in `levels.json`. Andrew writes and approves it. Never invent personal content about Jasmin, Andrew, the kids, Nube, or the rabbit. Captions marked `"draft": true` are proposals awaiting Andrew's approval; anything `"TODO"` is a placeholder.

Collectibles replace coins. Touching one shows its one-line caption.

### Content interview
Not during the overnight run (see top). Otherwise: at the start of build step 4, and whenever `levels.json` still has TODOs or drafts, interview Andrew:
- One world at a time, 2 to 3 short, specific questions per turn.
- After each answer, write it into `levels.json` and show him the captions to approve or edit.
- Captions are one line, addressed to Jasmin as "you", in Andrew's voice. No em dashes.
- At the end, list every remaining TODO.

## Build order
1. One flat test level: Jasmin runs, jumps, touch controls work on a phone.
2. Hat and glide, getting hit, checkpoints.
3. Companion trail system with Andrew.
4. `levels.json` loading, collectibles with captions, outfit swaps.
5. World map and rough versions of every level.
6. Minneapolis ghosts, rabbit send-off, fire boss, ending.
7. Credits, polish, sound.

Ship after step 5 if time runs short. Step 6 holds the emotional payoff, so prioritize it over step 7.

## Rules for working in this repo
- Keep it simple: one new mechanic per world, max.
- Test on a phone-sized viewport after every feature.
- Never use em dashes in any on-screen text.
