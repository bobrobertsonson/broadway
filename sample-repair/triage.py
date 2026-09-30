#!/usr/bin/env python3
"""Phase 3 triage: measure every audio file in a folder and rank them worst-first.

Usage:
    python3 triage.py /path/to/export-folder [--bpm 140 --sig 4 --start-bar 1]
                      [--target -20] [--jobs 4]

Writes <folder>/_triage/triage.csv and <folder>/_triage/triage_report.html.
Nothing in the source folder is modified.
"""

import argparse
import csv
import html
import math
import os
import sys
import traceback
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np

import audio_metrics as am


def classify_source(high_hz, hum_hz, snr, stereo):
    if math.isnan(high_hz):
        return "unknown"
    if high_hz < 5000:
        return "phone (narrowband)"
    if high_hz < 8500:
        return "phone HD / very low bitrate"
    if hum_hz and high_hz < 17500 and snr < 45:
        return "analog / tape?"
    if high_hz < 13000:
        return "low-bitrate rip / broadcast"
    if high_hz < 17500:
        return "compressed rip (MP3/AAC)"
    if stereo.startswith("wide"):
        return "full-band, stereo mix (film?)"
    return "full-band"


def recommend_chain(r):
    chain = []
    if r["clip_runs"] > 5:
        chain.append("De-clip")
    if r["dc_offset_db"] > -50:
        chain.append("DC offset removal")
    if r["hum_hz"]:
        chain.append(f"De-hum ({r['hum_hz']} Hz)")
    bed = r["bed"]
    wide = r["stereo"].startswith("wide")
    if ("tonal" in bed and "light" not in bed) or wide:
        chain.append("Music Rebalance (voice solo) or Dialogue Isolate")
    elif "busy" in bed:
        chain.append("Dialogue Isolate")
    elif r["snr_db"] < 35 or "light" in bed:
        chain.append("Dialogue Isolate / Spectral De-noise (<=10 dB)")
    if r["source_guess"].startswith("analog"):
        chain.append("Wow & Flutter / Azimuth (listen first)")
    if not math.isnan(r["bandwidth_high_hz"]) and r["bandwidth_high_hz"] < 12000:
        chain.append("Spectral Recovery")
    chain.append("Dialogue De-reverb (by ear)")
    if r["channels"] > 1:
        chain.append("Mono (Center Extract if wide)" if wide else "Mono")
    chain.append("De-plosive / Mouth De-click as needed")
    return chain


def severity(r):
    s = 0
    h = r["bandwidth_high_hz"]
    if not math.isnan(h):
        s += 3 if h < 5000 else 2 if h < 8500 else 1 if h < 13000 else 0
    snr = r["snr_db"]
    if not math.isnan(snr):
        s += 3 if snr < 20 else 2 if snr < 30 else 1 if snr < 40 else 0
    s += 3 if r["clip_runs"] > 50 else 2 if r["clip_runs"] > 5 else 1 if r["clip_runs"] > 0 else 0
    s += 2 if r["hum_hz"] else 0
    s += 3 if "tonal bed" in r["bed"] and "light" not in r["bed"] else 2 if "busy" in r["bed"] else 1 if "light" in r["bed"] else 0
    s += 1 if r["stereo"].startswith(("wide", "phase", "one side")) else 0
    return s


