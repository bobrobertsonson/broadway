"""Minimal Standard MIDI File (format 1) writer. No third-party dependencies."""

from __future__ import annotations

import re
import struct
from dataclasses import dataclass

PPQ = 480
NOTE_NAMES = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}


@dataclass
class Note:
    pitch: int
    start: float  # beats (quarter notes) from the start of the clip
    duration: float  # beats
    velocity: int = 96
    channel: int = 0


def parse_pitch(p: int | str) -> int:
    """Accept 60, "60", "C4", "F#3", "Bb2". Middle C = C3 in Logic's display, but we use C4 = 60 (scientific)."""
    if isinstance(p, int):
        value = p
    elif re.fullmatch(r"\d+", p.strip()):
        value = int(p)
    else:
        m = re.fullmatch(r"([A-Ga-g])([#b]*)(-?\d+)", p.strip())
        if not m:
            raise ValueError(f"Can't parse pitch {p!r}")
        letter, accidentals, octave = m.groups()
        value = NOTE_NAMES[letter.lower()] + accidentals.count("#") - accidentals.count("b") + (int(octave) + 1) * 12
    if not 0 <= value <= 127:
        raise ValueError(f"Pitch {p!r} out of MIDI range")
    return value


def _varlen(n: int) -> bytes:
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


def _chunk(kind: bytes, data: bytes) -> bytes:
    return kind + struct.pack(">I", len(data)) + data


def _track(events: list[tuple[int, int, bytes]]) -> bytes:
    """events: (tick, order, raw bytes). order breaks ties so note-offs precede note-ons at the same tick."""
    data = bytearray()
    last = 0
    for tick, _, raw in sorted(events, key=lambda e: (e[0], e[1])):
        data += _varlen(tick - last) + raw
        last = tick
    data += _varlen(0) + b"\xff\x2f\x00"
    return _chunk(b"MTrk", bytes(data))


def build_smf(
    notes: list[Note],
    tempo_bpm: float = 120.0,
    time_signature: tuple[int, int] = (4, 4),
    track_name: str = "Claude",
) -> bytes:
    num, den = time_signature
    if den & (den - 1) or den <= 0:
        raise ValueError("Time signature denominator must be a power of two")
    usec = round(60_000_000 / tempo_bpm)
    tempo_track = _track([
        (0, 0, b"\xff\x51\x03" + usec.to_bytes(3, "big")),
        (0, 0, bytes([0xFF, 0x58, 0x04, num, den.bit_length() - 1, 24, 8])),
    ])

    name = track_name.encode("utf-8")[:127]
    events: list[tuple[int, int, bytes]] = [(0, 0, b"\xff\x03" + _varlen(len(name)) + name)]
    for n in notes:
        if n.duration <= 0:
            raise ValueError(f"Note {n} has non-positive duration")
        if n.start < 0:
            raise ValueError(f"Note {n} starts before 0")
        ch = n.channel & 0x0F
        vel = max(1, min(127, int(n.velocity)))
        on = round(n.start * PPQ)
        off = max(on + 1, round((n.start + n.duration) * PPQ))
        events.append((on, 2, bytes([0x90 | ch, n.pitch, vel])))
        events.append((off, 1, bytes([0x80 | ch, n.pitch, 0])))

    header = _chunk(b"MThd", struct.pack(">HHH", 1, 2, PPQ))
    return header + tempo_track + _track(events)
