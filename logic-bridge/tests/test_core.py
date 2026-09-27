import struct

import pytest

from logic_bridge import logic, midi, osa


def test_keystroke_statements():
    assert osa.keystroke_statement("space") == "key code 49"
    assert osa.keystroke_statement("cmd+shift+g") == 'keystroke "g" using {command down, shift down}'
    assert osa.keystroke_statement("ctrl+opt+cmd+1") == 'keystroke "1" using {control down, option down, command down}'
    assert osa.keystroke_statement("/") == 'keystroke "/"'
    assert osa.keystroke_statement("cmd++") == 'keystroke "+" using {command down}'
    with pytest.raises(ValueError):
        osa.keystroke_statement("hyper+x")
    with pytest.raises(ValueError):
        osa.keystroke_statement("cmd+notakey")


def test_as_string_escapes():
    assert osa.as_string('say "hi" \\ there') == '"say \\"hi\\" \\\\ there"'


def test_every_keymap_entry_parses():
    for name, entry in logic.load_keymap().items():
        osa.keystroke_statement(entry["keys"])


@pytest.mark.parametrize("given,expected", [(60, 60), ("60", 60), ("C4", 60), ("F#3", 54), ("Bb2", 46), ("C-1", 0)])
def test_parse_pitch(given, expected):
    assert midi.parse_pitch(given) == expected


def test_parse_pitch_rejects_out_of_range():
    with pytest.raises(ValueError):
        midi.parse_pitch("G10")


def _read_tracks(data):
    assert data[:4] == b"MThd"
    fmt, ntrks, ppq = struct.unpack(">HHH", data[8:14])
    pos, tracks = 14, []
    for _ in range(ntrks):
        assert data[pos:pos + 4] == b"MTrk"
        (length,) = struct.unpack(">I", data[pos + 4:pos + 8])
        tracks.append(data[pos + 8:pos + 8 + length])
        pos += 8 + length
    assert pos == len(data)
    return fmt, ppq, tracks


def _events(track):
    pos, tick, out, status = 0, 0, [], None
    while pos < len(track):
        delta = 0
        while True:
            b = track[pos]; pos += 1
            delta = (delta << 7) | (b & 0x7F)
            if not b & 0x80:
                break
        tick += delta
        status = track[pos]; pos += 1
        if status == 0xFF:
            kind = track[pos]; length = track[pos + 1]; pos += 2
            out.append((tick, "meta", kind, track[pos:pos + length])); pos += length
        else:
            out.append((tick, status & 0xF0, track[pos], track[pos + 1])); pos += 2
    return out


def test_build_smf_roundtrip():
    notes = [midi.Note(60, 0, 1, 100), midi.Note(64, 1, 1), midi.Note(60, 1, 0.5)]
    fmt, ppq, (tempo, notes_track) = _read_tracks(midi.build_smf(notes, tempo_bpm=90, time_signature=(6, 8)))
    assert fmt == 1 and ppq == midi.PPQ
    tev = _events(tempo)
    assert tev[0][3] == round(60_000_000 / 90).to_bytes(3, "big")
    assert tev[1][3][:2] == bytes([6, 3])
    ev = [e for e in _events(notes_track) if e[1] != "meta"]
    # Note-off for the first C must come before the re-struck C at the same tick.
    at_480 = [(e[1], e[2]) for e in ev if e[0] == 480]
    assert at_480.index((0x80, 60)) < at_480.index((0x90, 60))
    assert (0, 0x90, 60, 100) in ev
    assert _events(notes_track)[-1][2] == 0x2F


def test_build_smf_validates():
    with pytest.raises(ValueError):
        midi.build_smf([midi.Note(60, 0, 0)])
    with pytest.raises(ValueError):
        midi.build_smf([], time_signature=(4, 3))


def test_server_registers_tools():
    from logic_bridge import server
    import asyncio
    names = {t.name for t in asyncio.run(server.mcp.list_tools())}
    assert {"bounce", "screenshot", "menu_click", "ui_tree", "create_midi_clip", "set_cycle_range"} <= names
