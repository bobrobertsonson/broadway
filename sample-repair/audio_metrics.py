"""Shared measurement code for the sample-repair tools.

All measurements are numeric estimates. Loudness follows ITU-R BS.1770-4
(K-weighting, 400 ms blocks, -70 LUFS absolute / -10 LU relative gates).
Everything else (bandwidth, noise floor, hum, bed detection) is a heuristic
meant to sort files for listening, not to replace it.
"""

import math

import numpy as np
import soundfile as sf
from scipy import signal

AUDIO_EXTS = {".wav", ".aif", ".aiff", ".flac", ".caf", ".mp3", ".ogg"}

SILENCE_DBFS = -60.0     # frames below this are "no clip playing"
MERGE_GAP_S = 0.5        # gaps shorter than this stay inside one segment
MIN_SEGMENT_S = 0.15     # ignore blips shorter than this
FRAME_S = 0.05           # 50 ms analysis frames


def db(x, floor=1e-12):
    return 10.0 * np.log10(np.maximum(x, floor))


def load(path):
    """Return (float64 array shaped [samples, channels], sample_rate, info)."""
    data, sr = sf.read(str(path), always_2d=True, dtype="float64")
    info = sf.info(str(path))
    return data, sr, info


# ---------------------------------------------------------------- loudness

def _k_weighting(sr):
    """BS.1770 K-weighting as two biquads, valid at any sample rate."""
    # Stage 1: high shelf (head acoustics)
    f0, gain_db, q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    k = math.tan(math.pi * f0 / sr)
    vh = 10 ** (gain_db / 20)
    vb = vh ** 0.4996667741545416
    a0 = 1 + k / q + k * k
    b1 = [(vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0]
    a1 = [1.0, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0]
    # Stage 2: RLB high-pass
    f0, q = 38.13547087602444, 0.5003270373238773
    k = math.tan(math.pi * f0 / sr)
    a0 = 1 + k / q + k * k
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0]
    return (b1, a1), (b2, a2)


def k_weighted_power(data, sr):
    """Per-sample K-weighted power summed over channels (L/R/C weight 1.0)."""
    (b1, a1), (b2, a2) = _k_weighting(sr)
    y = signal.lfilter(b1, a1, data, axis=0)
    y = signal.lfilter(b2, a2, y, axis=0)
    return np.sum(y * y, axis=1)


def _block_power(power, sr, win_s, hop_s):
    win, hop = int(round(win_s * sr)), int(round(hop_s * sr))
    if len(power) < win:
        return np.array([np.mean(power)]) if len(power) else np.array([])
    cs = np.concatenate([[0.0], np.cumsum(power)])
    starts = np.arange(0, len(power) - win + 1, hop)
    return (cs[starts + win] - cs[starts]) / win


def integrated_loudness(power, sr):
    blocks = _block_power(power, sr, 0.4, 0.1)
    if len(blocks) == 0:
        return float("-inf")
    lk = -0.691 + db(blocks, 1e-20)
    gated = blocks[lk > -70.0]
    if len(gated) == 0:
        return float("-inf")
    rel = -0.691 + db(np.mean(gated), 1e-20) - 10.0
    gated = blocks[(lk > -70.0) & (lk > rel)]
    if len(gated) == 0:
        return float("-inf")
    return float(-0.691 + db(np.mean(gated), 1e-20))


def max_short_term(power, sr):
    blocks = _block_power(power, sr, 3.0, 0.1)
    if len(blocks) == 0:
        return float("-inf")
    return float(-0.691 + db(np.max(blocks), 1e-20))


def max_momentary(power, sr):
    blocks = _block_power(power, sr, 0.4, 0.1)
    if len(blocks) == 0:
        return float("-inf")
    return float(-0.691 + db(np.max(blocks), 1e-20))


def true_peak_dbtp(data):
    """4x oversampled peak (BS.1770 Annex 2 style estimate)."""
    if len(data) == 0:
        return float("-inf")
    up = signal.resample_poly(data, 4, 1, axis=0)
    return float(20 * np.log10(max(np.max(np.abs(up)), 1e-12)))


# ---------------------------------------------------------------- activity

def frame_rms_db(mono, sr, frame_s=FRAME_S):
    n = int(round(frame_s * sr))
    count = len(mono) // n
    if count == 0:
        return np.array([]), n
    frames = mono[: count * n].reshape(count, n)
    return db(np.mean(frames * frames, axis=1)), n


