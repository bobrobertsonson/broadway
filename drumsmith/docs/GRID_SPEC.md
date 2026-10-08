# Drumsmith Grid Format — Specification v1 (DRAFT)

Status: **draft, not frozen.** Freezes when Phase 1 is approved. After freeze, any
change bumps the magic line to `drumsmith-grid 2` and requires a converter, because
this format is also the Track B training format.

Items marked **[VERIFY]** depend on the Guitar Pro 8 test file the user exports
(see §13) and must be resolved before freeze.

---

## 1. Design goals

1. **Readable and writable by Claude without counting errors.** One character per
   time slot, with mandatory `|` separators at every group (usually every beat), so
   no run of cells is longer than a beat or a declared tuplet group.
2. **Self-describing bars.** Every bar header restates meter, resolution and tempo.
   Any bar can be read, edited, validated or used as a training sample in isolation.
3. **Deterministic.** Exactly one canonical serialization for any drum part (§10).
   Compilers are pure functions of grid + config.
4. **Standard map only.** Lanes are fixed General MIDI / Guitar Pro 8 drum slots.
   Remapping happens only at MIDI export (profiles), never in the grid.
5. **ASCII only.** No tabs, no Unicode.

## 2. File structure

```
drumsmith-grid 1
@title "Song Name"
@source "song.gp" track=6
@order written

bar 1 ts=4/4 div=4 q=180 sec="Intro"
C1 |x---|----|----|----|
H  |----|o-o-|o-o-|o-o-|
S1 |----|x---|----|x---|
K1 |x---|--x-|x---|--x-|

bar 2 ts=4/4 div=4 q=180
...
```

- Line 1 is the magic line `drumsmith-grid 1`. Required.
- `@key value` metadata lines follow, before the first bar. All optional:
  - `@title "..."`, `@source "<path>" [track=<n>]`, `@note "..."` (repeatable)
  - `@order written|performed` (default `performed`; see §8)
  - `@velocity <name>` — the velocity table used when this grid was imported (§11).
    Informational only.
- Lines starting with `#` are comments, ignored by the parser and dropped by the
  canonical serializer.
- Blank lines are ignored. Canonical form puts exactly one blank line between bars.
- A bar block is one header line followed by zero or more lane lines. A bar with no
  lane lines is all rests.

## 3. Bar header

```
bar <n> ts=<num>/<den> div=<divspec> q=<tempospec> [sec="<label>"] [rep=<repspec>] [alt=<list>] [dir="<text>"]
```

Tokens appear in exactly this order, separated by single spaces.

| Token | Meaning |
|---|---|
| `bar <n>` | Bar number, 1-based. Must increase by exactly 1 from bar to bar within a file. In `written` order it equals the Guitar Pro master-bar index. Excerpts may start at any number. |
| `ts=` | Time signature. `num` 1–32; `den` in {1,2,4,8,16,32}. |
| `div=` | Slot layout of the bar (§4). |
| `q=` | Tempo at bar start, plus any mid-bar changes (§5). |
| `sec=` | Section marker starting at this bar (Guitar Pro section text). Only on the first bar of a section. |
| `rep=` | `start`, `end*<times>` (e.g. `end*2`), or `start,end*<times>` for a one-bar repeat. Only in `written` order. |
| `alt=` | Alternate-ending numbers this bar belongs to, e.g. `alt=1` or `alt=2,3`. Only in `written` order. |
| `dir=` | Passthrough of Guitar Pro direction text (Segno, Coda, D.S. al Coda, ...). Only in `written` order. Expansion is the reader's job. |

## 4. Divisions, groups and tuplets (`div=`)

A **beat** is one unit of the time-signature denominator (a quarter in x/4, an
eighth in x/8). A bar is split into **groups**. Each group spans one or more beats
and holds equally spaced slots.

```
divspec = group ( "," group )*  |  int
group   = slots [ ":" beats ]          # beats defaults to 1
```

