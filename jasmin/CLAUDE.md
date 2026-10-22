# Jasmin's Game

A short Mario-style side-scrolling platformer about Jasmin's life, made by Andrew as a birthday gift.

**Deadline: playable by October 30.** Scope is the main risk. When in doubt, cut features, not polish.

## Platform

- Phaser 3, one static web page, no build step if possible. Must run from GitHub Pages or any static host.
- Plays on her phone first. Touch controls from day one: left, right, jump (hold to glide when she has the hat). Keyboard controls on desktop too.
- Landscape orientation, pixel-perfect scaling (nearest-neighbor, `pixelArt: true`), integer zoom.
- No Nintendo assets, sounds, or names anywhere. "Mario-style" means the feel, not the content.

## Art

- All character sprites are defined as pixel data in `sprites.js`. Render them to textures at load time.
- Structure the code so any sprite can later be swapped for a hand-made PNG sprite sheet from Aseprite with no gameplay changes. Andrew will refine faces by hand.
- Environment tiles: use a free CC0 tileset (Kenney) as placeholder.
- Every character uses **named color slots**, never hardcoded colors in game logic. Palette lives in `sprites.js`.
- Dark levels: add a 1px light outline around characters, applied in code, only for levels flagged `dark: true`.

### Animations needed (per character)

- Jasmin: idle (2), run (4), jump (1), fall (1), glide (2), hurt (1). Hair rippling: on run frames, shift the S curve of the hair down 1 to 2 rows per frame so it waves. Hat tip lags 1px behind on run.
- Andrew, son, daughter: idle (2), run (4), jump (1). Generate simple frames by shifting legs and bobbing 1px.
- Rabbit: idle (2), hop (3).

## Characters

### Jasmin (player)
- Long black hair in an S curve flowing behind her, cat-eye glasses, big eyes, black dress with gold belt.
- **Outfits:** palette swaps of the dress, rim, belt, hat, and hat band slots. Black is default. One new outfit unlocks per world. Outfit names come from `levels.json`.
- **Hat power-up:** she starts each world hatless. Picking up the witch hat unlocks glide (hold jump to float slowly). Getting hit knocks the hat off, like losing a mushroom. Hit again without the hat: restart from checkpoint.
- **Pen power-up:** writes a short platform across a gap. Limited uses per level.

### Companions
Companions follow Jasmin in a trail using a position history buffer: each one replays the leader's position from N frames earlier (Yoshi's-egg style). They cannot die and do not block her.

| Companion | Joins | Ability while present |
|---|---|---|
| Andrew | World 2, stays to the end | Boost jump when he is next to her |
| Rabbit (harlequin lionhead) | World 3, leaves at end of World 3 | Higher bunny hop |
| Son (holds purple egg with yellow dots) | World 4 | Reveals hidden blocks and secret paths nearby |
| Daughter (toddler, onesie, bow) | World 5 | Jasmin moves slightly slower, every collectible counts double |

- **Rabbit keepsake:** after he leaves, Jasmin keeps a charm that gives one extra-high jump per level for the rest of the game.
- **Son's egg:** he carries it through every world he is in. It hatches in the final world (what it hatches into: TBD, set in `levels.json`).

## World structure

1. **Solo:** Jasmin alone. Teaches run, jump, hat, pen.
2. **Andrew joins.**
3. **Rabbit joins.** Ends with the send-off (below).
4. **Son arrives.**
5. **Daughter arrives.** Final world: present day, home, full family. Ends on a door labeled "next level" rather than a goal flag.

Each world: 1 to 2 short levels, one new mechanic max.

### The rabbit send-off (end of World 3)
- The goal is a garden gate instead of a flag. Beyond it: a big sunny yard, another rabbit.
- No enemies on this final screen. The rabbit hops ahead through the gate, turns back once, the gate closes. Jasmin waves automatically. One caption appears.
- He returns in the end credits, happy in his new yard.

## Enemies
Everyday annoyances, never people: inbox swarms, subway delays, laundry piles, 6am alarms, etc. Simple patrol and hop behaviors only.

## Content lives in data, not code
All personal content goes in `levels.json` so Andrew can write it without touching game logic:

```json
{
  "worlds": [
    {
      "id": 1,
      "title": "",
      "companionsJoin": [],
      "companionsLeave": [],
      "outfitUnlock": { "name": "", "palette": {} },
      "levels": [
        {
          "id": "1-1",
          "dark": false,
          "collectibles": [
            { "x": 0, "y": 0, "label": "", "caption": "" }
          ],
          "endCaption": ""
        }
      ]
    }
  ],
  "eggHatchesInto": "",
  "rabbitSendoffCaption": "",
  "credits": []
}
```

Collectibles replace coins: inside jokes, places, songs, foods. Touching one shows its one-line caption.

### Content interview
Never invent personal content about Jasmin, Andrew, or the kids. Use clearly marked placeholders (`TODO: caption`) until Andrew provides it.

At the start of build step 4, and again whenever `levels.json` still has TODOs, interview Andrew:
- Ask about one world at a time, 2 to 3 questions per turn, short and specific (for example: "What place or moment best sums up her life before you met?", "Name one inside joke from when you started dating").
- After each answer, write it straight into `levels.json` and show him the resulting captions to approve or edit.
- Keep captions to one line, in Andrew's voice. No em dashes.
- At the end, list every remaining TODO so he knows what is left.

## Build order
1. One flat test level: Jasmin runs, jumps, touch controls work on a phone.
2. Hat and glide, getting hit, checkpoints.
3. Companion trail system with Andrew.
4. `levels.json` loading, collectibles with captions.
5. World map and World 1 to 5 levels (rough).
6. Rabbit send-off sequence, egg hatch, final door.
7. Outfits, credits, polish, sound.

Ship after step 5 if time runs short. Steps 6 and 7 are the emotional payoff, so prioritize 6 over 7.

## Rules for working in this repo
- Keep it simple: one new mechanic per world, max.
- Test on a phone-sized viewport after every feature.
- Never use em dashes in any on-screen text.