def analyze(path, bpm=None, sig=4, start_bar=1, target=-20.0):
    data, sr, info = am.load(path)
    mono = np.mean(data, axis=1)
    duration = len(data) / sr
    segs = am.find_segments(mono, sr)
    r = dict(file=path.name, sample_rate=sr, channels=data.shape[1],
             format=f"{info.format}/{info.subtype}", duration_s=round(duration, 2),
             segments=len(segs))
    if not segs:
        r.update(error="silent file (nothing above -60 dBFS)")
        return r

    a0, b0 = segs[0][0], segs[-1][1]
    active = data[a0:b0]
    mono_active = mono[a0:b0]
    power = am.k_weighted_power(data, sr)

    seg_desc, seg_gains = [], []
    for a, b in segs:
        lufs = am.integrated_loudness(power[a:b], sr)
        gain = target - lufs if math.isfinite(lufs) else float("nan")
        seg_gains.append(gain)
        seg_desc.append(f"{am.fmt_time(a / sr, bpm, sig, start_bar)}-{am.fmt_time(b / sr)} "
                        f"[{lufs:.1f} LUFS, {gain:+.1f} dB]")

    lufs_i = am.integrated_loudness(power, sr)
    f, p = am.psd_db(mono_active, sr)
    low, high = am.bandwidth(f, p, sr)
    hum_hz, hum_prom = am.hum(f, p)
    nb = am.noise_and_bed(mono, sr, segs, band=(low, high))
    if hum_hz and "tonal" in nb["bed"]:
        nb["bed"] = "hum + noise"
    runs, peak = am.clipping_runs(active)
    st = am.stereo_info(data, segs)
    dc = float(np.mean(mono_active))

    r.update(
        first_audio=am.fmt_time(a0 / sr, bpm, sig, start_bar),
        lufs_integrated=round(lufs_i, 1),
        lufs_short_term_max=round(am.max_short_term(power[a0:b0], sr), 1),
        lufs_momentary_max=round(am.max_momentary(power[a0:b0], sr), 1),
        gain_to_target_db=round(target - lufs_i, 1) if math.isfinite(lufs_i) else float("nan"),
        segment_gain_spread_db=round(max(seg_gains) - min(seg_gains), 1) if len(seg_gains) > 1 else 0.0,
        sample_peak_dbfs=round(peak, 2),
        true_peak_dbtp=round(am.true_peak_dbtp(active), 2),
        clip_runs=runs,
        bandwidth_low_hz=round(low) if not math.isnan(low) else low,
        bandwidth_high_hz=round(high) if not math.isnan(high) else high,
        noise_floor_dbfs=round(nb["noise_floor"], 1),
        speech_level_dbfs=round(nb["speech_level"], 1),
        snr_db=round(nb["snr"], 1),
        bed=nb["bed"],
        bed_flatness=round(nb["bed_flatness"], 3) if not math.isnan(nb["bed_flatness"]) else "",
        hum_hz=hum_hz or "",
        hum_prominence_db=round(hum_prom, 1) if hum_hz else "",
        stereo=st["stereo"],
        lr_correlation=round(st["correlation"], 3) if not math.isnan(st["correlation"]) else "",
        dc_offset_db=round(20 * math.log10(max(abs(dc), 1e-12)), 1),
        segment_list="; ".join(seg_desc),
    )
    r["source_guess"] = classify_source(high, hum_hz, nb["snr"], st["stereo"])
    r["severity"] = severity(r)
    r["rx_chain"] = " -> ".join(recommend_chain(r))
    return r


def _worker(args):
    path, kw = args
    try:
        return analyze(path, **kw)
    except Exception as e:  # keep going on bad files
        return dict(file=path.name, error=f"{type(e).__name__}: {e}",
                    trace=traceback.format_exc(limit=2))


COLUMNS = [
    "severity", "file", "tier", "notes", "source_guess", "rx_chain",
    "segments", "first_audio", "lufs_integrated", "gain_to_target_db",
    "lufs_short_term_max", "lufs_momentary_max", "segment_gain_spread_db",
    "sample_peak_dbfs", "true_peak_dbtp", "clip_runs",
    "bandwidth_low_hz", "bandwidth_high_hz", "noise_floor_dbfs", "speech_level_dbfs",
    "snr_db", "bed", "bed_flatness", "hum_hz", "hum_prominence_db",
    "stereo", "lr_correlation", "dc_offset_db",
    "sample_rate", "channels", "format", "duration_s", "segment_list", "error",
]


def write_csv(rows, out):
    with open(out, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in COLUMNS})


def write_html(rows, out, folder, target):
    def cls(r):
        s = r.get("severity", 0) or 0
        return "bad" if s >= 7 else "warn" if s >= 4 else "ok"

    counts = {}
    for r in rows:
        counts[r.get("source_guess", "error")] = counts.get(r.get("source_guess", "error"), 0) + 1
    summary = "".join(f"<li>{html.escape(k)}: {v}</li>" for k, v in sorted(counts.items(), key=lambda x: -x[1]))

    body = []
    for r in rows:
        if r.get("error"):
            body.append(f"<tr class='bad'><td>-</td><td>{html.escape(r['file'])}</td>"
                        f"<td colspan='7'>ERROR: {html.escape(r['error'])}</td></tr>")
            continue
        segs = html.escape(r["segment_list"]).replace("; ", "<br>")
        body.append(
            f"<tr class='{cls(r)}'><td class='n'>{r['severity']}</td>"
            f"<td><b>{html.escape(r['file'])}</b><br><span class='dim'>{html.escape(r['source_guess'])} · "
            f"{r['channels']}ch {r['sample_rate']} Hz · {html.escape(r['stereo'])}</span></td>"
            f"<td class='n'>{r['lufs_integrated']}<br><span class='dim'>{r['gain_to_target_db']:+} dB</span></td>"
            f"<td class='n'>{r['bandwidth_low_hz']}–{r['bandwidth_high_hz']} Hz</td>"
            f"<td class='n'>{r['snr_db']} dB<br><span class='dim'>{html.escape(r['bed'])}</span></td>"
            f"<td class='n'>{r['clip_runs']}<br><span class='dim'>{r['true_peak_dbtp']} dBTP</span></td>"
            f"<td class='n'>{r['hum_hz'] or '–'}</td>"
            f"<td>{html.escape(r['rx_chain'])}</td>"
            f"<td class='segs'>{segs}</td></tr>")

    page = f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sample Triage</title>