- `div=4` (single integer) is shorthand for "every beat has 4 slots".
- `div=4,4,6,6` — beats 1–2 at 16ths, beats 3–4 as 16th-sextuplets.
- `div=4,4,3:2` — beats 1–2 at 16ths, quarter-note triplet across beats 3–4.
- `div=4:2,4:2,6:3` in 7/8 — 16th notes grouped 2+2+3 (the grouping is notational;
  the slot rate is the same in each group).
- `div=5` — quintuplets on every beat. `div=7` — septuplets.

Rules:
- The sum of `beats` over all groups must equal the time-signature numerator.
- Slot duration in a group = `beats / slots` beats.
- Every lane line in the bar has exactly one cell per slot, with `|` between groups
  and at both ends. So the lane line for `div=4,4,3:2` looks like `|----|----|---|`.
- Allowed `slots` per group: 1–16. Larger values are rejected (split the group).
- Canonical form uses the integer shorthand when every group is `n:1` with the same `n`.

Common values:

| Feel | ts | div | Slots/bar |
|---|---|---|---|
| Straight 8ths | 4/4 | 2 | 8 |
| Straight 16ths | 4/4 | 4 | 16 |
| 8th triplets / 12/8 feel in 4/4 | 4/4 | 3 | 12 |
| 16th triplets (sextuplets) | 4/4 | 6 | 24 |
| 32nds | 4/4 | 8 | 32 |
| 16ths in 6/8 | 6/8 | 2 | 12 |
| 16ths in 7/8, 2+2+3 | 7/8 | 4:2,4:2,6:3 | 14 |

## 5. Tempo (`q=`)

- Tempo is always **quarter notes per minute**, whatever the denominator
  (Guitar Pro and MIDI convention). Up to two decimals: `q=133.33`.
- Mid-bar changes are allowed **only at group boundaries**:
  `q=180,200@g3` = 180 from bar start, 200 from the start of group 3 (1-based).
- Linear ramps: a `~` after a tempo point starts a linear ramp from that point to
  the next tempo point, which may be in a later bar. Bars fully inside a ramp write
  `q=~`. Example accelerando across bars 20–23:
  ```
  bar 20 ts=4/4 div=4 q=120~
  bar 21 ts=4/4 div=4 q=~
  bar 22 ts=4/4 div=4 q=~
  bar 23 ts=4/4 div=4 q=~
  bar 24 ts=4/4 div=4 q=160
  ```
- The first bar of a file must give a numeric tempo.
- [VERIFY] how Guitar Pro 8 encodes ramps (`<Linear>` flag on tempo automation)
  and which point the flag sits on; the reader and writer translate to this rule.

## 6. Lanes

Exactly these 21 lanes, standard GM / Guitar Pro 8 slots. No others, ever.

| Lane | Instrument | GM note | Default limb | Group |
|---|---|---|---|---|
| C1 | Crash 1 | 49 | hand | cymbal |
| C2 | Crash 2 | 57 | hand | cymbal |
| X  | China | 52 | hand | cymbal |
| SP | Splash | 55 | hand | cymbal |
| R1 | Ride 1 | 51 | hand | ride |
| R2 | Ride 2 | 59 | hand | ride |
| B  | Ride Bell | 53 | hand | ride |
| H  | Closed Hi-Hat | 42 | hand | hat |
| O  | Open Hi-Hat | 46 | hand | hat |
| SS | Side Stick | 37 | hand | snare |
| S1 | Snare 1 | 38 | hand | snare |
| S2 | Snare 2 | 40 | hand | snare |
| T1 | High Tom 1 | 50 | hand | tom |
| T2 | High Tom 2 | 48 | hand | tom |
| T3 | Mid Tom 1 | 47 | hand | tom |
| T4 | Mid Tom 2 | 45 | hand | tom |
| T5 | Low Tom 1 | 43 | hand | tom |
| T6 | Low Tom 2 | 41 | hand | tom |
| K1 | Bass Drum 1 | 36 | right foot | kick |
| K2 | Bass Drum 2 | 35 | left foot | kick |
| P  | Pedal Hi-Hat | 44 | left foot | hat |

**Canonical lane order** (top to bottom, roughly as on a drum staff):
`C1 C2 X SP R1 R2 B O H SS S1 S2 T1 T2 T3 T4 T5 T6 K1 K2 P`

