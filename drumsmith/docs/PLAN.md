# Drumsmith — Project Plan (DRAFT, awaiting approval)

Companion to `docs/GRID_SPEC.md`. Nothing here is implemented yet.

---

## 0. Read this first: risks and open decisions

1. **Track B will probably not beat the Track A baseline on metal.** Public
   paired guitar+drums MIDI with real metal drumming is scarce. Lakh and GigaMIDI
   are mostly pop/rock and often have simplified drum parts. The dataset with the
   most metal (DadaGP) is gated. The B2 baseline gate is the right call; plan for
   it to end Track B. Treat Track B as a cheap experiment, not a deliverable.
2. **"Lossless" round-trip is defined at the event level** (GRID_SPEC §12.4).
   Exact MIDI velocities and Guitar Pro notation details (dynamic markings, let
   ring, beaming, voices) do not survive grid conversion. Phase 4 keeps them by
   copying untouched bars verbatim from the source file.
3. **The Guitar Pro 8 writer is the riskiest component.** The `.gpif` format is
   undocumented. Adding a track likely touches `PartConfiguration` and
   `LayoutConfiguration` inside the `.gp` zip as well as `score.gpif`. The
   template-file approach and your manual open-in-GP8 checks are the safety net.
4. **This repo is a website (`broadway`).** Drumsmith should live in its own
   repository. The drafts sit in `drumsmith/docs/` here, uncommitted, until you
   decide.
5. **Datasets don't belong in the cloud container.** It is ephemeral and has a
   small disk allowance. Track B data work (B1) should run on your machine or a
   rented box.
6. **SS lane naming.** GM 37 is side stick. The spec treats snare rimshot as a
   variant on S1/S2 (`r`/`R`), not as SS. Confirm or override.

## 1. Architecture

```
            .gp (GP8)        .gp3/4/5           .mid
                │                │                │
         gp8 reader       legacy reader      midi reader
         (score.gpif)     (PyGuitarPro)        (mido)
                └──────────┬─────┴────────────────┘
                           ▼
                 Score model (internal)
      tempo map · meters · master bars · sections · repeats
      tracks (drums / guitar / bass / other) · events per bar
                           │
             ┌─────────────┼───────────────────────┐
             ▼             ▼                       ▼
        drum grid     guitar onset grid       song map (Ph2)
       (GRID_SPEC)      (GRID_SPEC §9)              │
             │             │                       │
   playability ◄──── Claude (skills) ───────► library retrieval (Ph5)
   checker            reads/writes grid             │
             │             │                  Track B generator (B4)
             ▼             ▼
   grid→MIDI compiler   grid→GP8 notes → gp8 writer (Ph4)
        │ (+ remap profile, sidecar)
        ▼
   FluidSynth audition (WAV)
```

Principles:
- Python handles parsing, analysis, validation, compilation, retrieval.
  Claude handles musical judgment and writes grids. Skills teach it how.
- Every Claude-written grid goes through `drumsmith validate` (syntax and
  playability) before compilation. Playability issues are reported, never
  auto-fixed.
- Outputs are written next to the source with a `.drumsmith` suffix and never
  overwrite: `song.drumsmith.gp`, `song.drumsmith.mid`,
  `song.drumsmith.mid.txt` (sidecar), `song.drumsmith.grid.txt`. If a file
  exists, `-2`, `-3`… is appended.

## 2. Repository layout

```
drumsmith/
  .claude-plugin/plugin.json
  commands/                     # slash commands → call the CLI
    ds-analyze.md ds-critique.md ds-follow-riff.md ds-vary.md ds-fill.md
    ds-edit.md ds-structure.md ds-export.md ds-audition.md
  skills/
    grid-format/SKILL.md        # Phase 1
    drum-vocabulary/SKILL.md    # Phase 3 (blasts, gravity, skank, d-beat, poly, displacement, ghosts)
    analyze/ critique/ follow-riff/ vary/ fill/ edit/ structure/ export/
  src/drumsmith/
    lanes.py                    # the 21 lanes, GM notes, limbs, canonical order
    grid/        model.py parser.py serializer.py validate.py expand.py
    score/       model.py       # internal Score model shared by all readers
    io/          midi_read.py midi_write.py legacy_gp_read.py audition.py
    gp8/         container.py gpif_read.py gpif_write.py articulations.py
    profiles/    loader.py validate.py sidecar.py
    playability/ limbs.py checker.py
    analysis/    onsets.py songmap.py align.py metrics.py report.py   # Phase 2
    transform/   halftime.py displace.py orchestrate.py density.py    # Phase 3
    library/     ingest.py dedupe.py tags.py retrieve.py export.py    # Phase 5
    structure/   suggest.py                                           # Phase 6
    cli.py
  config/  velocity.yaml  playability.yaml
  profiles/ standard-gm.yaml  <your plugin profiles>.yaml
  tests/  unit/ roundtrip/ golden/ fixtures/ fixtures/private/ (gitignored)
  docs/   GRID_SPEC.md PLAN.md GP8_NOTES.md
  pyproject.toml
```

