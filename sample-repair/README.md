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
