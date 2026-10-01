#!/usr/bin/env python3
"""Get everything ready for RX, following plan.json.

Usage:
    python3 prepare.py /path/to/export-folder [--plan plan.json]

Creates, inside the export folder (originals are only read, never changed):
  _work/RX_in/<group>/   each file to repair, trimmed to its audio (+1 s pad) so RX
                         doesn't process minutes of silence. Point RX Batch here.
  _work/RX_out/<group>/  empty; save RX results here with the same file names.
  _work/listen/          short excerpts for the listening pass + LISTEN.txt
  _work/duplicates.txt   waveform comparison of suspected copies
  _work/manifest.json    original positions, used by finish.py to put files back
"""

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

import audio_metrics as am

SKIP_DIRS = {"_work", "Samples_READY"}
PAD_S = 1.0


def find_audio(root):
    files = {}
    for p in sorted(root.rglob("*")):
        rel = p.relative_to(root).parts
        if (p.suffix.lower() not in am.AUDIO_EXTS or p.name.startswith("._")
                or any(x in SKIP_DIRS or x.startswith("_triage") for x in rel)):
            continue
        if p.stem in files:
            print(f"Warning: two files named '{p.stem}': using {files[p.stem]}")
            continue
        files[p.stem] = p
    return files


def load_plan(path):
    plan = json.loads(Path(path).read_text())
    group_of = {}
    for g, names in plan["groups"].items():
        for n in names:
            group_of[n] = g
    return plan, group_of


def active_span(data, sr):
    mono = np.mean(data, axis=1)
    segs = am.find_segments(mono, sr)
    if not segs:
        return None
    return segs[0][0], segs[-1][1]


def _speech_band(x, sr):
    sos = signal.butter(4, [300, 3000], "band", fs=sr, output="sos")
    return signal.sosfiltfilt(sos, x)


