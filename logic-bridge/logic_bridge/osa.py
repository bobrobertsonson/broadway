"""Thin wrappers around osascript (AppleScript and JXA) and keystroke generation."""

from __future__ import annotations

import json
import os
import subprocess

# Logic Pro 11 reports itself as "Logic Pro"; 10.x reported "Logic Pro X".
PROCESS_CANDIDATES = [os.environ["LOGIC_PROCESS"]] if os.environ.get("LOGIC_PROCESS") else ["Logic Pro", "Logic Pro X"]

MODIFIERS = {
    "cmd": "command down", "command": "command down",
    "shift": "shift down",
    "opt": "option down", "option": "option down", "alt": "option down",
    "ctrl": "control down", "control": "control down",
}

# macOS virtual key codes for keys that `keystroke` cannot type.
KEY_CODES = {
    "return": 36, "enter": 76, "tab": 48, "space": 49, "delete": 51, "backspace": 51,
    "escape": 53, "esc": 53, "forwarddelete": 117, "home": 115, "end": 119,
    "pageup": 116, "pagedown": 121, "left": 123, "right": 124, "down": 125, "up": 126,
    "f1": 122, "f2": 120, "f3": 99, "f4": 118, "f5": 96, "f6": 97, "f7": 98, "f8": 100,
    "f9": 101, "f10": 109, "f11": 103, "f12": 111,
    # Numeric keypad (Logic uses these for some defaults, e.g. keypad 0 = stop).
    "kp0": 82, "kp1": 83, "kp2": 84, "kp3": 85, "kp4": 86, "kp5": 87, "kp6": 88,
    "kp7": 89, "kp8": 91, "kp9": 92, "kpenter": 76, "kpdecimal": 65,
}


class AutomationError(RuntimeError):
    pass


def as_string(s: str) -> str:
    """Return an AppleScript string literal for s."""
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def keystroke_statement(combo: str) -> str:
    """Translate "cmd+shift+g", "space", "/" or "ctrl+opt+cmd+l" into a System Events statement."""
    parts = [p.strip().lower() for p in combo.split("+")]
    # A literal "+" key shows up as an empty trailing part ("cmd++").
    if combo.endswith("++"):
        parts = parts[:-2] + ["+"]
    if not parts or parts[-1] == "":
        raise ValueError(f"Invalid key combo: {combo!r}")
    *mods, key = parts
    unknown = [m for m in mods if m not in MODIFIERS]
    if unknown:
        raise ValueError(f"Unknown modifier(s) {unknown} in {combo!r}")
    using = ""
    if mods:
        using = " using {" + ", ".join(dict.fromkeys(MODIFIERS[m] for m in mods)) + "}"
    if key in KEY_CODES:
        return f"key code {KEY_CODES[key]}{using}"
    if len(key) != 1:
        raise ValueError(f"Unknown key {key!r} in {combo!r}")
    return f"keystroke {as_string(key)}{using}"


def run(script: str, *, jxa: bool = False, args: list[str] | None = None, timeout: float = 60) -> str:
    cmd = ["osascript"]
    if jxa:
        cmd += ["-l", "JavaScript"]
    cmd += ["-e", script]
    if args:
        cmd += args
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError as e:
        raise AutomationError("osascript not found: this server must run on macOS.") from e
    except subprocess.TimeoutExpired as e:
        raise AutomationError(f"osascript timed out after {timeout}s") from e
    if proc.returncode != 0:
        err = proc.stderr.strip()
        if "-1719" in err or "-25211" in err or "assistive access" in err.lower():
            err += (
                "\nHint: grant Accessibility permission to the app running this server "
                "(Terminal/iTerm/Claude) in System Settings > Privacy & Security > Accessibility."
            )
        raise AutomationError(err or f"osascript exited {proc.returncode}")
    return proc.stdout.strip()


def run_jxa_json(script: str, payload: object, timeout: float = 60) -> object:
    """Run a JXA script whose run(argv) receives JSON in argv[0] and returns JSON."""
    out = run(script, jxa=True, args=[json.dumps(payload)], timeout=timeout)
    return json.loads(out) if out else None
