# Sample repair tools

Tools for cleaning and matching ~100 spoken samples (movie clips, YouTube and phone
rips, tape) before they go on one summing bus in a dense metal mix. Nothing here
modifies your source files; every output goes into a new sub-folder.

## Phase 3: triage

```bash
./run_triage.sh "/Users/notsch/Music/Studio_Notsch/_ACTIVE/_Manipulator-Argent-Sample-Repair-Export"
# optional: --bpm 140 --sig 4 adds bar positions to each clip's location (constant tempo only)
```

Several sets in one combined report (the first set's files sit directly in the export folder, set 2 in its sub-folder):

```bash
E="/Users/notsch/Music/Studio_Notsch/_ACTIVE/_Manipulator-Argent-Sample-Repair-Export"
./run_triage.sh "$E" "$E/*Live Set Samples" --out "$E/_triage_combined"
```

The combined report has a `set` column and a **Next steps** section: music-bed files to confirm by ear,
the manual-RX list, the check-by-ear list, batch groups per source type, and files to re-export.

The first run creates a local Python environment (needs `python3`; macOS offers to
install the Command Line Tools if it's missing). Output:

- `_triage/triage_report.html`: open in a browser, sorted worst-first
- `_triage/triage.csv`: open in Numbers or Excel, with empty `tier` and `notes` columns for you to fill in

### What each column means

| Column | Meaning | How reliable |
|---|---|---|
| `lufs_integrated`, `gain_to_target_db` | BS.1770 loudness and the gain needed to reach -20 LUFS | Exact (matches pyloudnorm within 0.05 LU) |
| `segment_list` | Each clip on the track: start-end, loudness, gain | Exact |
| `true_peak_dbtp`, `clip_runs` | 4x oversampled peak; count of flat-topped runs at the file's peak (catches clipping that was turned down afterwards) | Reliable |
| `bandwidth_high_hz` | Where the spectrum falls 30 dB below the 2-4 kHz band: phone ~3.4-4.5k, HD phone ~7-8k, MP3/AAC ~16-17k, full-band ~Nyquist | Good for codec/phone cut-offs; gentle tape roll-off reads high |
| `snr_db`, `noise_floor_dbfs` | Loudest vs quietest 50 ms frames inside the clip | Rough: short clips with no pauses under-read |
| `bed` | clean / noise / busy bed / tonal bed (music?) / hum + noise | **Guess**: always confirm by ear |
| `hum_hz` | 50 or 60 Hz series at least 10 dB above its neighbours | Reliable when flagged |
| `stereo` | dual mono / narrow / wide (music or FX bed likely) / phase problem | Reliable |
| `source_guess`, `rx_chain`, `severity` | Suggested source type, RX module order, and triage score | Starting points, not verdicts |

**Severity:** 7+ = full manual RX pass. 4-6 = check by ear. 0-3 = batch processing is probably enough.

## RX chains by source

Order matters: clipping repair before separation, separation before de-reverb.

| Source | Chain |
|---|---|
| Film | De-clip (if flagged) -> Music Rebalance (voice only) or Dialogue Isolate -> Dialogue De-reverb -> Spectral Repair for leftover hits -> mono -> De-plosive |
| Rips | De-clip -> Dialogue Isolate (moderate) -> Spectral Recovery -> mono -> De-plosive |
| Phone | De-hum -> Dialogue Isolate -> Spectral Recovery -> De-plosive |
| Tape | De-hum -> Azimuth -> Wow & Flutter -> De-crackle -> Spectral De-noise (learned profile) |

Keep total noise reduction at 6-10 dB. Leftover hiss gets buried in the mix. Watery
artifacts don't, especially after saturation and compression.

Save results to `Samples_RX/` with the same file names (adding `_RX` is fine).

## Round trip with Logic

1. Export: **File -> Export -> All Tracks as Audio Files**, WAV, 24-bit or 32-bit float, Normalize off, Bypass Effect Plug-ins on, Include Volume/Pan Automation off. Every file starts at bar 1.
2. Triage (above), then RX.
3. Re-import the RX files at bar 1 onto new tracks inside the sample Summing Stack. Keep the originals in a muted `RAW` stack.

## Phases 4-6: prepare, RX, finish (no re-aligning in Logic)

```bash
E="/Users/notsch/Music/Studio_Notsch/_ACTIVE/_Manipulator-Argent-Sample-Repair-Export"
./run.sh prepare "$E"     # before RX
# ... RX work ...
./run.sh finish "$E"      # after RX; re-run any time, it picks up whatever is done
```

**prepare** (groups come from `plan.json`, so edit that file if the listening pass changes a group):
- `_work/duplicates.txt`: waveform check of the suspected copies (IDENTICAL / SAME AUDIO / SAME SOURCE / DIFFERENT)
- `_work/listen/`: short excerpts plus `LISTEN.txt`, the 10-minute listening pass
- `_work/RX_in/<group>/`: each file to repair, trimmed to its audio plus 1 s. RX processes seconds of audio instead of a 29-minute file
- `_work/RX_out/<group>/`: empty folders. Save RX results here with the same file names (an `_RX` suffix is fine)

**finish**:
- Puts every repaired file back at its exact original sample position, at full length. Verified sample-accurate in testing
- Folds repaired files to mono (use `--keep-stereo` to keep stereo). No-repair files stay as they were
- Applies one gain change per file to reach -20 LUFS, or -28 LUFS for collage layers. Output is 32-bit float, so nothing clips
- Writes `Samples_READY/` with the same folder layout as the export, plus `finish_report.csv`. The report flags noise cuts over 12 dB (listen for artifacts) and level drops over 6 dB (the voice may have been removed)

**Into Logic:** set the playhead to bar 1 (the point your export started from) and drag the `Samples_READY` files in. Each clip lands where the original was. The project must stay at 44.1 kHz.

## RX: building the chains (about 10 min, once)

1. Open **Module Chain** (Window menu). Add the modules for group A: Music Rebalance, Dialogue De-reverb, De-plosive. Set each one, then save the chain as `A music bed`.
2. Repeat for B (Dialogue Isolate, Dialogue De-reverb, De-plosive), C (De-hum, Dialogue Isolate, De-plosive) and D (Spectral De-noise).
3. Open **Batch Processor**. Add the files from `_work/RX_in/2_A_music_bed`, choose the `A music bed` chain, set output to `_work/RX_out/2_A_music_bed`, format WAV 24-bit, keep the file names. Process.
4. Repeat for B, C and D. Do the heroes (`1_Heroes_manual`) one at a time in the main window, saving each into `_work/RX_out/1_Heroes_manual`.