def compare(pa, pb, max_s=60.0, search_s=1.0):
    """Compare a's audio against the same time range in b (band-limited to
    300-3000 Hz so EQ differences don't hide a shared source)."""
    a, sra = sf.read(str(pa), always_2d=True, dtype="float64")
    b, srb = sf.read(str(pb), always_2d=True, dtype="float64")
    if sra != srb:
        return f"different sample rates ({sra} vs {srb})"
    sr = sra
    span = active_span(a, sr)
    if span is None:
        return "first file is silent"
    s0, s1 = span
    s1 = min(s1, s0 + int(max_s * sr))
    am_ = _speech_band(np.mean(a, axis=1)[s0:s1], sr)
    pad = int(search_s * sr)
    b0, b1 = max(0, s0 - pad), min(len(b), s1 + pad)
    if b1 - b0 < len(am_):
        return "second file has no audio at that position -> different"
    bm = _speech_band(np.mean(b, axis=1)[b0:b1], sr)
    if np.sqrt(np.mean(bm * bm)) < 1e-6:
        return "DIFFERENT  (second file is silent at that position)"
    # normalized cross-correlation over the allowed lags
    c = signal.correlate(bm, am_, mode="valid", method="fft")
    ea = np.sqrt(np.sum(am_ * am_)) + 1e-20
    cs = np.concatenate([[0.0], np.cumsum(bm * bm)])
    eb = np.sqrt(cs[len(am_):] - cs[:-len(am_)]) + 1e-20
    ncc = c / (ea * eb)
    k = int(np.argmax(np.abs(ncc)))
    corr = float(ncc[k])
    lag_ms = ((b0 + k) - s0) / sr * 1000
    seg_b = bm[k:k + len(am_)]
    gain_db = 20 * math.log10((np.sqrt(np.mean(seg_b ** 2)) + 1e-20) / (np.sqrt(np.mean(am_ ** 2)) + 1e-20))
    if corr > 0.995 and abs(lag_ms) < 0.5 and abs(gain_db) < 0.1:
        verdict = "IDENTICAL"
    elif corr > 0.98:
        verdict = f"SAME AUDIO, {gain_db:+.1f} dB"
    elif corr > 0.8:
        verdict = "SAME SOURCE, processed differently (EQ/FX/bed)"
    elif corr < -0.8:
        verdict = "SAME AUDIO, polarity inverted"
    elif corr > 0.4:
        verdict = "PARTLY SHARED (layered or heavily processed)"
    else:
        verdict = "DIFFERENT"
    return f"{verdict}  (corr {corr:.3f}, offset {lag_ms:+.1f} ms, level {gain_db:+.1f} dB)"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder")
    ap.add_argument("--plan", default=str(Path(__file__).with_name("plan.json")))
    a = ap.parse_args()

    root = Path(a.folder).expanduser()
    if not root.is_dir():
        sys.exit(f"Not a folder: {root}")
    plan, group_of = load_plan(a.plan)
    files = find_audio(root)
    work = root / "_work"
    folders = plan["group_folders"]
    collage = set(plan.get("collage", []))
    targets = plan["targets"]

    unplanned = sorted(set(files) - set(group_of))
    missing = sorted(set(group_of) - set(files))

    manifest = {}
    counts = {}
    for stem, path in files.items():
        g = group_of.get(stem)
        if g is None:
            continue
        info = sf.info(str(path))
        entry = dict(source=str(path.relative_to(root)), group=g, sr=info.samplerate,
                     channels=info.channels, frames=info.frames,
                     target=targets["collage"] if stem in collage else targets["default"])
        if g in folders:
            data, sr = sf.read(str(path), always_2d=True, dtype="float64")
            span = active_span(data, sr)
            if span is None:
                print(f"  {stem}: silent, skipped")
                continue
            start = max(0, span[0] - int(PAD_S * sr))
            end = min(len(data), span[1] + int(PAD_S * sr))
            out_dir = work / "RX_in" / folders[g]
            out_dir.mkdir(parents=True, exist_ok=True)
            (work / "RX_out" / folders[g]).mkdir(parents=True, exist_ok=True)
            sf.write(str(out_dir / f"{stem}.wav"), data[start:end], sr, subtype="PCM_24")
            entry.update(trim_start=start, trim_frames=end - start)
            counts[g] = counts.get(g, 0) + 1
            print(f"  {folders[g]}/{stem}.wav  ({(end - start) / sr:.1f} s of {len(data) / sr:.1f} s)")
        manifest[stem] = entry
    work.mkdir(exist_ok=True)
    (work / "manifest.json").write_text(json.dumps(manifest, indent=1))

    # duplicate check
    lines = ["Waveform comparison of suspected copies (300-3000 Hz band).",
             "IDENTICAL / SAME AUDIO = keep one; SAME SOURCE = same recording, different processing.", ""]
    for x, y in plan.get("compare", []):
        if x in files and y in files:
            try:
                res = compare(files[x], files[y])
            except Exception as e:  # keep going
                res = f"error: {e}"
            lines.append(f"{x}  vs  {y}\n    {res}")
    (work / "duplicates.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))

    # listening pack
    listen = work / "listen"
    listen.mkdir(exist_ok=True)
    notes = ["Listening pass: play each file, answer the question, then edit plan.json if a group changes.", ""]
    for i, (stem, q) in enumerate(plan.get("listen", []), 1):
        if stem not in files:
            continue
        data, sr = sf.read(str(files[stem]), always_2d=True, dtype="float64")
        span = active_span(data, sr)
        if span is None:
            continue
        s0, s1 = span
        s1 = min(s1, s0 + int(30 * sr))
        clip = data[max(0, s0 - int(0.3 * sr)):s1]
        name = f"{i:02d} {stem}.wav"
        sf.write(str(listen / name), clip, sr, subtype="PCM_24")
        notes.append(f"{name}\n    {q}")
    (listen / "LISTEN.txt").write_text("\n".join(notes) + "\n")

    print("\nSummary")
    for g, n in sorted(counts.items()):
        print(f"  {folders[g]}: {n} files")
    if unplanned:
        print("  Not in plan.json (ignored): " + ", ".join(unplanned))
    if missing:
        print("  In plan.json but not found: " + ", ".join(missing))
    print(f"\nNext: listen to {listen}, then point RX Batch Processor at {work / 'RX_in'}/<group>"
          f"\n      and save results to {work / 'RX_out'}/<group> with the same file names.")


if __name__ == "__main__":
    main()