Lane line syntax: lane name, padded with spaces to width 3, then the cells.
```
K1 |x-o-|o-o-|x-o-|o-o-|
X  |x---|x---|x---|x---|
```
- Lanes that are all rests in a bar are omitted (canonical form omits them).
- A lane may appear at most once per bar. The parser accepts any order; the
  serializer writes canonical order.

Note on SS: GM 37 is **side stick** (cross-stick). A snare **rimshot** is a
different stroke and is written as the `r`/`R` variant on S1/S2 (§7.2).

## 7. Cell glyphs

### 7.1 Dynamics (all lanes)

| Glyph | Meaning |
|---|---|
| `x` | accent |
| `o` | normal |
| `g` | ghost |
| `-` | rest |

### 7.2 Articulation variants (one character, replaces the dynamic glyph)

Variants are not new lanes. Each variant has a normal form (lowercase) and an
accented form (uppercase). Ghost-level variants are not representable; on import
they degrade to `g` and the reader emits a warning.

| Glyph (normal / accent) | Variant | Valid lanes | Notes |
|---|---|---|---|
| `h` / `H` | half-open hi-hat | H | GP8 "Hi-Hat (half)" |
| `c` / `C` | choke (hit, then choked) | C1 C2 X SP R1 R2 | GP8 "(choke)" articulations; R1/R2 both use "Ride (choke)" |
| `r` / `R` | rimshot | S1 S2 | GP8 "Snare (rim shot)"; GP8 has one rimshot articulation, so S2 rimshots read back as S1 [see §13] |
| `f` / `F` | flam (grace stroke + main stroke, same lane) | SS S1 S2 T1–T6 | Counts as one hand for playability |
| `z` / `Z` | roll / buzz for the slot's duration | SS S1 S2 T1–T6 C1 C2 X SP R1 R2 | Consecutive `z` slots = one continuous roll. GP tremolo [VERIFY] |

Reserved for future versions (rejected in v1): `d e b s t k m n p y`.

Any glyph not valid for its lane is a parse error, not a warning.

### 7.3 Same-instant rules (validation errors)

- `H` and `O` lanes may not both have a hit in the same slot (one hi-hat).
- `R1` and `B` may both hit (two hands), but `R1` with `B` and a third hand lane at
  the same slot fails the playability check, not the parser.
- Everything else at the same slot is syntactically legal. Limb counting,
  crossings and speed belong to the playability checker, which warns and never
  modifies the grid.

## 8. Written vs performed order

- `@order performed` (default): bars in playback order, repeats unrolled. No
  `rep=`, `alt=` or `dir=` tokens allowed. Used for MIDI, analysis and all
  training data.
- `@order written`: bars mirror Guitar Pro master bars one to one, with `rep=`,
  `alt=`, `dir=` tokens. Used when editing a `.gp` file in place.
- `drumsmith grid expand` converts written to performed. The reverse is not
  automatic.
- If a drum edit makes two passes of a repeated bar differ, the `.gp` writer
  refuses and asks for the repeat to be unrolled; it never silently picks one pass.

## 9. Guitar / bass onset grid

Same bar headers and cell layout as the drum grid, so drum and guitar parts line
up column for column. Used in analysis reports and as Track B model input.

Lanes: `G1`…`G9` (guitar tracks in score order), `BS` and `BS2` (bass).

| Glyph | Meaning |
|---|---|
| `o` | onset, open (not palm-muted) |
| `m` | onset, palm-muted |
| `d` | onset, dead / muted-string note |
| `x` | onset with an accent marking in the tab |
| `O` `M` `D` `X` | same as lowercase, in the **low register**: lowest sounding pitch within 4 semitones of the track's lowest pitch in the song (the "chug" register) |
| `=` | sustain (a note from an earlier onset is still ringing) |
| `-` | silence |

- Chords count as one onset. Tied notes are sustain, not onsets.
- If a guitar part needs a finer resolution than the drum part, the reader picks
  a `div` that fits both. The bar header is shared.
- In a combined report block, drum lanes come first, then a line `~~`, then
  guitar lanes.