def find_segments(mono, sr):
    """Return list of (start_sample, end_sample) where audio is playing."""
    rms, n = frame_rms_db(mono, sr)
    active = rms > SILENCE_DBFS
    segs = []
    i = 0
    while i < len(active):
        if active[i]:
            j = i
            while j < len(active) and active[j]:
                j += 1
            segs.append([i, j])
            i = j
        else:
            i += 1
    merged = []
    gap_frames = int(MERGE_GAP_S / FRAME_S)
    for s in segs:
        if merged and s[0] - merged[-1][1] <= gap_frames:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    min_frames = int(MIN_SEGMENT_S / FRAME_S)
    return [(a * n, min(b * n, len(mono))) for a, b in merged if b - a >= min_frames]


# ---------------------------------------------------------------- spectrum

def psd_db(mono, sr):
    nper = 1 << int(math.ceil(math.log2(sr)))  # ~0.7 Hz resolution at 48k
    nper = min(nper, max(256, 1 << int(math.floor(math.log2(max(len(mono), 256))))))
    f, p = signal.welch(mono, sr, nperseg=nper, noverlap=nper // 2)
    return f, db(p, 1e-30)


def _smooth(x, bins):
    bins = max(1, int(bins))
    if bins == 1:
        return x
    pad = bins // 2 + 1
    xp = np.concatenate([np.full(pad, x[0]), x, np.full(pad, x[-1])])
    k = np.ones(bins) / bins
    return np.convolve(xp, k, mode="same")[pad:pad + len(x)]


def bandwidth(f, p_db, sr):
    """Estimate usable (low_hz, high_hz) of the recording.

    High edge: highest frequency still within 30 dB of the 2-4 kHz speech
    presence band. Codec, phone and resampler cut-offs fall 40+ dB within a
    few hundred Hz, while natural speech roll-off and mic noise stay above
    that line, so full-band recordings read close to Nyquist.
    """
    df = f[1] - f[0]
    sm = _smooth(p_db, 150.0 / df)
    presence = (f >= 2000) & (f <= 4000)
    ref = np.median(sm[presence]) if np.any(presence) else np.max(sm)
    above = np.where((sm >= ref - 30.0) & (f > 1000))[0]
    high = float(f[above[-1]]) if len(above) else float("nan")

    sm_low = _smooth(p_db, 20.0 / df)
    body = (f >= 200) & (f <= 1000)
    ref_low = np.median(sm_low[body]) if np.any(body) else np.max(sm_low)
    idx = np.where((sm_low >= ref_low - 20.0) & (f >= 40))[0]
    low = float(f[idx[0]]) if len(idx) else float("nan")
    return low, high


def hum(f, p_db):
    """Return (mains_hz or None, prominence_db) for 50/60 Hz hum series."""
    best = (None, 0.0)
    for base in (50.0, 60.0):
        proms = []
        for h in (1, 2, 3):
            fc = base * h
            peak_band = (f >= fc - 1.5) & (f <= fc + 1.5)
            ctx = ((f >= fc - 15) & (f <= fc - 4)) | ((f >= fc + 4) & (f <= fc + 15))
            if not np.any(peak_band) or not np.any(ctx):
                proms.append(0.0)
                continue
            proms.append(float(np.max(p_db[peak_band]) - np.median(p_db[ctx])))
        proms_sorted = sorted(proms, reverse=True)
        score = (proms_sorted[0] + proms_sorted[1]) / 2
        if max(proms[0], proms[1]) > 10 and proms_sorted[1] > 6 and score > best[1]:
            best = (int(base), score)
    return best


def spectral_flatness(frames, sr, lo_hz=100.0, hi_hz=8000.0):
    """Mean spectral flatness (0 tonal .. 1 white noise) of framed audio,
    measured only inside the recording's own bandwidth so a phone or codec
    cut-off doesn't read as 'tonal'."""
    if len(frames) == 0:
        return float("nan")
    win = np.hanning(frames.shape[1])
    mag = np.abs(np.fft.rfft(frames * win, axis=1)) ** 2 + 1e-20
    freqs = np.fft.rfftfreq(frames.shape[1], 1.0 / sr)
    band = (freqs >= lo_hz) & (freqs <= hi_hz)
    if np.sum(band) < 8:
        band = freqs > 50
    mag = mag[:, band]
    geo = np.exp(np.mean(np.log(mag), axis=1))
    return float(np.mean(geo / np.mean(mag, axis=1)))


# ---------------------------------------------------------------- per-segment

def noise_and_bed(mono, sr, segments, band=(100.0, 8000.0)):
    """Noise floor / speech level inside segments, plus a guess at what the
    quiet parts contain (noise vs. tonal music bed)."""
    rms_all, flat_frames = [], []
    n = int(round(FRAME_S * sr))
    fft_n = 2048
    for a, b in segments:
        seg = mono[a:b]
        rms, _ = frame_rms_db(seg, sr)
        rms_all.append(rms)
    if not rms_all:
        return dict(noise_floor=float("nan"), speech_level=float("nan"),
                    snr=float("nan"), bed="n/a", bed_flatness=float("nan"))
    # Digital silence inside a clip (gated or already cleaned audio) counts as
    # a -100 dBFS floor rather than being ignored.
    rms_cat = np.maximum(np.concatenate(rms_all), -100.0)
    if len(rms_cat) == 0 or np.max(rms_cat) <= -100.0:
        return dict(noise_floor=float("nan"), speech_level=float("nan"),
                    snr=float("nan"), bed="n/a", bed_flatness=float("nan"))
    noise = float(np.percentile(rms_cat, 10))
    speech = float(np.percentile(rms_cat, 95))
    snr = speech - noise

    # frames from the quietest 20% of each segment -> flatness
    quiet_thr = np.percentile(rms_cat, 20)
    for a, b in segments:
        seg = mono[a:b]
        rms, _ = frame_rms_db(seg, sr)
        for i in np.where(rms <= quiet_thr)[0]:
            start = i * n
            if start + fft_n <= len(seg):
                flat_frames.append(seg[start:start + fft_n])
            if len(flat_frames) >= 400:
                break
    lo, hi = band
    lo = 100.0 if math.isnan(lo) else max(100.0, lo)
    hi = 8000.0 if math.isnan(hi) else min(8000.0, hi * 0.9)
    flat = spectral_flatness(np.array(flat_frames), sr, lo, hi) if flat_frames else float("nan")

    if snr >= 40:
        bed = "clean"
    elif snr < 25 and not math.isnan(flat) and flat < 0.12:
        bed = "tonal bed (music?)"
    elif snr < 25:
        bed = "busy bed (FX/noise/crowd?)"
    elif not math.isnan(flat) and flat < 0.12:
        bed = "light tonal bed"
    else:
        bed = "noise"
    return dict(noise_floor=noise, speech_level=speech, snr=snr, bed=bed, bed_flatness=flat)


def clipping_runs(data, min_run=3):
    """Count flat-topped runs at the file's own peak level (catches clipping
    that happened upstream and was then turned down)."""
    peak = np.max(np.abs(data)) if data.size else 0.0
    if peak <= 0:
        return 0, float("-inf")
    runs = 0
    for ch in range(data.shape[1]):
        m = np.abs(data[:, ch]) >= peak * 0.9995
        if not np.any(m):
            continue
        d = np.diff(np.concatenate([[0], m.astype(np.int8), [0]]))
        starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
        runs += int(np.sum((ends - starts) >= min_run))
    return runs, float(20 * np.log10(peak))


def stereo_info(data, segments):
    if data.shape[1] < 2:
        return dict(stereo="mono file", correlation=float("nan"), side_db=float("nan"))
    idx = np.concatenate([np.arange(a, b) for a, b in segments]) if segments else np.arange(len(data))
    l, r = data[idx, 0], data[idx, 1]
    el, er = np.mean(l * l), np.mean(r * r)
    if min(el, er) < 1e-4 * max(el, er, 1e-20):
        return dict(stereo="one side silent", correlation=float("nan"), side_db=float("nan"))
    m, s = (l + r) / 2, (l - r) / 2
    side_db = float(db(np.mean(s * s)) - db(np.mean(m * m)))
    corr = float(np.corrcoef(l, r)[0, 1])
    if side_db < -40:
        label = "dual mono (L=R)"
    elif corr < -0.3:
        label = "phase problem (L/R inverted?)"
    elif corr < 0.6:
        label = "wide stereo (music/FX bed likely)"
    else:
        label = "narrow stereo"
    return dict(stereo=label, correlation=corr, side_db=side_db)


def fmt_time(seconds, bpm=None, sig=4, start_bar=1):
    m, s = divmod(seconds, 60)
    t = f"{int(m)}:{s:04.1f}"
    if bpm:
        beats = seconds * bpm / 60.0
        bar = int(beats // sig) + start_bar
        beat = beats % sig + 1
        t += f" (bar {bar}.{beat:.1f})"
    return t
