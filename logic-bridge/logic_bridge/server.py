"""MCP server exposing Logic Pro controls to Claude Code."""

from __future__ import annotations

import re
import time
from pathlib import Path

from mcp.server.fastmcp import FastMCP, Image

from . import logic, midi, osa

mcp = FastMCP("logic")


def _guard(fn):
    """Turn automation errors into readable tool errors instead of stack traces."""
    import functools

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except (osa.AutomationError, ValueError) as e:
            raise RuntimeError(str(e)) from None
    return wrapper


@mcp.tool()
@_guard
def logic_status() -> dict:
    """Is Logic running, is it frontmost, and which windows are open (the main window title is the project name)."""
    return logic.status()


@mcp.tool()
@_guard
def screenshot() -> Image:
    """Capture the Mac's screen. Use after every change to verify what actually happened in Logic."""
    return Image(path=str(logic.screenshot()))


@mcp.tool()
@_guard
def open_project(path: str) -> dict:
    """Open a .logicx project (launches Logic if needed) and wait for its window."""
    return logic.open_project(path)


@mcp.tool()
@_guard
def key_command(action: str, times: int = 1) -> str:
    """Trigger a named Logic key command from the keymap (see list_key_commands), e.g. play_stop, record,
    toggle_cycle, save, undo, new_software_instrument_track, mute_track, solo_track, select_next_track."""
    return logic.key_command(action, times)


@mcp.tool()
@_guard
def list_key_commands() -> dict:
    """The named key commands available to key_command, with their key combos and Logic command names."""
    return {k: f"{v['keys']}  ({v.get('logic_name', '')})" for k, v in logic.load_keymap().items()}


@mcp.tool()
@_guard
def press_keys(combo: str, times: int = 1) -> str:
    """Send a raw key combo to Logic, e.g. "cmd+shift+g", "space", "left", "ctrl+opt+cmd+1".
    Prefer key_command or menu_click when one fits; raw keys depend on the user's key command set."""
    logic.press(combo, times)
    return f"Pressed {combo} x{times}"


@mcp.tool()
@_guard
def type_text(text: str) -> str:
    """Type text into whatever field has focus in Logic (e.g. a rename field or a dialog)."""
    logic.type_text(text)
    return f"Typed {len(text)} characters"


@mcp.tool()
@_guard
def menu_list(path: list[str] | None = None) -> list[str]:
    """List menu items. [] lists the menu bar; ["Track"] lists the Track menu; ["File", "Export"] a submenu.
    Use this to discover exact menu names before menu_click."""
    return logic.menu_list(path or [])


@mcp.tool()
@_guard
def menu_click(path: list[str], opens_dialog: bool = False) -> str:
    """Click a menu item by path, e.g. ["Track", "New Software Instrument Track"]. Matching ignores case and a
    trailing "…". Set opens_dialog=True for items that open a modal window, then drive it and take a screenshot."""
    return logic.menu_click(path, opens_dialog)


@mcp.tool()
@_guard
def ui_tree(window: int | None = 0, depth: int = 6, filter: str = "", role: str = "", max_nodes: int = 600) -> str:
    """Dump Logic's Accessibility tree. Each line is [path] role "name" desc=... value=....
    window=None walks all windows. filter keeps only nodes whose text contains it (case-insensitive), e.g.
    filter="volume" role="AXSlider" to find mixer faders. Paths feed ui_action. Deep walks are slow: narrow them."""
    return logic.ax_tree(window, depth, filter, role, max_nodes)


@mcp.tool()
@_guard
def ui_action(path: str, action: str, value: str | None = None) -> dict:
    """Act on an element from ui_tree: action is press | set_value | increment | decrement | focus | show_menu.
    Returns the element's value before and after, so you can confirm a fader or field actually changed."""
    v: str | float | None = value
    if value is not None and re.fullmatch(r"-?\d+(\.\d+)?", value):
        v = float(value)
    return logic.ax_act(path, action, v)


@mcp.tool()
@_guard
def go_to_bar(bar: int, beat: int = 1) -> str:
    """Move the playhead to a bar (and beat)."""
    return logic.go_to_bar(bar, beat)


@mcp.tool()
@_guard
def set_cycle_range(start_bar: int, end_bar: int) -> str:
    """Set the locators so the cycle covers start_bar up to (not including) end_bar, and turn cycle on.
    Example: an 8-bar chorus starting at bar 33 is start_bar=33, end_bar=41."""
    return logic.set_locators(start_bar, end_bar)


@mcp.tool()
@_guard
def set_cycle(on: bool) -> str:
    """Turn cycle mode on or off."""
    return logic.set_cycle(on)


@mcp.tool()
@_guard
def bounce(name: str | None = None, start_bar: int | None = None, end_bar: int | None = None,
           directory: str | None = None, also_m4a: bool = True, timeout_seconds: int = 900) -> dict:
    """Bounce the project, or a section when start_bar/end_bar are given (end_bar exclusive), via
    File > Bounce > Project or Section. Output format and realtime/offline follow whatever was last chosen in
    Logic's bounce dialog. Default output folder is iCloud Drive/Logic Bounces (visible in the phone's Files app).
    also_m4a adds a phone-friendly AAC copy. Saves nothing to the project; call key_command("save") separately."""
    return logic.bounce(name, directory, start_bar, end_bar, also_m4a, timeout_seconds)


@mcp.tool()
@_guard
def create_midi_clip(notes: list[dict], name: str, tempo_bpm: float = 120.0,
                     time_signature: str = "4/4", import_now: bool = True) -> dict:
    """Write a MIDI file and (by default) import it into Logic at the playhead on the selected track.
    notes: [{"pitch": "C4" | 60, "start": beats_from_clip_start, "duration": beats, "velocity": 1-127}].
    Beats are quarter notes. Pitch uses C4 = 60 (Logic displays this as C3). Select the target track and set the
    playhead (go_to_bar) first. Match tempo_bpm to the project's tempo."""
    parsed = [midi.Note(pitch=midi.parse_pitch(n["pitch"]), start=float(n["start"]), duration=float(n["duration"]),
                        velocity=int(n.get("velocity", 96)), channel=int(n.get("channel", 0))) for n in notes]
    num, den = (int(x) for x in time_signature.split("/"))
    out = logic.HOME / "midi"
    out.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r"[^\w\- ]+", "", name).strip() or "clip"
    path = out / f"{safe} {time.strftime('%H%M%S')}.mid"
    path.write_bytes(midi.build_smf(parsed, tempo_bpm, (num, den), track_name=safe))
    result = {"file": str(path), "notes": len(parsed)}
    if import_now:
        result["import"] = logic.import_file(str(path))
    return result


@mcp.tool()
@_guard
def import_file(path: str) -> str:
    """Import a MIDI or audio file into the open project at the playhead on the selected track."""
    return logic.import_file(path)


@mcp.tool()
@_guard
def list_bounces(directory: str | None = None, limit: int = 20) -> list[str]:
    """Most recent files in the bounce folder."""
    d = Path(directory).expanduser() if directory else logic.default_bounce_dir()
    if not d.is_dir():
        return []
    files = sorted((p for p in d.iterdir() if p.is_file()), key=lambda p: p.stat().st_mtime, reverse=True)
    return [str(p) for p in files[:limit]]


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