## 10. Canonical serialization

Required for deterministic diffs and training data.

1. Magic line, then metadata in the order `@title @source @order @velocity @note`.
2. One blank line, then bars separated by exactly one blank line.
3. Header tokens in §3 order; `div` in shortest form; tempo with no trailing zeros.
4. Lanes in canonical order (§6); all-rest lanes omitted; name padded to width 3.
5. No comments, no trailing whitespace, LF line endings, final newline.

`parse(serialize(g)) == g` and `serialize(parse(t)) == canonical(t)` are tested
properties.

## 11. Velocity table

Compilers map glyphs to MIDI velocity using `config/velocity.yaml`:

```yaml
name: default
glyphs: { x: 118, o: 96, g: 42 }
variants:
  h: 96   H: 118
  c: 96   C: 118
  r: 104  R: 124
  f: { main: 96,  grace: 50 }
  F: { main: 118, grace: 60 }
  z: { level: 70, rate: 32 }     # roll rendered as 32nd notes
  Z: { level: 95, rate: 32 }
lane_overrides:
  K1: { g: 60 }                  # optional per-lane values
flam_offset_ms: 25
```

Reading MIDI back: velocity is classified by thresholds halfway between the
configured `g`/`o`/`x` values (defaults: ≤ 69 → `g`, 70–106 → `o`, ≥ 107 → `x`).

## 12. Compilation and round-trip semantics

### 12.1 Grid → MIDI
- SMF type 1, PPQ 960, drums on channel 10 (index 9), GM notes from §6.
- Slot onset tick = bar start + group start + slot index × group length / slots,
  rounded to the nearest tick (only 5-, 7-, 9-, 11-, 13-tuplets round).
- Note length: `min(slot length, 1/32 note)`. Drum note lengths carry no meaning.
- Flams: grace note `flam_offset_ms` before the main note (clamped at tick 0).
- Rolls: repeated notes at `rate` filling the slot.
- Variants with no GM note (half-open hat, chokes, rimshot) compile to their base
  GM note under the standard map and are listed in the export sidecar. Remap
  profiles may give them their own notes.
- Tempo map and time signatures written to track 0. Section labels as MIDI markers.

### 12.2 MIDI → grid
- Drum events from channel 10, or from a track the user selects.
- Notes outside the 21-lane map are reported and dropped (never silently mapped).
- Per bar and per beat, the reader picks the coarsest `div` from
  {1,2,3,4,5,6,7,8,12,16} whose quantization error stays within tolerance
  (default ±1/16 of the slot). Larger errors are reported per note, never hidden.
- Two hits on the same lane within the flam window → flam glyph.

### 12.3 Guitar Pro 8 ↔ grid
- GP8 drum notes reference an articulation index into the track's own drumkit
  articulation table (`InstrumentSet` in `score.gpif`) [VERIFY]. The mapping to
  lanes is resolved per file through each articulation's output MIDI number and
  name, never by hard-coded index. The resolved table lives in
  `src/drumsmith/gp8/articulations.py` and in §13 below once verified.
- Ghost and accent are note properties in GP8 (ghost: `AntiAccent`; accent:
  `Accent` flags) [VERIFY with the three snare bars].
- GP voices are flattened on read. On write, hands go to voice 1 and feet
  (K1 K2 P) to voice 2, with rests and beams generated from the slot layout.

### 12.4 What "lossless" means

For quantized input, the round-trip guarantee is at the **event level**: the same
set of (bar, position, lane, glyph) events comes back, plus the same tempo map,
meters and section labels.

- MIDI → grid → MIDI: exact positions and lanes; velocities come back as the
  configured value for their glyph class, not the original number. MIDI written by
  our own compiler round-trips byte for byte.
- GP → grid → GP: same events. Notation properties the grid cannot hold (dynamic
  markings, text, let ring, ghost-level variants, beaming choices, voice
  assignment) are not preserved by the grid. Phase 4 keeps them by copying
  untouched bars verbatim from the source file.

## 13. Guitar Pro 8 articulation table

