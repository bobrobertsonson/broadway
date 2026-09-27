"""Logic Pro automation via macOS UI scripting (System Events + Accessibility).

Logic Pro has no scripting API, so everything here drives the UI the way a user would:
menu clicks, key commands, and the Accessibility tree (which Logic exposes well, because
it supports VoiceOver). All of it requires the process running this code to have
Accessibility and Screen Recording permission.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from importlib import resources
from pathlib import Path

from . import osa

HOME = Path(os.environ.get("LOGIC_BRIDGE_HOME", Path.home() / "LogicBridge"))
ICLOUD = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs"


def default_bounce_dir() -> Path:
    if os.environ.get("LOGIC_BOUNCE_DIR"):
        return Path(os.environ["LOGIC_BOUNCE_DIR"]).expanduser()
    # iCloud Drive syncs to the Files app on the phone, so bounces are playable there.
    if ICLOUD.is_dir():
        return ICLOUD / "Logic Bounces"
    return Path.home() / "Music/Logic Bounces"


# ---------------------------------------------------------------- key commands

def load_keymap() -> dict[str, dict]:
    base = json.loads(resources.files(__package__).joinpath("keymap.json").read_text())["commands"]
    override = HOME / "keymap.json"
    if override.is_file():
        for name, entry in json.loads(override.read_text()).get("commands", {}).items():
            base[name] = {**base.get(name, {}), **entry}
    return base


# ---------------------------------------------------------------- process

def process_name() -> str | None:
    names = osa.run('tell application "System Events" to get name of every process whose background only is false')
    running = {n.strip() for n in names.split(",")}
    return next((c for c in osa.PROCESS_CANDIDATES if c in running), None)


def require_process() -> str:
    name = process_name()
    if not name:
        raise osa.AutomationError("Logic Pro is not running. Use open_project, or launch Logic first.")
    return name


def activate() -> str:
    name = require_process()
    osa.run(f"tell application {osa.as_string(name)} to activate")
    time.sleep(0.3)
    return name


def status() -> dict:
    name = process_name()
    if not name:
        return {"running": False}
    script = f'''
    tell application "System Events" to tell process {osa.as_string(name)}
        set out to (frontmost as text)
        repeat with w in windows
            set out to out & linefeed & (name of w as text)
        end repeat
        return out
    end tell'''
    lines = osa.run(script).splitlines()
    return {"running": True, "process": name, "frontmost": lines[0] == "true", "windows": lines[1:]}


def open_project(path: str) -> dict:
    p = Path(path).expanduser()
    if not p.exists():
        raise osa.AutomationError(f"No such project: {p}")
    app = process_name() or osa.PROCESS_CANDIDATES[0]
    subprocess.run(["open", "-a", app, str(p)], check=True)
    for _ in range(90):
        time.sleep(1)
        try:
            st = status()
        except osa.AutomationError:
            continue
        if st.get("running") and any(p.stem in w for w in st.get("windows", [])):
            return st
    raise osa.AutomationError(f"Logic did not show a window for {p.stem} within 90s")


# ---------------------------------------------------------------- input

def press(combo: str, times: int = 1) -> None:
    name = activate()
    stmt = osa.keystroke_statement(combo)
    body = "\n".join([stmt, "delay 0.05"] * max(1, times))
    osa.run(f'tell application "System Events" to tell process {osa.as_string(name)}\n{body}\nend tell')


def type_text(text: str) -> None:
    name = require_process()
    osa.run(f'tell application "System Events" to tell process {osa.as_string(name)} to keystroke {osa.as_string(text)}')


def key_command(action: str, times: int = 1) -> str:
    keymap = load_keymap()
    if action not in keymap:
        raise osa.AutomationError(f"Unknown action {action!r}. Known: {sorted(keymap)}")
    entry = keymap[action]
    press(entry["keys"], times)
    return f"Pressed {entry['keys']} ({entry.get('logic_name', action)})"


# ---------------------------------------------------------------- menus

MENU_JXA = r'''
function run(argv) {
  const a = JSON.parse(argv[0]);
  const proc = Application('System Events').processes.byName(a.process);
  const norm = s => (s || '').toLowerCase().replace(/[….]+\s*$/, '').replace(/\s+/g, ' ').trim();
  let items = proc.menuBars[0].menuBarItems;
  let item = null;
  const trail = [];
  for (let i = 0; i < a.path.length; i++) {
    const names = items.name();
    const want = norm(a.path[i]);
    let idx = names.findIndex(n => norm(n) === want);
    if (idx < 0) idx = names.findIndex(n => n && norm(n).startsWith(want));
    if (idx < 0) return JSON.stringify({ok: false, error: 'No menu item "' + a.path[i] + '" under ' + JSON.stringify(trail),
                                        available: names.filter(n => n)});
    item = items[idx];
    trail.push(names[idx]);
    if (i < a.path.length - 1 || a.list) items = item.menus[0].menuItems;
  }
  if (a.list) {
    const names = items.name(), enabled = items.enabled();
    return JSON.stringify({ok: true, path: trail,
      items: names.map((n, i) => n ? (enabled[i] ? n : n + ' (disabled)') : '---')});
  }
  if (!item.enabled()) return JSON.stringify({ok: false, error: 'Menu item is disabled: ' + trail.join(' > ')});
  item.click();
  return JSON.stringify({ok: true, clicked: trail});
}
'''


def menu_list(path: list[str]) -> list[str]:
    name = require_process()
    res = osa.run_jxa_json(MENU_JXA, {"process": name, "path": path, "list": True})
    if not res["ok"]:
        raise osa.AutomationError(res["error"] + (f"\nAvailable: {res['available']}" if res.get("available") else ""))
    return res["items"]


def menu_click(path: list[str], opens_dialog: bool = False) -> str:
    """Click a menu item. Title matching ignores case and a trailing '…'.

    When the item opens a modal dialog, System Events may block until the dialog is
    dismissed, so with opens_dialog=True we fire the click and return after a short wait.
    """
    name = activate()
    payload = [json.dumps({"process": name, "path": path, "list": False})]
    if not opens_dialog:
        res = osa.run_jxa_json(MENU_JXA, {"process": name, "path": path, "list": False})
        if not res["ok"]:
            raise osa.AutomationError(res["error"] + (f"\nAvailable: {res['available']}" if res.get("available") else ""))
        return "Clicked " + " > ".join(res["clicked"])
    proc = subprocess.Popen(["osascript", "-l", "JavaScript", "-e", MENU_JXA, *payload],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        out, err = proc.communicate(timeout=2.5)
    except subprocess.TimeoutExpired:
        return "Clicked " + " > ".join(path) + " (dialog open)"
    if proc.returncode != 0:
        raise osa.AutomationError(err.strip())
    res = json.loads(out)
    if not res["ok"]:
        raise osa.AutomationError(res["error"] + (f"\nAvailable: {res['available']}" if res.get("available") else ""))
    return "Clicked " + " > ".join(res["clicked"])


# ---------------------------------------------------------------- accessibility tree

AX_JXA = r'''
function run(argv) {
  const a = JSON.parse(argv[0]);
  const proc = Application('System Events').processes.byName(a.process);
  const s = f => { try { const v = f(); return (v === null || v === undefined) ? '' : String(v); } catch (e) { return ''; } };
  const needle = (a.filter || '').toLowerCase();
  const out = [];
  let visited = 0;
  function walk(el, path, depth) {
    if (visited >= a.max_nodes) return;
    visited++;
    const role = s(() => el.role()), name = s(() => el.name()), desc = s(() => el.description()), val = s(() => el.value());
    const text = (role + ' ' + name + ' ' + desc + ' ' + val).toLowerCase();
    if (!needle || text.includes(needle)) {
      if (!a.role || role === a.role) {
        out.push((needle ? '' : '  '.repeat(depth)) + '[' + path + '] ' + role +
          (name ? ' "' + name + '"' : '') + (desc && desc !== name ? ' desc="' + desc + '"' : '') +
          (val ? ' value="' + val.slice(0, 80) + '"' : ''));
      }
    }
    if (depth >= a.depth) return;
    let kids = [];
    try { kids = el.uiElements(); } catch (e) {}
    for (let i = 0; i < kids.length; i++) walk(kids[i], path + '.' + i, depth + 1);
  }
  const wins = proc.windows();
  const which = a.window === null ? wins.map((_, i) => i) : [a.window];
  for (const w of which) if (w < wins.length) walk(wins[w], String(w), 0);
  if (visited >= a.max_nodes) out.push('... truncated at ' + a.max_nodes + ' nodes; narrow with depth/filter/window');
  return out.join('\n');
}
'''

AX_ACT_JXA = r'''
function run(argv) {
  const a = JSON.parse(argv[0]);
  const proc = Application('System Events').processes.byName(a.process);
  const idx = a.path.split('.').map(Number);
  let el = proc.windows()[idx[0]];
  for (const i of idx.slice(1)) el = el.uiElements()[i];
  if (!el) return JSON.stringify({ok: false, error: 'No element at ' + a.path});
  const before = (() => { try { return String(el.value()); } catch (e) { return ''; } })();
  if (a.action === 'press') el.actions.byName('AXPress').perform();
  else if (a.action === 'set_value') el.value = a.value;
  else if (a.action === 'focus') el.focused = true;
  else if (a.action === 'increment') el.actions.byName('AXIncrement').perform();
  else if (a.action === 'decrement') el.actions.byName('AXDecrement').perform();
  else if (a.action === 'show_menu') el.actions.byName('AXShowMenu').perform();
  else return JSON.stringify({ok: false, error: 'Unknown action ' + a.action});
  delay(0.2);
  const after = (() => { try { return String(el.value()); } catch (e) { return ''; } })();
  return JSON.stringify({ok: true, role: el.role(), name: String(el.name() || ''), before: before, after: after});
}
'''


def ax_tree(window: int | None = 0, depth: int = 6, filter: str = "", role: str = "", max_nodes: int = 600) -> str:
    name = require_process()
    return osa.run(AX_JXA, jxa=True, timeout=120, args=[json.dumps(
        {"process": name, "window": window, "depth": depth, "filter": filter, "role": role, "max_nodes": max_nodes})])


def ax_act(path: str, action: str, value: str | float | None = None) -> dict:
    name = require_process()
    res = osa.run_jxa_json(AX_ACT_JXA, {"process": name, "path": path, "action": action, "value": value})
    if not res["ok"]:
        raise osa.AutomationError(res["error"])
    return res


def set_cycle(on: bool) -> str:
    """Turn cycle mode on/off by reading the control bar's Cycle button state."""
    hits = [l for l in ax_tree(window=None, depth=8, filter="cycle", role="AXCheckBox", max_nodes=1500).splitlines()
            if l.startswith("[")]
    if not hits:
        # Can't read state; fall back to the toggle and report the uncertainty.
        key_command("toggle_cycle")
        return "Cycle button not found in the Accessibility tree; toggled cycle blindly. Verify with a screenshot."
    line = hits[0]
    path = line[1:line.index("]")]
    current = 'value="1"' in line
    if current != on:
        ax_act(path, "press")
    return f"Cycle {'on' if on else 'off'}"


