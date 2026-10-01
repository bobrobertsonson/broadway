#!/usr/bin/env python3
"""After RX: put every file back at its original position, ready for Logic.

Usage:
    python3 finish.py /path/to/export-folder [--keep-stereo]

Reads _work/manifest.json (from prepare.py) and _work/RX_out/<group>/.
Writes Samples_READY/<set folder>/<name>_RX.wav (32-bit float, original length,
so it lines up at bar 1) and Samples_READY/finish_report.csv.

- Repaired groups (heroes, A-D) come from RX_out; they are folded to mono
  unless --keep-stereo is given.
- Group N (no repair) comes straight from the original, stereo kept.
- Group "copy" is not written: its source file replaces it.
- Every file gets one gain change to its loudness target (-20 or -28 LUFS).
"""

import argparse
import csv
import json
import math
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

import audio_metrics as am

REPAIRED = {"H", "A", "B", "C", "D"}


def find_rx(rx_out, stem):
    for p in rx_out.rglob("*"):
        if p.suffix.lower() not in am.AUDIO_EXTS or p.name.startswith("._"):
            continue
        s = p.stem
        for suffix in ("_RX", " RX", "-RX", "_rx"):
            if s.endswith(suffix):
                s = s[: -len(suffix)]
        if s == stem:
            return p
    return None


def measure(data, sr):
    mono = np.mean(data, axis=1)
    segs = am.find_segments(mono, sr)
    if not segs:
        return dict(lufs=float("-inf"), noise=float("nan"), high=float("nan"))
    power = am.k_weighted_power(data, sr)
    lufs = am.integrated_loudness(power, sr)
    nb = am.noise_and_bed(mono, sr, segs)
    a, b = segs[0][0], segs[-1][1]
    f, p = am.psd_db(mono[a:b], sr)
    _, high = am.bandwidth(f, p, sr)
    return dict(lufs=lufs, noise=nb["noise_floor"], high=high)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder")
    ap.add_argument("--keep-stereo", action="store_true", help="don't fold repaired files to mono")
    a = ap.parse_args()

    root = Path(a.folder).expanduser()
    work = root / "_work"
    try:
        manifest = json.loads((work / "manifest.json").read_text())
    except FileNotFoundError:
        sys.exit("No _work/manifest.json - run prepare.py first.")
    out_root = root / "Samples_READY"
    report = []

    for stem, e in sorted(manifest.items()):
        g = e["group"]
        row = dict(file=stem, group=g, target_lufs=e["target"], status="", notes="")
        if g == "copy":
            row["status"] = "skipped (copy: use its source file)"
            report.append(row)
            continue

        src = root / e["source"]
        orig, sr = sf.read(str(src), always_2d=True, dtype="float64")
        notes = []
        if g in REPAIRED:
            rx_path = find_rx(work / "RX_out", stem)
            if rx_path is None:
                row["status"] = "MISSING RX OUTPUT"
                report.append(row)
                print(f"  {stem}: no RX output yet")
                continue
            rx, rsr = sf.read(str(rx_path), always_2d=True, dtype="float64")
            if rsr != sr:
                row["status"] = f"ERROR: RX output is {rsr} Hz, original {sr} Hz"
                report.append(row)
                continue
            n = e["trim_frames"]
            if len(rx) != n:
                notes.append(f"length changed by {len(rx) - n} samples (padded/cropped)")
                rx = rx[:n] if len(rx) > n else np.vstack([rx, np.zeros((n - len(rx), rx.shape[1]))])
            before = orig[e["trim_start"]:e["trim_start"] + n]
            mb, ma = measure(before, sr), measure(rx, sr)
            nr = mb["noise"] - ma["noise"]
            drop = mb["lufs"] - ma["lufs"]
            row.update(noise_reduction_db=round(nr, 1), level_drop_db=round(drop, 1),
                       ceiling_before_hz=round(mb["high"]) if not math.isnan(mb["high"]) else "",
                       ceiling_after_hz=round(ma["high"]) if not math.isnan(ma["high"]) else "")
            if nr > 12:
                notes.append("noise cut > 12 dB: listen for watery artifacts")
            if drop > 6:
                notes.append("level fell > 6 dB in RX: check the voice wasn't removed")
            if not a.keep_stereo and rx.shape[1] > 1:
                rx = np.mean(rx, axis=1, keepdims=True)
            full = np.zeros((len(orig), rx.shape[1]))
            full[e["trim_start"]:e["trim_start"] + n] = rx
        else:  # N: level only
            full = orig.copy()

        lufs = am.integrated_loudness(am.k_weighted_power(full, sr), sr)
        if not math.isfinite(lufs):
            row["status"] = "silent after processing"
            report.append(row)
            continue
        gain = e["target"] - lufs
        full *= 10 ** (gain / 20)
        span = np.nonzero(np.any(full != 0, axis=1))[0]
        tp = am.true_peak_dbtp(full[span[0]:span[-1] + 1]) if len(span) else float("-inf")
        if tp > -1:
            notes.append(f"true peak {tp:+.1f} dBTP after gain (float file, no clipping; bus compressor will catch it)")

        set_dir = Path(e["source"]).parent
        out_dir = out_root / set_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        out = out_dir / f"{stem}_RX.wav"
        sf.write(str(out), full, sr, subtype="FLOAT")
        row.update(status="ok", gain_applied_db=round(gain, 1), true_peak_dbtp=round(tp, 1),
                   output=str(out.relative_to(root)))
        row["notes"] = "; ".join(notes)
        report.append(row)
        print(f"  {stem}: {gain:+.1f} dB -> {e['target']} LUFS" + (f"  [{row['notes']}]" if notes else ""))

    out_root.mkdir(exist_ok=True)
    cols = ["file", "group", "status", "target_lufs", "gain_applied_db", "true_peak_dbtp",
            "noise_reduction_db", "level_drop_db", "ceiling_before_hz", "ceiling_after_hz", "notes", "output"]
    with open(out_root / "finish_report.csv", "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        w.writerows(report)
    done = sum(r["status"] == "ok" for r in report)
    miss = sum(r["status"] == "MISSING RX OUTPUT" for r in report)
    print(f"\n{done} files written to {out_root}. {miss} still waiting on RX. Report: {out_root / 'finish_report.csv'}")


if __name__ == "__main__":
    main()