Names and numbers verified from the GP8 Drumkit dialog (screenshot, 2026-10-08).
Still [VERIFY] with the exported test file: how `score.gpif` references
articulations, and how ghost, accent, flam and roll are stored.

| Lane / glyph | GP8 articulation | GP8 MIDI | Grid → GP writes | GP → grid reads |
|---|---|---|---|---|
| K1 | Kick (hit) | 36 | 36 | 36 |
| K2 | Kick (hit) | 35 | 35 | 35 |
| S1 | Snare (hit) | 38 | 38 | 38 |
| S1/S2 `r/R` | Snare (rim shot) | 91 | 91 | 91 → S1 `r/R` |
| S2 | Electric Snare (hit) | 40 | 40 | 40 |
| SS | Snare (side stick) | 37 (also 31) | 37 | 37, 31 |
| H | Hi-Hat (closed) | 42 | 42 | 42 |
| H `h/H` | Hi-Hat (half) | 92 | 92 | 92 |
| O | Hi-Hat (open) | 46 | 46 | 46 |
| P | Pedal Hi-Hat (hit) | 44 | 44 | 44 |
| R1 | Ride (middle) | 51 (also 126) | 51 | 51, 126 |
| R2 | Ride (edge) | 59 (also 93) | 59 | 59, 93 |
| B | Ride (bell) | 53 (also 127) | 53 | 53, 127 |
| R1/R2 `c/C` | Ride (choke) | 94 (also 29) | 94 | 94, 29 → R1 `c/C` |
| C1 | Crash high (hit) | 49 | 49 | 49 |
| C1 `c/C` | Crash high (choke) | 97 | 97 | 97 |
| C2 | Crash medium (hit) | 57 | 57 | 57 |
| C2 `c/C` | Crash medium (choke) | 98 | 98 | 98 |
| X | China (hit) | 52 | 52 | 52 |
| X `c/C` | China (choke) | 96 | 96 | 96 |
| SP | Splash (hit) | 55 | 55 | 55 |
| SP `c/C` | Splash (choke) | 95 | 95 | 95 |
| T1 | High Floor Tom (hit) | 50 | 50 | 50 |
| T2 | High Tom (hit) | 48 | 48 | 48 |
| T3 | Mid Tom (hit) | 47 | 47 | 47 |
| T4 | Low Tom (hit) | 45 | 45 | 45 |
| T5 | Very Low Tom (hit) | 43 | 43 | 43 |
| T6 | Low Floor Tom (hit) | 41 | 41 | 41 |

Notes:
- GP8 tom names don't match GM names (GP calls 50 "High Floor Tom"). The
  numbers match GM, and lanes follow the numbers.
- **R2 is a second ride in GM but "Ride (edge)" in Guitar Pro 8.** GP8 has one
  ride with middle, edge, bell and choke strokes. The lane keeps GM note 59 so it
  works both ways; the GP8 score shows it as ride edge.
- GP8 has a single rimshot and a single ride choke, so on read they come back on
  S1 and R1. A grid that rimshots S2 or chokes R2 loses that detail through GP
  (a reader warning, not silent).
- The default GP8 drum track contains only some articulations (5 toms, no 41, 40,
  59 or chokes). The writer adds missing articulations to the track's drumkit
  when a grid uses them [VERIFY in Phase 1.8].
- Articulations outside the lane map (cowbells 56/99/102, percussion, metronome,
  reverse cymbal 30, hand clap 39) are reported and dropped on read, never
  silently mapped. The default GP8 kit includes three cowbells, so expect these
  warnings on real files.

## 14. Validation errors (parser)

Every error carries file, line, bar, lane and column.

- `E001` missing or wrong magic line
- `E010` bad header token / order / value
- `E011` bar numbers not consecutive
- `E012` group beats do not sum to the numerator
- `E013` mid-bar tempo not at a group boundary; ramp with no end point
- `E020` unknown lane
- `E021` duplicate lane in bar
- `E022` cell count does not match the group's slots
- `E023` missing `|` separator at a group boundary
- `E030` unknown glyph, or glyph not valid for the lane
- `E031` H and O hit in the same slot
- `E040` `rep`/`alt`/`dir` in performed order