# ---------------------------------------------------------------- navigation

def go_to_bar(bar: int, beat: int = 1) -> str:
    """Move the playhead via Logic's Go to Position dialog."""
    key_command("go_to_position")
    time.sleep(0.6)
    type_text(f"{bar} {beat} 1 1")
    press("return")
    time.sleep(0.3)
    return f"Playhead at bar {bar} beat {beat}"


def set_locators(start_bar: int, end_bar: int, cycle: bool = True) -> str:
    """Set the cycle range to [start_bar, end_bar) — end_bar is the first bar NOT included."""
    if end_bar <= start_bar:
        raise osa.AutomationError("end_bar must be after start_bar")
    go_to_bar(start_bar)
    key_command("set_left_locator")
    go_to_bar(end_bar)
    key_command("set_right_locator")
    note = set_cycle(True) if cycle else "cycle untouched"
    return f"Locators set to bars {start_bar}–{end_bar}; {note}"


# ---------------------------------------------------------------- file panels

def drive_file_panel(directory: Path | None, filename: str | None, confirm: bool = True) -> None:
    """Fill a standard macOS open/save panel: set file name, jump to directory, confirm."""
    if filename is not None:
        press("cmd+a")
        type_text(filename)
    if directory is not None:
        press("cmd+shift+g")
        time.sleep(0.7)
        press("cmd+a")
        type_text(str(directory))
        time.sleep(0.4)
        press("return")
        time.sleep(0.8)
    if confirm:
        press("return")