Track B lives in a separate worktree (`../drumsmith-trackb`, branch `track-b`)
under `trackb/`, sharing `src/drumsmith` read-only. Data under `data/` is
gitignored except `data/LICENSES.md` and `data/REPORT.md`.

## 3. Dependencies

| Package | Use | Notes |
|---|---|---|
| Python ≥ 3.11 | | `uv` for env management |
| `mido` | MIDI read/write | |
| `lxml` | `score.gpif` parsing and writing | keep source formatting where possible |
| `PyGuitarPro` (current, not 0.6) | `.gp3/.gp4/.gp5` reading | LGPL, fine for personal use |
| `pyyaml` + `pydantic` | profiles and config validation | |
| `typer` | CLI | |
| `numpy` | analysis features, similarity | no vector DB needed at this scale |
| FluidSynth (binary) | audition | called as subprocess; you supply a drum `.sf2` |
| `pytest`, `hypothesis` | tests, property-based round-trips | |
| Track B only | `datasets`, `pyarrow`, `torch`, `transformers`, `peft` | installed in the Track B worktree only |

## 4. Phase 1 — Foundation

Goal: every format converts to and from the grid deterministically, with tests.

| Task | Content | Acceptance |
|---|---|---|
| 1.1 Skeleton | package, `lanes.py`, config loading, CLI shell, plugin manifest, CI script | `drumsmith --help` works; lint and tests run |
| 1.2 Grid core | model, parser, canonical serializer, error codes per GRID_SPEC §14, `expand` (written→performed) | every spec example parses; property test `parse∘serialize = id`; each error code has a failing fixture |
| 1.3 Score model | internal model: tempo map (incl. ramps), meters, master bars, sections, repeats, tracks, events | shared by all readers; unit tests |
| 1.4 MIDI writer | grid→MIDI, velocity table, flams, rolls, markers | golden files; byte-identical re-runs |
| 1.5 MIDI reader | MIDI→Score; drum→grid with div detection and quantization report; all tracks' onsets | round-trip MIDI→grid→MIDI exact at event level; quantization error report tested |
| 1.6 GP8 reader | unzip, parse `score.gpif`: master bars, tracks, tempo automations, sections, repeats/alternates/directions, drum articulation table, guitar notes (palm mute, dead, accent, ties) | your test file reads 100% correct; lane table in GRID_SPEC §13 verified |
| 1.7 Legacy GP reader | `.gp3/4/5` via PyGuitarPro → Score | sample files read; drum notes map to lanes |
| 1.8 GP8 drum-note emitter | grid → gpif Bars/Voices/Beats/Notes/Rhythms for one drum track, written into a copy of a file | `.gp` drums→grid→`.gp` drums is event-identical; output re-reads cleanly |
| 1.9 Remap profiles | loader, validation (range, duplicates, unmentioned lanes), per-glyph and per-variant remap, velocity overrides, sidecar | every lane in a sample profile lands on its note; no profile = standard GM byte-identical |
| 1.10 Playability | limb model, checker, configurable speed limits | fixture suite of legal and illegal patterns |
| 1.11 Audition | grid/MIDI → WAV via FluidSynth, standard map | WAV produced; missing soundfont gives a clear error |
| 1.12 grid-format skill | teaches Claude to read and write the grid, with examples and error codes | Claude writes 10 valid grids from prompts with no parse errors |

Phase 1 CLI:
```
drumsmith read <file> [--track N] [--order written|performed]   → grid / score summary
drumsmith grid validate <grid> [--playability]
drumsmith grid expand <grid>
drumsmith compile midi <grid> [--profile NAME] [--velocity NAME]
drumsmith compile gp <grid> --into <source.gp> [--track N]       # Phase 1: test-grade
drumsmith profile check <name>
drumsmith check <grid|file>                                       # playability report
drumsmith audition <grid|mid> [--soundfont PATH]
```