<style>
:root{{--bg:#fff;--fg:#1d1d1f;--dim:#6e6e73;--line:#e5e5ea;--bad:#fde8e8;--warn:#fff4e0;--ok:#eef8ee}}
@media (prefers-color-scheme:dark){{:root{{--bg:#1c1c1e;--fg:#f2f2f7;--dim:#98989d;--line:#38383a;--bad:#4a1f1f;--warn:#4a3a1a;--ok:#1f3a24}}}}
body{{background:var(--bg);color:var(--fg);font:14px -apple-system,system-ui,sans-serif;margin:24px}}
table{{border-collapse:collapse;width:100%}}th,td{{border-bottom:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}}
th{{position:sticky;top:0;background:var(--bg)}}.n{{text-align:right;white-space:nowrap}}.dim{{color:var(--dim);font-size:12px}}
.segs{{font-size:12px;white-space:nowrap}}tr.bad{{background:var(--bad)}}tr.warn{{background:var(--warn)}}tr.ok{{background:var(--ok)}}
</style></head><body>
<h1>Sample triage</h1>
<p class="dim">{html.escape(str(folder))} · {len(rows)} files · loudness target {target} LUFS · sorted worst first</p>
<p>Numbers are estimates to decide listening order. <b>Source guess and bed</b> are heuristics: confirm by ear.
Severity: 7+ = full manual RX pass, 4–6 = check by ear, 0–3 = batch is probably fine.</p>
<ul>{summary}</ul>
<table><thead><tr><th>Sev</th><th>File</th><th>LUFS / gain</th><th>Bandwidth</th><th>SNR / bed</th>
<th>Clip runs</th><th>Hum</th><th>Suggested RX chain</th><th>Segments (start–end)</th></tr></thead>
<tbody>{''.join(body)}</tbody></table></body></html>"""
    Path(out).write_text(page, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder")
    ap.add_argument("--bpm", type=float, help="song tempo, to show bar positions (constant tempo only)")
    ap.add_argument("--sig", type=int, default=4, help="beats per bar (default 4)")
    ap.add_argument("--start-bar", type=int, default=1, help="bar at file start (default 1)")
    ap.add_argument("--target", type=float, default=-20.0, help="loudness target LUFS (default -20)")
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    ap.add_argument("--recursive", action="store_true", help="include sub-folders")
    a = ap.parse_args()

    folder = Path(a.folder).expanduser()
    if not folder.is_dir():
        sys.exit(f"Not a folder: {folder}")
    pattern = "**/*" if a.recursive else "*"
    files = sorted(p for p in folder.glob(pattern)
                   if p.suffix.lower() in am.AUDIO_EXTS and "_triage" not in p.parts
                   and not p.name.startswith("._"))
    if not files:
        sys.exit(f"No audio files found in {folder}")

    out_dir = folder / "_triage"
    out_dir.mkdir(exist_ok=True)
    kw = dict(bpm=a.bpm, sig=a.sig, start_bar=a.start_bar, target=a.target)
    print(f"Analyzing {len(files)} files with {a.jobs} workers...")
    rows = []
    with ProcessPoolExecutor(max_workers=a.jobs) as ex:
        for i, r in enumerate(ex.map(_worker, [(p, kw) for p in files]), 1):
            rows.append(r)
            flag = r.get("error") or f"sev {r.get('severity')} · {r.get('source_guess')}"
            print(f"  [{i}/{len(files)}] {r['file']}: {flag}")

    rows.sort(key=lambda r: (0 if r.get("error") else 1, -r.get("severity", 0), r["file"]))
    write_csv(rows, out_dir / "triage.csv")
    write_html(rows, out_dir / "triage_report.html", folder, a.target)
    print(f"\nDone. Open:\n  {out_dir / 'triage_report.html'}\n  {out_dir / 'triage.csv'}")


if __name__ == "__main__":
    main()