def _wait_for_file(directory: Path, stem: str, since: float, timeout: float) -> list[Path]:
    deadline = time.time() + timeout
    last_sizes: dict[Path, int] = {}
    stable = 0
    while time.time() < deadline:
        time.sleep(1.5)
        found = [p for p in directory.glob(f"{stem}*") if p.is_file() and p.stat().st_mtime >= since - 1]
        sizes = {p: p.stat().st_size for p in found}
        if found and sizes == last_sizes and all(sizes.values()):
            stable += 1
            if stable >= 3:
                return sorted(found)
        else:
            stable = 0
        last_sizes = sizes
    raise osa.AutomationError(
        f"No finished file matching {stem}* appeared in {directory} within {timeout:.0f}s. "
        "Take a screenshot: a dialog may be waiting for input.")


# ---------------------------------------------------------------- bounce / import

def bounce(name: str | None = None, directory: str | None = None, start_bar: int | None = None,
           end_bar: int | None = None, also_m4a: bool = True, timeout: float = 900) -> dict:
    """File > Bounce > Project or Section. Uses the format/mode options last set in Logic's bounce dialog.

    With start_bar/end_bar, sets the locators and enables cycle first, so only that section bounces.
    Without them, Logic bounces the cycle range if cycle is on, otherwise the whole project.
    """
    if (start_bar is None) != (end_bar is None):
        raise osa.AutomationError("Give both start_bar and end_bar, or neither.")
    out_dir = Path(directory).expanduser() if directory else default_bounce_dir()
    out_dir.mkdir(parents=True, exist_ok=True)
    project = next((w for w in status().get("windows", []) if w), "Logic")
    # Timestamp avoids Logic's "replace existing file?" prompt.
    stem = (name or f"{project.split(' - ')[0]}").replace("/", "-") + time.strftime(" %Y-%m-%d %H%M%S")

    activate()
    notes = []
    if start_bar is not None:
        notes.append(set_locators(start_bar, end_bar))

    started = time.time()
    menu_click(["File", "Bounce", "Project or Section"], opens_dialog=True)
    time.sleep(1.5)
    press("return")  # Bounce options dialog: default button (OK / Bounce)
    time.sleep(1.5)
    drive_file_panel(out_dir, stem)

    files = _wait_for_file(out_dir, stem, started, timeout)
    result = {"files": [str(f) for f in files], "seconds": round(time.time() - started, 1), "notes": notes}
    if also_m4a and shutil.which("afconvert"):
        for f in files:
            if f.suffix.lower() in (".wav", ".aif", ".aiff", ".caf"):
                m4a = f.with_suffix(".m4a")
                subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "256000", str(f), str(m4a)], check=True)
                result["files"].append(str(m4a))
    return result