### 4.1 Playability model
- Limbs: right hand, left hand, right foot, left foot.
- Feet lanes: K1 (RF), K2 (LF), P (LF). Hands: everything else.
- Hand assignment: dynamic programming over time assigns left or right to each
  hand stroke. Cost includes kit position (hi-hat left, ride and floor tom right),
  movement distance, and crossings. A crossing is flagged when the cheapest
  assignment still crosses.
- Single-lane double bass: if K1 alone exceeds the single-foot speed limit, the
  checker assumes double pedal (both feet). Any P or K2 hit during that stretch
  is then flagged.
- Checks: more than 2 hands or 2 feet at one instant; same-hand
  strokes faster than the limit; feet faster than the limit; impossible hat states
  (P closing on an O hit). Flams count as one hand.
- Speed limits live in `config/playability.yaml` in strokes per second per limb,
  with presets `pro` and `extreme`. The defaults are my guesses and need tuning
  against real parts.
- Output: warnings with bar, slot, lanes, reason. Never modifies the grid.

## 5. Remap profile format

```yaml
# profiles/ezd3-metal.yaml
name: ezd3-metal
description: "EZdrummer 3 metal kit, my mapping"
channel: 10                      # default for all lanes (1-16)
fallback: standard               # lanes not listed use GM; reported as such
allow_shared_notes:              # duplicates allowed only if listed here
  - [X, T6]
lanes:
  S1:
    note: 38
    glyphs:                      # optional per-glyph or per-variant remap
      g: { note: 37 }
      r: { note: 40 }
      R: { note: 40 }
  H:
    note: 42
    glyphs: { h: { note: 23 } }  # half-open hat to a plugin-specific note
  C2: { note: 57, channel: 10 }
  T6: { note: 52 }               # repurpose low floor tom as second china
velocity:                        # optional; overrides config/velocity.yaml
  glyphs: { x: 127, o: 100, g: 35 }
  lanes:
    K1: { x: 127, o: 120, g: 90 }
import:                          # optional inverse map for Phase 5 pattern packs
  notes: { 23: [H, h] }          # extra non-GM input notes → lane + glyph
```

Validation on load (errors stop export; warnings print):
- error: note outside 0–127, channel outside 1–16, unknown lane, unknown glyph
  for a lane
- error: two lanes or glyphs mapped to the same (note, channel) unless listed in
  `allow_shared_notes`
- warning: each lane not mentioned (falls back to standard)
- warning on import: a many-to-one map that can't be inverted unambiguously

Sidecar `<output>.mid.txt`:
```
drumsmith export · 2026-10-08T14:02:11
source grid: song.drumsmith.grid.txt
profile: ezd3-metal (profiles/ezd3-metal.yaml, sha256 3f2a…)
remapped:
  S1 g      38 → 37  ch10
  H  h      42 → 23  ch10
  T6        41 → 52  ch10   (shared with X, allowed)
standard (not mentioned): C1 C2 X SP R1 R2 B O SS S2 T1 T2 T3 T4 T5 K1 K2 P
```
Profiles apply only inside `compile midi`. The grid, the `.gp` output, the
library and the training data never see them.

## 6. Phase 2 — Tab analysis

- `drumsmith analyze <file>` → markdown report next to the source:
  1. Song map: sections from GP markers. When there are none, segmentation from
     a bar self-similarity matrix of combined drum and guitar onset grids, then
     labels by repetition and energy (verse/chorus guesses marked as such).
  2. Drum part as grid, per section.
  3. Guitar onset grid per bar, aligned under the drums (GRID_SPEC §9 block).
  4. Alignment per bar: kick vs low-register guitar onsets (matched / kick
     alone / riff accent unsupported), snare vs guitar accents, crash at section
     starts, density ratio of drums to guitar.
- `drumsmith critique <file>`: Python computes metrics (identical-bar run
  lengths, variation across section repeats, missing transitions or fills
  before section changes, cymbal monotony, alignment score, density vs section
  energy). The critique skill turns them into prose: what is weak, where, why,
  and what to try.
- Tests: golden reports on fixture songs; metric unit tests on synthetic grids.

## 7. Phase 3 — Generation and editing

Claude writes grids. Python supplies context and checks the result.

- `drumsmith context <file> --bars 17-24` → compact pack: riff onset grid,
  section role, neighbouring drum bars, tempo, playability limits.
- Deterministic transforms in Python (exact and cheap, no need for Claude):
  half time, double time, displacement by N slots, orchestration swap (lane →
  lane), density thinning by glyph class.
- Claude-driven, with skills: `follow-riff` (kick locks to low-register and
  accented guitar onsets, snare and cymbals placed around it), `vary` (density
  up, creative variations), `fill` (N beats into a target bar), `edit` (a
  described change applied to a bar range, output as a diff against the source).
