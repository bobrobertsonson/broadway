# Logic Bridge

Control Logic Pro on your Mac by chatting with Claude from your phone: "add a Rhodes track and
play a ii–V–I at bar 17", "mute the drums", "bounce bars 33–41 as 'Chorus v2'".

```
 Phone (Claude app) ──Remote Control──▶ Claude Code on your Mac ──MCP──▶ logic-bridge ──UI scripting──▶ Logic Pro
                                                                                  └──▶ iCloud Drive/Logic Bounces ──▶ Files app on phone
```

**Logic Pro has no scripting API.** Everything here drives the real UI: menu clicks, key
commands and the Accessibility tree. That means Logic must be open on a Mac that is awake and
unlocked, you shouldn't use the Mac while it works, and a Logic update can rename a menu and break a
tool. Claude takes screenshots to check its own work and falls back to the generic menu/UI tools
when a specific tool fails.

## What it can do

| Tool | What it does |
| --- | --- |
| `screenshot`, `logic_status` | See the screen; which project is open |
| `open_project` | Open a `.logicx` file |
| `key_command`, `press_keys`, `type_text` | Transport, save, undo, new tracks, mute/solo, anything with a key |
| `menu_list`, `menu_click` | Any menu item, found by name |
| `ui_tree`, `ui_action` | Read and operate any control Logic exposes to VoiceOver (faders, pans, buttons, fields) |
| `go_to_bar`, `set_cycle_range`, `set_cycle` | Move the playhead; set locators for a section |
| `create_midi_clip`, `import_file` | Write MIDI parts and import them; import audio |
| `bounce`, `list_bounces` | Bounce the project or a bar range, plus an `.m4a` copy for the phone |

## Setup (once, on the Mac)

1. **Install Claude Code** on the Mac and sign in: <https://code.claude.com/docs>. Check with `claude --version`.
2. **Get this folder onto the Mac** (clone the repo) and run:
   ```bash
   cd logic-bridge && ./setup.sh
   ```
   Needs Python 3.10+ (macOS's built-in one is 3.9); the script tells you how to get it if missing.
3. **Permissions** — run `./check.sh`: it triggers each macOS prompt and reports what's missing.
   Grant these in System Settings › Privacy & Security, for the terminal app you'll run it from
   (Terminal, iTerm…):
   - **Accessibility**: on (menu clicks, keys, faders)
   - **Screen & System Audio Recording**: on (screenshots)
   - **Automation**: allow it to control *System Events* and *Logic Pro* when macOS asks.
4. **Two key commands.** In Logic › Key Commands › Edit Assignments, assign:
   - *Set Left Locator by Playhead Position* → `⌃⌥⌘1`
   - *Set Right Locator by Playhead Position* → `⌃⌥⌘2`

   (Different keys? Copy the entry into `~/LogicBridge/keymap.json` with your keys. The same file
   overrides any default in `logic_bridge/keymap.json` if you use a non-default key command set.)
5. **Bounce defaults.** Bounce once by hand (⌘B) and pick the format you want (e.g. WAV 24-bit,
   **Offline** mode, normalize off). Logic remembers these; the `bounce` tool reuses them.
6. **iCloud Drive** on (for bounces to reach your phone). Otherwise they go to `~/Music/Logic Bounces`.
   Set `LOGIC_BOUNCE_DIR` to override.
7. **Keep the Mac awake and unlocked** while you work remotely. `start.sh` runs `caffeinate`, but a
   locked screen blocks UI scripting.

## Use it

On the Mac, open your project in Logic, then:

```bash
cd logic-bridge && ./start.sh      # = caffeinate + claude remote-control
```

Open the Claude app on your phone → Code → pick the session running on your Mac, and type what you want.
The first run asks you to approve the `logic` MCP server; `.claude/settings.json` then pre-approves its tools.

Try, in order, to shake out your setup:
1. "Take a screenshot and tell me what project is open."
2. "Go to bar 9 and start playback", then "stop".
3. "Set the cycle to bars 1–5 and bounce it as 'test'." Then open Files › iCloud Drive › Logic Bounces on your phone.

## Status: unverified on a real Mac

This was written and unit-tested (MIDI writer, key parsing, tool registration) on Linux. The macOS
parts are built on standard System Events / Accessibility behaviour but have **not been run against
Logic yet**. The likeliest things to need adjustment on first run:

- The bounce flow (`logic.py: bounce`) assumes: *File › Bounce › Project or Section…* opens an options
  dialog whose default button is confirmed with Return, then a standard save panel.
- `go_to_bar` assumes *Go to Position…* is on `/` and accepts `bar beat div tick` typed with spaces.
- `set_cycle` finds the control bar's Cycle button in the Accessibility tree; if not found it
  toggles blindly and says so.
- Track mute/solo default keys (`ctrl+m` / `ctrl+s`) vary by Logic version and key set.

If one fails, ask Claude on the Mac to debug it with `screenshot`, `menu_list` and `ui_tree`, and fix
`keymap.json` or `logic.py`.

## Run the tests

```bash
./.venv/bin/pip install pytest && ./.venv/bin/python -m pytest -q
```