def import_file(path: str) -> str:
    """File > Import > MIDI File / Audio File, at the playhead on the selected track."""
    p = Path(path).expanduser().resolve()
    if not p.is_file():
        raise osa.AutomationError(f"No such file: {p}")
    kind = "MIDI File" if p.suffix.lower() in (".mid", ".midi") else "Audio File"
    menu_click(["File", "Import", kind], opens_dialog=True)
    time.sleep(1.2)
    drive_file_panel(p.parent, None, confirm=False)
    # In an open panel, typing the name selects the file; Return opens it.
    type_text(p.name)
    time.sleep(0.4)
    press("return")
    time.sleep(1.0)
    return f"Imported {p.name} ({kind})"


# ---------------------------------------------------------------- screenshots

def screenshot(max_px: int = 1568) -> Path:
    shots = HOME / "screenshots"
    shots.mkdir(parents=True, exist_ok=True)
    for old in sorted(shots.glob("*.png"))[:-20]:
        old.unlink()
    path = shots / time.strftime("%Y%m%d-%H%M%S.png")
    subprocess.run(["screencapture", "-x", "-t", "png", str(path)], check=True)
    if not path.exists() or path.stat().st_size == 0:
        raise osa.AutomationError("screencapture produced no image: grant Screen Recording permission.")
    subprocess.run(["sips", "-Z", str(max_px), str(path)], check=True, capture_output=True)
    return path