- Loop for every command: draft grid → `validate --playability` → revise →
  compile → optional audition. Claude shows the warnings; it does not hide them.
- Tests: transforms are unit-tested. Generation is checked with a fixed set of
  riffs: valid syntax 100%, playability pass rate and kick alignment tracked as
  numbers, not pass/fail.

## 8. Phase 4 — Native Guitar Pro 8 output

- Copy the source `.gp`. Replace the drum track, or add one, in `score.gpif`.
  Every other XML node is untouched; untouched drum bars are copied verbatim.
- New drum track: drumkit `InstrumentSet` and track settings are taken from a
  template `.gp` you supply. Update any part and layout files the zip needs.
- New file: inject into a user-supplied template.
- Validation: re-read output with our reader; canonical diff of all non-drum XML
  must be empty; zip structure matches the source. You confirm opening in GP8 for
  each new writer capability (tracked in `docs/GP8_NOTES.md`).
- MIDI export remains the fallback.

## 9. Phase 5 — Reference library

- `drumsmith library ingest <folder> [--import-profile NAME]`, idempotent by
  file hash. Type is recorded on every entry: `midi_pattern`, `gp_pattern`,
  `gp_song`.
- Song files are split by the Phase 2 song map. Each drum bar or phrase is stored
  with its guitar onset grid and section role.
- Dedupe: exact repeats collapse into one pattern with a `repeat_count`. Near
  repeats (≥ 85% cell agreement after meter normalisation, threshold
  configurable) link to a parent pattern as variations.
- Tags: tempo, meter, div, density per limb, feel (straight / triplet / swung),
  detected idioms (blast variants, d-beat, skank, half time, gravity), limb usage.
- Storage: `library/index.jsonl` plus `library/entries/<id>.json`, each with
  source path, bar range, type, tags, grid, and the guitar grid where present.
- `drumsmith library find "<request>" | --riff <grid> | --role breakdown [--k 8]`.
  Riff matching searches only `gp_song` entries. Scoring blends onset similarity
  (low-register onsets weighted), meter and tempo window, and role.
- Skills require Claude to adapt rather than copy, and to name the entries it
  drew from.
- `drumsmith library export --jsonl out.jsonl` writes `gp_song` entries as
  GRID_SPEC §15a training pairs.
- Size estimate: about 2 KB per bar entry; 500 songs × 150 bars ≈ 150 MB before
  dedupe, much less after.

## 10. Phase 6 — Structure suggestions

- `drumsmith structure <file>`: from the song map and Phase 2 metrics, propose
  repeats, cuts, builds, breakdowns, feel shifts and transitions. Each proposal
  states the section, the change and the reason.
- `--apply N`: write drum parts for chosen proposals into a copy via the Phase 4
  writer. Structural changes that add or remove bars in other tracks are
  proposed only, never applied, in v1. Changing guitar tracks is out of scope.

## 11. Track B — Model training (starts after Phase 1 approval and grid freeze)

Worktree: `git worktree add ../drumsmith-trackb track-b`. Implementation is
delegated to Sonnet subagents, reviewed against this plan.

### B1. Data

| Source | Licence | Raw size (est.) | Use |
|---|---|---|---|
| Groove MIDI Dataset, MIDI-only | CC BY 4.0 | under 10 MB [Likely] | drum-only pretraining, feel and style tags |
| GigaMIDI `all-instrument-with-drums` (streamed) | CC BY-NC 4.0, gated on Hugging Face | several GB in full; filtered subset well under 1 GB [Guessing] | paired |
| Lakh MIDI (LMD-full + LMD-matched + MSD metadata) | CC BY 4.0 | about 1.7 GB tarball, several GB extracted [Likely] | paired; genre via MSD-linked tag sets (tagtraum or Last.fm, licences to check) |
| DadaGP | gated, request only | — | importer only, via our Phase 1 reader |
| Your library | personal | Phase 5 | paired, highest weight |

Peak disk about 15–20 GB with raw downloads; about 3 GB after conversion and
cleanup [Guessing]. Converted grid text is small, around 1–2 KB per bar.

Steps:
- `data/LICENSES.md`: source, licence, attribution, URL, date for every dataset.
  All use is personal and non-commercial.
- Track filter: drum track plus at least one guitar (GM programs 25–32),
  optional bass (33–40). Style filter toward metal, hardcore, grind, punk and heavy
  rock. Counts per style are reported before any further filtering. The GigaMIDI
  style metadata fields need checking before the filter is written.