## 15. Examples

Traditional blast, 16ths, ride on the kick:
```
bar 33 ts=4/4 div=4 q=200 sec="Blast"
R1 |o-o-|o-o-|o-o-|o-o-|
S1 |-o-o|-o-o|-o-o|-o-o|
K1 |o-o-|o-o-|o-o-|o-o-|
```

D-beat:
```
bar 9 ts=4/4 div=4 q=170 sec="Verse"
C1 |x---|----|----|----|
H  |----|o-o-|o-o-|o-o-|
S1 |----|x---|----|x---|
K1 |x---|--x-|x---|--x-|
```

7/8 grouped 2+2+3 with a china:
```
bar 17 ts=7/8 div=4:2,4:2,6:3 q=160
X  |x---|----|------|
H  |--o-|o-o-|o-o-o-|
S1 |----|x---|----x-|
K1 |x-x-|--x-|x-x---|
```

Half-time shuffle with ghosts, 8th triplets:
```
bar 25 ts=4/4 div=3 q=90
R1 |o-o|o-o|o-o|o-o|
S1 |--g|--g|x-g|--g|
K1 |o--|--o|---|--o|
```

Sextuplet fill into a choked crash:
```
bar 40 ts=4/4 div=4,4,6,6 q=180 sec="Fill"
S1 |x-gg|o-o-|oooooo|------|
T3 |----|----|------|ooo---|
T5 |----|----|------|---ooo|
K1 |o---|o---|o-o-o-|o-o-o-|

bar 41 ts=4/4 div=4 q=180 sec="Chorus"
C1 |C---|----|----|----|
S1 |F---|----|----|----|
K1 |x---|----|----|----|
```

Riff onset grid next to drums (report block):
```
bar 12 ts=4/4 div=4 q=180
C1 |x---|----|----|----|
S1 |----|x---|----|x---|
K1 |x-xx|--x-|x-xx|--x-|
~~
G1 |M-MM|o=MM|M-MM|o===|
BS |O-OO|--OO|O-OO|----|
```

## 15a. Training pair record (Track B)

One JSON object per line:

```json
{"id": "lakh:abc123:b17-24", "source": "lakh", "license": "CC-BY-4.0",
 "section_role": "verse", "tempo": 180, "ts": "4/4",
 "input":  "<guitar onset grid text: magic line, bar headers, ~~ lanes>",
 "output": "<drum grid text: canonical, performed order>"}
```

- `section_role` in {intro, verse, prechorus, chorus, bridge, breakdown, solo,
  transition, fill, outro, unknown}.
- Windows are 1–8 bars; default 4. Window boundaries never cross a meter change
  unless the window is labelled `transition`.
- Drum-only pretraining records omit `input`.
- Training data always uses the standard lane map. Remap profiles never apply.

## 16. Grammar (EBNF)

```
file      = magic NL { meta NL | comment NL | NL } { bar }
magic     = "drumsmith-grid 1"
meta      = "@" ident SP value
comment   = "#" { any }
bar       = header NL { lane_line NL | comment NL } { NL }
header    = "bar" SP int SP "ts=" int "/" den SP "div=" divspec SP "q=" qspec
            [ SP "sec=" quoted ] [ SP "rep=" repspec ] [ SP "alt=" intlist ] [ SP "dir=" quoted ]
divspec   = int | group { "," group }
group     = int [ ":" int ]
qspec     = "~" | qpoint { "," qpoint }
qpoint    = number [ "~" ] [ "@g" int ]          (* first point has no @g *)
repspec   = "start" | "end*" int | "start,end*" int
lane_line = lane pad "|" cells { "|" cells } "|"
lane      = "C1"|"C2"|"X"|"SP"|"R1"|"R2"|"B"|"O"|"H"|"SS"|"S1"|"S2"
          | "T1"|"T2"|"T3"|"T4"|"T5"|"T6"|"K1"|"K2"|"P"
cells     = cell { cell }
cell      = "x"|"o"|"g"|"-"|"h"|"H"|"c"|"C"|"r"|"R"|"f"|"F"|"z"|"Z"
```