- Quality filter with every rejection logged (`data/rejections.jsonl`, reason
  code, file, measured value): missing or nonsensical tempo map; drums on the
  wrong channel; drum notes outside the 21-lane map; one bar looped for the whole
  song; guitar tracks with no rhythmic activity. Thresholds live in
  `trackb/filters.yaml`.
- No scraping of tab sites or anything that prohibits automated access. GP files
  come only from your hand-curated folder.
- Conversion: paired sources → §15a JSONL pairs; drum-only sources → drum-only
  records. Standard lane map only.
- `data/REPORT.md`: counts per source, genre, tempo range, meter, density. The
  held-out test split is fixed by song (never by window, to avoid leakage),
  weighted toward metal, and stored separately with a hash so training code can
  assert it never reads it.
- Hugging Face: the Hugging Face connector in this session isn't authorised.
  GigaMIDI needs you to accept its terms on the website and use an access token
  on whatever machine runs B1.

### B2. Baseline
On the test split, run Track A (Claude + retrieval, follow-riff) and measure:
- playability pass rate
- kick-to-guitar-accent alignment: precision and recall of kick onsets against
  low-register and accented guitar onsets
- diversity: distinct-bar ratio, n-gram entropy across a song
- closeness to the human part: per-lane onset F1 against the real drums (the
  test split has them)

Cost note: this means many Claude calls (e.g. 200 windows × several turns). I will
estimate token cost and ask before running it.

### B3. Training plan (proposal only; stop for approval before any spend)
- Option 1: LoRA fine-tune of a small open model (1–3B) on grid text. Estimate:
  roughly 5–20 GPU-hours on one A100/H100-class GPU, about $15–60 rented
  [Guessing; refined after B1 token counts].
- Option 2: small transformer (20–50M parameters) trained from scratch on a
  grid tokenizer. Estimate: a few GPU-hours; feasible on a recent Apple Silicon
  machine or a mid-range NVIDIA card, more slowly [Guessing].
- Stage 1: drum-only pretraining. Stage 2: paired fine-tuning. Final pass
  weighted toward metal and your library.
- The recommendation for local versus rented depends on your machine.

### B4. Integration
If a model beats the baseline on alignment and closeness without losing
playability: `drumsmith generate --candidates N` runs the model, every candidate
goes through the playability checker, and Claude critiques, ranks and edits
before you see anything.

## 12. Test strategy

- **Unit:** grid parser/serializer, error codes, lanes, profiles, playability
  rules, transforms, metrics.
- **Property (hypothesis):** random valid grids → serialize/parse identity;
  grid→MIDI→grid identity; grid→GP→grid identity; profile=none → standard GM
  bytes.
- **Golden:** spec examples, CLI outputs, analysis reports, sidecars.
- **Fixtures:** your GP8 lane-chart test file (ground truth for the
  articulation table); synthetic MIDI; a few of your own songs in
  `tests/fixtures/private/` (gitignored, never committed).
- **Manual gates:** GP8 open checks for writer features; listening via audition.
- **Phase gate:** all tests green, CLI demo on your files, your approval.

## 13. How work is delegated

- I own architecture, specs, task breakdown, and review.
- Each task above goes to a Sonnet subagent with: the spec sections it touches,
  the files it may change, acceptance tests to write first, and the commands to
  run.
- Independent tasks run in parallel in separate worktrees (Phase 1: 1.2, 1.3,
  1.9, 1.10 in parallel after 1.1; readers and writers after 1.2–1.3).
- Review: I read every diff against the plan and spec, run the full test suite,
  and send it back with specific defects if it fails. Nothing merges on the
  agent's own report.

## 14. Answers needed before implementation

1. Genres to prioritise (ordered).
2. Is your tab and pattern library ready? Rough count of `.gp`, `.gp5` and MIDI
   files.
3. OS, machine, RAM, GPU or Apple Silicon model.
4. Open to renting GPU time? Budget ceiling?
5. Drum plugins you want MIDI profiles for (e.g. EZdrummer 3, Superior Drummer 3,
   GetGood Drums, Addictive Drums 2, Steven Slate). Include the kit or preset if the
   map differs per kit.
6. Test file: a short GP8 file with one labelled bar per lane you use (all 21 if
   possible), plus bars for each variant you use (half-open hat, chokes, rimshot,
   flam, roll), plus three bars of snare: ghost, normal, accent.
7. Where should drumsmith live: a new GitHub repo (I can't create one without
   your go-ahead), or a branch here?
8. SS = side stick and rimshot = S1/S2 variant: OK?
9. A drum `.sf2` for audition, or should I suggest a freely licensed one?
